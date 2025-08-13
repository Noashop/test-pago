import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import Order from '@/models/Order'
import Product from '@/models/Product'
import { requireAuth } from '@/lib/auth-middleware'
import { jsonOk, jsonError } from '@/lib/api-response'
import { USER_ROLES } from '@/constants'
import mongoose from 'mongoose'

// GET /api/orders - Get user's orders
export async function GET(request: NextRequest) {
  try {
    // Permitir tanto admin como cliente autenticado
    const { user } = await requireAuth(request)
    await connectToDatabase()

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')
    const paymentStatus = searchParams.get('paymentStatus')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    const skip = (page - 1) * limit

    // Build query based on user role
    const query: any = {}
    
    if (user.role === USER_ROLES.ADMIN) {
      // Admins can see all orders
      if (status) query.status = status
      if (paymentStatus) query.paymentStatus = paymentStatus
    } else {
      // Customers can only see their own orders
      query.customer = user.id
      if (status) query.status = status
      if (paymentStatus) query.paymentStatus = paymentStatus
    }

    const sort: any = {}
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1

    const [orders, total] = await Promise.all([
      Order.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('customer', 'name email')
        .populate('items.product', 'name images salePrice')
        .lean(),
      Order.countDocuments(query)
    ])

    const totalPages = Math.ceil(total / limit)

    // Transform to match client expectations (items.productId)
    const transformed = orders.map((order: any) => ({
      ...order,
      userId: order.customer, // backward compat if used somewhere
      items: (order.items || []).map((it: any) => ({
        ...it,
        productId: it.product, // client UI expects productId
      })),
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
    console.error('Get orders error:', error)
    return jsonError('Error interno del servidor', 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user } = await requireAuth(request)
    await connectToDatabase()

    const body = await request.json()
    const { items, shippingAddress, paymentMethod, notes, discount = 0, tax = 0, shipping = 0 } = body

    // Validaciones básicas
    if (!items || !Array.isArray(items) || items.length === 0) {
      return jsonError('Items del pedido son requeridos', 400)
    }
    if (!shippingAddress) {
      return jsonError('Dirección de envío es requerida', 400)
    }

    // Obtener productos para completar info requerida por el modelo (name, image, supplier)
    const productIds = items.map((it: any) => it.product || it.productId)
    const products = await Product.find({ _id: { $in: productIds } })

    if (products.length !== productIds.length) {
      return jsonError('Algunos productos no fueron encontrados', 400)
    }

    const productMap = new Map<string, any>()
    products.forEach((p: any) => productMap.set(p._id.toString(), p))

    const completeItems = items.map((it: any) => {
      const pid = (it.product || it.productId) as string
      const product = productMap.get(pid)
      if (!product) {
        throw new Error(`Producto ${pid} no encontrado`)
      }
      return {
        product: new mongoose.Types.ObjectId(pid),
        name: product.name,
        image: product.images?.[0] || '/placeholder-product.jpg',
        price: it.price,
        quantity: it.quantity,
        supplier: product.supplierId,
      }
    })

    const subtotal = completeItems.reduce((sum: number, it: any) => sum + it.price * it.quantity, 0)
    const total = subtotal - discount + tax + shipping

    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`

    const created = await Order.create({
      orderNumber,
      customer: new mongoose.Types.ObjectId(user.id),
      items: completeItems,
      subtotal,
      total,
      discount,
      tax,
      shipping,
      status: 'pending',
      paymentStatus: 'pending',
      paymentMethod: paymentMethod || 'mercadopago',
      shippingMethod: body.shippingMethod || 'home_delivery',
      pickupDate: body.pickupDate ? new Date(body.pickupDate) : undefined,
      shippingAddress,
      notes: notes || '',
      createdAt: new Date(),
    })

    return jsonOk({
      message: 'Pedido creado exitosamente',
      order: {
        id: created._id,
        _id: created._id,
        orderNumber: created.orderNumber,
        total: created.total,
        status: created.status,
      },
    }, { status: 201 })
  } catch (error) {
    console.error('Create order error:', error)
    return jsonError('Error interno del servidor', 500)
  }
}
