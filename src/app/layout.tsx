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
// White-label identity/SEO — edit src/config/whitelabel.ts, not this file.
import { WHITELABEL } from '@/config/whitelabel'

const roboto = Roboto({
  weight: ['300', '400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: `${WHITELABEL.brandName} - ${WHITELABEL.tagline}`,
    template: `%s | ${WHITELABEL.brandName}`
  },
  description: WHITELABEL.description,
  keywords: [...WHITELABEL.keywords],
  authors: [{ name: WHITELABEL.brandName }],
  creator: WHITELABEL.brandName,
  publisher: WHITELABEL.brandName,
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(WHITELABEL.siteUrl),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: WHITELABEL.siteUrl,
    siteName: WHITELABEL.brandName,
    title: `${WHITELABEL.brandName} - ${WHITELABEL.tagline}`,
    description: WHITELABEL.description,
    images: [
      {
        url: WHITELABEL.ogImage,
        width: 1200,
        height: 630,
        alt: WHITELABEL.brandName,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: WHITELABEL.brandName,
    description: WHITELABEL.description,
    images: [WHITELABEL.ogImage],
    creator: WHITELABEL.twitterHandle,
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