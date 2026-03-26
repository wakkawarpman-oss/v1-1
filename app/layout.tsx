import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { SwRegister } from '@/components/SwRegister'
import { SplashScreen } from '@/components/SplashScreen'
import './globals.css'

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'droneCalc 🇺🇦 — інженерний інструмент планування місій',
  description:
    'Інженерний інструмент планування місій БПЛА. Аеродинаміка, навігація, батарея, акустика, RF, балістика — без реєстрації.',
  keywords:
    'droneCalc, планування місій, БПЛА, дрон, мультикоптер, аеродинаміка, навігація, балістика',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'droneCalc',
  },
  openGraph: {
    title: 'droneCalc 🇺🇦 — інженерний інструмент планування місій',
    description: 'Інженерний інструмент планування місій БПЛА. Аеродинаміка, навігація, батарея, акустика, RF, балістика.',
    type: 'website',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#1a2035',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="uk" className={inter.variable}>
      <body className="min-h-screen bg-ecalc-lightbg font-sans antialiased">
        <SplashScreen />
        {children}
        <SwRegister />
      </body>
    </html>
  )
}
