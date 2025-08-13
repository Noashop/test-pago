'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { formatPrice } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import Image from 'next/image'
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
  MessageCircle,
  Shield,
  Building,
  FileText,
  TrendingUp,
  DollarSign
} from 'lucide-react'
import { ORDER_STATUS, PAYMENT_STATUS } from '@/constants'

interface OrderItem {
  _id: string
  product: {
    _id: string
    name: string
    images: string[]
    sku: string
    slug: string
  }
  quantity: number
  price: number
  variant?: string
  status?: string
  supplier: {
    _id: string
    name: string
    email: string
    phone?: string
    address?: string
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
  paymentDetails?: {
    mercadoPagoId?: string
    preferenceId?: string
    externalReference?: string
    transactionAmount?: number
    paymentMethodId?: string
    installments?: number
  }
  commissionDetails?: {
    platformFee: number
    supplierEarnings: Record<string, number>
    processingFee: number
  }
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
    changedBy?: {
      id: string
      name: string
      role: string
    }
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

export default function AdminOrderDetailPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  
  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchOrder = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/orders/${params.id}`)
      const data = await response.json()

      if (response.ok) {
        setOrder(data.order)
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

    if (session.user.role !== 'admin') {
      router.push('/')
      return
    }

    fetchOrder()
  }, [session, status, router, fetchOrder])

  const handleChatWithCustomer = async (orderNumber: string, customerName: string) => {
    try {
      if (!order) return
      if (!order.customer?.id) {
        toast({
          title: 'Chat con Cliente',
          description: 'Cliente sin identificador disponible para chat.',
        })
        return
      }

      // Crear/continuar chat admin-cliente
      const chatRes = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        cache: 'no-store',
        body: JSON.stringify({
          orderId: order._id,
          customerId: order.customer.id,
          message: `Inicio de chat (admin-cliente) sobre el pedido #${order.orderNumber}`,
        }),
      })
      const chatData = await chatRes.json()
      if (!chatRes.ok) {
        throw new Error(chatData?.error || 'No se pudo iniciar el chat con el cliente')
      }

      toast({
        title: 'Chat con Cliente',
        description: `Chat iniciado con ${customerName} para el pedido #${order.orderNumber}`,
      })

      const openId = chatData?.chat?._id || chatData?.chat?.chatId
      if (openId) {
        router.push(`/admin/chat?open=${openId}`)
      }
    } catch (error: any) {
      console.error('Error iniciando chat con cliente:', error)
      toast({
        title: 'Error',
        description: error?.message || 'No se pudo iniciar el chat con el cliente',
        variant: 'destructive',
      })
    }
  }

  const handleChatWithSupplier = async (orderNumber: string, supplier: { _id: string; name: string }) => {
    try {
      if (!order) return
      if (!supplier?._id) {
        toast({
          title: 'Chat con Proveedor',
          description: 'Proveedor sin identificador disponible para chat.',
        })
        return
      }

      // Crear/continuar chat admin-proveedor
      const chatRes = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        cache: 'no-store',
        body: JSON.stringify({
          orderId: order._id,
          supplierId: supplier._id,
          message: `Inicio de chat sobre el pedido #${order.orderNumber}`,
        }),
      })
      const chatData = await chatRes.json()
      if (!chatRes.ok) {
        throw new Error(chatData?.error || 'No se pudo iniciar el chat con el proveedor')
      }

      toast({
        title: 'Chat con Proveedor',
        description: `Chat iniciado con ${supplier.name} para el pedido #${order.orderNumber}`,
      })

      const openId = chatData?.chat?._id || chatData?.chat?.chatId
      if (openId) {
        router.push(`/admin/chat?open=${openId}`)
      }
    } catch (error: any) {
      console.error('Error iniciando chat con proveedor:', error)
      toast({
        title: 'Error',
        description: error?.message || 'No se pudo iniciar el chat con el proveedor',
        variant: 'destructive',
      })
    }
  }

  if (status === 'loading' || loading) {
    return <div className="flex justify-center items-center min-h-screen">Cargando...</div>
  }

  if (!session || session.user.role !== 'admin') {
    return null
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Pedido no encontrado</h1>
          <Button onClick={() => router.push('/admin/orders')}>
            Volver a pedidos
          </Button>
        </div>
      </div>
    )
  }

  // Group items by supplier
  const itemsBySupplier = order.items.reduce((acc, item) => {
    const supplierId = item.supplier._id
    if (!acc[supplierId]) {
      acc[supplierId] = {
        supplier: item.supplier,
        items: [],
        subtotal: 0
      }
    }
    acc[supplierId].items.push(item)
    acc[supplierId].subtotal += item.quantity * item.price
    return acc
  }, {} as Record<string, { supplier: any; items: OrderItem[]; subtotal: number }>)

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
            <Badge variant="outline" className="bg-purple-50 text-purple-800">
              <Shield className="h-3 w-3 mr-1" />
              Admin View
            </Badge>
          </div>
        </div>

        {/* Admin Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <Button 
            variant="outline"
            onClick={() => handleChatWithCustomer(order.orderNumber, order.customer.name)}
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            Chat con Cliente
          </Button>

          {Object.values(itemsBySupplier).map(({ supplier }) => (
            <Button 
              key={supplier._id}
              variant="outline"
              onClick={() => handleChatWithSupplier(order.orderNumber, supplier)}
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Chat con {supplier.name}
            </Button>
          ))}

          <Button 
            variant="outline"
            onClick={() => router.push('/admin/orders')}
          >
            Volver a Pedidos
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="products">Productos</TabsTrigger>
          <TabsTrigger value="payment">Finanzas</TabsTrigger>
          <TabsTrigger value="timeline">Historial</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Cliente
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <User className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-medium">{order.customer.name}</p>
                    <p className="text-sm text-gray-500">Nombre completo</p>
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

            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Package className="h-5 w-5 mr-2" />
                  Resumen del Pedido
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Total de productos:</span>
                  <span className="text-sm font-medium">{order.items.length}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Proveedores involucrados:</span>
                  <span className="text-sm font-medium">{Object.keys(itemsBySupplier).length}</span>
                </div>
                
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
                
                <Separator />
                
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span>{formatPrice(order.total)}</span>
                </div>
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
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-6">
          {Object.values(itemsBySupplier).map(({ supplier, items, subtotal }) => (
            <Card key={supplier._id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <Building className="h-5 w-5 mr-2" />
                    {supplier.name}
                  </CardTitle>
                  <div className="text-right">
                    <p className="text-lg font-bold">{formatPrice(subtotal)}</p>
                    <p className="text-sm text-gray-500">{items.length} producto(s)</p>
                  </div>
                </div>
                <CardDescription>
                  <div className="flex items-center space-x-4 text-sm">
                    <span className="flex items-center">
                      <Mail className="h-4 w-4 mr-1" />
                      {supplier.email}
                    </span>
                    {supplier.phone && (
                      <span className="flex items-center">
                        <Phone className="h-4 w-4 mr-1" />
                        {supplier.phone}
                      </span>
                    )}
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {items.map((item) => (
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
          ))}
        </TabsContent>

        {/* Payment/Finance Tab */}
        <TabsContent value="payment" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Payment Details */}
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

                {order.paymentDetails && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      {order.paymentDetails.mercadoPagoId && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">ID MercadoPago:</span>
                          <span className="text-sm font-mono">{order.paymentDetails.mercadoPagoId}</span>
                        </div>
                      )}
                      
                      {order.paymentDetails.paymentMethodId && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">Método de pago:</span>
                          <span className="text-sm">{order.paymentDetails.paymentMethodId}</span>
                        </div>
                      )}
                      
                      {order.paymentDetails.installments && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">Cuotas:</span>
                          <span className="text-sm">{order.paymentDetails.installments}</span>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Order Totals */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DollarSign className="h-5 w-5 mr-2" />
                  Desglose Financiero
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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
                
                <Separator />
                
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span>{formatPrice(order.total)}</span>
                </div>

                {order.commissionDetails && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <h4 className="font-medium text-gray-900">Comisiones de la Plataforma</h4>
                      
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Comisión plataforma:</span>
                        <span className="text-sm">{formatPrice(order.commissionDetails.platformFee)}</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Comisión procesamiento:</span>
                        <span className="text-sm">{formatPrice(order.commissionDetails.processingFee)}</span>
                      </div>
                      
                      <div className="space-y-1">
                        <p className="text-sm text-gray-500">Ganancias por proveedor:</p>
                        {Object.entries(order.commissionDetails.supplierEarnings).map(([supplierId, earnings]) => {
                          const supplier = Object.values(itemsBySupplier).find(s => s.supplier._id === supplierId)?.supplier
                          return (
                            <div key={supplierId} className="flex justify-between ml-4">
                              <span className="text-sm text-gray-600">{supplier?.name}:</span>
                              <span className="text-sm">{formatPrice(earnings)}</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Timeline Tab */}
        <TabsContent value="timeline" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Historial Completo del Pedido
              </CardTitle>
              <CardDescription>
                Todas las actualizaciones y cambios realizados en este pedido
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {order.statusHistory?.length > 0 ? (
                  order.statusHistory.map((status, index) => (
                    <div key={index} className="flex items-start space-x-4">
                      <div className={`
                        w-4 h-4 rounded-full flex-shrink-0 mt-2
                        ${index === 0 ? 'bg-blue-600' : 'bg-gray-300'}
                      `} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-medium text-gray-900 capitalize">{status.status}</p>
                          <p className="text-sm text-gray-500">
                            {formatDistanceToNow(new Date(status.timestamp), { addSuffix: true, locale: es })}
                          </p>
                        </div>
                        
                        {status.changedBy && (
                          <p className="text-sm text-gray-600 mb-1">
                            Cambiado por: {status.changedBy.name} ({status.changedBy.role})
                          </p>
                        )}
                        
                        {status.notes && (
                          <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                            {status.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex items-start space-x-4">
                    <div className="w-4 h-4 rounded-full bg-blue-600 mt-2" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium text-gray-900 capitalize">{order.status}</p>
                        <p className="text-sm text-gray-500">
                          {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true, locale: es })}
                        </p>
                      </div>
                      <p className="text-sm text-gray-600">Pedido creado</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Order Notes */}
          {order.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Notas del Pedido
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 bg-gray-50 p-4 rounded-lg">
                  {order.notes}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

