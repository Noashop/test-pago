'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Heart, ShoppingCart, Star, Eye } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useCartStore } from '@/store/cart-store'
import { useToast } from '@/hooks/use-toast'
import { formatPrice } from '@/lib/utils'

interface WishlistProduct {
  _id: string
  name: string
  price: number
  images: string[]
  rating: number
  supplier: {
    businessName: string
  }
}

interface WishlistPreviewProps {
  products: WishlistProduct[]
}

export function WishlistPreview({ products }: WishlistPreviewProps) {
  const addToCart = useCartStore((state) => state.addToCart)
  const { toast } = useToast()

  const handleAddToCart = (product: WishlistProduct) => {
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lista de Deseos</CardTitle>
        <CardDescription>
          Productos que te interesan
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {products.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Heart className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Tu lista de deseos está vacía</p>
              <Button className="mt-4" size="sm">
                Explorar Productos
              </Button>
            </div>
          ) : (
            products.slice(0, 4).map((product) => (
              <div key={product._id} className="flex items-center space-x-3 p-2 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="relative w-16 h-16 flex-shrink-0">
                  <Image
                    src={product.images[0] || '/placeholder-product.jpg'}
                    alt={product.name}
                    fill
                    className="object-cover rounded-md"
                  />
                </div>
                
                <div className="flex-1 space-y-1">
                  <h4 className="font-medium text-sm line-clamp-2">
                    {product.name}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {product.supplier.businessName}
                  </p>
                  
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center">
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
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {product.rating.toFixed(1)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-primary">
                      {formatPrice(product.price)}
                    </span>
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2"
                        onClick={() => handleAddToCart(product)}
                      >
                        <ShoppingCart className="h-3 w-3" />
                      </Button>
                      <Link href={`/products/${product._id}`}>
                        <Button variant="ghost" size="sm" className="h-6 px-2">
                          <Eye className="h-3 w-3" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
          
          {products.length > 4 && (
            <div className="text-center pt-4">
              <Button variant="outline" size="sm">
                Ver lista completa
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
