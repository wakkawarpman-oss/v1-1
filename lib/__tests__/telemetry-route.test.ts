import { describe, expect, test } from 'vitest'
import { NextRequest } from 'next/server'

import { OPTIONS, POST } from '@/app/api/telemetry/route'

describe('telemetry route cors and fallback behavior', () => {
  test('OPTIONS allows idempotency header for allowed origin', async () => {
    const req = new NextRequest('http://localhost:3000/api/telemetry', {
      method: 'OPTIONS',
      headers: {
        origin: 'http://localhost:3000',
        'access-control-request-headers': 'content-type,x-idempotency-key',
      },
    })

    const res = await OPTIONS(req)

    expect(res.status).toBe(204)
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:3000')
    expect(res.headers.get('Access-Control-Allow-Headers')?.toLowerCase()).toContain('x-idempotency-key')
  })

  test('OPTIONS rejects unknown origin', async () => {
    const req = new NextRequest('http://localhost:3000/api/telemetry', {
      method: 'OPTIONS',
      headers: { origin: 'https://evil.example' },
    })

    const res = await OPTIONS(req)

    expect(res.status).toBe(403)
  })

  test('POST returns CORS header on malformed json from allowed origin', async () => {
    const req = new NextRequest('http://localhost:3000/api/telemetry', {
      method: 'POST',
      headers: {
        origin: 'http://localhost:3000',
        'content-type': 'application/json',
        'x-forwarded-for': '10.20.30.41',
      },
      body: '{',
    })

    const res = await POST(req)

    expect(res.status).toBe(400)
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:3000')
  })

  test('POST falls back to 202 when provider config missing', async () => {
    const prevResend = process.env.RESEND_API_KEY
    const prevTo = process.env.TELEMETRY_TO
    try {
      delete process.env.RESEND_API_KEY
      delete process.env.TELEMETRY_TO

      const req = new NextRequest('http://localhost:3000/api/telemetry', {
        method: 'POST',
        headers: {
          origin: 'http://localhost:3000',
          'content-type': 'application/json',
          'x-forwarded-for': '10.20.30.42',
        },
        body: JSON.stringify({
          droneType: 'multirotor',
          flightTimeActual: 10,
          flightTimeCalc: 11,
          wind: 4,
          tempC: 12,
          altM: 200,
          notes: 'test',
        }),
      })

      const res = await POST(req)
      const payload = await res.json()

      expect(res.status).toBe(202)
      expect(payload.status).toBe('accepted')
      expect(res.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:3000')
    } finally {
      if (typeof prevResend === 'string') process.env.RESEND_API_KEY = prevResend
      else delete process.env.RESEND_API_KEY

      if (typeof prevTo === 'string') process.env.TELEMETRY_TO = prevTo
      else delete process.env.TELEMETRY_TO
    }
  })
})
