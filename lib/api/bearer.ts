/**
 * Pure helpers for Authorization header parsing (easy to unit test).
 */

export function extractBearerToken(
  authorizationHeader: string | null | undefined
): string | null {
  if (!authorizationHeader) return null
  const match = /^Bearer\s+(.+)$/i.exec(authorizationHeader.trim())
  if (!match) return null
  const token = match[1].trim()
  return token.length > 0 ? token : null
}
