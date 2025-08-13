'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { 
  Users, 
  Search, 
  Filter, 
  UserCheck, 
  UserX, 
  Eye,
  MessageCircle,
  ShoppingCart,
  TrendingUp,
  Calendar,
  DollarSign,
  Package,
  Loader2,
  Mail,
  Phone,
  MapPin,
  Star,
  Activity
} from 'lucide-react'

interface Client {
  _id: string
  name: string
  email: string
  phone?: string
  status: string
  isApproved: boolean
  address?: {
    street: string
    city: string
    state: string
    zipCode: string
  }
  stats: {
    totalOrders: number
    totalSpent: number
    averageOrderValue: number
    lastOrderDate?: string
  }
  createdAt: string
  updatedAt: string
  lastLogin?: string
}

interface ClientStats {
  total: number
  active: number
  inactive: number
  newThisMonth: number
  totalRevenue: number
  averageOrderValue: number
}

export default function AdminClientsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  
  const [clients, setClients] = useState<Client[]>([])
  const [stats, setStats] = useState<ClientStats>({ 
    total: 0, 
    active: 0, 
    inactive: 0, 
    newThisMonth: 0, 
    totalRevenue: 0, 
    averageOrderValue: 0 
  })
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [detailsDialog, setDetailsDialog] = useState(false)
  const [messageDialog, setMessageDialog] = useState(false)
  const [newMessage, setNewMessage] = useState('')
  const [filters, setFilters] = useState({
    status: 'all',
    orderBy: 'recent',
    search: ''
  })

  const fetchClients = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filters.status !== 'all') params.append('status', filters.status)
      if (filters.orderBy !== 'recent') params.append('orderBy', filters.orderBy)
      if (filters.search) params.append('search', filters.search)

      const response = await fetch(`/api/admin/clients?${params}`, {
        credentials: 'include',
        cache: 'no-store',
      })
      const data = await response.json()

      if (response.ok) {
        setClients(data.clients)
        setStats(data.stats)
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Error al cargar clientes',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al cargar clientes',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }, [filters.status, filters.orderBy, filters.search, toast])

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

    fetchClients()
  }, [session, status, router, fetchClients])

  

  const handleClientAction = async (clientId: string, action: string, data?: any) => {
    try {
      setActionLoading(clientId)
      const response = await fetch('/api/admin/clients', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        cache: 'no-store',
        body: JSON.stringify({
          clientId,
          action,
          ...data
        })
      })

      const result = await response.json()

      if (response.ok) {
        toast({
          title: 'Éxito',
          description: result.message
        })
        fetchClients()
        if (action === 'send_message') {
          setMessageDialog(false)
          setNewMessage('')
        }
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Error al procesar la acción',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al procesar la acción',
        variant: 'destructive'
      })
    } finally {
      setActionLoading(null)
    }
  }

  const openDetailsDialog = (client: Client) => {
    setSelectedClient(client)
    setDetailsDialog(true)
  }

  const openMessageDialog = (client: Client) => {
    setSelectedClient(client)
    setMessageDialog(true)
  }

  const getStatusBadge = (status: string, isApproved: boolean) => {
    if (!isApproved) {
      return (
        <Badge className="bg-yellow-100 text-yellow-800">
          <UserX className="h-3 w-3 mr-1" />
          Pendiente
        </Badge>
      )
    }

    const configs = {
      active: { color: 'bg-green-100 text-green-800', icon: UserCheck, label: 'Activo' },
      inactive: { color: 'bg-gray-100 text-gray-800', icon: UserX, label: 'Inactivo' },
      suspended: { color: 'bg-red-100 text-red-800', icon: UserX, label: 'Suspendido' }
    }
    
    const config = configs[status as keyof typeof configs] || configs.active
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
            <Users className="h-8 w-8" />
            Administración de Clientes
          </h1>
          <p className="text-gray-600 mt-2">
            Gestiona clientes, analiza comportamiento de compra y métricas
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clientes</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Registrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activos</CardTitle>
            <UserCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
            <p className="text-xs text-muted-foreground">Con compras</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nuevos</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.newThisMonth}</div>
            <p className="text-xs text-muted-foreground">Este mes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactivos</CardTitle>
            <UserX className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inactive}</div>
            <p className="text-xs text-muted-foreground">Sin compras</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">Total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Promedio</CardTitle>
            <ShoppingCart className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.averageOrderValue)}</div>
            <p className="text-xs text-muted-foreground">Por orden</p>
          </CardContent>
        </Card>
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
                  placeholder="Nombre, email..."
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
                  <SelectItem value="active">Activos</SelectItem>
                  <SelectItem value="inactive">Inactivos</SelectItem>
                  <SelectItem value="pending">Pendientes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Ordenar por</label>
              <Select 
                value={filters.orderBy} 
                onValueChange={(value) => setFilters({ ...filters, orderBy: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Más recientes</SelectItem>
                  <SelectItem value="orders">Más pedidos</SelectItem>
                  <SelectItem value="spent">Mayor gasto</SelectItem>
                  <SelectItem value="name">Nombre A-Z</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Acciones</label>
              <Button 
                onClick={() => setFilters({ status: 'all', orderBy: 'recent', search: '' })}
                variant="outline" 
                className="w-full"
              >
                Limpiar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Clients List */}
      <div className="space-y-4">
        {clients.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay clientes</h3>
              <p className="text-gray-500">No se encontraron clientes con los filtros aplicados.</p>
            </CardContent>
          </Card>
        ) : (
          clients.map((client) => (
            <Card key={client._id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                      <CardTitle className="flex items-center gap-2">
                        {client.name}
                        {getStatusBadge(client.status, client.isApproved)}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {client.email}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">
                      Cliente desde: {new Date(client.createdAt).toLocaleDateString()}
                    </p>
                    {client.lastLogin && (
                      <p className="text-xs text-gray-400">
                        Último acceso: {new Date(client.lastLogin).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-4">
                  {/* Client Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 bg-gray-50 rounded-lg">
                    <div className="space-y-2">
                      {client.phone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-4 w-4 text-gray-500" />
                          <span>{client.phone}</span>
                        </div>
                      )}
                      {client.address && (
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-gray-500" />
                          <span>{client.address.city}, {client.address.state}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-gray-500" />
                        <span>{client.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span>Registrado: {new Date(client.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Client Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-3 bg-blue-50 rounded-lg">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <ShoppingCart className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-800">Pedidos</span>
                      </div>
                      <p className="text-lg font-bold text-blue-900">{client.stats.totalOrders}</p>
                    </div>
                    
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-green-800">Total Gastado</span>
                      </div>
                      <p className="text-lg font-bold text-green-900">
                        {formatCurrency(client.stats.totalSpent)}
                      </p>
                    </div>
                    
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <TrendingUp className="h-4 w-4 text-purple-600" />
                        <span className="text-sm font-medium text-purple-800">Promedio</span>
                      </div>
                      <p className="text-lg font-bold text-purple-900">
                        {formatCurrency(client.stats.averageOrderValue)}
                      </p>
                    </div>
                    
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Activity className="h-4 w-4 text-orange-600" />
                        <span className="text-sm font-medium text-orange-800">Último Pedido</span>
                      </div>
                      <p className="text-sm font-bold text-orange-900">
                        {client.stats.lastOrderDate 
                          ? new Date(client.stats.lastOrderDate).toLocaleDateString()
                          : 'Nunca'
                        }
                      </p>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex gap-2 pt-2 flex-wrap">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => openDetailsDialog(client)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Ver Detalles
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => openMessageDialog(client)}
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Enviar Mensaje
                    </Button>

                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => router.push(`/admin/orders?customer=${client._id}`)}
                    >
                      <Package className="h-4 w-4 mr-2" />
                      Ver Pedidos
                    </Button>

                    {!client.isApproved && (
                      <Button 
                        size="sm"
                        onClick={() => handleClientAction(client._id, 'approve')}
                        disabled={actionLoading === client._id}
                      >
                        {actionLoading === client._id ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <UserCheck className="h-4 w-4 mr-2" />
                        )}
                        Aprobar
                      </Button>
                    )}

                    {client.status === 'active' && (
                      <Button 
                        size="sm"
                        variant="outline"
                        className="bg-yellow-50 hover:bg-yellow-100"
                        onClick={() => handleClientAction(client._id, 'suspend')}
                        disabled={actionLoading === client._id}
                      >
                        {actionLoading === client._id ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <UserX className="h-4 w-4 mr-2" />
                        )}
                        Suspender
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Message Dialog */}
      <Dialog open={messageDialog} onOpenChange={setMessageDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar Mensaje a {selectedClient?.name}</DialogTitle>
            <DialogDescription>
              Envía un mensaje directo al cliente {selectedClient?.email}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="message">Mensaje</Label>
              <Textarea
                id="message"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Escribe tu mensaje aquí..."
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setMessageDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={() => {
                if (selectedClient && newMessage.trim()) {
                  handleClientAction(selectedClient._id, 'send_message', {
                    message: newMessage
                  })
                }
              }}
              disabled={!newMessage.trim() || actionLoading === selectedClient?._id}
            >
              {actionLoading === selectedClient?._id ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                'Enviar Mensaje'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={detailsDialog} onOpenChange={setDetailsDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Detalles del Cliente</DialogTitle>
            <DialogDescription>
              Información completa y estadísticas de {selectedClient?.name}
            </DialogDescription>
          </DialogHeader>

          {selectedClient && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nombre</Label>
                  <p className="text-sm">{selectedClient.name}</p>
                </div>
                <div>
                  <Label>Email</Label>
                  <p className="text-sm">{selectedClient.email}</p>
                </div>
                <div>
                  <Label>Teléfono</Label>
                  <p className="text-sm">{selectedClient.phone || 'No especificado'}</p>
                </div>
                <div>
                  <Label>Estado</Label>
                  <div className="mt-1">{getStatusBadge(selectedClient.status, selectedClient.isApproved)}</div>
                </div>
                <div>
                  <Label>Fecha de Registro</Label>
                  <p className="text-sm">{new Date(selectedClient.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <Label>Último Acceso</Label>
                  <p className="text-sm">
                    {selectedClient.lastLogin 
                      ? new Date(selectedClient.lastLogin).toLocaleString()
                      : 'Nunca'
                    }
                  </p>
                </div>
              </div>
              
              {/* Address */}
              {selectedClient.address && (
                <div>
                  <Label>Dirección</Label>
                  <p className="text-sm mt-1 p-3 bg-gray-50 rounded">
                    {selectedClient.address.street}<br />
                    {selectedClient.address.city}, {selectedClient.address.state} {selectedClient.address.zipCode}
                  </p>
                </div>
              )}

              {/* Purchase Statistics */}
              <div>
                <Label>Estadísticas de Compras</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <ShoppingCart className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                      <p className="text-2xl font-bold">{selectedClient.stats.totalOrders}</p>
                      <p className="text-xs text-gray-500">Total Pedidos</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4 text-center">
                      <DollarSign className="h-8 w-8 text-green-500 mx-auto mb-2" />
                      <p className="text-2xl font-bold">{formatCurrency(selectedClient.stats.totalSpent)}</p>
                      <p className="text-xs text-gray-500">Total Gastado</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4 text-center">
                      <TrendingUp className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                      <p className="text-2xl font-bold">{formatCurrency(selectedClient.stats.averageOrderValue)}</p>
                      <p className="text-xs text-gray-500">Ticket Promedio</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4 text-center">
                      <Calendar className="h-8 w-8 text-orange-500 mx-auto mb-2" />
                      <p className="text-sm font-bold">
                        {selectedClient.stats.lastOrderDate 
                          ? new Date(selectedClient.stats.lastOrderDate).toLocaleDateString()
                          : 'Nunca'
                        }
                      </p>
                      <p className="text-xs text-gray-500">Último Pedido</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailsDialog(false)}>
              Cerrar
            </Button>
            <Button onClick={() => {
              if (selectedClient) {
                router.push(`/admin/orders?customer=${selectedClient._id}`)
                setDetailsDialog(false)
              }
            }}>
              Ver Pedidos del Cliente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
