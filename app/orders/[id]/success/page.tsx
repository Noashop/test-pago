'use client'

import { useState, useEffect } from 'react'
import { useCartStore } from '@/store/cart-store'
import { useSession } from 'next-auth/react'
import { useParams, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { CheckCircle, Package, MapPin, Building, Calendar, Download, Printer, CreditCard } from 'lucide-react'
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
  supplier?: {
    name: string
    address: string
    phone: string
  }
  paymentDetails?: {
    mercadoPagoId: string
    status: string
    paymentMethod: string
    transactionAmount: number
    paidAt: string
  }
}

export default function PaymentSuccessPage() {
  const { data: session } = useSession()
  const params = useParams()
  const searchParams = useSearchParams()
  const orderId = params.id as string
  const { clearCart } = useCartStore()
  
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  // Persistir estado de pago aprobado y detalles al volver de MP
  useEffect(() => {
    const persistApproved = async () => {
      try {
        // Si Mercado Pago indicó aprobado, actualizar la orden
        if (status === 'approved') {
          await fetch(`/api/orders/${orderId}` , {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              paymentStatus: 'approved',
              paymentId: paymentId || undefined,
              paymentDetails: {
                mercadoPagoId: paymentId || undefined,
                status: status || undefined,
                paymentMethod: 'mercadopago',
                paidAt: new Date().toISOString(),
              },
            })
          })
          // Vaciar carrito tras pago exitoso
          clearCart()
        }
      } catch (e) {
        console.error('Persist approved error:', e)
      }
    }
    if (orderId && status) persistApproved()
  }, [orderId, status, paymentId, clearCart])

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

  const handlePrintInvoice = () => {
    window.print()
  }

  const handleDownloadInvoice = () => {
    try {
      if (!order) return
      const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>Factura Pedido #${order.orderNumber}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    body { font-family: Arial, sans-serif; padding: 24px; color: #111827; }
    h1 { font-size: 20px; margin: 0 0 8px; }
    h2 { font-size: 16px; margin: 16px 0 8px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #e5e7eb; padding: 8px; font-size: 12px; }
    th { background: #f3f4f6; text-align: left; }
    .right { text-align: right; }
    .muted { color: #6b7280; }
  </style>
  </head>
  <body>
    <h1>Factura - Pedido #${order.orderNumber}</h1>
    <p class="muted">Fecha: ${new Date(order.createdAt).toLocaleString('es-AR')}</p>

    <h2>Cliente</h2>
    <p>${order.customer?.name || order.shippingAddress.name} — ${order.customer?.email || ''}</p>
    <p>${order.shippingAddress.street}, ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode}</p>

    <h2>Items</h2>
    <table>
      <thead>
        <tr>
          <th>Producto</th>
          <th class="right">Cantidad</th>
          <th class="right">Precio</th>
          <th class="right">Subtotal</th>
        </tr>
      </thead>
      <tbody>
        ${order.items.map(it => `
          <tr>
            <td>${it.name}</td>
            <td class="right">${it.quantity}</td>
            <td class="right">${new Intl.NumberFormat('es-AR',{style:'currency',currency:'ARS'}).format(it.price)}</td>
            <td class="right">${new Intl.NumberFormat('es-AR',{style:'currency',currency:'ARS'}).format(it.price * it.quantity)}</td>
          </tr>
        `).join('')}
      </tbody>
      <tfoot>
        <tr>
          <th colspan="3" class="right">Total</th>
          <th class="right">${new Intl.NumberFormat('es-AR',{style:'currency',currency:'ARS'}).format(order.total)}</th>
        </tr>
      </tfoot>
    </table>

    ${order.paymentDetails ? `
      <h2>Pago</h2>
      <p>ID MP: ${order.paymentDetails.mercadoPagoId} — Estado: ${order.paymentDetails.status}</p>
    `: ''}
  </body>
  </html>`

      const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `factura-pedido-${order.orderNumber}.html`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error('Error al descargar factura:', e)
      alert('No se pudo descargar la factura. Intenta nuevamente.')
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
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            ¡Pago Exitoso!
          </h1>
          <p className="text-gray-600">
            Tu pedido ha sido procesado y pagado correctamente
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

            {/* Payment Information */}
            {order.paymentDetails && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CreditCard className="h-5 w-5 mr-2" />
                    Información del Pago
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="font-medium">ID de Transacción:</span>
                    <span className="font-mono text-sm">{order.paymentDetails.mercadoPagoId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Método de Pago:</span>
                    <span className="capitalize">{order.paymentDetails.paymentMethod}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Monto Pagado:</span>
                    <span className="font-semibold">{formatCurrency(order.paymentDetails.transactionAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Fecha de Pago:</span>
                    <span>{formatDate(order.paymentDetails.paidAt)}</span>
                </div>
                </CardContent>
              </Card>
            )}

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

          {/* Shipping & Billing Information */}
          <div className="space-y-6">
            {/* Shipping Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2" />
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

            {/* Pickup Information */}
            {order.shippingMethod === 'pickup' && order.supplier && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Building className="h-5 w-5 mr-2" />
                    Información del Local
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium">{order.supplier.name}</h4>
                      <p className="text-sm text-gray-600">{order.supplier.address}</p>
                    </div>
                    <div className="text-sm">
                      <p><strong>Horarios:</strong> Lunes a Viernes 9:00 - 18:00</p>
                      <p><strong>Teléfono:</strong> {order.supplier.phone}</p>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>Importante:</strong> Presenta tu DNI y el comprobante de pago al retirar tu pedido.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Invoice Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Factura</CardTitle>
                <CardDescription>
                  Descarga o imprime tu factura
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button onClick={handleDownloadInvoice} className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Descargar Factura
                  </Button>
                  <Button onClick={handlePrintInvoice} variant="outline" className="w-full">
                    <Printer className="h-4 w-4 mr-2" />
                    Imprimir Factura
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Next Steps */}
            <Card>
              <CardHeader>
                <CardTitle>Próximos Pasos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {order.shippingMethod === 'pickup' ? (
                    <>
                      <div className="flex items-start space-x-3">
                        <Calendar className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div>
                          <p className="font-medium">Espera la confirmación</p>
                          <p className="text-sm text-gray-600">
                            Te notificaremos cuando tu pedido esté listo para retirar
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <Building className="h-5 w-5 text-green-600 mt-0.5" />
                        <div>
                          <p className="font-medium">Retira tu pedido</p>
                          <p className="text-sm text-gray-600">
                            Ve al local en la fecha programada con tu DNI y comprobante
                          </p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-start space-x-3">
                        <Package className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div>
                          <p className="font-medium">Preparando tu pedido</p>
                          <p className="text-sm text-gray-600">
                            Estamos preparando tu pedido para el envío
                          </p>
              </div>
            </div>
                      <div className="flex items-start space-x-3">
                        <MapPin className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
                          <p className="font-medium">Envío a domicilio</p>
                          <p className="text-sm text-gray-600">
                            Recibirás tu pedido en la dirección especificada
                </p>
              </div>
            </div>
                    </>
                  )}
            </div>
          </CardContent>
        </Card>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center space-x-4 mt-8">
          <Button onClick={() => window.location.href = '/'}>
            Continuar Comprando
          </Button>
          <Button variant="outline" onClick={() => window.location.href = '/orders'}>
            Ver Mis Pedidos
          </Button>
        </div>
      </main>
      
      <Footer />
    </div>
  )
}
