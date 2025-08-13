import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import Product from '@/models/Product'
import Order from '@/models/Order'
import User from '@/models/User'

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase()

    // Obtener estadísticas generales
    const [
      totalProducts,
      totalOrders,
      totalRevenue,
      totalCustomers,
      totalSuppliers
    ] = await Promise.all([
      Product.countDocuments({ approvalStatus: 'approved', status: 'active' }),
      Order.countDocuments({ status: 'completed' }),
      Order.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]),
      User.countDocuments({ role: 'client' }),
      User.countDocuments({ role: 'supplier', isApproved: true })
    ])

    const revenue = totalRevenue[0]?.total || 0

    // Obtener productos más vendidos
    const topProducts = await Product.find({ approvalStatus: 'approved', status: 'active' })
      .sort({ salesCount: -1 })
      .limit(5)
      .select('name images salePrice salesCount')
      .lean()

    // Obtener productos más vistos
    const mostViewedProducts = await Product.find({ approvalStatus: 'approved', status: 'active' })
      .sort({ viewCount: -1 })
      .limit(5)
      .select('name images salePrice viewCount')
      .lean()

    return NextResponse.json({
      stats: {
        totalProducts,
        totalOrders,
        totalRevenue: revenue,
        totalCustomers,
        totalSuppliers
      },
      topProducts,
      mostViewedProducts
    })

  } catch (error) {
    console.error('Get stats error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
} 