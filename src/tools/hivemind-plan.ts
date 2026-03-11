/**
 * hivemind_plan — Plan hierarchy management tool.
 *
 * Actions:
 *   create  — create a new root/sub/atomic plan from template
 *   status  — show plan tree with statuses
 *   update  — update plan status, set active plan in trajectory context
 *   validate — run completion checks on a plan tree
 *   link    — link a session to a plan (wraps existing linkSessionToPlan)
 *
 * Design:
 *   1. Iceberg — minimal args, system handles path resolution
 *   2. Context Inference — resolves plan prefix to full path
 *   3. Signal-to-Noise — structured JSON output
 *   4. HC4 Compliance — symmetric read/write flows
 *   5. HC5 Compliance — deterministic machine-parseable output
 */

import { tool, type ToolDefinition } from "@opencode-ai/plugin/tool"
import { toSuccessOutput, toErrorOutput } from "../lib/tool-response.js"
import {
    createPlanDirectory,
    listPlanTree,
    updatePlanStatus,
    resolvePlanByPrefix,
    seedPlanTemplates,
} from "../lib/plan-fs.js"
import {
    checkPlanCompletionCriteria,
    syncPlanValidationState,
} from "../lib/plan-validation.js"
import { linkSessionToPlan, readManifest, writeManifest } from "../lib/manifest.js"
import type { PlanManifest, SessionManifest, PlanType, PlanDomain, PlanPurpose } from "../lib/manifest.js"
import { createStateManager } from "../lib/persistence.js"
import { getEffectivePaths } from "../lib/paths.js"
import { flushMutations } from "../lib/state-mutation-queue.js"

export function createHivemindPlanTool(directory: string): ToolDefinition {
    return tool({
        description:
            "Manage the plan hierarchy. " +
            "Actions: create (new plan), status (tree view), update (change plan status), " +
            "validate (completion checks), link (session→plan link). " +
            "Use --json for machine-parseable output.",
        args: {
            action: tool.schema
                .enum(["create", "status", "update", "validate", "link", "seed_templates"])
                .describe("What to do: create | status | update | validate | link | seed_templates"),
            prefix: tool.schema
                .string()
                .optional()
                .describe("Plan prefix (e.g., 'META01', 'PROJ01-SUB01')"),
            title: tool.schema
                .string()
                .optional()
                .describe("For create: plan title"),
            type: tool.schema
                .enum(["root", "sub", "atomic"])
                .optional()
                .describe("For create: plan type (root | sub | atomic)"),
            parent_prefix: tool.schema
                .string()
                .optional()
                .describe("For create (sub/atomic): parent plan prefix"),
            domain: tool.schema
                .string()
                .optional()
                .describe("Plan domain (frontend | backend | api | data | meta | infra | ...)"),
            purpose: tool.schema
                .string()
                .optional()
                .describe("Plan purpose (discovery | research | planning | implementation | testing | ...)"),
            status: tool.schema
                .enum(["pending", "active", "complete", "blocked"])
                .optional()
                .describe("For update: new status value"),
            session_id: tool.schema
                .string()
                .optional()
                .describe("For link: session ID to link"),
            plan_id: tool.schema
                .string()
                .optional()
                .describe("For validate/link: plan ID (UUID)"),
        },
        async execute(args, _context) {
            switch (args.action) {
                case "create":
                    return handleCreate(directory, args)
                case "status":
                    return handleStatus(directory)
                case "update":
                    return handleUpdate(directory, args)
                case "validate":
                    return handleValidate(directory, args)
                case "link":
                    return handleLink(directory, args)
                case "seed_templates":
                    return handleSeedTemplates(directory)
                default:
                    return toErrorOutput(`Unknown action: ${args.action}`)
            }
        },
    })
}

// ─── Action Handlers ─────────────────────────────────────────────────────────

