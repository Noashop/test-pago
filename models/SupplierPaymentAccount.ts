import mongoose, { Schema, Document } from 'mongoose'

export interface ISupplierPaymentAccount extends Document {
  userId: mongoose.Types.ObjectId
  mpUserId: string
  accessToken: string
  refreshToken: string
  tokenType: string
  scope?: string
  expiresAt: Date
  createdAt: Date
  updatedAt: Date
}

const SupplierPaymentAccountSchema = new Schema<ISupplierPaymentAccount>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  mpUserId: { type: String, required: true },
  accessToken: { type: String, required: true },
  refreshToken: { type: String, required: true },
  tokenType: { type: String, required: true },
  scope: { type: String },
  expiresAt: { type: Date, required: true }
}, { timestamps: true })

SupplierPaymentAccountSchema.index({ userId: 1 }, { unique: true })
SupplierPaymentAccountSchema.index({ mpUserId: 1 })

export default mongoose.models.SupplierPaymentAccount || mongoose.model<ISupplierPaymentAccount>('SupplierPaymentAccount', SupplierPaymentAccountSchema)
