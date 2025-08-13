'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  Package, 
  ShoppingCart, 
  DollarSign,
  Tag,
  Gift,
  Settings,
  BarChart3,
  Plus,
  Eye,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { AdminLoader } from '@/components/ui/loaders'
import { RateLimitStats } from '@/components/admin/rate-limit-stats'
import { ErrorMonitor } from '@/components/admin/error-monitor'
import { PerformanceMonitor } from '@/components/admin/performance-monitor'

interface AdminStats {
  users: {
    total: number
    clients: number
    suppliers: number
    pendingSuppliers: number
    approvedSuppliers: number
  }
  products: {
    total: number
    pending: number
    active: number
    inactive: number
  }
  orders: {
    total: number
    pending: number
    completed: number
    cancelled: number
  }
  revenue: {
    total: number
  }
  recentProducts: any[]
  pendingSuppliersList: any[]
  recentOrders: any[]
}

export default function AdminDashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchAdminStats = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/dashboard', {
        credentials: 'include',
        cache: 'no-store',
      })
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

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      router.push('/auth/login')
      return
    }

    if (session.user.role !== 'admin') {
      router.push('/')
      return
    }

    fetchAdminStats()
  }, [session, status, router, fetchAdminStats])

  if (status === 'loading' || loading) {
    return <AdminLoader />
  }

  if (!session || session.user.role !== 'admin') {
    return null
  }

  const adminFeatures = [
    {
      title: 'Gestión de Proveedores',
      description: 'Aprueba y gestiona cuentas de proveedores',
      icon: Users,
      href: '/admin/suppliers',
      color: 'bg-blue-500',
      badge: 'Gestionar',
      stats: `${stats?.users.pendingSuppliers || 0} pendientes`
    },
    {
      title: 'Gestión de Productos',
      description: 'Revisa y aprueba productos pendientes',
      icon: Package,
      href: '/admin/products',
      color: 'bg-green-500',
      badge: 'Revisar',
      stats: `${stats?.products.pending || 0} pendientes`
    },
    {
      title: 'Gestión de Pedidos',
      description: 'Monitorea todos los pedidos del sistema',
      icon: ShoppingCart,
      href: '/admin/orders',
      color: 'bg-purple-500',
      badge: 'Monitorear',
      stats: `${stats?.orders.total || 0} total`
    },
    {
      title: 'Promociones y Cupones',
      description: 'Gestiona descuentos y promociones',
      icon: Gift,
      href: '/admin/promotions',
      color: 'bg-yellow-500',
      badge: 'Gestionar',
      stats: 'Activas'
    },
    {
      title: 'Soporte al Cliente',
      description: 'Gestiona tickets y consultas',
      icon: Settings,
      href: '/admin/support',
      color: 'bg-red-500',
      badge: 'Atender',
      stats: 'Tickets'
    },
    {
      title: 'Crear Administrador',
      description: 'Crea nuevos roles administrativos',
      icon: Plus,
      href: '/admin/create-admin',
      color: 'bg-indigo-500',
      badge: 'Crear',
      stats: 'Nuevo'
    }
  ]

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Panel de Administración
          </h1>
          <p className="text-muted-foreground">
            Gestiona proveedores, productos, pedidos y más
          </p>
        </div>

        {/* Estadísticas principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Usuarios</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.users.total || 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.users.clients || 0} clientes, {stats?.users.suppliers || 0} proveedores
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Productos</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.products.total || 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.products.pending || 0} pendientes, {stats?.products.active || 0} activos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pedidos</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.orders.total || 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.orders.pending || 0} pendientes, {stats?.orders.completed || 0} completados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ingresos</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${stats?.revenue.total?.toLocaleString('es-AR') || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Total de ventas completadas
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Funcionalidades administrativas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {adminFeatures.map((feature, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className={`p-2 rounded-lg ${feature.color}`}>
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <Badge variant="secondary">{feature.badge}</Badge>
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{feature.stats}</span>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => router.push(feature.href)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Ver
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Secciones de datos recientes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Proveedores pendientes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Proveedores Pendientes
              </CardTitle>
              <CardDescription>
                Proveedores esperando aprobación
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats?.pendingSuppliersList && stats.pendingSuppliersList.length > 0 ? (
                <div className="space-y-3">
                  {stats.pendingSuppliersList.map((supplier: any) => (
                    <div key={supplier._id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{supplier.name}</p>
                        <p className="text-sm text-muted-foreground">{supplier.email}</p>
                        {supplier.businessInfo?.businessName && (
                          <p className="text-xs text-muted-foreground">
                            {supplier.businessInfo.businessName}
                          </p>
                        )}
                      </div>
                      <Button size="sm" variant="outline">
                        Revisar
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  No hay proveedores pendientes
                </p>
              )}
            </CardContent>
          </Card>

          {/* Productos pendientes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Productos Pendientes
              </CardTitle>
              <CardDescription>
                Productos esperando aprobación
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats?.recentProducts && stats.recentProducts.length > 0 ? (
                <div className="space-y-3">
                  {stats.recentProducts.map((product: any) => (
                    <div key={product._id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {product.supplier?.businessInfo?.businessName || product.supplier?.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          ${product.costPrice?.toLocaleString('es-AR')} - ${product.salePrice?.toLocaleString('es-AR')}
                        </p>
                      </div>
                      <Button size="sm" variant="outline">
                        Revisar
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  No hay productos pendientes
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
