export function toPlainObject<T>(value: T): T {
  return JSON.parse(JSON.stringify(value))
}

export function normalizeOptionalString(value?: string | null) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

export function toSlug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
