import { NextResponse } from 'next/server'

export async function POST() {
  // OTP deshabilitado por requerimiento: no se envían códigos por email para login/registro
  return NextResponse.json({ error: 'OTP deshabilitado' }, { status: 410 })
}
