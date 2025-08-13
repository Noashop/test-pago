'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PRODUCT_CATEGORIES } from '@/constants'

const categoryIcons = {
  'Electrónica': '📱',
  'Hogar y Cocina': '🏠',
  'Moda': '👕',
  'Salud y Belleza': '💄',
  'Herramientas e Industria': '🔧',
  'Bebés y Niños': '👶',
  'Mascotas': '🐕',
  'Deportes y Fitness': '🏃',
  'Papelería y Librería': '📚',
  'Alimentos y Bebidas': '🍎'
}

export default function CategoriesSection() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {Object.entries(PRODUCT_CATEGORIES).map(([key, category]) => (
          <Link key={key} href={`/categories/${key.toLowerCase().replace(/_/g, '-')}`}>
            <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer">
              <CardContent className="p-6 text-center">
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">
                  {categoryIcons[category.name as keyof typeof categoryIcons] || '📦'}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-primary transition-colors">
                  {category.name}
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  {category.subcategories.length} subcategorías
                </p>
                <div className="flex flex-wrap gap-1 justify-center">
                  {category.subcategories.slice(0, 3).map((subcategory, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {subcategory.split(' ')[0]}
                    </Badge>
                  ))}
                  {category.subcategories.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{category.subcategories.length - 3} más
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>


      {/* CTA */}
      <div className="text-center mt-12">
        <Link href="/categories">
          <button className="bg-primary text-white px-8 py-3 rounded-lg hover:bg-primary/90 transition-colors font-semibold">
            Ver todas las categorías
          </button>
        </Link>
      </div>
    </div>
  )
}
