import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import Coupon from '@/models/Coupon'
import { requireRole } from '@/lib/auth-middleware'
import { USER_ROLES, COUPON_TYPES, COUPON_STATUS } from '@/constants'

export async function GET(request: NextRequest) {
  try {
    const { user } = await requireRole(request, [USER_ROLES.ADMIN])
    await connectToDatabase()

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '50')
    const page = parseInt(searchParams.get('page') || '1')

    // Construir query
    const query: any = {}
    
    if (status && status !== 'all') {
      query.status = status
    }
    
    if (search) {
      query.$or = [
        { code: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ]
    }

    // Obtener cupones con paginación
    const skip = (page - 1) * limit
    
    const coupons = await Coupon.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()

    // Obtener total de cupones para paginación
    const total = await Coupon.countDocuments(query)

    return NextResponse.json({
      coupons,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Get admin coupons error:', error)
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

    const couponData = await request.json()

    // Validar campos requeridos
    const requiredFields = ['code', 'type', 'value', 'description']
    for (const field of requiredFields) {
      if (!couponData[field]) {
        return NextResponse.json(
          { error: `Campo requerido: ${field}` },
          { status: 400 }
        )
      }
    }

    // Verificar que el código no exista
    const existingCoupon = await Coupon.findOne({ code: couponData.code.toUpperCase() })
    if (existingCoupon) {
      return NextResponse.json(
        { error: 'El código de cupón ya existe' },
        { status: 409 }
      )
    }

    // Crear nuevo cupón
    const newCoupon = await Coupon.create({
      ...couponData,
      code: couponData.code.toUpperCase(),
      status: couponData.status || 'active',
      createdAt: new Date()
    })

      return NextResponse.json({
        message: 'Cupón creado exitosamente',
        coupon: newCoupon
      }, { status: 201 })

    } catch (error) {
      console.error('Create admin coupon error:', error)
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

    const { couponId, ...updateData } = await request.json()

    if (!couponId) {
      return NextResponse.json(
        { error: 'ID del cupón es requerido' },
        { status: 400 }
      )
    }

    // Si se está actualizando el código, verificar que no exista
    if (updateData.code) {
      const existingCoupon = await Coupon.findOne({ 
        code: updateData.code.toUpperCase(),
        _id: { $ne: couponId }
      })
      if (existingCoupon) {
        return NextResponse.json(
          { error: 'El código de cupón ya existe' },
          { status: 409 }
        )
      }
      updateData.code = updateData.code.toUpperCase()
    }

    // Buscar y actualizar el cupón
    const coupon = await Coupon.findByIdAndUpdate(
      couponId,
      { ...updateData, updatedAt: new Date() },
      { new: true }
    )

    if (!coupon) {
      return NextResponse.json(
        { error: 'Cupón no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      message: 'Cupón actualizado exitosamente',
      coupon
    })

  } catch (error) {
    console.error('Update admin coupon error:', error)
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
    const couponId = searchParams.get('id')

    if (!couponId) {
      return NextResponse.json(
        { error: 'ID del cupón es requerido' },
        { status: 400 }
      )
    }

    const coupon = await Coupon.findByIdAndDelete(couponId)

    if (!coupon) {
      return NextResponse.json(
        { error: 'Cupón no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      message: 'Cupón eliminado exitosamente'
    })

  } catch (error) {
    console.error('Delete admin coupon error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}