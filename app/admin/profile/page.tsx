'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import {
  User,
  Building,
  Mail,
  Phone,
  MapPin,
  Shield,
  Settings,
  Wallet,
  FileText,
  MessageSquare,
  Loader2,
  Save,
  Edit,
  CheckCircle
} from 'lucide-react'

interface AdminProfile {
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
    description: string
  }
  preferences: {
    emailNotifications: boolean
    marketingEmails: boolean
    language: string
  }
  wallet: {
    availableBalance: number
    pendingPayouts: number
    lastPayoutAt?: string
  }
  billing: {
    invoicesCount: number
    lastInvoiceAt?: string
  }
  createdAt: string
  updatedAt: string
}

export default function AdminProfilePage() {
  const { toast } = useToast()

  const [profile, setProfile] = useState<AdminProfile | null>(null)
  const [formData, setFormData] = useState<Partial<AdminProfile>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [payoutLoading, setPayoutLoading] = useState(false)

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/profile', {
        credentials: 'include',
        cache: 'no-store',
      })
      if (!res.ok) throw new Error('No se pudo cargar el perfil de administrador')
      const data = await res.json()
      setProfile(data.profile)
      setFormData(data.profile)
    } catch (err) {
      console.error(err)
      toast({ title: 'Error', description: 'Error al cargar el perfil', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  const updateFormData = (path: string, value: any) => {
    setFormData(prev => {
      const keys = path.split('.')
      const copy: any = { ...prev }
      let cur = copy
      for (let i = 0; i < keys.length - 1; i++) {
        cur[keys[i]] = cur[keys[i]] ?? {}
        cur = cur[keys[i]]
      }
      cur[keys[keys.length - 1]] = value
      return copy
    })
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const res = await fetch('/api/admin/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        cache: 'no-store',
        body: JSON.stringify(formData)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'No se pudo actualizar el perfil')
      setProfile(data.profile)
      setFormData(data.profile)
      setEditMode(false)
      toast({ title: 'Éxito', description: 'Perfil actualizado correctamente' })
    } catch (err: any) {
      toast({ title: 'Error', description: err?.message || 'Error al actualizar', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setFormData(profile || {})
    setEditMode(false)
  }

  const formatCurrency = (n: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(n || 0)
  const formatDate = (d?: string) => (d ? new Date(d).toLocaleString('es-AR') : '—')

  const handleReleasePayouts = async () => {
    try {
      setPayoutLoading(true)
      // Generar payouts pendientes por proveedor a partir de órdenes pagadas y entregadas
      const res = await fetch('/api/admin/payouts', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        cache: 'no-store',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'No se pudieron generar pagos')
      toast({ title: 'Pagos generados', description: data.message || 'Se generaron pagos pendientes' })
    } catch (err) {
      toast({ title: 'Error', description: 'No se pudo generar pagos a proveedores', variant: 'destructive' })
    } finally {
      setPayoutLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Cargando perfil...
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="container mx-auto p-4">No se encontró el perfil</div>
    )
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6" /> Mi Perfil (Admin)
          </h1>
          <p className="text-sm text-muted-foreground">Gestioná tu información personal y administrativa</p>
        </div>
        <div className="flex gap-2">
          {editMode ? (
            <>
              <Button onClick={handleCancel} variant="outline">Cancelar</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />} Guardar
              </Button>
            </>
          ) : (
            <Button onClick={() => setEditMode(true)} variant="outline">
              <Edit className="h-4 w-4 mr-2" /> Editar
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna izquierda */}
        <div className="space-y-6 lg:col-span-2">
          {/* Instrucciones de Cobros y Pagos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" /> Instrucciones de Cobros y Pagos
              </CardTitle>
              <CardDescription>Cómo se generan y liberan los pagos a proveedores</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  Los proveedores deben cargar su destino de cobro (CBU/CVU o cuenta de Mercado Pago) desde su panel en <code>Mi Perfil</code>.
                </li>
                <li>
                  Cuando una orden está pagada y entregada, podés generar pagos pendientes con el botón &quot;Liberar pagos a proveedores&quot; de la derecha. Esto crea <strong>payouts</strong> en estado <em>pending</em>.
                </li>
                <li>
                  Luego, desde el módulo de pagos (próximo), podrás <strong>liberar</strong> cada payout individualmente, pasando a estado <em>paid</em>.
                </li>
              </ul>
            </CardContent>
          </Card>
          {/* Información Personal */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" /> Información Personal
              </CardTitle>
              <CardDescription>Datos básicos del administrador</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nombre</Label>
                  <Input id="name" value={formData.name || ''} onChange={(e) => updateFormData('name', e.target.value)} disabled={!editMode} />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" value={formData.email || ''} disabled readOnly />
                </div>
                <div>
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input id="phone" value={formData.phone || ''} onChange={(e) => updateFormData('phone', e.target.value)} disabled={!editMode} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Calle</Label>
                  <Input value={formData.address?.street || ''} onChange={(e) => updateFormData('address.street', e.target.value)} disabled={!editMode} />
                </div>
                <div>
                  <Label>Ciudad</Label>
                  <Input value={formData.address?.city || ''} onChange={(e) => updateFormData('address.city', e.target.value)} disabled={!editMode} />
                </div>
                <div>
                  <Label>Provincia</Label>
                  <Input value={formData.address?.state || ''} onChange={(e) => updateFormData('address.state', e.target.value)} disabled={!editMode} />
                </div>
                <div>
                  <Label>Código Postal</Label>
                  <Input value={formData.address?.zipCode || ''} onChange={(e) => updateFormData('address.zipCode', e.target.value)} disabled={!editMode} />
                </div>
                <div className="md:col-span-2">
                  <Label>País</Label>
                  <Input value={formData.address?.country || ''} onChange={(e) => updateFormData('address.country', e.target.value)} disabled={!editMode} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Información Comercial */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" /> Información Comercial
              </CardTitle>
              <CardDescription>Datos fiscales y de la empresa</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Razón Social</Label>
                  <Input value={formData.businessInfo?.businessName || ''} onChange={(e) => updateFormData('businessInfo.businessName', e.target.value)} disabled={!editMode} />
                </div>
                <div>
                  <Label>CUIT/CUIL</Label>
                  <Input value={formData.businessInfo?.taxId || ''} onChange={(e) => updateFormData('businessInfo.taxId', e.target.value)} disabled={!editMode} />
                </div>
              </div>
              <div>
                <Label>Descripción</Label>
                <Textarea value={formData.businessInfo?.description || ''} onChange={(e) => updateFormData('businessInfo.description', e.target.value)} disabled={!editMode} />
              </div>
            </CardContent>
          </Card>

          {/* Mensajes (informativo / vínculo a chats admin) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" /> Mensajes
              </CardTitle>
              <CardDescription>Acceso rápido a tus conversaciones</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">Gestioná tus conversaciones con proveedores y clientes</div>
              <Button variant="outline" asChild>
                <a href="/admin/chat">Abrir Chat</a>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Columna derecha */}
        <div className="space-y-6">
          {/* Billetera */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5" /> Billetera
              </CardTitle>
              <CardDescription>Estado de fondos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-3 border rounded-lg">
                  <p className="text-muted-foreground">Saldo disponible</p>
                  <p className="font-medium">{formatCurrency(profile.wallet.availableBalance)}</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <p className="text-muted-foreground">Pagos pendientes</p>
                  <p className="font-medium">{formatCurrency(profile.wallet.pendingPayouts)}</p>
                </div>
              </div>
              <div className="text-xs text-muted-foreground">Último pago: {formatDate(profile.wallet.lastPayoutAt)}</div>
              <div className="flex gap-2">
                <Button onClick={handleReleasePayouts} disabled={payoutLoading}>
                  {payoutLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />} Liberar pagos a proveedores
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Facturación */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" /> Facturación
              </CardTitle>
              <CardDescription>Historial y documentos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="p-3 border rounded-lg flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground">Comprobantes emitidos</p>
                  <p className="font-medium">{profile.billing.invoicesCount}</p>
                </div>
                <div className="text-xs text-muted-foreground">Último: {formatDate(profile.billing.lastInvoiceAt)}</div>
              </div>
            </CardContent>
          </Card>

          {/* Preferencias */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" /> Preferencias
              </CardTitle>
              <CardDescription>Notificaciones y lenguaje</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="emailNotifications">Notificaciones por Email</Label>
                  <p className="text-sm text-gray-600">Recibir notificaciones importantes por email</p>
                </div>
                <Switch id="emailNotifications" checked={!!formData.preferences?.emailNotifications} onCheckedChange={(checked) => updateFormData('preferences.emailNotifications', checked)} disabled={!editMode} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="marketingEmails">Emails de Marketing</Label>
                  <p className="text-sm text-gray-600">Recibir ofertas y promociones</p>
                </div>
                <Switch id="marketingEmails" checked={!!formData.preferences?.marketingEmails} onCheckedChange={(checked) => updateFormData('preferences.marketingEmails', checked)} disabled={!editMode} />
              </div>
              <div>
                <Label>Idioma</Label>
                <Input value={formData.preferences?.language || 'es'} onChange={(e) => updateFormData('preferences.language', e.target.value)} disabled={!editMode} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
