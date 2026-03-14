/**
 * Plan Filesystem CRUD — creates, reads, and manages plan hierarchy files.
 *
 * Operates on .hivemind/plans/{PREFIX}/ directories and produces
 * YAML-frontmatter + markdown plan files matching the planning framework schema.
 */

import { randomUUID } from "node:crypto"
import { existsSync } from "node:fs"
import { mkdir, readFile, writeFile } from "node:fs/promises"
import { join, relative } from "path"
import { parse, stringify } from "yaml"
import { getEffectivePaths } from "./paths.js"
import type { PlanManifestEntry, PlanManifest, PlanType, PlanDomain, PlanPurpose, PlanValidationState } from "./manifest.js"
import { readManifest, writeManifest } from "./manifest.js"
import type { PlanFileFrontmatter } from "../schemas/planning.js"

// ─── Types ───────────────────────────────────────────────────────────────────

export interface CreatePlanOptions {
    prefix: string
    title: string
    type: PlanType
    domain?: PlanDomain
    purpose?: PlanPurpose
    parentId?: string | null
    rootId?: string | null
    trajectoryId?: string
    tags?: string[]
    acceptanceCriteria?: string[]
}

export interface PlanTreeEntry {
    id: string
    prefix: string
    type: PlanType
    status: string
    title: string
    path: string
    children: PlanTreeEntry[]
    validationState: PlanValidationState
}

// ─── Plan Templates ──────────────────────────────────────────────────────────

export function getRootPlanTemplate(): string {
    return `# {PREFIX}: {TITLE}

## Summary
<!-- 2-3 sentence synopsis for jump-reading -->

## Objectives
- [ ] Objective 1
- [ ] Objective 2

## Navigation
- **Parent**: none (root plan)
- **Children**: <!-- auto-populated -->
- **Dependencies**: none
- **Sessions**: <!-- linked sessions -->

## Acceptance Criteria
1. All sub-plans have status: complete
2. Validation artifacts pass
3. Navigation links resolve

## Decision Trail
<!-- Chronological log of key decisions and pivots -->

## Notes
<!-- Scratchpad -->
`
}

export function getSubPlanTemplate(): string {
    return `# {PREFIX}: {TITLE}

## Summary
<!-- 2-3 sentence synopsis -->

## Objectives
- [ ] Objective 1
- [ ] Objective 2

## Navigation
- **Parent**: [{PARENT_PREFIX}]({PARENT_PATH})
- **Children**: <!-- auto-populated -->
- **Dependencies**: <!-- plan IDs -->
- **Sessions**: <!-- linked sessions -->

## Acceptance Criteria
1. <!-- criterion 1 -->
2. <!-- criterion 2 -->

## Decision Trail
<!-- Chronological log of key decisions and pivots -->

## Notes
<!-- Scratchpad -->
`
}

export function getAtomicPlanTemplate(): string {
    return `# {PREFIX}: {TITLE}

## Summary
<!-- 2-3 sentence synopsis -->

## Task Description
<!-- Detailed task specification -->

## Navigation
- **Parent**: [{PARENT_PREFIX}]({PARENT_PATH})
- **Root**: [{ROOT_PREFIX}]({ROOT_PATH})
- **Dependencies**: <!-- plan IDs -->
- **Sessions**: <!-- linked sessions -->

## Acceptance Criteria
1. <!-- criterion 1 -->
2. <!-- criterion 2 -->

## Verification Steps
<!-- Steps to verify this atomic task is done -->

## Decision Trail
<!-- Chronological log of key decisions and pivots -->

## Notes
<!-- Scratchpad -->
`
}

export function getValidationTemplate(): string {
    return `# VALIDATION: {PREFIX}

## Criteria Checklist
<!-- - [x] Criterion 1 — evidence: commit abc1234 -->
<!-- - [ ] Criterion 2 — pending -->

## Decision Trail
<!-- Pivots, blockers, escalations -->

## Research References
<!-- Links to synthesis, codewiki, external docs -->
`
}

// ─── CRUD Operations ─────────────────────────────────────────────────────────

