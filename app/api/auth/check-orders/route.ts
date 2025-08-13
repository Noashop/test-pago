import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectToDatabase } from '@/lib/mongodb'
import Order from '@/models/Order'
import { ORDER_STATUS } from '@/constants'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    await connectToDatabase()

    // Buscar órdenes en proceso del cliente
    const ordersInProcess = await Order.find({
      customer: session.user.id,
      status: {
        $in: [
          ORDER_STATUS.PENDING,
          ORDER_STATUS.CONFIRMED,
          ORDER_STATUS.PROCESSING,
          ORDER_STATUS.SHIPPED
        ]
      }
    }).countDocuments()

    return NextResponse.json({
      hasOrdersInProcess: ordersInProcess > 0,
      ordersCount: ordersInProcess
    })

  } catch (error) {
    console.error('Error checking orders:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
} 