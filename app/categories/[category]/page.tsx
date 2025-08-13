'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Star, ShoppingCart, Eye, Search, Filter, ArrowLeft } from 'lucide-react'
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
}

export default function CategoryPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [subcategoryFilter, setSubcategoryFilter] = useState('all')
  const [sortBy, setSortBy] = useState('newest')
  const [priceRange, setPriceRange] = useState('all')
  const addToCart = useCartStore((state) => state.addToCart)
  const { toast } = useToast()

  const categoryKey = params.category as string
  const categoryName = categoryKey?.replace(/-/g, '_').toUpperCase()
  const categoryData = PRODUCT_CATEGORIES[categoryName as keyof typeof PRODUCT_CATEGORIES]

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      
      // Usar el nombre oficial desde constantes para garantizar coincidencia exacta (incluye conectores como 'y')
      const dbCategory = categoryData?.name || categoryKey.replace(/-/g, ' ')
      params.append('category', dbCategory)
      
      if (subcategoryFilter !== 'all') {
        params.append('subcategory', subcategoryFilter)
      }
      
      params.append('sortBy', sortBy === 'newest' ? 'createdAt' : 
                              sortBy === 'oldest' ? 'createdAt' :
                              sortBy === 'price-low' ? 'salePrice' :
                              sortBy === 'price-high' ? 'salePrice' : 'createdAt')
      
      params.append('sortOrder', sortBy === 'price-high' || sortBy === 'oldest' ? 'desc' : 'asc')
      params.append('limit', '50')

      const response = await fetch(`/api/products?${params}`)
      const data = await response.json()

      if (response.ok && data.success) {
        let filteredProducts = data.products || []

        // Apply search filter
        if (searchTerm) {
          filteredProducts = filteredProducts.filter((product: Product) =>
            product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.shortDescription.toLowerCase().includes(searchTerm.toLowerCase())
          )
        }

        // Apply price range filter
        if (priceRange !== 'all') {
          filteredProducts = filteredProducts.filter((product: Product) => {
            const price = product.salePrice
            switch (priceRange) {
              case 'under-1000':
                return price < 1000
              case '1000-5000':
                return price >= 1000 && price <= 5000
              case '5000-10000':
                return price >= 5000 && price <= 10000
              case 'over-10000':
                return price > 10000
              default:
                return true
            }
          })
        }

        setProducts(filteredProducts)
      } else {
        setProducts([])
      }
    } catch (error) {
      console.error('Error fetching products:', error)
      setProducts([])
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los productos',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }, [categoryKey, categoryData?.name, subcategoryFilter, sortBy, priceRange, searchTerm, toast])

  useEffect(() => {
    if (categoryKey) {
      fetchProducts()
    }
  }, [categoryKey, fetchProducts])

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

  const filteredProducts = products.filter(product =>
    searchTerm === '' || 
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.shortDescription.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (!categoryData) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Categoría no encontrada</h1>
            <Link href="/">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver al inicio
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <Link href="/" className="hover:text-foreground">Inicio</Link>
            <span>/</span>
            <Link href="/categories" className="hover:text-foreground">Categorías</Link>
            <span>/</span>
            <span className="text-foreground">{categoryData.name}</span>
          </nav>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                {categoryData.name}
              </h1>
              <p className="text-muted-foreground">
                {products.length} productos encontrados
              </p>
            </div>
            <Link href="/">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
            </Link>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="lg:col-span-2">
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

              <Select value={subcategoryFilter} onValueChange={setSubcategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Subcategoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las subcategorías</SelectItem>
                  {categoryData.subcategories.map((sub) => (
                    <SelectItem key={sub} value={sub}>
                      {sub}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={priceRange} onValueChange={setPriceRange}>
                <SelectTrigger>
                  <SelectValue placeholder="Precio" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los precios</SelectItem>
                  <SelectItem value="under-1000">Menos de $1,000</SelectItem>
                  <SelectItem value="1000-5000">$1,000 - $5,000</SelectItem>
                  <SelectItem value="5000-10000">$5,000 - $10,000</SelectItem>
                  <SelectItem value="over-10000">Más de $10,000</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Más recientes</SelectItem>
                  <SelectItem value="oldest">Más antiguos</SelectItem>
                  <SelectItem value="price-low">Precio: menor a mayor</SelectItem>
                  <SelectItem value="price-high">Precio: mayor a menor</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Products Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
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
        ) : filteredProducts.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="text-4xl mb-4">📦</div>
              <h3 className="text-xl font-semibold mb-2">No hay productos</h3>
              <p className="text-muted-foreground mb-6">
                No se encontraron productos en esta categoría con los filtros aplicados
              </p>
              <Button onClick={() => {
                setSearchTerm('')
                setSubcategoryFilter('all')
                setPriceRange('all')
              }}>
                Limpiar filtros
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <Card key={product._id} className="group hover:shadow-lg transition-all duration-300">
                <CardHeader className="p-0 relative">
                  <div className="relative">
                    <div className="relative w-full h-48">
                      <Image
                        src={product.images[0] || '/placeholder-product.jpg'}
                        alt={product.name}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                        className="object-cover rounded-t-lg group-hover:scale-105 transition-transform duration-300"
                        priority={false}
                      />
                    </div>
                    
                    {/* Discount Badge */}
                    {getDiscountPercentage(product.salePrice, product.recommendedResalePrice) > 0 && (
                      <Badge 
                        variant="destructive"
                        className="absolute top-2 left-2"
                      >
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
                
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {/* Supplier */}
                    <div className="text-sm text-muted-foreground">
                      {product.supplierName}
                    </div>
                    
                    {/* Product Name */}
                    <Link href={`/products/${product._id}`}>
                      <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                        {product.name}
                      </h3>
                    </Link>
                    
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
                      <span className="text-xs text-muted-foreground">
                        ({product.reviewCount})
                      </span>
                    </div>
                    
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
                      <div className="text-xs text-muted-foreground">
                        Mínimo: {product.minOrderQuantity} {product.unitType}
                      </div>
                    </div>
                    
                    {/* Add to Cart Button */}
                    <Button
                      onClick={() => handleAddToCart(product)}
                      disabled={product.stock === 0}
                      className="w-full"
                      size="sm"
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      {product.stock > 0 ? 'Agregar al Carrito' : 'Sin Stock'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
