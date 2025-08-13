import mongoose, { Schema, Document } from 'mongoose'

export interface IInvoiceItem {
  productId: mongoose.Types.ObjectId
  productName: string
  quantity: number
  unitPrice: number
  totalPrice: number
  commission: number
  supplierPayment: number
}

export interface IInvoice extends Document {
  invoiceNumber: string
  supplierId: mongoose.Types.ObjectId
  supplierName: string
  period: {
    startDate: Date
    endDate: Date
  }
  items: IInvoiceItem[]
  subtotal: number
  commission: number
  totalPayment: number
  status: 'pending' | 'approved' | 'paid' | 'cancelled'
  paymentMethod: 'bank_transfer' | 'mercadopago' | 'cash'
  paymentDate?: Date
  notes?: string
  createdBy: {
    adminId: string
    adminName: string
  }
  createdAt: Date
  updatedAt: Date
}

const InvoiceItemSchema = new Schema<IInvoiceItem>({
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
  commission: {
    type: Number,
    required: true,
    min: 0
  },
  supplierPayment: {
    type: Number,
    required: true,
    min: 0
  }
})

const InvoiceSchema = new Schema<IInvoice>({
  invoiceNumber: {
    type: String,
    required: true,
    unique: true
  },
  supplierId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  supplierName: {
    type: String,
    required: true
  },
  period: {
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    }
  },
  items: [InvoiceItemSchema],
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  commission: {
    type: Number,
    required: true,
    min: 0
  },
  totalPayment: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'approved', 'paid', 'cancelled'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ['bank_transfer', 'mercadopago', 'cash']
  },
  paymentDate: {
    type: Date
  },
  notes: {
    type: String,
    maxlength: 1000
  },
  createdBy: {
    adminId: {
      type: String,
      required: true
    },
    adminName: {
      type: String,
      required: true
    }
  }
}, {
  timestamps: true
})

// Índices para optimizar consultas
InvoiceSchema.index({ invoiceNumber: 1 })
InvoiceSchema.index({ supplierId: 1 })
InvoiceSchema.index({ status: 1 })
InvoiceSchema.index({ 'period.startDate': 1, 'period.endDate': 1 })
InvoiceSchema.index({ createdAt: -1 })

// Método para generar número de factura
InvoiceSchema.statics.generateInvoiceNumber = function() {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  return `INV-${year}${month}${day}-${random}`
}

export default mongoose.models.Invoice || mongoose.model<IInvoice>('Invoice', InvoiceSchema) 