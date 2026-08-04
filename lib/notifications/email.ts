/**
 * Swappable email delivery for notifications.
 * Production can plug in Resend/SendGrid; development uses an in-memory stub.
 * Providers must never throw into selection/application transactions — callers
 * catch and log failures so domain writes are not rolled back.
 */

export type EmailMessage = {
  toProfileId: string
  toEmail?: string | null
  subject: string
  body: string
  type: string
}

export interface EmailProvider {
  readonly name: string
  send(message: EmailMessage): Promise<void>
}

export type DeliveredEmail = EmailMessage & { createdAt: string }

const outbox: DeliveredEmail[] = []

export function resetEmailOutbox(): void {
  outbox.length = 0
}

export function getEmailOutbox(): readonly DeliveredEmail[] {
  return outbox
}

/** Safe development simulator — records outbound mail without SMTP. */
export class StubEmailProvider implements EmailProvider {
  readonly name = 'stub'

  async send(message: EmailMessage): Promise<void> {
    const delivered: DeliveredEmail = {
      ...message,
      createdAt: new Date().toISOString(),
    }
    outbox.push(delivered)
    if (process.env.NODE_ENV !== 'production') {
      console.info(
        `[email:${this.name}]`,
        message.subject,
        '→',
        message.toProfileId
      )
    }
  }
}

/** Provider that always fails — for verifying domain flows ignore email errors. */
export class FailingEmailProvider implements EmailProvider {
  readonly name = 'failing'

  async send(_message: EmailMessage): Promise<void> {
    void _message
    throw new Error('Simulated email provider failure')
  }
}

let activeProvider: EmailProvider = new StubEmailProvider()

export function getEmailProvider(): EmailProvider {
  return activeProvider
}

export function setEmailProvider(provider: EmailProvider): void {
  activeProvider = provider
}

export function resetEmailProvider(): void {
  activeProvider = new StubEmailProvider()
}

/** Deliver via the active provider; never throws. */
export async function deliverNotificationEmail(
  message: EmailMessage
): Promise<{ ok: boolean; error?: string }> {
  try {
    await getEmailProvider().send(message)
    return { ok: true }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Email delivery failed'
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[email] delivery failed (non-fatal):', msg)
    }
    return { ok: false, error: msg }
  }
}

/** @deprecated use deliverNotificationEmail + StubEmailProvider */
export function simulateNotificationEmail(input: {
  toUserId: string
  type: string
  content: string
}): DeliveredEmail {
  const mail: DeliveredEmail = {
    toProfileId: input.toUserId,
    subject: `[OAMK Matching] ${input.type}`,
    body: input.content,
    type: input.type,
    createdAt: new Date().toISOString(),
  }
  outbox.push(mail)
  return mail
}
