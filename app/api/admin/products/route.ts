import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import Product from '@/models/Product'
import { USER_ROLES } from '@/constants'
import { requireRole } from '@/lib/auth-middleware'

export async function GET(request: NextRequest) {
  try {
    const { user } = await requireRole(request, [USER_ROLES.ADMIN])
    
      await connectToDatabase()

      const { searchParams } = new URL(request.url)
      const status = searchParams.get('status')
      const category = searchParams.get('category')
      const supplier = searchParams.get('supplier')
      const limit = parseInt(searchParams.get('limit') || '50')
      const page = parseInt(searchParams.get('page') || '1')

      // Construir query
      const query: any = {}
      
      if (status && status !== 'all') {
        query.approvalStatus = status
      }
      
      if (category && category !== 'all') {
        query.category = category
      }
      
      if (supplier) {
        query.supplierName = { $regex: supplier, $options: 'i' }
      }

      // Obtener productos con paginación
      const skip = (page - 1) * limit
      
      const products = await Product.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()

      // Obtener total de productos para paginación
      const total = await Product.countDocuments(query)

      return NextResponse.json({
        products,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      })

    } catch (error) {
      console.error('Get admin products error:', error)
      return NextResponse.json(
        { error: 'Error interno del servidor' },
        { status: 500 }
      )
    }
}