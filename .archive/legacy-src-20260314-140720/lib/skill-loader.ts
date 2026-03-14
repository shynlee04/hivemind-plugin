/**
 * Intent-driven skill resolution — maps classified user intent to required skills.
 *
 * Complements `skill-registry.ts` (which resolves by constraints/bundles) by
 * providing the WHAT-to-load logic based on entry-resolution classification.
 *
 * Priority hierarchy (per PLAN.md):
 *   1. Entry-First     — Always load entry-resolution
 *   2. User-Intent     — Load skills matching classified intent
 *   3. Context-Integrity — Post-compaction / recovery loads context-integrity
 *
 * @see .agent/skills/entry-resolution/SKILL.md — defines the decision tree
 * @see .agent/skills/platform-adapter/SKILL.md — conditional platform loading
 */

/**
 * Classified intent from entry-resolution Step 3.
 * - framework-meta: Skills/agents/governance changes (hivefiver lineage)
 * - product-impl:   Product feature/bug work (hiveminder lineage)
 * - research:       Investigation or information gathering
 * - ambiguous:      Unclear intent — defer loading until clarified
 */
export type ClassifiedIntent =
    | "framework-meta"
    | "product-impl"
    | "research"
    | "ambiguous"

/**
 * Detected runtime platform — determines which platform-adapter reference to load.
 */
export type DetectedPlatform =
    | "opencode"
    | "antigravity"
    | "claude-code"
    | "codex"
    | "editor"
    | "unknown"

/**
 * Session context signals that modify skill selection.
 */
export interface SkillLoadContext {
    /** Classified intent from entry-resolution Step 3 */
    intent: ClassifiedIntent
    /** True if this is the first session (no prior state) */
    isFirstSession: boolean
    /** True if recovering from context compaction */
    isPostCompaction: boolean
    /** Detected runtime platform */
    platform: DetectedPlatform
    /** True if the classified intent requires delegation */
    delegationNeeded: boolean
    /** True if non-English user input was detected */
    nonEnglishInput: boolean
}

/**
 * Resolved skill set, split by loading urgency.
 * - required:    Always loaded at session start
 * - conditional: Loaded when specific triggers match
 * - deferred:    Available but NOT pre-loaded (saves context budget)
 */
export interface SkillLoadResult {
    /** Always load these skills */
    required: string[]
    /** Load if triggered by the decision tree */
    conditional: string[]
    /** Available but not pre-loaded — load on demand */
    deferred: string[]
}

// ── Skill sets per intent ──────────────────────────────────────────

/** Skills always loaded regardless of intent */
const UNIVERSAL_REQUIRED: readonly string[] = [
    "entry-resolution",
    "platform-adapter",
] as const

const INTENT_MAP: Record<ClassifiedIntent, {
    required: readonly string[]
    conditional: readonly string[]
    deferred: readonly string[]
}> = {
    "framework-meta": {
        required: [...UNIVERSAL_REQUIRED],
        conditional: ["delegation-framework", "meta-builder-governance"],
        deferred: ["spec-distillation", "research-methodology", "ralph-tasking"],
    },
    "product-impl": {
        required: [...UNIVERSAL_REQUIRED],
        conditional: ["verification-methodology", "evidence-discipline"],
        deferred: ["delegation-framework", "spec-distillation"],
    },
    research: {
        required: [...UNIVERSAL_REQUIRED, "research-methodology"],
        conditional: ["evidence-discipline"],
        deferred: ["delegation-framework", "spec-distillation"],
    },
    ambiguous: {
        required: [...UNIVERSAL_REQUIRED, "context-integrity"],
        conditional: [],
        deferred: [
            "delegation-framework",
            "meta-builder-governance",
            "verification-methodology",
            "evidence-discipline",
            "research-methodology",
            "spec-distillation",
        ],
    },
}

// ── Conditional reference triggers (from entry-resolution) ──────

/**
 * Entry-resolution bundled references that load conditionally.
 * These are sub-references within skills, not top-level skills.
 */
export interface ConditionalReference {
    /** Skill that owns this reference */
    skill: string
    /** Relative path within the skill directory */
    reference: string
    /** Human-readable explanation of why it loads */
    reason: string
}

/**
 * Resolve which skills should be loaded based on classified intent and session context.
 *
 * This function is PURE — no side effects, no I/O. It maps context → skill list.
 * The caller (session-lifecycle hook) handles actual skill loading.
 */
export function resolveSkillsForIntent(ctx: SkillLoadContext): SkillLoadResult {
    const mapping = INTENT_MAP[ctx.intent]

    const required = [...mapping.required]
    const conditional = [...mapping.conditional]
    const deferred = [...mapping.deferred]

    // ── Context-driven promotions ──

    // Post-compaction always needs context-integrity
    if (ctx.isPostCompaction && !required.includes("context-integrity")) {
        required.push("context-integrity")
    }

    // Delegation always needs delegation-framework
    if (ctx.delegationNeeded) {
        promoteToConditional("delegation-framework", conditional, deferred)
    }

    return {
        required: dedupe(required),
        conditional: dedupe(conditional.filter((s) => !required.includes(s))),
        deferred: dedupe(deferred.filter((s) => !required.includes(s) && !conditional.includes(s))),
    }
}

/**
 * Resolve conditional references from entry-resolution's bundled references table.
 * These are sub-references within skills that load only when specific triggers match.
 */
export function resolveConditionalReferences(ctx: SkillLoadContext): ConditionalReference[] {
    const refs: ConditionalReference[] = []

    if (ctx.isFirstSession) {
        refs.push({
            skill: "entry-resolution",
            reference: "references/persona-routing.md",
            reason: "First session — resolve agent persona",
        })
    }

    if (ctx.nonEnglishInput) {
        refs.push({
            skill: "entry-resolution",
            reference: "references/language-adaptation.md",
            reason: "Non-English input detected",
        })
    }

    if (ctx.isPostCompaction) {
        refs.push({
            skill: "entry-resolution",
            reference: "references/tdd-gate.md",
            reason: "Post-compaction — re-verify completion claims",
        })
    }

    return refs
}

// ── Helpers ─────────────────────────────────────────────────────

/** Promote a skill from deferred to conditional (if present in deferred) */
function promoteToConditional(
    skill: string,
    conditional: string[],
    deferred: string[],
): void {
    const idx = deferred.indexOf(skill)
    if (idx !== -1) {
        deferred.splice(idx, 1)
        if (!conditional.includes(skill)) {
            conditional.push(skill)
        }
    }
}

/** Remove duplicates preserving order */
function dedupe(arr: string[]): string[] {
    return [...new Set(arr)]
}
