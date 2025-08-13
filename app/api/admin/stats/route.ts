import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import Product from '@/models/Product'
import Order from '@/models/Order'
import Notification from '@/models/Notification'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { USER_ROLES } from '@/constants'

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase()
    
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== USER_ROLES.ADMIN) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Get pending products count
    const pendingProducts = await Product.countDocuments({
      approvalStatus: 'pending'
    })

    // Get pending orders count
    const pendingOrders = await Order.countDocuments({
      status: 'pending'
    })

    // Get unread notifications count for admin
    const unreadNotifications = await Notification.countDocuments({
      userId: session.user.id,
      read: false
    })

    return NextResponse.json({
      pendingProducts,
      pendingOrders,
      unreadNotifications
    })

  } catch (error) {
    console.error('Error fetching admin stats:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
