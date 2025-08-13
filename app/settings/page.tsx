'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { 
  Settings, 
  Globe, 
  Moon, 
  Sun, 
  Monitor,
  Trash2,
  Download,
  AlertTriangle,
  Shield,
  Database,
  Bell
} from 'lucide-react'

import Navbar from '@/components/layout/navbar'
import Footer from '@/components/layout/footer'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'

interface AppSettings {
  language: string
  theme: 'light' | 'dark' | 'system'
  currency: string
  timezone: string
  dataRetention: number
  analytics: boolean
  crashReporting: boolean
}

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const [settings, setSettings] = useState<AppSettings>({
    language: 'es',
    theme: 'system',
    currency: 'ARS',
    timezone: 'America/Argentina/Salta',
    dataRetention: 365,
    analytics: true,
    crashReporting: true
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      redirect('/auth/login?callbackUrl=/settings')
    }
    fetchSettings()
  }, [session, status])

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/user/settings')
      const data = await response.json()

      if (response.ok) {
        setSettings(data.settings)
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateSetting = async (key: keyof AppSettings, value: any) => {
    const newSettings = { ...settings, [key]: value }
    setSettings(newSettings)

    try {
      const response = await fetch('/api/user/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ [key]: value }),
      })

      if (!response.ok) {
        throw new Error('Failed to update setting')
      }

      toast({
        title: 'Configuración actualizada',
        description: 'Los cambios han sido guardados',
      })
    } catch (error) {
      // Revert on error
      setSettings(settings)
      toast({
        title: 'Error',
        description: 'No se pudo actualizar la configuración',
        variant: 'destructive',
      })
    }
  }

  const handleExportData = async () => {
    try {
      const response = await fetch('/api/user/export-data')
      const blob = await response.blob()
      
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `salta-conecta-data-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: 'Datos exportados',
        description: 'Tu información ha sido descargada exitosamente',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudieron exportar los datos',
        variant: 'destructive',
      })
    }
  }

  const handleDeleteAccount = async () => {
    try {
      const response = await fetch('/api/user/delete-account', {
        method: 'DELETE',
      })

      if (response.ok) {
        toast({
          title: 'Cuenta eliminada',
          description: 'Tu cuenta ha sido eliminada exitosamente',
        })
        
        // Sign out and redirect
        await signOut({ callbackUrl: '/' })
      } else {
        throw new Error('Failed to delete account')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo eliminar la cuenta',
        variant: 'destructive',
      })
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/4" />
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-32 bg-muted rounded" />
              ))}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-playfair font-bold text-foreground mb-2">
            Configuraciones
          </h1>
          <p className="text-muted-foreground">
            Personaliza tu experiencia en Salta Conecta
          </p>
        </div>

        <div className="max-w-4xl space-y-6">
          {/* Appearance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Monitor className="h-5 w-5 mr-2" />
                Apariencia
              </CardTitle>
              <CardDescription>
                Personaliza la apariencia de la aplicación
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Tema</p>
                  <p className="text-sm text-muted-foreground">
                    Selecciona tu tema preferido
                  </p>
                </div>
                <Select 
                  value={settings.theme} 
                  onValueChange={(value: 'light' | 'dark' | 'system') => updateSetting('theme', value)}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">
                      <div className="flex items-center">
                        <Sun className="h-4 w-4 mr-2" />
                        Claro
                      </div>
                    </SelectItem>
                    <SelectItem value="dark">
                      <div className="flex items-center">
                        <Moon className="h-4 w-4 mr-2" />
                        Oscuro
                      </div>
                    </SelectItem>
                    <SelectItem value="system">
                      <div className="flex items-center">
                        <Monitor className="h-4 w-4 mr-2" />
                        Sistema
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Language & Region */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Globe className="h-5 w-5 mr-2" />
                Idioma y Región
              </CardTitle>
              <CardDescription>
                Configura tu idioma y preferencias regionales
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Idioma</p>
                    <p className="text-sm text-muted-foreground">
                      Idioma de la interfaz
                    </p>
                  </div>
                  <Select 
                    value={settings.language} 
                    onValueChange={(value) => updateSetting('language', value)}
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="es">Español</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Moneda</p>
                    <p className="text-sm text-muted-foreground">
                      Moneda para precios
                    </p>
                  </div>
                  <Select 
                    value={settings.currency} 
                    onValueChange={(value) => updateSetting('currency', value)}
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ARS">ARS ($)</SelectItem>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Zona horaria</p>
                  <p className="text-sm text-muted-foreground">
                    Tu zona horaria local
                  </p>
                </div>
                <Select 
                  value={settings.timezone} 
                  onValueChange={(value) => updateSetting('timezone', value)}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="America/Argentina/Salta">Salta (GMT-3)</SelectItem>
                    <SelectItem value="America/Argentina/Buenos_Aires">Buenos Aires (GMT-3)</SelectItem>
                    <SelectItem value="America/Argentina/Cordoba">Córdoba (GMT-3)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Privacy & Data */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Privacidad y Datos
              </CardTitle>
              <CardDescription>
                Controla cómo se manejan tus datos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Análisis de uso</p>
                  <p className="text-sm text-muted-foreground">
                    Ayúdanos a mejorar compartiendo datos de uso anónimos
                  </p>
                </div>
                <Switch
                  checked={settings.analytics}
                  onCheckedChange={(checked) => updateSetting('analytics', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Reportes de errores</p>
                  <p className="text-sm text-muted-foreground">
                    Enviar reportes automáticos de errores para mejorar la estabilidad
                  </p>
                </div>
                <Switch
                  checked={settings.crashReporting}
                  onCheckedChange={(checked) => updateSetting('crashReporting', checked)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Retención de datos</p>
                  <p className="text-sm text-muted-foreground">
                    Tiempo que mantenemos tus datos de actividad
                  </p>
                </div>
                <Select 
                  value={settings.dataRetention.toString()} 
                  onValueChange={(value) => updateSetting('dataRetention', parseInt(value))}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="90">90 días</SelectItem>
                    <SelectItem value="180">6 meses</SelectItem>
                    <SelectItem value="365">1 año</SelectItem>
                    <SelectItem value="730">2 años</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Data Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="h-5 w-5 mr-2" />
                Gestión de Datos
              </CardTitle>
              <CardDescription>
                Exporta o elimina tus datos personales
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Exportar datos</p>
                  <p className="text-sm text-muted-foreground">
                    Descarga una copia de todos tus datos
                  </p>
                </div>
                <Button variant="outline" onClick={handleExportData}>
                  <Download className="h-4 w-4 mr-2" />
                  Exportar
                </Button>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-destructive">Eliminar cuenta</p>
                  <p className="text-sm text-muted-foreground">
                    Elimina permanentemente tu cuenta y todos los datos asociados
                  </p>
                </div>
                <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Eliminar
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle className="flex items-center text-destructive">
                        <AlertTriangle className="h-5 w-5 mr-2" />
                        Eliminar Cuenta
                      </DialogTitle>
                      <DialogDescription>
                        Esta acción no se puede deshacer. Se eliminarán permanentemente:
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-2 text-sm">
                      <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                        <li>Tu perfil y información personal</li>
                        <li>Historial de pedidos y transacciones</li>
                        <li>Lista de deseos y productos guardados</li>
                        <li>Tickets de soporte y conversaciones</li>
                        <li>Todas las preferencias y configuraciones</li>
                      </ul>
                    </div>

                    <div className="flex justify-end space-x-2 pt-4">
                      <Button
                        variant="outline"
                        onClick={() => setIsDeleteDialogOpen(false)}
                      >
                        Cancelar
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={handleDeleteAccount}
                      >
                        Sí, eliminar mi cuenta
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>

          {/* About */}
          <Card>
            <CardHeader>
              <CardTitle>Acerca de Salta Conecta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Versión</span>
                <span>1.0.0</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Última actualización</span>
                <span>Enero 2025</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Soporte</span>
                <span>soporte@saltaconecta.com</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      
      <Footer />
    </div>
  )
}
