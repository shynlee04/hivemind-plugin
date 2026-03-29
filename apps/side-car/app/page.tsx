'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense, useMemo } from 'react'
import { Renderer } from '@json-render/react'
import { registry } from '@/lib/registry'
import { demoSpec } from '@/lib/demo-spec'

function DashboardContent() {
  const searchParams = useSearchParams()
  const specParam = searchParams.get('spec')

  const spec = useMemo(() => {
    if (specParam) {
      try {
        return JSON.parse(atob(specParam))
      } catch {
        console.error('Failed to parse spec from URL param')
        return demoSpec
      }
    }
    return demoSpec
  }, [specParam])

  return (
    <main className="container mx-auto py-8">
      <div className="mb-6 border-b pb-4">
        <h1 className="text-2xl font-bold">HiveMind Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Powered by json-render · {specParam ? 'dynamic spec' : 'demo spec'}
        </p>
      </div>
      <Renderer spec={spec} registry={registry} />
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
