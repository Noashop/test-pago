import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { requireAdmin } from '@/lib/auth-middleware'
import Payout from '@/models/Payout'
import SupplierPaymentAccount from '@/models/SupplierPaymentAccount'
import PaymentLog from '@/models/PaymentLog'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase()

    const secretHeader = request.headers.get('x-cron-secret')
    const secretEnv = process.env.CRON_SECRET

    // Permitir ejecución con secreto, o por admin autenticado (útil para pruebas manuales)
    let authorized = false
    if (secretEnv && secretHeader && secretHeader === secretEnv) authorized = true
    if (!authorized) {
      try {
        const { user } = await requireAdmin(request)
        if (user?.role === 'admin') authorized = true
      } catch {}
    }
    if (!authorized) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const MAX_ATTEMPTS = Number(process.env.PAYOUT_MAX_ATTEMPTS || 5)
    const LIMIT = Number(process.env.CRON_PAYOUT_LIMIT || 50)

    async function executeSupplierTransfer(p: any, acct: any) {
      const enabled = String(process.env.MP_PAYOUTS_ENABLED || '').toLowerCase() === 'true'
      const platformToken = process.env.MP_ACCESS_TOKEN
      const payload = { supplier: String(p.supplier), amount: p.amount, currency: p.currency, supplierMpUserId: acct?.mpUserId }
      if (!enabled) throw new Error('Integración real de Payouts no habilitada (MP_PAYOUTS_ENABLED=false)')
      if (!platformToken) throw new Error('Falta MP_ACCESS_TOKEN para transferencias')
      // TODO: Implementar integración real (ver comentarios en /api/admin/payouts/process)
      throw new Error('Debes implementar la API de transferencias de MP según tu modalidad disponible')
    }

    const query: any = {
      status: { $in: ['pending', 'failed'] },
      $or: [ { attempts: { $lt: MAX_ATTEMPTS } }, { attempts: { $exists: false } } ]
    }

    const pending = await Payout.find(query).sort({ updatedAt: 1 }).limit(LIMIT)

    let processed = 0
    const results: any[] = []

    for (const p of pending) {
      const startedAt = new Date()
      const acct = await SupplierPaymentAccount.findOne({ userId: p.supplier })
      if (!acct) {
        p.status = 'failed'
        p.attempts = (p.attempts || 0) + 1
        p.lastTriedAt = startedAt
        p.lastError = 'Proveedor sin cuenta vinculada'
        await p.save()
        await PaymentLog.create({ type: 'payout', payout: p._id, supplier: p.supplier, request: { action: 'cron_retry' }, response: { status: 'failed', reason: 'Proveedor sin cuenta vinculada' }, success: false, error: 'Proveedor sin cuenta vincululada' })
        results.push({ payoutId: p._id, status: 'failed', reason: 'Proveedor sin cuenta vinculada' })
        continue
      }

      try {
        const res = await executeSupplierTransfer(p, acct)
        p.status = 'paid'
        p.paidAt = new Date()
        p.attempts = (p.attempts || 0) + 1
        p.lastTriedAt = startedAt
        p.lastError = undefined as any
        await p.save()
        await PaymentLog.create({ type: 'payout', payout: p._id, supplier: p.supplier, request: { action: 'cron_retry' }, response: { status: 'paid', transfer: res }, success: true })
        processed++
        results.push({ payoutId: p._id, status: 'paid' })
      } catch (err: any) {
        p.status = 'failed'
        p.attempts = (p.attempts || 0) + 1
        p.lastTriedAt = startedAt
        p.lastError = String(err?.message || err)
        await p.save()
        await PaymentLog.create({ type: 'payout', payout: p._id, supplier: p.supplier, request: { action: 'cron_retry' }, response: { status: 'failed' }, success: false, error: String(err?.message || err) })
        results.push({ payoutId: p._id, status: 'failed', error: p.lastError })
      }
    }

    return NextResponse.json({ message: 'Cron reintentos ejecutado', processed, total: pending.length, results })
  } catch (err) {
    console.error('POST /api/cron/payouts/retry error', err)
    return NextResponse.json({ error: 'Error al ejecutar cron de reintentos' }, { status: 500 })
  }
}
