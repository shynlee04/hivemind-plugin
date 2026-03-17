import { createCliRenderer } from '@opentui/core'
import { createRoot } from '@opentui/react'
import { fileURLToPath } from 'node:url'

import { RuntimeStatusView } from './views/runtime-status.js'

export async function main(): Promise<void> {
  const renderer = await createCliRenderer()
  const root = createRoot(renderer)
  const cleanup = () => {
    renderer.destroy()
    process.exit(0)
  }

  process.on('SIGINT', cleanup)
  process.on('SIGTERM', cleanup)
  root.render(<RuntimeStatusView />)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  void main()
}
