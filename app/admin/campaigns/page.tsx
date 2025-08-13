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
import NextImage from 'next/image'
import { 
  Plus, Search, Filter, Calendar, Gift, Users, Clock, CheckCircle, XCircle, 
  Edit, Trash2, Play, Pause, Eye, BarChart3, Palette, Image, Type, Settings
} from 'lucide-react'

interface Campaign {
  _id: string
  title: string
  description: string
  content: string
  type: 'promotion' | 'announcement' | 'referral' | 'roulette' | 'banner'
  design: {
    fontFamily: 'roboto' | 'opensans' | 'montserrat'
    fontSize: 'small' | 'medium' | 'large'
    textColor: string
    backgroundColor: string
    borderColor?: string
    imageUrl?: string
    imageSize: 'small' | 'medium' | 'large' | 'full'
    imagePosition: 'top' | 'bottom' | 'left' | 'right' | 'background'
    bannerSize: 'small' | 'medium' | 'large' | 'full-width'
    bannerPosition: 'hero' | 'sidebar' | 'footer' | 'popup' | 'notification'
  }
  targetAudience: 'all' | 'clients' | 'suppliers' | 'both'
  isActive: boolean
  status: 'draft' | 'active' | 'paused' | 'completed' | 'cancelled'
  startDate: string
  endDate?: string
  priority: number
  views: number
  clicks: number
  interactions: number
  rouletteConfig?: any
  referralConfig?: any
  notificationConfig: any
  createdBy: {
    name: string
    email: string
  }
  createdAt: string
  updatedAt: string
}

const FONT_FAMILIES = [
  { value: 'roboto', label: 'Roboto' },
  { value: 'opensans', label: 'Open Sans' },
  { value: 'montserrat', label: 'Montserrat' }
]

const FONT_SIZES = [
  { value: 'small', label: 'Pequeño' },
  { value: 'medium', label: 'Mediano' },
  { value: 'large', label: 'Grande' }
]

const COLORS = [
  '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF',
  '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500'
]

