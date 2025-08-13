import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import Product from '@/models/Product'
import { requireRole } from '@/lib/auth-middleware'
import { USER_ROLES } from '@/constants'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await requireRole(request, [USER_ROLES.ADMIN])
    const { id } = await params
    await connectToDatabase()

    // Verificar que el producto existe y está aprobado
    const product = await Product.findById(id)
    if (!product) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      )
    }

    if (product.approvalStatus !== 'approved') {
      return NextResponse.json(
        { error: 'Solo se pueden eliminar productos aprobados' },
        { status: 400 }
      )
    }

    // Eliminar el producto
    await Product.findByIdAndDelete(id)

    return NextResponse.json({
      message: 'Producto eliminado exitosamente'
    })

  } catch (error) {
    console.error('Delete product error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

