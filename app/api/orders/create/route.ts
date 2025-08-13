import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import Order from '@/models/Order'
import Product from '@/models/Product'
import User from '@/models/User'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import mongoose from 'mongoose'
import { sendOrderCreatedEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase()
    
    const orderData = await request.json()
    console.log('📦 ORDER CREATION - Received data:', orderData)

    // Validar datos requeridos (excepto total que puede ser 0)
    const requiredFields = ['items', 'shippingAddress']
    for (const field of requiredFields) {
      if (!orderData[field]) {
        console.error(`❌ Missing required field: ${field}`)
        return NextResponse.json(
          { error: `Campo requerido: ${field}` },
          { status: 400 }
        )
      }
    }
    
    // Validar que total existe (puede ser 0)
    if (orderData.total === undefined || orderData.total === null) {
      console.error('❌ Missing total field')
      return NextResponse.json(
        { error: 'Campo requerido: total' },
        { status: 400 }
      )
    }

    // Validar que hay items
    if (!Array.isArray(orderData.items) || orderData.items.length === 0) {
      return NextResponse.json(
        { error: 'La orden debe tener al menos un producto' },
        { status: 400 }
      )
    }

    // Intentar obtener sesión (opcional para checkout)
    let user = null
    try {
      const session = await getServerSession(authOptions)
      if (session?.user) {
        user = {
          id: session.user.id,
          name: session.user.name,
          email: session.user.email
        }
      }
    } catch (error) {
      console.log('⚠️ No session found, creating guest order')
    }

    // Obtener información completa de los productos
    const productIds = orderData.items.map((item: any) => item.product)
    const products = await Product.find({ _id: { $in: productIds } })
    
    if (products.length !== productIds.length) {
      return NextResponse.json(
        { error: 'Algunos productos no fueron encontrados' },
        { status: 400 }
      )
    }

    // Crear un mapa de productos para fácil acceso
    const productMap = new Map()
    products.forEach((product: any) => {
      productMap.set(product._id.toString(), product)
    })

    // Preparar items con información completa
    const completeItems = orderData.items.map((item: any) => {
      const product = productMap.get(item.product)
      if (!product) {
        throw new Error(`Producto ${item.product} no encontrado`)
      }
      
      return {
        product: new mongoose.Types.ObjectId(item.product),
        name: product.name,
        image: product.images?.[0] || '/placeholder-product.jpg',
        price: item.price, // precio de venta administrado (usado para cobro al cliente)
        quantity: item.quantity,
        supplier: product.supplierId, // Usar supplierId que es el campo correcto
        costPrice: product.costPrice // precio de costo del proveedor
      }
    })
    
    // Recalcular totales si vienen en 0
    let finalSubtotal = orderData.subtotal
    let finalTotal = orderData.total
    
    if (finalSubtotal === 0 || finalTotal === 0) {
      console.log('🔄 Recalculating totals because they are 0')
      finalSubtotal = completeItems.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0)
      finalTotal = finalSubtotal - (orderData.discount || 0)
      console.log('Recalculated subtotal:', finalSubtotal)
      console.log('Recalculated total:', finalTotal)
    }

    // Calcular comisiones totales
    const totals = completeItems.reduce((acc: any, it: any) => {
      const lineRevenue = Number(it.price) * Number(it.quantity)
      const lineCost = Number(it.costPrice || 0) * Number(it.quantity)
      acc.adminCommission += Math.max(0, lineRevenue - lineCost)
      acc.supplierAmount += lineCost
      acc.totalAmount += lineRevenue
      return acc
    }, { adminCommission: 0, supplierAmount: 0, totalAmount: 0 })

    const adminCommissionPercentage = totals.totalAmount > 0
      ? Number(((totals.adminCommission / totals.totalAmount) * 100).toFixed(2))
      : 0

    // Generar número de pedido único
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // Crear o encontrar usuario guest si no hay sesión
    let customerId
    if (user) {
      customerId = new mongoose.Types.ObjectId(user.id)
    } else {
      // Buscar o crear usuario guest
      const guestEmail = `guest-${Date.now()}@noashop.com`
      const guestUser = await User.create({
        name: orderData.shippingAddress.name,
        email: guestEmail,
        role: 'client',
        isGuest: true,
        createdAt: new Date()
      })
      customerId = guestUser._id
    }

    // Preparar datos de la orden
    const orderToCreate = {
      orderNumber,
      customer: customerId,
      items: completeItems,
      subtotal: finalSubtotal,
      total: finalTotal,
      discount: orderData.discount || 0,
      tax: orderData.tax || 0,
      shipping: orderData.shipping || 0,
      status: 'pending',
      paymentStatus: 'pending',
      paymentMethod: orderData.paymentMethod || 'mercadopago',
      shippingMethod: orderData.shippingMethod || 'home_delivery',
      pickupDate: orderData.pickupDate ? new Date(orderData.pickupDate) : undefined,
      shippingAddress: orderData.shippingAddress,
      notes: orderData.notes || '',
      commissionDetails: {
        adminCommission: totals.adminCommission,
        supplierAmount: totals.supplierAmount,
        adminCommissionPercentage,
        calculatedAt: new Date()
      },
      createdAt: new Date()
    }

    console.log('📦 Creating order with data:', orderToCreate)

    // Crear el pedido
    const newOrder = await Order.create(orderToCreate)

    console.log('✅ Order created successfully:', newOrder._id)

    // Best-effort: enviar email de confirmación de creación de pedido solo si tenemos email del usuario
    try {
      if (user?.email) {
        await sendOrderCreatedEmail(user.email, newOrder.orderNumber, newOrder.total)
      }
    } catch (e) {
      console.warn('Could not send order created email:', e)
    }

    return NextResponse.json({
      message: 'Pedido creado exitosamente',
      order: {
        id: newOrder._id,
        _id: newOrder._id,
        orderNumber: newOrder.orderNumber,
        total: newOrder.total,
        status: newOrder.status
      }
    }, { status: 201 })

  } catch (error) {
    console.error('❌ Create order error:', error)
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
