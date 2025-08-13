'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { CreditCard, MapPin, Package, ArrowLeft, Lock, Calendar, Building } from 'lucide-react'

import Navbar from '@/components/layout/navbar'
import Footer from '@/components/layout/footer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { useCartStore } from '@/store/cart-store'
import { useToast } from '@/hooks/use-toast'
// Tipo completo para el formulario de checkout
import dynamic from 'next/dynamic'
type CheckoutFormData = {
  shippingAddress: {
    name: string
    street: string
    city: string
    state: string
    zipCode: string
    country: string
    phone: string
  }
  billingAddress?: {
    name: string
    street: string
    city: string
    state: string
    zipCode: string
    country: string
    phone: string
    taxId?: string
  }
  items?: any[]
  subtotal?: number
  total?: number
  discount?: number
  tax?: number
  shipping?: number
  paymentMethod?: string
  shippingMethod?: string
  pickupDate?: string
  notes?: string
}
import { formatPrice } from '@/lib/utils'
import { ClientLoader } from '@/components/ui/loaders'

const PROVINCES = [
  'Salta', 'Buenos Aires', 'Córdoba', 'Santa Fe', 'Mendoza', 'Tucumán',
  'Entre Ríos', 'Corrientes', 'Misiones', 'Chaco', 'Santiago del Estero',
  'San Juan', 'Jujuy', 'Río Negro', 'Formosa', 'Neuquén', 'Chubut',
  'San Luis', 'Catamarca', 'La Rioja', 'La Pampa', 'Santa Cruz',
  'Tierra del Fuego'
]

// Función para calcular fecha mínima de retiro (72 horas hábiles)
const calculateMinPickupDate = () => {
  const now = new Date()
  let businessDays = 0
  let currentDate = new Date(now)
  
  while (businessDays < 3) { // 3 días hábiles = 72 horas hábiles
    currentDate.setDate(currentDate.getDate() + 1)
    const dayOfWeek = currentDate.getDay()
    
    // 0 = Domingo, 6 = Sábado
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      businessDays++
    }
  }
  
  return currentDate.toISOString().split('T')[0]
}

