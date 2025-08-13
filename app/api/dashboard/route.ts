import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import Product from '@/models/Product'
import Order from '@/models/Order'
import { requireRole } from '@/lib/auth-middleware'
import { USER_ROLES } from '@/constants'

export async function GET(request: NextRequest) {
  try {
    const { user } = await requireRole(request, [USER_ROLES.ADMIN, USER_ROLES.SUPPLIER, USER_ROLES.CLIENT])
    await connectToDatabase()

    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role')

    if (role === 'supplier' || user.role === USER_ROLES.SUPPLIER) {
      // Dashboard para proveedores
      const [
        totalProducts,
        pendingProducts,
        approvedProducts,
        totalOrders,
        pendingOrders,
        totalRevenue
      ] = await Promise.all([
        Product.countDocuments({ supplierId: user.id }),
        Product.countDocuments({ supplierId: user.id, approvalStatus: 'pending' }),
        Product.countDocuments({ supplierId: user.id, approvalStatus: 'approved' }),
        Order.countDocuments({ 'items.supplier': user.id }),
        Order.countDocuments({ 'items.supplier': user.id, status: 'pending' }),
        Order.aggregate([
          { $match: { 'items.supplier': user.id, status: 'completed' } },
          { $group: { _id: null, total: { $sum: '$total' } } }
        ])
      ])

      const revenue = totalRevenue[0]?.total || 0

      // Obtener pedidos recientes del proveedor
      const recentOrders = await Order.find({ 'items.supplier': user.id })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('orderNumber total status customerName createdAt')
        .lean()

      return NextResponse.json({
        totalProducts,
        pendingProducts,
        approvedProducts,
        totalOrders,
        pendingOrders,
        totalRevenue: revenue,
        recentOrders,
        productGrowth: 0, // TODO: Implementar cálculo de crecimiento
        orderGrowth: 0,   // TODO: Implementar cálculo de crecimiento
        revenueGrowth: 0  // TODO: Implementar cálculo de crecimiento
      })

    } else {
      // Dashboard para clientes
      const [
        totalOrders,
        pendingOrders,
        completedOrders,
        totalSpent
      ] = await Promise.all([
        Order.countDocuments({ customer: user.id }),
        Order.countDocuments({ customer: user.id, status: 'pending' }),
        Order.countDocuments({ customer: user.id, status: 'completed' }),
        Order.aggregate([
          { $match: { customer: user.id, status: 'completed' } },
          { $group: { _id: null, total: { $sum: '$total' } } }
        ])
      ])

      const spent = totalSpent[0]?.total || 0

      // Obtener pedidos recientes del cliente
      const recentOrders = await Order.find({ customer: user.id })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('orderNumber total status createdAt')
        .lean()

      return NextResponse.json({
        totalOrders,
        pendingOrders,
        completedOrders,
        totalSpent: spent,
        recentOrders
      })
    }

  } catch (error) {
    console.error('Dashboard error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
