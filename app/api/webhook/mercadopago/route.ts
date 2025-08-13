import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import Order from '@/models/Order'

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase()

    const data = await request.json()

    // Verificar que es una notificación de MercadoPago
    if (!data.data || !data.data.id) {
      return NextResponse.json(
        { error: 'Datos de notificación inválidos' },
        { status: 400 }
      )
    }

    // Obtener información del pago
    const mercadopago = require('mercadopago')
    mercadopago.configure({
      access_token: process.env.MERCADOPAGO_ACCESS_TOKEN
    })

    const payment = await mercadopago.payment.get(data.data.id)

    if (!payment.body) {
      return NextResponse.json(
        { error: 'Pago no encontrado' },
        { status: 404 }
      )
    }

    const paymentData = payment.body
    const orderId = paymentData.external_reference

    if (!orderId) {
      return NextResponse.json(
        { error: 'Referencia externa no encontrada' },
        { status: 400 }
      )
    }

    // Buscar la orden
    const order = await Order.findById(orderId)

    if (!order) {
      return NextResponse.json(
        { error: 'Orden no encontrada' },
        { status: 404 }
      )
    }

    // Actualizar estado de la orden según el pago
    let orderStatus = 'pending'
    let paymentStatus = 'pending'

    switch (paymentData.status) {
      case 'approved':
        orderStatus = 'confirmed'
        paymentStatus = 'approved'
        break
      case 'rejected':
        orderStatus = 'cancelled'
        paymentStatus = 'rejected'
        break
      case 'pending':
        orderStatus = 'pending'
        paymentStatus = 'pending'
        break
      case 'in_process':
        orderStatus = 'pending'
        paymentStatus = 'processing'
        break
      default:
        orderStatus = 'pending'
        paymentStatus = 'pending'
    }

    // Actualizar la orden
    await Order.findByIdAndUpdate(orderId, {
      status: orderStatus,
      paymentStatus: paymentStatus,
      paymentId: paymentData.id,
      paymentMethod: paymentData.payment_method?.type || 'unknown',
      updatedAt: new Date()
    })

    return NextResponse.json({
      message: 'Webhook procesado exitosamente',
      orderId,
      paymentStatus,
      orderStatus
    })

  } catch (error) {
    console.error('MercadoPago webhook error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// GET method to verify webhook endpoint is working
export async function GET() {
  return NextResponse.json({ 
    message: 'MercadoPago webhook endpoint is active',
    timestamp: new Date().toISOString()
  })
}
