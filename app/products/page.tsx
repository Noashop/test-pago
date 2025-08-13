'use client'

import { useState, useEffect, Suspense, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Star, ShoppingCart, Eye, Search, Filter, ArrowLeft, Grid, List } from 'lucide-react'
import { useCartStore } from '@/store/cart-store'
import { useToast } from '@/hooks/use-toast'
import { PRODUCT_CATEGORIES } from '@/constants'

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
  featured: boolean
}

function ProductsContent() {
  const { data: session } = useSession()
  const searchParams = useSearchParams()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  
  // Filters
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '')
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get('category') || 'all')
  const [subcategoryFilter, setSubcategoryFilter] = useState('all')
  const [priceRange, setPriceRange] = useState([0, 50000])
  const [sortBy, setSortBy] = useState('newest')
  const [inStockOnly, setInStockOnly] = useState(false)
  const [featuredOnly, setFeaturedOnly] = useState(false)
  
  const addToCart = useCartStore((state) => state.addToCart)
  const { toast } = useToast()

  const isLoggedIn = Boolean(session?.user)

  const calcProfit = (p: Product) => {
    const diff = Math.max(0, (p.recommendedResalePrice || 0) - (p.salePrice || 0))
    const pct = p.salePrice > 0 ? (diff / p.salePrice) * 100 : 0
    return { amount: diff, pct }
  }

  // Get available subcategories for selected category
  const availableSubcategories = categoryFilter !== 'all' 
    ? Object.entries(PRODUCT_CATEGORIES).find(([key, cat]) => 
        cat.name.toLowerCase() === categoryFilter.toLowerCase()
      )?.[1]?.subcategories || []
    : []

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      
      if (searchTerm) params.append('search', searchTerm)
      if (categoryFilter !== 'all') params.append('category', categoryFilter)
      if (subcategoryFilter !== 'all') params.append('subcategory', subcategoryFilter)
      if (featuredOnly) params.append('featured', 'true')
      
      params.append('sortBy', sortBy === 'newest' ? 'createdAt' : 
                            sortBy === 'oldest' ? 'createdAt' :
                            sortBy === 'price-low' ? 'salePrice' :
                            sortBy === 'price-high' ? 'salePrice' :
                            sortBy === 'rating' ? 'rating' : 'createdAt')
      
      params.append('sortOrder', sortBy === 'price-high' || sortBy === 'oldest' || sortBy === 'rating' ? 'desc' : 'asc')
      params.append('limit', '50')

      const response = await fetch(`/api/products?${params}`)
      const data = await response.json()

      if (response.ok && data.success) {
        let filteredProducts = data.products || []

        // Apply client-side filters
        if (inStockOnly) {
          filteredProducts = filteredProducts.filter((product: Product) => product.stock > 0)
        }

        if (priceRange[0] > 0 || priceRange[1] < 50000) {
          filteredProducts = filteredProducts.filter((product: Product) => 
            product.salePrice >= priceRange[0] && product.salePrice <= priceRange[1]
          )
        }

        setProducts(filteredProducts)
      } else {
        setProducts([])
      }
    } catch (error) {
      console.error('Error fetching products:', error)
      setProducts([])
    } finally {
      setLoading(false)
    }
  }, [searchTerm, categoryFilter, subcategoryFilter, sortBy, featuredOnly, inStockOnly, priceRange])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  useEffect(() => {
    // Debounce search
    const timeoutId = setTimeout(() => {
      if (searchTerm !== searchParams.get('search')) {
        fetchProducts()
      }
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [searchTerm, searchParams, fetchProducts])

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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(price)
  }

  const getDiscountPercentage = (salePrice: number, recommendedPrice: number) => {
    if (recommendedPrice > salePrice) {
      return Math.round(((recommendedPrice - salePrice) / recommendedPrice) * 100)
    }
    return 0
  }

  const clearFilters = () => {
    setSearchTerm('')
    setCategoryFilter('all')
    setSubcategoryFilter('all')
    setPriceRange([0, 50000])
    setSortBy('newest')
    setInStockOnly(false)
    setFeaturedOnly(false)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <Link href="/" className="hover:text-foreground">Inicio</Link>
            <span>/</span>
            <span className="text-foreground">Productos</span>
          </nav>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Todos los Productos
              </h1>
              <p className="text-muted-foreground">
                {products.length} productos encontrados
              </p>
            </div>
            <div className="flex items-center gap-2">
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
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <aside className="lg:w-80">
            <Card className="sticky top-4">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Filtros</h3>
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    Limpiar
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Search */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Buscar</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Buscar productos..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Categoría</label>
                  <Select value={categoryFilter} onValueChange={(value) => {
                    setCategoryFilter(value)
                    setSubcategoryFilter('all')
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las categorías</SelectItem>
                      {Object.entries(PRODUCT_CATEGORIES).map(([key, category]) => (
                        <SelectItem key={key} value={category.name}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Subcategory */}
                {availableSubcategories.length > 0 && (
                  <div>
                    <label className="text-sm font-medium mb-2 block">Subcategoría</label>
                    <Select value={subcategoryFilter} onValueChange={setSubcategoryFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar subcategoría" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas las subcategorías</SelectItem>
                        {availableSubcategories.map((sub) => (
                          <SelectItem key={sub} value={sub}>
                            {sub}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Price Range */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Rango de Precio: {formatPrice(priceRange[0])} - {formatPrice(priceRange[1])}
                  </label>
                  <Slider
                    value={priceRange}
                    onValueChange={setPriceRange}
                    max={50000}
                    min={0}
                    step={100}
                    className="mt-2"
                  />
                </div>

                {/* Sort */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Ordenar por</label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Más recientes</SelectItem>
                      <SelectItem value="oldest">Más antiguos</SelectItem>
                      <SelectItem value="price-low">Precio: menor a mayor</SelectItem>
                      <SelectItem value="price-high">Precio: mayor a menor</SelectItem>
                      <SelectItem value="rating">Mejor valorados</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Additional Filters */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="inStock"
                      checked={inStockOnly}
                      onChange={(e) => setInStockOnly(e.target.checked)}
                      className="rounded"
                    />
                    <label htmlFor="inStock" className="text-sm">Solo en stock</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="featured"
                      checked={featuredOnly}
                      onChange={(e) => setFeaturedOnly(e.target.checked)}
                      className="rounded"
                    />
                    <label htmlFor="featured" className="text-sm">Solo destacados</label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </aside>

          {/* Products Grid/List */}
          <main className="flex-1">
            {loading ? (
              <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                {[...Array(9)].map((_, i) => (
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
            ) : products.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <div className="text-4xl mb-4">📦</div>
                  <h3 className="text-xl font-semibold mb-2">No hay productos</h3>
                  <p className="text-muted-foreground mb-6">
                    No se encontraron productos con los filtros aplicados
                  </p>
                  <Button onClick={clearFilters}>
                    Limpiar filtros
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                {products.map((product) => (
                  <Card key={product._id} className={`group hover:shadow-lg transition-all duration-300 ${viewMode === 'list' ? 'flex flex-row' : ''}`}>
                    <CardHeader className={`p-0 relative ${viewMode === 'list' ? 'w-48 flex-shrink-0' : ''}`}>
                      <div className="relative">
                        <div className={`${viewMode === 'list' ? 'w-full h-32' : 'w-full h-48'} relative`}>
                          <Image
                            src={product.images[0] || '/placeholder-product.jpg'}
                            alt={product.name}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            className={`object-cover group-hover:scale-105 transition-transform duration-300 ${
                              viewMode === 'list' ? 'rounded-l-lg' : 'rounded-t-lg'
                            }`}
                            priority={false}
                          />
                        </div>
                        
                        {/* Badges */}
                        <div className="absolute top-2 left-2 flex flex-col gap-1">
                          {getDiscountPercentage(product.salePrice, product.recommendedResalePrice) > 0 && (
                            <Badge variant="destructive">
                              -{getDiscountPercentage(product.salePrice, product.recommendedResalePrice)}%
                            </Badge>
                          )}
                          {product.featured && (
                            <Badge className="bg-yellow-500">
                              Destacado
                            </Badge>
                          )}
                        </div>
                        
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
                    
                    <CardContent className={`p-4 ${viewMode === 'list' ? 'flex-1' : ''}`}>
                      <div className={`space-y-3 ${viewMode === 'list' ? 'flex flex-col justify-between h-full' : ''}`}>
                        <div>
                          {/* Supplier */}
                          <div className="text-sm text-muted-foreground">
                            {product.supplierName}
                          </div>
                          
                          {/* Product Name */}
                          <Link href={`/products/${product._id}`}>
                            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 mt-1">
                              {product.name}
                            </h3>
                          </Link>
                          
                          {viewMode === 'list' && (
                            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                              {product.shortDescription}
                            </p>
                          )}
                          
                          {/* Rating */}
                          <div className="flex items-center space-x-1 mt-2">
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
                            <span className="text-xs text-muted-foreground">
                              ({product.reviewCount})
                            </span>
                          </div>
                        </div>
                        
                        <div>
                          {/* Price */}
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <span className="text-lg font-bold text-primary">
                                {formatPrice(product.salePrice)}
                              </span>
                              {product.recommendedResalePrice > product.salePrice && (
                                <span className="text-sm text-muted-foreground line-through">
                                  {formatPrice(product.recommendedResalePrice)}
                                </span>
                              )}
                            </div>
                            {isLoggedIn && product.recommendedResalePrice > product.salePrice && (
                              <div className="text-xs text-emerald-700">
                                Tu ganancia potencial: {formatPrice(calcProfit(product).amount)} ({calcProfit(product).pct.toFixed(1)}%)
                              </div>
                            )}
                            <div className="text-xs text-muted-foreground">
                              Mínimo: {product.minOrderQuantity} {product.unitType}
                            </div>
                          </div>
                          
                          {/* Add to Cart Button */}
                          <Button
                            onClick={() => handleAddToCart(product)}
                            disabled={product.stock === 0}
                            className="w-full mt-3"
                            size="sm"
                          >
                            <ShoppingCart className="h-4 w-4 mr-2" />
                            {product.stock > 0 ? 'Agregar al Carrito' : 'Sin Stock'}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando productos...</p>
        </div>
      </div>
    }>
      <ProductsContent />
    </Suspense>
  )
}
