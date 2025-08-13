import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import Return from '@/models/Return'
import Order from '@/models/Order'
import { requireRole } from '@/lib/auth-middleware'
import { USER_ROLES } from '@/constants'

// GET /api/returns - Get returns
export async function GET(request: NextRequest) {
  try {
    const { user } = await requireRole(request, [USER_ROLES.ADMIN])
    await connectToDatabase()

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')

    const skip = (page - 1) * limit

    // Build query based on user role
    const query: any = {}
    
    if (user.role === USER_ROLES.ADMIN) {
      // Admins can see all returns
      if (status) query.status = status
    } else {
      // Customers can only see their own returns
      query.userId = user.id
      if (status) query.status = status
    }

    const [returns, total] = await Promise.all([
      Return.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('orderId', 'orderNumber total')
        .populate('userId', 'name email')
        .lean(),
      Return.countDocuments(query)
    ])

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      returns,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    })

  } catch (error) {
    console.error('Get returns error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// POST /api/returns - Create return request
export async function POST(request: NextRequest) {
  try {
    const { user } = await requireRole(request, [USER_ROLES.ADMIN])
    await connectToDatabase()

    const { orderId, items, reason, description } = await request.json()

    if (!orderId) {
      return NextResponse.json(
        { error: 'ID del pedido es requerido' },
        { status: 400 }
      )
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Items para devolución son requeridos' },
        { status: 400 }
      )
    }

    if (!reason) {
      return NextResponse.json(
        { error: 'Motivo de devolución es requerido' },
        { status: 400 }
      )
    }

    // Verify order exists and belongs to user
    const order = await Order.findById(orderId)
    if (!order) {
      return NextResponse.json(
        { error: 'Pedido no encontrado' },
        { status: 404 }
      )
    }

    if (order.userId.toString() !== user.id && user.role !== USER_ROLES.ADMIN) {
      return NextResponse.json(
        { error: 'No tienes permisos para este pedido' },
        { status: 403 }
      )
    }

    // Check if order is eligible for return
    if (order.status !== 'completed') {
      return NextResponse.json(
        { error: 'Solo pedidos completados pueden ser devueltos' },
        { status: 400 }
      )
    }

    // Check if return already exists for this order
    const existingReturn = await Return.findOne({ orderId })
    if (existingReturn) {
      return NextResponse.json(
        { error: 'Ya existe una solicitud de devolución para este pedido' },
        { status: 400 }
      )
    }

    // Create return request
    const returnRequest = await Return.create({
      orderId,
      userId: user.id,
      items,
      reason,
      description: description || '',
      status: 'pending',
      createdAt: new Date()
    })

    await returnRequest.populate('orderId', 'orderNumber total')
    await returnRequest.populate('userId', 'name email')

    return NextResponse.json({
      message: 'Solicitud de devolución creada exitosamente',
      return: returnRequest
    }, { status: 201 })

  } catch (error) {
    console.error('Create return error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
