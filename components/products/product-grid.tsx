'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ShoppingCart, Eye, Star, Grid, List } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import Image from 'next/image'
import { formatPrice } from '@/lib/utils'
import { useCartStore } from '@/store/cart-store'

interface Product {
  _id: string
  name: string
  shortDescription: string
  salePrice: number
  recommendedResalePrice: number
  images: string[]
  supplierName: string
  rating: number
  reviewCount: number
  stock: number
  minOrderQuantity: number
  unitType: string
  category: string
  subcategory: string
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

interface ProductGridProps {
  searchParams: { [key: string]: string | string[] | undefined }
}

export default function ProductGrid({ searchParams }: ProductGridProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [pagination, setPagination] = useState<PaginationInfo | null>(null)
  const addToCart = useCartStore((state) => state.addToCart)
  const { toast } = useToast()
  const router = useRouter()
  const searchParamsHook = useSearchParams()

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      
      // Add all search params
      Object.entries(searchParams).forEach(([key, value]) => {
        if (value && typeof value === 'string') {
          params.set(key, value)
        }
      })

      const response = await fetch(`/api/products?${params.toString()}`)
      const data = await response.json()

      if (data.success) {
        setProducts(data.data.products)
        setPagination(data.data.pagination)
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('Error fetching products:', error)
      toast({
        title: 'Error',
        description: 'Error al cargar los productos',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [searchParams, toast])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  const handleAddToCart = (product: Product) => {
    addToCart({
      id: product._id,
      name: product.name,
      price: product.salePrice,
      image: product.images[0],
      quantity: product.minOrderQuantity,
      supplierName: product.supplierName,
      minOrderQuantity: product.minOrderQuantity,
      unitType: product.unitType
    })
    
    toast({
      title: 'Producto agregado',
      description: `${product.name} agregado al carrito`,
    })
  }

  const getDiscountPercentage = (salePrice: number, recommendedPrice: number) => {
    if (recommendedPrice > salePrice) {
      return Math.round(((recommendedPrice - salePrice) / recommendedPrice) * 100)
    }
    return 0
  }

  const updateSearchParams = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParamsHook.toString())
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
    })
    router.push(`/products?${params.toString()}`)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
          <div className="flex space-x-2">
            <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-48 bg-gray-200 rounded-t-lg"></div>
              <CardContent className="p-4">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded mb-4"></div>
                <div className="h-6 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">📦</div>
        <h3 className="text-xl font-semibold mb-2">No se encontraron productos</h3>
        <p className="text-gray-600 mb-6">
          Intenta ajustar tus filtros o términos de búsqueda
        </p>
        <Button onClick={() => router.push('/products')}>
          Ver todos los productos
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="text-xs sm:text-sm text-gray-600">
          {pagination && (
            <>
              Mostrando {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total} productos
            </>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Products Grid/List */}
      <div className={
        viewMode === 'grid'
          ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6'
          : 'space-y-4'
      }>
        {products.map((product) => (
          <Card key={product._id} className="group hover:shadow-lg transition-all duration-300">
            <CardHeader className="p-0 relative">
              <div className="relative">
                <div className={`${viewMode === 'grid' ? 'w-full h-40 sm:h-48' : 'w-24 sm:w-32 h-24 sm:h-32'} relative`}>
                  <Image
                    src={product.images[0] || '/placeholder-product.jpg'}
                    alt={product.name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className={`object-cover group-hover:scale-105 transition-transform duration-300 ${
                      viewMode === 'grid' ? 'rounded-t-lg' : 'rounded-lg'
                    }`}
                    priority={false}
                  />
                </div>
                
                {/* Discount Badge */}
                {getDiscountPercentage(product.salePrice, product.recommendedResalePrice) > 0 && (
                  <Badge className="absolute top-2 left-2 bg-red-500 text-white">
                    -{getDiscountPercentage(product.salePrice, product.recommendedResalePrice)}%
                  </Badge>
                )}
                
                {/* Stock Badge */}
                <Badge 
                  variant={product.stock > 0 ? "default" : "destructive"}
                  className="absolute top-2 right-2"
                >
                  {product.stock > 0 ? 'En Stock' : 'Sin Stock'}
                </Badge>
                
                {/* Action Buttons */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center space-x-2">
                  <Button
                    size="sm"
                    onClick={() => handleAddToCart(product)}
                    disabled={product.stock === 0}
                  >
                    <ShoppingCart className="h-4 w-4" />
                  </Button>
                  <Link href={`/products/${product._id}`}>
                    <Button size="sm" variant="outline">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className={`p-3 sm:p-4 ${viewMode === 'list' ? 'flex-1' : ''}`}>
              <div className={`space-y-2 sm:space-y-3 ${viewMode === 'list' ? 'flex flex-col h-full' : ''}`}>
                {/* Supplier */}
                <div className="text-sm text-gray-500">
                  {product.supplierName}
                </div>
                
                {/* Product Name */}
                <h3 className="font-semibold text-gray-900 group-hover:text-primary transition-colors line-clamp-2 text-sm sm:text-base">
                  {product.name}
                </h3>
                
                {/* Rating */}
                <div className="flex items-center space-x-1">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-3 w-3 ${
                          i < Math.floor(product.rating)
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-gray-500">
                    ({product.reviewCount})
                  </span>
                </div>
                
                {/* Price */}
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-base sm:text-lg font-bold text-primary">
                      {formatPrice(product.salePrice)}
                    </span>
                    {product.recommendedResalePrice > product.salePrice && (
                      <span className="text-xs sm:text-sm text-gray-500 line-through">
                        {formatPrice(product.recommendedResalePrice)}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">
                    Mínimo: {product.minOrderQuantity} {product.unitType}
                  </div>
                </div>
                
                {/* Add to Cart Button */}
                <Button
                  onClick={() => handleAddToCart(product)}
                  disabled={product.stock === 0}
                  className="w-full text-xs sm:text-sm"
                  size="sm"
                >
                  <ShoppingCart className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  {product.stock > 0 ? 'Agregar' : 'Sin Stock'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex flex-col sm:flex-row justify-center items-center gap-2 sm:space-x-2">
          <div className="flex items-center space-x-1 sm:space-x-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!pagination.hasPrevPage}
              onClick={() => updateSearchParams({ page: (pagination.page - 1).toString() })}
            >
              Anterior
            </Button>
            
            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(3, pagination.totalPages) }, (_, i) => {
                const page = i + 1
                return (
                  <Button
                    key={page}
                    variant={pagination.page === page ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateSearchParams({ page: page.toString() })}
                  >
                    {page}
                  </Button>
                )
              })}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              disabled={!pagination.hasNextPage}
              onClick={() => updateSearchParams({ page: (pagination.page + 1).toString() })}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}
    </div>
  )
} 