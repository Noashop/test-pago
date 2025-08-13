import mongoose, { Schema, Document } from 'mongoose'

export interface IAnalytics extends Document {
  date: Date
  type: 'daily' | 'weekly' | 'monthly'
  metrics: {
    // Sales metrics
    totalSales: number
    totalRevenue: number
    totalOrders: number
    averageOrderValue: number
    
    // Product metrics
    totalProducts: number
    activeProducts: number
    pendingProducts: number
    topSellingProducts: Array<{
      productId: mongoose.Types.ObjectId
      name: string
      salesCount: number
      revenue: number
    }>
    
    // User metrics
    totalUsers: number
    newUsers: number
    activeUsers: number
    customerRetentionRate: number
    
    // Supplier metrics
    totalSuppliers: number
    activeSuppliers: number
    newSuppliers: number
    topSuppliers: Array<{
      supplierId: mongoose.Types.ObjectId
      name: string
      salesCount: number
      revenue: number
      productCount: number
    }>
    
    // Category metrics
    categoryPerformance: Array<{
      category: string
      salesCount: number
      revenue: number
      productCount: number
    }>
    
    // Geographic metrics
    salesByRegion: Array<{
      region: string
      salesCount: number
      revenue: number
    }>
    
    // Traffic metrics
    pageViews: number
    uniqueVisitors: number
    bounceRate: number
    conversionRate: number
    
    // Review metrics
    totalReviews: number
    averageRating: number
    reviewsByRating: {
      5: number
      4: number
      3: number
      2: number
      1: number
    }
  }
  createdAt: Date
  updatedAt: Date
}

const AnalyticsSchema = new Schema<IAnalytics>({
  date: {
    type: Date,
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['daily', 'weekly', 'monthly'],
    required: true,
    index: true
  },
  metrics: {
    // Sales metrics
    totalSales: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
    totalOrders: { type: Number, default: 0 },
    averageOrderValue: { type: Number, default: 0 },
    
    // Product metrics
    totalProducts: { type: Number, default: 0 },
    activeProducts: { type: Number, default: 0 },
    pendingProducts: { type: Number, default: 0 },
    topSellingProducts: [{
      productId: { type: Schema.Types.ObjectId, ref: 'Product' },
      name: String,
      salesCount: Number,
      revenue: Number
    }],
    
    // User metrics
    totalUsers: { type: Number, default: 0 },
    newUsers: { type: Number, default: 0 },
    activeUsers: { type: Number, default: 0 },
    customerRetentionRate: { type: Number, default: 0 },
    
    // Supplier metrics
    totalSuppliers: { type: Number, default: 0 },
    activeSuppliers: { type: Number, default: 0 },
    newSuppliers: { type: Number, default: 0 },
    topSuppliers: [{
      supplierId: { type: Schema.Types.ObjectId, ref: 'User' },
      name: String,
      salesCount: Number,
      revenue: Number,
      productCount: Number
    }],
    
    // Category metrics
    categoryPerformance: [{
      category: String,
      salesCount: Number,
      revenue: Number,
      productCount: Number
    }],
    
    // Geographic metrics
    salesByRegion: [{
      region: String,
      salesCount: Number,
      revenue: Number
    }],
    
    // Traffic metrics
    pageViews: { type: Number, default: 0 },
    uniqueVisitors: { type: Number, default: 0 },
    bounceRate: { type: Number, default: 0 },
    conversionRate: { type: Number, default: 0 },
    
    // Review metrics
    totalReviews: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    reviewsByRating: {
      5: { type: Number, default: 0 },
      4: { type: Number, default: 0 },
      3: { type: Number, default: 0 },
      2: { type: Number, default: 0 },
      1: { type: Number, default: 0 }
    }
  }
}, {
  timestamps: true
})

// Compound indexes
AnalyticsSchema.index({ date: 1, type: 1 }, { unique: true })
AnalyticsSchema.index({ type: 1, date: -1 })

