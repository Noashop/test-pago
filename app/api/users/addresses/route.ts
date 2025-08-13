import { NextRequest } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import User from '@/models/User'
import { requireAuth } from '@/lib/auth-middleware'
import { jsonOk, jsonError } from '@/lib/api-response'

// GET: listar direcciones del usuario
export async function GET(request: NextRequest) {
  try {
    const { user } = await requireAuth(request)
    await connectToDatabase()

    const dbUser = await User.findById(user.id)
      .select('addressBook')
      .lean<{ addressBook?: any[] }>()
    if (!dbUser) return jsonError('Usuario no encontrado', 404)

    return jsonOk({ addresses: dbUser?.addressBook || [] })
  } catch (error) {
    console.error('GET /users/addresses error:', error)
    return jsonError('Error interno del servidor', 500)
  }
}

// POST: agregar dirección
export async function POST(request: NextRequest) {
  try {
    const { user } = await requireAuth(request)
    await connectToDatabase()

    const body = await request.json()
    const address = {
      label: body.label,
      street: body.street,
      city: body.city,
      state: body.state,
      zipCode: body.zipCode,
      country: body.country,
      phone: body.phone,
      type: body.type || 'shipping',
      isDefault: !!body.isDefault,
    }

    // Si se marca como default, desmarcar el resto primero
    if (address.isDefault) {
      await User.updateOne({ _id: user.id }, { $set: { 'addressBook.$[].isDefault': false } })
    }

    const updated = await User.findByIdAndUpdate(
      user.id,
      { $push: { addressBook: address } },
      { new: true }
    ).select('addressBook')

    return jsonOk({ addresses: updated?.addressBook || [] })
  } catch (error) {
    console.error('POST /users/addresses error:', error)
    return jsonError('Error interno del servidor', 500)
  }
}

// PUT: actualizar dirección por id (query param ?id=)
export async function PUT(request: NextRequest) {
  try {
    const { user } = await requireAuth(request)
    await connectToDatabase()

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return jsonError('Falta id de dirección', 400)

    const body = await request.json()

    // Si se marca default, desmarcar otras
    if (body.isDefault === true) {
      await User.updateOne({ _id: user.id }, { $set: { 'addressBook.$[].isDefault': false } })
    }

    const setObj: any = {}
    const allowed = ['label','street','city','state','zipCode','country','phone','type','isDefault']
    for (const k of allowed) if (k in body) setObj[`addressBook.$.${k}`] = body[k]

    const updated = await User.findOneAndUpdate(
      { _id: user.id, 'addressBook._id': id },
      { $set: setObj },
      { new: true }
    ).select('addressBook')

    if (!updated) return jsonError('Dirección no encontrada', 404)
    return jsonOk({ addresses: updated.addressBook })
  } catch (error) {
    console.error('PUT /users/addresses error:', error)
    return jsonError('Error interno del servidor', 500)
  }
}

// DELETE: eliminar dirección (?id=)
export async function DELETE(request: NextRequest) {
  try {
    const { user } = await requireAuth(request)
    await connectToDatabase()

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return jsonError('Falta id de dirección', 400)

    const updated = await User.findByIdAndUpdate(
      user.id,
      { $pull: { addressBook: { _id: id } } },
      { new: true }
    ).select('addressBook')

    return jsonOk({ addresses: updated?.addressBook || [] })
  } catch (error) {
    console.error('DELETE /users/addresses error:', error)
    return jsonError('Error interno del servidor', 500)
  }
}
