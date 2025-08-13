'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  Copy, 
  ArrowUp, 
  ArrowDown,
  Layout,
  Image as ImageIcon,
  Type,
  BarChart3,
  Gift,
  Users,
  Megaphone,
  Loader2,
  Monitor,
  Tablet,
  Smartphone
} from 'lucide-react'
import Image from 'next/image'

interface HomepageContent {
  _id: string
  title: string
  description: string
  type: 'hero' | 'statistics' | 'features' | 'cta' | 'testimonial' | 'banner' | 'announcement'
  position: number
  isActive: boolean
  content: {
    subtitle?: string
    buttonText?: string
    buttonLink?: string
    backgroundImage?: string
    rating?: number
    stats?: Array<{
      value: string
      label: string
      icon?: string
    }>
    features?: Array<{
      title: string
      description: string
      icon: string
    }>
    primaryButton?: {
      text: string
      link: string
      variant: 'primary' | 'secondary'
    }
    secondaryButton?: {
      text: string
      link: string
      variant: 'primary' | 'secondary'
    }
    image?: string
    link?: string
    backgroundColor?: string
    textColor?: string
    size?: 'small' | 'medium' | 'large' | 'full'
    layout?: 'horizontal' | 'vertical' | 'grid'
    targetAudience?: 'all' | 'clients' | 'suppliers'
    showInNotifications?: boolean
  }
  displaySettings: {
    showTitle: boolean
    showDescription: boolean
    customCSS?: string
    responsive: {
      mobile: boolean
      tablet: boolean
      desktop: boolean
    }
  }
  schedule?: {
    startDate: string
    endDate: string
    timezone: string
  }
  metrics: {
    views: number
    clicks: number
    conversions: number
  }
  createdBy: {
    name: string
    email: string
  }
  createdAt: string
  updatedAt: string
}

interface HomepageContentManagerProps {
  onContentChange?: () => void
}

