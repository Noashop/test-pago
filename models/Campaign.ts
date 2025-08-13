import mongoose, { Schema, Document } from 'mongoose'

export interface ICampaign extends Document {
  title: string
  description: string
  content: string
  type: 'promotion' | 'announcement' | 'referral' | 'roulette' | 'banner'
  
  // Personalización visual
  design: {
    fontFamily: 'roboto' | 'opensans' | 'montserrat'
    fontSize: 'small' | 'medium' | 'large'
    textColor: string
    backgroundColor: string
    borderColor?: string
    
    // Para imágenes
    imageUrl?: string
    imageSize: 'small' | 'medium' | 'large' | 'full'
    imagePosition: 'top' | 'bottom' | 'left' | 'right' | 'background'
    
    // Para banners
    bannerSize: 'small' | 'medium' | 'large' | 'full-width'
    bannerPosition: 'hero' | 'sidebar' | 'footer' | 'popup' | 'notification'
  }
  
  // Configuración de audiencia
  targetAudience: 'all' | 'clients' | 'suppliers' | 'both'
  
  // Configuración de campaña
  isActive: boolean
  status: 'draft' | 'active' | 'paused' | 'completed' | 'cancelled'
  startDate: Date
  endDate?: Date
  priority: number
  
  // Métricas
  views: number
  clicks: number
  interactions: number
  
  // Configuración específica para ruleta
  rouletteConfig?: {
    isEnabled: boolean
    triggersPerPurchase: number
    prizes: Array<{
      id: string
      name: string
      type: 'discount_percentage' | 'discount_fixed' | 'free_shipping' | 'coupon'
      value: number
      probability: number
      conditions?: {
        minAmount?: number
        maxUses?: number
        validDays?: number
      }
    }>
  }
  
  // Configuración para referidos
  referralConfig?: {
    isEnabled: boolean
    referralsRequired: number
    reward: {
      type: 'discount_percentage' | 'discount_fixed' | 'free_shipping'
      value: number
      description: string
    }
  }
  
  // Configuración de notificaciones
  notificationConfig: {
    showInNotifications: boolean
    autoSend: boolean
    sendDate?: Date
    customMessage?: string
  }
  
  createdBy: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const CampaignSchema = new Schema<ICampaign>({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  content: {
    type: String,
    required: true,
    maxlength: 2000
  },
  type: {
    type: String,
    required: true,
    enum: ['promotion', 'announcement', 'referral', 'roulette', 'banner']
  },
  
  design: {
    fontFamily: {
      type: String,
      enum: ['roboto', 'opensans', 'montserrat'],
      default: 'roboto'
    },
    fontSize: {
      type: String,
      enum: ['small', 'medium', 'large'],
      default: 'medium'
    },
    textColor: {
      type: String,
      default: '#000000'
    },
    backgroundColor: {
      type: String,
      default: '#ffffff'
    },
    borderColor: {
      type: String
    },
    imageUrl: {
      type: String
    },
    imageSize: {
      type: String,
      enum: ['small', 'medium', 'large', 'full'],
      default: 'medium'
    },
    imagePosition: {
      type: String,
      enum: ['top', 'bottom', 'left', 'right', 'background'],
      default: 'top'
    },
    bannerSize: {
      type: String,
      enum: ['small', 'medium', 'large', 'full-width'],
      default: 'medium'
    },
    bannerPosition: {
      type: String,
      enum: ['hero', 'sidebar', 'footer', 'popup', 'notification'],
      default: 'hero'
    }
  },
  
  targetAudience: {
    type: String,
    enum: ['all', 'clients', 'suppliers', 'both'],
    default: 'all'
  },
  
  isActive: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'paused', 'completed', 'cancelled'],
    default: 'draft'
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date
  },
  priority: {
    type: Number,
    default: 1,
    min: 1,
    max: 10
  },
  
  views: {
    type: Number,
    default: 0
  },
  clicks: {
    type: Number,
    default: 0
  },
  interactions: {
    type: Number,
    default: 0
  },
  
  rouletteConfig: {
    isEnabled: {
      type: Boolean,
      default: false
    },
    triggersPerPurchase: {
      type: Number,
      default: 1
    },
    prizes: [{
      id: String,
      name: String,
      type: {
        type: String,
        enum: ['discount_percentage', 'discount_fixed', 'free_shipping', 'coupon']
      },
      value: Number,
      probability: Number,
      conditions: {
        minAmount: Number,
        maxUses: Number,
        validDays: Number
      }
    }]
  },
  
  referralConfig: {
    isEnabled: {
      type: Boolean,
      default: false
    },
    referralsRequired: {
      type: Number,
      default: 10
    },
    reward: {
      type: {
        type: String,
        enum: ['discount_percentage', 'discount_fixed', 'free_shipping']
      },
      value: Number,
      description: String
    }
  },
  
  notificationConfig: {
    showInNotifications: {
      type: Boolean,
      default: true
    },
    autoSend: {
      type: Boolean,
      default: false
    },
    sendDate: {
      type: Date
    },
    customMessage: {
      type: String,
      maxlength: 500
    }
  },
  
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
})

// Índices para optimizar consultas
CampaignSchema.index({ type: 1, isActive: 1 })
CampaignSchema.index({ targetAudience: 1, status: 1 })
CampaignSchema.index({ startDate: 1, endDate: 1 })
CampaignSchema.index({ priority: -1 })
CampaignSchema.index({ createdBy: 1 })

// Método para verificar si la campaña está activa
CampaignSchema.methods.isCurrentlyActive = function() {
  const now = new Date()
  return this.isActive && 
         this.status === 'active' &&
         this.startDate <= now && 
         (!this.endDate || this.endDate >= now)
}

// Método para incrementar métricas
CampaignSchema.methods.incrementMetric = function(metric: 'views' | 'clicks' | 'interactions') {
  this[metric] += 1
  return this.save()
}

export default mongoose.models.Campaign || mongoose.model<ICampaign>('Campaign', CampaignSchema)
