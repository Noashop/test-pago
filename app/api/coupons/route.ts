import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import Coupon from '@/models/Coupon'
import { requireRole } from '@/lib/auth-middleware'
import { USER_ROLES, COUPON_TYPES } from '@/constants'

// GET /api/coupons - Get all coupons (Admin only)
export async function GET(request: NextRequest) {
  try {
    const { user } = await requireRole(request, [USER_ROLES.ADMIN])
    await connectToDatabase()

    const { searchParams } = new URL(request.url)
    // Pagination
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')
    const type = searchParams.get('type')

    // Build query
    const query: any = {}
    if (status) query.status = status
    if (type) query.type = type

    const skip = (page - 1) * limit

    const [coupons, total] = await Promise.all([
      Coupon.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('createdBy', 'name email')
        .lean(),
      Coupon.countDocuments(query)
    ])

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      coupons,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    })

  } catch (error) {
    console.error('Error fetching coupons:', error)
    return NextResponse.json(
      { error: 'Failed to fetch coupons' },
      { status: 500 }
    )
  }
}

// POST /api/coupons - Create new coupon (Admin only)
export async function POST(request: NextRequest) {
  try {
    const { user } = await requireRole(request, [USER_ROLES.ADMIN])
    await connectToDatabase()

    const data = await request.json()

    // Validate required fields
    const requiredFields = ['code', 'name', 'type', 'value']
    for (const field of requiredFields) {
      if (!data[field]) {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400 }
        )
      }
    }

    // Validate coupon type
    if (!Object.values(COUPON_TYPES).includes(data.type)) {
      return NextResponse.json(
        { error: 'Invalid coupon type' },
        { status: 400 }
      )
    }

    // Validate value based on type
    if (data.type === COUPON_TYPES.PERCENTAGE && (data.value < 0 || data.value > 100)) {
      return NextResponse.json(
        { error: 'Percentage value must be between 0 and 100' },
        { status: 400 }
      )
    }

    if (data.type === COUPON_TYPES.FIXED_AMOUNT && data.value < 0) {
      return NextResponse.json(
        { error: 'Fixed amount value must be positive' },
        { status: 400 }
      )
    }

    // Check if coupon code already exists
    const existingCoupon = await Coupon.findOne({ 
      code: data.code.toUpperCase() 
    })

    if (existingCoupon) {
      return NextResponse.json(
        { error: 'Coupon code already exists' },
        { status: 409 }
      )
    }

    // Create coupon
    const couponData = {
      ...data,
      code: data.code.toUpperCase(),
      createdBy: user.id,
      usageCount: 0
    }

    const coupon = await Coupon.create(couponData)
    await coupon.populate('createdBy', 'name email')

    return NextResponse.json(
      { 
        message: 'Coupon created successfully',
        coupon 
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('Error creating coupon:', error)
    return NextResponse.json(
      { error: 'Failed to create coupon' },
      { status: 500 }
    )
  }
}