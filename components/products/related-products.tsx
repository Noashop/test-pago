'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ShoppingCart, Star, Heart } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useCartStore } from '@/store/cart-store'
import { useToast } from '@/hooks/use-toast'
import { formatPrice } from '@/lib/utils'

interface RelatedProduct {
  _id: string
  name: string
  price: number
  comparePrice?: number
  images: string[]
  rating: number
  reviewCount: number
  supplier: {
    businessName: string
  }
  inventory: {
    quantity: number
  }
}

interface RelatedProductsProps {
  products: RelatedProduct[]
}

export function RelatedProducts({ products }: RelatedProductsProps) {
  const addToCart = useCartStore((state) => state.addToCart)
  const { toast } = useToast()

  const handleAddToCart = (product: RelatedProduct, e: React.MouseEvent) => {
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

    addToCart({
      id: product._id,
      name: product.name,
      price: product.price,
      image: product.images[0],
      quantity: 1,
      supplierName: product.supplier.businessName,
      minOrderQuantity: 1,
      unitType: 'unidad',
      productId: product._id,
      category: (product as any).category || '',
    })

    toast({
      title: 'Producto agregado',
      description: `${product.name} se agregó al carrito`,
    })
  }

  if (products.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Productos Relacionados</CardTitle>
        <CardDescription>
          Otros productos que podrían interesarte
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {products.slice(0, 4).map((product) => {
            const discountPercentage = product.comparePrice 
              ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
              : 0

            return (
              <Link key={product._id} href={`/products/${product._id}`}>
                <div className="group border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                  <div className="relative aspect-square">
                    <Image
                      src={product.images[0] || '/placeholder-product.jpg'}
                      alt={product.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    
                    {discountPercentage > 0 && (
                      <Badge className="absolute top-2 left-2 bg-red-500 text-white">
                        -{discountPercentage}%
                      </Badge>
                    )}
                    
                    {product.inventory.quantity === 0 && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Badge variant="destructive" className="text-white">
                          Agotado
                        </Badge>
                      </div>
                    )}
                    
                    <button 
                      className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                      }}
                    >
                      <Heart className="h-4 w-4 text-gray-600" />
                    </button>
                  </div>
                  
                  <div className="p-3 space-y-2">
                    <h4 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
                      {product.name}
                    </h4>
                    
                    <p className="text-xs text-muted-foreground">
                      {product.supplier.businessName}
                    </p>
                    
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3 w-3 ${
                            i < Math.floor(product.rating)
                              ? 'text-yellow-400 fill-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                      <span className="text-xs text-muted-foreground ml-1">
                        ({product.reviewCount})
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-primary">
                          {formatPrice(product.price)}
                        </span>
                        {product.comparePrice && (
                          <span className="text-xs text-muted-foreground line-through">
                            {formatPrice(product.comparePrice)}
                          </span>
                        )}
                      </div>
                      
                      <Button
                        onClick={(e) => handleAddToCart(product, e)}
                        disabled={product.inventory.quantity === 0}
                        size="sm"
                        className="w-full"
                      >
                        <ShoppingCart className="h-3 w-3 mr-1" />
                        {product.inventory.quantity === 0 ? 'Agotado' : 'Agregar'}
                      </Button>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
        
        {products.length > 4 && (
          <div className="text-center mt-6">
            <Button variant="outline">
              Ver más productos relacionados
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
