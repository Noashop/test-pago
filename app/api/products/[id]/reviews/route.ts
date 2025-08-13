import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import Review from '@/models/Review'
import Product from '@/models/Product'
import User from '@/models/User'
import { requireRole } from '@/lib/auth-middleware'
import { USER_ROLES } from '@/constants'

// GET /api/products/[id]/reviews - Get all reviews for a product
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase()

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const rating = searchParams.get('rating')

    const skip = (page - 1) * limit

    const { id } = await params
    // Build query
    const query: any = {
      productId: id,
      status: 'approved'
    }

    if (rating) {
      query.rating = parseInt(rating)
    }

    // Build sort object
    const sort: any = {}
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1

    // Get reviews
    const reviews = await Review.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean()

    // Get total count
    const totalReviews = await Review.countDocuments(query)

    // Get rating summary
    const ratingSummary = await (Review as any).getProductRatingSummary(id)

    return NextResponse.json({
      reviews,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalReviews / limit),
        totalReviews,
        hasNextPage: page * limit < totalReviews,
        hasPrevPage: page > 1
      },
      ratingSummary
    })

  } catch (error) {
    console.error('Error fetching reviews:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// POST /api/products/[id]/reviews - Create a new review
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await requireRole(request, [USER_ROLES.CLIENT, USER_ROLES.SUPPLIER])
    await connectToDatabase()

        const { id } = await params
    const reviewData = await request.json()

    // Validate required fields
      const requiredFields = ['rating', 'title', 'comment']
      for (const field of requiredFields) {
        if (!reviewData[field]) {
          return NextResponse.json(
            { error: `El campo ${field} es requerido` },
            { status: 400 }
          )
        }
      }

      // Validate rating
      if (reviewData.rating < 1 || reviewData.rating > 5) {
        return NextResponse.json(
          { error: 'La calificación debe estar entre 1 y 5' },
          { status: 400 }
        )
      }

      // Validate comment length
      if (reviewData.comment.length < 10 || reviewData.comment.length > 1000) {
        return NextResponse.json(
          { error: 'El comentario debe tener entre 10 y 1000 caracteres' },
          { status: 400 }
        )
      }

      // Check if product exists
      const product = await Product.findById(id)
      if (!product) {
        return NextResponse.json(
          { error: 'Producto no encontrado' },
          { status: 404 }
        )
      }

      // Check if user can review this product
      const canReview = await (Review as any).canUserReview(user.id, id)
      if (!canReview.canReview) {
        return NextResponse.json(
          { error: canReview.reason },
          { status: 400 }
        )
      }

      // Get user details
      const userDetails = await User.findById(user.id).select('name email avatar')
      if (!userDetails) {
        return NextResponse.json(
          { error: 'Usuario no encontrado' },
          { status: 404 }
        )
      }

      // Check if this is a verified purchase (optional)
      // This would require checking if the user has purchased this product
      // For now, we'll set verified to false by default

      // Create review
      const newReview = await Review.create({
        productId: id,
        userId: user.id,
        user: {
          name: userDetails.name,
          email: userDetails.email,
          avatar: userDetails.avatar
        },
        rating: reviewData.rating,
        title: reviewData.title.trim(),
        comment: reviewData.comment.trim(),
        images: reviewData.images || [],
        pros: reviewData.pros || [],
        cons: reviewData.cons || [],
        wouldRecommend: reviewData.wouldRecommend !== undefined ? reviewData.wouldRecommend : true,
        verified: false, // TODO: Check if user purchased this product
        status: 'approved' // Auto-approve for now
      })

      return NextResponse.json({
        message: 'Reseña creada exitosamente',
        review: {
          id: newReview._id,
          rating: newReview.rating,
          title: newReview.title,
          comment: newReview.comment,
          createdAt: newReview.createdAt
        }
      }, { status: 201 })

    } catch (error: any) {
      console.error('Error creating review:', error)
      
      // Handle duplicate review error
      if (error.code === 11000) {
        return NextResponse.json(
          { error: 'Ya has reseñado este producto' },
          { status: 400 }
        )
      }

      return NextResponse.json(
        { error: 'Error interno del servidor' },
        { status: 500 }
      )
    }
  }
