/**
 * ============================================================================
 * SHARED CONTRACT — Tommi + Venla
 * ============================================================================
 *
 * Compatibility facade for older `#143` imports.
 * Prefer `createApiClient` / `api` from `@/lib/api/client` for new UI code —
 * that client unwraps `{ data, meta }` and targets the live projects-model API.
 */

export {
  createApiClient as createSharedApiClient,
  ApiClientError as SharedApiError,
  api as sharedApi,
  type ApiClient as SharedApiClient,
  type ApiClientOptions as SharedApiClientOptions,
} from '@/lib/api/client'
