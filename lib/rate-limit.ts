import { NextRequest, NextResponse } from 'next/server'

interface RateLimitConfig {
  windowMs: number
  max: number
  message?: string
  statusCode?: number
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
}

interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
  }
}

class RateLimiter {
  private store: RateLimitStore = {}
  private config: RateLimitConfig

  constructor(config: RateLimitConfig) {
    this.config = {
      message: 'Too many requests from this IP, please try again later.',
      statusCode: 429,
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
      ...config,
      windowMs: config.windowMs || 15 * 60 * 1000, // 15 minutes
      max: config.max || 100, // limit each IP to 100 requests per windowMs
    }
  }

  private getKey(req: NextRequest): string {
    // Usar IP del cliente
    const forwarded = req.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0] : 'unknown'
    
    // También considerar el user agent para mayor seguridad
    const userAgent = req.headers.get('user-agent') || 'unknown'
    
    return `${ip}:${userAgent}`
  }

  private isWhitelisted(req: NextRequest): boolean {
    // Lista de IPs whitelist (puedes agregar más)
    const whitelist = [
      '127.0.0.1',
      '::1',
      // Agregar IPs de confianza aquí
    ]
    
    const forwarded = req.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0] : 'unknown'
    
    return whitelist.includes(ip)
  }

  private cleanup() {
    const now = Date.now()
    Object.keys(this.store).forEach(key => {
      if (this.store[key].resetTime <= now) {
        delete this.store[key]
      }
    })
  }

  // Algunas rutas internas deben quedar fuera del rate limiting para evitar 429 innecesarios
  private shouldBypass(req: NextRequest): boolean {
    try {
      const pathname = (req as any).nextUrl?.pathname || new URL(req.url).pathname
      const bypassPaths = [
        '/api/auth/_log',      // NextAuth client log endpoint
        '/api/auth/session',   // NextAuth session polling
      ]
      return bypassPaths.some((p) => pathname.startsWith(p))
    } catch {
      return false
    }
  }

  middleware(req: NextRequest) {
    // Limpiar entradas expiradas
    this.cleanup()

    // Verificar whitelist
    if (this.isWhitelisted(req)) {
      return null
    }

    // Evitar rate-limit en rutas internas de NextAuth u otras permitidas
    if (this.shouldBypass(req)) {
      return null
    }

    const key = this.getKey(req)
    const now = Date.now()

    if (!this.store[key]) {
      this.store[key] = {
        count: 0,
        resetTime: now + this.config.windowMs,
      }
    }

    const current = this.store[key]

    // Verificar si el tiempo de reset ha pasado
    if (now > current.resetTime) {
      current.count = 0
      current.resetTime = now + this.config.windowMs
    }

    // Incrementar contador
    current.count++

    // Verificar si se excedió el límite
    if (current.count > this.config.max) {
      return NextResponse.json(
        {
          error: this.config.message,
          retryAfter: Math.ceil((current.resetTime - now) / 1000),
        },
        {
          status: this.config.statusCode,
          headers: {
            'Retry-After': Math.ceil((current.resetTime - now) / 1000).toString(),
            'X-RateLimit-Limit': this.config.max.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': current.resetTime.toString(),
          },
        }
      )
    }

    // Para App Router, no podemos usar NextResponse.next()
    // Los headers se manejarán en el handler principal
    return null
  }
}

// Configuraciones predefinidas
export const rateLimitConfigs = {
  // Rate limit general para APIs
  api: {
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 300, // 300 requests por ventana
  },
  
  // Rate limit más estricto para autenticación
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 15, // 15 intentos de login por ventana
    message: 'Too many login attempts, please try again later.',
  },
  
  // Rate limit para uploads
  upload: {
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 30, // 30 uploads por hora
    message: 'Too many upload attempts, please try again later.',
  },
  
  // Rate limit para búsquedas
  search: {
    windowMs: 1 * 60 * 1000, // 1 minuto
    max: 60, // 60 búsquedas por minuto
    message: 'Too many search requests, please try again later.',
  },
  
  // Rate limit para comentarios/reviews
  comments: {
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 15, // 15 comentarios por hora
    message: 'Too many comments, please try again later.',
  },
}

// Crear instancias de rate limiters
export const rateLimiters = {
  api: new RateLimiter(rateLimitConfigs.api),
  auth: new RateLimiter(rateLimitConfigs.auth),
  upload: new RateLimiter(rateLimitConfigs.upload),
  search: new RateLimiter(rateLimitConfigs.search),
  comments: new RateLimiter(rateLimitConfigs.comments),
}

// Middleware helper para usar en las APIs
export function withRateLimit(
  handler: (req: NextRequest) => Promise<NextResponse>,
  rateLimiter: RateLimiter = rateLimiters.api
) {
  return async (req: NextRequest) => {
    const rateLimitResult = rateLimiter.middleware(req)
    
    if (rateLimitResult) {
      return rateLimitResult
    }
    
    return handler(req)
  }
}

// Middleware específico para autenticación
export function withAuthRateLimit(
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return withRateLimit(handler, rateLimiters.auth)
}

// Middleware específico para uploads
export function withUploadRateLimit(
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return withRateLimit(handler, rateLimiters.upload)
}

// Middleware específico para búsquedas
export function withSearchRateLimit(
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return withRateLimit(handler, rateLimiters.search)
}

// Middleware específico para comentarios
export function withCommentsRateLimit(
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return withRateLimit(handler, rateLimiters.comments)
}

// Función para obtener estadísticas de rate limiting
export function getRateLimitStats() {
  const stats: { [key: string]: any } = {}
  
  Object.entries(rateLimiters).forEach(([name, limiter]) => {
    const store = (limiter as any).store
    const totalKeys = Object.keys(store).length
    const now = Date.now()
    
    // Filtrar entradas activas
    const activeKeys = Object.entries(store).filter(([_, data]: [string, any]) => 
      data.resetTime > now
    )
    
    stats[name] = {
      totalKeys,
      activeKeys: activeKeys.length,
      config: rateLimitConfigs[name as keyof typeof rateLimitConfigs],
    }
  })
  
  return stats
} 