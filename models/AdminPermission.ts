import mongoose, { Schema, Document } from 'mongoose'
import { ADMIN_PERMISSIONS, PERMISSION_LEVELS } from '@/constants'

export interface IAdminPermission extends Document {
  adminId: mongoose.Types.ObjectId
  permission: string
  level: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const AdminPermissionSchema = new Schema<IAdminPermission>({
  adminId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  permission: {
    type: String,
    required: true,
    enum: Object.values(ADMIN_PERMISSIONS)
  },
  level: {
    type: String,
    required: true,
    enum: Object.values(PERMISSION_LEVELS)
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
})

// Compound index for efficient queries
AdminPermissionSchema.index({ adminId: 1, permission: 1 }, { unique: true })
AdminPermissionSchema.index({ adminId: 1, isActive: 1 })

export default mongoose.models.AdminPermission || mongoose.model<IAdminPermission>('AdminPermission', AdminPermissionSchema) 