/**
 * Auto-Hooks Pure Function Tests
 * Tests for staleness, chain-analysis, commit-advisor, tool-activation
 */

import {
  createBrainState,
  setLastCommitSuggestionTurn,
} from "../src/schemas/brain-state.js";
import { createConfig } from "../src/schemas/config.js";
import { isSessionStale, getStalenessInfo } from "../src/lib/staleness.js";
import { detectChainBreaks } from "../src/lib/chain-analysis.js";
import { shouldSuggestCommit } from "../src/lib/commit-advisor.js";
import { getToolActivation } from "../src/lib/tool-activation.js";

import type { BrainState } from "../src/schemas/brain-state.js";

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

// ─── Helpers ─────────────────────────────────────────────────────────

const MS_PER_DAY = 86_400_000;

function makeState(overrides?: {
  last_activity?: number;
  governance_status?: "LOCKED" | "OPEN";
  governance_mode?: "strict" | "assisted" | "permissive";
  trajectory?: string;
  tactic?: string;
  action?: string;
  files_touched?: string[];
  turn_count?: number;
  drift_score?: number;
  last_commit_suggestion_turn?: number;
}): BrainState {
  const config = createConfig({
    governance_mode: overrides?.governance_mode ?? "assisted",
  });
  const state = createBrainState("test-session", config);

  // Apply overrides
  const result: BrainState = {
    ...state,
    session: {
      ...state.session,
      last_activity: overrides?.last_activity ?? state.session.last_activity,
      governance_status: overrides?.governance_status ?? state.session.governance_status,
    },
    hierarchy: {
      trajectory: overrides?.trajectory ?? "",
      tactic: overrides?.tactic ?? "",
      action: overrides?.action ?? "",
    },
    metrics: {
      ...state.metrics,
      files_touched: overrides?.files_touched ?? [],
      turn_count: overrides?.turn_count ?? 0,
      drift_score: overrides?.drift_score ?? 100,
    },
    last_commit_suggestion_turn: overrides?.last_commit_suggestion_turn ?? 0,
  };

  return result;
}

// ─── Staleness Tests ─────────────────────────────────────────────────

function test_staleness() {
  process.stderr.write("\n--- staleness ---\n");

  const now = Date.now();

  // 1. Fresh state is not stale
  const fresh = makeState({ last_activity: now });
  assert(isSessionStale(fresh, 3, now) === false, "isSessionStale returns false for fresh state");

  // 2. State older than 3 days is stale
  const old = makeState({ last_activity: now - 4 * MS_PER_DAY });
  assert(isSessionStale(old, 3, now) === true, "isSessionStale returns true for state older than 3 days");

  // 3. State exactly at boundary is NOT stale (> not >=)
  const boundary = makeState({ last_activity: now - 3 * MS_PER_DAY });
  assert(isSessionStale(boundary, 3, now) === false, "isSessionStale returns false for state exactly at boundary");

  // 4. Custom maxDays
  const twoDay = makeState({ last_activity: now - 2.5 * MS_PER_DAY });
  assert(isSessionStale(twoDay, 2, now) === true, "isSessionStale with custom maxDays=2");

  // 5. maxDays=0 always returns false
  const veryOld = makeState({ last_activity: now - 100 * MS_PER_DAY });
  assert(isSessionStale(veryOld, 0, now) === false, "isSessionStale with maxDays=0 returns false");

  // 6. getStalenessInfo returns correct idleDays
  const threeDayOld = makeState({ last_activity: now - 3.5 * MS_PER_DAY });
  const info1 = getStalenessInfo(threeDayOld, 3, now);
  assert(info1.idleDays === 3, "getStalenessInfo returns correct idleDays");

  // 7. getStalenessInfo returns correct isStale
  assert(info1.isStale === true, "getStalenessInfo returns correct isStale");

  // 8. getStalenessInfo returns correct threshold
  assert(info1.threshold === 3, "getStalenessInfo returns correct threshold");
}

// ─── Chain Analysis Tests ────────────────────────────────────────────

