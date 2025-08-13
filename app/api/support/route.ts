import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import Ticket from '@/models/Ticket'
import { requireRole } from '@/lib/auth-middleware'
import { USER_ROLES } from '@/constants'

// GET /api/support - Get support tickets
export async function GET(request: NextRequest) {
  try {
    const { user } = await requireRole(request, [USER_ROLES.ADMIN])
    await connectToDatabase()

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')

    const skip = (page - 1) * limit

    // Build query based on user role
    const query: any = {}
    
    if (user.role === USER_ROLES.ADMIN) {
      // Admins can see all tickets
      if (status) query.status = status
      if (priority) query.priority = priority
    } else {
      // Users can only see their own tickets
      query.userId = user.id
      if (status) query.status = status
      if (priority) query.priority = priority
    }

    const [tickets, total] = await Promise.all([
      Ticket.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'name email')
        .lean(),
      Ticket.countDocuments(query)
    ])

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      tickets,
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
    console.error('Get support tickets error:', error)
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

    const { subject, message, priority, category } = await request.json()

    if (!subject || !message) {
      return NextResponse.json(
        { error: 'Asunto y mensaje son requeridos' },
        { status: 400 }
      )
    }

    // Create ticket
    const ticket = await Ticket.create({
      userId: user.id,
      subject,
      message,
      priority: priority || 'medium',
      category: category || 'general',
      status: 'open',
      createdAt: new Date()
    })

    await ticket.populate('userId', 'name email')

    return NextResponse.json({
      message: 'Ticket creado exitosamente',
      ticket
    }, { status: 201 })

  } catch (error) {
    console.error('Create support ticket error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
