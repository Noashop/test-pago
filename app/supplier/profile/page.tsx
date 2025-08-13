'use client'

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge, BadgeProps } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { 
  User,
  Building,
  Mail,
  Phone,
  MapPin,
  Globe,
  Facebook,
  Instagram,
  Twitter,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  Save,
  Edit,
  Bell,
  Shield,
  Settings
} from 'lucide-react'

// Define types for form fields
interface FormFieldProps {
  label: string;
  id: string;
  value: any;
  onChange: (value: any) => void;
  type?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  multiline?: boolean;
  className?: string;
}

// Define the supplier profile interface
interface SupplierProfile {
  _id: string
  name: string
  email: string
  phone: string
  address: {
    street: string
    city: string
    state: string
    zipCode: string
    country: string
  }
  businessInfo: {
    businessName: string
    taxId: string
    businessType: string
    description: string
    website: string
    socialMedia: {
      facebook: string
      instagram: string
      twitter: string
    }
  }
  isApproved: boolean
  status: string
  approvedAt?: string
  createdAt: string
  updatedAt: string
  preferences: {
    emailNotifications: boolean
    smsNotifications: boolean
    marketingEmails: boolean
    orderUpdates: boolean
    productUpdates: boolean
    language: string
  }
  stats: {
    totalProducts: number
    totalOrders: number
    totalRevenue: number
    averageRating: number
    joinedDays: number
  }
}

