'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { IProductField } from '@/models/Category'

interface DynamicFieldsProps {
  fields: IProductField[]
  values: Record<string, any>
  onChange: (fieldName: string, value: any) => void
  isOptional?: boolean
}

export function DynamicFields({ fields, values, onChange, isOptional = false }: DynamicFieldsProps) {
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleFieldChange = (fieldName: string, value: any) => {
    // Limpiar error del campo
    if (errors[fieldName]) {
      setErrors(prev => ({ ...prev, [fieldName]: '' }))
    }
    
    onChange(fieldName, value)
  }

  const validateField = (field: IProductField, value: any) => {
    if (!field.required) return true
    
    if (!value || value === '' || value === undefined) {
      setErrors(prev => ({ ...prev, [field.name]: `${field.label} es requerido` }))
      return false
    }
    
    return true
  }

  const renderField = (field: IProductField) => {
    const value = values[field.name] || ''
    const error = errors[field.name]

    switch (field.type) {
      case 'text':
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name} className="text-sm font-medium">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={field.name}
              value={value}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              placeholder={field.placeholder || `Ingresa ${field.label.toLowerCase()}`}
              className={error ? 'border-red-500' : ''}
              onBlur={() => validateField(field, value)}
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
        )

      case 'number':
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name} className="text-sm font-medium">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={field.name}
              type="number"
              value={value}
              onChange={(e) => handleFieldChange(field.name, parseFloat(e.target.value) || 0)}
              placeholder={field.placeholder || `Ingresa ${field.label.toLowerCase()}`}
              className={error ? 'border-red-500' : ''}
              onBlur={() => validateField(field, value)}
              min={field.validation?.min}
              max={field.validation?.max}
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
        )

      case 'select':
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name} className="text-sm font-medium">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Select
              value={value}
              onValueChange={(val) => handleFieldChange(field.name, val)}
            >
              <SelectTrigger className={error ? 'border-red-500' : ''}>
                <SelectValue placeholder={`Selecciona ${field.label.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
        )

      case 'boolean':
        return (
          <div key={field.name} className="flex items-center space-x-2">
            <Switch
              id={field.name}
              checked={value === true || value === 'true'}
              onCheckedChange={(checked) => handleFieldChange(field.name, checked)}
            />
            <Label htmlFor={field.name} className="text-sm font-medium">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            {error && <p className="text-sm text-red-500 ml-2">{error}</p>}
          </div>
        )

      case 'textarea':
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name} className="text-sm font-medium">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Textarea
              id={field.name}
              value={value}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              placeholder={field.placeholder || `Ingresa ${field.label.toLowerCase()}`}
              className={error ? 'border-red-500' : ''}
              onBlur={() => validateField(field, value)}
              rows={3}
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
        )

      default:
        return null
    }
  }

  if (fields.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">
        {isOptional ? 'Campos Opcionales' : 'Campos Requeridos'}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fields.map(renderField)}
      </div>
    </div>
  )
} 