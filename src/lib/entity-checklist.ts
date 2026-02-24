import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";

import { EntityChecklistSchema } from "../schemas/governance-constitution.js";
import type {
  EntityChecklist,
  EntityChecklistItem,
} from "../schemas/governance-constitution.js";
import { getEffectivePaths } from "./paths.js";

type ChecklistKey = EntityChecklistItem["key"];
type ChecklistStatus = EntityChecklistItem["status"];

const CHECKLIST_ORDER: ChecklistKey[] = [
  "hivemind_config",
  "planning_sot",
  "hierarchy_chain",
  "anchors_presence",
  "mems_presence",
  "active_action",
  "state_validation_ready",
];

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function toErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim() !== "") {
    return error.message;
  }
  return "unknown error";
}

function makeChecklistItem(
  key: ChecklistKey,
  status: ChecklistStatus,
  message: string,
  evidenceRef: string,
): EntityChecklistItem {
  return {
    key,
    required: true,
    status,
    message,
    evidence_ref: evidenceRef,
  };
}

async function readJsonSafe(filePath: string): Promise<
  | { ok: true; data: unknown }
  | { ok: false; message: string }
> {
  try {
    const raw = await readFile(filePath, "utf-8");
    return { ok: true, data: JSON.parse(raw) };
  } catch (error) {
    return { ok: false, message: toErrorMessage(error) };
  }
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim() !== "";
}

function countFromArrayField(data: unknown, key: string): number | null {
  if (Array.isArray(data)) {
    return data.length;
  }

  if (data && typeof data === "object") {
    const value = (data as Record<string, unknown>)[key];
    if (Array.isArray(value)) {
      return value.length;
    }
  }

  return null;
}

function evidenceRefForKey(
  key: ChecklistKey,
  paths: ReturnType<typeof getEffectivePaths>,
): string {
  switch (key) {
    case "hivemind_config":
      return paths.config;
    case "planning_sot":
      return paths.plansManifest;
    case "hierarchy_chain":
      return paths.hierarchy;
    case "anchors_presence":
      return paths.anchors;
    case "mems_presence":
      return paths.mems;
    case "active_action":
      return paths.brain;
    case "state_validation_ready":
      return `${paths.brain} | ${paths.hierarchy} | ${paths.anchors}`;
  }
}

async function evaluateHivemindConfig(
  path: string,
): Promise<EntityChecklistItem> {
  const key: ChecklistKey = "hivemind_config";
  if (!existsSync(path)) {
    return makeChecklistItem(key, "fail", "config.json not found.", path);
  }

  const parsed = await readJsonSafe(path);
  if (parsed.ok) {
    return makeChecklistItem(key, "pass", "config.json exists and is valid JSON.", path);
  }

  return makeChecklistItem(
    key,
    "warn",
    `config.json exists but is invalid JSON (${parsed.message}).`,
    path,
  );
}

function evaluatePlanningSot(path: string): EntityChecklistItem {
  const key: ChecklistKey = "planning_sot";
  if (existsSync(path)) {
    return makeChecklistItem(key, "pass", "plans/manifest.json exists.", path);
  }
  return makeChecklistItem(key, "fail", "plans/manifest.json not found.", path);
}

async function evaluateHierarchyChain(path: string): Promise<EntityChecklistItem> {
  const key: ChecklistKey = "hierarchy_chain";
  if (!existsSync(path)) {
    return makeChecklistItem(key, "fail", "hierarchy.json not found.", path);
  }

  const parsed = await readJsonSafe(path);
  if (!parsed.ok) {
    return makeChecklistItem(
      key,
      "warn",
      `hierarchy.json exists but is invalid JSON (${parsed.message}).`,
      path,
    );
  }

  const nodes = (parsed.data as Record<string, unknown>).nodes;
  if (Array.isArray(nodes) && nodes.length > 0) {
    return makeChecklistItem(key, "pass", `hierarchy.json has ${nodes.length} node(s).`, path);
  }

  return makeChecklistItem(
    key,
    "warn",
    "hierarchy.json exists but nodes array is empty or missing.",
    path,
  );
}

async function evaluateAnchorsPresence(path: string): Promise<EntityChecklistItem> {
  const key: ChecklistKey = "anchors_presence";
  if (!existsSync(path)) {
    return makeChecklistItem(key, "fail", "anchors.json not found.", path);
  }

  const parsed = await readJsonSafe(path);
  if (!parsed.ok) {
    return makeChecklistItem(
      key,
      "warn",
      `anchors.json exists but is invalid JSON (${parsed.message}).`,
      path,
    );
  }

  const count = countFromArrayField(parsed.data, "anchors");
  if (count === null) {
    return makeChecklistItem(
      key,
      "warn",
      "anchors.json exists but anchors array is missing.",
      path,
    );
  }

  if (count > 0) {
    return makeChecklistItem(key, "pass", `anchors.json has ${count} anchor(s).`, path);
  }

  return makeChecklistItem(key, "warn", "anchors.json exists but has no anchors.", path);
}

async function evaluateMemsPresence(path: string): Promise<EntityChecklistItem> {
  const key: ChecklistKey = "mems_presence";
  if (!existsSync(path)) {
    return makeChecklistItem(key, "fail", "mems.json not found.", path);
  }

  const parsed = await readJsonSafe(path);
  if (!parsed.ok) {
    return makeChecklistItem(
      key,
      "warn",
      `mems.json exists but is invalid JSON (${parsed.message}).`,
      path,
    );
  }

  const count = countFromArrayField(parsed.data, "mems");
  if (count === null) {
    return makeChecklistItem(
      key,
      "warn",
      "mems.json exists but mems array is missing.",
      path,
    );
  }

  if (count > 0) {
    return makeChecklistItem(key, "pass", `mems.json has ${count} mem(s).`, path);
  }

  return makeChecklistItem(key, "warn", "mems.json exists but has no mems.", path);
}

