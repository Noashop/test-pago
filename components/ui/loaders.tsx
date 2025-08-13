'use client'

import { 
  ShoppingBag, 
  Smartphone, 
  Home, 
  Heart, 
  Wrench, 
  Baby, 
  PawPrint, 
  Dumbbell, 
  BookOpen, 
  Coffee,
  Users,
  Package,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  BarChart3,
  Settings,
  Tag,
  Gift,
  Shield,
  Zap,
  Star,
  CheckCircle,
  Truck,
  Clock,
  ThumbsUp
} from 'lucide-react'
import { Loader } from './loader'

// Loader para la tienda (categorías)
export function StoreLoader() {
  const storeIcons = [
    {
      icon: Smartphone,
      color: 'bg-blue-500',
      label: 'Electrónica'
    },
    {
      icon: Home,
      color: 'bg-green-500',
      label: 'Hogar y Cocina'
    },
    {
      icon: Heart,
      color: 'bg-pink-500',
      label: 'Moda'
    },
    {
      icon: Wrench,
      color: 'bg-orange-500',
      label: 'Herramientas'
    },
    {
      icon: Baby,
      color: 'bg-purple-500',
      label: 'Bebés y Niños'
    },
    {
      icon: PawPrint,
      color: 'bg-yellow-500',
      label: 'Mascotas'
    },
    {
      icon: Dumbbell,
      color: 'bg-red-500',
      label: 'Deportes'
    },
    {
      icon: BookOpen,
      color: 'bg-indigo-500',
      label: 'Papelería'
    },
    {
      icon: Coffee,
      color: 'bg-amber-500',
      label: 'Alimentos'
    }
  ]

  return (
    <Loader
      icons={storeIcons}
      message="Cargando productos de la tienda..."
      className="min-h-screen"
    />
  )
}

// Loader para el panel administrativo
export function AdminLoader() {
  const adminIcons = [
    {
      icon: Users,
      color: 'bg-blue-600',
      label: 'Gestión de Usuarios'
    },
    {
      icon: Package,
      color: 'bg-green-600',
      label: 'Gestión de Productos'
    },
    {
      icon: ShoppingCart,
      color: 'bg-purple-600',
      label: 'Gestión de Pedidos'
    },
    {
      icon: DollarSign,
      color: 'bg-yellow-600',
      label: 'Reportes Financieros'
    },
    {
      icon: BarChart3,
      color: 'bg-indigo-600',
      label: 'Estadísticas'
    },
    {
      icon: Settings,
      color: 'bg-gray-600',
      label: 'Configuración'
    },
    {
      icon: Tag,
      color: 'bg-pink-600',
      label: 'Gestión de Cupones'
    },
    {
      icon: Gift,
      color: 'bg-orange-600',
      label: 'Promociones'
    }
  ]

  return (
    <Loader
      icons={adminIcons}
      message="Cargando panel administrativo..."
      className="min-h-screen"
    />
  )
}

// Loader para el panel de proveedor
export function SupplierLoader() {
  const supplierIcons = [
    {
      icon: TrendingUp,
      color: 'bg-green-500',
      label: 'Aumento de Ventas'
    },
    {
      icon: Users,
      color: 'bg-blue-500',
      label: 'Más Clientes'
    },
    {
      icon: BarChart3,
      color: 'bg-purple-500',
      label: 'Mejor Gestión'
    },
    {
      icon: DollarSign,
      color: 'bg-yellow-500',
      label: 'Crecimiento Comercial'
    },
    {
      icon: Package,
      color: 'bg-indigo-500',
      label: 'Gestión de Productos'
    },
    {
      icon: ShoppingCart,
      color: 'bg-orange-500',
      label: 'Gestión de Pedidos'
    },
    {
      icon: Settings,
      color: 'bg-gray-500',
      label: 'Configuración'
    },
    {
      icon: Star,
      color: 'bg-pink-500',
      label: 'Satisfacción del Cliente'
    }
  ]

  return (
    <Loader
      icons={supplierIcons}
      message="Cargando panel de proveedor..."
      className="min-h-screen"
    />
  )
}

// Loader para clientes
export function ClientLoader() {
  const clientIcons = [
    {
      icon: Shield,
      color: 'bg-green-500',
      label: 'Confianza'
    },
    {
      icon: Zap,
      color: 'bg-blue-500',
      label: 'Rapidez'
    },
    {
      icon: CheckCircle,
      color: 'bg-purple-500',
      label: 'Efectividad'
    },
    {
      icon: Star,
      color: 'bg-yellow-500',
      label: 'Satisfacción'
    },
    {
      icon: Truck,
      color: 'bg-orange-500',
      label: 'Entrega Rápida'
    },
    {
      icon: Clock,
      color: 'bg-indigo-500',
      label: 'Atención 24/7'
    },
    {
      icon: ThumbsUp,
      color: 'bg-pink-500',
      label: 'Calidad Garantizada'
    },
    {
      icon: Heart,
      color: 'bg-red-500',
      label: 'Experiencia Única'
    }
  ]

  return (
    <Loader
      icons={clientIcons}
      message="Cargando tu experiencia personalizada..."
      className="min-h-screen"
    />
  )
}

// Loader genérico para otras secciones
export function GenericLoader({ message = "Cargando..." }: { message?: string }) {
  const genericIcons = [
    {
      icon: Package,
      color: 'bg-blue-500',
      label: 'Cargando'
    },
    {
      icon: ShoppingCart,
      color: 'bg-green-500',
      label: 'Procesando'
    },
    {
      icon: Clock,
      color: 'bg-purple-500',
      label: 'Esperando'
    },
    {
      icon: CheckCircle,
      color: 'bg-yellow-500',
      label: 'Completando'
    }
  ]

  return (
    <Loader
      icons={genericIcons}
      message={message}
      className="min-h-screen"
    />
  )
} 