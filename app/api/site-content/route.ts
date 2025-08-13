import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import SiteContent from '@/models/SiteContent'
import { requireAuth, requireRole } from '@/lib/auth-middleware'

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase()
    
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const key = searchParams.get('key')
    const active = searchParams.get('active') !== 'false'

    let query: any = {}
    
    if (type) query.type = type
    if (key) query.key = key
    if (active) query['metadata.isActive'] = true

    const content = await SiteContent.find(query)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .sort({ 'metadata.order': 1, createdAt: 1 })

    return NextResponse.json({
      success: true,
      content
    })

  } catch (error) {
    console.error('Error fetching site content:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener contenido del sitio' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user } = await requireAuth(request)
    await requireRole(request, ['admin'])
    
    await connectToDatabase()
    
    const body = await request.json()
    const {
      key,
      type,
      title,
      subtitle,
      description,
      content,
      metadata,
      seo
    } = body

    // Validar campos requeridos
    if (!key || !type || !title) {
      return NextResponse.json(
        { success: false, error: 'Campos requeridos: key, type, title' },
        { status: 400 }
      )
    }

    // Verificar que la key sea única
    const existingContent = await SiteContent.findOne({ key })
    if (existingContent) {
      return NextResponse.json(
        { success: false, error: 'Ya existe contenido con esta clave' },
        { status: 400 }
      )
    }

    const newContent = new SiteContent({
      key,
      type,
      title,
      subtitle,
      description,
      content,
      metadata: {
        ...metadata,
        isActive: metadata?.isActive ?? true,
        order: metadata?.order ?? 0
      },
      seo,
      createdBy: user.id,
      updatedBy: user.id
    })

    await newContent.save()
    await newContent.populate('createdBy', 'name email')

    return NextResponse.json({
      success: true,
      message: 'Contenido creado exitosamente',
      content: newContent
    })

  } catch (error) {
    console.error('Error creating site content:', error)
    return NextResponse.json(
      { success: false, error: 'Error al crear contenido del sitio' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { user } = await requireAuth(request)
    await requireRole(request, ['admin'])
    
    await connectToDatabase()
    
    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID requerido' },
        { status: 400 }
      )
    }

    const content = await SiteContent.findById(id)
    if (!content) {
      return NextResponse.json(
        { success: false, error: 'Contenido no encontrado' },
        { status: 404 }
      )
    }

    // Actualizar campos
    Object.keys(updateData).forEach(key => {
      if (key !== 'createdBy' && key !== 'createdAt') {
        content[key] = updateData[key]
      }
    })
    
    content.updatedBy = user.id
    await content.save()
    await content.populate('createdBy updatedBy', 'name email')

    return NextResponse.json({
      success: true,
      message: 'Contenido actualizado exitosamente',
      content
    })

  } catch (error) {
    console.error('Error updating site content:', error)
    return NextResponse.json(
      { success: false, error: 'Error al actualizar contenido del sitio' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { user } = await requireAuth(request)
    await requireRole(request, ['admin'])
    
    await connectToDatabase()
    
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID requerido' },
        { status: 400 }
      )
    }

    const content = await SiteContent.findByIdAndDelete(id)
    if (!content) {
      return NextResponse.json(
        { success: false, error: 'Contenido no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Contenido eliminado exitosamente'
    })

  } catch (error) {
    console.error('Error deleting site content:', error)
    return NextResponse.json(
      { success: false, error: 'Error al eliminar contenido del sitio' },
      { status: 500 }
    )
  }
}
