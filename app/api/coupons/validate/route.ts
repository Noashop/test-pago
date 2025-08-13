import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import Coupon from '@/models/Coupon'
import { requireRole } from '@/lib/auth-middleware'
import { USER_ROLES } from '@/constants'

export async function POST(request: NextRequest) {
  try {
    const { user } = await requireRole(request, [USER_ROLES.ADMIN])
    await connectToDatabase()

    const { code, subtotal } = await request.json()

    if (!code) {
      return NextResponse.json(
        { error: 'Código de cupón es requerido' },
        { status: 400 }
      )
    }

    // Buscar el cupón
    const coupon = await Coupon.findOne({
      code: code.toUpperCase(),
      status: 'active'
    })

    if (!coupon) {
      return NextResponse.json(
        { error: 'Cupón no encontrado' },
        { status: 404 }
      )
    }

    // Verificar si el cupón ha expirado
    if (coupon.expiryDate && new Date() > coupon.expiryDate) {
      return NextResponse.json(
        { error: 'Cupón expirado' },
        { status: 400 }
      )
    }

    // Verificar límite de uso
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      return NextResponse.json(
        { error: 'Cupón agotado' },
        { status: 400 }
      )
    }

    // Verificar monto mínimo
    if (coupon.minimumAmount && subtotal < coupon.minimumAmount) {
      return NextResponse.json(
        { error: `Monto mínimo requerido: $${coupon.minimumAmount}` },
        { status: 400 }
      )
    }

    // Calcular descuento
    let discountAmount = 0
    if (coupon.discountType === 'percentage') {
      discountAmount = (subtotal * coupon.discountValue) / 100
    } else if (coupon.discountType === 'fixed') {
      discountAmount = coupon.discountValue
    }

    const finalTotal = subtotal - discountAmount

    return NextResponse.json({
      valid: true,
      coupon: {
        id: coupon._id,
        code: coupon.code,
        description: coupon.description,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        minimumAmount: coupon.minimumAmount
      },
      discountAmount,
      finalTotal
    })

  } catch (error) {
    console.error('Validate coupon error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
