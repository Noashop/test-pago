'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Star, ShoppingCart, Eye, Heart, ArrowRight } from 'lucide-react'
import { useCartStore } from '@/store/cart-store'
import { useToast } from '@/hooks/use-toast'
import Image from 'next/image'
import ProductQuickView from '@/components/products/product-quick-view'

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
}

export default function FeaturedProducts() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const addToCart = useCartStore((state) => state.addToCart)
  const { toast } = useToast()
  const [quickProductId, setQuickProductId] = useState<string | null>(null)
  const [quickOpen, setQuickOpen] = useState(false)

  const fetchFeaturedProducts = useCallback(async () => {
    try {
      // Solo productos aprobados y con stock disponible (por defecto en API)
      const response = await fetch('/api/products?featured=true&limit=8&inStock=true')
      if (response.ok) {
        const data = await response.json()
        // Filtrar productos que tengan stock > 0
        const productsWithStock = (data.data?.products || data.products || []).filter(
          (product: any) => product.stock > 0
        )
        setProducts(productsWithStock)
      }
    } catch (error) {
      console.error('Error fetching featured products:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchFeaturedProducts()
  }, [fetchFeaturedProducts])

  const handleAddToCart = (product: Product) => {
    addToCart({
      id: product._id,
      name: product.name,
      price: product.salePrice,
      image: product.images[0],
      quantity: product.minOrderQuantity,
      supplierName: product.supplierName,
      minOrderQuantity: product.minOrderQuantity,
      unitType: product.unitType,
      recommendedRetailPrice: product.recommendedResalePrice
    })
    
    // Textos de incentivo personalizados
    const incentiveMessages = [
      '¡Excelente elección! 🎉 Este producto es muy popular entre mayoristas',
      '¡Agregado con éxito! 🛒 Aprovecha los precios mayoristas exclusivos',
      '¡Perfecto! 💪 Estás ahorrando con nuestros precios especiales',
      '¡Genial! ⭐ Este producto tiene excelentes reseñas de otros compradores',
      '¡Bien hecho! 🚀 Continúa comprando para maximizar tu ahorro'
    ]
    
    const randomMessage = incentiveMessages[Math.floor(Math.random() * incentiveMessages.length)]
    
    toast({
      title: '¡Producto agregado al carrito!',
      description: randomMessage,
      duration: 4000,
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

  if (loading) {
    return (
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
    )
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">📦</div>
        <h3 className="text-xl font-semibold mb-2">No hay productos destacados</h3>
        <p className="text-gray-600 mb-6">
          Pronto tendremos productos destacados para ti
        </p>
        <Link href="/products">
          <Button>Ver todos los productos</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <Card key={product._id} className="group hover:shadow-lg transition-all duration-300">
            <CardHeader className="p-0 relative">
              <div className="relative h-48">
                <Image
                  src={product.images[0] || '/placeholder-product.jpg'}
                  alt={product.name}
                  fill
                  sizes="(max-width: 1024px) 100vw, 25vw"
                  className="object-cover rounded-t-lg group-hover:scale-105 transition-transform duration-300"
                />
                
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
                    className="bg-primary hover:bg-primary/90 text-white"
                  >
                    <ShoppingCart className="h-4 w-4" />
                  </Button>
                  <Link href={`/products/${product._id}`}>
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-white hover:bg-gray-100"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-4">
              <div className="space-y-3">
                {/* Supplier */}
                <div className="text-sm text-gray-500">
                  {product.supplierName}
                </div>
                
                {/* Product Name */}
                <Link href={`/products/${product._id}`}>
                  <h3 className="font-semibold text-gray-900 group-hover:text-primary transition-colors line-clamp-2">
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
                  <span className="text-xs text-gray-500">
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
                      <span className="text-sm text-gray-500 line-through">
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
      
      {/* View All Button */}
      <div className="text-center">
        <Link href="/products">
          <Button variant="outline" size="lg">
            Ver todos los productos
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>

      {/* Quick View Modal */}
      <ProductQuickView
        productId={quickProductId}
        open={quickOpen}
        onOpenChange={(o) => { setQuickOpen(o); if (!o) setQuickProductId(null) }}
      />
    </div>
  )
}
