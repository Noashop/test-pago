'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  ShoppingCart, 
  Truck, 
  Shield, 
  Users, 
  Star, 
  ArrowRight,
  Gift,
  TrendingUp,
  Zap
} from 'lucide-react'
import DynamicHeroSection from '@/components/sections/dynamic-hero-section'
import FeaturedProducts from '@/components/sections/featured-products'
import CategoriesSection from '@/components/sections/categories-section'
import DynamicWhyChooseUs from '@/components/sections/dynamic-why-choose-us'
import ProductBanners from '@/components/sections/product-banners'
import { StoreLoader } from '@/components/ui/loaders'
import SuppliersCarousel from '@/components/sections/suppliers-carousel'

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simular tiempo de carga
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  if (isLoading) {
    return <StoreLoader />
  }

  return (
    <div className="min-h-screen">
      {/* Dynamic Hero Section */}
      <DynamicHeroSection />

      {/* Suppliers Carousel - Business logos banner */}
      <SuppliersCarousel />

      {/* Featured Products */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Productos Destacados
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Descubre los productos más populares y mejor valorados por nuestros mayoristas
            </p>
          </div>
          <FeaturedProducts />
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Explora por Categorías
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Encuentra todo lo que necesitas organizado por categorías especializadas
            </p>
          </div>
          <CategoriesSection />
        </div>
      </section>

      {/* Dynamic Why Choose Us - includes stats section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <DynamicWhyChooseUs />
        </div>
      </section>

      {/* Product Banners - Productos más valorados */}
      <ProductBanners />

    </div>
  )
}
