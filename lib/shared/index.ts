/**
 * ============================================================================
 * SHARED CONTRACT — Tommi + Venla
 * ============================================================================
 *
 * Convenience re-exports for frontend service wiring (#143).
 */

export {
  createSharedApiClient,
  SharedApiError,
  type SharedApiClient,
  type SharedApiClientOptions,
} from './api-client'

export {
  DEMO_PASSWORD,
  DEMO_USERS,
  DEMO_STUDENTS,
  DEMO_OPPORTUNITIES,
  DEMO_MATCHES,
} from './demo-fixtures'
