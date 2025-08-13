'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { 
  ArrowLeft,
  Package,
  Truck,
  MapPin,
  CreditCard,
  Download,
  MessageCircle,
  CheckCircle,
  Clock,
  XCircle,
  RotateCcw,
  Star,
  Calendar,
  Building
} from 'lucide-react'

import Navbar from '@/components/layout/navbar'
import Footer from '@/components/layout/footer'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { formatPrice } from '@/lib/utils'
import { formatDistanceToNow, format } from 'date-fns'
import { es } from 'date-fns/locale'

interface OrderItem {
  _id: string
  product: {
    _id: string
    name: string
    images: string[]
    slug: string
  }
  quantity: number
  price: number
  variant?: string
}

interface Order {
  _id: string
  orderNumber: string
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  items: OrderItem[]
  subtotal: number
  discount: number
  shipping: number
  total: number
  shippingMethod?: string
  pickupDate?: string
  shippingAddress: {
    name: string
    street: string
    city: string
    state: string
    zipCode: string
    phone: string
  }
  billingAddress: {
    name: string
    street: string
    city: string
    state: string
    zipCode: string
    taxId?: string
  }
  paymentMethod: string
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded' | 'approved'
  trackingNumber?: string
  notes?: string
  createdAt: string
  updatedAt: string
  statusHistory: Array<{
    status: string
    date: string
    note?: string
  }>
  supplierInfo?: {
    name: string
    address: string
    phone: string
    businessHours: string
  }
}

const STATUS_CONFIG = {
  pending: {
    label: 'Pendiente',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: Clock,
    description: 'Tu orden está siendo procesada'
  },
  confirmed: {
    label: 'Confirmado',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: CheckCircle,
    description: 'Tu orden ha sido confirmada'
  },
  processing: {
    label: 'Procesando',
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    icon: Package,
    description: 'Estamos preparando tu pedido'
  },
  shipped: {
    label: 'Enviado',
    color: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    icon: Truck,
    description: 'Tu pedido está en camino'
  },
  delivered: {
    label: 'Entregado',
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: CheckCircle,
    description: 'Tu pedido ha sido entregado'
  },
  cancelled: {
    label: 'Cancelado',
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: XCircle,
    description: 'Esta orden ha sido cancelada'
  }
}

