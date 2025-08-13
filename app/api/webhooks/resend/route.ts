import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'

// Minimal Resend webhook handler
// Note: Resend webhooks are typically signed (Svix). To avoid adding deps right now,
// we protect with a shared secret via query param for initial testing.
// You can later switch to signature verification using Svix SDK.

function validateSecret(request: NextRequest) {
  const incoming = request.nextUrl.searchParams.get('secret') || ''
  const expected = process.env.RESEND_WEBHOOK_SECRET || ''
  return expected && incoming === expected
}

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase()

    if (!validateSecret(request)) {
      console.warn('🔒 Invalid Resend webhook secret')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const event = await request.json().catch(() => null)
    if (!event) {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    // Basic structured logging for observability and future handling
    const { type, data } = event
    console.log('📬 RESEND WEBHOOK:', {
      type,
      id: data?.id,
      to: data?.to,
      subject: data?.subject,
      status: data?.status,
      createdAt: data?.created_at,
      error: data?.error,
    })

    // TODO: Handle bounces/complaints/unsubscribes to suppress future sends if needed
    // switch (type) {
    //   case 'email.bounced':
    //   case 'email.complained':
    //     // Mark user/email as suppressed in your DB
    //     break
    //   default:
    //     break
    // }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('❌ Resend webhook error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  // Simple health-check for configuring the webhook in Resend dashboard
  if (!validateSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return NextResponse.json({ status: 'ok' })
}
