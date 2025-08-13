export const defaultLocale = 'es' as const
export const locales = ['es', 'en'] as const

export type Locale = typeof locales[number]

// Dictionary type for translations
export interface Dictionary {
  [key: string]: string | Dictionary
}

// Spanish translations (default)
export const es: Dictionary = {
  common: {
    loading: 'Cargando...',
    error: 'Error',
    success: 'Éxito',
    cancel: 'Cancelar',
    save: 'Guardar',
    delete: 'Eliminar',
    edit: 'Editar',
    view: 'Ver',
    search: 'Buscar',
    filter: 'Filtrar',
    sort: 'Ordenar',
    next: 'Siguiente',
    previous: 'Anterior',
    close: 'Cerrar',
    open: 'Abrir',
    yes: 'Sí',
    no: 'No',
    or: 'o',
    and: 'y',
    back: 'Volver',
    continue: 'Continuar',
    submit: 'Enviar',
    reset: 'Restablecer'
  },
  nav: {
    home: 'Inicio',
    products: 'Productos',
    categories: 'Categorías',
    suppliers: 'Proveedores',
    cart: 'Carrito',
    account: 'Mi Cuenta',
    orders: 'Mis Órdenes',
    profile: 'Mi Perfil',
    settings: 'Configuraciones',
    support: 'Soporte',
    login: 'Iniciar Sesión',
    register: 'Registrarse',
    logout: 'Cerrar Sesión',
    dashboard: 'Panel'
  },
  auth: {
    login: 'Iniciar Sesión',
    register: 'Registrarse',
    email: 'Correo electrónico',
    password: 'Contraseña',
    confirmPassword: 'Confirmar contraseña',
    name: 'Nombre completo',
    phone: 'Teléfono',
    role: 'Rol',
    forgotPassword: 'Olvidé mi contraseña',
    rememberMe: 'Recordarme',
    loginWithGoogle: 'Continuar con Google',
    alreadyHaveAccount: '¿Ya tienes cuenta?',
    dontHaveAccount: '¿No tienes cuenta?',
    createAccount: 'Crear cuenta',
    signIn: 'Ingresar'
  },
  products: {
    title: 'Productos',
    search: 'Buscar productos...',
    category: 'Categoría',
    supplier: 'Proveedor',
    price: 'Precio',
    rating: 'Calificación',
    availability: 'Disponibilidad',
    inStock: 'En stock',
    outOfStock: 'Agotado',
    addToCart: 'Agregar al carrito',
    addToWishlist: 'Agregar a favoritos',
    viewDetails: 'Ver detalles',
    compare: 'Comparar',
    share: 'Compartir',
    reviews: 'Reseñas',
    specifications: 'Especificaciones',
    description: 'Descripción',
    relatedProducts: 'Productos relacionados'
  },
  cart: {
    title: 'Carrito de Compras',
    empty: 'Tu carrito está vacío',
    item: 'Producto',
    quantity: 'Cantidad',
    price: 'Precio',
    total: 'Total',
    subtotal: 'Subtotal',
    discount: 'Descuento',
    shipping: 'Envío',
    tax: 'Impuestos',
    checkout: 'Finalizar Compra',
    continueShopping: 'Seguir Comprando',
    removeItem: 'Eliminar producto',
    updateQuantity: 'Actualizar cantidad',
    applyCoupon: 'Aplicar cupón',
    couponCode: 'Código de cupón'
  },
  orders: {
    title: 'Mis Órdenes',
    orderNumber: 'Número de orden',
    date: 'Fecha',
    status: 'Estado',
    total: 'Total',
    items: 'Productos',
    viewOrder: 'Ver orden',
    trackOrder: 'Rastrear orden',
    cancelOrder: 'Cancelar orden',
    reorder: 'Reordenar',
    pending: 'Pendiente',
    confirmed: 'Confirmado',
    processing: 'Procesando',
    shipped: 'Enviado',
    delivered: 'Entregado',
    cancelled: 'Cancelado'
  },
  profile: {
    title: 'Mi Perfil',
    personalInfo: 'Información Personal',
    security: 'Seguridad',
    preferences: 'Preferencias',
    address: 'Dirección',
    billing: 'Facturación',
    notifications: 'Notificaciones',
    changePassword: 'Cambiar contraseña',
    currentPassword: 'Contraseña actual',
    newPassword: 'Nueva contraseña',
    updateProfile: 'Actualizar perfil',
    uploadAvatar: 'Subir foto'
  },
  support: {
    title: 'Centro de Soporte',
    createTicket: 'Crear ticket',
    ticketNumber: 'Número de ticket',
    subject: 'Asunto',
    category: 'Categoría',
    priority: 'Prioridad',
    description: 'Descripción',
    status: 'Estado',
    messages: 'Mensajes',
    reply: 'Responder',
    close: 'Cerrar ticket',
    open: 'Abierto',
    inProgress: 'En progreso',
    resolved: 'Resuelto',
    closed: 'Cerrado'
  },
  errors: {
    generic: 'Ha ocurrido un error inesperado',
    network: 'Error de conexión',
    notFound: 'No encontrado',
    unauthorized: 'No autorizado',
    forbidden: 'Acceso denegado',
    validation: 'Error de validación',
    required: 'Este campo es requerido',
    invalidEmail: 'Correo electrónico inválido',
    passwordTooShort: 'La contraseña debe tener al menos 6 caracteres',
    passwordMismatch: 'Las contraseñas no coinciden'
  }
}

