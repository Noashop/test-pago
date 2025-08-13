import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { COUPON_TYPES } from '@/constants'

// Global event emitter for resale incentive toast
let resaleIncentiveEmitter: ((data: any) => void) | null = null

export const setResaleIncentiveEmitter = (emitter: (data: any) => void) => {
  resaleIncentiveEmitter = emitter
}

export interface CartItem {
  id: string
  name: string
  price: number
  image: string
  quantity: number
  supplierName: string
  minOrderQuantity: number
  unitType: string
  productId?: string
  category?: string
  // Profit calculation fields
  costPrice?: number
  recommendedRetailPrice?: number
  profitMargin?: number
  potentialProfit?: number
}

export interface Coupon {
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

export interface Promotion {
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

export interface CartState {
  items: CartItem[]
  subtotal: number
  total: number
  discount: number
  coupon: Coupon | null
  activePromotions: Promotion[]
  isLoading: boolean
  error: string | null
}

interface CartActions {
  addToCart: (item: CartItem) => void
  removeFromCart: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  applyCoupon: (coupon: Coupon) => void
  removeCoupon: () => void
  setActivePromotions: (promotions: Promotion[]) => void
  calculateTotals: () => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

export const useCartStore = create<CartState & CartActions>()(
  persist(
    (set, get) => ({
      items: [],
      subtotal: 0,
      total: 0,
      discount: 0,
      coupon: null,
      activePromotions: [],
      isLoading: false,
      error: null,

      addToCart: (item) => {
        const { items } = get()
        const existingItemIndex = items.findIndex(
          (existingItem) => existingItem.id === item.id
        )

        let updatedItems
        if (existingItemIndex > -1) {
          // Update existing item quantity
          updatedItems = [...items]
          updatedItems[existingItemIndex].quantity += item.quantity
        } else {
          // Add new item
          updatedItems = [...items, item]
        }

        // Update state immediately
        set({ items: updatedItems })

        // Trigger resale incentive toast if recommendedRetailPrice is available and user is logged in
        if (item.recommendedRetailPrice && item.price && typeof window !== 'undefined') {
          const profitPerUnit = item.recommendedRetailPrice - item.price
          
          if (profitPerUnit > 0 && resaleIncentiveEmitter) {
            const totalProfit = profitPerUnit * item.quantity
            const profitMargin = ((profitPerUnit / item.price) * 100).toFixed(1)
            
            // Emit resale incentive data
            resaleIncentiveEmitter({
              productName: item.name,
              productImage: item.image,
              quantity: item.quantity,
              unitType: item.unitType,
              profitPerUnit,
              totalProfit,
              profitMargin: parseFloat(profitMargin),
              salePrice: item.price,
              recommendedPrice: item.recommendedRetailPrice
            })
          }
        }

        // Force recalculation and update
        get().calculateTotals()
      },

      removeFromCart: (id) => {
        const { items } = get()
        const updatedItems = items.filter((item) => item.id !== id)
        set({ items: updatedItems })
        get().calculateTotals()
      },

      updateQuantity: (id, quantity) => {
        const { items } = get()
        const updatedItems = items.map((item) => {
          if (item.id === id) {
            return { ...item, quantity: Math.max(1, quantity) }
          }
          return item
        })

        // Update state immediately
        set({ items: updatedItems })
        // Force recalculation
        get().calculateTotals()
      },

      clearCart: () => {
        set({ 
          items: [], 
          subtotal: 0, 
          total: 0, 
          discount: 0, 
          coupon: null,
          activePromotions: []
        })
      },

      applyCoupon: (coupon) => {
        set({ coupon })
        get().calculateTotals()
      },

      removeCoupon: () => {
        set({ coupon: null })
        get().calculateTotals()
      },

      setActivePromotions: (promotions) => {
        set({ activePromotions: promotions })
        get().calculateTotals()
      },

      calculateTotals: () => {
        const { items, coupon, activePromotions } = get()
        
        const subtotal = items.reduce(
          (sum, item) => sum + (item.price * item.quantity), 
          0
        )

        let total = subtotal
        let discount = 0

        // Apply coupon discount
        if (coupon) {
          const couponDiscount = calculateCouponDiscount(coupon, subtotal)
          discount += couponDiscount
          total -= couponDiscount
        }

        // Apply promotion discounts
        activePromotions.forEach(promotion => {
          if (isPromotionValid(promotion, subtotal)) {
            const promotionDiscount = calculatePromotionDiscount(promotion, subtotal)
            discount += promotionDiscount
            total -= promotionDiscount
          }
        })

        set({ subtotal, total, discount })
      },

      setLoading: (loading) => {
        set({ isLoading: loading })
      },

      setError: (error) => {
        set({ error })
      }
    }),
    {
      name: 'cart-storage',
      partialize: (state) => ({
        items: state.items,
        coupon: state.coupon
      }),
      // Force rehydration on mount
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Forzar recálculo después de la hidratación
          setTimeout(() => {
            state.calculateTotals()
          }, 100)
        }
      }
    }
  )
)

// Export useCart hook for compatibility
// export const useCart = () => useCartStore()

// Helper functions for discount calculations
function calculateCouponDiscount(coupon: Coupon, subtotal: number): number {
  if (!isCouponValid(coupon, subtotal)) return 0

  let discount = 0

  if (coupon.type === COUPON_TYPES.PERCENTAGE) {
    discount = subtotal * (coupon.value / 100)
  } else if (coupon.type === COUPON_TYPES.FIXED_AMOUNT) {
    discount = Math.min(coupon.value, subtotal)
  }

  // Apply max discount limit
  if (coupon.maxDiscount) {
    discount = Math.min(discount, coupon.maxDiscount)
  }

  return discount
}

function calculatePromotionDiscount(promotion: Promotion, subtotal: number): number {
  if (!isPromotionValid(promotion, subtotal)) return 0

  let discount = 0

  if (promotion.type === 'percentage') {
    discount = subtotal * (promotion.value / 100)
  } else if (promotion.type === 'fixed_amount') {
    discount = Math.min(promotion.value, subtotal)
  }

  // Apply max discount limit
  if (promotion.maxDiscount) {
    discount = Math.min(discount, promotion.maxDiscount)
  }

  return discount
}

function isCouponValid(coupon: Coupon, subtotal: number): boolean {
  const now = new Date()
  const startDate = new Date(coupon.startDate)
  const endDate = new Date(coupon.endDate)

  return (
    coupon.isActive &&
    coupon.usedCount < coupon.usageLimit &&
    now >= startDate &&
    now <= endDate &&
    (!coupon.minAmount || subtotal >= coupon.minAmount)
  )
}

function isPromotionValid(promotion: Promotion, subtotal: number): boolean {
  const now = new Date()
  const startDate = new Date(promotion.startDate)
  const endDate = new Date(promotion.endDate)

  return (
    promotion.isActive &&
    promotion.usedCount < promotion.usageLimit &&
    now >= startDate &&
    now <= endDate &&
    (!promotion.minAmount || subtotal >= promotion.minAmount)
  )
}
