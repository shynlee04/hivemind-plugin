import { relative, resolve, sep } from "node:path"

import { getEffectivePaths } from "./paths.js"

export type IngressClassification =
  | "authority"
  | "projection"
  | "quarantine"
  | "evidence"
  | "archive"
  | "compatibility"

export interface HivemindIngressPolicyEntry {
  pattern: string
  classification: IngressClassification
  note: string
}

export interface HivemindIngressReadWarning {
  path: string
  classification: "projection" | "compatibility"
  note: string
}

export const HIVEMIND_INGRESS_POLICY: readonly HivemindIngressPolicyEntry[] = [
  {
    pattern: "manifest.json",
    classification: "authority",
    note: "Root topology manifest for the manifest-first .hivemind model.",
  },
  {
    pattern: "state/manifest.json",
    classification: "authority",
    note: "Registry of active hot-state surfaces.",
  },
  {
    pattern: "state/brain.json",
    classification: "authority",
    note: "Canonical runtime session and governance state.",
  },
  {
    pattern: "state/hierarchy.json",
    classification: "authority",
    note: "Canonical hierarchy tree and cursor state.",
  },
  {
    pattern: "state/anchors.json",
    classification: "authority",
    note: "Canonical anchor store when materialized.",
  },
  {
    pattern: "state/tasks.json",
    classification: "authority",
    note: "Operational write model for canonical tasks.",
  },
  {
    pattern: "state/gates.json",
    classification: "authority",
    note: "Canonical gate record store owned by src tools.",
  },
  {
    pattern: "state/sot-index.json",
    classification: "authority",
    note: "Canonical SOT artifact registry owned by src tools.",
  },
  {
    pattern: "memory/manifest.json",
    classification: "authority",
    note: "Canonical memory shelf registry.",
  },
  {
    pattern: "memory/mems.json",
    classification: "authority",
    note: "Canonical warm memory payload when materialized.",
  },
  {
    pattern: "sessions/manifest.json",
    classification: "authority",
    note: "Canonical session registry.",
  },
  {
    pattern: "plans/manifest.json",
    classification: "authority",
    note: "Canonical plan registry.",
  },
  {
    pattern: "graph/trajectory.json",
    classification: "authority",
    note: "Canonical trajectory graph state.",
  },
  {
    pattern: "graph/plans.json",
    classification: "authority",
    note: "Canonical plan graph state.",
  },
  {
    pattern: "graph/tasks.json",
    classification: "authority",
    note: "Durable global task graph and TODO SOT.",
  },
  {
    pattern: "graph/mems.json",
    classification: "authority",
    note: "Canonical graph memory state.",
  },
  {
    pattern: "graph/orphans.json",
    classification: "quarantine",
    note: "Quarantine lane for invalid graph records and FK failures.",
  },
  {
    pattern: "codemap/manifest.json",
    classification: "authority",
    note: "Canonical codemap registry.",
  },
  {
    pattern: "codewiki/manifest.json",
    classification: "authority",
    note: "Canonical codewiki registry.",
  },
  {
    pattern: "state/todo.json",
    classification: "compatibility",
    note: "Legacy TODO projection; never runtime authority.",
  },
  {
    pattern: "state/runtime-profile.json",
    classification: "compatibility",
    note: "Legacy runtime-profile projection from earlier governance passes.",
  },
  {
    pattern: "state/context-recovery.json",
    classification: "compatibility",
    note: "Legacy recovery projection retained only for compatibility and inspection.",
  },
  {
    pattern: "state/health-metrics.json",
    classification: "compatibility",
    note: "Legacy health projection retained only for compatibility and inspection.",
  },
  {
    pattern: "state/*.bak*",
    classification: "archive",
    note: "State backups are historical recovery artifacts, not live runtime inputs.",
  },
  {
    pattern: "sessions/active/*/profile.json",
    classification: "compatibility",
    note: "Bootstrap/session shim until profile authority is fully frozen.",
  },
  {
    pattern: "sessions/runtime/*/profile.json",
    classification: "compatibility",
    note: "Canonical compatibility session-profile shim isolated away from active markdown sessions.",
  },
  {
    pattern: "sessions/active/*.md",
    classification: "projection",
    note: "Human-readable active session projections.",
  },
  {
    pattern: "sessions/archive/**",
    classification: "archive",
    note: "Archived session history; never live runtime authority.",
  },
  {
    pattern: "handoffs/*",
    classification: "evidence",
    note: "Structured handoff evidence for agent transfer and audit.",
  },
  {
    pattern: "checkpoints/*",
    classification: "evidence",
    note: "Checkpoint evidence snapshots.",
  },
  {
    pattern: "logs/**",
    classification: "archive",
    note: "Diagnostic logs; useful for forensics but not runtime authority.",
  },
  {
    pattern: "INDEX.md",
    classification: "projection",
    note: "Human-readable root navigation projection.",
  },
  {
    pattern: "sessions/index.md",
    classification: "projection",
    note: "Human-readable session navigation projection.",
  },
  {
    pattern: "project/planning/**",
    classification: "projection",
    note: "Readable planning projection subordinate to manifest-backed truth.",
  },
  {
    pattern: "plans/**",
    classification: "projection",
    note: "Materialized plan artifacts subordinate to plans/manifest.json.",
  },
  {
    pattern: "state/sot-export.tsv",
    classification: "projection",
    note: "Derived grep-friendly export of the canonical SOT index.",
  },
  {
    pattern: "anchors/**",
    classification: "compatibility",
    note: "Legacy top-level anchors surface pending archive/isolation.",
  },
  {
    pattern: "mems/**",
    classification: "compatibility",
    note: "Legacy top-level mems surface pending archive/isolation.",
  },
] as const

