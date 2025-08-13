import { NextRequest } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import User from '@/models/User'
import { requireApprovedSupplier } from '@/lib/auth-middleware'
import { jsonOk, jsonError } from '@/lib/api-response'

// GET /api/supplier/profile - Obtener perfil del proveedor autenticado
export async function GET(request: NextRequest) {
  try {
    const { user } = await requireApprovedSupplier(request)
    await connectToDatabase()

    const dbUser = await User.findById(user.id).lean()
    // Mongoose typings for lean() can return a union of T | T[], aseguramos no-array
    if (!dbUser || Array.isArray(dbUser)) return jsonError('Usuario no encontrado', 404)

    // Mapear al shape esperado por la UI de `app/supplier/profile/page.tsx`
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
        businessType: dbUser.businessInfo?.businessType || '',
        description: dbUser.businessInfo?.description || '',
        website: dbUser.businessInfo?.website || '',
        socialMedia: {
          facebook: dbUser.businessInfo?.socialMedia?.facebook || '',
          instagram: dbUser.businessInfo?.socialMedia?.instagram || '',
          twitter: dbUser.businessInfo?.socialMedia?.twitter || ''
        },
        // Campos extendidos de tienda
        storeName: dbUser.businessInfo?.storeName || '',
        pickupAddress: {
          street: dbUser.businessInfo?.pickupAddress?.street || '',
          city: dbUser.businessInfo?.pickupAddress?.city || '',
          state: dbUser.businessInfo?.pickupAddress?.state || '',
          zipCode: dbUser.businessInfo?.pickupAddress?.zipCode || '',
          country: dbUser.businessInfo?.pickupAddress?.country || '',
          phone: dbUser.businessInfo?.pickupAddress?.phone || ''
        },
        openingHours: dbUser.businessInfo?.openingHours || ''
      },
      isApproved: !!dbUser.isApproved,
      status: dbUser.isApproved ? 'approved' : 'pending',
      createdAt: dbUser.createdAt?.toISOString?.() || '',
      updatedAt: dbUser.updatedAt?.toISOString?.() || '',
      preferences: {
        emailNotifications: !!dbUser.preferences?.notifications,
        smsNotifications: false,
        marketingEmails: !!dbUser.preferences?.marketing,
        orderUpdates: true,
        productUpdates: true,
        language: dbUser.preferences?.language || 'es'
      },
      stats: {
        totalProducts: dbUser.stats?.totalProducts || 0,
        totalOrders: dbUser.stats?.totalSales || 0,
        totalRevenue: 0,
        averageRating: 0,
        joinedDays: Math.max(1, Math.ceil((Date.now() - (dbUser.createdAt?.getTime?.() || Date.now())) / (1000 * 60 * 60 * 24)))
      }
    }

    return jsonOk({ profile })
  } catch (error) {
    console.error('Get supplier profile error:', error)
    return jsonError('Error interno del servidor', 500)
  }
}

// PUT /api/supplier/profile - Actualizar perfil del proveedor autenticado
export async function PUT(request: NextRequest) {
  try {
    const { user } = await requireApprovedSupplier(request)
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
        ...body.businessInfo,
        socialMedia: {
          facebook: body.businessInfo.socialMedia?.facebook || '',
          instagram: body.businessInfo.socialMedia?.instagram || '',
          twitter: body.businessInfo.socialMedia?.twitter || ''
        },
        pickupAddress: body.businessInfo.pickupAddress ? {
          street: body.businessInfo.pickupAddress.street || '',
          city: body.businessInfo.pickupAddress.city || '',
          state: body.businessInfo.pickupAddress.state || '',
          zipCode: body.businessInfo.pickupAddress.zipCode || '',
          country: body.businessInfo.pickupAddress.country || '',
          phone: body.businessInfo.pickupAddress.phone || ''
        } : undefined
      }
    }

    if (body.preferences) {
      update.preferences = {
        notifications: !!body.preferences.emailNotifications,
        marketing: !!body.preferences.marketingEmails,
        language: body.preferences.language || 'es'
      }
    }

    const updated = await User.findByIdAndUpdate(user.id, update, { new: true }).lean()
    if (!updated || Array.isArray(updated)) return jsonError('Usuario no encontrado', 404)

    // Devolver el mismo shape que en GET para consistencia entre paneles
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
        businessType: updated.businessInfo?.businessType || '',
        description: updated.businessInfo?.description || '',
        website: updated.businessInfo?.website || '',
        socialMedia: {
          facebook: updated.businessInfo?.socialMedia?.facebook || '',
          instagram: updated.businessInfo?.socialMedia?.instagram || '',
          twitter: updated.businessInfo?.socialMedia?.twitter || ''
        },
        storeName: updated.businessInfo?.storeName || '',
        pickupAddress: {
          street: updated.businessInfo?.pickupAddress?.street || '',
          city: updated.businessInfo?.pickupAddress?.city || '',
          state: updated.businessInfo?.pickupAddress?.state || '',
          zipCode: updated.businessInfo?.pickupAddress?.zipCode || '',
          country: updated.businessInfo?.pickupAddress?.country || '',
          phone: updated.businessInfo?.pickupAddress?.phone || ''
        },
        openingHours: updated.businessInfo?.openingHours || ''
      },
      isApproved: !!updated.isApproved,
      status: updated.isApproved ? 'approved' : 'pending',
      createdAt: updated.createdAt?.toISOString?.() || '',
      updatedAt: updated.updatedAt?.toISOString?.() || '',
      preferences: {
        emailNotifications: !!updated.preferences?.notifications,
        smsNotifications: false,
        marketingEmails: !!updated.preferences?.marketing,
        orderUpdates: true,
        productUpdates: true,
        language: updated.preferences?.language || 'es'
      },
      stats: {
        totalProducts: updated.stats?.totalProducts || 0,
        totalOrders: updated.stats?.totalSales || 0,
        totalRevenue: 0,
        averageRating: 0,
        joinedDays: Math.max(1, Math.ceil((Date.now() - (updated.createdAt?.getTime?.() || Date.now())) / (1000 * 60 * 60 * 24)))
      }
    }

    return jsonOk({ message: 'Perfil actualizado exitosamente', profile })
  } catch (error: any) {
    console.error('Update supplier profile error:', error)
    return jsonError(error?.message || 'Error interno del servidor', 500)
  }
}
