'use client'

import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { Eye, Package, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatPrice, getStatusColor } from '@/lib/utils'

interface Order {
  _id: string
  orderNumber: string
  customer: string
  total: number
  status: string
  createdAt: string
  items: Array<{
    product: string
    quantity: number
    price: number
  }>
}

interface RecentOrdersProps {
  orders: Order[]
}

const getStatusIcon = (status: string) => {
  switch (status.toLowerCase()) {
    case 'completed':
    case 'delivered':
      return CheckCircle
    case 'cancelled':
    case 'refunded':
      return XCircle
    case 'pending':
    case 'processing':
      return Clock
    case 'shipped':
      return Package
    default:
      return AlertCircle
  }
}

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    pending: 'Pendiente',
    processing: 'Procesando',
    shipped: 'Enviado',
    delivered: 'Entregado',
    completed: 'Completado',
    cancelled: 'Cancelado',
    refunded: 'Reembolsado',
  }
  return labels[status.toLowerCase()] || status
}

const getStatusVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
  switch (status.toLowerCase()) {
    case 'completed':
    case 'delivered':
      return 'default'
    case 'cancelled':
    case 'refunded':
      return 'destructive'
    case 'pending':
    case 'processing':
      return 'secondary'
    default:
      return 'outline'
  }
}

export function RecentOrders({ orders }: RecentOrdersProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Órdenes Recientes</CardTitle>
        <CardDescription>
          Últimas órdenes recibidas para tus productos
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {orders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No hay órdenes recientes</p>
            </div>
          ) : (
            orders.slice(0, 8).map((order) => {
              const StatusIcon = getStatusIcon(order.status)
              
              return (
                <div key={order._id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-full ${getStatusColor(order.status)} bg-opacity-10`}>
                      <StatusIcon className="h-4 w-4" />
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-sm">
                          #{order.orderNumber}
                        </span>
                        <Badge variant={getStatusVariant(order.status)} className="text-xs">
                          {getStatusLabel(order.status)}
                        </Badge>
                      </div>
                      
                      <div className="text-xs text-muted-foreground">
                        <span>Cliente: {order.customer}</span>
                        <span className="mx-2">•</span>
                        <span>
                          {order.items.length} producto{order.items.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      
                      <div className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(order.createdAt), {
                          addSuffix: true,
                          locale: es,
                        })}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right space-y-1">
                    <div className="font-semibold text-primary">
                      {formatPrice(order.total)}
                    </div>
                    <Button variant="ghost" size="sm" className="h-6 px-2">
                      <Eye className="h-3 w-3 mr-1" />
                      Ver
                    </Button>
                  </div>
                </div>
              )
            })
          )}
          
          {orders.length > 8 && (
            <div className="text-center pt-4">
              <Button variant="outline" size="sm">
                Ver todas las órdenes
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
