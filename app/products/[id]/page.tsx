'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { 
  Heart, 
  ShoppingCart, 
  Star, 
  Minus, 
  Plus, 
  Share2, 
  Truck, 
  Shield, 
  RotateCcw,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

import Navbar from '@/components/layout/navbar'
import Footer from '@/components/layout/footer'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ProductReviews } from '@/components/products/product-reviews'
import { RelatedProducts } from '@/components/products/related-products'
import { useCartStore } from '@/store/cart-store'
import { useToast } from '@/hooks/use-toast'
import { formatPrice } from '@/lib/utils'

interface Product {
  _id: string
  name: string
  description: string
  shortDescription?: string
  price: number
  comparePrice?: number
  images: string[]
  category: string
  brand?: string
  sku: string
  rating: number
  reviewCount: number
  supplier: {
    _id: string
    businessName: string
    description?: string
    rating: number
  }
  inventory: {
    quantity: number
    lowStockThreshold: number
  }
  shipping: {
    weight: number
    freeShipping: boolean
  }
  variants?: Array<{
    name: string
    options: string[]
  }>
  tags: string[]
  featured: boolean
  status: string
}

export default function ProductDetailPage() {
  const params = useParams()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({})
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [relatedProducts, setRelatedProducts] = useState([])
  
  const addToCart = useCartStore((state) => state.addToCart)
  const { toast } = useToast()

  const fetchProduct = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/products/${id}`)
      const data = await response.json()

      if (response.ok) {
        setProduct(data.product)
        setRelatedProducts(data.relatedProducts || [])
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo cargar el producto',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    if (params.id) {
      fetchProduct(params.id as string)
    }
  }, [params.id, fetchProduct])

  const handleAddToCart = () => {
    if (!product) return

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
      quantity: quantity,
      supplierName: product.supplier.businessName || product.supplier._id,
      minOrderQuantity: (product as any).minimumPurchaseQuantity || 1,
      unitType: (product as any).unitType || 'unidad',
      // variants: selectedVariants, // Comentado temporalmente
    })

    toast({
      title: 'Producto agregado',
      description: `${product.name} se agregó al carrito`,
    })
  }

  const handleToggleWishlist = () => {
    setIsWishlisted(!isWishlisted)
    toast({
      title: isWishlisted ? 'Eliminado de favoritos' : 'Agregado a favoritos',
      description: `${product?.name} ${isWishlisted ? 'eliminado de' : 'agregado a'} tu lista de favoritos`,
    })
  }

  const discountPercentage = product?.comparePrice 
    ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
    : 0

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <div className="aspect-square bg-muted rounded-lg" />
              <div className="space-y-4">
                <div className="h-8 bg-muted rounded w-3/4" />
                <div className="h-4 bg-muted rounded w-1/2" />
                <div className="h-6 bg-muted rounded w-1/4" />
                <div className="h-12 bg-muted rounded" />
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Producto no encontrado</h1>
            <Link href="/products">
              <Button>Volver a productos</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-8">
          <Link href="/" className="hover:text-foreground">Inicio</Link>
          <span>/</span>
          <Link href="/products" className="hover:text-foreground">Productos</Link>
          <span>/</span>
          <Link href={`/products?category=${product.category}`} className="hover:text-foreground">
            {product.category}
          </Link>
          <span>/</span>
          <span className="text-foreground">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="relative aspect-square overflow-hidden rounded-lg border">
              <Image
                src={product.images[selectedImage] || '/placeholder-product.jpg'}
                alt={product.name}
                fill
                className="object-cover"
              />
              
              {/* Badges */}
              <div className="absolute top-4 left-4 space-y-2">
                {product.featured && (
                  <Badge className="bg-accent text-white">Destacado</Badge>
                )}
                {discountPercentage > 0 && (
                  <Badge className="bg-red-500 text-white">
                    -{discountPercentage}%
                  </Badge>
                )}
                {product.inventory.quantity <= product.inventory.lowStockThreshold && (
                  <Badge variant="destructive">Últimas unidades</Badge>
                )}
              </div>

              {/* Navigation arrows */}
              {product.images.length > 1 && (
                <>
                  <button
                    onClick={() => setSelectedImage(selectedImage > 0 ? selectedImage - 1 : product.images.length - 1)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 rounded-full flex items-center justify-center hover:bg-white transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setSelectedImage(selectedImage < product.images.length - 1 ? selectedImage + 1 : 0)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 rounded-full flex items-center justify-center hover:bg-white transition-colors"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnail images */}
            {product.images.length > 1 && (
              <div className="flex space-x-2 overflow-x-auto">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`relative w-20 h-20 flex-shrink-0 rounded-md overflow-hidden border-2 ${
                      selectedImage === index ? 'border-primary' : 'border-transparent'
                    }`}
                  >
                    <Image
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-playfair font-bold text-foreground mb-2">
                {product.name}
              </h1>
              <p className="text-muted-foreground">
                SKU: {product.sku} | Marca: {product.brand || 'Sin marca'}
              </p>
            </div>

            {/* Rating */}
            <div className="flex items-center space-x-2">
              <div className="flex items-center">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${
                      i < Math.floor(product.rating)
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">
                {product.rating.toFixed(1)} ({product.reviewCount} reseñas)
              </span>
            </div>

            {/* Price */}
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <span className="text-3xl font-bold text-primary">
                  {formatPrice(product.price)}
                </span>
                {product.comparePrice && (
                  <span className="text-lg text-muted-foreground line-through">
                    {formatPrice(product.comparePrice)}
                  </span>
                )}
              </div>
              {product.shipping.freeShipping && (
                <Badge variant="outline" className="text-green-600 border-green-600">
                  Envío gratis
                </Badge>
              )}
            </div>

            {/* Short Description */}
            {product.shortDescription && (
              <p className="text-muted-foreground">
                {product.shortDescription}
              </p>
            )}

            {/* Variants */}
            {product.variants && product.variants.length > 0 && (
              <div className="space-y-4">
                {product.variants.map((variant) => (
                  <div key={variant.name}>
                    <label className="block text-sm font-medium mb-2">
                      {variant.name}
                    </label>
                    <Select
                      value={selectedVariants[variant.name] || ''}
                      onValueChange={(value) => 
                        setSelectedVariants(prev => ({ ...prev, [variant.name]: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={`Selecciona ${variant.name.toLowerCase()}`} />
                      </SelectTrigger>
                      <SelectContent>
                        {variant.options.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            )}

            {/* Quantity and Add to Cart */}
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="flex items-center border rounded-lg">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="px-4 py-2 font-medium">{quantity}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setQuantity(Math.min(product.inventory.quantity, quantity + 1))}
                    disabled={quantity >= product.inventory.quantity}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <span className="text-sm text-muted-foreground">
                  {product.inventory.quantity} disponibles
                </span>
              </div>

              <div className="flex space-x-3">
                <Button
                  onClick={handleAddToCart}
                  disabled={product.inventory.quantity === 0}
                  className="flex-1"
                  size="lg"
                >
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  {product.inventory.quantity === 0 ? 'Agotado' : 'Agregar al Carrito'}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleToggleWishlist}
                  size="lg"
                >
                  <Heart className={`h-5 w-5 ${isWishlisted ? 'fill-red-500 text-red-500' : ''}`} />
                </Button>
                <Button variant="outline" size="lg">
                  <Share2 className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Supplier Info */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">Vendido por</h4>
                    <p className="text-primary font-medium">{product.supplier.businessName}</p>
                    <div className="flex items-center mt-1">
                      <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                      <span className="text-sm text-muted-foreground ml-1">
                        {product.supplier.rating.toFixed(1)}
                      </span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Ver Tienda
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Features */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t">
              <div className="text-center">
                <Truck className="h-6 w-6 mx-auto mb-2 text-primary" />
                <p className="text-xs text-muted-foreground">Envío rápido</p>
              </div>
              <div className="text-center">
                <Shield className="h-6 w-6 mx-auto mb-2 text-primary" />
                <p className="text-xs text-muted-foreground">Compra segura</p>
              </div>
              <div className="text-center">
                <RotateCcw className="h-6 w-6 mx-auto mb-2 text-primary" />
                <p className="text-xs text-muted-foreground">Garantía</p>
              </div>
            </div>
          </div>
        </div>

        {/* Product Details Tabs */}
        <Tabs defaultValue="description" className="mb-12">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="description">Descripción</TabsTrigger>
            <TabsTrigger value="specifications">Especificaciones</TabsTrigger>
            <TabsTrigger value="reviews">Reseñas ({product.reviewCount})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="description" className="mt-6">
            <Card>
              <CardContent className="p-6">
                <div className="prose max-w-none">
                  <p className="whitespace-pre-line">{product.description}</p>
                  
                  {product.tags.length > 0 && (
                    <div className="mt-6">
                      <h4 className="font-semibold mb-2">Etiquetas:</h4>
                      <div className="flex flex-wrap gap-2">
                        {product.tags.map((tag) => (
                          <Badge key={tag} variant="secondary">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="specifications" className="mt-6">
            <Card>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Información General</h4>
                    <dl className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">SKU:</dt>
                        <dd>{product.sku}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Marca:</dt>
                        <dd>{product.brand || 'Sin marca'}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Categoría:</dt>
                        <dd>{product.category}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Peso:</dt>
                        <dd>{product.shipping.weight} kg</dd>
                      </div>
                    </dl>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Disponibilidad</h4>
                    <dl className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Stock:</dt>
                        <dd>{product.inventory.quantity} unidades</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Estado:</dt>
                        <dd>
                          <Badge variant={product.status === 'active' ? 'default' : 'secondary'}>
                            {product.status === 'active' ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="reviews" className="mt-6">
            <ProductReviews productId={product._id} />
          </TabsContent>
        </Tabs>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <RelatedProducts products={relatedProducts} />
        )}
      </main>
      
      <Footer />
    </div>
  )
}
