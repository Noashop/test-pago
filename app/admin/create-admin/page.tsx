'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { User, Shield, ArrowLeft, UserPlus, Mail, Lock, Phone } from 'lucide-react'

interface CreateAdminForm {
  name: string
  email: string
  phone: string
  password: string
  confirmPassword: string
  adminType: string
}

export default function CreateAdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  
  const [formData, setFormData] = useState<CreateAdminForm>({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    adminType: 'admin'
  })
  const [loading, setLoading] = useState(false)

  // Verificar permisos
  if (status === 'loading') {
    return <div className="flex justify-center items-center min-h-screen">Cargando...</div>
  }

  if (!session || session.user.role !== 'admin') {
    router.push('/')
    return null
  }

  const handleInputChange = (field: keyof CreateAdminForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast({
        title: 'Error',
        description: 'El nombre es requerido',
        variant: 'destructive'
      })
      return false
    }

    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast({
        title: 'Error',
        description: 'Email válido es requerido',
        variant: 'destructive'
      })
      return false
    }

    if (formData.password.length < 6) {
      toast({
        title: 'Error',
        description: 'La contraseña debe tener al menos 6 caracteres',
        variant: 'destructive'
      })
      return false
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: 'Error',
        description: 'Las contraseñas no coinciden',
        variant: 'destructive'
      })
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    try {
      setLoading(true)
      const response = await fetch('/api/admin/users/create-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        cache: 'no-store',
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          role: formData.adminType
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: 'Éxito',
          description: 'Administrador creado exitosamente',
        })
        router.push('/admin/users')
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Error al crear el administrador',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al crear el administrador',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <UserPlus className="h-8 w-8" />
              Crear Nuevo Administrador
            </h1>
            <p className="text-gray-600 mt-2">
              Crea una nueva cuenta de administrador con permisos específicos
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Información del Administrador
            </CardTitle>
            <CardDescription>
              Completa los datos para crear una nueva cuenta de administrador
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Información Personal */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Información Personal</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Nombre Completo *</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        id="name"
                        type="text"
                        placeholder="Juan Pérez"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="phone">Teléfono</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+54 9 11 1234-5678"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="email">Correo Electrónico *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="admin@saltaconecta.com"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Configuración de Acceso */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Configuración de Acceso</h3>
                
                <div>
                  <Label htmlFor="adminType">Tipo de Administrador</Label>
                  <Select value={formData.adminType} onValueChange={(value) => handleInputChange('adminType', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo de admin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrador General</SelectItem>
                      <SelectItem value="admin-users">Admin de Usuarios</SelectItem>
                      <SelectItem value="admin-products">Admin de Productos</SelectItem>
                      <SelectItem value="admin-orders">Admin de Pedidos</SelectItem>
                      <SelectItem value="admin-supports">Admin de Soporte</SelectItem>
                      <SelectItem value="admin-promos">Admin de Promociones</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-gray-500 mt-1">
                    Define el nivel de acceso y permisos del nuevo administrador
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="password">Contraseña *</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="Mínimo 6 caracteres"
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        className="pl-10"
                        minLength={6}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="confirmPassword">Confirmar Contraseña *</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="Repetir contraseña"
                        value={formData.confirmPassword}
                        onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                        className="pl-10"
                        minLength={6}
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Información de Permisos */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Permisos del Tipo Seleccionado</h4>
                <div className="text-sm text-blue-700">
                  {formData.adminType === 'admin' && (
                    <p>• Acceso completo a todas las funciones del sistema</p>
                  )}
                  {formData.adminType === 'admin-users' && (
                    <p>• Gestión de usuarios, clientes y proveedores</p>
                  )}
                  {formData.adminType === 'admin-products' && (
                    <p>• Aprobación y gestión de productos</p>
                  )}
                  {formData.adminType === 'admin-orders' && (
                    <p>• Monitoreo y gestión de pedidos</p>
                  )}
                  {formData.adminType === 'admin-supports' && (
                    <p>• Gestión de tickets y soporte al cliente</p>
                  )}
                  {formData.adminType === 'admin-promos' && (
                    <p>• Gestión de promociones, cupones y campañas</p>
                  )}
                </div>
              </div>

              {/* Botones de Acción */}
              <div className="flex gap-4 pt-6">
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? 'Creando...' : 'Crear Administrador'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  className="flex-1"
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
