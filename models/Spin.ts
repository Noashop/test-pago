import mongoose, { Schema, Document } from 'mongoose'

export interface ISpin extends Document {
  userId: mongoose.Types.ObjectId
  orderId: mongoose.Types.ObjectId
  campaignId?: mongoose.Types.ObjectId
  
  // Resultado del giro
  result: {
    prizeId: string
    prizeName: string
    prizeType: 'discount_percentage' | 'discount_fixed' | 'free_shipping' | 'coupon'
    prizeValue: number
    description: string
  }
  
  // Estado del premio
  status: 'pending' | 'claimed' | 'expired' | 'used'
  claimedAt?: Date
  usedAt?: Date
  expiresAt: Date
  
  // Cupón generado (si aplica)
  generatedCouponCode?: string
  
  // Metadatos
  spinDate: Date
  createdAt: Date
  updatedAt: Date
}

const SpinSchema = new Schema<ISpin>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  orderId: {
    type: Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  campaignId: {
    type: Schema.Types.ObjectId,
    ref: 'Campaign'
  },
  
  result: {
    prizeId: {
      type: String,
      required: true
    },
    prizeName: {
      type: String,
      required: true
    },
    prizeType: {
      type: String,
      required: true,
      enum: ['discount_percentage', 'discount_fixed', 'free_shipping', 'coupon']
    },
    prizeValue: {
      type: Number,
      required: true
    },
    description: {
      type: String,
      required: true
    }
  },
  
  status: {
    type: String,
    enum: ['pending', 'claimed', 'expired', 'used'],
    default: 'pending'
  },
  claimedAt: {
    type: Date
  },
  usedAt: {
    type: Date
  },
  expiresAt: {
    type: Date,
    required: true
  },
  
  generatedCouponCode: {
    type: String,
    uppercase: true
  },
  
  spinDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
})

// Índices para optimizar consultas
SpinSchema.index({ userId: 1, spinDate: -1 })
SpinSchema.index({ orderId: 1 })
SpinSchema.index({ status: 1, expiresAt: 1 })
SpinSchema.index({ generatedCouponCode: 1 })

// Método para reclamar premio
SpinSchema.methods.claimPrize = function() {
  if (this.status !== 'pending') {
    throw new Error('El premio ya ha sido reclamado o ha expirado')
  }
  
  if (new Date() > this.expiresAt) {
    this.status = 'expired'
    this.save()
    throw new Error('El premio ha expirado')
  }
  
  this.status = 'claimed'
  this.claimedAt = new Date()
  return this.save()
}

// Método para marcar como usado
SpinSchema.methods.markAsUsed = function() {
  if (this.status !== 'claimed') {
    throw new Error('El premio debe estar reclamado para poder usarse')
  }
  
  this.status = 'used'
  this.usedAt = new Date()
  return this.save()
}

// Método estático para verificar si el usuario puede girar
SpinSchema.statics.canUserSpin = async function(userId: string, orderId: string) {
  const existingSpin = await this.findOne({ userId, orderId })
  return !existingSpin
}

export default mongoose.models.Spin || mongoose.model<ISpin>('Spin', SpinSchema)
