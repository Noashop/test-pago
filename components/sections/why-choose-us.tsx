'use client'

import { Shield, Truck, Users, TrendingUp, Gift, Clock, Star, Zap } from 'lucide-react'

const features = [
  {
    icon: Shield,
    title: 'Proveedores Verificados',
    description: 'Todos nuestros proveedores pasan por un riguroso proceso de verificación para garantizar la calidad de los productos.',
    color: 'text-green-500'
  },
  {
    icon: Truck,
    title: 'Envío Garantizado',
    description: 'Envío a domicilio o retiro en local. Costos calculados según proveedor y región con seguimiento en tiempo real.',
    color: 'text-blue-500'
  },
  {
    icon: Users,
    title: 'Comunidad Mayorista',
    description: 'Conectamos emprendedores con proveedores confiables para impulsar el crecimiento del comercio local.',
    color: 'text-purple-500'
  },
  {
    icon: TrendingUp,
    title: 'Precios Mayoristas',
    description: 'Precios especiales para compras mayoristas con descuentos progresivos según volumen de compra.',
    color: 'text-orange-500'
  },
  {
    icon: Gift,
    title: 'Ruleta de Premios',
    description: 'Gira la ruleta y gana cupones, descuentos y premios especiales por completar pedidos.',
    color: 'text-pink-500'
  },
  {
    icon: Clock,
    title: 'Soporte 24/7',
    description: 'Atención al cliente disponible las 24 horas del día, 7 días a la semana para resolver cualquier consulta.',
    color: 'text-indigo-500'
  },
  {
    icon: Star,
    title: 'Calidad Garantizada',
    description: 'Productos de alta calidad con garantía y respaldo de nuestros proveedores verificados.',
    color: 'text-yellow-500'
  },
  {
    icon: Zap,
    title: 'Proceso Simplificado',
    description: 'Interfaz intuitiva y proceso de compra simplificado para una experiencia mayorista eficiente.',
    color: 'text-red-500'
  }
]

export default function WhyChooseUs() {
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

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
        {features.map((feature, index) => (
          <div key={index} className="text-center group">
            <div className={`w-16 h-16 ${feature.color} bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300`}>
              <feature.icon className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {feature.title}
            </h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              {feature.description}
            </p>
          </div>
        ))}
      </div>

      {/* Stats Section */}
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
        </div>
      </div>

      {/* Testimonials */}
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
