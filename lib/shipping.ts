export const SHIPPING_CONFIG = {
  FREE_SHIPPING_THRESHOLD: 250000, // $250.000 pesos argentinos
  DEFAULT_SHIPPING_COST: 15000, // $15.000 pesos argentinos
  EXPRESS_SHIPPING_COST: 25000, // $25.000 pesos argentinos
  PICKUP_COST: 0 // Retiro en local es gratis
}

export interface ShippingOption {
  id: string
  name: string
  description: string
  cost: number
  estimatedDays: string
  isAvailable: boolean
}

export function calculateShippingCost(subtotal: number): ShippingOption[] {
  const isFreeShipping = subtotal >= SHIPPING_CONFIG.FREE_SHIPPING_THRESHOLD
  
  return [
    {
      id: 'free',
      name: 'Envío Gratis',
      description: 'Envío gratis en compras superiores a $250.000',
      cost: 0,
      estimatedDays: '3-5 días hábiles',
      isAvailable: isFreeShipping
    },
    {
      id: 'standard',
      name: 'Envío Estándar',
      description: 'Envío a domicilio',
      cost: isFreeShipping ? 0 : SHIPPING_CONFIG.DEFAULT_SHIPPING_COST,
      estimatedDays: '3-5 días hábiles',
      isAvailable: true
    },
    {
      id: 'express',
      name: 'Envío Express',
      description: 'Envío prioritario',
      cost: isFreeShipping ? 0 : SHIPPING_CONFIG.EXPRESS_SHIPPING_COST,
      estimatedDays: '1-2 días hábiles',
      isAvailable: true
    },
    {
      id: 'pickup',
      name: 'Retiro en Local',
      description: 'Retira en el local del proveedor',
      cost: SHIPPING_CONFIG.PICKUP_COST,
      estimatedDays: 'Inmediato',
      isAvailable: true
    }
  ]
}

export function getFreeShippingProgress(subtotal: number): {
  current: number
  target: number
  percentage: number
  remaining: number
} {
  const target = SHIPPING_CONFIG.FREE_SHIPPING_THRESHOLD
  const current = subtotal
  const percentage = Math.min((current / target) * 100, 100)
  const remaining = Math.max(target - current, 0)

  return {
    current,
    target,
    percentage,
    remaining
  }
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS'
  }).format(amount)
} 