import { NextRequest } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import Order from '@/models/Order'
import { requireApprovedSupplier } from '@/lib/auth-middleware'
import { jsonOk, jsonError } from '@/lib/api-response'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await requireApprovedSupplier(request)
    await connectToDatabase()

    const { id } = await params
    if (!id) return jsonError('ID del pedido es requerido', 400)

    const { trackingNumber, carrier, url } = await request.json()
    if (!trackingNumber || !/^[A-Za-z0-9-_.]{4,40}$/.test(trackingNumber)) {
      return jsonError('Número de seguimiento inválido', 400)
    }

    const order = await Order.findOne({ _id: id, 'items.supplier': user.id })
    if (!order) return jsonError('Pedido no encontrado', 404)

    order.tracking = {
      trackingNumber,
      carrier: carrier || order.tracking?.carrier || '',
      url: url || order.tracking?.url || ''
    } as any

    // Opcional: mover a 'shipped' si aún no está enviado
    if (order.status === 'confirmed' || order.status === 'processing') {
      order.status = 'shipped'
    }

    await order.save()

    return jsonOk({ message: 'Seguimiento actualizado', trackingNumber })
  } catch (error) {
    console.error('Supplier tracking update error:', error)
    return jsonError('Error interno del servidor', 500)
  }
}



