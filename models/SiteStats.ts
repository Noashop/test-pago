import mongoose from 'mongoose'

const SiteStatsSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  label: {
    type: String,
    required: true
  },
  value: {
    type: String,
    required: true
  },
  suffix: String, // Para "+", "%", etc.
  description: String,
  icon: String,
  color: String,
  category: {
    type: String,
    enum: ['hero', 'main', 'secondary', 'footer'],
    default: 'main'
  },
  isRealTime: {
    type: Boolean,
    default: false // Si debe calcularse en tiempo real desde la BD
  },
  calculation: {
    model: String, // Modelo para calcular (ej: 'Product', 'User')
    field: String, // Campo a contar/sumar
    filter: mongoose.Schema.Types.Mixed // Filtros para el cálculo
  },
  order: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
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
SiteStatsSchema.index({ category: 1, isActive: 1, order: 1 })

export default mongoose.models.SiteStats || mongoose.model('SiteStats', SiteStatsSchema)
