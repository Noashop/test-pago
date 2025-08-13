import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import Wheel from '@/models/Wheel'
import { requireRole } from '@/lib/auth-middleware'
import { USER_ROLES } from '@/constants'

// GET /api/roulette - Get wheel configuration
export async function GET(request: NextRequest) {
  try {
    const { user } = await requireRole(request, [USER_ROLES.ADMIN])
    await connectToDatabase()

    const wheel = await Wheel.findOne({ isActive: true })
      .select('segments spinCost maxSpinsPerDay isActive')
      .lean()

    if (!wheel) {
      return NextResponse.json(
        { error: 'Ruleta no disponible' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      wheel,
      userSpins: 0 // TODO: Implement user spin tracking
    })

  } catch (error) {
    console.error('Get roulette error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user } = await requireRole(request, [USER_ROLES.ADMIN])
    await connectToDatabase()

    const wheel = await Wheel.findOne({ isActive: true })

    if (!wheel) {
      return NextResponse.json(
        { error: 'Ruleta no disponible' },
        { status: 404 }
      )
    }

    // Check if user can spin
    const userSpins = 0 // TODO: Get user's daily spins
    if (userSpins >= wheel.maxSpinsPerDay) {
      return NextResponse.json(
        { error: 'Has alcanzado el límite de giros diarios' },
        { status: 400 }
      )
    }

    // Simulate spin
    const segments = wheel.segments
    const totalWeight = segments.reduce((sum: number, segment: any) => sum + segment.weight, 0)
    let random = Math.random() * totalWeight
    let selectedSegment = null

    for (const segment of segments) {
      random -= segment.weight
      if (random <= 0) {
        selectedSegment = segment
        break
      }
    }

    if (!selectedSegment) {
      selectedSegment = segments[0] // Fallback
    }

    // Record spin
    const spinResult = {
      userId: user.id,
      segmentId: selectedSegment._id,
      prize: selectedSegment.prize,
      timestamp: new Date()
    }

    // TODO: Save spin result to database

    return NextResponse.json({
      message: '¡Giro completado!',
      result: {
        segment: selectedSegment,
        prize: selectedSegment.prize,
        spinId: Date.now().toString()
      }
    })

  } catch (error) {
    console.error('Spin roulette error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
} 