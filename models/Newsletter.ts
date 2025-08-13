import mongoose, { Schema, Document } from 'mongoose'

export interface INewsletterSubscription extends Document {
  email: string
  userId?: mongoose.Types.ObjectId
  status: 'active' | 'unsubscribed' | 'bounced' | 'complained'
  
  // Subscription preferences
  preferences: {
    productUpdates: boolean
    promotions: boolean
    orderUpdates: boolean
    supplierNews: boolean
    weeklyDigest: boolean
    monthlyReport: boolean
  }
  
  // Segmentation
  segments: string[]
  tags: string[]
  
  // Tracking
  subscriptionSource: 'website' | 'checkout' | 'account' | 'admin' | 'import'
  ipAddress?: string
  userAgent?: string
  
  // Engagement metrics
  stats: {
    emailsSent: number
    emailsOpened: number
    emailsClicked: number
    lastOpenedAt?: Date
    lastClickedAt?: Date
    openRate: number
    clickRate: number
  }
  
  // Unsubscribe info
  unsubscribedAt?: Date
  unsubscribeReason?: string
  
  // Double opt-in
  confirmed: boolean
  confirmationToken?: string
  confirmedAt?: Date
  
  createdAt: Date
  updatedAt: Date
}

export interface INewsletterCampaign extends Document {
  name: string
  subject: string
  preheader?: string
  content: {
    html: string
    text: string
  }
  
  // Targeting
  audience: 'all' | 'segments' | 'tags' | 'custom'
  targetSegments?: string[]
  targetTags?: string[]
  customQuery?: any
  
  // Scheduling
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused' | 'cancelled'
  scheduledFor?: Date
  timezone: string
  
  // Campaign settings
  settings: {
    trackOpens: boolean
    trackClicks: boolean
    enableUnsubscribe: boolean
    replyToEmail?: string
    fromName: string
    fromEmail: string
  }
  
  // A/B Testing
  abTest?: {
    enabled: boolean
    testType: 'subject' | 'content' | 'send_time'
    variants: Array<{
      name: string
      subject?: string
      content?: { html: string, text: string }
      sendTime?: Date
      percentage: number
    }>
    winnerCriteria: 'open_rate' | 'click_rate' | 'conversion_rate'
    testDuration: number // hours
  }
  
  // Performance metrics
  stats: {
    totalRecipients: number
    delivered: number
    bounced: number
    opened: number
    clicked: number
    unsubscribed: number
    complained: number
    deliveryRate: number
    openRate: number
    clickRate: number
    unsubscribeRate: number
    revenue?: number
  }
  
  // Delivery tracking
  deliveries: Array<{
    subscriptionId: mongoose.Types.ObjectId
    email: string
    status: 'pending' | 'delivered' | 'bounced' | 'opened' | 'clicked' | 'unsubscribed' | 'complained'
    deliveredAt?: Date
    openedAt?: Date
    clickedAt?: Date
    bounceReason?: string
    clicks: Array<{
      url: string
      clickedAt: Date
    }>
  }>
  
  // Creator info
  createdBy: {
    userId: mongoose.Types.ObjectId
    userName: string
  }
  
  createdAt: Date
  updatedAt: Date
}

const NewsletterSubscriptionSchema = new Schema<INewsletterSubscription>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  status: {
    type: String,
    enum: ['active', 'unsubscribed', 'bounced', 'complained'],
    default: 'active',
    index: true
  },
  preferences: {
    productUpdates: { type: Boolean, default: true },
    promotions: { type: Boolean, default: true },
    orderUpdates: { type: Boolean, default: true },
    supplierNews: { type: Boolean, default: false },
    weeklyDigest: { type: Boolean, default: true },
    monthlyReport: { type: Boolean, default: false }
  },
  segments: [{
    type: String,
    index: true
  }],
  tags: [{
    type: String,
    index: true
  }],
  subscriptionSource: {
    type: String,
    enum: ['website', 'checkout', 'account', 'admin', 'import'],
    default: 'website'
  },
  ipAddress: String,
  userAgent: String,
  stats: {
    emailsSent: { type: Number, default: 0 },
    emailsOpened: { type: Number, default: 0 },
    emailsClicked: { type: Number, default: 0 },
    lastOpenedAt: Date,
    lastClickedAt: Date,
    openRate: { type: Number, default: 0 },
    clickRate: { type: Number, default: 0 }
  },
  unsubscribedAt: Date,
  unsubscribeReason: String,
  confirmed: { type: Boolean, default: false },
  confirmationToken: String,
  confirmedAt: Date
}, {
  timestamps: true
})

