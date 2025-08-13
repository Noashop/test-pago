import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
// Import models that may not exist yet - using any for now
const NewsletterSubscription = {} as any
const NewsletterCampaign = {} as any
import { requireRole } from '@/lib/auth-middleware'
import { USER_ROLES } from '@/constants'
import crypto from 'crypto'

// GET /api/newsletter - Get newsletter data (Admin only)
export async function GET(request: NextRequest) {
  try {
    const { user } = await requireRole(request, [USER_ROLES.ADMIN])
    await connectToDatabase()

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'subscriptions'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    const skip = (page - 1) * limit

    if (type === 'subscriptions') {
      const [subscriptions, total] = await Promise.all([
        NewsletterSubscription.find()
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        NewsletterSubscription.countDocuments()
      ])

      const totalPages = Math.ceil(total / limit)

      return NextResponse.json({
        subscriptions,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      })

    } else if (type === 'campaigns') {
      const [campaigns, total] = await Promise.all([
        NewsletterCampaign.find()
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate('createdBy', 'name email')
          .lean(),
        NewsletterCampaign.countDocuments()
      ])

      const totalPages = Math.ceil(total / limit)

      return NextResponse.json({
        campaigns,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      })

    } else {
      return NextResponse.json(
        { error: 'Tipo no válido' },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Error fetching newsletter data:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// POST /api/newsletter - Subscribe to newsletter or create campaign
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase()

    const data = await request.json()
    const { action } = data

    if (action === 'subscribe') {
      // Public subscription endpoint
      const { email, preferences, source } = data

      if (!email) {
        return NextResponse.json(
          { error: 'Email es requerido' },
          { status: 400 }
        )
      }

      // Check if already subscribed
      let subscription = await NewsletterSubscription.findOne({ email })

      if (subscription) {
        if (subscription.status === 'active') {
          return NextResponse.json(
            { message: 'Ya estás suscrito a nuestro newsletter' }
          )
        } else {
          // Reactivate subscription
          subscription.status = 'active'
          subscription.confirmed = true
          subscription.confirmedAt = new Date()
          if (preferences) {
            subscription.preferences = { ...subscription.preferences, ...preferences }
          }
          await subscription.save()
        }
      } else {
        // Create new subscription
        const confirmationToken = crypto.randomBytes(32).toString('hex')
        
        subscription = await NewsletterSubscription.create({
          email,
          preferences: preferences || {},
          subscriptionSource: source || 'website',
          confirmed: true, // Auto-confirm for now, can implement double opt-in later
          confirmedAt: new Date(),
          confirmationToken
        })
      }

      return NextResponse.json({
        message: 'Te has suscrito exitosamente al newsletter',
        subscription: {
          email: subscription.email,
          preferences: subscription.preferences
        }
      })

    } else {
      return NextResponse.json(
        { error: 'Acción no válida' },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Error in newsletter action:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// PUT /api/newsletter - Update subscription preferences
export async function PUT(request: NextRequest) {
  try {
    const { user } = await requireRole(request, [USER_ROLES.ADMIN])
    await connectToDatabase()

    const { preferences, segments, tags } = await request.json()

    const subscription = await NewsletterSubscription.findOne({
      $or: [
        { userId: user.id },
        { email: user.email }
      ]
    })

    if (!subscription) {
      return NextResponse.json(
        { error: 'Suscripción no encontrada' },
        { status: 404 }
      )
    }

    if (preferences) {
      subscription.preferences = { ...subscription.preferences, ...preferences }
    }

    if (segments) {
      subscription.segments = segments
    }

    if (tags) {
      subscription.tags = tags
    }

    await subscription.save()

    return NextResponse.json({
      message: 'Preferencias actualizadas exitosamente',
      subscription
    })

  } catch (error) {
    console.error('Error updating subscription:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// DELETE /api/newsletter - Unsubscribe from newsletter
export async function DELETE(request: NextRequest) {
  try {
    const { user } = await requireRole(request, [USER_ROLES.ADMIN])
    await connectToDatabase()

    const subscription = await NewsletterSubscription.findOne({
      $or: [
        { userId: user.id },
        { email: user.email }
      ]
    })

    if (!subscription) {
      return NextResponse.json(
        { error: 'Suscripción no encontrada' },
        { status: 404 }
      )
    }

    subscription.status = 'unsubscribed'
    subscription.unsubscribedAt = new Date()
    await subscription.save()

    return NextResponse.json({
      message: 'Te has desuscrito exitosamente del newsletter'
    })

  } catch (error) {
    console.error('Error unsubscribing:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
