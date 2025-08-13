import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import Order from '@/models/Order'
import { requireRole } from '@/lib/auth-middleware'
import { USER_ROLES } from '@/constants'
import { MercadoPagoConfig, Preference } from 'mercadopago'

// Configure MercadoPago
const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!
})

// POST /api/payments/retry - Retry failed payment
export async function POST(request: NextRequest) {
  try {
    const { user } = await requireRole(request, [USER_ROLES.ADMIN])
    await connectToDatabase()

    const { orderId } = await request.json()

    if (!orderId) {
      return NextResponse.json(
        { error: 'ID del pedido es requerido' },
        { status: 400 }
      )
    }

    // Get order
    const order = await Order.findById(orderId)
      .populate('items.productId', 'name images salePrice')
      .lean()

    if (!order) {
      return NextResponse.json(
        { error: 'Pedido no encontrado' },
        { status: 404 }
      )
    }

    // Verify user owns this order
    if ((order as any).userId.toString() !== user.id && user.role !== USER_ROLES.ADMIN) {
      return NextResponse.json(
        { error: 'No tienes permisos para este pedido' },
        { status: 403 }
      )
    }

    // Check if order can be retried
    if ((order as any).status === 'completed' || (order as any).status === 'cancelled') {
      return NextResponse.json(
        { error: 'Este pedido no puede ser reintentado' },
        { status: 400 }
      )
    }

    // Create preference items
    const preferenceItems = (order as any).items.map((item: any) => ({
      title: item.productId.name,
      unit_price: item.price,
      quantity: item.quantity,
      currency_id: 'ARS',
      picture_url: item.productId.images?.[0] || ''
    }))

    // Create preference
    const preference = {
      items: preferenceItems,
      payer: {
        name: user.name,
        email: user.email
      },
      back_urls: {
        success: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/success`,
        failure: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/failure`,
        pending: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/pending`
      },
      auto_return: 'approved',
      external_reference: orderId,
      notification_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/payments/webhook`,
      statement_descriptor: 'SALTA CONECTA',
      expires: true,
      expiration_date_to: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
    }

    const preferenceClient = new Preference(client)
    const response = await preferenceClient.create({ body: preference })

    // Update order status
    await Order.findByIdAndUpdate(orderId, {
      status: 'pending',
      updatedAt: new Date()
    })

    return NextResponse.json({
      preferenceId: response.id,
      initPoint: response.init_point,
      sandboxInitPoint: response.sandbox_init_point,
      message: 'Pago reintentado exitosamente'
    })

  } catch (error) {
    console.error('Retry payment error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
