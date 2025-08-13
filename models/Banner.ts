import mongoose, { Schema, Document } from 'mongoose'

export interface IBanner extends Document {
  title: string
  description: string
  imageUrl: string
  linkUrl?: string
  position: 'hero' | 'sidebar' | 'footer' | 'popup'
  isActive: boolean
  startDate: Date
  endDate?: Date
  priority: number
  targetAudience?: 'all' | 'clients' | 'suppliers' | 'admin'
  clicks: number
  impressions: number
  createdBy: {
    adminId: string
    adminName: string
  }
  createdAt: Date
  updatedAt: Date
}

const BannerSchema = new Schema<IBanner>({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  imageUrl: {
    type: String,
    required: true
  },
  linkUrl: {
    type: String,
    trim: true
  },
  position: {
    type: String,
    required: true,
    enum: ['hero', 'sidebar', 'footer', 'popup'],
    default: 'hero'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  startDate: {
    type: Date,
    required: true,
    default: Date.now
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
  targetAudience: {
    type: String,
    enum: ['all', 'clients', 'suppliers', 'admin'],
    default: 'all'
  },
  clicks: {
    type: Number,
    default: 0
  },
  impressions: {
    type: Number,
    default: 0
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
BannerSchema.index({ position: 1, isActive: 1 })
BannerSchema.index({ startDate: 1, endDate: 1 })
BannerSchema.index({ targetAudience: 1 })
BannerSchema.index({ priority: -1 })

// Método para verificar si el banner está activo
BannerSchema.methods.isCurrentlyActive = function() {
  const now = new Date()
  return this.isActive && 
         this.startDate <= now && 
         (!this.endDate || this.endDate >= now)
}

export default mongoose.models.Banner || mongoose.model<IBanner>('Banner', BannerSchema)
