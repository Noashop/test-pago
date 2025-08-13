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
import { Plus, Search, Filter, Calendar, Tag, Users, Clock, CheckCircle, XCircle } from 'lucide-react'

interface Coupon {
  _id: string
  code: string
  name: string
  description: string
  type: string
  value: number
  minAmount?: number
  maxDiscount?: number
  usageLimit: number
  usedCount: number
  status: string
  startDate: string
  endDate: string
  isActive: boolean
  createdAt: string
  createdBy: {
    name: string
    email: string
  }
}

export default function AdminCouponsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [createDialog, setCreateDialog] = useState(false)
  const [formData, setFormData] = useState({
    code: '',
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

  const fetchCoupons = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (typeFilter !== 'all') params.append('type', typeFilter)

      const response = await fetch(`/api/admin/coupons?${params}` , {
        credentials: 'include',
        cache: 'no-store',
      })
      const data = await response.json()

      if (response.ok) {
        setCoupons(data.coupons)
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Error al cargar cupones',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al cargar cupones',
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

    fetchCoupons()
  }, [session, status, router, fetchCoupons])

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const response = await fetch('/api/admin/coupons', {
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
          description: 'Cupón creado correctamente',
        })
        setCreateDialog(false)
        setFormData({
          code: '',
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
        fetchCoupons()
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Error al crear cupón',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al crear cupón',
        variant: 'destructive'
      })
    }
  }

  const getStatusBadge = (coupon: Coupon) => {
    const now = new Date()
    const startDate = new Date(coupon.startDate)
    const endDate = new Date(coupon.endDate)
    
    if (!coupon.isActive) {
      return <Badge variant="destructive">Inactivo</Badge>
    }
    
    if (now < startDate) {
      return <Badge className="bg-blue-100 text-blue-800">Próximo</Badge>
    }
    
    if (now > endDate) {
      return <Badge variant="destructive">Expirado</Badge>
    }
    
    if (coupon.usedCount >= coupon.usageLimit) {
      return <Badge variant="destructive">Agotado</Badge>
    }
    
    return <Badge className="bg-green-100 text-green-800">Activo</Badge>
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'percentage':
        return 'Porcentaje'
      case 'fixed_amount':
        return 'Monto fijo'
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
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestión de Cupones</h1>
            <p className="text-gray-600">Crea y gestiona cupones de descuento</p>
          </div>
          <Button onClick={() => setCreateDialog(true)}>
            <Plus className="mr-2" size={20} />
            Nuevo Cupón
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <Input
              placeholder="Buscar cupones..."
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
            <SelectItem value="active">Activos</SelectItem>
            <SelectItem value="inactive">Inactivos</SelectItem>
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
            <SelectItem value="free_shipping">Envío gratis</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={fetchCoupons} className="w-full sm:w-auto">
          <Filter className="mr-2" size={20} />
          Filtrar
        </Button>
      </div>

      {/* Coupons List */}
      <div className="grid gap-6">
        {loading ? (
          <div className="text-center py-8">Cargando cupones...</div>
        ) : coupons.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Tag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay cupones</h3>
              <p className="text-gray-500 mb-4">Comienza creando tu primer cupón de descuento</p>
              <Button onClick={() => setCreateDialog(true)}>
                <Plus className="mr-2" size={20} />
                Crear Cupón
              </Button>
            </CardContent>
          </Card>
        ) : (
          coupons.map((coupon) => (
            <Card key={coupon._id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      {coupon.code}
                      {getStatusBadge(coupon)}
                    </CardTitle>
                    <CardDescription>
                      {coupon.name} • {getTypeLabel(coupon.type)}
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
                    <p className="text-sm text-gray-500">Descripción</p>
                    <p className="font-medium">{coupon.description}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Valor del descuento</p>
                    <p className="font-medium">
                      {coupon.type === 'percentage' 
                        ? `${coupon.value}%` 
                        : formatPrice(coupon.value)
                      }
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Uso</p>
                    <p className="font-medium">
                      {coupon.usedCount} / {coupon.usageLimit}
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <p className="text-sm text-gray-500">Período de validez</p>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">
                        {new Date(coupon.startDate).toLocaleDateString()} - {new Date(coupon.endDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Monto mínimo</p>
                    <p className="font-medium">
                      {coupon.minAmount ? formatPrice(coupon.minAmount) : 'Sin mínimo'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create Coupon Dialog */}
      <Dialog open={createDialog} onOpenChange={setCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Cupón</DialogTitle>
            <DialogDescription>
              Configura los detalles del cupón de descuento
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleCreateCoupon} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="code">Código del cupón</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({...formData, code: e.target.value})}
                  placeholder="DESCUENTO20"
                  required
                />
              </div>
              <div>
                <Label htmlFor="name">Nombre del cupón</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Descuento del 20%"
                  required
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Descuento especial para nuevos clientes"
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="type">Tipo de descuento</Label>
                <Select 
                  value={formData.type} 
                  onValueChange={(value) => setFormData({...formData, type: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Porcentaje</SelectItem>
                    <SelectItem value="fixed_amount">Monto fijo</SelectItem>
                    <SelectItem value="free_shipping">Envío gratis</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="minAmount">Monto mínimo (opcional)</Label>
                <Input
                  id="minAmount"
                  type="number"
                  step="0.01"
                  value={formData.minAmount}
                  onChange={(e) => setFormData({...formData, minAmount: parseFloat(e.target.value)})}
                  placeholder="0"
                />
              </div>
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
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateDialog(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                Crear Cupón
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
} 