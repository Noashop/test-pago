import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import User from '@/models/User'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { USER_ROLES } from '@/constants'
import { withRateLimit } from '@/lib/rate-limit'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    await connectToDatabase()
    
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== USER_ROLES.ADMIN) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const { adminId, adminName } = await request.json()

    const supplier = await User.findById(id)
    if (!supplier) {
      return NextResponse.json(
        { error: 'Proveedor no encontrado' },
        { status: 404 }
      )
    }

    if (supplier.role !== USER_ROLES.SUPPLIER) {
      return NextResponse.json(
        { error: 'Usuario no es un proveedor' },
        { status: 400 }
      )
    }

    // Update supplier approval status
    supplier.isApproved = true
    supplier.approvalDate = new Date()
    supplier.approvedBy = {
      adminId,
      adminName,
      approvedAt: new Date()
    }
    supplier.rejectionReason = undefined // Clear any previous rejection

    await supplier.save()

    return NextResponse.json({
      message: 'Proveedor aprobado exitosamente',
      supplier: {
        _id: supplier._id,
        name: supplier.name,
        email: supplier.email,
        businessInfo: supplier.businessInfo,
        isApproved: supplier.isApproved,
        approvalDate: supplier.approvalDate,
        approvedBy: supplier.approvedBy
      }
    })

  } catch (error) {
    console.error('Error approving supplier:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
} 