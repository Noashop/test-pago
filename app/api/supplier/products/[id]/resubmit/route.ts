import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import Product from '@/models/Product'
import { requireRole } from '@/lib/auth-middleware'
import { USER_ROLES } from '@/constants'

export async function POST(
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
        { error: 'No tienes permisos para modificar este producto' },
        { status: 403 }
      )
    }

    // Verificar que el producto esté rechazado
    if (product.approvalStatus !== 'rejected') {
      return NextResponse.json(
        { error: 'Solo se pueden reenviar productos rechazados' },
        { status: 400 }
      )
    }

    // Actualizar el producto a estado pendiente
    await Product.findByIdAndUpdate(id, {
      approvalStatus: 'pending',
      rejectionReason: null,
      updatedAt: new Date()
    })

    return NextResponse.json({
      message: 'Producto reenviado para revisión exitosamente'
    })

  } catch (error) {
    console.error('Resubmit supplier product error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
