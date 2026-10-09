// app/layout.tsx
import type { Metadata } from 'next'
import { Roboto } from 'next/font/google'
import './globals.css'
import { BrokerProvider } from '@/contexts/BrokerContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { SearchProvider } from '@/contexts/SearchContext'
import { MessagingProvider } from '@/contexts/MessagingContext'
import { AuthProvider } from '@/contexts/AuthContext'  // ADD THIS IMPORT
import { UserProfileProvider } from '@/contexts/UserProfileContext'

const roboto = Roboto({
  weight: ['300', '400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'BitoCircle - Social Finance Platform',
    template: '%s | BitoCircle'
  },
  description: 'Connect, trade, and grow with BitoCircle - A modern social finance platform',
  keywords: ['BitoCircle', 'Social Finance', 'Cryptocurrency', 'Trading', 'Finance Hub'],
  authors: [{ name: 'BitoCircle' }],
  creator: 'BitoCircle',
  publisher: 'BitoCircle',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://www.bitocircle.com'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://www.bitocircle.com',
    siteName: 'BitoCircle',
    title: 'BitoCircle - Social Finance Platform',
    description: 'Connect, trade, and grow with BitoCircle',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'BitoCircle',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BitoCircle',
    description: 'Connect, trade, and grow with BitoHub',
    images: ['/og-image.jpg'],
    creator: '@bitohub',
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
}

interface RootLayoutProps {
  children: React.ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" sizes="57x57" href="/apple-icon-57x57.png" />
        <link rel="apple-touch-icon" sizes="60x60" href="/apple-icon-60x60.png" />
        <link rel="apple-touch-icon" sizes="72x72" href="/apple-icon-72x72.png" />
        <link rel="apple-touch-icon" sizes="76x76" href="/apple-icon-76x76.png" />
        <link rel="apple-touch-icon" sizes="114x114" href="/apple-icon-114x114.png" />
        <link rel="apple-touch-icon" sizes="120x120" href="/apple-icon-120x120.png" />
        <link rel="apple-touch-icon" sizes="144x144" href="/apple-icon-144x144.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/apple-icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-icon-180x180.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/android-icon-192x192.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="96x96" href="/favicon-96x96.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="msapplication-TileColor" content="#ffffff" />
        <meta name="msapplication-TileImage" content="/ms-icon-144x144.png" />
        <meta name="theme-color" content="#ffffff"></meta>
      </head>
      <body className={roboto.className} suppressHydrationWarning>
        <AuthProvider>
          <BrokerProvider>
            <UserProfileProvider>
              <ThemeProvider>
              <SearchProvider>
                <MessagingProvider>
                  {children}
                </MessagingProvider>
              </SearchProvider>
            </ThemeProvider>
            </UserProfileProvider>
          </BrokerProvider>
        </AuthProvider>
      </body>
    </html>
  )
}