import type { Metadata } from 'next'
import './globals.css'
import SessionInitializer from '@/components/SessionInitializer'

export const metadata: Metadata = {
  title: 'CadArena - AI-Powered Conversational CAD Design',
  description: 'Transform your ideas into professional CAD designs through natural language. Generate DXF files instantly with AI-powered conversational CAD.',
  keywords: ['CAD', 'DXF', 'AI', 'design', 'conversational AI', 'CAD software', '3D modeling', 'engineering'],
  authors: [{ name: 'CadArena' }],
  creator: 'CadArena',
  publisher: 'CadArena',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  openGraph: {
    title: 'CadArena - AI-Powered Conversational CAD Design',
    description: 'Transform your ideas into professional CAD designs through natural language.',
    url: '/',
    siteName: 'CadArena',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'CadArena - AI-Powered CAD Design',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CadArena - AI-Powered Conversational CAD Design',
    description: 'Transform your ideas into professional CAD designs through natural language.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>📐</text></svg>" />
        <meta name="theme-color" content="#0066FF" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <meta name="referrer" content="strict-origin-when-cross-origin" />
      </head>
      <body>
        <SessionInitializer />
        {children}
      </body>
    </html>
  )
}
