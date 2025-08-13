import mongoose from 'mongoose'

const FeatureSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    required: true // Nombre del ícono de Lucide React
  },
  color: {
    type: String,
    required: true // Clase de color de Tailwind
  },
  category: {
    type: String,
    enum: ['why_choose_us', 'additional_features', 'benefits'],
    default: 'why_choose_us'
  },
  order: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  metadata: {
    link: String,
    buttonText: String,
    badge: String
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
FeatureSchema.index({ category: 1, isActive: 1, order: 1 })

export default mongoose.models.Feature || mongoose.model('Feature', FeatureSchema)
