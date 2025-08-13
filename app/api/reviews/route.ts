import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import Review from '@/models/Review'
import Order from '@/models/Order'
import Product from '@/models/Product'
import { requireRole } from '@/lib/auth-middleware'
import { USER_ROLES } from '@/constants'

// GET /api/reviews - Get reviews (with filters)
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase()

    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')
    const userId = searchParams.get('userId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    const skip = (page - 1) * limit
    const query: any = {}

    if (productId) query.productId = productId
    if (userId) query.userId = userId

    const [reviews, total] = await Promise.all([
      Review.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'name image')
        .populate('productId', 'name images')
        .lean(),
      Review.countDocuments(query)
    ])

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      reviews,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    })

  } catch (error) {
    console.error('Get reviews error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// POST /api/reviews - Create a new review
export async function POST(request: NextRequest) {
  try {
    const { user } = await requireRole(request, [USER_ROLES.CLIENT])
    await connectToDatabase()

    const { productId, orderId, rating, comment, title } = await request.json()

    // Validations
    if (!productId || !orderId || !rating) {
      return NextResponse.json(
        { error: 'ProductId, orderId y rating son requeridos' },
        { status: 400 }
      )
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating debe estar entre 1 y 5' },
        { status: 400 }
      )
    }

    // Verify that the user actually purchased this product
    const order = await Order.findOne({
      _id: orderId,
      userId: user.id,
      status: 'delivered',
      'items.productId': productId
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Solo puedes reseñar productos que hayas comprado y recibido' },
        { status: 403 }
      )
    }

    // Check if user already reviewed this product for this order
    const existingReview = await Review.findOne({
      userId: user.id,
      productId,
      orderId
    })

    if (existingReview) {
      return NextResponse.json(
        { error: 'Ya has reseñado este producto para esta orden' },
        { status: 409 }
      )
    }

    // Create review
    const review = await Review.create({
      userId: user.id,
      productId,
      orderId,
      rating,
      comment: comment || '',
      title: title || '',
      isVerifiedPurchase: true,
      createdAt: new Date()
    })

    // Update product rating
    await updateProductRating(productId)

    await review.populate('userId', 'name image')
    await review.populate('productId', 'name images')

    return NextResponse.json({
      message: 'Reseña creada exitosamente',
      review
    }, { status: 201 })

  } catch (error) {
    console.error('Create review error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// Helper function to update product rating
async function updateProductRating(productId: string) {
  try {
    const reviews = await Review.find({ productId })
    
    if (reviews.length > 0) {
      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0)
      const averageRating = totalRating / reviews.length
      
      await Product.findByIdAndUpdate(productId, {
        rating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
        reviewCount: reviews.length
      })
    }
  } catch (error) {
    console.error('Error updating product rating:', error)
  }
}
