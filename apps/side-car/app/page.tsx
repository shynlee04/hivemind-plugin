'use client'

import { useEffect, useState } from 'react'
import { Renderer, JSONUIProvider } from '@json-render/react'
import { registry } from '@/lib/registry'

const LOADING_SPEC = {
  root: 'root',
  elements: {
    root: {
      type: 'Text',
      props: { text: 'Loading dashboard...' },
    },
  },
}

function DashboardContent() {
  const [spec, setSpec] = useState(LOADING_SPEC)

  useEffect(() => {
    fetch('/api/dashboard')
      .then((res) => res.json())
      .then((data) => setSpec(data))
      .catch(() => setSpec(LOADING_SPEC))
  }, [])

  return (
    <main className="container mx-auto py-8">
      <JSONUIProvider registry={registry}>
        <Renderer spec={spec} registry={registry} />
      </JSONUIProvider>
    </main>
  )
}

export default function DashboardPage() {
  return <DashboardContent />
}
