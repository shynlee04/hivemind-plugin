/**
 * Sidecar root layout — wraps the app with metadata, fonts, and global styles.
 *
 * The `StateProvider` from json-render is not directly exported from
 * `@json-render/react` in a standalone form for Server Components.
 * StateProvider wrapping is handled at the page level via the
 * state-store initialization hook.
 *
 * @module sidecar/app/layout
 */

import type { ReactNode } from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
})

export const metadata: Metadata = {
  title: "Hivemind Sidecar",
  description: "GUI control panel for the Hivemind runtime composition engine",
  viewport: "width=device-width, initial-scale=1",
}

/**
 * Root layout component for the sidecar app.
 * Provides font loading, global styles, and the base HTML structure.
 *
 * @param props - React children injected by the Next.js App Router.
 * @returns The root document tree with Inter font and global CSS.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body style={{ margin: 0, fontFamily: "var(--font-inter), system-ui, sans-serif" }}>
        {children}
      </body>
    </html>
  )
}
