'use client'

import Link from 'next/link'
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-secondary text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">SC</span>
              </div>
              <div>
                <h3 className="text-xl font-bold">Salta Conecta</h3>
                <p className="text-sm text-gray-300">Mayorista Digital</p>
              </div>
            </div>
            <p className="text-gray-300 text-sm">
              Plataforma líder en comercio electrónico mayorista en Salta, Argentina. 
              Conectamos proveedores con emprendedores para impulsar el crecimiento local.
            </p>
            <div className="flex space-x-4">
              <Link href="#" className="text-gray-300 hover:text-white transition-colors">
                <Facebook className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-gray-300 hover:text-white transition-colors">
                <Instagram className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-gray-300 hover:text-white transition-colors">
                <Twitter className="h-5 w-5" />
              </Link>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Enlaces Rápidos</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/products" className="text-gray-300 hover:text-white transition-colors">
                  Productos
                </Link>
              </li>
              <li>
                <Link href="/categories" className="text-gray-300 hover:text-white transition-colors">
                  Categorías
                </Link>
              </li>
              <li>
                <Link href="/supplier" className="text-gray-300 hover:text-white transition-colors">
                  Ser Proveedor
                </Link>
              </li>
              <li>
                <Link href="/roulette" className="text-gray-300 hover:text-white transition-colors">
                  Ruleta de Premios
                </Link>
              </li>
              <li>
                <Link href="/support" className="text-gray-300 hover:text-white transition-colors">
                  Soporte
                </Link>
              </li>
            </ul>
          </div>

          {/* Account */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Mi Cuenta</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/account/profile" className="text-gray-300 hover:text-white transition-colors">
                  Mi Perfil
                </Link>
              </li>
              <li>
                <Link href="/account/orders" className="text-gray-300 hover:text-white transition-colors">
                  Mis Pedidos
                </Link>
              </li>
              <li>
                <Link href="/account/coupons" className="text-gray-300 hover:text-white transition-colors">
                  Mis Cupones
                </Link>
              </li>
              <li>
                <Link href="/cart" className="text-gray-300 hover:text-white transition-colors">
                  Carrito
                </Link>
              </li>
              <li>
                <Link href="/auth/login" className="text-gray-300 hover:text-white transition-colors">
                  Iniciar Sesión
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Contacto</h4>
            <div className="space-y-3 text-sm">
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="text-gray-300">
                  Av. San Martín 1234<br />
                  Salta, Argentina
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-primary" />
                <span className="text-gray-300">+54 387 456-7890</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-primary" />
                <span className="text-gray-300">info@saltaconecta.com.ar</span>
              </div>
            </div>
            
            <div className="pt-4">
              <h5 className="font-semibold mb-2">Horarios de Atención</h5>
              <div className="text-sm text-gray-300 space-y-1">
                <p>Lunes a Viernes: 9:00 - 18:00</p>
                <p>Sábados: 9:00 - 13:00</p>
                <p>Domingos: Cerrado</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-700 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-sm text-gray-300">
              © 2024 Salta Conecta. Todos los derechos reservados.
            </div>
            <div className="flex flex-wrap justify-center space-x-6 text-sm">
              <Link href="/legal/terms" className="text-gray-300 hover:text-white transition-colors">
                Términos y Condiciones
              </Link>
              <Link href="/legal/privacy" className="text-gray-300 hover:text-white transition-colors">
                Política de Privacidad
              </Link>
              <Link href="/legal/cookies" className="text-gray-300 hover:text-white transition-colors">
                Política de Cookies
              </Link>
              <Link href="/legal/returns" className="text-gray-300 hover:text-white transition-colors">
                Devoluciones
              </Link>
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="border-t border-gray-700 mt-6 pt-6">
          <div className="text-center">
            <h5 className="text-sm font-semibold mb-3">Métodos de Pago</h5>
            <div className="flex justify-center space-x-4 text-xs text-gray-300">
              <span>Mercado Pago</span>
              <span>•</span>
              <span>Transferencia Bancaria</span>
              <span>•</span>
              <span>Efectivo</span>
              <span>•</span>
              <span>Tarjetas de Crédito</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
