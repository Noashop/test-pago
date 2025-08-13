'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, Shield, Users, Activity } from 'lucide-react'
import { useLogger } from '@/lib/logger'

interface RateLimitStats {
  api: {
    totalKeys: number
    activeKeys: number
    config: {
      windowMs: number
      max: number
    }
  }
  auth: {
    totalKeys: number
    activeKeys: number
    config: {
      windowMs: number
      max: number
    }
  }
  upload: {
    totalKeys: number
    activeKeys: number
    config: {
      windowMs: number
      max: number
    }
  }
  search: {
    totalKeys: number
    activeKeys: number
    config: {
      windowMs: number
      max: number
    }
  }
  comments: {
    totalKeys: number
    activeKeys: number
    config: {
      windowMs: number
      max: number
    }
  }
}

export function RateLimitStats() {
  const [stats, setStats] = useState<RateLimitStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const logger = useLogger()

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/rate-limit-stats')
      if (!response.ok) {
        throw new Error('Error al obtener estadísticas')
      }
      const data = await response.json()
      setStats(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
      logger.error('Failed to fetch rate limit stats', err as Error)
    } finally {
      setLoading(false)
    }
  }, [logger])

  useEffect(() => {
    fetchStats()
    const interval = setInterval(fetchStats, 30000) // Actualizar cada 30 segundos
    return () => clearInterval(interval)
  }, [fetchStats])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Rate Limiting Stats
          </CardTitle>
          <CardDescription>Cargando estadísticas...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Error
          </CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (!stats) return null

  const getStatusColor = (activeKeys: number, max: number) => {
    const percentage = (activeKeys / max) * 100
    if (percentage > 80) return 'text-red-600'
    if (percentage > 60) return 'text-yellow-600'
    return 'text-green-600'
  }

  const getStatusBadge = (activeKeys: number, max: number) => {
    const percentage = (activeKeys / max) * 100
    if (percentage > 80) return <Badge variant="destructive">Crítico</Badge>
    if (percentage > 60) return <Badge variant="secondary">Alto</Badge>
    return <Badge variant="default">Normal</Badge>
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Object.entries(stats).map(([key, data]) => {
        // Validar que data y data.config existan
        if (!data || !data.config) {
          return (
            <Card key={key}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="capitalize">{key}</span>
                  <Badge variant="secondary">Sin datos</Badge>
                </CardTitle>
                <CardDescription>Configuración no disponible</CardDescription>
              </CardHeader>
            </Card>
          )
        }

        return (
          <Card key={key}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="capitalize">{key}</span>
                {getStatusBadge(data.activeKeys, data.config.max)}
              </CardTitle>
              <CardDescription>
                {data.config.max} requests por {Math.round(data.config.windowMs / 1000 / 60)} min
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Activos:</span>
                  <span className={`font-semibold ${getStatusColor(data.activeKeys, data.config.max)}`}>
                    {data.activeKeys}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total:</span>
                  <span className="font-semibold">{data.totalKeys}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      getStatusColor(data.activeKeys, data.config.max).replace('text-', 'bg-')
                    }`}
                    style={{
                      width: `${Math.min((data.activeKeys / data.config.max) * 100, 100)}%`
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
} 