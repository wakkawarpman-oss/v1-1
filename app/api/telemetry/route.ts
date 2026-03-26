import { Resend } from 'resend'
import { NextRequest, NextResponse } from 'next/server'

// In-memory rate limiter: max 5 requests per IP per 60 minutes.
// Resets on cold start — acceptable for free-tier abuse prevention.
const rateMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT = 5
const RATE_WINDOW_MS = 60 * 60 * 1000

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = rateMap.get(ip)
  if (!entry || now > entry.resetAt) {
    rateMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS })
    return false
  }
  if (entry.count >= RATE_LIMIT) return true
  entry.count++
  return false
}

const ALLOWED_ORIGINS = new Set([
  'https://dronecalc.pp.ua',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
])

const ALLOWED_DRONE_TYPES = new Set(['multirotor', 'fixed-wing', 'vtol'])

function sanitizeNum(val: unknown): string {
  const n = parseFloat(String(val))
  return Number.isFinite(n) ? String(n) : '—'
}

function sanitizeText(val: unknown, maxLen = 500): string {
  if (typeof val !== 'string') return '—'
  const trimmed = val.trim().slice(0, maxLen)
  return trimmed || '—'
}

export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get('origin') ?? ''
  if (!ALLOWED_ORIGINS.has(origin)) {
    return new NextResponse(null, { status: 403 })
  }
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  })
}

export async function POST(req: NextRequest) {
  // CORS — reject cross-origin requests not from allowed origins
  const origin = req.headers.get('origin') ?? ''
  if (origin && !ALLOWED_ORIGINS.has(origin)) {
    return NextResponse.json({ ok: false }, { status: 403 })
  }

  // Rate limiting by IP
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  if (isRateLimited(ip)) {
    return NextResponse.json({ ok: false }, { status: 429 })
  }

  // Parse body — return 400 on bad JSON
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  // Validate and sanitize inputs
  const rawType = body.droneType
  const droneType = typeof rawType === 'string' && ALLOWED_DRONE_TYPES.has(rawType)
    ? rawType
    : 'unknown'
  const flightTimeActual = sanitizeNum(body.flightTimeActual)
  const flightTimeCalc   = sanitizeNum(body.flightTimeCalc)
  const wind             = sanitizeNum(body.wind)
  const tempC            = sanitizeNum(body.tempC)
  const altM             = sanitizeNum(body.altM)
  const notes            = sanitizeText(body.notes)

  const resend = new Resend(process.env.RESEND_API_KEY)

  try {
    await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: 'wakkawarpman@gmail.com',
      subject: `[droneCalc] Телеметрія — ${droneType}`,
      text: [
        `Тип: ${droneType}`,
        `Час польоту реальний: ${flightTimeActual} хв`,
        `Час польоту розрахунковий: ${flightTimeCalc} хв`,
        `Вітер: ${wind} м/с`,
        `Температура: ${tempC} °C`,
        `Висота: ${altM} м`,
        `Примітки: ${notes}`,
      ].join('\n'),
    })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[telemetry] Resend error:', err)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
