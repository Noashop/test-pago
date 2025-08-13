import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import User from '@/models/User'
import { requireAuth, requireRole } from '@/lib/auth-middleware'
import { USER_ROLES } from '@/constants'

// GET /api/users/[id] - Get specific user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await requireAuth(request)
    await connectToDatabase()

    const { id } = await params
    const targetUser = await User.findById(id)
      .select('-password')
      .lean()

    if (!targetUser) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    // Permitir admin o self-access
    if (user.role !== USER_ROLES.ADMIN && user.id !== id) {
      return NextResponse.json(
        { error: 'No tienes permisos para ver este usuario' },
        { status: 403 }
      )
    }

    return NextResponse.json(targetUser)

  } catch (error) {
    console.error('Get user error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// PATCH /api/users/[id] - Update user
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await requireAuth(request)
    await connectToDatabase()

    const updateData = await request.json()

    const { id } = await params
    // Permitir admin o self-access
    if (user.role !== USER_ROLES.ADMIN && user.id !== id) {
      return NextResponse.json(
        { error: 'No tienes permisos para modificar este usuario' },
        { status: 403 }
      )
    }

    // Remove sensitive fields from update
    delete updateData.password
    delete updateData.email
    delete updateData.role

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: new Date() },
      { new: true }
    ).select('-password')

    if (!updatedUser) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      message: 'Usuario actualizado exitosamente',
      user: updatedUser
    })

  } catch (error) {
    console.error('Update user error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// DELETE /api/users/[id] - Delete user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await requireAuth(request)
    await connectToDatabase()

    // Only admins can delete users
    if (user.role !== USER_ROLES.ADMIN) {
      return NextResponse.json(
        { error: 'No tienes permisos para eliminar usuarios' },
        { status: 403 }
      )
    }

    const { id } = await params
    // Prevent self-deletion
    if (user.id === id) {
      return NextResponse.json(
        { error: 'No puedes eliminar tu propia cuenta' },
        { status: 400 }
      )
    }

    const deletedUser = await User.findByIdAndDelete(id)

    if (!deletedUser) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      message: 'Usuario eliminado exitosamente'
    })

  } catch (error) {
    console.error('Delete user error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}