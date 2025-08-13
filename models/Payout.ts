import mongoose, { Document, Schema } from 'mongoose'

export type PayoutStatus = 'pending' | 'paid' | 'failed' | 'cancelled'

export interface IPayoutOrderEntry {
  order: mongoose.Types.ObjectId
  amount: number
}

export interface IPayoutDestinationSnapshot {
  provider: 'mercadopago' | 'bank'
  alias?: string
  cbu?: string
  cvu?: string
  accountId?: string
  holderName?: string
}

export interface IPayout extends Document {
  supplier: mongoose.Types.ObjectId
  currency: string
  amount: number
  status: PayoutStatus
  orders: IPayoutOrderEntry[]
  destination?: IPayoutDestinationSnapshot
  notes?: string
  paidAt?: Date
  attempts?: number
  lastError?: string
  lastTriedAt?: Date
  createdAt: Date
  updatedAt: Date
}

const PayoutSchema = new Schema<IPayout>({
  supplier: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  currency: { type: String, default: 'ARS' },
  amount: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ['pending', 'paid', 'failed', 'cancelled'], default: 'pending', index: true },
  orders: [{
    order: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
    amount: { type: Number, required: true, min: 0 }
  }],
  destination: {
    provider: { type: String, enum: ['mercadopago', 'bank'] },
    alias: String,
    cbu: String,
    cvu: String,
    accountId: String,
    holderName: String
  },
  notes: { type: String, trim: true },
  paidAt: Date,
  attempts: { type: Number, default: 0, min: 0 },
  lastError: { type: String },
  lastTriedAt: { type: Date }
}, { timestamps: true })

PayoutSchema.index({ supplier: 1, status: 1 })

export default mongoose.models.Payout || mongoose.model<IPayout>('Payout', PayoutSchema)
