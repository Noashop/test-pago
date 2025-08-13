'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { ImageUpload } from '@/components/ui/image-upload'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Upload, ArrowRight, ArrowLeft } from 'lucide-react'

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
  icon: string
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
  validation?: {
    min?: number
    max?: number
    pattern?: string
  }
}

interface ProductFormProps {
  onSubmit: (data: any) => Promise<void>
  onCancel: () => void
}

export default function ProductForm({ onSubmit, onCancel }: ProductFormProps) {
  const { toast } = useToast()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [selectedSubcategory, setSelectedSubcategory] = useState<Subcategory | null>(null)
  
  // Formulario parte 1 - Información general
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    shortDescription: '',
    category: '',
    subcategory: '',
    warranty: '',
    costPrice: '',
    salePrice: '',
    recommendedRetailPrice: '',
    minimumPurchaseQuantity: '',
    availableQuantity: '',
    images: [] as string[]
  })

  // Formulario parte 2 - Campos específicos
  const [specificFields, setSpecificFields] = useState<{[key: string]: any}>({})

  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch('/api/categories')
      const data = await response.json()
      setCategories(data.categories)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al cargar las categorías',
        variant: 'destructive',
      })
    }
  }, [toast])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  const handleCategoryChange = (categorySlug: string) => {
    const category = categories.find(cat => cat.slug === categorySlug)
    setSelectedCategory(category || null)
    setSelectedSubcategory(null)
    setFormData(prev => ({ ...prev, category: categorySlug, subcategory: '' }))
    setSpecificFields({})
  }

  const handleSubcategoryChange = (subcategorySlug: string) => {
    if (!selectedCategory) return
    
    const subcategory = selectedCategory.subcategories.find(sub => sub.slug === subcategorySlug)
    setSelectedSubcategory(subcategory || null)
    setFormData(prev => ({ ...prev, subcategory: subcategorySlug }))
    
    // Inicializar campos específicos
    if (subcategory) {
      const initialFields: {[key: string]: any} = {}
      subcategory.requiredFields.forEach(field => {
        initialFields[field.name] = ''
      })
      subcategory.optionalFields.forEach(field => {
        initialFields[field.name] = ''
      })
      setSpecificFields(initialFields)
    }
  }

  const handleNextStep = () => {
    if (!formData.name || !formData.description || !formData.category || !formData.subcategory) {
      toast({
        title: 'Error',
        description: 'Por favor completa todos los campos requeridos',
        variant: 'destructive'
      })
      return
    }
    
    // Validar longitud mínima de descripciones
    if (formData.description.length < 100) {
      toast({
        title: 'Error',
        description: 'La descripción detallada debe tener al menos 100 caracteres',
        variant: 'destructive'
      })
      return
    }
    
    if (formData.shortDescription.length < 10) {
      toast({
        title: 'Error',
        description: 'La descripción corta debe tener al menos 10 caracteres',
        variant: 'destructive'
      })
      return
    }
    
    setStep(2)
  }

  const handlePreviousStep = () => {
    setStep(1)
  }

  const handleSubmit = async () => {
    if (!selectedSubcategory) return

    // Validar campos requeridos específicos
    const missingFields = selectedSubcategory.requiredFields.filter(
      field => !specificFields[field.name]
    )

    if (missingFields.length > 0) {
      toast({
        title: 'Error',
        description: `Por favor completa los campos requeridos: ${missingFields.map(f => f.label).join(', ')}`,
        variant: 'destructive'
      })
      return
    }

    setLoading(true)

    try {
      const productData = {
        ...formData,
        ...specificFields,
        costPrice: parseFloat(formData.costPrice),
        salePrice: parseFloat(formData.salePrice),
        recommendedRetailPrice: parseFloat(formData.recommendedRetailPrice),
        minimumPurchaseQuantity: parseInt(formData.minimumPurchaseQuantity),
        availableQuantity: parseInt(formData.availableQuantity)
      }

      await onSubmit(productData)
    } catch (error) {
      console.error('Error submitting product:', error)
    } finally {
      setLoading(false)
    }
  }

  const renderField = (field: ProductField) => {
    const value = specificFields[field.name] || ''
    const isRequired = field.required

    switch (field.type) {
      case 'select':
        return (
          <Select 
            value={value} 
            onValueChange={(val) => setSpecificFields(prev => ({ ...prev, [field.name]: val }))}
          >
            <SelectTrigger>
              <SelectValue placeholder={field.placeholder || `Selecciona ${field.label}`} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map(option => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )

      case 'boolean':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={field.name}
              checked={value === 'true' || value === true}
              onCheckedChange={(checked) => 
                setSpecificFields(prev => ({ ...prev, [field.name]: checked ? 'true' : 'false' }))
              }
            />
            <Label htmlFor={field.name}>{field.label}</Label>
          </div>
        )

      case 'number':
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => setSpecificFields(prev => ({ ...prev, [field.name]: e.target.value }))}
            placeholder={field.placeholder || field.label}
            required={isRequired}
            min={field.validation?.min}
            max={field.validation?.max}
          />
        )

      case 'textarea':
        return (
          <Textarea
            value={value}
            onChange={(e) => setSpecificFields(prev => ({ ...prev, [field.name]: e.target.value }))}
            placeholder={field.placeholder || field.label}
            required={isRequired}
            rows={3}
          />
        )

      default:
        return (
          <Input
            type="text"
            value={value}
            onChange={(e) => setSpecificFields(prev => ({ ...prev, [field.name]: e.target.value }))}
            placeholder={field.placeholder || field.label}
            required={isRequired}
            pattern={field.validation?.pattern}
          />
        )
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress indicator */}
      <div className="mb-6">
        <div className="flex items-center justify-center space-x-4">
          <div className={`flex items-center ${step >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
              step >= 1 ? 'bg-primary text-primary-foreground border-primary' : 'border-muted-foreground'
            }`}>
              1
            </div>
            <span className="ml-2">Información General</span>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
          <div className={`flex items-center ${step >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
              step >= 2 ? 'bg-primary text-primary-foreground border-primary' : 'border-muted-foreground'
            }`}>
              2
            </div>
            <span className="ml-2">Especificaciones</span>
          </div>
        </div>
      </div>

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Información General del Producto</CardTitle>
            <CardDescription>
              Completa la información básica del producto
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Imágenes */}
            <div>
              <Label>Fotos del Producto *</Label>
              <ImageUpload
                value={formData.images}
                onChange={(urls) => setFormData(prev => ({ ...prev, images: urls }))}
                maxImages={5}
              />
            </div>

            {/* Nombre */}
            <div>
              <Label htmlFor="name">Nombre del Producto *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>

            {/* Descripción Corta */}
            <div>
              <Label htmlFor="shortDescription">Descripción Corta *</Label>
              <Textarea
                id="shortDescription"
                value={formData.shortDescription}
                onChange={(e) => setFormData(prev => ({ ...prev, shortDescription: e.target.value }))}
                placeholder="Descripción breve del producto (10-200 caracteres)"
                minLength={10}
                maxLength={200}
                required
                className="min-h-[80px]"
              />
              <p className="text-sm text-muted-foreground mt-1">
                {formData.shortDescription.length}/200 caracteres (mínimo 10)
              </p>
            </div>

            {/* Descripción Detallada */}
            <div>
              <Label htmlFor="description">Descripción Detallada *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descripción completa del producto (mínimo 100 caracteres)"
                minLength={100}
                maxLength={2000}
                required
                className="min-h-[120px]"
              />
              <p className="text-sm text-muted-foreground mt-1">
                {formData.description.length}/2000 caracteres (mínimo 100)
              </p>
            </div>

            {/* Categoría y Subcategoría */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Categoría *</Label>
                <Select value={formData.category} onValueChange={handleCategoryChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category.slug} value={category.slug}>
                        <div className="flex items-center gap-2">
                          <span>{category.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="subcategory">Subcategoría *</Label>
                <Select 
                  value={formData.subcategory} 
                  onValueChange={handleSubcategoryChange}
                  disabled={!selectedCategory}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione subcategoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedCategory?.subcategories.map(subcategory => (
                      <SelectItem key={subcategory.slug} value={subcategory.slug}>
                        <div className="flex items-center gap-2">
                          <span>{subcategory.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Garantía */}
            <div>
              <Label htmlFor="warranty">Garantía *</Label>
              <Select value={formData.warranty} onValueChange={(value) => setFormData(prev => ({ ...prev, warranty: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione garantía" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="6 meses">6 meses</SelectItem>
                  <SelectItem value="1 año">1 año</SelectItem>
                  <SelectItem value="2 años">2 años</SelectItem>
                  <SelectItem value="Sin garantía">Sin garantía</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Precios */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="costPrice">Precio de Costo *</Label>
                <Input
                  id="costPrice"
                  type="number"
                  step="0.01"
                  value={formData.costPrice}
                  onChange={(e) => setFormData(prev => ({ ...prev, costPrice: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="salePrice">Precio de Venta Mayorista *</Label>
                <Input
                  id="salePrice"
                  type="number"
                  step="0.01"
                  value={formData.salePrice}
                  onChange={(e) => setFormData(prev => ({ ...prev, salePrice: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="recommendedRetailPrice">Precio de Reventa Sugerido *</Label>
                <Input
                  id="recommendedRetailPrice"
                  type="number"
                  step="0.01"
                  value={formData.recommendedRetailPrice}
                  onChange={(e) => setFormData(prev => ({ ...prev, recommendedRetailPrice: e.target.value }))}
                  required
                />
              </div>
            </div>

            {/* Cantidades */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="minimumPurchaseQuantity">Cantidad Mínima de Compra *</Label>
                <Input
                  id="minimumPurchaseQuantity"
                  type="number"
                  value={formData.minimumPurchaseQuantity}
                  onChange={(e) => setFormData(prev => ({ ...prev, minimumPurchaseQuantity: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="availableQuantity">Unidades Disponibles *</Label>
                <Input
                  id="availableQuantity"
                  type="number"
                  value={formData.availableQuantity}
                  onChange={(e) => setFormData(prev => ({ ...prev, availableQuantity: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleNextStep} disabled={!formData.name || !formData.category || !formData.subcategory}>
                Continuar
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && selectedSubcategory && (
        <Card>
          <CardHeader>
            <CardTitle>Especificaciones del Producto</CardTitle>
            <CardDescription>
              {selectedCategory?.name} - {selectedSubcategory.name}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Campos requeridos */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Campos Requeridos</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedSubcategory.requiredFields.map(field => (
                  <div key={field.name}>
                    <Label htmlFor={field.name}>{field.label} *</Label>
                    {renderField(field)}
                  </div>
                ))}
              </div>
            </div>

            {/* Campos opcionales */}
            {selectedSubcategory.optionalFields.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Campos Opcionales</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedSubcategory.optionalFields.map(field => (
                    <div key={field.name}>
                      <Label htmlFor={field.name}>{field.label}</Label>
                      {renderField(field)}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={handlePreviousStep}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Anterior
              </Button>
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                Crear Producto
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 