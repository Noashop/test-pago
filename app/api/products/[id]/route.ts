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

    // Obtener productos relacionados
    const relatedProducts = await Product.find({
      category: (product as any).category,
      _id: { $ne: (product as any)._id },
      approvalStatus: 'approved',
      status: 'active'
    })
    .limit(4)
    .populate('supplierId', 'name businessInfo.businessName')
    .lean()

    return NextResponse.json({ 
      product,
      relatedProducts 
    })

  } catch (error) {
    console.error('Get product error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
