import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import Promotion from '@/models/Promotion'
import { requireRole } from '@/lib/auth-middleware'
import { USER_ROLES } from '@/constants'

export async function GET(request: NextRequest) {
  try {
    const { user } = await requireRole(request, [USER_ROLES.ADMIN])
    
    await connectToDatabase()

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const type = searchParams.get('type')
    const limit = parseInt(searchParams.get('limit') || '50')
    const page = parseInt(searchParams.get('page') || '1')

    // Construir query
    const query: any = {}
    
    if (status && status !== 'all') {
      if (status === 'active') {
        query.isActive = true
      } else if (status === 'inactive') {
        query.isActive = false
      }
    }
    
    if (type && type !== 'all') {
      query.type = type
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ]
    }

    // Obtener promociones con paginación y populate
    const skip = (page - 1) * limit
    
    const promotions = await Promotion.find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()

    // Transformar datos para el frontend
    const transformedPromotions = promotions.map((promotion: any) => ({
      _id: promotion._id,
      name: promotion.name,
      description: promotion.description,
      type: promotion.type,
      value: promotion.value,
      minAmount: promotion.minAmount,
      maxDiscount: promotion.maxDiscount,
      startDate: promotion.startDate,
      endDate: promotion.endDate,
      isActive: promotion.isActive,
      usageLimit: promotion.usageLimit,
      usedCount: promotion.usedCount,
      createdBy: {
        name: promotion.createdBy?.name || 'Admin',
        email: promotion.createdBy?.email || 'N/A'
      },
      createdAt: promotion.createdAt,
      updatedAt: promotion.updatedAt
    }))

    // Obtener total de promociones para paginación
    const total = await Promotion.countDocuments(query)

    return NextResponse.json({
      promotions: transformedPromotions,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Get admin promotions error:', error)
    
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

    const promotionData = await request.json()

    // Validar campos requeridos
    const requiredFields = ['name', 'description', 'type', 'value', 'startDate', 'endDate', 'usageLimit']
    for (const field of requiredFields) {
      if (!promotionData[field]) {
        return NextResponse.json(
          { error: `Campo requerido: ${field}` },
          { status: 400 }
        )
      }
    }

    // Validar fechas
    const startDate = new Date(promotionData.startDate)
    const endDate = new Date(promotionData.endDate)
    
    if (startDate >= endDate) {
      return NextResponse.json(
        { error: 'La fecha de fin debe ser posterior a la fecha de inicio' },
        { status: 400 }
      )
    }

    // Validar valor según tipo
    if (promotionData.type === 'percentage' && (promotionData.value < 0 || promotionData.value > 100)) {
      return NextResponse.json(
        { error: 'El porcentaje debe estar entre 0 y 100' },
        { status: 400 }
      )
    }

    if (promotionData.type === 'fixed_amount' && promotionData.value < 0) {
      return NextResponse.json(
        { error: 'El monto fijo debe ser mayor a 0' },
        { status: 400 }
      )
    }

    // Crear nueva promoción
    const newPromotion = await Promotion.create({
      name: promotionData.name,
      description: promotionData.description,
      type: promotionData.type,
      value: promotionData.value,
      minAmount: promotionData.minAmount || 0,
      maxDiscount: promotionData.maxDiscount || 0,
      startDate: startDate,
      endDate: endDate,
      isActive: promotionData.isActive !== false, // Default true
      usageLimit: promotionData.usageLimit,
      usedCount: 0,
      applicableProducts: promotionData.applicableProducts || [],
      excludedProducts: promotionData.excludedProducts || [],
      applicableCategories: promotionData.applicableCategories || [],
      excludedCategories: promotionData.excludedCategories || [],
      createdBy: user.id
    })

    return NextResponse.json({
      message: 'Promoción creada exitosamente',
      promotion: {
        _id: newPromotion._id,
        name: newPromotion.name,
        description: newPromotion.description,
        type: newPromotion.type,
        value: newPromotion.value,
        isActive: newPromotion.isActive
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Create admin promotion error:', error)
    
    if (error instanceof Error && error.name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Datos de promoción inválidos' },
        { status: 400 }
      )
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

    const { promotionId, ...updateData } = await request.json()

    if (!promotionId) {
      return NextResponse.json(
        { error: 'ID de la promoción es requerido' },
        { status: 400 }
      )
    }

    // Buscar la promoción
    const promotion = await Promotion.findById(promotionId)
    if (!promotion) {
      return NextResponse.json(
        { error: 'Promoción no encontrada' },
        { status: 404 }
      )
    }

    // Validar fechas si se están actualizando
    if (updateData.startDate && updateData.endDate) {
      const startDate = new Date(updateData.startDate)
      const endDate = new Date(updateData.endDate)
      
      if (startDate >= endDate) {
        return NextResponse.json(
          { error: 'La fecha de fin debe ser posterior a la fecha de inicio' },
          { status: 400 }
        )
      }
    }

    // Actualizar la promoción
    const updatedPromotion = await Promotion.findByIdAndUpdate(
      promotionId,
      updateData,
      { new: true, runValidators: true }
    )

    return NextResponse.json({
      message: 'Promoción actualizada exitosamente',
      promotion: {
        _id: updatedPromotion._id,
        name: updatedPromotion.name,
        description: updatedPromotion.description,
        type: updatedPromotion.type,
        value: updatedPromotion.value,
        isActive: updatedPromotion.isActive
      }
    })

  } catch (error) {
    console.error('Update admin promotion error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { user } = await requireRole(request, [USER_ROLES.ADMIN])
    
    await connectToDatabase()

    const { searchParams } = new URL(request.url)
    const promotionId = searchParams.get('id')

    if (!promotionId) {
      return NextResponse.json(
        { error: 'ID de la promoción es requerido' },
        { status: 400 }
      )
    }

    // Buscar y eliminar la promoción
    const promotion = await Promotion.findByIdAndDelete(promotionId)
    
    if (!promotion) {
      return NextResponse.json(
        { error: 'Promoción no encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      message: 'Promoción eliminada exitosamente'
    })

  } catch (error) {
    console.error('Delete admin promotion error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}