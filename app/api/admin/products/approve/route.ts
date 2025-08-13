import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import Product from '@/models/Product'
import { USER_ROLES } from '@/constants'
import { requireRole } from '@/lib/auth-middleware'

export async function POST(request: NextRequest) {
  try {
    const { user } = await requireRole(request, [USER_ROLES.ADMIN])
    await connectToDatabase()

      const { productId, action, reason } = await request.json()

      if (!productId || !action) {
        return NextResponse.json(
          { error: 'ID del producto y acción son requeridos' },
          { status: 400 }
        )
      }

      if (!['approve', 'reject'].includes(action)) {
        return NextResponse.json(
          { error: 'Acción no válida' },
          { status: 400 }
        )
      }

      // Buscar el producto
      const product = await Product.findById(productId)

      if (!product) {
        return NextResponse.json(
          { error: 'Producto no encontrado' },
          { status: 404 }
        )
      }

      // Actualizar el estado del producto
      const updateData: any = {
        approvalStatus: action === 'approve' ? 'approved' : 'rejected',
        status: action === 'approve' ? 'active' : 'inactive'
      }

      if (action === 'reject' && reason) {
        updateData.rejectionReason = reason
        updateData.rejectedBy = {
          adminId: user.id,
          adminName: user.name,
          rejectedAt: new Date()
        }
      } else if (action === 'approve') {
        updateData.approvedBy = {
          adminId: user.id,
          adminName: user.name,
          approvedAt: new Date()
        }
        // Limpiar razón de rechazo si existe
        updateData.rejectionReason = null
        updateData.rejectedBy = null
      }

      await Product.findByIdAndUpdate(productId, updateData)

      return NextResponse.json({
        message: action === 'approve' 
          ? 'Producto aprobado exitosamente' 
          : 'Producto rechazado exitosamente',
        product: {
          id: product._id,
          name: product.name,
          approvalStatus: updateData.approvalStatus
        }
      })

    } catch (error) {
      console.error('Product approval error:', error)
      return NextResponse.json(
        { error: 'Error interno del servidor' },
        { status: 500 }
      )
    }
}