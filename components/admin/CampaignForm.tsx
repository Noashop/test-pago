'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Palette, Users, Gift, Target, Plus, Trash2 } from 'lucide-react'

interface CampaignFormData {
  title: string
  description: string
  content: string
  type: string
  design: {
    fontFamily: string
    fontSize: string
    textColor: string
    backgroundColor: string
    imageUrl: string
    imageSize: string
    imagePosition: string
  }
  targetAudience: string
  startDate: string
  endDate: string
  priority: number
  rouletteConfig: {
    isEnabled: boolean
    triggersPerPurchase: number
    prizes: any[]
  }
  referralConfig: {
    isEnabled: boolean
    referralsRequired: number
    reward: {
      type: string
      value: number
      description: string
    }
  }
  notificationConfig: {
    showInNotifications: boolean
    autoSend: boolean
    customMessage: string
  }
}

interface CampaignFormProps {
  formData: CampaignFormData
  setFormData: (data: CampaignFormData) => void
  onSubmit: (e: React.FormEvent) => void
  loading: boolean
  isEdit?: boolean
}

const FONT_FAMILIES = [
  { value: 'roboto', label: 'Roboto' },
  { value: 'opensans', label: 'Open Sans' },
  { value: 'montserrat', label: 'Montserrat' }
]

const COLORS = [
  '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF',
  '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500'
]

