import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import User from '@/models/User'
import Product from '@/models/Product'
import Order from '@/models/Order'
import { USER_ROLES } from '@/constants'
import { requireRole } from '@/lib/auth-middleware'

export async function GET(request: NextRequest) {
  try {
    const { user } = await requireRole(request, [USER_ROLES.ADMIN])
    await connectToDatabase()

    // Obtener estadísticas de usuarios
    const [
      totalUsers,
      totalClients,
      totalSuppliers,
      pendingSuppliers,
      approvedSuppliers
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: USER_ROLES.CLIENT }),
      User.countDocuments({ role: USER_ROLES.SUPPLIER }),
      User.countDocuments({ role: USER_ROLES.SUPPLIER, isApproved: false }),
      User.countDocuments({ role: USER_ROLES.SUPPLIER, isApproved: true })
    ])

    // Obtener estadísticas de productos
    const [
      totalProducts,
      pendingProducts,
      activeProducts,
      inactiveProducts
    ] = await Promise.all([
      Product.countDocuments(),
      Product.countDocuments({ approvalStatus: 'pending' }),
      Product.countDocuments({ approvalStatus: 'approved', status: 'active' }),
      Product.countDocuments({ status: 'inactive' })
    ])

    // Obtener estadísticas de pedidos
    const [
      totalOrders,
      pendingOrders,
      completedOrders,
      cancelledOrders
    ] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ status: 'pending' }),
      Order.countDocuments({ status: 'completed' }),
      Order.countDocuments({ status: 'cancelled' })
    ])

    // Obtener ingresos totales
    const revenueResult = await Order.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ])
    const totalRevenue = revenueResult[0]?.total || 0

    // Obtener productos recientes
    const recentProducts = await Product.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name supplierName approvalStatus createdAt')
      .lean()

    // Obtener proveedores pendientes
    const pendingSuppliersList = await User.find({
      role: USER_ROLES.SUPPLIER,
      isApproved: false
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email businessInfo createdAt')
      .lean()

    // Obtener pedidos recientes
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('orderNumber total status customerName createdAt')
      .lean()

    return NextResponse.json({
      users: {
        total: totalUsers,
        clients: totalClients,
        suppliers: totalSuppliers,
        pendingSuppliers,
        approvedSuppliers
      },
      products: {
        total: totalProducts,
        pending: pendingProducts,
        active: activeProducts,
        inactive: inactiveProducts
      },
      orders: {
        total: totalOrders,
        pending: pendingOrders,
        completed: completedOrders,
        cancelled: cancelledOrders
      },
      revenue: {
        total: totalRevenue
      },
      recentProducts,
      pendingSuppliersList,
      recentOrders
    })

  } catch (error) {
    console.error('Admin dashboard error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}