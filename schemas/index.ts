import { z } from 'zod'
import { USER_ROLES, ORDER_STATUS, PRODUCT_STATUS, COUPON_TYPES, TICKET_STATUS, TICKET_PRIORITY } from '@/constants'

// Auth Schemas
export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
})

// Base schema without refine
const baseRegisterSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  confirmPassword: z.string(),
  phone: z.string().optional(),
  role: z.enum([USER_ROLES.CLIENT, USER_ROLES.SUPPLIER]).default(USER_ROLES.CLIENT),
  profileImage: z.string().optional(),
})

export const registerSchema = baseRegisterSchema.refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
})

export const supplierRegisterSchema = baseRegisterSchema.extend({
  businessInfo: z.object({
    businessName: z.string().min(2, 'El nombre del negocio debe tener al menos 2 caracteres'),
    businessType: z.string().min(2, 'El tipo de negocio es requerido'),
    taxId: z.string().min(8, 'El CUIT/CUIL debe tener al menos 8 caracteres'),
    description: z.string().optional(),
    website: z.string().url('URL inválida').optional().or(z.literal('')),
    logo: z.string().optional(),
    
    // Dirección del local
    address: z.object({
      street: z.string().min(2, 'La calle es requerida'),
      city: z.string().min(2, 'La ciudad es requerida'),
      state: z.string().min(2, 'La provincia es requerida'),
      zipCode: z.string().min(4, 'El código postal es requerido'),
      country: z.string().default('Argentina'),
    }),
    
    // Horarios de atención
    openingHours: z.object({
      monday: z.object({
        open: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato inválido (HH:MM)'),
        close: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato inválido (HH:MM)'),
        closed: z.boolean().default(false),
      }),
      tuesday: z.object({
        open: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato inválido (HH:MM)'),
        close: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato inválido (HH:MM)'),
        closed: z.boolean().default(false),
      }),
      wednesday: z.object({
        open: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato inválido (HH:MM)'),
        close: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato inválido (HH:MM)'),
        closed: z.boolean().default(false),
      }),
      thursday: z.object({
        open: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato inválido (HH:MM)'),
        close: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato inválido (HH:MM)'),
        closed: z.boolean().default(false),
      }),
      friday: z.object({
        open: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato inválido (HH:MM)'),
        close: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato inválido (HH:MM)'),
        closed: z.boolean().default(false),
      }),
      saturday: z.object({
        open: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato inválido (HH:MM)'),
        close: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato inválido (HH:MM)'),
        closed: z.boolean().default(false),
      }),
      sunday: z.object({
        open: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato inválido (HH:MM)'),
        close: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato inválido (HH:MM)'),
        closed: z.boolean().default(true),
      }),
    }),
    
    // Redes sociales
    socialMedia: z.object({
      facebook: z.string().url('URL inválida').or(z.literal('')).optional(),
      instagram: z.string().url('URL inválida').or(z.literal('')).optional(),
      twitter: z.string().url('URL inválida').or(z.literal('')).optional(),
    }).optional().default({}),
    
    // Teléfono de contacto
    phone: z.string().min(8, 'El teléfono es requerido'),
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
})

export const forgotPasswordSchema = z.object({
  email: z.string().email('Email inválido'),
})

export const resetPasswordSchema = z.object({
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  confirmPassword: z.string(),
  token: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
})

// User Profile Schemas
export const profileSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  phone: z.string().optional(),
  avatar: z.string().optional(),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zipCode: z.string().optional(),
    country: z.string().default('Argentina'),
  }).optional(),
})

export const updateProfileSchema = profileSchema

export const supplierProfileSchema = profileSchema.extend({
  businessName: z.string().min(2, 'El nombre del negocio debe tener al menos 2 caracteres'),
  businessType: z.string().min(2, 'El tipo de negocio es requerido'),
  taxId: z.string().min(8, 'El CUIT/CUIL debe tener al menos 8 caracteres'),
  description: z.string().optional(),
  website: z.string().url('URL inválida').optional().or(z.literal('')),
  socialMedia: z.object({
    facebook: z.string().optional(),
    instagram: z.string().optional(),
    twitter: z.string().optional(),
  }).optional(),
})

