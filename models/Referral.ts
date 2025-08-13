import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IReferral extends Document {
  referrerId: mongoose.Types.ObjectId // Usuario que refiere
  referredId: mongoose.Types.ObjectId // Usuario referido
  campaignId?: mongoose.Types.ObjectId // Campaña de referidos asociada
  
  // Estado del referido
  status: 'pending' | 'completed' | 'rewarded' | 'cancelled'
  
  // Información de la compra del referido
  firstPurchase: {
    orderId?: mongoose.Types.ObjectId
    amount?: number
    completedAt?: Date
  }
  
  // Recompensa generada
  reward: {
    type: 'discount_percentage' | 'discount_fixed' | 'free_shipping' | 'coupon'
    value: number
    description: string
    couponCode?: string
    isUsed: boolean
    usedAt?: Date
    expiresAt: Date
  }
  
  // Metadatos
  referralDate: Date
  completedAt?: Date
  rewardedAt?: Date
  createdAt: Date
  updatedAt: Date
  
  // Instance methods
  completeReferral(orderId: string, orderAmount: number): Promise<this>
  generateReward(rewardConfig: any): Promise<this>
}

export interface IReferralModel extends Model<IReferral> {
  countCompletedReferrals(referrerId: string): Promise<number>
  checkRewardEligibility(referrerId: string, requiredReferrals?: number): Promise<boolean>
}

const ReferralSchema = new Schema<IReferral>({
  referrerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  referredId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  campaignId: {
    type: Schema.Types.ObjectId,
    ref: 'Campaign'
  },
  
  status: {
    type: String,
    enum: ['pending', 'completed', 'rewarded', 'cancelled'],
    default: 'pending'
  },
  
  firstPurchase: {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order'
    },
    amount: {
      type: Number
    },
    completedAt: {
      type: Date
    }
  },
  
  reward: {
    type: {
      type: String,
      enum: ['discount_percentage', 'discount_fixed', 'free_shipping', 'coupon']
    },
    value: {
      type: Number
    },
    description: {
      type: String
    },
    couponCode: {
      type: String,
      uppercase: true
    },
    isUsed: {
      type: Boolean,
      default: false
    },
    usedAt: {
      type: Date
    },
    expiresAt: {
      type: Date
    }
  },
  
  referralDate: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date
  },
  rewardedAt: {
    type: Date
  }
}, {
  timestamps: true
})

// Índices para optimizar consultas
ReferralSchema.index({ referrerId: 1, status: 1 })
ReferralSchema.index({ referredId: 1 })
ReferralSchema.index({ campaignId: 1 })
ReferralSchema.index({ 'reward.couponCode': 1 })
ReferralSchema.index({ referralDate: -1 })

// Método para completar referido (cuando hace su primera compra)
ReferralSchema.methods.completeReferral = function(orderId: string, amount: number) {
  if (this.status !== 'pending') {
    throw new Error('El referido ya ha sido completado')
  }
  
  this.status = 'completed'
  this.firstPurchase = {
    orderId,
    amount,
    completedAt: new Date()
  }
  this.completedAt = new Date()
  
  return this.save()
}

// Método para generar recompensa
ReferralSchema.methods.generateReward = function(rewardConfig: any) {
  if (this.status !== 'completed') {
    throw new Error('El referido debe estar completado para generar recompensa')
  }
  
  this.reward = {
    type: rewardConfig.type,
    value: rewardConfig.value,
    description: rewardConfig.description,
    couponCode: rewardConfig.couponCode,
    isUsed: false,
    expiresAt: new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)) // 30 días
  }
  
  this.status = 'rewarded'
  this.rewardedAt = new Date()
  
  return this.save()
}

// Método para completar un referido
ReferralSchema.methods.completeReferral = function(orderId: string, orderAmount: number) {
  this.status = 'completed'
  this.firstPurchase = {
    orderId,
    amount: orderAmount,
    completedAt: new Date()
  }
  this.completedAt = new Date()
  
  return this.save()
}

// Método estático para contar referidos completados de un usuario
ReferralSchema.statics.countCompletedReferrals = async function(referrerId: string) {
  return await this.countDocuments({ 
    referrerId, 
    status: { $in: ['completed', 'rewarded'] } 
  })
}

// Método estático para contar referidos completados
ReferralSchema.statics.countCompletedReferrals = async function(referrerId: string) {
  return await this.countDocuments({ referrerId, status: 'completed' })
}

// Método estático para verificar si un usuario puede recibir recompensa
ReferralSchema.statics.checkRewardEligibility = async function(referrerId: string, requiredReferrals: number = 10) {
  const completedCount = await (this as any).countCompletedReferrals(referrerId)
  return completedCount >= requiredReferrals && completedCount % requiredReferrals === 0
}

export default (mongoose.models.Referral as IReferralModel) || mongoose.model<IReferral, IReferralModel>('Referral', ReferralSchema)
