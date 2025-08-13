import mongoose, { Schema, Document } from 'mongoose'

export interface IMessage extends Document {
  senderId: mongoose.Types.ObjectId
  senderName: string
  senderRole: string
  content: string
  messageType: 'text' | 'image' | 'file'
  timestamp: Date
  isRead: boolean
}

export interface IChat extends Document {
  chatId: string
  participants: {
    userId: mongoose.Types.ObjectId
    userName: string
    userRole: string
  }[]
  chatType: 'customer_supplier' | 'customer_admin' | 'supplier_admin'
  orderId?: mongoose.Types.ObjectId
  productId?: mongoose.Types.ObjectId
  messages: IMessage[]
  isActive: boolean
  lastMessage?: {
    content: string
    timestamp: Date
    senderName: string
  }
  createdAt: Date
  updatedAt: Date
}

const MessageSchema = new Schema<IMessage>({
  senderId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  senderName: {
    type: String,
    required: true
  },
  senderRole: {
    type: String,
    required: true,
    enum: ['client', 'supplier', 'admin']
  },
  content: {
    type: String,
    required: true,
    maxlength: 1000
  },
  messageType: {
    type: String,
    required: true,
    enum: ['text', 'image', 'file'],
    default: 'text'
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  isRead: {
    type: Boolean,
    default: false
  }
})

const ChatSchema = new Schema<IChat>({
  chatId: {
    type: String,
    required: true,
    unique: true
  },
  participants: [{
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
      required: true,
      enum: ['client', 'supplier', 'admin']
    }
  }],
  chatType: {
    type: String,
    required: true,
    enum: ['customer_supplier', 'customer_admin', 'supplier_admin']
  },
  orderId: {
    type: Schema.Types.ObjectId,
    ref: 'Order'
  },
  productId: {
    type: Schema.Types.ObjectId,
    ref: 'Product'
  },
  messages: [MessageSchema],
  isActive: {
    type: Boolean,
    default: true
  },
  lastMessage: {
    content: String,
    timestamp: Date,
    senderName: String
  }
}, {
  timestamps: true
})

// Índices para optimizar consultas
ChatSchema.index({ chatId: 1 })
ChatSchema.index({ 'participants.userId': 1 })
ChatSchema.index({ chatType: 1 })
ChatSchema.index({ orderId: 1 })
ChatSchema.index({ isActive: 1 })

export default mongoose.models.Chat || mongoose.model<IChat>('Chat', ChatSchema) 