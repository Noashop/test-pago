import mongoose, { Schema, Document } from 'mongoose'

export interface IProduct extends Document {
  name: string
  description: string
  shortDescription?: string
  category: string
  subcategory: string
  supplierId: mongoose.Types.ObjectId
  supplierName: string
  images: string[]
  stock: number
  costPrice: number
  salePrice: number
  recommendedRetailPrice: number
  minimumPurchaseQuantity: number
  availableQuantity: number
  warranty: string
  adminCostPrice?: number
  adminRecommendedPrice?: number
  profitMargin: number
  unitType: string
  tags: string[]
  status: string
  approvalStatus: string
  rejectionReason?: string
  approvedBy?: {
    adminId: string
    adminName: string
    approvedAt: Date
  }
  rejectedBy?: {
    adminId: string
    adminName: string
    rejectedAt: Date
  }
  
  // Campos específicos dinámicos por categoría/subcategoría
  specificFields: Record<string, any>
  
  // Campos específicos por categoría (para compatibilidad)
  productModel?: string
  brand?: string
  compatibility?: string
  specs?: Record<string, any>
  
  material?: string
  power?: string
  dimensions?: string
  colorOptions?: string[]
  
  sizes?: string[]
  colors?: string[]
  gender?: string
  
  volume?: string
  ingredients?: string
  certifications?: string[]
  expirationDate?: Date
  
  powerType?: string
  voltage?: string
  useType?: string
  includedAccessories?: string[]
  
  ageRange?: string
  safetyCertifications?: string[]
  
  petType?: string
  flavor?: string
  size?: string
  weight?: number
  
  use?: string
  resistanceLevel?: string
  setIncludes?: string[]
  recommendedUsage?: string
  
  pages?: number
  paperType?: string
  format?: string
  bindingType?: string
  
  netWeight?: number
  origin?: string
  nutritionalInfo?: Record<string, any>
  
  // Campos específicos de noashop
  tipo?: string
  pesoVolumen?: string
  fechaVencimiento?: string
  libreGluten?: boolean
  tipoUtensilio?: string
  aptoLavavajillas?: boolean
  medidas?: string
  tipoArticulo?: string
  tamaño?: string
  estiloTematica?: string
  tipoLuz?: string
  potencia?: string
  voltaje?: string
  tipoMueble?: string
  tipoHerramienta?: string
  uso?: string
  talla?: string
  certificaciones?: string
  aplicacionEspecifica?: string
  resistencia?: string
  tipoUtil?: string
  presentacion?: string
  cantidadUnidad?: number
  titulo?: string
  autor?: string
  genero?: string
  editorial?: string
  nivelEducativoRecomendado?: string
  edadSugerida?: string
  tipoPrenda?: string
  tallesDisponibles?: string
  coloresDisponibles?: string
  tipoJuguete?: string
  materialResistente?: boolean
  tipoProducto?: string
  edadRecomendada?: string
  conBaterias?: boolean
  seguridadCertificada?: boolean
  requiereEnsamblaje?: boolean
  tipoEquipo?: string
  pesoDimensiones?: string
  tallesColores?: string
  rodado?: string
  materialCuadro?: string
  frenos?: string
  actividadRecomendada?: string
  nivelUso?: string
  marca?: string
  modelo?: string
  sistemaOperativo?: string
  capacidadAlmacenamiento?: string
  ram?: string
  tamañoPantalla?: string
  tipoConectividad?: string
  incluyeCargador?: boolean
  estado?: string
  tipoAccesorio?: string
  compatibleCon?: string
  conectividad?: string
  potenciaWatts?: string
  especificacionesTecnicas?: string
  tipoProductoTV?: string
  tamañoPulgadas?: string
  resolucion?: string
  sistemaOperativoTV?: string
  tipoProductoElectronico?: string
  caracteristicasTecnicas?: string
  tipoProductoCosmetico?: string
  ingredientesPrincipales?: string
  aptoPielSensible?: boolean
  contenido?: string
  usoSugerido?: string
  dermatologicamenteProbado?: boolean
  presentacionSuplemento?: string
  cantidadPorciones?: number
  conAlcohol?: boolean
  pesoNeto?: string
  requiereRefrigeracion?: string
  conservacionSugerida?: string
  
  // Sales tracking
  salesCount: number
  viewCount: number
  rating: number
  reviewCount: number
  
  createdAt: Date
  updatedAt: Date
}

