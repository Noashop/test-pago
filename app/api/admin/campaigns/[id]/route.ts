import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectToDatabase } from '@/lib/mongodb'
import Campaign from '@/models/Campaign'
import Notification from '@/models/Notification'
import User from '@/models/User'

// GET - Obtener campaña específica
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    await connectToDatabase()
    const { id } = await params

    const campaign = await Campaign.findById(id)
      .populate('createdBy', 'name email')

    if (!campaign) {
      return NextResponse.json({ error: 'Campaña no encontrada' }, { status: 404 })
    }

    return NextResponse.json({ campaign })

  } catch (error) {
    console.error('Error al obtener campaña:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// PUT - Actualizar campaña
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    await connectToDatabase()
    const { id } = await params

    const data = await request.json()
    
    const campaign = await Campaign.findById(id)
    
    if (!campaign) {
      return NextResponse.json({ error: 'Campaña no encontrada' }, { status: 404 })
    }

    // Actualizar campos
    Object.keys(data).forEach(key => {
      if (key === 'startDate' || key === 'endDate') {
        campaign[key] = data[key] ? new Date(data[key]) : data[key]
      } else {
        campaign[key] = data[key]
      }
    })

    await campaign.save()

    // Si se activó la campaña y debe enviarse como notificación
    if (data.status === 'active' && data.notificationConfig?.autoSend && data.notificationConfig?.showInNotifications) {
      await sendCampaignNotifications(campaign)
    }

    return NextResponse.json({ 
      message: 'Campaña actualizada exitosamente',
      campaign 
    })

  } catch (error) {
    console.error('Error al actualizar campaña:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// DELETE - Eliminar campaña
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    await connectToDatabase()
    const { id } = await params

    const campaign = await Campaign.findById(id)
    
    if (!campaign) {
      return NextResponse.json({ error: 'Campaña no encontrada' }, { status: 404 })
    }

    // Solo permitir eliminar campañas en borrador o pausadas
    if (campaign.status === 'active') {
      return NextResponse.json({ 
        error: 'No se puede eliminar una campaña activa. Primero pausala o cancélala.' 
      }, { status: 400 })
    }

    await Campaign.findByIdAndDelete(id)

    return NextResponse.json({ message: 'Campaña eliminada exitosamente' })

  } catch (error) {
    console.error('Error al eliminar campaña:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// Función auxiliar para enviar notificaciones de campaña
async function sendCampaignNotifications(campaign: any) {
  try {
    const filters: any = {}
    
    // Filtrar usuarios según audiencia objetivo
    switch (campaign.targetAudience) {
      case 'clients':
        filters.role = 'client'
        break
      case 'suppliers':
        filters.role = 'supplier'
        break
      case 'both':
        filters.role = { $in: ['client', 'supplier'] }
        break
      case 'all':
        filters.role = { $in: ['client', 'supplier', 'admin'] }
        break
    }

    const users = await User.find(filters).select('_id')
    
    // Crear notificaciones para todos los usuarios objetivo
    const notifications = users.map(user => ({
      userId: user._id,
      title: campaign.title,
      message: campaign.notificationConfig.customMessage || campaign.description,
      type: 'info',
      category: 'system',
      data: {
        campaignId: campaign._id,
        campaignType: campaign.type,
        fullContent: campaign.content
      }
    }))

    if (notifications.length > 0) {
      await Notification.insertMany(notifications)
    }

  } catch (error) {
    console.error('Error al enviar notificaciones de campaña:', error)
  }
}
