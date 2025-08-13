'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { Button } from './button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    this.setState({ error, errorInfo })
    this.props.onError?.(error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  handleGoHome = () => {
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <CardTitle className="text-xl">Algo salió mal</CardTitle>
              <CardDescription>
                Ha ocurrido un error inesperado. Por favor, intenta de nuevo.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="rounded-md bg-gray-100 p-4">
                  <summary className="cursor-pointer font-medium text-gray-700">
                    Detalles del error (solo desarrollo)
                  </summary>
                  <pre className="mt-2 text-xs text-gray-600 overflow-auto">
                    {this.state.error.toString()}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </details>
              )}
              
              <div className="flex flex-col space-y-2">
                <Button onClick={this.handleRetry} className="w-full">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Intentar de nuevo
                </Button>
                <Button 
                  variant="outline" 
                  onClick={this.handleGoHome}
                  className="w-full"
                >
                  <Home className="mr-2 h-4 w-4" />
                  Ir al inicio
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

// Hook para usar error boundaries en componentes funcionales
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null)

  React.useEffect(() => {
    if (error) {
      console.error('Error caught by useErrorHandler:', error)
    }
  }, [error])

  return {
    error,
    setError,
    resetError: () => setError(null),
  }
}

// Componente para mostrar errores de red
export function NetworkError({ 
  error, 
  onRetry 
}: { 
  error: Error
  onRetry?: () => void 
}) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
        <AlertTriangle className="h-6 w-6 text-yellow-600" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Error de conexión
      </h3>
      <p className="text-gray-600 mb-4">
        No se pudo conectar con el servidor. Verifica tu conexión a internet.
      </p>
      {onRetry && (
        <Button onClick={onRetry}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Reintentar
        </Button>
      )}
    </div>
  )
}

// Componente para errores de permisos
export function PermissionError() {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
        <AlertTriangle className="h-6 w-6 text-red-600" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Acceso denegado
      </h3>
      <p className="text-gray-600 mb-4">
        No tienes permisos para acceder a esta página.
      </p>
      <Button onClick={() => window.history.back()}>
        Volver
      </Button>
    </div>
  )
}

// Componente para errores de página no encontrada
export function NotFoundError() {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
        <AlertTriangle className="h-6 w-6 text-gray-600" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Página no encontrada
      </h3>
      <p className="text-gray-600 mb-4">
        La página que buscas no existe o ha sido movida.
      </p>
      <Button onClick={() => window.location.href = '/'}>
        <Home className="mr-2 h-4 w-4" />
        Ir al inicio
      </Button>
    </div>
  )
} 