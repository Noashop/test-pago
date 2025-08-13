import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import Review from '@/models/Review'
import { requireRole } from '@/lib/auth-middleware'
import { USER_ROLES } from '@/constants'

// POST /api/products/[id]/reviews/[reviewId]/vote - Vote on a review (helpful/not helpful)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string, reviewId: string }> }
) {
  try {
    const { user } = await requireRole(request, [USER_ROLES.CLIENT, USER_ROLES.SUPPLIER])
    await connectToDatabase()

    const { id, reviewId } = await params
    const { helpful } = await request.json()

    // Validate helpful parameter
    if (typeof helpful !== 'boolean') {
      return NextResponse.json(
        { error: 'El parámetro "helpful" debe ser true o false' },
        { status: 400 }
      )
    }

    // Find the review
    const review = await Review.findById(reviewId)
    if (!review) {
      return NextResponse.json(
        { error: 'Reseña no encontrada' },
        { status: 404 }
      )
    }

    // Check if review belongs to the product
    if (review.productId.toString() !== id) {
      return NextResponse.json(
        { error: 'La reseña no pertenece a este producto' },
        { status: 400 }
      )
    }

    // Prevent users from voting on their own reviews
    if (review.userId.toString() === user.id) {
      return NextResponse.json(
        { error: 'No puedes votar en tu propia reseña' },
        { status: 400 }
      )
    }

    const userId = user.id

    // Check if user has already voted
    const hasVotedHelpful = review.helpfulVotes.includes(userId)
    const hasVotedNotHelpful = review.notHelpfulVotes.includes(userId)

    if (helpful) {
      // User wants to vote helpful
      if (hasVotedHelpful) {
        // Remove helpful vote (toggle off)
        await Review.findByIdAndUpdate(reviewId, {
          $pull: { helpfulVotes: userId },
          $inc: { helpful: -1 }
        })
        
        return NextResponse.json({
          message: 'Voto útil removido',
          action: 'removed_helpful'
        })
      } else {
        // Add helpful vote
        const updateQuery: any = {
          $addToSet: { helpfulVotes: userId },
          $inc: { helpful: 1 }
        }

        // If user had voted not helpful, remove that vote
        if (hasVotedNotHelpful) {
          updateQuery.$pull = { notHelpfulVotes: userId }
          updateQuery.$inc.notHelpful = -1
        }

        await Review.findByIdAndUpdate(reviewId, updateQuery)

        return NextResponse.json({
          message: 'Marcado como útil',
          action: hasVotedNotHelpful ? 'switched_to_helpful' : 'added_helpful'
        })
      }
    } else {
      // User wants to vote not helpful
      if (hasVotedNotHelpful) {
        // Remove not helpful vote (toggle off)
        await Review.findByIdAndUpdate(reviewId, {
          $pull: { notHelpfulVotes: userId },
          $inc: { notHelpful: -1 }
        })

        return NextResponse.json({
          message: 'Voto no útil removido',
          action: 'removed_not_helpful'
        })
      } else {
        // Add not helpful vote
        const updateQuery: any = {
          $addToSet: { notHelpfulVotes: userId },
          $inc: { notHelpful: 1 }
        }

        // If user had voted helpful, remove that vote
        if (hasVotedHelpful) {
          updateQuery.$pull = { helpfulVotes: userId }
          updateQuery.$inc.helpful = -1
        }

        await Review.findByIdAndUpdate(reviewId, updateQuery)

        return NextResponse.json({
          message: 'Marcado como no útil',
          action: hasVotedHelpful ? 'switched_to_not_helpful' : 'added_not_helpful'
        })
      }
    }

  } catch (error) {
    console.error('Vote review error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
