'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ShoppingCart, Heart, Eye, Star } from 'lucide-react'
import { motion } from 'framer-motion'
import { useProducts } from '@/hooks/use-products'
import { useCartStore } from '@/store/cart-store'
import { useToast } from '@/hooks/use-toast'
import { useLogger } from '@/lib/logger'
import { AnimatedCard, AnimatedButton } from '@/components/ui/animated-card'
import { ProductImage } from '@/components/ui/optimized-image'
import { Button } from '@/components/ui/button'
import ProductQuickView from '@/components/products/product-quick-view'
import { Badge } from '@/components/ui/badge'
import { formatPrice } from '@/lib/utils'

interface ProductCardEnhancedProps {
  product: {
    _id: string
    name: string
    description: string
    price: number
    comparePrice?: number
    images: string[]
    category: string
    brand?: string
    rating?: number
    reviewCount?: number
    inventory: {
      quantity: number
    }
    supplier: {
      businessName: string
    }
    slug: string
  }
  index?: number
}

export function ProductCardEnhanced({ product, index = 0 }: ProductCardEnhancedProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [quickOpen, setQuickOpen] = useState(false)
  const addToCart = useCartStore((state) => state.addToCart)
  const { toast } = useToast()
  const logger = useLogger()

  const discount = product.comparePrice 
    ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
    : 0

  const handleAddToCart = () => {
    try {
      addToCart({
        id: product._id,
        name: product.name,
        price: product.price,
        image: product.images[0],
        quantity: 1,
        supplierName: product.supplier.businessName,
        minOrderQuantity: 1,
        unitType: 'unidad',
      })

      toast({
        title: 'Producto agregado',
        description: `${product.name} se agregó al carrito`,
      })

      logger.userAction('add_to_cart', {
        productId: product._id,
        productName: product.name,
        price: product.price,
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo agregar el producto al carrito',
        variant: 'destructive',
      })

      logger.error('Failed to add product to cart', error as Error, {
        productId: product._id,
        productName: product.name,
      })
    }
  }

  const handleWishlistToggle = () => {
    setIsWishlisted(!isWishlisted)
    
    logger.userAction('toggle_wishlist', {
      productId: product._id,
      productName: product.name,
      action: isWishlisted ? 'remove' : 'add',
    })

    toast({
      title: isWishlisted ? 'Removido de favoritos' : 'Agregado a favoritos',
      description: isWishlisted 
        ? `${product.name} se removió de tus favoritos`
        : `${product.name} se agregó a tus favoritos`,
    })
  }

  const handleQuickView = () => {
    logger.userAction('quick_view', {
      productId: product._id,
      productName: product.name,
    })
    setQuickOpen(true)
  }

  return (
    <div
      className="group relative overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <AnimatedCard
        delay={index * 0.1}
        hover={true}
        clickable={true}
        className="relative"
      >
      {/* Badge de descuento */}
      {discount > 0 && (
        <Badge className="absolute top-2 left-2 z-10 bg-red-500 text-white">
          -{discount}%
        </Badge>
      )}

      {/* Badge de stock */}
      {product.inventory.quantity <= 0 && (
        <Badge className="absolute top-2 right-2 z-10 bg-gray-500 text-white">
          Sin stock
        </Badge>
      )}

      {/* Imagen del producto */}
      <div className="relative aspect-square overflow-hidden">
        <ProductImage
          src={product.images[0]}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          priority={index < 4}
        />
        
        {/* Overlay con acciones */}
        <motion.div
          className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 1 : 0 }}
        >
          <div className="flex gap-2">
            <Link href={`/products/${product._id}`}>
              <AnimatedButton
                variant="default"
                className="p-2"
              >
                <Eye className="h-4 w-4" />
              </AnimatedButton>
            </Link>
            
            <AnimatedButton
              onClick={handleWishlistToggle}
              variant={isWishlisted ? "success" : "default"}
              className="p-2"
            >
              <Heart className={`h-4 w-4 ${isWishlisted ? 'fill-current' : ''}`} />
            </AnimatedButton>
          </div>
        </motion.div>
      </div>

      {/* Contenido del producto */}
      <div className="p-4">
        {/* Categoría y marca */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-500 uppercase tracking-wide">
            {product.category}
          </span>
          {product.brand && (
            <span className="text-xs text-gray-500 font-medium">
              {product.brand}
            </span>
          )}
        </div>

        {/* Nombre del producto */}
        <Link href={`/products/${product.slug}`}>
          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 hover:text-primary transition-colors">
            {product.name}
          </h3>
        </Link>

        {/* Proveedor */}
        <p className="text-xs text-gray-600 mb-2">
          {product.supplier.businessName}
        </p>

        {/* Rating */}
        {product.rating && (
          <div className="flex items-center gap-1 mb-2">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-3 w-3 ${
                    i < Math.floor(product.rating!)
                      ? 'text-yellow-400 fill-current'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-gray-500">
              ({product.reviewCount || 0})
            </span>
          </div>
        )}

        {/* Precios */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg font-bold text-gray-900">
            {formatPrice(product.price)}
          </span>
          {product.comparePrice && product.comparePrice > product.price && (
            <span className="text-sm text-gray-500 line-through">
              {formatPrice(product.comparePrice)}
            </span>
          )}
        </div>

        {/* Botón de agregar al carrito */}
        <Button
          onClick={handleAddToCart}
          disabled={product.inventory.quantity <= 0}
          className="w-full"
          size="sm"
        >
          <ShoppingCart className="h-4 w-4 mr-2" />
          {product.inventory.quantity <= 0 ? 'Sin stock' : 'Agregar al carrito'}
        </Button>
      </div>

      {/* Quick View Modal */}
      <ProductQuickView
        productId={product._id}
        open={quickOpen}
        onOpenChange={setQuickOpen}
      />
      </AnimatedCard>
    </div>
  )
}