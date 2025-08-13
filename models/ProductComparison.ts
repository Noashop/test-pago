import mongoose, { Schema, Document } from 'mongoose'

export interface IProductComparison extends Document {
  userId: mongoose.Types.ObjectId
  products: mongoose.Types.ObjectId[]
  name?: string
  isPublic: boolean
  sharedWith: mongoose.Types.ObjectId[]
  createdAt: Date
  updatedAt: Date
}

const ProductComparisonSchema = new Schema<IProductComparison>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  products: [{
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  }],
  name: {
    type: String,
    trim: true,
    maxlength: 100,
    default: function() {
      return `Comparación ${new Date().toLocaleDateString()}`
    }
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  sharedWith: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
})

// Indexes
ProductComparisonSchema.index({ userId: 1, createdAt: -1 })
ProductComparisonSchema.index({ isPublic: 1 })

// Validation: Maximum 4 products per comparison
ProductComparisonSchema.pre('save', function(next) {
  if (this.products.length > 4) {
    return next(new Error('No se pueden comparar más de 4 productos a la vez'))
  }
  if (this.products.length < 2) {
    return next(new Error('Se necesitan al menos 2 productos para comparar'))
  }
  next()
})

// Static method to get comparison with populated products
ProductComparisonSchema.statics.getComparisonWithProducts = async function(comparisonId: string, userId?: string) {
  const query: any = { _id: comparisonId }
  
  // If userId provided, check access permissions
  if (userId) {
    query.$or = [
      { userId },
      { isPublic: true },
      { sharedWith: userId }
    ]
  } else {
    query.isPublic = true
  }

  return await this.findOne(query)
    .populate({
      path: 'products',
      select: 'name images salePrice costPrice recommendedRetailPrice rating reviewCount category subcategory brand specificFields stock warranty',
      match: { status: 'active', approvalStatus: 'approved' }
    })
    .populate('userId', 'name email')
}

export default mongoose.models.ProductComparison || mongoose.model<IProductComparison>('ProductComparison', ProductComparisonSchema)
