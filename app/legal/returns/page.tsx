'use client'

import Navbar from '@/components/layout/navbar'
import Footer from '@/components/layout/footer'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { RefreshCw, Clock, Package, CreditCard, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'

export default function ReturnsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
                <RefreshCw className="h-8 w-8 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Política de Devoluciones y Reembolsos
            </h1>
            <p className="text-gray-600">
              Última actualización: {new Date().toLocaleDateString('es-AR')}
            </p>
          </div>

          {/* Legal Framework */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Marco Legal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Esta política está regida por la Ley de Defensa del Consumidor (Ley 24.240), 
                el Código Civil y Comercial de la Nación, y las disposiciones específicas 
                para comercio electrónico en Argentina.
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">Ley 24.240</Badge>
                <Badge variant="secondary">Código Civil</Badge>
                <Badge variant="secondary">Ley 25.506</Badge>
                <Badge variant="secondary">RG AFIP 4.250</Badge>
              </div>
            </CardContent>
          </Card>

          {/* General Information */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>1. Información General</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">1.1 Derecho de Desistimiento</h3>
                <p className="text-gray-600">
                  Según la Ley de Defensa del Consumidor, usted tiene derecho a desistir de 
                  la compra dentro de los 10 días corridos de recibir el producto, sin 
                  necesidad de justificar el motivo.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">1.2 Garantía Legal</h3>
                <p className="text-gray-600">
                  Todos nuestros productos cuentan con garantía legal de 3 meses para bienes 
                  usados y 3 meses para bienes nuevos, conforme al Código Civil y Comercial.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">1.3 Garantía Comercial</h3>
                <p className="text-gray-600">
                  Adicionalmente, ofrecemos garantía comercial extendida según el tipo de 
                  producto, que puede variar entre 6 meses y 2 años.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Return Conditions */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Package className="h-5 w-5 mr-2" />
                2. Condiciones de Devolución
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">2.1 Plazos de Devolución</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li><strong>Desistimiento:</strong> 10 días corridos desde la recepción</li>
                  <li><strong>Defectos ocultos:</strong> 30 días desde el descubrimiento</li>
                  <li><strong>Garantía legal:</strong> 3 meses desde la compra</li>
                  <li><strong>Garantía comercial:</strong> Según especificaciones del producto</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">2.2 Estado del Producto</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Producto en estado original sin uso</li>
                  <li>Embalaje original intacto</li>
                  <li>Accesorios y manuales incluidos</li>
                  <li>Etiquetas y sellos sin remover</li>
                  <li>Sin señales de manipulación indebida</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">2.3 Documentación Requerida</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Factura original de compra</li>
                  <li>Formulario de devolución completado</li>
                  <li>Identificación del comprador</li>
                  <li>Descripción detallada del motivo</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Accepted Return Reasons */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>3. Motivos de Devolución Aceptados</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">3.1 Desistimiento sin Motivo</h3>
                <p className="text-gray-600">
                  Puede devolver cualquier producto dentro de los 10 días sin necesidad 
                  de justificar el motivo, siempre que cumpla con las condiciones de estado.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">3.2 Defectos de Fábrica</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Producto defectuoso o dañado</li>
                  <li>Falta de funcionamiento correcto</li>
                  <li>Piezas faltantes o defectuosas</li>
                  <li>Problemas de calidad certificados</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">3.3 Errores en el Pedido</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Producto incorrecto enviado</li>
                  <li>Cantidad diferente a la solicitada</li>
                  <li>Especificaciones no coincidentes</li>
                  <li>Error en la descripción del producto</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">3.4 Productos No Aceptados</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Productos personalizados o a medida</li>
                  <li>Software y licencias digitales</li>
                  <li>Productos perecederos</li>
                  <li>Productos de higiene personal</li>
                  <li>Productos con garantía vencida</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Return Process */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                4. Proceso de Devolución
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">4.1 Pasos a Seguir</h3>
                <ol className="list-decimal list-inside text-gray-600 space-y-2">
                  <li>
                    <strong>Contactar Soporte:</strong> Enviar email a devoluciones@saltaconecta.com 
                    o llamar al +54 387 123-4567
                  </li>
                  <li>
                    <strong>Proporcionar Información:</strong> Número de orden, motivo de devolución 
                    y descripción del problema
                  </li>
                  <li>
                    <strong>Esperar Autorización:</strong> Recibirá un código de autorización 
                    en 24-48 horas hábiles
                  </li>
                  <li>
                    <strong>Empacar Producto:</strong> Empaquetar cuidadosamente con todos 
                    los accesorios y documentación
                  </li>
                  <li>
                    <strong>Enviar Producto:</strong> Enviar a la dirección indicada con 
                    el código de autorización visible
                  </li>
                  <li>
                    <strong>Confirmar Recepción:</strong> Recibirá confirmación por email 
                    cuando se reciba el producto
                  </li>
                  <li>
                    <strong>Procesar Reembolso:</strong> El reembolso se procesará en 5-10 
                    días hábiles
                  </li>
                </ol>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">4.2 Información Requerida</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Número de orden y fecha de compra</li>
                  <li>Nombre completo y datos de contacto</li>
                  <li>Descripción detallada del problema</li>
                  <li>Fotografías del producto (si aplica)</li>
                  <li>Número de factura original</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Shipping and Costs */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>5. Envío y Costos de Devolución</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">5.1 Costos de Envío</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li><strong>Desistimiento:</strong> Costo a cargo del cliente</li>
                  <li><strong>Defectos de fábrica:</strong> Costo a cargo del proveedor</li>
                  <li><strong>Errores nuestros:</strong> Costo a cargo de Salta Conecta</li>
                  <li><strong>Garantía:</strong> Costo a cargo del proveedor</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">5.2 Métodos de Envío</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li><strong>Correo Argentino:</strong> Envío certificado con seguimiento</li>
                  <li><strong>Empresas privadas:</strong> Andreani, OCA, DHL</li>
                  <li><strong>Retiro en sucursal:</strong> Sin costo adicional</li>
                  <li><strong>Servicio a domicilio:</strong> Coordinado con el proveedor</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">5.3 Tiempos de Envío</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li><strong>Capital Federal:</strong> 1-2 días hábiles</li>
                  <li><strong>Gran Buenos Aires:</strong> 2-3 días hábiles</li>
                  <li><strong>Interior del país:</strong> 3-7 días hábiles</li>
                  <li><strong>Zonas remotas:</strong> 7-15 días hábiles</li>
                  <li><strong>Nota:</strong> Los tiempos pueden variar según el proveedor</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Refunds */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="h-5 w-5 mr-2" />
                6. Reembolsos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">6.1 Tipos de Reembolso</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li><strong>Reembolso total:</strong> Desistimiento y defectos de fábrica</li>
                  <li><strong>Reembolso parcial:</strong> Productos con uso o daños del cliente</li>
                  <li><strong>Cambio por otro producto:</strong> Según disponibilidad</li>
                  <li><strong>Crédito en cuenta:</strong> Para futuras compras</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">6.2 Tiempos de Procesamiento</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li><strong>Tarjetas de crédito:</strong> 5-10 días hábiles</li>
                  <li><strong>Transferencias bancarias:</strong> 3-5 días hábiles</li>
                  <li><strong>MercadoPago:</strong> 2-5 días hábiles</li>
                  <li><strong>Crédito en cuenta:</strong> Inmediato</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">6.3 Información del Reembolso</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Notificación por email con detalles</li>
                  <li>Número de seguimiento del reembolso</li>
                  <li>Fecha estimada de acreditación</li>
                  <li>Contacto en caso de demoras</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Exchanges */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>7. Cambios de Productos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">7.1 Condiciones de Cambio</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Producto en estado original sin uso</li>
                  <li>Mismo valor o superior (pagar diferencia)</li>
                  <li>Disponibilidad del producto solicitado</li>
                  <li>Dentro de los 30 días de la compra</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">7.2 Proceso de Cambio</h3>
                <ol className="list-decimal list-inside text-gray-600 space-y-1">
                  <li>Contactar soporte con solicitud de cambio</li>
                  <li>Verificar disponibilidad del producto deseado</li>
                  <li>Enviar producto original con documentación</li>
                  <li>Recibir nuevo producto o diferencia</li>
                  <li>Confirmar satisfacción con el cambio</li>
                </ol>
              </div>
            </CardContent>
          </Card>

          {/* Warranty */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>8. Garantías</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">8.1 Garantía Legal</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li><strong>Bienes nuevos:</strong> 3 meses</li>
                  <li><strong>Bienes usados:</strong> 3 meses</li>
                  <li><strong>Cobertura:</strong> Defectos de fábrica</li>
                  <li><strong>Responsabilidad:</strong> Vendedor</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">8.2 Garantía Comercial</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li><strong>Electrónicos:</strong> 12 meses</li>
                  <li><strong>Herramientas:</strong> 6 meses</li>
                  <li><strong>Textiles:</strong> 3 meses</li>
                  <li><strong>Alimentos:</strong> Según fecha de vencimiento</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">8.3 Servicio Técnico</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Reparación en taller autorizado</li>
                  <li>Reposición de piezas originales</li>
                  <li>Servicio a domicilio (según zona)</li>
                  <li>Préstamo de producto durante reparación</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>9. Información de Contacto</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">Devoluciones y Reembolsos</h3>
                  <p className="text-gray-600">
                    <strong>Email:</strong> devoluciones@saltaconecta.com<br />
                    <strong>Teléfono:</strong> +54 387 123-4567<br />
                    <strong>WhatsApp:</strong> +54 9 387 123-4567<br />
                    <strong>Horarios:</strong> Lunes a Viernes 9:00 - 18:00
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Servicio Técnico</h3>
                  <p className="text-gray-600">
                    <strong>Email:</strong> tecnico@saltaconecta.com<br />
                    <strong>Teléfono:</strong> +54 387 123-4568<br />
                    <strong>Emergencias:</strong> +54 9 387 123-4568<br />
                    <strong>Horarios:</strong> Lunes a Sábados 8:00 - 20:00
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* FAQ */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>10. Preguntas Frecuentes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">¿Puedo devolver un producto usado?</h3>
                <p className="text-gray-600">
                  Solo si es por defectos de fábrica o errores nuestros. Para desistimiento, 
                  el producto debe estar sin usar y en su empaque original.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">¿Qué pasa si el producto llegó dañado?</h3>
                <p className="text-gray-600">
                  Contacte inmediatamente (máximo 24 horas) y documente con fotos. 
                  Nos haremos cargo del envío de devolución y reembolso total.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">¿Cuánto tarda el reembolso?</h3>
                <p className="text-gray-600">
                  Depende del método de pago: tarjetas 5-10 días, transferencias 3-5 días, 
                  MercadoPago 2-5 días hábiles.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">¿Puedo cambiar por otro producto?</h3>
                <p className="text-gray-600">
                  Sí, siempre que el producto esté disponible y sea del mismo valor o superior. 
                  Si es de menor valor, se reembolsa la diferencia.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      
      <Footer />
    </div>
  )
}
