import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import Order from '@/models/Order'
import Notification from '@/models/Notification'
import User from '@/models/User'
import { requireRole } from '@/lib/auth-middleware'
import { USER_ROLES } from '@/constants'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await requireRole(request, [USER_ROLES.ADMIN])
    await connectToDatabase()

    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { error: 'ID del pedido es requerido' },
        { status: 400 }
      )
    }

    // Buscar el pedido con todos los detalles
    const order = await Order.findById(id)
      .populate('customer', 'name email phone')
      .populate('items.product', 'name images description')
      .populate('items.supplier', 'name email businessInfo')
      .lean()

    if (!order) {
      return NextResponse.json(
        { error: 'Pedido no encontrado' },
        { status: 404 }
      )
    }

    // Transformar los datos para el frontend
    const orderData = order as any
    const transformedOrder = {
      _id: orderData._id,
      orderNumber: orderData.orderNumber,
      customer: {
        _id: orderData.customer?._id,
        name: orderData.customer?.name || 'Cliente no registrado',
        email: orderData.customer?.email || 'N/A',
        phone: orderData.customer?.phone || 'N/A'
      },
      items: orderData.items.map((item: any) => ({
        _id: item._id,
        product: {
          _id: item.product._id,
          name: item.product.name,
          image: item.product.images?.[0] || '/placeholder.jpg',
          sku: item.product.sku
        },
        supplier: {
          _id: item.supplier._id,
          name: item.supplier.name,
          email: item.supplier.email
        },
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal: item.subtotal,
        status: item.status || 'pending'
      })),
      total: orderData.total,
      status: orderData.status,
      paymentStatus: orderData.paymentStatus,
      paymentMethod: orderData.paymentMethod,
      shippingMethod: orderData.shippingMethod || 'Envío estándar',
      shippingAddress: orderData.shippingAddress,
      trackingNumber: orderData.tracking?.trackingNumber,
      // Opcional: exponer carrier y url si el front lo necesitara en el futuro
      carrier: orderData.tracking?.carrier,
      trackingUrl: orderData.tracking?.url,
      adminNotes: orderData.adminNotes,
      createdAt: orderData.createdAt,
      updatedAt: orderData.updatedAt
    }

    return NextResponse.json({ order: transformedOrder })

  } catch (error) {
    console.error('Get order details error:', error)
    
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await requireRole(request, [USER_ROLES.ADMIN])
    await connectToDatabase()

    const { id } = await params
    const { action, status, trackingNumber, notes } = await request.json()

    if (!id) {
      return NextResponse.json(
        { error: 'ID del pedido es requerido' },
        { status: 400 }
      )
    }

    // Buscar el pedido
    const order = await Order.findById(id)
    if (!order) {
      return NextResponse.json(
        { error: 'Pedido no encontrado' },
        { status: 404 }
      )
    }

    let updateData: any = {}
    let message = ''
    // Aseguramos que los datos del pedido transformados estén disponibles en todos los casos del switch
    const orderData = order as any

    switch (action) {
      case 'confirm':
        updateData.status = 'confirmed'
        updateData.confirmedAt = new Date()
        updateData.confirmedBy = user.id
        message = 'Pedido confirmado exitosamente'
        
        // Notificar a proveedores únicos del pedido
        const supplierIds = orderData.items.map((item: any) => item.supplier?.toString()).filter(Boolean)
        const uniqueSuppliers = Array.from(new Set(supplierIds))
        
        for (const supplierId of uniqueSuppliers) {
          await Notification.create({
            userId: supplierId,
            title: '🎉 Nuevo Pedido Confirmado',
            message: `El pedido #${order.orderNumber} ha sido confirmado por el administrador. Puedes proceder con la preparación y envío.`,
            type: 'success',
            category: 'order',
            data: {
              orderId: order._id,
              orderNumber: order.orderNumber,
              action: 'confirmed',
              confirmedBy: user.name || user.email
            }
          })
        }
        
        // Notificar al cliente
        if (order.customer) {
          await Notification.create({
            userId: order.customer.toString(),
            title: '✅ Pedido Confirmado',
            message: `Tu pedido #${order.orderNumber} ha sido confirmado y está siendo procesado.`,
            type: 'success',
            category: 'order',
            data: {
              orderId: order._id,
              orderNumber: order.orderNumber,
              action: 'confirmed'
            }
          })
        }
        break
        
      case 'cancel':
        updateData.status = 'cancelled'
        updateData.cancelledAt = new Date()
        updateData.cancelledBy = user.id
        if (notes) updateData.cancellationReason = notes
        message = 'Pedido cancelado exitosamente'
        
        // Notificar a proveedores únicos del pedido
        const cancelSupplierIds = orderData.items.map((item: any) => item.supplier?.toString()).filter(Boolean)
        const cancelSuppliers = Array.from(new Set(cancelSupplierIds))
        
        for (const supplierId of cancelSuppliers) {
          await Notification.create({
            userId: supplierId,
            title: '❌ Pedido Cancelado',
            message: `El pedido #${order.orderNumber} ha sido cancelado por el administrador. ${notes ? `Motivo: ${notes}` : ''}`,
            type: 'warning',
            category: 'order',
            data: {
              orderId: order._id,
              orderNumber: order.orderNumber,
              action: 'cancelled',
              reason: notes,
              cancelledBy: user.name || user.email
            }
          })
        }
        
        // Notificar al cliente
        if (order.customer) {
          await Notification.create({
            userId: order.customer.toString(),
            title: '❌ Pedido Cancelado',
            message: `Tu pedido #${order.orderNumber} ha sido cancelado. ${notes ? `Motivo: ${notes}` : 'Contacta con soporte para más información.'}`,
            type: 'warning',
            category: 'order',
            data: {
              orderId: order._id,
              orderNumber: order.orderNumber,
              action: 'cancelled',
              reason: notes
            }
          })
        }
        break
        
      case 'update_status':
        if (!status) {
          return NextResponse.json(
            { error: 'Estado es requerido' },
            { status: 400 }
          )
        }
        updateData.status = status
        message = 'Estado del pedido actualizado'
        break
        
      case 'update_tracking':
        if (!trackingNumber) {
          return NextResponse.json(
            { error: 'Número de seguimiento es requerido' },
            { status: 400 }
          )
        }
        // Persistir tracking dentro del objeto tracking del pedido
        updateData.tracking = {
          ...(order.tracking || {}),
          trackingNumber,
          // Mantener carrier/url existentes si no se proporcionan en este flujo
          carrier: (order.tracking as any)?.carrier || '',
          url: (order.tracking as any)?.url || ''
        }
        // Al actualizar tracking, marcamos como enviado
        updateData.status = 'shipped'
        message = 'Información de envío actualizada'
        break
        
      default:
        return NextResponse.json(
          { error: 'Acción no válida' },
          { status: 400 }
        )
    }

    if (notes && action !== 'cancel') {
      updateData.adminNotes = notes
    }

    // Actualizar el pedido
    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    )

    return NextResponse.json({
      message,
      order: {
        id: updatedOrder._id,
        orderNumber: updatedOrder.orderNumber,
        status: updatedOrder.status,
        trackingNumber: (updatedOrder as any)?.tracking?.trackingNumber
      }
    })

  } catch (error) {
    console.error('Update order error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
