import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-middleware'
import { connectToDatabase } from '@/lib/mongodb'
import Order from '@/models/Order'
import User from '@/models/User'
import Payout from '@/models/Payout'
import { PAYMENT_STATUS, ORDER_STATUS } from '@/constants'

function calcSupplierAmountForOrder(order: any, supplierId: string) {
  // Suma de items del proveedor
  const items = (order.items || []).filter((it: any) => String(it.supplier) === String(supplierId))
  let amount = 0
  for (const it of items) {
    if (typeof it.costPrice === 'number' && it.costPrice >= 0) {
      amount += it.costPrice * it.quantity
    } else if (order.commissionDetails?.adminCommissionPercentage != null) {
      const pct = order.commissionDetails.adminCommissionPercentage
      amount += it.price * it.quantity * (1 - pct / 100)
    } else {
      // fallback: todo para proveedor
      amount += it.price * it.quantity
    }
  }
  return amount
}

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req)
    await connectToDatabase()

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') || undefined
    const supplier = searchParams.get('supplier') || undefined

    const query: any = {}
    if (status) query.status = status
    if (supplier) query.supplier = supplier

    const payouts = await Payout.find(query).sort({ createdAt: -1 })
      .populate('supplier', 'name email')
      .populate('orders.order', 'orderNumber total')
      .lean()

    return NextResponse.json({ payouts })
  } catch (err: any) {
    console.error('GET /admin/payouts error', err)
    return NextResponse.json({ error: 'Error al listar pagos a proveedores' }, { status: 500 })
  }
}

// Genera payouts pendientes por proveedor a partir de órdenes pagadas y entregadas
export async function POST(req: NextRequest) {
  try {
    await requireAdmin(req)
    await connectToDatabase()

    const body = await req.json().catch(() => ({}))
    const supplierId = body?.supplierId as string | undefined

    // Órdenes elegibles: pagas y entregadas
    const orderQuery: any = {
      paymentStatus: { $in: [PAYMENT_STATUS.APPROVED, PAYMENT_STATUS.PAID] },
      status: { $in: [ORDER_STATUS.DELIVERED] }
    }

    if (supplierId) {
      orderQuery['items.supplier'] = supplierId
    }

    // Excluir órdenes ya presentes en algún payout del proveedor
    const existingPayouts = await Payout.find(supplierId ? { supplier: supplierId } : {}).select('orders.order supplier').lean()
    const paidOrderIdsBySupplier: Map<string, Set<string>> = new Map()
    for (const p of existingPayouts) {
      const set = paidOrderIdsBySupplier.get(String(p.supplier)) || new Set<string>()
      for (const e of p.orders) set.add(String(e.order))
      paidOrderIdsBySupplier.set(String(p.supplier), set)
    }

    const orders = await Order.find(orderQuery).select('items total commissionDetails').lean()

    // Agrupar por proveedor y calcular montos
    const bySupplier: Map<string, { orders: Array<{ order: any, amount: number }> }> = new Map()

    for (const order of orders) {
      const suppliersInOrder: Set<string> = new Set((order.items as any[]).map((it: any) => String(it.supplier)))
      for (const sup of suppliersInOrder.values()) {
        // si ya está en payout anterior, saltar
        const excluded = paidOrderIdsBySupplier.get(sup as string)
        if (excluded && excluded.has(String((order as any)._id))) continue

        const amount = calcSupplierAmountForOrder(order, sup as string)
        if (amount <= 0) continue
        const bucket = bySupplier.get(sup as string) || { orders: [] }
        bucket.orders.push({ order, amount })
        bySupplier.set(sup as string, bucket)
      }
    }

    const created: any[] = []

    for (const [sup, data] of bySupplier) {
      // snapshot destino primario (si existe)
      const supplierDoc = await User.findById(sup).select('wallets name email').lean<{ wallets?: any[] }>()
      const primary = (supplierDoc && Array.isArray(supplierDoc.wallets) ? supplierDoc.wallets : []).find((w: any) => w.isPrimary)

      // crear payout
      const payout = await Payout.create({
        supplier: sup,
        currency: 'ARS',
        amount: data.orders.reduce((acc, o) => acc + o.amount, 0),
        status: 'pending',
        destination: primary ? {
          provider: primary.provider,
          alias: primary.alias,
          cbu: primary.cbu,
          cvu: primary.cvu,
          accountId: primary.accountId,
          holderName: primary.holderName
        } : undefined,
        orders: data.orders.map((o) => ({ order: (o.order as any)._id, amount: o.amount }))
      })
      created.push(payout)
    }

    return NextResponse.json({ message: 'Payouts generados', count: created.length, payouts: created })
  } catch (err: any) {
    console.error('POST /admin/payouts error', err)
    return NextResponse.json({ error: 'Error al generar pagos a proveedores' }, { status: 500 })
  }
}
