import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import User from '@/models/User'
import { USER_ROLES } from '@/constants'
import { rateLimiters } from '@/lib/rate-limit'

// GET /api/public/suppliers - Public listing of approved suppliers with logos
export async function GET(_request: NextRequest) {
  const limited = rateLimiters.search.middleware(_request)
  if (limited) return limited
  try {
    await connectToDatabase()

    const suppliers = await User.find({
      role: USER_ROLES.SUPPLIER,
      isApproved: true,
      'businessInfo.logo': { $exists: true, $ne: '' }
    })
      .select('businessInfo.logo businessInfo.businessName name stats.totalProducts')
      .limit(100)
      .lean()

    const data = suppliers.map((s: any) => ({
      id: String(s._id),
      name: s.businessInfo?.businessName || s.name,
      logo: s.businessInfo?.logo,
      totalProducts: s.stats?.totalProducts || 0,
    }))

    return NextResponse.json({ suppliers: data })
  } catch (error) {
    console.error('Public suppliers fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch suppliers' }, { status: 500 })
  }
}
