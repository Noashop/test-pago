import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'

// Types
export interface Order {
  _id: string
  orderNumber: string
  user: {
    _id: string
    name: string
    email: string
  }
  items: Array<{
    product: {
      _id: string
      name: string
      images: string[]
      price: number
    }
    quantity: number
    price: number
    variant?: string
  }>
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
  paymentStatus: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'refunded'
  subtotal: number
  discount: number
  shipping: number
  total: number
  shippingAddress: {
    name: string
    street: string
    city: string
    state: string
    zipCode: string
    country: string
    phone: string
  }
  billingAddress?: {
    name: string
    street: string
    city: string
    state: string
    zipCode: string
    country: string
    taxId?: string
  }
  coupon?: {
    code: string
    discount: number
  }
  notes?: string
  trackingNumber?: string
  estimatedDelivery?: string
  createdAt: string
  updatedAt: string
}

export interface OrdersResponse {
  orders: Order[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// API functions
const fetchOrders = async (params: any = {}): Promise<OrdersResponse> => {
  const searchParams = new URLSearchParams()
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        value.forEach(v => searchParams.append(key, v))
      } else {
        searchParams.append(key, String(value))
      }
    }
  })

  const response = await fetch(`/api/orders?${searchParams.toString()}`)
  if (!response.ok) {
    throw new Error('Failed to fetch orders')
  }
  return response.json()
}

const fetchOrder = async (id: string): Promise<Order> => {
  const response = await fetch(`/api/orders/${id}`)
  if (!response.ok) {
    throw new Error('Failed to fetch order')
  }
  return response.json()
}

const createOrder = async (orderData: any): Promise<Order> => {
  const response = await fetch('/api/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(orderData),
  })
  if (!response.ok) {
    throw new Error('Failed to create order')
  }
  return response.json()
}

const updateOrderStatus = async ({ id, status }: { id: string; status: string }): Promise<Order> => {
  const response = await fetch(`/api/orders/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status }),
  })
  if (!response.ok) {
    throw new Error('Failed to update order status')
  }
  return response.json()
}

// Hooks
export const useOrders = (params: any = {}) => {
  return useQuery({
    queryKey: ['orders', params],
    queryFn: () => fetchOrders(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

export const useOrder = (id: string) => {
  return useQuery({
    queryKey: ['order', id],
    queryFn: () => fetchOrder(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useUserOrders = (userId?: string) => {
  return useQuery({
    queryKey: ['user-orders', userId],
    queryFn: () => fetchOrders({ user: userId }),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

export const useSupplierOrders = (supplierId?: string) => {
  return useQuery({
    queryKey: ['supplier-orders', supplierId],
    queryFn: () => fetchOrders({ supplier: supplierId }),
    enabled: !!supplierId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

// Mutations
export const useCreateOrder = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: createOrder,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['user-orders'] })
      queryClient.invalidateQueries({ queryKey: ['cart'] })
      toast({
        title: 'Orden creada',
        description: `Orden #${data.orderNumber} creada exitosamente`,
      })
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Error al crear la orden',
        variant: 'destructive',
      })
    },
  })
}

export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: updateOrderStatus,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['order', data._id] })
      toast({
        title: 'Estado actualizado',
        description: `Orden #${data.orderNumber} actualizada a ${data.status}`,
      })
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Error al actualizar el estado',
        variant: 'destructive',
      })
    },
  })
}

export const useCancelOrder = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (orderId: string) => {
      const response = await fetch(`/api/orders/${orderId}/cancel`, {
        method: 'POST',
      })
      if (!response.ok) {
        throw new Error('Failed to cancel order')
      }
      return response.json()
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['order', data._id] })
      toast({
        title: 'Orden cancelada',
        description: `Orden #${data.orderNumber} cancelada exitosamente`,
      })
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Error al cancelar la orden',
        variant: 'destructive',
      })
    },
  })
} 