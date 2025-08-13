import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import Category from '@/models/Category'

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase()
    
    const categories = await Category.find({})
      .select('name slug description icon subcategories')
      .sort({ name: 1 })

    // Verificar que las categorías tengan la estructura correcta
    const validatedCategories = categories.map((category: any) => ({
      _id: category._id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      icon: category.icon,
      subcategories: category.subcategories?.map((sub: any) => ({
        _id: sub._id,
        name: sub.name,
        slug: sub.slug,
        description: sub.description,
        requiredFields: sub.requiredFields || [],
        optionalFields: sub.optionalFields || []
      })) || []
    }))

    return NextResponse.json({ categories: validatedCategories })
  } catch (error) {
    console.error('Get categories error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
