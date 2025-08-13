import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'

// Types
export interface Product {
  _id: string
  name: string
  description: string
  shortDescription?: string
  price: number
  comparePrice?: number
  cost: number
  images: string[]
  category: string
  subcategory?: string
  brand?: string
  sku: string
  inventory: {
    quantity: number
    lowStockThreshold: number
    trackQuantity: boolean
  }
  shipping: {
    weight: number
    dimensions: {
      length: number
      width: number
      height: number
    }
    freeShipping: boolean
    shippingClass?: string
  }
  status: 'draft' | 'pending' | 'active' | 'inactive' | 'out_of_stock' | 'discontinued'
  featured: boolean
  tags?: string[]
  supplier: {
    _id: string
    name: string
    businessName: string
  }
  rating?: number
  reviewCount?: number
  createdAt: string
  updatedAt: string
}

export interface ProductsResponse {
  products: Product[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// API functions
const fetchProducts = async (params: any): Promise<ProductsResponse> => {
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

  const response = await fetch(`/api/products?${searchParams.toString()}`)
  if (!response.ok) {
    throw new Error('Failed to fetch products')
  }
  return response.json()
}

const fetchProduct = async (id: string): Promise<Product> => {
  const response = await fetch(`/api/products/${id}`)
  if (!response.ok) {
    throw new Error('Failed to fetch product')
  }
  return response.json()
}

// Hooks
export const useProducts = (params: any = {}) => {
  return useQuery({
    queryKey: ['products', params],
    queryFn: () => fetchProducts(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useProduct = (id: string) => {
  return useQuery({
    queryKey: ['product', id],
    queryFn: () => fetchProduct(id),
    enabled: !!id,
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

export const useFeaturedProducts = () => {
  return useQuery({
    queryKey: ['featured-products'],
    queryFn: () => fetchProducts({ featured: true, limit: 8 }),
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

export const useProductCategories = () => {
  return useQuery({
    queryKey: ['product-categories'],
    queryFn: async () => {
      const response = await fetch('/api/categories')
      if (!response.ok) {
        throw new Error('Failed to fetch categories')
      }
      return response.json()
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
  })
}

// Mutations
export const useCreateProduct = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (productData: any) => {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      })
      if (!response.ok) {
        throw new Error('Failed to create product')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast({
        title: 'Producto creado',
        description: 'El producto se ha creado exitosamente',
      })
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Error al crear el producto',
        variant: 'destructive',
      })
    },
  })
}

export const useUpdateProduct = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        throw new Error('Failed to update product')
      }
      return response.json()
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['product', data._id] })
      toast({
        title: 'Producto actualizado',
        description: 'El producto se ha actualizado exitosamente',
      })
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Error al actualizar el producto',
        variant: 'destructive',
      })
    },
  })
}

export const useDeleteProduct = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        throw new Error('Failed to delete product')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast({
        title: 'Producto eliminado',
        description: 'El producto se ha eliminado exitosamente',
      })
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Error al eliminar el producto',
        variant: 'destructive',
      })
    },
  })
} 