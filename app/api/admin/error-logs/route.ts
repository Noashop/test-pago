import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { requireRole } from '@/lib/auth-middleware'
import { USER_ROLES } from '@/constants'

interface ErrorLog {
  timestamp: Date
  level: 'error' | 'warn' | 'info'
  message: string
  stack?: string
  userId?: string
  userRole?: string
  endpoint?: string
  method?: string
  ip?: string
  userAgent?: string
}

export async function GET(request: NextRequest) {
  try {
    const { user } = await requireRole(request, [USER_ROLES.ADMIN])
    await connectToDatabase()

    const { searchParams } = new URL(request.url)
    const level = searchParams.get('level')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const limit = parseInt(searchParams.get('limit') || '50')
    const page = parseInt(searchParams.get('page') || '1')

    // Mock data para logs de errores (en producción esto vendría de una base de datos)
    const mockErrorLogs: ErrorLog[] = [
      {
        timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutos atrás
        level: 'error',
        message: 'Error al procesar pago',
        stack: 'TypeError: Cannot read property \'body\' of undefined\n    at processPayment (/api/payments/create-preference/route.ts:45:12)',
        userId: 'user123',
        userRole: 'client',
        endpoint: '/api/payments/create-preference',
        method: 'POST',
        ip: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      {
        timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 minutos atrás
        level: 'warn',
        message: 'Tiempo de respuesta lento en búsqueda de productos',
        stack: 'Slow query detected: Product.find() took 2500ms',
        endpoint: '/api/products',
        method: 'GET',
        ip: '192.168.1.101',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      },
      {
        timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutos atrás
        level: 'error',
        message: 'Error de conexión a Cloudinary',
        stack: 'NetworkError: Failed to upload image to Cloudinary\n    at uploadToCloudinary (/components/ui/image-upload.tsx:34:13)',
        userId: 'supplier456',
        userRole: 'supplier',
        endpoint: '/api/upload',
        method: 'POST',
        ip: '192.168.1.102',
        userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36'
      },
      {
        timestamp: new Date(Date.now() - 1000 * 60 * 60), // 1 hora atrás
        level: 'info',
        message: 'Usuario autenticado exitosamente',
        userId: 'user789',
        userRole: 'admin',
        endpoint: '/api/auth/signin',
        method: 'POST',
        ip: '192.168.1.103',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    ]

    // Filtrar logs según parámetros
    let filteredLogs = mockErrorLogs

    if (level) {
      filteredLogs = filteredLogs.filter(log => log.level === level)
    }

    if (startDate) {
      const start = new Date(startDate)
      filteredLogs = filteredLogs.filter(log => log.timestamp >= start)
    }

    if (endDate) {
      const end = new Date(endDate)
      filteredLogs = filteredLogs.filter(log => log.timestamp <= end)
    }

    // Ordenar por timestamp (más reciente primero)
    filteredLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

    // Paginación
    const skip = (page - 1) * limit
    const paginatedLogs = filteredLogs.slice(skip, skip + limit)

    // Estadísticas de errores
    const errorStats = {
      total: filteredLogs.length,
      errors: filteredLogs.filter(log => log.level === 'error').length,
      warnings: filteredLogs.filter(log => log.level === 'warn').length,
      info: filteredLogs.filter(log => log.level === 'info').length,
      byEndpoint: filteredLogs.reduce((acc, log) => {
        if (log.endpoint) {
          acc[log.endpoint] = (acc[log.endpoint] || 0) + 1
        }
        return acc
      }, {} as Record<string, number>)
    }

    return NextResponse.json({
      logs: paginatedLogs,
      stats: errorStats,
      pagination: {
        total: filteredLogs.length,
        page,
        limit,
        totalPages: Math.ceil(filteredLogs.length / limit)
      }
    })

  } catch (error) {
    console.error('Get error logs error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}