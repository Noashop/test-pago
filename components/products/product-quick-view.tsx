"use client"

import { useEffect, useState, useCallback } from "react"
import Image from "next/image"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useCartStore } from "@/store/cart-store"
import { formatPrice } from "@/lib/utils"

interface QuickViewProps {
  productId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface ProductDetail {
  _id: string
  name: string
  description: string
  images: string[]
  salePrice: number
  recommendedRetailPrice?: number
  stock?: number
  minimumPurchaseQuantity?: number
  unitType?: string
  supplierId?: { name?: string; businessInfo?: { businessName?: string } }
  category?: string
  subcategory?: string
}

export default function ProductQuickView({ productId, open, onOpenChange }: QuickViewProps) {
  const [loading, setLoading] = useState(false)
  const [product, setProduct] = useState<ProductDetail | null>(null)
  const { toast } = useToast()
  const addToCart = useCartStore((s) => s.addToCart)

  const fetchProduct = useCallback(async () => {
    if (!productId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/products/${productId}`)
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || "No se pudo cargar el producto")
      // API returns { product, relatedProducts }
      const p = data.product
      setProduct({
        _id: p._id,
        name: p.name,
        description: p.description,
        images: p.images && p.images.length ? p.images : ["/placeholder-product.jpg"],
        salePrice: p.salePrice ?? p.price ?? 0,
        recommendedRetailPrice: p.recommendedRetailPrice ?? p.adminRecommendedPrice ?? p.price,
        stock: typeof p.stock === "number" ? p.stock : p.inventory?.quantity ?? p.availableQuantity ?? 0,
        minimumPurchaseQuantity: p.minimumPurchaseQuantity ?? 1,
        unitType: p.unitType ?? "unidad",
        supplierId: p.supplierId,
        category: p.category,
        subcategory: p.subcategory,
      })
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "No se pudo cargar el producto", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [productId, toast])

  useEffect(() => {
    if (open) fetchProduct()
  }, [open, fetchProduct])

  const handleAddToCart = () => {
    if (!product) return
    addToCart({
      id: product._id,
      name: product.name,
      price: product.salePrice,
      image: product.images[0],
      quantity: product.minimumPurchaseQuantity || 1,
      supplierName: product.supplierId?.businessInfo?.businessName || product.supplierId?.name || "Proveedor",
      minOrderQuantity: product.minimumPurchaseQuantity || 1,
      unitType: product.unitType || "unidad",
    })

    toast({ title: "Producto agregado", description: `${product.name} agregado al carrito` })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Vista rápida</DialogTitle>
          <DialogDescription>Visualiza la información del producto y añádelo al carrito.</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="aspect-square bg-muted animate-pulse rounded" />
            <div className="space-y-3">
              <div className="h-6 bg-muted animate-pulse rounded w-3/4" />
              <div className="h-4 bg-muted animate-pulse rounded w-full" />
              <div className="h-4 bg-muted animate-pulse rounded w-5/6" />
              <div className="h-10 bg-muted animate-pulse rounded w-40" />
            </div>
          </div>
        ) : product ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="relative aspect-square">
              <Image
                src={product.images[0] || "/placeholder-product.jpg"}
                alt={product.name}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover rounded"
              />
              {product.stock !== undefined && (
                <Badge className="absolute top-2 left-2" variant={product.stock > 0 ? "default" : "destructive"}>
                  {product.stock > 0 ? "En stock" : "Sin stock"}
                </Badge>
              )}
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold">{product.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {product.category}
                  {product.subcategory ? ` • ${product.subcategory}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-primary">{formatPrice(product.salePrice)}</span>
                {product.recommendedRetailPrice && product.recommendedRetailPrice > product.salePrice && (
                  <span className="text-sm line-through text-muted-foreground">
                    {formatPrice(product.recommendedRetailPrice)}
                  </span>
                )}
              </div>
              <p className="text-sm text-foreground/80 line-clamp-5">{product.description}</p>
              <div className="flex items-center gap-2">
                <Button onClick={handleAddToCart} disabled={(product.stock ?? 0) <= 0}>
                  Agregar al carrito
                </Button>
                <Button variant="outline" onClick={() => onOpenChange(false)}>Cerrar</Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">Producto no disponible.</div>
        )}
      </DialogContent>
    </Dialog>
  )
}
