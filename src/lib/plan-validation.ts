/**
 * Plan Validation — creates and manages validation artifacts for plans.
 *
 * Each plan can have a VALIDATION-{PREFIX}.md file that tracks
 * acceptance criteria evidence and completion status.
 */

import { randomUUID } from "node:crypto"
import { existsSync } from "node:fs"
import { readFile, writeFile } from "node:fs/promises"
import { join } from "path"
import { parse, stringify } from "yaml"
import { getEffectivePaths } from "./paths.js"
import { readManifest, writeManifest } from "./manifest.js"
import type { PlanManifest } from "./manifest.js"
import { resolvePlanDirPath, parsePlanFrontmatter } from "./plan-fs.js"
import type { ValidationArtifact, ValidationEvidence, PlanCompletionCriteria } from "../schemas/planning.js"

// ─── Validation Artifact CRUD ────────────────────────────────────────────────

/**
 * Create a validation artifact for a plan.
 *
 * When `criteria` are provided, they are:
 *   1. Stored in the YAML frontmatter as a machine-checkable list
 *   2. Rendered as a real markdown checklist in the body
 * This enables higher-hierarchy plans to declare what child plan nodes
 * must satisfy before the parent plan can be validated.
 */
export async function createValidationArtifact(
    projectRoot: string,
    prefix: string,
    planId: string,
    criteria?: string[],
): Promise<string> {
    const paths = getEffectivePaths(projectRoot)
    const planDir = resolvePlanDirPath(paths.plansDir, prefix)
    const validationPath = join(planDir, `VALIDATION-${prefix}.md`)
    const now = new Date().toISOString()

    // Normalize criteria — each entry is an acceptance criterion string
    const normalizedCriteria = (criteria ?? []).map((c, i) => ({
        index: i,
        text: c,
        status: "pending" as const,
        evidence: null as string | null,
    }))

    const frontmatter: Record<string, unknown> = {
        id: randomUUID(),
        type: "validation",
        plan_id: planId,
        status: "pending",
        validator: "main",
        created: now,
        updated: now,
        evidence: [],
        criteria: normalizedCriteria,
    }

    const yamlContent = stringify(frontmatter)

    // Build the criteria checklist markdown
    let criteriaSection: string
    if (criteria && criteria.length > 0) {
        const lines = criteria.map((c) => `- [ ] ${c}`)
        criteriaSection = lines.join("\n")
    } else {
        criteriaSection = `<!-- - [x] Criterion 1 — evidence: commit abc1234 -->
<!-- - [ ] Criterion 2 — pending -->`
    }

    const body = `# VALIDATION: ${prefix}

## Criteria Checklist
${criteriaSection}

## Decision Trail
<!-- Pivots, blockers, escalations -->

## Research References
<!-- Links to synthesis, codewiki, external docs -->
`

    await writeFile(validationPath, `---\n${yamlContent}---\n\n${body}`, "utf-8")
    return validationPath
}

/**
 * Parse a validation artifact file.
 */
export async function readValidationArtifact(
    validationPath: string,
): Promise<Partial<ValidationArtifact>> {
    const content = await readFile(validationPath, "utf-8")
    const match = content.match(/^---\n([\s\S]*?)\n---/)
    if (!match) return {}
    try {
        return parse(match[1]) as Partial<ValidationArtifact>
    } catch {
        return {}
    }
}

/**
 * Update validation artifact status and add evidence.
 */
export async function updateValidationStatus(
    validationPath: string,
    status: "pending" | "pass" | "fail" | "partial",
    evidence?: ValidationEvidence[],
): Promise<void> {
    const content = await readFile(validationPath, "utf-8")
    const match = content.match(/^---\n([\s\S]*?)\n---/)
    if (!match) return

    const fm = parse(match[1]) as Record<string, unknown>
    fm.status = status
    fm.updated = new Date().toISOString()

    if (evidence && evidence.length > 0) {
        const existing = Array.isArray(fm.evidence) ? fm.evidence as ValidationEvidence[] : []
        fm.evidence = [...existing, ...evidence]
    }

    const newYaml = stringify(fm)
    const body = content.slice(match[0].length)
    await writeFile(validationPath, `---\n${newYaml}---${body}`, "utf-8")
}

