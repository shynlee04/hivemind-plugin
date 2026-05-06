import { VALID_DELEGATION_CATEGORIES, type CategoryGateDecision, type CategoryGatePolicy, type CategoryGateSurface } from "./types.js"
import type { SkillFilter } from "./behavioral-profile/types.js"

type CategoryGateInput = {
  category?: string
  surface: CategoryGateSurface
  toolProfileMode?: string
  policy?: CategoryGatePolicy
}

export const DEFAULT_CATEGORY_GATE_POLICY: CategoryGatePolicy = {
  denyUnknownCategories: true,
  readonlyCategories: ["review", "research"],
  commandCategory: "command",
}

/**
 * Resolve a narrowing-only category gate decision for a delegation request.
 *
 * @param input - Category, surface, tool profile, and optional policy override.
 * @returns Auditable allow/deny decision without broadening permissions.
 */
export function resolveCategoryGateDecision(input: CategoryGateInput): CategoryGateDecision {
  const policy = input.policy ?? DEFAULT_CATEGORY_GATE_POLICY
  const category = input.category

  if (input.surface === "command-process") {
    if (category === policy.commandCategory) {
      return allow(category)
    }
    return deny(category, "command execution category is allowed only for command-process dispatch")
  }

  if (!category) {
    return allow(category)
  }

  if (!VALID_DELEGATION_CATEGORIES.includes(category as never)) {
    if (policy.denyUnknownCategories) {
      return deny(category, "unknown delegation category")
    }
    return allow(category)
  }

  if (policy.readonlyCategories.includes(category) && input.toolProfileMode === "write-capable") {
    return deny(category, `category "${category}" cannot use write-capable tools`)
  }

  return allow(category)
}

/** Build an allowed category decision. */
function allow(category: string | undefined): CategoryGateDecision {
  return { allowed: true, reason: "allowed", category, audit: { gate: "category" } }
}

/** Build a denied category decision with audit metadata. */
function deny(category: string | undefined, reason: string): CategoryGateDecision {
  return { allowed: false, reason, category, audit: { gate: "category", denyReason: reason } }
}

/**
 * Logs advisory skill filter notice when mode restricts skill loading.
 * Non-blocking — does not prevent skill loading, only annotates.
 *
 * **API surface for Phase WS-4** (auto-intent/workflow router): This function
 * is intentionally NOT called from any hook or tool yet. The WS-4 phase will
 * wire it into the skill-loading path to emit advisory notices when curated
 * mode is active. Until then, it is tested and exposed as public API.
 *
 * @param skillFilter - The active skill filter from behavioral profile
 * @param skillName - Name of the skill being loaded
 * @returns Advisory message if filter applies, undefined otherwise
 * @see D-11 in CA-02-CONTEXT.md
 */
export function checkSkillFilterAdvisory(
  skillFilter: SkillFilter,
  skillName: string,
): string | undefined {
  if (skillFilter === "curated" && skillName) {
    return `[Harness] Advisory: skillFilter is "curated" — skill "${skillName}" may not be in curated set`
  }
  return undefined
}
