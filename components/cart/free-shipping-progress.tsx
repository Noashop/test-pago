'use client'

import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Truck, Gift } from 'lucide-react'
import { getFreeShippingProgress, formatCurrency } from '@/lib/shipping'

interface FreeShippingProgressProps {
  subtotal: number
}

export default function FreeShippingProgress({ subtotal }: FreeShippingProgressProps) {
  const progress = getFreeShippingProgress(subtotal)
  const isFreeShipping = progress.percentage >= 100

  if (isFreeShipping) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Gift className="h-5 w-5 text-green-600" />
          <span className="font-semibold text-green-800">¡Envío Gratis Aplicado!</span>
          <Badge className="bg-green-100 text-green-800">Gratis</Badge>
        </div>
        <p className="text-sm text-green-700">
          Tu compra califica para envío gratis. ¡Ahorras {formatCurrency(15000)} en envío!
        </p>
      </div>
    )
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Truck className="h-5 w-5 text-blue-600" />
          <span className="font-semibold text-blue-800">Envío Gratis</span>
        </div>
        <Badge variant="outline" className="text-blue-700">
          {formatCurrency(progress.remaining)} restantes
        </Badge>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-blue-700">
          <span>Progreso hacia envío gratis:</span>
          <span>{progress.percentage.toFixed(1)}%</span>
        </div>
        
        <Progress value={progress.percentage} className="h-2" />
        
        <div className="flex justify-between text-xs text-blue-600">
          <span>{formatCurrency(progress.current)}</span>
          <span>{formatCurrency(progress.target)}</span>
        </div>
      </div>
      
      <p className="text-xs text-blue-600 mt-2">
        Agrega productos por {formatCurrency(progress.remaining)} más para obtener envío gratis
      </p>
    </div>
  )
} 