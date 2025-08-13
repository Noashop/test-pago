import { Resend } from 'resend'

if (!process.env.RESEND_API_KEY) {
  console.warn('RESEND_API_KEY is not set. Email sending will be disabled.')
}

export const resend = new Resend(process.env.RESEND_API_KEY || 'dev-disabled')

export function isEmailEnabled() {
  return Boolean(process.env.RESEND_API_KEY)
}
