import type { PurposeClass } from '../features/session-entry/start-work-types.js'

export type OpencodeKnowledgeId =
  | 'opencode-commands-are-prompts'
  | 'opencode-plugins-are-runtime'
  | 'opencode-non-interactive-shell'
  | 'opencode-project-or-global-surfaces'

export interface OpencodeKnowledgeSurface {
  knowledgeId: OpencodeKnowledgeId
  required: boolean
  reason: string
}

const EXECUTION_PURPOSES = new Set<PurposeClass>([
  'research',
  'planning',
  'implementation',
  'gatekeeping',
  'tdd',
  'course-correction',
])

const SHELL_KEYWORDS = [
  'npm',
  'bun',
  'pnpm',
  'yarn',
  'install',
  'build',
  'test',
  'lint',
  'bash',
  'shell',
  'git',
  'script',
  'command',
  'cli',
]

function includesShellIntent(userMessage: string): boolean {
  const normalized = userMessage.toLowerCase()
  return SHELL_KEYWORDS.some((keyword) => normalized.includes(keyword))
}

function addSurface(
  surfaces: OpencodeKnowledgeSurface[],
  knowledgeId: OpencodeKnowledgeId,
  required: boolean,
  reason: string,
): void {
  if (surfaces.some((surface) => surface.knowledgeId === knowledgeId)) {
    return
  }

  surfaces.push({ knowledgeId, required, reason })
}

export function resolveBaselineOpencodeKnowledgeSurfaces(): OpencodeKnowledgeSurface[] {
  return [
    {
      knowledgeId: 'opencode-commands-are-prompts',
      required: true,
      reason: 'Custom commands are prompt templates, not deterministic workflow engines.',
    },
    {
      knowledgeId: 'opencode-plugins-are-runtime',
      required: true,
      reason: 'Deterministic routing and hook behavior belong in plugins, tools, and runtime code.',
    },
    {
      knowledgeId: 'opencode-project-or-global-surfaces',
      required: true,
      reason: 'Community delivery should target downstream project or global OpenCode surfaces, not self-host assumptions.',
    },
  ]
}

export function resolveOpencodeKnowledgeSurfaces(
  purposeClass: PurposeClass,
  userMessage: string,
): OpencodeKnowledgeSurface[] {
  const surfaces = [...resolveBaselineOpencodeKnowledgeSurfaces()]

  if (EXECUTION_PURPOSES.has(purposeClass)) {
    addSurface(
      surfaces,
      'opencode-project-or-global-surfaces',
      true,
      'Execution-oriented work must respect downstream project/global delivery surfaces.',
    )
  }

  if (
    includesShellIntent(userMessage)
    || purposeClass === 'implementation'
    || purposeClass === 'gatekeeping'
    || purposeClass === 'tdd'
    || purposeClass === 'course-correction'
  ) {
    addSurface(
      surfaces,
      'opencode-non-interactive-shell',
      true,
      'Shell use must assume a non-interactive OpenCode environment with explicit non-interactive flags and no prompt waiting.',
    )
  }

  return surfaces
}

function renderKnowledgeLine(knowledgeId: OpencodeKnowledgeId): string {
  const mapping: Record<OpencodeKnowledgeId, string> = {
    'opencode-commands-are-prompts': 'commands_are_prompts=true',
    'opencode-plugins-are-runtime': 'runtime_owner=plugins-tools-hooks',
    'opencode-non-interactive-shell': 'shell_mode=non-interactive-no-tty',
    'opencode-project-or-global-surfaces': 'delivery_surface=project-or-global-opencode',
  }

  return mapping[knowledgeId]
}

export function renderOpencodeKnowledgePacket(
  surfaces: OpencodeKnowledgeSurface[],
): string {
  if (surfaces.length === 0) {
    return ''
  }

  return [
    '<opencode-runtime-knowledge>',
    ...surfaces.map((surface) => renderKnowledgeLine(surface.knowledgeId)),
    ...surfaces.map((surface) => `knowledge_reason=${surface.reason}`),
    'workflow_rule=deterministic-routing-lives-in-plugin-runtime',
    'command_rule=markdown-commands-are-single-purpose-prompt-contracts',
    '</opencode-runtime-knowledge>',
  ].join('\n')
}
