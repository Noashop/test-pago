import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectToDatabase } from '@/lib/mongodb'
import User from '@/models/User'
import Order from '@/models/Order'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    await connectToDatabase()

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const orderBy = searchParams.get('orderBy') || 'recent'
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // Build query for customers only
    const query: any = { role: 'customer' }
    
    if (status && status !== 'all') {
      if (status === 'pending') {
        query.isApproved = false
      } else if (status === 'active') {
        query.isApproved = true
        query.status = 'active'
      } else if (status === 'inactive') {
        query.$or = [
          { status: 'inactive' },
          { isApproved: true, status: { $ne: 'active' } }
        ]
      } else {
        query.status = status
      }
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ]
    }

    // Build sort criteria
    let sortCriteria: any = { createdAt: -1 } // default: recent
    
    switch (orderBy) {
      case 'name':
        sortCriteria = { name: 1 }
        break
      case 'orders':
        // Will be handled after aggregation
        break
      case 'spent':
        // Will be handled after aggregation
        break
      default:
        sortCriteria = { createdAt: -1 }
    }

    // Get customers with basic info
    const customers = await User.find(query)
      .select('-password -resetPasswordToken -resetPasswordExpires -emailVerificationToken')
      .sort(sortCriteria)
      .skip(skip)
      .limit(limit)
      .lean()

    // Get customer IDs for order statistics
    const customerIds = customers.map(c => c._id)

    // Calculate order statistics for each customer
    const orderStats = await Order.aggregate([
      {
        $match: {
          customer: { $in: customerIds },
          status: { $in: ['confirmed', 'shipped', 'delivered'] }
        }
      },
      {
        $group: {
          _id: '$customer',
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: '$total' },
          lastOrderDate: { $max: '$createdAt' }
        }
      },
      {
        $addFields: {
          averageOrderValue: {
            $cond: {
              if: { $gt: ['$totalOrders', 0] },
              then: { $divide: ['$totalSpent', '$totalOrders'] },
              else: 0
            }
          }
        }
      }
    ])

    // Create a map for quick lookup
    const statsMap = new Map()
    orderStats.forEach(stat => {
      statsMap.set(stat._id.toString(), {
        totalOrders: stat.totalOrders,
        totalSpent: stat.totalSpent,
        averageOrderValue: stat.averageOrderValue,
        lastOrderDate: stat.lastOrderDate
      })
    })

    // Combine customer data with statistics
    let clientsWithStats = customers.map(customer => ({
      _id: customer._id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      status: customer.status || 'active',
      isApproved: customer.isApproved !== false,
      address: customer.address,
      stats: statsMap.get((customer._id as any).toString()) || {
        totalOrders: 0,
        totalSpent: 0,
        averageOrderValue: 0,
        lastOrderDate: null
      },
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
      lastLogin: customer.lastLogin
    }))

    // Sort by orders or spent if requested
    if (orderBy === 'orders') {
      clientsWithStats.sort((a, b) => b.stats.totalOrders - a.stats.totalOrders)
    } else if (orderBy === 'spent') {
      clientsWithStats.sort((a, b) => b.stats.totalSpent - a.stats.totalSpent)
    }

    // Get overall statistics
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const [
      totalClients,
      activeClients,
      inactiveClients,
      newThisMonth,
      revenueStats
    ] = await Promise.all([
      User.countDocuments({ role: 'customer' }),
      User.countDocuments({ 
        role: 'customer', 
        isApproved: true, 
        status: 'active' 
      }),
      User.countDocuments({ 
        role: 'customer',
        $or: [
          { status: 'inactive' },
          { isApproved: false }
        ]
      }),
      User.countDocuments({ 
        role: 'customer',
        createdAt: { $gte: startOfMonth }
      }),
      Order.aggregate([
        {
          $match: {
            status: { $in: ['confirmed', 'shipped', 'delivered'] }
          }
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$total' },
            totalOrders: { $sum: 1 }
          }
        }
      ])
    ])

    const stats = {
      total: totalClients,
      active: activeClients,
      inactive: inactiveClients,
      newThisMonth: newThisMonth,
      totalRevenue: revenueStats[0]?.totalRevenue || 0,
      averageOrderValue: revenueStats[0]?.totalOrders > 0 
        ? revenueStats[0].totalRevenue / revenueStats[0].totalOrders 
        : 0
    }

    return NextResponse.json({
      clients: clientsWithStats,
      stats,
      pagination: {
        page,
        limit,
        total: totalClients,
        totalPages: Math.ceil(totalClients / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching clients:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    await connectToDatabase()

    const body = await request.json()
    const { clientId, action, ...data } = body

    if (!clientId || !action) {
      return NextResponse.json(
        { error: 'ID de cliente y acción son requeridos' },
        { status: 400 }
      )
    }

    const client = await User.findById(clientId)
    if (!client || client.role !== 'customer') {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      )
    }

    let updateData: any = {}
    let message = ''

    switch (action) {
      case 'approve':
        updateData.isApproved = true
        updateData.status = 'active'
        message = 'Cliente aprobado exitosamente'
        break

      case 'suspend':
        updateData.status = 'suspended'
        message = 'Cliente suspendido exitosamente'
        break

      case 'activate':
        updateData.status = 'active'
        message = 'Cliente activado exitosamente'
        break

      case 'send_message':
        // In a real implementation, this would integrate with an email service
        // For now, we'll just log the message and return success
        console.log(`Message to client ${client.email}:`, data.message)
        message = 'Mensaje enviado exitosamente'
        
        // Here you would typically:
        // 1. Send email using a service like SendGrid, Nodemailer, etc.
        // 2. Create a notification record in the database
        // 3. Log the communication for audit purposes
        
        return NextResponse.json({ message })

      default:
        return NextResponse.json(
          { error: 'Acción no válida' },
          { status: 400 }
        )
    }

    // Update client
    const updatedClient = await User.findByIdAndUpdate(
      clientId,
      { 
        ...updateData,
        updatedAt: new Date()
      },
      { new: true }
    ).select('-password -resetPasswordToken -resetPasswordExpires -emailVerificationToken')

    return NextResponse.json({
      message,
      client: updatedClient
    })

  } catch (error) {
    console.error('Error updating client:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
