import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import { createOpencodeAgentRegistry } from '../src/shared/opencode-agent-registry.js'

const rootDir = process.cwd()
const runtimeDir = join(rootDir, '.opencode', 'agents')

if (!existsSync(runtimeDir)) {
  console.log('ℹ️  Skipping runtime mirror parity in repo-time validation: .opencode/agents is a user-local runtime projection.')
  process.exit(0)
}

let status = 0

for (const agent of createOpencodeAgentRegistry(rootDir)) {
  const runtimePath = join(runtimeDir, `${agent.id}.md`)
  if (!existsSync(runtimePath)) {
    console.error(`❌ Missing runtime mirror: ${runtimePath}`)
    status = 1
    continue
  }

  const runtimeRaw = readFileSync(runtimePath, 'utf-8')
  if (runtimeRaw !== agent.runtimeMarkdown) {
    console.error(`❌ Runtime projection mismatch: ${runtimePath}`)
    status = 1
  }
}

if (status !== 0) {
  process.exit(status)
}

console.log('✅ Agent registry parity clean (agents/** is canonical; .opencode/agents/** matches generated OpenCode-safe projection).')
