'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { Loader2, DollarSign, TrendingUp, Calculator, CheckCircle, XCircle, Eye } from 'lucide-react'

interface ProductDetail {
  id: string
  name: string
  description: string
  shortDescription?: string
  category: string
  subcategory: string
  images: string[]
  costPrice: number
  supplierSalePrice: number
  supplierRecommendedPrice: number
  minimumPurchaseQuantity: number
  availableQuantity: number
  warranty: string
  supplier: {
    name: string
    email: string
    businessName?: string
  }
  supplierName: string
  status: string
  approvalStatus: string
  createdAt: string
  specificFields?: any
  metrics: {
    suggestedMinSalePrice: number
    suggestedSalePrice: number
    suggestedRetailPrice: number
  }
}

interface ProductApprovalModalProps {
  productId: string
  isOpen: boolean
  onClose: () => void
  onApproved: () => void
}

export default function ProductApprovalModal({ 
  productId, 
  isOpen, 
  onClose, 
  onApproved 
}: ProductApprovalModalProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [approving, setApproving] = useState(false)
  const [product, setProduct] = useState<ProductDetail | null>(null)
  
  // Formulario de aprobación
  const [adminSalePrice, setAdminSalePrice] = useState('')
  const [adminRecommendedRetailPrice, setAdminRecommendedRetailPrice] = useState('')
  const [notes, setNotes] = useState('')
  
  // Cálculos en tiempo real
  const [calculations, setCalculations] = useState({
    adminProfitMargin: 0,
    adminProfitPercentage: 0,
    customerPotentialProfit: 0,
    customerProfitPercentage: 0,
    isValidPricing: false
  })

  const fetchProductDetail = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/products/${productId}/detail`)
      const data = await response.json()
      
      if (response.ok) {
        setProduct(data.product)
        // Inicializar con precios sugeridos
        setAdminSalePrice(data.product.metrics.suggestedSalePrice.toString())
        setAdminRecommendedRetailPrice(data.product.metrics.suggestedRetailPrice.toString())
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Error al cargar el producto',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error de conexión',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }, [productId, toast])

  useEffect(() => {
    if (isOpen && productId) {
      fetchProductDetail()
    }
  }, [isOpen, productId, fetchProductDetail])

  const calculateProfits = useCallback(() => {
    if (!product || !adminSalePrice || !adminRecommendedRetailPrice) {
      setCalculations({
        adminProfitMargin: 0,
        adminProfitPercentage: 0,
        customerPotentialProfit: 0,
        customerProfitPercentage: 0,
        isValidPricing: false
      })
      return
    }

    const salePrice = parseFloat(adminSalePrice)
    const retailPrice = parseFloat(adminRecommendedRetailPrice)
    const costPrice = product.costPrice

    if (salePrice <= 0 || retailPrice <= 0) {
      setCalculations(prev => ({ ...prev, isValidPricing: false }))
      return
    }

    // Validar que el precio de venta sea mayor al costo
    if (salePrice <= costPrice) {
      setCalculations(prev => ({ ...prev, isValidPricing: false }))
      return
    }

    // Calcular ganancias del admin
    const adminProfitMargin = salePrice - costPrice
    const adminProfitPercentage = (adminProfitMargin / costPrice) * 100

    // Calcular ganancia potencial del cliente
    const customerPotentialProfit = retailPrice - salePrice
    const customerProfitPercentage = (customerPotentialProfit / salePrice) * 100

    setCalculations({
      adminProfitMargin,
      adminProfitPercentage,
      customerPotentialProfit,
      customerProfitPercentage,
      isValidPricing: true
    })
  }, [product, adminSalePrice, adminRecommendedRetailPrice])

  useEffect(() => {
    calculateProfits()
  }, [calculateProfits])

  const handleApprove = async () => {
    if (!calculations.isValidPricing) {
      toast({
        title: 'Error',
        description: 'Por favor verifica los precios ingresados',
        variant: 'destructive'
      })
      return
    }

    setApproving(true)
    try {
      const response = await fetch(`/api/admin/products/${productId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          adminSalePrice: parseFloat(adminSalePrice),
          adminRecommendedRetailPrice: parseFloat(adminRecommendedRetailPrice),
          notes
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: 'Éxito',
          description: 'Producto aprobado exitosamente',
        })
        onApproved()
        onClose()
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Error al aprobar el producto',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error de conexión',
        variant: 'destructive'
      })
    } finally {
      setApproving(false)
    }
  }

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Cargando Producto</DialogTitle>
            <DialogDescription>
              Obteniendo detalles del producto para aprobación
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Cargando producto...</span>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (!product) {
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Aprobar Producto
          </DialogTitle>
          <DialogDescription>
            Revisa los detalles del producto y establece los precios de venta
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Información del Producto */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{product.name}</CardTitle>
                <CardDescription>
                  {product.category} - {product.subcategory}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Imágenes */}
                {product.images.length > 0 && (
                  <div className="grid grid-cols-2 gap-2">
                    {product.images.slice(0, 4).map((image, index) => (
                      <div key={index} className="relative w-full h-24 rounded-md overflow-hidden">
                        <Image
                          src={image}
                          alt={`${product.name} ${index + 1}`}
                          fill
                          sizes="(max-width: 768px) 50vw, 25vw"
                          className="object-cover"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Descripción */}
                <div>
                  <Label className="text-sm font-medium">Descripción Completa</Label>
                  <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">
                    {product.description}
                  </p>
                </div>

                {/* Descripción Corta */}
                {product.shortDescription && (
                  <div>
                    <Label className="text-sm font-medium">Descripción Corta</Label>
                    <p className="text-sm text-gray-600 mt-1">
                      {product.shortDescription}
                    </p>
                  </div>
                )}

                {/* Información del Proveedor */}
                <div className="bg-gray-50 p-3 rounded-md">
                  <Label className="text-sm font-medium">Proveedor</Label>
                  <p className="text-sm">{product.supplier.businessName || product.supplier.name}</p>
                  <p className="text-xs text-gray-500">{product.supplier.email}</p>
                </div>

                {/* Precios y Cantidades del Proveedor */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Precio de Costo</Label>
                    <p className="text-lg font-bold text-green-600">
                      ${product.costPrice.toLocaleString('es-AR')}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Cantidad Disponible</Label>
                    <p className="text-lg font-bold">
                      {product.availableQuantity} unidades
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Cantidad Mínima de Compra</Label>
                    <p className="text-sm font-semibold text-blue-600">
                      {product.minimumPurchaseQuantity} unidades
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Garantía</Label>
                    <p className="text-sm">
                      {product.warranty || 'No especificada'}
                    </p>
                  </div>
                </div>

                {/* Precios Sugeridos por el Proveedor */}
                {(product.supplierSalePrice || product.supplierRecommendedPrice) && (
                  <div className="bg-blue-50 p-3 rounded-md">
                    <Label className="text-sm font-medium text-blue-800">Precios Sugeridos por el Proveedor</Label>
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      {product.supplierSalePrice && (
                        <div>
                          <span className="text-xs text-blue-600">Precio de Venta Sugerido:</span>
                          <p className="text-sm font-semibold">${product.supplierSalePrice.toLocaleString('es-AR')}</p>
                        </div>
                      )}
                      {product.supplierRecommendedPrice && (
                        <div>
                          <span className="text-xs text-blue-600">Precio de Reventa Sugerido:</span>
                          <p className="text-sm font-semibold">${product.supplierRecommendedPrice.toLocaleString('es-AR')}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Campos Específicos del Producto */}
                {product.specificFields && Object.keys(product.specificFields).length > 0 && (
                  <div className="bg-gray-50 p-3 rounded-md">
                    <Label className="text-sm font-medium">Información Específica del Producto</Label>
                    <div className="mt-2 space-y-2">
                      {Object.entries(product.specificFields).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-xs text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                          <span className="text-xs font-medium">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Formulario de Aprobación */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Establecer Precios
                </CardTitle>
                <CardDescription>
                  Define los precios de venta y reventa recomendado
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Precio de Venta */}
                <div>
                  <Label htmlFor="adminSalePrice">
                    Precio de Venta Público *
                  </Label>
                  <Input
                    id="adminSalePrice"
                    type="number"
                    step="0.01"
                    value={adminSalePrice}
                    onChange={(e) => setAdminSalePrice(e.target.value)}
                    placeholder="Precio que verán los clientes"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Sugerido: ${product.metrics.suggestedSalePrice.toLocaleString('es-AR')}
                  </p>
                </div>

                {/* Precio Recomendado de Reventa */}
                <div>
                  <Label htmlFor="adminRecommendedRetailPrice">
                    Precio Recomendado de Reventa *
                  </Label>
                  <Input
                    id="adminRecommendedRetailPrice"
                    type="number"
                    step="0.01"
                    value={adminRecommendedRetailPrice}
                    onChange={(e) => setAdminRecommendedRetailPrice(e.target.value)}
                    placeholder="Precio sugerido para que revendan los clientes"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Sugerido: ${product.metrics.suggestedRetailPrice.toLocaleString('es-AR')}
                  </p>
                </div>

                {/* Notas */}
                <div>
                  <Label htmlFor="notes">Notas (Opcional)</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Comentarios sobre la aprobación..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Cálculos en Tiempo Real */}
            {calculations.isValidPricing && (
              <Card className="border-green-200 bg-green-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-800">
                    <Calculator className="h-5 w-5" />
                    Cálculos de Ganancia
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Ganancia del Admin */}
                  <div className="flex justify-between items-center p-2 bg-white rounded">
                    <span className="text-sm font-medium">Tu Ganancia:</span>
                    <div className="text-right">
                      <p className="font-bold text-green-600">
                        ${calculations.adminProfitMargin.toLocaleString('es-AR')}
                      </p>
                      <p className="text-xs text-gray-500">
                        {calculations.adminProfitPercentage.toFixed(1)}% de margen
                      </p>
                    </div>
                  </div>

                  {/* Ganancia Potencial del Cliente */}
                  <div className="flex justify-between items-center p-2 bg-white rounded">
                    <span className="text-sm font-medium">Ganancia del Cliente:</span>
                    <div className="text-right">
                      <p className="font-bold text-blue-600">
                        ${calculations.customerPotentialProfit.toLocaleString('es-AR')}
                      </p>
                      <p className="text-xs text-gray-500">
                        {calculations.customerProfitPercentage.toFixed(1)}% de ganancia
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Botones de Acción */}
            <div className="flex gap-3">
              <Button
                onClick={handleApprove}
                disabled={!calculations.isValidPricing || approving}
                className="flex-1"
              >
                {approving ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                Aprobar Producto
              </Button>
              <Button variant="outline" onClick={onClose}>
                <XCircle className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
