export interface TodoItem {
  id: string
  content: string
  status: string
  priority: string
  depends_on?: string
  hierarchy_node?: string
}

export interface TodoState {
  items: TodoItem[]
  last_updated: number
}

export interface RuntimeProfile {
  id: string
  intent: string
  policy_version?: string
  role_envelope?: {
    primary: { agent: string; level: number }
    secondary: { agent: string; level: number }
    monitor: { agent: string; level: number }
  }
  capabilities: {
    paths: string[]
    depth_limit: number
    delegate_to: string[]
  }
  constraints: string[]
}

export interface HierarchyNode {
  id?: string
  type?: string
  content?: string
  status?: string
  children?: HierarchyNode[]
  trajectory?: string
  tactic?: string
  action?: string
}

export interface ContextRecovery {
  trajectory_summary: string
  active_todos: string[]
  key_decisions: string[]
  recommended_next: string
}

export interface HealthSignal {
  score: number
  velocity: number
}

export interface HealthMetrics {
  composite: {
    score: number
    status: string
  }
  signals: Record<string, HealthSignal>
  thresholds: {
    hard_block: {
      signals: string[]
      below: number
    }
  }
}

export interface PluginFallbackContextInput {
  agent: string
  turnCount: number
  delegationDepth: number
  isChildSession: boolean
  healthSummary: string
  delegatedToExplorer: boolean
  profile: RuntimeProfile | null
  todoState: TodoState | null
  hierarchyState: HierarchyNode | null
  contextRecovery: ContextRecovery | null
  healthMetrics: HealthMetrics | null
  scopeViolationCount: number
  entryDetection: {
    entry_condition: string
    lineage: string
    state_exists: boolean
    hierarchy_status: string
    trajectory_status: string
    bootstrap_executed?: boolean
  } | null
  intentClassification: {
    lineage: string
    source: string
    persisted_to_profile: boolean
    input_excerpt: string
  } | null
}

function formatActiveTodo(todoState: TodoState | null): string {
  if (!todoState || !todoState.items || todoState.items.length === 0) {
    return "No active TODO items."
  }

  const active = todoState.items
    .filter((item) => item.status === "in_progress" || item.status === "pending")
    .slice(0, 10)

  if (active.length === 0) return "All TODO items completed."

  const inProgress = active.filter((item) => item.status === "in_progress")
  const pending = active.filter((item) => item.status === "pending")

  const lines: string[] = []
  if (inProgress.length > 0) {
    lines.push(`**In Progress (${inProgress.length}):**`)
    for (const item of inProgress) {
      lines.push(`  - [WIP] ${item.content}`)
    }
  }
  if (pending.length > 0) {
    lines.push(`**Pending (${pending.length}):**`)
    for (const item of pending.slice(0, 5)) {
      lines.push(`  - [ ] ${item.content}`)
    }
    if (pending.length > 5) {
      lines.push(`  - ... and ${pending.length - 5} more`)
    }
  }

  const lastItem = todoState.items[todoState.items.length - 1]
  if (lastItem && lastItem.content.startsWith("HARD STOP")) {
    lines.push(`\n**HARD STOP:** ${lastItem.content}`)
  }

  return lines.join("\n")
}

function formatHierarchyCursor(hierarchy: HierarchyNode | null): string {
  if (!hierarchy) return "No hierarchy loaded."

  if (
    typeof hierarchy.trajectory === "string" ||
    typeof hierarchy.tactic === "string" ||
    typeof hierarchy.action === "string"
  ) {
    const lines = [
      `→ trajectory: ${hierarchy.trajectory || "(unset)"}`,
      `  → tactic: ${hierarchy.tactic || "(unset)"}`,
      `    → action: ${hierarchy.action || "(unset)"}`,
    ]
    return lines.join("\n")
  }

  function findDeepestActive(node: HierarchyNode, path: string[]): string[] {
    const currentPath = [...path, `${node.type || "node"}: ${node.content || "(unset)"}`]
    if (!node.children || node.children.length === 0) return currentPath

    const activeChild = node.children.find(
      (child) => child.status !== "complete" && child.status !== "cancelled",
    )
    if (activeChild) return findDeepestActive(activeChild, currentPath)
    return currentPath
  }

  const breadcrumb = findDeepestActive(hierarchy, [])
  return breadcrumb.map((item, index) => `${"  ".repeat(index)}→ ${item}`).join("\n")
}

function buildCapabilityAdvisory(params: {
  agent: string
  turnCount: number
  delegatedToExplorer: boolean
  profile: RuntimeProfile | null
}): string[] {
  const { agent, turnCount, delegatedToExplorer, profile } = params
  const advisory: string[] = []

  advisory.push("### HIVEFIVER CAPABILITY ADVISORY")
  advisory.push(`- Agent: ${agent}`)
  advisory.push(`- Turn: ${turnCount}`)
  advisory.push(
    `- Delegation evidence (hivexplorer): ${delegatedToExplorer ? "present" : "not observed this session"}`,
  )

  if (profile) {
    advisory.push(`- Profile: ${profile.id} (${profile.intent})`)
    advisory.push(`- Allowed paths: ${profile.capabilities.paths.join(", ") || "(unspecified)"}`)
    advisory.push(`- Depth limit: ${profile.capabilities.depth_limit}`)
    advisory.push(`- Delegate options: ${profile.capabilities.delegate_to.join(", ") || "(none declared)"}`)
  } else {
    advisory.push("- Runtime profile unavailable: continue with evidence-first execution.")
  }

  advisory.push("- Guidance: use deterministic methods (script/bash/git) when needed, then verify high-risk assumptions with targeted delegation.")
  advisory.push("- Guidance: prefer advisory escalation over hard blocking unless explicit strict policy is configured.")

  return advisory
}

