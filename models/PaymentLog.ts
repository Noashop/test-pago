import mongoose, { Document, Schema } from 'mongoose'

export type PaymentLogType = 'payout' | 'webhook' | 'oauth'

export interface IPaymentLog extends Document {
  type: PaymentLogType
  referenceId?: string
  supplier?: mongoose.Types.ObjectId
  order?: mongoose.Types.ObjectId
  payout?: mongoose.Types.ObjectId
  request?: any
  response?: any
  success: boolean
  error?: string
  createdAt: Date
  updatedAt: Date
}

const PaymentLogSchema = new Schema<IPaymentLog>({
  type: { type: String, enum: ['payout', 'webhook', 'oauth'], required: true, index: true },
  referenceId: { type: String, index: true },
  supplier: { type: Schema.Types.ObjectId, ref: 'User' },
  order: { type: Schema.Types.ObjectId, ref: 'Order' },
  payout: { type: Schema.Types.ObjectId, ref: 'Payout' },
  request: Schema.Types.Mixed,
  response: Schema.Types.Mixed,
  success: { type: Boolean, default: false },
  error: String
}, { timestamps: true })

PaymentLogSchema.index({ createdAt: -1 })

export default mongoose.models.PaymentLog || mongoose.model<IPaymentLog>('PaymentLog', PaymentLogSchema)
