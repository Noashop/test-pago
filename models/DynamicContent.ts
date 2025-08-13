import mongoose, { Schema, Document } from 'mongoose'

export interface IDynamicContent extends Document {
  section: 'hero_stats' | 'features' | 'testimonials' | 'cta' | 'categories' | 'stats_bar'
  title: string
  subtitle?: string
  content: any // Contenido flexible según el tipo de sección
  
  // Personalización visual
  design: {
    fontFamily: 'roboto' | 'opensans' | 'montserrat'
    fontSize: 'small' | 'medium' | 'large'
    textColor: string
    backgroundColor: string
    borderColor?: string
    imageUrl?: string
    iconUrl?: string
    customCSS?: string
  }
  
  // Configuración
  isActive: boolean
  order: number
  showOnMobile: boolean
  showOnDesktop: boolean
  
  // Metadatos
  createdBy: mongoose.Types.ObjectId
  lastModifiedBy: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const DynamicContentSchema = new Schema<IDynamicContent>({
  section: {
    type: String,
    required: true,
    enum: ['hero_stats', 'features', 'testimonials', 'cta', 'categories', 'stats_bar']
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  subtitle: {
    type: String,
    trim: true,
    maxlength: 300
  },
  content: {
    type: Schema.Types.Mixed,
    required: true
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
    iconUrl: {
      type: String
    },
    customCSS: {
      type: String,
      maxlength: 2000
    }
  },
  
  isActive: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 1
  },
  showOnMobile: {
    type: Boolean,
    default: true
  },
  showOnDesktop: {
    type: Boolean,
    default: true
  },
  
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastModifiedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
})

// Índices para optimizar consultas
DynamicContentSchema.index({ section: 1, isActive: 1 })
DynamicContentSchema.index({ order: 1 })
DynamicContentSchema.index({ createdBy: 1 })

// Método estático para obtener contenido por sección
DynamicContentSchema.statics.getBySection = function(section: string) {
  return this.find({ 
    section, 
    isActive: true 
  }).sort({ order: 1 })
}

export default mongoose.models.DynamicContent || mongoose.model<IDynamicContent>('DynamicContent', DynamicContentSchema)