const ProductSchema = new Schema<IProduct>({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    minlength: 100,
    maxlength: 2000
  },
  shortDescription: {
    type: String,
    required: false,
    maxlength: 200
  },
  category: {
    type: String,
    required: true
  },
  subcategory: {
    type: String,
    required: true
  },
  supplierId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  supplierName: {
    type: String,
    required: true
  },
  images: [{
    type: String,
    required: true,
    validate: {
      validator: function(v: string[]) {
        return v.length >= 1
      },
      message: 'Al menos una imagen es requerida'
    }
  }],
  stock: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  costPrice: {
    type: Number,
    required: true,
    min: 0
  },
  salePrice: {
    type: Number,
    required: true,
    min: 0
  },
  recommendedRetailPrice: {
    type: Number,
    required: true,
    min: 0
  },
  minimumPurchaseQuantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  availableQuantity: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  warranty: {
    type: String,
    required: true,
    enum: ['6 meses', '1 año', '2 años', 'Sin garantía']
  },
  adminCostPrice: {
    type: Number,
    required: false,
    min: 0
  },
  adminRecommendedPrice: {
    type: Number,
    required: false,
    min: 0
  },
  profitMargin: {
    type: Number,
    required: false,
    min: 0
  },
  unitType: {
    type: String,
    required: true,
    enum: ['unidad', 'caja', 'kilo', 'litro', 'metro', 'pack', 'set'],
    default: 'unidad'
  },
  tags: [{
    type: String,
    trim: true
  }],
  status: {
    type: String,
    required: true,
    enum: ['draft', 'pending', 'active', 'inactive', 'out_of_stock', 'discontinued'],
    default: 'pending'
  },
  approvalStatus: {
    type: String,
    required: true,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  rejectionReason: {
    type: String,
    trim: true
  },
  approvedBy: {
    adminId: {
      type: String,
      required: false
    },
    adminName: {
      type: String,
      required: false
    },
    approvedAt: {
      type: Date,
      required: false
    }
  },
  rejectedBy: {
    adminId: {
      type: String,
      required: false
    },
    adminName: {
      type: String,
      required: false
    },
    rejectedAt: {
      type: Date,
      required: false
    }
  },
  
  // Campos específicos dinámicos
  specificFields: {
    type: Schema.Types.Mixed,
    default: {}
  },
  
  // Campos específicos por categoría (para compatibilidad)
  productModel: String,
  brand: String,
  compatibility: String,
  specs: Schema.Types.Mixed,
  
  material: String,
  power: String,
  dimensions: String,
  colorOptions: [String],
  
  sizes: [String],
  colors: [String],
  gender: {
    type: String,
    enum: ['Hombre', 'Mujer', 'Unisex', 'Niños']
  },
  
  volume: String,
  ingredients: String,
  certifications: [String],
  expirationDate: Date,
  
  powerType: {
    type: String,
    enum: ['Manual', 'Eléctrica']
  },
  voltage: String,
  useType: {
    type: String,
    enum: ['Profesional', 'Hogar', 'Doméstico']
  },
  includedAccessories: [String],
  
  ageRange: String,
  safetyCertifications: [String],
  
  petType: {
    type: String,
    enum: ['Perro', 'Gato', 'Ave', 'Otro']
  },
  flavor: String,
  size: String,
  weight: Number,
  
  use: {
    type: String,
    enum: ['Interior', 'Exterior']
  },
  resistanceLevel: String,
  setIncludes: [String],
  recommendedUsage: String,
  
  pages: Number,
  paperType: String,
  format: String,
  bindingType: String,
  
  netWeight: Number,
  origin: String,
  nutritionalInfo: Schema.Types.Mixed,
  
  // Sales tracking
  salesCount: {
    type: Number,
    default: 0,
    min: 0
  },
  viewCount: {
    type: Number,
    default: 0,
    min: 0
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  reviewCount: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true
})

// Indexes for better performance
ProductSchema.index({ name: 'text', description: 'text', tags: 'text' })
ProductSchema.index({ category: 1, subcategory: 1 })
ProductSchema.index({ supplierId: 1 })
ProductSchema.index({ status: 1, approvalStatus: 1 })
ProductSchema.index({ salePrice: 1 })
ProductSchema.index({ salesCount: -1 })
ProductSchema.index({ rating: -1 })

// Validation middleware
ProductSchema.pre('save', function(next) {
  // Ensure salePrice is between costPrice and recommendedRetailPrice
  if (this.salePrice < this.costPrice) {
    return next(new Error('El precio de venta no puede ser menor al precio de costo'))
  }
  
  if (this.salePrice > this.recommendedRetailPrice) {
    return next(new Error('El precio de venta no puede ser mayor al precio sugerido de reventa'))
  }
  
  // Ensure stock is at least minimumPurchaseQuantity
  if (this.stock < this.minimumPurchaseQuantity) {
    return next(new Error('El stock no puede ser menor a la cantidad mínima de pedido'))
  }
  
  next()
})

// Virtual for formatted price
ProductSchema.virtual('formattedPrice').get(function() {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS'
  }).format(this.salePrice)
})

// Virtual for discount percentage
ProductSchema.virtual('discountPercentage').get(function() {
  if (this.recommendedRetailPrice > this.salePrice) {
    return Math.round(((this.recommendedRetailPrice - this.salePrice) / this.recommendedRetailPrice) * 100)
  }
  return 0
})

// Method to update sales count
ProductSchema.methods.incrementSales = function(quantity: number) {
  this.salesCount += quantity
  return this.save()
}

// Method to update view count
ProductSchema.methods.incrementViews = function() {
  this.viewCount += 1
  return this.save()
}

// Static method to get products by category
ProductSchema.statics.findByCategory = function(category: string, subcategory?: string) {
  const query: any = { category, status: 'active', approvalStatus: 'approved' }
  if (subcategory) {
    query.subcategory = subcategory
  }
  return this.find(query)
}

// Static method to get products by supplier
ProductSchema.statics.findBySupplier = function(supplierId: string) {
  return this.find({ supplierId })
}

// Static method to get top selling products
ProductSchema.statics.getTopSelling = function(limit = 10) {
  return this.find({ status: 'active', approvalStatus: 'approved' })
    .sort({ salesCount: -1 })
    .limit(limit)
}

export default mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema)
