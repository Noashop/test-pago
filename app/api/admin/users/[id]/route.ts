import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import User from '@/models/User'
import { requireRole } from '@/lib/auth-middleware'
import { USER_ROLES } from '@/constants'

export async function GET(request: NextRequest) {
  try {
    const { user } = await requireRole(request, [USER_ROLES.ADMIN])
    await connectToDatabase()

    const userId = request.nextUrl.pathname.split('/').pop()

    if (!userId) {
      return NextResponse.json(
        { error: 'ID de usuario requerido' },
        { status: 400 }
      )
    }

    const userData = await User.findById(userId)
      .select('-password')
      .lean()

    if (!userData) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      user: userData
    })

  } catch (error) {
    console.error('Get user error:', error)
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

    const updateData = await request.json()
    const userId = request.nextUrl.pathname.split('/').pop()

    if (!userId) {
      return NextResponse.json(
        { error: 'ID de usuario requerido' },
        { status: 400 }
      )
    }

    // Buscar el usuario
    const userToUpdate = await User.findById(userId)

    if (!userToUpdate) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    // Actualizar campos permitidos
    const allowedFields = ['name', 'email', 'isActive', 'isApproved']
    const filteredData: any = {}

    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        filteredData[field] = updateData[field]
      }
    }

    // Actualizar el usuario
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { ...filteredData, updatedAt: new Date() },
      { new: true }
    ).select('-password')

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

export async function DELETE(request: NextRequest) {
  try {
    const { user } = await requireRole(request, [USER_ROLES.ADMIN])
    await connectToDatabase()

    const userId = request.nextUrl.pathname.split('/').pop()

    if (!userId) {
      return NextResponse.json(
        { error: 'ID de usuario requerido' },
        { status: 400 }
      )
    }

    // Verificar que no se elimine a sí mismo
    if (userId === user.id) {
      return NextResponse.json(
        { error: 'No puedes eliminar tu propia cuenta' },
        { status: 400 }
      )
    }

    const userToDelete = await User.findById(userId)

    if (!userToDelete) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    // Verificar que no se elimine al último administrador
    if (userToDelete.role === 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin' })
      if (adminCount <= 1) {
        return NextResponse.json(
          { error: 'No se puede eliminar el último administrador' },
          { status: 400 }
        )
      }
    }

    await User.findByIdAndDelete(userId)

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