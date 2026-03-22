/**
 * Regenerates .opencode/agents/*.md runtime projections from canonical agents/*.deprecated.md sources.
 * This script is the authoritative way to sync the runtime projection.
 * DO NOT manually edit .opencode/agents/ - always regenerate via this script.
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { createOpencodeAgentRegistry } from '../src/shared/opencode-agent-registry.js'

const rootDir = process.cwd()
const runtimeDir = join(rootDir, '.opencode', 'agents')

if (!existsSync(runtimeDir)) {
  mkdirSync(runtimeDir, { recursive: true })
  console.log(`✅ Created runtime directory: ${runtimeDir}`)
}

let regenerated = 0

for (const agent of createOpencodeAgentRegistry(rootDir)) {
  const runtimePath = join(runtimeDir, `${agent.id}.md`)
  writeFileSync(runtimePath, agent.runtimeMarkdown, 'utf-8')
  console.log(`✅ Regenerated: ${runtimePath}`)
  regenerated++
}

console.log(`\n✅ Regenerated ${regenerated} agent runtime projections.`)
