import mongoose, { Schema, Document } from 'mongoose'

export interface IAffiliate extends Document {
  userId: mongoose.Types.ObjectId
  affiliateCode: string
  status: 'active' | 'inactive' | 'suspended'
  tier: 'bronze' | 'silver' | 'gold' | 'platinum'
  
  // Commission structure
  commissionRate: number // Percentage
  bonusCommissionRate?: number // For special promotions
  
  // Statistics
  stats: {
    totalReferrals: number
    activeReferrals: number
    totalCommissions: number
    paidCommissions: number
    pendingCommissions: number
    totalSales: number
    conversionRate: number
    clickCount: number
  }
  
  // Payment info
  paymentInfo: {
    method: 'bank_transfer' | 'paypal' | 'crypto' | 'store_credit'
    bankAccount?: {
      accountNumber: string
      bankName: string
      accountHolder: string
      routingNumber?: string
    }
    paypalEmail?: string
    cryptoWallet?: {
      address: string
      currency: string
    }
  }
  
  // Settings
  settings: {
    autoWithdraw: boolean
    minimumPayout: number
    emailNotifications: boolean
    marketingMaterials: boolean
  }
  
  // Referral link tracking
  referralLinks: Array<{
    url: string
    productId?: mongoose.Types.ObjectId
    categoryId?: mongoose.Types.ObjectId
    campaignName?: string
    clicks: number
    conversions: number
    createdAt: Date
  }>
  
  createdAt: Date
  updatedAt: Date
}

const AffiliateSchema = new Schema<IAffiliate>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  affiliateCode: {
    type: String,
    required: true,
    unique: true,
    index: true,
    uppercase: true,
    minlength: 6,
    maxlength: 12
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active',
    index: true
  },
  tier: {
    type: String,
    enum: ['bronze', 'silver', 'gold', 'platinum'],
    default: 'bronze',
    index: true
  },
  commissionRate: {
    type: Number,
    required: true,
    min: 0,
    max: 50, // Maximum 50%
    default: 5 // 5% default
  },
  bonusCommissionRate: {
    type: Number,
    min: 0,
    max: 100
  },
  stats: {
    totalReferrals: { type: Number, default: 0 },
    activeReferrals: { type: Number, default: 0 },
    totalCommissions: { type: Number, default: 0 },
    paidCommissions: { type: Number, default: 0 },
    pendingCommissions: { type: Number, default: 0 },
    totalSales: { type: Number, default: 0 },
    conversionRate: { type: Number, default: 0 },
    clickCount: { type: Number, default: 0 }
  },
  paymentInfo: {
    method: {
      type: String,
      enum: ['bank_transfer', 'paypal', 'crypto', 'store_credit'],
      required: true
    },
    bankAccount: {
      accountNumber: String,
      bankName: String,
      accountHolder: String,
      routingNumber: String
    },
    paypalEmail: String,
    cryptoWallet: {
      address: String,
      currency: String
    }
  },
  settings: {
    autoWithdraw: { type: Boolean, default: false },
    minimumPayout: { type: Number, default: 100 }, // $100 minimum
    emailNotifications: { type: Boolean, default: true },
    marketingMaterials: { type: Boolean, default: true }
  },
  referralLinks: [{
    url: { type: String, required: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product' },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category' },
    campaignName: String,
    clicks: { type: Number, default: 0 },
    conversions: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
})

// Indexes
AffiliateSchema.index({ status: 1, tier: 1 })
AffiliateSchema.index({ 'stats.totalCommissions': -1 })
AffiliateSchema.index({ 'stats.totalReferrals': -1 })

// Pre-save middleware to generate affiliate code
AffiliateSchema.pre('save', async function(next) {
  if (!this.affiliateCode) {
    let code: string
    let exists = true
    
    while (exists) {
      code = generateAffiliateCode()
      const existingAffiliate = await mongoose.model('Affiliate').findOne({ affiliateCode: code })
      exists = !!existingAffiliate
    }
    
    this.affiliateCode = code!
  }
  next()
})

// Method to update tier based on performance
AffiliateSchema.methods.updateTier = function() {
  const { totalSales, totalReferrals } = this.stats
  
  if (totalSales >= 50000 && totalReferrals >= 100) {
    this.tier = 'platinum'
    this.commissionRate = 15
  } else if (totalSales >= 20000 && totalReferrals >= 50) {
    this.tier = 'gold'
    this.commissionRate = 12
  } else if (totalSales >= 5000 && totalReferrals >= 20) {
    this.tier = 'silver'
    this.commissionRate = 8
  } else {
    this.tier = 'bronze'
    this.commissionRate = 5
  }
}

// Method to calculate commission for an order
AffiliateSchema.methods.calculateCommission = function(orderTotal: number) {
  const rate = this.bonusCommissionRate || this.commissionRate
  return (orderTotal * rate) / 100
}

// Method to generate referral link
AffiliateSchema.methods.generateReferralLink = function(baseUrl: string, productId?: string, categoryId?: string, campaignName?: string) {
  const params = new URLSearchParams({
    ref: this.affiliateCode
  })
  
  if (productId) params.append('product', productId)
  if (categoryId) params.append('category', categoryId)
  if (campaignName) params.append('campaign', campaignName)
  
  const url = `${baseUrl}?${params.toString()}`
  
  // Add to referral links if not exists
  const existingLink = this.referralLinks.find((link: any) => link.url === url)
  if (!existingLink) {
    this.referralLinks.push({
      url,
      productId: productId ? new mongoose.Types.ObjectId(productId) : undefined,
      categoryId: categoryId ? new mongoose.Types.ObjectId(categoryId) : undefined,
      campaignName,
      clicks: 0,
      conversions: 0,
      createdAt: new Date()
    })
  }
  
  return url
}

// Static method to find affiliate by code
AffiliateSchema.statics.findByCode = function(code: string) {
  return this.findOne({ affiliateCode: code.toUpperCase(), status: 'active' })
}

// Static method to get top performers
AffiliateSchema.statics.getTopPerformers = function(limit = 10, metric = 'totalCommissions') {
  const sortField = `stats.${metric}`
  return this.find({ status: 'active' })
    .populate('userId', 'name email avatar')
    .sort({ [sortField]: -1 })
    .limit(limit)
}

// Generate random affiliate code
function generateAffiliateCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export default mongoose.models.Affiliate || mongoose.model<IAffiliate>('Affiliate', AffiliateSchema)
