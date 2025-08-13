'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { ShoppingCart, User, Search, Menu, X, Bell, Gift, Shield, Package, BarChart3, FileText, Users, Settings, LogOut, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import NotificationBell from '@/components/notifications/notification-bell'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useCartStore } from '@/store/cart-store'
import { NAVBAR_BANNER_MESSAGES } from '@/constants'
import { USER_ROLES } from '@/constants'

export default function Navbar() {
  const { data: session } = useSession()
  const { items } = useCartStore()
  const pathname = usePathname()
  
  // Determine if we're in a panel route
  const isPanelRoute = pathname.startsWith('/admin') || pathname.startsWith('/supplier') || pathname.startsWith('/account')
  const isPublicRoute = !isPanelRoute
  
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0)
  const [stats, setStats] = useState({
    activeSuppliers: 0,
    activeCustomers: 0,
    totalProducts: 0,
    pendingProducts: 0,
    pendingOrders: 0,
    unreadNotifications: 0
  })
  const [supplierLogos, setSupplierLogos] = useState<Array<{ id: string; name: string; logo: string }>>([])

  // Banner animation - only for public routes
  useEffect(() => {
    if (isPublicRoute) {
      const interval = setInterval(() => {
        setCurrentBannerIndex((prev) => 
          (prev + 1) % NAVBAR_BANNER_MESSAGES.length
        )
      }, 5000)

      return () => clearInterval(interval)
    }
  }, [isPublicRoute])

  // Fetch supplier logos for public navbar banner
  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        if (!isPublicRoute) return
        const res = await fetch('/api/public/suppliers', { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          const list = (data?.suppliers || []).map((s: any) => ({ id: String(s.id), name: s.name, logo: s.logo }))
          setSupplierLogos(list)
        }
      } catch (e) {
        console.error('Error fetching supplier logos:', e)
      }
    }
    fetchSuppliers()
  }, [isPublicRoute])

  // Fetch stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        if (isPublicRoute) {
          const response = await fetch('/api/dashboard')
          if (response.ok) {
            const data = await response.json()
            setStats(prev => ({
              ...prev,
              activeSuppliers: data.activeSuppliers || 0,
              activeCustomers: data.activeCustomers || 0,
              totalProducts: data.totalProducts || 0
            }))
          }
        } else if (session?.user?.role === USER_ROLES.ADMIN) {
          const response = await fetch('/api/admin/stats')
          if (response.ok) {
            const data = await response.json()
            setStats(prev => ({
              ...prev,
              pendingProducts: data.pendingProducts || 0,
              pendingOrders: data.pendingOrders || 0,
              unreadNotifications: data.unreadNotifications || 0
            }))
          }
        }
      } catch (error) {
        console.error('Error fetching stats:', error)
      }
    }

    fetchStats()
    const interval = setInterval(fetchStats, 30000) // Update every 30 seconds

    return () => clearInterval(interval)
  }, [isPublicRoute, session?.user?.role])

  // Calcular el total de items en el carrito de forma segura
  const cartItemCount = items?.reduce((total, item) => total + (item.quantity || 0), 0) || 0

  // Perfil según rol: admin -> /admin/profile, supplier -> /supplier/profile, client -> /account/profile
  const profileHref = session?.user?.role === USER_ROLES.ADMIN
    ? '/admin/profile'
    : session?.user?.role === USER_ROLES.SUPPLIER
      ? '/supplier/profile'
      : '/account/profile'

  // Get panel title based on current route
  const getPanelTitle = () => {
    if (pathname.startsWith('/admin')) return 'Panel Administrativo'
    if (pathname.startsWith('/supplier')) return 'Panel Proveedor'
    if (pathname.startsWith('/account')) return 'Mi Cuenta'
    return 'Salta Conecta'
  }

  // Get quick links based on user role
  const getQuickLinks = () => {
    if (!session?.user) return []
    
    switch (session.user.role) {
      case USER_ROLES.ADMIN:
        return [
          { href: '/admin', label: 'Dashboard', icon: BarChart3 },
          { href: '/admin/products', label: 'Productos', icon: Package, badge: stats.pendingProducts },
          { href: '/admin/orders', label: 'Órdenes', icon: FileText, badge: stats.pendingOrders },
          { href: '/admin/users', label: 'Usuarios', icon: Users },
        ]
      case USER_ROLES.SUPPLIER:
        return [
          { href: '/supplier', label: 'Dashboard', icon: BarChart3 },
          { href: '/supplier/products', label: 'Mis Productos', icon: Package },
          { href: '/supplier/orders', label: 'Mis Ventas', icon: FileText },
        ]
      default:
        return [
          { href: '/account', label: 'Mi Cuenta', icon: User },
          { href: '/account/orders', label: 'Mis Pedidos', icon: FileText },
        ]
    }
  }

  const quickLinks = getQuickLinks()

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      {/* Animated Banner - Only show on public store routes */}
      {isPublicRoute && (
      <div className="bg-gradient-to-r from-primary to-accent text-white py-2 overflow-hidden">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">🏢</span>
                  <span className="text-sm">{stats.activeSuppliers} Proveedores Activos</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">👥</span>
                  <span className="text-sm">{stats.activeCustomers} Clientes Activos</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">📦</span>
                  <span className="text-sm">{stats.totalProducts} Productos</span>
                </div>
              </div>

              <div className="flex-1 mx-4 md:mx-8">
                {/* Horizontal supplier logos strip */}
                {supplierLogos.length > 0 ? (
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-primary to-transparent/0" />
                    <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-accent to-transparent/0" />
                    <div className="flex gap-6 overflow-x-auto no-scrollbar py-1">
                      {supplierLogos.map((s) => (
                        <div key={s.id} className="shrink-0 flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-white ring-1 ring-white/50 overflow-hidden">
                            <Image src={s.logo} alt={s.name} width={24} height={24} className="h-full w-full object-cover" sizes="24px" />
                          </div>
                          <span className="hidden sm:block text-xs text-white/90 max-w-[120px] truncate" title={s.name}>{s.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="relative overflow-hidden h-6">
                    <div 
                      className="absolute inset-0 flex items-center justify-center transition-transform duration-1000 ease-in-out"
                      style={{ transform: `translateY(-${currentBannerIndex * 24}px)` }}
                    >
                      {NAVBAR_BANNER_MESSAGES.map((message, index) => (
                        <div key={index} className="text-sm font-medium text-center">
                          {message}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

            <div className="flex items-center space-x-2">
              <Gift className="h-4 w-4 animate-pulse" />
              <span className="text-sm font-medium">¡Gira la Ruleta!</span>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Main Navigation */}
      <div className="container mx-auto px-4 py-2 sm:py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg sm:text-xl">SC</span>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg sm:text-xl font-bold text-gray-900">{getPanelTitle()}</h1>
              <p className="text-xs text-gray-600">
                {isPanelRoute ? 'Panel de Control' : 'Mayorista Digital'}
              </p>
            </div>
          </Link>

          {/* Quick Links - Only show on panel routes */}
          {isPanelRoute && session?.user && (
            <div className="hidden md:flex items-center space-x-1">
              {quickLinks.slice(0, 4).map((link) => {
                const Icon = link.icon
                const isActive = pathname === link.href || 
                  (link.href !== '/admin' && link.href !== '/supplier' && pathname.startsWith(link.href))
                
                return (
                  <Link key={link.href} href={link.href}>
                    <Button
                      variant={isActive ? "default" : "ghost"}
                      size="sm"
                      className="relative"
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {link.label}
                      {link.badge && link.badge > 0 && (
                        <Badge 
                          variant="destructive" 
                          className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
                        >
                          {link.badge > 99 ? '99+' : link.badge}
                        </Badge>
                      )}
                    </Button>
                  </Link>
                )
              })}
            </div>
          )}

          {/* Search Bar - Only show on public store routes */}
          {isPublicRoute && (
          <div className="hidden sm:flex flex-1 max-w-md mx-4 sm:mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar productos..."
                className="pl-10 pr-4 py-2 text-sm"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    const searchTerm = (e.target as HTMLInputElement).value
                    if (searchTerm.trim()) {
                      window.location.href = `/products?search=${encodeURIComponent(searchTerm.trim())}`
                    }
                  }
                }}
              />
            </div>
          </div>
          )}

          {/* Navigation Items - Only show on public store routes */}
          {isPublicRoute && (
          <div className="hidden lg:flex items-center space-x-4">
            <Link href="/categories" className="text-gray-700 hover:text-primary transition-colors text-sm">
              Categorías
            </Link>
            <Link href="/supplier" className="text-gray-700 hover:text-primary transition-colors text-sm">
              Ser Proveedor
            </Link>
            <Link href="/support" className="text-gray-700 hover:text-primary transition-colors text-sm">
              Soporte
            </Link>
          </div>
          )}

          {/* User Actions */}
          <div className="flex items-center space-x-4">
            {/* Cart - Only show on public store routes */}
            {isPublicRoute && (
            <Link href="/cart" className="relative">
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingCart className="h-5 w-5" />
                {cartItemCount > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-red-500 text-white font-bold">
                    {cartItemCount > 99 ? '99+' : cartItemCount}
                  </Badge>
                )}
              </Button>
            </Link>
            )}

            {/* Notifications */}
            <NotificationBell />

            {/* User Menu */}
            {session ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={session.user?.image || ''} alt={session.user?.name || ''} />
                      <AvatarFallback>
                        {session.user?.name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{session.user?.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {session.user?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  
                  {/* Role-specific menu items */}
                  {session.user?.role === USER_ROLES.ADMIN && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link href="/admin">
                          <Shield className="h-4 w-4 mr-2" />
                          Panel Admin
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/admin/users">
                          <Users className="h-4 w-4 mr-2" />
                          Gestión de Usuarios
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/admin/products/pending">
                          <Package className="h-4 w-4 mr-2" />
                          Aprobar Productos
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  
                  {session.user?.role === USER_ROLES.SUPPLIER && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link href="/supplier">
                          <Package className="h-4 w-4 mr-2" />
                          Panel Proveedor
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/supplier/products">
                          <Package className="h-4 w-4 mr-2" />
                          Mis Productos
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  
                  {/* Common menu items */}
                  <DropdownMenuItem asChild>
                    <Link href={profileHref}>
                      <User className="h-4 w-4 mr-2" />
                      Mi Cuenta
                    </Link>
                  </DropdownMenuItem>
                  
                  {/* Back to store (only for panel routes) */}
                  {isPanelRoute && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/">
                          <Package className="h-4 w-4 mr-2" />
                          Volver a la Tienda
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => signOut()}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Cerrar Sesión
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-2">
                <Link href="/auth/login">
                  <Button variant="ghost" size="sm">
                    Iniciar Sesión
                  </Button>
                </Link>
                <Link href="/auth/register">
                  <Button size="sm">
                    Registrarse
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="lg:hidden mt-4 pb-4 border-t border-gray-200">
            <div className="pt-4 space-y-4">
              {isPublicRoute && (
                <>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Buscar productos..."
                      className="pl-10 pr-4 py-2"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Link href="/categories" className="block text-gray-700 hover:text-primary transition-colors">
                      Categorías
                    </Link>
                    <Link href="/supplier" className="block text-gray-700 hover:text-primary transition-colors">
                      Ser Proveedor
                    </Link>
                    <Link href="/support" className="block text-gray-700 hover:text-primary transition-colors">
                      Soporte
                    </Link>
                  </div>
                </>
              )}
              
              {isPanelRoute && session?.user && (
                <div className="space-y-2">
                  {quickLinks.map((link) => {
                    const Icon = link.icon
                    return (
                      <Link key={link.href} href={link.href} className="block text-gray-700 hover:text-primary transition-colors">
                        <Icon className="h-4 w-4 inline mr-2" />
                        {link.label}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
} 