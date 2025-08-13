'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { 
  Package, 
  User, 
  MapPin, 
  CreditCard, 
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  Phone,
  Mail,
  Building,
  MessageCircle
} from 'lucide-react'

interface OrderItem {
  _id: string
  name: string
  quantity: number
  price: number
  total: number
  product: {
    _id: string
    name: string
    images: string[]
    description?: string
  }
  supplier: {
    _id: string
    name: string
    email?: string
    businessName?: string
  }
}

interface OrderDetails {
  _id: string
  orderNumber: string
  customer: {
    _id?: string
    name: string
    email: string
    phone: string
  }
  items: OrderItem[]
  total: number
  status: string
  paymentStatus: string
  paymentMethod: string
  shippingMethod: string
  shippingAddress: {
    name: string
    street: string
    city: string
    state: string
    zipCode: string
  }
  trackingNumber?: string
  adminNotes?: string
  createdAt: string
  updatedAt: string
  paymentDetails?: {
    mercadoPagoId?: string
    status?: string
    statusDetail?: string
    paymentMethod?: string
    transactionAmount?: number
    netReceivedAmount?: number
    failureReason?: string
    refundedAt?: string
    paidAt?: string
    merchantOrderId?: string
  }
}

interface OrderDetailsDialogProps {
  orderId: string | null
  isOpen: boolean
  onClose: () => void
  onOrderUpdated: () => void
  // Optional: which section to focus when opening
  focusSection?: 'shipping' | 'payment' | 'items'
}

