import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import Notification from '@/models/Notification'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { withRateLimit } from '@/lib/rate-limit'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    await connectToDatabase()

    const notification = await Notification.findOneAndUpdate(
      { 
        _id: id, 
        userId: session.user.id 
      },
      { isRead: true },
      { new: true }
    )

    if (!notification) {
      return NextResponse.json(
        { success: false, error: 'Notificación no encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: notification
    })

  } catch (error) {
    console.error('Mark Notification Read Error:', error)
    return NextResponse.json(
      { success: false, error: 'Error al marcar notificación' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    await connectToDatabase()

    const notification = await Notification.findOneAndDelete({
      _id: id,
      userId: session.user.id
    })

    if (!notification) {
      return NextResponse.json(
        { success: false, error: 'Notificación no encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Notificación eliminada'
    })

  } catch (error) {
    console.error('Delete Notification Error:', error)
    return NextResponse.json(
      { success: false, error: 'Error al eliminar notificación' },
      { status: 500 }
    )
  }
} 