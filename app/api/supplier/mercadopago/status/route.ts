import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-middleware'
import { USER_ROLES } from '@/constants'
import { connectToDatabase } from '@/lib/mongodb'
import SupplierPaymentAccount from '@/models/SupplierPaymentAccount'

// GET /api/supplier/mercadopago/status -> estado de vinculación
export async function GET(request: NextRequest) {
  try {
    const { user } = await requireAuth(request)
    if (user.role !== USER_ROLES.SUPPLIER) {
      return NextResponse.json({ error: 'Solo proveedores' }, { status: 403 })
    }

    await connectToDatabase()
    const acct = await SupplierPaymentAccount.findOne({ userId: user.id })

    if (!acct) return NextResponse.json({ connected: false })

    const expiresAt = new Date(acct.expiresAt)
    const now = new Date()
    const expiresInSec = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000))

    return NextResponse.json({
      connected: true,
      mpUserId: acct.mpUserId,
      expiresAt: acct.expiresAt,
      expiresInSec
    })
  } catch (e) {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
