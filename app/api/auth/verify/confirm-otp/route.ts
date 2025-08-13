import { NextResponse } from 'next/server'

export async function POST() {
  // OTP deshabilitado por requerimiento
  return NextResponse.json({ error: 'OTP deshabilitado' }, { status: 410 })
}
