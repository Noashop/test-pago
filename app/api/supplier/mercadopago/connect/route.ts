import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-middleware'
import { USER_ROLES } from '@/constants'

// GET /api/supplier/mercadopago/connect -> redirige a OAuth de Mercado Pago
export async function GET(request: NextRequest) {
  const { user } = await requireAuth(request)
  if (user.role !== USER_ROLES.SUPPLIER) {
    return NextResponse.json({ error: 'Solo proveedores pueden vincular Mercado Pago' }, { status: 403 })
  }

  const clientId = process.env.MP_CLIENT_ID
  const redirectUri = process.env.MP_REDIRECT_URI

  if (!clientId || !redirectUri) {
    return NextResponse.json({ error: 'Faltan variables MP_CLIENT_ID o MP_REDIRECT_URI' }, { status: 500 })
  }

  const state = encodeURIComponent(JSON.stringify({ uid: user.id }))
  const oauthUrl = new URL('https://auth.mercadopago.com/authorization')
  oauthUrl.searchParams.set('client_id', clientId)
  oauthUrl.searchParams.set('response_type', 'code')
  oauthUrl.searchParams.set('platform_id', 'mp')
  oauthUrl.searchParams.set('state', state)
  oauthUrl.searchParams.set('redirect_uri', redirectUri)

  return NextResponse.redirect(oauthUrl.toString(), { status: 302 })
}