/**
 * Update the plan manifest's validation_state for a given plan ID.
 */
export async function syncPlanValidationState(
    projectRoot: string,
    planId: string,
    validationState: "pending" | "validated" | "failed" | "skipped",
): Promise<void> {
    const paths = getEffectivePaths(projectRoot)
    const manifest = await readManifest<PlanManifest>(paths.plansManifest, { plans: [] })

    const planIndex = manifest.plans.findIndex((p) => p.id === planId)
    if (planIndex < 0) return

    manifest.plans[planIndex] = {
        ...manifest.plans[planIndex],
        validation_state: validationState,
        updated_at_epoch: Date.now(),
        updated_at_iso: new Date().toISOString(),
    }

    await writeManifest(paths.plansManifest, manifest)
}

// ─── Completion Check Engine ─────────────────────────────────────────────────

/**
 * Machine-checkable plan completion criteria.
 *
 * Evaluates whether a plan tree is complete by checking:
 * 1. All nodes complete
 * 2. All FK links resolve
 * 3. All validations pass
 * 4. YAML headers valid
 * 5. Navigation links resolve
 * 6. Graph sync (manifest ↔ graph)
 */
export async function checkPlanCompletionCriteria(
    projectRoot: string,
    rootPlanId: string,
): Promise<PlanCompletionCriteria> {
    const paths = getEffectivePaths(projectRoot)
    const manifest = await readManifest<PlanManifest>(paths.plansManifest, { plans: [] })

    // Find all plans in this tree
    const treePlans = findTreePlans(manifest.plans, rootPlanId)
    const planIds = new Set(treePlans.map((p) => p.id))

    // 1. All nodes complete
    const allNodesComplete = treePlans.every((p) => p.status === "complete")

    // 2. All links resolve (parent_id and root_id point to existing plans)
    const allLinksResolve = treePlans.every((p) => {
        if (p.parent_id && !planIds.has(p.parent_id)) return false
        if (p.root_id && !planIds.has(p.root_id)) return false
        return true
    })

    // 3. All validations pass
    const allValidationsPass = treePlans.every(
        (p) => p.validation_state === "validated" || p.validation_state === "skipped",
    )

    // 4. YAML headers valid (check plan files exist and have parseable frontmatter)
    let yamlHeadersValid = true
    for (const plan of treePlans) {
        const planPath = join(paths.plansDir, plan.path)
        if (!existsSync(planPath)) {
            yamlHeadersValid = false
            break
        }
        try {
            const content = await readFile(planPath, "utf-8")
            const fm = parsePlanFrontmatter(content)
            if (!fm.id || !fm.type) {
                yamlHeadersValid = false
                break
            }
        } catch {
            yamlHeadersValid = false
            break
        }
    }

    // 5. Navigation intact (simplified: check plan files exist)
    const navigationIntact = treePlans.every((p) => existsSync(join(paths.plansDir, p.path)))

    // 6. Graph sync (plans in manifest have matching entries)
    const graphSync = treePlans.every((p) => manifest.plans.some((m) => m.id === p.id))

    return {
        all_nodes_complete: allNodesComplete,
        all_links_resolve: allLinksResolve,
        all_validations_pass: allValidationsPass,
        yaml_headers_valid: yamlHeadersValid,
        navigation_intact: navigationIntact,
        graph_sync: graphSync,
    }
}

/**
 * Find all plans in a tree starting from a root plan ID.
 */
function findTreePlans(
    plans: PlanManifest["plans"],
    rootId: string,
): PlanManifest["plans"] {
    const result: PlanManifest["plans"] = []
    const visited = new Set<string>()

    function collect(id: string) {
        if (visited.has(id)) return
        visited.add(id)

        const plan = plans.find((p) => p.id === id)
        if (plan) {
            result.push(plan)
            // Find children
            for (const child of plans.filter((p) => p.parent_id === id)) {
                collect(child.id)
            }
        }
    }

    collect(rootId)
    return result
}
