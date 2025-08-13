'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { useCartStore } from '@/store/cart-store'
import { Trash2, Plus, Minus, Tag, Gift, ShoppingCart, ArrowRight } from 'lucide-react'
import Image from 'next/image'
import FreeShippingProgress from '@/components/cart/free-shipping-progress'
import { calculateShippingCost, formatCurrency } from '@/lib/shipping'
import { ClientLoader } from '@/components/ui/loaders'

interface Coupon {
  _id: string
  code: string
  name: string
  description: string
  type: string
  value: number
  minAmount?: number
  maxDiscount?: number
}

interface Promotion {
  _id: string
  name: string
  description: string
  type: string
  value: number
  minAmount?: number
  maxDiscount?: number
}

export default function CartPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  
  const { 
    items, 
    subtotal, 
    total, 
    discount, 
    coupon, 
    activePromotions,
    addToCart: addItem, 
    removeFromCart: removeItem, 
    updateQuantity, 
    clearCart,
    applyCoupon,
    removeCoupon,
    setActivePromotions
  } = useCartStore()

  const [couponCode, setCouponCode] = useState('')
  const [availableCoupons, setAvailableCoupons] = useState<Coupon[]>([])
  const [couponDialog, setCouponDialog] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedShipping, setSelectedShipping] = useState('standard')
  const [isPageLoading, setIsPageLoading] = useState(true)

  useEffect(() => {
    // Simular tiempo de carga inicial
    const timer = setTimeout(() => {
      setIsPageLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  const fetchActiveCoupons = useCallback(async () => {
    try {
      const productIds = items.map(item => item.productId).join(',')
      const categories = items.map(item => item.category || '').filter(Boolean).join(',')
      
      const params = new URLSearchParams({
        subtotal: subtotal.toString(),
        productIds,
        categories
      })

      const response = await fetch(`/api/coupons/active?${params}`)
      const data = await response.json()

      if (response.ok) {
        setAvailableCoupons(data.coupons)
      }
    } catch (error) {
      console.error('Error fetching coupons:', error)
    }
  }, [items, subtotal])
  const fetchActivePromotions = useCallback(async () => {
    try {
      const productIds = items.map(item => item.productId).join(',')
      const categories = items.map(item => item.category || '').filter(Boolean).join(',')
      
      const params = new URLSearchParams({
        subtotal: subtotal.toString(),
        productIds,
        categories
      })

      const response = await fetch(`/api/promotions/active?${params}`)
      const data = await response.json()

      if (response.ok) {
        setActivePromotions(data.promotions)
      }
    } catch (error) {
      console.error('Error fetching promotions:', error)
    }
  }, [items, subtotal, setActivePromotions])

  useEffect(() => {
    if (items.length > 0) {
      fetchActiveCoupons()
      fetchActivePromotions()
    }
  }, [items, fetchActiveCoupons, fetchActivePromotions])

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return

    try {
      setLoading(true)
      const response = await fetch(`/api/coupons/validate?code=${couponCode.toUpperCase()}`)
      const data = await response.json()

      if (response.ok) {
        applyCoupon(data.coupon)
        toast({
          title: 'Cupón aplicado',
          description: `Se aplicó un descuento de ${formatPrice(data.discount)}`,
        })
        setCouponCode('')
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Cupón no válido',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al aplicar cupón',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  if (isPageLoading) {
    return <ClientLoader />
  }

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

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <ShoppingCart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Tu carrito está vacío</h2>
          <p className="text-gray-600 mb-6">Agrega productos para comenzar a comprar</p>
          <Button onClick={() => router.push('/')}>
            Continuar comprando
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Carrito de Compras</h1>
        <p className="text-gray-600">{items.length} productos en tu carrito</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Productos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {items.map((item, index) => {
                  // Crear key única y segura
                  const itemKey = item.id || `item-${index}`
                  // Asegurar que quantity sea un número válido
                  const safeQuantity = Number(item.quantity) || 1
                  // Asegurar que price sea un número válido
                  const safePrice = Number(item.price) || 0
                  
                  return (
                    <div key={itemKey} className="flex items-center gap-4 p-4 border rounded-lg">
                      <div className="relative w-20 h-20">
                        <Image
                          src={item.image || '/placeholder-product.jpg'}
                          alt={item.name || 'Producto'}
                          fill
                          className="object-cover rounded"
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium">{item.name || 'Producto sin nombre'}</h3>
                        <p className="text-sm text-gray-500">
                          Vendido por: {item.supplierName || 'Proveedor'}
                        </p>
                        <p className="text-sm font-medium text-green-600">
                          {formatPrice(safePrice)}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.id, Math.max(1, safeQuantity - 1))}
                            disabled={safeQuantity <= 1}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-12 text-center font-medium">{safeQuantity}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.id, safeQuantity + 1)}
                          >
                            <Plus className="h-4 w-4" />
                        </Button>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatPrice(safePrice * safeQuantity)}</p>
                        <p className="text-sm text-gray-500">{formatPrice(safePrice)} c/u</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeItem(item.id)}
                          className="mt-2"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cart Summary */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Resumen de Compra</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span>Subtotal ({items.length} productos)</span>
                <span>{formatPrice(subtotal)}</span>
              </div>

              {/* Active Promotions */}
              {activePromotions.length > 0 && (
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Gift className="h-4 w-4 text-orange-500" />
                    Promociones Aplicadas
                  </h4>
                  {activePromotions.map((promotion) => (
                    <div key={promotion._id} className="flex justify-between text-sm text-green-600">
                      <span>{promotion.name}</span>
                      <span>-{getDiscountTypeLabel(promotion.type, promotion.value)}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Applied Coupon */}
              {coupon && (
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Tag className="h-4 w-4 text-purple-500" />
                    Cupón Aplicado
                  </h4>
                  <div className="flex justify-between text-sm text-purple-600">
                    <span>{coupon.name}</span>
                    <span>-{getDiscountTypeLabel(coupon.type, coupon.value)}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={removeCoupon}
                    className="mt-2"
                  >
                    Remover cupón
                  </Button>
                </div>
              )}

              {/* Available Coupons */}
              {availableCoupons.length > 0 && !coupon && (
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2">Cupones Disponibles</h4>
                  <div className="space-y-2">
                    {availableCoupons.slice(0, 3).map((coupon) => (
                      <div key={coupon._id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div>
                          <p className="font-medium text-sm">{coupon.code}</p>
                          <p className="text-xs text-gray-500">{coupon.description}</p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => {
                            applyCoupon({
                              ...coupon,
                              startDate: new Date().toISOString(),
                              endDate: new Date().toISOString(),
                              isActive: true,
                              usageLimit: 1,
                              usedCount: 0
                            })
                            toast({
                              title: 'Cupón aplicado',
                              description: `Se aplicó ${coupon.name}`,
                            })
                          }}
                        >
                          Aplicar
                        </Button>
                      </div>
                    ))}
                    {availableCoupons.length > 3 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCouponDialog(true)}
                        className="w-full"
                      >
                        Ver más cupones
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Coupon Input */}
              {!coupon && (
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2">¿Tienes un cupón?</h4>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Código del cupón"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                    />
                    <Button 
                      onClick={handleApplyCoupon}
                      disabled={loading || !couponCode.trim()}
                    >
                      {loading ? 'Aplicando...' : 'Aplicar'}
                    </Button>
                  </div>
                </div>
              )}

              {/* Free Shipping Progress (único método de envío) */}
              <FreeShippingProgress subtotal={subtotal} />

              {discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Descuento total</span>
                  <span>-{formatPrice(discount)}</span>
                </div>
              )}

              <div className="border-t pt-4">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>{formatPrice(total + (selectedShipping === 'standard' ? 15000 : selectedShipping === 'express' ? 25000 : 0))}</span>
                </div>
              </div>

              <Button 
                className="w-full" 
                size="lg"
                onClick={() => router.push('/checkout')}
              >
                Proceder al checkout
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>

              <Button 
                variant="outline" 
                className="w-full"
                onClick={clearCart}
              >
                Vaciar carrito
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Coupons Dialog */}
      <Dialog open={couponDialog} onOpenChange={setCouponDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cupones Disponibles</DialogTitle>
            <DialogDescription>
              Selecciona un cupón para aplicar a tu compra
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {availableCoupons.map((coupon) => (
              <div key={coupon._id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="font-medium">{coupon.code}</h4>
                    <p className="text-sm text-gray-600">{coupon.description}</p>
                  </div>
                  <Badge variant="secondary">
                    {getDiscountTypeLabel(coupon.type, coupon.value)}
                  </Badge>
                </div>
                {coupon.minAmount && (
                  <p className="text-xs text-gray-500">
                    Mínimo de compra: {formatPrice(coupon.minAmount)}
                  </p>
                )}
                <Button
                  className="w-full mt-2"
                  onClick={() => {
                    applyCoupon({
                      ...coupon,
                      startDate: new Date().toISOString(),
                      endDate: new Date().toISOString(),
                      isActive: true,
                      usageLimit: 1,
                      usedCount: 0
                    })
                    setCouponDialog(false)
                    toast({
                      title: 'Cupón aplicado',
                      description: `Se aplicó ${coupon.name}`,
                    })
                  }}
                >
                  Aplicar Cupón
                </Button>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
