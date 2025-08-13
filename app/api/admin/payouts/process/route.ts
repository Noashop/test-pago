import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-middleware'
import { USER_ROLES } from '@/constants'
import { connectToDatabase } from '@/lib/mongodb'
import Payout from '@/models/Payout'
import SupplierPaymentAccount from '@/models/SupplierPaymentAccount'
import PaymentLog from '@/models/PaymentLog'

// POST /api/admin/payouts/process - procesa todos los Payouts pendientes (stub sin transferencia real)
export async function POST(request: NextRequest) {
  try {
    const { user } = await requireAuth(request)
    if (user.role !== USER_ROLES.ADMIN) {
      return NextResponse.json({ error: 'Solo administradores' }, { status: 403 })
    }

    await connectToDatabase()

    const { retryFailed, limit } = await request.json().catch(() => ({}))
    const MAX_ATTEMPTS = Number(process.env.PAYOUT_MAX_ATTEMPTS || 5)

    async function executeSupplierTransfer(p: any, acct: any) {
      const enabled = String(process.env.MP_PAYOUTS_ENABLED || '').toLowerCase() === 'true'
      const platformToken = process.env.MP_ACCESS_TOKEN
      // Nota: Dependiendo de tu cuenta MP, podría usarse una API específica (transfers/advanced_payments/merchant_payments)
      // Aquí dejamos un placeholder controlado por variable de entorno para evitar ejecuciones accidentales en producción sin habilitar.
      const requestPayload = {
        supplier: String(p.supplier),
        amount: p.amount,
        currency: p.currency,
        supplierMpUserId: acct?.mpUserId,
      }
      if (!enabled) {
        throw new Error('Integración real de Payouts no habilitada (MP_PAYOUTS_ENABLED=false)')
      }
      if (!platformToken) throw new Error('Falta MP_ACCESS_TOKEN para transferencias')

      // TODO: Implementar endpoint real de MP para transferir fondos.
      // Ejemplo ilustrativo (no real):
      // const resp = await fetch('https://api.mercadopago.com/transfers', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${platformToken}` },
      //   body: JSON.stringify({ destination_user_id: acct.mpUserId, amount: p.amount, currency_id: p.currency })
      // })
      // const data = await resp.json()
      // if (!resp.ok) throw new Error(data?.message || `Error MP: ${resp.status}`)
      // return { ok: true, data }

      // Por ahora, lanzamos para que el llamado quede registrado y el admin habilite cuando corresponda.
      throw new Error('Debes implementar la API de transferencias de MP según tu modalidad disponible')
    }

    const baseQuery: any = retryFailed ? { status: { $in: ['pending', 'failed'] } } : { status: 'pending' }
    const query: any = { ...baseQuery, $or: [ { attempts: { $lt: MAX_ATTEMPTS } }, { attempts: { $exists: false } } ] }
    const cursor = Payout.find(query).sort({ createdAt: 1 })
    if (typeof limit === 'number' && limit > 0) cursor.limit(limit)
    const pending = await cursor
    let processed = 0
    const results: any[] = []

    for (const p of pending) {
      const startedAt = new Date()
      // Verificar que el proveedor tenga cuenta vinculada
      const acct = await SupplierPaymentAccount.findOne({ userId: p.supplier })
      if (!acct) {
        p.status = 'failed'
        p.attempts = (p.attempts || 0) + 1
        p.lastTriedAt = startedAt
        p.lastError = 'Proveedor sin cuenta vinculada'
        await p.save()
        await PaymentLog.create({
          type: 'payout',
          payout: p._id,
          supplier: p.supplier,
          request: { action: 'process', retryFailed: !!retryFailed },
          response: { status: 'failed', reason: 'Proveedor sin cuenta vinculada' },
          success: false,
          error: 'Proveedor sin cuenta vincululada'
        })
        results.push({ payoutId: p._id, status: 'failed', reason: 'Proveedor sin cuenta vinculada' })
        continue
      }

      try {
        const res = await executeSupplierTransfer(p, acct)
        // Si la integración real no está disponible, consideramos éxito simulado solo si MP_PAYOUTS_ENABLED=true y endpoint responde ok
        p.status = 'paid'
        p.paidAt = new Date()
        p.attempts = (p.attempts || 0) + 1
        p.lastTriedAt = startedAt
        p.lastError = undefined as any
        await p.save()
        await PaymentLog.create({
          type: 'payout',
          payout: p._id,
          supplier: p.supplier,
          request: { action: 'process', retryFailed: !!retryFailed, accountLinked: true },
          response: { status: 'paid', transfer: res },
          success: true
        })
        processed++
        results.push({ payoutId: p._id, status: 'paid' })
      } catch (err: any) {
        p.status = 'failed'
        p.attempts = (p.attempts || 0) + 1
        p.lastTriedAt = startedAt
        p.lastError = String(err?.message || err)
        await p.save()
        await PaymentLog.create({
          type: 'payout',
          payout: p._id,
          supplier: p.supplier,
          request: { action: 'process', retryFailed: !!retryFailed, accountLinked: true },
          response: { status: 'failed' },
          success: false,
          error: String(err?.message || err)
        })
        results.push({ payoutId: p._id, status: 'failed', error: p.lastError })
      }
    }
    // Alertas si hay fallidos o si se alcanzó el máximo de intentos
    try {
      const webhook = process.env.ALERT_WEBHOOK_URL
      const failed = results.filter(r => r.status === 'failed')
      const reachedMax = await Payout.countDocuments({ attempts: { $gte: MAX_ATTEMPTS }, status: 'failed' })
      if (webhook && (failed.length > 0 || reachedMax > 0)) {
        await fetch(webhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            source: 'admin/payouts/process',
            processed,
            total: pending.length,
            failedCount: failed.length,
            reachedMaxAttemptsCount: reachedMax,
            timestamp: new Date().toISOString()
          })
        }).catch(()=>{})
      }
    } catch {}

    return NextResponse.json({ message: 'Proceso finalizado', processed, total: pending.length, results })
  } catch (e) {
    console.error('Payouts process error:', e)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
