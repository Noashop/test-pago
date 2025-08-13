import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import HomepageContent from '@/models/HomepageContent'
import { requireRole } from '@/lib/auth-middleware'
import { USER_ROLES } from '@/constants'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await requireRole(request, [USER_ROLES.ADMIN])
    await connectToDatabase()

    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { error: 'ID del contenido es requerido' },
        { status: 400 }
      )
    }

    const content = await HomepageContent.findById(id)
      .populate('createdBy', 'name email')
      .populate('lastModifiedBy', 'name email')
      .lean()

    if (!content) {
      return NextResponse.json(
        { error: 'Contenido no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({ content })

  } catch (error) {
    console.error('Get homepage content details error:', error)
    
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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await requireRole(request, [USER_ROLES.ADMIN])
    await connectToDatabase()

    const { id } = await params
    const updateData = await request.json()

    if (!id) {
      return NextResponse.json(
        { error: 'ID del contenido es requerido' },
        { status: 400 }
      )
    }

    // Buscar el contenido
    const content = await HomepageContent.findById(id)
    if (!content) {
      return NextResponse.json(
        { error: 'Contenido no encontrado' },
        { status: 404 }
      )
    }

    // Actualizar contenido
    const updatedContent = await HomepageContent.findByIdAndUpdate(
      id,
      {
        ...updateData,
        lastModifiedBy: user.id,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email')
     .populate('lastModifiedBy', 'name email')

    return NextResponse.json({
      message: 'Contenido actualizado exitosamente',
      content: updatedContent
    })

  } catch (error) {
    console.error('Update homepage content error:', error)
    
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await requireRole(request, [USER_ROLES.ADMIN])
    await connectToDatabase()

    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { error: 'ID del contenido es requerido' },
        { status: 400 }
      )
    }

    // Buscar y eliminar el contenido
    const content = await HomepageContent.findByIdAndDelete(id)
    
    if (!content) {
      return NextResponse.json(
        { error: 'Contenido no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      message: 'Contenido eliminado exitosamente',
      deletedContent: {
        id: content._id,
        title: content.title,
        type: content.type
      }
    })

  } catch (error) {
    console.error('Delete homepage content error:', error)
    
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await requireRole(request, [USER_ROLES.ADMIN])
    await connectToDatabase()

    const { id } = await params
    const { action, data } = await request.json()

    if (!id) {
      return NextResponse.json(
        { error: 'ID del contenido es requerido' },
        { status: 400 }
      )
    }

    const content = await HomepageContent.findById(id)
    if (!content) {
      return NextResponse.json(
        { error: 'Contenido no encontrado' },
        { status: 404 }
      )
    }

    let updateData: any = { lastModifiedBy: user.id }
    let message = ''

    switch (action) {
      case 'toggle_active':
        updateData.isActive = !content.isActive
        message = `Contenido ${updateData.isActive ? 'activado' : 'desactivado'}`
        break

      case 'update_position':
        if (typeof data.position !== 'number') {
          return NextResponse.json(
            { error: 'Posición debe ser un número' },
            { status: 400 }
          )
        }
        updateData.position = data.position
        message = 'Posición actualizada'
        break

      case 'increment_views':
        updateData.$inc = { 'metrics.views': 1 }
        message = 'Vista registrada'
        break

      case 'increment_clicks':
        updateData.$inc = { 'metrics.clicks': 1 }
        message = 'Click registrado'
        break

      case 'increment_conversions':
        updateData.$inc = { 'metrics.conversions': 1 }
        message = 'Conversión registrada'
        break

      case 'duplicate':
        const duplicatedContent = new HomepageContent({
          ...content.toObject(),
          _id: undefined,
          title: `${content.title} (Copia)`,
          position: content.position + 1,
          isActive: false,
          createdBy: user.id,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastModifiedBy: undefined,
          metrics: {
            views: 0,
            clicks: 0,
            conversions: 0
          }
        })
        
        await duplicatedContent.save()
        await duplicatedContent.populate('createdBy', 'name email')
        
        return NextResponse.json({
          message: 'Contenido duplicado exitosamente',
          content: duplicatedContent
        })

      default:
        return NextResponse.json(
          { error: 'Acción no válida' },
          { status: 400 }
        )
    }

    const updatedContent = await HomepageContent.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).populate('createdBy', 'name email')
     .populate('lastModifiedBy', 'name email')

    return NextResponse.json({
      message,
      content: updatedContent
    })

  } catch (error) {
    console.error('Update homepage content action error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
