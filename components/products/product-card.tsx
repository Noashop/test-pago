'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Heart, ShoppingCart, Star, Eye } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useCartStore } from '@/store/cart-store'
import { useToast } from '@/hooks/use-toast'
import { formatPrice } from '@/lib/utils'

interface Product {
  _id: string
  name: string
  description: string
  price: number
  comparePrice?: number
  images: string[]
  category: string
  brand?: string
  rating: number
  reviewCount: number
  supplier: {
    _id: string
    businessName: string
  }
  inventory: {
    quantity: number
  }
  featured: boolean
  minimumPurchaseQuantity: number
  recommendedRetailPrice?: number
  salePrice: number
}

interface ProductCardProps {
  product: Product
  viewMode?: 'grid' | 'list'
}

export function ProductCard({ product, viewMode = 'grid' }: ProductCardProps) {
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const addToCart = useCartStore((state) => state.addToCart)
  const { toast } = useToast()

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (product.inventory.quantity === 0) {
      toast({
        title: 'Producto agotado',
        description: 'Este producto no está disponible en este momento',
        variant: 'destructive',
      })
      return
    }

    // Verificar cantidad mínima disponible
    const minQuantity = product.minimumPurchaseQuantity || 1
    if (product.inventory.quantity < minQuantity) {
      toast({
        title: 'Stock insuficiente',
        description: `Este producto requiere un mínimo de ${minQuantity} unidades, pero solo hay ${product.inventory.quantity} disponibles`,
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)
    try {
      // Agregar con la cantidad mínima requerida
      addToCart({
        id: product._id,
        name: product.name,
        price: product.salePrice || product.price,
        image: product.images[0],
        quantity: minQuantity,
        supplierName: product.supplier.businessName || product.supplier._id,
        minOrderQuantity: minQuantity,
        unitType: 'unidad'
      })

      // Calcular y mostrar mensaje de ganancia potencial si hay precio recomendado
      let profitMessage = `${product.name} agregado al carrito (${minQuantity} unidades)`
      
      if (product.recommendedRetailPrice && product.salePrice) {
        const profitPerUnit = product.recommendedRetailPrice - product.salePrice
        const totalProfit = profitPerUnit * minQuantity
        const profitPercentage = ((profitPerUnit / product.salePrice) * 100).toFixed(1)
        
        if (totalProfit > 0) {
          profitMessage = `¡Excelente oportunidad! Podrías ganar $${totalProfit.toLocaleString('es-AR')} (${profitPercentage}% de ganancia) revendiendo este producto.`
        }
      }

      toast({
        title: 'Producto agregado',
        description: profitMessage,
        duration: 5000, // Mostrar más tiempo para que lean el mensaje de ganancia
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo agregar el producto al carrito',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsWishlisted(!isWishlisted)
    
    toast({
      title: isWishlisted ? 'Eliminado de favoritos' : 'Agregado a favoritos',
      description: `${product.name} ${isWishlisted ? 'eliminado de' : 'agregado a'} tu lista de favoritos`,
    })
  }

  const discountPercentage = product.comparePrice 
    ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
    : 0

  if (viewMode === 'list') {
    return (
      <Link href={`/products/${product._id}`}>
        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardContent className="p-4">
            <div className="flex gap-4">
              {/* Image */}
              <div className="relative w-32 h-32 flex-shrink-0">
                <Image
                  src={product.images[0] || '/placeholder-product.jpg'}
                  alt={product.name}
                  fill
                  className="object-cover rounded-lg"
                />
                {product.featured && (
                  <Badge className="absolute top-2 left-2 bg-accent text-white">
                    Destacado
                  </Badge>
                )}
                {discountPercentage > 0 && (
                  <Badge className="absolute top-2 right-2 bg-red-500 text-white">
                    -{discountPercentage}%
                  </Badge>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-lg line-clamp-2">{product.name}</h3>
                    <p className="text-sm text-muted-foreground">{product.supplier.businessName}</p>
                  </div>
                  <button
                    onClick={handleToggleWishlist}
                    className="text-muted-foreground hover:text-red-500 transition-colors"
                  >
                    <Heart className={`h-5 w-5 ${isWishlisted ? 'fill-red-500 text-red-500' : ''}`} />
                  </button>
                </div>

                <p className="text-sm text-muted-foreground line-clamp-2">
                  {product.description}
                </p>

                <div className="flex items-center gap-2">
                  <div className="flex items-center">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < Math.floor(product.rating)
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    ({product.reviewCount})
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-primary">
                        {formatPrice(product.price)}
                      </span>
                      {product.comparePrice && (
                        <span className="text-sm text-muted-foreground line-through">
                          {formatPrice(product.comparePrice)}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Stock: {product.inventory.quantity} unidades
                    </p>
                  </div>

                  <Button
                    onClick={handleAddToCart}
                    disabled={isLoading || product.inventory.quantity === 0 || product.inventory.quantity < (product.minimumPurchaseQuantity || 1)}
                    size="sm"
                    className="flex-shrink-0"
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    {product.inventory.quantity === 0 
                      ? 'Agotado' 
                      : product.inventory.quantity < (product.minimumPurchaseQuantity || 1)
                      ? `Stock insuf. (${product.minimumPurchaseQuantity || 1})`
                      : `Agregar ${product.minimumPurchaseQuantity || 1}`
                    }
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    )
  }

  return (
    <Link href={`/products/${product._id}`}>
      <Card className="group hover:shadow-lg transition-all duration-300">
        <div className="relative aspect-square overflow-hidden rounded-t-lg">
          <Image
            src={product.images[0] || '/placeholder-product.jpg'}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
          
          {/* Badges */}
          <div className="absolute top-2 left-2 space-y-1">
            {product.featured && (
              <Badge className="bg-accent text-white">
                Destacado
              </Badge>
            )}
            {discountPercentage > 0 && (
              <Badge className="bg-red-500 text-white">
                -{discountPercentage}%
              </Badge>
            )}
          </div>

          {/* Actions */}
          <div className="absolute top-2 right-2 space-y-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handleToggleWishlist}
              className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-gray-50 transition-colors"
            >
              <Heart className={`h-4 w-4 ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
            </button>
            <Link href={`/products/${product._id}`} className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-gray-50 transition-colors">
              <Eye className="h-4 w-4 text-gray-600" />
            </Link>
          </div>

          {/* Stock indicator */}
          {product.inventory.quantity === 0 && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Badge variant="destructive" className="text-white">
                Agotado
              </Badge>
            </div>
          )}
        </div>

        <CardContent className="p-4 space-y-3">
          <div className="space-y-1">
            <h3 className="font-semibold line-clamp-2 group-hover:text-primary transition-colors">
              {product.name}
            </h3>
            <p className="text-sm text-muted-foreground">
              {product.supplier.businessName}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${
                    i < Math.floor(product.rating)
                      ? 'text-yellow-400 fill-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-muted-foreground">
              ({product.reviewCount})
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-primary">
                {formatPrice(product.price)}
              </span>
              {product.comparePrice && (
                <span className="text-sm text-muted-foreground line-through">
                  {formatPrice(product.comparePrice)}
                </span>
              )}
            </div>
            
            <Button
              onClick={handleAddToCart}
              disabled={isLoading || product.inventory.quantity === 0 || product.inventory.quantity < (product.minimumPurchaseQuantity || 1)}
              className="w-full"
              size="sm"
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              {product.inventory.quantity === 0 
                ? 'Agotado' 
                : product.inventory.quantity < (product.minimumPurchaseQuantity || 1)
                ? `Stock insuficiente (mín. ${product.minimumPurchaseQuantity || 1})`
                : `Agregar ${product.minimumPurchaseQuantity || 1} al Carrito`
              }
            </Button>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
