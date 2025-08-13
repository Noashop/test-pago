import mongoose, { Document, Schema } from 'mongoose'

export interface IMessage extends Document {
  chatId: mongoose.Types.ObjectId
  sender: mongoose.Types.ObjectId
  senderRole: 'admin' | 'supplier' | 'client'
  content: string
  messageType: 'text' | 'image' | 'file' | 'system'
  isRead: boolean
  readAt?: Date
  attachments?: {
    url: string
    filename: string
    fileType: string
    fileSize: number
  }[]
  createdAt: Date
  updatedAt: Date
}

const MessageSchema = new Schema<IMessage>({
  chatId: {
    type: Schema.Types.ObjectId,
    ref: 'Chat',
    required: true,
    index: true
  },
  sender: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  senderRole: {
    type: String,
    enum: ['admin', 'supplier', 'client'],
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'file', 'system'],
    default: 'text'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  attachments: [{
    url: {
      type: String,
      required: true
    },
    filename: {
      type: String,
      required: true
    },
    fileType: {
      type: String,
      required: true
    },
    fileSize: {
      type: Number,
      required: true
    }
  }]
}, {
  timestamps: true
})

// Índices para optimizar consultas
MessageSchema.index({ chatId: 1, createdAt: -1 })
MessageSchema.index({ sender: 1 })
MessageSchema.index({ isRead: 1 })

// Método para marcar como leído
MessageSchema.methods.markAsRead = function() {
  this.isRead = true
  this.readAt = new Date()
  return this.save()
}

// Método estático para obtener mensajes no leídos de un chat
MessageSchema.statics.getUnreadMessages = function(chatId: string, userId: string) {
  return this.find({
    chatId,
    sender: { $ne: userId },
    isRead: false
  }).sort({ createdAt: 1 })
}

// Método estático para marcar todos los mensajes como leídos
MessageSchema.statics.markAllAsRead = function(chatId: string, userId: string) {
  return this.updateMany(
    {
      chatId,
      sender: { $ne: userId },
      isRead: false
    },
    {
      $set: {
        isRead: true,
        readAt: new Date()
      }
    }
  )
}

export default mongoose.models.Message || mongoose.model<IMessage>('Message', MessageSchema)
