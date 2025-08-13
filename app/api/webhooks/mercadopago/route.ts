import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import Order from '@/models/Order'
import User from '@/models/User'
import Product from '@/models/Product'
import { sendPaymentApprovedEmail } from '@/lib/email'
import { PAYMENT_STATUS, ORDER_STATUS } from '@/constants'

// Utilidad para obtener el token de MP desde múltiples nombres posibles
function getMpToken() {
  return (
    process.env.MERCADOPAGO_ACCESS_TOKEN ||
    process.env.MP_ACCESS_TOKEN ||
    process.env.MP_TOKEN ||
    process.env.ACCESS_TOKEN ||
    ''
  )
}

async function mpGetJson(url: string) {
  const token = getMpToken()
  if (!token) throw new Error('Mercado Pago access token not configured')
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    // timeouts no soportados nativos; confiar en infra
    cache: 'no-store',
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`MP request failed ${res.status}: ${text}`)
  }
  return res.json()
}

async function processPaymentById(paymentId: string) {
  // API REST v1: https://api.mercadopago.com/v1/payments/{id}
  const payment = await mpGetJson(`https://api.mercadopago.com/v1/payments/${paymentId}`)
  console.log('🔎 Processing payment by id:', paymentId, 'status:', payment?.status)

  // Buscar la orden (por paymentId directo o por preference/mercadoPagoId si el ID es de preferencia)
  const order = await Order.findOne({
    $or: [
      { 'paymentDetails.mercadoPagoId': payment.id.toString() },
      { mercadoPagoId: payment.id.toString() },
      { paymentId: payment.id.toString() },
    ]
  })

  if (!order) {
    console.warn(`⚠️ Order not found for payment ID: ${payment.id}`)
    return { ignored: true, reason: 'order_not_found', paymentId: payment.id?.toString?.() }
  }

  const updateData: any = { updatedAt: new Date() }

  switch (payment.status) {
    case 'approved':
      updateData.paymentStatus = PAYMENT_STATUS.APPROVED
      updateData.status = ORDER_STATUS.CONFIRMED
      updateData.paymentDetails = {
        mercadoPagoId: payment.id.toString(),
        status: payment.status,
        statusDetail: payment.status_detail,
        paymentMethod: payment.payment_method_id,
        transactionAmount: payment.transaction_amount,
        netReceivedAmount: payment.net_received_amount,
        paidAt: new Date(),
      }
      break
    case 'pending':
    case 'in_process':
      updateData.paymentStatus = PAYMENT_STATUS.PENDING
      updateData.paymentDetails = {
        mercadoPagoId: payment.id.toString(),
        status: payment.status,
        statusDetail: payment.status_detail,
        paymentMethod: payment.payment_method_id,
        transactionAmount: payment.transaction_amount,
      }
      break
    case 'rejected':
      updateData.paymentStatus = PAYMENT_STATUS.REJECTED
      updateData.status = ORDER_STATUS.CANCELLED
      updateData.paymentDetails = {
        mercadoPagoId: payment.id.toString(),
        status: payment.status,
        statusDetail: payment.status_detail,
        paymentMethod: payment.payment_method_id,
        transactionAmount: payment.transaction_amount,
        failureReason: payment.status_detail,
      }
      break
    case 'cancelled':
      updateData.paymentStatus = PAYMENT_STATUS.CANCELLED
      updateData.status = ORDER_STATUS.CANCELLED
      updateData.paymentDetails = {
        mercadoPagoId: payment.id.toString(),
        status: payment.status,
        statusDetail: payment.status_detail,
        paymentMethod: payment.payment_method_id,
        transactionAmount: payment.transaction_amount,
      }
      break
    case 'refunded':
      updateData.paymentStatus = PAYMENT_STATUS.REFUNDED
      updateData.status = ORDER_STATUS.REFUNDED
      updateData.paymentDetails = {
        mercadoPagoId: payment.id.toString(),
        status: payment.status,
        statusDetail: payment.status_detail,
        paymentMethod: payment.payment_method_id,
        transactionAmount: payment.transaction_amount,
        refundedAt: new Date(),
      }
      break
    default:
      console.warn(`⚠️ Unknown payment status: ${payment.status} for payment ${payment.id}`)
      return { ignored: true, reason: 'unknown_status', paymentStatus: payment.status, paymentId: payment.id?.toString?.() }
  }

  await Order.findByIdAndUpdate(order._id, updateData)
  if (payment.status === 'approved') {
    await deductStockIfNeeded(order._id.toString())
  }
  return { orderId: order._id, orderNumber: order.orderNumber, paymentStatus: payment.status }
}