export default function CampaignForm({ formData, setFormData, onSubmit, loading, isEdit = false }: CampaignFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic">Básico</TabsTrigger>
          <TabsTrigger value="design">Diseño</TabsTrigger>
          <TabsTrigger value="audience">Audiencia</TabsTrigger>
          <TabsTrigger value="special">Especial</TabsTrigger>
        </TabsList>

        {/* Información básica */}
        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Información Básica</CardTitle>
              <CardDescription>
                Configura la información principal de la campaña
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Título *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="Título de la campaña"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="type">Tipo *</Label>
                  <Select value={formData.type} onValueChange={(value) => setFormData({...formData, type: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="promotion">Promoción</SelectItem>
                      <SelectItem value="announcement">Anuncio</SelectItem>
                      <SelectItem value="referral">Referidos</SelectItem>
                      <SelectItem value="roulette">Ruleta</SelectItem>
                      <SelectItem value="banner">Banner</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="description">Descripción *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Descripción breve de la campaña"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="content">Contenido *</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({...formData, content: e.target.value})}
                  placeholder="Contenido completo de la campaña"
                  rows={4}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="startDate">Fecha de inicio *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="endDate">Fecha de fin</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                  />
                </div>
                
                <div>
                  <Label htmlFor="priority">Prioridad (1-10)</Label>
                  <Input
                    id="priority"
                    type="number"
                    min="1"
                    max="10"
                    value={formData.priority}
                    onChange={(e) => setFormData({...formData, priority: parseInt(e.target.value)})}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Personalización visual */}
        <TabsContent value="design" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Personalización Visual
              </CardTitle>
              <CardDescription>
                Personaliza la apariencia con 3 fuentes y 9 colores
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Fuente</Label>
                  <Select 
                    value={formData.design.fontFamily} 
                    onValueChange={(value) => setFormData({
                      ...formData, 
                      design: {...formData.design, fontFamily: value}
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FONT_FAMILIES.map(font => (
                        <SelectItem key={font.value} value={font.value}>
                          {font.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Tamaño de texto</Label>
                  <Select 
                    value={formData.design.fontSize} 
                    onValueChange={(value) => setFormData({
                      ...formData, 
                      design: {...formData.design, fontSize: value}
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Pequeño</SelectItem>
                      <SelectItem value="medium">Mediano</SelectItem>
                      <SelectItem value="large">Grande</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Color de texto</Label>
                  <div className="flex gap-2 mt-1">
                    {COLORS.map(color => (
                      <button
                        key={color}
                        type="button"
                        className={`w-8 h-8 rounded border-2 ${
                          formData.design.textColor === color ? 'border-gray-800' : 'border-gray-300'
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() => setFormData({
                          ...formData,
                          design: {...formData.design, textColor: color}
                        })}
                      />
                    ))}
                  </div>
                </div>
                
                <div>
                  <Label>Color de fondo</Label>
                  <div className="flex gap-2 mt-1">
                    {COLORS.map(color => (
                      <button
                        key={color}
                        type="button"
                        className={`w-8 h-8 rounded border-2 ${
                          formData.design.backgroundColor === color ? 'border-gray-800' : 'border-gray-300'
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() => setFormData({
                          ...formData,
                          design: {...formData.design, backgroundColor: color}
                        })}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="imageUrl">URL de imagen</Label>
                <Input
                  id="imageUrl"
                  value={formData.design.imageUrl}
                  onChange={(e) => setFormData({
                    ...formData,
                    design: {...formData.design, imageUrl: e.target.value}
                  })}
                  placeholder="https://ejemplo.com/imagen.jpg"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audiencia */}
        <TabsContent value="audience" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Configuración de Audiencia
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Audiencia objetivo</Label>
                <Select 
                  value={formData.targetAudience} 
                  onValueChange={(value) => setFormData({...formData, targetAudience: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="clients">Solo clientes</SelectItem>
                    <SelectItem value="suppliers">Solo proveedores</SelectItem>
                    <SelectItem value="both">Clientes y proveedores</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="showInNotifications"
                  checked={formData.notificationConfig.showInNotifications}
                  onCheckedChange={(checked) => setFormData({
                    ...formData,
                    notificationConfig: {...formData.notificationConfig, showInNotifications: checked}
                  })}
                />
                <Label htmlFor="showInNotifications">Mostrar en notificaciones</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="autoSend"
                  checked={formData.notificationConfig.autoSend}
                  onCheckedChange={(checked) => setFormData({
                    ...formData,
                    notificationConfig: {...formData.notificationConfig, autoSend: checked}
                  })}
                />
                <Label htmlFor="autoSend">Envío automático</Label>
              </div>

              <div>
                <Label htmlFor="customMessage">Mensaje personalizado</Label>
                <Textarea
                  id="customMessage"
                  value={formData.notificationConfig.customMessage}
                  onChange={(e) => setFormData({
                    ...formData,
                    notificationConfig: {...formData.notificationConfig, customMessage: e.target.value}
                  })}
                  placeholder="Mensaje personalizado para las notificaciones"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configuraciones especiales */}
        <TabsContent value="special" className="space-y-4">
          {/* Configuración de ruleta */}
          {formData.type === 'roulette' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="h-5 w-5" />
                  Configuración de Ruleta
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="rouletteEnabled"
                    checked={formData.rouletteConfig.isEnabled}
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      rouletteConfig: {...formData.rouletteConfig, isEnabled: checked}
                    })}
                  />
                  <Label htmlFor="rouletteEnabled">Habilitar ruleta</Label>
                </div>

                {formData.rouletteConfig.isEnabled && (
                  <div>
                    <Label htmlFor="triggersPerPurchase">Giros por compra completada</Label>
                    <Input
                      id="triggersPerPurchase"
                      type="number"
                      min="1"
                      value={formData.rouletteConfig.triggersPerPurchase}
                      onChange={(e) => setFormData({
                        ...formData,
                        rouletteConfig: {...formData.rouletteConfig, triggersPerPurchase: parseInt(e.target.value)}
                      })}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Configuración de referidos */}
          {formData.type === 'referral' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Configuración de Referidos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="referralEnabled"
                    checked={formData.referralConfig.isEnabled}
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      referralConfig: {...formData.referralConfig, isEnabled: checked}
                    })}
                  />
                  <Label htmlFor="referralEnabled">Habilitar sistema de referidos</Label>
                </div>

                {formData.referralConfig.isEnabled && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="referralsRequired">Referidos requeridos</Label>
                      <Input
                        id="referralsRequired"
                        type="number"
                        min="1"
                        value={formData.referralConfig.referralsRequired}
                        onChange={(e) => setFormData({
                          ...formData,
                          referralConfig: {...formData.referralConfig, referralsRequired: parseInt(e.target.value)}
                        })}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Tipo de recompensa</Label>
                        <Select 
                          value={formData.referralConfig.reward.type} 
                          onValueChange={(value) => setFormData({
                            ...formData,
                            referralConfig: {
                              ...formData.referralConfig,
                              reward: {...formData.referralConfig.reward, type: value}
                            }
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="discount_percentage">Descuento %</SelectItem>
                            <SelectItem value="discount_fixed">Descuento fijo</SelectItem>
                            <SelectItem value="free_shipping">Envío gratis</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Valor</Label>
                        <Input
                          type="number"
                          value={formData.referralConfig.reward.value}
                          onChange={(e) => setFormData({
                            ...formData,
                            referralConfig: {
                              ...formData.referralConfig,
                              reward: {...formData.referralConfig.reward, value: parseFloat(e.target.value)}
                            }
                          })}
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Descripción</Label>
                      <Input
                        value={formData.referralConfig.reward.description}
                        onChange={(e) => setFormData({
                          ...formData,
                          referralConfig: {
                            ...formData.referralConfig,
                            reward: {...formData.referralConfig.reward, description: e.target.value}
                          }
                        })}
                        placeholder="Descripción de la recompensa"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-4">
        <Button type="submit" disabled={loading}>
          {loading ? 'Guardando...' : isEdit ? 'Actualizar Campaña' : 'Crear Campaña'}
        </Button>
      </div>
    </form>
  )
}
