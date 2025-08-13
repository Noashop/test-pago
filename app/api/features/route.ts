import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import Feature from '@/models/Feature'
import { requireAuth, requireRole } from '@/lib/auth-middleware'

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase()
    
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const active = searchParams.get('active') !== 'false'

    let query: any = {}
    
    if (category) query.category = category
    if (active) query.isActive = true

    const features = await Feature.find(query)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .sort({ order: 1, createdAt: 1 })

    return NextResponse.json({
      success: true,
      features
    })

  } catch (error) {
    console.error('Error fetching features:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener características' },
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
      title,
      description,
      icon,
      color,
      category,
      order,
      metadata
    } = body

    if (!title || !description || !icon || !color) {
      return NextResponse.json(
        { success: false, error: 'Campos requeridos: title, description, icon, color' },
        { status: 400 }
      )
    }

    const newFeature = new Feature({
      title,
      description,
      icon,
      color,
      category: category || 'why_choose_us',
      order: order || 0,
      metadata,
      isActive: true,
      createdBy: user.id,
      updatedBy: user.id
    })

    await newFeature.save()
    await newFeature.populate('createdBy', 'name email')

    return NextResponse.json({
      success: true,
      message: 'Característica creada exitosamente',
      feature: newFeature
    })

  } catch (error) {
    console.error('Error creating feature:', error)
    return NextResponse.json(
      { success: false, error: 'Error al crear característica' },
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

    const feature = await Feature.findById(id)
    if (!feature) {
      return NextResponse.json(
        { success: false, error: 'Característica no encontrada' },
        { status: 404 }
      )
    }

    Object.keys(updateData).forEach(key => {
      if (key !== 'createdBy' && key !== 'createdAt') {
        feature[key] = updateData[key]
      }
    })
    
    feature.updatedBy = user.id
    await feature.save()
    await feature.populate('createdBy updatedBy', 'name email')

    return NextResponse.json({
      success: true,
      message: 'Característica actualizada exitosamente',
      feature
    })

  } catch (error) {
    console.error('Error updating feature:', error)
    return NextResponse.json(
      { success: false, error: 'Error al actualizar característica' },
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

    const feature = await Feature.findByIdAndDelete(id)
    if (!feature) {
      return NextResponse.json(
        { success: false, error: 'Característica no encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Característica eliminada exitosamente'
    })

  } catch (error) {
    console.error('Error deleting feature:', error)
    return NextResponse.json(
      { success: false, error: 'Error al eliminar característica' },
      { status: 500 }
    )
  }
}
