'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState, useMemo } from 'react'
import { Renderer, JSONUIProvider } from '@json-render/react'
import { registry } from '@/lib/registry'
import { demoSpec } from '@/lib/demo-spec'
import { createLanguageSpec } from '@/lib/language-spec'

type ConfigState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; config: Record<string, unknown> }

function DashboardContent() {
  const searchParams = useSearchParams()
  const specParam = searchParams.get('spec')
  const [configState, setConfigState] = useState<ConfigState>({ status: 'loading' })

  useEffect(() => {
    if (specParam) return // Skip server fetch if spec is provided via URL

    async function fetchConfig() {
      try {
        // Use internal API route to proxy to OpenCode server
        // This avoids webpack issues with SDK's node: internal modules
        const response = await fetch('/api/config')
        const result = await response.json()

        if (!response.ok || result.error) {
          setConfigState({ status: 'error', message: result.details || result.error || 'Server error' })
          return
        }

        // Build language settings from config
        const config = result.data ?? {}
        const langConfig: Record<string, unknown> = {
          chatLanguage: (config as Record<string, unknown>)?.language ?? 'en',
          artifactLanguage: (config as Record<string, unknown>)?.artifactLanguage ?? 'en',
          expertiseLevel: 'advanced',
          governanceMode: 'assisted',
        }

        setConfigState({ status: 'ready', config: langConfig })
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        setConfigState({ status: 'error', message })
      }
    }

    fetchConfig()
  }, [specParam])

  const spec = useMemo(() => {
    // URL spec takes priority
    if (specParam) {
      try {
        return JSON.parse(atob(specParam))
      } catch {
        return demoSpec
      }
    }

    // Live config from server
    if (configState.status === 'ready') {
      return createLanguageSpec(configState.config)
    }

    // Fallback to demo
    return demoSpec
  }, [specParam, configState])

  const statusText = specParam
    ? 'dynamic spec from URL'
    : configState.status === 'ready'
      ? 'live config from OpenCode server'
      : configState.status === 'error'
        ? `error: ${configState.message}`
        : 'loading...'

  return (
    <main className="container mx-auto py-8">
      <div className="mb-6 border-b pb-4">
        <h1 className="text-2xl font-bold">HiveMind Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Powered by json-render · {statusText}
        </p>
      </div>
      <JSONUIProvider registry={registry}>
        <Renderer spec={spec} registry={registry} />
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