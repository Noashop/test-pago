type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  data?: any
  error?: Error
  userId?: string
  sessionId?: string
  url?: string
  userAgent?: string
}

class Logger {
  private logs: LogEntry[] = []
  private maxLogs = 1000
  private isDevelopment = process.env.NODE_ENV === 'development'

  private createLogEntry(
    level: LogLevel,
    message: string,
    data?: any,
    error?: Error
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      error,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
    }
  }

  private addLog(entry: LogEntry) {
    this.logs.push(entry)
    
    // Mantener solo los últimos maxLogs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs)
    }

    // En desarrollo, también loggear a la consola
    if (this.isDevelopment) {
      const consoleMethod = entry.level === 'error' ? 'error' : 
                           entry.level === 'warn' ? 'warn' : 
                           entry.level === 'info' ? 'info' : 'log'
      
      console[consoleMethod](
        `[${entry.timestamp}] ${entry.level.toUpperCase()}: ${entry.message}`,
        entry.data || '',
        entry.error || ''
      )
    }

    // En producción, enviar logs críticos al servidor
    if (entry.level === 'error' && !this.isDevelopment) {
      this.sendToServer(entry)
    }
  }

  private async sendToServer(entry: LogEntry) {
    try {
      await fetch('/api/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(entry),
      })
    } catch (error) {
      console.error('Failed to send log to server:', error)
    }
  }

  debug(message: string, data?: any) {
    this.addLog(this.createLogEntry('debug', message, data))
  }

  info(message: string, data?: any) {
    this.addLog(this.createLogEntry('info', message, data))
  }

  warn(message: string, data?: any) {
    this.addLog(this.createLogEntry('warn', message, data))
  }

  error(message: string, error?: Error, data?: any) {
    this.addLog(this.createLogEntry('error', message, data, error))
  }

  // Log específico para errores de API
  apiError(endpoint: string, error: Error, requestData?: any) {
    this.error(`API Error at ${endpoint}`, error, {
      endpoint,
      requestData,
      status: (error as any).status,
    })
  }

  // Log específico para errores de autenticación
  authError(action: string, error: Error, userId?: string) {
    this.error(`Authentication Error: ${action}`, error, {
      action,
      userId,
    })
  }

  // Log específico para errores de validación
  validationError(field: string, value: any, rule: string) {
    this.warn(`Validation Error: ${field}`, {
      field,
      value,
      rule,
    })
  }

  // Log específico para performance
  performance(operation: string, duration: number, data?: any) {
    this.info(`Performance: ${operation}`, {
      operation,
      duration,
      data,
    })
  }

  // Log específico para acciones del usuario
  userAction(action: string, data?: any, userId?: string) {
    this.info(`User Action: ${action}`, {
      action,
      data,
      userId,
    })
  }

  // Obtener logs para debugging
  getLogs(level?: LogLevel, limit?: number): LogEntry[] {
    let filteredLogs = this.logs
    
    if (level) {
      filteredLogs = filteredLogs.filter(log => log.level === level)
    }
    
    if (limit) {
      filteredLogs = filteredLogs.slice(-limit)
    }
    
    return filteredLogs
  }

  // Limpiar logs
  clearLogs() {
    this.logs = []
  }

  // Exportar logs
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2)
  }
}

// Instancia global del logger
export const logger = new Logger()

// Hook para usar el logger en componentes React
export function useLogger() {
  return {
    debug: logger.debug.bind(logger),
    info: logger.info.bind(logger),
    warn: logger.warn.bind(logger),
    error: logger.error.bind(logger),
    apiError: logger.apiError.bind(logger),
    authError: logger.authError.bind(logger),
    validationError: logger.validationError.bind(logger),
    performance: logger.performance.bind(logger),
    userAction: logger.userAction.bind(logger),
  }
}

// HOC para logging automático de errores
export function withErrorLogging<P extends object>(
  Component: React.ComponentType<P>
) {
  return function WithErrorLogging(props: P) {
    const { useEffect } = require('react')
    
    useEffect(() => {
      const handleError = (error: ErrorEvent) => {
        logger.error('Unhandled error', error.error, {
          filename: error.filename,
          lineno: error.lineno,
          colno: error.colno,
        })
      }

      const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
        logger.error('Unhandled promise rejection', event.reason, {
          type: 'unhandledRejection',
        })
      }

      window.addEventListener('error', handleError)
      window.addEventListener('unhandledrejection', handleUnhandledRejection)

      return () => {
        window.removeEventListener('error', handleError)
        window.removeEventListener('unhandledrejection', handleUnhandledRejection)
      }
    }, [])

    return require('react').createElement(Component, props)
  }
}

// Función para medir performance
export function measurePerformance<T extends (...args: any[]) => any>(
  fn: T,
  operationName: string
): T {
  return ((...args: Parameters<T>) => {
    const start = performance.now()
    const result = fn(...args)
    const end = performance.now()
    
    logger.performance(operationName, end - start)
    
    return result
  }) as T
}

// Función para medir performance de async functions
export function measureAsyncPerformance<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  operationName: string
): T {
  return (async (...args: Parameters<T>) => {
    const start = performance.now()
    try {
      const result = await fn(...args)
      const end = performance.now()
      logger.performance(operationName, end - start)
      return result
    } catch (error) {
      const end = performance.now()
      logger.performance(`${operationName} (failed)`, end - start)
      throw error
    }
  }) as T
} 