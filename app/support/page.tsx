'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { 
  MessageCircle, 
  Plus, 
  Search, 
  Filter,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Calendar
} from 'lucide-react'

import Navbar from '@/components/layout/navbar'
import Footer from '@/components/layout/footer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { createTicketSchema, type CreateTicketSchema } from '@/schemas'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

interface Ticket {
  _id: string
  ticketNumber: string
  subject: string
  category: 'order' | 'product' | 'payment' | 'shipping' | 'account' | 'other'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  description: string
  createdAt: string
  updatedAt: string
  lastReply?: string
  messagesCount: number
}

const STATUS_CONFIG = {
  open: {
    label: 'Abierto',
    color: 'bg-blue-100 text-blue-800',
    icon: Clock
  },
  in_progress: {
    label: 'En Progreso',
    color: 'bg-yellow-100 text-yellow-800',
    icon: AlertCircle
  },
  resolved: {
    label: 'Resuelto',
    color: 'bg-green-100 text-green-800',
    icon: CheckCircle
  },
  closed: {
    label: 'Cerrado',
    color: 'bg-gray-100 text-gray-800',
    icon: XCircle
  }
}

const PRIORITY_CONFIG = {
  low: { label: 'Baja', color: 'bg-gray-100 text-gray-800' },
  medium: { label: 'Media', color: 'bg-blue-100 text-blue-800' },
  high: { label: 'Alta', color: 'bg-orange-100 text-orange-800' },
  urgent: { label: 'Urgente', color: 'bg-red-100 text-red-800' }
}

const CATEGORY_CONFIG = {
  order: 'Pedidos',
  product: 'Productos',
  payment: 'Pagos',
  shipping: 'Envíos',
  account: 'Cuenta',
  other: 'Otro'
}

export default function SupportPage() {
  const { data: session, status } = useSession()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const { toast } = useToast()

  const form = useForm<CreateTicketSchema>({
    resolver: zodResolver(createTicketSchema),
    defaultValues: {
      subject: '',
      category: 'other',
      priority: 'medium',
      message: '',
    },
  })

  const fetchTickets = useCallback(async () => {
    try {
      const response = await fetch('/api/support/tickets')
      const data = await response.json()

      if (response.ok) {
        setTickets(data.tickets)
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los tickets',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      redirect('/auth/login?callbackUrl=/support')
    }
    fetchTickets()
  }, [session, status, fetchTickets])

  const onSubmit = async (values: CreateTicketSchema) => {
    try {
      const response = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: 'Ticket creado',
          description: `Tu ticket #${data.ticket.ticketNumber} ha sido creado exitosamente`,
        })
        form.reset()
        setIsCreateDialogOpen(false)
        fetchTickets()
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al crear el ticket',
        variant: 'destructive',
      })
    }
  }

  const filteredTickets = tickets
    .filter(ticket => {
      const matchesSearch = ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           ticket.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter
      const matchesCategory = categoryFilter === 'all' || ticket.category === categoryFilter
      return matchesSearch && matchesStatus && matchesCategory
    })
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/4" />
            <div className="h-16 bg-muted rounded" />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded" />
            ))}
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-playfair font-bold text-foreground mb-2">
              Centro de Soporte
            </h1>
            <p className="text-muted-foreground">
              Gestiona tus consultas y solicitudes de ayuda
            </p>
          </div>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Ticket
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Crear Nuevo Ticket</DialogTitle>
                <DialogDescription>
                  Describe tu problema o consulta y te ayudaremos lo antes posible
                </DialogDescription>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="subject"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Asunto</FormLabel>
                        <FormControl>
                          <Input placeholder="Describe brevemente tu consulta..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Categoría</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecciona categoría" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Object.entries(CATEGORY_CONFIG).map(([key, label]) => (
                                <SelectItem key={key} value={key}>
                                  {label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="priority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Prioridad</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecciona prioridad" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
                                <SelectItem key={key} value={key}>
                                  {config.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descripción</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe detalladamente tu problema o consulta..."
                            className="min-h-[120px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsCreateDialogOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit">
                      Crear Ticket
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Buscar por asunto o número de ticket..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="open">Abierto</SelectItem>
                    <SelectItem value="in_progress">En Progreso</SelectItem>
                    <SelectItem value="resolved">Resuelto</SelectItem>
                    <SelectItem value="closed">Cerrado</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {Object.entries(CATEGORY_CONFIG).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tickets List */}
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="animate-pulse space-y-4">
                    <div className="flex justify-between">
                      <div className="h-4 bg-muted rounded w-1/4" />
                      <div className="h-4 bg-muted rounded w-1/6" />
                    </div>
                    <div className="h-16 bg-muted rounded" />
                    <div className="flex justify-between">
                      <div className="h-4 bg-muted rounded w-1/3" />
                      <div className="h-8 bg-muted rounded w-24" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredTickets.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <MessageCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">
                {searchTerm || statusFilter !== 'all' || categoryFilter !== 'all' 
                  ? 'No se encontraron tickets' 
                  : 'No tienes tickets aún'
                }
              </h3>
              <p className="text-muted-foreground mb-6">
                {searchTerm || statusFilter !== 'all' || categoryFilter !== 'all'
                  ? 'Intenta ajustar los filtros de búsqueda'
                  : 'Cuando tengas alguna consulta, puedes crear un ticket aquí'
                }
              </p>
              {!searchTerm && statusFilter === 'all' && categoryFilter === 'all' && (
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Primer Ticket
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredTickets.map((ticket) => {
              const statusConfig = STATUS_CONFIG[ticket.status]
              const priorityConfig = PRIORITY_CONFIG[ticket.priority]
              const StatusIcon = statusConfig.icon

              return (
                <Card key={ticket._id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold">
                            #{ticket.ticketNumber}
                          </h3>
                          <Badge className={statusConfig.color}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusConfig.label}
                          </Badge>
                          <Badge className={priorityConfig.color}>
                            {priorityConfig.label}
                          </Badge>
                          <Badge variant="outline">
                            {CATEGORY_CONFIG[ticket.category]}
                          </Badge>
                        </div>

                        <h4 className="font-medium mb-2">{ticket.subject}</h4>
                        
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                          {ticket.description}
                        </p>

                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>
                            Creado {formatDistanceToNow(new Date(ticket.createdAt), {
                              addSuffix: true,
                              locale: es,
                            })}
                          </span>
                          <span>•</span>
                          <span>{ticket.messagesCount} mensaje{ticket.messagesCount !== 1 ? 's' : ''}</span>
                          {ticket.lastReply && (
                            <>
                              <span>•</span>
                              <span>
                                Última respuesta {formatDistanceToNow(new Date(ticket.lastReply), {
                                  addSuffix: true,
                                  locale: es,
                                })}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/support/${ticket._id}`}>
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Detalles
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* Results Summary */}
        {!loading && filteredTickets.length > 0 && (
          <div className="mt-6 text-center text-sm text-muted-foreground">
            Mostrando {filteredTickets.length} de {tickets.length} tickets
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  )
}
