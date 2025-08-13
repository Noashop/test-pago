import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import Order from '@/models/Order'
import Product from '@/models/Product'
import User from '@/models/User'
import { requireRole } from '@/lib/auth-middleware'
import { USER_ROLES } from '@/constants'

export async function GET(request: NextRequest) {
  try {
    const { user } = await requireRole(request, [USER_ROLES.ADMIN])
    await connectToDatabase()

      const { searchParams } = new URL(request.url)
      const period = searchParams.get('period') || '30' // días

      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - parseInt(period))

      // Métricas de pedidos
      const orderMetrics = await Order.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            totalRevenue: { $sum: '$total' },
            avgOrderValue: { $avg: '$total' },
            completedOrders: {
              $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
            },
            cancelledOrders: {
              $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
            }
          }
        }
      ])

      // Métricas de productos
      const productMetrics = await Product.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: null,
            totalProducts: { $sum: 1 },
            approvedProducts: {
              $sum: { $cond: [{ $eq: ['$approvalStatus', 'approved'] }, 1, 0] }
            },
            pendingProducts: {
              $sum: { $cond: [{ $eq: ['$approvalStatus', 'pending'] }, 1, 0] }
            },
            avgRating: { $avg: '$rating' }
          }
        }
      ])

      // Métricas de usuarios
      const userMetrics = await User.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: '$role',
            count: { $sum: 1 }
          }
        }
      ])

      // Conversión de pedidos por día
      const dailyOrders = await Order.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
              day: { $dayOfMonth: '$createdAt' }
            },
            orders: { $sum: 1 },
            revenue: { $sum: '$total' }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
      ])

      // Productos más vendidos
      const topProducts = await Product.aggregate([
        { $match: { approvalStatus: 'approved', status: 'active' } },
        { $sort: { salesCount: -1 } },
        { $limit: 10 },
        {
          $project: {
            name: 1,
            salesCount: 1,
            viewCount: 1,
            rating: 1
          }
        }
      ])

      const metrics = {
        period: `${period} días`,
        startDate,
        endDate,
        orders: orderMetrics[0] || {
          totalOrders: 0,
          totalRevenue: 0,
          avgOrderValue: 0,
          completedOrders: 0,
          cancelledOrders: 0
        },
        products: productMetrics[0] || {
          totalProducts: 0,
          approvedProducts: 0,
          pendingProducts: 0,
          avgRating: 0
        },
        users: userMetrics.reduce((acc: any, user: any) => {
          acc[user._id] = user.count
          return acc
        }, {}),
        dailyOrders,
        topProducts
      }

      return NextResponse.json(metrics)

    } catch (error) {
      console.error('Get performance metrics error:', error)
      return NextResponse.json(
        { error: 'Error interno del servidor' },
        { status: 500 }
      )
    }
}