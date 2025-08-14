'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { 
  Package, 
  Eye, 
  Search, 
  Filter, 
  Calendar,
  ChevronDown,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  Star,
  MessageCircle,
  RefreshCw,
  ShoppingCart
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { formatPrice } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { ClientLoader } from '@/components/ui/loaders'

interface Order {
  _id: string
  orderNumber: string
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded'
  total: number
  items: Array<{
    productId: {
      _id: string
      name: string
      images: string[]
    }
    quantity: number
    price: number
  }>
  createdAt: string
  shippingAddress: {
    name: string
    street: string
    city: string
    state: string
  }
  trackingNumber?: string
}

interface ReviewForm {
  productId: string
  orderId: string
  rating: number
  title: string
  comment: string
}

const STATUS_CONFIG = {
  pending: {
    label: 'Pendiente',
    color: 'bg-yellow-100 text-yellow-800',
    icon: Clock
  },
  confirmed: {
    label: 'Confirmado',
    color: 'bg-blue-100 text-blue-800',
    icon: CheckCircle
  },
  processing: {
    label: 'Procesando',
    color: 'bg-purple-100 text-purple-800',
    icon: Package
  },
  shipped: {
    label: 'Enviado',
    color: 'bg-indigo-100 text-indigo-800',
    icon: Truck
  },
  delivered: {
    label: 'Entregado',
    color: 'bg-green-100 text-green-800',
    icon: CheckCircle
  },
  cancelled: {
    label: 'Cancelado',
    color: 'bg-red-100 text-red-800',
    icon: XCircle
  }
}

const PAYMENT_STATUS_CONFIG = {
  pending: {
    label: 'Pago Pendiente',
    color: 'bg-yellow-100 text-yellow-800'
  },
  paid: {
    label: 'Pagado',
    color: 'bg-green-100 text-green-800'
  },
  failed: {
    label: 'Pago Fallido',
    color: 'bg-red-100 text-red-800'
  },
  refunded: {
    label: 'Reembolsado',
    color: 'bg-gray-100 text-gray-800'
  }
}

// Compatibilidad con estados de Mercado Pago
;(PAYMENT_STATUS_CONFIG as any).approved = PAYMENT_STATUS_CONFIG.paid
;(PAYMENT_STATUS_CONFIG as any).rejected = PAYMENT_STATUS_CONFIG.failed

