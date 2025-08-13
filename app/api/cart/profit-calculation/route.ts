import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import Product from '@/models/Product'
import { requireRole } from '@/lib/auth-middleware'
import { USER_ROLES } from '@/constants'

// POST /api/cart/profit-calculation - Calculate potential profit for customer
export async function POST(request: NextRequest) {
  try {
    const { user } = await requireRole(request, [USER_ROLES.CUSTOMER])
    await connectToDatabase()

    const { productId, quantity = 1 } = await request.json()

    if (!productId) {
      return NextResponse.json(
        { error: 'ID del producto es requerido' },
        { status: 400 }
      )
    }

    const product = await Product.findById(productId)
      .select('name salePrice adminRecommendedPrice approvalStatus status')
      .lean()

    if (!product) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      )
    }

    // Solo mostrar ganancia potencial si el producto está aprobado y activo
    if ((product as any).approvalStatus !== 'approved' || (product as any).status !== 'active') {
      return NextResponse.json(
        { error: 'Producto no disponible para cálculo de ganancias' },
        { status: 400 }
      )
    }

    // Solo mostrar precio recomendado a clientes registrados
    if (!(product as any).adminRecommendedPrice) {
      return NextResponse.json({
        showProfitMessage: false,
        message: 'Información de ganancia no disponible'
      })
    }

    const salePrice = (product as any).salePrice
    const recommendedRetailPrice = (product as any).adminRecommendedPrice
    
    // Calcular ganancia potencial por unidad
    const profitPerUnit = recommendedRetailPrice - salePrice
    const totalProfit = profitPerUnit * quantity
    const profitPercentage = ((profitPerUnit / salePrice) * 100).toFixed(1)

    // Solo mostrar si hay ganancia potencial positiva
    if (profitPerUnit <= 0) {
      return NextResponse.json({
        showProfitMessage: false,
        message: 'No hay ganancia potencial calculada para este producto'
      })
    }

    return NextResponse.json({
      showProfitMessage: true,
      product: {
        id: (product as any)._id,
        name: (product as any).name,
        salePrice,
        recommendedRetailPrice
      },
      profitCalculation: {
        quantity,
        profitPerUnit,
        totalProfit,
        profitPercentage: parseFloat(profitPercentage),
        costInvestment: salePrice * quantity,
        potentialRevenue: recommendedRetailPrice * quantity
      },
      message: `¡Comprando este producto usted podría llegar a generar $${totalProfit.toLocaleString('es-AR')} en ganancias por reventa! (${profitPercentage}% de ganancia)`
    })

  } catch (error) {
    console.error('Error calculating profit:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
