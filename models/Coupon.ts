import mongoose, { Schema, Document } from 'mongoose'
import { COUPON_TYPES, COUPON_STATUS } from '@/constants'

export interface ICoupon extends Document {
  code: string
  name: string
  description: string
  type: string
  value: number
  minAmount?: number
  maxDiscount?: number
  startDate: Date
  endDate: Date
  isActive: boolean
  status: string
  usageLimit: number
  usedCount: number
  applicableProducts?: string[]
  excludedProducts?: string[]
  applicableCategories?: string[]
  excludedCategories?: string[]
  firstTimeOnly?: boolean
  createdBy: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
  isExpired: boolean
  canApplyToCart: (subtotal: number, productIds: string[], categories: string[]) => boolean
  calculateDiscount: (subtotal: number) => number
}

const CouponSchema = new Schema<ICoupon>({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    required: true,
    enum: Object.values(COUPON_TYPES),
    default: COUPON_TYPES.PERCENTAGE
  },
  value: {
    type: Number,
    required: true,
    min: 0
  },
  minAmount: {
    type: Number,
    min: 0
  },
  maxDiscount: {
    type: Number,
    min: 0
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  status: {
    type: String,
    enum: Object.values(COUPON_STATUS),
    default: COUPON_STATUS.ACTIVE
  },
  usageLimit: {
    type: Number,
    required: true,
    min: 1
  },
  usedCount: {
    type: Number,
    default: 0,
    min: 0
  },
  applicableProducts: [{
    type: String
  }],
  excludedProducts: [{
    type: String
  }],
  applicableCategories: [{
    type: String
  }],
  excludedCategories: [{
    type: String
  }],
  firstTimeOnly: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
})

// Virtual for checking if coupon is expired
CouponSchema.virtual('isExpired').get(function(this: ICoupon) {
  const now = new Date()
  return now > this.endDate
})

// Method to check if coupon can be applied to cart
CouponSchema.methods.canApplyToCart = function(
  this: ICoupon,
  subtotal: number,
  productIds: string[],
  categories: string[]
): boolean {
  const now = new Date()
  
  // Check if coupon is active and not expired
  if (!this.isActive || this.status !== COUPON_STATUS.ACTIVE || now < this.startDate || now > this.endDate) {
    return false
  }
  
  // Check usage limit
  if (this.usedCount >= this.usageLimit) {
    return false
  }
  
  // Check minimum amount
  if (this.minAmount && subtotal < this.minAmount) {
    return false
  }
  
  // Check excluded products
  if (this.excludedProducts && this.excludedProducts.length > 0) {
    const hasExcludedProducts = productIds.some(productId => 
      this.excludedProducts!.includes(productId)
    )
    if (hasExcludedProducts) return false
  }
  
  // Check excluded categories
  if (this.excludedCategories && this.excludedCategories.length > 0) {
    const hasExcludedCategories = categories.some(category => 
      this.excludedCategories!.includes(category)
    )
    if (hasExcludedCategories) return false
  }
  
  // Check applicable products
  if (this.applicableProducts && this.applicableProducts.length > 0) {
    const hasApplicableProducts = productIds.some(productId => 
      this.applicableProducts!.includes(productId)
    )
    if (!hasApplicableProducts) return false
  }
  
  // Check applicable categories
  if (this.applicableCategories && this.applicableCategories.length > 0) {
    const hasApplicableCategories = categories.some(category => 
      this.applicableCategories!.includes(category)
    )
    if (!hasApplicableCategories) return false
  }
  
  return true
}

// Method to calculate discount amount
CouponSchema.methods.calculateDiscount = function(this: ICoupon, subtotal: number): number {
  let discount = 0
  
  switch (this.type) {
    case COUPON_TYPES.PERCENTAGE:
      discount = subtotal * (this.value / 100)
      break
    case COUPON_TYPES.FIXED_AMOUNT:
      discount = Math.min(this.value, subtotal)
      break
    case COUPON_TYPES.FREE_SHIPPING:
      // This will be handled in shipping calculation
      discount = 0
      break
    case COUPON_TYPES.BUY_ONE_GET_ONE:
      // This will be handled in cart logic
      discount = 0
      break
    default:
      discount = 0
  }
  
  // Apply max discount limit
  if (this.maxDiscount) {
    discount = Math.min(discount, this.maxDiscount)
  }
  
  return discount
}

// Index for better performance
CouponSchema.index({ code: 1 })
CouponSchema.index({ isActive: 1, status: 1 })
CouponSchema.index({ startDate: 1, endDate: 1 })
CouponSchema.index({ usedCount: 1, usageLimit: 1 })

export default mongoose.models.Coupon || mongoose.model<ICoupon>('Coupon', CouponSchema)
