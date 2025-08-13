'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useParams, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { XCircle, Package, RefreshCw, AlertTriangle, CreditCard } from 'lucide-react'
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
  paymentDetails?: {
    mercadoPagoId: string
    status: string
    statusDetail: string
    paymentMethod: string
    failureReason: string
  }
}

export default function PaymentFailurePage() {
  const { data: session } = useSession()
  const params = useParams()
  const searchParams = useSearchParams()
  const orderId = params.id as string
  
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retrying, setRetrying] = useState(false)

  // Obtener parámetros de MercadoPago
  const paymentId = searchParams.get('payment_id')
  const status = searchParams.get('status')
  const externalReference = searchParams.get('external_reference')
  const failureReason = searchParams.get('failure_reason')

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

  // Persistir estado rechazado al volver de Mercado Pago
  useEffect(() => {
    const persistRejected = async () => {
      try {
        if (status === 'rejected') {
          await fetch(`/api/orders/${orderId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              paymentStatus: 'rejected',
              paymentId: paymentId || undefined,
              paymentDetails: {
                mercadoPagoId: paymentId || undefined,
                status: status || undefined,
                paymentMethod: 'mercadopago',
                failureReason: failureReason || 'rejected'
              }
            })
          })
        }
      } catch (e) {
        console.error('Persist rejected error:', e)
      }
    }
    if (orderId && status) persistRejected()
  }, [orderId, status, paymentId, failureReason])

  const retryPayment = async () => {
    try {
      setRetrying(true)
      
      // Crear nueva preferencia de pago
      const paymentData = {
        orderId: orderId,
        items: order?.items.map(item => ({
          productId: item.name,
          name: item.name,
          price: Number(item.price),
          quantity: Number(item.quantity)
        })) || [],
        total: Number(order?.total || 0)
      }
      
      const response = await fetch('/api/payments/create-preference', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      })

      const result = await response.json()

      if (response.ok && result.initPoint) {
        window.location.href = result.initPoint
      } else {
        throw new Error('Error al crear nueva preferencia de pago')
      }
    } catch (error) {
      console.error('Error retrying payment:', error)
      alert('Error al reintentar el pago. Por favor, intenta nuevamente.')
    } finally {
      setRetrying(false)
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

  const getFailureMessage = (reason?: string) => {
    switch (reason) {
      case 'cc_rejected_bad_filled_card_number':
        return 'Número de tarjeta incorrecto'
      case 'cc_rejected_bad_filled_date':
        return 'Fecha de vencimiento incorrecta'
      case 'cc_rejected_bad_filled_other':
        return 'Datos de la tarjeta incorrectos'
      case 'cc_rejected_bad_filled_security_code':
        return 'Código de seguridad incorrecto'
      case 'cc_rejected_blacklist':
        return 'Tarjeta rechazada por seguridad'
      case 'cc_rejected_call_for_authorize':
        return 'Debes autorizar el pago con tu banco'
      case 'cc_rejected_card_disabled':
        return 'Tarjeta deshabilitada'
      case 'cc_rejected_card_error':
        return 'Error en la tarjeta'
      case 'cc_rejected_duplicated_payment':
        return 'Pago duplicado'
      case 'cc_rejected_high_risk':
        return 'Pago rechazado por riesgo'
      case 'cc_rejected_insufficient_amount':
        return 'Saldo insuficiente'
      case 'cc_rejected_invalid_installments':
        return 'Cuotas no válidas para esta tarjeta'
      case 'cc_rejected_max_attempts':
        return 'Demasiados intentos fallidos'
      case 'cc_rejected_other_reason':
        return 'Tarjeta rechazada por el banco'
      default:
        return 'Pago rechazado'
    }
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
        {/* Failure Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Pago Rechazado
          </h1>
          <p className="text-gray-600">
            No pudimos procesar tu pago. Revisa los detalles y vuelve a intentar.
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

            {/* Payment Error */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2 text-red-600" />
                  Error de Pago
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
            <div className="bg-red-50 p-4 rounded-lg">
                    <p className="text-red-800 font-medium">
                      {getFailureMessage(failureReason || order.paymentDetails?.failureReason)}
                    </p>
                    {paymentId && (
                <p className="text-sm text-red-600 mt-2">
                        ID de Pago: {paymentId}
                </p>
              )}
            </div>

                  <div className="space-y-2">
                    <h4 className="font-medium">Posibles soluciones:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                <li>• Verifica que los datos de tu tarjeta sean correctos</li>
                      <li>• Asegúrate de tener saldo suficiente</li>
                <li>• Intenta con otra tarjeta o método de pago</li>
                <li>• Contacta a tu banco si el problema persiste</li>
              </ul>
                  </div>
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

          {/* Actions */}
          <div className="space-y-6">
            {/* Retry Payment */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="h-5 w-5 mr-2" />
                  Reintentar Pago
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Puedes intentar pagar nuevamente con la misma información o cambiar el método de pago.
                  </p>
                  
          <Button 
                    onClick={retryPayment} 
                    disabled={retrying}
                    className="w-full"
                    size="lg"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${retrying ? 'animate-spin' : ''}`} />
                    {retrying ? 'Procesando...' : 'Reintentar Pago'}
          </Button>
                  
          <Button 
                    variant="outline" 
                    onClick={() => window.location.href = '/checkout'}
                    className="w-full"
                  >
                    Cambiar Método de Pago
                  </Button>
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
                    Si continúas teniendo problemas, contacta con nuestro soporte.
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
          <Button onClick={() => window.location.href = '/cart'}>
            Volver al Carrito
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
