'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { 
  ShoppingCart, 
  Package, 
  Heart, 
  Clock,
  Star,
  TrendingUp,
  Eye,
  User
} from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ClientSidebar } from '@/components/client/client-sidebar'
import { StatsCard } from '@/components/dashboard/stats-card'
import { OrderHistory } from '@/components/client/order-history'
import { WishlistPreview } from '@/components/client/wishlist-preview'
import { RecommendedProducts } from '@/components/client/recommended-products'
import { useToast } from '@/hooks/use-toast'

interface ClientDashboardStats {
  totalOrders: number
  totalSpent: number
  wishlistItems: number
  recentOrders: Array<{
    _id: string
    orderNumber: string
    total: number
    status: string
    createdAt: string
    items: Array<{
      product: {
        _id: string
        name: string
        images: string[]
      }
      quantity: number
      price: number
    }>
  }>
  wishlistProducts: Array<{
    _id: string
    name: string
    price: number
    images: string[]
    rating: number
    supplier: {
      businessName: string
    }
  }>
  recommendedProducts: Array<{
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
  }>
  orderGrowth: number
  spentGrowth: number
  wishlistGrowth: number
}

export default function ClientDashboard() {
  const { data: session, status } = useSession()
  const [stats, setStats] = useState<ClientDashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      redirect('/auth/login')
    }
  }, [session, status])

  const fetchDashboardStats = useCallback(async () => {
    try {
      const response = await fetch('/api/dashboard?role=client')
      const data = await response.json()

      if (response.ok) {
        setStats(data)
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al cargar las estadísticas del dashboard',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    if (session?.user) {
      fetchDashboardStats()
    }
  }, [session, fetchDashboardStats])

  if (status === 'loading' || loading) {
    return (
      <div className="flex h-screen">
        <ClientSidebar />
        <main className="flex-1 p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="pb-2">
                  <div className="h-4 bg-muted rounded w-1/2" />
                </CardHeader>
                <CardContent>
                  <div className="h-8 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-3 bg-muted rounded w-1/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        </main>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="flex h-screen">
        <ClientSidebar />
        <main className="flex-1 p-8">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">No hay datos disponibles</h2>
            <p className="text-muted-foreground">Aún no tienes actividad en tu cuenta.</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      <ClientSidebar />
      
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-playfair font-bold text-foreground mb-2">
              Mi Cuenta
            </h1>
            <p className="text-muted-foreground">
              Bienvenido de vuelta, {session?.user?.name}
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <StatsCard
              title="Mis Órdenes"
              value={stats.totalOrders.toLocaleString()}
              change={stats.orderGrowth}
              icon={ShoppingCart}
              trend={stats.orderGrowth >= 0 ? 'up' : 'down'}
            />
            <StatsCard
              title="Total Gastado"
              value={`$${stats.totalSpent.toLocaleString()}`}
              change={stats.spentGrowth}
              icon={Package}
              trend={stats.spentGrowth >= 0 ? 'up' : 'down'}
            />
            <StatsCard
              title="Lista de Deseos"
              value={stats.wishlistItems.toLocaleString()}
              change={stats.wishlistGrowth}
              icon={Heart}
              trend={stats.wishlistGrowth >= 0 ? 'up' : 'down'}
            />
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <OrderHistory orders={stats.recentOrders} />
            <WishlistPreview products={stats.wishlistProducts} />
          </div>

          {/* Recommended Products */}
          <RecommendedProducts products={stats.recommendedProducts} />

          {/* Quick Actions */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Acciones Rápidas</CardTitle>
              <CardDescription>
                Accesos directos a las funciones más utilizadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button variant="outline" className="h-20 flex-col">
                  <ShoppingCart className="h-6 w-6 mb-2" />
                  Ver Carrito
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <Package className="h-6 w-6 mb-2" />
                  Mis Órdenes
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <Heart className="h-6 w-6 mb-2" />
                  Lista de Deseos
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <User className="h-6 w-6 mb-2" />
                  Mi Perfil
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
