'use client'

import { Suspense } from 'react'
import { Renderer, JSONUIProvider } from '@json-render/react'
import { registry } from '@/lib/registry'

/** Minimal skeleton spec for Cycle 1 — real spec arrives in Cycle 2. */
const skeletonSpec = {
  root: 'app',
  elements: {
    app: {
      type: 'Stack',
      props: { direction: 'vertical', gap: 'md' },
      children: ['title', 'status'],
    },
    title: {
      type: 'Heading',
      props: { text: 'HiveMind Dashboard', level: 'h1' },
      children: [] as string[],
    },
    status: {
      type: 'Text',
      props: { text: 'Loading — dashboard spec pending (Cycle 2)' },
      children: [] as string[],
    },
  },
}

function DashboardContent() {
  return (
    <main className="container mx-auto py-8">
      <JSONUIProvider registry={registry}>
        <Renderer spec={skeletonSpec} registry={registry} />
      </JSONUIProvider>
    </main>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="container mx-auto py-8">Loading dashboard...</div>}>
      <DashboardContent />
    </Suspense>
  )
}
