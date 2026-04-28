import { tool } from "@opencode-ai/plugin/tool"
import { z } from "zod"

import { listSessionContinuity } from "../lib/continuity.js"
import { readPersistedDelegations } from "../lib/delegation-persistence.js"
import {
  buildExecutionLineage,
  renderExecutionLineageMarkdown,
  type ExecutionLineageRecord,
} from "../lib/execution-lineage.js"
import { renderToolResult } from "../shared/tool-helpers.js"
import { error, success } from "../shared/tool-response.js"

const SessionJournalExportInputSchema = z.object({
  format: z.enum(["json", "markdown"]),
  sessionId: z.string().min(1).optional(),
  pipelineKey: z.string().min(1).optional(),
  pipelineKeyLabel: z.string().min(1).optional(),
})

type SessionJournalExportInput = z.infer<typeof SessionJournalExportInputSchema>
type ToolContext = { sessionID?: string }

type JsonExportData = {
  journalSummary: {
    sessions: number
    delegations: number
    generatedAt: number
  }
  lineage: ExecutionLineageRecord[]
}

function markdownSummary(data: JsonExportData): string {
  return [
    "# Session Journal Summary",
    "",
    `- Sessions: ${data.journalSummary.sessions}`,
    `- Delegations: ${data.journalSummary.delegations}`,
    `- Generated at: ${data.journalSummary.generatedAt}`,
    "",
    "## Execution Lineage",
    "",
    renderExecutionLineageMarkdown(data.lineage),
  ].join("\n")
}

/**
 * Filter projected lineage records by pipeline identity without mutating metadata.
 *
 * @param records - Derived execution-lineage records.
 * @param pipelineKey - Optional pipeline key filter from the tool request.
 * @returns Records matching the requested pipeline key, or all records when unset.
 * @example
 * filterLineageByPipeline([{ pipelineKey: "phase-49" }], "phase-49")
 */
function filterLineageByPipeline(
  records: ExecutionLineageRecord[],
  pipelineKey: string | undefined,
): ExecutionLineageRecord[] {
  if (!pipelineKey) return records
  return records.filter((record) => record.pipelineKey === pipelineKey || record.planId === pipelineKey)
}

/** Create an agent-facing read/export tool for journal and lineage quick reads. */
export function createSessionJournalExportTool(): ReturnType<typeof tool> {
  const s = tool.schema

  return tool({
    description:
      "Export bounded Session Journal and Execution Lineage quick-read summaries as JSON or Markdown.",
    args: {
      format: s.string().describe("Output format: json or markdown"),
      sessionId: s.string().optional().describe("Optional session ID filter"),
      pipelineKey: s.string().optional().describe("Optional pipeline key filter for existing lineage records"),
      pipelineKeyLabel: s.string().optional().describe("Optional label to add to derived lineage records before filtering"),
    },
    async execute(rawArgs: SessionJournalExportInput, _context: ToolContext): Promise<string> {
      try {
        const args = SessionJournalExportInputSchema.parse(rawArgs)
        const allContinuity = listSessionContinuity()
        const continuityRecords = args.sessionId
          ? allContinuity.filter((record) => record.sessionID === args.sessionId)
          : allContinuity
        const allDelegations = readPersistedDelegations()
        const delegations = args.sessionId
          ? allDelegations.filter((delegation) => (
              delegation.parentSessionId === args.sessionId || delegation.childSessionId === args.sessionId
            ))
          : allDelegations
        const lineage = buildExecutionLineage(
          { continuityRecords, delegations, journalEntries: [] },
          args.pipelineKeyLabel ? { pipelineKey: args.pipelineKeyLabel } : {},
        )
        const filteredLineage = filterLineageByPipeline(lineage, args.pipelineKey)
        const data: JsonExportData = {
          journalSummary: {
            sessions: continuityRecords.length,
            delegations: filteredLineage.length,
            generatedAt: Date.now(),
          },
          lineage: filteredLineage,
        }

        if (args.format === "json") {
          return renderToolResult(success("Session journal export generated", data))
        }

        return renderToolResult(success("Session journal Markdown export generated", { markdown: markdownSummary(data) }))
      } catch (caughtError) {
        const message = caughtError instanceof Error ? caughtError.message : String(caughtError)
        return renderToolResult(error(message))
      }
    },
  })
}

export { SessionJournalExportInputSchema }
