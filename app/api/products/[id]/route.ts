import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import Product from '@/models/Product'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    await connectToDatabase()

    const product = await Product.findOne({
      _id: id,
      approvalStatus: 'approved',
      status: 'active'
    })
    .populate('supplierId', 'name businessInfo.businessName email')
    .lean()

    if (!product) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      )
    }

    // Incrementar contador de vistas
    await Product.findByIdAndUpdate(id, {
      $inc: { viewCount: 1 }
    })

    // Obtener productos relacionados (raw)
    const relatedRaw = await Product.find({
      category: (product as any).category,
      _id: { $ne: (product as any)._id },
      approvalStatus: 'approved',
      status: 'active'
    })
      .limit(4)
      .populate('supplierId', 'name businessInfo.businessName')
      .lean()

    // Normalizar proveedor
    const supplierObj = (prod: any) => {
      const sid = prod?.supplierId
      const id = (sid && (sid._id || sid)) as any
      const businessName = (sid && (sid.businessInfo?.businessName || sid.name)) || prod?.supplierName || 'Proveedor'
      return { _id: id, businessName }
    }

    // Normalizar producto principal al formato esperado por el frontend
    const normalized = {
      _id: (product as any)._id,
      name: (product as any).name,
      description: (product as any).description,
      shortDescription: (product as any).shortDescription || '',
      images: (product as any).images || [],
      category: (product as any).category,
      brand: (product as any).brand || (product as any).marca || '',
      sku: (product as any).sku || (product as any).modelo || String((product as any)._id).slice(-6),
      price: (product as any).salePrice,
      comparePrice: (product as any).recommendedRetailPrice,
      rating: (product as any).rating || 0,
      reviewCount: (product as any).reviewCount || 0,
      supplier: supplierObj(product),
      inventory: {
        quantity: (product as any).availableQuantity ?? (product as any).stock ?? 0,
        lowStockThreshold: 5,
      },
      shipping: {
        weight: (product as any).weight || (product as any).netWeight || 0,
        freeShipping: false,
      },
      minimumPurchaseQuantity: (product as any).minimumPurchaseQuantity || 1,
      unitType: (product as any).unitType || 'unidad',
      status: (product as any).status,
    }

    // Normalizar relacionados
    const relatedProducts = (relatedRaw || []).map((p: any) => ({
      _id: p._id,
      name: p.name,
      images: p.images || [],
      price: p.salePrice,
      comparePrice: p.recommendedRetailPrice,
      rating: p.rating || 0,
      reviewCount: p.reviewCount || 0,
      supplier: supplierObj(p),
      inventory: { quantity: p.availableQuantity ?? p.stock ?? 0 },
    }))

    return NextResponse.json({
      product: normalized,
      relatedProducts,
    })

  } catch (error) {
    console.error('Get product error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
