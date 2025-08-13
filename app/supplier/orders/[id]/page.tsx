'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { formatPrice } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { 
  Package, 
  User, 
  MapPin, 
  CreditCard, 
  Truck, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Phone, 
  Mail,
  Calendar,
  Eye,
  Edit,
  Send,
  XCircle,
  MessageCircle
} from 'lucide-react'
import { ORDER_STATUS, PAYMENT_STATUS } from '@/constants'
import Image from 'next/image'

interface OrderItem {
  _id: string
  product: {
    _id: string
    name: string
    images: string[]
    sku: string
  }
  quantity: number
  price: number
  variant?: string
  status?: string
  supplier: {
    _id: string
    name: string
    email: string
  }
}

interface OrderDetail {
  _id: string
  orderNumber: string
  customer: {
    id: string
    name: string
    email: string
    phone?: string
  }
  items: OrderItem[]
  subtotal: number
  discount: number
  shipping: number
  total: number
  status: string
  paymentStatus: string
  paymentMethod: string
  paymentDetails?: any
  shippingAddress?: {
    street: string
    city: string
    state: string
    zipCode: string
    country: string
  }
  billingAddress?: {
    street: string
    city: string
    state: string
    zipCode: string
    country: string
  }
  shippingMethod: string
  pickupDate?: string
  trackingNumber?: string
  notes?: string
  createdAt: string
  updatedAt: string
  statusHistory: Array<{
    status: string
    timestamp: string
    notes?: string
  }>
}

