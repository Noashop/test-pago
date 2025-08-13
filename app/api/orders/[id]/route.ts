import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import Order from '@/models/Order'
import Payout from '@/models/Payout'
import { requireAuth } from '@/lib/auth-middleware'
import { USER_ROLES } from '@/constants'

// GET /api/orders/[id] - Get specific order
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase()

    const { id } = await params
    const order = await Order.findById(id)
      .populate('customer', 'name email')
      .populate('items.product', 'name images price')
      .populate('items.supplier', 'name email address phone')
      .lean()

    if (!order) {
      return NextResponse.json(
        { error: 'Pedido no encontrado' },
        { status: 404 }
      )
    }

    // Requerir autenticación y verificar permisos
    const { user } = await requireAuth(request)
    const isAdmin = user.role === USER_ROLES.ADMIN
    const isSupplier = user.role === USER_ROLES.SUPPLIER
    const isOwner = (order as any).customer?._id?.toString() === user.id

    if (!isAdmin && !isSupplier && !isOwner) {
      return NextResponse.json(
        { error: 'No tienes permisos para ver este pedido' },
        { status: 403 }
      )
    }

    // Transformar los datos para el frontend
    const transformedOrder = {
      _id: (order as any)._id,
      orderNumber: (order as any).orderNumber,
      customer: {
        name: (order as any).customer?.name || 'Cliente no registrado',
        email: (order as any).customer?.email || 'N/A'
      },
      items: (order as any).items.map((item: any) => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        supplier: item.supplier?.name || 'Proveedor no encontrado'
      })),
      total: (order as any).total,
      subtotal: (order as any).subtotal,
      discount: (order as any).discount,
      status: (order as any).status,
      paymentStatus: (order as any).paymentStatus,
      shippingMethod: (order as any).shippingMethod || 'home_delivery',
      pickupDate: (order as any).pickupDate,
      paymentMethod: (order as any).paymentMethod,
      shippingAddress: (order as any).shippingAddress,
      trackingNumber: (order as any).tracking?.trackingNumber,
      statusHistory: Array.isArray((order as any).statusHistory) ? (order as any).statusHistory : [],
      supplier: (order as any).items[0]?.supplier ? {
        name: (order as any).items[0].supplier.name,
        address: (order as any).items[0].supplier.address || 'Dirección no disponible',
        phone: (order as any).items[0].supplier.phone || 'No disponible'
      } : null,
      createdAt: (order as any).createdAt,
      updatedAt: (order as any).updatedAt
    }

    return NextResponse.json({
      order: transformedOrder
    })

  } catch (error) {
    console.error('Get order error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// PATCH /api/orders/[id] - Update order status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase()

    const { status, notes, paymentStatus } = await request.json()

    const { id } = await params
    const order = await Order.findById(id)

    if (!order) {
      return NextResponse.json(
        { error: 'Pedido no encontrado' },
        { status: 404 }
      )
    }

    // Verificar permisos
    const { user } = await requireAuth(request)
    const isAdmin = user.role === USER_ROLES.ADMIN
    const isSupplier = user.role === USER_ROLES.SUPPLIER
    if (!isAdmin && !isSupplier) {
      return NextResponse.json(
        { error: 'No tienes permisos para modificar este pedido' },
        { status: 403 }
      )
    }

    if (status) {
      order.status = status
    }

    if (paymentStatus) {
      const prevPaymentStatus = order.paymentStatus
      order.paymentStatus = paymentStatus

      // Si se aprueba el pago por primera vez, generar payouts por proveedor
      if (paymentStatus === 'approved' && prevPaymentStatus !== 'approved' && !order.payoutsPrepared) {
        // Agrupar por proveedor
        const perSupplier: Record<string, { amount: number, orders: { order: any, amount: number }[] }> = {}
        for (const it of (order as any).items || []) {
          const supplierId = String(it.supplier)
          const lineRevenue = Number(it.price) * Number(it.quantity)
          const lineCost = Number(it.costPrice || 0) * Number(it.quantity)
          const supplierAmount = Math.max(0, lineCost)
          if (!perSupplier[supplierId]) perSupplier[supplierId] = { amount: 0, orders: [] }
          perSupplier[supplierId].amount += supplierAmount
          perSupplier[supplierId].orders.push({ order: order._id, amount: supplierAmount })
        }

        for (const [supplier, data] of Object.entries(perSupplier)) {
          await Payout.create({
            supplier,
            currency: 'ARS',
            amount: data.amount,
            status: 'pending',
            orders: data.orders
          })
        }
        ;(order as any).payoutsPrepared = true
      }
    }

    if (notes) {
      order.notes = notes
    }

    order.updatedAt = new Date()
    await order.save()

    return NextResponse.json({
      message: 'Pedido actualizado exitosamente',
      order
    })

  } catch (error) {
    console.error('Update order error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// DELETE /api/orders/[id] - Cancel order
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase()

    const { id } = await params
    const order = await Order.findById(id)

    if (!order) {
      return NextResponse.json(
        { error: 'Pedido no encontrado' },
        { status: 404 }
      )
    }

    // Verificar permisos
    const { user } = await requireAuth(request)
    const isAdmin = user.role === USER_ROLES.ADMIN
    const isOwner = (order as any).customer?.toString() === user.id
    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { error: 'No tienes permisos para cancelar este pedido' },
        { status: 403 }
      )
    }

    // Solo pedidos pendientes pueden ser cancelados
    if (order.status !== 'pending') {
      return NextResponse.json(
        { error: 'Solo pedidos pendientes pueden ser cancelados' },
        { status: 400 }
      )
    }

    order.status = 'cancelled'
    order.updatedAt = new Date()
    await order.save()

    return NextResponse.json({
      message: 'Pedido cancelado exitosamente'
    })

  } catch (error) {
    console.error('Cancel order error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
