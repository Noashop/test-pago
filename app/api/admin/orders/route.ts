import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import Order from '@/models/Order'
import { requireRoleOrPermission, requireRole } from '@/lib/auth-middleware'
import { USER_ROLES, PAGINATION } from '@/constants'

export async function GET(request: NextRequest) {
  try {
    const { user } = await requireRoleOrPermission(request, [USER_ROLES.ADMIN], ['orders'])
    await connectToDatabase()

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const paymentStatus = searchParams.get('paymentStatus')
    const search = searchParams.get('search')
    const limitParam = parseInt(searchParams.get('limit') || '50')
    const limit = Math.min(Math.max(1, limitParam), PAGINATION.MAX_LIMIT)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))

    // Construir query
    const query: any = {}
    
    if (status && status !== 'all') {
      query.status = status
    }
    
    if (paymentStatus && paymentStatus !== 'all') {
      query.paymentStatus = paymentStatus
    }
    
    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { 'shippingAddress.name': { $regex: search, $options: 'i' } },
        { 'shippingAddress.phone': { $regex: search, $options: 'i' } }
      ]
    }

    // Obtener pedidos con paginación y populate
    const skip = (page - 1) * limit
    
    const orders = await Order.find(query)
      .populate('customer', 'name email')
      .populate('items.product', 'name images')
      .populate('items.supplier', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()

    // Transformar los datos para el frontend
    const transformedOrders = orders.map((order: any) => ({
      _id: order._id,
      orderNumber: order.orderNumber,
      customer: {
        name: order.customer?.name || 'Cliente no registrado',
        email: order.customer?.email || 'N/A'
      },
      items: order.items.map((item: any) => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        supplier: item.supplier?.name || 'Proveedor no encontrado'
      })),
      total: order.total,
      status: order.status,
      paymentStatus: order.paymentStatus,
      shippingMethod: order.shippingMethod || 'Envío estándar',
      paymentMethod: order.paymentMethod,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt
    }))

    // Obtener total de pedidos para paginación
    const total = await Order.countDocuments(query)

    return NextResponse.json({
      orders: transformedOrders,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Get admin orders error:', error)
    
    // Manejar errores específicos
    if (error instanceof Error) {
      if (error.message === 'Authentication required') {
        return NextResponse.json(
          { error: 'Autenticación requerida' },
          { status: 401 }
        )
      }
      if (error.message === 'Insufficient permissions') {
        return NextResponse.json(
          { error: 'Permisos insuficientes' },
          { status: 403 }
        )
      }
    }
    
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { user } = await requireRole(request, [USER_ROLES.ADMIN])
    await connectToDatabase()

    const { orderId, status, notes } = await request.json()

    if (!orderId || !status) {
      return NextResponse.json(
        { error: 'ID del pedido y estado son requeridos' },
        { status: 400 }
      )
    }

    // Buscar el pedido
    const order = await Order.findById(orderId)
    if (!order) {
      return NextResponse.json(
        { error: 'Pedido no encontrado' },
        { status: 404 }
      )
    }

    // Actualizar el pedido
    const updateData: any = { status }
    
    if (notes) {
      updateData.adminNotes = notes
    }

    await Order.findByIdAndUpdate(orderId, updateData)

    return NextResponse.json({
      message: 'Pedido actualizado exitosamente',
      order: {
        id: order._id,
        orderNumber: order.orderNumber,
        status: status
      }
    })

  } catch (error) {
    console.error('Update admin order error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}