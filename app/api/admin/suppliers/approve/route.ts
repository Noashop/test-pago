import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import User from '@/models/User'
import { USER_ROLES } from '@/constants'
import { requireRole } from '@/lib/auth-middleware'

export async function POST(request: NextRequest) {
  try {
    const { user } = await requireRole(request, [USER_ROLES.ADMIN])
    
      await connectToDatabase()

      // Verificar que el usuario sea admin
      if (user.role !== USER_ROLES.ADMIN) {
        return NextResponse.json(
          { error: 'Acceso denegado' },
          { status: 403 }
        )
      }

      const { supplierId, action, reason } = await request.json()

      if (!supplierId || !action) {
        return NextResponse.json(
          { error: 'ID del proveedor y acción son requeridos' },
          { status: 400 }
        )
      }

      if (!['approve', 'reject'].includes(action)) {
        return NextResponse.json(
          { error: 'Acción no válida' },
          { status: 400 }
        )
      }

      // Buscar el proveedor
      const supplier = await User.findOne({ 
        _id: supplierId, 
        role: USER_ROLES.SUPPLIER 
      })

      if (!supplier) {
        return NextResponse.json(
          { error: 'Proveedor no encontrado' },
          { status: 404 }
        )
      }

      // Actualizar el estado del proveedor
      const updateData: any = {
        isApproved: action === 'approve',
        approvalDate: action === 'approve' ? new Date() : null,
        approvedBy: action === 'approve' ? {
          adminId: user.id,
          adminName: user.name,
          approvedAt: new Date()
        } : null
      }

      if (action === 'reject' && reason) {
        updateData.rejectionReason = reason
      }

      await User.findByIdAndUpdate(supplierId, updateData)

      return NextResponse.json({
        message: action === 'approve' 
          ? 'Proveedor aprobado exitosamente' 
          : 'Proveedor rechazado exitosamente',
        supplier: {
          id: supplier._id,
          name: supplier.name,
          email: supplier.email,
          businessName: supplier.businessInfo?.businessName,
          isApproved: updateData.isApproved
        }
      })

    } catch (error) {
      console.error('Supplier approval error:', error)
      return NextResponse.json(
        { error: 'Error interno del servidor' },
        { status: 500 }
      )
    }
}