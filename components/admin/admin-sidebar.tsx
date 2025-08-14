'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  Tag,
  Ticket,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Image,
  Gift,
  Building2,
  FileText,
  MessageSquare,
  CreditCard
} from 'lucide-react'
import { signOut } from 'next-auth/react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const menuItems = [
  {
    title: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
  },
  {
    title: 'Gestión de Usuarios',
    href: '/admin/users',
    icon: Users,
  },
  {
    title: 'Gestión de Proveedores',
    href: '/admin/suppliers',
    icon: Building2,
  },
  {
    title: 'Aprobar Productos',
    href: '/admin/products/pending',
    icon: Package,
  },
  {
    title: 'Gestión de Órdenes',
    href: '/admin/orders',
    icon: ShoppingCart,
  },
  {
    title: 'Gestión de Categorías',
    href: '/admin/categories',
    icon: Tag,
  },
  {
    title: 'Cupones y Promociones',
    href: '/admin/coupons',
    icon: Gift,
  },
  {
    title: 'Gestión de Banners',
    href: '/admin/banners',
    icon: Image,
  },
  {
    title: 'Facturación',
    href: '/admin/invoices',
    icon: FileText,
  },
  {
    title: 'Payouts',
    href: '/admin/payouts',
    icon: CreditCard,
  },
  {
    title: 'Chat y Soporte',
    href: '/admin/support',
    icon: MessageSquare,
  },
  {
    title: 'Reportes y Estadísticas',
    href: '/admin/reports',
    icon: BarChart3,
  },
  {
    title: 'Configuración',
    href: '/admin/settings',
    icon: Settings,
  },
]

export function AdminSidebar() {
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
                Admin Panel
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
