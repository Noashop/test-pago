'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { useCartStore } from '@/store/cart-store'
import { Tag, Gift } from 'lucide-react'

interface Coupon {
  _id: string
  code: string
  name: string
  description: string
  type: string
  value: number
  minAmount?: number
  maxDiscount?: number
  startDate: string
  endDate: string
  isActive: boolean
  usageLimit: number
  usedCount: number
}

interface Promotion {
  _id: string
  name: string
  description: string
  type: string
  value: number
  minAmount?: number
  maxDiscount?: number
  startDate: string
  endDate: string
  isActive: boolean
  usageLimit: number
  usedCount: number
}

interface CouponSuggestionsProps {
  items: any[]
  subtotal: number
}

export function CouponSuggestions({ items, subtotal }: CouponSuggestionsProps) {
  const { applyCoupon, setActivePromotions } = useCartStore()
  const { toast } = useToast()
  
  const [availableCoupons, setAvailableCoupons] = useState<Coupon[]>([])
  const [availablePromotions, setAvailablePromotions] = useState<Promotion[]>([])
  const [loading, setLoading] = useState(false)

  const fetchSuggestions = useCallback(async () => {
    try {
      setLoading(true)
      const productIds = items.map(item => item.productId).join(',')
      const categories = items.map(item => item.category || '').filter(Boolean).join(',')
      
      const params = new URLSearchParams({
        subtotal: subtotal.toString(),
        productIds,
        categories
      })

      // Fetch both coupons and promotions
      const [couponsResponse, promotionsResponse] = await Promise.all([
        fetch(`/api/coupons/active?${params}`),
        fetch(`/api/promotions/active?${params}`)
      ])

      if (couponsResponse.ok) {
        const couponsData = await couponsResponse.json()
        setAvailableCoupons(couponsData.coupons.slice(0, 2)) // Show only 2 suggestions
      }

      if (promotionsResponse.ok) {
        const promotionsData = await promotionsResponse.json()
        setAvailablePromotions(promotionsData.promotions.slice(0, 2)) // Show only 2 suggestions
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error)
    } finally {
      setLoading(false)
    }
  }, [items, subtotal])

  useEffect(() => {
    if (items.length > 0) {
      fetchSuggestions()
    }
  }, [items, subtotal, fetchSuggestions])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(price)
  }

  const getDiscountTypeLabel = (type: string, value: number) => {
    switch (type) {
      case 'percentage':
        return `${value}% de descuento`
      case 'fixed_amount':
        return `${formatPrice(value)} de descuento`
      case 'free_shipping':
        return 'Envío gratis'
      default:
        return 'Descuento'
    }
  }

  const handleApplyCoupon = (coupon: Coupon) => {
    applyCoupon(coupon)
    toast({
      title: 'Cupón aplicado',
      description: `Se aplicó ${coupon.name}`,
    })
  }

  const handleApplyPromotion = (promotion: Promotion) => {
    setActivePromotions([promotion])
    toast({
      title: 'Promoción aplicada',
      description: `Se aplicó ${promotion.name}`,
    })
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (availableCoupons.length === 0 && availablePromotions.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Ofertas Especiales</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Coupons */}
        {availableCoupons.map((coupon) => (
          <div key={coupon._id} className="flex items-center justify-between p-3 bg-purple-50 border border-purple-200 rounded-lg">
            <div className="flex items-center gap-3">
              <Tag className="h-5 w-5 text-purple-600" />
              <div>
                <h4 className="font-medium text-purple-900">{coupon.code}</h4>
                <p className="text-sm text-purple-700">{coupon.description}</p>
                {coupon.minAmount && (
                  <p className="text-xs text-purple-600">
                    Mínimo: {formatPrice(coupon.minAmount)}
                  </p>
                )}
              </div>
            </div>
            <div className="text-right">
              <Badge variant="secondary" className="mb-2">
                {getDiscountTypeLabel(coupon.type, coupon.value)}
              </Badge>
              <Button
                size="sm"
                onClick={() => handleApplyCoupon(coupon)}
                className="w-full"
              >
                Aplicar
              </Button>
            </div>
          </div>
        ))}

        {/* Promotions */}
        {availablePromotions.map((promotion) => (
          <div key={promotion._id} className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-center gap-3">
              <Gift className="h-5 w-5 text-orange-600" />
              <div>
                <h4 className="font-medium text-orange-900">{promotion.name}</h4>
                <p className="text-sm text-orange-700">{promotion.description}</p>
                {promotion.minAmount && (
                  <p className="text-xs text-orange-600">
                    Mínimo: {formatPrice(promotion.minAmount)}
                  </p>
                )}
              </div>
            </div>
            <div className="text-right">
              <Badge variant="secondary" className="mb-2">
                {getDiscountTypeLabel(promotion.type, promotion.value)}
              </Badge>
              <Button
                size="sm"
                onClick={() => handleApplyPromotion(promotion)}
                className="w-full"
              >
                Aplicar
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
} 