import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-middleware'
import { connectToDatabase } from '@/lib/mongodb'
import Payout from '@/models/Payout'

export async function POST(request: NextRequest, context: any) {
  try {
    await requireAdmin(request)
    await connectToDatabase()

    const rawParams = context?.params
    const resolvedParams = typeof rawParams?.then === 'function' ? await rawParams : rawParams
    const id: string = resolvedParams?.id
    const payout = await Payout.findById(id)
    if (!payout) return NextResponse.json({ error: 'Payout no encontrado' }, { status: 404 })
    if (payout.status === 'paid') return NextResponse.json({ message: 'Payout ya liberado', payout })
    if (payout.status === 'cancelled') return NextResponse.json({ error: 'Payout cancelado' }, { status: 400 })

    payout.status = 'paid'
    payout.paidAt = new Date()
    await payout.save()

    return NextResponse.json({ message: 'Payout liberado', payout })
  } catch (err) {
    console.error('POST /admin/payouts/[id]/release error', err)
    return NextResponse.json({ error: 'Error al liberar pago' }, { status: 500 })
  }
}
