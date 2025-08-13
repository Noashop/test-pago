import { NextRequest } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import User from '@/models/User'
import Order from '@/models/Order'
import Payout from '@/models/Payout'
import { requireAdmin } from '@/lib/auth-middleware'
import { jsonOk, jsonError } from '@/lib/api-response'

// GET /api/admin/profile - Obtener perfil del administrador autenticado
export async function GET(request: NextRequest) {
  try {
    const { user } = await requireAdmin(request)
    await connectToDatabase()

    const dbUser = await User.findById(user.id).select('-password').lean()
    if (!dbUser || Array.isArray(dbUser)) return jsonError('Usuario no encontrado', 404)

    // Cálculo de billetera del admin
    const deliveredPaidOrders = await Order.find({
      paymentStatus: { $in: ['approved', 'paid'] },
      status: { $in: ['delivered'] }
    }).select('items total commissionDetails').lean()

    function computeAdminCommission(order: any) {
      // Preferir valor pre-calculado
      if (typeof order?.commissionDetails?.adminCommission === 'number') {
        return Math.max(0, order.commissionDetails.adminCommission)
      }
      // Fallback: calcular por ítem (precio - costo) * qty, mínimo 0
      let commission = 0
      for (const it of (order.items || [])) {
        const price = Number(it?.price || 0)
        const qty = Number(it?.quantity || 0)
        const cost = Number(it?.costPrice || 0)
        const delta = price - (isNaN(cost) ? 0 : cost)
        commission += Math.max(0, delta) * qty
      }
      // Si no hay costPrice y hay porcentaje, usarlo
      if (commission === 0 && typeof order?.commissionDetails?.adminCommissionPercentage === 'number') {
        const pct = order.commissionDetails.adminCommissionPercentage
        let gross = 0
        for (const it of (order.items || [])) {
          gross += Number(it?.price || 0) * Number(it?.quantity || 0)
        }
        commission = Math.max(0, gross * (pct / 100))
      }
      return Math.max(0, commission)
    }

    const adminCommissionTotal = deliveredPaidOrders.reduce((acc, o) => acc + computeAdminCommission(o), 0)

    const pendingPayoutsDocs = await Payout.find({ status: 'pending' }).select('amount').lean()
    const pendingPayoutsTotal = pendingPayoutsDocs.reduce((acc, p: any) => acc + Number(p.amount || 0), 0)
    const lastPaidPayout = await Payout.findOne({ status: 'paid' }).sort({ paidAt: -1 }).select('paidAt').lean()

    const profile = {
      _id: dbUser._id?.toString?.() || '',
      name: dbUser.name || '',
      email: dbUser.email || '',
      phone: dbUser.phone || '',
      address: {
        street: dbUser.address?.street || '',
        city: dbUser.address?.city || '',
        state: dbUser.address?.state || '',
        zipCode: dbUser.address?.zipCode || '',
        country: dbUser.address?.country || ''
      },
      businessInfo: {
        businessName: dbUser.businessInfo?.businessName || '',
        taxId: dbUser.businessInfo?.taxId || '',
        description: dbUser.businessInfo?.description || ''
      },
      preferences: {
        emailNotifications: !!dbUser.preferences?.notifications,
        marketingEmails: !!dbUser.preferences?.marketing,
        language: dbUser.preferences?.language || 'es'
      },
      // Datos de billetera calculados dinámicamente
      wallet: {
        availableBalance: adminCommissionTotal,
        pendingPayouts: pendingPayoutsTotal,
        lastPayoutAt: (lastPaidPayout as any)?.paidAt?.toISOString?.() || ''
      },
      billing: {
        invoicesCount: dbUser.billing?.invoicesCount || 0,
        lastInvoiceAt: dbUser.billing?.lastInvoiceAt?.toISOString?.() || ''
      },
      createdAt: dbUser.createdAt?.toISOString?.() || '',
      updatedAt: dbUser.updatedAt?.toISOString?.() || ''
    }

    return jsonOk({ profile })
  } catch (error) {
    console.error('Get admin profile error:', error)
    return jsonError('Error interno del servidor', 500)
  }
}

// PUT /api/admin/profile - Actualizar perfil del administrador autenticado
export async function PUT(request: NextRequest) {
  try {
    const { user } = await requireAdmin(request)
    await connectToDatabase()

    const body = await request.json()
    const update: any = {}

    if (body.name !== undefined) update.name = body.name
    if (body.phone !== undefined) update.phone = body.phone

    if (body.address) {
      update.address = {
        street: body.address.street || '',
        city: body.address.city || '',
        state: body.address.state || '',
        zipCode: body.address.zipCode || '',
        country: body.address.country || ''
      }
    }

    if (body.businessInfo) {
      update.businessInfo = {
        businessName: body.businessInfo.businessName || '',
        taxId: body.businessInfo.taxId || '',
        description: body.businessInfo.description || ''
      }
    }

    if (body.preferences) {
      update.preferences = {
        notifications: !!body.preferences.emailNotifications,
        marketing: !!body.preferences.marketingEmails,
        language: body.preferences.language || 'es'
      }
    }

    const updated = await User.findByIdAndUpdate(user.id, update, { new: true }).select('-password').lean()
    if (!updated || Array.isArray(updated)) return jsonError('Usuario no encontrado', 404)

    const profile = {
      _id: updated._id?.toString?.() || '',
      name: updated.name || '',
      email: updated.email || '',
      phone: updated.phone || '',
      address: {
        street: updated.address?.street || '',
        city: updated.address?.city || '',
        state: updated.address?.state || '',
        zipCode: updated.address?.zipCode || '',
        country: updated.address?.country || ''
      },
      businessInfo: {
        businessName: updated.businessInfo?.businessName || '',
        taxId: updated.businessInfo?.taxId || '',
        description: updated.businessInfo?.description || ''
      },
      preferences: {
        emailNotifications: !!updated.preferences?.notifications,
        marketingEmails: !!updated.preferences?.marketing,
        language: updated.preferences?.language || 'es'
      },
      wallet: {
        availableBalance: updated.wallet?.availableBalance || 0,
        pendingPayouts: updated.wallet?.pendingPayouts || 0,
        lastPayoutAt: updated.wallet?.lastPayoutAt?.toISOString?.() || ''
      },
      billing: {
        invoicesCount: updated.billing?.invoicesCount || 0,
        lastInvoiceAt: updated.billing?.lastInvoiceAt?.toISOString?.() || ''
      },
      createdAt: updated.createdAt?.toISOString?.() || '',
      updatedAt: updated.updatedAt?.toISOString?.() || ''
    }

    return jsonOk({ message: 'Perfil actualizado exitosamente', profile })
  } catch (error: any) {
    console.error('Update admin profile error:', error)
    return jsonError(error?.message || 'Error interno del servidor', 500)
  }
}