// Procesar merchant_order por ID: determina estado a partir de sus pagos relacionados
async function processMerchantOrderById(merchantOrderId: string) {
  // API REST: https://api.mercadopago.com/merchant_orders/{id}
  const merchantOrder = await mpGetJson(`https://api.mercadopago.com/merchant_orders/${merchantOrderId}`)
  if (!merchantOrder) {
    throw new Error(`Merchant order not found: ${merchantOrderId}`)
  }

  // Correlación por external_reference -> orderId
  const externalRef = merchantOrder.external_reference?.toString?.()
  let order = null
  if (externalRef) {
    order = await Order.findById(externalRef)
  }
  if (!order) {
    // Intentar por preference ID en pagos
    const prefId = merchantOrder?.preference_id?.toString?.()
    order = await Order.findOne({ $or: [ { mercadoPagoId: prefId }, { 'paymentDetails.mercadoPagoId': prefId } ] })
  }
  if (!order) {
    console.warn(`⚠️ Order not found for merchant_order ${merchantOrderId}`)
    return { ignored: true, reason: 'order_not_found', merchantOrderId }
  }

  // Determinar mejor estado según pagos adjuntos
  const payments: any[] = merchantOrder.payments || []
  const hasApproved = payments.some(p => p.status === 'approved')
  const hasPending = payments.some(p => p.status === 'pending' || p.status === 'in_process')
  const hasRefunded = payments.some(p => p.status === 'refunded')
  const hasCancelled = payments.some(p => p.status === 'cancelled')

  const updateData: any = { updatedAt: new Date(), paymentDetails: { merchantOrderId: merchantOrderId } }
  if (hasApproved) {
    updateData.paymentStatus = PAYMENT_STATUS.APPROVED
    updateData.status = ORDER_STATUS.CONFIRMED
  } else if (hasPending) {
    updateData.paymentStatus = PAYMENT_STATUS.PENDING
  } else if (hasRefunded) {
    updateData.paymentStatus = PAYMENT_STATUS.REFUNDED
    updateData.status = ORDER_STATUS.REFUNDED
  } else if (hasCancelled) {
    updateData.paymentStatus = PAYMENT_STATUS.CANCELLED
    updateData.status = ORDER_STATUS.CANCELLED
  } else {
    // Fallback conservador
    updateData.paymentStatus = PAYMENT_STATUS.PENDING
  }

  await Order.findByIdAndUpdate(order._id, updateData)
  if (updateData.paymentStatus === PAYMENT_STATUS.APPROVED) {
    await deductStockIfNeeded(order._id.toString())
  }

  // Best-effort notification: if approved, email customer
  try {
    if (updateData.paymentStatus === PAYMENT_STATUS.APPROVED) {
      const customerDoc = await User.findById(order.customer).lean()
      const customerEmail = (customerDoc as any)?.email as string | undefined
      if (customerEmail) {
        await sendPaymentApprovedEmail(customerEmail, order.orderNumber, (order.paymentDetails?.mercadoPagoId || order.mercadoPagoId))
      }
    }
  } catch (e) {
    console.warn('Could not send payment approved email:', e)
  }

  return { orderId: order._id, orderNumber: order.orderNumber, merchantOrderId }
}