export default function SupplierProfilePage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  
  const [profile, setProfile] = useState<SupplierProfile | null>(null)
  const [formData, setFormData] = useState<Partial<SupplierProfile>>({})
  const [editMode, setEditMode] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [mpLink, setMpLink] = useState('')
  const [mpLoading, setMpLoading] = useState(false)
  const [mpUserId, setMpUserId] = useState<string | null>(null)
  const [mpExpiresAt, setMpExpiresAt] = useState<string | null>(null)
  const [mpConnected, setMpConnected] = useState(false)

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/supplier/profile', {
        credentials: 'include',
        cache: 'no-store',
      })
      const data = await response.json().catch(() => ({}))
      if (response.ok) {
        setProfile(data.profile)
        setFormData(data.profile)
        setFormDataState(data.profile)
      } else {
        throw new Error(data?.error || 'Error al cargar perfil')
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      toast({
        title: 'Error',
        description: (error as Error)?.message || 'No se pudo cargar el perfil',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    if (session?.user) {
      fetchProfile()
    }
  }, [session, fetchProfile])

  // Fetch estado de vinculación MP
  useEffect(() => {
    const fetchMp = async () => {
      try {
        setMpLoading(true)
        const res = await fetch('/api/supplier/mercadopago/status', {
          credentials: 'include',
          cache: 'no-store',
        })
        if (res.ok) {
          const data = await res.json()
          const hasMpUser = Boolean(data?.mpUserId)
          setMpUserId(hasMpUser ? data.mpUserId : null)
          setMpExpiresAt(data?.expiresAt || null)
          setMpConnected(hasMpUser)
        } else {
          setMpUserId(null)
          setMpConnected(false)
        }
      } catch {
        setMpUserId(null)
        setMpConnected(false)
      } finally {
        setMpLoading(false)
      }
    }
    if (session?.user) fetchMp()
  }, [session])

  // Aviso de retorno de vinculación (evita useSearchParams para no requerir Suspense)
  useEffect(() => {
    try {
      const sp = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
      const mp = sp?.get('mp')
      if (mp === 'connected') {
        toast({ title: 'Mercado Pago vinculado', description: 'Tu cuenta fue vinculada correctamente.' })
      }
    } catch {
      // noop
    }
  }, [toast])

  const handleMpConnect = () => {
    window.location.href = '/api/supplier/mercadopago/connect'
  }

  const handleSave = async () => {
    if (!formData) {
      toast({
        title: 'Error',
        description: 'No se encontraron datos para guardar',
        variant: 'destructive',
      });
      return;
    }
    
    setSaving(true);
    try {
      const response = await fetch('/api/supplier/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const updatedProfile = await response.json()
        setProfile(updatedProfile)
        setFormData(updatedProfile)
        setFormDataState(updatedProfile)
        setEditMode(false)
        toast({
          title: 'Perfil actualizado',
          description: 'Los cambios se han guardado correctamente.',
        })
      } else {
        throw new Error('Error al actualizar el perfil')
      }
    } catch (error) {
      console.error('Error al guardar el perfil:', error)
      toast({
        title: 'Error',
        description: 'No se pudo guardar el perfil. Inténtalo de nuevo más tarde.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setFormData(profile || {})
  }

  const updateFormData = (path: string, value: any) => {
    setFormData(prev => {
      const newData = { ...prev };
      const keys = path.split('.');
      let current: any = newData;
      
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = {};
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return newData;
    });
  };

  // Normaliza y aplica datos al estado del formulario, asegurando estructuras y defaults
  const setFormDataState = (data: Partial<SupplierProfile>) => {
    const defaults: Partial<SupplierProfile> = {
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: ''
      },
      businessInfo: {
        businessName: '',
        taxId: '',
        businessType: '',
        description: '',
        website: '',
        socialMedia: {
          facebook: '',
          instagram: '',
          twitter: ''
        }
      },
      preferences: {
        emailNotifications: false,
        smsNotifications: false,
        marketingEmails: false,
        orderUpdates: false,
        productUpdates: false,
        language: 'es'
      }
    }

    setFormData(prev => ({
      ...defaults,
      ...prev,
      ...data,
      address: {
        ...defaults.address,
        ...(prev?.address || {}),
        ...(data as any)?.address
      } as SupplierProfile['address'],
      businessInfo: {
        ...defaults.businessInfo,
        ...(prev?.businessInfo || {}),
        ...(data as any)?.businessInfo,
        socialMedia: {
          ...(defaults.businessInfo as any).socialMedia,
          ...((prev?.businessInfo as any)?.socialMedia || {}),
          ...(((data as any)?.businessInfo?.socialMedia) || {})
        }
      } as SupplierProfile['businessInfo'],
      preferences: {
        ...defaults.preferences,
        ...(prev?.preferences || {}),
        ...(data as any)?.preferences
      } as SupplierProfile['preferences']
    }))
  }

  const getStatusBadge = (status: string, isApproved: boolean) => {
    if (!isApproved) {
      return <Badge className="bg-yellow-100 text-yellow-800">Pendiente Aprobación</Badge>
    }
    
    const colors = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      suspended: 'bg-red-100 text-red-800'
    }
    return <Badge className={colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>{status}</Badge>
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Error al cargar perfil</h1>
          <p className="text-gray-600">No se pudo cargar la información del perfil.</p>
          <Button onClick={fetchProfile} className="mt-4">
            Reintentar
          </Button>
        </div>
      </div>
    )
  }

  // Function to render form fields in a reusable way
  const renderFormField = ({
    label,
    id,
    value = '',
    onChange,
    type = 'text',
    placeholder = '',
    disabled = false,
    required = false,
    multiline = false,
    className = ''
  }: FormFieldProps) => {
    return (
      <div className={`space-y-2 ${className}`}>
        <Label htmlFor={id} className="text-sm font-medium">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        {editMode ? (
          multiline ? (
            <Textarea
              id={id}
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              disabled={disabled}
              className="min-h-[100px]"
            />
          ) : (
            <Input
              id={id}
              type={type}
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              disabled={disabled}
            />
          )
        ) : (
          <div className="rounded-md border border-input bg-background px-3 py-2 text-sm">
            {value || <span className="text-muted-foreground">No especificado</span>}
          </div>
        )}
      </div>
    );
  };

  // Function to handle nested form field changes
  const handleNestedChange = (path: string, value: any) => {
    setFormData(prev => {
      const newData = { ...prev };
      const keys = path.split('.');
      let current: any = newData;
      
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = {};
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return newData;
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <User className="h-8 w-8" />
            {editMode ? 'Editar Perfil' : 'Mi Perfil'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {editMode 
              ? 'Actualiza tu información de contacto y del negocio' 
              : 'Gestiona tu información personal y preferencias'}
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          {!editMode ? (
            <Button onClick={() => setEditMode(true)} className="gap-2">
              <Edit className="h-4 w-4" />
              Editar Perfil
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={handleCancel}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={saving}
                className="bg-primary hover:bg-primary/90"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Guardar
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Account Status & Stats */}
        <div className="space-y-6">
          {/* Account Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Estado de la Cuenta
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Estado:</span>
                {getStatusBadge(profile.status, profile.isApproved)}
              </div>
              
              {profile.isApproved && profile.approvedAt && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Aprobado:</span>
                  <span className="text-sm text-gray-600">{formatDate(profile.approvedAt)}</span>
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Miembro desde:</span>
                <span className="text-sm text-gray-600">{formatDate(profile.createdAt)}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Días activo:</span>
                <span className="text-sm text-gray-600">{profile.stats.joinedDays} días</span>
              </div>
            </CardContent>
          </Card>

          {/* Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Estadísticas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Productos:</span>
                <span className="text-sm font-bold">{profile.stats.totalProducts}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Pedidos:</span>
                <span className="text-sm font-bold">{profile.stats.totalOrders}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Ingresos:</span>
                <span className="text-sm font-bold text-green-600">
                  {formatCurrency(profile.stats.totalRevenue)}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Rating:</span>
                <div className="flex items-center gap-1">
                  <span className="text-sm font-bold">{profile.stats.averageRating.toFixed(1)}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="city">Ciudad</Label>
                <Input
                  id="city"
                  value={formData.address?.city || ''}
                  onChange={(e) => updateFormData('address.city', e.target.value)}
                  disabled={!editMode}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="state">Provincia/Estado</Label>
                <Input
                  id="state"
                  value={formData.address?.state || ''}
                  onChange={(e) => updateFormData('address.state', e.target.value)}
                  disabled={!editMode}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="zipCode">Código Postal</Label>
                <Input
                  id="zipCode"
                  value={formData.address?.zipCode || ''}
                  onChange={(e) => updateFormData('address.zipCode', e.target.value)}
                  disabled={!editMode}
                />
              </div>
            </CardContent>
          </Card>

          {/* Business Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Información del Negocio
              </CardTitle>
              <CardDescription>
                Detalles de tu empresa o negocio
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="businessName">Nombre del Negocio</Label>
                  <Input
                    id="businessName"
                    value={formData.businessInfo?.businessName || ''}
                    onChange={(e) => updateFormData('businessInfo.businessName', e.target.value)}
                    disabled={!editMode}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="taxId">CUIT/CUIL</Label>
                  <Input
                    id="taxId"
                    value={formData.businessInfo?.taxId || ''}
                    onChange={(e) => updateFormData('businessInfo.taxId', e.target.value)}
                    disabled={!editMode}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="businessType">Tipo de Negocio</Label>
                  <Input
                    id="businessType"
                    value={formData.businessInfo?.businessType || ''}
                    onChange={(e) => updateFormData('businessInfo.businessType', e.target.value)}
                    disabled={!editMode}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="website">Sitio Web</Label>
                  <Input
                    id="website"
                    type="url"
                    value={formData.businessInfo?.website || ''}
                    onChange={(e) => updateFormData('businessInfo.website', e.target.value)}
                    disabled={!editMode}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Descripción del Negocio</Label>
                <Textarea
                  id="description"
                  rows={3}
                  value={formData.businessInfo?.description || ''}
                  onChange={(e) => updateFormData('businessInfo.description', e.target.value)}
                  disabled={!editMode}
                />
              </div>

              {/* Social Media */}
              <div className="space-y-4">
                <h4 className="font-medium">Redes Sociales</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="facebook" className="flex items-center gap-2">
                      <Facebook className="h-4 w-4" />
                      Facebook
                    </Label>
                    <Input
                      id="facebook"
                      value={formData.businessInfo?.socialMedia?.facebook || ''}
                      onChange={(e) => updateFormData('businessInfo.socialMedia.facebook', e.target.value)}
                      disabled={!editMode}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="instagram" className="flex items-center gap-2">
                      <Instagram className="h-4 w-4" />
                      Instagram
                    </Label>
                    <Input
                      id="instagram"
                      value={formData.businessInfo?.socialMedia?.instagram || ''}
                      onChange={(e) => updateFormData('businessInfo.socialMedia.instagram', e.target.value)}
                      disabled={!editMode}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="twitter" className="flex items-center gap-2">
                      <Twitter className="h-4 w-4" />
                      Twitter
                    </Label>
                    <Input
                      id="twitter"
                      value={formData.businessInfo?.socialMedia?.twitter || ''}
                      onChange={(e) => updateFormData('businessInfo.socialMedia.twitter', e.target.value)}
                      disabled={!editMode}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Mercado Pago - Vinculación */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Mercado Pago
              </CardTitle>
              <CardDescription>
                Vincula tu cuenta para recibir tus liquidaciones automáticamente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {mpLoading ? (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Loader2 className="h-4 w-4 animate-spin" /> Verificando estado de vinculación...
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {mpConnected ? (
                        <Badge variant="default" className="bg-green-600">Conectado</Badge>
                      ) : (
                        <Badge variant="secondary">No conectado</Badge>
                      )}
                      {mpConnected && mpUserId && (
                        <span className="text-sm text-gray-600">MP User ID: {mpUserId}</span>
                      )}
                    </div>
                    {mpConnected && mpExpiresAt && (
                      <p className="text-xs text-gray-500">Token expira: {new Date(mpExpiresAt).toLocaleString('es-AR')}</p>
                    )}
                  </div>
                  <div>
                    <Button onClick={handleMpConnect} variant={mpConnected ? 'secondary' : 'default'}>
                      {mpConnected ? 'Re-vincular' : 'Vincular Mercado Pago'}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Preferencias
              </CardTitle>
              <CardDescription>
                Configura tus notificaciones y preferencias
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Notificaciones
                </h4>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="emailNotifications">Notificaciones por Email</Label>
                      <p className="text-sm text-gray-600">Recibir notificaciones importantes por email</p>
                    </div>
                    <Switch
                      id="emailNotifications"
                      checked={formData.preferences?.emailNotifications || false}
                      onCheckedChange={(checked) => updateFormData('preferences.emailNotifications', checked)}
                      disabled={!editMode}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="orderUpdates">Actualizaciones de Pedidos</Label>
                      <p className="text-sm text-gray-600">Notificaciones sobre cambios en pedidos</p>
                    </div>
                    <Switch
                      id="orderUpdates"
                      checked={formData.preferences?.orderUpdates || false}
                      onCheckedChange={(checked) => updateFormData('preferences.orderUpdates', checked)}
                      disabled={!editMode}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="productUpdates">Actualizaciones de Productos</Label>
                      <p className="text-sm text-gray-600">Notificaciones sobre tus productos</p>
                    </div>
                    <Switch
                      id="productUpdates"
                      checked={formData.preferences?.productUpdates || false}
                      onCheckedChange={(checked) => updateFormData('preferences.productUpdates', checked)}
                      disabled={!editMode}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="marketingEmails">Emails de Marketing</Label>
                      <p className="text-sm text-gray-600">Recibir ofertas y promociones</p>
                    </div>
                    <Switch
                      id="marketingEmails"
                      checked={formData.preferences?.marketingEmails || false}
                      onCheckedChange={(checked) => updateFormData('preferences.marketingEmails', checked)}
                      disabled={!editMode}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
