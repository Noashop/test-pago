import mongoose from 'mongoose'

const SiteContentSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  type: {
    type: String,
    required: true,
    enum: ['hero', 'section', 'cta', 'text', 'image', 'stats']
  },
  title: {
    type: String,
    required: true
  },
  subtitle: String,
  description: String,
  content: mongoose.Schema.Types.Mixed, // Para contenido flexible
  metadata: {
    icon: String,
    color: String,
    badge: String,
    link: String,
    buttonText: String,
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true }
  },
  seo: {
    metaTitle: String,
    metaDescription: String,
    keywords: [String]
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
})

// Índices para optimización
SiteContentSchema.index({ type: 1, 'metadata.isActive': 1 })
SiteContentSchema.index({ 'metadata.order': 1 })

export default mongoose.models.SiteContent || mongoose.model('SiteContent', SiteContentSchema)