// English translations
export const en: Dictionary = {
  common: {
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    view: 'View',
    search: 'Search',
    filter: 'Filter',
    sort: 'Sort',
    next: 'Next',
    previous: 'Previous',
    close: 'Close',
    open: 'Open',
    yes: 'Yes',
    no: 'No',
    or: 'or',
    and: 'and',
    back: 'Back',
    continue: 'Continue',
    submit: 'Submit',
    reset: 'Reset'
  },
  nav: {
    home: 'Home',
    products: 'Products',
    categories: 'Categories',
    suppliers: 'Suppliers',
    cart: 'Cart',
    account: 'My Account',
    orders: 'My Orders',
    profile: 'My Profile',
    settings: 'Settings',
    support: 'Support',
    login: 'Login',
    register: 'Register',
    logout: 'Logout',
    dashboard: 'Dashboard'
  },
  auth: {
    login: 'Login',
    register: 'Register',
    email: 'Email',
    password: 'Password',
    confirmPassword: 'Confirm password',
    name: 'Full name',
    phone: 'Phone',
    role: 'Role',
    forgotPassword: 'Forgot password',
    rememberMe: 'Remember me',
    loginWithGoogle: 'Continue with Google',
    alreadyHaveAccount: 'Already have an account?',
    dontHaveAccount: "Don't have an account?",
    createAccount: 'Create account',
    signIn: 'Sign in'
  },
  products: {
    title: 'Products',
    search: 'Search products...',
    category: 'Category',
    supplier: 'Supplier',
    price: 'Price',
    rating: 'Rating',
    availability: 'Availability',
    inStock: 'In stock',
    outOfStock: 'Out of stock',
    addToCart: 'Add to cart',
    addToWishlist: 'Add to wishlist',
    viewDetails: 'View details',
    compare: 'Compare',
    share: 'Share',
    reviews: 'Reviews',
    specifications: 'Specifications',
    description: 'Description',
    relatedProducts: 'Related products'
  },
  cart: {
    title: 'Shopping Cart',
    empty: 'Your cart is empty',
    item: 'Item',
    quantity: 'Quantity',
    price: 'Price',
    total: 'Total',
    subtotal: 'Subtotal',
    discount: 'Discount',
    shipping: 'Shipping',
    tax: 'Tax',
    checkout: 'Checkout',
    continueShopping: 'Continue Shopping',
    removeItem: 'Remove item',
    updateQuantity: 'Update quantity',
    applyCoupon: 'Apply coupon',
    couponCode: 'Coupon code'
  },
  orders: {
    title: 'My Orders',
    orderNumber: 'Order number',
    date: 'Date',
    status: 'Status',
    total: 'Total',
    items: 'Items',
    viewOrder: 'View order',
    trackOrder: 'Track order',
    cancelOrder: 'Cancel order',
    reorder: 'Reorder',
    pending: 'Pending',
    confirmed: 'Confirmed',
    processing: 'Processing',
    shipped: 'Shipped',
    delivered: 'Delivered',
    cancelled: 'Cancelled'
  },
  profile: {
    title: 'My Profile',
    personalInfo: 'Personal Information',
    security: 'Security',
    preferences: 'Preferences',
    address: 'Address',
    billing: 'Billing',
    notifications: 'Notifications',
    changePassword: 'Change password',
    currentPassword: 'Current password',
    newPassword: 'New password',
    updateProfile: 'Update profile',
    uploadAvatar: 'Upload photo'
  },
  support: {
    title: 'Support Center',
    createTicket: 'Create ticket',
    ticketNumber: 'Ticket number',
    subject: 'Subject',
    category: 'Category',
    priority: 'Priority',
    description: 'Description',
    status: 'Status',
    messages: 'Messages',
    reply: 'Reply',
    close: 'Close ticket',
    open: 'Open',
    inProgress: 'In progress',
    resolved: 'Resolved',
    closed: 'Closed'
  },
  errors: {
    generic: 'An unexpected error occurred',
    network: 'Network error',
    notFound: 'Not found',
    unauthorized: 'Unauthorized',
    forbidden: 'Access denied',
    validation: 'Validation error',
    required: 'This field is required',
    invalidEmail: 'Invalid email',
    passwordTooShort: 'Password must be at least 6 characters',
    passwordMismatch: 'Passwords do not match'
  }
}

// Translation dictionaries
export const dictionaries = {
  es,
  en
} as const

// Get dictionary for locale
export const getDictionary = (locale: Locale): Dictionary => {
  return dictionaries[locale] || dictionaries[defaultLocale]
}

// Helper function to get nested translation
export const getTranslation = (
  dict: Dictionary,
  key: string,
  fallback?: string
): string => {
  const keys = key.split('.')
  let value: any = dict

  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k]
    } else {
      return fallback || key
    }
  }

  return typeof value === 'string' ? value : fallback || key
}

// Translation hook (simplified version)
export const useTranslation = (locale: Locale = defaultLocale) => {
  const dict = getDictionary(locale)
  
  const t = (key: string, fallback?: string) => {
    return getTranslation(dict, key, fallback)
  }

  return { t, dict, locale }
}

// Format currency based on locale
export const formatCurrency = (
  amount: number,
  locale: Locale = defaultLocale,
  currency: string = 'ARS'
): string => {
  const localeMap = {
    es: 'es-AR',
    en: 'en-US'
  }

  return new Intl.NumberFormat(localeMap[locale], {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount)
}

// Format date based on locale
export const formatDate = (
  date: Date | string,
  locale: Locale = defaultLocale,
  options?: Intl.DateTimeFormatOptions
): string => {
  const localeMap = {
    es: 'es-AR',
    en: 'en-US'
  }

  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }

  return new Intl.DateTimeFormat(
    localeMap[locale],
    { ...defaultOptions, ...options }
  ).format(new Date(date))
}
