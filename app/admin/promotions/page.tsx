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
import { Plus, Search, Filter, Calendar, Gift, Users, Clock, CheckCircle, XCircle, Layout, Loader2 } from 'lucide-react'
import { HomepageContentManager } from '@/components/admin/homepage-content-manager'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface Promotion {
  _id: string
  name: string
  description: string
  type: string
  value: number
  minAmount?: number
  maxDiscount?: number
  startDate: string
  endDate: string
  isActive: boolean
  usageLimit: number
  usedCount: number
  createdAt: string
  createdBy: {
    name: string
    email: string
  }
}

export default function AdminPromotionsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [createDialog, setCreateDialog] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'percentage',
    value: 0,
    minAmount: 0,
    maxDiscount: 0,
    usageLimit: 100,
    startDate: '',
    endDate: ''
  })

  const fetchPromotions = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (typeFilter !== 'all') params.append('type', typeFilter)

      const response = await fetch(`/api/admin/promotions?${params}` , {
        credentials: 'include',
        cache: 'no-store',
      })
      const data = await response.json()

      if (response.ok) {
        setPromotions(data.promotions)
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Error al cargar promociones',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al cargar promociones',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter, typeFilter, toast])

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

    fetchPromotions()
  }, [session, status, router, fetchPromotions])

  const handleCreatePromotion = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setActionLoading('create')
      const response = await fetch('/api/admin/promotions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        cache: 'no-store',
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: 'Éxito',
          description: 'Promoción creada correctamente',
        })
        setCreateDialog(false)
        setFormData({
          name: '',
          description: '',
          type: 'percentage',
          value: 0,
          minAmount: 0,
          maxDiscount: 0,
          usageLimit: 100,
          startDate: '',
          endDate: ''
        })
        fetchPromotions()
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Error al crear promoción',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al crear promoción',
        variant: 'destructive'
      })
    } finally {
      setActionLoading(null)
    }
  }

  const getStatusBadge = (promotion: Promotion) => {
    const now = new Date()
    const startDate = new Date(promotion.startDate)
    const endDate = new Date(promotion.endDate)
    
    if (!promotion.isActive) {
      return <Badge variant="destructive">Inactiva</Badge>
    }
    
    if (now < startDate) {
      return <Badge className="bg-blue-100 text-blue-800">Próxima</Badge>
    }
    
    if (now > endDate) {
      return <Badge variant="destructive">Expirada</Badge>
    }
    
    if (promotion.usedCount >= promotion.usageLimit) {
      return <Badge variant="destructive">Agotada</Badge>
    }
    
    return <Badge className="bg-green-100 text-green-800">Activa</Badge>
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'percentage':
        return 'Porcentaje'
      case 'fixed_amount':
        return 'Monto fijo'
      case 'buy_one_get_one':
        return 'Compra 1, lleva 2'
      case 'free_shipping':
        return 'Envío gratis'
      default:
        return type
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

  if (!session || session.user.role !== 'admin') {
    return null
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Gift className="h-8 w-8 text-primary" />
            Promociones y Cupones
          </h1>
          <p className="text-muted-foreground mt-2">
            Gestiona promociones automáticas, cupones de descuento y contenido dinámico
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="promotions" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="promotions" className="flex items-center gap-2">
            <Gift className="h-4 w-4" />
            Promociones y Cupones
          </TabsTrigger>
          <TabsTrigger value="homepage" className="flex items-center gap-2">
            <Layout className="h-4 w-4" />
            Contenido de Página Principal
          </TabsTrigger>
        </TabsList>

        <TabsContent value="promotions" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Promociones Automáticas</h2>
            <Button onClick={() => setCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Promoción
            </Button>
          </div>

          {/* Filters */}
          <div className="mb-6 flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <Input
                  placeholder="Buscar promociones..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="active">Activas</SelectItem>
                <SelectItem value="inactive">Inactivas</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="percentage">Porcentaje</SelectItem>
                <SelectItem value="fixed_amount">Monto fijo</SelectItem>
                <SelectItem value="buy_one_get_one">Compra 1, lleva 2</SelectItem>
                <SelectItem value="free_shipping">Envío gratis</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={fetchPromotions} className="w-full sm:w-auto">
              <Filter className="mr-2" size={20} />
              Filtrar
            </Button>
          </div>

      {/* Promotions List */}
      <div className="grid gap-6">
        {loading ? (
          <div className="text-center py-8">Cargando promociones...</div>
        ) : promotions.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Gift className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay promociones</h3>
              <p className="text-gray-500 mb-4">Comienza creando tu primera promoción automática</p>
              <Button onClick={() => setCreateDialog(true)}>
                <Plus className="mr-2" size={20} />
                Crear Promoción
              </Button>
            </CardContent>
          </Card>
        ) : (
          promotions.map((promotion) => (
            <Card key={promotion._id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      {promotion.name}
                      {getStatusBadge(promotion)}
                    </CardTitle>
                    <CardDescription>
                      {getTypeLabel(promotion.type)} • {promotion.description}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <CheckCircle className="mr-2" size={16} />
                      Activar
                    </Button>
                    <Button variant="outline" size="sm">
                      <XCircle className="mr-2" size={16} />
                      Desactivar
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Valor del descuento</p>
                    <p className="font-medium">
                      {promotion.type === 'percentage' 
                        ? `${promotion.value}%` 
                        : promotion.type === 'buy_one_get_one'
                        ? 'Compra 1, lleva 2'
                        : formatPrice(promotion.value)
                      }
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Uso</p>
                    <p className="font-medium">
                      {promotion.usedCount} / {promotion.usageLimit}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Monto mínimo</p>
                    <p className="font-medium">
                      {promotion.minAmount ? formatPrice(promotion.minAmount) : 'Sin mínimo'}
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <p className="text-sm text-gray-500">Período de validez</p>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">
                        {new Date(promotion.startDate).toLocaleDateString()} - {new Date(promotion.endDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Creada por</p>
                    <p className="font-medium">{promotion.createdBy.name}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create Promotion Dialog */}
      <Dialog open={createDialog} onOpenChange={setCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Crear Nueva Promoción</DialogTitle>
            <DialogDescription>
              Configura los detalles de la promoción automática
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleCreatePromotion} className="space-y-4">
            <div>
              <Label htmlFor="name">Nombre de la promoción</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Descuento de Verano 2024"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="type">Tipo de promoción</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData({...formData, type: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona el tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Porcentaje</SelectItem>
                  <SelectItem value="fixed_amount">Monto fijo</SelectItem>
                  <SelectItem value="buy_one_get_one">Compra 1, lleva 2</SelectItem>
                  <SelectItem value="free_shipping">Envío gratis</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Promoción especial de verano con descuentos increíbles"
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="value">Valor</Label>
                <Input
                  id="value"
                  type="number"
                  step="0.01"
                  value={formData.value}
                  onChange={(e) => setFormData({...formData, value: parseFloat(e.target.value)})}
                  placeholder={formData.type === 'percentage' ? '20' : '1000'}
                  required
                />
              </div>
              <div>
                <Label htmlFor="usageLimit">Límite de uso</Label>
                <Input
                  id="usageLimit"
                  type="number"
                  value={formData.usageLimit}
                  onChange={(e) => setFormData({...formData, usageLimit: parseInt(e.target.value)})}
                  placeholder="100"
                  required
                />
              </div>
              <div>
                <Label htmlFor="minAmount">Monto mínimo</Label>
                <Input
                  id="minAmount"
                  type="number"
                  step="0.01"
                  value={formData.minAmount}
                  onChange={(e) => setFormData({...formData, minAmount: parseFloat(e.target.value)})}
                  placeholder="0"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="maxDiscount">Descuento máximo (opcional)</Label>
                <Input
                  id="maxDiscount"
                  type="number"
                  step="0.01"
                  value={formData.maxDiscount}
                  onChange={(e) => setFormData({...formData, maxDiscount: parseFloat(e.target.value)})}
                  placeholder="Sin límite"
                />
              </div>
              <div>
                <Label htmlFor="startDate">Fecha de inicio</Label>
                <Input
                  id="startDate"
                  type="datetime-local"
                  value={formData.startDate}
                  onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                  required
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="endDate">Fecha de fin</Label>
              <Input
                id="endDate"
                type="datetime-local"
                value={formData.endDate}
                onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                required
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateDialog(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={actionLoading === 'create'}>
                {actionLoading === 'create' ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creando...
                  </>
                ) : (
                  'Crear Promoción'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
        </TabsContent>

        <TabsContent value="homepage" className="space-y-6">
          <HomepageContentManager onContentChange={fetchPromotions} />
        </TabsContent>
      </Tabs>
    </div>
  )
} 