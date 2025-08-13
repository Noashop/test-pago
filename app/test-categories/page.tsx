'use client'

import { useState, useEffect } from 'react'

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
}

export default function TestCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/categories')
      const data = await response.json()
      
      if (response.ok) {
        setCategories(data.categories)
        console.log('Categorías cargadas:', data.categories)
      } else {
        setError(data.error || 'Error al cargar categorías')
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="p-8">Cargando categorías...</div>
  }

  if (error) {
    return <div className="p-8 text-red-600">Error: {error}</div>
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Test de Categorías</h1>
      
      {categories.length === 0 ? (
        <div className="bg-yellow-100 p-4 rounded-lg">
          <p className="text-yellow-800">No hay categorías configuradas</p>
          <p className="text-sm text-yellow-700 mt-2">
            Ejecuta el script de configuración para crear categorías de prueba
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {categories.map((category) => (
            <div key={category._id} className="border rounded-lg p-4">
              <h2 className="text-xl font-semibold mb-2">
                {category.icon} {category.name} ({category.slug})
              </h2>
              
              {category.subcategories.map((subcategory) => (
                <div key={subcategory._id} className="ml-4 mt-4 p-3 bg-gray-50 rounded">
                  <h3 className="font-medium mb-2">
                    {subcategory.name} ({subcategory.slug})
                  </h3>
                  
                  {subcategory.requiredFields.length > 0 && (
                    <div className="mb-3">
                      <h4 className="text-sm font-medium text-green-700 mb-1">
                        Campos Requeridos ({subcategory.requiredFields.length}):
                      </h4>
                      <ul className="text-sm space-y-1">
                        {subcategory.requiredFields.map((field) => (
                          <li key={field.name} className="ml-2">
                            • {field.label} ({field.type})
                            {field.options && ` - Opciones: ${field.options.join(', ')}`}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {subcategory.optionalFields.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-blue-700 mb-1">
                        Campos Opcionales ({subcategory.optionalFields.length}):
                      </h4>
                      <ul className="text-sm space-y-1">
                        {subcategory.optionalFields.map((field) => (
                          <li key={field.name} className="ml-2">
                            • {field.label} ({field.type})
                            {field.options && ` - Opciones: ${field.options.join(', ')}`}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 