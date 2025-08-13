import { NextRequest, NextResponse } from 'next/server'
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

    const order = await Order.findOne({ _id: id, 'items.supplier': user.id })
    if (!order) return jsonError('Pedido no encontrado', 404)

    if (order.status !== 'pending') {
      return jsonError('Solo se pueden confirmar pedidos en estado pendiente', 400)
    }

    order.status = 'confirmed'
    await order.save()

    return jsonOk({ message: 'Pedido confirmado exitosamente' })
  } catch (error) {
    console.error('Supplier confirm order error:', error)
    return jsonError('Error interno del servidor', 500)
  }
}



