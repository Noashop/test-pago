import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import Cart from '@/models/Cart'
import Product from '@/models/Product'
import { requireRole } from '@/lib/auth-middleware'
import { USER_ROLES } from '@/constants'

// POST /api/cart/bulk-add - Add multiple items to cart
export async function POST(request: NextRequest) {
  try {
    const { user } = await requireRole(request, [USER_ROLES.CLIENT])
    await connectToDatabase()

    const { items } = await request.json()

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Items son requeridos' },
        { status: 400 }
      )
    }

    // Validate all products exist and are available
    const productIds = items.map(item => item.productId)
    const products = await Product.find({
      _id: { $in: productIds },
      status: 'approved',
      stock: { $gt: 0 }
    })

    if (products.length !== items.length) {
      return NextResponse.json(
        { error: 'Algunos productos no están disponibles' },
        { status: 400 }
      )
    }

    // Find or create cart
    let cart = await Cart.findOne({ userId: user.id })
    
    if (!cart) {
      cart = await Cart.create({
        userId: user.id,
        items: []
      })
    }

    // Add items to cart
    for (const item of items) {
      const product = products.find(p => p._id.toString() === item.productId)
      if (!product) continue

      // Check if item already exists in cart
      const existingItemIndex = cart.items.findIndex(
        (cartItem: any) => cartItem.productId.toString() === item.productId
      )

      if (existingItemIndex >= 0) {
        // Update quantity
        cart.items[existingItemIndex].quantity += item.quantity
      } else {
        // Add new item
        cart.items.push({
          productId: item.productId,
          quantity: item.quantity,
          price: product.salePrice,
          supplierName: product.supplierName || 'N/A',
          minOrderQuantity: product.minOrderQuantity || 1,
          unitType: product.unitType || 'unidad'
        })
      }
    }

    await cart.save()

    return NextResponse.json({
      message: 'Productos agregados al carrito',
      cart,
      itemsAdded: items.length
    })

  } catch (error) {
    console.error('Bulk add to cart error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
