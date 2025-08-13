import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import User from '@/models/User'
import { requireRoleOrPermission } from '@/lib/auth-middleware'
import { USER_ROLES, PAGINATION } from '@/constants'

export async function GET(request: NextRequest) {
  try {
    const { user } = await requireRoleOrPermission(request, [USER_ROLES.ADMIN], ['users', 'customers'])
    await connectToDatabase()

    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role')
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const page = Math.max(1, parseInt(searchParams.get('page') || String(PAGINATION.DEFAULT_PAGE)))
    const limitParam = parseInt(searchParams.get('limit') || String(PAGINATION.DEFAULT_LIMIT))
    const limit = Math.min(Math.max(1, limitParam), PAGINATION.MAX_LIMIT)
    const skip = (page - 1) * limit

    // Build query
    const query: any = {}
    
    if (role && role !== 'all') {
      query.role = role
    }
    
    if (status && status !== 'all') {
      if (status === 'pending') {
        query.isApproved = false
      } else if (status === 'active') {
        query.isApproved = true
        query.status = 'active'
      } else {
        query.status = status
      }
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { 'businessInfo.businessName': { $regex: search, $options: 'i' } }
      ]
    }

    // Get users with pagination
    const users = await User.find(query)
      .select('-password -resetPasswordToken -resetPasswordExpires -emailVerificationToken')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()

    // Get stats
    const stats = await Promise.all([
      User.countDocuments({}), // total
      User.countDocuments({ isApproved: true, status: 'active' }), // active
      User.countDocuments({ isApproved: false }), // pending
      User.countDocuments({ role: 'supplier' }), // suppliers
      User.countDocuments({ role: 'customer' }), // customers
      User.countDocuments({ role: 'admin' }) // admins
    ])

    const userStats = {
      total: stats[0],
      active: stats[1],
      pending: stats[2],
      suppliers: stats[3],
      customers: stats[4],
      admins: stats[5]
    }

    // Transform users data
    const transformedUsers = users.map(user => ({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status || 'active',
      isApproved: user.isApproved !== false,
      address: user.address,
      businessInfo: user.businessInfo,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLogin: user.lastLogin
    }))

    return NextResponse.json({
      users: transformedUsers,
      stats: userStats,
      pagination: {
        page,
        limit,
        total: stats[0],
        totalPages: Math.ceil(stats[0] / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { user: sessionUser } = await requireRoleOrPermission(request, [USER_ROLES.ADMIN], ['users', 'customers'])
    await connectToDatabase()

    const body = await request.json()
    const { userId, action, ...data } = body

    if (!userId || !action) {
      return NextResponse.json(
        { error: 'ID de usuario y acción son requeridos' },
        { status: 400 }
      )
    }

    const user = await User.findById(userId)
    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    let updateData: any = {}
    let message = ''

    switch (action) {
      case 'approve':
        updateData.isApproved = true
        updateData.status = 'active'
        message = 'Usuario aprobado exitosamente'
        break

      case 'suspend':
        updateData.status = 'suspended'
        message = 'Usuario suspendido exitosamente'
        break

      case 'activate':
        updateData.status = 'active'
        message = 'Usuario activado exitosamente'
        break

      case 'update':
        // Validate update data
        if (data.name) updateData.name = data.name.trim()
        if (data.email) {
          // Check if email is already taken by another user
          const existingUser = await User.findOne({ 
            email: data.email, 
            _id: { $ne: userId } 
          })
          if (existingUser) {
            return NextResponse.json(
              { error: 'Este email ya está en uso por otro usuario' },
              { status: 400 }
            )
          }
          updateData.email = data.email.toLowerCase().trim()
        }
        if (data.phone !== undefined) updateData.phone = data.phone.trim() || null
        if (data.role && ['customer', 'supplier', 'admin'].includes(data.role)) {
          updateData.role = data.role
        }
        if (data.status && ['active', 'inactive', 'suspended'].includes(data.status)) {
          updateData.status = data.status
        }
        if (typeof data.isApproved === 'boolean') {
          updateData.isApproved = data.isApproved
        }
        
        message = 'Usuario actualizado exitosamente'
        break

      default:
        return NextResponse.json(
          { error: 'Acción no válida' },
          { status: 400 }
        )
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { 
        ...updateData,
        updatedAt: new Date()
      },
      { new: true }
    ).select('-password -resetPasswordToken -resetPasswordExpires -emailVerificationToken')

    return NextResponse.json({
      message,
      user: updatedUser
    })

  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { user: sessionUser } = await requireRoleOrPermission(request, [USER_ROLES.ADMIN], ['users', 'customers'])
    await connectToDatabase()

    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'ID de usuario es requerido' },
        { status: 400 }
      )
    }

    const user = await User.findById(userId)
    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    // Prevent deleting admin users
    if (user.role === 'admin') {
      return NextResponse.json(
        { error: 'No se pueden eliminar usuarios administradores' },
        { status: 403 }
      )
    }

    // Prevent self-deletion
    if (user._id.toString() === sessionUser.id) {
      return NextResponse.json(
        { error: 'No puedes eliminar tu propia cuenta' },
        { status: 403 }
      )
    }

    // Delete user
    await User.findByIdAndDelete(userId)

    return NextResponse.json({
      message: 'Usuario eliminado exitosamente'
    })

  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}