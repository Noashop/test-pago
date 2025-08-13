// User roles
export const USER_ROLES = {
  CLIENT: 'client',
  CUSTOMER: 'client', // Alias for CLIENT to maintain consistency
  SUPPLIER: 'supplier',
  ADMIN: 'admin',
  ADMIN_USERS: 'admin-users',
  ADMIN_PRODUCTS: 'admin-products',
  ADMIN_PROMOS: 'admin-promos',
  ADMIN_ORDERS: 'admin-orders',
  ADMIN_SUPPORTS: 'admin-supports'
} as const

// User role type
export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES]

// Order status
export const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded'
} as const

// Payment status
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded'
} as const

// Product status
export const PRODUCT_STATUS = {
  DRAFT: 'draft',
  PENDING: 'pending',
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  OUT_OF_STOCK: 'out_of_stock',
  DISCONTINUED: 'discontinued'
} as const

// Ticket status
export const TICKET_STATUS = {
  OPEN: 'open',
  IN_PROGRESS: 'in_progress',
  RESOLVED: 'resolved',
  CLOSED: 'closed'
} as const

// Ticket priority
export const TICKET_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent'
} as const

// Supplier status
export const SUPPLIER_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  SUSPENDED: 'suspended'
} as const

// Product approval status
export const PRODUCT_APPROVAL_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected'
} as const

// Coupon types
export const COUPON_TYPES = {
  PERCENTAGE: 'percentage',
  FIXED_AMOUNT: 'fixed_amount',
  FREE_SHIPPING: 'free_shipping',
  BUY_ONE_GET_ONE: 'buy_one_get_one'
} as const

// Coupon status
export const COUPON_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  EXPIRED: 'expired'
} as const

// Promotion types
export const PROMOTION_TYPES = {
  PERCENTAGE: 'percentage',
  FIXED_AMOUNT: 'fixed_amount',
  FREE_SHIPPING: 'free_shipping',
  BUY_ONE_GET_ONE: 'buy_one_get_one'
} as const

// Admin permissions
export const ADMIN_PERMISSIONS = {
  PRODUCTS: 'products',
  SUPPORT: 'support',
  CUSTOMERS: 'customers',
  ORDERS: 'orders',
  PROMOTIONS: 'promotions',
  WHEEL: 'wheel',
  SUPPLIERS: 'suppliers',
  COUPONS: 'coupons',
  REPORTS: 'reports',
  SETTINGS: 'settings'
} as const

// Permission levels
export const PERMISSION_LEVELS = {
  VIEW: 'view',
  EDIT: 'edit',
  DELETE: 'delete',
  MANAGE: 'manage'
} as const

// Shipping methods
export const SHIPPING_METHODS = {
  HOME_DELIVERY: 'home_delivery',
  PICKUP: 'pickup',
  EXPRESS: 'express'
} as const

// Wheel prize types
export const WHEEL_PRIZE_TYPES = {
  COUPON: 'coupon',
  DISCOUNT: 'discount',
  FREE_SHIPPING: 'free_shipping',
  CASHBACK: 'cashback',
  PRODUCT: 'product'
} as const

// Category icons mapping
export const CATEGORY_ICONS = {
  ELECTRONICA: 'Smartphone',
  HOGAR_COCINA: 'Home',
  MODA: 'Shirt',
  SALUD_BELLEZA: 'Heart',
  HERRAMIENTAS_INDUSTRIA: 'Wrench',
  BEBES_NINOS: 'Baby',
  MASCOTAS: 'Dog',
  DEPORTES_FITNESS: 'Dumbbell',
  PAPELERIA_LIBRERIA: 'BookOpen',
  ALIMENTOS_BEBIDAS: 'Coffee'
} as const