/**
 * Persist active plan context through the canonical state-manager path after
 * flushing queued hook mutations. This prevents hot-path tools from clobbering
 * pending hook-owned updates with stale load/save cycles.
 *
 * @param directory - Project root containing `.hivemind/`.
 * @param prefix - Active plan prefix to stamp into trajectory context.
 * @param planId - Active plan ID to stamp into trajectory context.
 * @returns Promise that resolves once active plan context is persisted.
 */
async function persistActivePlanContext(
    directory: string,
    prefix: string,
    planId: string,
): Promise<void> {
    const stateManager = createStateManager(directory)
    await flushMutations(stateManager)
    await stateManager.withState((state) => ({
        ...state,
        trajectory_context: {
            ...state.trajectory_context,
            active_plan_prefix: prefix,
            active_plan_id: planId,
        },
    }))
}

async function handleCreate(
    directory: string,
    args: {
        prefix?: string
        title?: string
        type?: string
        parent_prefix?: string
        domain?: string
        purpose?: string
    },
): Promise<string> {
    if (!args.prefix?.trim()) {
        return toErrorOutput("prefix is required for create")
    }
    if (!args.title?.trim()) {
        return toErrorOutput("title is required for create")
    }

    const planType = (args.type ?? "root") as PlanType

    // Resolve parent if creating sub/atomic
    let parentId: string | null = null
    let rootId: string | null = null

    if (planType !== "root" && args.parent_prefix) {
        const parent = await resolvePlanByPrefix(directory, args.parent_prefix)
        if (!parent) {
            return toErrorOutput(`Parent plan not found: ${args.parent_prefix}`)
        }
        parentId = parent.id
        rootId = parent.root_id ?? parent.id
    }

    try {
        const result = await createPlanDirectory(directory, {
            prefix: args.prefix,
            title: args.title,
            type: planType,
            domain: (args.domain as PlanDomain) ?? "meta",
            purpose: (args.purpose as PlanPurpose) ?? "planning",
            parentId,
            rootId,
        })

        await persistActivePlanContext(directory, args.prefix, result.manifestEntry.id)

        return toSuccessOutput("Plan created", args.prefix, {
            id: result.manifestEntry.id,
            prefix: args.prefix,
            type: planType,
            path: result.planPath,
            parent_id: parentId,
            root_id: rootId,
        })
    } catch (err) {
        return toErrorOutput(`Failed to create plan: ${err instanceof Error ? err.message : String(err)}`)
    }
}

async function handleStatus(directory: string): Promise<string> {
    try {
        const tree = await listPlanTree(directory)

        if (tree.length === 0) {
            return toSuccessOutput("No plans found", undefined, { plans: [], total: 0 })
        }

        return toSuccessOutput("Plan tree", undefined, {
            total: countTree(tree),
            plans: tree,
        })
    } catch (err) {
        return toErrorOutput(`Failed to list plans: ${err instanceof Error ? err.message : String(err)}`)
    }
}

async function handleUpdate(
    directory: string,
    args: {
        prefix?: string
        status?: string
    },
): Promise<string> {
    if (!args.prefix?.trim()) {
        return toErrorOutput("prefix is required for update")
    }
    if (!args.status) {
        return toErrorOutput("status is required for update")
    }

    const entry = await resolvePlanByPrefix(directory, args.prefix)
    if (!entry) {
        return toErrorOutput(`Plan not found: ${args.prefix}`)
    }

    const paths = getEffectivePaths(directory)
    const planPath = `${paths.plansDir}/${entry.path}`

    try {
        await updatePlanStatus(planPath, args.status as "pending" | "active" | "complete" | "blocked")

        if (args.status === "active") {
            await persistActivePlanContext(directory, args.prefix, entry.id)
        }

        return toSuccessOutput("Plan updated", args.prefix, {
            prefix: args.prefix,
            status: args.status,
            plan_id: entry.id,
        })
    } catch (err) {
        return toErrorOutput(`Failed to update plan: ${err instanceof Error ? err.message : String(err)}`)
    }
}

