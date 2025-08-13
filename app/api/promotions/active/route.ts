import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import Promotion from '@/models/Promotion'

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase()

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const limit = parseInt(searchParams.get('limit') || '10')

    // Construir query para promociones activas
    const query: any = {
      status: 'active'
    }

    // Filtrar por categoría si se especifica
    if (category) {
      query.categories = category
    }

    // Obtener promociones activas
    const promotions = await Promotion.find(query)
      .sort({ priority: -1, createdAt: -1 })
      .limit(limit)
      .lean()

    return NextResponse.json({ promotions })

  } catch (error) {
    console.error('Get active promotions error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
} 