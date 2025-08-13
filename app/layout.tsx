import type { Metadata } from 'next'
import { PT_Sans, Playfair_Display } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers/index'
import { Toaster } from '@/components/ui/toaster'
import Navbar from '@/components/layout/navbar'
import Footer from '@/components/layout/footer'
import { pageMetadata, generateOrganizationStructuredData } from '@/lib/seo'

const ptSans = PT_Sans({ 
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-pt-sans'
})

const playfair = Playfair_Display({ 
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-playfair'
})

export const metadata: Metadata = pageMetadata.home

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const organizationStructuredData = generateOrganizationStructuredData()

  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationStructuredData),
          }}
        />
      </head>
      <body className={`${ptSans.variable} ${playfair.variable} font-sans`}>
        <Providers>
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-1">
              {children}
            </main>
            <Footer />
          </div>
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}
