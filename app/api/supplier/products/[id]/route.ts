import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import Product from '@/models/Product'
import { requireRole } from '@/lib/auth-middleware'
import { USER_ROLES } from '@/constants'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await requireRole(request, [USER_ROLES.SUPPLIER])
    const { id } = await params
    await connectToDatabase()

    // Buscar el producto y verificar que pertenece al proveedor
    const product = await Product.findById(id)
    if (!product) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      )
    }

    if (product.supplierId.toString() !== user.id) {
      return NextResponse.json(
        { error: 'No tienes permisos para ver este producto' },
        { status: 403 }
      )
    }

    return NextResponse.json({ product })

  } catch (error) {
    console.error('Get supplier product error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await requireRole(request, [USER_ROLES.SUPPLIER])
    const { id } = await params
    const body = await request.json()
    await connectToDatabase()

    // Verificar que el producto existe y pertenece al proveedor
    const existingProduct = await Product.findById(id)
    if (!existingProduct) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      )
    }

    if (existingProduct.supplierId.toString() !== user.id) {
      return NextResponse.json(
        { error: 'No tienes permisos para editar este producto' },
        { status: 403 }
      )
    }

    // Validar campos requeridos para edición
    const {
      costPrice,
      salePrice,
      recommendedResalePrice,
      minOrderQuantity,
      stock
    } = body

    // Validaciones específicas
    if (costPrice !== undefined && (typeof costPrice !== 'number' || costPrice < 0)) {
      return NextResponse.json(
        { error: 'El precio de costo debe ser un número válido mayor o igual a 0' },
        { status: 400 }
      )
    }

    if (salePrice !== undefined && (typeof salePrice !== 'number' || salePrice < 0)) {
      return NextResponse.json(
        { error: 'El precio de venta debe ser un número válido mayor a 0' },
        { status: 400 }
      )
    }

    if (recommendedResalePrice !== undefined && (typeof recommendedResalePrice !== 'number' || recommendedResalePrice < 0)) {
      return NextResponse.json(
        { error: 'El precio recomendado para reventa debe ser un número válido mayor a 0' },
        { status: 400 }
      )
    }

    if (minOrderQuantity !== undefined && (typeof minOrderQuantity !== 'number' || minOrderQuantity < 1)) {
      return NextResponse.json(
        { error: 'La cantidad mínima de compra debe ser un número válido mayor a 0' },
        { status: 400 }
      )
    }

    if (stock !== undefined && (typeof stock !== 'number' || stock < 0)) {
      return NextResponse.json(
        { error: 'Las unidades disponibles deben ser un número válido mayor o igual a 0' },
        { status: 400 }
      )
    }

    // Preparar datos para actualización
    const updateData: any = {}
    
    if (costPrice !== undefined) updateData.costPrice = costPrice
    if (salePrice !== undefined) updateData.salePrice = salePrice
    if (recommendedResalePrice !== undefined) updateData.recommendedResalePrice = recommendedResalePrice
    if (minOrderQuantity !== undefined) updateData.minOrderQuantity = minOrderQuantity
    if (stock !== undefined) updateData.stock = stock

    // Si el producto estaba aprobado, cambiar a pendiente
    if (existingProduct.approvalStatus === 'approved') {
      updateData.approvalStatus = 'pending'
      updateData.rejectionReason = undefined
    }

    updateData.updatedAt = new Date()

    // Actualizar el producto
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )

    return NextResponse.json({
      message: 'Producto actualizado exitosamente',
      product: updatedProduct
    })

  } catch (error) {
    console.error('Update supplier product error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await requireRole(request, [USER_ROLES.SUPPLIER])
    const { id } = await params
    await connectToDatabase()

    // Verificar que el producto existe y pertenece al proveedor
    const product = await Product.findById(id)
    if (!product) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      )
    }

    if (product.supplierId.toString() !== user.id) {
      return NextResponse.json(
        { error: 'No tienes permisos para eliminar este producto' },
        { status: 403 }
      )
    }

    // Eliminar el producto
    await Product.findByIdAndDelete(id)

    return NextResponse.json({
      message: 'Producto eliminado exitosamente'
    })

  } catch (error) {
    console.error('Delete supplier product error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