export default function CheckoutPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isProcessing, setIsProcessing] = useState(false)
  const [useBillingAsShipping, setUseBillingAsShipping] = useState(true)
  const [isPageLoading, setIsPageLoading] = useState(true)
  const [shippingMethod, setShippingMethod] = useState<'home_delivery' | 'pickup'>('home_delivery')
  const [pickupDate, setPickupDate] = useState('')
  const [supplierInfo, setSupplierInfo] = useState<any>(null)
  // Se eliminó el render embebido del formulario de pago. Usaremos una página dedicada.
  
  const { items, subtotal, discount, total, clearCart } = useCartStore()
  const { toast } = useToast()

  const form = useForm<CheckoutFormData>({
    // SIN VALIDACIÓN ZOD - Solo formulario básico
    defaultValues: {
      shippingAddress: {
        name: '',
        street: '',
        city: '',
        state: 'Salta',
        zipCode: '',
        country: 'Argentina',
        phone: '',
      },
    },
  })

  // Obtener información del proveedor (memoizado por items)
  const fetchSupplierInfo = useCallback(async () => {
    if (items.length > 0) {
      try {
        // Obtener el primer proveedor (asumiendo que todos los productos son del mismo proveedor)
        const firstItem = items[0]
        if (firstItem.supplierName) {
          // Buscar información del proveedor
          const response = await fetch(`/api/users?role=supplier&search=${encodeURIComponent(firstItem.supplierName)}`)
          if (response.ok) {
            const data = await response.json()
            if (data.users && data.users.length > 0) {
              setSupplierInfo(data.users[0])
            }
          }
        }
      } catch (error) {
        console.error('Error fetching supplier info:', error)
      }
    }
  }, [items])

  // UX: reaccionar al cambio de método de envío
  useEffect(() => {
    if (shippingMethod === 'pickup') {
      // Autoseleccionar fecha mínima de retiro y obtener info del local
      if (!pickupDate) {
        setPickupDate(calculateMinPickupDate())
      }
      // Cargar información del proveedor para mostrar dirección/horarios
      // No bloqueante; errores sólo se loguean dentro de fetchSupplierInfo
      ;(async () => {
        try { await fetchSupplierInfo() } catch {}
      })()
    } else if (shippingMethod === 'home_delivery') {
      // Limpiar fecha de retiro si se vuelve a envío a domicilio
      if (pickupDate) setPickupDate('')
    }
  }, [shippingMethod, pickupDate, fetchSupplierInfo])

  // Sin manejador de errores - validación manual
  const validateForm = (data: CheckoutFormData) => {
    const { shippingAddress } = data
    
    if (!shippingAddress.name.trim()) {
      toast({ title: 'Error', description: 'El nombre es requerido', variant: 'destructive' })
      return false
    }
    if (!shippingAddress.phone.trim()) {
      toast({ title: 'Error', description: 'El teléfono es requerido', variant: 'destructive' })
      return false
    }
    
    // Validar dirección solo si es envío a domicilio
    if (shippingMethod === 'home_delivery') {
      if (!shippingAddress.street.trim()) {
        toast({ title: 'Error', description: 'La dirección es requerida', variant: 'destructive' })
        return false
      }
      if (!shippingAddress.city.trim()) {
        toast({ title: 'Error', description: 'La ciudad es requerida', variant: 'destructive' })
        return false
      }
      if (!shippingAddress.state.trim()) {
        toast({ title: 'Error', description: 'La provincia es requerida', variant: 'destructive' })
        return false
      }
      if (!shippingAddress.zipCode.trim()) {
        toast({ title: 'Error', description: 'El código postal es requerido', variant: 'destructive' })
        return false
      }
    }

    // Validar fecha de retiro si es pickup
    if (shippingMethod === 'pickup' && !pickupDate) {
      toast({ title: 'Error', description: 'Debe seleccionar una fecha de retiro', variant: 'destructive' })
      return false
    }
    
    return true
  }

  // Obtener información del proveedor
  useEffect(() => {
    fetchSupplierInfo()
  }, [items, pickupDate, fetchSupplierInfo])

  // Redirect if not authenticated or cart is empty
  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      redirect('/auth/login?callbackUrl=/checkout')
    }
    if (items.length === 0) {
      redirect('/cart')
    }
    
    // Simular tiempo de carga
    const timer = setTimeout(() => {
      setIsPageLoading(false)
    }, 1200)

    return () => clearTimeout(timer)
  }, [session, status, items])

  // Update form when cart changes
  useEffect(() => {
    form.setValue('items', items.map(item => ({
      product: item.id,
      quantity: item.quantity,
      price: item.price,
    })))
    
    // Update totals
    form.setValue('subtotal', subtotal || 0)
    form.setValue('total', total || 0)
    form.setValue('discount', discount || 0)
    form.setValue('tax', 0)
    form.setValue('shipping', 0)
    form.setValue('paymentMethod', 'mercadopago')
    form.setValue('shippingMethod', shippingMethod)
  }, [items, subtotal, total, discount, form, shippingMethod])

  const onSubmit = async (values: CheckoutFormData) => {
    console.log('🚀 CHECKOUT - Starting order process')
    console.log('Values:', values)
    
    // Validación manual antes de proceder
    if (!validateForm(values)) {
      setIsProcessing(false)
      return
    }
    
    setIsProcessing(true)
    
    try {
      // Calcular totales correctamente
      const calculatedSubtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
      const calculatedTotal = calculatedSubtotal - (discount || 0)
      
      console.log('📊 CALCULATING TOTALS:')
      console.log('Items:', items)
      console.log('Calculated Subtotal:', calculatedSubtotal)
      console.log('Store Subtotal:', subtotal)
      console.log('Store Total:', total)
      console.log('Discount:', discount)
      console.log('Final Total:', calculatedTotal)
      
      // Preparar datos de la orden
      const orderPayload = {
        items: items.map(item => ({
          product: item.id,
          quantity: item.quantity,
          price: item.price,
        })),
        shippingAddress: values.shippingAddress,
        subtotal: calculatedSubtotal,
        total: calculatedTotal,
        discount: discount || 0,
        tax: 0,
        shipping: 0,
        paymentMethod: 'mercadopago',
        shippingMethod: shippingMethod,
        pickupDate: shippingMethod === 'pickup' ? pickupDate : undefined,
        notes: '',
      }
      
      console.log('Order data to send:', orderPayload)
      
      // Crear orden usando endpoint sin autenticación
      console.log('🔍 SENDING ORDER TO BACKEND:')
      console.log('URL:', '/api/orders')
      console.log('Method:', 'POST')
      console.log('Payload:', JSON.stringify(orderPayload, null, 2))
      
      const orderResponse = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderPayload),
      })

      console.log('🔍 BACKEND RESPONSE:')
      console.log('Status:', orderResponse.status)
      console.log('Status Text:', orderResponse.statusText)
      console.log('Headers:', Object.fromEntries(orderResponse.headers.entries()))
      
      const orderResult = await orderResponse.json()
      console.log('🔍 BACKEND RESPONSE BODY:', orderResult)

      if (!orderResponse.ok) {
        console.error('❌ ORDER CREATION FAILED:')
        console.error('Status:', orderResponse.status)
        console.error('Error:', orderResult.error)
        console.error('Full response:', orderResult)
        
        throw new Error(orderResult.error || `Error al crear la orden (${orderResponse.status})`)
      }

      // Redirigir a página dedicada de pago
      const newOrderId = (orderResult?.data?.order?._id || orderResult?.order?._id || orderResult?.id) as string
      toast({ title: 'Orden creada', description: 'Redirigiendo al pago...' })
      router.push(`/checkout/pay/${newOrderId}`)

    } catch (error) {
      console.error('❌ CHECKOUT ERROR:', error)
      toast({
        title: 'Error al procesar la orden',
        description: error instanceof Error ? error.message : 'Ocurrió un error inesperado',
        variant: 'destructive',
      })
    } finally {
      setIsProcessing(false)
    }
  }

  if (status === 'loading' || isPageLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <ClientLoader />
        <Footer />
      </div>
    )
  }

  if (!session || items.length === 0) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-playfair font-bold text-foreground mb-2">
              Finalizar Compra
            </h1>
            <p className="text-muted-foreground">
              Completa tu información para procesar el pedido
            </p>
          </div>
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Checkout Form */}
              <div className="lg:col-span-2 space-y-6">
                {/* Shipping Method Selection */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Package className="h-5 w-5 mr-2" />
                      Método de Envío
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <input
                          type="radio"
                          id="home_delivery"
                          name="shippingMethod"
                          value="home_delivery"
                          checked={shippingMethod === 'home_delivery'}
                          onChange={(e) => setShippingMethod(e.target.value as 'home_delivery')}
                          className="text-blue-600"
                        />
                        <label htmlFor="home_delivery" className="flex-1 cursor-pointer">
                          <div className="font-medium">Envío a Domicilio</div>
                          <div className="text-sm text-gray-600">Recibe tu pedido en la puerta de tu casa</div>
                        </label>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <input
                          type="radio"
                          id="pickup"
                          name="shippingMethod"
                          value="pickup"
                          checked={shippingMethod === 'pickup'}
                          onChange={(e) => setShippingMethod(e.target.value as 'pickup')}
                          className="text-blue-600"
                        />
                        <label htmlFor="pickup" className="flex-1 cursor-pointer">
                          <div className="font-medium">Retiro en Local</div>
                          <div className="text-sm text-gray-600">Retira tu pedido en nuestro local</div>
                        </label>
                      </div>
                    </div>
                    
                    {/* Pickup Date Selection */}
                    {shippingMethod === 'pickup' && (
                      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className="h-4 w-4 text-blue-600" />
                          <span className="font-medium text-blue-900">Seleccionar Fecha de Retiro</span>
                        </div>
                        <p className="text-sm text-blue-700 mb-3">
                          El retiro estará disponible después de 72 horas hábiles desde la confirmación del pago.
                        </p>
                        <Input
                          type="date"
                          value={pickupDate}
                          onChange={(e) => setPickupDate(e.target.value)}
                          min={calculateMinPickupDate()}
                          className="w-full"
                        />
                        <p className="text-xs text-blue-600 mt-1">
                          Fecha mínima: {new Date(calculateMinPickupDate()).toLocaleDateString('es-AR')}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Shipping Address */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <MapPin className="h-5 w-5 mr-2" />
                      {shippingMethod === 'pickup' ? 'Información de Contacto' : 'Dirección de Envío'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="shippingAddress.name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nombre completo</FormLabel>
                            <FormControl>
                              <Input placeholder="Juan Pérez" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="shippingAddress.phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Teléfono</FormLabel>
                            <FormControl>
                              <Input placeholder="+54 387 123-4567" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {shippingMethod === 'home_delivery' && (
                      <>
                        <FormField
                          control={form.control}
                          name="shippingAddress.street"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Dirección</FormLabel>
                              <FormControl>
                                <Input placeholder="Calle, número, piso, departamento" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <FormField
                            control={form.control}
                            name="shippingAddress.city"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Ciudad</FormLabel>
                                <FormControl>
                                  <Input placeholder="Salta" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="shippingAddress.state"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Provincia</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Selecciona provincia" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {PROVINCES.map((province) => (
                                      <SelectItem key={province} value={province}>
                                        {province}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="shippingAddress.zipCode"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Código Postal</FormLabel>
                                <FormControl>
                                  <Input placeholder="4400" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </>
                    )}

                    {shippingMethod === 'pickup' && (
                      <p className="text-xs text-muted-foreground">
                        Para retiro en local no es necesario ingresar dirección. Solo necesitamos tu nombre y teléfono.
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Billing Address */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <CreditCard className="h-5 w-5 mr-2" />
                      Información de Facturación
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-2 mb-4">
                      <Checkbox
                        id="same-address"
                        checked={useBillingAsShipping}
                        onCheckedChange={(checked) => setUseBillingAsShipping(checked === true)}
                      />
                      <label htmlFor="same-address" className="text-sm font-medium">
                        Usar la misma información de contacto
                      </label>
                    </div>

                    {!useBillingAsShipping && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="billingAddress.name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Nombre completo</FormLabel>
                                <FormControl>
                                  <Input placeholder="Juan Pérez" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <div>
                            <FormLabel>CUIT/CUIL (opcional)</FormLabel>
                            <Input placeholder="20-12345678-9" />
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Order Notes */}
                <Card>
                  <CardHeader>
                    <CardTitle>Notas del Pedido (Opcional)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div>
                      <textarea
                        placeholder="Instrucciones especiales para la entrega..."
                        className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                        rows={3}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Order Summary */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Package className="h-5 w-5 mr-2" />
                      Resumen del Pedido
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Order Items */}
                    <div className="space-y-3">
                      {items.map((item) => (
                        <div key={item.id} className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-muted rounded flex items-center justify-center text-xs">
                            {item.quantity}x
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-sm line-clamp-2">{item.name}</p>
                            <p className="text-xs text-muted-foreground">{item.supplierName}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{formatPrice(item.price * item.quantity)}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <hr />

                    {/* Totals */}
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span>{formatPrice(subtotal)}</span>
                      </div>
                      
                      {discount > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>Descuento</span>
                          <span>-{formatPrice(discount)}</span>
                        </div>
                      )}
                      
                      <div className="flex justify-between">
                        <span>Envío</span>
                        <span className="text-green-600">Gratis</span>
                      </div>
                      
                      <hr />
                      
                      <div className="flex justify-between text-lg font-semibold">
                        <span>Total</span>
                        <span className="text-primary">{formatPrice(total)}</span>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={
                        isProcessing || (shippingMethod === 'pickup' && !pickupDate)
                      }
                      className="w-full"
                      size="lg"
                    >
                      <Lock className="h-4 w-4 mr-2" />
                      {isProcessing ? 'Procesando...' : 'Proceder al Pago'}
                    </Button>

                    <div className="text-center text-xs text-muted-foreground">
                      <p>Pago seguro con Mercado Pago</p>
                      <p>Tus datos están protegidos con encriptación SSL</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Supplier Information for Pickup */}
                {shippingMethod === 'pickup' && supplierInfo && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Building className="h-5 w-5 mr-2" />
                        Información del Local
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <h4 className="font-medium">{supplierInfo.name}</h4>
                          <p className="text-sm text-gray-600">{supplierInfo.address || 'Dirección no disponible'}</p>
                        </div>
                        <div className="text-sm">
                          <p><strong>Horarios:</strong> Lunes a Viernes 9:00 - 18:00</p>
                          <p><strong>Teléfono:</strong> {supplierInfo.phone || 'No disponible'}</p>
                        </div>
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <p className="text-sm text-blue-800">
                            <strong>Importante:</strong> Presenta tu DNI y el comprobante de pago al retirar tu pedido.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Security Features */}
                <Card>
                  <CardContent className="p-4">
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">✓</span>
                        </div>
                        <span>Pago 100% seguro</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">✓</span>
                        </div>
                        <span>Envío gratis en Salta</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">✓</span>
                        </div>
                        <span>Garantía de satisfacción</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </form>
        </Form>
      </main>
      
      {/* El formulario/contenedor de pago ahora está en /checkout/pay/[id] */}

      <Footer />
    </div>
  )
}
