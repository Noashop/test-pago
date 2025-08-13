'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard,
  ShoppingCart,
  Package,
  Heart,
  User,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  MapPin,
  Headphones
} from 'lucide-react'
import { signOut } from 'next-auth/react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const menuItems = [
  {
    title: 'Mi Cuenta',
    href: '/account',
    icon: LayoutDashboard,
  },
  {
    title: 'Mis Órdenes',
    href: '/account/orders',
    icon: Package,
  },
  {
    title: 'Carrito',
    href: '/cart',
    icon: ShoppingCart,
  },
  {
    title: 'Lista de Deseos',
    href: '/account/wishlist',
    icon: Heart,
  },
  {
    title: 'Mi Perfil',
    href: '/account/profile',
    icon: User,
  },
  {
    title: 'Direcciones',
    href: '/account/addresses',
    icon: MapPin,
  },
  {
    title: 'Métodos de Pago',
    href: '/account/payment-methods',
    icon: CreditCard,
  },
  {
    title: 'Soporte',
    href: '/account/support',
    icon: Headphones,
  },
  {
    title: 'Configuración',
    href: '/account/settings',
    icon: Settings,
  },
]

export function ClientSidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' })
  }

  return (
    <div className={cn(
      'bg-secondary text-white h-screen flex flex-col transition-all duration-300',
      collapsed ? 'w-16' : 'w-64'
    )}>
      {/* Header */}
      <div className="p-4 border-b border-gray-600">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-white font-bold text-sm">SC</span>
              </div>
              <span className="font-playfair font-bold text-lg">
                Mi Cuenta
              </span>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
            className="text-white hover:bg-gray-600"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          
          return (
            <Link key={item.href} href={item.href}>
              <div className={cn(
                'flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors',
                isActive 
                  ? 'bg-primary text-white' 
                  : 'text-gray-300 hover:bg-gray-600 hover:text-white',
                collapsed && 'justify-center'
              )}>
                <Icon className="h-5 w-5 flex-shrink-0" />
                {!collapsed && (
                  <span className="font-medium">{item.title}</span>
                )}
              </div>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-600">
        <Button
          variant="ghost"
          onClick={handleSignOut}
          className={cn(
            'w-full text-gray-300 hover:bg-gray-600 hover:text-white',
            collapsed ? 'px-2' : 'justify-start'
          )}
        >
          <LogOut className="h-5 w-5" />
          {!collapsed && <span className="ml-3">Cerrar Sesión</span>}
        </Button>
      </div>
    </div>
  )
}
