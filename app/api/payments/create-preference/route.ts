import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import Order from '@/models/Order'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { MercadoPagoConfig, Preference } from 'mercadopago'

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase()
    
    const body = await request.json()
    console.log('💳 CREATE PREFERENCE - Received data:', body)

    const { orderId, items, total } = body

    if (!orderId || !items || !total) {
      return NextResponse.json(
        { error: 'orderId, items y total son requeridos' },
        { status: 400 }
      )
    }

    // Verificar que la orden existe
    const order = await Order.findById(orderId)
    if (!order) {
      return NextResponse.json(
        { error: 'Orden no encontrada' },
        { status: 404 }
      )
    }

    // Verificar permisos
    try {
      const session = await getServerSession(authOptions)
      if (session?.user) {
        const isOwner = (order as any).customer?.toString() === session.user.id
        if (!isOwner) {
          return NextResponse.json(
            { error: 'No tienes permisos para esta orden' },
            { status: 403 }
          )
        }
      }
    } catch (error) {
      console.log('No session found, allowing guest order')
    }

    // Instanciar cliente de MercadoPago (SDK v2)
    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN
    if (!accessToken) {
      console.error('MERCADOPAGO_ACCESS_TOKEN no está configurado')
      return NextResponse.json(
        { error: 'Configuración de pago no disponible' },
        { status: 500 }
      )
    }
    const mpClient = new MercadoPagoConfig({ accessToken })

    // Crear items para MercadoPago
    const preferenceItems = items.map((item: any) => ({
      title: item.name,
      unit_price: Number(item.price),
      quantity: Number(item.quantity),
      currency_id: 'ARS'
    }))

    // Crear preferencia de pago
    const envBase = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL
    // Fallback a origin derivado del request si no hay env configurado
    const derivedOrigin = (() => {
      try {
        const url = new URL(request.url)
        return `${url.protocol}//${url.host}`
      } catch {
        return undefined
      }
    })()
    const baseUrl = envBase || derivedOrigin
    if (!baseUrl) {
      console.error('No se pudo determinar baseUrl para back_urls/notification_url')
      return NextResponse.json(
        { error: 'No se pudo configurar URLs de retorno para el pago' },
        { status: 500 }
      )
    }
    const webhookSecret = process.env.NEXT_WEBHOOK_MERCADOPAGO_KEY_SECRET

    const preferenceBody = {
      items: preferenceItems,
      external_reference: orderId,
      back_urls: {
        success: `${baseUrl}/orders/${orderId}/success`,
        failure: `${baseUrl}/orders/${orderId}/failure`,
        pending: `${baseUrl}/orders/${orderId}/pending`
      },
      auto_return: 'approved' as const,
      notification_url: `${baseUrl}/api/webhooks/mercadopago${webhookSecret ? `?secret=${webhookSecret}` : ''}`,
      statement_descriptor: 'SALTA CONECTA',
      expires: true,
      expiration_date_to: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutos
      payment_methods: {
        excluded_payment_types: [
          { id: 'ticket' } // Excluir pagos en efectivo por ahora
        ],
        installments: 12
      }
    }

    console.log('💳 Creating preference with data:', {
      ...preferenceBody,
      items: `[${preferenceItems.length} items]`,
    })

    // SDK v2: usar clase Preference con el cliente configurado
    const preference = new Preference(mpClient)
    const prefResponse: any = await preference.create({ body: preferenceBody as any })

    // Manejo robusto de respuesta (algunas versiones exponen propiedades al nivel raíz)
    const prefId = prefResponse?.id || prefResponse?.body?.id
    const initPoint = prefResponse?.init_point || prefResponse?.body?.init_point
    const sandboxInitPoint = prefResponse?.sandbox_init_point || prefResponse?.body?.sandbox_init_point

    if (!prefId || !initPoint) {
      console.error('❌ Error creating preference (missing fields):', prefResponse)
      return NextResponse.json(
        { error: 'Error al crear preferencia de pago' },
        { status: 500 }
      )
    }

    console.log('✅ Preference created successfully:', prefId)

    // Actualizar la orden con el ID de la preferencia
    await Order.findByIdAndUpdate(orderId, {
      mercadoPagoId: prefId,
      updatedAt: new Date()
    })

    return NextResponse.json({
      initPoint,
      preferenceId: prefId,
      sandboxInitPoint
    })

  } catch (error) {
    console.error('❌ Create preference error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