// Static method to generate analytics for a specific date and type
AnalyticsSchema.statics.generateAnalytics = async function(date: Date, type: 'daily' | 'weekly' | 'monthly') {
  const startDate = new Date(date)
  const endDate = new Date(date)
  
  // Adjust date range based on type
  switch (type) {
    case 'weekly':
      startDate.setDate(startDate.getDate() - 6)
      break
    case 'monthly':
      startDate.setDate(1)
      endDate.setMonth(endDate.getMonth() + 1)
      endDate.setDate(0)
      break
  }
  
  // Set time to start/end of day
  startDate.setHours(0, 0, 0, 0)
  endDate.setHours(23, 59, 59, 999)

  const Order = mongoose.model('Order')
  const Product = mongoose.model('Product')
  const User = mongoose.model('User')
  const Review = mongoose.model('Review')
  const UserActivity = mongoose.model('UserActivity')

  // Sales metrics
  const salesData = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate },
        status: { $in: ['completed', 'shipped', 'delivered'] }
      }
    },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalRevenue: { $sum: '$total' },
        totalSales: { $sum: { $sum: '$items.quantity' } }
      }
    }
  ])

  const salesMetrics = salesData[0] || { totalOrders: 0, totalRevenue: 0, totalSales: 0 }
  salesMetrics.averageOrderValue = salesMetrics.totalOrders > 0 ? salesMetrics.totalRevenue / salesMetrics.totalOrders : 0

  // Product metrics
  const productMetrics = {
    totalProducts: await Product.countDocuments(),
    activeProducts: await Product.countDocuments({ status: 'active', approvalStatus: 'approved' }),
    pendingProducts: await Product.countDocuments({ approvalStatus: 'pending' })
  }

  // Top selling products
  const topSellingProducts = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate },
        status: { $in: ['completed', 'shipped', 'delivered'] }
      }
    },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.productId',
        salesCount: { $sum: '$items.quantity' },
        revenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } }
      }
    },
    {
      $lookup: {
        from: 'products',
        localField: '_id',
        foreignField: '_id',
        as: 'product'
      }
    },
    { $unwind: '$product' },
    {
      $project: {
        productId: '$_id',
        name: '$product.name',
        salesCount: 1,
        revenue: 1
      }
    },
    { $sort: { salesCount: -1 } },
    { $limit: 10 }
  ])

  // User metrics
  const userMetrics = {
    totalUsers: await User.countDocuments(),
    newUsers: await User.countDocuments({
      createdAt: { $gte: startDate, $lte: endDate }
    }),
    activeUsers: await UserActivity.distinct('userId', {
      createdAt: { $gte: startDate, $lte: endDate }
    }).then((users: any) => users.length)
  }

  // Calculate retention rate (simplified)
  const previousPeriodStart = new Date(startDate)
  const previousPeriodEnd = new Date(endDate)
  previousPeriodStart.setDate(previousPeriodStart.getDate() - (endDate.getDate() - startDate.getDate() + 1))
  previousPeriodEnd.setDate(previousPeriodEnd.getDate() - (endDate.getDate() - startDate.getDate() + 1))

  const currentPeriodUsers = await UserActivity.distinct('userId', {
    createdAt: { $gte: startDate, $lte: endDate }
  })
  const previousPeriodUsers = await UserActivity.distinct('userId', {
    createdAt: { $gte: previousPeriodStart, $lte: previousPeriodEnd }
  })

  const retainedUsers = currentPeriodUsers.filter((userId: any) => 
    previousPeriodUsers.includes(userId)
  ).length

  const customerRetentionRate = previousPeriodUsers.length > 0 ? 
    (retainedUsers / previousPeriodUsers.length) * 100 : 0

  // Supplier metrics
  const supplierMetrics = {
    totalSuppliers: await User.countDocuments({ role: 'supplier' }),
    activeSuppliers: await User.countDocuments({ 
      role: 'supplier', 
      approvalStatus: 'approved' 
    }),
    newSuppliers: await User.countDocuments({
      role: 'supplier',
      createdAt: { $gte: startDate, $lte: endDate }
    })
  }

  // Top suppliers
  const topSuppliers = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate },
        status: { $in: ['completed', 'shipped', 'delivered'] }
      }
    },
    { $unwind: '$items' },
    {
      $lookup: {
        from: 'products',
        localField: 'items.productId',
        foreignField: '_id',
        as: 'product'
      }
    },
    { $unwind: '$product' },
    {
      $group: {
        _id: '$product.supplierId',
        salesCount: { $sum: '$items.quantity' },
        revenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'supplier'
      }
    },
    { $unwind: '$supplier' },
    {
      $lookup: {
        from: 'products',
        localField: '_id',
        foreignField: 'supplierId',
        as: 'products'
      }
    },
    {
      $project: {
        supplierId: '$_id',
        name: '$supplier.name',
        salesCount: 1,
        revenue: 1,
        productCount: { $size: '$products' }
      }
    },
    { $sort: { revenue: -1 } },
    { $limit: 10 }
  ])

  // Category performance
  const categoryPerformance = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate },
        status: { $in: ['completed', 'shipped', 'delivered'] }
      }
    },
    { $unwind: '$items' },
    {
      $lookup: {
        from: 'products',
        localField: 'items.productId',
        foreignField: '_id',
        as: 'product'
      }
    },
    { $unwind: '$product' },
    {
      $group: {
        _id: '$product.category',
        salesCount: { $sum: '$items.quantity' },
        revenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } }
      }
    },
    {
      $lookup: {
        from: 'products',
        localField: '_id',
        foreignField: 'category',
        as: 'products'
      }
    },
    {
      $project: {
        category: '$_id',
        salesCount: 1,
        revenue: 1,
        productCount: { $size: '$products' }
      }
    },
    { $sort: { revenue: -1 } }
  ])

  // Review metrics
  const reviewData = await Review.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate },
        status: 'approved'
      }
    },
    {
      $group: {
        _id: null,
        totalReviews: { $sum: 1 },
        averageRating: { $avg: '$rating' },
        ratings: { $push: '$rating' }
      }
    }
  ])

  const reviewMetrics = reviewData[0] || { totalReviews: 0, averageRating: 0, ratings: [] }
  const reviewsByRating = {
    5: reviewMetrics.ratings?.filter((r: number) => r === 5).length || 0,
    4: reviewMetrics.ratings?.filter((r: number) => r === 4).length || 0,
    3: reviewMetrics.ratings?.filter((r: number) => r === 3).length || 0,
    2: reviewMetrics.ratings?.filter((r: number) => r === 2).length || 0,
    1: reviewMetrics.ratings?.filter((r: number) => r === 1).length || 0
  }

  // Traffic metrics (simplified - would need integration with analytics service)
  const trafficMetrics = {
    pageViews: await UserActivity.countDocuments({
      activityType: 'view',
      createdAt: { $gte: startDate, $lte: endDate }
    }),
    uniqueVisitors: await UserActivity.distinct('userId', {
      createdAt: { $gte: startDate, $lte: endDate }
    }).then((users: any) => users.length),
    bounceRate: 0, // Would need session tracking
    conversionRate: salesMetrics.totalOrders > 0 && userMetrics.activeUsers > 0 ? 
      (salesMetrics.totalOrders / userMetrics.activeUsers) * 100 : 0
  }

  // Create or update analytics record
  const analytics = await this.findOneAndUpdate(
    { date, type },
    {
      date,
      type,
      metrics: {
        ...salesMetrics,
        ...productMetrics,
        topSellingProducts,
        ...userMetrics,
        customerRetentionRate,
        ...supplierMetrics,
        topSuppliers,
        categoryPerformance,
        salesByRegion: [], // Would need address data from orders
        ...trafficMetrics,
        totalReviews: reviewMetrics.totalReviews,
        averageRating: reviewMetrics.averageRating || 0,
        reviewsByRating
      }
    },
    { upsert: true, new: true }
  )

  return analytics
}

export default mongoose.models.Analytics || mongoose.model<IAnalytics>('Analytics', AnalyticsSchema)
