import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectToDatabase } from '@/lib/mongodb'
import Campaign from '@/models/Campaign'
import Notification from '@/models/Notification'
import User from '@/models/User'

// GET - Obtener todas las campañas
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    await connectToDatabase()

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const type = searchParams.get('type') || 'all'
    const status = searchParams.get('status') || 'all'
    const targetAudience = searchParams.get('targetAudience') || 'all'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    // Construir filtros
    const filters: any = {}
    
    if (search) {
      filters.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ]
    }
    
    if (type !== 'all') {
      filters.type = type
    }
    
    if (status !== 'all') {
      filters.status = status
    }
    
    if (targetAudience !== 'all') {
      filters.targetAudience = targetAudience
    }

    // Obtener campañas con paginación
    const campaigns = await Campaign.find(filters)
      .populate('createdBy', 'name email')
      .sort({ priority: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)

    const total = await Campaign.countDocuments(filters)

    return NextResponse.json({
      campaigns,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Error al obtener campañas:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// POST - Crear nueva campaña
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    await connectToDatabase()

    const data = await request.json()
    
    // Validaciones básicas
    if (!data.title || !data.description || !data.content || !data.type) {
      return NextResponse.json({ 
        error: 'Faltan campos requeridos: title, description, content, type' 
      }, { status: 400 })
    }

    // Crear campaña
    const campaign = new Campaign({
      ...data,
      createdBy: session.user.id,
      startDate: new Date(data.startDate),
      endDate: data.endDate ? new Date(data.endDate) : undefined
    })

    await campaign.save()

    // Si la campaña debe enviarse automáticamente como notificación
    if (data.notificationConfig?.autoSend && data.notificationConfig?.showInNotifications) {
      await sendCampaignNotifications(campaign)
    }

    return NextResponse.json({ 
      message: 'Campaña creada exitosamente',
      campaign 
    }, { status: 201 })

  } catch (error) {
    console.error('Error al crear campaña:', error)
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
