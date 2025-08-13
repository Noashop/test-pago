'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  ArrowLeft,
  Save,
  Loader2,
  AlertCircle,
  DollarSign,
  Package,
  ShoppingCart
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

interface FormData {
  costPrice: number
  salePrice: number
  recommendedResalePrice: number
  minOrderQuantity: number
  stock: number
}

export default function EditProductPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    costPrice: 0,
    salePrice: 0,
    recommendedResalePrice: 0,
    minOrderQuantity: 1,
    stock: 0
  })

  const fetchProduct = useCallback(async () => {
    try {
      const response = await fetch(`/api/supplier/products/${params.id}`)
      
      if (response.ok) {
        const data = await response.json()
        setProduct(data.product)
        setFormData({
          costPrice: data.product.costPrice || 0,
          salePrice: data.product.salePrice,
          recommendedResalePrice: data.product.recommendedResalePrice,
          minOrderQuantity: data.product.minOrderQuantity,
          stock: data.product.stock
        })
      } else {
        const errorData = await response.json()
        toast({
          title: "Error",
          description: errorData.error || "Error al cargar el producto",
          variant: "destructive"
        })
        router.push('/supplier/products')
      }
    } catch (error) {
      console.error('Error fetching product:', error)
      toast({
        title: "Error",
        description: "Error al cargar el producto",
        variant: "destructive"
      })
      router.push('/supplier/products')
    } finally {
      setLoading(false)
    }
  }, [params.id, router, toast])

  const handleInputChange = (field: keyof FormData, value: string) => {
    const numericValue = parseFloat(value) || 0
    setFormData(prev => ({
      ...prev,
      [field]: numericValue
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validaciones del lado del cliente
    if (formData.salePrice <= 0) {
      toast({
        title: "Error de validación",
        description: "El precio de venta debe ser mayor a 0",
        variant: "destructive"
      })
      return
    }

    if (formData.recommendedResalePrice <= 0) {
      toast({
        title: "Error de validación",
        description: "El precio recomendado para reventa debe ser mayor a 0",
        variant: "destructive"
      })
      return
    }

    if (formData.minOrderQuantity < 1) {
      toast({
        title: "Error de validación",
        description: "La cantidad mínima de compra debe ser al menos 1",
        variant: "destructive"
      })
      return
    }

    if (formData.stock < 0) {
      toast({
        title: "Error de validación",
        description: "Las unidades disponibles no pueden ser negativas",
        variant: "destructive"
      })
      return
    }

    setSaving(true)

    try {
      const response = await fetch(`/api/supplier/products/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Producto actualizado",
          description: product?.approvalStatus === 'approved' 
            ? "El producto ha sido actualizado y enviado para revisión nuevamente"
            : "El producto ha sido actualizado exitosamente",
        })
        router.push('/supplier/products')
      } else {
        toast({
          title: "Error",
          description: data.error || "Error al actualizar el producto",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error updating product:', error)
      toast({
        title: "Error",
        description: "Error al actualizar el producto",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Producto no encontrado</h2>
          <Button onClick={() => router.push('/supplier/products')}>
            Volver a productos
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push('/supplier/products')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Editar Producto</h1>
          <p className="text-gray-600">Actualiza los precios y disponibilidad</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Product Info Card */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {product.name}
                <Badge 
                  variant={
                    product.approvalStatus === 'approved' ? 'default' :
                    product.approvalStatus === 'pending' ? 'secondary' : 'destructive'
                  }
                >
                  {product.approvalStatus === 'approved' ? 'Aprobado' :
                   product.approvalStatus === 'pending' ? 'Pendiente' : 'Rechazado'}
                </Badge>
              </CardTitle>
              <CardDescription>
                {product.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Categoría</Label>
                <p className="text-sm text-gray-600">{product.category} / {product.subcategory}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Tipo de Unidad</Label>
                <p className="text-sm text-gray-600">{product.unitType}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Fecha de Creación</Label>
                <p className="text-sm text-gray-600">
                  {new Date(product.createdAt).toLocaleDateString()}
                </p>
              </div>
              
              {product.approvalStatus === 'approved' && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-700">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">Importante</span>
                  </div>
                  <p className="text-sm text-blue-600 mt-1">
                    Al editar este producto aprobado, volverá a estado pendiente para revisión.
                  </p>
                </div>
              )}

              {product.rejectionReason && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 text-red-700">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">Razón de Rechazo</span>
                  </div>
                  <p className="text-sm text-red-600 mt-1">{product.rejectionReason}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Edit Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Información Editable</CardTitle>
              <CardDescription>
                Actualiza los precios, cantidades y disponibilidad del producto
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Precios */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    <h3 className="text-lg font-semibold">Precios</h3>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="costPrice">Precio de Costo</Label>
                      <Input
                        id="costPrice"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.costPrice}
                        onChange={(e) => handleInputChange('costPrice', e.target.value)}
                        placeholder="0.00"
                      />
                      <p className="text-xs text-gray-500">Opcional - Tu costo del producto</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="salePrice">Precio de Venta *</Label>
                      <Input
                        id="salePrice"
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={formData.salePrice}
                        onChange={(e) => handleInputChange('salePrice', e.target.value)}
                        placeholder="0.00"
                        required
                      />
                      <p className="text-xs text-gray-500">Precio mayorista</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="recommendedResalePrice">Precio Recomendado *</Label>
                      <Input
                        id="recommendedResalePrice"
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={formData.recommendedResalePrice}
                        onChange={(e) => handleInputChange('recommendedResalePrice', e.target.value)}
                        placeholder="0.00"
                        required
                      />
                      <p className="text-xs text-gray-500">Para reventa al público</p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Cantidades */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-blue-600" />
                    <h3 className="text-lg font-semibold">Cantidades</h3>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="minOrderQuantity">Cantidad Mínima de Compra *</Label>
                      <Input
                        id="minOrderQuantity"
                        type="number"
                        min="1"
                        value={formData.minOrderQuantity}
                        onChange={(e) => handleInputChange('minOrderQuantity', e.target.value)}
                        placeholder="1"
                        required
                      />
                      <p className="text-xs text-gray-500">
                        Mínimo: 1 {product.unitType}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="stock">Unidades Disponibles *</Label>
                      <Input
                        id="stock"
                        type="number"
                        min="0"
                        value={formData.stock}
                        onChange={(e) => handleInputChange('stock', e.target.value)}
                        placeholder="0"
                        required
                      />
                      <p className="text-xs text-gray-500">
                        Stock actual en {product.unitType}
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Resumen de Precios */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Resumen de Precios</h3>
                  <div className="grid gap-4 md:grid-cols-3 text-sm">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="font-medium text-gray-700">Precio de Costo</p>
                      <p className="text-lg font-bold text-gray-900">
                        {formatCurrency(formData.costPrice)}
                      </p>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <p className="font-medium text-green-700">Precio Mayorista</p>
                      <p className="text-lg font-bold text-green-900">
                        {formatCurrency(formData.salePrice)}
                      </p>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="font-medium text-blue-700">Precio Recomendado</p>
                      <p className="text-lg font-bold text-blue-900">
                        {formatCurrency(formData.recommendedResalePrice)}
                      </p>
                    </div>
                  </div>
                  
                  {formData.costPrice > 0 && formData.salePrice > 0 && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        <strong>Margen de ganancia:</strong> {' '}
                        {(((formData.salePrice - formData.costPrice) / formData.costPrice) * 100).toFixed(1)}%
                      </p>
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <div className="flex gap-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push('/supplier/products')}
                    disabled={saving}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={saving}
                    className="flex-1"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Guardar Cambios
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
