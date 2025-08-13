'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TrendingUp, DollarSign, Calculator, X, Info } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface ProfitMessageProps {
  productId: string
  quantity: number
  onClose?: () => void
  className?: string
}

interface ProfitCalculation {
  showProfitMessage: boolean
  product?: {
    id: string
    name: string
    salePrice: number
    recommendedRetailPrice: number
  }
  profitCalculation?: {
    quantity: number
    profitPerUnit: number
    totalProfit: number
    profitPercentage: number
    costInvestment: number
    potentialRevenue: number
  }
  message?: string
}

export default function ProfitMessage({ 
  productId, 
  quantity, 
  onClose,
  className = '' 
}: ProfitMessageProps) {
  const { toast } = useToast()
  const [profitData, setProfitData] = useState<ProfitCalculation | null>(null)
  const [loading, setLoading] = useState(true)
  const [visible, setVisible] = useState(true)

  const calculateProfit = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/cart/profit-calculation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          productId,
          quantity
        })
      })

      const data = await response.json()

      if (response.ok) {
        setProfitData(data)
      } else {
        // Si hay error, no mostrar el mensaje
        setProfitData({ showProfitMessage: false })
      }
    } catch (error) {
      console.error('Error calculating profit:', error)
      setProfitData({ showProfitMessage: false })
    } finally {
      setLoading(false)
    }
  }, [productId, quantity])

  useEffect(() => {
    if (productId && quantity > 0) {
      calculateProfit()
    }
  }, [calculateProfit, productId, quantity])

  const handleClose = () => {
    setVisible(false)
    onClose?.()
  }

  // No mostrar si está cargando, no hay datos, o no debe mostrar el mensaje
  if (loading || !profitData || !profitData.showProfitMessage || !visible) {
    return null
  }

  const { product, profitCalculation, message } = profitData

  if (!product || !profitCalculation) {
    return null
  }

  return (
    <Card className={`border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 shadow-lg ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {/* Encabezado */}
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 bg-green-100 rounded-full">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-green-800">
                  ¡Oportunidad de Ganancia!
                </h3>
                <p className="text-sm text-green-600">
                  Potencial de reventa identificado
                </p>
              </div>
            </div>

            {/* Mensaje Principal */}
            <div className="bg-white p-3 rounded-lg border border-green-200 mb-3">
              <p className="text-sm font-medium text-gray-800">
                {message}
              </p>
            </div>

            {/* Detalles de la Ganancia */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div className="bg-white p-2 rounded border">
                <div className="flex items-center gap-1 mb-1">
                  <DollarSign className="h-3 w-3 text-blue-500" />
                  <span className="text-xs text-gray-500">Inversión</span>
                </div>
                <p className="font-semibold text-blue-600">
                  ${profitCalculation.costInvestment.toLocaleString('es-AR')}
                </p>
              </div>

              <div className="bg-white p-2 rounded border">
                <div className="flex items-center gap-1 mb-1">
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  <span className="text-xs text-gray-500">Ganancia</span>
                </div>
                <p className="font-semibold text-green-600">
                  ${profitCalculation.totalProfit.toLocaleString('es-AR')}
                </p>
              </div>

              <div className="bg-white p-2 rounded border">
                <div className="flex items-center gap-1 mb-1">
                  <Calculator className="h-3 w-3 text-purple-500" />
                  <span className="text-xs text-gray-500">Margen</span>
                </div>
                <p className="font-semibold text-purple-600">
                  {profitCalculation.profitPercentage}%
                </p>
              </div>

              <div className="bg-white p-2 rounded border">
                <div className="flex items-center gap-1 mb-1">
                  <DollarSign className="h-3 w-3 text-orange-500" />
                  <span className="text-xs text-gray-500">Ingresos</span>
                </div>
                <p className="font-semibold text-orange-600">
                  ${profitCalculation.potentialRevenue.toLocaleString('es-AR')}
                </p>
              </div>
            </div>

            {/* Información Adicional */}
            <div className="mt-3 flex items-start gap-2">
              <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-gray-600">
                <p className="mb-1">
                  <strong>Precio de compra:</strong> ${product.salePrice.toLocaleString('es-AR')} x {profitCalculation.quantity} unidad{profitCalculation.quantity > 1 ? 'es' : ''}
                </p>
                <p>
                  <strong>Precio recomendado de reventa:</strong> ${product.recommendedRetailPrice.toLocaleString('es-AR')} por unidad
                </p>
              </div>
            </div>
          </div>

          {/* Botón de Cerrar */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 p-1 h-auto"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Badge de Beneficio */}
        <div className="mt-3 flex justify-center">
          <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
            💰 Producto con alto potencial de reventa
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}

// Hook para usar el componente fácilmente
export function useProfitMessage() {
  const [showProfit, setShowProfit] = useState(false)
  const [profitProps, setProfitProps] = useState<{
    productId: string
    quantity: number
  } | null>(null)

  const showProfitMessage = (productId: string, quantity: number) => {
    setProfitProps({ productId, quantity })
    setShowProfit(true)
  }

  const hideProfitMessage = () => {
    setShowProfit(false)
    setProfitProps(null)
  }

  return {
    showProfit,
    profitProps,
    showProfitMessage,
    hideProfitMessage
  }
}
