import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import SupplierPaymentAccount from '@/models/SupplierPaymentAccount'

// GET /api/supplier/mercadopago/callback?code=...&state=...
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase()

    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const stateStr = searchParams.get('state')

    if (!code || !stateStr) {
      return NextResponse.json({ error: 'Faltan parámetros code/state' }, { status: 400 })
    }

    let state: any = {}
    try { state = JSON.parse(decodeURIComponent(stateStr)) } catch {}
    const userId = state?.uid
    if (!userId) {
      return NextResponse.json({ error: 'State inválido' }, { status: 400 })
    }

    const clientId = process.env.MP_CLIENT_ID
    const clientSecret = process.env.MP_CLIENT_SECRET
    const redirectUri = process.env.MP_REDIRECT_URI

    if (!clientId || !clientSecret || !redirectUri) {
      return NextResponse.json({ error: 'Faltan variables MP_CLIENT_ID/MP_CLIENT_SECRET/MP_REDIRECT_URI' }, { status: 500 })
    }

    // Intercambiar code por tokens
    const resp = await fetch('https://api.mercadopago.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri
      })
    })

    if (!resp.ok) {
      const errText = await resp.text()
      return NextResponse.json({ error: 'Error al obtener tokens', details: errText }, { status: 500 })
    }

    const data = await resp.json()
    const { access_token, refresh_token, token_type, expires_in, scope, user_id } = data

    const expiresAt = new Date(Date.now() + (Number(expires_in) || 0) * 1000)

    // Guardar/actualizar cuenta del proveedor
    await SupplierPaymentAccount.findOneAndUpdate(
      { userId },
      {
        userId,
        mpUserId: String(user_id),
        accessToken: access_token,
        refreshToken: refresh_token,
        tokenType: token_type,
        scope,
        expiresAt
      },
      { upsert: true, new: true }
    )

    // Redirigir de vuelta al perfil del proveedor con mensaje
    const uiUrl = process.env.NEXT_PUBLIC_BASE_URL
      ? `${process.env.NEXT_PUBLIC_BASE_URL}/supplier/profile?mp=connected`
      : '/supplier/profile?mp=connected'
    return NextResponse.redirect(uiUrl, { status: 302 })
  } catch (error) {
    console.error('OAuth callback error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
