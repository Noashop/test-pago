import { Metadata } from 'next'

interface SEOConfig {
  title: string
  description: string
  keywords?: string[]
  image?: string
  url?: string
  type?: 'website' | 'article' | 'product'
  publishedTime?: string
  modifiedTime?: string
  author?: string
  section?: string
  tags?: string[]
}

export function generateMetadata(config: SEOConfig): Metadata {
  const {
    title,
    description,
    keywords = [],
    image,
    url,
    type = 'website',
    publishedTime,
    modifiedTime,
    author,
    section,
    tags = [],
  } = config

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const fullUrl = url ? `${baseUrl}${url}` : baseUrl
  const imageUrl = image ? (image.startsWith('http') ? image : `${baseUrl}${image}`) : `${baseUrl}/og-image.jpg`

  return {
    title,
    description,
    keywords: keywords.join(', '),
    authors: author ? [{ name: author }] : undefined,
    creator: 'Salta Conecta',
    publisher: 'Salta Conecta',
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    metadataBase: new URL(baseUrl),
    alternates: {
      canonical: fullUrl,
    },
    openGraph: {
      title,
      description,
      url: fullUrl,
      siteName: 'Salta Conecta',
      locale: 'es_AR',
      type: type === 'product' ? 'website' : type,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      publishedTime,
      modifiedTime,
      authors: author ? [author] : undefined,
      section,
      tags,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
      creator: '@saltaconecta',
      site: '@saltaconecta',
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    verification: {
      google: process.env.GOOGLE_SITE_VERIFICATION,
      yandex: process.env.YANDEX_VERIFICATION,
      yahoo: process.env.YAHOO_VERIFICATION,
    },
  }
}

// Metadatos específicos para páginas
export const pageMetadata = {
  home: generateMetadata({
    title: 'Salta Conecta - Marketplace Mayorista Digital',
    description: 'Plataforma líder de comercio electrónico mayorista en Salta, Argentina. Conectamos proveedores con emprendedores para impulsar el crecimiento local.',
    keywords: ['mayorista', 'ecommerce', 'salta', 'argentina', 'marketplace', 'proveedores', 'emprendedores'],
    url: '/',
  }),

  products: generateMetadata({
    title: 'Productos Mayoristas - Salta Conecta',
    description: 'Explora nuestra amplia selección de productos mayoristas. Encuentra los mejores precios y proveedores verificados en Salta Conecta.',
    keywords: ['productos mayoristas', 'salta', 'argentina', 'proveedores', 'ecommerce'],
    url: '/products',
  }),

  categories: generateMetadata({
    title: 'Categorías de Productos - Salta Conecta',
    description: 'Navega por nuestras categorías especializadas de productos mayoristas. Encuentra exactamente lo que necesitas.',
    keywords: ['categorías', 'productos', 'mayorista', 'salta'],
    url: '/categories',
  }),

  about: generateMetadata({
    title: 'Sobre Nosotros - Salta Conecta',
    description: 'Conoce más sobre Salta Conecta, la plataforma que está revolucionando el comercio mayorista en Salta.',
    keywords: ['sobre nosotros', 'salta conecta', 'historia', 'misión'],
    url: '/about',
  }),

  contact: generateMetadata({
    title: 'Contacto - Salta Conecta',
    description: 'Contáctanos para cualquier consulta sobre nuestros servicios mayoristas. Estamos aquí para ayudarte.',
    keywords: ['contacto', 'ayuda', 'soporte', 'salta conecta'],
    url: '/contact',
  }),
}

// Función para generar metadatos dinámicos para productos
export function generateProductMetadata(product: {
  name: string
  description: string
  price: number
  images: string[]
  category: string
  brand?: string
  sku: string
  slug: string
}) {
  return generateMetadata({
    title: `${product.name} - ${product.brand || 'Producto'} | Salta Conecta`,
    description: product.description.length > 160 
      ? product.description.substring(0, 157) + '...'
      : product.description,
    keywords: [
      product.name.toLowerCase(),
      product.category.toLowerCase(),
      product.brand?.toLowerCase(),
      'mayorista',
      'salta',
      'argentina',
    ].filter(Boolean) as string[],
    image: product.images[0],
    url: `/products/${product.slug}`,
    type: 'product',
    tags: [product.category, product.brand].filter(Boolean) as string[],
  })
}

// Función para generar metadatos dinámicos para categorías
export function generateCategoryMetadata(category: {
  name: string
  description: string
  slug: string
  image?: string
}) {
  return generateMetadata({
    title: `${category.name} - Categoría Mayorista | Salta Conecta`,
    description: category.description || `Explora productos de ${category.name} al mejor precio mayorista en Salta Conecta.`,
    keywords: [
      category.name.toLowerCase(),
      'categoría',
      'mayorista',
      'salta',
      'argentina',
    ],
    image: category.image,
    url: `/categories/${category.slug}`,
    type: 'website',
  })
}

// Función para generar metadatos dinámicos para proveedores
export function generateSupplierMetadata(supplier: {
  businessName: string
  description: string
  slug: string
  image?: string
  category: string
}) {
  return generateMetadata({
    title: `${supplier.businessName} - Proveedor Verificado | Salta Conecta`,
    description: supplier.description || `Conoce a ${supplier.businessName}, proveedor verificado en Salta Conecta.`,
    keywords: [
      supplier.businessName.toLowerCase(),
      'proveedor',
      'verificado',
      supplier.category.toLowerCase(),
      'salta',
      'argentina',
    ],
    image: supplier.image,
    url: `/suppliers/${supplier.slug}`,
    type: 'website',
  })
}

// Función para generar metadatos para páginas de búsqueda
export function generateSearchMetadata(query: string, results: number) {
  return generateMetadata({
    title: `Búsqueda: ${query} - Salta Conecta`,
    description: `Encontramos ${results} productos para "${query}". Explora los mejores precios mayoristas.`,
    keywords: [query.toLowerCase(), 'búsqueda', 'mayorista', 'salta'],
    url: `/search?q=${encodeURIComponent(query)}`,
    type: 'website',
  })
}

// Función para generar metadatos para páginas de blog/noticias
export function generateArticleMetadata(article: {
  title: string
  excerpt: string
  content: string
  slug: string
  author: string
  publishedAt: string
  updatedAt?: string
  image?: string
  tags: string[]
}) {
  return generateMetadata({
    title: `${article.title} - Salta Conecta`,
    description: article.excerpt,
    keywords: article.tags,
    image: article.image,
    url: `/blog/${article.slug}`,
    type: 'article',
    publishedTime: article.publishedAt,
    modifiedTime: article.updatedAt,
    author: article.author,
    tags: article.tags,
  })
}

// Función para generar JSON-LD structured data
export function generateStructuredData(type: string, data: any) {
  const baseData = {
    '@context': 'https://schema.org',
    '@type': type,
  }

  return {
    ...baseData,
    ...data,
  }
}

// Structured data para productos
export function generateProductStructuredData(product: {
  name: string
  description: string
  price: number
  images: string[]
  category: string
  brand?: string
  sku: string
  slug: string
  availability: string
  rating?: number
  reviewCount?: number
}) {
  return generateStructuredData('Product', {
    name: product.name,
    description: product.description,
    image: product.images,
    sku: product.sku,
    brand: product.brand ? {
      '@type': 'Brand',
      name: product.brand,
    } : undefined,
    category: product.category,
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: 'ARS',
      availability: `https://schema.org/${product.availability}`,
      seller: {
        '@type': 'Organization',
        name: 'Salta Conecta',
      },
    },
    aggregateRating: product.rating ? {
      '@type': 'AggregateRating',
      ratingValue: product.rating,
      reviewCount: product.reviewCount || 0,
    } : undefined,
  })
}

// Structured data para organización
export function generateOrganizationStructuredData() {
  return generateStructuredData('Organization', {
    name: 'Salta Conecta',
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    logo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/logo.png`,
    description: 'Plataforma líder de comercio electrónico mayorista en Salta, Argentina',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Salta',
      addressRegion: 'Salta',
      addressCountry: 'AR',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+54-387-123-4567',
      contactType: 'customer service',
    },
    sameAs: [
      'https://facebook.com/saltaconecta',
      'https://instagram.com/saltaconecta',
      'https://twitter.com/saltaconecta',
    ],
  })
}

// Structured data para breadcrumbs
export function generateBreadcrumbStructuredData(items: Array<{
  name: string
  url: string
}>) {
  return generateStructuredData('BreadcrumbList', {
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}${item.url}`,
    })),
  })
}
