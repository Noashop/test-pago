import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import SiteStats from '@/models/SiteStats'
import Product from '@/models/Product'
import User from '@/models/User'
import Order from '@/models/Order'
import { requireAuth, requireRole } from '@/lib/auth-middleware'

// Función para calcular estadísticas en tiempo real
async function calculateRealTimeStats(stat: any) {
  if (!stat.isRealTime || !stat.calculation?.model) {
    return stat.value
  }

  try {
    let Model
    switch (stat.calculation.model) {
      case 'Product':
        Model = Product
        break
      case 'User':
        Model = User
        break
      case 'Order':
        Model = Order
        break
      default:
        return stat.value
    }

    const filter = stat.calculation.filter || {}
    
    if (stat.calculation.field === 'count') {
      const count = await Model.countDocuments(filter)
      return count.toString()
    } else if (stat.calculation.field === 'sum') {
      const result = await Model.aggregate([
        { $match: filter },
        { $group: { _id: null, total: { $sum: `$${stat.calculation.field}` } } }
      ])
      return result[0]?.total?.toString() || '0'
    }

    return stat.value
  } catch (error) {
    console.error('Error calculating real-time stat:', error)
    return stat.value
  }
}

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase()
    
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const active = searchParams.get('active') !== 'false'
    const realTime = searchParams.get('realTime') === 'true'

    let query: any = {}
    
    if (category) query.category = category
    if (active) query.isActive = true

    const stats = await SiteStats.find(query)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .sort({ order: 1, createdAt: 1 })

    // Calcular estadísticas en tiempo real si se solicita
    if (realTime) {
      for (let stat of stats) {
        stat.value = await calculateRealTimeStats(stat)
      }
    }

    return NextResponse.json({
      success: true,
      stats
    })

  } catch (error) {
    console.error('Error fetching site stats:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener estadísticas del sitio' },
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
      label,
      value,
      suffix,
      description,
      icon,
      color,
      category,
      isRealTime,
      calculation,
      order
    } = body

    // Validar campos requeridos
    if (!key || !label || (!value && !isRealTime)) {
      return NextResponse.json(
        { success: false, error: 'Campos requeridos: key, label, value (o isRealTime)' },
        { status: 400 }
      )
    }

    // Verificar que la key sea única
    const existingStat = await SiteStats.findOne({ key })
    if (existingStat) {
      return NextResponse.json(
        { success: false, error: 'Ya existe una estadística con esta clave' },
        { status: 400 }
      )
    }

    const newStat = new SiteStats({
      key,
      label,
      value: value || '0',
      suffix,
      description,
      icon,
      color,
      category: category || 'main',
      isRealTime: isRealTime || false,
      calculation,
      order: order || 0,
      isActive: true,
      createdBy: user.id,
      updatedBy: user.id
    })

    await newStat.save()
    await newStat.populate('createdBy', 'name email')

    return NextResponse.json({
      success: true,
      message: 'Estadística creada exitosamente',
      stat: newStat
    })

  } catch (error) {
    console.error('Error creating site stat:', error)
    return NextResponse.json(
      { success: false, error: 'Error al crear estadística del sitio' },
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

    const stat = await SiteStats.findById(id)
    if (!stat) {
      return NextResponse.json(
        { success: false, error: 'Estadística no encontrada' },
        { status: 404 }
      )
    }

    // Actualizar campos
    Object.keys(updateData).forEach(key => {
      if (key !== 'createdBy' && key !== 'createdAt') {
        stat[key] = updateData[key]
      }
    })
    
    stat.updatedBy = user.id
    await stat.save()
    await stat.populate('createdBy updatedBy', 'name email')

    return NextResponse.json({
      success: true,
      message: 'Estadística actualizada exitosamente',
      stat
    })

  } catch (error) {
    console.error('Error updating site stat:', error)
    return NextResponse.json(
      { success: false, error: 'Error al actualizar estadística del sitio' },
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

    const stat = await SiteStats.findByIdAndDelete(id)
    if (!stat) {
      return NextResponse.json(
        { success: false, error: 'Estadística no encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Estadística eliminada exitosamente'
    })

  } catch (error) {
    console.error('Error deleting site stat:', error)
    return NextResponse.json(
      { success: false, error: 'Error al eliminar estadística del sitio' },
      { status: 500 }
    )
  }
}
