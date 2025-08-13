import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { requireRole } from '@/lib/auth-middleware'
import { USER_ROLES } from '@/constants'

export async function GET(request: NextRequest) {
  try {
    const { user } = await requireRole(request, [USER_ROLES.ADMIN])
    
      await connectToDatabase()

      const { searchParams } = new URL(request.url)
      const period = searchParams.get('period') || '24' // horas

      const endDate = new Date()
      const startDate = new Date()
      startDate.setHours(startDate.getHours() - parseInt(period))

      // En un sistema real, esto vendría de una base de datos de logs de rate limiting
      // Por ahora, simulamos estadísticas
      const mockRateLimitStats = {
        period: `${period} horas`,
        startDate,
        endDate,
        totalRequests: 15420,
        blockedRequests: 234,
        uniqueIPs: 892,
        topBlockedIPs: [
          { ip: '192.168.1.100', requests: 45, blocked: 12 },
          { ip: '10.0.0.50', requests: 38, blocked: 8 },
          { ip: '172.16.0.25', requests: 29, blocked: 6 },
          { ip: '203.0.113.10', requests: 22, blocked: 5 },
          { ip: '198.51.100.5', requests: 18, blocked: 4 }
        ],
        topEndpoints: [
          { endpoint: '/api/products', requests: 3240, blocked: 23 },
          { endpoint: '/api/auth/signin', requests: 2150, blocked: 45 },
          { endpoint: '/api/upload', requests: 1890, blocked: 12 },
          { endpoint: '/api/orders', requests: 1560, blocked: 8 },
          { endpoint: '/api/cart', requests: 1340, blocked: 6 }
        ],
        rateLimitRules: [
          {
            name: 'API General',
            limit: 100,
            window: '1m',
            blocked: 156
          },
          {
            name: 'Autenticación',
            limit: 5,
            window: '15m',
            blocked: 78
          },
          {
            name: 'Subida de archivos',
            limit: 10,
            window: '1h',
            blocked: 34
          },
          {
            name: 'Creación de pedidos',
            limit: 20,
            window: '1h',
            blocked: 12
          }
        ],
        hourlyStats: [
          { hour: '00:00', requests: 420, blocked: 8 },
          { hour: '01:00', requests: 380, blocked: 6 },
          { hour: '02:00', requests: 320, blocked: 5 },
          { hour: '03:00', requests: 290, blocked: 4 },
          { hour: '04:00', requests: 250, blocked: 3 },
          { hour: '05:00', requests: 280, blocked: 4 },
          { hour: '06:00', requests: 350, blocked: 6 },
          { hour: '07:00', requests: 520, blocked: 9 },
          { hour: '08:00', requests: 780, blocked: 12 },
          { hour: '09:00', requests: 920, blocked: 15 },
          { hour: '10:00', requests: 1100, blocked: 18 },
          { hour: '11:00', requests: 1250, blocked: 22 },
          { hour: '12:00', requests: 1350, blocked: 25 },
          { hour: '13:00', requests: 1280, blocked: 23 },
          { hour: '14:00', requests: 1320, blocked: 24 },
          { hour: '15:00', requests: 1400, blocked: 26 },
          { hour: '16:00', requests: 1380, blocked: 25 },
          { hour: '17:00', requests: 1450, blocked: 27 },
          { hour: '18:00', requests: 1520, blocked: 29 },
          { hour: '19:00', requests: 1480, blocked: 28 },
          { hour: '20:00', requests: 1420, blocked: 26 },
          { hour: '21:00', requests: 1380, blocked: 25 },
          { hour: '22:00', requests: 1200, blocked: 21 },
          { hour: '23:00', requests: 980, blocked: 17 }
        ]
      }

      return NextResponse.json(mockRateLimitStats)

    } catch (error) {
      console.error('Get rate limit stats error:', error)
      return NextResponse.json(
        { error: 'Error interno del servidor' },
        { status: 500 }
      )
    }
}