"use client"

import dynamic from "next/dynamic"
import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Navbar from "@/components/layout/navbar"
import Footer from "@/components/layout/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ClientLoader } from "@/components/ui/loaders"
import { useCartStore } from "@/store/cart-store"
import { CreditCard } from "lucide-react"

const MercadoPagoCheckoutDynamic = dynamic(
  () => import("@/components/checkout/mercadopago-checkout"),
  { ssr: false }
)

interface OrderResponse {
  order: {
    _id: string
    total: number
    items: Array<{
      product: string
      name: string
      price: number
      quantity: number
      image?: string
    }>
    shippingAddress: any
  }
}

export default function PayOrderPage() {
  const params = useParams()
  const router = useRouter()
  const orderId = params.id as string

  const { clearCart } = useCartStore()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [order, setOrder] = useState<OrderResponse["order"] | null>(null)

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true)
        const res = await fetch(`/api/orders/${orderId}`)
        if (!res.ok) throw new Error("No se pudo cargar la orden")
        const data: OrderResponse = await res.json()
        setOrder(data.order)
      } catch (e: any) {
        setError(e.message || "Error al cargar la orden")
      } finally {
        setLoading(false)
      }
    }
    if (orderId) fetchOrder()
  }, [orderId])

  const itemsForPreference = useMemo(() => {
    return (order?.items || []).map((it: any) => ({
      productId: it.product,
      name: it.name,
      price: Number(it.price),
      quantity: Number(it.quantity),
      image: it.image || ""
    }))
  }, [order])

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-12">
          <ClientLoader />
        </main>
        <Footer />
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-12">
          <Card>
            <CardHeader>
              <CardTitle>Error</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-red-600">{error || "Orden no encontrada"}</p>
              <div className="mt-4">
                <Button variant="outline" onClick={() => router.push("/checkout")}>Volver al Checkout</Button>
              </div>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="h-5 w-5 mr-2" />
                Completar pago con Mercado Pago
              </CardTitle>
            </CardHeader>
            <CardContent>
              <MercadoPagoCheckoutDynamic
                items={itemsForPreference}
                total={Number(order.total || 0)}
                orderId={order._id}
                shippingAddress={order.shippingAddress}
                onSuccess={() => {
                  // Limpieza del carrito tras pago exitoso se realizará en la página de success
                }}
                onError={(err: string) => {
                  console.error("MercadoPago error:", err)
                }}
              />
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  )
}
