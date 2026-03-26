import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const BLOCKED_COUNTRIES = new Set(['RU', 'BY'])

export function middleware(request: NextRequest) {
  // x-vercel-ip-country is set by Vercel's edge network and cannot be
  // spoofed by clients on Vercel deployments. Outside Vercel (local dev,
  // other hosts) this header is absent, so we skip the geo-check.
  const isVercel = process.env.VERCEL === '1'
  if (isVercel) {
    const country = request.headers.get('x-vercel-ip-country') ?? ''
    if (BLOCKED_COUNTRIES.has(country)) {
      return new NextResponse(
        `<!DOCTYPE html><html lang="uk"><head><meta charset="utf-8"><title>Недоступно</title>
        <style>body{font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#1a2035;color:#fff}
        .box{text-align:center;padding:2rem}.flag{font-size:3rem;margin-bottom:1rem}.msg{font-size:1.1rem;color:#aaa;margin-top:.5rem}</style>
        </head><body><div class="box"><div class="flag">🇺🇦</div><h1>Сервіс недоступний</h1>
        <p class="msg">Цей ресурс недоступний з вашого регіону.</p></div></body></html>`,
        { status: 451, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
      )
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|downloads/).*)'],
}
