import { Resend } from 'resend'
import { NextRequest, NextResponse } from 'next/server'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { droneType, flightTimeActual, flightTimeCalc, wind, tempC, altM, notes } = body

  try {
    await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: 'wakkawarpman@gmail.com',
      subject: `[droneCalc] Телеметрія — ${droneType ?? 'невідомо'}`,
      text: [
        `Тип: ${droneType ?? '—'}`,
        `Час польоту реальний: ${flightTimeActual ?? '—'} хв`,
        `Час польоту розрахунковий: ${flightTimeCalc ?? '—'} хв`,
        `Вітер: ${wind ?? '—'} м/с`,
        `Температура: ${tempC ?? '—'} °C`,
        `Висота: ${altM ?? '—'} м`,
        `Примітки: ${notes ?? '—'}`,
      ].join('\n'),
    })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
