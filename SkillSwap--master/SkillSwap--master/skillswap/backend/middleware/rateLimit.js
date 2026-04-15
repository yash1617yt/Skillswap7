const buckets = new Map()

const getClientKey = (req) => {
  if (req?.user?.id) return `user:${req.user.id}`
  if (req?.userId) return `user:${req.userId}`

  const forwarded = req?.headers?.['x-forwarded-for']
  const ipFromForward = Array.isArray(forwarded) ? forwarded[0] : String(forwarded || '').split(',')[0].trim()
  const ip = ipFromForward || req?.ip || req?.socket?.remoteAddress || 'unknown'
  return `ip:${ip}`
}

const createRateLimiter = ({ windowMs = 60 * 1000, max = 30 } = {}) => {
  return (req, res, next) => {
    const now = Date.now()
    const key = getClientKey(req)
    const bucketKey = `${key}:${windowMs}:${max}`

    const existing = buckets.get(bucketKey)

    if (!existing || now > existing.expiresAt) {
      buckets.set(bucketKey, { count: 1, expiresAt: now + windowMs })
      return next()
    }

    if (existing.count >= max) {
      const retryAfterSec = Math.max(1, Math.ceil((existing.expiresAt - now) / 1000))
      res.set('Retry-After', String(retryAfterSec))
      return res.status(429).json({ message: 'Too many requests. Please try again shortly.' })
    }

    existing.count += 1
    return next()
  }
}

module.exports = {
  createRateLimiter,
}
