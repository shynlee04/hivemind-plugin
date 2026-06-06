/**
 * Sidecar root page (Server Component) — renders the client-only
 * dashboard wrapper.
 *
 * The actual `next/dynamic` call with the client-only directive
 * lives in `./page-wrapper.tsx` because that directive is forbidden
 * in Server Components under Next.js 16. Splitting the boundary
 * keeps `page.tsx` as a true Server Component (so root layout
 * metadata and future server-side logic still work) while preserving
 * the client-only hydration that json-render's Renderer requires.
 *
 * @module sidecar/app/page
 */

import { PageWrapper } from "./page-wrapper"

/**
 * Main page component rendered at the root route.
 *
 * @returns The client-only dashboard shell wrapper.
 */
export default function HomePage(): React.ReactElement {
  return <PageWrapper />
}
