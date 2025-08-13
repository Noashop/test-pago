'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Shield, 
  Bell, 
  Eye, 
  EyeOff,
  Save,
  Upload,
  Trash2,
  Wallet as WalletIcon,
  CreditCard
} from 'lucide-react'

import Navbar from '@/components/layout/navbar'
import Footer from '@/components/layout/footer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { updateProfileSchema, type UpdateProfileSchema } from '@/schemas'
import { Badge } from '@/components/ui/badge'
import { ClientLoader } from '@/components/ui/loaders'

const PROVINCES = [
  'Salta', 'Buenos Aires', 'Córdoba', 'Santa Fe', 'Mendoza', 'Tucumán',
  'Entre Ríos', 'Corrientes', 'Misiones', 'Chaco', 'Santiago del Estero',
  'San Juan', 'Jujuy', 'Río Negro', 'Formosa', 'Neuquén', 'Chubut',
  'San Luis', 'Catamarca', 'La Rioja', 'La Pampa', 'Santa Cruz',
  'Tierra del Fuego'
]

interface UserProfile {
  name: string
  email: string
  phone?: string
  avatar?: string
  address?: {
    street: string
    city: string
    state: string
    zipCode: string
    country: string
  }
  businessInfo?: {
    businessName: string
    taxId: string
    businessType: string
  }
}

interface AddressItem {
  _id?: string
  street: string
  city: string
  state: string
  zipCode: string
  country: string
  phone?: string
  type?: 'shipping' | 'billing'
  isDefault?: boolean
}

interface WalletItem {
  _id?: string
  provider: 'mercadopago' | 'bank'
  alias?: string
  cbu?: string
  cvu?: string
  accountId?: string
  holderName?: string
  isPrimary?: boolean
}

