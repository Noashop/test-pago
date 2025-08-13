'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Package, 
  ShoppingCart, 
  TrendingUp, 
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign,
  Users,
  Settings,
  XCircle
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { SupplierLoader } from '@/components/ui/loaders'

interface SupplierStats {
  totalProducts: number
  totalOrders: number
  totalRevenue: number
  pendingOrders: number
  productGrowth: number
  orderGrowth: number
  revenueGrowth: number
  recentOrders: any[]
}

export default function SupplierDashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const [stats, setStats] = useState<SupplierStats | null>(null)
  const [loading, setLoading] = useState(true)

  // Definir primero el callback para evitar "used before declaration"
  const fetchSupplierStats = useCallback(async () => {
    try {
      const response = await fetch('/api/dashboard?role=supplier')
      const data = await response.json()

      if (response.ok) {
        setStats(data)
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al cargar las estadísticas',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  // Luego el efecto que lo usa
  useEffect(() => {
    if (status === 'loading') return
    if (!session) return
    if (session.user.role !== 'supplier') return
    if (session.user.isApproved === false) return
    fetchSupplierStats()
  }, [status, session, fetchSupplierStats])

  if (status === 'loading' || loading) {
    return <SupplierLoader />
  }

  if (!session || session.user.role !== 'supplier') {
    return null
  }

  // Show pending approval message
  if (session.user.isApproved === false) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card className="border-yellow-200 bg-yellow-50">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <AlertCircle className="h-16 w-16 text-yellow-600" />
              </div>
              <CardTitle className="text-2xl text-yellow-800 mb-2">
                Solicitud en Revisión
              </CardTitle>
              <CardDescription className="text-yellow-700 text-lg">
                Su solicitud se encuentra en estado de revisión. Pronto podrá acceder a su panel de proveedor para empezar a aumentar las ventas de su empresa. ¡Muchas gracias por elegirnos!
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-2 text-yellow-700">
                  <Clock className="h-5 w-5" />
                  <span>Tiempo estimado de revisión: 24-48 horas</span>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => router.push('/')}
                  className="border-yellow-600 text-yellow-700 hover:bg-yellow-100"
                >
                  Volver al Inicio
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const supplierFeatures = [
    {
      title: 'Mis Productos',
      description: 'Gestiona tu catálogo de productos',
      icon: Package,
      href: '/supplier/products',
      color: 'bg-blue-500',
      badge: 'Gestionar'
    },
    {
      title: 'Mis Pedidos',
      description: 'Revisa y gestiona pedidos de tus productos',
      icon: ShoppingCart,
      href: '/supplier/orders',
      color: 'bg-green-500',
      badge: 'Ver'
    },
    {
      title: 'Mi Cuenta',
      description: 'Actualiza información de tu negocio',
      icon: Settings,
      href: '/supplier/profile',
      color: 'bg-purple-500'
    },
    {
      title: 'Estadísticas',
      description: 'Analiza el rendimiento de tus ventas',
      icon: TrendingUp,
      href: '/supplier/statistics',
      color: 'bg-orange-500'
    }
  ]

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Panel de Proveedor</h1>
        <p className="text-gray-600">Bienvenido, {session.user.name}. Gestiona tus productos y ventas desde aquí.</p>
      </div>

      {/* Approval Status */}
      <Card className="mb-8 border-green-200 bg-green-50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <CardTitle className="text-green-800">Cuenta Aprobada</CardTitle>
          </div>
          <CardDescription className="text-green-700">
            Tu cuenta ha sido aprobada. Ya puedes comenzar a vender tus productos.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Productos Activos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.totalProducts || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.productGrowth || 0}% este mes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pedidos Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.pendingOrders || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Requieren atención
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ventas del Mes</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(stats?.totalRevenue || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.revenueGrowth || 0}% vs mes anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pedidos</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.totalOrders || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.orderGrowth || 0}% este mes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Supplier Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {supplierFeatures.map((feature) => (
          <Card key={feature.href} className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className={`p-2 rounded-lg ${feature.color}`}>
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                {feature.badge && (
                  <Badge variant="secondary" className="text-xs">
                    {feature.badge}
                  </Badge>
                )}
              </div>
              <CardTitle className="text-lg">{feature.title}</CardTitle>
              <CardDescription>{feature.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full" 
                onClick={() => router.push(feature.href)}
              >
                Acceder
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      {stats?.recentOrders && stats.recentOrders.length > 0 && (
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Actividad Reciente</CardTitle>
              <CardDescription>Últimos pedidos recibidos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.recentOrders.slice(0, 3).map((order: any) => (
                  <div key={order._id} className="flex items-center gap-3">
                    <ShoppingCart className="h-4 w-4 text-blue-500" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        Pedido #{order.orderNumber} - ${order.total.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant={order.status === 'pending' ? 'secondary' : 'default'}>
                      {order.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
