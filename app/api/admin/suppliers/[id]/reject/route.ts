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

    const { reason, adminId, adminName } = await request.json()

    if (!reason || reason.trim().length === 0) {
      return NextResponse.json(
        { error: 'Debe proporcionar una razón para el rechazo' },
        { status: 400 }
      )
    }

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

    // Update supplier rejection status
    supplier.isApproved = false
    supplier.rejectionReason = reason.trim()
    supplier.approvalDate = undefined
    supplier.approvedBy = undefined

    await supplier.save()

    return NextResponse.json({
      message: 'Proveedor rechazado exitosamente',
      supplier: {
        _id: supplier._id,
        name: supplier.name,
        email: supplier.email,
        businessInfo: supplier.businessInfo,
        isApproved: supplier.isApproved,
        rejectionReason: supplier.rejectionReason
      }
    })

  } catch (error) {
    console.error('Error rejecting supplier:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
} 