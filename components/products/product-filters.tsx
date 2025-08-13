'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { X, Filter, Search, Smartphone, Home, Shirt, Heart, Wrench, Baby, Dog, Dumbbell, BookOpen, Coffee, Package } from 'lucide-react'
import { PRODUCT_CATEGORIES, CATEGORY_ICONS } from '@/constants'

interface ProductFiltersProps {
  searchParams: { [key: string]: string | string[] | undefined }
}

export default function ProductFilters({ searchParams }: ProductFiltersProps) {
  const router = useRouter()
  const searchParamsHook = useSearchParams()
  const [searchQuery, setSearchQuery] = useState(
    Array.isArray(searchParams.search) ? searchParams.search[0] || '' : searchParams.search || ''
  )
  const [priceRange, setPriceRange] = useState([0, 1000000])

  const updateSearchParams = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParamsHook.toString())
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
    })
    // Reset to page 1 when filters change
    params.delete('page')
    router.push(`/products?${params.toString()}`)
  }

  const clearFilters = () => {
    router.push('/products')
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    updateSearchParams({ search: searchQuery })
  }

  const handlePriceRangeChange = (value: number[]) => {
    setPriceRange(value)
    updateSearchParams({
      minPrice: value[0].toString(),
      maxPrice: value[1].toString()
    })
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(price)
  }

  const getCategoryIcon = (categoryKey: string) => {
    const iconName = CATEGORY_ICONS[categoryKey as keyof typeof CATEGORY_ICONS]
    const iconMap: { [key: string]: any } = {
      Smartphone,
      Home,
      Shirt,
      Heart,
      Wrench,
      Baby,
      Dog,
      Dumbbell,
      BookOpen,
      Coffee
    }
    return iconMap[iconName] || Package
  }

  const getActiveFiltersCount = () => {
    let count = 0
    if (searchParams.category) count++
    if (searchParams.subcategory) count++
    if (searchParams.supplier) count++
    if (searchParams.minPrice || searchParams.maxPrice) count++
    if (searchParams.sortBy) count++
    return count
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Buscar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-2">
            <Input
              placeholder="Buscar productos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-sm"
            />
            <Button type="submit" className="w-full" size="sm">
              Buscar
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Active Filters */}
      {getActiveFiltersCount() > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filtros Activos
              </span>
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {searchParams.category && (
                <Badge variant="secondary">
                  Categoría: {searchParams.category}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-1 h-auto p-0"
                    onClick={() => updateSearchParams({ category: '' })}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
              {searchParams.subcategory && (
                <Badge variant="secondary">
                  Subcategoría: {searchParams.subcategory}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-1 h-auto p-0"
                    onClick={() => updateSearchParams({ subcategory: '' })}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
              {searchParams.supplier && (
                <Badge variant="secondary">
                  Proveedor: {searchParams.supplier}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-1 h-auto p-0"
                    onClick={() => updateSearchParams({ supplier: '' })}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Categories */}
      <Card>
        <CardHeader>
          <CardTitle>Categorías</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Object.entries(PRODUCT_CATEGORIES).map(([key, category]) => {
              const IconComponent = getCategoryIcon(key)
              return (
                <div key={key} className="space-y-1">
                  <Button
                    variant={searchParams.category === category.name ? 'default' : 'ghost'}
                    className="w-full justify-start text-xs sm:text-sm"
                    onClick={() => updateSearchParams({ 
                      category: searchParams.category === category.name ? '' : category.name 
                    })}
                  >
                    <IconComponent className="h-4 w-4 mr-2" />
                    {category.name}
                    <Badge variant="secondary" className="ml-auto text-xs">
                      {category.subcategories.length}
                    </Badge>
                  </Button>
                
                {/* Subcategories */}
                {searchParams.category === category.name && (
                  <div className="ml-4 space-y-1">
                    {category.subcategories.map((subcategory, index) => (
                      <Button
                        key={index}
                        variant={searchParams.subcategory === subcategory ? 'default' : 'ghost'}
                        className="w-full justify-start text-xs"
                        onClick={() => updateSearchParams({ 
                          subcategory: searchParams.subcategory === subcategory ? '' : subcategory 
                        })}
                      >
                        {subcategory}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Price Range */}
      <Card>
        <CardHeader>
          <CardTitle>Rango de Precio</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Precio máximo: {formatPrice(priceRange[1])}</Label>
              <Slider
                value={priceRange}
                onValueChange={handlePriceRangeChange}
                max={1000000}
                min={0}
                step={1000}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>{formatPrice(0)}</span>
                <span>{formatPrice(1000000)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sort By */}
      <Card>
        <CardHeader>
          <CardTitle>Ordenar por</CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={searchParams.sortBy as string || 'createdAt'}
            onValueChange={(value) => updateSearchParams({ sortBy: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt">Más recientes</SelectItem>
              <SelectItem value="salePrice">Precio: Menor a Mayor</SelectItem>
              <SelectItem value="-salePrice">Precio: Mayor a Menor</SelectItem>
              <SelectItem value="name">Nombre: A-Z</SelectItem>
              <SelectItem value="-name">Nombre: Z-A</SelectItem>
              <SelectItem value="rating">Mejor Valorados</SelectItem>
              <SelectItem value="salesCount">Más Vendidos</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Stock Status */}
      <Card>
        <CardHeader>
          <CardTitle>Estado de Stock</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="inStock"
                checked={searchParams.stock === 'inStock'}
                onCheckedChange={(checked) => 
                  updateSearchParams({ stock: checked ? 'inStock' : '' })
                }
              />
              <Label htmlFor="inStock">En Stock</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="outOfStock"
                checked={searchParams.stock === 'outOfStock'}
                onCheckedChange={(checked) => 
                  updateSearchParams({ stock: checked ? 'outOfStock' : '' })
                }
              />
              <Label htmlFor="outOfStock">Sin Stock</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Clear All Filters */}
      {getActiveFiltersCount() > 0 && (
        <Button
          variant="outline"
          className="w-full"
          onClick={clearFilters}
        >
          Limpiar todos los filtros
        </Button>
      )}
    </div>
  )
}
