import mongoose, { Document, Schema } from 'mongoose'

export interface ICategory extends Document {
  _id: string
  name: string
  slug: string
  description?: string
  icon?: string
  subcategories: ISubcategory[]
  createdAt: Date
  updatedAt: Date
}

export interface ISubcategory {
  _id: string
  name: string
  slug: string
  description?: string
  requiredFields: IProductField[]
  optionalFields: IProductField[]
}

export interface IProductField {
  name: string
  type: 'text' | 'number' | 'select' | 'boolean' | 'textarea'
  label: string
  required: boolean
  options?: string[]
  placeholder?: string
  validation?: {
    min?: number
    max?: number
    pattern?: string
  }
}

const ProductFieldSchema = new Schema<IProductField>({
  name: { type: String, required: true },
  type: { type: String, required: true, enum: ['text', 'number', 'select', 'boolean', 'textarea'] },
  label: { type: String, required: true },
  required: { type: Boolean, default: false },
  options: [{ type: String }],
  placeholder: String,
  validation: {
    min: Number,
    max: Number,
    pattern: String
  }
})

const SubcategorySchema = new Schema<ISubcategory>({
  name: { type: String, required: true },
  slug: { type: String, required: true },
  description: String,
  requiredFields: [ProductFieldSchema],
  optionalFields: [ProductFieldSchema]
})

const CategorySchema = new Schema<ICategory>({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: String,
  icon: String,
  subcategories: [SubcategorySchema],
}, {
  timestamps: true
})

export default mongoose.models.Category || mongoose.model<ICategory>('Category', CategorySchema)
