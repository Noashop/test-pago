import mongoose, { Document, Schema } from 'mongoose'

export interface ICartItem {
  product: mongoose.Types.ObjectId
  quantity: number
  variant?: {
    name: string
    value: string
  }
  addedAt: Date
}

export interface ICart extends Document {
  _id: string
  user?: mongoose.Types.ObjectId
  sessionId?: string
  items: ICartItem[]
  subtotal: number
  total: number
  coupon?: {
    code: string
    discount: number
    type: string
  }
  expiresAt?: Date
  createdAt: Date
  updatedAt: Date
}

const CartSchema = new Schema<ICart>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  sessionId: {
    type: String
  },
  items: [{
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    variant: {
      name: String,
      value: String
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  subtotal: {
    type: Number,
    default: 0,
    min: 0
  },
  total: {
    type: Number,
    default: 0,
    min: 0
  },
  coupon: {
    code: String,
    discount: Number,
    type: String
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  }
}, {
  timestamps: true
})

// Indexes
CartSchema.index({ user: 1 })
CartSchema.index({ sessionId: 1 })
CartSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

export default mongoose.models.Cart || mongoose.model<ICart>('Cart', CartSchema)
