import type { KernelLineage } from '../../context/prompt-packet/prompt-packet-types.js'

const HIVEFIVER_KEYWORDS = [
  'hook',
  'plugin',
  'workflow',
  'agent',
  'command',
  'hivemind',
  'session runtime',
  'context',
  'governance',
  'doc-intel',
  'refactor',
]

export interface LineageResolution {
  lineage: KernelLineage
  reasons: string[]
}

export function resolveLineage(userMessage: string, activeLineage?: KernelLineage): LineageResolution {
  const normalized = userMessage.toLowerCase()
  const matches = HIVEFIVER_KEYWORDS.filter((keyword) => normalized.includes(keyword))

  if (matches.length > 0) {
    return {
      lineage: 'hivefiver',
      reasons: matches,
    }
  }

  return {
    lineage: activeLineage ?? 'hiveminder',
    reasons: activeLineage ? ['active-lineage'] : ['product-default'],
  }
}
