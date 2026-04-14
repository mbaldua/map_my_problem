import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'Map My Problems',
    template: '%s | Map My Problems',
  },
  description:
    'Report civic issues — water logging, garbage, traffic — and help your community.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    title: 'Map My Problems',
    statusBarStyle: 'default',
  },
  formatDetection: { telephone: false },
  openGraph: {
    type: 'website',
    siteName: 'Map My Problems',
    title: 'Map My Problems',
    description:
      'Hyperlocal civic issue reporting. Report what you see, where you are.',
  },
}

export const viewport: Viewport = {
  themeColor: '#1A73E8',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        {/* PWA: iOS Safari home screen icon */}
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />

        {/* Google Fonts — Inter */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-brand-surface text-gray-900 antialiased">
        {children}
      </body>
    </html>
  )
}
