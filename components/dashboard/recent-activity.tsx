'use client'

import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { 
  User, 
  Package, 
  ShoppingCart, 
  AlertCircle, 
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface Activity {
  type: string
  description: string
  timestamp: string
  user?: string
  status?: string
}

interface RecentActivityProps {
  activities: Activity[]
}

const getActivityIcon = (type: string) => {
  switch (type) {
    case 'user_registered':
      return User
    case 'product_created':
    case 'product_updated':
      return Package
    case 'order_created':
    case 'order_updated':
      return ShoppingCart
    case 'support_ticket':
      return AlertCircle
    default:
      return Clock
  }
}

const getActivityColor = (type: string, status?: string) => {
  if (status === 'completed' || status === 'approved') return 'text-green-600'
  if (status === 'cancelled' || status === 'rejected') return 'text-red-600'
  if (status === 'pending') return 'text-yellow-600'
  
  switch (type) {
    case 'user_registered':
      return 'text-blue-600'
    case 'product_created':
      return 'text-green-600'
    case 'order_created':
      return 'text-purple-600'
    case 'support_ticket':
      return 'text-orange-600'
    default:
      return 'text-gray-600'
  }
}

const getStatusBadge = (status?: string) => {
  if (!status) return null
  
  const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    completed: 'default',
    pending: 'secondary',
    cancelled: 'destructive',
    approved: 'default',
    rejected: 'destructive',
  }
  
  const labels: Record<string, string> = {
    completed: 'Completado',
    pending: 'Pendiente',
    cancelled: 'Cancelado',
    approved: 'Aprobado',
    rejected: 'Rechazado',
  }
  
  return (
    <Badge variant={variants[status] || 'outline'} className="text-xs">
      {labels[status] || status}
    </Badge>
  )
}

export function RecentActivity({ activities }: RecentActivityProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Actividad Reciente</CardTitle>
        <CardDescription>
          Últimas acciones en la plataforma
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No hay actividad reciente</p>
            </div>
          ) : (
            activities.slice(0, 10).map((activity, index) => {
              const Icon = getActivityIcon(activity.type)
              const iconColor = getActivityColor(activity.type, activity.status)
              
              return (
                <div key={index} className="flex items-start space-x-3">
                  <div className={`p-2 rounded-full bg-muted ${iconColor}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium leading-none">
                        {activity.description}
                      </p>
                      {getStatusBadge(activity.status)}
                    </div>
                    
                    <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                      {activity.user && (
                        <>
                          <span>por {activity.user}</span>
                          <span>•</span>
                        </>
                      )}
                      <span>
                        {formatDistanceToNow(new Date(activity.timestamp), {
                          addSuffix: true,
                          locale: es,
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })
          )}
          
          {activities.length > 10 && (
            <div className="text-center pt-4">
              <button className="text-sm text-primary hover:underline">
                Ver todas las actividades
              </button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