export default function OrderDetailPage() {
  const { data: session } = useSession()
  const params = useParams()
  const router = useRouter()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [isRetrying, setIsRetrying] = useState(false)
  const { toast } = useToast()

  const fetchOrder = useCallback(async (orderId: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`)
      const data = await response.json()

      if (response.ok) {
        setOrder(data.order)
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo cargar la orden',
        variant: 'destructive',
      })
      router.push('/orders')
    } finally {
      setLoading(false)
    }
  }, [router, toast])

  useEffect(() => {
    if (params.id) {
      fetchOrder(params.id as string)
    }
  }, [params.id, fetchOrder])

  const handleCancelOrder = async () => {
    if (!order || order.status !== 'pending') return

    try {
      const response = await fetch(`/api/orders/${order._id}/cancel`, {
        method: 'POST',
      })

      if (response.ok) {
        toast({
          title: 'Orden cancelada',
          description: 'Tu orden ha sido cancelada exitosamente',
        })
        fetchOrder(order._id)
      } else {
        throw new Error('Error al cancelar la orden')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo cancelar la orden',
        variant: 'destructive',
      })
    }
  }

  const handleRetryPayment = async () => {
    if (!order) return
    try {
      setIsRetrying(true)
      const res = await fetch(`/api/orders/${order._id}/retry-payment`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data?.error || 'No se pudo iniciar el reintento de pago')
      }
      const redirectUrl = data.init_point || data.sandbox_init_point || data.payment_url || data.preference?.init_point
      if (redirectUrl) {
        window.location.href = redirectUrl
      } else {
        toast({
          title: 'Error',
          description: 'No se recibió una URL de pago válida',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo iniciar el pago. Intenta nuevamente más tarde.',
        variant: 'destructive',
      })
    } finally {
      setIsRetrying(false)
    }
  }

  const handleReorder = () => {
    // Add all items to cart and redirect to cart
    order?.items.forEach(item => {
      // This would integrate with the cart store
      console.log('Adding to cart:', item)
    })
    
    toast({
      title: 'Productos agregados',
      description: 'Los productos han sido agregados al carrito',
    })
    
    router.push('/cart')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/4" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="h-64 bg-muted rounded" />
                <div className="h-48 bg-muted rounded" />
              </div>
              <div className="space-y-6">
                <div className="h-32 bg-muted rounded" />
                <div className="h-48 bg-muted rounded" />
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (!order) {
    return null
  }

  const statusConfig = STATUS_CONFIG[order.status]
  const StatusIcon = statusConfig.icon

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
            <div>
              <h1 className="text-3xl font-playfair font-bold text-foreground">
                Orden #{order.orderNumber}
              </h1>
              <p className="text-muted-foreground">
                Realizada el {format(new Date(order.createdAt), 'dd/MM/yyyy HH:mm', { locale: es })}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Descargar
            </Button>
            <Button variant="outline" size="sm">
              <MessageCircle className="h-4 w-4 mr-2" />
              Soporte
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Payment Status & Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="h-5 w-5 mr-2" />
                  Estado del Pago
                </CardTitle>
                <CardDescription>
                  Revisa el estado de tu pago y vuelve a intentar si hubo un problema.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium capitalize">{order.paymentStatus || 'pendiente'}</p>
                    <p className="text-sm text-muted-foreground">
                      Última actualización: {format(new Date(order.updatedAt), 'dd/MM/yyyy HH:mm', { locale: es })}
                    </p>
                  </div>
                  {/* Mostrar botón de reintento si no está pagado/aprobado */}
                  {(order.paymentStatus !== 'paid' && order.paymentStatus !== 'approved') && (
                    <Button onClick={handleRetryPayment} variant="default" size="sm">
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Reintentar pago
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
            {/* Order Status */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <StatusIcon className="h-5 w-5 mr-2" />
                    Estado de la Orden
                  </CardTitle>
                  <Badge className={statusConfig.color}>
                    {statusConfig.label}
                  </Badge>
                </div>
                <CardDescription>
                  {statusConfig.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {order.trackingNumber && (
                  <div className="mb-4 p-4 bg-muted rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Número de seguimiento</p>
                        <p className="text-sm text-muted-foreground">{order.trackingNumber}</p>
                      </div>
                      <Button variant="outline" size="sm">
                        <Truck className="h-4 w-4 mr-2" />
                        Rastrear
                      </Button>
                    </div>
                  </div>
                )}

                {/* Status Timeline */}
                <div className="space-y-4">
                  {order.statusHistory.map((status, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                      <div className="flex-1">
                        <p className="font-medium capitalize">{status.status}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(status.date), 'dd/MM/yyyy HH:mm', { locale: es })}
                        </p>
                        {status.note && (
                          <p className="text-sm text-muted-foreground mt-1">{status.note}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Order Items */}
            <Card>
              <CardHeader>
                <CardTitle>Productos Ordenados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {order.items.map((item) => (
                    <div key={item._id} className="flex items-center space-x-4 p-4 border rounded-lg">
                      <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                        <Package className="h-6 w-6 text-muted-foreground" />
                      </div>
                      
                      <div className="flex-1">
                        <Link 
                          href={`/products/${item.product._id}`}
                          className="font-medium hover:text-primary transition-colors"
                        >
                          {item.product.name}
                        </Link>
                        {item.variant && (
                          <p className="text-sm text-muted-foreground">
                            Variante: {item.variant}
                          </p>
                        )}
                        <p className="text-sm text-muted-foreground">
                          Cantidad: {item.quantity}
                        </p>
                      </div>
                      
                      <div className="text-right">
                        <p className="font-medium">{formatPrice(item.price)}</p>
                        <p className="text-sm text-muted-foreground">
                          c/u
                        </p>
                      </div>
                      
                      <div className="text-right">
                        <p className="font-semibold text-primary">
                          {formatPrice(item.price * item.quantity)}
                        </p>
                      </div>

                      {order.status === 'delivered' && (
                        <Button variant="outline" size="sm">
                          <Star className="h-4 w-4 mr-1" />
                          Reseñar
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Shipping & Billing */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {order.shippingMethod === 'pickup' ? (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Building className="h-5 w-5 mr-2" />
                        Información del Proveedor
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-1">
                        <p className="font-medium">{order.supplierInfo?.name || 'Salta Conecta'}</p>
                        <p className="text-sm text-muted-foreground">{order.supplierInfo?.address || 'Av. San Martín 1234, Salta'}</p>
                        <p className="text-sm text-muted-foreground">Tel: {order.supplierInfo?.phone || '+54 387 456-7890'}</p>
                        <p className="text-sm text-muted-foreground">Horarios: {order.supplierInfo?.businessHours || 'Lun-Vie 9:00-18:00, Sáb 9:00-13:00'}</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Calendar className="h-5 w-5 mr-2" />
                        Fecha de Retiro
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-1">
                        <p className="font-medium">
                          {order.pickupDate ? format(new Date(order.pickupDate), 'dd/MM/yyyy', { locale: es }) : 'Por confirmar'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {order.pickupDate ? format(new Date(order.pickupDate), 'EEEE, dd \'de\' MMMM', { locale: es }) : 'Se confirmará por email'}
                        </p>
                        <p className="text-sm text-blue-600 font-medium">
                          Recuerda llevar tu DNI y el comprobante de pago
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <MapPin className="h-5 w-5 mr-2" />
                        Dirección de Envío
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-1">
                        <p className="font-medium">{order.shippingAddress.name}</p>
                        <p className="text-sm text-muted-foreground">{order.shippingAddress.street}</p>
                        <p className="text-sm text-muted-foreground">
                          {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
                        </p>
                        <p className="text-sm text-muted-foreground">{order.shippingAddress.phone}</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <CreditCard className="h-5 w-5 mr-2" />
                        Información de Facturación
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-1">
                        <p className="font-medium">{order.billingAddress.name}</p>
                        <p className="text-sm text-muted-foreground">{order.billingAddress.street}</p>
                        <p className="text-sm text-muted-foreground">
                          {order.billingAddress.city}, {order.billingAddress.state} {order.billingAddress.zipCode}
                        </p>
                        {order.billingAddress.taxId && (
                          <p className="text-sm text-muted-foreground">CUIT: {order.billingAddress.taxId}</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>

            {/* Order Notes */}
            {order.notes && (
              <Card>
                <CardHeader>
                  <CardTitle>Notas del Pedido</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{order.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Resumen de la Orden</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{formatPrice(order.subtotal)}</span>
                  </div>
                  
                  {order.discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Descuento</span>
                      <span>-{formatPrice(order.discount)}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between">
                    <span>Envío</span>
                    <span>{order.shipping > 0 ? formatPrice(order.shipping) : 'Gratis'}</span>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total</span>
                    <span className="text-primary">{formatPrice(order.total)}</span>
                  </div>
                </div>

                <div className="space-y-2 pt-4">
                  <div className="flex justify-between text-sm">
                    <span>Método de pago</span>
                    <span className="capitalize">{order.paymentMethod}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Estado del pago</span>
                    <Badge
                      variant={
                        order.paymentStatus === 'approved' || order.paymentStatus === 'paid'
                          ? 'default'
                          : order.paymentStatus === 'failed'
                          ? 'destructive'
                          : 'secondary'
                      }
                    >
                      {order.paymentStatus === 'approved'
                        ? 'Aprobado'
                        : order.paymentStatus === 'paid'
                        ? 'Pagado'
                        : order.paymentStatus === 'failed'
                        ? 'Fallido'
                        : order.paymentStatus === 'refunded'
                        ? 'Reembolsado'
                        : 'Pendiente'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Acciones</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {order.status === 'pending' && (
                  <Button 
                    variant="destructive" 
                    className="w-full"
                    onClick={handleCancelOrder}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Cancelar Orden
                  </Button>
                )}

                {order.status === 'delivered' && (
                  <Button 
                    className="w-full"
                    onClick={handleReorder}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reordenar
                  </Button>
                )}

                {/* Retry payment when not approved and order not cancelled */}
                {order.paymentStatus !== 'approved' && order.status !== 'cancelled' && (
                  <Button 
                    className="w-full"
                    onClick={handleRetryPayment}
                    disabled={isRetrying}
                  >
                    {isRetrying ? (
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <CreditCard className="h-4 w-4 mr-2" />
                    )}
                    {isRetrying ? 'Redirigiendo…' : 'Reintentar pago'}
                  </Button>
                )}

                <Button variant="outline" className="w-full">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Contactar Soporte
                </Button>

                <Button variant="outline" className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Descargar Factura
                </Button>
              </CardContent>
            </Card>

            {/* Help */}
            <Card>
              <CardHeader>
                <CardTitle>¿Necesitas ayuda?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Si tienes alguna pregunta sobre tu orden, no dudes en contactarnos.
                </p>
                <Button variant="outline" className="w-full" size="sm">
                  Centro de Ayuda
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  )
}
