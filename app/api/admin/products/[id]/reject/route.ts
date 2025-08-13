import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import Product from '@/models/Product'
import Notification from '@/models/Notification'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { USER_ROLES } from '@/constants'
import { withRateLimit } from '@/lib/rate-limit'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Await params in Next.js 15 App Router
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

    const { reason } = await request.json()

    const product = await Product.findByIdAndUpdate(
      id,
      {
        approvalStatus: 'rejected',
        rejectionReason: reason || 'Producto rechazado por el administrador',
        rejectedBy: {
          adminId: session.user.id,
          adminName: session.user.name,
          rejectedAt: new Date()
        },
        updatedAt: new Date()
      },
      { new: true }
    )

    if (!product) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      )
    }

    // Crear notificación para el proveedor
    try {
      await Notification.create({
        userId: product.supplierId,
        title: 'Producto Rechazado',
        message: `Tu producto "${product.name}" ha sido rechazado. Razón: ${reason || 'No especificada'}`,
        type: 'error',
        category: 'product',
        data: {
          productId: product._id,
          status: 'rejected',
          reason: reason
        }
      })
    } catch (notificationError) {
      console.error('Error creating notification:', notificationError)
      // No fallar la operación si la notificación falla
    }

    return NextResponse.json({
      message: 'Producto rechazado exitosamente',
      product: {
        id: product._id,
        name: product.name,
        status: product.approvalStatus
      }
    })

  } catch (error) {
    console.error('Error rejecting product:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
} 