'use client'

import Navbar from '@/components/layout/navbar'
import Footer from '@/components/layout/footer'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Shield, Database, Eye, Lock, Users, Cookie, Bell } from 'lucide-react'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
                <Shield className="h-8 w-8 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Política de Privacidad
            </h1>
            <p className="text-gray-600">
              Última actualización: {new Date().toLocaleDateString('es-AR')}
            </p>
          </div>

          {/* Legal Framework */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="h-5 w-5 mr-2" />
                Marco Legal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Esta política de privacidad está regida por las leyes de la República Argentina, 
                especialmente la Ley de Protección de Datos Personales (Ley 25.326), su Decreto 
                Reglamentario 1558/2001 y las disposiciones de la Dirección Nacional de 
                Protección de Datos Personales.
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">Ley 25.326</Badge>
                <Badge variant="secondary">Decreto 1558/2001</Badge>
                <Badge variant="secondary">RG AFIP 4.250</Badge>
                <Badge variant="secondary">GDPR (UE)</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Data Controller */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>1. Responsable del Tratamiento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">1.1 Identificación</h3>
                <p className="text-gray-600">
                  <strong>Razón Social:</strong> Salta Conecta S.A.<br />
                  <strong>Domicilio Legal:</strong>Salta, Argentina<br />
                  <strong>CUIT:</strong> 30-12345678-9<br />
                  <strong>Email:</strong> legal@saltaconecta.com<br />
                  <strong>Teléfono:</strong> +54 3875 326 081
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">1.2 Delegado de Protección de Datos</h3>
                <p className="text-gray-600">
                  <strong>Nombre:</strong> Dr. Juan Carlos Pérez<br />
                  <strong>Email:</strong> dpo@saltaconecta.com<br />
                  <strong>Teléfono:</strong> +54 387 123-4568
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Data Collection */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Eye className="h-5 w-5 mr-2" />
                2. Recopilación de Datos Personales
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">2.1 Datos de Identificación</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Nombre y apellido</li>
                  <li>Documento Nacional de Identidad (DNI)</li>
                  <li>CUIT/CUIL</li>
                  <li>Fecha de nacimiento</li>
                  <li>Nacionalidad</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">2.2 Datos de Contacto</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Dirección de correo electrónico</li>
                  <li>Número de teléfono</li>
                  <li>Dirección postal</li>
                  <li>Ciudad y provincia</li>
                  <li>Código postal</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">2.3 Datos Comerciales</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Historial de compras</li>
                  <li>Productos de interés</li>
                  <li>Preferencias de pago</li>
                  <li>Direcciones de envío</li>
                  <li>Información fiscal</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">2.4 Datos de Pago</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Información de tarjetas (encriptada)</li>
                  <li>Historial de transacciones</li>
                  <li>Datos de MercadoPago</li>
                  <li>Información bancaria</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Purpose of Processing */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>3. Finalidad del Tratamiento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">3.1 Finalidades Principales</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Gestión de cuentas de usuario</li>
                  <li>Procesamiento de pedidos y pagos</li>
                  <li>Envío de productos y servicios</li>
                  <li>Comunicación comercial autorizada</li>
                  <li>Cumplimiento de obligaciones legales</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">3.2 Finalidades Secundarias</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Mejora de productos y servicios</li>
                  <li>Análisis estadístico y de mercado</li>
                  <li>Prevención de fraudes</li>
                  <li>Investigación y desarrollo</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">3.3 Base Legal</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Consentimiento del usuario</li>
                  <li>Ejecución de contrato</li>
                  <li>Interés legítimo</li>
                  <li>Cumplimiento de obligaciones legales</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Data Sharing */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                4. Compartir Datos con Terceros
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">4.1 Proveedores de Servicios</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li><strong>MercadoPago:</strong> Procesamiento de pagos</li>
                  <li><strong>Empresas de transporte:</strong> Envío de productos</li>
                  <li><strong>Proveedores de hosting:</strong> Almacenamiento de datos</li>
                  <li><strong>Servicios de análisis:</strong> Google Analytics</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">4.2 Autoridades Públicas</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>AFIP (información fiscal)</li>
                  <li>Autoridades judiciales (por orden judicial)</li>
                  <li>Organismos de control</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">4.3 Condiciones de Compartir</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Solo datos necesarios para el servicio</li>
                  <li>Acuerdos de confidencialidad</li>
                  <li>Cumplimiento de estándares de seguridad</li>
                  <li>Información previa al usuario</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Data Security */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Lock className="h-5 w-5 mr-2" />
                5. Seguridad de Datos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">5.1 Medidas Técnicas</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Encriptación SSL/TLS en todas las comunicaciones</li>
                  <li>Encriptación de datos sensibles en reposo</li>
                  <li>Firewalls y sistemas de detección de intrusiones</li>
                  <li>Copias de seguridad encriptadas</li>
                  <li>Acceso restringido con autenticación multifactor</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">5.2 Medidas Organizativas</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Políticas de confidencialidad para empleados</li>
                  <li>Capacitación en protección de datos</li>
                  <li>Controles de acceso basados en roles</li>
                  <li>Auditorías regulares de seguridad</li>
                  <li>Procedimientos de respuesta a incidentes</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">5.3 Retención de Datos</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Datos de cuenta: 5 años después del cierre</li>
                  <li>Datos de transacciones: 10 años (obligación fiscal)</li>
                  <li>Datos de marketing: hasta revocación del consentimiento</li>
                  <li>Logs de seguridad: 2 años</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* User Rights */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>6. Derechos del Usuario</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">6.1 Derechos ARCO</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li><strong>Acceso:</strong> Conocer qué datos tenemos sobre usted</li>
                  <li><strong>Rectificación:</strong> Corregir datos inexactos o incompletos</li>
                  <li><strong>Cancelación:</strong> Eliminar datos cuando sea legal</li>
                  <li><strong>Oposición:</strong> Oponerse al tratamiento de datos</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">6.2 Derechos Adicionales</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li><strong>Portabilidad:</strong> Recibir datos en formato estructurado</li>
                  <li><strong>Limitación:</strong> Restringir el tratamiento</li>
                  <li><strong>Revocación:</strong> Retirar el consentimiento</li>
                  <li><strong>Información:</strong> Conocer las finalidades del tratamiento</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">6.3 Ejercicio de Derechos</h3>
                <p className="text-gray-600">
                  Para ejercer sus derechos, puede contactarnos a través de:<br />
                  <strong>Email:</strong> derechos@saltaconecta.com<br />
                  <strong>Formulario web:</strong> /legal/rights<br />
                  <strong>Respuesta:</strong> Máximo 10 días hábiles
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Cookies */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Cookie className="h-5 w-5 mr-2" />
                7. Cookies y Tecnologías Similares
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">7.1 Tipos de Cookies</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li><strong>Esenciales:</strong> Funcionamiento básico del sitio</li>
                  <li><strong>Funcionales:</strong> Preferencias y personalización</li>
                  <li><strong>Analíticas:</strong> Análisis de uso y rendimiento</li>
                  <li><strong>Publicitarias:</strong> Publicidad personalizada</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">7.2 Gestión de Cookies</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Panel de configuración de cookies</li>
                  <li>Configuración del navegador</li>
                  <li>Herramientas de terceros</li>
                  <li>Información detallada en /legal/cookies</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Marketing Communications */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="h-5 w-5 mr-2" />
                8. Comunicaciones Comerciales
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">8.1 Tipos de Comunicaciones</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Notificaciones de pedidos y envíos</li>
                  <li>Ofertas y promociones personalizadas</li>
                  <li>Newsletter con novedades</li>
                  <li>Recordatorios de carrito abandonado</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">8.2 Gestión de Suscripciones</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Suscribirse/desuscribirse desde la cuenta</li>
                  <li>Enlace de desuscripción en cada email</li>
                  <li>Configuración de preferencias</li>
                  <li>Respuesta inmediata a solicitudes</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* International Transfers */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>9. Transferencias Internacionales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">9.1 Destinos de Transferencia</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li><strong>Estados Unidos:</strong> Servicios de Google y Microsoft</li>
                  <li><strong>Unión Europea:</strong> Servicios de análisis</li>
                  <li><strong>Brasil:</strong> Servicios de MercadoPago</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">9.2 Garantías de Protección</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Decisiones de adecuación de la UE</li>
                  <li>Cláusulas contractuales estándar</li>
                  <li>Certificaciones de privacidad</li>
                  <li>Acuerdos de procesamiento de datos</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Updates */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>10. Actualizaciones de la Política</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Esta política puede ser actualizada periódicamente. Los cambios significativos 
                serán notificados a través de la plataforma o por email. El uso continuado 
                de nuestros servicios después de la notificación implica la aceptación de 
                la política actualizada.
              </p>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>11. Información de Contacto</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">Delegado de Protección de Datos</h3>
                  <p className="text-gray-600">
                    <strong>Email:</strong> dpo@saltaconecta.com<br />
                    <strong>Teléfono:</strong> +54 387 123-4568<br />
                    <strong>Horarios:</strong> Lunes a Viernes 8:00 - 17:00
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Ejercicio de Derechos</h3>
                  <p className="text-gray-600">
                    <strong>Email:</strong> derechos@saltaconecta.com<br />
                    <strong>Formulario:</strong> /legal/rights<br />
                    <strong>Respuesta:</strong> Máximo 10 días hábiles
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