// Product Schemas - Parte 1: Información General
export const productGeneralSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  description: z.string().min(10, 'La descripción debe tener al menos 10 caracteres'),
  shortDescription: z.string().max(160, 'La descripción corta no puede exceder 160 caracteres').optional(),
  category: z.string().min(1, 'La categoría es requerida'),
  subcategory: z.string().min(1, 'La subcategoría es requerida'),
  brand: z.string().optional(),
  sku: z.string().min(1, 'El SKU es requerido'),
  warranty: z.string().min(1, 'La garantía es requerida'),
  // Precios requeridos
  costPrice: z.number().positive('El precio de costo debe ser mayor a 0'),
  salePrice: z.number().positive('El precio de venta debe ser mayor a 0'),
  recommendedRetailPrice: z.number().positive('El precio recomendado de reventa debe ser mayor a 0'),
  // Cantidades requeridas
  minimumPurchaseQuantity: z.number().int().min(1, 'La cantidad mínima de compra debe ser al menos 1'),
  availableQuantity: z.number().int().min(0, 'La cantidad disponible debe ser mayor o igual a 0'),
  // Imágenes - validación mejorada
  images: z.array(z.string()).min(1, 'Debes subir al menos una imagen del producto').max(5, 'Máximo 5 imágenes permitidas'),
})

// Product Schemas - Parte 2: Campos Específicos (dinámico según categoría)
export const productSpecificSchema = z.record(z.string(), z.any())

// Product Schema completo
export const productSchema = productGeneralSchema

// Order Schema - DEFINITIVO Y FUNCIONAL
export const createOrderSchema = z.object({
  items: z.array(z.object({
    product: z.string(),
    quantity: z.number(),
    price: z.number(),
    variant: z.string().optional(),
  })),
  shippingAddress: z.object({
    name: z.string().min(1, 'Nombre requerido'),
    street: z.string().min(1, 'Dirección requerida'),
    city: z.string().min(1, 'Ciudad requerida'),
    state: z.string().min(1, 'Provincia requerida'),
    zipCode: z.string().min(1, 'Código postal requerido'),
    country: z.string().optional(),
    phone: z.string().min(1, 'Teléfono requerido'),
  }),
}).passthrough() // Permite campos adicionales sin validarlos

// Cart Schemas
export const addToCartSchema = z.object({
  productId: z.string().min(1, 'ID del producto requerido'),
  quantity: z.number().int().positive('La cantidad debe ser mayor a 0'),
  variant: z.string().optional(),
})

export const updateCartItemSchema = z.object({
  quantity: z.number().int().min(0, 'La cantidad debe ser mayor o igual a 0'),
})

// Coupon Schemas
export const couponSchema = z.object({
  code: z.string().min(3, 'El código debe tener al menos 3 caracteres').max(20, 'El código no puede exceder 20 caracteres'),
  type: z.enum([COUPON_TYPES.PERCENTAGE, COUPON_TYPES.FIXED_AMOUNT, COUPON_TYPES.FREE_SHIPPING]),
  value: z.number().positive('El valor debe ser mayor a 0'),
  description: z.string().optional(),
  minimumAmount: z.number().min(0).optional(),
  maximumDiscount: z.number().min(0).optional(),
  usageLimit: z.number().int().min(1).optional(),
  usageLimitPerUser: z.number().int().min(1).optional(),
  validFrom: z.date(),
  validUntil: z.date(),
  applicableProducts: z.array(z.string()).optional(),
  applicableCategories: z.array(z.string()).optional(),
  excludeProducts: z.array(z.string()).optional(),
  excludeCategories: z.array(z.string()).optional(),
  firstTimeOnly: z.boolean().default(false),
  active: z.boolean().default(true),
}).refine((data) => data.validFrom < data.validUntil, {
  message: 'La fecha de inicio debe ser anterior a la fecha de fin',
  path: ['validUntil'],
})

