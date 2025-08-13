'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertTriangle, AlertCircle, Info, XCircle, RefreshCw } from 'lucide-react'
import { useLogger } from '@/lib/logger'

interface ErrorLog {
  id: string
  timestamp: string
  level: 'error' | 'warn' | 'info'
  message: string
  data?: any
  url?: string
  userAgent?: string
}

export function ErrorMonitor() {
  const [errors, setErrors] = useState<ErrorLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const logger = useLogger()

  const fetchErrors = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/error-logs?level=error&limit=10', {
        credentials: 'include',
        cache: 'no-store',
      })
      if (!response.ok) {
        throw new Error('Error al obtener logs de errores')
      }
      const data = await response.json()
      setErrors(data.errors || [])
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
      logger.error('Failed to fetch error logs', err as Error)
    } finally {
      setLoading(false)
    }
  }, [logger])

  useEffect(() => {
    fetchErrors()
    const interval = setInterval(fetchErrors, 60000)
    return () => clearInterval(interval)
  }, [fetchErrors])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Error Monitor
          </CardTitle>
          <CardDescription>Cargando errores...</CardDescription>
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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            <CardTitle>Error Monitor</CardTitle>
          </div>
          <Button onClick={fetchErrors} size="sm" variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
        </div>
        <CardDescription>
          Últimos {errors.length} errores del sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        {errors.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
            <p>No hay errores recientes</p>
            <p className="text-sm">El sistema está funcionando correctamente</p>
          </div>
        ) : (
          <div className="space-y-4">
            {errors.map((error) => (
              <div key={error.id} className="border rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-500" />
                    <Badge variant="destructive">Error</Badge>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(error.timestamp).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm font-medium">{error.message}</p>
                {error.url && (
                  <p className="text-xs text-gray-600">
                    URL: {error.url}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
} 