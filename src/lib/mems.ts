/**
 * Mems — Persistent memory layer (Mems Brain) for cross-session recall.
 */
import { readFile, writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { dirname } from "path";
import { getEffectivePaths } from "./paths.js";

// ─── Types ───────────────────────────────────────────────────────────

export type BuiltinShelf = "decisions" | "patterns" | "errors" | "solutions" | "context";

export interface Mem {
  id: string;
  shelf: string;
  content: string;
  tags: string[];
  session_id: string;
  created_at: number;
}

export interface MemsState {
  mems: Mem[];
  version: string;
}

export interface SearchMemsOptions {
  sessionId?: string;
  strictSession?: boolean;
  preferSession?: boolean;
  proximityTags?: string[];
  // P0-7 Fix 2: Time-bounded search parameters
  createdAfter?: number;  // Unix timestamp
  createdBefore?: number; // Unix timestamp
  linkedTaskId?: string;  // UUID filter
  limit?: number;         // Max results
  offset?: number;        // Pagination offset
}

// ─── Constants ───────────────────────────────────────────────────────

export const MEMS_VERSION = "1.0.0";
export const BUILTIN_SHELVES = ["decisions", "patterns", "errors", "solutions", "context"] as const;

// ─── Helpers ─────────────────────────────────────────────────────────

function getMemsPath(projectRoot: string): string {
  return getEffectivePaths(projectRoot).mems;
}

export function generateMemId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 6).padEnd(4, "0");
  return `mem_${timestamp}_${random}`;
}

// ─── IO Wrappers ─────────────────────────────────────────────────────

export async function loadMems(projectRoot: string): Promise<MemsState> {
  const path = getMemsPath(projectRoot);
  try {
    if (existsSync(path)) {
      const data = await readFile(path, "utf-8");
      return JSON.parse(data) as MemsState;
    }
  } catch { /* fall through */ }
  return { mems: [], version: MEMS_VERSION };
}

export async function saveMems(projectRoot: string, state: MemsState): Promise<void> {
  const path = getMemsPath(projectRoot);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(state, null, 2));
}

// ─── Pure Functions ──────────────────────────────────────────────────

export function addMem(state: MemsState, shelf: string, content: string, tags: string[], sessionId: string): MemsState {
  const mem: Mem = {
    id: generateMemId(),
    shelf,
    content,
    tags,
    session_id: sessionId,
    created_at: Date.now(),
  };
  return { ...state, mems: [...state.mems, mem] };
}

export function removeMem(state: MemsState, memId: string): MemsState {
  return { ...state, mems: state.mems.filter(m => m.id !== memId) };
}

function scoreMem(
  mem: Mem,
  options?: SearchMemsOptions,
): number {
  if (!options) return 0;

  let score = 0;
  if (options.sessionId) {
    if (mem.session_id === options.sessionId) score += 100;
    else if (options.strictSession) score -= 1000;
  }

  if (options.proximityTags && options.proximityTags.length > 0) {
    for (const tag of options.proximityTags) {
      if (mem.tags.includes(tag)) score += 20;
    }
  }

  if (options.preferSession && options.sessionId && mem.session_id === options.sessionId) {
    score += 25;
  }

  return score;
}

export function searchMems(
  state: MemsState,
  query: string,
  shelf?: string,
  options?: SearchMemsOptions,
): Mem[] {
  const q = query.toLowerCase();
  let results = state.mems
    .filter(m => {
      if (shelf && m.shelf !== shelf) return false;
      if (options?.strictSession && options.sessionId && m.session_id !== options.sessionId) return false;
      // P0-7 Fix 2: Time-bounded filtering
      if (options?.createdAfter && m.created_at < options.createdAfter) return false;
      if (options?.createdBefore && m.created_at > options.createdBefore) return false;
      const contentMatch = m.content.toLowerCase().includes(q);
      const tagMatch = m.tags.some(t => t.toLowerCase().includes(q));
      return contentMatch || tagMatch;
    })
    .sort((a, b) => {
      const scoreDelta = scoreMem(b, options) - scoreMem(a, options);
      if (scoreDelta !== 0) return scoreDelta;
      return b.created_at - a.created_at;
    });

  // P0-7 Fix 2: Apply pagination
  const offset = options?.offset ?? 0;
  const limit = options?.limit ?? 0; // 0 means no limit
  if (limit > 0) {
    results = results.slice(offset, offset + limit);
  } else if (offset > 0) {
    results = results.slice(offset);
  }

  return results;
}

export function getMemsByShelf(state: MemsState, shelf: string): Mem[] {
  return state.mems
    .filter(m => m.shelf === shelf)
    .sort((a, b) => b.created_at - a.created_at);
}

export function getShelfSummary(state: MemsState): Record<string, number> {
  const summary: Record<string, number> = {};
  for (const m of state.mems) {
    summary[m.shelf] = (summary[m.shelf] || 0) + 1;
  }
  return summary;
}

export function formatMemsForPrompt(state: MemsState): string {
  if (state.mems.length === 0) return "";
  const summary = getShelfSummary(state);
  const breakdown = Object.entries(summary)
    .map(([shelf, count]) => `${shelf}(${count})`)
    .join(", ");
  return `🧠 Mems Brain: ${state.mems.length} memories [${breakdown}]. Use recall_mems to search.`;
}
