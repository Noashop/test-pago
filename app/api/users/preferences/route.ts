import { NextRequest } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import User from '@/models/User'
import { requireAuth } from '@/lib/auth-middleware'
import { jsonOk, jsonError } from '@/lib/api-response'

export async function PATCH(request: NextRequest) {
  try {
    const { user } = await requireAuth(request)
    await connectToDatabase()

    const preferences = await request.json()
    if (!preferences || typeof preferences !== 'object') {
      return jsonError('Preferencias inválidas', 400)
    }

    const updated = await User.findByIdAndUpdate(
      user.id,
      { $set: { preferences } },
      { new: true }
    ).select('-password')

    if (!updated) return jsonError('Usuario no encontrado', 404)
    return jsonOk({ user: updated })
  } catch (error) {
    console.error('Update preferences error:', error)
    return jsonError('Error interno del servidor', 500)
  }
}



