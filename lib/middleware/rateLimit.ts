import { NextRequest, NextResponse } from 'next/server'

// ---------------------------------------------------------------------------
// In-process sliding-window rate limiter
//
// Usage in any App Router route handler:
//
//   import { rateLimit, rateLimitResponse } from '@/lib/middleware/rateLimit'
//
//   export async function POST(req: NextRequest) {
//     const limit = rateLimit(req, { limit: 20, windowMs: 60_000 })
//     if (!limit.allowed) return rateLimitResponse(limit.retryAfter)
//     // ... rest of handler
//   }
//
// Per-route presets are also exported for convenience:
//   rateLimitCoach, rateLimitRolePlay, rateLimitScenario, rateLimitAuth
// ---------------------------------------------------------------------------

type WindowEntry = {
  count: number
  windowStart: number
}

// Single shared store — survives across hot-reloads in dev via globalThis
declare global {
  var __rateLimitStore: Map<string, WindowEntry> | undefined
}

function getStore(): Map<string, WindowEntry> {
  if (!globalThis.__rateLimitStore) {
    globalThis.__rateLimitStore = new Map()
  }
  return globalThis.__rateLimitStore
}

// Purge stale entries every 5 minutes to prevent unbounded memory growth
let lastPurge = Date.now()
function maybePurge(windowMs: number) {
  const now = Date.now()
  if (now - lastPurge < 5 * 60 * 1000) return
  lastPurge = now
  const store = getStore()
  for (const [key, entry] of store.entries()) {
    if (now - entry.windowStart > windowMs * 2) {
      store.delete(key)
    }
  }
}

// ---------------------------------------------------------------------------
// Core identifier extraction
// ---------------------------------------------------------------------------

function getIdentifier(req: NextRequest, prefix: string): string {
  // Prefer forwarded IP (works behind Vercel / Nginx proxies)
  const forwarded = req.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown'

  // If the user is authenticated, also factor in their session token so
  // different users on the same IP get independent buckets
  const sessionToken =
    req.cookies.get('next-auth.session-token')?.value ??
    req.cookies.get('__Secure-next-auth.session-token')?.value ??
    ''

  const identity = sessionToken ? `${ip}:${sessionToken.slice(0, 16)}` : ip
  return `${prefix}:${identity}`
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type RateLimitOptions = {
  /** Max requests allowed in the window */
  limit: number
  /** Window size in milliseconds */
  windowMs: number
  /** Key prefix — use a unique string per route/endpoint */
  prefix?: string
}

export type RateLimitResult = {
  allowed: boolean
  remaining: number
  limit: number
  retryAfter: number   // seconds until window resets (0 when allowed)
  resetAt: number      // unix timestamp (ms) when window resets
}

// ---------------------------------------------------------------------------
// Main function
// ---------------------------------------------------------------------------

export function rateLimit(
  req: NextRequest,
  options: RateLimitOptions
): RateLimitResult {
  const { limit, windowMs, prefix = 'rl' } = options
  const now = Date.now()
  const store = getStore()

  maybePurge(windowMs)

  const key = getIdentifier(req, prefix)
  const entry = store.get(key)

  // Start fresh window if none exists or previous window has expired
  if (!entry || now - entry.windowStart >= windowMs) {
    store.set(key, { count: 1, windowStart: now })
    return {
      allowed: true,
      remaining: limit - 1,
      limit,
      retryAfter: 0,
      resetAt: now + windowMs,
    }
  }

  // Within existing window
  if (entry.count < limit) {
    entry.count++
    store.set(key, entry)
    return {
      allowed: true,
      remaining: limit - entry.count,
      limit,
      retryAfter: 0,
      resetAt: entry.windowStart + windowMs,
    }
  }

  // Limit exceeded
  const retryAfter = Math.ceil((entry.windowStart + windowMs - now) / 1000)
  return {
    allowed: false,
    remaining: 0,
    limit,
    retryAfter,
    resetAt: entry.windowStart + windowMs,
  }
}

// ---------------------------------------------------------------------------
// Standard 429 response with Retry-After header
// ---------------------------------------------------------------------------

export function rateLimitResponse(retryAfter = 60): NextResponse {
  return NextResponse.json(
    {
      error: 'Too many requests. Please slow down.',
      retryAfter,
    },
    {
      status: 429,
      headers: {
        'Retry-After': String(retryAfter),
        'X-RateLimit-Limit': '0',
        'Content-Type': 'application/json',
      },
    }
  )
}

// ---------------------------------------------------------------------------
// Convenience helper — add RateLimit headers to an existing response
// ---------------------------------------------------------------------------

export function applyRateLimitHeaders(
  response: NextResponse,
  result: RateLimitResult
): NextResponse {
  response.headers.set('X-RateLimit-Limit', String(result.limit))
  response.headers.set('X-RateLimit-Remaining', String(result.remaining))
  response.headers.set('X-RateLimit-Reset', String(Math.ceil(result.resetAt / 1000)))
  return response
}

// ---------------------------------------------------------------------------
// Per-route presets
// ---------------------------------------------------------------------------

/** AI coach feedback — 30 req / min per IP */
export function rateLimitCoach(req: NextRequest): RateLimitResult {
  return rateLimit(req, { limit: 30, windowMs: 60_000, prefix: 'coach' })
}

/** Role-play message turns — 40 req / min per IP (streaming) */
export function rateLimitRolePlay(req: NextRequest): RateLimitResult {
  return rateLimit(req, { limit: 40, windowMs: 60_000, prefix: 'roleplay' })
}

/** Scenario run start/event — 60 req / min per IP */
export function rateLimitScenario(req: NextRequest): RateLimitResult {
  return rateLimit(req, { limit: 60, windowMs: 60_000, prefix: 'scenario' })
}

/** Auth endpoints (signup / login / verify) — 10 req / 15 min per IP */
export function rateLimitAuth(req: NextRequest): RateLimitResult {
  return rateLimit(req, { limit: 10, windowMs: 15 * 60_000, prefix: 'auth' })
}

/** Generic strict limiter for sensitive actions (5 req / 10 min) */
export function rateLimitStrict(req: NextRequest): RateLimitResult {
  return rateLimit(req, { limit: 5, windowMs: 10 * 60_000, prefix: 'strict' })
}