// Support Ticket Schemas
export const createTicketSchema = z.object({
  subject: z.string().min(5, 'El asunto debe tener al menos 5 caracteres'),
  message: z.string().min(10, 'El mensaje debe tener al menos 10 caracteres'),
  priority: z.enum([TICKET_PRIORITY.LOW, TICKET_PRIORITY.MEDIUM, TICKET_PRIORITY.HIGH, TICKET_PRIORITY.URGENT]).default(TICKET_PRIORITY.MEDIUM),
  category: z.string().min(1, 'La categoría es requerida'),
  attachments: z.array(z.string()).optional(),
})

export const replyTicketSchema = z.object({
  message: z.string().min(1, 'El mensaje es requerido'),
  attachments: z.array(z.string()).optional(),
  internal: z.boolean().default(false),
})

// Category Schemas
export const categorySchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  slug: z.string().min(2, 'El slug debe tener al menos 2 caracteres'),
  description: z.string().optional(),
  image: z.string().optional(),
  icon: z.string().optional(),
  parent: z.string().optional(),
  seo: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    keywords: z.array(z.string()).optional(),
  }).optional(),
  active: z.boolean().default(true),
  featured: z.boolean().default(false),
  sortOrder: z.number().int().min(0).default(0),
})

// Banner Schemas
export const bannerSchema = z.object({
  title: z.string().min(2, 'El título debe tener al menos 2 caracteres'),
  description: z.string().optional(),
  image: z.string().min(1, 'La imagen es requerida'),
  mobileImage: z.string().optional(),
  link: z.string().optional(),
  linkText: z.string().optional(),
  position: z.enum(['hero', 'sidebar', 'footer', 'popup']).default('hero'),
  active: z.boolean().default(true),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  targetAudience: z.object({
    roles: z.array(z.string()).optional(),
    newUsers: z.boolean().default(false),
    returningUsers: z.boolean().default(false),
  }).optional(),
  sortOrder: z.number().int().min(0).default(0),
})

// Search Schemas
export const searchSchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  minPrice: z.number().min(0).optional(),
  maxPrice: z.number().min(0).optional(),
  brand: z.string().optional(),
  supplier: z.string().optional(),
  inStock: z.boolean().optional(),
  featured: z.boolean().optional(),
  sortBy: z.enum(['relevance', 'price_asc', 'price_desc', 'name_asc', 'name_desc', 'newest', 'rating']).default('relevance'),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
})

// Export type definitions
export type LoginSchema = z.infer<typeof loginSchema>
export type RegisterSchema = z.infer<typeof registerSchema>
export type SupplierRegisterSchema = z.infer<typeof supplierRegisterSchema>
export type ForgotPasswordSchema = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordSchema = z.infer<typeof resetPasswordSchema>
export type ProfileSchema = z.infer<typeof profileSchema>
export type UpdateProfileSchema = z.infer<typeof profileSchema>
export type SupplierProfileSchema = z.infer<typeof supplierProfileSchema>
export type ProductGeneralSchema = z.infer<typeof productGeneralSchema>
export type ProductSpecificSchema = z.infer<typeof productSpecificSchema>
export type ProductSchema = z.infer<typeof productSchema>
export type CreateOrderSchema = z.infer<typeof createOrderSchema>
export type AddToCartSchema = z.infer<typeof addToCartSchema>
export type UpdateCartItemSchema = z.infer<typeof updateCartItemSchema>
export type CouponSchema = z.infer<typeof couponSchema>
export type CreateTicketSchema = z.infer<typeof createTicketSchema>
export type ReplyTicketSchema = z.infer<typeof replyTicketSchema>
export type CategorySchema = z.infer<typeof categorySchema>
export type BannerSchema = z.infer<typeof bannerSchema>
export type SearchSchema = z.infer<typeof searchSchema>
