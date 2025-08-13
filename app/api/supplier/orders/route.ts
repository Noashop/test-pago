import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import Order from '@/models/Order'
import Product from '@/models/Product'
import { requireApprovedSupplier } from '@/lib/auth-middleware'
import { jsonOk, jsonError } from '@/lib/api-response'
import User from '@/models/User'
import { sendShippingUpdateEmail } from '@/lib/email'

// GET /api/supplier/orders - Get supplier's orders
export async function GET(request: NextRequest) {
  try {
    const { user } = await requireApprovedSupplier(request)
    await connectToDatabase()

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')
    const paymentStatus = searchParams.get('paymentStatus')
    const search = searchParams.get('search')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    const skip = (page - 1) * limit

    // Build base query for supplier's orders.
    // Some historical orders may not have items.supplier set, so also include
    // orders whose items' products belong to this supplier (Product.supplierId).
    const supplierProductIds = await Product.find({ supplierId: user.id }).distinct('_id')

    // Base supplier filter: either items.supplier matches OR items.product is one of supplier's products
    const baseSupplierFilter: any[] = [{ 'items.supplier': user.id }]
    if (supplierProductIds && supplierProductIds.length > 0) {
      baseSupplierFilter.push({ 'items.product': { $in: supplierProductIds } })
    }

    // Compose conditions to avoid overwriting supplier filter
    const conditions: any[] = [ { $or: baseSupplierFilter } ]

    if (status) {
      if (status === 'pending') {
        // Interpretar 'pending' como "pendiente de envío": incluye pending, confirmed, processing
        conditions.push({ status: { $in: ['pending', 'confirmed', 'processing'] } })
      } else {
        conditions.push({ status })
      }
    }
    // Manejo de paymentStatus: por defecto, mostrar solo 'approved' y 'paid'
    const allowedPaymentStatuses = ['approved', 'pending', 'rejected', 'refunded', 'cancelled', 'paid', 'failed']

    if (paymentStatus === 'all') {
      // Mostrar todos los estados de pago (no agregamos condición)
    } else if (paymentStatus && allowedPaymentStatuses.includes(paymentStatus)) {
      // Si se especifica un estado de pago válido, usarlo (en paymentStatus o en paymentDetails.status)
      conditions.push({
        $or: [
          { paymentStatus },
          { 'paymentDetails.status': paymentStatus }
        ]
      })
    } else {
      // Por defecto, mostrar solo pedidos con pago aprobado o pagado
      conditions.push({
        $or: [
          { paymentStatus: { $in: ['approved', 'paid'] } },
          { 'paymentDetails.status': { $in: ['approved', 'paid'] } }
        ]
      })
    }

    // Búsqueda por número de orden o por datos del cliente
    // Nota: para buscar por cliente, usamos $or con expresiones sobre campos poblados
    let textSearch: any = null
    if (search && search.trim()) {
      const term = search.trim()
      // Buscar por orderNumber directo y por customer name/email (vía regex en campos plain al hacer lean populate)
      textSearch = {
        $or: [
          { orderNumber: { $regex: term, $options: 'i' } },
          { 'customerName': { $regex: term, $options: 'i' } },
          { 'customerEmail': { $regex: term, $options: 'i' } }
        ]
      }
    }

    const sort: any = {}
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1

    // Integrar búsqueda textual si aplica
    const finalConditions = [...conditions]
    if (textSearch) finalConditions.push(textSearch)
    const finalFilter = finalConditions.length > 1 ? { $and: finalConditions } : finalConditions[0]

    const [orders, total] = await Promise.all([
      Order.find(finalFilter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('customer', 'name email')
        .populate('items.product', 'name images salePrice')
        .lean(),
      Order.countDocuments(finalFilter)
    ])

    const totalPages = Math.ceil(total / limit)

    // Transform to include top-level trackingNumber for UI compatibility
    const transformed = orders.map((o: any) => ({
      ...o,
      trackingNumber: o?.tracking?.trackingNumber,
      customerName: (o.customer as any)?.name || o.customerName,
      customerEmail: (o.customer as any)?.email || o.customerEmail,
    }))

    return jsonOk({
      orders: transformed,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    })

  } catch (error) {
    console.error('Get supplier orders error:', error)
    return jsonError('Error interno del servidor', 500)
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { user } = await requireApprovedSupplier(request)
    await connectToDatabase()

    const { orderId, status, notes } = await request.json()

    if (!orderId || !status) {
      return jsonError('ID del pedido y estado son requeridos', 400)
    }

    // Buscar el pedido y verificar que pertenece al proveedor
    const order = await Order.findOne({
      _id: orderId,
      'items.supplier': user.id
    })

    if (!order) {
      return jsonError('Pedido no encontrado', 404)
    }

    // Actualizar el pedido
    const updateData: any = { status }
    
    if (notes) {
      updateData.supplierNotes = notes
    }

    // Si el proveedor marca por primera vez como 'confirmed', descontar stock de sus productos
    if (status === 'confirmed' && order.status !== 'confirmed' && !order.stockDeducted) {
      const items = (order.items || []).filter((it: any) => String(it.supplier) === String(user.id))
      for (const it of items) {
        await Product.updateOne(
          { _id: it.product },
          { $inc: { stock: -Math.abs(it.quantity || 0) } }
        )
      }
      updateData.stockDeducted = true
    }

    await Order.findByIdAndUpdate(orderId, updateData)

    // Best-effort: email customer when shipped
    try {
      if (status === 'shipped') {
        const [freshOrderDoc, customerDoc] = await Promise.all([
          Order.findById(orderId).lean(),
          User.findById(order.customer).lean(),
        ])
        const to = (customerDoc as any)?.email as string | undefined
        const orderNumber = (freshOrderDoc as any)?.orderNumber || order.orderNumber
        const tracking = (freshOrderDoc as any)?.tracking?.trackingNumber as string | undefined
        if (to && orderNumber) {
          await sendShippingUpdateEmail(to, orderNumber, tracking)
        }
      }
    } catch (e) {
      console.warn('Could not send shipping email:', e)
    }

    return jsonOk({
      message: 'Pedido actualizado exitosamente',
      order: {
        id: order._id,
        orderNumber: order.orderNumber,
        status,
      },
    })

  } catch (error) {
    console.error('Update supplier order error:', error)
    return jsonError('Error interno del servidor', 500)
  }
} 