export function OrderDetailsDialog({ orderId, isOpen, onClose, onOrderUpdated, focusSection }: OrderDetailsDialogProps) {
  const router = useRouter()
  const [order, setOrder] = useState<OrderDetails | null>(null)
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [trackingNumber, setTrackingNumber] = useState('')
  const [notes, setNotes] = useState('')
  const [newStatus, setNewStatus] = useState('')
  const [chatLoadingId, setChatLoadingId] = useState<string | null>(null)
  const { toast } = useToast()

  // Section refs
  const paymentSectionRef = useRef<HTMLDivElement | null>(null)
  const shippingSectionRef = useRef<HTMLDivElement | null>(null)
  const itemsSectionRef = useRef<HTMLDivElement | null>(null)

  // Scroll to requested section when dialog opens and data is loaded
  useEffect(() => {
    if (!isOpen || loading) return
    let target: HTMLDivElement | null = null
    switch (focusSection) {
      case 'payment':
        target = paymentSectionRef.current
        break
      case 'shipping':
        target = shippingSectionRef.current
        break
      case 'items':
        target = itemsSectionRef.current
        break
      default:
        target = null
    }
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [isOpen, loading, focusSection])

  const fetchOrderDetails = useCallback(async () => {
    if (!orderId) return

    try {
      setLoading(true)
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        credentials: 'include',
        cache: 'no-store',
      })
      const data = await response.json()

      if (response.ok) {
        setOrder(data.order)
        setTrackingNumber(data.order.trackingNumber || '')
        setNotes(data.order.adminNotes || '')
        setNewStatus(data.order.status)
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al cargar detalles del pedido',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }, [orderId, toast])

  useEffect(() => {
    if (isOpen && orderId) {
      fetchOrderDetails()
    }
  }, [isOpen, orderId, fetchOrderDetails])

  const startChatWithSupplierFor = useCallback(async (supplierId: string) => {
    if (!order) return
    setChatLoadingId(supplierId)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order._id,
          supplierId,
          message: `Inicio de chat sobre el pedido #${order.orderNumber}`
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'No se pudo iniciar el chat con el proveedor')
      toast({ title: 'Chat con Proveedor', description: `Chat iniciado para el pedido #${order.orderNumber}` })
      const openId = data?.chat?._id || data?.chat?.chatId
      if (openId) router.push(`/admin/chat?open=${openId}`)
    } catch (err: any) {
      console.error(err)
      toast({ title: 'Error', description: err?.message || 'Error al iniciar chat con proveedor', variant: 'destructive' })
    } finally {
      setChatLoadingId(null)
    }
  }, [order, router, toast])

  const startChatWithSupplier = useCallback(async () => {
    if (!order) return
    const supplierId = order.items?.[0]?.supplier?._id
    if (!supplierId) {
      toast({ title: 'Error', description: 'No se encontró el proveedor para este pedido', variant: 'destructive' })
      return
    }
    await startChatWithSupplierFor(supplierId)
  }, [order, toast, startChatWithSupplierFor])

  const startChatWithCustomer = useCallback(async () => {
    if (!order) return
    const customerId = order.customer?._id
    if (!customerId) {
      toast({ title: 'Dato faltante', description: 'Este pedido no tiene un cliente asociado disponible para chat.', variant: 'destructive' })
      return
    }
    try {
      setChatLoadingId('customer')
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order._id,
          customerId,
          message: `Inicio de chat (admin-cliente) sobre el pedido #${order.orderNumber}`
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'No se pudo iniciar el chat con el cliente')
      toast({ title: 'Chat con Cliente', description: `Chat iniciado para el pedido #${order.orderNumber}` })
      const openId = data?.chat?._id || data?.chat?.chatId
      if (openId) router.push(`/admin/chat?open=${openId}`)
    } catch (err: any) {
      console.error(err)
      toast({ title: 'Error', description: err?.message || 'Error al iniciar chat con cliente', variant: 'destructive' })
    } finally {
      setChatLoadingId(null)
    }
  }, [order, router, toast])

  const handleOrderAction = async (action: string, additionalData?: any) => {
    if (!orderId) return

    try {
      setActionLoading(true)
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action,
          ...additionalData
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: 'Éxito',
          description: data.message
        })
        onOrderUpdated()
        fetchOrderDetails() // Refresh order details
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al actualizar el pedido',
        variant: 'destructive'
      })
    } finally {
      setActionLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const configs = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Pendiente' },
      confirmed: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle, label: 'Confirmado' },
      processing: { color: 'bg-purple-100 text-purple-800', icon: Package, label: 'Procesando' },
      shipped: { color: 'bg-indigo-100 text-indigo-800', icon: Truck, label: 'Enviado' },
      delivered: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Entregado' },
      cancelled: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Cancelado' }
    }
    
    const config = configs[status as keyof typeof configs] || configs.pending
    const Icon = config.icon
    
    return (
      <Badge className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount)
  }

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Package className="h-5 w-5" />
            {order ? `Orden #${order.orderNumber}` : 'Cargando...'}
            {order && getStatusBadge(order.status)}
          </DialogTitle>
          <DialogDescription>
            Detalles completos del pedido y acciones administrativas
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : order ? (
          <div className="space-y-6">
            {/* Payment Details */}
            <div ref={paymentSectionRef} className="space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Pago
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                <div className="p-3 border rounded-lg">
                  <p className="text-muted-foreground">Estado de pago</p>
                  <p className="font-medium capitalize">{order.paymentStatus || 'pendiente'}</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <p className="text-muted-foreground">Método</p>
                  <p className="font-medium">{order.paymentMethod || 'mercadopago'}</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <p className="text-muted-foreground">MP Preference/ID</p>
                  <p className="font-mono text-xs break-all">{order.paymentDetails?.mercadoPagoId || '—'}</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <p className="text-muted-foreground">MP Status detail</p>
                  <p className="font-medium text-xs break-all">{order.paymentDetails?.statusDetail || '—'}</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <p className="text-muted-foreground">Monto transacción</p>
                  <p className="font-medium">{typeof order.paymentDetails?.transactionAmount === 'number' ? formatCurrency(order.paymentDetails!.transactionAmount) : '—'}</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <p className="text-muted-foreground">Neto recibido</p>
                  <p className="font-medium">{typeof order.paymentDetails?.netReceivedAmount === 'number' ? formatCurrency(order.paymentDetails!.netReceivedAmount) : '—'}</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <p className="text-muted-foreground">Merchant Order ID</p>
                  <p className="font-mono text-xs break-all">{order.paymentDetails?.merchantOrderId || '—'}</p>
                </div>
              </div>
            </div>
            {/* Customer Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Información del Cliente
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="h-3 w-3 text-muted-foreground" />
                    <span>{order.customer.name}</span>
                    {order.customer._id && (
                      <Button size="sm" variant="outline" onClick={startChatWithCustomer} disabled={chatLoadingId === 'customer'} className="ml-2 h-7 px-2">
                        <MessageCircle className="h-3 w-3 mr-1" /> Chat
                      </Button>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-3 w-3 text-muted-foreground" />
                    <span>{order.customer.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-3 w-3 text-muted-foreground" />
                    <span>{order.customer.phone}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Dirección de Envío
                </h3>
                <div className="text-sm">
                  <p>{order.shippingAddress.name}</p>
                  <p>{order.shippingAddress.street}</p>
                  <p>{order.shippingAddress.city}, {order.shippingAddress.state}</p>
                  {order.shippingAddress.zipCode && <p>{order.shippingAddress.zipCode}</p>}
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div ref={itemsSectionRef} className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Package className="h-4 w-4" />
                Productos ({order.items.length})
              </h3>
              <div className="space-y-2">
                {order.items.map((item) => (
                  <div key={item._id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                        <Package className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Cantidad: {item.quantity} × {formatCurrency(item.price)}
                        </p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Building className="h-3 w-3" />
                          <span>{item.supplier.businessName || item.supplier.name}</span>
                          {item.supplier._id && (
                            <Button size="sm" variant="ghost" onClick={() => startChatWithSupplierFor(item.supplier._id)} disabled={chatLoadingId === item.supplier._id} className="h-6 px-2 ml-2">
                              <MessageCircle className="h-3 w-3 mr-1" /> Chat
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(item.total)}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center pt-3 border-t">
                <span className="font-semibold">Total:</span>
                <span className="text-xl font-bold text-primary">{formatCurrency(order.total)}</span>
              </div>
            </div>

            {/* Payment & Shipping Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Información de Pago
                </h4>
                <div className="text-sm space-y-1">
                  <p>Método: {order.paymentMethod}</p>
                  <p>Estado: <Badge variant={order.paymentStatus === 'approved' ? 'default' : 'secondary'}>
                    {order.paymentStatus}
                  </Badge></p>
                </div>
              </div>

              <div ref={shippingSectionRef} className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <Truck className="h-4 w-4" />
                  Información de Envío
                </h4>
                <div className="text-sm space-y-1">
                  <p>Método: {order.shippingMethod}</p>
                  {order.trackingNumber && (
                    <p>Tracking: <code className="bg-muted px-1 rounded">{order.trackingNumber}</code></p>
                  )}
                </div>
              </div>
            </div>

            {/* Admin Actions */}
            <div className="space-y-4 border-t pt-4">
              <h3 className="font-semibold">Acciones Administrativas</h3>
              
              {/* Status Update */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Cambiar Estado</Label>
                  <Select value={newStatus} onValueChange={setNewStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pendiente</SelectItem>
                      <SelectItem value="confirmed">Confirmado</SelectItem>
                      <SelectItem value="processing">Procesando</SelectItem>
                      <SelectItem value="shipped">Enviado</SelectItem>
                      <SelectItem value="delivered">Entregado</SelectItem>
                      <SelectItem value="cancelled">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tracking">Número de Seguimiento</Label>
                  <Input
                    id="tracking"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="Ingrese número de tracking"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notas Administrativas</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Agregar notas sobre el pedido..."
                  rows={3}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p>No se pudo cargar la información del pedido</p>
          </div>
        )}

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <div className="flex gap-2 flex-wrap">
            {order?.status === 'pending' && (
              <Button
                onClick={() => handleOrderAction('confirm')}
                disabled={actionLoading}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Confirmar Orden
              </Button>
            )}
            
            {order?.status !== 'cancelled' && order?.status !== 'delivered' && (
              <Button
                onClick={() => handleOrderAction('cancel', { notes })}
                disabled={actionLoading}
                variant="destructive"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Cancelar Orden
              </Button>
            )}

            <Button
              onClick={() => handleOrderAction('update_status', { status: newStatus, notes })}
              disabled={actionLoading || newStatus === order?.status}
              variant="outline"
            >
              Actualizar Estado
            </Button>

            {trackingNumber && trackingNumber !== order?.trackingNumber && (
              <Button
                onClick={() => handleOrderAction('update_tracking', { trackingNumber, notes })}
                disabled={actionLoading}
                variant="outline"
              >
                <Truck className="h-4 w-4 mr-2" />
                Actualizar Envío
              </Button>
            )}

            {/* Chat Actions */}
            <Button onClick={startChatWithSupplier} variant="outline" disabled={!!chatLoadingId}>
              <MessageCircle className="h-4 w-4 mr-2" /> Chat Proveedor
            </Button>
            <Button onClick={startChatWithCustomer} variant="outline" disabled={!!chatLoadingId}>
              <MessageCircle className="h-4 w-4 mr-2" /> Chat Cliente
            </Button>
          </div>

          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
