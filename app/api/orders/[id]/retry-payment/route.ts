import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import Order from '@/models/Order'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// POST /api/orders/[id]/retry-payment - Crea nueva preferencia de pago para reintentar un pago fallido o pendiente
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase()

    const { id: orderId } = await params

    // Buscar la orden
    const order = await Order.findById(orderId)
      .populate('items.product', 'name price images')
      .lean()

    if (!order) {
      return NextResponse.json(
        { error: 'Orden no encontrada' },
        { status: 404 }
      )
    }

    // Verificar permisos: el dueño de la orden o admin pueden reintentar
    try {
      const session = await getServerSession(authOptions)
      if (session?.user) {
        const isOwner = (order as any).customer?.toString?.() === session.user.id
        const isAdmin = session.user.role === 'admin'
        if (!isOwner && !isAdmin) {
          return NextResponse.json(
            { error: 'No tienes permisos para esta orden' },
            { status: 403 }
          )
        }
      }
    } catch (e) {
      // Si no hay sesión, tratamos como invitado (si el proyecto soporta guest checkouts)
      // En ese caso, no tenemos un mecanismo para validar propiedad; por seguridad, bloquear.
      return NextResponse.json(
        { error: 'Debes iniciar sesión para reintentar el pago' },
        { status: 401 }
      )
    }

    // Validaciones de estado: permitir reintento si está rejected, cancelled, pending o in_process
    const allowedStatuses = ['rejected', 'cancelled', 'pending', 'in_process']
    const paymentStatus = (order as any).paymentStatus || 'pending'
    if (!allowedStatuses.includes(String(paymentStatus))) {
      return NextResponse.json(
        { error: 'La orden no permite reintento de pago en su estado actual' },
        { status: 400 }
      )
    }

    // Armar items desde la orden para evitar manipulación desde el cliente
    const orderItems = (order as any).items || []
    if (!orderItems.length) {
      return NextResponse.json(
        { error: 'La orden no tiene ítems válidos' },
        { status: 400 }
      )
    }

    const preferenceItems = orderItems.map((item: any) => ({
      title: item.name || item.product?.name || 'Producto',
      unit_price: Number(item.price),
      quantity: Number(item.quantity),
      currency_id: 'ARS'
    }))

    const total = Number((order as any).total) || preferenceItems.reduce((acc: number, it: any) => acc + it.unit_price * it.quantity, 0)

    // Configurar Mercado Pago SDK
    const mercadopago = require('mercadopago')
    mercadopago.configure({ access_token: process.env.MERCADOPAGO_ACCESS_TOKEN! })

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL
    const webhookSecret = process.env.NEXT_WEBHOOK_MERCADOPAGO_KEY_SECRET

    const preference = {
      items: preferenceItems,
      external_reference: String(orderId),
      back_urls: {
        success: `${baseUrl}/orders/${orderId}/success`,
        failure: `${baseUrl}/orders/${orderId}/failure`,
        pending: `${baseUrl}/orders/${orderId}/pending`
      },
      auto_return: 'approved',
      notification_url: `${baseUrl}/api/webhooks/mercadopago${webhookSecret ? `?secret=${webhookSecret}` : ''}`,
      statement_descriptor: 'SALTA CONECTA',
      expires: true,
      expiration_date_to: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      payment_methods: {
        excluded_payment_types: [{ id: 'ticket' }],
        installments: 12
      }
    }

    const response = await mercadopago.preferences.create(preference)

    if (!response?.body?.init_point) {
      console.error('❌ Error creating retry preference:', response)
      return NextResponse.json(
        { error: 'Error al crear preferencia de pago' },
        { status: 500 }
      )
    }

    // Actualizar la orden con nueva referencia de preferencia
    await Order.findByIdAndUpdate(orderId, {
      mercadoPagoId: response.body.id,
      paymentStatus: 'pending',
      updatedAt: new Date()
    })

    return NextResponse.json({
      initPoint: response.body.init_point,
      preferenceId: response.body.id,
      sandboxInitPoint: response.body.sandbox_init_point,
      total
    })

  } catch (error) {
    console.error('❌ Retry payment error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