// Detailed Categories and Subcategories
export const PRODUCT_CATEGORIES = {
  ELECTRONICA: {
    name: 'Electrónica',
    subcategories: [
      'Celulares y Smartphones',
      'Accesorios (cargadores, cables, fundas)',
      'Audio (auriculares, parlantes)',
      'Computación (notebooks, monitores)',
      'Almacenamiento (pendrives, discos externos)',
      'Smartwatches y wearables'
    ]
  },
  HOGAR_COCINA: {
    name: 'Hogar y Cocina',
    subcategories: [
      'Electrodomésticos (licuadoras, hornos)',
      'Cocina (batería de cocina, utensilios)',
      'Decoración (cuadros, velas)',
      'Limpieza (productos, herramientas)',
      'Muebles (sillas, mesas)'
    ]
  },
  MODA: {
    name: 'Moda',
    subcategories: [
      'Ropa Hombre (camisas, pantalones)',
      'Ropa Mujer (vestidos, tops)',
      'Calzado (zapatillas, botas)',
      'Accesorios (carteras, relojes, lentes)'
    ]
  },
  SALUD_BELLEZA: {
    name: 'Salud y Belleza',
    subcategories: [
      'Cosmética (maquillaje, cremas)',
      'Cuidado personal (afeitado, depilación)',
      'Suplementos (vitaminas, proteínas)',
      'Instrumental (cepillos eléctricos, planchitas)'
    ]
  },
  HERRAMIENTAS_INDUSTRIA: {
    name: 'Herramientas e Industria',
    subcategories: [
      'Herramientas eléctricas (taladros, amoladoras)',
      'Manuales (destornilladores, llaves)',
      'Seguridad industrial (guantes, cascos)',
      'Materiales (adhesivos, cintas, pinturas)'
    ]
  },
  BEBES_NINOS: {
    name: 'Bebés y Niños',
    subcategories: [
      'Ropa y Calzado',
      'Juguetes',
      'Accesorios (mordillos, mamaderas)',
      'Muebles (cunas, cochecitos)'
    ]
  },
  MASCOTAS: {
    name: 'Mascotas',
    subcategories: [
      'Alimentos',
      'Juguetes',
      'Higiene (champús, arenas)',
      'Accesorios (collares, camas)'
    ]
  },
  DEPORTES_FITNESS: {
    name: 'Deportes y Fitness',
    subcategories: [
      'Equipamiento (pesas, bandas)',
      'Ropa deportiva',
      'Bicicletas y repuestos',
      'Suplementos deportivos'
    ]
  },
  PAPELERIA_LIBRERIA: {
    name: 'Papelería y Librería',
    subcategories: [
      'Útiles escolares',
      'Artículos de oficina',
      'Libros y cuadernos',
      'Manualidades'
    ]
  },
  ALIMENTOS_BEBIDAS: {
    name: 'Alimentos y Bebidas',
    subcategories: [
      'Almacén (enlatados, snacks)',
      'Bebidas (jugos, energéticas)',
      'Productos regionales',
      'Veganos / sin TACC'
    ]
  }
} as const

// Product fields by category
export const PRODUCT_FIELDS_BY_CATEGORY = {
  ELECTRONICA: ['model', 'brand', 'compatibility', 'warranty', 'specs'],
  HOGAR_COCINA: ['material', 'power', 'dimensions', 'colorOptions'],
  MODA: ['sizes', 'colors', 'gender', 'material'],
  SALUD_BELLEZA: ['volume', 'ingredients', 'certifications', 'expirationDate'],
  HERRAMIENTAS_INDUSTRIA: ['powerType', 'voltage', 'useType', 'includedAccessories'],
  BEBES_NINOS: ['ageRange', 'safetyCertifications', 'material', 'brand'],
  MASCOTAS: ['petType', 'flavor', 'size', 'weight'],
  DEPORTES_FITNESS: ['use', 'resistanceLevel', 'setIncludes', 'recommendedUsage'],
  PAPELERIA_LIBRERIA: ['pages', 'paperType', 'format', 'bindingType'],
  ALIMENTOS_BEBIDAS: ['netWeight', 'expirationDate', 'origin', 'nutritionalInfo']
} as const

