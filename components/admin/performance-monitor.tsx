'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BarChart3, TrendingUp, Clock, Zap, RefreshCw } from 'lucide-react'
import { useLogger } from '@/lib/logger'

interface PerformanceMetric {
  operation: string
  avgDuration: number
  maxDuration: number
  minDuration: number
  count: number
  lastExecuted: string
}

export function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const logger = useLogger()

  const fetchMetrics = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/performance-metrics', {
        credentials: 'include',
        cache: 'no-store',
      })
      if (!response.ok) {
        throw new Error('Error al obtener métricas de performance')
      }
      const data = await response.json()
      setMetrics(data.metrics || [])
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
      logger.error('Failed to fetch performance metrics', err as Error)
    } finally {
      setLoading(false)
    }
  }, [logger])

  useEffect(() => {
    fetchMetrics()
    const interval = setInterval(fetchMetrics, 60000)
    return () => clearInterval(interval)
  }, [fetchMetrics])

  const getPerformanceColor = (duration: number) => {
    if (duration < 100) return 'text-green-600'
    if (duration < 500) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getPerformanceBadge = (duration: number) => {
    if (duration < 100) return <Badge variant="default">Excelente</Badge>
    if (duration < 500) return <Badge variant="secondary">Bueno</Badge>
    return <Badge variant="destructive">Lento</Badge>
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Performance Monitor
          </CardTitle>
          <CardDescription>Cargando métricas...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <BarChart3 className="h-5 w-5" />
            Error
          </CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            <CardTitle>Performance Monitor</CardTitle>
          </div>
          <Button onClick={fetchMetrics} size="sm" variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
        </div>
        <CardDescription>
          Métricas de performance del sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        {metrics.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Zap className="h-12 w-12 mx-auto mb-4 text-green-500" />
            <p>No hay métricas disponibles</p>
            <p className="text-sm">El sistema está funcionando correctamente</p>
          </div>
        ) : (
          <div className="space-y-4">
            {metrics.map((metric) => (
              <div key={metric.operation} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    <span className="font-medium capitalize">
                      {metric.operation.replace('_', ' ')}
                    </span>
                    {getPerformanceBadge(metric.avgDuration)}
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(metric.lastExecuted).toLocaleString()}
                  </span>
                </div>
                
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Promedio:</span>
                    <span className={`ml-2 font-semibold ${getPerformanceColor(metric.avgDuration)}`}>
                      {metric.avgDuration.toFixed(2)}ms
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Máximo:</span>
                    <span className="ml-2 font-semibold text-red-600">
                      {metric.maxDuration.toFixed(2)}ms
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Mínimo:</span>
                    <span className="ml-2 font-semibold text-green-600">
                      {metric.minDuration.toFixed(2)}ms
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Clock className="h-3 w-3" />
                  <span>Ejecutado {metric.count} veces</span>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      getPerformanceColor(metric.avgDuration).replace('text-', 'bg-')
                    }`}
                    style={{
                      width: `${Math.min((metric.avgDuration / 1000) * 100, 100)}%`
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
} 