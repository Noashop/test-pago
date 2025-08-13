'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { 
  Bell, 
  Check, 
  CheckCheck, 
  Package, 
  CreditCard, 
  AlertCircle, 
  Info, 
  ShoppingCart,
  Eye,
  Trash2
} from 'lucide-react'

interface Notification {
  _id: string
  title: string
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
  category: 'order' | 'payment' | 'general' | 'promotion'
  isRead: boolean
  data?: {
    orderId?: string
    orderNumber?: string
    paymentId?: string
    productId?: string
    [key: string]: any
  }
  createdAt: string
  updatedAt: string
}

const getNotificationIcon = (type: string, category: string) => {
  switch (category) {
    case 'order':
      return <Package className="h-5 w-5" />
    case 'payment':
      return <CreditCard className="h-5 w-5" />
    case 'promotion':
      return <ShoppingCart className="h-5 w-5" />
    default:
      switch (type) {
        case 'success':
          return <Check className="h-5 w-5" />
        case 'error':
          return <AlertCircle className="h-5 w-5" />
        case 'warning':
          return <AlertCircle className="h-5 w-5" />
        case 'info':
          return <Info className="h-5 w-5" />
        default:
          return <Bell className="h-5 w-5" />
      }
  }
}

const getNotificationColor = (type: string) => {
  switch (type) {
    case 'success':
      return 'text-green-600 bg-green-50'
    case 'error':
      return 'text-red-600 bg-red-50'
    case 'warning':
      return 'text-yellow-600 bg-yellow-50'
    case 'info':
      return 'text-blue-600 bg-blue-50'
    default:
      return 'text-gray-600 bg-gray-50'
  }
}

