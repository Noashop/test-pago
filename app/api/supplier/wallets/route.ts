import { NextRequest, NextResponse } from 'next/server'
import { requireApprovedSupplier } from '@/lib/auth-middleware'
import { connectToDatabase } from '@/lib/mongodb'
import User from '@/models/User'

export async function GET(request: NextRequest) {
  try {
    const { user } = await requireApprovedSupplier(request)
    await connectToDatabase()

    const doc = await User.findById(user.id).select('wallets').lean<{ wallets?: any[] }>()
    return NextResponse.json({ wallets: (doc && Array.isArray(doc.wallets) ? doc.wallets : []) })
  } catch (err) {
    console.error('GET /supplier/wallets', err)
    return NextResponse.json({ error: 'Error al obtener destinos de cobro' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user } = await requireApprovedSupplier(req)
    await connectToDatabase()

    const body = await req.json()
    const { provider, alias, cbu, cvu, accountId, holderName, isPrimary } = body || {}

    if (!provider || !['mercadopago', 'bank'].includes(provider)) {
      return NextResponse.json({ error: 'Proveedor inválido' }, { status: 400 })
    }

    const update: any = {
      provider,
      alias: alias?.toString().trim() || undefined,
      cbu: cbu?.toString().trim() || undefined,
      cvu: cvu?.toString().trim() || undefined,
      accountId: accountId?.toString().trim() || undefined,
      holderName: holderName?.toString().trim() || undefined,
      isPrimary: !!isPrimary
    }

    const supplier = await User.findById(user.id)
    if (!supplier) return NextResponse.json({ error: 'Proveedor no encontrado' }, { status: 404 })

    supplier.wallets = supplier.wallets || []

    if (update.isPrimary) {
      for (const w of supplier.wallets) w.isPrimary = false
    }

    supplier.wallets.push(update)
    await supplier.save()

    return NextResponse.json({ message: 'Destino de cobro agregado', wallets: supplier.wallets })
  } catch (err) {
    console.error('POST /supplier/wallets', err)
    return NextResponse.json({ error: 'Error al agregar destino de cobro' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { user } = await requireApprovedSupplier(req)
    await connectToDatabase()

    const body = await req.json()
    const { walletId, isPrimary } = body || {}

    if (!walletId) return NextResponse.json({ error: 'walletId requerido' }, { status: 400 })

    const supplier = await User.findById(user.id)
    if (!supplier) return NextResponse.json({ error: 'Proveedor no encontrado' }, { status: 404 })

    supplier.wallets = supplier.wallets || []
    const w = supplier.wallets.id(walletId)
    if (!w) return NextResponse.json({ error: 'Destino no encontrado' }, { status: 404 })

    if (typeof isPrimary === 'boolean') {
      if (isPrimary) {
        for (const x of supplier.wallets) x.isPrimary = false
      }
      w.isPrimary = isPrimary
    }

    await supplier.save()
    return NextResponse.json({ message: 'Destino actualizado', wallets: supplier.wallets })
  } catch (err) {
    console.error('PATCH /supplier/wallets', err)
    return NextResponse.json({ error: 'Error al actualizar destino' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { user } = await requireApprovedSupplier(req)
    await connectToDatabase()

    const { searchParams } = new URL(req.url)
    const walletId = searchParams.get('walletId')
    if (!walletId) return NextResponse.json({ error: 'walletId requerido' }, { status: 400 })

    const supplier = await User.findById(user.id)
    if (!supplier) return NextResponse.json({ error: 'Proveedor no encontrado' }, { status: 404 })

    supplier.wallets = supplier.wallets || []
    const before = supplier.wallets.length
    supplier.wallets = supplier.wallets.filter((w: any) => String(w._id) !== String(walletId)) as any

    if (supplier.wallets.length === before) {
      return NextResponse.json({ error: 'Destino no encontrado' }, { status: 404 })
    }

    await supplier.save()
    return NextResponse.json({ message: 'Destino eliminado', wallets: supplier.wallets })
  } catch (err) {
    console.error('DELETE /supplier/wallets', err)
    return NextResponse.json({ error: 'Error al eliminar destino' }, { status: 500 })
  }
}