// Unit types for products
export const UNIT_TYPES = {
  UNIT: 'unidad',
  BOX: 'caja',
  KILO: 'kilo',
  LITER: 'litro',
  METER: 'metro',
  PACK: 'pack',
  SET: 'set'
} as const

// App colors (Salta Conecta theme)
export const APP_COLORS = {
  primary: '#73A8B3', // Teal desaturado
  secondary: '#213235', // Teal oscuro desaturado
  accent: '#E07A5F', // Naranja vibrante
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
  background: '#f8fafc',
  surface: '#ffffff',
  text: '#1e293b',
  textSecondary: '#64748b'
} as const

// App fonts
export const APP_FONTS = {
  primary: 'PT Sans',
  secondary: 'Playfair Display',
  mono: 'JetBrains Mono'
} as const

// File upload limits
export const FILE_UPLOAD = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  MAX_FILES: 10
} as const

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100
} as const

// Search
export const SEARCH = {
  MIN_LENGTH: 2,
  MAX_RESULTS: 50
} as const

// Notifications
export const NOTIFICATION_TYPES = {
  ORDER_UPDATE: 'order_update',
  PAYMENT_SUCCESS: 'payment_success',
  COUPON_EXPIRING: 'coupon_expiring',
  PROMOTION_ACTIVE: 'promotion_active',
  WHEEL_PRIZE: 'wheel_prize',
  SUPPORT_TICKET: 'support_ticket'
} as const

// Email templates
export const EMAIL_TEMPLATES = {
  WELCOME: 'welcome',
  ORDER_CONFIRMATION: 'order_confirmation',
  PASSWORD_RESET: 'password_reset',
  COUPON_NOTIFICATION: 'coupon_notification',
  WHEEL_PRIZE: 'wheel_prize'
} as const

// Navbar banner messages
export const NAVBAR_BANNER_MESSAGES = [
  '🚀 ¡Envío gratis en compras mayores a $50.000!',
  '🎁 ¡Gira la ruleta y gana descuentos increíbles!',
  '⚡ ¡Ofertas especiales para mayoristas!',
  '💎 ¡Productos de calidad al mejor precio!',
  '🌟 ¡Más de 1000 productos disponibles!'
] as const

// Wheel prizes configuration
export const WHEEL_PRIZES = {
  COUPON_10: { label: '10% OFF', value: 10, type: 'percentage', probability: 0.3 },
  COUPON_20: { label: '20% OFF', value: 20, type: 'percentage', probability: 0.15 },
  FREE_SHIPPING: { label: 'Envío Gratis', value: 0, type: 'free_shipping', probability: 0.25 },
  CASHBACK_5000: { label: '$5.000 Cashback', value: 5000, type: 'cashback', probability: 0.1 },
  CASHBACK_10000: { label: '$10.000 Cashback', value: 10000, type: 'cashback', probability: 0.05 },
  SURPRISE: { label: '¡Sorpresa!', value: 0, type: 'surprise', probability: 0.15 }
} as const

// Shipping costs by supplier (example)
export const SHIPPING_COSTS = {
  DEFAULT: {
    home_delivery: 5000,
    pickup: 0,
    express: 8000
  },
  BY_REGION: {
    'Buenos Aires': { home_delivery: 3000, pickup: 0, express: 6000 },
    'Córdoba': { home_delivery: 4000, pickup: 0, express: 7000 },
    'Santa Fe': { home_delivery: 4500, pickup: 0, express: 7500 },
    'Salta': { home_delivery: 2000, pickup: 0, express: 5000 }
  }
} as const

// Minimum order quantities
export const MIN_ORDER_QUANTITIES = {
  DEFAULT: 1,
  WHOLESALE: 10,
  BULK: 50
} as const

// Currency configuration
export const CURRENCY = {
  CODE: 'ARS',
  SYMBOL: '$',
  DECIMALS: 2,
  LOCALE: 'es-AR'
} as const
