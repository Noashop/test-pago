'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Package, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Search,
  Eye,
  Edit,
  Trash2,
  Filter,
  Download,
  Upload
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { AdminLoader } from '@/components/ui/loaders'
import ProductApprovalModal from '@/components/admin/product-approval-modal'
import NextImage from 'next/image'

interface Product {
  _id: string
  name: string
  description: string
  category: string
  subcategory: string
  supplierName: string
  costPrice: number
  salePrice: number
  recommendedRetailPrice: number
  stock: number
  status: 'pending' | 'active' | 'inactive'
  approvalStatus: 'pending' | 'approved' | 'rejected'
  rejectionReason?: string
  images: string[]
  createdAt: string
}

export default function AdminProductsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
  const [showApprovalModal, setShowApprovalModal] = useState(false)

  const fetchProducts = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/products', {
        credentials: 'include',
        cache: 'no-store',
      })
      const data = await response.json()

      if (response.ok) {
        setProducts(data.products)
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al cargar los productos',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

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

    fetchProducts()
  }, [session, status, router, fetchProducts])

  const handleOpenApprovalModal = (productId: string) => {
    setSelectedProductId(productId)
    setShowApprovalModal(true)
  }

  const handleCloseApprovalModal = () => {
    setSelectedProductId(null)
    setShowApprovalModal(false)
  }

  const handleProductApproved = () => {
    fetchProducts() // Recargar la lista después de aprobar
    toast({
      title: 'Éxito',
      description: 'Producto aprobado exitosamente',
    })
  }

  const handleReject = async (productId: string) => {
    const reason = prompt('Razón del rechazo:')
    if (!reason) return

    try {
      const response = await fetch(`/api/admin/products/${productId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        cache: 'no-store',
        body: JSON.stringify({ reason }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: 'Éxito',
          description: 'Producto rechazado exitosamente',
        })
        fetchProducts()
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al rechazar el producto',
        variant: 'destructive',
      })
    }
  }

  const handleEdit = (productId: string) => {
    // Redirigir a la página de edición
    router.push(`/admin/products/${productId}/edit`)
  }

  const handleDelete = async (productId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este producto? Esta acción no se puede deshacer.')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        cache: 'no-store',
      })

      if (response.ok) {
        toast({
          title: 'Producto eliminado',
          description: 'El producto ha sido eliminado exitosamente',
        })
        fetchProducts()
      } else {
        throw new Error('Error al eliminar el producto')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al eliminar el producto',
        variant: 'destructive',
      })
    }
  }

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.category.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFilter = filter === 'all' || 
                         (filter === 'pending' && product.approvalStatus === 'pending') ||
                         (filter === 'approved' && product.approvalStatus === 'approved') ||
                         (filter === 'rejected' && product.approvalStatus === 'rejected')

    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter

    return matchesSearch && matchesFilter && matchesCategory
  })

  if (status === 'loading' || loading) {
    return <AdminLoader />
  }

  if (!session || session.user.role !== 'admin') {
    return null
  }

  const pendingCount = products.filter(p => p.approvalStatus === 'pending').length
  const approvedCount = products.filter(p => p.approvalStatus === 'approved').length
  const rejectedCount = products.filter(p => p.approvalStatus === 'rejected').length

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Gestión de Productos
          </h1>
          <p className="text-muted-foreground">
            Aprueba y gestiona los productos de los proveedores
          </p>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{products.length}</div>
              <p className="text-xs text-muted-foreground">
                Productos registrados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingCount}</div>
              <p className="text-xs text-muted-foreground">
                Esperando aprobación
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aprobados</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{approvedCount}</div>
              <p className="text-xs text-muted-foreground">
                Productos activos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rechazados</CardTitle>
              <XCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{rejectedCount}</div>
              <p className="text-xs text-muted-foreground">
                Productos rechazados
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filtros y búsqueda */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              onClick={() => setFilter('all')}
            >
              Todos
            </Button>
            <Button
              variant={filter === 'pending' ? 'default' : 'outline'}
              onClick={() => setFilter('pending')}
            >
              Pendientes
            </Button>
            <Button
              variant={filter === 'approved' ? 'default' : 'outline'}
              onClick={() => setFilter('approved')}
            >
              Aprobados
            </Button>
            <Button
              variant={filter === 'rejected' ? 'default' : 'outline'}
              onClick={() => setFilter('rejected')}
            >
              Rechazados
            </Button>
          </div>
        </div>

        {/* Lista de productos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredProducts.map((product) => (
            <Card key={product._id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <Package className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{product.name}</CardTitle>
                      <CardDescription>{product.supplierName}</CardDescription>
                    </div>
                  </div>
                  <Badge 
                    variant={
                      product.approvalStatus === 'approved' ? 'default' : 
                      product.approvalStatus === 'rejected' ? 'destructive' : 'secondary'
                    }
                  >
                    {product.approvalStatus === 'approved' ? 'Aprobado' : 
                     product.approvalStatus === 'rejected' ? 'Rechazado' : 'Pendiente'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Información del producto */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Categoría:</span>
                    <span className="text-sm">{product.category} - {product.subcategory}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Precio Mayorista:</span>
                    <span className="text-sm">${product.salePrice}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Stock:</span>
                    <span className="text-sm">{product.stock} unidades</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Precio Sugerido:</span>
                    <span className="text-sm">${product.recommendedRetailPrice}</span>
                  </div>
                </div>

                {/* Imágenes */}
                {product.images && product.images.length > 0 && (
                  <div className="flex gap-2">
                    {product.images.slice(0, 3).map((image, index) => (
                      <div key={index} className="relative w-16 h-16">
                        <NextImage
                          src={image}
                          alt={`Producto ${index + 1}`}
                          fill
                          sizes="64px"
                          className="object-cover rounded border"
                        />
                      </div>
                    ))}
                    {product.images.length > 3 && (
                      <div className="w-16 h-16 bg-gray-100 rounded border flex items-center justify-center text-xs text-gray-500">
                        +{product.images.length - 3}
                      </div>
                    )}
                  </div>
                )}

                {/* Fecha de registro */}
                <div className="text-xs text-muted-foreground">
                  Registrado: {new Date(product.createdAt).toLocaleDateString('es-AR')}
                </div>

                {product.rejectionReason && (
                  <div className="text-xs text-destructive">
                    Rechazado: {product.rejectionReason}
                  </div>
                )}

                {/* Acciones */}
                <div className="flex gap-2 pt-4">
                  {product.approvalStatus === 'pending' && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenApprovalModal(product._id)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Ver y Aprobar
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleReject(product._id)}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Rechazar
                      </Button>
                    </>
                  )}
                  
                  {product.approvalStatus === 'approved' && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(product._id)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(product._id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Eliminar
                      </Button>
                    </>
                  )}
                  
                  {product.approvalStatus === 'rejected' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        toast({
                          title: 'Información',
                          description: `Producto rechazado: ${product.rejectionReason}`,
                        })
                      }}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Ver Detalles
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">
              No se encontraron productos
            </h3>
            <p className="text-muted-foreground">
              {searchTerm ? 'Intenta con otros términos de búsqueda' : 'No hay productos que coincidan con los filtros'}
            </p>
          </div>
        )}
      </div>
      
      {/* Modal de Aprobación */}
      {selectedProductId && (
        <ProductApprovalModal
          productId={selectedProductId}
          isOpen={showApprovalModal}
          onClose={handleCloseApprovalModal}
          onApproved={handleProductApproved}
        />
      )}
    </div>
  )
} 