import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import Product from '@/models/Product'
import { requireRole } from '@/lib/auth-middleware'
import { USER_ROLES } from '@/constants'

// GET /api/recommendations - Get product recommendations
export async function GET(request: NextRequest) {
  try {
    const { user } = await requireRole(request, [USER_ROLES.ADMIN])
    await connectToDatabase()

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const limit = parseInt(searchParams.get('limit') || '10')
    const excludeId = searchParams.get('excludeId')

    // Build query
    const query: any = {
      approvalStatus: 'approved',
      status: 'active'
    }

    if (category) {
      query.category = category
    }

    if (excludeId) {
      query._id = { $ne: excludeId }
    }

    // Get recommended products based on user preferences and behavior
    const recommendations = await Product.find(query)
      .sort({ rating: -1, reviewCount: -1 })
      .limit(limit)
      .populate('category', 'name')
      .populate('supplierId', 'businessName')
      .select('name description images salePrice adminRecommendedPrice rating reviewCount category supplierId')
      .lean()

    return NextResponse.json({
      recommendations,
      total: recommendations.length
    })

  } catch (error) {
    console.error('Get recommendations error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
