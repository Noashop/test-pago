import mongoose, { Schema, Document } from 'mongoose'

export interface IPushNotification extends Document {
  userId?: mongoose.Types.ObjectId // If null, it's a broadcast notification
  title: string
  body: string
  icon?: string
  image?: string
  badge?: string
  
  // Notification data
  data?: {
    url?: string
    action?: string
    productId?: string
    orderId?: string
    [key: string]: any
  }
  
  // Targeting
  audience: 'all' | 'customers' | 'suppliers' | 'admins' | 'specific_users' | 'segments'
  targetUsers?: mongoose.Types.ObjectId[]
  segments?: Array<{
    type: 'location' | 'purchase_history' | 'activity' | 'preferences'
    criteria: any
  }>
  
  // Scheduling
  scheduledFor?: Date
  timezone?: string
  
  // Status
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed' | 'cancelled'
  
  // Delivery stats
  stats: {
    totalTargeted: number
    delivered: number
    failed: number
    clicked: number
    dismissed: number
    deliveryRate: number
    clickRate: number
  }
  
  // Campaign info
  campaign?: {
    name: string
    type: 'promotional' | 'transactional' | 'informational' | 'reminder'
    tags: string[]
  }
  
  // Delivery tracking
  deliveries: Array<{
    userId: mongoose.Types.ObjectId
    deviceToken: string
    status: 'pending' | 'delivered' | 'failed' | 'clicked' | 'dismissed'
    deliveredAt?: Date
    clickedAt?: Date
    dismissedAt?: Date
    error?: string
  }>
  
  // Creator info
  createdBy: {
    userId: mongoose.Types.ObjectId
    userName: string
    userRole: string
  }
  
  createdAt: Date
  updatedAt: Date
}

const PushNotificationSchema = new Schema<IPushNotification>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  body: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  icon: String,
  image: String,
  badge: String,
  
  data: {
    type: Schema.Types.Mixed,
    default: {}
  },
  
  audience: {
    type: String,
    enum: ['all', 'customers', 'suppliers', 'admins', 'specific_users', 'segments'],
    required: true,
    index: true
  },
  targetUsers: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  segments: [{
    type: {
      type: String,
      enum: ['location', 'purchase_history', 'activity', 'preferences']
    },
    criteria: Schema.Types.Mixed
  }],
  
  scheduledFor: {
    type: Date,
    index: true
  },
  timezone: {
    type: String,
    default: 'America/Argentina/Buenos_Aires'
  },
  
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'sending', 'sent', 'failed', 'cancelled'],
    default: 'draft',
    index: true
  },
  
  stats: {
    totalTargeted: { type: Number, default: 0 },
    delivered: { type: Number, default: 0 },
    failed: { type: Number, default: 0 },
    clicked: { type: Number, default: 0 },
    dismissed: { type: Number, default: 0 },
    deliveryRate: { type: Number, default: 0 },
    clickRate: { type: Number, default: 0 }
  },
  
  campaign: {
    name: String,
    type: {
      type: String,
      enum: ['promotional', 'transactional', 'informational', 'reminder']
    },
    tags: [String]
  },
  
  deliveries: [{
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    deviceToken: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'delivered', 'failed', 'clicked', 'dismissed'],
      default: 'pending'
    },
    deliveredAt: Date,
    clickedAt: Date,
    dismissedAt: Date,
    error: String
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
    },
    userRole: {
      type: String,
      required: true
    }
  }
}, {
  timestamps: true
})

// Indexes
PushNotificationSchema.index({ status: 1, scheduledFor: 1 })
PushNotificationSchema.index({ audience: 1, createdAt: -1 })
PushNotificationSchema.index({ 'createdBy.userId': 1, createdAt: -1 })
PushNotificationSchema.index({ 'campaign.type': 1, createdAt: -1 })

