'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { CreditCard, Loader2, AlertCircle, DollarSign } from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'

interface CheckoutItem {
  productId: string
  name: string
  price: number
  quantity: number
  image: string
}

interface CommissionDetails {
  adminCommission: number
  supplierAmount: number
  adminCommissionPercentage: number
  totalAmount: number
}

interface MercadoPagoCheckoutProps {
  items: CheckoutItem[]
  total: number
  orderId: string
  shippingAddress: any
  onSuccess?: () => void
  onError?: (error: string) => void
}

export default function MercadoPagoCheckout({
  items,
  total,
  orderId,
  shippingAddress,
  onSuccess,
  onError
}: MercadoPagoCheckoutProps) {
  const [loading, setLoading] = useState(false)
  const [commissionDetails, setCommissionDetails] = useState<CommissionDetails | null>(null)
  const [preferenceId, setPreferenceId] = useState<string | null>(null)

  // Cargar SDK de MercadoPago
  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://sdk.mercadopago.com/js/v2'
    script.async = true
    document.body.appendChild(script)

    return () => {
      document.body.removeChild(script)
    }
  }, [])

  const createPaymentPreference = async () => {
    setLoading(true)
    try {
      // Validate data before sending
      if (!items || items.length === 0) {
        throw new Error('No hay items en el carrito')
      }
      
      if (!total || total <= 0) {
        throw new Error('El total debe ser mayor a 0')
      }
      
      if (!orderId) {
        throw new Error('ID de orden requerido')
      }
      
      // Calculate total from items to ensure consistency
      const calculatedTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
      
      const response = await fetch('/api/payments/create-preference', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: items.map(item => ({
            productId: item.productId,
            name: item.name,
            price: item.price,
            quantity: item.quantity
          })),
          total: calculatedTotal, // Use calculated total for consistency
          orderId
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al crear preferencia de pago')
      }

      const data = await response.json()
      setPreferenceId(data.preferenceId)
      setCommissionDetails(data.commissionDetails)

      // Inicializar MercadoPago Checkout
      if (window.MercadoPago) {
        const mp = new window.MercadoPago(process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY, {
          locale: 'es-AR'
        })

        // Crear checkout
        mp.checkout({
          preference: {
            id: data.preferenceId
          },
          render: {
            container: '.mercadopago-button',
            label: 'Pagar con MercadoPago'
          }
        })
      } else {
        // Fallback: redirigir directamente
        window.location.href = data.initPoint
      }

    } catch (error) {
      console.error('Error creating payment preference:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error al procesar el pago'
      toast.error(errorMessage)
      onError?.(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleDirectPayment = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/payments/create-preference', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: items.map(item => ({
            productId: item.productId,
            name: item.name,
            price: item.price,
            quantity: item.quantity
          })),
          total,
          orderId
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al crear preferencia de pago')
      }

      const data = await response.json()
      
      // Redirigir directamente a MercadoPago
      window.location.href = data.initPoint

    } catch (error) {
      console.error('Error creating payment preference:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error al procesar el pago'
      toast.error(errorMessage)
      onError?.(errorMessage)
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Resumen de la orden */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CreditCard className="h-5 w-5 mr-2" />
            Resumen del pedido
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Items */}
          <div className="space-y-3">
            {items.map((item, index) => (
              <div key={index} className="flex items-center space-x-3">
                <div className="relative h-12 w-12 rounded overflow-hidden">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    sizes="48px"
                    className="object-cover rounded"
                  />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{item.name}</p>
                  <p className="text-gray-600 text-sm">
                    {item.quantity} × ${item.price.toLocaleString('es-AR')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">
                    ${(item.quantity * item.price).toLocaleString('es-AR')}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <Separator />

          {/* Total */}
          <div className="flex justify-between items-center text-lg font-semibold">
            <span>Total a pagar:</span>
            <span>${total.toLocaleString('es-AR')}</span>
          </div>

          {/* Detalles de comisión (si están disponibles) */}
          {commissionDetails && (
            <>
              <Separator />
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center mb-2">
                  <DollarSign className="h-4 w-4 text-blue-600 mr-2" />
                  <span className="font-medium text-blue-800">Detalles de la transacción</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-600">Comisión admin:</span>
                    <p className="font-medium">${commissionDetails.adminCommission.toLocaleString('es-AR')}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Para proveedores:</span>
                    <p className="font-medium">${commissionDetails.supplierAmount.toLocaleString('es-AR')}</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Información de seguridad */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Pago 100% seguro</h3>
              <p className="text-sm text-gray-600 mt-1">
                Procesado por MercadoPago con encriptación SSL. Tus datos están protegidos.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Métodos de pago disponibles */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Métodos de pago disponibles</CardTitle>
          <p className="text-sm text-gray-600">Elige tu método de pago preferido</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 border rounded-lg hover:bg-gray-50 transition-colors">
              <div className="bg-blue-100 p-3 rounded-lg mb-2">
                <CreditCard className="h-6 w-6 mx-auto text-blue-600" />
              </div>
              <p className="text-xs font-medium text-gray-900">Tarjeta de Crédito</p>
              <p className="text-xs text-gray-500">Hasta 12 cuotas</p>
            </div>
            <div className="text-center p-3 border rounded-lg hover:bg-gray-50 transition-colors">
              <div className="bg-green-100 p-3 rounded-lg mb-2">
                <CreditCard className="h-6 w-6 mx-auto text-green-600" />
              </div>
              <p className="text-xs font-medium text-gray-900">Tarjeta de Débito</p>
              <p className="text-xs text-gray-500">Pago inmediato</p>
            </div>
            <div className="text-center p-3 border rounded-lg hover:bg-gray-50 transition-colors">
              <div className="bg-purple-100 p-3 rounded-lg mb-2">
                <DollarSign className="h-6 w-6 mx-auto text-purple-600" />
              </div>
              <p className="text-xs font-medium text-gray-900">MercadoPago</p>
              <p className="text-xs text-gray-500">Dinero en cuenta</p>
            </div>
            <div className="text-center p-3 border rounded-lg hover:bg-gray-50 transition-colors">
              <div className="bg-orange-100 p-3 rounded-lg mb-2">
                <span className="text-sm font-bold text-orange-600">TB</span>
              </div>
              <p className="text-xs font-medium text-gray-900">Transferencia</p>
              <p className="text-xs text-gray-500">Pago Fácil, Rapipago</p>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">i</span>
              </div>
              <p className="text-sm text-blue-800">
                <strong>Todos los métodos habilitados:</strong> Podrás elegir tu método preferido en la siguiente pantalla de MercadoPago.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Botón de pago */}
      <div className="space-y-4">
        {!preferenceId ? (
          <Button
            onClick={handleDirectPayment}
            disabled={loading}
            className="w-full h-12 text-lg"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Procesando...
              </>
            ) : (
              <>
                <CreditCard className="h-5 w-5 mr-2" />
                Pagar ${total.toLocaleString('es-AR')}
              </>
            )}
          </Button>
        ) : (
          <div className="mercadopago-button"></div>
        )}

        {/* Información adicional */}
        <div className="text-center text-sm text-gray-600">
          <p>Al hacer clic en &quot;Pagar&quot;, serás redirigido a MercadoPago para completar tu compra de forma segura.</p>
        </div>
      </div>

      {/* Términos y condiciones */}
      <div className="text-xs text-gray-500 text-center">
        <p>
          Al proceder con el pago, aceptas nuestros{' '}
          <a href="/terms" className="text-blue-600 hover:underline">
            términos y condiciones
          </a>{' '}
          y{' '}
          <a href="/privacy" className="text-blue-600 hover:underline">
            política de privacidad
          </a>
          .
        </p>
      </div>
    </div>
  )
}

// Declaración de tipos para MercadoPago
declare global {
  interface Window {
    MercadoPago: any
  }
}
