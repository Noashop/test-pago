'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, DollarSign, Package } from 'lucide-react'

interface ProfitMarginDisplayProps {
  product: {
    name: string
    salePrice: number
    recommendedResalePrice: number
    costPrice: number
    profitMargin: number
  }
  quantity: number
  onClose: () => void
}

export default function ProfitMarginDisplay({ product, quantity, onClose }: ProfitMarginDisplayProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(onClose, 300) // Wait for animation to complete
    }, 5000) // Auto-hide after 5 seconds

    return () => clearTimeout(timer)
  }, [onClose])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount)
  }

  const totalProfitMargin = product.profitMargin * quantity
  const totalRecommendedRevenue = product.recommendedResalePrice * quantity
  const totalCost = product.costPrice * quantity

  return (
    <div className={`fixed top-4 right-4 z-50 transition-all duration-300 ${
      isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'
    }`}>
      <Card className="w-96 shadow-lg border-green-200 bg-green-50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg text-green-800 flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              ¡Oportunidad de Ganancia!
            </CardTitle>
            <Badge variant="outline" className="bg-green-100 text-green-800">
              Nuevo
            </Badge>
          </div>
          <CardDescription className="text-green-700">
            Producto agregado al carrito
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Product Info */}
          <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
            <Package className="h-8 w-8 text-blue-600" />
            <div className="flex-1">
              <h4 className="font-medium text-gray-900">{product.name}</h4>
              <p className="text-sm text-gray-600">Cantidad: {quantity}</p>
            </div>
          </div>

          {/* Profit Analysis */}
          <div className="space-y-3">
            <div className="flex justify-between items-center p-2 bg-blue-50 rounded">
              <span className="text-sm font-medium text-blue-800">Precio de Compra:</span>
              <span className="font-semibold text-blue-900">
                {formatCurrency(product.salePrice * quantity)}
              </span>
            </div>

            <div className="flex justify-between items-center p-2 bg-green-50 rounded">
              <span className="text-sm font-medium text-green-800">Precio Recomendado de Reventa:</span>
              <span className="font-semibold text-green-900">
                {formatCurrency(totalRecommendedRevenue)}
              </span>
            </div>

            <div className="flex justify-between items-center p-2 bg-purple-50 rounded">
              <span className="text-sm font-medium text-purple-800">Margen de Ganancia Potencial:</span>
              <span className="font-semibold text-purple-900">
                {formatCurrency(totalProfitMargin)}
              </span>
            </div>
          </div>

          {/* Profit Percentage */}
          <div className="text-center p-3 bg-gradient-to-r from-green-100 to-blue-100 rounded-lg">
            <div className="flex items-center justify-center gap-2 mb-1">
              <DollarSign className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">Porcentaje de Ganancia:</span>
            </div>
            <span className="text-2xl font-bold text-green-900">
              {((product.profitMargin / product.costPrice) * 100).toFixed(1)}%
            </span>
          </div>

          {/* Tips */}
          <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded">
            <p className="font-medium mb-1">💡 Consejo:</p>
            <p>
              Este producto puede generar un margen de ganancia mínimo de{' '}
              <span className="font-semibold text-green-700">
                {formatCurrency(totalProfitMargin)}
              </span>{' '}
              si lo vendes al precio recomendado de reventa.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 