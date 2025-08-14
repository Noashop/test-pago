'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
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
  MessageCircle,
  DollarSign,
  TrendingUp,
  Users
} from 'lucide-react'

interface Order {
  _id: string
  orderNumber: string
  customer: {
    name: string
    email: string
    phone: string
  }
  items: Array<{
    _id: string
    product: {
      _id: string
      name: string
      image: string
      sku: string
    }
    quantity: number
    unitPrice: number
    subtotal: number
    status: string
  }>
  total: number
  status: string
  paymentStatus: string
  paymentMethod: string
  shippingMethod: string
  shippingAddress: any
  trackingNumber?: string
  adminNotes?: string
  createdAt: string
  updatedAt: string
}

interface OrderStats {
  totalOrders: number
  totalRevenue: number
  averageOrderValue: number
  statusBreakdown: {
    pending: number
    confirmed: number
    processing: number
    shipped: number
    delivered: number
    cancelled: number
  }
}

export default function SupplierOrdersPage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  
  const [orders, setOrders] = useState<Order[]>([])
  const [stats, setStats] = useState<OrderStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  // Mostrar por defecto todos los pagos, para no ocultar pedidos mientras el webhook sincroniza
  const [paymentFilter, setPaymentFilter] = useState('all')
  
  // Modal states
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [trackingNumber, setTrackingNumber] = useState('')
  const [cancelReason, setCancelReason] = useState('')
  const [showTrackingModal, setShowTrackingModal] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        ...(statusFilter !== 'all' && { status: statusFilter }),
        // Siempre enviamos paymentStatus; si es 'all' lo especificamos explícitamente
        paymentStatus: paymentFilter || 'all',
        ...(searchTerm && { search: searchTerm })
      })
      
      const response = await fetch(`/api/supplier/orders?${params.toString()}`, {
        credentials: 'include',
        cache: 'no-store',
      })
      const data = await response.json().catch(() => ({}))
      if (response.ok) {
        setOrders(data.orders || [])
      } else {
        throw new Error(data?.error || 'Error al cargar pedidos')
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los pedidos',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }, [statusFilter, paymentFilter, searchTerm, toast])

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch('/api/supplier/orders/stats', {
        credentials: 'include',
        cache: 'no-store',
      })
      const data = await response.json().catch(() => ({}))
      if (response.ok) {
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }, [])

  useEffect(() => {
    if (session?.user) {
      fetchOrders()
      fetchStats()
    }
  }, [session?.user, fetchOrders, fetchStats])

  const handleConfirmOrder = async (orderId: string) => {
    try {
      setActionLoading(orderId)
      const response = await fetch(`/api/supplier/orders/${orderId}/confirm`, { 
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    })
      
      if (response.ok) {
        toast({
          title: 'Éxito',
          description: 'Pedido confirmado exitosamente'
        })
        fetchOrders()
        fetchStats()
      } else {
        throw new Error('Error al confirmar pedido')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo confirmar el pedido',
        variant: 'destructive'
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleUpdateTracking = async () => {
    if (!selectedOrder || !trackingNumber.trim()) return
    
    try {
      setActionLoading(selectedOrder._id)
      const response = await fetch(`/api/supplier/orders/${selectedOrder._id}/tracking`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        cache: 'no-store',
        body: JSON.stringify({ trackingNumber: trackingNumber.trim() })
      })
      
      if (response.ok) {
        toast({
          title: 'Éxito',
          description: 'Número de seguimiento actualizado'
        })
        setShowTrackingModal(false)
        setTrackingNumber('')
        fetchOrders()
      } else {
        throw new Error(response.statusText)
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'No se pudo actualizar el seguimiento'
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive'
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleCancelOrder = async () => {
    if (!selectedOrder || !cancelReason.trim()) return
    
    try {
      setActionLoading(selectedOrder._id)
      const response = await fetch(`/api/supplier/orders/${selectedOrder._id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        cache: 'no-store',
        body: JSON.stringify({ reason: cancelReason.trim() })
      })
      
      if (response.ok) {
        toast({
          title: 'Éxito',
          description: 'Pedido cancelado exitosamente'
        })
        setShowCancelModal(false)
        setCancelReason('')
        fetchOrders()
        fetchStats()
      } else {
        throw new Error('Error al cancelar pedido')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo cancelar el pedido',
        variant: 'destructive'
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleMarkAsShipped = async (orderId: string) => {
    try {
      setActionLoading(orderId)
      const response = await fetch(`/api/supplier/orders/${orderId}/ship`, { 
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    })
      
      if (response.ok) {
        toast({
          title: 'Éxito',
          description: 'Pedido marcado como enviado'
        })
        fetchOrders()
        fetchStats()
      } else {
        throw new Error('Error al marcar como enviado')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo marcar como enviado',
        variant: 'destructive'
      })
    } finally {
      setActionLoading(null)
    }
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const filteredOrders = orders.filter(order => {
    const matchesSearch = !searchTerm || 
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer.email.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesSearch
  })

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
            Mis Pedidos
          </h1>
          <p className="text-gray-600 mt-2">
            Gestiona los pedidos de tus productos
          </p>
        </div>
        <div className="text-sm text-gray-500">
          Total: {filteredOrders.length} pedidos
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pedidos</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalOrders}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valor Promedio</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.averageOrderValue)}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Entregados</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.statusBreakdown.delivered}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Número de orden, cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Estado</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los estados" />
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
              <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los pagos" />
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
          </div>
        </CardContent>
      </Card>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <ShoppingCart className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay pedidos</h3>
              <p className="text-gray-600 text-center">
                {searchTerm || statusFilter !== 'all' || paymentFilter !== 'all'
                  ? 'No se encontraron pedidos con los filtros aplicados.'
                  : 'Aún no tienes pedidos. Los pedidos aparecerán aquí cuando los clientes compren tus productos.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredOrders.map((order) => (
            <Card key={order._id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Pedido #{order.orderNumber}
                    </CardTitle>
                    <CardDescription>
                      Cliente: {order.customer.name} • {formatDate(order.createdAt)}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(order.status)}
                    {getPaymentStatusBadge(order.paymentStatus)}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-4">
                  {/* Order Items */}
                  <div>
                    <h4 className="font-medium mb-2">Productos ({order.items.length})</h4>
                    <div className="space-y-2">
                      {order.items.map((item) => (
                        <div key={item._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <Image 
                              src={item.product.image || '/placeholder.jpg'} 
                              alt={item.product.name}
                              width={48}
                              height={48}
                              className="w-12 h-12 object-cover rounded"
                            />
                            <div>
                              <p className="font-medium">{item.product.name}</p>
                              <p className="text-sm text-gray-600">SKU: {item.product.sku}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{item.quantity} x {formatCurrency(item.unitPrice)}</p>
                            <p className="text-sm text-gray-600">{formatCurrency(item.subtotal)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Order Summary */}
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div>
                      <p className="text-sm text-gray-600">Total del pedido</p>
                      <p className="text-lg font-bold">{formatCurrency(order.total)}</p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {/* Action Buttons */}
                      {order.status === 'pending' && order.paymentStatus === 'approved' && (
                        <Button
                          onClick={() => {
                            // Si no hay tracking, abrir modal para solicitarlo, y confirmar luego
                            if (!order.trackingNumber) {
                              setSelectedOrder(order)
                              setTrackingNumber('')
                              setShowTrackingModal(true)
                            } else {
                              handleConfirmOrder(order._id)
                            }
                          }}
                          disabled={actionLoading === order._id}
                          size="sm"
                        >
                          {actionLoading === order._id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle className="h-4 w-4" />
                          )}
                          Confirmar
                        </Button>
                      )}
                      
                      {(order.status === 'confirmed' || order.status === 'processing') && (
                        <>
                          <Button
                            onClick={() => handleMarkAsShipped(order._id)}
                            disabled={actionLoading === order._id}
                            size="sm"
                            variant="outline"
                          >
                            {actionLoading === order._id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Truck className="h-4 w-4" />
                            )}
                            Marcar Enviado
                          </Button>
                          
                          <Button
                            onClick={() => {
                              setSelectedOrder(order)
                              setTrackingNumber(order.trackingNumber || '')
                              setShowTrackingModal(true)
                            }}
                            size="sm"
                            variant="outline"
                          >
                            <Package className="h-4 w-4" />
                            Seguimiento
                          </Button>
                        </>
                      )}
                      
                      {['pending', 'confirmed'].includes(order.status) && (
                        <Button
                          onClick={() => {
                            setSelectedOrder(order)
                            setShowCancelModal(true)
                          }}
                          size="sm"
                          variant="destructive"
                        >
                          <XCircle className="h-4 w-4" />
                          Cancelar
                        </Button>
                      )}
                      
                      <Button
                        onClick={() => window.open(`/admin/chat?orderId=${order._id}&customerId=${order.customer}`, '_blank')}
                        size="sm"
                        variant="outline"
                      >
                        <MessageCircle className="h-4 w-4" />
                        Chat
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Tracking Modal */}
      {showTrackingModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Actualizar Seguimiento</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Número de Seguimiento</label>
                <Input
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="Ingresa el número de seguimiento"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowTrackingModal(false)}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={async () => {
                    await handleUpdateTracking()
                    // Si el pedido estaba pendiente y el pago aprobado, confirmar automáticamente tras carga de tracking
                    if (selectedOrder && selectedOrder.status === 'pending' && selectedOrder.paymentStatus === 'approved') {
                      await handleConfirmOrder(selectedOrder._id)
                    }
                  }}
                  disabled={!trackingNumber.trim() || actionLoading === selectedOrder._id}
                >
                  {actionLoading === selectedOrder._id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : null}
                  Guardar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {showCancelModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Cancelar Pedido</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Motivo de Cancelación</label>
                <Textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Explica el motivo de la cancelación"
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowCancelModal(false)}
                >
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleCancelOrder}
                  disabled={!cancelReason.trim() || actionLoading === selectedOrder._id}
                >
                  {actionLoading === selectedOrder._id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : null}
                  Confirmar Cancelación
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
