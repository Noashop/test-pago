import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectToDatabase } from '@/lib/mongodb'
import DynamicContent from '@/models/DynamicContent'

// GET - Obtener contenido dinámico
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    await connectToDatabase()

    const { searchParams } = new URL(request.url)
    const section = searchParams.get('section')

    let query = {}
    if (section) {
      query = { section }
    }

    const content = await DynamicContent.find(query)
      .populate('createdBy', 'name email')
      .populate('lastModifiedBy', 'name email')
      .sort({ section: 1, order: 1 })

    return NextResponse.json({ content })

  } catch (error) {
    console.error('Error al obtener contenido dinámico:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// POST - Crear nuevo contenido dinámico
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    await connectToDatabase()

    const data = await request.json()
    
    // Validaciones básicas
    if (!data.section || !data.title || !data.content) {
      return NextResponse.json({ 
        error: 'Faltan campos requeridos: section, title, content' 
      }, { status: 400 })
    }

    // Crear contenido dinámico
    const content = new DynamicContent({
      ...data,
      createdBy: session.user.id,
      lastModifiedBy: session.user.id
    })

    await content.save()

    return NextResponse.json({ 
      message: 'Contenido creado exitosamente',
      content 
    }, { status: 201 })

  } catch (error) {
    console.error('Error al crear contenido dinámico:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
