import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import Chat from '@/models/Chat'
import Message from '@/models/Message'
import User from '@/models/User'
import { requireRole } from '@/lib/auth-middleware'
import { USER_ROLES } from '@/constants'

export async function GET(request: NextRequest) {
  try {
    const { user } = await requireRole(request, [USER_ROLES.ADMIN])
    await connectToDatabase()

    const { searchParams } = new URL(request.url)
    const participantId = searchParams.get('participantId')
    const orderId = searchParams.get('orderId')
    const limit = parseInt(searchParams.get('limit') || '20')
    const page = parseInt(searchParams.get('page') || '1')

    let query: any = {
      participants: user.id
    }

    if (participantId) {
      query.participants = { $all: [user.id, participantId] }
    }

    if (orderId) {
      query.orderId = orderId
    }

    const skip = (page - 1) * limit

    const chats = await Chat.find(query)
      .populate('participants', 'name email role businessInfo.businessName')
      .populate('lastMessage')
      .populate('orderId', 'orderNumber')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()

    const total = await Chat.countDocuments(query)

    return NextResponse.json({
      chats,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Get admin chats error:', error)
    
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

export async function POST(request: NextRequest) {
  try {
    const { user } = await requireRole(request, [USER_ROLES.ADMIN])
    await connectToDatabase()

    const { participantId, orderId, subject, initialMessage } = await request.json()

    if (!participantId || !initialMessage) {
      return NextResponse.json(
        { error: 'ID del participante y mensaje inicial son requeridos' },
        { status: 400 }
      )
    }

    // Verificar que el participante existe
    const participant = await User.findById(participantId)
    if (!participant) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    // Verificar si ya existe un chat entre estos usuarios para esta orden
    let existingChat
    if (orderId) {
      existingChat = await Chat.findOne({
        participants: { $all: [user.id, participantId] },
        orderId: orderId
      })
    } else {
      existingChat = await Chat.findOne({
        participants: { $all: [user.id, participantId] },
        orderId: { $exists: false }
      })
    }

    let chat
    if (existingChat) {
      chat = existingChat
    } else {
      // Crear nuevo chat
      chat = new Chat({
        participants: [user.id, participantId],
        subject: subject || `Chat con ${participant.name}`,
        orderId: orderId || undefined,
        createdBy: user.id
      })
      await chat.save()
    }

    // Crear mensaje inicial
    const message = new Message({
      chatId: chat._id,
      sender: user.id,
      content: initialMessage,
      type: 'text'
    })
    await message.save()

    // Actualizar último mensaje del chat
    chat.lastMessage = message._id
    chat.updatedAt = new Date()
    await chat.save()

    // Populate para respuesta
    await chat.populate('participants', 'name email role businessInfo.businessName')
    await chat.populate('lastMessage')
    await chat.populate('orderId', 'orderNumber')

    return NextResponse.json({
      message: 'Chat iniciado exitosamente',
      chat
    }, { status: 201 })

  } catch (error) {
    console.error('Create admin chat error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
