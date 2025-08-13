import { NextRequest } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import Notification from '@/models/Notification'
import { requireAuth } from '@/lib/auth-middleware'
import { jsonOk, jsonError } from '@/lib/api-response'

export async function GET(request: NextRequest) {
  try {
    const { user } = await requireAuth(request)
    await connectToDatabase()

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const unreadOnly = searchParams.get('unreadOnly') === 'true'

    const query: any = { userId: user.id }
    if (unreadOnly) query.isRead = false

    const [notifications, total] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Notification.countDocuments(query)
    ])

    const totalPages = Math.ceil(total / limit)
    return jsonOk({ notifications, pagination: { page, limit, total, totalPages } })
  } catch (error) {
    console.error('Get notifications error:', error)
    return jsonError('Error al obtener notificaciones', 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user } = await requireAuth(request)
    await connectToDatabase()
    const { notificationIds, markAll } = await request.json()

    if (!notificationIds && !markAll) return jsonError('IDs de notificación o markAll es requerido', 400)

    if (markAll) {
      await Notification.updateMany({ userId: user.id, isRead: false }, { isRead: true })
    } else {
      await Notification.updateMany({ _id: { $in: notificationIds }, userId: user.id }, { isRead: true })
    }
    return jsonOk({ message: 'Notificaciones marcadas como leídas' })
  } catch (error) {
    console.error('Mark notifications as read error:', error)
    return jsonError('Error al marcar notificaciones como leídas', 500)
  }
}