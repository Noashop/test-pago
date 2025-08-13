'use client'

import { useState, useEffect } from 'react'
import { 
  Shield, Truck, Users, TrendingUp, Gift, Clock, Star, Zap,
  Package, Heart, Phone, Building, Target, Headphones
} from 'lucide-react'

interface Feature {
  _id: string
  title: string
  description: string
  icon: string
  color: string
  category: string
  order: number
}

interface SiteStats {
  _id: string
  key: string
  label: string
  value: string
  suffix?: string
  category: string
}

interface Testimonial {
  _id: string
  title: string
  subtitle?: string
  description: string
  icon: string
  category: string
  type: string
}

export default function DynamicWhyChooseUs() {
  const [features, setFeatures] = useState<Feature[]>([])
  const [stats, setStats] = useState<SiteStats[]>([])
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDynamicContent()
  }, [])

  const fetchDynamicContent = async () => {
    try {
      const [featuresRes, statsRes, testimonialsRes] = await Promise.all([
        fetch('/api/features?category=why_choose_us'),
        fetch('/api/site-stats?category=main&realTime=true'),
        fetch('/api/testimonials?category=main&type=info_card')
      ])

      if (featuresRes.ok) {
        const data = await featuresRes.json()
        setFeatures(data.features || [])
      }

      if (statsRes.ok) {
        const data = await statsRes.json()
        setStats(data.stats || [])
      }

      if (testimonialsRes.ok) {
        const data = await testimonialsRes.json()
        setTestimonials(data.testimonials || [])
      }

    } catch (error) {
      console.error('Error fetching dynamic content:', error)
    } finally {
      setLoading(false)
    }
  }

  const getIconComponent = (iconName: string) => {
    const icons: any = {
      Shield, Truck, Users, TrendingUp, Gift, Clock, Star, Zap,
      Package, Heart, Phone, Building, Target, Headphones
    }
    return icons[iconName] || Star
  }

  // Contenido por defecto si no hay contenido dinámico
  const defaultFeatures = [
    {
      _id: 'default-1',
      title: 'Proveedores Verificados',
      description: 'Todos nuestros proveedores pasan por un riguroso proceso de verificación para garantizar la calidad de los productos.',
      icon: 'Shield',
      color: 'text-green-500',
      category: 'why_choose_us',
      order: 1
    },
    {
      _id: 'default-2',
      title: 'Envío Garantizado',
      description: 'Envío a domicilio o retiro en local. Costos calculados según proveedor y región con seguimiento en tiempo real.',
      icon: 'Truck',
      color: 'text-blue-500',
      category: 'why_choose_us',
      order: 2
    },
    {
      _id: 'default-3',
      title: 'Comunidad Mayorista',
      description: 'Conectamos emprendedores con proveedores confiables para impulsar el crecimiento del comercio local.',
      icon: 'Users',
      color: 'text-purple-500',
      category: 'why_choose_us',
      order: 3
    },
    {
      _id: 'default-4',
      title: 'Precios Mayoristas',
      description: 'Precios especiales para compras mayoristas con descuentos progresivos según volumen de compra.',
      icon: 'TrendingUp',
      color: 'text-orange-500',
      category: 'why_choose_us',
      order: 4
    }
  ]

  const displayFeatures = features.length > 0 ? features : defaultFeatures

  if (loading) {
    return (
      <div className="space-y-12">
        <div className="text-center animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/2 mx-auto mb-4"></div>
          <div className="h-6 bg-gray-200 rounded w-3/4 mx-auto"></div>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="animate-pulse text-center">
              <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4"></div>
              <div className="h-6 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-12">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          ¿Por qué elegir Salta Conecta?
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Somos la plataforma líder en comercio mayorista en Salta, diseñada específicamente 
          para conectar proveedores con emprendedores de manera eficiente y confiable.
        </p>
      </div>

      {/* Dynamic Features */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
        {displayFeatures.map((feature) => {
          const IconComponent = getIconComponent(feature.icon)
          return (
            <div key={feature._id} className="text-center group">
              <div className={`w-16 h-16 ${feature.color} bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300`}>
                <IconComponent className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          )
        })}
      </div>

      {/* Dynamic Stats Section */}
      <div className="bg-gradient-to-r from-primary to-accent rounded-2xl p-8 text-white">
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold mb-2">
            Números que hablan por sí solos
          </h3>
          <p className="text-primary-100">
            El crecimiento de nuestra plataforma en números
          </p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.length > 0 ? (
            stats.map((stat) => (
              <div key={stat._id}>
                <div className="text-3xl font-bold mb-2">
                  {stat.value}{stat.suffix || ''}
                </div>
                <div className="text-sm text-primary-100">{stat.label}</div>
              </div>
            ))
          ) : (
            // Fallback estático
            <>
              <div>
                <div className="text-3xl font-bold mb-2">500+</div>
                <div className="text-sm text-primary-100">Productos Activos</div>
              </div>
              <div>
                <div className="text-3xl font-bold mb-2">50+</div>
                <div className="text-sm text-primary-100">Proveedores</div>
              </div>
              <div>
                <div className="text-3xl font-bold mb-2">1000+</div>
                <div className="text-sm text-primary-100">Clientes</div>
              </div>
              <div>
                <div className="text-3xl font-bold mb-2">98%</div>
                <div className="text-sm text-primary-100">Satisfacción</div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Dynamic Testimonials */}
      <div className="space-y-8">
        <div className="text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Lo que dicen nuestros clientes
          </h3>
          <p className="text-gray-600">
            Descubre por qué los mayoristas eligen Salta Conecta
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.length > 0 ? (
            testimonials.map((testimonial) => (
              <div key={testimonial._id} className="bg-white p-6 rounded-lg shadow-md border">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mr-3">
                    <span className="text-white font-bold text-lg">{testimonial.icon}</span>
                  </div>
                  <div>
                    <div className="font-semibold">{testimonial.title}</div>
                    {testimonial.subtitle && (
                      <div className="text-sm text-gray-500">{testimonial.subtitle}</div>
                    )}
                  </div>
                </div>
                <p className="text-gray-600 mb-4">
                  {testimonial.description}
                </p>
              </div>
            ))
          ) : (
            // Fallback estático
            <>
              <div className="bg-white p-6 rounded-lg shadow-md border">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mr-3">
                    <span className="text-white font-bold text-lg">💼</span>
                  </div>
                  <div>
                    <div className="font-semibold">Experiencia Mayorista</div>
                    <div className="text-sm text-gray-500">Más de 5 años en el mercado</div>
                  </div>
                </div>
                <p className="text-gray-600 mb-4">
                  Contamos con amplia experiencia en el comercio mayorista, 
                  entendiendo las necesidades específicas de distribuidores y proveedores.
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md border">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center mr-3">
                    <span className="text-white font-bold text-lg">🛡️</span>
                  </div>
                  <div>
                    <div className="font-semibold">Seguridad Garantizada</div>
                    <div className="text-sm text-gray-500">Transacciones 100% seguras</div>
                  </div>
                </div>
                <p className="text-gray-600 mb-4">
                  Todas nuestras transacciones están protegidas con los más altos 
                  estándares de seguridad y encriptación SSL.
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md border">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mr-3">
                    <span className="text-white font-bold text-lg">📞</span>
                  </div>
                  <div>
                    <div className="font-semibold">Soporte Especializado</div>
                    <div className="text-sm text-gray-500">Atención personalizada</div>
                  </div>
                </div>
                <p className="text-gray-600 mb-4">
                  Nuestro equipo de soporte está disponible para ayudarte con 
                  cualquier consulta sobre productos, pedidos o servicios.
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* CTA Section */}
      <div className="text-center bg-gray-50 rounded-2xl p-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-4">
          ¿Listo para unirte a la comunidad?
        </h3>
        <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
          Únete a miles de emprendedores que ya confían en Salta Conecta para 
          sus compras mayoristas y descubre oportunidades increíbles para tu negocio.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button className="bg-primary text-white px-8 py-3 rounded-lg hover:bg-primary/90 transition-colors font-semibold">
            Registrarse como Cliente
          </button>
          <button className="bg-accent text-white px-8 py-3 rounded-lg hover:bg-accent/90 transition-colors font-semibold">
            Ser Proveedor
          </button>
        </div>
      </div>
    </div>
  )
}
