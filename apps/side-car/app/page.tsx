'use client'

import { JSONUIProvider, Renderer } from '@json-render/react'
import { registry } from '@/lib/registry'
import { demoSpec } from '@/lib/demo-spec'

export default function DashboardPage() {
  return (
    <JSONUIProvider registry={registry}>
      <main className="container mx-auto py-8">
        <Renderer spec={demoSpec} registry={registry} />
      </main>
    </JSONUIProvider>
  )
}
