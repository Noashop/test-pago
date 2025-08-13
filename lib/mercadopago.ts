import { MercadoPagoConfig, Preference, Payment } from 'mercadopago'

// Initialize MercadoPago client
const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
  options: {
    timeout: 5000,
  }
})

export const preference = new Preference(client)
export const payment = new Payment(client)

export interface CreatePreferenceData {
  orderId: string
  items: {
    id: string
    title: string
    description?: string
    picture_url?: string
    category_id?: string
    quantity: number
    currency_id: string
    unit_price: number
  }[]
  payer: {
    name?: string
    surname?: string
    email: string
    phone?: {
      area_code?: string
      number?: string
    }
    identification?: {
      type?: string
      number?: string
    }
    address?: {
      street_name?: string
      street_number?: string
      zip_code?: string
    }
  }
  back_urls: {
    success: string
    failure: string
    pending: string
  }
  auto_return?: 'approved' | 'all'
  payment_methods?: {
    excluded_payment_methods?: { id: string }[]
    excluded_payment_types?: { id: string }[]
    installments?: number
  }
  notification_url?: string
  statement_descriptor?: string
  external_reference?: string
  expires?: boolean
  expiration_date_from?: string
  expiration_date_to?: string
}

export async function createPaymentPreference(data: CreatePreferenceData) {
  try {
    const preferenceData = {
      items: data.items,
      payer: data.payer,
      back_urls: data.back_urls,
      auto_return: data.auto_return || 'approved',
      payment_methods: {
        // Enable all payment methods
        excluded_payment_methods: [], // No excluded methods
        excluded_payment_types: [], // No excluded types
        installments: 12, // Allow up to 12 installments
        default_installments: 1
      },
      notification_url: data.notification_url,
      statement_descriptor: data.statement_descriptor || 'Salta Conecta',
      external_reference: data.external_reference || data.orderId,
      expires: data.expires || false,
      expiration_date_from: data.expiration_date_from,
      expiration_date_to: data.expiration_date_to,
    }

    // Generar idempotency key por operación (usar orderId + timestamp)
    const idempotencyKey = `${data.orderId}-${Date.now()}`
    const response = await preference.create({ body: preferenceData, requestOptions: { idempotencyKey } })
    return response
  } catch (error) {
    console.error('Error creating MercadoPago preference:', error)
    throw new Error('Failed to create payment preference')
  }
}

export async function getPaymentInfo(paymentId: string) {
  try {
    const response = await payment.get({ id: paymentId })
    return response
  } catch (error) {
    console.error('Error getting payment info:', error)
    throw new Error('Failed to get payment information')
  }
}

export function validateWebhookSignature(
  xSignature: string,
  xRequestId: string,
  dataId: string,
  secret: string
): boolean {
  try {
    const crypto = require('crypto')
    
    // Extract ts and hash from x-signature
    const parts = xSignature.split(',')
    let ts = ''
    let hash = ''
    
    parts.forEach(part => {
      const [key, value] = part.split('=')
      if (key && value) {
        if (key.trim() === 'ts') {
          ts = value.trim()
        } else if (key.trim() === 'v1') {
          hash = value.trim()
        }
      }
    })

    if (!ts || !hash) {
      return false
    }

    // Create the manifest string
    const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`
    
    // Generate HMAC
    const hmac = crypto.createHmac('sha256', secret)
    hmac.update(manifest)
    const generatedHash = hmac.digest('hex')
    
    return generatedHash === hash
  } catch (error) {
    console.error('Error validating webhook signature:', error)
    return false
  }
}

export const MERCADO_PAGO_PAYMENT_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  AUTHORIZED: 'authorized',
  IN_PROCESS: 'in_process',
  IN_MEDIATION: 'in_mediation',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
  CHARGED_BACK: 'charged_back',
} as const

export type MercadoPagoPaymentStatus = typeof MERCADO_PAGO_PAYMENT_STATUS[keyof typeof MERCADO_PAGO_PAYMENT_STATUS]
