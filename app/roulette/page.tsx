import { Metadata } from 'next'
import Wheel from '@/components/roulette/wheel'

export const metadata: Metadata = {
  title: 'Ruleta de Premios - Salta Conecta',
  description: '¡Gira la ruleta y gana increíbles premios! Cupones, descuentos y más en Salta Conecta.',
  keywords: 'ruleta, premios, cupones, descuentos, salta conecta',
}

export default function RoulettePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🎰 Ruleta de Premios
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            ¡Gira la ruleta y gana increíbles premios! Cupones de descuento, envío gratis, 
            cashback y más sorpresas te esperan.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <Wheel />
        </div>

        {/* How it works section */}
        <div className="mt-16 max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">
            ¿Cómo funciona?
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎁</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Giros Gratis</h3>
              <p className="text-gray-600">
                Recibe 1 giro gratis cada día y giros adicionales por completar pedidos.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎯</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Premios Reales</h3>
              <p className="text-gray-600">
                Gana cupones de descuento, envío gratis, cashback y premios sorpresa.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">💎</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Uso Inmediato</h3>
              <p className="text-gray-600">
                Usa tus premios inmediatamente en tu próxima compra mayorista.
              </p>
            </div>
          </div>
        </div>

        {/* Prize types section */}
        <div className="mt-16 max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">
            Tipos de Premios
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-md border">
              <div className="text-3xl mb-4">🎫</div>
              <h3 className="text-lg font-semibold mb-2">Cupones de Descuento</h3>
              <p className="text-gray-600 text-sm">
                Descuentos del 10% al 20% en tu próxima compra mayorista.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md border">
              <div className="text-3xl mb-4">🚚</div>
              <h3 className="text-lg font-semibold mb-2">Envío Gratis</h3>
              <p className="text-gray-600 text-sm">
                Envío gratuito en tu próximo pedido, sin importar el monto.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md border">
              <div className="text-3xl mb-4">💰</div>
              <h3 className="text-lg font-semibold mb-2">Cashback</h3>
              <p className="text-gray-600 text-sm">
                Recibe dinero en efectivo para usar en futuras compras.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md border">
              <div className="text-3xl mb-4">🎁</div>
              <h3 className="text-lg font-semibold mb-2">Premios Sorpresa</h3>
              <p className="text-gray-600 text-sm">
                Premios especiales y exclusivos para mayoristas.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md border">
              <div className="text-3xl mb-4">⭐</div>
              <h3 className="text-lg font-semibold mb-2">Descuentos Especiales</h3>
              <p className="text-gray-600 text-sm">
                Descuentos exclusivos en productos seleccionados.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md border">
              <div className="text-3xl mb-4">🏆</div>
              <h3 className="text-lg font-semibold mb-2">Premios VIP</h3>
              <p className="text-gray-600 text-sm">
                Acceso a productos exclusivos y ofertas especiales.
              </p>
            </div>
          </div>
        </div>

        {/* Terms and conditions */}
        <div className="mt-16 max-w-4xl mx-auto">
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Términos y Condiciones</h3>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>• Los giros se renuevan diariamente a las 00:00</li>
              <li>• Los premios tienen fecha de vencimiento de 30 días</li>
              <li>• Los cupones no son acumulables con otras promociones</li>
              <li>• Los premios son válidos solo para compras mayoristas</li>
              <li>• Salta Conecta se reserva el derecho de modificar los premios</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
} 