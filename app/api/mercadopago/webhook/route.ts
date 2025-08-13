import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import Order from '@/models/Order'
import Payout from '@/models/Payout'
import PaymentLog from '@/models/PaymentLog'

async function handleNotification(paymentId: string) {
  const token = process.env.MP_ACCESS_TOKEN
  if (!token) throw new Error('Falta MP_ACCESS_TOKEN')

  const resp = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  if (!resp.ok) throw new Error(`MP fetch error: ${resp.status}`)
  const payment = await resp.json()

  // Encontrar la orden por mercadoPagoId o external_reference
  let order = await Order.findOne({ mercadoPagoId: String(payment.id) })
  if (!order && payment.external_reference) {
    order = await Order.findOne({ orderNumber: payment.external_reference })
  }
  if (!order) return { ok: true, reason: 'order_not_found' }

  const statusMap: Record<string, string> = {
    approved: 'approved',
    pending: 'pending',
    in_process: 'pending',
    rejected: 'rejected',
    cancelled: 'cancelled',
    refunded: 'refunded',
    in_mediation: 'pending'
  }

  const mapped = statusMap[payment.status] || 'pending'
  const prev = order.paymentStatus

  order.paymentStatus = mapped as any
  order.mercadoPagoId = String(payment.id)
  order.paymentDetails = {
    ...order.paymentDetails,
    mercadoPagoId: String(payment.id),
    status: payment.status,
    statusDetail: payment.status_detail,
    paymentMethod: payment.payment_method_id,
    transactionAmount: payment.transaction_amount,
    netReceivedAmount: payment.transaction_details?.net_received_amount,
    paidAt: payment.date_approved ? new Date(payment.date_approved) : order.paymentDetails?.paidAt
  } as any

  // Si aprobado por primera vez, generar payouts
  if (mapped === 'approved' && prev !== 'approved' && !(order as any).payoutsPrepared) {
    const perSupplier: Record<string, { amount: number, orders: { order: any, amount: number }[] }> = {}
    for (const it of (order as any).items || []) {
      const supplierId = String(it.supplier)
      const lineCost = Number(it.costPrice || 0) * Number(it.quantity)
      const supplierAmount = Math.max(0, lineCost)
      if (!perSupplier[supplierId]) perSupplier[supplierId] = { amount: 0, orders: [] }
      perSupplier[supplierId].amount += supplierAmount
      perSupplier[supplierId].orders.push({ order: order._id, amount: supplierAmount })
    }
    for (const [supplier, data] of Object.entries(perSupplier)) {
      await Payout.create({ supplier, currency: 'ARS', amount: data.amount, status: 'pending', orders: data.orders })
    }
    ;(order as any).payoutsPrepared = true
  }

  await order.save()
  try {
    await PaymentLog.create({
      type: 'webhook',
      referenceId: String(payment.id),
      order: order._id,
      request: { paymentId },
      response: { status: order.paymentStatus, payoutsPrepared: (order as any).payoutsPrepared },
      success: true
    })
  } catch (e) {
    // no bloquear respuesta por fallo de log
    console.warn('PaymentLog webhook save warn:', e)
  }
  return { ok: true }
}

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase()
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || searchParams.get('topic')
    const id = searchParams.get('data.id') || searchParams.get('id')

    if (type === 'payment' && id) {
      const result = await handleNotification(id)
      return NextResponse.json(result)
    }
    return NextResponse.json({ ok: true, ignored: true })
  } catch (e) {
    console.error('MP webhook GET error:', e)
    try {
      await PaymentLog.create({ type: 'webhook', success: false, error: String(e) })
    } catch {}
    return NextResponse.json({ error: 'Error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase()
    const body = await request.json().catch(() => ({}))

    const type = body?.type || body?.topic || body?.action
    const id = body?.data?.id || body?.resource?.split('/').pop() || body?.id

    if (type === 'payment' && id) {
      const result = await handleNotification(String(id))
      return NextResponse.json(result)
    }
    return NextResponse.json({ ok: true, ignored: true })
  } catch (e) {
    console.error('MP webhook POST error:', e)
    try {
      await PaymentLog.create({ type: 'webhook', success: false, request: await request.json().catch(() => ({})), error: String(e) })
    } catch {}
    return NextResponse.json({ error: 'Error' }, { status: 500 })
  }
}
