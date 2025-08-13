'use client'

import Navbar from '@/components/layout/navbar'
import Footer from '@/components/layout/footer'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FileText, Shield, Users, CreditCard, Truck, Clock } from 'lucide-react'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
                <FileText className="h-8 w-8 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Términos y Condiciones
            </h1>
            <p className="text-gray-600">
              Última actualización: {new Date().toLocaleDateString('es-AR')}
            </p>
          </div>

          {/* Legal Notice */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Aviso Legal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Estos términos y condiciones están regidos por las leyes de la República Argentina, 
                especialmente la Ley de Defensa del Consumidor (Ley 24.240), la Ley de Comercio 
                Electrónico (Ley 25.506) y el Código Civil y Comercial de la Nación.
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">Ley 24.240</Badge>
                <Badge variant="secondary">Ley 25.506</Badge>
                <Badge variant="secondary">Código Civil</Badge>
                <Badge variant="secondary">RG AFIP 4.250</Badge>
              </div>
            </CardContent>
          </Card>

          {/* General Terms */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>1. Información General</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">1.1 Identificación del Prestador</h3>
                <p className="text-gray-600">
                  <strong>Razón Social:</strong> Salta Conecta S.A.<br />
                  <strong>Domicilio Legal:</strong>Salta, Argentina<br />
                  <strong>CUIT:</strong> 30-12345678-9<br />
                  <strong>Email:</strong> legal@saltaconecta.com<br />
                  <strong>Teléfono:</strong> +54 3875 326 081
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">1.2 Objeto del Servicio</h3>
                <p className="text-gray-600">
                  Salta Conecta es una plataforma de comercio electrónico mayorista que conecta 
                  proveedores con distribuidores y comercios minoristas, facilitando la compra 
                  y venta de productos en grandes cantidades.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* User Types */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                2. Tipos de Usuarios
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">2.1 Clientes</h3>
                <p className="text-gray-600 mb-2">
                  Personas físicas o jurídicas que adquieren productos para su reventa o uso comercial.
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Deben contar con CUIT/CUIL válido</li>
                  <li>Compras mínimas según categoría de producto</li>
                  <li>Acceso a precios mayoristas exclusivos</li>
                  <li>Responsables del cumplimiento fiscal</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">2.2 Proveedores</h3>
                <p className="text-gray-600 mb-2">
                  Personas físicas o jurídicas que comercializan sus productos a través de la plataforma.
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Deben estar inscriptos en IVA</li>
                  <li>Responsables de la calidad de sus productos</li>
                  <li>Cumplimiento de normativas de seguridad</li>
                  <li>Comisión del 10% sobre ventas realizadas</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Payment Terms */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="h-5 w-5 mr-2" />
                3. Medios de Pago y Cobros
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">3.1 Medios de Pago Aceptados</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Tarjetas de crédito y débito (hasta 12 cuotas sin interés)</li>
                  <li>Transferencias bancarias</li>
                  <li>MercadoPago (cuenta digital)</li>
                  <li>Pago Fácil y Rapipago (efectivo)</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">3.2 Condiciones de Pago</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Pagos al contado: descuento del 5%</li>
                  <li>Pagos a 30 días: recargo del 10%</li>
                  <li>Pagos a 60 días: recargo del 15%</li>
                  <li>Facturación inmediata al momento del pago</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">3.3 Comisiones</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Comisión establecida según la oferta de precios recomendada por el proveedor</li>
                  <li>No se maneja un porcentaje fijo</li>
                  <li>Comisión MercadoPago: 5.5% + IVA</li>
                  <li>Comisión por envío: a cargo del proveedor</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Shipping Terms */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Truck className="h-5 w-5 mr-2" />
                4. Envíos y Entregas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">4.1 Tipos de Envío</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li><strong>Envío estándar:</strong> 3-5 días hábiles - Precio establecido por el proveedor</li>
                  <li><strong>Envío express:</strong> 1-2 días hábiles - Precio establecido por el proveedor</li>
                  <li><strong>Retiro en local:</strong> Gratis - 72 horas hábiles</li>
                  <li><strong>Envío gratis:</strong> Según promociones del proveedor</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">4.2 Cobertura de Envío</h3>
                <p className="text-gray-600 mb-2">
                  Los envíos son gestionados por cada proveedor individualmente. 
                  La cobertura y costos son establecidos por el proveedor del producto.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">4.3 Responsabilidades</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Verificación de productos al momento de recepción</li>
                  <li>Reporte de daños dentro de las 24 horas</li>
                  <li>Seguro de transporte a cargo del proveedor</li>
                  <li>Seguimiento en tiempo real según proveedor</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Returns and Refunds */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                5. Devoluciones y Reembolsos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">5.1 Condiciones de Devolución</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Plazo: 30 días desde la recepción</li>
                  <li>Producto en estado original y embalaje intacto</li>
                  <li>Factura original obligatoria</li>
                  <li>No aplica para productos personalizados</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">5.2 Causas de Devolución Aceptadas</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Producto defectuoso o dañado</li>
                  <li>Error en el pedido (producto incorrecto)</li>
                  <li>Producto no conforme a la descripción</li>
                  <li>Problemas de calidad certificados</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">5.3 Proceso de Devolución</h3>
                <ol className="list-decimal list-inside text-gray-600 space-y-1">
                  <li>Contactar a soporte@saltaconecta.com</li>
                  <li>Proporcionar número de orden y motivo</li>
                  <li>Esperar autorización de devolución</li>
                  <li>Enviar producto a dirección indicada</li>
                  <li>Reembolso en 5-10 días hábiles</li>
                </ol>
              </div>
            </CardContent>
          </Card>

          {/* Privacy and Data */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>6. Privacidad y Protección de Datos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">6.1 Recopilación de Datos</h3>
                <p className="text-gray-600">
                  Recopilamos información personal necesaria para la prestación del servicio, 
                  incluyendo datos de identificación, contacto, comerciales y de pago, 
                  conforme a la Ley de Protección de Datos Personales (Ley 25.326).
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">6.2 Uso de Datos</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Procesamiento de pedidos y pagos</li>
                  <li>Comunicación comercial autorizada</li>
                  <li>Mejora de servicios y productos</li>
                  <li>Cumplimiento de obligaciones legales</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">6.3 Derechos del Usuario</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Acceso, rectificación y supresión de datos</li>
                  <li>Revocación del consentimiento</li>
                  <li>Portabilidad de datos</li>
                  <li>Información sobre el tratamiento</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Intellectual Property */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>7. Propiedad Intelectual</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">7.1 Derechos Reservados</h3>
                <p className="text-gray-600">
                  Todos los derechos de propiedad intelectual sobre la plataforma, 
                  incluyendo software, diseño, contenido y marcas comerciales, 
                  son propiedad exclusiva de Salta Conecta S.A.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">7.2 Uso Autorizado</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Uso personal y comercial autorizado</li>
                  <li>Prohibida la reproducción sin autorización</li>
                  <li>Respeto a derechos de terceros</li>
                  <li>Licencia limitada y revocable</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Liability */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>8. Limitación de Responsabilidad</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">8.1 Responsabilidad de la Plataforma</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Intermediación entre compradores y vendedores</li>
                  <li>No garantiza la disponibilidad de productos</li>
                  <li>Responsabilidad limitada a comisiones cobradas</li>
                  <li>No responde por daños indirectos</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">8.2 Responsabilidad del Usuario</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Veracidad de información proporcionada</li>
                  <li>Cumplimiento de obligaciones fiscales</li>
                  <li>Uso adecuado de la plataforma</li>
                  <li>Respeto a derechos de terceros</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Modifications */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>9. Modificaciones</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Salta Conecta se reserva el derecho de modificar estos términos y condiciones 
                en cualquier momento, notificando los cambios a través de la plataforma o 
                por medios electrónicos. El uso continuado de la plataforma después de 
                la notificación implica la aceptación de los nuevos términos.
              </p>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>10. Información de Contacto</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">Atención al Cliente</h3>
                  <p className="text-gray-600">
                    <strong>Email:</strong> soporte@saltaconecta.com<br />
                    <strong>Teléfono:</strong> +54 387 123-4567<br />
                    <strong>Horarios:</strong> Lunes a Viernes 9:00 - 18:00
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Aspectos Legales</h3>
                  <p className="text-gray-600">
                    <strong>Email:</strong> legal@saltaconecta.com<br />
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
