'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { User, MapPin, Phone, Mail, Calendar, Shield, Lock, Bell, Settings, Eye, EyeOff } from 'lucide-react'

interface UserProfile {
  name: string
  email: string
  phone?: string
  address?: {
    street: string
    city: string
    state: string
    zipCode: string
    country: string
  }
  preferences?: {
    emailNotifications: boolean
    smsNotifications: boolean
    marketingEmails: boolean
  }
}

export default function ClientProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  
  // Password change state
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [showPasswords, setShowPasswords] = useState({
    old: false,
    new: false,
    confirm: false
  })
  const [changingPassword, setChangingPassword] = useState(false)
  
  // Preferences state
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    smsNotifications: false,
    marketingEmails: false
  })
  const [savingPreferences, setSavingPreferences] = useState(false)

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/users/profile')
      const data = await response.json()

      if (response.ok) {
        setProfile(data.user)
        // Set preferences if available
        if (data.user.preferences) {
          setPreferences({
            emailNotifications: data.user.preferences.emailNotifications ?? true,
            smsNotifications: data.user.preferences.smsNotifications ?? false,
            marketingEmails: data.user.preferences.marketingEmails ?? false
          })
        }
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Error al cargar el perfil',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al cargar el perfil',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      router.push('/auth/login')
      return
    }

    if (session.user.role !== 'client') {
      router.push('/')
      return
    }

    fetchProfile()
  }, [session, status, router, fetchProfile])

  const handleSave = async (formData: FormData) => {
    try {
      setSaving(true)
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.get('name'),
          phone: formData.get('phone'),
          address: {
            street: formData.get('street'),
            city: formData.get('city'),
            state: formData.get('state'),
            zipCode: formData.get('zipCode'),
            country: formData.get('country')
          }
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: 'Éxito',
          description: 'Perfil actualizado correctamente',
        })
        setIsEditing(false)
        fetchProfile()
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Error al actualizar el perfil',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al actualizar el perfil',
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: 'Error',
        description: 'Las contraseñas nuevas no coinciden',
        variant: 'destructive'
      })
      return
    }

    if (passwordData.newPassword.length < 6) {
      toast({
        title: 'Error',
        description: 'La nueva contraseña debe tener al menos 6 caracteres',
        variant: 'destructive'
      })
      return
    }

    try {
      setChangingPassword(true)
      const response = await fetch('/api/users/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          oldPassword: passwordData.oldPassword,
          newPassword: passwordData.newPassword
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: 'Éxito',
          description: 'Contraseña actualizada correctamente',
        })
        setPasswordData({
          oldPassword: '',
          newPassword: '',
          confirmPassword: ''
        })
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Error al cambiar la contraseña',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al cambiar la contraseña',
        variant: 'destructive'
      })
    } finally {
      setChangingPassword(false)
    }
  }

  const handleSavePreferences = async () => {
    try {
      setSavingPreferences(true)
      const response = await fetch('/api/users/preferences', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(preferences)
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: 'Éxito',
          description: 'Preferencias actualizadas correctamente',
        })
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Error al actualizar las preferencias',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al actualizar las preferencias',
        variant: 'destructive'
      })
    } finally {
      setSavingPreferences(false)
    }
  }

  if (status === 'loading' || loading) {
    return <div className="flex justify-center items-center min-h-screen">Cargando...</div>
  }

  if (!session || session.user.role !== 'client') {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Mi Perfil</h1>
        <p className="text-gray-600">Gestiona tu información personal, seguridad y preferencias</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Perfil
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            Seguridad
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Preferencias
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Info */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Información Personal</CardTitle>
                      <CardDescription>Actualiza tu información de contacto</CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(!isEditing)}
                    >
                      {isEditing ? 'Cancelar' : 'Editar'}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {isEditing ? (
                    <form action={handleSave} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="name">Nombre completo</Label>
                          <Input
                            id="name"
                            name="name"
                            defaultValue={profile?.name}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="phone">Teléfono</Label>
                          <Input
                            id="phone"
                            name="phone"
                            defaultValue={profile?.phone}
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="street">Dirección</Label>
                        <Input
                          id="street"
                          name="street"
                          defaultValue={profile?.address?.street}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="city">Ciudad</Label>
                          <Input
                            id="city"
                            name="city"
                            defaultValue={profile?.address?.city}
                          />
                        </div>
                        <div>
                          <Label htmlFor="state">Provincia</Label>
                          <Input
                            id="state"
                            name="state"
                            defaultValue={profile?.address?.state}
                          />
                        </div>
                        <div>
                          <Label htmlFor="zipCode">Código Postal</Label>
                          <Input
                            id="zipCode"
                            name="zipCode"
                            defaultValue={profile?.address?.zipCode}
                          />
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button type="submit" disabled={saving}>
                          {saving ? 'Guardando...' : 'Guardar Cambios'}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsEditing(false)}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <User className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="font-medium">{profile?.name}</p>
                          <p className="text-sm text-gray-500">Nombre completo</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="font-medium">{profile?.email}</p>
                          <p className="text-sm text-gray-500">Correo electrónico</p>
                        </div>
                      </div>

                      {profile?.phone && (
                        <div className="flex items-center gap-3">
                          <Phone className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="font-medium">{profile.phone}</p>
                            <p className="text-sm text-gray-500">Teléfono</p>
                          </div>
                        </div>
                      )}

                      {profile?.address && (
                        <div className="flex items-center gap-3">
                          <MapPin className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="font-medium">
                              {profile.address.street}, {profile.address.city}, {profile.address.state}
                            </p>
                            <p className="text-sm text-gray-500">Dirección de envío</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Account Info */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Información de la Cuenta</CardTitle>
                  <CardDescription>Detalles de tu cuenta</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-medium capitalize">{session.user.role}</p>
                      <p className="text-sm text-gray-500">Tipo de cuenta</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-medium">
                        {new Date().getFullYear()}
                      </p>
                      <p className="text-sm text-gray-500">Miembro desde</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <Badge variant="secondary" className="w-full justify-center">
                      Cuenta Verificada
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Acciones Rápidas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => router.push('/orders')}
                  >
                    Ver mis pedidos
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => router.push('/account/notifications')}
                  >
                    Mis notificaciones
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    Historial de compras
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Cambiar Contraseña
              </CardTitle>
              <CardDescription>
                Actualiza tu contraseña para mantener tu cuenta segura
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <Label htmlFor="oldPassword">Contraseña actual</Label>
                  <div className="relative">
                    <Input
                      id="oldPassword"
                      type={showPasswords.old ? "text" : "password"}
                      value={passwordData.oldPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, oldPassword: e.target.value }))}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPasswords(prev => ({ ...prev, old: !prev.old }))}
                    >
                      {showPasswords.old ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="newPassword">Nueva contraseña</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showPasswords.new ? "text" : "password"}
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                      required
                      minLength={6}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                    >
                      {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="confirmPassword">Confirmar nueva contraseña</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showPasswords.confirm ? "text" : "password"}
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      required
                      minLength={6}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                    >
                      {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <Button type="submit" disabled={changingPassword}>
                  {changingPassword ? 'Cambiando...' : 'Cambiar Contraseña'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Preferencias de Notificaciones
              </CardTitle>
              <CardDescription>
                Configura cómo quieres recibir las notificaciones
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Notificaciones por Email</Label>
                  <p className="text-sm text-gray-500">
                    Recibe notificaciones sobre pedidos y actualizaciones por correo electrónico
                  </p>
                </div>
                <Switch
                  checked={preferences.emailNotifications}
                  onCheckedChange={(checked) => 
                    setPreferences(prev => ({ ...prev, emailNotifications: checked }))
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Notificaciones por SMS</Label>
                  <p className="text-sm text-gray-500">
                    Recibe notificaciones importantes por mensaje de texto
                  </p>
                </div>
                <Switch
                  checked={preferences.smsNotifications}
                  onCheckedChange={(checked) => 
                    setPreferences(prev => ({ ...prev, smsNotifications: checked }))
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Emails de Marketing</Label>
                  <p className="text-sm text-gray-500">
                    Recibe ofertas especiales y promociones por correo electrónico
                  </p>
                </div>
                <Switch
                  checked={preferences.marketingEmails}
                  onCheckedChange={(checked) => 
                    setPreferences(prev => ({ ...prev, marketingEmails: checked }))
                  }
                />
              </div>

              <div className="pt-4">
                <Button onClick={handleSavePreferences} disabled={savingPreferences}>
                  {savingPreferences ? 'Guardando...' : 'Guardar Preferencias'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 