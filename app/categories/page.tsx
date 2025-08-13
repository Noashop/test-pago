'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ArrowRight } from 'lucide-react'
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

export default function CategoriesPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <Link href="/" className="hover:text-foreground">Inicio</Link>
            <span>/</span>
            <span className="text-foreground">Categorías</span>
          </nav>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Todas las Categorías
              </h1>
              <p className="text-muted-foreground">
                Explora nuestros productos organizados por categorías especializadas
              </p>
            </div>
            <Link href="/">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver al inicio
              </Button>
            </Link>
          </div>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Object.entries(PRODUCT_CATEGORIES).map(([key, category]) => (
            <Link key={key} href={`/categories/${key.toLowerCase().replace(/_/g, '-')}`}>
              <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer h-full">
                <CardContent className="p-6">
                  <div className="text-center space-y-4">
                    {/* Icon */}
                    <div className="text-6xl group-hover:scale-110 transition-transform duration-300">
                      {categoryIcons[category.name as keyof typeof categoryIcons] || '📦'}
                    </div>
                    
                    {/* Category Name */}
                    <h3 className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
                      {category.name}
                    </h3>
                    
                    {/* Subcategories Count */}
                    <p className="text-sm text-muted-foreground">
                      {category.subcategories.length} subcategorías disponibles
                    </p>
                    
                    {/* Featured Subcategories */}
                    <div className="flex flex-wrap gap-1 justify-center">
                      {category.subcategories.slice(0, 3).map((subcategory, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {subcategory.length > 15 ? subcategory.substring(0, 15) + '...' : subcategory}
                        </Badge>
                      ))}
                      {category.subcategories.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{category.subcategories.length - 3} más
                        </Badge>
                      )}
                    </div>
                    
                    {/* Explore Button */}
                    <div className="pt-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                      >
                        Explorar
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Category Details Section */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-center mb-8">
            Detalles de Categorías
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            {/* Featured Categories */}
            {Object.entries(PRODUCT_CATEGORIES)
              .slice(0, 4)
              .map(([key, category]) => (
                <Card key={key} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="text-4xl">
                        {categoryIcons[category.name as keyof typeof categoryIcons] || '📦'}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold mb-2 text-primary">
                          {category.name}
                        </h4>
                        <p className="text-sm text-muted-foreground mb-3">
                          {category.subcategories.length} subcategorías especializadas
                        </p>
                        
                        {/* All Subcategories */}
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {category.subcategories.map((subcategory, index) => (
                            <div 
                              key={index} 
                              className="flex items-center justify-between p-2 hover:bg-muted rounded transition-colors text-sm"
                            >
                              <span>{subcategory}</span>
                              <Badge variant="outline" className="text-xs">
                                Ver productos
                              </Badge>
                            </div>
                          ))}
                        </div>
                        
                        <div className="mt-4">
                          <Link href={`/categories/${key.toLowerCase().replace(/_/g, '-')}`}>
                            <Button size="sm" variant="outline" className="w-full">
                              Ver todos los productos
                              <ArrowRight className="h-4 w-4 ml-2" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-4">
            ¿No encuentras lo que buscas?
          </h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Explora todos nuestros productos o utiliza nuestra función de búsqueda 
            para encontrar exactamente lo que necesitas para tu negocio.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/products">
              <Button size="lg">
                Ver todos los productos
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
            <Link href="/products?search=">
              <Button size="lg" variant="outline">
                Buscar productos
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}