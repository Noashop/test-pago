import mongoose, { Document, Schema } from 'mongoose'

export interface INotification extends Document {
  _id: string
  userId: mongoose.Types.ObjectId
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  category: 'order' | 'product' | 'payment' | 'system' | 'chat'
  isRead: boolean
  data?: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

const NotificationSchema = new Schema<INotification>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  type: {
    type: String,
    enum: ['info', 'success', 'warning', 'error'],
    default: 'info'
  },
  category: {
    type: String,
    enum: ['order', 'product', 'payment', 'system', 'chat'],
    required: true
  },
  isRead: {
    type: Boolean,
    default: false
  },
  data: {
    type: Schema.Types.Mixed
  }
}, {
  timestamps: true
})

// Indexes
NotificationSchema.index({ userId: 1, createdAt: -1 })
NotificationSchema.index({ userId: 1, isRead: 1 })
NotificationSchema.index({ category: 1 })

// Static method to create notification
NotificationSchema.statics.createNotification = function(data: {
  userId: string
  title: string
  message: string
  type?: 'info' | 'success' | 'warning' | 'error'
  category: 'order' | 'product' | 'payment' | 'system' | 'chat'
  data?: Record<string, any>
}) {
  return this.create({
    userId: data.userId,
    title: data.title,
    message: data.message,
    type: data.type || 'info',
    category: data.category,
    data: data.data
  })
}

// Static method to mark notifications as read
NotificationSchema.statics.markAsRead = function(userId: string, notificationIds: string[]) {
  return this.updateMany(
    { 
      _id: { $in: notificationIds },
      userId: userId 
    },
    { isRead: true }
  )
}

// Static method to get unread count
NotificationSchema.statics.getUnreadCount = function(userId: string) {
  return this.countDocuments({ userId, isRead: false })
}

export default mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema) 