function normalizeRelativePath(value: string): string {
  return value.replace(/\\/g, "/").replace(/^\.?\//, "")
}

function patternToRegExp(pattern: string): RegExp {
  const escaped = normalizeRelativePath(pattern)
    .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
    .replace(/\*\*/g, ".*")
    .replace(/\*/g, "[^/]+")

  return new RegExp(`^${escaped}$`)
}

/**
 * Convert an absolute or relative file path into a normalized `.hivemind/`
 * relative path when it lives under the current project root.
 *
 * @param projectRoot - Project root used to resolve the `.hivemind/` root.
 * @param filePath - File path to classify.
 * @returns Normalized `.hivemind/` relative path or `null` when outside root.
 */
export function toHivemindRelativePath(projectRoot: string, filePath: string): string | null {
  const root = resolve(getEffectivePaths(projectRoot).root)
  const absolute = resolve(filePath)

  if (absolute !== root && !absolute.startsWith(`${root}${sep}`)) {
    return null
  }

  const relativePath = relative(root, absolute)
  return normalizeRelativePath(relativePath.length > 0 ? relativePath : ".")
}

/**
 * Resolve the ingress policy entry for a concrete `.hivemind/` path.
 *
 * @param projectRoot - Project root used to resolve the `.hivemind/` root.
 * @param filePath - Concrete file path to classify.
 * @returns Matching ingress policy entry or `null` when no rule matches.
 */
export function classifyHivemindSurface(
  projectRoot: string,
  filePath: string,
): HivemindIngressPolicyEntry | null {
  const relativePath = toHivemindRelativePath(projectRoot, filePath)
  if (!relativePath) {
    return null
  }

  for (const entry of HIVEMIND_INGRESS_POLICY) {
    if (patternToRegExp(entry.pattern).test(relativePath)) {
      return entry
    }
  }

  return null
}

/**
 * Assert that a concrete `.hivemind/` surface is classified for the intended
 * operation before it is treated as runtime authority or durable evidence.
 *
 * @param projectRoot - Project root used to resolve the `.hivemind/` root.
 * @param filePath - Concrete file path being touched.
 * @param allowed - Allowed ingress classes for the operation.
 * @param operation - Human-readable operation description for error messages.
 * @returns Matching policy entry when the surface is allowed.
 */
export function ensureHivemindIngressClassification(
  projectRoot: string,
  filePath: string,
  allowed: readonly IngressClassification[],
  operation: string,
): HivemindIngressPolicyEntry {
  const relativePath = toHivemindRelativePath(projectRoot, filePath)
  if (!relativePath) {
    throw new Error(`[ingress-policy] ${operation} touches path outside .hivemind/: ${filePath}`)
  }

  const entry = classifyHivemindSurface(projectRoot, filePath)
  if (!entry) {
    throw new Error(`[ingress-policy] ${operation} touches unclassified surface: ${relativePath}`)
  }

  if (!allowed.includes(entry.classification)) {
    throw new Error(
      `[ingress-policy] ${operation} requires ${allowed.join(", ")} but ${relativePath} is classified as ${entry.classification}`,
    )
  }

  return entry
}

/**
 * Produce a warning when a caller reads a projection or compatibility surface.
 * This is the non-breaking first step for ingress regulation before broader
 * runtime enforcement is introduced.
 *
 * @param projectRoot - Project root used to resolve the `.hivemind/` root.
 * @param filePath - Concrete file path being read.
 * @returns Warning payload for projection/compatibility reads, otherwise `null`.
 */
export function createHivemindIngressWarning(
  projectRoot: string,
  filePath: string,
): HivemindIngressReadWarning | null {
  const relativePath = toHivemindRelativePath(projectRoot, filePath)
  if (!relativePath) {
    return null
  }

  const entry = classifyHivemindSurface(projectRoot, filePath)
  if (!entry) {
    return null
  }

  if (entry.classification !== "projection" && entry.classification !== "compatibility") {
    return null
  }

  return {
    path: relativePath,
    classification: entry.classification,
    note: entry.note,
  }
}