/**
 * Resolves the directory path for a plan prefix.
 * META01 → plans/META01/
 * META01-SUB01 → plans/META01/SUB01/
 * META01-SUB01-ATOMIC01 → plans/META01/SUB01/ATOMIC/
 */
export function resolvePlanDirPath(plansDir: string, prefix: string): string {
    const parts = prefix.split("-")
    const segments: string[] = []

    // First part is always the root id (META01, PROJ01)
    if (parts.length >= 1) {
        segments.push(parts[0])
    }

    // SUB parts
    for (let i = 1; i < parts.length; i++) {
        const part = parts[i]
        if (part.startsWith("SUB")) {
            segments.push(part)
        } else if (part.startsWith("ATOMIC")) {
            segments.push("ATOMIC")
        }
    }

    return join(plansDir, ...segments)
}

/**
 * Build the plan filename from prefix and type.
 * META01 → META01-PLAN.md
 * META01-SUB01 → META01-SUB01-PLAN.md
 */
function buildPlanFilename(prefix: string): string {
    return `${prefix}-PLAN.md`
}

/**
 * Create a new plan directory with a plan file from template.
 */
export async function createPlanDirectory(
    projectRoot: string,
    options: CreatePlanOptions,
): Promise<{ planPath: string; manifestEntry: PlanManifestEntry }> {
    const paths = getEffectivePaths(projectRoot)
    const planDir = resolvePlanDirPath(paths.plansDir, options.prefix)
    const planFilename = buildPlanFilename(options.prefix)
    const planPath = join(planDir, planFilename)
    const now = new Date()
    const nowIso = now.toISOString()
    const planId = randomUUID()

    // Ensure directory exists
    await mkdir(planDir, { recursive: true })

    // Select template based on type
    let template: string
    switch (options.type) {
        case "sub":
            template = getSubPlanTemplate()
            break
        case "atomic":
            template = getAtomicPlanTemplate()
            break
        default:
            template = getRootPlanTemplate()
    }

    // Build frontmatter
    const frontmatter: Record<string, unknown> = {
        id: planId,
        type: options.type === "root" ? "plan" : options.type === "sub" ? "sub_plan" : "atomic_plan",
        prefix: options.prefix,
        title: options.title,
        status: "pending",
        parent_id: options.parentId ?? null,
        root_id: options.rootId ?? null,
        trajectory_id: options.trajectoryId ?? null,
        session_ids: [],
        dependencies: [],
        created: nowIso,
        updated: nowIso,
        owner: "main",
        domain: options.domain ?? "meta",
        purpose: options.purpose ?? "planning",
        tier: "planning_artifact",
        validation_state: "pending",
        tags: options.tags ?? [],
    }

    // Substitute template placeholders
    let body = template
        .replace(/\{PREFIX\}/g, options.prefix)
        .replace(/\{TITLE\}/g, options.title)

    if (options.acceptanceCriteria && options.acceptanceCriteria.length > 0) {
        const criteriaLines = options.acceptanceCriteria.map((c, i) => `${i + 1}. ${c}`)
        body = body.replace(
            /## Acceptance Criteria\n[\s\S]*?(?=\n## )/,
            `## Acceptance Criteria\n${criteriaLines.join("\n")}\n\n`,
        )
    }

    const yamlContent = stringify(frontmatter)
    const fileContent = `---\n${yamlContent}---\n\n${body}`

    await writeFile(planPath, fileContent, "utf-8")

    // Build manifest entry
    const manifestEntry: PlanManifestEntry = {
        id: planId,
        type: options.type,
        prefix: options.prefix,
        status: "pending",
        created: now.getTime(),
        slug: options.prefix.toLowerCase(),
        path: relative(paths.plansDir, planPath),
        parent_id: options.parentId ?? null,
        root_id: options.rootId ?? null,
        linked_sessions: [],
        linked_graph_plan_id: null,
        domain: options.domain ?? "meta",
        purpose: options.purpose ?? "planning",
        validation_state: "pending",
        dependencies: [],
    }

    // Register in plans manifest
    const planManifest = await readManifest<PlanManifest>(paths.plansManifest, { plans: [] })
    planManifest.plans.push(manifestEntry)
    await writeManifest(paths.plansManifest, planManifest)

    return { planPath, manifestEntry }
}