async function handleValidate(
    directory: string,
    args: {
        prefix?: string
        plan_id?: string
    },
): Promise<string> {
    if (!args.prefix && !args.plan_id) {
        return toErrorOutput("Either prefix or plan_id is required for validate")
    }

    let planId: string
    let prefix: string

    if (args.prefix) {
        const entry = await resolvePlanByPrefix(directory, args.prefix)
        if (!entry) {
            return toErrorOutput(`Plan not found: ${args.prefix}`)
        }
        planId = entry.id
        prefix = entry.prefix
    } else {
        planId = args.plan_id!
        prefix = planId.slice(0, 8)
    }

    try {
        const criteria = await checkPlanCompletionCriteria(directory, planId)

        // Determine overall validation state
        const allPass = criteria.all_nodes_complete &&
            criteria.all_links_resolve &&
            criteria.all_validations_pass &&
            criteria.yaml_headers_valid &&
            criteria.navigation_intact &&
            criteria.graph_sync

        const validationState = allPass ? "validated" as const : "failed" as const

        // Sync validation state back to manifest
        await syncPlanValidationState(directory, planId, validationState)

        return toSuccessOutput(
            allPass ? "Plan validation passed" : "Plan validation failed",
            prefix,
            {
                plan_id: planId,
                validation_state: validationState,
                criteria,
            },
        )
    } catch (err) {
        return toErrorOutput(`Validation failed: ${err instanceof Error ? err.message : String(err)}`)
    }
}

async function handleLink(
    directory: string,
    args: {
        prefix?: string
        session_id?: string
        plan_id?: string
    },
): Promise<string> {
    if (!args.plan_id && !args.prefix) {
        return toErrorOutput("Either plan_id or prefix is required for link")
    }

    let targetPlanId: string

    if (args.prefix) {
        const entry = await resolvePlanByPrefix(directory, args.prefix)
        if (!entry) {
            return toErrorOutput(`Plan not found: ${args.prefix}`)
        }
        targetPlanId = entry.id
    } else {
        targetPlanId = args.plan_id!
    }

    // Resolve session ID
    let sessionId = args.session_id
    if (!sessionId) {
        const stateManager = createStateManager(directory)
        const state = await stateManager.load()
        sessionId = state?.session.id ?? "unknown"
    }

    try {
        const paths = getEffectivePaths(directory)
        const sessionsManifest = await readManifest<SessionManifest>(paths.sessionsManifest, { sessions: [], active_stamp: null })
        const plansManifest = await readManifest<PlanManifest>(paths.plansManifest, { plans: [] })

        const result = linkSessionToPlan(sessionsManifest, plansManifest, sessionId, targetPlanId)

        if (!result.linked) {
            return toErrorOutput(`Failed to link: session or plan not found in manifests`)
        }

        // Persist updated manifests
        await writeManifest(paths.sessionsManifest, result.sessionsManifest)
        await writeManifest(paths.plansManifest, result.plansManifest)

        return toSuccessOutput("Session linked to plan", undefined, {
            session_id: sessionId,
            plan_id: targetPlanId,
        })
    } catch (err) {
        return toErrorOutput(`Failed to link: ${err instanceof Error ? err.message : String(err)}`)
    }
}

async function handleSeedTemplates(directory: string): Promise<string> {
    try {
        await seedPlanTemplates(directory)
        return toSuccessOutput("Plan templates seeded", undefined, {
            templates: ["root-plan.md", "sub-plan.md", "atomic-plan.md", "validation.md"],
        })
    } catch (err) {
        return toErrorOutput(`Failed to seed templates: ${err instanceof Error ? err.message : String(err)}`)
    }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function countTree(entries: Array<{ children: Array<unknown> }>): number {
    let count = entries.length
    for (const entry of entries) {
        count += countTree(entry.children as Array<{ children: Array<unknown> }>)
    }
    return count
}
