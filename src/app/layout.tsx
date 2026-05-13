import './globals.css'
import type { Metadata } from 'next'
import localFont from 'next/font/local'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/toaster'

const sans = localFont({
  src: [
    { path: '../../assets/fonts/poppins/Poppins-400.ttf', weight: '400', style: 'normal' },
    { path: '../../assets/fonts/poppins/Poppins-500.ttf', weight: '500', style: 'normal' },
    { path: '../../assets/fonts/poppins/Poppins-600.ttf', weight: '600', style: 'normal' },
    { path: '../../assets/fonts/poppins/Poppins-700.ttf', weight: '700', style: 'normal' },
    { path: '../../assets/fonts/poppins/Poppins-800.ttf', weight: '800', style: 'normal' },
  ],
  variable: '--font-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Shruty Health Clinic',
  description: 'Shruty Health Clinic local repertory, patient records, and clinical dashboard with JSON persistence and OOREP cache.',
  icons: {
    icon: '/logo123.png',
    shortcut: '/logo123.png',
    apple: '/logo123.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${sans.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
