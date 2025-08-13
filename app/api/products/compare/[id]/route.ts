import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import ProductComparison from '@/models/ProductComparison'
import { requireRole } from '@/lib/auth-middleware'
import { USER_ROLES } from '@/constants'

// GET /api/products/compare/[id] - Get specific comparison
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase()

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId') // Optional for authenticated requests

    const { id } = await params
    const comparison = await (ProductComparison as any).getComparisonWithProducts(id, userId || undefined)

    if (!comparison) {
      return NextResponse.json(
        { error: 'Comparación no encontrada o sin acceso' },
        { status: 404 }
      )
    }

    return NextResponse.json({ comparison })

  } catch (error) {
    console.error('Error fetching comparison:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// PUT /api/products/compare/[id] - Update comparison
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await requireRole(request, [USER_ROLES.CLIENT, USER_ROLES.SUPPLIER])
    await connectToDatabase()

    const { id } = await params
    const { name, isPublic, sharedWith } = await request.json()

    // Find comparison and verify ownership
    const comparison = await ProductComparison.findOne({
      _id: id,
      userId: user.id
    })

    if (!comparison) {
      return NextResponse.json(
        { error: 'Comparación no encontrada' },
        { status: 404 }
      )
    }

    // Update fields
    if (name !== undefined) comparison.name = name
    if (isPublic !== undefined) comparison.isPublic = isPublic
    if (sharedWith !== undefined) comparison.sharedWith = sharedWith

    await comparison.save()

    return NextResponse.json({
      message: 'Comparación actualizada exitosamente',
      comparison
    })

  } catch (error) {
    console.error('Error updating comparison:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// DELETE /api/products/compare/[id] - Delete comparison
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await requireRole(request, [USER_ROLES.CLIENT, USER_ROLES.SUPPLIER])
    await connectToDatabase()

    const { id } = await params
    const deleted = await ProductComparison.findOneAndDelete({
      _id: id,
      userId: user.id
    })

    if (!deleted) {
      return NextResponse.json(
        { error: 'Comparación no encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      message: 'Comparación eliminada exitosamente'
    })

  } catch (error) {
    console.error('Error deleting comparison:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