export default function ProfilePage() {
  const { data: session, status, update } = useSession()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  // Addresses state (must be before any return)
  const [addresses, setAddresses] = useState<AddressItem[]>([])
  const [addingAddress, setAddingAddress] = useState(false)
  const [newAddress, setNewAddress] = useState<AddressItem>({
    street: '', city: '', state: 'Salta', zipCode: '', country: 'Argentina', type: 'shipping', isDefault: false,
  })
  // Wallets state (must be before any return)
  const [wallets, setWallets] = useState<WalletItem[]>([])
  const [addingWallet, setAddingWallet] = useState(false)
  const [newWallet, setNewWallet] = useState<WalletItem>({ provider: 'mercadopago', isPrimary: false, alias: '', accountId: '', holderName: '' })
  const { toast } = useToast()

  const form = useForm<UpdateProfileSchema>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      avatar: '',
      address: {
        street: '',
        city: '',
        state: 'Salta',
        zipCode: '',
        country: 'Argentina'
      }
    },
  })

  const fetchProfile = useCallback(async () => {
    try {
      const response = await fetch('/api/users/profile')
      const data = await response.json()

      if (response.ok) {
        setProfile(data.profile)
        
        // Update form with fetched data
        form.reset({
          name: data.profile.name || '',
          email: data.profile.email || '',
          phone: data.profile.phone || '',
          avatar: data.profile.avatar || '',
          address: {
            street: data.profile.address?.street || '',
            city: data.profile.address?.city || '',
            state: data.profile.address?.state || 'Salta',
            zipCode: data.profile.address?.zipCode || '',
            country: data.profile.address?.country || 'Argentina'
          }
        })
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo cargar el perfil',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [form, toast])

  const fetchAddresses = useCallback(async () => {
    try {
      const res = await fetch('/api/users/addresses')
      const data = await res.json()
      if (res.ok) setAddresses(data.addresses || [])
    } catch {}
  }, [])

  const fetchWallets = useCallback(async () => {
    try {
      const res = await fetch('/api/users/wallet')
      const data = await res.json()
      if (res.ok) setWallets(data.wallets || [])
    } catch {}
  }, [])

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      redirect('/auth/login?callbackUrl=/profile')
    }
    fetchProfile()
    fetchAddresses()
    fetchWallets()
  }, [session, status, fetchProfile, fetchAddresses, fetchWallets])

  const onSubmit = async (values: UpdateProfileSchema) => {
    setSaving(true)
    try {
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: 'Perfil actualizado',
          description: 'Tu información ha sido guardada exitosamente',
        })
        
        // Update session if name changed
        if (values.name !== session?.user?.name) {
          await update({ name: values.name })
        }
        
        fetchProfile()
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al actualizar el perfil',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const createAddress = async () => {
    try {
      const res = await fetch('/api/users/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAddress),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al crear dirección')
      toast({ title: 'Dirección agregada' })
      setNewAddress({ street: '', city: '', state: 'Salta', zipCode: '', country: 'Argentina', type: 'shipping', isDefault: false })
      setAddingAddress(false)
      fetchAddresses()
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'No se pudo crear', variant: 'destructive' })
    }
  }

  const deleteAddress = async (id?: string) => {
    if (!id) return
    try {
      const res = await fetch(`/api/users/addresses?id=${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const d = await res.json(); throw new Error(d.error || 'Error al eliminar')
      }
      toast({ title: 'Dirección eliminada' })
      fetchAddresses()
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'No se pudo eliminar', variant: 'destructive' })
    }
  }

  const setDefaultAddress = async (id?: string) => {
    if (!id) return
    try {
      const res = await fetch(`/api/users/addresses?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDefault: true }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al marcar predeterminada')
      toast({ title: 'Dirección marcada como predeterminada' })
      fetchAddresses()
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'No se pudo actualizar', variant: 'destructive' })
    }
  }

  // Wallets

  

  const createWallet = async () => {
    try {
      const res = await fetch('/api/users/wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newWallet),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al crear billetera')
      toast({ title: 'Billetera agregada' })
      setNewWallet({ provider: 'mercadopago', isPrimary: false, alias: '', accountId: '', holderName: '' })
      setAddingWallet(false)
      fetchWallets()
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'No se pudo crear', variant: 'destructive' })
    }
  }

  const deleteWallet = async (id?: string) => {
    if (!id) return
    try {
      const res = await fetch(`/api/users/wallet?id=${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const d = await res.json(); throw new Error(d.error || 'Error al eliminar')
      }
      toast({ title: 'Billetera eliminada' })
      fetchWallets()
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'No se pudo eliminar', variant: 'destructive' })
    }
  }

  const setPrimaryWallet = async (id?: string) => {
    if (!id) return
    try {
      const res = await fetch(`/api/users/wallet?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPrimary: true }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al marcar principal')
      toast({ title: 'Billetera marcada como principal' })
      fetchWallets()
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'No se pudo actualizar', variant: 'destructive' })
    }
  }

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: 'Error',
        description: 'Las contraseñas no coinciden',
        variant: 'destructive',
      })
      return
    }

    if (passwordData.newPassword.length < 6) {
      toast({
        title: 'Error',
        description: 'La contraseña debe tener al menos 6 caracteres',
        variant: 'destructive',
      })
      return
    }

    try {
      const response = await fetch('/api/users/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: 'Contraseña actualizada',
          description: 'Tu contraseña ha sido cambiada exitosamente',
        })
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
        setShowPasswordForm(false)
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al cambiar la contraseña',
        variant: 'destructive',
      })
    }
  }

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append('avatar', file)

    try {
      const response = await fetch('/api/user/avatar', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: 'Avatar actualizado',
          description: 'Tu foto de perfil ha sido actualizada',
        })
        fetchProfile()
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al subir la imagen',
        variant: 'destructive',
      })
    }
  }

  // Loading guard AFTER hooks to keep hooks order consistent
  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <ClientLoader />
        <Footer />
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/4" />
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="h-64 bg-muted rounded" />
              <div className="lg:col-span-3 h-96 bg-muted rounded" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (!session || !profile) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-playfair font-bold text-foreground mb-2">
            Mi Perfil
          </h1>
          <p className="text-muted-foreground">
            Gestiona tu información personal y preferencias
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Profile Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="relative inline-block mb-4">
                  <Avatar className="w-24 h-24">
                    <AvatarImage src={profile.avatar} />
                    <AvatarFallback className="text-2xl">
                      {profile.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <label className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-2 cursor-pointer hover:bg-primary/90 transition-colors">
                    <Upload className="h-4 w-4" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                
                <h3 className="font-semibold text-lg">{profile.name}</h3>
                <p className="text-sm text-muted-foreground mb-2">{profile.email}</p>
                <p className="text-xs text-muted-foreground capitalize">
                  {session.user.role} • Miembro desde {new Date().getFullYear()}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Información Rápida</CardTitle>
              </CardHeader>
              <CardContent className="p-6 pt-0 space-y-3">
                <div className="flex items-center text-sm">
                  <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="truncate">{profile.email}</span>
                </div>
                {profile.phone && (
                  <div className="flex items-center text-sm">
                    <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>{profile.phone}</span>
                  </div>
                )}
                {profile.address && (
                  <div className="flex items-center text-sm">
                    <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="truncate">
                      {profile.address.city}, {profile.address.state}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <Tabs defaultValue="personal" className="space-y-6">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="personal">Información Personal</TabsTrigger>
                <TabsTrigger value="addresses">Direcciones</TabsTrigger>
                <TabsTrigger value="wallets">Billeteras</TabsTrigger>
                <TabsTrigger value="security">Seguridad</TabsTrigger>
                <TabsTrigger value="preferences">Preferencias</TabsTrigger>
              </TabsList>

              {/* Personal Information */}
              <TabsContent value="personal">
                <Card>
                  <CardHeader>
                    <CardTitle>Información Personal</CardTitle>
                    <CardDescription>
                      Actualiza tu información de contacto y dirección
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="name"
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
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                  <Input placeholder="juan.perez@example.com" {...field} />
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
                                <FormLabel>Teléfono</FormLabel>
                                <FormControl>
                                  <Input placeholder="+54 387 123-4567" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <Separator />

                        <div>
                          <h4 className="text-sm font-medium mb-4">Dirección</h4>
                          <div className="space-y-4">
                            <FormField
                              control={form.control}
                              name="address.street"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Calle y número</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Av. San Martín 123" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <FormField
                                control={form.control}
                                name="address.city"
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
                                name="address.state"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Provincia</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
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
                                name="address.zipCode"
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
                          </div>
                        </div>

                        <div className="flex justify-end">
                          <Button type="submit" disabled={saving}>
                            <Save className="h-4 w-4 mr-2" />
                            {saving ? 'Guardando...' : 'Guardar Cambios'}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Addresses */}
              <TabsContent value="addresses">
                <Card>
                  <CardHeader>
                    <CardTitle>Direcciones</CardTitle>
                    <CardDescription>Gestiona tus direcciones de envío y facturación</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-muted-foreground">
                        Puedes marcar una dirección como predeterminada.
                      </div>
                      <Button onClick={() => setAddingAddress(true)}>Agregar dirección</Button>
                    </div>

                    {addingAddress && (
                      <div className="space-y-4 p-4 border rounded-md">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Input placeholder="Calle y número" value={newAddress.street} onChange={e => setNewAddress({ ...newAddress, street: e.target.value })} />
                          <Input placeholder="Ciudad" value={newAddress.city} onChange={e => setNewAddress({ ...newAddress, city: e.target.value })} />
                          <Select value={newAddress.state} onValueChange={(v) => setNewAddress({ ...newAddress, state: v })}>
                            <SelectTrigger>
                              <SelectValue placeholder="Provincia" />
                            </SelectTrigger>
                            <SelectContent>
                              {PROVINCES.map((p) => (<SelectItem key={p} value={p}>{p}</SelectItem>))}
                            </SelectContent>
                          </Select>
                          <Input placeholder="Código Postal" value={newAddress.zipCode} onChange={e => setNewAddress({ ...newAddress, zipCode: e.target.value })} />
                          <Input placeholder="País" value={newAddress.country} onChange={e => setNewAddress({ ...newAddress, country: e.target.value })} />
                          <Input placeholder="Teléfono (opcional)" value={newAddress.phone || ''} onChange={e => setNewAddress({ ...newAddress, phone: e.target.value })} />
                          <Select value={newAddress.type} onValueChange={(v) => setNewAddress({ ...newAddress, type: v as AddressItem['type'] })}>
                            <SelectTrigger>
                              <SelectValue placeholder="Tipo" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="shipping">Envío</SelectItem>
                              <SelectItem value="billing">Facturación</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="addr-default" checked={!!newAddress.isDefault} onCheckedChange={(c) => setNewAddress({ ...newAddress, isDefault: !!c })} />
                          <label htmlFor="addr-default" className="text-sm">Marcar como predeterminada</label>
                        </div>
                        <div className="flex gap-2 justify-end">
                          <Button variant="outline" onClick={() => { setAddingAddress(false); }}>Cancelar</Button>
                          <Button onClick={createAddress}>Guardar</Button>
                        </div>
                      </div>
                    )}

                    <div className="grid gap-4">
                      {addresses.length === 0 && (
                        <p className="text-sm text-muted-foreground">No tienes direcciones cargadas.</p>
                      )}
                      {addresses.map((addr) => (
                        <div key={addr._id} className="flex items-center justify-between p-4 border rounded-md">
                          <div className="text-sm">
                            <p className="font-medium">{addr.street}</p>
                            <p className="text-muted-foreground">{addr.city}, {addr.state} ({addr.zipCode}) - {addr.country}</p>
                            <div className="mt-1 flex items-center gap-2">
                              <Badge variant="secondary">{addr.type === 'billing' ? 'Facturación' : 'Envío'}</Badge>
                              {addr.isDefault && <Badge>Predeterminada</Badge>}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {!addr.isDefault && (
                              <Button variant="outline" onClick={() => setDefaultAddress(addr._id)}>Predeterminar</Button>
                            )}
                            <Button variant="destructive" onClick={() => deleteAddress(addr._id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Wallets */}
              <TabsContent value="wallets">
                <Card>
                  <CardHeader>
                    <CardTitle>Billeteras</CardTitle>
                    <CardDescription>Datos para cobros (Mercado Pago o Banco)</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-muted-foreground">Marca una billetera como principal para usarla por defecto.</div>
                      <Button onClick={() => setAddingWallet(true)}>Agregar billetera</Button>
                    </div>

                    {addingWallet && (
                      <div className="space-y-4 p-4 border rounded-md">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Select value={newWallet.provider} onValueChange={(v) => setNewWallet({ ...newWallet, provider: v as WalletItem['provider'] })}>
                            <SelectTrigger>
                              <SelectValue placeholder="Proveedor" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="mercadopago">Mercado Pago</SelectItem>
                              <SelectItem value="bank">Banco</SelectItem>
                            </SelectContent>
                          </Select>
                          <Input placeholder="Titular" value={newWallet.holderName || ''} onChange={e => setNewWallet({ ...newWallet, holderName: e.target.value })} />
                          {newWallet.provider === 'mercadopago' ? (
                            <>
                              <Input placeholder="Alias (opcional)" value={newWallet.alias || ''} onChange={e => setNewWallet({ ...newWallet, alias: e.target.value })} />
                              <Input placeholder="Cuenta (user_id)" value={newWallet.accountId || ''} onChange={e => setNewWallet({ ...newWallet, accountId: e.target.value })} />
                              <Input placeholder="CVU (opcional)" value={newWallet.cvu || ''} onChange={e => setNewWallet({ ...newWallet, cvu: e.target.value })} />
                            </>
                          ) : (
                            <>
                              <Input placeholder="Alias (opcional)" value={newWallet.alias || ''} onChange={e => setNewWallet({ ...newWallet, alias: e.target.value })} />
                              <Input placeholder="CBU" value={newWallet.cbu || ''} onChange={e => setNewWallet({ ...newWallet, cbu: e.target.value })} />
                            </>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="wallet-primary" checked={!!newWallet.isPrimary} onCheckedChange={(c) => setNewWallet({ ...newWallet, isPrimary: !!c })} />
                          <label htmlFor="wallet-primary" className="text-sm">Marcar como principal</label>
                        </div>
                        <div className="flex gap-2 justify-end">
                          <Button variant="outline" onClick={() => { setAddingWallet(false) }}>Cancelar</Button>
                          <Button onClick={createWallet}>Guardar</Button>
                        </div>
                      </div>
                    )}

                    <div className="grid gap-4">
                      {wallets.length === 0 && (
                        <p className="text-sm text-muted-foreground">No tienes billeteras cargadas.</p>
                      )}
                      {wallets.map((w) => (
                        <div key={w._id} className="flex items-center justify-between p-4 border rounded-md">
                          <div className="text-sm">
                            <p className="font-medium flex items-center gap-2">
                              {w.provider === 'mercadopago' ? <WalletIcon className="h-4 w-4" /> : <CreditCard className="h-4 w-4" />} 
                              {w.provider === 'mercadopago' ? 'Mercado Pago' : 'Banco'}
                            </p>
                            <p className="text-muted-foreground">
                              {w.holderName || 'Titular no especificado'}
                            </p>
                            <div className="mt-1 flex items-center gap-2">
                              {w.isPrimary && <Badge>Principal</Badge>}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {!w.isPrimary && (
                              <Button variant="outline" onClick={() => setPrimaryWallet(w._id)}>Principal</Button>
                            )}
                            <Button variant="destructive" onClick={() => deleteWallet(w._id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Security */}
              <TabsContent value="security">
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Cambiar Contraseña</CardTitle>
                      <CardDescription>
                        Actualiza tu contraseña para mantener tu cuenta segura
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {!showPasswordForm ? (
                        <Button onClick={() => setShowPasswordForm(true)}>
                          <Shield className="h-4 w-4 mr-2" />
                          Cambiar Contraseña
                        </Button>
                      ) : (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium mb-2">
                              Contraseña actual
                            </label>
                            <Input
                              type="password"
                              value={passwordData.currentPassword}
                              onChange={(e) => setPasswordData(prev => ({
                                ...prev,
                                currentPassword: e.target.value
                              }))}
                              placeholder="Ingresa tu contraseña actual"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium mb-2">
                              Nueva contraseña
                            </label>
                            <Input
                              type="password"
                              value={passwordData.newPassword}
                              onChange={(e) => setPasswordData(prev => ({
                                ...prev,
                                newPassword: e.target.value
                              }))}
                              placeholder="Ingresa tu nueva contraseña"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium mb-2">
                              Confirmar nueva contraseña
                            </label>
                            <Input
                              type="password"
                              value={passwordData.confirmPassword}
                              onChange={(e) => setPasswordData(prev => ({
                                ...prev,
                                confirmPassword: e.target.value
                              }))}
                              placeholder="Confirma tu nueva contraseña"
                            />
                          </div>

                          <div className="flex space-x-2">
                            <Button onClick={handlePasswordChange}>
                              Actualizar Contraseña
                            </Button>
                            <Button 
                              variant="outline" 
                              onClick={() => {
                                setShowPasswordForm(false)
                                setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
                              }}
                            >
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Sesiones Activas</CardTitle>
                      <CardDescription>
                        Gestiona los dispositivos donde has iniciado sesión
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">Dispositivo actual</p>
                            <p className="text-sm text-muted-foreground">
                              Última actividad: Ahora
                            </p>
                          </div>
                          <Badge>Activo</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Preferences */}
              <TabsContent value="preferences">
                <Card>
                  <CardHeader>
                    <CardTitle>Preferencias de Notificaciones</CardTitle>
                    <CardDescription>
                      Configura cómo y cuándo quieres recibir notificaciones
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">
                        Las preferencias de notificaciones estarán disponibles próximamente.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  )
}
