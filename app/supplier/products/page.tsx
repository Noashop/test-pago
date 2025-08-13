'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Plus, 
  Package, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Loader2,
  AlertCircle,
  Edit,
  Trash2,
  Eye,
  AlertTriangle
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Product {
  _id: string
  name: string
  description: string
  category: string
  subcategory: string
  salePrice: number
  recommendedResalePrice: number
  costPrice?: number
  stock: number
  minOrderQuantity: number
  unitType: string
  images: string[]
  status: 'active' | 'inactive'
  approvalStatus: 'pending' | 'approved' | 'rejected'
  rejectionReason?: string
  createdAt: string
}

export default function SupplierProductsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  
  // Definir primero el callback para evitar "used before declaration"
  const fetchProducts = useCallback(async () => {
    try {
      const response = await fetch('/api/supplier/products')
      if (response.ok) {
        const data = await response.json()
        setProducts(data.products)
      } else {
        const errorData = await response.json()
        if (response.status === 403 && errorData.error.includes('aprobada')) {
          toast({
            title: 'Acceso Restringido',
            description: 'Tu cuenta debe estar aprobada para gestionar productos',
            variant: 'destructive'
          })
          router.push('/supplier')
          return
        }
        throw new Error(errorData.error || 'Error al cargar productos')
      }
    } catch (error) {
      console.error('Error fetching products:', error)
      toast({
        title: "Error",
        description: "Error al cargar productos",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [router, toast])

  useEffect(() => {
    if (!session?.user) {
      router.push('/auth/login')
      return
    }
    
    if (session.user.role !== 'supplier') {
      router.push('/')
      return
    }

    // Verificar si el proveedor está aprobado
    if (session.user.isApproved !== true) {
      toast({
        title: 'Acceso Restringido',
        description: 'Tu cuenta debe estar aprobada para gestionar productos',
        variant: 'destructive'
      })
      router.push('/supplier')
      return
    }

    fetchProducts()
  }, [session, router, toast, fetchProducts])

  const handleEdit = (productId: string) => {
    router.push(`/supplier/products/${productId}/edit`)
  }

  const handleDelete = async (productId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este producto? Esta acción no se puede deshacer.')) {
      return
    }

    try {
      const response = await fetch(`/api/supplier/products/${productId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
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

  const handleResubmit = async (productId: string) => {
    try {
      const response = await fetch(`/api/supplier/products/${productId}/resubmit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (response.ok) {
        toast({
          title: 'Producto reenviado',
          description: 'El producto ha sido enviado para revisión nuevamente',
        })
        fetchProducts()
      } else {
        throw new Error('Error al reenviar el producto')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al reenviar el producto',
        variant: 'destructive',
      })
    }
  }

  const pendingProducts = products.filter(p => p.approvalStatus === 'pending')
  const approvedProducts = products.filter(p => p.approvalStatus === 'approved')
  const rejectedProducts = products.filter(p => p.approvalStatus === 'rejected')

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Mis Productos
            </h1>
            <p className="text-gray-600">
              Gestiona tus productos en la plataforma
            </p>
          </div>
          <Button onClick={() => router.push('/supplier/products/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Agregar Producto
          </Button>
        </div>
      </div>

      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Pendientes ({pendingProducts.length})
          </TabsTrigger>
          <TabsTrigger value="approved" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Aprobados ({approvedProducts.length})
          </TabsTrigger>
          <TabsTrigger value="rejected" className="flex items-center gap-2">
            <XCircle className="h-4 w-4" />
            Rechazados ({rejectedProducts.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingProducts.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No hay productos pendientes de aprobación</p>
                <Button 
                  onClick={() => router.push('/supplier/products/new')}
                  className="mt-4"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Primer Producto
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {pendingProducts.map((product) => (
                <Card key={product._id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2">
                          {product.name}
                          <Badge variant="secondary">Pendiente</Badge>
                        </CardTitle>
                        <CardDescription>
                          {product.description}
                        </CardDescription>
                        <div className="mt-2 flex items-center gap-4 text-sm">
                          <span>Stock: {product.stock} {product.unitType}</span>
                          <span>Mínimo: {product.minOrderQuantity} {product.unitType}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Precio Mayorista</p>
                        <p className="text-lg font-bold">${product.salePrice}</p>
                        {product.costPrice && (
                          <>
                            <p className="text-sm text-gray-600">Precio de Costo</p>
                            <p className="text-sm font-semibold">${product.costPrice}</p>
                          </>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
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
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="approved" className="space-y-4">
          {approvedProducts.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No hay productos aprobados</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {approvedProducts.map((product) => (
                <Card key={product._id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2">
                          {product.name}
                          <Badge variant="default" className="bg-green-600">Aprobado</Badge>
                          {product.stock <= 10 && (
                            <Badge variant="destructive" className="flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              Stock Bajo
                            </Badge>
                          )}
                        </CardTitle>
                        <CardDescription>
                          {product.description}
                        </CardDescription>
                        <div className="mt-2 flex items-center gap-4 text-sm">
                          <span className={product.stock <= 10 ? 'text-red-600 font-semibold' : ''}>
                            Stock: {product.stock} {product.unitType}
                          </span>
                          <span>Mínimo: {product.minOrderQuantity} {product.unitType}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Precio Mayorista</p>
                        <p className="text-lg font-bold">${product.salePrice}</p>
                        {product.costPrice && (
                          <>
                            <p className="text-sm text-gray-600">Precio de Costo</p>
                            <p className="text-sm font-semibold">${product.costPrice}</p>
                            <p className="text-xs text-green-600">
                              Ganancia: ${product.salePrice - product.costPrice}
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
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
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="rejected" className="space-y-4">
          {rejectedProducts.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <XCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No hay productos rechazados</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {rejectedProducts.map((product) => (
                <Card key={product._id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2">
                          {product.name}
                          <Badge variant="destructive">Rechazado</Badge>
                        </CardTitle>
                        <CardDescription>
                          {product.description}
                        </CardDescription>
                        <div className="mt-2 flex items-center gap-4 text-sm">
                          <span>Stock: {product.stock} {product.unitType}</span>
                          <span>Mínimo: {product.minOrderQuantity} {product.unitType}</span>
                        </div>
                        {product.rejectionReason && (
                          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                            <p className="text-sm text-red-700">
                              <AlertCircle className="h-4 w-4 inline mr-1" />
                              Razón: {product.rejectionReason}
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Precio Mayorista</p>
                        <p className="text-lg font-bold">${product.salePrice}</p>
                        {product.costPrice && (
                          <>
                            <p className="text-sm text-gray-600">Precio de Costo</p>
                            <p className="text-sm font-semibold">${product.costPrice}</p>
                          </>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
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
                        variant="secondary"
                        onClick={() => handleResubmit(product._id)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Reenviar
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(product._id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Eliminar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
} 