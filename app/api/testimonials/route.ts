import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import Testimonial from '@/models/Testimonial'
import { requireAuth, requireRole } from '@/lib/auth-middleware'

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase()
    
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const type = searchParams.get('type')
    const active = searchParams.get('active') !== 'false'

    let query: any = {}
    
    if (category) query.category = category
    if (type) query.type = type
    if (active) query.isActive = true

    const testimonials = await Testimonial.find(query)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .sort({ order: 1, createdAt: 1 })

    return NextResponse.json({
      success: true,
      testimonials
    })

  } catch (error) {
    console.error('Error fetching testimonials:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener testimonios' },
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
      subtitle,
      description,
      icon,
      author,
      rating,
      category,
      type,
      backgroundColor,
      textColor,
      order
    } = body

    if (!title || !description || !icon) {
      return NextResponse.json(
        { success: false, error: 'Campos requeridos: title, description, icon' },
        { status: 400 }
      )
    }

    const newTestimonial = new Testimonial({
      title,
      subtitle,
      description,
      icon,
      author,
      rating: rating || 5,
      category: category || 'main',
      type: type || 'testimonial',
      backgroundColor,
      textColor,
      order: order || 0,
      isActive: true,
      createdBy: user.id,
      updatedBy: user.id
    })

    await newTestimonial.save()
    await newTestimonial.populate('createdBy', 'name email')

    return NextResponse.json({
      success: true,
      message: 'Testimonio creado exitosamente',
      testimonial: newTestimonial
    })

  } catch (error) {
    console.error('Error creating testimonial:', error)
    return NextResponse.json(
      { success: false, error: 'Error al crear testimonio' },
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

    const testimonial = await Testimonial.findById(id)
    if (!testimonial) {
      return NextResponse.json(
        { success: false, error: 'Testimonio no encontrado' },
        { status: 404 }
      )
    }

    Object.keys(updateData).forEach(key => {
      if (key !== 'createdBy' && key !== 'createdAt') {
        testimonial[key] = updateData[key]
      }
    })
    
    testimonial.updatedBy = user.id
    await testimonial.save()
    await testimonial.populate('createdBy updatedBy', 'name email')

    return NextResponse.json({
      success: true,
      message: 'Testimonio actualizado exitosamente',
      testimonial
    })

  } catch (error) {
    console.error('Error updating testimonial:', error)
    return NextResponse.json(
      { success: false, error: 'Error al actualizar testimonio' },
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

    const testimonial = await Testimonial.findByIdAndDelete(id)
    if (!testimonial) {
      return NextResponse.json(
        { success: false, error: 'Testimonio no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Testimonio eliminado exitosamente'
    })

  } catch (error) {
    console.error('Error deleting testimonial:', error)
    return NextResponse.json(
      { success: false, error: 'Error al eliminar testimonio' },
      { status: 500 }
    )
  }
}
