import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import Chat from '@/models/Chat'
import { requireRole } from '@/lib/auth-middleware'
import { USER_ROLES } from '@/constants'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    // Permitir tanto ADMIN como SUPPLIER
    const { user } = await requireRole(request, [USER_ROLES.ADMIN, USER_ROLES.SUPPLIER])
    await connectToDatabase()
    const { chatId } = await params

    // Buscar por campo chatId y verificar que el usuario sea participante
    const chat = await Chat.findOne({
      chatId,
      isActive: true,
      'participants.userId': user.id,
    })

    if (!chat) {
      return NextResponse.json(
        { error: 'Chat no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      messages: chat.messages,
      chat: {
        id: chat._id,
        chatId: chat.chatId,
        chatType: chat.chatType,
        participants: chat.participants,
        lastMessage: chat.lastMessage,
      }
    })

  } catch (error) {
    console.error('Get chat messages error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    // Permitir tanto ADMIN como SUPPLIER
    const { user } = await requireRole(request, [USER_ROLES.ADMIN, USER_ROLES.SUPPLIER])
    await connectToDatabase()
    const { chatId } = await params
    const { content, messageType = 'text' } = await request.json()

    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: 'content es requerido' },
        { status: 400 }
      )
    }

    // Buscar por chatId y verificar que el usuario sea participante
    const chat = await Chat.findOne({
      chatId,
      isActive: true,
      'participants.userId': user.id,
    })

    if (!chat) {
      return NextResponse.json(
        { error: 'Chat no encontrado' },
        { status: 404 }
      )
    }

    const newMessage = {
      senderId: user.id as any,
      senderName: (user as any).name || 'Usuario',
      senderRole: user.role,
      content,
      messageType,
      timestamp: new Date(),
      isRead: false,
    } as any

    chat.messages.push(newMessage)
    chat.lastMessage = {
      content,
      timestamp: new Date(),
      senderName: (user as any).name || 'Usuario',
    }
    chat.updatedAt = new Date()
    await chat.save()

    return NextResponse.json({
      message: 'Mensaje enviado exitosamente',
      newMessage,
    })

  } catch (error) {
    console.error('Send message error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
 