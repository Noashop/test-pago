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
      const reportType = searchParams.get('type')
      const startDate = searchParams.get('startDate')
      const endDate = searchParams.get('endDate')

      if (!reportType) {
        return NextResponse.json(
          { error: 'Tipo de reporte es requerido' },
          { status: 400 }
        )
      }

      const start = startDate ? new Date(startDate) : new Date(new Date().setMonth(new Date().getMonth() - 1))
      const end = endDate ? new Date(endDate) : new Date()

      let reportData = {}

      switch (reportType) {
        case 'sales':
          reportData = await generateSalesReport(start, end)
          break
        case 'products':
          reportData = await generateProductsReport(start, end)
          break
        case 'suppliers':
          reportData = await generateSuppliersReport(start, end)
          break
        case 'customers':
          reportData = await generateCustomersReport(start, end)
          break
        default:
          return NextResponse.json(
            { error: 'Tipo de reporte no válido' },
            { status: 400 }
          )
      }

      return NextResponse.json({
        reportType,
        startDate: start,
        endDate: end,
        data: reportData
      })

    } catch (error) {
      console.error('Get admin reports error:', error)
      return NextResponse.json(
        { error: 'Error interno del servidor' },
        { status: 500 }
      )
    }
  }

async function generateSalesReport(startDate: Date, endDate: Date) {
  const salesData = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate },
        status: 'completed'
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        },
        totalSales: { $sum: '$total' },
        orderCount: { $sum: 1 },
        averageOrderValue: { $avg: '$total' }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
  ])

  const totalRevenue = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate },
        status: 'completed'
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$total' },
        count: { $sum: 1 }
      }
    }
  ])

  return {
    dailySales: salesData,
    totalRevenue: totalRevenue[0]?.total || 0,
    totalOrders: totalRevenue[0]?.count || 0,
    averageOrderValue: totalRevenue[0] ? totalRevenue[0].total / totalRevenue[0].count : 0
  }
}

async function generateProductsReport(startDate: Date, endDate: Date) {
  const topProducts = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate },
        status: 'completed'
      }
    },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.productId',
        totalSold: { $sum: '$items.quantity' },
        totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
      }
    },
    { $sort: { totalSold: -1 } },
    { $limit: 10 }
  ])

  const productStats = await Product.aggregate([
    {
      $group: {
        _id: null,
        totalProducts: { $sum: 1 },
        activeProducts: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
        pendingProducts: { $sum: { $cond: [{ $eq: ['$approvalStatus', 'pending'] }, 1, 0] } }
      }
    }
  ])

  return {
    topProducts,
    productStats: productStats[0] || {
      totalProducts: 0,
      activeProducts: 0,
      pendingProducts: 0
    }
  }
}

async function generateSuppliersReport(startDate: Date, endDate: Date) {
  const topSuppliers = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate },
        status: 'completed'
      }
    },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.supplierId',
        totalSales: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
        orderCount: { $sum: 1 }
      }
    },
    { $sort: { totalSales: -1 } },
    { $limit: 10 }
  ])

  const supplierStats = await User.aggregate([
    { $match: { role: 'supplier' } },
    {
      $group: {
        _id: null,
        totalSuppliers: { $sum: 1 },
        approvedSuppliers: { $sum: { $cond: ['$isApproved', 1, 0] } },
        pendingSuppliers: { $sum: { $cond: [{ $eq: ['$isApproved', false] }, 1, 0] } }
      }
    }
  ])

  return {
    topSuppliers,
    supplierStats: supplierStats[0] || {
      totalSuppliers: 0,
      approvedSuppliers: 0,
      pendingSuppliers: 0
    }
  }
}

async function generateCustomersReport(startDate: Date, endDate: Date) {
  const topCustomers = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate },
        status: 'completed'
      }
    },
    {
      $group: {
        _id: '$userId',
        totalSpent: { $sum: '$total' },
        orderCount: { $sum: 1 },
        averageOrderValue: { $avg: '$total' }
      }
    },
    { $sort: { totalSpent: -1 } },
    { $limit: 10 }
  ])

  const customerStats = await User.aggregate([
    { $match: { role: 'client' } },
    {
      $group: {
        _id: null,
        totalCustomers: { $sum: 1 },
        activeCustomers: { $sum: { $cond: ['$isActive', 1, 0] } }
      }
    }
  ])

  return {
    topCustomers,
    customerStats: customerStats[0] || {
      totalCustomers: 0,
      activeCustomers: 0
    }
  }
}