export function HomepageContentManager({ onContentChange }: HomepageContentManagerProps) {
  const { toast } = useToast()
  
  const [contents, setContents] = useState<HomepageContent[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [selectedContent, setSelectedContent] = useState<HomepageContent | null>(null)
  const [createDialog, setCreateDialog] = useState(false)
  const [editDialog, setEditDialog] = useState(false)
  const [previewDialog, setPreviewDialog] = useState(false)
  const [filters, setFilters] = useState({
    type: 'all',
    isActive: 'all',
    targetAudience: 'all'
  })

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'banner' as const,
    position: 0,
    isActive: true,
    content: {
      subtitle: '',
      buttonText: '',
      buttonLink: '',
      backgroundImage: '',
      rating: 5,
      stats: [],
      features: [],
      primaryButton: {
        text: '',
        link: '',
        variant: 'primary' as const
      },
      secondaryButton: {
        text: '',
        link: '',
        variant: 'secondary' as const
      },
      image: '',
      link: '',
      backgroundColor: '#ffffff',
      textColor: '#000000',
      size: 'medium' as const,
      layout: 'horizontal' as const,
      targetAudience: 'all' as const,
      showInNotifications: false
    },
    displaySettings: {
      showTitle: true,
      showDescription: true,
      customCSS: '',
      responsive: {
        mobile: true,
        tablet: true,
        desktop: true
      }
    },
    schedule: {
      startDate: '',
      endDate: '',
      timezone: 'America/Argentina/Salta'
    }
  })

  const fetchContents = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filters.type !== 'all') params.append('type', filters.type)
      if (filters.isActive !== 'all') params.append('isActive', filters.isActive)
      if (filters.targetAudience !== 'all') params.append('targetAudience', filters.targetAudience)

      const response = await fetch(`/api/admin/homepage-content?${params}`)
      const data = await response.json()

      if (response.ok) {
        setContents(data.content)
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Error al cargar contenido',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al cargar contenido de la página principal',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }, [filters.type, filters.isActive, filters.targetAudience, toast])

  useEffect(() => {
    fetchContents()
  }, [fetchContents])

  const handleCreateContent = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setActionLoading('create')
      const response = await fetch('/api/admin/homepage-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: 'Éxito',
          description: 'Contenido creado correctamente'
        })
        setCreateDialog(false)
        resetForm()
        fetchContents()
        onContentChange?.()
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Error al crear contenido',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al crear contenido',
        variant: 'destructive'
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleContentAction = async (contentId: string, action: string, data?: any) => {
    try {
      setActionLoading(contentId)
      const response = await fetch(`/api/admin/homepage-content/${contentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action, data })
      })

      const result = await response.json()

      if (response.ok) {
        toast({
          title: 'Éxito',
          description: result.message
        })
        fetchContents()
        onContentChange?.()
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Error al actualizar contenido',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al actualizar contenido',
        variant: 'destructive'
      })
    } finally {
      setActionLoading(null)
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      type: 'banner',
      position: 0,
      isActive: true,
      content: {
        subtitle: '',
        buttonText: '',
        buttonLink: '',
        backgroundImage: '',
        rating: 5,
        stats: [],
        features: [],
        primaryButton: {
          text: '',
          link: '',
          variant: 'primary'
        },
        secondaryButton: {
          text: '',
          link: '',
          variant: 'secondary'
        },
        image: '',
        link: '',
        backgroundColor: '#ffffff',
        textColor: '#000000',
        size: 'medium',
        layout: 'horizontal',
        targetAudience: 'all',
        showInNotifications: false
      },
      displaySettings: {
        showTitle: true,
        showDescription: true,
        customCSS: '',
        responsive: {
          mobile: true,
          tablet: true,
          desktop: true
        }
      },
      schedule: {
        startDate: '',
        endDate: '',
        timezone: 'America/Argentina/Salta'
      }
    })
  }

  const getTypeIcon = (type: string) => {
    const icons = {
      hero: Layout,
      statistics: BarChart3,
      features: Gift,
      cta: Users,
      testimonial: Users,
      banner: ImageIcon,
      announcement: Megaphone
    }
    const Icon = icons[type as keyof typeof icons] || Layout
    return <Icon className="h-4 w-4" />
  }

  const getTypeLabel = (type: string) => {
    const labels = {
      hero: 'Hero Section',
      statistics: 'Estadísticas',
      features: 'Características',
      cta: 'Call to Action',
      testimonial: 'Testimonios',
      banner: 'Banner',
      announcement: 'Anuncio'
    }
    return labels[type as keyof typeof labels] || type
  }

  const getStatusBadge = (content: HomepageContent) => {
    if (!content.isActive) {
      return <Badge variant="secondary">Inactivo</Badge>
    }

    if (content.schedule) {
      const now = new Date()
      const start = new Date(content.schedule.startDate)
      const end = new Date(content.schedule.endDate)
      
      if (start && now < start) {
        return <Badge variant="outline">Programado</Badge>
      }
      if (end && now > end) {
        return <Badge variant="secondary">Expirado</Badge>
      }
    }

    return <Badge variant="default">Activo</Badge>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Contenido de Página Principal</h2>
          <p className="text-muted-foreground">
            Gestiona banners, anuncios y promociones dinámicas
          </p>
        </div>
        <Button onClick={() => setCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Crear Contenido
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Tipo de Contenido</Label>
              <Select 
                value={filters.type} 
                onValueChange={(value) => setFilters({...filters, type: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  <SelectItem value="hero">Hero Section</SelectItem>
                  <SelectItem value="statistics">Estadísticas</SelectItem>
                  <SelectItem value="features">Características</SelectItem>
                  <SelectItem value="cta">Call to Action</SelectItem>
                  <SelectItem value="banner">Banner</SelectItem>
                  <SelectItem value="announcement">Anuncio</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Estado</Label>
              <Select 
                value={filters.isActive} 
                onValueChange={(value) => setFilters({...filters, isActive: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="true">Activos</SelectItem>
                  <SelectItem value="false">Inactivos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Audiencia</Label>
              <Select 
                value={filters.targetAudience} 
                onValueChange={(value) => setFilters({...filters, targetAudience: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las audiencias</SelectItem>
                  <SelectItem value="clients">Solo Clientes</SelectItem>
                  <SelectItem value="suppliers">Solo Proveedores</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content List */}
      <div className="grid gap-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : contents.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <Layout className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No hay contenido</h3>
              <p className="text-muted-foreground mb-4">
                Crea tu primer contenido dinámico para la página principal
              </p>
              <Button onClick={() => setCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Crear Contenido
              </Button>
            </CardContent>
          </Card>
        ) : (
          contents.map((content) => (
            <Card key={content._id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getTypeIcon(content.type)}
                      <h3 className="font-semibold">{content.title}</h3>
                      {getStatusBadge(content)}
                      <Badge variant="outline">
                        Posición {content.position}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-3">
                      {content.description}
                    </p>
                    
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Tipo: {getTypeLabel(content.type)}</span>
                      <span>Audiencia: {content.content.targetAudience || 'Todos'}</span>
                      <span>Vistas: {content.metrics.views}</span>
                      <span>Clicks: {content.metrics.clicks}</span>
                      
                      {/* Responsive indicators */}
                      <div className="flex items-center gap-1">
                        {content.displaySettings.responsive.desktop && (
                          <Monitor className="h-3 w-3" />
                        )}
                        {content.displaySettings.responsive.tablet && (
                          <Tablet className="h-3 w-3" />
                        )}
                        {content.displaySettings.responsive.mobile && (
                          <Smartphone className="h-3 w-3" />
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleContentAction(content._id, 'toggle_active')}
                      disabled={actionLoading === content._id}
                    >
                      {content.isActive ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedContent(content)
                        setPreviewDialog(true)
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleContentAction(content._id, 'duplicate')}
                      disabled={actionLoading === content._id}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // TODO: Implement edit functionality
                        toast({
                          title: 'Próximamente',
                          description: 'Funcionalidad de edición en desarrollo'
                        })
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create Content Dialog */}
      <Dialog open={createDialog} onOpenChange={setCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Contenido</DialogTitle>
            <DialogDescription>
              Configura el contenido dinámico para la página principal
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleCreateContent} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="Título del contenido"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="type">Tipo de Contenido</Label>
                <Select 
                  value={formData.type} 
                  onValueChange={(value: any) => setFormData({...formData, type: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hero">Hero Section</SelectItem>
                    <SelectItem value="statistics">Estadísticas</SelectItem>
                    <SelectItem value="features">Características</SelectItem>
                    <SelectItem value="cta">Call to Action</SelectItem>
                    <SelectItem value="banner">Banner</SelectItem>
                    <SelectItem value="announcement">Anuncio</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Descripción del contenido"
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="position">Posición</Label>
                <Input
                  id="position"
                  type="number"
                  value={formData.position}
                  onChange={(e) => setFormData({...formData, position: parseInt(e.target.value)})}
                  placeholder="0"
                  min="0"
                />
              </div>
              
              <div>
                <Label htmlFor="size">Tamaño</Label>
                <Select 
                  value={formData.content.size} 
                  onValueChange={(value: any) => setFormData({
                    ...formData, 
                    content: {...formData.content, size: value}
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Pequeño</SelectItem>
                    <SelectItem value="medium">Mediano</SelectItem>
                    <SelectItem value="large">Grande</SelectItem>
                    <SelectItem value="full">Completo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="targetAudience">Audiencia</Label>
                <Select 
                  value={formData.content.targetAudience} 
                  onValueChange={(value: any) => setFormData({
                    ...formData, 
                    content: {...formData.content, targetAudience: value}
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="clients">Solo Clientes</SelectItem>
                    <SelectItem value="suppliers">Solo Proveedores</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Additional fields based on content type */}
            {formData.type === 'banner' && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="image">URL de Imagen</Label>
                  <Input
                    id="image"
                    value={formData.content.image}
                    onChange={(e) => setFormData({
                      ...formData, 
                      content: {...formData.content, image: e.target.value}
                    })}
                    placeholder="https://ejemplo.com/imagen.jpg"
                  />
                </div>
                
                <div>
                  <Label htmlFor="link">Enlace</Label>
                  <Input
                    id="link"
                    value={formData.content.link}
                    onChange={(e) => setFormData({
                      ...formData, 
                      content: {...formData.content, link: e.target.value}
                    })}
                    placeholder="https://ejemplo.com"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="backgroundColor">Color de Fondo</Label>
                    <Input
                      id="backgroundColor"
                      type="color"
                      value={formData.content.backgroundColor}
                      onChange={(e) => setFormData({
                        ...formData, 
                        content: {...formData.content, backgroundColor: e.target.value}
                      })}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="textColor">Color de Texto</Label>
                    <Input
                      id="textColor"
                      type="color"
                      value={formData.content.textColor}
                      onChange={(e) => setFormData({
                        ...formData, 
                        content: {...formData.content, textColor: e.target.value}
                      })}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Responsive Settings */}
            <div>
              <Label>Dispositivos</Label>
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="desktop"
                    checked={formData.displaySettings.responsive.desktop}
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      displaySettings: {
                        ...formData.displaySettings,
                        responsive: {
                          ...formData.displaySettings.responsive,
                          desktop: checked
                        }
                      }
                    })}
                  />
                  <Label htmlFor="desktop" className="flex items-center gap-1">
                    <Monitor className="h-4 w-4" />
                    Desktop
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="tablet"
                    checked={formData.displaySettings.responsive.tablet}
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      displaySettings: {
                        ...formData.displaySettings,
                        responsive: {
                          ...formData.displaySettings.responsive,
                          tablet: checked
                        }
                      }
                    })}
                  />
                  <Label htmlFor="tablet" className="flex items-center gap-1">
                    <Tablet className="h-4 w-4" />
                    Tablet
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="mobile"
                    checked={formData.displaySettings.responsive.mobile}
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      displaySettings: {
                        ...formData.displaySettings,
                        responsive: {
                          ...formData.displaySettings.responsive,
                          mobile: checked
                        }
                      }
                    })}
                  />
                  <Label htmlFor="mobile" className="flex items-center gap-1">
                    <Smartphone className="h-4 w-4" />
                    Móvil
                  </Label>
                </div>
              </div>
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
                  'Crear Contenido'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewDialog} onOpenChange={setPreviewDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Vista Previa: {selectedContent?.title}</DialogTitle>
            <DialogDescription>
              Previsualización del contenido como aparecerá en la página principal
            </DialogDescription>
          </DialogHeader>
          
          {selectedContent && (
            <div className="space-y-4">
              <div className="p-4 border rounded-lg bg-gray-50">
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-2">
                    {selectedContent.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {selectedContent.description}
                  </p>
                  
                  {selectedContent.content.image && (
                    <div className="mt-4">
                      <div className="relative mx-auto rounded overflow-hidden" style={{ width: '100%', maxWidth: 800 }}>
                        <div className="relative" style={{ width: '100%', height: 'auto' }}>
                          <Image
                            src={selectedContent.content.image}
                            alt={selectedContent.title}
                            width={1200}
                            height={600}
                            className="w-full h-auto rounded"
                            sizes="(max-width: 768px) 100vw, 800px"
                            style={{
                              backgroundColor: selectedContent.content.backgroundColor,
                              color: selectedContent.content.textColor
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {selectedContent.content.link && (
                    <div className="mt-4">
                      <Button asChild>
                        <a href={selectedContent.content.link} target="_blank" rel="noopener noreferrer">
                          Ver Más
                        </a>
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Tipo:</strong> {getTypeLabel(selectedContent.type)}
                </div>
                <div>
                  <strong>Posición:</strong> {selectedContent.position}
                </div>
                <div>
                  <strong>Tamaño:</strong> {selectedContent.content.size}
                </div>
                <div>
                  <strong>Audiencia:</strong> {selectedContent.content.targetAudience}
                </div>
              </div>
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
