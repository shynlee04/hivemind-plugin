import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'HiveMind Side-Car',
  description: 'Real-time dashboard and control interface for the HiveMind meta-framework',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  )
}
