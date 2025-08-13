import { NextRequest } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import User from '@/models/User'
import { requireAuth } from '@/lib/auth-middleware'
import { jsonOk, jsonError } from '@/lib/api-response'

export async function GET(request: NextRequest) {
  try {
    const { user } = await requireAuth(request)
    await connectToDatabase()

    const dbUser = await User.findById(user.id).select('-password').lean()
    if (!dbUser) return jsonError('Usuario no encontrado', 404)

    return jsonOk({ user: dbUser })
  } catch (error) {
    console.error('Get profile error:', error)
    return jsonError('Error interno del servidor', 500)
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { user } = await requireAuth(request)
    await connectToDatabase()

    const body = await request.json()
    const update: any = {}
    if (body.name) update.name = body.name
    if (body.phone) update.phone = body.phone
    if (body.address) update.address = body.address
    if (body.preferences) update.preferences = body.preferences

    const updated = await User.findByIdAndUpdate(
      user.id,
      { $set: update },
      { new: true }
    ).select('-password')

    if (!updated) return jsonError('Usuario no encontrado', 404)
    return jsonOk({ user: updated })
  } catch (error) {
    console.error('Update profile error:', error)
    return jsonError('Error interno del servidor', 500)
  }
}



