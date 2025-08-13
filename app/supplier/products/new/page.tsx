'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { ImageUpload } from '@/components/ui/image-upload'
import { useToast } from '@/hooks/use-toast'
import { ArrowLeft, Package, Save, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react'
import { productGeneralSchema, type ProductGeneralSchema } from '@/schemas'
import { DynamicFields } from '@/components/products/dynamic-fields'

interface Category {
  _id: string
  name: string
  slug: string
  icon: string
  subcategories: Subcategory[]
}

interface Subcategory {
  _id: string
  name: string
  slug: string
  requiredFields: ProductField[]
  optionalFields: ProductField[]
}

interface ProductField {
  name: string
  type: 'text' | 'number' | 'select' | 'boolean' | 'textarea'
  label: string
  required: boolean
  options?: string[]
  placeholder?: string
}

export default function NewProductPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [selectedSubcategory, setSelectedSubcategory] = useState<Subcategory | null>(null)
  const [productImages, setProductImages] = useState<string[]>([])
  const [specificFields, setSpecificFields] = useState<Record<string, any>>({})

  const form = useForm<ProductGeneralSchema>({
    resolver: zodResolver(productGeneralSchema),
    defaultValues: {
      name: '',
      description: '',
      shortDescription: '',
      category: '',
      subcategory: '',
      brand: '',
      sku: '',
      warranty: '',
      costPrice: 0,
      salePrice: 0,
      recommendedRetailPrice: 0,
      minimumPurchaseQuantity: 1,
      availableQuantity: 0,
      images: []
    }
  })

  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch('/api/categories')
      const data = await response.json()
      
      if (response.ok) {
        setCategories(data.categories)
      } else {
        throw new Error(data.error)
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'No se pudieron cargar las categorías', variant: 'destructive' })
    }
  }, [toast])

  // Cargar categorías al montar el componente
  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  // Verificar sesión y permisos
  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/auth/login')
      return
    }

    if (session.user.role !== 'supplier') {
      router.push('/')
      return
    }

    if (!session.user.isApproved) {
      toast({
        title: 'Cuenta no aprobada',
        description: 'Tu cuenta debe estar aprobada para crear productos',
        variant: 'destructive'
      })
      router.push('/supplier')
      return
    }
  }, [session, status, router, toast])

  const handleCategoryChange = (categorySlug: string) => {
    const category = categories.find(cat => cat.slug === categorySlug)
    setSelectedCategory(category || null)
    setSelectedSubcategory(null)
    clearSpecificFields()
    form.setValue('subcategory', '')
  }

  const handleSubcategoryChange = (subcategorySlug: string) => {
    if (!selectedCategory) return
    
    const subcategory = selectedCategory.subcategories.find(sub => sub.slug === subcategorySlug)
    setSelectedSubcategory(subcategory || null)
    clearSpecificFields()
  }

  const handleImageUpload = (urls: string[]) => {
    setProductImages(urls)
    form.setValue('images', urls)
  }

  const handleSpecificFieldChange = (fieldName: string, value: any) => {
    console.log(`🔄 Actualizando campo específico: ${fieldName} = ${value}`)
    setSpecificFields(prev => {
      const newFields = {
        ...prev,
        [fieldName]: value
      }
      console.log('📋 Campos específicos actualizados:', newFields)
      return newFields
    })
  }

  const validateSpecificFields = () => {
    if (!selectedSubcategory) return true

    const requiredFields = selectedSubcategory.requiredFields
    const missingFields = requiredFields.filter(field => {
      const value = specificFields[field.name]
      return field.required && (!value || value === '' || value === undefined)
    })

    if (missingFields.length > 0) {
      const fieldNames = missingFields.map(field => field.label).join(', ')
      console.log('Campos faltantes:', missingFields)
      console.log('Campos específicos actuales:', specificFields)
      toast({
        title: 'Campos requeridos faltantes',
        description: `Completa los siguientes campos: ${fieldNames}`,
        variant: 'destructive'
      })
      return false
    }

    return true
  }

  // Función para limpiar campos específicos cuando cambia la subcategoría
  const clearSpecificFields = () => {
    setSpecificFields({})
  }

  const onSubmit = async (values: ProductGeneralSchema) => {
    if (!session?.user || session.user.role !== 'supplier') {
      toast({
        title: 'Error',
        description: 'No tienes permisos para crear productos',
        variant: 'destructive'
      })
      return
    }

    // Validar imágenes
    if (productImages.length === 0) {
      toast({
        title: 'Error',
        description: 'Debes subir al menos una imagen del producto',
        variant: 'destructive'
      })
      return
    }

    // Validar campos específicos
    if (!validateSpecificFields()) {
      return
    }

    setIsLoading(true)

    try {
      // Combinar datos generales con campos específicos e imágenes
      const productData = {
        ...values,
        images: productImages,
        specificFields: specificFields
      }

      console.log('Enviando datos del producto:', productData)
      console.log('Campos específicos:', specificFields)

      const response = await fetch('/api/supplier/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: 'Producto creado exitosamente',
          description: 'El producto ha sido enviado para revisión',
        })
        router.push('/supplier/products')
      } else {
        throw new Error(data.error || 'Error al crear el producto')
      }
    } catch (error) {
      console.error('Error creating product:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al crear el producto',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleNextStep = async () => {
    const isValid = await form.trigger()
    if (isValid && productImages.length > 0) {
      setStep(2)
    } else if (productImages.length === 0) {
      toast({
        title: 'Error',
        description: 'Debes subir al menos una imagen del producto',
        variant: 'destructive'
      })
    }
  }

  const handlePrevStep = () => {
    setStep(1)
  }

  if (status === 'loading') {
    return <div className="flex items-center justify-center min-h-screen">Cargando...</div>
  }

  if (!session || session.user.role !== 'supplier') {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/supplier/products')}
              className="shadow-sm"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Nuevo Producto</h1>
              <p className="text-gray-600">
                {step === 1 ? 'Información General' : 'Campos Específicos'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${
              step >= 1 ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-200 text-gray-600'
            }`}>
              {step >= 1 ? <CheckCircle className="h-5 w-5" /> : '1'}
            </div>
            <div className="w-12 h-1 bg-gray-200 rounded-full">
              <div className={`h-full bg-blue-600 rounded-full transition-all duration-300 ${
                step >= 2 ? 'w-full' : 'w-0'
              }`}></div>
            </div>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${
              step >= 2 ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-200 text-gray-600'
            }`}>
              {step >= 2 ? <CheckCircle className="h-5 w-5" /> : '2'}
            </div>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {step === 1 ? (
              /* PASO 1: Información General */
              <div className="space-y-6">
                <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                  <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
                    <CardTitle className="flex items-center text-white">
                      <Package className="h-6 w-6 mr-3" />
                      Información General del Producto
                    </CardTitle>
                    <CardDescription className="text-blue-100">
                      Completa la información básica del producto
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-8 space-y-8">
                    {/* Imágenes del Producto */}
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Label className="text-lg font-semibold">Imágenes del Producto</Label>
                        <div className="flex items-center space-x-1 text-sm text-gray-600">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            productImages.length > 0 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {productImages.length}/5
                          </span>
                        </div>
                      </div>
                      <ImageUpload
                        value={productImages}
                        onChange={handleImageUpload}
                        maxImages={5}
                        disabled={isLoading}
                      />
                      {productImages.length === 0 && (
                        <div className="flex items-center space-x-2 text-amber-600 bg-amber-50 p-3 rounded-lg">
                          <AlertCircle className="h-4 w-4" />
                          <span className="text-sm">Debes subir al menos una imagen</span>
                        </div>
                      )}
                    </div>

                    {/* Nombre del Producto */}
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-semibold">Nombre del Producto *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Ej: iPhone 15 Pro Max" 
                              className="h-12 text-base"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Categoría y Subcategoría */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base font-semibold">Categoría *</FormLabel>
                            <Select onValueChange={(value) => {
                              field.onChange(value)
                              handleCategoryChange(value)
                            }}>
                              <FormControl>
                                <SelectTrigger className="h-12 text-base">
                                  <SelectValue placeholder="Selecciona una categoría" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {categories.map((category) => (
                                  <SelectItem key={category._id} value={category.slug}>
                                    <span className="mr-2">{category.icon}</span>
                                    {category.name}
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
                        name="subcategory"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base font-semibold">Subcategoría *</FormLabel>
                            <Select 
                              onValueChange={(value) => {
                                field.onChange(value)
                                handleSubcategoryChange(value)
                              }}
                              disabled={!selectedCategory}
                            >
                              <FormControl>
                                <SelectTrigger className="h-12 text-base">
                                  <SelectValue placeholder="Selecciona una subcategoría" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {selectedCategory?.subcategories.map((subcategory) => (
                                  <SelectItem key={subcategory._id} value={subcategory.slug}>
                                    {subcategory.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Descripción */}
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-semibold">Descripción del Producto *</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Describe las características principales del producto, beneficios, especificaciones técnicas..."
                              className="min-h-[120px] text-base resize-none"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Precios */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <FormField
                        control={form.control}
                        name="costPrice"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base font-semibold">Precio de Costo (ARS) *</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="0.00" 
                                className="h-12 text-base"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="salePrice"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base font-semibold">Precio de Venta Mayorista (ARS) *</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="0.00" 
                                className="h-12 text-base"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="recommendedRetailPrice"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base font-semibold">Precio de Reventa Sugerido (ARS) *</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="0.00" 
                                className="h-12 text-base"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Cantidades y Otros */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <FormField
                        control={form.control}
                        name="minimumPurchaseQuantity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base font-semibold">Cantidad Mínima *</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="1" 
                                className="h-12 text-base"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="availableQuantity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base font-semibold">Unidades Disponibles *</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="0" 
                                className="h-12 text-base"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="sku"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base font-semibold">SKU *</FormLabel>
                            <FormControl>
                              <Input placeholder="SKU-001" className="h-12 text-base" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="brand"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base font-semibold">Marca</FormLabel>
                            <FormControl>
                              <Input placeholder="Ej: Apple, Samsung" className="h-12 text-base" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Garantía */}
                    <FormField
                      control={form.control}
                      name="warranty"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-semibold">Garantía *</FormLabel>
                          <Select onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger className="h-12 text-base">
                                <SelectValue placeholder="Selecciona la garantía" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="6 meses">6 meses</SelectItem>
                              <SelectItem value="1 año">1 año</SelectItem>
                              <SelectItem value="2 años">2 años</SelectItem>
                              <SelectItem value="Sin garantía">Sin garantía</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Botón Continuar */}
                <div className="flex justify-end">
                  <Button 
                    type="button" 
                    onClick={handleNextStep}
                    disabled={isLoading}
                    className="flex items-center bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3 text-lg font-semibold shadow-lg"
                  >
                    Continuar
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </Button>
                </div>
              </div>
            ) : (
              /* PASO 2: Campos Específicos */
              <div className="space-y-6">
                <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                  <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-t-lg">
                    <CardTitle className="flex items-center text-white">
                      <Package className="h-6 w-6 mr-3" />
                      Campos Específicos - {selectedCategory?.name} / {selectedSubcategory?.name}
                    </CardTitle>
                    <CardDescription className="text-green-100">
                      Completa los campos específicos para esta categoría
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-8">
                    {selectedSubcategory ? (
                      <div className="space-y-8">
                        {/* Campos Requeridos */}
                        {selectedSubcategory.requiredFields.length > 0 && (
                          <DynamicFields
                            fields={selectedSubcategory.requiredFields}
                            values={specificFields}
                            onChange={handleSpecificFieldChange}
                            isOptional={false}
                          />
                        )}

                        {/* Campos Opcionales */}
                        {selectedSubcategory.optionalFields.length > 0 && (
                          <DynamicFields
                            fields={selectedSubcategory.optionalFields}
                            values={specificFields}
                            onChange={handleSpecificFieldChange}
                            isOptional={true}
                          />
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 text-lg">
                          Selecciona una categoría y subcategoría para ver los campos específicos
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Botones de Navegación */}
                <div className="flex justify-between">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={handlePrevStep}
                    disabled={isLoading}
                    className="px-8 py-3 text-lg font-semibold"
                  >
                    <ArrowLeft className="h-5 w-5 mr-2" />
                    Anterior
                  </Button>
                  <Button 
                    type="submit"
                    disabled={isLoading}
                    className="flex items-center bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 py-3 text-lg font-semibold shadow-lg"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Creando...
                      </>
                    ) : (
                      <>
                        <Save className="h-5 w-5 mr-2" />
                        Crear Producto
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </form>
        </Form>
      </div>
    </div>
  )
} 