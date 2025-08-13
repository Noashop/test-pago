import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import Product from '@/models/Product'
import Order from '@/models/Order'
import { requireApprovedSupplier } from '@/lib/auth-middleware'

// GET /api/supplier/stats - Get supplier statistics
export async function GET(request: NextRequest) {
  try {
    const { user } = await requireApprovedSupplier(request)
    await connectToDatabase()

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '30' // days

    const days = parseInt(period)
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Get supplier's products
    const [
      totalProducts,
      approvedProducts,
      pendingProducts,
      totalOrders,
      deliveredOrders,
      revenueAgg,
      recentOrders
    ] = await Promise.all([
      Product.countDocuments({ supplierId: user.id }),
      Product.countDocuments({ supplierId: user.id, approvalStatus: 'approved' }),
      Product.countDocuments({ supplierId: user.id, approvalStatus: 'pending' }),
      Order.countDocuments({ 'items.supplier': user.id }),
      Order.countDocuments({ 'items.supplier': user.id, status: 'delivered' }),
      Order.aggregate([
        { $match: { 'items.supplier': user.id, status: 'delivered' } },
        { $unwind: '$items' },
        { $match: { 'items.supplier': user.id } },
        { $group: { _id: null, total: { $sum: { $multiply: ['$items.price', '$items.quantity'] } } } }
      ]),
      Order.find({ 'items.supplier': user.id })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('orderNumber total status createdAt customer')
        .populate('customer', 'name email')
        .lean()
    ])

    const revenue = revenueAgg[0]?.total || 0

    // Calculate growth metrics
    const previousStartDate = new Date(startDate)
    previousStartDate.setDate(previousStartDate.getDate() - days)

    const [
      currentPeriodOrders,
      previousPeriodOrders,
      currentPeriodRevenue,
      previousPeriodRevenue
    ] = await Promise.all([
      Order.countDocuments({
        'items.supplier': user.id,
        createdAt: { $gte: startDate }
      }),
      Order.countDocuments({
        'items.supplier': user.id,
        createdAt: { $gte: previousStartDate, $lt: startDate }
      }),
      Order.aggregate([
        { $match: { 'items.supplier': user.id, status: 'delivered', createdAt: { $gte: startDate } } },
        { $unwind: '$items' },
        { $match: { 'items.supplier': user.id } },
        { $group: { _id: null, total: { $sum: { $multiply: ['$items.price', '$items.quantity'] } } } }
      ]),
      Order.aggregate([
        { $match: { 'items.supplier': user.id, status: 'delivered', createdAt: { $gte: previousStartDate, $lt: startDate } } },
        { $unwind: '$items' },
        { $match: { 'items.supplier': user.id } },
        { $group: { _id: null, total: { $sum: { $multiply: ['$items.price', '$items.quantity'] } } } }
      ])
    ])

    const currentRevenue = currentPeriodRevenue[0]?.total || 0
    const previousRevenue = previousPeriodRevenue[0]?.total || 0

    const orderGrowth = previousPeriodOrders > 0 ? 
      ((currentPeriodOrders - previousPeriodOrders) / previousPeriodOrders * 100).toFixed(1) : 0
    const revenueGrowth = previousRevenue > 0 ? 
      ((currentRevenue - previousRevenue) / previousRevenue * 100).toFixed(1) : 0

    return NextResponse.json({
      overview: {
        totalProducts,
        approvedProducts,
        pendingProducts,
        totalOrders,
        completedOrders: deliveredOrders,
        totalRevenue: revenue
      },
      growth: {
        orderGrowth: parseFloat(orderGrowth.toString()),
        revenueGrowth: parseFloat(revenueGrowth.toString())
      },
      recentOrders,
      period: days
    })

  } catch (error) {
    console.error('Get supplier stats error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
} 