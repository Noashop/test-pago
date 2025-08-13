import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import Cart from '@/models/Cart'
import Product from '@/models/Product'
import { requireRole } from '@/lib/auth-middleware'
import { USER_ROLES } from '@/constants'

// GET /api/cart - Get user's cart
export async function GET(request: NextRequest) {
  try {
    const { user } = await requireRole(request, [USER_ROLES.ADMIN])
    await connectToDatabase()

    // Buscar el carrito del usuario
    let cart = await Cart.findOne({ userId: user.id })
        .populate('items.productId', 'name images salePrice recommendedRetailPrice stock minimumPurchaseQuantity')
        .lean()

    if (!cart) {
      return NextResponse.json({
        items: [],
        total: 0
      })
    }

    return NextResponse.json(cart)

  } catch (error) {
    console.error('Get cart error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user } = await requireRole(request, [USER_ROLES.ADMIN])
    await connectToDatabase()

    const { productId, quantity = 1 } = await request.json()

    if (!productId) {
      return NextResponse.json(
        { error: 'ID del producto es requerido' },
        { status: 400 }
      )
    }

    // Verificar que el producto existe y está disponible
    const product = await Product.findById(productId)
    if (!product) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      )
    }

    if (product.approvalStatus !== 'approved' || product.status !== 'active') {
      return NextResponse.json(
        { error: 'Producto no disponible' },
        { status: 400 }
      )
    }

    if (product.stock < quantity) {
      return NextResponse.json(
        { error: 'Stock insuficiente' },
        { status: 400 }
      )
    }

    // Buscar o crear carrito
    let cart = await Cart.findOne({ userId: user.id })

    if (!cart) {
      cart = await Cart.create({
        userId: user.id,
        items: [],
        total: 0
      })
    }

    // Verificar si el producto ya está en el carrito
    const existingItem = cart.items.find((item: any) => 
      item.productId.toString() === productId
    )

    if (existingItem) {
      // Actualizar cantidad
      existingItem.quantity += quantity
      existingItem.total = existingItem.quantity * product.salePrice
    } else {
      // Agregar nuevo item
      cart.items.push({
        productId: product._id,
        name: product.name,
        price: product.salePrice,
        quantity,
        total: product.salePrice * quantity,
        image: product.images[0]
      })
    }

    // Recalcular total
    cart.total = cart.items.reduce((sum: any, item: any) => sum + item.total, 0)

    await cart.save()

    return NextResponse.json({
      message: 'Producto agregado al carrito',
      cart
    })

  } catch (error) {
    console.error('Add to cart error:', error)
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

    const { productId, quantity } = await request.json()

    if (!productId) {
      return NextResponse.json(
        { error: 'ID del producto es requerido' },
        { status: 400 }
      )
    }

    const cart = await Cart.findOne({ userId: user.id })

    if (!cart) {
      return NextResponse.json(
        { error: 'Carrito no encontrado' },
        { status: 404 }
      )
    }

    const item = cart.items.find((item: any) => 
      item.productId.toString() === productId
    )

    if (!item) {
      return NextResponse.json(
        { error: 'Producto no encontrado en el carrito' },
        { status: 404 }
      )
    }

    if (quantity <= 0) {
      // Remover item si cantidad es 0 o menor
      cart.items = cart.items.filter((item: any) => 
        item.productId.toString() !== productId
      )
    } else {
      // Actualizar cantidad
      item.quantity = quantity
      item.total = item.price * quantity
    }

    // Recalcular total
    cart.total = cart.items.reduce((sum: any, item: any) => sum + item.total, 0)

    await cart.save()

    return NextResponse.json({
      message: 'Carrito actualizado',
      cart
    })

  } catch (error) {
    console.error('Update cart error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { user } = await requireRole(request, [USER_ROLES.ADMIN])
    await connectToDatabase()

    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')

    const cart = await Cart.findOne({ userId: user.id })

    if (!cart) {
      return NextResponse.json(
        { error: 'Carrito no encontrado' },
        { status: 404 }
      )
    }

    if (productId) {
      // Remover producto específico
      cart.items = cart.items.filter((item: any) => 
        item.productId.toString() !== productId
      )
    } else {
      // Vaciar carrito completo
      cart.items = []
    }

    cart.total = cart.items.reduce((sum: any, item: any) => sum + item.total, 0)
    await cart.save()

    return NextResponse.json({
      message: productId ? 'Producto removido del carrito' : 'Carrito vaciado',
      cart
    })

  } catch (error) {
    console.error('Delete cart error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}