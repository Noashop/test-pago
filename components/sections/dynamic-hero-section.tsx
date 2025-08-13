'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, ArrowRight, Star, Truck, Shield, Gift } from 'lucide-react'

interface SiteStats {
  _id: string
  key: string
  label: string
  value: string
  suffix?: string
  icon?: string
  color?: string
  category: string
}

interface SiteContent {
  _id: string
  key: string
  title: string
  subtitle?: string
  description?: string
  content?: any
  metadata?: any
}

export default function DynamicHeroSection() {
  const [searchQuery, setSearchQuery] = useState('')
  const [heroStats, setHeroStats] = useState<SiteStats[]>([])
  const [mainStats, setMainStats] = useState<SiteStats[]>([])
  const [heroContent, setHeroContent] = useState<SiteContent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDynamicContent()
  }, [])

  const fetchDynamicContent = async () => {
    try {
      // Cargar estadísticas
      const [heroStatsRes, mainStatsRes, contentRes] = await Promise.all([
        fetch('/api/site-stats?category=hero&realTime=true'),
        fetch('/api/site-stats?category=main&realTime=true'),
        fetch('/api/site-content?type=hero')
      ])

      if (heroStatsRes.ok) {
        const data = await heroStatsRes.json()
        setHeroStats(data.stats || [])
      }

      if (mainStatsRes.ok) {
        const data = await mainStatsRes.json()
        setMainStats(data.stats || [])
      }

      if (contentRes.ok) {
        const data = await contentRes.json()
        setHeroContent(data.content || [])
      }

    } catch (error) {
      console.error('Error fetching dynamic content:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      window.location.href = `/products?search=${encodeURIComponent(searchQuery)}`
    }
  }

  const getIconComponent = (iconName: string) => {
    const icons: any = {
      Search, ArrowRight, Star, Truck, Shield, Gift
    }
    return icons[iconName] || Star
  }

  // Contenido por defecto si no hay contenido dinámico
  const defaultTitle = "El Marketplace Mayorista de Salta"
  const defaultSubtitle = "Conectamos proveedores verificados con emprendedores"
  const defaultDescription = "Conectamos proveedores verificados con emprendedores para impulsar el crecimiento del comercio local en Salta, Argentina."

  const mainTitle = heroContent.find(c => c.key === 'hero_main_title')
  const badges = heroContent.find(c => c.key === 'hero_badges')

  if (loading) {
    return (
      <section className="relative bg-gradient-to-br from-primary/5 via-white to-accent/5 py-20">
        <div className="container mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-6 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="h-12 bg-gray-200 rounded w-96"></div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="relative bg-gradient-to-br from-primary/5 via-white to-accent/5 py-20 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              {/* Dynamic Badges */}
              <div className="flex items-center space-x-2">
                {badges?.content ? (
                  badges.content.map((badge: any, index: number) => (
                    <Badge 
                      key={index}
                      variant="secondary" 
                      className={badge.variant === 'primary' ? 'bg-primary/10 text-primary' : 'bg-accent/10 text-accent'}
                    >
                      {badge.text}
                    </Badge>
                  ))
                ) : (
                  <>
                    <Badge variant="secondary" className="bg-primary/10 text-primary">
                      🚀 Plataforma Mayorista
                    </Badge>
                    <Badge variant="secondary" className="bg-accent/10 text-accent">
                      ⭐ 4.9/5 Rating
                    </Badge>
                  </>
                )}
              </div>
              
              {/* Dynamic Title */}
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                {mainTitle?.title || defaultTitle}
                <span className="text-primary block">Mayorista</span>
                de Salta
              </h1>
              
              {/* Dynamic Description */}
              <p className="text-xl text-gray-600 max-w-lg">
                {mainTitle?.description || defaultDescription}
              </p>
            </div>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="relative max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  type="text"
                  placeholder="Buscar productos mayoristas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-3 text-lg border-2 border-gray-200 focus:border-primary"
                />
                <Button 
                  type="submit" 
                  className="absolute right-2 top-1/2 transform -translate-y-1/2"
                  size="sm"
                >
                  Buscar
                </Button>
              </div>
            </form>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/products">
                <Button size="lg" className="text-lg px-8 py-3">
                  Explorar Productos
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/supplier">
                <Button size="lg" variant="outline" className="text-lg px-8 py-3">
                  Ser Proveedor
                </Button>
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="flex items-center space-x-6 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4 text-green-500" />
                <span>Proveedores Verificados</span>
              </div>
              <div className="flex items-center space-x-2">
                <Truck className="h-4 w-4 text-blue-500" />
                <span>Envío Garantizado</span>
              </div>
              <div className="flex items-center space-x-2">
                <Star className="h-4 w-4 text-yellow-500" />
                <span>4.9/5 Rating</span>
              </div>
            </div>
          </div>

          {/* Right Content - Dynamic Stats */}
          <div className="relative">
            <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
              <div className="text-center space-y-6">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <span className="text-3xl">📦</span>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold text-gray-900">
                    Estadísticas en Tiempo Real
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-6">
                    {heroStats.length > 0 ? (
                      heroStats.map((stat) => (
                        <div key={stat._id} className="text-center">
                          <div className={`text-3xl font-bold ${stat.color || 'text-primary'}`}>
                            {stat.value}{stat.suffix || ''}
                          </div>
                          <div className="text-sm text-gray-600">{stat.label}</div>
                        </div>
                      ))
                    ) : (
                      // Fallback estático
                      <>
                        <div className="text-center">
                          <div className="text-3xl font-bold text-primary">500+</div>
                          <div className="text-sm text-gray-600">Productos Activos</div>
                        </div>
                        <div className="text-center">
                          <div className="text-3xl font-bold text-accent">50+</div>
                          <div className="text-sm text-gray-600">Proveedores</div>
                        </div>
                        <div className="text-center">
                          <div className="text-3xl font-bold text-green-500">1000+</div>
                          <div className="text-sm text-gray-600">Clientes</div>
                        </div>
                        <div className="text-center">
                          <div className="text-3xl font-bold text-blue-500">24/7</div>
                          <div className="text-sm text-gray-600">Soporte</div>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                      ))}
                    </div>
                    <span>4.9/5 basado en 500+ reseñas</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Elements */}
            <div className="absolute -top-4 -right-4 bg-accent text-white rounded-full p-3 shadow-lg">
              <Gift className="h-6 w-6" />
            </div>
            <div className="absolute -bottom-4 -left-4 bg-primary text-white rounded-full p-3 shadow-lg">
              <Truck className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* Bottom Stats - Dynamic */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {mainStats.length > 0 ? (
            mainStats.map((stat) => (
              <div key={stat._id}>
                <div className={`text-2xl font-bold ${stat.color || 'text-primary'} mb-2`}>
                  {stat.value}{stat.suffix || ''}
                </div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </div>
            ))
          ) : (
            // Fallback estático
            <>
              <div>
                <div className="text-2xl font-bold text-primary mb-2">$2M+</div>
                <div className="text-sm text-gray-600">En Ventas</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-accent mb-2">98%</div>
                <div className="text-sm text-gray-600">Satisfacción</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-500 mb-2">24h</div>
                <div className="text-sm text-gray-600">Tiempo de Respuesta</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-500 mb-2">100%</div>
                <div className="text-sm text-gray-600">Garantía</div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Background Decoration */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full -translate-y-48 translate-x-48"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/5 rounded-full translate-y-32 -translate-x-32"></div>
    </section>
  )
}
