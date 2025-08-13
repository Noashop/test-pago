'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { 
  ShoppingCart, 
  Search, 
  Filter, 
  Eye, 
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  MessageCircle
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { OrderDetailsDialog } from '@/components/admin/order-details-dialog'

interface Order {
  _id: string
  orderNumber: string
  customer: {
    name: string
    email: string
  }
  items: Array<{
    name: string
    quantity: number
    price: number
    supplier: string
  }>
  total: number
  status: string
  paymentStatus: string
  shippingMethod: string
  paymentMethod: string
  createdAt: string
  updatedAt: string
}

export default function AdminOrdersPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
  const [focusSection, setFocusSection] = useState<'shipping' | 'payment' | 'items' | undefined>(undefined)
  const [trackingDialogOpen, setTrackingDialogOpen] = useState(false)
  const [trackingOrderId, setTrackingOrderId] = useState<string | null>(null)
  const [trackingInput, setTrackingInput] = useState('')
  const [actionType, setActionType] = useState<null | 'confirm' | 'cancel' | 'update_tracking' | 'update_status'>(null)
  const [filters, setFilters] = useState({
    status: 'all',
    paymentStatus: 'all',
    search: '',
    dateRange: ''
  })

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      
      if (filters.status && filters.status !== 'all') params.append('status', filters.status)
      if (filters.paymentStatus && filters.paymentStatus !== 'all') params.append('paymentStatus', filters.paymentStatus)
      if (filters.search) params.append('search', filters.search)
      if (filters.dateRange) params.append('dateRange', filters.dateRange)
      
      const response = await fetch(`/api/admin/orders?${params}`, {
        credentials: 'include',
        cache: 'no-store',
      })
      const data = await response.json()

      if (response.ok) {
        setOrders(data.orders)
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
      toast({
        title: "Error",
        description: "Error al cargar órdenes",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    if (session?.user?.role !== 'admin') {
      router.push('/auth/login')
      return
    }
    fetchOrders()
  }, [session?.user?.role, router, fetchOrders])

  const handleQuickAction = async (orderId: string, action: string) => {
    try {
      if (action === 'confirm' || action === 'cancel') setActionType(action as 'confirm' | 'cancel')
      setActionLoading(orderId)
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        cache: 'no-store',
        body: JSON.stringify({ action })
      })

      const data = await response.json()

      if (response.ok) {
        toast({ title: 'Éxito', description: `${data.message} (Orden ${orderId.slice(-6)})` })
        fetchOrders() // Refresh orders list
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
      setActionLoading(null)
      setActionType(null)
    }
  }

  const handleViewDetails = (orderId: string) => {
    setSelectedOrderId(orderId)
    setFocusSection(undefined)
    setDetailsDialogOpen(true)
  }

  const handleShippingManagement = (orderId: string) => {
    // Open details dialog focused on shipping section
    setSelectedOrderId(orderId)
    setFocusSection('shipping')
    setDetailsDialogOpen(true)
  }

  const openTrackingDialog = (orderId: string) => {
    setTrackingOrderId(orderId)
    setTrackingInput('')
    setTrackingDialogOpen(true)
  }

  const submitTrackingUpdate = async () => {
    if (!trackingOrderId) return
    const value = trackingInput.trim()
    const isValid = /^[A-Za-z0-9-_.]{4,40}$/.test(value)
    if (!isValid) {
      toast({ title: 'Dato inválido', description: 'Ingrese un tracking alfanumérico (4-40).', variant: 'destructive' })
      return
    }
    try {
      setActionType('update_tracking')
      setActionLoading(trackingOrderId)
      const response = await fetch(`/api/admin/orders/${trackingOrderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        cache: 'no-store',
        body: JSON.stringify({ action: 'update_tracking', trackingNumber: value })
      })
      const data = await response.json()
      if (response.ok) {
        toast({ title: 'Éxito', description: `Tracking actualizado (Orden ${trackingOrderId.slice(-6)})` })
        setTrackingDialogOpen(false)
        setTrackingOrderId(null)
        setTrackingInput('')
        fetchOrders()
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo actualizar el tracking', variant: 'destructive' })
    } finally {
      setActionLoading(null)
      setActionType(null)
    }
  }

  const handleUpdateStatus = async (order: Order, nextStatus: string) => {
    if (nextStatus === 'delivered' && order.paymentStatus !== 'approved') {
      toast({ title: 'No permitido', description: 'No se puede marcar como entregado si el pago no está aprobado.', variant: 'destructive' })
      return
    }
    try {
      setActionType('update_status')
      setActionLoading(order._id)
      const response = await fetch(`/api/admin/orders/${order._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        cache: 'no-store',
        body: JSON.stringify({ action: 'update_status', status: nextStatus })
      })
      const data = await response.json()
      if (response.ok) {
        toast({ title: 'Éxito', description: `Estado actualizado (Orden ${order._id.slice(-6)})` })
        fetchOrders()
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo actualizar el estado', variant: 'destructive' })
    } finally {
      setActionLoading(null)
      setActionType(null)
    }
  }

  const handleChatWithSupplier = (orderId: string, supplierName: string) => {
    // Paso 1: obtener detalles del pedido para extraer supplierId
    ;(async () => {
      try {
        const res = await fetch(`/api/admin/orders/${orderId}`, {
          credentials: 'include',
          cache: 'no-store',
        })
        const data = await res.json()

        if (!res.ok) {
          throw new Error(data?.error || 'No se pudo obtener el pedido')
        }

        const firstItem = data?.order?.items?.[0]
        const supplierId = firstItem?.supplier?._id

        if (!supplierId) {
          throw new Error('No se encontró el proveedor de la orden')
        }

        // Paso 2: crear/continuar chat con proveedor
        const chatRes = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId,
            supplierId,
            message: `Inicio de chat sobre el pedido #${data?.order?.orderNumber}`
          })
        })

        const chatData = await chatRes.json()
        if (!chatRes.ok) {
          throw new Error(chatData?.error || 'No se pudo iniciar el chat con el proveedor')
        }

        toast({
          title: 'Chat con Proveedor',
          description: `Chat iniciado con ${supplierName} para el pedido #${data?.order?.orderNumber}`,
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
          variant: 'destructive'
        })
      }
    })()
  }

  const handleChatWithCustomer = (orderId: string, customerName: string) => {
    // Para cliente usaremos el mismo flujo: traer detalles y luego endpoint específico si existe.
    ;(async () => {
      try {
        const res = await fetch(`/api/admin/orders/${orderId}`, {
          credentials: 'include',
          cache: 'no-store',
        })
        const data = await res.json()

        if (!res.ok) {
          throw new Error(data?.error || 'No se pudo obtener el pedido')
        }

        const customerId = data?.order?.customer?._id || data?.order?.customerId

        if (!customerId) {
          // Si no está el id del cliente en el payload de listado, avisamos y salimos de forma segura.
          toast({
            title: 'Chat con Cliente',
            description: 'Cliente sin identificador disponible. Abra el detalle del pedido para gestionar el chat.',
          })
          return
        }

        // Crear/continuar chat admin-cliente
        const chatRes = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId,
            customerId,
            message: `Inicio de chat (admin-cliente) sobre el pedido #${data?.order?.orderNumber}`
          })
        })

        const chatData = await chatRes.json()
        if (!chatRes.ok) {
          throw new Error(chatData?.error || 'No se pudo iniciar el chat con el cliente')
        }

        toast({
          title: 'Chat con Cliente',
          description: `Chat iniciado con ${customerName} para el pedido #${data?.order?.orderNumber}`,
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
          variant: 'destructive'
        })
      }
    })()
  }

  const getStatusBadge = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      processing: 'bg-purple-100 text-purple-800',
      shipped: 'bg-indigo-100 text-indigo-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      refunded: 'bg-orange-100 text-orange-800'
    } as const
    return <Badge className={colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>{status}</Badge>
  }

  const getPaymentStatusBadge = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      in_process: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      cancelled: 'bg-red-100 text-red-800',
      refunded: 'bg-orange-100 text-orange-800'
    } as const
    return <Badge className={colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>{status}</Badge>
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'shipped':
        return <Truck className="h-4 w-4 text-purple-600" />
      case 'confirmed':
        return <CheckCircle className="h-4 w-4 text-blue-600" />
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <ShoppingCart className="h-8 w-8" />
            Gestión de Pedidos
          </h1>
          <p className="text-gray-600 mt-2">
            Administra todos los pedidos de la plataforma
          </p>
        </div>
        <div className="text-sm text-gray-500">
          Total: {orders.length} pedidos
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Número de orden, cliente..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Estado</label>
              <Select 
                value={filters.status} 
                onValueChange={(value) => setFilters({ ...filters, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
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
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Estado de Pago</label>
              <Select 
                value={filters.paymentStatus} 
                onValueChange={(value) => setFilters({ ...filters, paymentStatus: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los pagos</SelectItem>
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="approved">Aprobado</SelectItem>
                  <SelectItem value="failed">Fallido</SelectItem>
                  <SelectItem value="refunded">Reembolsado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Acciones</label>
              <Button 
                onClick={() => setFilters({ status: 'all', paymentStatus: 'all', search: '', dateRange: '' })}
                variant="outline" 
                className="w-full"
              >
                Limpiar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders List */}
      <div className="space-y-4">
        {orders.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay pedidos</h3>
              <p className="text-gray-500">No se encontraron pedidos con los filtros aplicados.</p>
            </CardContent>
          </Card>
        ) : (
          orders.map((order) => (
            <Card key={order._id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(order.status)}
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {order.orderNumber}
                        {getStatusBadge(order.status)}
                        {getPaymentStatusBadge(order.paymentStatus)}
                      </CardTitle>
                      <CardDescription>
                        {order.customer.name} • {order.customer.email} • {new Date(order.createdAt).toLocaleDateString()}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(order.total)}
                    </p>
                    <p className="text-sm text-gray-500">
                      {order.items.length} productos
                    </p>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-3">
                  {/* Order Items */}
                  <div className="space-y-2">
                    <h4 className="font-medium">Productos:</h4>
                    {order.items.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center gap-3">
                          <Package className="h-4 w-4 text-gray-500" />
                          <div>
                            <p className="font-medium text-sm">{item.name}</p>
                            <p className="text-xs text-gray-500">Cantidad: {item.quantity}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(item.price)}</p>
                          <p className="text-xs text-gray-500">Proveedor: {item.supplier}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Order Details */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Método de Envío:</span>
                      <p className="text-gray-600">{order.shippingMethod}</p>
                    </div>
                    <div>
                      <span className="font-medium">Método de Pago:</span>
                      <p className="text-gray-600">{order.paymentMethod}</p>
                    </div>
                    <div>
                      <span className="font-medium">Fecha de Creación:</span>
                      <p className="text-gray-600">{new Date(order.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <span className="font-medium">Última Actualización:</span>
                      <p className="text-gray-600">{new Date(order.updatedAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  
                  {/* Actions permitidas para Admin: solo ver detalle y chats */}
                  <div className="flex gap-2 pt-2 flex-wrap">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleViewDetails(order._id)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Ver Detalles
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleChatWithCustomer(order._id, order.customer.name)}
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Chat Cliente
                    </Button>
                    {order.items.length > 0 && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleChatWithSupplier(order._id, order.items[0].supplier)}
                      >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Chat Proveedor
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Order Details Dialog */}
      <OrderDetailsDialog
        orderId={selectedOrderId}
        isOpen={detailsDialogOpen}
        onClose={() => {
          setDetailsDialogOpen(false)
          setSelectedOrderId(null)
          setFocusSection(undefined)
        }}
        onOrderUpdated={fetchOrders}
        focusSection={focusSection}
      />

      {/* Update Tracking Dialog */}
      <Dialog open={trackingDialogOpen} onOpenChange={setTrackingDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Actualizar Tracking</DialogTitle>
            <DialogDescription>Ingrese el número de seguimiento para la orden seleccionada.</DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Input
              placeholder="Ej: AR1234-XYZ"
              value={trackingInput}
              onChange={(e) => setTrackingInput(e.target.value)}
            />
            <p className="text-xs text-muted-foreground mt-1">Acepta letras, números, &#39;-&#39;, &#39;_&#39; y &#39;.&#39; (4-40 caracteres)</p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setTrackingDialogOpen(false)}>Cancelar</Button>
            <Button onClick={submitTrackingUpdate} disabled={!trackingInput || !!actionLoading}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}