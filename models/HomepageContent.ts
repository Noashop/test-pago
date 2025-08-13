import mongoose, { Document, Schema } from 'mongoose'

export interface IHomepageContent extends Document {
  _id: string
  title: string
  description: string
  type: 'hero' | 'statistics' | 'features' | 'cta' | 'testimonial' | 'banner' | 'announcement'
  position: number
  isActive: boolean
  content: {
    // Para hero section
    subtitle?: string
    buttonText?: string
    buttonLink?: string
    backgroundImage?: string
    rating?: number
    
    // Para statistics
    stats?: Array<{
      value: string
      label: string
      icon?: string
    }>
    
    // Para features
    features?: Array<{
      title: string
      description: string
      icon: string
    }>
    
    // Para CTA
    primaryButton?: {
      text: string
      link: string
      variant: 'primary' | 'secondary'
    }
    secondaryButton?: {
      text: string
      link: string
      variant: 'primary' | 'secondary'
    }
    
    // Para banners/anuncios
    image?: string
    link?: string
    backgroundColor?: string
    textColor?: string
    
    // Configuración de tamaño y estilo
    size?: 'small' | 'medium' | 'large' | 'full'
    layout?: 'horizontal' | 'vertical' | 'grid'
    
    // Para anuncios específicos de usuarios
    targetAudience?: 'all' | 'clients' | 'suppliers'
    showInNotifications?: boolean
  }
  
  // Configuración de visualización
  displaySettings: {
    showTitle: boolean
    showDescription: boolean
    customCSS?: string
    responsive: {
      mobile: boolean
      tablet: boolean
      desktop: boolean
    }
  }
  
  // Programación
  schedule?: {
    startDate: Date
    endDate: Date
    timezone: string
  }
  
  // Métricas
  metrics: {
    views: number
    clicks: number
    conversions: number
  }
  
  // Metadatos
  createdBy: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
  lastModifiedBy?: mongoose.Types.ObjectId
}

const HomepageContentSchema = new Schema<IHomepageContent>({
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
    maxlength: 1000
  },
  
  type: {
    type: String,
    enum: ['hero', 'statistics', 'features', 'cta', 'testimonial', 'banner', 'announcement'],
    required: true
  },
  
  position: {
    type: Number,
    required: true,
    min: 0
  },
  
  isActive: {
    type: Boolean,
    default: true
  },
  
  content: {
    // Hero section
    subtitle: String,
    buttonText: String,
    buttonLink: String,
    backgroundImage: String,
    rating: {
      type: Number,
      min: 0,
      max: 5
    },
    
    // Statistics
    stats: [{
      value: { type: String, required: true },
      label: { type: String, required: true },
      icon: String
    }],
    
    // Features
    features: [{
      title: { type: String, required: true },
      description: { type: String, required: true },
      icon: { type: String, required: true }
    }],
    
    // CTA buttons
    primaryButton: {
      text: String,
      link: String,
      variant: {
        type: String,
        enum: ['primary', 'secondary'],
        default: 'primary'
      }
    },
    secondaryButton: {
      text: String,
      link: String,
      variant: {
        type: String,
        enum: ['primary', 'secondary'],
        default: 'secondary'
      }
    },
    
    // Banner/announcement
    image: String,
    link: String,
    backgroundColor: String,
    textColor: String,
    
    // Layout settings
    size: {
      type: String,
      enum: ['small', 'medium', 'large', 'full'],
      default: 'medium'
    },
    layout: {
      type: String,
      enum: ['horizontal', 'vertical', 'grid'],
      default: 'horizontal'
    },
    
    // Targeting
    targetAudience: {
      type: String,
      enum: ['all', 'clients', 'suppliers'],
      default: 'all'
    },
    showInNotifications: {
      type: Boolean,
      default: false
    }
  },
  
  displaySettings: {
    showTitle: {
      type: Boolean,
      default: true
    },
    showDescription: {
      type: Boolean,
      default: true
    },
    customCSS: String,
    responsive: {
      mobile: {
        type: Boolean,
        default: true
      },
      tablet: {
        type: Boolean,
        default: true
      },
      desktop: {
        type: Boolean,
        default: true
      }
    }
  },
  
  schedule: {
    startDate: Date,
    endDate: Date,
    timezone: {
      type: String,
      default: 'America/Argentina/Salta'
    }
  },
  
  metrics: {
    views: {
      type: Number,
      default: 0
    },
    clicks: {
      type: Number,
      default: 0
    },
    conversions: {
      type: Number,
      default: 0
    }
  },
  
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  lastModifiedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
})

// Índices para optimizar consultas
HomepageContentSchema.index({ type: 1, position: 1 })
HomepageContentSchema.index({ isActive: 1, 'schedule.startDate': 1, 'schedule.endDate': 1 })
HomepageContentSchema.index({ createdBy: 1 })
HomepageContentSchema.index({ 'content.targetAudience': 1 })

// Virtual para calcular CTR (Click Through Rate)
HomepageContentSchema.virtual('ctr').get(function() {
  if (this.metrics.views === 0) return 0
  return (this.metrics.clicks / this.metrics.views) * 100
})

// Middleware para actualizar lastModifiedBy
HomepageContentSchema.pre('findOneAndUpdate', function() {
  this.set({ updatedAt: new Date() })
})

// Método para verificar si el contenido está activo según programación
HomepageContentSchema.methods.isCurrentlyActive = function(): boolean {
  if (!this.isActive) return false
  
  if (this.schedule) {
    const now = new Date()
    const start = this.schedule.startDate
    const end = this.schedule.endDate
    
    if (start && now < start) return false
    if (end && now > end) return false
  }
  
  return true
}

// Método estático para obtener contenido activo por tipo
HomepageContentSchema.statics.getActiveContentByType = function(type: string) {
  const now = new Date()
  
  return this.find({
    type,
    isActive: true,
    $or: [
      { schedule: { $exists: false } },
      { 'schedule.startDate': { $lte: now }, 'schedule.endDate': { $gte: now } },
      { 'schedule.startDate': { $lte: now }, 'schedule.endDate': { $exists: false } },
      { 'schedule.startDate': { $exists: false }, 'schedule.endDate': { $gte: now } }
    ]
  }).sort({ position: 1 })
}

export default mongoose.models.HomepageContent || mongoose.model<IHomepageContent>('HomepageContent', HomepageContentSchema)
