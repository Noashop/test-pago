'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, Mail, Lock, User, Phone, Building2, FileText, Globe, Share2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { ImageUpload } from '@/components/ui/image-upload'
import { useToast } from '@/hooks/use-toast'
import { registerSchema, supplierRegisterSchema, type RegisterSchema, type SupplierRegisterSchema } from '@/schemas'
import { USER_ROLES } from '@/constants'

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState(1)
  const [userData, setUserData] = useState<RegisterSchema | null>(null)
  const [businessLogo, setBusinessLogo] = useState<string>('')
  const [profileImage, setProfileImage] = useState<string>('')
  const router = useRouter()
  const { toast } = useToast()

  const form = useForm<RegisterSchema>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      phone: '',
      role: USER_ROLES.CLIENT,
    },
  })

  const supplierForm = useForm<SupplierRegisterSchema>({
    resolver: zodResolver(supplierRegisterSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      phone: '',
      role: USER_ROLES.SUPPLIER,
      businessInfo: {
        businessName: '',
        businessType: '',
        taxId: '',
        description: '',
        website: '',
        socialMedia: {
          facebook: '',
          instagram: '',
          twitter: '',
        },
      },
    },
  })

  const handleFirstStep = async (values: RegisterSchema) => {
    if (values.role === USER_ROLES.SUPPLIER) {
      setUserData(values)
      setStep(2)
      // Actualizar el formulario de proveedor con los datos del primer paso
      supplierForm.reset({
        ...values,
        businessInfo: {
          businessName: '',
          businessType: '',
          taxId: '',
          description: '',
          website: '',
          logo: '',
          socialMedia: {
            facebook: '',
            instagram: '',
            twitter: '',
          },
        },
      })
    } else {
      // Para clientes, proceder directamente con el registro
      await handleSubmit(values)
    }
  }

  const handleSubmit = async (values: RegisterSchema | SupplierRegisterSchema) => {
    setIsLoading(true)
    try {
      // Agregar imagen de perfil si existe
      if (profileImage) {
        values.profileImage = profileImage
      }

      // Si es un proveedor, agregar el logo al businessInfo
      if ('businessInfo' in values && businessLogo) {
        values.businessInfo.logo = businessLogo
      }

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al registrar usuario')
      }

      if ('businessInfo' in values) {
        // Proveedor registrado exitosamente
        toast({
          title: '¡Registro exitoso!',
          description: 'Gracias por elegir nuestra plataforma. Tu solicitud está siendo analizada.',
        })
        
        // Mostrar mensaje adicional después de un breve delay
        setTimeout(() => {
          toast({
            title: 'Proceso de aprobación',
            description: 'Pronto podrás empezar a vender con nosotros e impulsar tus ventas.',
          })
        }, 2000)
      } else {
        // Cliente registrado exitosamente
        toast({
          title: 'Registro exitoso',
          description: 'Tu cuenta ha sido creada correctamente. Ahora puedes iniciar sesión.',
        })
      }

      router.push('/auth/login')
    } catch (error) {
      toast({
        title: 'Error en el registro',
        description: error instanceof Error ? error.message : 'Ocurrió un error inesperado',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleBackToStep1 = () => {
    setStep(1)
    setUserData(null)
  }

  const BUSINESS_TYPES = [
    'Comercio minorista',
    'Comercio mayorista',
    'Fabricante',
    'Distribuidor',
    'Importador',
    'Exportador',
    'Servicios',
    'Otro'
  ]

  if (step === 2) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10 px-4 py-8">
        <Card className="w-full max-w-2xl">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-4">
              <div className="h-12 w-12 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-white font-bold text-lg">SC</span>
              </div>
            </div>
            <CardTitle className="text-2xl font-playfair text-center">
              Información del Negocio
            </CardTitle>
            <CardDescription className="text-center">
              Completa la información de tu negocio para continuar
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <Form {...supplierForm}>
              <form onSubmit={supplierForm.handleSubmit(handleSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={supplierForm.control}
                    name="businessInfo.businessName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre del negocio</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="Mi Negocio S.A."
                              className="pl-10"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={supplierForm.control}
                    name="businessInfo.businessType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de negocio</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona el tipo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {BUSINESS_TYPES.map((type) => (
                              <SelectItem key={type} value={type}>
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={supplierForm.control}
                    name="businessInfo.taxId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CUIT/CUIL</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="20-12345678-9"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={supplierForm.control}
                    name="businessInfo.website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sitio web (opcional)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="https://www.minegocio.com"
                              className="pl-10"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={supplierForm.control}
                  name="businessInfo.description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descripción del negocio (opcional)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Textarea
                            placeholder="Describe tu negocio, productos o servicios..."
                            className="pl-10"
                            rows={3}
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-4">
                  <div className="mb-6">
                    <label className="block text-sm font-medium mb-2">Logo de la empresa (opcional)</label>
                    <label className="block text-sm font-semibold mb-2">Logo de tu negocio</label>
                    <ImageUpload
                      value={businessLogo ? [businessLogo] : []}
                      onChange={(urls) => setBusinessLogo(urls[0] || '')}
                      maxImages={1}
                      uploadUrl="/api/upload/register"
                      formFieldName="files"
                      extraFields={{ type: 'business-logo', folder: 'salta-conecta/business-logos' }}
                    />
                    <p className="text-xs text-muted-foreground mt-2">Formato recomendado 1:1 (cuadrado). PNG o JPG, hasta 2MB.</p>
                  </div>

                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <Share2 className="h-4 w-4" />
                    Redes sociales (opcional)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={supplierForm.control}
                      name="businessInfo.socialMedia.facebook"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Facebook</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="facebook.com/minegocio"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={supplierForm.control}
                      name="businessInfo.socialMedia.instagram"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Instagram</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="@minegocio"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={supplierForm.control}
                      name="businessInfo.socialMedia.twitter"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Twitter</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="@minegocio"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBackToStep1}
                    className="flex-1"
                  >
                    Volver
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Completando registro...' : 'Completar Registro'}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10 px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="h-12 w-12 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-white font-bold text-lg">SC</span>
            </div>
          </div>
          <CardTitle className="text-2xl font-playfair text-center">
            Crear Cuenta
          </CardTitle>
          <CardDescription className="text-center">
            Únete a la comunidad de Salta Conecta
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFirstStep)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre completo</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Juan Pérez"
                          className="pl-10"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="tu@email.com"
                          className="pl-10"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono (opcional)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="+54 387 123-4567"
                          className="pl-10"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel className="text-base font-semibold">¿Qué tipo de cuenta deseas crear?</FormLabel>
                    <FormControl>
                      <div className="grid grid-cols-1 gap-3">
                        <div 
                          className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                            field.value === USER_ROLES.CLIENT 
                              ? 'border-primary bg-primary/5 ring-2 ring-primary/20' 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => field.onChange(USER_ROLES.CLIENT)}
                        >
                          <div className="flex items-center space-x-3">
                            <div className={`w-4 h-4 rounded-full border-2 ${
                              field.value === USER_ROLES.CLIENT 
                                ? 'border-primary bg-primary' 
                                : 'border-gray-300'
                            }`}>
                              {field.value === USER_ROLES.CLIENT && (
                                <div className="w-full h-full rounded-full bg-white scale-50"></div>
                              )}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">Cliente</div>
                              <div className="text-sm text-gray-500">Quiero comprar productos al por mayor</div>
                            </div>
                          </div>
                        </div>
                        
                        <div 
                          className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                            field.value === USER_ROLES.SUPPLIER 
                              ? 'border-primary bg-primary/5 ring-2 ring-primary/20' 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => field.onChange(USER_ROLES.SUPPLIER)}
                        >
                          <div className="flex items-center space-x-3">
                            <div className={`w-4 h-4 rounded-full border-2 ${
                              field.value === USER_ROLES.SUPPLIER 
                                ? 'border-primary bg-primary' 
                                : 'border-gray-300'
                            }`}>
                              {field.value === USER_ROLES.SUPPLIER && (
                                <div className="w-full h-full rounded-full bg-white scale-50"></div>
                              )}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">Proveedor</div>
                              <div className="text-sm text-gray-500">Quiero vender mis productos</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contraseña</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          className="pl-10 pr-10"
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmar contraseña</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          className="pl-10 pr-10"
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="mb-4">
                <label className="block text-sm font-semibold mb-2">Foto de perfil (opcional)</label>
                <ImageUpload
                  value={profileImage ? [profileImage] : []}
                  onChange={(urls) => setProfileImage(urls[0] || '')}
                  maxImages={1}
                  uploadUrl="/api/upload/register"
                  formFieldName="files"
                  extraFields={{ type: 'profile', folder: 'salta-conecta/profiles' }}
                />
                <p className="text-xs text-muted-foreground mt-2">Usa una imagen nítida de rostro. PNG o JPG, hasta 2MB.</p>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? 'Procesando...' : form.watch('role') === USER_ROLES.SUPPLIER ? 'Continuar' : 'Crear Cuenta'}
              </Button>
            </form>
          </Form>
        </CardContent>

        <CardFooter>
          <p className="text-center text-sm text-muted-foreground w-full">
            ¿Ya tienes una cuenta?{' '}
            <Link href="/auth/login" className="text-primary hover:underline">
              Inicia sesión
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
