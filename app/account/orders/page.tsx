'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { Package, Calendar, DollarSign, Truck, CheckCircle, Clock, XCircle } from 'lucide-react'
import Image from 'next/image'

interface OrderItem {
  _id: string
  product: {
    _id: string
    name: string
    images: string[]
    price: number
  }
  quantity: number
  price: number
}

interface Order {
  _id: string
  orderNumber: string
  status: string
  total: number
  items: OrderItem[]
  shippingAddress: {
    name: string
    street: string
    city: string
    state: string
    zipCode: string
  }
  paymentStatus: string
  createdAt: string
  updatedAt: string
}

export default function ClientOrdersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (search) params.append('search', search)

      const response = await fetch(`/api/orders?${params}`)
      const data = await response.json()

      if (response.ok) {
        setOrders(data.orders)
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Error al cargar pedidos',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al cargar pedidos',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }, [statusFilter, search, toast])

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      router.push('/auth/login')
      return
    }

    if (session.user.role !== 'client') {
      router.push('/')
      return
    }

    fetchOrders()
  }, [session, status, router, fetchOrders])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pendiente</Badge>
      case 'paid':
        return <Badge className="bg-blue-100 text-blue-800">Pagado</Badge>
      case 'shipped':
        return <Badge className="bg-purple-100 text-purple-800">Enviado</Badge>
      case 'delivered':
        return <Badge className="bg-green-100 text-green-800">Entregado</Badge>
      case 'cancelled':
        return <Badge variant="destructive">Cancelado</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />
      case 'paid':
        return <CheckCircle className="h-4 w-4" />
      case 'shipped':
        return <Truck className="h-4 w-4" />
      case 'delivered':
        return <CheckCircle className="h-4 w-4" />
      case 'cancelled':
        return <XCircle className="h-4 w-4" />
      default:
        return <Package className="h-4 w-4" />
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(price)
  }

  if (status === 'loading') {
    return <div className="flex justify-center items-center min-h-screen">Cargando...</div>
  }

  if (!session || session.user.role !== 'client') {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Mis Pedidos</h1>
        <p className="text-gray-600">Revisa el estado de tus compras</p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Buscar por número de pedido..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filtrar por estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="pending">Pendientes</SelectItem>
            <SelectItem value="paid">Pagados</SelectItem>
            <SelectItem value="shipped">Enviados</SelectItem>
            <SelectItem value="delivered">Entregados</SelectItem>
            <SelectItem value="cancelled">Cancelados</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={fetchOrders} className="w-full sm:w-auto">
          Filtrar
        </Button>
      </div>

      {/* Orders List */}
      <div className="space-y-6">
        {loading ? (
          <div className="text-center py-8">Cargando pedidos...</div>
        ) : orders.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No tienes pedidos</h3>
              <p className="text-gray-500 mb-4">Cuando hagas tu primera compra, aparecerá aquí</p>
              <Button onClick={() => router.push('/')}>
                Comenzar a comprar
              </Button>
            </CardContent>
          </Card>
        ) : (
          orders.map((order) => (
            <Card key={order._id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      Pedido #{order.orderNumber}
                      {getStatusBadge(order.status)}
                    </CardTitle>
                    <CardDescription>
                      Realizado el {new Date(order.createdAt).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">{formatPrice(order.total)}</p>
                    <p className="text-sm text-gray-500">{order.items.length} productos</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Order Items */}
                <div className="space-y-4 mb-6">
                  {order.items.map((item) => (
                    <div key={item._id} className="flex items-center gap-4 p-3 border rounded-lg">
                      <div className="relative w-16 h-16">
                        <Image
                          src={item.product.images[0]}
                          alt={item.product.name}
                          fill
                          className="object-cover rounded"
                        />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{item.product.name}</h4>
                        <p className="text-sm text-gray-500">
                          Cantidad: {item.quantity} • {formatPrice(item.price)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatPrice(item.price * item.quantity)}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Order Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                  <div>
                    <h4 className="font-medium mb-2">Dirección de envío</h4>
                    <div className="text-sm text-gray-600">
                      <p>{order.shippingAddress.name}</p>
                      <p>{order.shippingAddress.street}</p>
                      <p>
                        {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
                      </p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Estado del pedido</h4>
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusIcon(order.status)}
                      <span className="text-sm capitalize">{order.status}</span>
                    </div>
                    <p className="text-sm text-gray-500">
                      Última actualización: {new Date(order.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-6 pt-4 border-t">
                  <Button variant="outline" size="sm">
                    Ver detalles
                  </Button>
                  <Button variant="outline" size="sm">
                    Rastrear envío
                  </Button>
                  {order.status === 'delivered' && (
                    <Button variant="outline" size="sm">
                      Dejar reseña
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
} 