/**
 * Parse YAML frontmatter from a plan markdown file.
 */
export function parsePlanFrontmatter(content: string): Partial<PlanFileFrontmatter> {
    const match = content.match(/^---\n([\s\S]*?)\n---/)
    if (!match) return {}
    try {
        return parse(match[1]) as Partial<PlanFileFrontmatter>
    } catch {
        return {}
    }
}

/**
 * Read and parse a plan file's frontmatter.
 */
export async function readPlanFrontmatter(planPath: string): Promise<Partial<PlanFileFrontmatter>> {
    const content = await readFile(planPath, "utf-8")
    return parsePlanFrontmatter(content)
}

/**
 * Update a plan file's status in its YAML frontmatter.
 */
export async function updatePlanStatus(
    planPath: string,
    status: "pending" | "active" | "complete" | "blocked",
): Promise<void> {
    const content = await readFile(planPath, "utf-8")
    const match = content.match(/^---\n([\s\S]*?)\n---/)
    if (!match) return

    const fm = parse(match[1]) as Record<string, unknown>
    fm.status = status
    fm.updated = new Date().toISOString()

    const newYaml = stringify(fm)
    const body = content.slice(match[0].length)
    await writeFile(planPath, `---\n${newYaml}---${body}`, "utf-8")
}

/**
 * Walk the plans/ directory and build a tree of all plans.
 */
export async function listPlanTree(projectRoot: string): Promise<PlanTreeEntry[]> {
    const paths = getEffectivePaths(projectRoot)
    const planManifest = await readManifest<PlanManifest>(paths.plansManifest, { plans: [] })

    // Build lookup by id
    const byId = new Map<string, PlanManifestEntry>()
    for (const entry of planManifest.plans) {
        byId.set(entry.id, entry)
    }

    // Build tree from manifest entries
    const rootEntries = planManifest.plans.filter((e) => !e.parent_id)
    const childrenOf = (parentId: string): PlanTreeEntry[] =>
        planManifest.plans
            .filter((e) => e.parent_id === parentId)
            .map((e) => toTreeEntry(e))

    function toTreeEntry(entry: PlanManifestEntry): PlanTreeEntry {
        return {
            id: entry.id,
            prefix: entry.prefix,
            type: entry.type,
            status: entry.status,
            title: entry.slug,
            path: entry.path,
            children: childrenOf(entry.id),
            validationState: entry.validation_state,
        }
    }

    return rootEntries.map(toTreeEntry)
}

/**
 * Resolve a plan prefix to its manifest entry.
 */
export async function resolvePlanByPrefix(
    projectRoot: string,
    prefix: string,
): Promise<PlanManifestEntry | null> {
    const paths = getEffectivePaths(projectRoot)
    const planManifest = await readManifest<PlanManifest>(paths.plansManifest, { plans: [] })
    return planManifest.plans.find((e) => e.prefix === prefix) ?? null
}

/**
 * Seed plan templates into plans/templates/ during init.
 */
export async function seedPlanTemplates(projectRoot: string): Promise<void> {
    const paths = getEffectivePaths(projectRoot)
    const templatesDir = paths.planTemplatesDir

    await mkdir(templatesDir, { recursive: true })

    const templates: Record<string, string> = {
        "root-plan.md": `---\ntype: template\nfor: root_plan\n---\n\n${getRootPlanTemplate()}`,
        "sub-plan.md": `---\ntype: template\nfor: sub_plan\n---\n\n${getSubPlanTemplate()}`,
        "atomic-plan.md": `---\ntype: template\nfor: atomic_plan\n---\n\n${getAtomicPlanTemplate()}`,
        "validation.md": `---\ntype: template\nfor: validation\n---\n\n${getValidationTemplate()}`,
    }

    for (const [fileName, content] of Object.entries(templates)) {
        const filePath = join(templatesDir, fileName)
        if (!existsSync(filePath)) {
            await writeFile(filePath, content, "utf-8")
        }
    }
}
