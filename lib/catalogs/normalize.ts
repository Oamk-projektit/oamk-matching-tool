/**
 * Controlled string normalization for skill / interest labels.
 * Collapses whitespace and lowercases for uniqueness keys.
 */
export function normalizeCatalogLabel(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLowerCase()
}

export function displayCatalogLabel(value: string): string {
  return value.trim().replace(/\s+/g, ' ')
}