// Idempotent stock deduction for approved orders
async function deductStockIfNeeded(orderId: string) {
  try {
    const freshOrder = await Order.findById(orderId).lean()
    if (!freshOrder) return
    if ((freshOrder as any).stockDeducted) return

    const items: any[] = (freshOrder as any).items || []
    for (const it of items) {
      if (!it?.product || !it?.quantity) continue
      // Atomic decrement only if enough stock remains
      const res = await Product.updateOne(
        { _id: it.product, stock: { $gte: it.quantity } },
        { $inc: { stock: -it.quantity, availableQuantity: -it.quantity } }
      )
      if (res.modifiedCount === 0) {
        console.warn('Stock deduction failed or insufficient stock', { productId: it.product?.toString?.(), quantity: it.quantity })
      }
    }

    await Order.updateOne(
      { _id: orderId, stockDeducted: { $ne: true } },
      { $set: { stockDeducted: true } }
    )
  } catch (e) {
    console.error('Stock deduction error:', e)
  }
}

function validateSecret(request: NextRequest) {
  const incoming = request.nextUrl.searchParams.get('secret') || ''
  const expected = process.env.NEXT_WEBHOOK_MERCADOPAGO_KEY_SECRET || ''
  return expected && incoming === expected
}

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase()
    if (!validateSecret(request)) {
      console.warn('🔒 Invalid webhook secret')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let paymentId: string | null = null
    let topic: string | null = null
    try {
      const contentType = request.headers.get('content-type') || ''
      if (contentType.includes('application/json')) {
        const body = await request.json()
        console.log('🔔 MERCADOPAGO WEBHOOK - Received JSON:', body)
        // Webhook (v1) suele traer { type, data: { id } } o { action, data: { id } }
        paymentId = body?.data?.id?.toString?.() || body?.id?.toString?.() || null
        topic = body?.type || body?.topic || null
      } else {
        // IPN o x-www-form-urlencoded
        const url = request.nextUrl
        console.log('🔔 MERCADOPAGO WEBHOOK - Received Query:', Object.fromEntries(url.searchParams))
        paymentId = url.searchParams.get('id') || url.searchParams.get('payment_id')
        topic = url.searchParams.get('topic') || url.searchParams.get('type')
      }
    } catch (err) {
      console.warn('⚠️ Unable to parse webhook body/query', err)
    }

    // Si viene topic no-payment, manejar en consecuencia
    if (topic && topic !== 'payment') {
      if (topic === 'merchant_order') {
        const id = paymentId || request.nextUrl.searchParams.get('merchant_order_id') || ''
        if (!id) return NextResponse.json({ error: 'No merchant_order id' }, { status: 400 })
        const result = await processMerchantOrderById(id)
        return NextResponse.json({ message: 'Merchant order processed', ...result })
      }
      // Otros tópicos (claims/chargebacks) pueden llegar sin soporte SDK completo; loggear y continuar.
      console.log('ℹ️ Ignored non-payment topic:', topic, 'id:', paymentId)
      return NextResponse.json({ message: 'Ignored non-payment topic', topic })
    }

    if (!paymentId) {
      return NextResponse.json({ error: 'No payment id' }, { status: 400 })
    }

    const result = await processPaymentById(paymentId)
    return NextResponse.json({ message: 'Webhook processed successfully', ...result })
  
  } catch (error) {
    console.error('❌ Webhook processing error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET endpoint para verificar que el webhook está funcionando
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase()
    if (!validateSecret(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const id = request.nextUrl.searchParams.get('id')
    const topic = request.nextUrl.searchParams.get('topic') || request.nextUrl.searchParams.get('type')
    if (topic && topic !== 'payment') {
      if (topic === 'merchant_order') {
        const moId = id || request.nextUrl.searchParams.get('merchant_order_id')
        if (!moId) return NextResponse.json({ error: 'No merchant_order id' }, { status: 400 })
        const result = await processMerchantOrderById(moId)
        return NextResponse.json({ message: 'Merchant order processed', ...result })
      }
      return NextResponse.json({ message: 'Ignored non-payment topic', topic })
    }
    if (!id) {
      return NextResponse.json({ message: 'Webhook OK' })
    }
    const result = await processPaymentById(id)
    return NextResponse.json({ message: 'IPN processed', ...result })
  } catch (error) {
    console.error('❌ GET webhook error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
