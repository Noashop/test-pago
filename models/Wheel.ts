import mongoose, { Schema, Document } from 'mongoose'

export interface IWheel extends Document {
  userId: string
  spins: number
  lastSpinDate?: Date
  totalSpins: number
  prizesWon: Array<{
    type: string
    value: number
    wonAt: Date
  }>
  createdAt: Date
  updatedAt: Date
}

const WheelSchema = new Schema<IWheel>({
  userId: {
    type: String,
    required: true,
    unique: true
  },
  spins: {
    type: Number,
    default: 0
  },
  lastSpinDate: {
    type: Date
  },
  totalSpins: {
    type: Number,
    default: 0
  },
  prizesWon: [{
    type: {
      type: String,
      required: true
    },
    value: {
      type: Number,
      required: true
    },
    wonAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
})

// Métodos estáticos
WheelSchema.statics.findOrCreate = async function(userId: string) {
  let wheel = await this.findOne({ userId })
  if (!wheel) {
    wheel = await this.create({ userId })
  }
  return wheel
}

WheelSchema.statics.grantDailySpin = async function(userId: string) {
  const wheel = await this.findOne({ userId })
  if (!wheel) {
    await this.create({ userId, spins: 1 })
    return true
  }

  const now = new Date()
  const lastSpin = wheel.lastSpinDate || new Date(0)
  const hoursSinceLastSpin = (now.getTime() - lastSpin.getTime()) / (1000 * 60 * 60)

  if (hoursSinceLastSpin >= 24) {
    wheel.spins += 1
    wheel.lastSpinDate = now
    await wheel.save()
    return true
  }

  return false
}

WheelSchema.statics.grantSpinForOrder = async function(userId: string) {
  let wheel = await this.findOne({ userId })
  if (!wheel) {
    wheel = await this.create({ userId })
  }

  wheel.spins += 1
  await wheel.save()
  return wheel
}

export default mongoose.models.Wheel || mongoose.model<IWheel>('Wheel', WheelSchema) 