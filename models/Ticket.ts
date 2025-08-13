import mongoose, { Document, Schema } from 'mongoose'
import { TICKET_STATUS } from '@/constants'

type TicketStatus = typeof TICKET_STATUS[keyof typeof TICKET_STATUS]

export interface ITicketMessage {
  sender: mongoose.Types.ObjectId
  message: string
  attachments?: string[]
  isInternal: boolean
  createdAt: Date
}

export interface ITicket extends Document {
  _id: string
  ticketNumber: string
  subject: string
  description: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: TicketStatus
  category: string
  customer: mongoose.Types.ObjectId
  assignedTo?: mongoose.Types.ObjectId
  order?: mongoose.Types.ObjectId
  product?: mongoose.Types.ObjectId
  messages: ITicketMessage[]
  tags: string[]
  resolvedAt?: Date
  closedAt?: Date
  createdAt: Date
  updatedAt: Date
}

const TicketSchema = new Schema<ITicket>({
  ticketNumber: {
    type: String,
    required: true,
    unique: true
  },
  subject: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    maxlength: 2000
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: Object.values(TICKET_STATUS),
    default: TICKET_STATUS.OPEN
  },
  category: {
    type: String,
    required: true
  },
  customer: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedTo: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  order: {
    type: Schema.Types.ObjectId,
    ref: 'Order'
  },
  product: {
    type: Schema.Types.ObjectId,
    ref: 'Product'
  },
  messages: [{
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    message: {
      type: String,
      required: true,
      maxlength: 2000
    },
    attachments: [String],
    isInternal: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  tags: [String],
  resolvedAt: Date,
  closedAt: Date
}, {
  timestamps: true
})

// Indexes
TicketSchema.index({ ticketNumber: 1 })
TicketSchema.index({ customer: 1 })
TicketSchema.index({ assignedTo: 1 })
TicketSchema.index({ status: 1 })
TicketSchema.index({ priority: 1 })
TicketSchema.index({ category: 1 })
TicketSchema.index({ createdAt: -1 })

export default mongoose.models.Ticket || mongoose.model<ITicket>('Ticket', TicketSchema)
