import mongoose, { Schema, Document } from 'mongoose'

export interface IReview extends Document {
  productId: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  orderId?: mongoose.Types.ObjectId
  user: {
    name: string
    email: string
    avatar?: string
  }
  rating: number
  title: string
  comment: string
  helpful: number
  notHelpful: number
  helpfulVotes: mongoose.Types.ObjectId[]
  notHelpfulVotes: mongoose.Types.ObjectId[]
  verified: boolean
  status: 'pending' | 'approved' | 'rejected'
  moderationReason?: string
  images?: string[]
  pros?: string[]
  cons?: string[]
  wouldRecommend: boolean
  createdAt: Date
  updatedAt: Date
}

const ReviewSchema = new Schema<IReview>({
  productId: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
    index: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  orderId: {
    type: Schema.Types.ObjectId,
    ref: 'Order',
    required: false
  },
  user: {
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    avatar: {
      type: String,
      required: false
    }
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  comment: {
    type: String,
    required: true,
    trim: true,
    minlength: 10,
    maxlength: 1000
  },
  helpful: {
    type: Number,
    default: 0,
    min: 0
  },
  notHelpful: {
    type: Number,
    default: 0,
    min: 0
  },
  helpfulVotes: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  notHelpfulVotes: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  verified: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'approved' // Auto-approve for now, can be changed to 'pending' for moderation
  },
  moderationReason: {
    type: String,
    trim: true
  },
  images: [{
    type: String
  }],
  pros: [{
    type: String,
    trim: true,
    maxlength: 100
  }],
  cons: [{
    type: String,
    trim: true,
    maxlength: 100
  }],
  wouldRecommend: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
})

// Indexes for better performance
ReviewSchema.index({ productId: 1, createdAt: -1 })
ReviewSchema.index({ userId: 1, createdAt: -1 })
ReviewSchema.index({ rating: 1 })
ReviewSchema.index({ status: 1 })
ReviewSchema.index({ verified: 1 })

// Compound index to prevent duplicate reviews from same user for same product
ReviewSchema.index({ productId: 1, userId: 1 }, { unique: true })

// Virtual for helpful percentage
ReviewSchema.virtual('helpfulPercentage').get(function() {
  const total = this.helpful + this.notHelpful
  return total > 0 ? Math.round((this.helpful / total) * 100) : 0
})

// Static method to get product rating summary
ReviewSchema.statics.getProductRatingSummary = async function(productId: string) {
  const pipeline = [
    { $match: { productId: new mongoose.Types.ObjectId(productId), status: 'approved' } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
        ratingDistribution: {
          $push: '$rating'
        }
      }
    },
    {
      $addFields: {
        ratingCounts: {
          5: { $size: { $filter: { input: '$ratingDistribution', cond: { $eq: ['$$this', 5] } } } },
          4: { $size: { $filter: { input: '$ratingDistribution', cond: { $eq: ['$$this', 4] } } } },
          3: { $size: { $filter: { input: '$ratingDistribution', cond: { $eq: ['$$this', 3] } } } },
          2: { $size: { $filter: { input: '$ratingDistribution', cond: { $eq: ['$$this', 2] } } } },
          1: { $size: { $filter: { input: '$ratingDistribution', cond: { $eq: ['$$this', 1] } } } }
        }
      }
    }
  ]

  const result = await this.aggregate(pipeline)
  return result[0] || {
    averageRating: 0,
    totalReviews: 0,
    ratingCounts: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  }
}

// Static method to check if user can review product
ReviewSchema.statics.canUserReview = async function(userId: string, productId: string) {
  // Check if user already reviewed this product
  const existingReview = await this.findOne({ userId, productId })
  if (existingReview) {
    return { canReview: false, reason: 'Ya has reseñado este producto' }
  }

  // Check if user has purchased this product (optional check)
  // This would require checking the Order model
  // For now, we'll allow any authenticated user to review

  return { canReview: true }
}

// Method to update product rating when review is added/updated
ReviewSchema.post('save', async function() {
  const Product = mongoose.model('Product')
  const summary = await (this.constructor as any).getProductRatingSummary(this.productId)
  
  await Product.findByIdAndUpdate(this.productId, {
    rating: Math.round(summary.averageRating * 10) / 10, // Round to 1 decimal
    reviewCount: summary.totalReviews
  })
})

// Method to update product rating when review is deleted
ReviewSchema.post('findOneAndDelete', async function(doc) {
  if (doc) {
    const Product = mongoose.model('Product')
    const summary = await (doc.constructor as any).getProductRatingSummary(doc.productId)
    
    await Product.findByIdAndUpdate(doc.productId, {
      rating: Math.round(summary.averageRating * 10) / 10,
      reviewCount: summary.totalReviews
    })
  }
})

export default mongoose.models.Review || mongoose.model<IReview>('Review', ReviewSchema)
