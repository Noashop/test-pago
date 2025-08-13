import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import HomepageContent from '@/models/HomepageContent'
import { requireRole } from '@/lib/auth-middleware'
import { USER_ROLES } from '@/constants'

export async function GET(request: NextRequest) {
  try {
    const { user } = await requireRole(request, [USER_ROLES.ADMIN])
    await connectToDatabase()

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const isActive = searchParams.get('isActive')
    const targetAudience = searchParams.get('targetAudience')
    const limit = parseInt(searchParams.get('limit') || '50')
    const page = parseInt(searchParams.get('page') || '1')

    // Construir query
    const query: any = {}
    
    if (type && type !== 'all') {
      query.type = type
    }
    
    if (isActive !== null && isActive !== 'all') {
      query.isActive = isActive === 'true'
    }
    
    if (targetAudience && targetAudience !== 'all') {
      query['content.targetAudience'] = targetAudience
    }

    // Obtener contenido con paginación
    const skip = (page - 1) * limit
    
    const content = await HomepageContent.find(query)
      .populate('createdBy', 'name email')
      .populate('lastModifiedBy', 'name email')
      .sort({ type: 1, position: 1 })
      .skip(skip)
      .limit(limit)
      .lean()

    // Obtener total para paginación
    const total = await HomepageContent.countDocuments(query)

    return NextResponse.json({
      content,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Get homepage content error:', error)
    
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

    const contentData = await request.json()

    // Validar datos requeridos
    if (!contentData.title || !contentData.description || !contentData.type) {
      return NextResponse.json(
        { error: 'Título, descripción y tipo son requeridos' },
        { status: 400 }
      )
    }

    // Si no se especifica posición, obtener la siguiente disponible
    if (!contentData.position) {
      const lastContent = await HomepageContent.findOne({ type: contentData.type })
        .sort({ position: -1 })
        .lean()
      
      contentData.position = lastContent ? (lastContent as any).position + 1 : 0
    }

    // Crear nuevo contenido
    const newContent = new HomepageContent({
      ...contentData,
      createdBy: user.id,
      metrics: {
        views: 0,
        clicks: 0,
        conversions: 0
      }
    })

    await newContent.save()

    // Populate para respuesta
    await newContent.populate('createdBy', 'name email')

    return NextResponse.json({
      message: 'Contenido creado exitosamente',
      content: newContent
    }, { status: 201 })

  } catch (error) {
    console.error('Create homepage content error:', error)
    
    if (error instanceof Error) {
      if (error.name === 'ValidationError') {
        return NextResponse.json(
          { error: 'Datos de contenido inválidos', details: error.message },
          { status: 400 }
        )
      }
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

    const { contentIds, action, updateData } = await request.json()

    if (!contentIds || !Array.isArray(contentIds) || contentIds.length === 0) {
      return NextResponse.json(
        { error: 'IDs de contenido son requeridos' },
        { status: 400 }
      )
    }

    let result
    let message = ''

    switch (action) {
      case 'bulk_activate':
        result = await HomepageContent.updateMany(
          { _id: { $in: contentIds } },
          { 
            isActive: true,
            lastModifiedBy: user.id,
            updatedAt: new Date()
          }
        )
        message = `${result.modifiedCount} contenidos activados`
        break

      case 'bulk_deactivate':
        result = await HomepageContent.updateMany(
          { _id: { $in: contentIds } },
          { 
            isActive: false,
            lastModifiedBy: user.id,
            updatedAt: new Date()
          }
        )
        message = `${result.modifiedCount} contenidos desactivados`
        break

      case 'bulk_delete':
        result = await HomepageContent.deleteMany({ _id: { $in: contentIds } })
        message = `${result.deletedCount} contenidos eliminados`
        break

      case 'reorder':
        if (!updateData || !updateData.positions) {
          return NextResponse.json(
            { error: 'Datos de posición requeridos para reordenar' },
            { status: 400 }
          )
        }

        // Actualizar posiciones
        const updatePromises = updateData.positions.map((item: { id: string, position: number }) =>
          HomepageContent.findByIdAndUpdate(item.id, {
            position: item.position,
            lastModifiedBy: user.id,
            updatedAt: new Date()
          })
        )

        await Promise.all(updatePromises)
        message = 'Orden actualizado exitosamente'
        break

      default:
        return NextResponse.json(
          { error: 'Acción no válida' },
          { status: 400 }
        )
    }

    return NextResponse.json({ message })

  } catch (error) {
    console.error('Bulk update homepage content error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
