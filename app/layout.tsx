import type { Metadata } from 'next'
import { Inter, Anton } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/ThemeProvider'

const inter = Inter({ subsets: ['latin'] })

const anton = Anton({ 
  weight: '400',
  subsets: ['latin'],
  variable: '--font-anton',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Mercurium Investments - AI-Powered Investment Strategies & Social Trading',
  description: 'Build winning investment strategies with artificial intelligence and copy top-performing traders. Join the most advanced social trading platform with AI assistance, real-time analysis, and automated portfolio management.',
  keywords: 'investment strategies, AI trading, social trading, portfolio management, copy trading, artificial intelligence, financial technology, investment platform, trading community, automated investing',
  authors: [{ name: 'Mercurium Investments' }],
  creator: 'Mercurium Investments',
  publisher: 'Mercurium Investments',
  robots: 'index, follow',
  openGraph: {
    title: 'Mercurium Investments - AI-Powered Investment Strategies',
    description: 'Build winning investment strategies with AI and copy top-performing traders. Join the most advanced social trading platform.',
    type: 'website',
    locale: 'en_US',
    siteName: 'Mercurium Investments',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mercurium Investments - AI-Powered Investment Strategies',
    description: 'Build winning investment strategies with AI and copy top-performing traders.',
    creator: '@mercurium_inv',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${inter.className} ${anton.variable}`}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}

