type Entry = {
  count: number
  resetAt: number
}

const store = new Map<string, Entry>()

export function checkRateLimit(
  key: string,
  limit = 60,
  windowMs = 60_000,
) {
  const now = Date.now()
  const current = store.get(key)

  if (!current || current.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs }
  }

  if (current.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: current.resetAt,
    }
  }

  current.count += 1
  return {
    allowed: true,
    remaining: Math.max(0, limit - current.count),
    resetAt: current.resetAt,
  }
}