export default function OrdersPage() {
  const { data: session, status } = useSession()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [paymentFilter, setPaymentFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState('newest')
  const [reviewDialog, setReviewDialog] = useState(false)
  const [reviewForm, setReviewForm] = useState<ReviewForm>({
    productId: '',
    orderId: '',
    rating: 5,
    title: '',
    comment: ''
  })
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [submittingReview, setSubmittingReview] = useState(false)
  const { toast } = useToast()

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/orders', { credentials: 'include', cache: 'no-store' })
      const payload = await response.json().catch(() => ({}))

      if (response.ok) {
        const list = (payload?.data?.orders ?? payload?.orders ?? []) as any[]
        const normalized = list.map((o: any) => ({
          ...o,
          paymentStatus: o.paymentStatus === 'approved' ? 'paid' : o.paymentStatus === 'rejected' ? 'failed' : o.paymentStatus
        }))
        setOrders(normalized)
      } else {
        throw new Error(payload?.error || 'No se pudieron cargar las órdenes')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las órdenes',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      redirect('/auth/login?callbackUrl=/orders')
      return
    }
    fetchOrders()
  }, [session, status, fetchOrders])

  const handleCancelOrder = async (orderId: string) => {
    try {
      setCancellingId(orderId)
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: 'Éxito',
          description: 'Pedido cancelado'
        })
        // Update local state to reflect cancellation
        setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: 'cancelled' } as Order : o))
      } else {
        throw new Error(data.error)
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo cancelar el pedido',
        variant: 'destructive'
      })
    } finally {
      setCancellingId(null)
    }
  }

  const handleRetryPayment = async (orderId: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/retry-payment`, {
        method: 'POST'
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: 'Éxito',
          description: 'Redirigiendo al pago...'
        })
        // Redirect to payment (support both prod and sandbox keys)
        window.location.href = data.initPoint || data.sandboxInitPoint || data.paymentUrl
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo procesar el pago',
        variant: 'destructive'
      })
    }
  }

  const handleReorderItems = async (orderId: string) => {
    try {
      const order = orders.find(o => o._id === orderId)
      if (!order) return

      // Add items to cart
      const response = await fetch('/api/cart/bulk-add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          items: order.items.map(item => ({
            productId: item.productId._id,
            quantity: item.quantity
          }))
        })
      })

      if (response.ok) {
        toast({
          title: 'Éxito',
          description: 'Productos agregados al carrito'
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudieron agregar los productos',
        variant: 'destructive'
      })
    }
  }

  const openReviewDialog = (productId: string, orderId: string, productName: string) => {
    setReviewForm({
      productId,
      orderId,
      rating: 5,
      title: `Mi experiencia con ${productName}`,
      comment: ''
    })
    setReviewDialog(true)
  }

  const submitReview = async () => {
    try {
      setSubmittingReview(true)
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(reviewForm)
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: 'Éxito',
          description: 'Reseña enviada correctamente'
        })
        setReviewDialog(false)
        setReviewForm({
          productId: '',
          orderId: '',
          rating: 5,
          title: '',
          comment: ''
        })
      } else {
        throw new Error(data.error)
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo enviar la reseña',
        variant: 'destructive'
      })
    } finally {
      setSubmittingReview(false)
    }
  }

  const filteredOrders = orders
    .filter(order => {
      const matchesSearch = order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           order.items.some(item => item.productId.name.toLowerCase().includes(searchTerm.toLowerCase()))
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter
      const matchesPayment = paymentFilter === 'all' || order.paymentStatus === paymentFilter
      return matchesSearch && matchesStatus && matchesPayment
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        case 'highest':
          return b.total - a.total
        case 'lowest':
          return a.total - b.total
        default:
          return 0
      }
    })

  if (status === 'loading' || loading) {
    return <ClientLoader />
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Mis Órdenes</h1>
              <p className="text-muted-foreground mt-2">
                Gestiona y revisa tus pedidos
              </p>
            </div>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Buscar por número de orden o producto..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value="pending">Pendiente</SelectItem>
                    <SelectItem value="confirmed">Confirmado</SelectItem>
                    <SelectItem value="processing">Procesando</SelectItem>
                    <SelectItem value="shipped">Enviado</SelectItem>
                    <SelectItem value="delivered">Entregado</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Pago" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los pagos</SelectItem>
                    <SelectItem value="pending">Pago Pendiente</SelectItem>
                    <SelectItem value="paid">Pagado</SelectItem>
                    <SelectItem value="failed">Pago Fallido</SelectItem>
                    <SelectItem value="refunded">Reembolsado</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Ordenar por" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Más recientes</SelectItem>
                    <SelectItem value="oldest">Más antiguos</SelectItem>
                    <SelectItem value="highest">Mayor valor</SelectItem>
                    <SelectItem value="lowest">Menor valor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Orders List */}
          {filteredOrders.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No hay órdenes</h3>
                <p className="text-muted-foreground mb-6">
                  {orders.length === 0 
                    ? "Aún no has realizado ningún pedido"
                    : "No se encontraron órdenes con los filtros aplicados"
                  }
                </p>
                <Link href="/products">
                  <Button>
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Explorar Productos
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => {
                const statusConfig = STATUS_CONFIG[order.status]
                const paymentConfig = PAYMENT_STATUS_CONFIG[order.paymentStatus]
                const StatusIcon = statusConfig.icon

                return (
                  <Card key={order._id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        {/* Order Info */}
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <h3 className="font-semibold text-lg">
                              Orden #{order.orderNumber}
                            </h3>
                            <Badge className={statusConfig.color}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {statusConfig.label}
                            </Badge>
                            <Badge className={paymentConfig.color}>
                              {paymentConfig.label}
                            </Badge>
                            {order.trackingNumber && (
                              <Badge variant="outline">
                                <Truck className="h-3 w-3 mr-1" />
                                {order.trackingNumber}
                              </Badge>
                            )}
                          </div>

                          <div className="text-sm text-muted-foreground mb-3">
                            <p>
                              Realizada {formatDistanceToNow(new Date(order.createdAt), {
                                addSuffix: true,
                                locale: es,
                              })}
                            </p>
                            <p>
                              Envío a: {order.shippingAddress.name}, {order.shippingAddress.city}, {order.shippingAddress.state}
                            </p>
                          </div>

                          {/* Order Items Preview */}
                          <div className="flex items-center gap-2 mb-3">
                            {order.items.slice(0, 3).map((item, index) => (
                              <div key={index} className="flex items-center gap-2">
                                <Image
                                  src={item.productId.images[0] || '/placeholder-product.jpg'}
                                  alt={item.productId.name}
                                  width={40}
                                  height={40}
                                  className="w-10 h-10 rounded object-cover"
                                />
                                <span className="text-xs bg-muted px-2 py-1 rounded">
                                  {item.quantity}x
                                </span>
                              </div>
                            ))}
                            {order.items.length > 3 && (
                              <div className="w-10 h-10 bg-muted rounded flex items-center justify-center text-xs">
                                +{order.items.length - 3}
                              </div>
                            )}
                            <div className="ml-2">
                              <p className="text-sm font-medium">
                                {order.items.length} producto{order.items.length !== 1 ? 's' : ''}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Order Actions */}
                        <div className="flex flex-col items-end gap-3">
                          <div className="text-right">
                            <p className="text-2xl font-bold text-primary">
                              {formatPrice(order.total)}
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/orders/${order._id}`}>
                                <Eye className="h-4 w-4 mr-2" />
                                Ver Detalles
                              </Link>
                            </Button>

                            {(order.paymentStatus === 'failed' || order.paymentStatus === 'pending') && order.status !== 'cancelled' && order.status !== 'delivered' && (
                              <Button 
                                size="sm" 
                                onClick={() => handleRetryPayment(order._id)}
                                className="bg-orange-600 hover:bg-orange-700"
                              >
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Reintentar Pago
                              </Button>
                            )}

                            {order.status === 'delivered' && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleReorderItems(order._id)}
                              >
                                <ShoppingCart className="h-4 w-4 mr-2" />
                                Reordenar
                              </Button>
                            )}

                            {order.status === 'delivered' && order.items.map((item) => (
                              <Button
                                key={item.productId._id}
                                variant="outline"
                                size="sm"
                                onClick={() => openReviewDialog(item.productId._id, order._id, item.productId.name)}
                              >
                                <Star className="h-4 w-4 mr-2" />
                                Reseñar
                              </Button>
                            ))}

                            {order.status === 'pending' && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleCancelOrder(order._id)}
                                disabled={cancellingId === order._id}
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                {cancellingId === order._id ? 'Cancelando...' : 'Cancelar'}
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}

          {/* Results Summary */}
          {!loading && filteredOrders.length > 0 && (
            <div className="text-center text-sm text-muted-foreground">
              Mostrando {filteredOrders.length} de {orders.length} órdenes
            </div>
          )}
        </div>
      </main>

      {/* Review Dialog */}
      <Dialog open={reviewDialog} onOpenChange={setReviewDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Escribir Reseña</DialogTitle>
            <DialogDescription>
              Comparte tu experiencia con este producto
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="rating">Calificación</Label>
              <div className="flex gap-1 mt-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewForm({...reviewForm, rating: star})}
                    className="p-1"
                  >
                    <Star
                      className={`h-6 w-6 ${
                        star <= reviewForm.rating
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                value={reviewForm.title}
                onChange={(e) => setReviewForm({...reviewForm, title: e.target.value})}
                placeholder="Resumen de tu experiencia"
              />
            </div>

            <div>
              <Label htmlFor="comment">Comentario</Label>
              <Textarea
                id="comment"
                value={reviewForm.comment}
                onChange={(e) => setReviewForm({...reviewForm, comment: e.target.value})}
                placeholder="Cuéntanos más detalles sobre tu experiencia..."
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={submitReview} disabled={submittingReview}>
              {submittingReview ? 'Enviando...' : 'Enviar Reseña'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
