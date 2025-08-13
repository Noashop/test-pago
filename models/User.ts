import mongoose, { Document, Schema } from 'mongoose'
import { USER_ROLES, UserRole } from '@/constants'

export interface IUser extends Document {
  _id: string
  name: string
  email: string
  password?: string
  image?: string
  role: UserRole
  phone?: string
  address?: {
    street: string
    city: string
    state: string
    zipCode: string
    country: string
  }
  isEmailVerified: boolean
  // Email verification via OTP
  emailVerificationCode?: string
  emailVerificationExpires?: Date
  emailVerificationAttempts?: number
  emailVerificationToken?: string
  passwordResetToken?: string
  passwordResetExpires?: Date
  lastLogin?: Date
  preferences?: {
    emailNotifications: boolean
    smsNotifications: boolean
    marketingEmails: boolean
  }
  // Address book for shipping/billing
  addressBook?: Array<{
    _id?: string
    label?: string
    street: string
    city: string
    state: string
    zipCode: string
    country: string
    phone?: string
    type?: 'shipping' | 'billing'
    isDefault?: boolean
  }>
  // Wallets for payouts/refunds
  wallets?: Array<{
    _id?: string
    provider: 'mercadopago' | 'bank'
    alias?: string
    cbu?: string
    cvu?: string
    accountId?: string
    holderName?: string
    isPrimary?: boolean
  }>
  
  // Supplier specific fields
  businessInfo?: {
    businessName: string
    businessType: string
    taxId: string
    address: {
      street: string
      city: string
      state: string
      zipCode: string
      country: string
    }
    phone: string
    website?: string
    logo?: string
    description?: string
    socialMedia?: {
      facebook?: string
      instagram?: string
      twitter?: string
    }
    // Extended supplier store information
    storeName?: string
    pickupAddress?: {
      street: string
      city: string
      state: string
      zipCode: string
      country: string
      phone?: string
    }
    openingHours?: string
  }
  
  // Approval status for suppliers
  isApproved?: boolean
  approvalDate?: Date
  approvedBy?: {
    adminId: string
    adminName: string
    approvedAt: Date
  }
  rejectionReason?: string
  suspensionReason?: string
  
  // Account status
  isActive: boolean
  
  // Permissions for admin roles
  permissions?: string[]
  
  // Stats for suppliers
  stats?: {
    totalProducts: number
    totalSales: number
  }
  
  createdAt: Date
  updatedAt: Date
}

const UserSchema = new Schema<IUser>({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    minlength: 6,
    select: false
  },
  image: {
    type: String
  },
  role: {
    type: String,
    enum: Object.values(USER_ROLES),
    default: USER_ROLES.CLIENT
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationCode: {
    type: String,
    select: false
  },
  emailVerificationExpires: {
    type: Date,
    select: false
  },
  emailVerificationAttempts: {
    type: Number,
    default: 0,
    select: false
  },
  permissions: [{
    type: String,
    enum: ['users', 'products', 'promos', 'orders', 'support', 'clients', 'suppliers']
  }],
  phone: {
    type: String,
    trim: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  addressBook: [{
    label: { type: String, trim: true },
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true },
    country: { type: String, required: true },
    phone: { type: String },
    type: { type: String, enum: ['shipping', 'billing'], default: 'shipping' },
    isDefault: { type: Boolean, default: false }
  }],
  wallets: [{
    provider: { type: String, enum: ['mercadopago', 'bank'], required: true },
    alias: { type: String, trim: true },
    cbu: { type: String, trim: true },
    cvu: { type: String, trim: true },
    accountId: { type: String, trim: true },
    holderName: { type: String, trim: true },
    isPrimary: { type: Boolean, default: false }
  }],
  preferences: {
    notifications: {
      type: Boolean,
      default: true
    },
    marketing: {
      type: Boolean,
      default: false
    },
    language: {
      type: String,
      default: 'es'
    }
  },
  businessInfo: {
    businessName: {
      type: String,
      trim: true,
      maxlength: 200
    },
    businessType: {
      type: String,
      trim: true
    },
    taxId: {
      type: String,
      trim: true
    },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String
    },
    phone: String,
    website: String,
    logo: String,
    description: {
      type: String,
      maxlength: 1000
    },
    socialMedia: {
      facebook: String,
      instagram: String,
      twitter: String
    },
    storeName: { type: String, trim: true },
    pickupAddress: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String,
      phone: String
    },
    openingHours: { type: String }
  },
  isApproved: {
    type: Boolean,
    default: false
  },
  approvalDate: Date,
  approvedBy: {
    adminId: String,
    adminName: String,
    approvedAt: Date
  },
  rejectionReason: String,
  suspensionReason: String,
  stats: {
    totalProducts: {
      type: Number,
      default: 0
    },
    totalSales: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
})

// Indexes
UserSchema.index({ email: 1 })
UserSchema.index({ role: 1 })
UserSchema.index({ isApproved: 1 })
UserSchema.index({ 'businessInfo.businessName': 'text' })
UserSchema.index({ 'addressBook.isDefault': 1 })

// Virtual for supplier status
UserSchema.virtual('supplierStatus').get(function() {
  if (this.role !== USER_ROLES.SUPPLIER) return null
  
  if (this.isApproved === true) return 'approved'
  if (this.isApproved === false) return 'rejected'
  return 'pending'
})

// Method to check if user can access supplier features
UserSchema.methods.canAccessSupplierFeatures = function() {
  return this.role === USER_ROLES.SUPPLIER && this.isApproved === true
}

// Method to check if user can access admin features
UserSchema.methods.canAccessAdminFeatures = function() {
  return this.role === USER_ROLES.ADMIN
}

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema)
