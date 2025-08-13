import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import Ticket from '@/models/Ticket'
import { requireRoleOrPermission, requireRole } from '@/lib/auth-middleware'
import { USER_ROLES, PAGINATION } from '@/constants'

export async function GET(request: NextRequest) {
  try {
    const { user } = await requireRoleOrPermission(request, [USER_ROLES.ADMIN], ['support'])
    await connectToDatabase()

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const search = searchParams.get('search')
    const limitParam = parseInt(searchParams.get('limit') || '50')
    const limit = Math.min(Math.max(1, limitParam), PAGINATION.MAX_LIMIT)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))

    // Construir query
    const query: any = {}
    
    if (status && status !== 'all') {
      query.status = status
    }
    
    if (priority && priority !== 'all') {
      query.priority = priority
    }
    
    if (search) {
      query.$or = [
        { subject: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { ticketNumber: { $regex: search, $options: 'i' } }
      ]
    }

    // Obtener tickets con paginación y populate
    const skip = (page - 1) * limit
    
    const tickets = await Ticket.find(query)
      .populate('customer', 'name email phone')
      .populate('assignedTo', 'name email')
      .populate('messages.sender', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()

    // Transformar datos para el frontend
    const transformedTickets = tickets.map((ticket: any) => ({
      _id: ticket._id,
      ticketNumber: ticket.ticketNumber,
      subject: ticket.subject,
      description: ticket.description,
      status: ticket.status,
      priority: ticket.priority,
      category: ticket.category,
      customer: {
        _id: ticket.customer?._id,
        name: ticket.customer?.name || 'Cliente no registrado',
        email: ticket.customer?.email || 'N/A',
        phone: ticket.customer?.phone || 'N/A'
      },
      assignedTo: ticket.assignedTo ? {
        _id: ticket.assignedTo._id,
        name: ticket.assignedTo.name,
        email: ticket.assignedTo.email
      } : null,
      messagesCount: ticket.messages?.length || 0,
      lastMessage: ticket.messages?.length > 0 ? {
        content: ticket.messages[ticket.messages.length - 1].content,
        createdAt: ticket.messages[ticket.messages.length - 1].createdAt,
        sender: ticket.messages[ticket.messages.length - 1].sender
      } : null,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt
    }))

    // Obtener total de tickets para paginación
    const total = await Ticket.countDocuments(query)

    // Obtener estadísticas
    const stats = await Promise.all([
      Ticket.countDocuments({ status: 'open' }),
      Ticket.countDocuments({ status: 'in_progress' }),
      Ticket.countDocuments({ status: 'resolved' }),
      Ticket.countDocuments({ priority: 'high' })
    ])

    return NextResponse.json({
      tickets: transformedTickets,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      },
      stats: {
        open: stats[0],
        inProgress: stats[1],
        resolved: stats[2],
        highPriority: stats[3]
      }
    })

  } catch (error) {
    console.error('Get admin support tickets error:', error)
    
    if (error instanceof Error) {
      if (error.message === 'Authentication required') {
        return NextResponse.json(
          { error: 'Autenticación requerida' },
          { status: 401 }
        )
      }
      if (error.message === 'Insufficient permissions') {
        return NextResponse.json(
          { error: 'Permisos insuficientes' },
          { status: 403 }
        )
      }
    }
    
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { user } = await requireRole(request, [USER_ROLES.ADMIN])
    await connectToDatabase()

    const { ticketId, action, ...updateData } = await request.json()

    if (!ticketId) {
      return NextResponse.json(
        { error: 'ID del ticket es requerido' },
        { status: 400 }
      )
    }

    // Buscar el ticket
    const ticket = await Ticket.findById(ticketId)
    if (!ticket) {
      return NextResponse.json(
        { error: 'Ticket no encontrado' },
        { status: 404 }
      )
    }

    let updateFields: any = {}
    let message = ''

    switch (action) {
      case 'assign':
        if (!updateData.assignedTo) {
          return NextResponse.json(
            { error: 'ID del administrador es requerido' },
            { status: 400 }
          )
        }
        updateFields.assignedTo = updateData.assignedTo
        updateFields.status = 'in_progress'
        message = 'Ticket asignado exitosamente'
        break
        
      case 'update_status':
        if (!updateData.status) {
          return NextResponse.json(
            { error: 'Estado es requerido' },
            { status: 400 }
          )
        }
        updateFields.status = updateData.status
        if (updateData.status === 'resolved') {
          updateFields.resolvedAt = new Date()
          updateFields.resolvedBy = user.id
        }
        message = 'Estado del ticket actualizado'
        break
        
      case 'update_priority':
        if (!updateData.priority) {
          return NextResponse.json(
            { error: 'Prioridad es requerida' },
            { status: 400 }
          )
        }
        updateFields.priority = updateData.priority
        message = 'Prioridad del ticket actualizada'
        break
        
      case 'add_message':
        if (!updateData.content) {
          return NextResponse.json(
            { error: 'Contenido del mensaje es requerido' },
            { status: 400 }
          )
        }
        
        const newMessage = {
          sender: user.id,
          content: updateData.content,
          isInternal: updateData.isInternal || false,
          createdAt: new Date()
        }
        
        updateFields.$push = { messages: newMessage }
        updateFields.status = 'in_progress'
        message = 'Mensaje agregado exitosamente'
        break
        
      default:
        return NextResponse.json(
          { error: 'Acción no válida' },
          { status: 400 }
        )
    }

    // Actualizar el ticket
    const updatedTicket = await Ticket.findByIdAndUpdate(
      ticketId,
      updateFields,
      { new: true }
    ).populate('assignedTo', 'name email')

    return NextResponse.json({
      message,
      ticket: {
        _id: updatedTicket._id,
        ticketNumber: updatedTicket.ticketNumber,
        status: updatedTicket.status,
        priority: updatedTicket.priority,
        assignedTo: updatedTicket.assignedTo
      }
    })

  } catch (error) {
    console.error('Update support ticket error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