export default function NotificationsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all')
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'order' | 'payment' | 'general' | 'promotion'>('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20'
      })
      
      if (filter === 'unread') {
        params.append('unreadOnly', 'true')
      }

      const response = await fetch(`/api/notifications?${params}`)
      const data = await response.json()

      if (response.ok) {
        let filteredNotifications = data.notifications

        // Apply category filter
        if (categoryFilter !== 'all') {
          filteredNotifications = filteredNotifications.filter((n: Notification) => n.category === categoryFilter)
        }

        // Apply read status filter
        if (filter === 'read') {
          filteredNotifications = filteredNotifications.filter((n: Notification) => n.isRead)
        }

        setNotifications(filteredNotifications)
        setTotalPages(data.pagination?.totalPages || 1)
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Error al cargar las notificaciones',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al cargar las notificaciones',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }, [page, filter, categoryFilter, toast])

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      router.push('/auth/login')
      return
    }

    if (session.user.role !== 'client') {
      router.push('/')
      return
    }

    fetchNotifications()
  }, [session, status, router, fetchNotifications])

  const markAsRead = async (notificationIds: string[]) => {
    try {
      setActionLoading('marking')
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notificationIds }),
      })

      if (response.ok) {
        // Update local state
        setNotifications(prev => 
          prev.map(n => 
            notificationIds.includes(n._id) ? { ...n, isRead: true } : n
          )
        )
        
        toast({
          title: 'Éxito',
          description: 'Notificaciones marcadas como leídas',
        })
      } else {
        const data = await response.json()
        toast({
          title: 'Error',
          description: data.error || 'Error al marcar las notificaciones',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al marcar las notificaciones',
        variant: 'destructive'
      })
    } finally {
      setActionLoading(null)
    }
  }

  const markAllAsRead = async () => {
    try {
      setActionLoading('markingAll')
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ markAll: true }),
      })

      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => ({ ...n, isRead: true }))
        )
        
        toast({
          title: 'Éxito',
          description: 'Todas las notificaciones marcadas como leídas',
        })
      } else {
        const data = await response.json()
        toast({
          title: 'Error',
          description: data.error || 'Error al marcar todas las notificaciones',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al marcar todas las notificaciones',
        variant: 'destructive'
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read if not read
    if (!notification.isRead) {
      markAsRead([notification._id])
    }

    // Navigate based on notification data
    if (notification.data?.orderId) {
      router.push(`/orders/${notification.data.orderId}`)
    } else if (notification.data?.productId) {
      router.push(`/products/${notification.data.productId}`)
    }
  }

  const unreadCount = notifications.filter(n => !n.isRead).length

  if (status === 'loading' || loading) {
    return <div className="flex justify-center items-center min-h-screen">Cargando...</div>
  }

  if (!session || session.user.role !== 'client') {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Mis Notificaciones</h1>
        <p className="text-gray-600">
          Mantente al día con todas las actualizaciones importantes
        </p>
      </div>

      {/* Stats and Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="flex items-center p-6">
            <div className="p-2 bg-blue-50 rounded-lg mr-4">
              <Bell className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{notifications.length}</p>
              <p className="text-sm text-gray-500">Total de notificaciones</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <div className="p-2 bg-red-50 rounded-lg mr-4">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{unreadCount}</p>
              <p className="text-sm text-gray-500">Sin leer</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-center p-6">
            <Button 
              onClick={markAllAsRead}
              disabled={actionLoading === 'markingAll' || unreadCount === 0}
              className="w-full"
            >
              <CheckCheck className="h-4 w-4 mr-2" />
              {actionLoading === 'markingAll' ? 'Marcando...' : 'Marcar todas como leídas'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex gap-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
              >
                Todas
              </Button>
              <Button
                variant={filter === 'unread' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('unread')}
              >
                Sin leer ({unreadCount})
              </Button>
              <Button
                variant={filter === 'read' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('read')}
              >
                Leídas
              </Button>
            </div>

            <Separator orientation="vertical" className="h-8" />

            <div className="flex gap-2">
              <Button
                variant={categoryFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCategoryFilter('all')}
              >
                Todas las categorías
              </Button>
              <Button
                variant={categoryFilter === 'order' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCategoryFilter('order')}
              >
                Pedidos
              </Button>
              <Button
                variant={categoryFilter === 'payment' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCategoryFilter('payment')}
              >
                Pagos
              </Button>
              <Button
                variant={categoryFilter === 'promotion' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCategoryFilter('promotion')}
              >
                Promociones
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      <Card>
        <CardHeader>
          <CardTitle>Notificaciones</CardTitle>
          <CardDescription>
            Haz clic en una notificación para ver más detalles
          </CardDescription>
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No tienes notificaciones
              </h3>
              <p className="text-gray-500">
                {filter === 'unread' 
                  ? 'No tienes notificaciones sin leer en este momento.'
                  : 'Cuando tengas nuevas actualizaciones, aparecerán aquí.'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`
                    p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md
                    ${!notification.isRead 
                      ? 'bg-blue-50 border-blue-200' 
                      : 'bg-white border-gray-200'
                    }
                  `}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-4">
                    <div className={`
                      p-2 rounded-lg ${getNotificationColor(notification.type)}
                    `}>
                      {getNotificationIcon(notification.type, notification.category)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-lg font-medium text-gray-900 truncate">
                          {notification.title}
                        </h4>
                        <div className="flex items-center gap-2 ml-4">
                          {!notification.isRead && (
                            <Badge variant="default" className="bg-blue-600">
                              Nuevo
                            </Badge>
                          )}
                          <span className="text-sm text-gray-500">
                            {formatDistanceToNow(new Date(notification.createdAt), {
                              addSuffix: true,
                              locale: es
                            })}
                          </span>
                        </div>
                      </div>

                      <p className="text-gray-700 mb-2">
                        {notification.message}
                      </p>

                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="capitalize">
                          {notification.category}
                        </Badge>

                        <div className="flex gap-2">
                          {!notification.isRead && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                markAsRead([notification._id])
                              }}
                              disabled={actionLoading === 'marking'}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Marcar como leída
                            </Button>
                          )}
                          
                          {notification.data?.orderId && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                router.push(`/orders/${notification.data?.orderId}`)
                              }}
                            >
                              Ver pedido
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <Button
                variant="outline"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                Anterior
              </Button>
              
              <div className="flex items-center gap-2">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = i + 1
                  return (
                    <Button
                      key={pageNum}
                      variant={page === pageNum ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  )
                })}
              </div>

              <Button
                variant="outline"
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
              >
                Siguiente
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

