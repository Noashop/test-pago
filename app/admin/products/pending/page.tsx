'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Package, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye, 
  DollarSign,
  Building2,
  Loader2,
  AlertCircle
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface Product {
  _id: string
  name: string
  description: string
  category: string
  subcategory: string
  salePrice: number
  recommendedResalePrice: number
  costPrice?: number
  images: string[]
  status: 'active' | 'inactive'
  approvalStatus: 'pending' | 'approved' | 'rejected'
  rejectionReason?: string
  supplierId: {
    _id: string
    name: string
    businessInfo: {
      businessName: string
    }
  }
  createdAt: string
}

export default function AdminPendingProductsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [processingAction, setProcessingAction] = useState<string | null>(null)
  const [costPrice, setCostPrice] = useState('')

  useEffect(() => {
    if (session?.user?.role !== 'admin') {
      router.push('/auth/login')
      return
    }
    fetchPendingProducts()
  }, [session, router])

  const fetchPendingProducts = async () => {
    try {
      const response = await fetch('/api/admin/products/pending', {
        credentials: 'include',
        cache: 'no-store',
      })
      if (response.ok) {
        const data = await response.json()
        setProducts(data.products)
      }
    } catch (error) {
      console.error('Error fetching pending products:', error)
      toast({
        title: "Error",
        description: "Error al cargar productos pendientes",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (productId: string) => {
    if (!costPrice || parseFloat(costPrice) <= 0) {
      toast({
        title: "Error",
        description: "Debe asignar un precio de costo válido",
        variant: "destructive"
      })
      return
    }

    setProcessingAction(productId)
    try {
      const response = await fetch(`/api/admin/products/${productId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        cache: 'no-store',
        body: JSON.stringify({
          costPrice: parseFloat(costPrice),
          adminId: session?.user?.id,
          adminName: session?.user?.name
        }),
      })

      if (response.ok) {
        toast({
          title: "¡Aprobado!",
          description: "El producto ha sido aprobado exitosamente",
        })
        setCostPrice('')
        setSelectedProduct(null)
        fetchPendingProducts()
      } else {
        const data = await response.json()
        toast({
          title: "Error",
          description: data.error || "Error al aprobar producto",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error de conexión",
        variant: "destructive"
      })
    } finally {
      setProcessingAction(null)
    }
  }

  const handleReject = async (productId: string) => {
    if (!rejectionReason.trim()) {
      toast({
        title: "Error",
        description: "Debe proporcionar una razón para el rechazo",
        variant: "destructive"
      })
      return
    }

    setProcessingAction(productId)
    try {
      const response = await fetch(`/api/admin/products/${productId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        cache: 'no-store',
        body: JSON.stringify({
          reason: rejectionReason,
          adminId: session?.user?.id,
          adminName: session?.user?.name
        }),
      })

      if (response.ok) {
        toast({
          title: "Rechazado",
          description: "El producto ha sido rechazado",
        })
        setRejectionReason('')
        setSelectedProduct(null)
        fetchPendingProducts()
      } else {
        const data = await response.json()
        toast({
          title: "Error",
          description: data.error || "Error al rechazar producto",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error de conexión",
        variant: "destructive"
      })
    } finally {
      setProcessingAction(null)
    }
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
          Productos Pendientes de Aprobación
        </h1>
        <p className="text-gray-600">
          Revisa y aprueba los productos enviados por los proveedores
        </p>
      </div>

      {products.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No hay productos pendientes de aprobación</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {products.map((product) => (
            <Card key={product._id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Avatar>
                      <AvatarFallback>
                        <Package className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        {product.name}
                        <Badge variant="secondary">Pendiente</Badge>
                      </CardTitle>
                      <CardDescription>
                        {product.description}
                      </CardDescription>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Building2 className="h-4 w-4" />
                          {product.supplierId.businessInfo.businessName}
                        </span>
                        <span className="flex items-center gap-1">
                          <Package className="h-4 w-4" />
                          {product.category}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="space-y-1">
                      <p className="text-sm text-gray-600">Precio Mayorista</p>
                      <p className="text-lg font-bold">${product.salePrice}</p>
                      <p className="text-sm text-gray-600">Precio Sugerido</p>
                      <p className="text-sm font-semibold">${product.recommendedResalePrice}</p>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-end gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        Ver Detalles
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Detalles del Producto</DialogTitle>
                        <DialogDescription>
                          Información completa del producto
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm font-medium">Nombre</Label>
                            <p className="text-sm text-gray-600">{product.name}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium">Categoría</Label>
                            <p className="text-sm text-gray-600">{product.category}</p>
                          </div>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Descripción</Label>
                          <p className="text-sm text-gray-600">{product.description}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm font-medium">Precio Mayorista</Label>
                            <p className="text-sm text-gray-600">${product.salePrice}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium">Precio Sugerido</Label>
                            <p className="text-sm text-gray-600">${product.recommendedResalePrice}</p>
                          </div>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Proveedor</Label>
                          <p className="text-sm text-gray-600">{product.supplierId.businessInfo.businessName}</p>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => setSelectedProduct(product)}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Aprobar
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Aprobar Producto</DialogTitle>
                        <DialogDescription>
                          Asigna el precio de costo y aprueba el producto
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="costPrice">Precio de Costo *</Label>
                          <Input
                            id="costPrice"
                            type="number"
                            step="0.01"
                            value={costPrice}
                            onChange={(e) => setCostPrice(e.target.value)}
                            placeholder="0.00"
                            required
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Este será el precio que se mostrará a los clientes mayoristas
                          </p>
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            onClick={() => {
                              setCostPrice('')
                              setSelectedProduct(null)
                            }}
                          >
                            Cancelar
                          </Button>
                          <Button
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => selectedProduct && handleApprove(selectedProduct._id)}
                            disabled={processingAction === selectedProduct?._id}
                          >
                            {processingAction === selectedProduct?._id ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                              <CheckCircle className="h-4 w-4 mr-2" />
                            )}
                            Aprobar Producto
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setSelectedProduct(product)}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Rechazar
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Rechazar Producto</DialogTitle>
                        <DialogDescription>
                          Proporciona una razón para el rechazo
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="rejectionReason">Razón del Rechazo *</Label>
                          <Textarea
                            id="rejectionReason"
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            placeholder="Explica por qué se rechaza el producto..."
                            rows={4}
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            onClick={() => {
                              setRejectionReason('')
                              setSelectedProduct(null)
                            }}
                          >
                            Cancelar
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => selectedProduct && handleReject(selectedProduct._id)}
                            disabled={processingAction === selectedProduct?._id}
                          >
                            {processingAction === selectedProduct?._id ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                              'Rechazar'
                            )}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
} 