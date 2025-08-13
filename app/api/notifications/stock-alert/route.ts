import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import Product from '@/models/Product'
import Notification from '@/models/Notification'
import User from '@/models/User'
import { requireRole } from '@/lib/auth-middleware'
import { USER_ROLES } from '@/constants'

export async function POST(request: NextRequest) {
  try {
    const { user } = await requireRole(request, [USER_ROLES.ADMIN, USER_ROLES.SUPPLIER])
    await connectToDatabase()

    const body = await request.json()
    const { productId, currentStock, threshold = 10 } = body

    // Verificar que el producto existe
    const product = await Product.findById(productId).populate('supplierId')
    if (!product) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      )
    }

    // Verificar si el stock está por debajo del umbral
    if (currentStock > threshold) {
      return NextResponse.json(
        { message: 'Stock no está bajo el umbral' },
        { status: 200 }
      )
    }

    // Crear notificación para el proveedor
    const supplierNotification = new Notification({
      userId: product.supplierId,
      type: 'stock_alert',
      title: 'Stock Bajo - Acción Requerida',
      message: `El producto "${product.name}" tiene stock bajo (${currentStock} unidades). Por favor, actualiza el inventario.`,
      data: {
        productId: product._id,
        productName: product.name,
        currentStock,
        threshold
      },
      priority: 'high'
    })

    // Crear notificación para el administrador
    const adminUsers = await User.find({ role: USER_ROLES.ADMIN })
    const adminNotifications = adminUsers.map(admin => new Notification({
      userId: admin._id,
      type: 'stock_alert',
      title: 'Stock Bajo - Producto Requiere Atención',
      message: `El producto "${product.name}" del proveedor ${product.supplierName} tiene stock bajo (${currentStock} unidades).`,
      data: {
        productId: product._id,
        productName: product.name,
        supplierName: product.supplierName,
        currentStock,
        threshold
      },
      priority: 'medium'
    }))

    // Guardar todas las notificaciones
    await Promise.all([
      supplierNotification.save(),
      ...adminNotifications.map(n => n.save())
    ])

    return NextResponse.json({
      message: 'Notificaciones de stock bajo enviadas exitosamente',
      notificationsSent: 1 + adminNotifications.length
    })

  } catch (error) {
    console.error('Stock alert notification error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { user } = await requireRole(request, [USER_ROLES.ADMIN, USER_ROLES.SUPPLIER])
    await connectToDatabase()

    // Obtener productos con stock bajo
    const lowStockProducts = await Product.find({
      stock: { $lte: 10 },
      status: 'active',
      approvalStatus: 'approved'
    }).populate('supplierId', 'name email')

    return NextResponse.json({
      lowStockProducts: lowStockProducts.map(product => ({
        id: product._id,
        name: product.name,
        stock: product.stock,
        supplierName: product.supplierName,
        category: product.category
      }))
    })

  } catch (error) {
    console.error('Get stock alerts error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
