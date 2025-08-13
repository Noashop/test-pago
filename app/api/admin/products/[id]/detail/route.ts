import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import Product from '@/models/Product'
import { requireRole } from '@/lib/auth-middleware'
import { USER_ROLES } from '@/constants'

// GET /api/admin/products/[id]/detail - Get product detail for admin approval
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
    try {
      await connectToDatabase()

      const { user } = await requireRole(request, [USER_ROLES.ADMIN])
      // Get id from params passed by middleware
      const { id } = await params

      const product = await Product.findById(id)
        .populate('supplierId', 'name email businessName')
        .lean()

      if (!product) {
        return NextResponse.json(
          { error: 'Producto no encontrado' },
          { status: 404 }
        )
      }

      // Calcular métricas para mostrar al admin
      const costPrice = (product as any).costPrice
      const supplierSalePrice = (product as any).salePrice
      const supplierRecommendedPrice = (product as any).recommendedRetailPrice

      return NextResponse.json({
        product: {
          id: (product as any)._id,
          name: (product as any).name,
          description: (product as any).description,
          shortDescription: (product as any).shortDescription,
          category: (product as any).category,
          subcategory: (product as any).subcategory,
          images: (product as any).images,
          
          // Precios del proveedor
          costPrice,
          supplierSalePrice,
          supplierRecommendedPrice,
          minimumPurchaseQuantity: (product as any).minimumPurchaseQuantity,
          availableQuantity: (product as any).availableQuantity,
          warranty: (product as any).warranty,
          
          // Información del proveedor
          supplier: (product as any).supplierId,
          supplierName: (product as any).supplierName,
          
          // Estado y fechas
          status: (product as any).status,
          approvalStatus: (product as any).approvalStatus,
          createdAt: (product as any).createdAt,
          updatedAt: (product as any).updatedAt,
          
          // Campos específicos
          specificFields: (product as any).specificFields,
          
          // Métricas calculadas para ayudar al admin
          metrics: {
            // Margen mínimo sugerido (20% sobre costo)
            suggestedMinSalePrice: Math.ceil(costPrice * 1.2),
            // Precio competitivo sugerido (30% sobre costo)
            suggestedSalePrice: Math.ceil(costPrice * 1.3),
            // Precio recomendado de reventa sugerido (50% sobre precio de venta sugerido)
            suggestedRetailPrice: Math.ceil(costPrice * 1.3 * 1.5)
          }
        }
      })

  } catch (error) {
    console.error('Error fetching product detail:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
