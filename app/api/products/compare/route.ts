import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import Product from '@/models/Product'
import { requireRole } from '@/lib/auth-middleware'
import { USER_ROLES } from '@/constants'

// GET /api/products/compare - Compare products
export async function GET(request: NextRequest) {
  try {
    const { user } = await requireRole(request, [USER_ROLES.ADMIN])
    await connectToDatabase()

    const { searchParams } = new URL(request.url)
    const productIds = searchParams.get('ids')

    if (!productIds) {
      return NextResponse.json(
        { error: 'IDs de productos son requeridos' },
        { status: 400 }
      )
    }

    const ids = productIds.split(',').filter(id => id.trim())

    if (ids.length < 2) {
      return NextResponse.json(
        { error: 'Se requieren al menos 2 productos para comparar' },
        { status: 400 }
      )
    }

    if (ids.length > 5) {
      return NextResponse.json(
        { error: 'Máximo 5 productos para comparar' },
        { status: 400 }
      )
    }

    const products = await Product.find({
      _id: { $in: ids },
      approvalStatus: 'approved',
      status: 'active'
    })
      .select('name description images salePrice adminRecommendedPrice stock category supplierId createdAt')
      .populate('category', 'name')
      .populate('supplierId', 'businessName')
      .lean()

    if (products.length < 2) {
      return NextResponse.json(
        { error: 'No se encontraron suficientes productos válidos para comparar' },
        { status: 400 }
      )
    }

    // Calculate comparison metrics
    const comparison = products.map((product: any) => ({
      id: product._id,
      name: product.name,
      description: product.description,
      images: product.images,
      salePrice: product.salePrice,
      recommendedPrice: product.adminRecommendedPrice,
      stock: product.stock,
      category: product.category?.name,
      supplier: product.supplierId?.businessName,
      profitMargin: product.adminRecommendedPrice ? 
        ((product.adminRecommendedPrice - product.salePrice) / product.salePrice * 100).toFixed(1) : null,
      profitAmount: product.adminRecommendedPrice ? 
        (product.adminRecommendedPrice - product.salePrice) : null,
      createdAt: product.createdAt
    }))

    return NextResponse.json({
      products: comparison,
      totalProducts: comparison.length
    })

  } catch (error) {
    console.error('Compare products error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
