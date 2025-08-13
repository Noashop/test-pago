import { resend, isEmailEnabled } from './resend'

function appBaseUrl() {
  return process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
}

export async function sendVerificationCodeEmail(to: string, code: string) {
  if (!isEmailEnabled()) return { skipped: true }
  const subject = 'Verificación de correo - Salta Conecta'
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto">
      <h2>Verificá tu correo</h2>
      <p>Usá este código para verificar tu cuenta. Expira en 10 minutos.</p>
      <div style="font-size:28px;font-weight:700;letter-spacing:6px;background:#f4f4f5;padding:12px 16px;text-align:center;border-radius:8px">${code}</div>
      <p style="color:#555">Si no solicitaste este código, ignorá este correo.</p>
    </div>`
  return resend.emails.send({ from: 'Notificaciones <no-reply@salta-conecta.app>', to, subject, html })
}

export async function sendRegistrationSuccessEmail(to: string, name?: string) {
  if (!isEmailEnabled()) return { skipped: true }
  const subject = 'Registro confirmado - Salta Conecta'
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto">
      <h2>¡Bienvenido${name ? ', ' + name : ''}!</h2>
      <p>Tu correo fue verificado correctamente.</p>
      <p>Ya podés iniciar sesión y empezar a comprar y vender.</p>
    </div>`
  return resend.emails.send({ from: 'Notificaciones <no-reply@salta-conecta.app>', to, subject, html })
}

export async function sendOrderCreatedEmail(to: string, orderNumber: string, total: number) {
  if (!isEmailEnabled()) return { skipped: true }
  const subject = `Pedido creado ${orderNumber}`
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto">
      <h2>Recibimos tu pedido</h2>
      <p>Número: <b>${orderNumber}</b></p>
      <p>Total: <b>$${total.toFixed(2)}</b></p>
      <p>Podés ver el estado en ${appBaseUrl()}/orders</p>
    </div>`
  return resend.emails.send({ from: 'Pedidos <no-reply@salta-conecta.app>', to, subject, html })
}

export async function sendPaymentApprovedEmail(to: string, orderNumber: string, paymentId?: string) {
  if (!isEmailEnabled()) return { skipped: true }
  const subject = `Pago aprobado - Pedido ${orderNumber}`
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto">
      <h2>Pago confirmado</h2>
      <p>Tu pago fue aprobado para el pedido <b>${orderNumber}</b>.</p>
      ${paymentId ? `<p>ID de pago: <b>${paymentId}</b></p>` : ''}
      <p>Seguimiento en ${appBaseUrl()}/orders</p>
    </div>`
  return resend.emails.send({ from: 'Pagos <no-reply@salta-conecta.app>', to, subject, html })
}

export async function sendShippingUpdateEmail(to: string, orderNumber: string, tracking?: string) {
  if (!isEmailEnabled()) return { skipped: true }
  const subject = `Envío actualizado - Pedido ${orderNumber}`
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto">
      <h2>Tu pedido está en camino</h2>
      <p>Pedido <b>${orderNumber}</b> fue actualizado a enviado.</p>
      ${tracking ? `<p>Número de seguimiento: <b>${tracking}</b></p>` : ''}
    </div>`
  return resend.emails.send({ from: 'Envíos <no-reply@salta-conecta.app>', to, subject, html })
}
