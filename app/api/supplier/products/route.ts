import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import Product from '@/models/Product'
import { requireRole } from '@/lib/auth-middleware'
import { USER_ROLES } from '@/constants'

// GET /api/supplier/products - Get supplier's products
export async function GET(request: NextRequest) {
  try {
    const { user } = await requireRole(request, [USER_ROLES.SUPPLIER])
    await connectToDatabase()

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')
    const approvalStatus = searchParams.get('approvalStatus')
    const category = searchParams.get('category')
    const search = searchParams.get('search')

    const skip = (page - 1) * limit

    // Build query for supplier's products
    const query: any = {
      supplierId: user.id
    }

    if (status) {
      query.status = status
    }

    if (approvalStatus) {
      query.approvalStatus = approvalStatus
    }

    if (category) {
      query.category = category
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } }
      ]
    }

    const [products, total] = await Promise.all([
      Product.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('category', 'name')
        .lean(),
      Product.countDocuments(query)
    ])

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      products,
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
    console.error('Get supplier products error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// POST /api/supplier/products - Create new product
export async function POST(request: NextRequest) {
  try {
    const { user } = await requireRole(request, [USER_ROLES.SUPPLIER])
    await connectToDatabase()

    const productData = await request.json()

    // Validate required fields
    const requiredFields = ['name', 'description', 'salePrice', 'category']
    for (const field of requiredFields) {
      if (!productData[field]) {
        return NextResponse.json(
          { error: `${field} es requerido` },
          { status: 400 }
        )
      }
    }

    // Validate price
    if (productData.salePrice <= 0) {
      return NextResponse.json(
        { error: 'El precio debe ser mayor a 0' },
        { status: 400 }
      )
    }

    // Create product
    const product = await Product.create({
      ...productData,
      supplierId: user.id,
      approvalStatus: 'pending',
      status: 'active',
      createdAt: new Date()
    })

    await product.populate('category', 'name')

    return NextResponse.json({
      message: 'Producto creado exitosamente',
      product
    }, { status: 201 })

  } catch (error) {
    console.error('Create product error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
} 