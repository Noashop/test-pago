import { NextRequest } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import User from '@/models/User'
import { requireAuth } from '@/lib/auth-middleware'
import { jsonOk, jsonError } from '@/lib/api-response'

// GET: listar billeteras del usuario
export async function GET(request: NextRequest) {
  try {
    const { user } = await requireAuth(request)
    await connectToDatabase()

    const dbUser = await User.findById(user.id)
      .select('wallets')
      .lean<{ wallets?: any[] }>()
    if (!dbUser) return jsonError('Usuario no encontrado', 404)

    return jsonOk({ wallets: dbUser?.wallets || [] })
  } catch (error) {
    console.error('GET /users/wallet error:', error)
    return jsonError('Error interno del servidor', 500)
  }
}

// POST: agregar billetera (si se marca isPrimary, desmarca otras)
export async function POST(request: NextRequest) {
  try {
    const { user } = await requireAuth(request)
    await connectToDatabase()

    const body = await request.json()
    if (!body.provider || !['mercadopago', 'bank'].includes(body.provider)) {
      return jsonError('Proveedor inválido', 400)
    }

    const wallet = {
      provider: body.provider,
      alias: body.alias,
      cbu: body.cbu,
      cvu: body.cvu,
      accountId: body.accountId,
      holderName: body.holderName,
      isPrimary: !!body.isPrimary,
    }

    if (wallet.isPrimary) {
      await User.updateOne({ _id: user.id }, { $set: { 'wallets.$[].isPrimary': false } })
    }

    const updated = await User.findByIdAndUpdate(
      user.id,
      { $push: { wallets: wallet } },
      { new: true }
    ).select('wallets')

    return jsonOk({ wallets: updated?.wallets || [] })
  } catch (error) {
    console.error('POST /users/wallet error:', error)
    return jsonError('Error interno del servidor', 500)
  }
}

// PUT: actualizar billetera (?id=)
export async function PUT(request: NextRequest) {
  try {
    const { user } = await requireAuth(request)
    await connectToDatabase()

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return jsonError('Falta id de billetera', 400)

    const body = await request.json()

    if (body.isPrimary === true) {
      await User.updateOne({ _id: user.id }, { $set: { 'wallets.$[].isPrimary': false } })
    }

    const setObj: any = {}
    const allowed = ['provider','alias','cbu','cvu','accountId','holderName','isPrimary']
    for (const k of allowed) if (k in body) setObj[`wallets.$.${k}`] = body[k]

    const updated = await User.findOneAndUpdate(
      { _id: user.id, 'wallets._id': id },
      { $set: setObj },
      { new: true }
    ).select('wallets')

    if (!updated) return jsonError('Billetera no encontrada', 404)
    return jsonOk({ wallets: updated.wallets })
  } catch (error) {
    console.error('PUT /users/wallet error:', error)
    return jsonError('Error interno del servidor', 500)
  }
}

// DELETE: eliminar billetera (?id=)
export async function DELETE(request: NextRequest) {
  try {
    const { user } = await requireAuth(request)
    await connectToDatabase()

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return jsonError('Falta id de billetera', 400)

    const updated = await User.findByIdAndUpdate(
      user.id,
      { $pull: { wallets: { _id: id } } },
      { new: true }
    ).select('wallets')

    return jsonOk({ wallets: updated?.wallets || [] })
  } catch (error) {
    console.error('DELETE /users/wallet error:', error)
    return jsonError('Error interno del servidor', 500)
  }
}
