import mongoose from 'mongoose'

const TestimonialSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  subtitle: String,
  description: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    required: true // Emoji o nombre de ícono
  },
  author: {
    name: String,
    role: String,
    company: String,
    avatar: String
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    default: 5
  },
  category: {
    type: String,
    enum: ['main', 'secondary', 'footer', 'about'],
    default: 'main'
  },
  type: {
    type: String,
    enum: ['testimonial', 'info_card', 'feature_card'],
    default: 'testimonial'
  },
  backgroundColor: String,
  textColor: String,
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
TestimonialSchema.index({ category: 1, type: 1, isActive: 1, order: 1 })

export default mongoose.models.Testimonial || mongoose.model('Testimonial', TestimonialSchema)
