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
  hierarchy: {
    trajectory: string;
    tactic: string;
    action: string;
  };
  ratings: Array<{ score: number; reason?: string; turn_number: number }>;
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
    hierarchy: { ...state.hierarchy },
    ratings: state.metrics.ratings.map(r => ({
      score: r.score,
      reason: r.reason,
      turn_number: r.turn_number,
    })),
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
  if (data.ratings.length > 0) {
    lines.push("## Self-Ratings");
    data.ratings.forEach(r =>
      lines.push(`- Turn ${r.turn_number}: ${r.score}/10${r.reason ? ` — ${r.reason}` : ""}`)
    );
    lines.push("");
  }
  lines.push("## Summary");
  lines.push(data.summary);
  lines.push("");
  lines.push("## Session Content");
  lines.push(sessionBody);
  return lines.join("\n");
}
