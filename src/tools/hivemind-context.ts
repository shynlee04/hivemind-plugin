import { tool, type ToolDefinition } from "@opencode-ai/plugin/tool"

import { createStateManager } from "../lib/persistence.js"
import { getEffectivePaths } from "../lib/paths.js"
import { toErrorOutput, toSuccessOutput } from "../lib/tool-response.js"
import { flushMutations, flushTaskManifestMutations } from "../lib/state-mutation-queue.js"
import { consolidateTemporaryPayloads, purifyContextFragments } from "../lib/context-purifier.js"
import { createEvent, eventBus } from "../lib/event-bus.js"
import { purgeTransientSessionMemory } from "../lib/session-memory-purge.js"
import {
  applyVerifiedPendingChange,
  ensureSotGovernanceFiles,
  loadPendingChanges,
  loadVerificationLedger,
} from "../lib/sot-governance.js"
import { recordConsolidationAndPurge } from "../schemas/brain-state.js"

export function createHivemindContextTool(directory: string): ToolDefinition {
  return tool({
    description:
      "Context governance runtime controls. Actions: validate, purge, doctor, resume. " +
      "Use this to keep context economical and lifecycle-safe before session close.",
    args: {
      action: tool.schema.enum(["validate", "purge", "doctor", "resume"]),
      pending_change_id: tool.schema
        .string()
        .optional()
        .describe("Optional for validate/doctor: attempt to apply this verified pending change"),
    },
    async execute(args) {
      const stateManager = createStateManager(directory)
      await flushMutations(stateManager)
      await flushTaskManifestMutations()
      await ensureSotGovernanceFiles(directory)

      switch (args.action) {
        case "validate":
          return handleValidate(directory)
        case "purge":
          return handlePurge(directory)
        case "doctor":
          return handleDoctor(directory, args.pending_change_id)
        case "resume":
          return handleResume(directory)
        default:
          return toErrorOutput(`Unknown action: ${args.action}`)
      }
    },
  })
}

async function handleValidate(directory: string): Promise<string> {
  const stateManager = createStateManager(directory)
  const state = await stateManager.load()
  if (!state) {
    return toErrorOutput("No active state found. Start a session before validation.")
  }

  const pending = await loadPendingChanges(directory)
  const ledger = await loadVerificationLedger(directory)
  const queued = pending.pending_changes.filter((entry) => entry.status === "queued").length
  const verified = pending.pending_changes.filter((entry) => entry.status === "verified").length
  const applied = pending.pending_changes.filter((entry) => entry.status === "applied").length

  return toSuccessOutput("Context governance validation complete", state.session.id, {
    firstTurnConfirmed: state.first_turn_confirmation.confirmed,
    selectedOutputStyle: state.selected_output_style_v29,
    memoryGovernance: state.memory_governance,
    offtrackTodoPending: state.offtrack_todo_pending.filter((item) => item.status === "pending").length,
    pendingChanges: {
      total: pending.pending_changes.length,
      queued,
      verified,
      applied,
    },
    verificationLedgerRecords: ledger.records.length,
  })
}

async function handlePurge(directory: string): Promise<string> {
  const stateManager = createStateManager(directory)
  const state = await stateManager.load()
  if (!state) {
    return toErrorOutput("No active state found. Nothing to purge.")
  }

  const fragments = state.recent_messages.map((message, idx) => ({
    id: `${message.role}-${idx}`,
    source: message.role,
    content: message.content,
    temporary: true,
  }))
  const purified = purifyContextFragments(fragments)
  const condensed = consolidateTemporaryPayloads(fragments)

  // Phase 3A: Purge transient session memory nodes
  const sessionMemoryPurge = await purgeTransientSessionMemory(directory, state.session.id)

  const nextState = recordConsolidationAndPurge(
    {
      ...state,
      recent_messages: [],
      // Phase 3A: Clear pending_purge flag after purge completes
      memory_governance: {
        ...state.memory_governance,
        pending_purge: false,
      },
    },
    purified.consolidated.length,
    purified.purged_temporary_count + sessionMemoryPurge.purgedCount
  )
  await stateManager.save(nextState)
  eventBus.emitEvent(
    createEvent(
      "context:consolidated",
      {
        consolidatedCount: purified.consolidated.length,
        dedupedCount: purified.deduped_count,
        sessionId: nextState.session.id,
      },
      "context-purifier"
    )
  )
  eventBus.emitEvent(
    createEvent(
      "context:purged",
      {
        purgedTemporaryCount: purified.purged_temporary_count,
        sessionMemoryPurgedCount: sessionMemoryPurge.purgedCount,
        sessionId: nextState.session.id,
      },
      "context-purifier"
    )
  )

  return toSuccessOutput("Context temporary payloads consolidated and purged", nextState.session.id, {
    consolidatedCount: purified.consolidated.length,
    dedupedCount: purified.deduped_count,
    purgedTemporaryCount: purified.purged_temporary_count,
    sessionMemoryPurged: sessionMemoryPurge.purgedCount,
    sessionMemorySynthesis: sessionMemoryPurge.synthesized,
    condensedPreview: condensed,
  })
}

async function handleDoctor(directory: string, pendingChangeId?: string): Promise<string> {
  const paths = getEffectivePaths(directory)
  const stateManager = createStateManager(directory)
  const state = await stateManager.load()
  const pending = await loadPendingChanges(directory)
  const ledger = await loadVerificationLedger(directory)
  const unresolvedDependency = pending.pending_changes.filter(
    (entry) =>
      entry.status === "verified" &&
      entry.dependencies.some(
        (dependencyId) =>
          !pending.pending_changes.some(
            (candidate) => candidate.id === dependencyId && candidate.status === "applied"
          )
      )
  )

  let applyAttempt: { applied: boolean; reason?: string } | null = null
  if (pendingChangeId) {
    applyAttempt = await applyVerifiedPendingChange(directory, pendingChangeId)
  }

  return toSuccessOutput("Context doctor diagnostics", state?.session.id, {
    files: {
      pendingChangesFile: paths.graphPendingChanges,
      verificationLedgerFile: paths.graphVerificationLedger,
    },
    firstTurnConfirmed: state?.first_turn_confirmation.confirmed ?? false,
    unresolvedDependencyCount: unresolvedDependency.length,
    unverifiedPendingChanges: pending.pending_changes.filter((entry) => entry.status === "queued").length,
    verificationLedgerRecords: ledger.records.length,
    applyAttempt,
  })
}

async function handleResume(directory: string): Promise<string> {
  const stateManager = createStateManager(directory)
  const state = await stateManager.load()
  if (!state) {
    return toErrorOutput("No active state found.")
  }

  const pendingItems = state.offtrack_todo_pending
    .filter((item) => item.status === "pending")
    .map((item) => item.content)
    .slice(0, 5)

  return toSuccessOutput("Context resume packet", state.session.id, {
    trajectory: state.hierarchy.trajectory,
    tactic: state.hierarchy.tactic,
    action: state.hierarchy.action,
    firstTurnConfirmed: state.first_turn_confirmation.confirmed,
    selectedOutputStyle: state.selected_output_style_v29,
    offtrackTodoPendingPreview: pendingItems,
    memoryGovernance: state.memory_governance,
  })
}
