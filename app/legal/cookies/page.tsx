'use client'

import Navbar from '@/components/layout/navbar'
import Footer from '@/components/layout/footer'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Cookie, Settings, Shield, BarChart3, Target, Clock } from 'lucide-react'

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
                <Cookie className="h-8 w-8 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Política de Cookies
            </h1>
            <p className="text-gray-600">
              Última actualización: {new Date().toLocaleDateString('es-AR')}
            </p>
          </div>

          {/* Introduction */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>¿Qué son las Cookies?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Las cookies son pequeños archivos de texto que se almacenan en su dispositivo 
                (computadora, tablet o smartphone) cuando visita nuestro sitio web. Estas cookies 
                nos ayudan a mejorar su experiencia de navegación y a proporcionar servicios 
                personalizados.
              </p>
              <p className="text-gray-600">
                Esta política explica qué tipos de cookies utilizamos, cómo las usamos y cómo 
                puede gestionarlas según sus preferencias.
              </p>
            </CardContent>
          </Card>

          {/* Legal Framework */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Marco Legal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                El uso de cookies en nuestro sitio web cumple con las regulaciones argentinas 
                y europeas sobre privacidad y protección de datos, incluyendo la Ley de 
                Protección de Datos Personales (Ley 25.326) y el Reglamento General de 
                Protección de Datos (GDPR) de la Unión Europea.
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">Ley 25.326</Badge>
                <Badge variant="secondary">GDPR</Badge>
                <Badge variant="secondary">Directiva ePrivacy</Badge>
                <Badge variant="secondary">RG AFIP 4.250</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Types of Cookies */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Tipos de Cookies que Utilizamos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Essential Cookies */}
              <div>
                <h3 className="font-semibold mb-2 flex items-center">
                  <Settings className="h-4 w-4 mr-2 text-green-600" />
                  Cookies Esenciales
                </h3>
                <p className="text-gray-600 mb-2">
                  Estas cookies son necesarias para el funcionamiento básico del sitio web y 
                  no pueden ser desactivadas.
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li><strong>session_id:</strong> Mantiene su sesión activa durante la navegación</li>
                  <li><strong>csrf_token:</strong> Protege contra ataques de falsificación de solicitudes</li>
                  <li><strong>language:</strong> Recuerda su idioma preferido</li>
                  <li><strong>currency:</strong> Mantiene la moneda seleccionada (ARS)</li>
                </ul>
                <div className="mt-2">
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    Duración: Sesión / 1 año
                  </Badge>
                </div>
              </div>

              {/* Functional Cookies */}
              <div>
                <h3 className="font-semibold mb-2 flex items-center">
                  <Settings className="h-4 w-4 mr-2 text-blue-600" />
                  Cookies Funcionales
                </h3>
                <p className="text-gray-600 mb-2">
                  Estas cookies permiten que el sitio web recuerde las elecciones que hace 
                  para proporcionar funcionalidad mejorada y personalización.
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li><strong>user_preferences:</strong> Guarda sus preferencias de visualización</li>
                  <li><strong>cart_items:</strong> Mantiene los productos en su carrito de compras</li>
                  <li><strong>recent_products:</strong> Recuerda productos recientemente vistos</li>
                  <li><strong>filters:</strong> Mantiene filtros aplicados en búsquedas</li>
                </ul>
                <div className="mt-2">
                  <Badge variant="outline" className="text-blue-600 border-blue-600">
                    Duración: 30 días
                  </Badge>
                </div>
              </div>

              {/* Analytics Cookies */}
              <div>
                <h3 className="font-semibold mb-2 flex items-center">
                  <BarChart3 className="h-4 w-4 mr-2 text-purple-600" />
                  Cookies Analíticas
                </h3>
                <p className="text-gray-600 mb-2">
                  Estas cookies nos ayudan a entender cómo los visitantes interactúan con 
                  nuestro sitio web, recopilando y reportando información de forma anónima.
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li><strong>_ga:</strong> Google Analytics - Identificador único de usuario</li>
                  <li><strong>_gid:</strong> Google Analytics - Identificador de sesión</li>
                  <li><strong>_gat:</strong> Google Analytics - Control de tasa de solicitudes</li>
                  <li><strong>_ga_*:</strong> Google Analytics - Configuraciones personalizadas</li>
                </ul>
                <div className="mt-2">
                  <Badge variant="outline" className="text-purple-600 border-purple-600">
                    Duración: 2 años / 24 horas
                  </Badge>
                </div>
              </div>

              {/* Marketing Cookies */}
              <div>
                <h3 className="font-semibold mb-2 flex items-center">
                  <Target className="h-4 w-4 mr-2 text-orange-600" />
                  Cookies de Marketing
                </h3>
                <p className="text-gray-600 mb-2">
                  Estas cookies se utilizan para rastrear visitantes en sitios web con el 
                  propósito de mostrar anuncios relevantes y atractivos.
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li><strong>_fbp:</strong> Facebook Pixel - Seguimiento de conversiones</li>
                  <li><strong>_fbc:</strong> Facebook Pixel - Cliente de Facebook</li>
                  <li><strong>ads_prefs:</strong> Preferencias de publicidad</li>
                  <li><strong>remarketing:</strong> Cookies de remarketing</li>
                </ul>
                <div className="mt-2">
                  <Badge variant="outline" className="text-orange-600 border-orange-600">
                    Duración: 90 días
                  </Badge>
                </div>
              </div>

              {/* Third Party Cookies */}
              <div>
                <h3 className="font-semibold mb-2 flex items-center">
                  <Shield className="h-4 w-4 mr-2 text-red-600" />
                  Cookies de Terceros
                </h3>
                <p className="text-gray-600 mb-2">
                  Estas cookies son establecidas por servicios externos que utilizamos 
                  para mejorar la funcionalidad de nuestro sitio.
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li><strong>MercadoPago:</strong> Procesamiento de pagos seguros</li>
                  <li><strong>Google Maps:</strong> Ubicación y direcciones</li>
                  <li><strong>YouTube:</strong> Reproducción de videos</li>
                  <li><strong>Social Media:</strong> Botones de redes sociales</li>
                </ul>
                <div className="mt-2">
                  <Badge variant="outline" className="text-red-600 border-red-600">
                    Duración: Variable
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cookie Management */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Gestión de Cookies</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Panel de Configuración</h3>
                <p className="text-gray-600 mb-4">
                  Puede gestionar sus preferencias de cookies a través de nuestro panel 
                  de configuración integrado en el sitio web.
                </p>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">
                    <strong>Acceso al panel:</strong> Haga clic en &quot;Configuración de Cookies&quot; 
                    en la parte inferior de cualquier página, o en el &quot;ícono de configuración&quot; 
                    en la barra de navegación.
                  </p>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Configuración del Navegador</h3>
                <p className="text-gray-600 mb-2">
                  También puede gestionar las cookies a través de la configuración de su navegador:
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li><strong>Chrome:</strong> Configuración → Privacidad y seguridad → Cookies</li>
                  <li><strong>Firefox:</strong> Opciones → Privacidad y seguridad → Cookies</li>
                  <li><strong>Safari:</strong> Preferencias → Privacidad → Cookies</li>
                  <li><strong>Edge:</strong> Configuración → Cookies y permisos del sitio</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Herramientas de Terceros</h3>
                <p className="text-gray-600 mb-2">
                  Para gestionar cookies de análisis y marketing, puede utilizar:
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li><strong>Google Analytics Opt-out:</strong> Complemento del navegador</li>
                  <li><strong>Facebook Pixel Helper:</strong> Extensión de Chrome</li>
                  <li><strong>AdBlock:</strong> Bloqueo de anuncios y cookies de tracking</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Cookie Duration */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Duración de las Cookies
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Tipos de Duración</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li><strong>Cookies de sesión:</strong> Se eliminan al cerrar el navegador</li>
                  <li><strong>Cookies persistentes:</strong> Permanecen hasta su fecha de expiración</li>
                  <li><strong>Cookies de terceros:</strong> Duración controlada por el proveedor</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Períodos de Retención</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Cookies Esenciales</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Sesión: Hasta cerrar navegador</li>
                      <li>• Persistentes: 1 año máximo</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Cookies Analíticas</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Google Analytics: 2 años</li>
                      <li>• Sesiones: 30 minutos</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Cookies de Marketing</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Facebook Pixel: 90 días</li>
                      <li>• Remarketing: 180 días</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Cookies Funcionales</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Preferencias: 30 días</li>
                      <li>• Carrito: 7 días</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Impact of Disabling */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Impacto de Deshabilitar Cookies</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Funcionalidades que Requieren Cookies</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li><strong>Inicio de sesión:</strong> No podrá acceder a su cuenta</li>
                  <li><strong>Carrito de compras:</strong> Los productos no se guardarán</li>
                  <li><strong>Pagos:</strong> No podrá procesar transacciones</li>
                  <li><strong>Personalización:</strong> No se recordarán sus preferencias</li>
                  <li><strong>Análisis:</strong> No podremos mejorar el sitio</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Recomendaciones</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Mantenga habilitadas las cookies esenciales para el funcionamiento</li>
                  <li>Considere habilitar cookies funcionales para mejor experiencia</li>
                  <li>Las cookies analíticas ayudan a mejorar nuestros servicios</li>
                  <li>Las cookies de marketing son opcionales</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Updates */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Actualizaciones de la Política</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Esta política de cookies puede ser actualizada periódicamente para reflejar 
                cambios en nuestras prácticas o por otras razones operativas, legales o 
                regulatorias. Le notificaremos cualquier cambio significativo a través de 
                nuestro sitio web o por otros medios apropiados.
              </p>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Información de Contacto</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">Preguntas sobre Cookies</h3>
                  <p className="text-gray-600">
                    <strong>Email:</strong> cookies@saltaconecta.com<br />
                    <strong>Teléfono:</strong> +54 387 123-4567<br />
                    <strong>Horarios:</strong> Lunes a Viernes 9:00 - 18:00
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Delegado de Protección de Datos</h3>
                  <p className="text-gray-600">
                    <strong>Email:</strong> dpo@saltaconecta.com<br />
                    <strong>Teléfono:</strong> +54 387 123-4568<br />
                    <strong>Horarios:</strong> Lunes a Viernes 8:00 - 17:00
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      
      <Footer />
    </div>
  )
}