async function evaluateActiveAction(path: string): Promise<EntityChecklistItem> {
  const key: ChecklistKey = "active_action";
  if (!existsSync(path)) {
    return makeChecklistItem(key, "fail", "brain.json not found.", path);
  }

  const parsed = await readJsonSafe(path);
  if (!parsed.ok) {
    return makeChecklistItem(
      key,
      "warn",
      `brain.json exists but is invalid JSON (${parsed.message}).`,
      path,
    );
  }

  const brain = parsed.data as Record<string, unknown>;
  const sessionId = brain.session_id;
  if (isNonEmptyString(sessionId)) {
    return makeChecklistItem(key, "pass", "brain.json has session_id.", path);
  }

  const nestedSessionId =
    brain.session && typeof brain.session === "object"
      ? (brain.session as Record<string, unknown>).id
      : undefined;
  if (isNonEmptyString(nestedSessionId)) {
    return makeChecklistItem(key, "pass", "brain.json has session.id.", path);
  }

  return makeChecklistItem(
    key,
    "warn",
    "brain.json exists but session_id is missing.",
    path,
  );
}

function evaluateStateValidationReady(
  brainPath: string,
  hierarchyPath: string,
  anchorsPath: string,
): EntityChecklistItem {
  const key: ChecklistKey = "state_validation_ready";
  const found = [brainPath, hierarchyPath, anchorsPath].filter((filePath) => existsSync(filePath));

  if (found.length === 3) {
    return makeChecklistItem(
      key,
      "pass",
      "brain.json, hierarchy.json, and anchors.json all exist.",
      `${brainPath} | ${hierarchyPath} | ${anchorsPath}`,
    );
  }

  if (found.length === 0) {
    return makeChecklistItem(
      key,
      "fail",
      "No required state files found (brain, hierarchy, anchors).",
      `${brainPath} | ${hierarchyPath} | ${anchorsPath}`,
    );
  }

  return makeChecklistItem(
    key,
    "warn",
    `Only ${found.length}/3 required state files found (brain, hierarchy, anchors).`,
    `${brainPath} | ${hierarchyPath} | ${anchorsPath}`,
  );
}

function buildChecklistResult(
  sessionId: string,
  turnId: string,
  items: EntityChecklistItem[],
): EntityChecklist {
  const passed = !items.some((item) => item.required && item.status === "fail");
  const normalizedSessionId = UUID_RE.test(sessionId) ? sessionId : randomUUID();
  const normalizedTurnId = turnId.trim() === "" ? "unknown-turn" : turnId;

  return EntityChecklistSchema.parse({
    id: randomUUID(),
    session_id: normalizedSessionId,
    turn_id: normalizedTurnId,
    items,
    passed,
    generated_at: new Date().toISOString(),
  });
}

export async function evaluateEntityChecklist(
  projectRoot: string,
  sessionId: string,
  turnId: string,
): Promise<EntityChecklist> {
  const paths = getEffectivePaths(projectRoot);

  try {
    const items: EntityChecklistItem[] = [];

    items.push(await evaluateHivemindConfig(paths.config));
    items.push(evaluatePlanningSot(paths.plansManifest));
    items.push(await evaluateHierarchyChain(paths.hierarchy));
    items.push(await evaluateAnchorsPresence(paths.anchors));
    items.push(await evaluateMemsPresence(paths.mems));
    items.push(await evaluateActiveAction(paths.brain));
    items.push(evaluateStateValidationReady(paths.brain, paths.hierarchy, paths.anchors));

    const orderedItems = CHECKLIST_ORDER.map((key) => {
      const item = items.find((entry) => entry.key === key);
      if (item) {
        return item;
      }
      return makeChecklistItem(
        key,
        "fail",
        "Checklist item evaluation missing due to internal error.",
        evidenceRefForKey(key, paths),
      );
    });

    return buildChecklistResult(sessionId, turnId, orderedItems);
  } catch (error) {
    const message = `Checklist evaluator error: ${toErrorMessage(error)}.`;
    const fallbackItems = CHECKLIST_ORDER.map((key) =>
      makeChecklistItem(key, "fail", message, evidenceRefForKey(key, paths)),
    );
    return buildChecklistResult(sessionId, turnId, fallbackItems);
  }
}

export function renderChecklistSummary(checklist: EntityChecklist): string {
  const total = checklist.items.length;
  const passCount = checklist.items.filter((item) => item.status === "pass").length;
  const warnCount = checklist.items.filter((item) => item.status === "warn").length;
  const failItems = checklist.items.filter((item) => item.status === "fail");
  const failCount = failItems.length;

  if (failCount === 0 && warnCount === 0 && passCount === total) {
    return `[CHECKLIST] ${passCount}/${total} pass | OK`;
  }

  const header = `[CHECKLIST] ${passCount}/${total} pass, ${warnCount} warn, ${failCount} fail`;

  if (failCount > 0) {
    const details = failItems
      .map((item) => `${item.key} (${item.message})`)
      .join("; ");
    return `${header} | FAILED: ${details}`;
  }

  return `${header} | OK_WITH_WARNINGS`;
}
