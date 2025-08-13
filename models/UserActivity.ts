import mongoose, { Schema, Document } from 'mongoose'

export interface IUserActivity extends Document {
  userId: mongoose.Types.ObjectId
  activityType: 'view' | 'purchase' | 'cart_add' | 'wishlist_add' | 'search' | 'review' | 'compare'
  productId?: mongoose.Types.ObjectId
  categoryId?: mongoose.Types.ObjectId
  searchQuery?: string
  metadata?: {
    duration?: number // For view activities
    quantity?: number // For purchase/cart activities
    rating?: number // For review activities
    price?: number // For purchase activities
    [key: string]: any
  }
  sessionId?: string
  ipAddress?: string
  userAgent?: string
  createdAt: Date
}

const UserActivitySchema = new Schema<IUserActivity>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  activityType: {
    type: String,
    enum: ['view', 'purchase', 'cart_add', 'wishlist_add', 'search', 'review', 'compare'],
    required: true,
    index: true
  },
  productId: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    index: true
  },
  categoryId: {
    type: Schema.Types.ObjectId,
    ref: 'Category',
    index: true
  },
  searchQuery: {
    type: String,
    trim: true,
    index: true
  },
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  },
  sessionId: {
    type: String,
    index: true
  },
  ipAddress: String,
  userAgent: String
}, {
  timestamps: { createdAt: true, updatedAt: false }
})

// Compound indexes for better query performance
UserActivitySchema.index({ userId: 1, activityType: 1, createdAt: -1 })
UserActivitySchema.index({ userId: 1, productId: 1, createdAt: -1 })
UserActivitySchema.index({ userId: 1, categoryId: 1, createdAt: -1 })

// TTL index to automatically delete old activities (keep for 1 year)
UserActivitySchema.index({ createdAt: 1 }, { expireAfterSeconds: 365 * 24 * 60 * 60 })

// Static method to log activity
UserActivitySchema.statics.logActivity = async function(activityData: {
  userId: string
  activityType: string
  productId?: string
  categoryId?: string
  searchQuery?: string
  metadata?: any
  sessionId?: string
  ipAddress?: string
  userAgent?: string
}) {
  try {
    await this.create(activityData)
  } catch (error) {
    console.error('Error logging user activity:', error)
    // Don't throw error to avoid breaking the main flow
  }
}

// Static method to get user preferences based on activity
UserActivitySchema.statics.getUserPreferences = async function(userId: string, days = 30) {
  const since = new Date()
  since.setDate(since.getDate() - days)

  const pipeline: any[] = [
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        createdAt: { $gte: since }
      }
    },
    {
      $lookup: {
        from: 'products',
        localField: 'productId',
        foreignField: '_id',
        as: 'product'
      }
    },
    {
      $unwind: { path: '$product', preserveNullAndEmptyArrays: true }
    },
    {
      $group: {
        _id: {
          activityType: '$activityType',
          category: '$product.category',
          subcategory: '$product.subcategory',
          brand: '$product.brand'
        },
        count: { $sum: 1 },
        totalValue: { $sum: { $ifNull: ['$metadata.price', 0] } },
        avgRating: { $avg: { $ifNull: ['$metadata.rating', null] } }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]

  return await this.aggregate(pipeline)
}

export default mongoose.models.UserActivity || mongoose.model<IUserActivity>('UserActivity', UserActivitySchema)
