/**
 * ============================================================================
 * TOMMI — Notifications / email simulation (issues #138, #146)
 * ============================================================================
 *
 * MVP does not send real email. This stub records "outbound" messages so
 * integration tests can assert that a notification event was simulated.
 * Swap `deliverNotificationEmail` later for Resend/SendGrid without changing callers.
 */

export type SimulatedEmail = {
  toUserId: string
  subject: string
  body: string
  createdAt: string
}

const outbox: SimulatedEmail[] = []

export function resetEmailOutbox(): void {
  outbox.length = 0
}

export function getEmailOutbox(): readonly SimulatedEmail[] {
  return outbox
}

export function simulateNotificationEmail(input: {
  toUserId: string
  type: string
  content: string
}): SimulatedEmail {
  const mail: SimulatedEmail = {
    toUserId: input.toUserId,
    subject: `[OAMK Matching] ${input.type}`,
    body: input.content,
    createdAt: new Date().toISOString(),
  }
  outbox.push(mail)
  if (process.env.NODE_ENV !== 'production') {
    console.info('[email-stub]', mail.subject, '→', mail.toUserId)
  }
  return mail
}