// Method to update stats
PushNotificationSchema.methods.updateStats = function() {
  const deliveries = this.deliveries
  
  this.stats.totalTargeted = deliveries.length
  this.stats.delivered = deliveries.filter((d: any) => d.status === 'delivered' || d.status === 'clicked').length
  this.stats.failed = deliveries.filter((d: any) => d.status === 'failed').length
  this.stats.clicked = deliveries.filter((d: any) => d.status === 'clicked').length
  this.stats.dismissed = deliveries.filter((d: any) => d.status === 'dismissed').length
  
  this.stats.deliveryRate = this.stats.totalTargeted > 0 ? 
    (this.stats.delivered / this.stats.totalTargeted) * 100 : 0
  this.stats.clickRate = this.stats.delivered > 0 ? 
    (this.stats.clicked / this.stats.delivered) * 100 : 0
}

// Static method to get users by audience
PushNotificationSchema.statics.getUsersByAudience = async function(audience: string, targetUsers?: string[], segments?: any[]) {
  const User = mongoose.model('User')
  let query: any = {}

  switch (audience) {
    case 'all':
      query = { pushNotificationsEnabled: true }
      break
    case 'customers':
      query = { role: 'customer', pushNotificationsEnabled: true }
      break
    case 'suppliers':
      query = { role: 'supplier', pushNotificationsEnabled: true }
      break
    case 'admins':
      query = { role: 'admin', pushNotificationsEnabled: true }
      break
    case 'specific_users':
      if (targetUsers && targetUsers.length > 0) {
        query = { 
          _id: { $in: targetUsers },
          pushNotificationsEnabled: true 
        }
      } else {
        return []
      }
      break
    case 'segments':
      // Implement segment logic based on criteria
      query = { pushNotificationsEnabled: true }
      // Add segment filtering logic here
      break
    default:
      return []
  }

  return await User.find(query)
    .select('_id name email deviceTokens pushNotificationsEnabled')
    .lean()
}

// Static method to create notification for order updates
PushNotificationSchema.statics.createOrderNotification = async function(
  userId: string,
  orderId: string,
  status: string,
  creatorInfo: any
) {
  const statusMessages = {
    confirmed: {
      title: '¡Pedido Confirmado!',
      body: 'Tu pedido ha sido confirmado y está siendo procesado.'
    },
    shipped: {
      title: '¡Pedido Enviado!',
      body: 'Tu pedido está en camino. Pronto lo recibirás.'
    },
    delivered: {
      title: '¡Pedido Entregado!',
      body: 'Tu pedido ha sido entregado exitosamente.'
    },
    cancelled: {
      title: 'Pedido Cancelado',
      body: 'Tu pedido ha sido cancelado. Si tienes dudas, contáctanos.'
    }
  }

  const message = statusMessages[status as keyof typeof statusMessages]
  if (!message) return null

  return await this.create({
    userId: new mongoose.Types.ObjectId(userId),
    title: message.title,
    body: message.body,
    data: {
      url: `/orders/${orderId}`,
      action: 'view_order',
      orderId
    },
    audience: 'specific_users',
    targetUsers: [userId],
    campaign: {
      type: 'transactional',
      name: 'Order Updates'
    },
    createdBy: creatorInfo,
    status: 'scheduled',
    scheduledFor: new Date()
  })
}

// Static method to create promotional notification
PushNotificationSchema.statics.createPromotionalNotification = async function(
  title: string,
  body: string,
  audience: string,
  data: any,
  creatorInfo: any,
  scheduledFor?: Date
) {
  return await this.create({
    title,
    body,
    data,
    audience,
    campaign: {
      type: 'promotional',
      name: data.campaignName || 'Promotional Campaign'
    },
    createdBy: creatorInfo,
    status: scheduledFor ? 'scheduled' : 'draft',
    scheduledFor: scheduledFor || new Date()
  })
}

export default mongoose.models.PushNotification || mongoose.model<IPushNotification>('PushNotification', PushNotificationSchema)
