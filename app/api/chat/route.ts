import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import Chat from '@/models/Chat'
import User from '@/models/User'
import { requireRole } from '@/lib/auth-middleware'
import { USER_ROLES } from '@/constants'

export async function GET(request: NextRequest) {
  try {
    // Permitir ADMIN y SUPPLIER
    const { user } = await requireRole(request, [USER_ROLES.ADMIN, USER_ROLES.SUPPLIER])
    await connectToDatabase()
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const page = parseInt(searchParams.get('page') || '1')
    const type = searchParams.get('type') || undefined

    // Consultar por participación del usuario y tipo opcional
    const query: any = {
      isActive: true,
      'participants.userId': user.id,
    }
    if (type) query.chatType = type

    const skip = (page - 1) * limit

    const chats = await Chat.find(query)
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
    console.error('Get chats error:', error)
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
    const body = await request.json()
    const { orderId, supplierId, customerId, message, messageType = 'text' } = body || {}

    if (!orderId) {
      return NextResponse.json(
        { error: 'orderId es requerido para crear o continuar un chat' },
        { status: 400 }
      )
    }
    if (!message) {
      return NextResponse.json(
        { error: 'message es requerido' },
        { status: 400 }
      )
    }
    if (!supplierId && !customerId) {
      return NextResponse.json(
        { error: 'Debe especificar supplierId y/o customerId' },
        { status: 400 }
      )
    }

    // Determinar tipo de chat segun participantes dados
    let chatType: 'customer_supplier' | 'customer_admin' | 'supplier_admin'
    if (supplierId && customerId) chatType = 'customer_supplier'
    else if (customerId) chatType = 'customer_admin'
    else chatType = 'supplier_admin'

    // Obtener datos de participantes
    const participantsDocs = await User.find({
      _id: { $in: [supplierId, customerId].filter(Boolean) }
    }).lean()

    const getUserInfo = (id?: string) => {
      if (!id) return null
      if (id === user.id) return { userId: user.id, userName: (user as any).name || 'Admin', userRole: user.role }
      const u = participantsDocs.find((p: any) => String(p._id) === String(id))
      return u ? { userId: String(u._id), userName: u.name || u.email || 'Usuario', userRole: u.role } : { userId: id, userName: 'Usuario', userRole: 'client' }
    }

    const participants: any[] = []
    if (chatType === 'customer_supplier') {
      const sup = getUserInfo(supplierId)
      const cli = getUserInfo(customerId)
      if (!sup || !cli) {
        return NextResponse.json(
          { error: 'No se encontraron participantes válidos' },
          { status: 400 }
        )
      }
      participants.push(sup, cli)
    } else if (chatType === 'customer_admin') {
      participants.push(getUserInfo(customerId), { userId: user.id, userName: (user as any).name || 'Admin', userRole: 'admin' })
    } else {
      participants.push(getUserInfo(supplierId), { userId: user.id, userName: (user as any).name || 'Admin', userRole: 'admin' })
    }

    // Generar chatId determinístico por caso
    const idsForKey = participants.map(p => p?.userId).filter(Boolean).sort().join(':')
    const chatIdKey = `${chatType}:${orderId}:${idsForKey}`

    // Buscar o crear chat
    let chat = await Chat.findOne({ chatId: chatIdKey })
    if (!chat) {
      chat = await Chat.create({
        chatId: chatIdKey,
        chatType,
        participants: participants as any,
        orderId,
        messages: [],
        isActive: true,
      })
    }

    const newMessage = {
      senderId: user.id as any,
      senderName: (user as any).name || 'Admin',
      senderRole: user.role,
      content: message,
      messageType,
      timestamp: new Date(),
      isRead: false,
    } as any

    chat.messages.push(newMessage)
    chat.lastMessage = {
      content: message,
      timestamp: new Date(),
      senderName: (user as any).name || 'Admin',
    }
    chat.updatedAt = new Date()
    await chat.save()

    return NextResponse.json({
      message: 'Mensaje enviado exitosamente',
      chat
    })

  } catch (error) {
    console.error('Create chat error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
 