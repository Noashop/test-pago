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
  Headphones, 
  Search, 
  Filter, 
  MessageCircle, 
  User, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  XCircle,
  Eye,
  UserCheck,
  Loader2,
  Phone,
  Mail
} from 'lucide-react'

interface Ticket {
  _id: string
  ticketNumber: string
  subject: string
  description: string
  status: string
  priority: string
  category: string
  customer: {
    _id: string
    name: string
    email: string
    phone: string
  }
  assignedTo?: {
    _id: string
    name: string
    email: string
  }
  messagesCount: number
  lastMessage?: {
    content: string
    createdAt: string
    sender: any
  }
  createdAt: string
  updatedAt: string
}

interface SupportStats {
  open: number
  inProgress: number
  resolved: number
  highPriority: number
}

export default function AdminSupportPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [stats, setStats] = useState<SupportStats>({ open: 0, inProgress: 0, resolved: 0, highPriority: 0 })
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [detailsDialog, setDetailsDialog] = useState(false)
  const [messageDialog, setMessageDialog] = useState(false)
  const [newMessage, setNewMessage] = useState('')
  const [isInternalMessage, setIsInternalMessage] = useState(false)
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    search: ''
  })

  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filters.status !== 'all') params.append('status', filters.status)
      if (filters.priority !== 'all') params.append('priority', filters.priority)
      if (filters.search) params.append('search', filters.search)

      const response = await fetch(`/api/admin/support?${params}`, {
        credentials: 'include',
        cache: 'no-store',
      })
      const data = await response.json()

      if (response.ok) {
        setTickets(data.tickets)
        setStats(data.stats)
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Error al cargar tickets',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al cargar tickets de soporte',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }, [filters, toast])

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

    fetchTickets()
  }, [session, status, router, fetchTickets])

  const handleTicketAction = async (ticketId: string, action: string, data?: any) => {
    try {
      setActionLoading(ticketId)
      const response = await fetch('/api/admin/support', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        cache: 'no-store',
        body: JSON.stringify({
          ticketId,
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
        fetchTickets()
        if (action === 'add_message') {
          setMessageDialog(false)
          setNewMessage('')
          setIsInternalMessage(false)
        }
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Error al actualizar ticket',
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

  const openMessageDialog = (ticket: Ticket) => {
    setSelectedTicket(ticket)
    setMessageDialog(true)
  }

  const openDetailsDialog = (ticket: Ticket) => {
    setSelectedTicket(ticket)
    setDetailsDialog(true)
  }

  const getStatusBadge = (status: string) => {
    const configs = {
      open: { color: 'bg-red-100 text-red-800', icon: AlertTriangle, label: 'Abierto' },
      in_progress: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'En Progreso' },
      resolved: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Resuelto' },
      closed: { color: 'bg-gray-100 text-gray-800', icon: XCircle, label: 'Cerrado' }
    }
    
    const config = configs[status as keyof typeof configs] || configs.open
    const Icon = config.icon
    
    return (
      <Badge className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    )
  }

  const getPriorityBadge = (priority: string) => {
    const colors = {
      low: 'bg-blue-100 text-blue-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-red-100 text-red-800',
      urgent: 'bg-purple-100 text-purple-800'
    }
    
    const labels = {
      low: 'Baja',
      medium: 'Media',
      high: 'Alta',
      urgent: 'Urgente'
    }
    
    return (
      <Badge className={colors[priority as keyof typeof colors] || colors.medium}>
        {labels[priority as keyof typeof labels] || priority}
      </Badge>
    )
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
            <Headphones className="h-8 w-8" />
            Soporte al Cliente
          </h1>
          <p className="text-gray-600 mt-2">
            Gestiona tickets y consultas de clientes
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tickets Abiertos</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.open}</div>
            <p className="text-xs text-muted-foreground">Requieren atención</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Progreso</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inProgress}</div>
            <p className="text-xs text-muted-foreground">Siendo atendidos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resueltos</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.resolved}</div>
            <p className="text-xs text-muted-foreground">Este mes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alta Prioridad</CardTitle>
            <AlertTriangle className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.highPriority}</div>
            <p className="text-xs text-muted-foreground">Urgentes</p>
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
                  placeholder="Número, asunto..."
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
                  <SelectItem value="open">Abiertos</SelectItem>
                  <SelectItem value="in_progress">En Progreso</SelectItem>
                  <SelectItem value="resolved">Resueltos</SelectItem>
                  <SelectItem value="closed">Cerrados</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Prioridad</label>
              <Select 
                value={filters.priority} 
                onValueChange={(value) => setFilters({ ...filters, priority: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las prioridades</SelectItem>
                  <SelectItem value="low">Baja</SelectItem>
                  <SelectItem value="medium">Media</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="urgent">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Acciones</label>
              <Button 
                onClick={() => setFilters({ status: 'all', priority: 'all', search: '' })}
                variant="outline" 
                className="w-full"
              >
                Limpiar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tickets List */}
      <div className="space-y-4">
        {tickets.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Headphones className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay tickets</h3>
              <p className="text-gray-500">No se encontraron tickets con los filtros aplicados.</p>
            </CardContent>
          </Card>
        ) : (
          tickets.map((ticket) => (
            <Card key={ticket._id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                      <CardTitle className="flex items-center gap-2">
                        #{ticket.ticketNumber}
                        {getStatusBadge(ticket.status)}
                        {getPriorityBadge(ticket.priority)}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {ticket.subject}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-gray-400">
                      {ticket.messagesCount} mensajes
                    </p>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-3">
                  {/* Customer Info */}
                  <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                    <User className="h-5 w-5 text-gray-500" />
                    <div className="flex-1">
                      <p className="font-medium">{ticket.customer.name}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          <span>{ticket.customer.email}</span>
                        </div>
                        {ticket.customer.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            <span>{ticket.customer.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    {ticket.assignedTo && (
                      <div className="text-right">
                        <p className="text-sm font-medium">Asignado a:</p>
                        <p className="text-xs text-gray-500">{ticket.assignedTo.name}</p>
                      </div>
                    )}
                  </div>

                  {/* Last Message Preview */}
                  {ticket.lastMessage && (
                    <div className="p-3 border-l-4 border-blue-200 bg-blue-50">
                      <p className="text-sm text-gray-700 line-clamp-2">
                        {ticket.lastMessage.content}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(ticket.lastMessage.createdAt).toLocaleString()}
                      </p>
                    </div>
                  )}
                  
                  {/* Actions */}
                  <div className="flex gap-2 pt-2 flex-wrap">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => openDetailsDialog(ticket)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Ver Detalles
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => openMessageDialog(ticket)}
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Responder
                    </Button>

                    {ticket.status === 'open' && (
                      <Button 
                        size="sm"
                        onClick={() => handleTicketAction(ticket._id, 'assign', { assignedTo: session?.user?.id })}
                        disabled={actionLoading === ticket._id}
                      >
                        {actionLoading === ticket._id ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <UserCheck className="h-4 w-4 mr-2" />
                        )}
                        Asignar a Mí
                      </Button>
                    )}

                    {ticket.status !== 'resolved' && (
                      <Button 
                        size="sm"
                        variant="outline"
                        className="bg-green-50 hover:bg-green-100"
                        onClick={() => handleTicketAction(ticket._id, 'update_status', { status: 'resolved' })}
                        disabled={actionLoading === ticket._id}
                      >
                        {actionLoading === ticket._id ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <CheckCircle className="h-4 w-4 mr-2" />
                        )}
                        Resolver
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
            <DialogTitle>Responder Ticket #{selectedTicket?.ticketNumber}</DialogTitle>
            <DialogDescription>
              Envía una respuesta al cliente {selectedTicket?.customer.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="message">Mensaje</Label>
              <Textarea
                id="message"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Escribe tu respuesta aquí..."
                rows={4}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="internal"
                checked={isInternalMessage}
                onChange={(e) => setIsInternalMessage(e.target.checked)}
              />
              <Label htmlFor="internal" className="text-sm">
                Mensaje interno (no visible para el cliente)
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setMessageDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={() => {
                if (selectedTicket && newMessage.trim()) {
                  handleTicketAction(selectedTicket._id, 'add_message', {
                    content: newMessage,
                    isInternal: isInternalMessage
                  })
                }
              }}
              disabled={!newMessage.trim() || actionLoading === selectedTicket?._id}
            >
              {actionLoading === selectedTicket?._id ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                'Enviar Respuesta'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Details Dialog - Placeholder for now */}
      <Dialog open={detailsDialog} onOpenChange={setDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalles del Ticket #{selectedTicket?.ticketNumber}</DialogTitle>
            <DialogDescription>
              Información completa del ticket y historial de conversación
            </DialogDescription>
          </DialogHeader>

          {selectedTicket && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Cliente</Label>
                  <p className="text-sm">{selectedTicket.customer.name}</p>
                </div>
                <div>
                  <Label>Estado</Label>
                  <div className="mt-1">{getStatusBadge(selectedTicket.status)}</div>
                </div>
                <div>
                  <Label>Prioridad</Label>
                  <div className="mt-1">{getPriorityBadge(selectedTicket.priority)}</div>
                </div>
                <div>
                  <Label>Categoría</Label>
                  <p className="text-sm">{selectedTicket.category}</p>
                </div>
              </div>
              
              <div>
                <Label>Descripción</Label>
                <p className="text-sm mt-1 p-3 bg-gray-50 rounded">
                  {selectedTicket.description}
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailsDialog(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
