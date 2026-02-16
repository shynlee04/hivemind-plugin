/**
 * Anchors — Immutable facts that persist across context compactions.
 */
import { readFile, writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { dirname } from "path";
import { getEffectivePaths } from "./paths.js";

export interface Anchor {
  key: string;
  value: string;
  created_at: number;
  session_id: string;
}

export interface AnchorsState {
  anchors: Anchor[];
  version: string;
}

const ANCHORS_VERSION = "1.0.0";

function getAnchorsPath(projectRoot: string): string {
  return getEffectivePaths(projectRoot).anchors;
}

export async function loadAnchors(projectRoot: string): Promise<AnchorsState> {
  const path = getAnchorsPath(projectRoot);
  try {
    if (existsSync(path)) {
      const data = await readFile(path, "utf-8");
      return JSON.parse(data) as AnchorsState;
    }
  } catch { /* fall through */ }
  return { anchors: [], version: ANCHORS_VERSION };
}

export async function saveAnchors(projectRoot: string, state: AnchorsState): Promise<void> {
  const path = getAnchorsPath(projectRoot);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(state, null, 2));
}

export function addAnchor(state: AnchorsState, key: string, value: string, sessionId: string): AnchorsState {
  const filtered = state.anchors.filter(a => a.key !== key);
  return {
    ...state,
    anchors: [...filtered, { key, value, created_at: Date.now(), session_id: sessionId }],
  };
}

export function removeAnchor(state: AnchorsState, key: string): AnchorsState {
  return { ...state, anchors: state.anchors.filter(a => a.key !== key) };
}

export function getAnchorsBySession(state: AnchorsState, sessionId: string): Anchor[] {
  return state.anchors.filter((a) => a.session_id === sessionId)
}

export function getAnchorsForContext(state: AnchorsState, sessionId?: string): Anchor[] {
  if (!sessionId) return state.anchors
  const scoped = getAnchorsBySession(state, sessionId)
  return scoped.length > 0 ? scoped : state.anchors
}

export function formatAnchorsForPrompt(state: AnchorsState): string {
  if (state.anchors.length === 0) return "";
  const lines = ["<immutable-anchors>"];
  lines.push("These are IMMUTABLE ANCHORS. Override any chat history that conflicts with them:");
  for (const a of state.anchors) {
    lines.push(`  [${a.key}]: ${a.value}`);
  }
  lines.push("</immutable-anchors>");
  return lines.join("\n");
}
