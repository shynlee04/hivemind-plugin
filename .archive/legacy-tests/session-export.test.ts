/**
 * Session Export Tests
 *
 * Tests the session export pure functions
 */

import {
  generateExportData,
  generateJsonExport,
  generateMarkdownExport,
  type SessionExportData,
} from "../src/lib/session-export.js";
import {
  createBrainState,
  addFileTouched,
  updateHierarchy,
} from "../src/schemas/brain-state.js";
import { createConfig } from "../src/schemas/config.js";

// ─── Harness ─────────────────────────────────────────────────────────

let passed = 0;
let failed_ = 0;
function assert(cond: boolean, name: string) {
  if (cond) {
    passed++;
    process.stderr.write(`  PASS: ${name}\n`);
  } else {
    failed_++;
    process.stderr.write(`  FAIL: ${name}\n`);
  }
}

function makeState() {
  const config = createConfig({ governance_mode: "assisted" });
  let state = createBrainState("test-session-123", config, "plan_driven");
  state = updateHierarchy(state, {
    trajectory: "Build auth system",
    tactic: "JWT validation",
    action: "Write middleware",
  });
  state = addFileTouched(state, "src/auth.ts");
  state = addFileTouched(state, "src/middleware.ts");
  state.metrics.turn_count = 12;
  return state;
}

// ─── Tests ───────────────────────────────────────────────────────────

async function test_generateExportData() {
  process.stderr.write("\n--- session-export: generateExportData ---\n");

  const state = makeState();
  const data = generateExportData(state, "Completed auth system");

  assert(data.id === "test-session-123", "id matches session id");
  assert(data.mode === "plan_driven", "mode matches session mode");
  assert(data.date === state.session.date, "date matches session date");
  assert(data.meta_key === "", "meta_key defaults to empty");
  assert(data.role === "", "role defaults to empty");
  assert(data.by_ai === true, "by_ai defaults to true");
  assert(data.turns === 12, "turns matches turn count");
  assert(data.files_touched.length === 2, "files_touched has 2 entries");
  assert(data.hierarchy.trajectory === "Build auth system", "trajectory preserved");
  assert(data.hierarchy.tactic === "JWT validation", "tactic preserved");
  assert(data.hierarchy.action === "Write middleware", "action preserved");
  assert(data.summary === "Completed auth system", "summary matches");
}

async function test_generateJsonExport() {
  process.stderr.write("\n--- session-export: generateJsonExport ---\n");

  const state = makeState();
  const data = generateExportData(state, "JSON export test");
  const json = generateJsonExport(data);

  const parsed = JSON.parse(json) as SessionExportData;
  assert(parsed.id === "test-session-123", "JSON parses with correct id");
  assert(parsed.summary === "JSON export test", "JSON parses with correct summary");
  assert(Array.isArray(parsed.files_touched), "files_touched is array in JSON");
  assert(parsed.hierarchy.trajectory === "Build auth system", "hierarchy in JSON");
}

async function test_generateMarkdownExport() {
  process.stderr.write("\n--- session-export: generateMarkdownExport ---\n");

  const state = makeState();
  const data = generateExportData(state, "Markdown export test");
  const md = generateMarkdownExport(data, "## Some session body content");

  assert(md.includes("# Session Export: test-session-123"), "markdown has title");
  assert(md.includes("## Metadata"), "markdown has metadata section");
  assert(md.includes("## Metrics"), "markdown has metrics section");
  assert(md.includes("## Hierarchy"), "markdown has hierarchy section");
  assert(md.includes("**Trajectory**: Build auth system"), "markdown has trajectory");
  assert(md.includes("## Files Touched"), "markdown has files section");
  assert(md.includes("src/auth.ts"), "markdown lists files");
  assert(md.includes("## Summary"), "markdown has summary section");
  assert(md.includes("Markdown export test"), "markdown shows summary text");
  assert(md.includes("## Session Content"), "markdown has session content");
  assert(md.includes("## Some session body content"), "markdown includes session body");
}

// ─── Main ────────────────────────────────────────────────────────────

async function main() {
  process.stderr.write("=== Session Export Tests ===\n");

  await test_generateExportData();
  await test_generateJsonExport();
  await test_generateMarkdownExport();

  process.stderr.write(`\n=== Session Export: ${passed} passed, ${failed_} failed ===\n`);
  process.exit(failed_ > 0 ? 1 : 0);
}

main();
