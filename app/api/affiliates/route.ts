import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import Affiliate from '@/models/Affiliate'
import { requireRole } from '@/lib/auth-middleware'
import { USER_ROLES } from '@/constants'

export async function GET(request: NextRequest) {
  try {
    const { user } = await requireRole(request, [USER_ROLES.ADMIN])
    await connectToDatabase()

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '50')
    const page = parseInt(searchParams.get('page') || '1')

    // Construir query
    const query: any = {}
    
    if (status && status !== 'all') {
      query.status = status
    }
    
    if (search) {
      query.$or = [
        { affiliateCode: { $regex: search, $options: 'i' } },
        { 'user.name': { $regex: search, $options: 'i' } },
        { 'user.email': { $regex: search, $options: 'i' } }
      ]
    }

    // Obtener afiliados con información del usuario
    const skip = (page - 1) * limit
    
    const affiliates = await Affiliate.find(query)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()

    // Obtener total de afiliados para paginación
    const total = await Affiliate.countDocuments(query)

    return NextResponse.json({
      affiliates,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching affiliate data:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// POST /api/affiliates - Join affiliate program or create referral link
export async function POST(request: NextRequest) {
  try {
    const { user } = await requireRole(request, [USER_ROLES.ADMIN])
    await connectToDatabase()

    const { action, ...data } = await request.json()

    if (action === 'join') {
      // Join affiliate program
      if (user.role !== USER_ROLES.CUSTOMER) {
        return NextResponse.json(
          { error: 'Solo los clientes pueden unirse al programa de afiliados' },
          { status: 400 }
        )
      }

      // Check if already an affiliate
      const existingAffiliate = await Affiliate.findOne({ userId: user.id })
      if (existingAffiliate) {
        return NextResponse.json(
          { error: 'Ya eres parte del programa de afiliados' },
          { status: 400 }
        )
      }

      // Validate payment info
      const { paymentMethod, paymentDetails } = data
      if (!paymentMethod || !paymentDetails) {
        return NextResponse.json(
          { error: 'Información de pago requerida' },
          { status: 400 }
        )
      }

      const paymentInfo: any = { method: paymentMethod }
      
      switch (paymentMethod) {
        case 'bank_transfer':
          paymentInfo.bankAccount = paymentDetails
          break
        case 'paypal':
          paymentInfo.paypalEmail = paymentDetails.email
          break
        case 'crypto':
          paymentInfo.cryptoWallet = paymentDetails
          break
      }

      // Create affiliate
      const affiliate = await Affiliate.create({
        userId: user.id,
        paymentInfo,
        settings: {
          autoWithdraw: data.autoWithdraw || false,
          minimumPayout: data.minimumPayout || 100,
          emailNotifications: data.emailNotifications !== false,
          marketingMaterials: data.marketingMaterials !== false
        }
      })

      return NextResponse.json({
        message: 'Te has unido al programa de afiliados exitosamente',
        affiliate: {
          affiliateCode: affiliate.affiliateCode,
          commissionRate: affiliate.commissionRate,
          tier: affiliate.tier
        }
      }, { status: 201 })

    } else if (action === 'generate_link') {
      // Generate referral link
      const affiliate = await Affiliate.findOne({ userId: user.id, status: 'active' })
      if (!affiliate) {
        return NextResponse.json(
          { error: 'No eres parte del programa de afiliados' },
          { status: 400 }
        )
      }

      const { baseUrl, productId, categoryId, campaignName } = data
      const referralLink = affiliate.generateReferralLink(
        baseUrl || process.env.NEXT_PUBLIC_APP_URL,
        productId,
        categoryId,
        campaignName
      )

      await affiliate.save()

      return NextResponse.json({
        referralLink,
        affiliateCode: affiliate.affiliateCode
      })

    } else {
      return NextResponse.json(
        { error: 'Acción no válida' },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Error in affiliate action:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
  
