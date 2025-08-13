import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import Product from '@/models/Product'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { USER_ROLES } from '@/constants'

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase()
    
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== USER_ROLES.ADMIN) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const products = await Product.find({ 
      approvalStatus: 'pending' 
    })
    .populate('supplierId', 'name businessInfo.businessName')
    .sort({ createdAt: -1 })
    .lean()

    return NextResponse.json({
      products: products.map((product: any) => ({
        _id: product._id,
        name: product.name,
        description: product.description,
        category: product.category,
        subcategory: product.subcategory,
        salePrice: product.salePrice,
        recommendedResalePrice: product.recommendedResalePrice,
        costPrice: product.costPrice,
        images: product.images,
        status: product.status,
        approvalStatus: product.approvalStatus,
        rejectionReason: product.rejectionReason,
        supplierId: product.supplierId,
        createdAt: product.createdAt
      }))
    })

  } catch (error) {
    console.error('Error fetching pending products:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
} 