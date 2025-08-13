import mongoose, { Schema, Document } from 'mongoose'

export interface IReturn extends Document {
  orderId: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  items: Array<{
    productId: mongoose.Types.ObjectId
    productName: string
    quantity: number
    unitPrice: number
    totalPrice: number
    reason: string
    condition: 'new' | 'used' | 'damaged' | 'defective'
    images?: string[]
  }>
  returnType: 'refund' | 'exchange' | 'store_credit'
  status: 'pending' | 'approved' | 'rejected' | 'processing' | 'completed' | 'cancelled'
  reason: string
  description?: string
  images?: string[]
  
  // Amounts
  totalAmount: number
  refundAmount: number
  restockingFee: number
  shippingCost: number
  
  // Approval workflow
  approvedBy?: {
    adminId: mongoose.Types.ObjectId
    adminName: string
    approvedAt: Date
    notes?: string
  }
  rejectedBy?: {
    adminId: mongoose.Types.ObjectId
    adminName: string
    rejectedAt: Date
    reason: string
  }
  
  // Shipping info
  returnShipping?: {
    trackingNumber?: string
    carrier?: string
    shippedAt?: Date
    deliveredAt?: Date
    cost?: number
  }
  
  // Refund info
  refundInfo?: {
    method: 'original_payment' | 'store_credit' | 'bank_transfer'
    transactionId?: string
    processedAt?: Date
    notes?: string
  }
  
  // Exchange info (if applicable)
  exchangeInfo?: {
    newProductId?: mongoose.Types.ObjectId
    newProductName?: string
    priceDifference?: number
    newOrderId?: mongoose.Types.ObjectId
  }
  
  // Timeline
  timeline: Array<{
    status: string
    timestamp: Date
    notes?: string
    updatedBy?: {
      userId: mongoose.Types.ObjectId
      userName: string
      userRole: string
    }
  }>
  
  // Return window
  returnDeadline: Date
  isEligible: boolean
  
  createdAt: Date
  updatedAt: Date
}

const ReturnSchema = new Schema<IReturn>({
  orderId: {
    type: Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
    index: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  items: [{
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    productName: {
      type: String,
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0
    },
    reason: {
      type: String,
      required: true,
      enum: [
        'defective',
        'wrong_item',
        'not_as_described',
        'damaged_shipping',
        'changed_mind',
        'size_issue',
        'quality_issue',
        'other'
      ]
    },
    condition: {
      type: String,
      required: true,
      enum: ['new', 'used', 'damaged', 'defective']
    },
    images: [String]
  }],
  returnType: {
    type: String,
    required: true,
    enum: ['refund', 'exchange', 'store_credit'],
    index: true
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'approved', 'rejected', 'processing', 'completed', 'cancelled'],
    default: 'pending',
    index: true
  },
  reason: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  images: [String],
  
  // Amounts
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  refundAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  restockingFee: {
    type: Number,
    default: 0,
    min: 0
  },
  shippingCost: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Approval workflow
  approvedBy: {
    adminId: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    adminName: String,
    approvedAt: Date,
    notes: String
  },
  rejectedBy: {
    adminId: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    adminName: String,
    rejectedAt: Date,
    reason: String
  },
  
  // Shipping info
  returnShipping: {
    trackingNumber: String,
    carrier: String,
    shippedAt: Date,
    deliveredAt: Date,
    cost: Number
  },
  
  // Refund info
  refundInfo: {
    method: {
      type: String,
      enum: ['original_payment', 'store_credit', 'bank_transfer']
    },
    transactionId: String,
    processedAt: Date,
    notes: String
  },
  
  // Exchange info
  exchangeInfo: {
    newProductId: {
      type: Schema.Types.ObjectId,
      ref: 'Product'
    },
    newProductName: String,
    priceDifference: Number,
    newOrderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order'
    }
  },
  
  // Timeline
  timeline: [{
    status: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now
    },
    notes: String,
    updatedBy: {
      userId: {
        type: Schema.Types.ObjectId,
        ref: 'User'
      },
      userName: String,
      userRole: String
    }
  }],
  
  // Return window
  returnDeadline: {
    type: Date,
    required: true,
    index: true
  },
  isEligible: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
})

// Indexes
ReturnSchema.index({ userId: 1, createdAt: -1 })
ReturnSchema.index({ status: 1, createdAt: -1 })
ReturnSchema.index({ returnType: 1, status: 1 })

// Pre-save middleware to add timeline entry
ReturnSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    this.timeline.push({
      status: this.status,
      timestamp: new Date(),
      notes: `Status changed to ${this.status}`
    })
  }
  next()
})

// Virtual for days remaining in return window
ReturnSchema.virtual('daysRemaining').get(function() {
  const now = new Date()
  const deadline = new Date(this.returnDeadline)
  const diffTime = deadline.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return Math.max(0, diffDays)
})

// Static method to check if order is eligible for return
ReturnSchema.statics.checkReturnEligibility = async function(orderId: string) {
  const Order = mongoose.model('Order')
  
  const order = await Order.findById(orderId)
  if (!order) {
    return { eligible: false, reason: 'Orden no encontrada' }
  }

  // Check if order is delivered
  if (!['delivered', 'completed'].includes(order.status)) {
    return { eligible: false, reason: 'La orden debe estar entregada para poder devolverla' }
  }

  // Check return window (30 days from delivery)
  const deliveryDate = order.deliveredAt || order.updatedAt
  const returnDeadline = new Date(deliveryDate)
  returnDeadline.setDate(returnDeadline.getDate() + 30)

  if (new Date() > returnDeadline) {
    return { eligible: false, reason: 'El período de devolución ha expirado' }
  }

  // Check if there's already a return for this order
  const existingReturn = await this.findOne({ orderId, status: { $nin: ['cancelled', 'rejected'] } })
  if (existingReturn) {
    return { eligible: false, reason: 'Ya existe una solicitud de devolución para esta orden' }
  }

  return { 
    eligible: true, 
    returnDeadline,
    daysRemaining: Math.ceil((returnDeadline.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
  }
}

// Method to calculate refund amount
ReturnSchema.methods.calculateRefundAmount = function() {
  let refundAmount = this.totalAmount

  // Apply restocking fee for certain reasons
  const restockingFeeReasons = ['changed_mind', 'size_issue']
  if (this.items.some((item: any) => restockingFeeReasons.includes(item.reason))) {
    this.restockingFee = this.totalAmount * 0.15 // 15% restocking fee
    refundAmount -= this.restockingFee
  }

  // Subtract shipping cost if customer's fault
  const customerFaultReasons = ['changed_mind', 'size_issue']
  if (this.items.some((item: any) => customerFaultReasons.includes(item.reason))) {
    refundAmount -= this.shippingCost
  }

  this.refundAmount = Math.max(0, refundAmount)
  return this.refundAmount
}

// Method to approve return
ReturnSchema.methods.approve = async function(adminId: string, adminName: string, notes?: string) {
  this.status = 'approved'
  this.approvedBy = {
    adminId,
    adminName,
    approvedAt: new Date(),
    notes
  }
  this.calculateRefundAmount()
  await this.save()
}

// Method to reject return
ReturnSchema.methods.reject = async function(adminId: string, adminName: string, reason: string) {
  this.status = 'rejected'
  this.rejectedBy = {
    adminId,
    adminName,
    rejectedAt: new Date(),
    reason
  }
  await this.save()
}

export default mongoose.models.Return || mongoose.model<IReturn>('Return', ReturnSchema)
