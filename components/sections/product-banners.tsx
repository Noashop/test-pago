'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Star, ShoppingCart, Eye, TrendingUp, Zap, Gift } from 'lucide-react'
import { useCartStore } from '@/store/cart-store'
import { useToast } from '@/hooks/use-toast'
import Image from 'next/image'

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

export default function ProductBanners() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const addToCart = useCartStore((state) => state.addToCart)
  const { toast } = useToast()

  const fetchBannerProducts = useCallback(async () => {
    try {
      // Obtener productos con mejor rating y más vendidos (API ya filtra aprobados/activos)
      const response = await fetch('/api/products?limit=6&sortBy=rating&sortOrder=desc&inStock=true')
      if (response.ok) {
        const data = await response.json()
        const productsWithStock = (data.data?.products || data.products || []).filter(
          (product: any) => product.stock > 0
        )
        setProducts(productsWithStock.slice(0, 6))
      }
    } catch (error) {
      console.error('Error fetching banner products:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBannerProducts()
  }, [fetchBannerProducts])

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

    setTimeout(() => {
      window.location.href = '/products'
    }, 2000)
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
      <div className="py-16 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <div className="h-8 bg-gray-200 rounded w-64 mx-auto mb-4 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-96 mx-auto animate-pulse"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (products.length === 0) {
    return null
  }

  return (
    <div className="py-16 bg-gradient-to-r from-blue-50 to-purple-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <TrendingUp className="h-8 w-8 text-primary mr-3" />
            <h2 className="text-3xl font-bold text-gray-900">
              Productos Más Valorados
            </h2>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Los productos con mejor calificación y más demandados por nuestros mayoristas
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product, index) => (
            <Card key={product._id} className="group hover:shadow-xl transition-all duration-300 bg-white border-0 overflow-hidden">
              <CardContent className="p-0">
                <div className="flex items-center space-x-4 p-4">
                  {/* Ranking Badge */}
                  <div className="flex-shrink-0">
                    <div className="relative w-20 h-20">
                      <Image
                        src={product.images[0] || '/placeholder-product.jpg'}
                        alt={product.name}
                        fill
                        sizes="80px"
                        className="object-cover rounded-lg group-hover:scale-105 transition-transform duration-300"
                      />
                      <Badge 
                        className="absolute -top-2 -left-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold"
                      >
                        #{index + 1}
                      </Badge>
                      {getDiscountPercentage(product.salePrice, product.recommendedResalePrice) > 0 && (
                        <Badge 
                          variant="destructive" 
                          className="absolute -bottom-2 -right-2 text-xs"
                        >
                          -{getDiscountPercentage(product.salePrice, product.recommendedResalePrice)}%
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <div className="space-y-2">
                      <Link href={`/products/${product._id}`}>
                        <h3 className="font-semibold text-gray-900 group-hover:text-primary transition-colors line-clamp-2 text-sm">
                          {product.name}
                        </h3>
                      </Link>
                      
                      <div className="text-xs text-gray-500">
                        {product.supplierName}
                      </div>

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

                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-lg font-bold text-primary">
                              {formatPrice(product.salePrice)}
                            </span>
                            {product.recommendedResalePrice > product.salePrice && (
                              <span className="text-xs text-gray-500 line-through">
                                {formatPrice(product.recommendedResalePrice)}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500">
                            Min: {product.minOrderQuantity} {product.unitType}
                          </div>
                        </div>

                        <div className="flex space-x-1">
                          <Link href={`/products/${product._id}`} passHref>
                            <Button size="sm" variant="outline" className="p-2">
                              <Eye className="h-3 w-3" />
                            </Button>
                          </Link>
                          <Button
                            size="sm"
                            onClick={() => handleAddToCart(product)}
                            disabled={product.stock === 0}
                            className="p-2"
                          >
                            <ShoppingCart className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Call to Action */}
        <div className="text-center mt-12">
          <div className="bg-white rounded-lg p-8 shadow-lg max-w-2xl mx-auto">
            <div className="flex items-center justify-center mb-4">
              <Gift className="h-8 w-8 text-primary mr-3" />
              <h3 className="text-2xl font-bold text-gray-900">
                ¡No te pierdas estas ofertas!
              </h3>
            </div>
            <p className="text-gray-600 mb-6">
              Productos con las mejores calificaciones y precios mayoristas exclusivos
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/products">
                <Button size="lg" className="w-full sm:w-auto">
                  <Zap className="mr-2 h-4 w-4" />
                  Ver Todos los Productos
                </Button>
              </Link>
              <Link href="/categories">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  Explorar Categorías
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