function test_chain_analysis() {
  process.stderr.write("\n--- chain-analysis ---\n");

  // 1. Empty hierarchy + OPEN session → 1 break (empty_chain)
  const emptyOpen = makeState({ governance_status: "OPEN" });
  const breaks1 = detectChainBreaks(emptyOpen);
  assert(
    breaks1.length === 1 && breaks1[0].issue === "empty_chain",
    "empty hierarchy + OPEN session → 1 break (empty_chain)"
  );

  // 2. Empty hierarchy + LOCKED session → 0 breaks
  const emptyLocked = makeState({ governance_status: "LOCKED", governance_mode: "strict" });
  const breaks2 = detectChainBreaks(emptyLocked);
  assert(breaks2.length === 0, "empty hierarchy + LOCKED session → 0 breaks");

  // 3. Action without tactic → missing_parent break
  const actionOnly = makeState({ action: "Write tests" });
  const breaks3 = detectChainBreaks(actionOnly);
  assert(
    breaks3.some((b) => b.level === "action" && b.issue === "missing_parent"),
    "action without tactic → missing_parent break"
  );

  // 4. Tactic without trajectory → missing_parent break
  const tacticOnly = makeState({ tactic: "Implement JWT" });
  const breaks4 = detectChainBreaks(tacticOnly);
  assert(
    breaks4.some((b) => b.level === "tactic" && b.issue === "missing_parent"),
    "tactic without trajectory → missing_parent break"
  );

  // 5. Action + tactic but no trajectory → 1 break (tactic missing_parent)
  const tacticAction = makeState({ tactic: "Implement JWT", action: "Write tests" });
  const breaks5 = detectChainBreaks(tacticAction);
  assert(
    breaks5.length === 1 && breaks5[0].level === "tactic" && breaks5[0].issue === "missing_parent",
    "action + tactic but no trajectory → 1 break (tactic missing_parent)"
  );

  // 6. Full chain → 0 breaks
  const fullChain = makeState({
    trajectory: "Build auth",
    tactic: "Implement JWT",
    action: "Write tests",
  });
  const breaks6 = detectChainBreaks(fullChain);
  assert(breaks6.length === 0, "full chain → 0 breaks");

  // 7. Trajectory only → 0 breaks
  const trajOnly = makeState({ trajectory: "Build auth" });
  const breaks7 = detectChainBreaks(trajOnly);
  assert(breaks7.length === 0, "trajectory only → 0 breaks");

  // 8. Tactic + trajectory but no action → 0 breaks
  const tacticTraj = makeState({ trajectory: "Build auth", tactic: "Implement JWT" });
  const breaks8 = detectChainBreaks(tacticTraj);
  assert(breaks8.length === 0, "tactic + trajectory but no action → 0 breaks");
}

// ─── Commit Advisor Tests ────────────────────────────────────────────

function test_commit_advisor() {
  process.stderr.write("\n--- commit-advisor ---\n");

  // 1. Below threshold → null
  const belowThreshold = makeState({
    files_touched: ["a.ts", "b.ts"],
    turn_count: 10,
  });
  assert(
    shouldSuggestCommit(belowThreshold, 5) === null,
    "below threshold → null"
  );

  // 2. At threshold → suggestion
  const atThreshold = makeState({
    files_touched: ["a.ts", "b.ts", "c.ts", "d.ts", "e.ts"],
    turn_count: 10,
  });
  const suggestion1 = shouldSuggestCommit(atThreshold, 5);
  assert(suggestion1 !== null && suggestion1.files === 5, "at threshold → suggestion");

  // 3. Recently suggested (within 3 turns) → null
  const recentlySuggested = makeState({
    files_touched: ["a.ts", "b.ts", "c.ts", "d.ts", "e.ts"],
    turn_count: 10,
    last_commit_suggestion_turn: 9,
  });
  assert(
    shouldSuggestCommit(recentlySuggested, 5) === null,
    "recently suggested (within 3 turns) → null"
  );

  // 4. Not recently suggested → suggestion
  const notRecent = makeState({
    files_touched: ["a.ts", "b.ts", "c.ts", "d.ts", "e.ts"],
    turn_count: 10,
    last_commit_suggestion_turn: 5,
  });
  const suggestion2 = shouldSuggestCommit(notRecent, 5);
  assert(suggestion2 !== null && suggestion2.files === 5, "not recently suggested → suggestion");

  // 5. Zero files → null
  const noFiles = makeState({ turn_count: 10 });
  assert(
    shouldSuggestCommit(noFiles, 5) === null,
    "zero files → null"
  );

  // 6. Threshold exactly met → suggestion
  const exactThreshold = makeState({
    files_touched: ["a.ts", "b.ts", "c.ts"],
    turn_count: 5,
  });
  const suggestion3 = shouldSuggestCommit(exactThreshold, 3);
  assert(
    suggestion3 !== null && suggestion3.files === 3,
    "threshold exactly met → suggestion"
  );
}