export default function AdminCampaignsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [audienceFilter, setAudienceFilter] = useState('all')
  
  // Diálogos
  const [createDialog, setCreateDialog] = useState(false)
  const [editDialog, setEditDialog] = useState(false)
  const [previewDialog, setPreviewDialog] = useState(false)
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null)

  const fetchCampaigns = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (typeFilter !== 'all') params.append('type', typeFilter)
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (audienceFilter !== 'all') params.append('targetAudience', audienceFilter)

      const response = await fetch(`/api/admin/campaigns?${params}`, {
        credentials: 'include',
        cache: 'no-store',
      })
      const data = await response.json()

      if (response.ok) {
        setCampaigns(data.campaigns)
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al cargar campañas',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }, [search, typeFilter, statusFilter, audienceFilter, toast])

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

    fetchCampaigns()
  }, [session, status, router, fetchCampaigns])

  const handleDeleteCampaign = async (campaignId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta campaña?')) return

    try {
      setActionLoading(`delete-${campaignId}`)
      const response = await fetch(`/api/admin/campaigns/${campaignId}`, {
        method: 'DELETE',
        credentials: 'include',
        cache: 'no-store',
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: 'Éxito',
          description: 'Campaña eliminada correctamente',
        })
        fetchCampaigns()
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Error al eliminar campaña',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al eliminar campaña',
        variant: 'destructive'
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleStatusChange = async (campaignId: string, newStatus: string) => {
    try {
      setActionLoading(`status-${campaignId}`)
      const response = await fetch(`/api/admin/campaigns/${campaignId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        cache: 'no-store',
        body: JSON.stringify({ status: newStatus })
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: 'Éxito',
          description: `Campaña ${newStatus === 'active' ? 'activada' : newStatus === 'paused' ? 'pausada' : 'actualizada'} correctamente`,
        })
        fetchCampaigns()
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Error al cambiar estado',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al cambiar estado',
        variant: 'destructive'
      })
    } finally {
      setActionLoading(null)
    }
  }

  const openPreviewDialog = (campaign: Campaign) => {
    setSelectedCampaign(campaign)
    setPreviewDialog(true)
  }

  const getStatusBadge = (campaign: Campaign) => {
    const statusConfig = {
      draft: { variant: 'secondary' as const, label: 'Borrador', icon: Edit },
      active: { variant: 'default' as const, label: 'Activa', icon: CheckCircle },
      paused: { variant: 'outline' as const, label: 'Pausada', icon: Pause },
      completed: { variant: 'default' as const, label: 'Completada', icon: CheckCircle },
      cancelled: { variant: 'destructive' as const, label: 'Cancelada', icon: XCircle }
    }

    const config = statusConfig[campaign.status]
    const Icon = config.icon

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  const getTypeLabel = (type: string) => {
    const types = {
      promotion: 'Promoción',
      announcement: 'Anuncio',
      referral: 'Referidos',
      roulette: 'Ruleta',
      banner: 'Banner'
    }
    return types[type as keyof typeof types] || type
  }

  const getAudienceLabel = (audience: string) => {
    const audiences = {
      all: 'Todos',
      clients: 'Clientes',
      suppliers: 'Proveedores',
      both: 'Clientes y Proveedores'
    }
    return audiences[audience as keyof typeof audiences] || audience
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Campañas</h1>
          <p className="text-gray-600 mt-2">
            Administra promociones, anuncios, ruleta y sistema de referidos
          </p>
        </div>
        <Button onClick={() => setCreateDialog(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Nueva Campaña
        </Button>
      </div>

      {/* Filtros */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar campañas..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="promotion">Promoción</SelectItem>
                <SelectItem value="announcement">Anuncio</SelectItem>
                <SelectItem value="referral">Referidos</SelectItem>
                <SelectItem value="roulette">Ruleta</SelectItem>
                <SelectItem value="banner">Banner</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="draft">Borrador</SelectItem>
                <SelectItem value="active">Activa</SelectItem>
                <SelectItem value="paused">Pausada</SelectItem>
                <SelectItem value="completed">Completada</SelectItem>
                <SelectItem value="cancelled">Cancelada</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={audienceFilter} onValueChange={setAudienceFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Audiencia" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las audiencias</SelectItem>
                <SelectItem value="clients">Clientes</SelectItem>
                <SelectItem value="suppliers">Proveedores</SelectItem>
                <SelectItem value="both">Ambos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de campañas */}
      <div className="grid gap-6">
        {campaigns.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Gift className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No hay campañas
              </h3>
              <p className="text-gray-600 mb-6">
                Comienza creando tu primera campaña de marketing
              </p>
              <Button onClick={() => setCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Crear Primera Campaña
              </Button>
            </CardContent>
          </Card>
        ) : (
          campaigns.map((campaign) => (
            <Card key={campaign._id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CardTitle className="text-xl">{campaign.title}</CardTitle>
                      {getStatusBadge(campaign)}
                      <Badge variant="outline">
                        {getTypeLabel(campaign.type)}
                      </Badge>
                      <Badge variant="secondary">
                        <Users className="h-3 w-3 mr-1" />
                        {getAudienceLabel(campaign.targetAudience)}
                      </Badge>
                    </div>
                    <CardDescription className="text-base">
                      {campaign.description}
                    </CardDescription>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openPreviewDialog(campaign)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    
                    {campaign.status === 'active' ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStatusChange(campaign._id, 'paused')}
                        disabled={actionLoading === `status-${campaign._id}`}
                      >
                        <Pause className="h-4 w-4" />
                      </Button>
                    ) : campaign.status === 'paused' || campaign.status === 'draft' ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStatusChange(campaign._id, 'active')}
                        disabled={actionLoading === `status-${campaign._id}`}
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                    ) : null}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteCampaign(campaign._id)}
                      disabled={actionLoading === `delete-${campaign._id}` || campaign.status === 'active'}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="font-medium text-gray-700">Fechas</div>
                    <div className="text-gray-600">
                      {new Date(campaign.startDate).toLocaleDateString()}
                      {campaign.endDate && ` - ${new Date(campaign.endDate).toLocaleDateString()}`}
                    </div>
                  </div>
                  
                  <div>
                    <div className="font-medium text-gray-700">Métricas</div>
                    <div className="text-gray-600">
                      {campaign.views} vistas • {campaign.clicks} clics • {campaign.interactions} interacciones
                    </div>
                  </div>
                  
                  <div>
                    <div className="font-medium text-gray-700">Prioridad</div>
                    <div className="text-gray-600">
                      Nivel {campaign.priority}
                    </div>
                  </div>
                  
                  <div>
                    <div className="font-medium text-gray-700">Creado por</div>
                    <div className="text-gray-600">
                      {campaign.createdBy.name}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Diálogo de previsualización */}
      <Dialog open={previewDialog} onOpenChange={setPreviewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Previsualización de Campaña</DialogTitle>
            <DialogDescription>
              Vista previa de cómo se verá la campaña
            </DialogDescription>
          </DialogHeader>
          
          {selectedCampaign && (
            <div 
              className="p-6 rounded-lg border"
              style={{
                fontFamily: selectedCampaign.design.fontFamily,
                fontSize: selectedCampaign.design.fontSize === 'small' ? '14px' : 
                         selectedCampaign.design.fontSize === 'large' ? '18px' : '16px',
                color: selectedCampaign.design.textColor,
                backgroundColor: selectedCampaign.design.backgroundColor,
                borderColor: selectedCampaign.design.borderColor
              }}
            >
              {selectedCampaign.design.imageUrl && (
                <div className={`relative mb-4 ${
                  selectedCampaign.design.imageSize === 'small' ? 'w-24 h-24' :
                  selectedCampaign.design.imageSize === 'large' ? 'w-48 h-48' :
                  selectedCampaign.design.imageSize === 'full' ? 'w-full h-48' :
                  'w-32 h-32'
                }`}>
                  <NextImage
                    src={selectedCampaign.design.imageUrl}
                    alt={selectedCampaign.title}
                    fill
                    className="object-cover rounded"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
              )}
              
              <h3 className="text-xl font-bold mb-2">{selectedCampaign.title}</h3>
              <p className="mb-4">{selectedCampaign.description}</p>
              <div className="whitespace-pre-wrap">{selectedCampaign.content}</div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewDialog(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
