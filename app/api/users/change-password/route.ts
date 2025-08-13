import { NextRequest } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import User from '@/models/User'
import { requireAuth } from '@/lib/auth-middleware'
import { jsonOk, jsonError } from '@/lib/api-response'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { user } = await requireAuth(request)
    await connectToDatabase()

    const { oldPassword, newPassword } = await request.json()
    if (!oldPassword || !newPassword || newPassword.length < 6) {
      return jsonError('Datos inválidos', 400)
    }

    const dbUser = await User.findById(user.id).select('+password')
    if (!dbUser || !dbUser.password) return jsonError('Usuario no encontrado', 404)

    const matches = await bcrypt.compare(oldPassword, dbUser.password)
    if (!matches) return jsonError('Contraseña actual incorrecta', 400)

    const hashed = await bcrypt.hash(newPassword, 10)
    dbUser.password = hashed
    await dbUser.save()

    return jsonOk({ message: 'Contraseña actualizada' })
  } catch (error) {
    console.error('Change password error:', error)
    return jsonError('Error interno del servidor', 500)
  }
}



