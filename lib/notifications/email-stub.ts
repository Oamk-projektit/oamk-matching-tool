/**
 * Backward-compatible re-exports.
 * Prefer `@/lib/notifications/email` for new code.
 */
export {
  deliverNotificationEmail,
  getEmailOutbox,
  resetEmailOutbox,
  simulateNotificationEmail,
  StubEmailProvider,
  setEmailProvider,
  resetEmailProvider,
  type EmailMessage,
  type EmailProvider,
} from '@/lib/notifications/email'
