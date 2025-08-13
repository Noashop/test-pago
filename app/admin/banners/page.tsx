'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import NextImage from 'next/image'
import { 
  Image as ImageIcon, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff,
  Calendar,
  Target,
  BarChart3,
  Loader2
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface Banner {
  _id: string
  title: string
  description: string
  imageUrl: string
  linkUrl?: string
  position: string
  isActive: boolean
  startDate: string
  endDate?: string
  priority: number
  targetAudience: string
  clicks: number
  impressions: number
  createdAt: string
}

export default function AdminBannersPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [banners, setBanners] = useState<Banner[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    imageUrl: '',
    linkUrl: '',
    position: 'hero',
    isActive: true,
    startDate: '',
    endDate: '',
    priority: 1,
    targetAudience: 'all'
  })

  const fetchBanners = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/banners', {
        method: 'GET',
        cache: 'no-store',
        credentials: 'include',
      })
      const data = await response.json()

      if (response.ok) {
        setBanners(data.banners)
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('Error fetching banners:', error)
      toast({
        title: "Error",
        description: "Error al cargar banners",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (session?.user?.role !== 'admin') {
      router.push('/auth/login')
      return
    }
    fetchBanners()
  }, [session, router, fetchBanners])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = editingBanner ? `/api/admin/banners/${editingBanner._id}` : '/api/admin/banners'
      const method = editingBanner ? 'PUT' : 'POST'
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        cache: 'no-store',
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Éxito",
          description: editingBanner ? "Banner actualizado" : "Banner creado",
        })
        setIsDialogOpen(false)
        setEditingBanner(null)
        resetForm()
        fetchBanners()
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('Error saving banner:', error)
      toast({
        title: "Error",
        description: "Error al guardar banner",
        variant: "destructive"
      })
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      imageUrl: '',
      linkUrl: '',
      position: 'hero',
      isActive: true,
      startDate: '',
      endDate: '',
      priority: 1,
      targetAudience: 'all'
    })
  }

  const handleEdit = (banner: Banner) => {
    setEditingBanner(banner)
    setFormData({
      title: banner.title,
      description: banner.description,
      imageUrl: banner.imageUrl,
      linkUrl: banner.linkUrl || '',
      position: banner.position,
      isActive: banner.isActive,
      startDate: banner.startDate.split('T')[0],
      endDate: banner.endDate ? banner.endDate.split('T')[0] : '',
      priority: banner.priority,
      targetAudience: banner.targetAudience
    })
    setIsDialogOpen(true)
  }

  const getPositionBadge = (position: string) => {
    const colors = {
      hero: 'bg-blue-100 text-blue-800',
      sidebar: 'bg-green-100 text-green-800',
      footer: 'bg-purple-100 text-purple-800',
      popup: 'bg-orange-100 text-orange-800'
    }
    return <Badge className={colors[position as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>{position}</Badge>
  }

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? 
      <Badge className="bg-green-100 text-green-800">Activo</Badge> : 
      <Badge variant="secondary">Inactivo</Badge>
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Gestión de Banners
        </h1>
        <p className="text-gray-600">
          Administra banners publicitarios de la plataforma
        </p>
      </div>

      {/* Create Banner Button */}
      <div className="mb-6">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingBanner(null)
              resetForm()
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Crear Banner
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingBanner ? 'Editar Banner' : 'Crear Nuevo Banner'}
              </DialogTitle>
              <DialogDescription>
                Configura los detalles del banner publicitario
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Título</label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="Título del banner"
                    required
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Posición</label>
                  <Select value={formData.position} onValueChange={(value) => setFormData({...formData, position: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hero">Hero (Principal)</SelectItem>
                      <SelectItem value="sidebar">Sidebar</SelectItem>
                      <SelectItem value="footer">Footer</SelectItem>
                      <SelectItem value="popup">Popup</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Descripción</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Descripción del banner"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">URL de la imagen</label>
                  <Input
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
                    placeholder="https://ejemplo.com/imagen.jpg"
                    required
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">URL de enlace (opcional)</label>
                  <Input
                    value={formData.linkUrl}
                    onChange={(e) => setFormData({...formData, linkUrl: e.target.value})}
                    placeholder="https://ejemplo.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Fecha de inicio</label>
                  <Input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                    required
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Fecha de fin (opcional)</label>
                  <Input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Prioridad</label>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    value={formData.priority}
                    onChange={(e) => setFormData({...formData, priority: parseInt(e.target.value)})}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Audiencia objetivo</label>
                  <Select value={formData.targetAudience} onValueChange={(value) => setFormData({...formData, targetAudience: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="clients">Solo Clientes</SelectItem>
                      <SelectItem value="suppliers">Solo Proveedores</SelectItem>
                      <SelectItem value="admin">Solo Administradores</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                    className="rounded"
                  />
                  <label htmlFor="isActive" className="text-sm font-medium">
                    Banner activo
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingBanner ? 'Actualizar' : 'Crear'} Banner
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Banners List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {banners.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="text-center py-8">
              <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" aria-hidden="true" />
              <p className="text-gray-600">No hay banners creados</p>
            </CardContent>
          </Card>
        ) : (
          banners.map((banner) => (
            <Card key={banner._id} className="overflow-hidden">
              <div className="aspect-video bg-gray-100 relative">
                <NextImage
                  src={banner.imageUrl}
                  alt={banner.title || 'Banner'}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover"
                />
                <div className="absolute top-2 right-2 flex gap-1">
                  {getPositionBadge(banner.position)}
                  {getStatusBadge(banner.isActive)}
                </div>
              </div>
              
              <CardHeader>
                <CardTitle className="text-lg">{banner.title}</CardTitle>
                <CardDescription>{banner.description}</CardDescription>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Prioridad:</span>
                    <span className="font-medium">{banner.priority}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Audiencia:</span>
                    <Badge variant="outline">{banner.targetAudience}</Badge>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Clicks:</span>
                    <span className="font-medium">{banner.clicks}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Impresiones:</span>
                    <span className="font-medium">{banner.impressions}</span>
                  </div>
                  
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(banner)}>
                      <Edit className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                    <Button variant="outline" size="sm">
                      <BarChart3 className="h-4 w-4 mr-1" />
                      Estadísticas
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
} 