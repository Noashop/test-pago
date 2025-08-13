import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-middleware'
import { connectToDatabase } from '@/lib/mongodb'
import PaymentLog from '@/models/PaymentLog'

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req)
    await connectToDatabase()

    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type') || undefined
    const success = searchParams.get('success')
    const supplier = searchParams.get('supplier') || undefined
    const payout = searchParams.get('payout') || undefined
    const order = searchParams.get('order') || undefined
    const q = searchParams.get('q') || undefined
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const limit = Math.min(Number(searchParams.get('limit') || 100), 500)

    const query: any = {}
    if (type) query.type = type
    if (success === 'true') query.success = true
    if (success === 'false') query.success = false
    if (supplier) query.supplier = supplier
    if (payout) query.payout = payout
    if (order) query.order = order
    if (from || to) {
      query.createdAt = {}
      if (from) (query.createdAt as any).$gte = new Date(from)
      if (to) (query.createdAt as any).$lte = new Date(to)
    }
    if (q) {
      query.$or = [
        { error: { $regex: q, $options: 'i' } },
        { referenceId: { $regex: q, $options: 'i' } },
      ]
    }

    const logs = await PaymentLog.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('supplier', 'name email')
      .populate('order', 'orderNumber')
      .populate('payout', 'amount status')
      .lean()

    return NextResponse.json({ logs })
  } catch (err) {
    console.error('GET /admin/payment-logs error', err)
    return NextResponse.json({ error: 'Error al listar logs' }, { status: 500 })
  }
}
