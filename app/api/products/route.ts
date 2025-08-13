import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import Product from '@/models/Product'
import { SEARCH, PAGINATION } from '@/constants'

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase()

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const subcategory = searchParams.get('subcategory')
    const featured = searchParams.get('featured')
    const search = searchParams.get('search')
    const inStock = searchParams.get('inStock')
    const status = searchParams.get('status')
    const approvalStatus = searchParams.get('approvalStatus')
    const limit = parseInt(searchParams.get('limit') || '20')
    const page = parseInt(searchParams.get('page') || '1')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    // Construir filtros: por defecto solo productos aprobados y activos (visibles públicamente)
    const filters: any = {}
    // approvalStatus: se permite override vía query, default: approved
    if (approvalStatus) {
      filters.approvalStatus = approvalStatus
    } else {
      filters.approvalStatus = 'approved'
    }
    // status: se permite override vía query, default: active
    if (status && status !== 'all') {
      filters.status = status
    } else {
      filters.status = 'active'
    }

    // Filtro para productos en stock
    if (inStock === 'true') {
      filters.stock = { $gt: 0 }
    }

    if (category) {
      filters.category = new RegExp(category, 'i')
    }

    if (subcategory) {
      filters.subcategory = new RegExp(subcategory, 'i')
    }

    if (featured === 'true') {
      filters.featured = true
    }

    // Búsqueda: usar índice de texto cuando el término cumple la longitud mínima
    const term = (search || '').trim()
    let projection: any | undefined = undefined
    let sort: any = {}
    if (term && term.length >= SEARCH.MIN_LENGTH) {
      filters.$text = { $search: term }
      projection = { score: { $meta: 'textScore' } }
      sort = { score: { $meta: 'textScore' } }
    } else {
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1
    }

    // Calcular skip para paginación
    const skip = (page - 1) * limit

    // Obtener productos y total en paralelo
    const [products, total] = await Promise.all([
      Product.find(filters, projection)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('supplierId', 'name businessInfo.businessName')
        .lean(),
      Product.countDocuments(filters)
    ])

    // Transformar productos para el frontend
    const transformedProducts = products.map((product: any) => ({
      _id: product._id,
      name: product.name || 'Producto sin nombre',
      shortDescription: product.shortDescription || product.description?.substring(0, 100) + '...' || 'Sin descripción',
      salePrice: product.salePrice || product.price || 0,
      recommendedResalePrice: product.recommendedRetailPrice || product.recommendedResalePrice || product.price || 0,
      images: product.images && product.images.length > 0 ? product.images : ['/placeholder-product.jpg'],
      supplierName: product.supplierId?.businessInfo?.businessName || product.supplierId?.name || product.supplierName || 'Proveedor',
      rating: product.rating || 0,
      reviewCount: product.reviewCount || 0,
      stock: (typeof product.stock === 'number' ? product.stock : undefined) ?? product.availableQuantity ?? 0,
      minOrderQuantity: product.minimumPurchaseQuantity || product.minOrderQuantity || 1,
      unitType: product.unitType || 'unidad',
      category: product.category || '',
      subcategory: product.subcategory || '',
      featured: product.featured || false
    }))

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      success: true,
      products: transformedProducts,
      data: {
        products: transformedProducts,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    })
  } catch (error) {
    console.error('Get products error:', error)
    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        success: false,
        products: [],
        data: { products: [], pagination: { page: 1, limit: PAGINATION.DEFAULT_LIMIT, total: 0, totalPages: 0, hasNextPage: false, hasPrevPage: false } }
      },
      { status: 500 }
    )
  }
}
