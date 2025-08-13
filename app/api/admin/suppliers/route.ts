import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import User from '@/models/User'
import Product from '@/models/Product'
import { requireRole } from '@/lib/auth-middleware'
import { USER_ROLES } from '@/constants'

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
    const query: any = { role: USER_ROLES.SUPPLIER }
    
    if (status && status !== 'all') {
      if (status === 'approved') {
        query.isApproved = true
      } else if (status === 'pending') {
        query.isApproved = false
      }
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { 'businessInfo.businessName': { $regex: search, $options: 'i' } }
      ]
    }

    // Obtener proveedores con estadísticas
    const skip = (page - 1) * limit
    
    const suppliers = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()

    // Obtener estadísticas de productos para cada proveedor
    const suppliersWithStats = await Promise.all(
      suppliers.map(async (supplier: any) => {
        const [totalProducts, approvedProducts, pendingProducts] = await Promise.all([
          Product.countDocuments({ supplierId: supplier._id }),
          Product.countDocuments({ supplierId: supplier._id, approvalStatus: 'approved' }),
          Product.countDocuments({ supplierId: supplier._id, approvalStatus: 'pending' })
        ])

        return {
          ...supplier,
          stats: {
            totalProducts,
            approvedProducts,
            pendingProducts
          }
        }
      })
    )

    // Obtener total de proveedores para paginación
    const total = await User.countDocuments(query)

    return NextResponse.json({
      suppliers: suppliersWithStats,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Get admin suppliers error:', error)
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

    const { supplierId, action, reason } = await request.json()

    if (!supplierId || !action) {
      return NextResponse.json(
        { error: 'ID del proveedor y acción son requeridos' },
        { status: 400 }
      )
    }

    // Buscar el proveedor
    const supplier = await User.findById(supplierId)

    if (!supplier) {
      return NextResponse.json(
        { error: 'Proveedor no encontrado' },
        { status: 404 }
      )
    }

    if (supplier.role !== 'supplier') {
      return NextResponse.json(
        { error: 'El usuario no es un proveedor' },
        { status: 400 }
      )
    }

    // Actualizar estado según la acción
    if (action === 'approve') {
      supplier.isApproved = true
      supplier.approvedAt = new Date()
      supplier.approvedBy = user.id
    } else if (action === 'reject') {
      supplier.isApproved = false
      supplier.rejectedAt = new Date()
      supplier.rejectedBy = user.id
      supplier.rejectionReason = reason
    } else {
      return NextResponse.json(
        { error: 'Acción no válida' },
        { status: 400 }
      )
    }

    await supplier.save()

    return NextResponse.json({
      message: `Proveedor ${action === 'approve' ? 'aprobado' : 'rechazado'} exitosamente`,
      supplier: {
        id: supplier._id,
        name: supplier.name,
        email: supplier.email,
        isApproved: supplier.isApproved
      }
    })

  } catch (error) {
    console.error('Update admin supplier error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}