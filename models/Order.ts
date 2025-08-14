import mongoose, { Document, Schema } from 'mongoose'
import { ORDER_STATUS, PAYMENT_STATUS } from '@/constants'

type OrderStatus = typeof ORDER_STATUS[keyof typeof ORDER_STATUS]
type PaymentStatus = typeof PAYMENT_STATUS[keyof typeof PAYMENT_STATUS]

export interface IOrderItem {
  product: mongoose.Types.ObjectId
  name: string
  image: string
  price: number
  costPrice?: number // Precio de costo del proveedor
  quantity: number
  variant?: {
    name: string
    value: string
  }
  supplier: mongoose.Types.ObjectId
}

export interface IOrder extends Document {
  _id: string
  orderNumber: string
  customer: mongoose.Types.ObjectId
  items: IOrderItem[]
  subtotal: number
  tax: number
  shipping: number
  discount: number
  total: number
  status: OrderStatus
  paymentStatus: PaymentStatus
  paymentMethod: string
  paymentId?: string
  mercadoPagoId?: string
  paymentDetails?: {
    mercadoPagoId?: string
    status?: string
    statusDetail?: string
    paymentMethod?: string
    transactionAmount?: number
    netReceivedAmount?: number
    paidAt?: Date
    failureReason?: string
    refundedAt?: Date
  }
  commissionDetails?: {
    adminCommission: number
    supplierAmount: number
    adminCommissionPercentage: number
    calculatedAt: Date
  }
  shippingAddress: {
    name: string
    street: string
    city: string
    state: string
    zipCode: string
    country: string
    phone?: string
  }
  billingAddress?: {
    name: string
    street: string
    city: string
    state: string
    zipCode: string
    country: string
  }
  shippingMethod?: string
  pickupDate?: Date
  coupon?: {
    code: string
    discount: number
    type: string
  }
  tracking?: {
    carrier: string
    trackingNumber: string
    url?: string
  }
  notes?: string
  estimatedDelivery?: Date
  deliveredAt?: Date
  cancelledAt?: Date
  refundedAt?: Date
  createdAt: Date
  updatedAt: Date
  stockDeducted?: boolean
  payoutsPrepared?: boolean
}

const OrderSchema = new Schema<IOrder>({
  orderNumber: {
    type: String,
    required: true,
    unique: true
  },
  customer: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [{
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    name: {
      type: String,
      required: true
    },
    image: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
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
    costPrice: {
      type: Number,
      min: 0
    },
    supplier: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  }],
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  tax: {
    type: Number,
    default: 0,
    min: 0
  },
  shipping: {
    type: Number,
    default: 0,
    min: 0
  },
  discount: {
    type: Number,
    default: 0,
    min: 0
  },
  total: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: Object.values(ORDER_STATUS),
    default: ORDER_STATUS.PENDING
  },
  paymentStatus: {
    type: String,
    enum: Object.values(PAYMENT_STATUS),
    default: PAYMENT_STATUS.PENDING
  },
  paymentMethod: {
    type: String,
    required: true
  },
  paymentId: String,
  mercadoPagoId: String,
  paymentDetails: {
    mercadoPagoId: String,
    status: String,
    statusDetail: String,
    paymentMethod: String,
    transactionAmount: Number,
    netReceivedAmount: Number,
    paidAt: Date,
    failureReason: String,
    refundedAt: Date
  },
  commissionDetails: {
    adminCommission: {
      type: Number,
      min: 0
    },
    supplierAmount: {
      type: Number,
      min: 0
    },
    adminCommissionPercentage: {
      type: Number,
      min: 0,
      max: 100
    },
    calculatedAt: {
      type: Date,
      default: Date.now
    }
  },
  shippingAddress: {
    name: {
      type: String,
      required: true
    },
    street: {
      type: String,
      required: function (this: any) {
        const parent: any = typeof (this as any).parent === 'function' ? (this as any).parent() : this
        return parent.shippingMethod !== 'pickup'
      }
    },
    city: {
      type: String,
      required: function (this: any) {
        const parent: any = typeof (this as any).parent === 'function' ? (this as any).parent() : this
        return parent.shippingMethod !== 'pickup'
      }
    },
    state: {
      type: String,
      required: function (this: any) {
        const parent: any = typeof (this as any).parent === 'function' ? (this as any).parent() : this
        return parent.shippingMethod !== 'pickup'
      }
    },
    zipCode: {
      type: String,
      required: function (this: any) {
        const parent: any = typeof (this as any).parent === 'function' ? (this as any).parent() : this
        return parent.shippingMethod !== 'pickup'
      }
    },
    country: {
      type: String,
      required: function (this: any) {
        const parent: any = typeof (this as any).parent === 'function' ? (this as any).parent() : this
        return parent.shippingMethod !== 'pickup'
      }
    },
    phone: String
  },
  billingAddress: {
    name: String,
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  shippingMethod: String,
  pickupDate: Date,
  coupon: {
    code: String,
    discount: Number,
    type: String
  },
  tracking: {
    carrier: String,
    trackingNumber: String,
    url: String
  },
  notes: String,
  estimatedDelivery: Date,
  deliveredAt: Date,
  cancelledAt: Date,
  refundedAt: Date
}, {
  timestamps: true
})

// Indexes
OrderSchema.index({ orderNumber: 1 })
OrderSchema.index({ customer: 1 })
OrderSchema.index({ status: 1 })
OrderSchema.index({ paymentStatus: 1 })
OrderSchema.index({ mercadoPagoId: 1 })
OrderSchema.index({ createdAt: -1 })

// Flag de inventario descontado
;(OrderSchema as any).add({
  stockDeducted: { type: Boolean, default: false }
})

;(OrderSchema as any).add({
  payoutsPrepared: { type: Boolean, default: false }
})

export default mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema)
