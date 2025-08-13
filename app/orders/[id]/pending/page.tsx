'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useParams, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Clock, Package, RefreshCw, AlertCircle } from 'lucide-react'
import Navbar from '@/components/layout/navbar'
import Footer from '@/components/layout/footer'
import { ClientLoader } from '@/components/ui/loaders'

interface OrderItem {
  name: string
  quantity: number
  price: number
  supplier: string
}

interface Order {
  _id: string
  orderNumber: string
  customer: {
    name: string
    email: string
  }
  items: OrderItem[]
  total: number
  status: string
  paymentStatus: string
  shippingMethod: string
  pickupDate?: string
  shippingAddress: {
    name: string
    street: string
    city: string
    state: string
    zipCode: string
    phone: string
  }
  createdAt: string
}

export default function PaymentPendingPage() {
  const { data: session } = useSession()
  const params = useParams()
  const searchParams = useSearchParams()
  const orderId = params.id as string
  
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [checkingStatus, setCheckingStatus] = useState(false)

  // Obtener parámetros de MercadoPago
  const paymentId = searchParams.get('payment_id')
  const status = searchParams.get('status')
  const externalReference = searchParams.get('external_reference')

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/orders/${orderId}`)
        
        if (response.ok) {
          const data = await response.json()
          setOrder(data.order)
        } else {
          setError('No se pudo cargar la información de la orden')
        }
      } catch (error) {
        console.error('Error fetching order:', error)
        setError('Error al cargar la orden')
      } finally {
        setLoading(false)
      }
    }

    if (orderId) {
      fetchOrder()
    }
  }, [orderId])

  // Persistir estado pendiente al volver de Mercado Pago
  useEffect(() => {
    const persistPending = async () => {
      try {
        if (status === 'pending') {
          await fetch(`/api/orders/${orderId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              paymentStatus: 'pending',
              paymentId: paymentId || undefined,
              paymentDetails: {
                mercadoPagoId: paymentId || undefined,
                status: status || undefined,
                paymentMethod: 'mercadopago'
              }
            })
          })
        }
      } catch (e) {
        console.error('Persist pending error:', e)
      }
    }
    if (orderId && status) persistPending()
  }, [orderId, status, paymentId])

  const checkPaymentStatus = async () => {
    try {
      setCheckingStatus(true)
      const response = await fetch(`/api/orders/${orderId}`)
      
      if (response.ok) {
        const data = await response.json()
        setOrder(data.order)
        
        // Si el pago ya fue aprobado, redirigir a la página de éxito
        if (data.order.paymentStatus === 'approved') {
          window.location.href = `/orders/${orderId}/success`
        }
      }
    } catch (error) {
      console.error('Error checking payment status:', error)
    } finally {
      setCheckingStatus(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      shipped: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    }
    return <Badge className={colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>{status}</Badge>
  }

  const getPaymentStatusBadge = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      cancelled: 'bg-red-100 text-red-800'
    }
    return <Badge className={colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>{status}</Badge>
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <ClientLoader />
        <Footer />
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
      <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
            <p className="text-gray-600">{error || 'No se encontró la orden'}</p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        {/* Pending Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Pago en Proceso
          </h1>
          <p className="text-gray-600">
            Estamos verificando tu pago. Esto puede tomar unos minutos.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Details */}
          <div className="space-y-6">
            <Card>
          <CardHeader>
                <CardTitle className="flex items-center">
                  <Package className="h-5 w-5 mr-2" />
                  Detalles del Pedido
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Número de Orden:</span>
                  <span className="font-bold">{order.orderNumber}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="font-medium">Estado del Pedido:</span>
                  {getStatusBadge(order.status)}
                  </div>

                <div className="flex justify-between items-center">
                  <span className="font-medium">Estado del Pago:</span>
                  {getPaymentStatusBadge(order.paymentStatus)}
                  </div>
                
                <div className="flex justify-between items-center">
                  <span className="font-medium">Fecha de Creación:</span>
                  <span>{formatDate(order.createdAt)}</span>
                  </div>
                
                <div className="flex justify-between items-center">
                  <span className="font-medium">Método de Envío:</span>
                  <span>{order.shippingMethod === 'pickup' ? 'Retiro en Local' : 'Envío a Domicilio'}</span>
                </div>

                {order.shippingMethod === 'pickup' && order.pickupDate && (
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Fecha de Retiro:</span>
                    <span>{formatDate(order.pickupDate)}</span>
              </div>
            )}

                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Total:</span>
                  <span className="text-green-600">{formatCurrency(order.total)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Payment Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertCircle className="h-5 w-5 mr-2 text-yellow-600" />
                  Estado del Pago
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-gray-600">
                      Verificando pago con MercadoPago...
                    </span>
                  </div>
                  
                  {paymentId && (
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>ID de Pago:</strong> {paymentId}
                      </p>
                    </div>
                  )}
                  
                  <Button 
                    onClick={checkPaymentStatus} 
                    disabled={checkingStatus}
                    className="w-full"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${checkingStatus ? 'animate-spin' : ''}`} />
                    {checkingStatus ? 'Verificando...' : 'Verificar Estado'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Order Items */}
            <Card>
              <CardHeader>
                <CardTitle>Productos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-gray-500">Cantidad: {item.quantity}</p>
                        <p className="text-xs text-gray-400">Proveedor: {item.supplier}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(item.price * item.quantity)}</p>
                        <p className="text-sm text-gray-500">{formatCurrency(item.price)} c/u</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Information */}
          <div className="space-y-6">
            {/* What's happening */}
            <Card>
              <CardHeader>
                <CardTitle>¿Qué está pasando?</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center mt-0.5">
                      <span className="text-yellow-600 text-xs font-bold">1</span>
                    </div>
                    <div>
                      <p className="font-medium">Pago en Verificación</p>
                      <p className="text-sm text-gray-600">
                        MercadoPago está procesando tu pago. Esto puede tomar de 2 a 5 minutos.
                      </p>
                    </div>
            </div>

                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                      <span className="text-blue-600 text-xs font-bold">2</span>
                    </div>
                    <div>
                      <p className="font-medium">Confirmación Automática</p>
                      <p className="text-sm text-gray-600">
                        Una vez confirmado, recibirás un email y podrás ver tu pedido en &quot;Mis Pedidos&quot;.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                      <span className="text-green-600 text-xs font-bold">3</span>
                    </div>
                    <div>
                      <p className="font-medium">Preparación del Pedido</p>
                      <p className="text-sm text-gray-600">
                        El proveedor comenzará a preparar tu pedido una vez confirmado el pago.
                      </p>
                    </div>
                  </div>
            </div>
          </CardContent>
        </Card>

            {/* Shipping Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Package className="h-5 w-5 mr-2" />
                  {order.shippingMethod === 'pickup' ? 'Información de Contacto' : 'Dirección de Envío'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="font-medium">{order.shippingAddress.name}</p>
                  {order.shippingMethod === 'home_delivery' && (
                    <>
                      <p>{order.shippingAddress.street}</p>
                      <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}</p>
              </>
            )}
                  <p>Teléfono: {order.shippingAddress.phone}</p>
                </div>
              </CardContent>
            </Card>

            {/* Help */}
            <Card>
              <CardHeader>
                <CardTitle>¿Necesitas ayuda?</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">
                    Si el pago no se confirma en 10 minutos, contacta con soporte.
                  </p>
                  <Button variant="outline" className="w-full">
                    Contactar Soporte
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center space-x-4 mt-8">
          <Button onClick={() => window.location.href = '/orders'}>
            Ver Mis Pedidos
          </Button>
          <Button variant="outline" onClick={() => window.location.href = '/'}>
            Continuar Comprando
          </Button>
        </div>
      </main>
      
      <Footer />
    </div>
  )
}
