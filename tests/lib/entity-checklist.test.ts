import { randomUUID } from "node:crypto";
import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import {
  evaluateEntityChecklist,
  renderChecklistSummary,
} from "../../src/lib/entity-checklist.js";
import { getEffectivePaths } from "../../src/lib/paths.js";
import type { EntityChecklist, EntityChecklistItem } from "../../src/schemas/governance-constitution.js";

const CHECKLIST_KEYS: EntityChecklistItem["key"][] = [
  "hivemind_config",
  "planning_sot",
  "hierarchy_chain",
  "anchors_presence",
  "mems_presence",
  "active_action",
  "state_validation_ready",
];

const tempDirs: string[] = [];

async function makeTempProject(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), "hm-entity-checklist-"));
  tempDirs.push(dir);
  return dir;
}

async function writeText(path: string, content: string): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, content);
}

async function writeJson(path: string, value: unknown): Promise<void> {
  await writeText(path, JSON.stringify(value, null, 2));
}

function makeChecklist(
  statuses: Partial<Record<EntityChecklistItem["key"], EntityChecklistItem["status"]>>,
  messages: Partial<Record<EntityChecklistItem["key"], string>> = {},
): EntityChecklist {
  const items: EntityChecklistItem[] = CHECKLIST_KEYS.map((key) => ({
    key,
    required: true,
    status: statuses[key] ?? "pass",
    message: messages[key] ?? `${key} ok`,
    evidence_ref: `/tmp/${key}.json`,
  }));

  return {
    id: randomUUID(),
    session_id: randomUUID(),
    turn_id: "turn-1",
    items,
    passed: !items.some((item) => item.required && item.status === "fail"),
    generated_at: new Date().toISOString(),
  };
}

afterEach(async () => {
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop();
    if (dir) {
      await rm(dir, { recursive: true, force: true });
    }
  }
});

describe("entity checklist evaluator", () => {
  it("evaluateEntityChecklist returns valid EntityChecklist when all files exist", async () => {
    const projectRoot = await makeTempProject();
    const paths = getEffectivePaths(projectRoot);

    await writeJson(paths.config, { governance_mode: "strict" });
    await writeJson(paths.plansManifest, { plans: [], version: "1.0.0" });
    await writeJson(paths.hierarchy, { nodes: [{ id: "node-1" }] });
    await writeJson(paths.anchors, { anchors: [{ key: "k", value: "v" }] });
    await writeJson(paths.mems, { mems: [{ id: "mem-1" }] });
    await writeJson(paths.brain, { session_id: randomUUID() });

    const result = await evaluateEntityChecklist(projectRoot, randomUUID(), "turn-1");

    assert.equal(result.items.length, 7);
    assert.equal(result.items.every((item) => item.status === "pass"), true);
    assert.equal(result.passed, true);
  });

  it("evaluateEntityChecklist returns fail items when files are missing", async () => {
    const projectRoot = await makeTempProject();

    const result = await evaluateEntityChecklist(projectRoot, randomUUID(), "turn-2");
    const failCount = result.items.filter((item) => item.status === "fail").length;

    assert.equal(failCount, 7);
    assert.equal(result.passed, false);
  });

  it("evaluateEntityChecklist never throws with corrupt or missing files", async () => {
    const projectRoot = await makeTempProject();
    const paths = getEffectivePaths(projectRoot);

    await writeText(paths.config, "{invalid");
    await writeText(paths.hierarchy, "{bad json");
    await writeText(paths.anchors, "{bad json");
    await writeText(paths.brain, "{bad json");

    await assert.doesNotReject(async () => {
      await evaluateEntityChecklist(projectRoot, randomUUID(), "turn-3");
    });
  });

  it("renderChecklistSummary formats all-pass case", () => {
    const checklist = makeChecklist({});
    const summary = renderChecklistSummary(checklist);

    assert.equal(summary, "[CHECKLIST] 7/7 pass | OK");
  });

  it("renderChecklistSummary formats mixed pass/warn/fail case", () => {
    const checklist = makeChecklist({
      anchors_presence: "warn",
      mems_presence: "fail",
    });

    const summary = renderChecklistSummary(checklist);

    assert.ok(summary.startsWith("[CHECKLIST] 5/7 pass, 1 warn, 1 fail"));
  });

  it("renderChecklistSummary includes failed keys in output", () => {
    const checklist = makeChecklist(
      {
        mems_presence: "fail",
        active_action: "fail",
      },
      {
        mems_presence: "no mems found",
        active_action: "no active action",
      },
    );

    const summary = renderChecklistSummary(checklist);

    assert.match(summary, /FAILED: .*mems_presence \(no mems found\)/);
    assert.match(summary, /active_action \(no active action\)/);
  });

  it("result passed is false when any required item is fail", async () => {
    const projectRoot = await makeTempProject();
    const paths = getEffectivePaths(projectRoot);

    await writeJson(paths.config, { valid: true });
    await writeJson(paths.plansManifest, { plans: [] });
    await writeJson(paths.hierarchy, { nodes: [{ id: "node-1" }] });
    await writeJson(paths.anchors, { anchors: [{ key: "k", value: "v" }] });
    await writeJson(paths.brain, { session_id: randomUUID() });
    // mems.json intentionally missing => fail

    const result = await evaluateEntityChecklist(projectRoot, randomUUID(), "turn-4");

    assert.equal(result.items.find((item) => item.key === "mems_presence")?.status, "fail");
    assert.equal(result.passed, false);
  });

  it("result passed is true when items are only pass or warn", async () => {
    const projectRoot = await makeTempProject();
    const paths = getEffectivePaths(projectRoot);

    await writeText(paths.config, "{invalid"); // warn
    await writeJson(paths.plansManifest, { plans: [] });
    await writeJson(paths.hierarchy, { nodes: [{ id: "node-1" }] });
    await writeJson(paths.anchors, { anchors: [{ key: "k", value: "v" }] });
    await writeJson(paths.mems, { mems: [] }); // warn
    await writeJson(paths.brain, { session_id: randomUUID() });

    const result = await evaluateEntityChecklist(projectRoot, randomUUID(), "turn-5");
    const failCount = result.items.filter((item) => item.status === "fail").length;
    const warnCount = result.items.filter((item) => item.status === "warn").length;

    assert.equal(failCount, 0);
    assert.ok(warnCount > 0);
    assert.equal(result.passed, true);
  });
});
