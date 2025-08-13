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

    const { adminSalePrice, adminRecommendedRetailPrice, notes } = await request.json()

    if (!adminSalePrice || !adminRecommendedRetailPrice) {
      return NextResponse.json(
        { error: 'El precio de venta y precio recomendado de reventa son requeridos' },
        { status: 400 }
      )
    }

    // Validar que los precios sean números positivos
    if (adminSalePrice <= 0 || adminRecommendedRetailPrice <= 0) {
      return NextResponse.json(
        { error: 'Los precios deben ser números positivos' },
        { status: 400 }
      )
    }

    // Validar que el precio de venta sea mayor al precio de costo del proveedor
    const product = await Product.findById(id)
    if (!product) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      )
    }

    if (adminSalePrice <= product.costPrice) {
      return NextResponse.json(
        { error: 'El precio de venta debe ser mayor al precio de costo del proveedor' },
        { status: 400 }
      )
    }

    // Calcular margen de ganancia del admin (diferencia entre precio de venta y costo del proveedor)
    const adminProfitMargin = adminSalePrice - product.costPrice
    const adminProfitPercentage = ((adminProfitMargin / product.costPrice) * 100).toFixed(2)
    
    // Calcular ganancia potencial del cliente (diferencia entre precio recomendado y precio de venta)
    const customerPotentialProfit = adminRecommendedRetailPrice - adminSalePrice
    const customerProfitPercentage = ((customerPotentialProfit / adminSalePrice) * 100).toFixed(2)

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      {
        approvalStatus: 'approved',
        status: 'active',
        salePrice: adminSalePrice, // Precio de venta público
        adminCostPrice: product.costPrice, // Mantener referencia del costo original
        adminRecommendedPrice: adminRecommendedRetailPrice, // Precio recomendado de reventa
        profitMargin: adminProfitMargin,
        approvedBy: {
          adminId: session.user.id,
          adminName: session.user.name,
          approvedAt: new Date(),
          notes: notes || ''
        },
        updatedAt: new Date()
      },
      { new: true }
    )

    if (!updatedProduct) {
      return NextResponse.json(
        { error: 'Error al actualizar el producto' },
        { status: 500 }
      )
    }

    // Crear notificación para el proveedor
    try {
      await Notification.create({
        userId: updatedProduct.supplierId,
        title: 'Producto Aprobado',
        message: `Tu producto "${updatedProduct.name}" ha sido aprobado y publicado en la tienda con precio de venta $${adminSalePrice}.`,
        type: 'success',
        category: 'product',
        data: {
          productId: updatedProduct._id,
          status: 'approved',
          salePrice: adminSalePrice
        }
      })
    } catch (notificationError) {
      console.error('Error creating notification:', notificationError)
      // No fallar la operación si la notificación falla
    }

    return NextResponse.json({
      message: 'Producto aprobado exitosamente',
      product: {
        id: updatedProduct._id,
        name: updatedProduct.name,
        costPrice: product.costPrice,
        salePrice: adminSalePrice,
        recommendedRetailPrice: adminRecommendedRetailPrice,
        adminProfitMargin,
        adminProfitPercentage: parseFloat(adminProfitPercentage),
        customerPotentialProfit,
        customerProfitPercentage: parseFloat(customerProfitPercentage)
      }
    })

  } catch (error) {
    console.error('Error approving product:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
} 