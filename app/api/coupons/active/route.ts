import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import Coupon from '@/models/Coupon'

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase()

    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')

    if (code) {
      // Buscar cupón específico
      const coupon = await Coupon.findOne({
        code: code.toUpperCase(),
        status: 'active',
        $and: [
          {
            $or: [
              { expiryDate: { $exists: false } },
              { expiryDate: { $gte: new Date() } }
            ]
          },
          {
            $or: [
              { usageLimit: { $exists: false } },
              { usageCount: { $lt: '$usageLimit' } }
            ]
          }
        ]
      }).lean()

      if (!coupon) {
        return NextResponse.json(
          { error: 'Cupón no válido o expirado' },
          { status: 404 }
        )
      }

      return NextResponse.json({ coupon })
    } else {
      // Obtener todos los cupones activos
      const coupons = await Coupon.find({
        status: 'active',
        $and: [
          {
            $or: [
              { expiryDate: { $exists: false } },
              { expiryDate: { $gte: new Date() } }
            ]
          },
          {
            $or: [
              { usageLimit: { $exists: false } },
              { usageCount: { $lt: '$usageLimit' } }
            ]
          }
        ]
      })
        .select('code description discountType discountValue minimumAmount')
        .lean()

      return NextResponse.json({ coupons })
    }

  } catch (error) {
    console.error('Get active coupons error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
} 