const getStatusColor = (status: string) => {
  switch (status) {
    case ORDER_STATUS.PENDING:
      return 'bg-yellow-100 text-yellow-800'
    case ORDER_STATUS.CONFIRMED:
      return 'bg-blue-100 text-blue-800'
    case ORDER_STATUS.PROCESSING:
      return 'bg-purple-100 text-purple-800'
    case ORDER_STATUS.SHIPPED:
      return 'bg-indigo-100 text-indigo-800'
    case ORDER_STATUS.DELIVERED:
      return 'bg-green-100 text-green-800'
    case ORDER_STATUS.CANCELLED:
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const getPaymentStatusColor = (status: string) => {
  switch (status) {
    case PAYMENT_STATUS.PENDING:
      return 'bg-yellow-100 text-yellow-800'
    case PAYMENT_STATUS.PAID:
      return 'bg-green-100 text-green-800'
    case PAYMENT_STATUS.FAILED:
      return 'bg-red-100 text-red-800'
    case PAYMENT_STATUS.REFUNDED:
      return 'bg-purple-100 text-purple-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export default function SupplierOrderDetailPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  
  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  
  // Tracking form state
  const [trackingData, setTrackingData] = useState({
    trackingNumber: '',
    carrier: '',
    url: ''
  })
  const [showTrackingForm, setShowTrackingForm] = useState(false)
  
  // Cancellation form state
  const [cancellationReason, setCancellationReason] = useState('')
  const [showCancellationForm, setShowCancellationForm] = useState(false)

  const fetchOrder = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/orders/${params.id}`)
      const data = await response.json()

      if (response.ok) {
        setOrder(data.order)
        // Set existing tracking data if available
        if (data.order.trackingNumber) {
          setTrackingData({
            trackingNumber: data.order.trackingNumber,
            carrier: data.order.carrier || '',
            url: data.order.trackingUrl || ''
          })
        }
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Error al cargar el pedido',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al cargar el pedido',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }, [params.id, toast])

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      router.push('/auth/login')
      return
    }

    if (session.user.role !== 'supplier') {
      router.push('/')
      return
    }

    fetchOrder()
  }, [session, status, router, fetchOrder])

  const handleConfirmOrder = async () => {
    try {
      setActionLoading('confirming')
      const response = await fetch(`/api/supplier/orders/${params.id}/confirm`, {
        method: 'POST'
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: 'Éxito',
          description: 'Pedido confirmado exitosamente',
        })
        fetchOrder()
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Error al confirmar el pedido',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al confirmar el pedido',
        variant: 'destructive'
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleUpdateTracking = async () => {
    if (!trackingData.trackingNumber) {
      toast({
        title: 'Error',
        description: 'El número de seguimiento es requerido',
        variant: 'destructive'
      })
      return
    }

    try {
      setActionLoading('tracking')
      const response = await fetch(`/api/supplier/orders/${params.id}/tracking`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(trackingData)
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: 'Éxito',
          description: 'Información de seguimiento actualizada',
        })
        setShowTrackingForm(false)
        fetchOrder()
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Error al actualizar el seguimiento',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al actualizar el seguimiento',
        variant: 'destructive'
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleMarkAsShipped = async () => {
    try {
      setActionLoading('shipping')
      const response = await fetch(`/api/supplier/orders/${params.id}/ship`, {
        method: 'POST'
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: 'Éxito',
          description: 'Pedido marcado como enviado',
        })
        fetchOrder()
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Error al marcar como enviado',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al marcar como enviado',
        variant: 'destructive'
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleCancelOrder = async () => {
    try {
      setActionLoading('cancelling')
      const response = await fetch(`/api/supplier/orders/${params.id}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason: cancellationReason })
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: 'Éxito',
          description: 'Pedido cancelado exitosamente',
        })
        setShowCancellationForm(false)
        setCancellationReason('')
        fetchOrder()
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Error al cancelar el pedido',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al cancelar el pedido',
        variant: 'destructive'
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleChatWithCustomer = (orderNumber: string, customerName: string) => {
    toast({
      title: 'Chat',
      description: 'Funcionalidad de chat en desarrollo',
    })
    // TODO: Implement chat functionality
  }

  if (status === 'loading' || loading) {
    return <div className="flex justify-center items-center min-h-screen">Cargando...</div>
  }

  if (!session || session.user.role !== 'supplier') {
    return null
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Pedido no encontrado</h1>
          <Button onClick={() => router.push('/supplier/orders')}>
            Volver a pedidos
          </Button>
        </div>
      </div>
    )
  }

  // Filter items that belong to this supplier
  const supplierItems = order.items.filter(item => item.supplier._id === session.user.id)

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Pedido #{order.orderNumber}
            </h1>
            <p className="text-gray-600">
              Creado {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true, locale: es })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge className={getStatusColor(order.status)}>
              {order.status}
            </Badge>
            <Badge className={getPaymentStatusColor(order.paymentStatus)}>
              {order.paymentStatus}
            </Badge>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          {order.status === ORDER_STATUS.PENDING && (
            <Button 
              onClick={handleConfirmOrder}
              disabled={actionLoading === 'confirming'}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              {actionLoading === 'confirming' ? 'Confirmando...' : 'Confirmar Pedido'}
            </Button>
          )}

          {(order.status === ORDER_STATUS.CONFIRMED || order.status === ORDER_STATUS.PROCESSING) && (
            <>
              <Button 
                onClick={handleMarkAsShipped}
                disabled={actionLoading === 'shipping'}
              >
                <Truck className="h-4 w-4 mr-2" />
                {actionLoading === 'shipping' ? 'Enviando...' : 'Marcar como Enviado'}
              </Button>

              <Button 
                variant="outline"
                onClick={() => setShowTrackingForm(!showTrackingForm)}
              >
                <Edit className="h-4 w-4 mr-2" />
                {order.trackingNumber ? 'Actualizar Seguimiento' : 'Agregar Seguimiento'}
              </Button>
            </>
          )}

          {(order.status === ORDER_STATUS.PENDING || order.status === ORDER_STATUS.CONFIRMED) && (
            <Button 
              variant="destructive"
              onClick={() => setShowCancellationForm(!showCancellationForm)}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Cancelar Pedido
            </Button>
          )}

          <Button 
            variant="outline"
            onClick={() => handleChatWithCustomer(order.orderNumber, order.customer.name)}
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            Chat con Cliente
          </Button>

          <Button 
            variant="outline"
            onClick={() => router.push('/supplier/orders')}
          >
            Volver a Pedidos
          </Button>
        </div>
      </div>

      {/* Tracking Form */}
      {showTrackingForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Información de Seguimiento</CardTitle>
            <CardDescription>
              Actualiza la información de seguimiento del envío
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <Label htmlFor="trackingNumber">Número de Seguimiento *</Label>
                <Input
                  id="trackingNumber"
                  value={trackingData.trackingNumber}
                  onChange={(e) => setTrackingData(prev => ({ ...prev, trackingNumber: e.target.value }))}
                  placeholder="Ej: ABC123456789"
                />
              </div>
              <div>
                <Label htmlFor="carrier">Transportadora</Label>
                <Input
                  id="carrier"
                  value={trackingData.carrier}
                  onChange={(e) => setTrackingData(prev => ({ ...prev, carrier: e.target.value }))}
                  placeholder="Ej: Correo Argentino"
                />
              </div>
              <div>
                <Label htmlFor="url">URL de Seguimiento</Label>
                <Input
                  id="url"
                  value={trackingData.url}
                  onChange={(e) => setTrackingData(prev => ({ ...prev, url: e.target.value }))}
                  placeholder="https://..."
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={handleUpdateTracking}
                disabled={actionLoading === 'tracking'}
              >
                <Send className="h-4 w-4 mr-2" />
                {actionLoading === 'tracking' ? 'Actualizando...' : 'Actualizar Seguimiento'}
              </Button>
              <Button 
                variant="outline"
                onClick={() => setShowTrackingForm(false)}
              >
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cancellation Form */}
      {showCancellationForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Cancelar Pedido</CardTitle>
            <CardDescription>
              Especifica el motivo de la cancelación
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Label htmlFor="reason">Motivo de la cancelación</Label>
              <Textarea
                id="reason"
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                placeholder="Explica por qué se cancela el pedido..."
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button 
                variant="destructive"
                onClick={handleCancelOrder}
                disabled={actionLoading === 'cancelling'}
              >
                <XCircle className="h-4 w-4 mr-2" />
                {actionLoading === 'cancelling' ? 'Cancelando...' : 'Confirmar Cancelación'}
              </Button>
              <Button 
                variant="outline"
                onClick={() => setShowCancellationForm(false)}
              >
                Cerrar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Package className="h-5 w-5 mr-2" />
                Productos de tu Inventario ({supplierItems.length})
              </CardTitle>
              <CardDescription>
                Solo se muestran los productos que corresponden a tu inventario
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {supplierItems.map((item) => (
                  <div key={item._id} className="flex items-center space-x-4 p-4 border rounded-lg">
                    <div className="flex-shrink-0">
                      <Image
                        src={item.product.images[0] || '/placeholder.jpg'}
                        alt={item.product.name}
                        width={64}
                        height={64}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-lg font-medium text-gray-900 truncate">
                        {item.product.name}
                      </h4>
                      <p className="text-sm text-gray-500">SKU: {item.product.sku}</p>
                      {item.variant && (
                        <p className="text-sm text-gray-500">Variante: {item.variant}</p>
                      )}
                    </div>
                    <div className="flex-shrink-0 text-center">
                      <p className="text-lg font-medium text-gray-900">
                        {item.quantity} x {formatPrice(item.price)}
                      </p>
                      <p className="text-sm text-gray-500">
                        Subtotal: {formatPrice(item.quantity * item.price)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Order Status Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Historial del Pedido
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.statusHistory?.length > 0 ? (
                  order.statusHistory.map((status, index) => (
                    <div key={index} className="flex items-center space-x-4">
                      <div className={`
                        w-4 h-4 rounded-full flex-shrink-0
                        ${index === 0 ? 'bg-blue-600' : 'bg-gray-300'}
                      `} />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 capitalize">{status.status}</p>
                        <p className="text-sm text-gray-500">
                          {formatDistanceToNow(new Date(status.timestamp), { addSuffix: true, locale: es })}
                        </p>
                        {status.notes && (
                          <p className="text-sm text-gray-600 mt-1">{status.notes}</p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex items-center space-x-4">
                    <div className="w-4 h-4 rounded-full bg-blue-600" />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 capitalize">{order.status}</p>
                      <p className="text-sm text-gray-500">
                        {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true, locale: es })}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Información del Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3">
                <User className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="font-medium">{order.customer.name}</p>
                  <p className="text-sm text-gray-500">Cliente</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="font-medium">{order.customer.email}</p>
                  <p className="text-sm text-gray-500">Correo electrónico</p>
                </div>
              </div>

              {order.customer.phone && (
                <div className="flex items-center space-x-3">
                  <Phone className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-medium">{order.customer.phone}</p>
                    <p className="text-sm text-gray-500">Teléfono</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Shipping Information */}
          {order.shippingAddress && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2" />
                  Dirección de Envío
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="font-medium">{order.shippingAddress.street}</p>
                  <p className="text-sm text-gray-600">
                    {order.shippingAddress.city}, {order.shippingAddress.state}
                  </p>
                  <p className="text-sm text-gray-600">
                    {order.shippingAddress.zipCode}, {order.shippingAddress.country}
                  </p>
                </div>
                
                <Separator className="my-4" />
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Método de envío:</span>
                    <span className="text-sm font-medium capitalize">{order.shippingMethod}</span>
                  </div>
                  
                  {order.trackingNumber && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Seguimiento:</span>
                      <span className="text-sm font-medium">{order.trackingNumber}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payment Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="h-5 w-5 mr-2" />
                Información de Pago
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Estado:</span>
                <Badge className={getPaymentStatusColor(order.paymentStatus)}>
                  {order.paymentStatus}
                </Badge>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Método:</span>
                <span className="text-sm font-medium capitalize">{order.paymentMethod}</span>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Subtotal:</span>
                  <span className="text-sm">{formatPrice(order.subtotal)}</span>
                </div>
                
                {order.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span className="text-sm">Descuento:</span>
                    <span className="text-sm">-{formatPrice(order.discount)}</span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Envío:</span>
                  <span className="text-sm">{formatPrice(order.shipping)}</span>
                </div>
                
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span>{formatPrice(order.total)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order Notes */}
          {order.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notas del Pedido</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">{order.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

