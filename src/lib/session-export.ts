/**
 * Session Export — Pure functions for generating exportable session data.
 */
import { readFile, rm, writeFile } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"
import type { BrainState } from "../schemas/brain-state.js"
import { getEffectivePaths } from "./paths.js"

/**
 * Check if a session file exists.
 */
export async function sessionExists(directory: string, sessionId: string): Promise<boolean> {
  const sessionsDir = getEffectivePaths(directory).sessionsDir
  const sessionPath = join(sessionsDir, `session-${sessionId}.json`)
  return existsSync(sessionPath)
}

/**
 * Load a session from the sessions directory.
 */
export async function loadSession(
  directory: string,
  sessionId: string
): Promise<BrainState | null> {
  const sessionsDir = getEffectivePaths(directory).sessionsDir
  const sessionPath = join(sessionsDir, `session-${sessionId}.json`)
  
  try {
    const content = await readFile(sessionPath, "utf-8")
    return JSON.parse(content) as BrainState
  } catch {
    return null
  }
}

/**
 * Delete a session from the sessions directory.
 */
export async function pruneSession(directory: string, sessionId: string): Promise<void> {
  const sessionsDir = getEffectivePaths(directory).sessionsDir
  const sessionPath = join(sessionsDir, `session-${sessionId}.json`)
  
  try {
    await rm(sessionPath, { force: true })
  } catch {
    // Ignore errors
  }
}

/**
 * Export a session to the sessions directory.
 */
export async function exportSession(
  directory: string,
  sessionId: string
): Promise<string> {
  const { createStateManager } = await import("./persistence.js")
  const stateManager = createStateManager(directory)
  const state = await stateManager.load()
  
  if (!state) {
    throw new Error("No active session to export")
  }
  
  const sessionsDir = getEffectivePaths(directory).sessionsDir
  
  // Ensure sessions directory exists
  const { mkdir } = await import("fs/promises")
  await mkdir(sessionsDir, { recursive: true })
  
  const exportPath = join(sessionsDir, `session-${sessionId}.json`)
  await writeFile(exportPath, JSON.stringify(state, null, 2), "utf-8")
  
  return exportPath
}

export interface SessionExportData {
  id: string;
  date: string;
  mode: string;
  meta_key: string;
  role: string;
  by_ai: boolean;
  started: string;
  archived: string;
  turns: number;
  drift_score: number;
  files_touched: string[];
  context_updates: number;
  /** Tool usage pattern from this session */
  tool_type_counts: { read: number; write: number; query: number; governance: number };
  /** Governance escalation counters */
  governance_counters: {
    drift: number;
    compaction: number;
  };
  /** Captured subagent cycle results */
  cycle_log: Array<{
    timestamp: number;
    tool: string;
    failure_detected: boolean;
    failure_keywords: string[];
  }>;
  /** Framework selection state */
  framework_selection: {
    choice: string | null;
    active_phase: string;
  };
  /** Number of compactions in this session */
  compaction_count: number;
  hierarchy: {
    trajectory: string;
    tactic: string;
    action: string;
  };
  summary: string;
}

export function generateExportData(
  state: BrainState,
  summary: string
): SessionExportData {
  return {
    id: state.session.id,
    date: state.session.date,
    mode: state.session.mode,
    meta_key: state.session.meta_key,
    role: state.session.role,
    by_ai: state.session.by_ai,
    started: new Date(state.session.start_time).toISOString(),
    archived: new Date().toISOString(),
    turns: state.metrics.turn_count,
    drift_score: state.metrics.drift_score,
    files_touched: state.metrics.files_touched,
    context_updates: state.metrics.context_updates,
    tool_type_counts: state.metrics.tool_type_counts,
    governance_counters: {
      drift: state.metrics.governance_counters.drift,
      compaction: state.metrics.governance_counters.compaction,
    },
    cycle_log: (state.cycle_log ?? []).map(entry => ({
      timestamp: entry.timestamp,
      tool: entry.tool,
      failure_detected: entry.failure_detected,
      failure_keywords: [...entry.failure_keywords],
    })),
    framework_selection: {
      choice: state.framework_selection.choice,
      active_phase: state.framework_selection.active_phase,
    },
    compaction_count: state.compaction_count ?? 0,
    hierarchy: { ...state.hierarchy },
    summary,
  };
}

export function generateJsonExport(data: SessionExportData): string {
  return JSON.stringify(data, null, 2);
}

export function generateMarkdownExport(
  data: SessionExportData,
  sessionBody: string
): string {
  const lines: string[] = [];
  lines.push(`# Session Export: ${data.id}`);
  lines.push("");
  lines.push("## Metadata");
  lines.push(`| Field | Value |`);
  lines.push(`|-------|-------|`);
  lines.push(`| ID | ${data.id} |`);
  lines.push(`| Date | ${data.date} |`);
  lines.push(`| Mode | ${data.mode} |`);
  lines.push(`| Role | ${data.role || "(none)"} |`);
  lines.push(`| Meta Key | ${data.meta_key || "(none)"} |`);
  lines.push(`| By AI | ${data.by_ai} |`);
  lines.push(`| Started | ${data.started} |`);
  lines.push(`| Archived | ${data.archived} |`);
  lines.push("");
  lines.push("## Metrics");
  lines.push(`- **Turns**: ${data.turns}`);
  lines.push(`- **Drift Score**: ${data.drift_score}/100`);
  lines.push(`- **Files Touched**: ${data.files_touched.length}`);
  lines.push(`- **Context Updates**: ${data.context_updates}`);
  lines.push("");
  lines.push("## Tool Usage");
  lines.push(`- Read: ${data.tool_type_counts.read}`);
  lines.push(`- Write: ${data.tool_type_counts.write}`);
  lines.push(`- Query: ${data.tool_type_counts.query}`);
  lines.push(`- Governance: ${data.tool_type_counts.governance}`);
  lines.push("");
  lines.push("## Governance");
  lines.push(`- Drift: ${data.governance_counters.drift}`);
  lines.push(`- Compaction: ${data.governance_counters.compaction}`);
  lines.push("");
  lines.push("## Compaction");
  lines.push(`- Count: ${data.compaction_count}`);
  lines.push("");
  lines.push("## Cycle Log");
  if (data.cycle_log.length > 0) {
    data.cycle_log.forEach(entry => {
      const keywordSummary = entry.failure_keywords.length > 0
        ? ` keywords=${entry.failure_keywords.join(",")}`
        : "";
      lines.push(
        `- ${new Date(entry.timestamp).toISOString()} | ${entry.tool} | failure=${entry.failure_detected}${keywordSummary}`
      );
    });
  } else {
    lines.push("- (none)");
  }
  lines.push("");
  lines.push("## Hierarchy");
  if (data.hierarchy.trajectory) lines.push(`- **Trajectory**: ${data.hierarchy.trajectory}`);
  if (data.hierarchy.tactic) lines.push(`- **Tactic**: ${data.hierarchy.tactic}`);
  if (data.hierarchy.action) lines.push(`- **Action**: ${data.hierarchy.action}`);
  lines.push("");
  if (data.files_touched.length > 0) {
    lines.push("## Files Touched");
    data.files_touched.forEach(f => lines.push(`- ${f}`));
    lines.push("");
  }
  lines.push("## Summary");
  lines.push(data.summary);
  lines.push("");
  lines.push("## Session Content");
  lines.push(sessionBody);
  return lines.join("\n");
}