function buildChildSessionContextLines(params: {
  agent: string
  turnCount: number
  healthSummary: string
  profile: RuntimeProfile | null
}): string[] {
  const { agent, turnCount, healthSummary, profile } = params
  const lines: string[] = [
    "## GX-Pack Governance Context (Auto-Injected)",
    "",
    `**Agent:** ${agent} | **Turn:** ${turnCount} | **${healthSummary}**`,
    profile
      ? `**Profile:** ${profile.id} | **Intent:** ${profile.intent}`
      : "*Runtime profile unavailable — staying in evidence-first delegated mode.*",
    "",
    "### Child Session Focus",
    "- Parent-linked delegated session detected.",
    "- Minimized governance context active: stay focused on the delegated objective.",
    "- Prefer targeted execution and verification over broad repo reconnaissance.",
  ]

  if (profile && profile.constraints.length > 0) {
    lines.push("")
    lines.push("### Constraints")
    for (const constraint of profile.constraints.slice(0, 3)) {
      lines.push(`- ${constraint}`)
    }
  }

  return lines
}

/**
 * Build the semantic fallback context block that the plugin hook can transport when core hooks are unavailable.
 *
 * @param input Canonicalized fallback-context inputs from runtime snapshot and plugin enforcement state.
 * @returns A pre-budget context block, or `null` when nothing meaningful should be injected.
 */
export function buildPluginFallbackContextBlock(input: PluginFallbackContextInput): string | null {
  const {
    agent,
    turnCount,
    delegationDepth,
    isChildSession,
    healthSummary,
    delegatedToExplorer,
    profile,
    todoState,
    hierarchyState,
    contextRecovery,
    healthMetrics,
    scopeViolationCount,
    entryDetection,
    intentClassification,
  } = input

  if (
    !profile &&
    !todoState &&
    !hierarchyState &&
    !contextRecovery &&
    !healthMetrics &&
    !entryDetection &&
    !intentClassification
  ) {
    return null
  }

  const hardBlockWarnings = healthMetrics
    ? healthMetrics.thresholds.hard_block.signals.filter((name) => {
        const signal = healthMetrics.signals[name]
        return signal && signal.score < healthMetrics.thresholds.hard_block.below
      })
    : []

  const lines: string[] = isChildSession
    ? buildChildSessionContextLines({
        agent,
        turnCount,
        healthSummary,
        profile,
      })
    : [
        "## GX-Pack Governance Context (Auto-Injected)",
        "",
        ...(profile
          ? [
              `**Agent:** ${agent} | **Profile:** ${profile.id} | **Intent:** ${profile.intent}`,
              `**Turn:** ${turnCount} | **${healthSummary}** | **Depth:** ${delegationDepth}/${profile.capabilities.depth_limit}`,
            ]
          : [
              `**Agent:** ${agent} | **Turn:** ${turnCount} | **${healthSummary}**`,
              "*No runtime profile — run gx-entry-guard.sh to build one.*",
            ]),
        "",
        ...(entryDetection
          ? [
              "### Entry Detection",
              `- entry_condition=${entryDetection.entry_condition} lineage=${entryDetection.lineage} state_exists=${entryDetection.state_exists}`,
              `- hierarchy_status=${entryDetection.hierarchy_status} trajectory_status=${entryDetection.trajectory_status}`,
              ...(entryDetection.bootstrap_executed ? ["- auto_init=executed"] : []),
              "",
            ]
          : []),
        ...(intentClassification
          ? [
              "### Intent Classification",
              `- lineage=${intentClassification.lineage} source=${intentClassification.source} persisted_to_profile=${intentClassification.persisted_to_profile}`,
              `- input_excerpt=${intentClassification.input_excerpt}`,
              "",
            ]
          : []),
        "### Active TODO",
        formatActiveTodo(todoState),
        "",
        "### Hierarchy Cursor",
        formatHierarchyCursor(hierarchyState),
        "",
        ...(healthMetrics && Object.keys(healthMetrics.signals).length > 0
          ? [
              "### Health Signals",
              ...Object.entries(healthMetrics.signals).map(
                ([name, signal]) => `- ${name}: score=${signal.score}, velocity=${signal.velocity}`,
              ),
              "",
            ]
          : []),
        ...(profile && profile.constraints.length > 0
          ? [
              "### Constraints",
              ...profile.constraints.map((constraint) => `- ${constraint}`),
              "",
            ]
          : []),
        ...(scopeViolationCount > 0
          ? [`### Scope Violations: ${scopeViolationCount} recorded`]
          : ["### Scope: Clean"]),
        ...(contextRecovery
          ? [
              "",
              "### Context Recovery (auto-recovered)",
              `**Trajectory:** ${contextRecovery.trajectory_summary}`,
              ...(contextRecovery.active_todos.length > 0 ? [`**Pending:** ${contextRecovery.active_todos.join(", ")}`] : []),
              ...(contextRecovery.key_decisions.length > 0 ? [`**Decisions:** ${contextRecovery.key_decisions.join("; ")}`] : []),
              `**Next:** ${contextRecovery.recommended_next}`,
            ]
          : []),
        ...(hardBlockWarnings.length > 0
          ? [
              "",
              `### WARNING: hard_block triggered for ${hardBlockWarnings.join(", ")} (below ${healthMetrics?.thresholds.hard_block.below ?? "n/a"}).`,
            ]
          : []),
        ...(agent === "hivefiver"
          ? [
              "",
              ...buildCapabilityAdvisory({
                agent,
                turnCount,
                delegatedToExplorer,
                profile,
              }),
            ]
          : []),
      ]

  return lines.join("\n")
}
