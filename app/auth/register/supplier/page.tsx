'use client'

import { useState, FormEvent, ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, ArrowLeft, Building2, User, Mail, Lock, MapPin, Phone, Globe, FileText, Clock } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

// Types
interface Address {
  street: string
  city: string
  state: string
  zipCode: string
  country: string
}

interface OpeningHours {
  open: string
  close: string
  closed: boolean
}

interface SocialMedia {
  facebook: string
  instagram: string
  twitter: string
}

interface FormData {
  // Personal Information
  name: string
  email: string
  password: string
  confirmPassword: string
  
  // Business Information
  businessName: string
  businessType: string
  taxId: string
  phone: string
  website: string
  description: string
  
  // Address
  address: Address
  
  // Opening Hours
  openingHours: Record<string, OpeningHours>
  
  // Social Media
  socialMedia: SocialMedia
}

// Days of the week for opening hours
const DAYS_OF_WEEK = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const

type DayOfWeek = typeof DAYS_OF_WEEK[number]

export default function SupplierRegisterPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  
  const [formData, setFormData] = useState<FormData>({
    // Personal Information
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    
    // Business Information
    businessName: '',
    businessType: 'restaurant',
    taxId: '',
    phone: '',
    website: '',
    description: '',
    
    // Address
    address: {
      street: '',
      city: '',
      state: 'Salta',
      zipCode: '',
      country: 'Argentina'
    },
    
    // Opening Hours
    openingHours: {
      monday: { open: '09:00', close: '18:00', closed: false },
      tuesday: { open: '09:00', close: '18:00', closed: false },
      wednesday: { open: '09:00', close: '18:00', closed: false },
      thursday: { open: '09:00', close: '18:00', closed: false },
      friday: { open: '09:00', close: '18:00', closed: false },
      saturday: { open: '10:00', close: '14:00', closed: false },
      sunday: { open: '', close: '', closed: true }
    },
    
    // Social Media
    socialMedia: {
      facebook: '',
      instagram: '',
      twitter: ''
    }
  })

  const handleInputChange = (
    field: string, 
    value: string | boolean | { [key: string]: any },
    parentField?: keyof FormData
  ) => {
    setFormData(prev => {
      if (parentField) {
        // Handle nested updates for objects like address, socialMedia, etc.
        return {
          ...prev,
          [parentField]: {
            ...(prev[parentField] as object),
            [field]: value
          }
        } as FormData
      }
      return {
        ...prev,
        [field]: value
      }
    })
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    // Basic validation
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Error",
        description: "Las contraseñas no coinciden",
        variant: "destructive"
      })
      return
    }

    if (formData.password.length < 6) {
      toast({
        title: "Error",
        description: "La contraseña debe tener al menos 6 caracteres",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: 'supplier',
          businessInfo: {
            businessName: formData.businessName,
            businessType: formData.businessType,
            taxId: formData.taxId,
            address: formData.address,
            phone: formData.phone,
            website: formData.website,
            description: formData.description,
            openingHours: formData.openingHours,
            socialMedia: formData.socialMedia
          }
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al registrar el proveedor')
      }

      toast({
        title: "¡Registro exitoso!",
        description: "Tu cuenta ha sido creada correctamente",
      })

      // Redirect to login or dashboard
      router.push('/auth/login')
    } catch (error) {
      console.error('Registration error:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al registrar el proveedor",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Registro de Proveedor
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Completa el siguiente formulario para registrarte como proveedor
          </p>
        </div>

        <Alert className="mb-6">
          <Building2 className="h-4 w-4" />
          <AlertDescription>
            Los campos marcados con * son obligatorios
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Información Personal
              </CardTitle>
              <CardDescription>
                Información personal del representante legal del negocio
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nombre Completo *</Label>
                  <Input
                    id="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Juan Pérez"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Correo Electrónico *</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="correo@ejemplo.com"
                  />
                </div>
                <div>
                  <Label htmlFor="password">Contraseña *</Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <Label htmlFor="confirmPassword">Confirmar Contraseña *</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    required
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Business Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building2 className="h-5 w-5 mr-2" />
                Información del Negocio
              </CardTitle>
              <CardDescription>
                Detalles sobre tu negocio o emprendimiento
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="businessName">Nombre del Negocio *</Label>
                  <Input
                    id="businessName"
                    type="text"
                    required
                    value={formData.businessName}
                    onChange={(e) => handleInputChange('businessName', e.target.value)}
                    placeholder="Mi Negocio S.A."
                  />
                </div>
                <div>
                  <Label htmlFor="businessType">Tipo de Negocio *</Label>
                  <Select
                    value={formData.businessType}
                    onValueChange={(value) => handleInputChange('businessType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un tipo de negocio" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="restaurant">Restaurante</SelectItem>
                      <SelectItem value="retail">Tienda Minorista</SelectItem>
                      <SelectItem value="service">Servicio</SelectItem>
                      <SelectItem value="other">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="taxId">CUIT/CUIL *</Label>
                  <Input
                    id="taxId"
                    type="text"
                    required
                    value={formData.taxId}
                    onChange={(e) => handleInputChange('taxId', e.target.value)}
                    placeholder="XX-XXXXXXXX-X"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Teléfono *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="+54 9 XXX XXX XXXX"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="website">Sitio Web</Label>
                  <Input
                    id="website"
                    type="url"
                    value={formData.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    placeholder="https://www.minegocio.com"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="description">Descripción del Negocio *</Label>
                  <Textarea
                    id="description"
                    required
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Describe brevemente tu negocio y los servicios que ofreces..."
                    rows={3}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Address Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="h-5 w-5 mr-2" />
                Dirección del Negocio
              </CardTitle>
              <CardDescription>
                Dirección física de tu negocio
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="street">Calle *</Label>
                  <Input
                    id="street"
                    type="text"
                    required
                    value={formData.address.street}
                    onChange={(e) => handleInputChange('street', e.target.value, 'address')}
                    placeholder="Av. Siempre Viva 123"
                  />
                </div>
                <div>
                  <Label htmlFor="city">Ciudad *</Label>
                  <Input
                    id="city"
                    type="text"
                    required
                    value={formData.address.city}
                    onChange={(e) => handleInputChange('city', e.target.value, 'address')}
                    placeholder="Salta"
                  />
                </div>
                <div>
                  <Label htmlFor="state">Provincia *</Label>
                  <Input
                    id="state"
                    type="text"
                    required
                    value={formData.address.state}
                    onChange={(e) => handleInputChange('state', e.target.value, 'address')}
                    placeholder="Salta"
                  />
                </div>
                <div>
                  <Label htmlFor="zipCode">Código Postal *</Label>
                  <Input
                    id="zipCode"
                    type="text"
                    required
                    value={formData.address.zipCode}
                    onChange={(e) => handleInputChange('zipCode', e.target.value, 'address')}
                    placeholder="4400"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Social Media */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Globe className="h-5 w-5 mr-2" />
                Redes Sociales
              </CardTitle>
              <CardDescription>
                Enlaces a tus perfiles de redes sociales (opcional)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="facebook">Facebook</Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">fb.com/</span>
                    </div>
                    <Input
                      id="facebook"
                      type="text"
                      value={formData.socialMedia.facebook}
                      onChange={(e) => handleInputChange('facebook', e.target.value, 'socialMedia')}
                      className="pl-20"
                      placeholder="tunegocio"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="instagram">Instagram</Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">@</span>
                    </div>
                    <Input
                      id="instagram"
                      type="text"
                      value={formData.socialMedia.instagram}
                      onChange={(e) => handleInputChange('instagram', e.target.value, 'socialMedia')}
                      className="pl-6"
                      placeholder="tunegocio"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="twitter">Twitter</Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">@</span>
                    </div>
                    <Input
                      id="twitter"
                      type="text"
                      value={formData.socialMedia.twitter}
                      onChange={(e) => handleInputChange('twitter', e.target.value, 'socialMedia')}
                      className="pl-6"
                      placeholder="tunegocio"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isLoading}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Registrando...
                </>
              ) : (
                'Registrarse como Proveedor'
              )}
            </Button>
          </div>
        </form>

        <div className="text-center text-sm text-gray-600">
          ¿Ya tienes una cuenta?{' '}
          <Link href="/auth/login" className="font-medium text-primary hover:text-primary/80">
            Inicia sesión aquí
          </Link>
        </div>
      </div>
    </div>
  )
}
