'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { X, TrendingUp, DollarSign, Calculator, Sparkles, Package } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'

interface Product {
  _id: string
  name: string
  images: string[]
  salePrice: number
  recommendedResalePrice: number
}

interface ResaleIncentiveToastProps {
  product: Product
  quantity: number
  isVisible: boolean
  onClose: () => void
  duration?: number
}

// Lista de mensajes rotativos para incentivar la compra
const INCENTIVE_MESSAGES = [
  "💰 ¡Oportunidad de negocio! Con la reventa de este producto puedes ganar",
  "🚀 ¡Maximiza tus ganancias! Este producto tiene un potencial de ganancia de",
  "💎 ¡Excelente margen! Revendiendo este producto obtienes hasta",
  "⭐ ¡Gran oportunidad! Tu ganancia potencial por unidad es de",
  "🎯 ¡Perfecto para revender! Cada unidad te puede generar",
  "💸 ¡Rentabilidad asegurada! Con este producto ganas hasta",
  "🔥 ¡No te lo pierdas! Margen de ganancia por unidad:",
  "✨ ¡Inversión inteligente! Beneficio estimado por producto:",
  "📈 ¡Aumenta tus ingresos! Ganancia potencial de",
  "🎉 ¡Oportunidad única! Cada venta te deja una ganancia de"
]

export function ResaleIncentiveToast({ 
  product, 
  quantity, 
  isVisible, 
  onClose, 
  duration = 8000 
}: ResaleIncentiveToastProps) {
  const [messageIndex, setMessageIndex] = useState(0)
  const [isClosing, setIsClosing] = useState(false)

  // Calcular ganancias
  const unitProfit = product.recommendedResalePrice - product.salePrice
  const totalProfit = unitProfit * quantity
  const profitPercentage = ((unitProfit / product.salePrice) * 100).toFixed(1)

  // Seleccionar mensaje aleatorio al montar el componente
  useEffect(() => {
    if (isVisible) {
      const randomIndex = Math.floor(Math.random() * INCENTIVE_MESSAGES.length)
      setMessageIndex(randomIndex)
      setIsClosing(false)
    }
  }, [isVisible, product._id])

  const handleClose = useCallback(() => {
    setIsClosing(true)
    setTimeout(() => {
      onClose()
    }, 300) // Tiempo de animación de salida
  }, [onClose])

  // Auto-close timer
  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(() => {
        handleClose()
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [isVisible, duration, handleClose])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount)
  }

  if (!isVisible) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ 
          opacity: isClosing ? 0 : 1, 
          y: isClosing ? 50 : 0, 
          scale: isClosing ? 0.9 : 1 
        }}
        exit={{ opacity: 0, y: 50, scale: 0.9 }}
        transition={{ 
          type: "spring", 
          stiffness: 300, 
          damping: 30,
          duration: 0.3
        }}
        className="fixed bottom-4 right-4 z-50 max-w-sm w-full"
      >
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 shadow-xl">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                {/* Imagen circular del producto */}
                <div className="relative">
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-green-200 bg-white">
                    {product.images && product.images.length > 0 ? (
                      <div className="relative w-12 h-12">
                        <Image
                          src={product.images[0]}
                          alt={product.name}
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                        <Package className="h-6 w-6 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="absolute -top-1 -right-1">
                    <Badge className="bg-green-500 text-white text-xs px-1 py-0 h-5">
                      +{quantity}
                    </Badge>
                  </div>
                </div>
                
                <div className="flex-1">
                  <h4 className="font-semibold text-sm text-gray-900 line-clamp-1">
                    {product.name}
                  </h4>
                  <p className="text-xs text-gray-600">
                    Agregado al carrito
                  </p>
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Mensaje de incentivo */}
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <Sparkles className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-700 leading-relaxed">
                  {INCENTIVE_MESSAGES[messageIndex]}
                </p>
              </div>

              {/* Información de ganancias */}
              <div className="bg-white rounded-lg p-3 border border-green-100">
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div>
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <DollarSign className="h-3 w-3 text-green-600" />
                      <span className="text-xs font-medium text-gray-600">Por Unidad</span>
                    </div>
                    <p className="font-bold text-green-700">
                      {formatCurrency(unitProfit)}
                    </p>
                    <p className="text-xs text-green-600">
                      +{profitPercentage}%
                    </p>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <TrendingUp className="h-3 w-3 text-green-600" />
                      <span className="text-xs font-medium text-gray-600">Total</span>
                    </div>
                    <p className="font-bold text-green-700">
                      {formatCurrency(totalProfit)}
                    </p>
                    <p className="text-xs text-green-600">
                      {quantity} {quantity === 1 ? 'unidad' : 'unidades'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Desglose de precios */}
              <div className="text-xs text-gray-500 space-y-1">
                <div className="flex justify-between">
                  <span>Precio de compra:</span>
                  <span>{formatCurrency(product.salePrice)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Precio recomendado:</span>
                  <span>{formatCurrency(product.recommendedResalePrice)}</span>
                </div>
                <div className="flex justify-between font-medium text-green-700 border-t border-green-100 pt-1">
                  <span>Ganancia por unidad:</span>
                  <span>{formatCurrency(unitProfit)}</span>
                </div>
              </div>

              {/* Call to action */}
              <div className="flex items-center justify-between pt-2 border-t border-green-100">
                <div className="flex items-center gap-1">
                  <Calculator className="h-3 w-3 text-green-600" />
                  <span className="text-xs text-green-700 font-medium">
                    ¡Excelente oportunidad!
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleClose}
                  className="text-xs h-6 px-2 border-green-200 text-green-700 hover:bg-green-50"
                >
                  Entendido
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  )
}

// Hook para usar el sistema de incentivos de reventa
export function useResaleIncentive() {
  const [incentiveData, setIncentiveData] = useState<{
    product: Product
    quantity: number
    isVisible: boolean
  } | null>(null)

  const showIncentive = (data: any) => {
    // Convertir datos del cart store al formato esperado por el componente
    const product: Product = {
      _id: data.productId || Math.random().toString(),
      name: data.productName,
      images: [data.productImage],
      salePrice: data.salePrice,
      recommendedResalePrice: data.recommendedPrice
    }

    // Solo mostrar si hay ganancia potencial
    if (!data.recommendedPrice || data.recommendedPrice <= data.salePrice) {
      return
    }

    setIncentiveData({
      product,
      quantity: data.quantity,
      isVisible: true
    })
  }

  const hideIncentive = () => {
    setIncentiveData(prev => prev ? { ...prev, isVisible: false } : null)
    
    // Limpiar después de la animación
    setTimeout(() => {
      setIncentiveData(null)
    }, 300)
  }

  return {
    incentiveData,
    showIncentive,
    hideIncentive
  }
}

// Componente wrapper que renderiza el toast cuando hay datos
export function ResaleIncentiveToastWrapper() {
  const { incentiveData, hideIncentive } = useResaleIncentive()

  if (!incentiveData || !incentiveData.isVisible) {
    return null
  }

  return (
    <ResaleIncentiveToast
      product={incentiveData.product}
      quantity={incentiveData.quantity}
      isVisible={incentiveData.isVisible}
      onClose={hideIncentive}
    />
  )
}
