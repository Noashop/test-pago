import { NextRequest } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import User from '@/models/User'
import { requireAdmin } from '@/lib/auth-middleware'
import { jsonOk, jsonError } from '@/lib/api-response'

// GET /api/admin/profile - Obtener perfil del administrador autenticado
export async function GET(request: NextRequest) {
  try {
    const { user } = await requireAdmin(request)
    await connectToDatabase()

    const dbUser = await User.findById(user.id).select('-password').lean()
    if (!dbUser || Array.isArray(dbUser)) return jsonError('Usuario no encontrado', 404)

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
      // Datos informativos para la UI (placeholder si aún no hay fuentes)
      wallet: {
        availableBalance: dbUser.wallet?.availableBalance || 0,
        pendingPayouts: dbUser.wallet?.pendingPayouts || 0,
        lastPayoutAt: dbUser.wallet?.lastPayoutAt?.toISOString?.() || ''
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