// ─── Tool Activation Tests ───────────────────────────────────────────

function test_tool_activation() {
  process.stderr.write("\n--- tool-activation ---\n");

  // 1. LOCKED session → declare_intent (high)
  const locked = makeState({ governance_status: "LOCKED", governance_mode: "strict" });
  const hint1 = getToolActivation(locked);
  assert(
    hint1 !== null && hint1.tool === "declare_intent" && hint1.priority === "high",
    "LOCKED session → declare_intent (high)"
  );

  // 2. High drift → map_context (high)
  const highDrift = makeState({
    drift_score: 30,
    turn_count: 10,
    trajectory: "something",
  });
  const hint2 = getToolActivation(highDrift);
  assert(
    hint2 !== null && hint2.tool === "map_context" && hint2.priority === "high",
    "high drift → map_context (high)"
  );

  // 3. Long session (15+ turns) → compact_session (medium)
  const longSession = makeState({
    turn_count: 15,
    drift_score: 80,
    trajectory: "Build auth",
  });
  const hint3 = getToolActivation(longSession);
  assert(
    hint3 !== null && hint3.tool === "compact_session" && hint3.priority === "medium",
    "long session (15+ turns) → compact_session (medium)"
  );

  // 4. No hierarchy + OPEN → map_context (medium)
  const noHierarchy = makeState({
    turn_count: 2,
    drift_score: 80,
  });
  const hint4 = getToolActivation(noHierarchy);
  assert(
    hint4 !== null && hint4.tool === "map_context" && hint4.priority === "medium",
    "no hierarchy + OPEN → map_context (medium)"
  );

  // 5. Normal state → null
  const normal = makeState({
    trajectory: "Build auth",
    tactic: "Implement JWT",
    turn_count: 3,
    drift_score: 80,
  });
  const hint5 = getToolActivation(normal);
  assert(hint5 === null, "normal state → null");

  // 6. Priority ordering: LOCKED > drift > long session > no hierarchy
  const lockedHighDrift = makeState({
    governance_status: "LOCKED",
    governance_mode: "strict",
    drift_score: 30,
    turn_count: 20,
  });
  const hint6 = getToolActivation(lockedHighDrift);
  assert(
    hint6 !== null && hint6.tool === "declare_intent",
    "priority ordering: LOCKED wins over drift + long session"
  );

  // 7. After declaring intent (OPEN, low turns, hierarchy set) → null
  const declared = makeState({
    trajectory: "Build auth",
    turn_count: 1,
    drift_score: 90,
  });
  const hint7 = getToolActivation(declared);
  assert(hint7 === null, "after declaring intent (OPEN, low turns) → null");

  // 8. With hierarchy set, moderate turns → null
  const moderate = makeState({
    trajectory: "Build auth",
    tactic: "JWT",
    action: "Write tests",
    turn_count: 8,
    drift_score: 60,
  });
  const hint8 = getToolActivation(moderate);
  assert(hint8 === null, "with hierarchy set, moderate turns → null");
}

// ─── Runner ──────────────────────────────────────────────────────────

function main() {
  process.stderr.write("=== Auto-Hooks Pure Function Tests ===\n");

  test_staleness();
  test_chain_analysis();
  test_commit_advisor();
  test_tool_activation();

  process.stderr.write(`\n=== Auto-Hooks Pure: ${passed} passed, ${failed_} failed ===\n`);
  if (failed_ > 0) process.exit(1);
}

main();