const NewsletterCampaignSchema = new Schema<INewsletterCampaign>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  subject: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  preheader: {
    type: String,
    trim: true,
    maxlength: 150
  },
  content: {
    html: { type: String, required: true },
    text: { type: String, required: true }
  },
  audience: {
    type: String,
    enum: ['all', 'segments', 'tags', 'custom'],
    required: true
  },
  targetSegments: [String],
  targetTags: [String],
  customQuery: Schema.Types.Mixed,
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'sending', 'sent', 'paused', 'cancelled'],
    default: 'draft',
    index: true
  },
  scheduledFor: {
    type: Date,
    index: true
  },
  timezone: {
    type: String,
    default: 'America/Argentina/Buenos_Aires'
  },
  settings: {
    trackOpens: { type: Boolean, default: true },
    trackClicks: { type: Boolean, default: true },
    enableUnsubscribe: { type: Boolean, default: true },
    replyToEmail: String,
    fromName: { type: String, default: 'Salta Conecta' },
    fromEmail: { type: String, default: 'noreply@saltaconecta.com' }
  },
  abTest: {
    enabled: { type: Boolean, default: false },
    testType: {
      type: String,
      enum: ['subject', 'content', 'send_time']
    },
    variants: [{
      name: String,
      subject: String,
      content: {
        html: String,
        text: String
      },
      sendTime: Date,
      percentage: Number
    }],
    winnerCriteria: {
      type: String,
      enum: ['open_rate', 'click_rate', 'conversion_rate']
    },
    testDuration: Number
  },
  stats: {
    totalRecipients: { type: Number, default: 0 },
    delivered: { type: Number, default: 0 },
    bounced: { type: Number, default: 0 },
    opened: { type: Number, default: 0 },
    clicked: { type: Number, default: 0 },
    unsubscribed: { type: Number, default: 0 },
    complained: { type: Number, default: 0 },
    deliveryRate: { type: Number, default: 0 },
    openRate: { type: Number, default: 0 },
    clickRate: { type: Number, default: 0 },
    unsubscribeRate: { type: Number, default: 0 },
    revenue: Number
  },
  deliveries: [{
    subscriptionId: {
      type: Schema.Types.ObjectId,
      ref: 'NewsletterSubscription'
    },
    email: String,
    status: {
      type: String,
      enum: ['pending', 'delivered', 'bounced', 'opened', 'clicked', 'unsubscribed', 'complained'],
      default: 'pending'
    },
    deliveredAt: Date,
    openedAt: Date,
    clickedAt: Date,
    bounceReason: String,
    clicks: [{
      url: String,
      clickedAt: Date
    }]
  }],
  createdBy: {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    userName: {
      type: String,
      required: true
    }
  }
}, {
  timestamps: true
})

// Indexes for NewsletterSubscription
NewsletterSubscriptionSchema.index({ status: 1, confirmed: 1 })
NewsletterSubscriptionSchema.index({ segments: 1, status: 1 })
NewsletterSubscriptionSchema.index({ tags: 1, status: 1 })

// Indexes for NewsletterCampaign
NewsletterCampaignSchema.index({ status: 1, scheduledFor: 1 })
NewsletterCampaignSchema.index({ 'createdBy.userId': 1, createdAt: -1 })

// Methods for NewsletterSubscription
NewsletterSubscriptionSchema.methods.updateStats = function() {
  if (this.stats.emailsSent > 0) {
    this.stats.openRate = (this.stats.emailsOpened / this.stats.emailsSent) * 100
    this.stats.clickRate = this.stats.emailsOpened > 0 ? 
      (this.stats.emailsClicked / this.stats.emailsOpened) * 100 : 0
  }
}

NewsletterSubscriptionSchema.methods.unsubscribe = function(reason?: string) {
  this.status = 'unsubscribed'
  this.unsubscribedAt = new Date()
  this.unsubscribeReason = reason
}

// Methods for NewsletterCampaign
NewsletterCampaignSchema.methods.updateStats = function() {
  const deliveries = this.deliveries
  
  this.stats.totalRecipients = deliveries.length
  this.stats.delivered = deliveries.filter((d: any) => 
    ['delivered', 'opened', 'clicked'].includes(d.status)).length
  this.stats.bounced = deliveries.filter((d: any) => d.status === 'bounced').length
  this.stats.opened = deliveries.filter((d: any) => 
    ['opened', 'clicked'].includes(d.status)).length
  this.stats.clicked = deliveries.filter((d: any) => d.status === 'clicked').length
  this.stats.unsubscribed = deliveries.filter((d: any) => d.status === 'unsubscribed').length
  this.stats.complained = deliveries.filter((d: any) => d.status === 'complained').length
  
  // Calculate rates
  if (this.stats.totalRecipients > 0) {
    this.stats.deliveryRate = (this.stats.delivered / this.stats.totalRecipients) * 100
  }
  if (this.stats.delivered > 0) {
    this.stats.openRate = (this.stats.opened / this.stats.delivered) * 100
    this.stats.unsubscribeRate = (this.stats.unsubscribed / this.stats.delivered) * 100
  }
  if (this.stats.opened > 0) {
    this.stats.clickRate = (this.stats.clicked / this.stats.opened) * 100
  }
}

// Static methods
NewsletterSubscriptionSchema.statics.getActiveSubscribers = function(segments?: string[], tags?: string[]) {
  let query: any = { status: 'active', confirmed: true }
  
  if (segments && segments.length > 0) {
    query.segments = { $in: segments }
  }
  
  if (tags && tags.length > 0) {
    query.tags = { $in: tags }
  }
  
  return this.find(query)
}

NewsletterCampaignSchema.statics.getScheduledCampaigns = function() {
  return this.find({
    status: 'scheduled',
    scheduledFor: { $lte: new Date() }
  }).sort({ scheduledFor: 1 })
}

export const NewsletterSubscription = mongoose.models.NewsletterSubscription || 
  mongoose.model<INewsletterSubscription>('NewsletterSubscription', NewsletterSubscriptionSchema)

export const NewsletterCampaign = mongoose.models.NewsletterCampaign || 
  mongoose.model<INewsletterCampaign>('NewsletterCampaign', NewsletterCampaignSchema)

export default { NewsletterSubscription, NewsletterCampaign }
