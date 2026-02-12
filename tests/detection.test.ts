/**
 * Detection Engine Tests
 * Tests for tool classification, counter logic, keyword scanning, signal compilation
 */

import {
  classifyTool, incrementToolType, trackToolResult,
  trackSectionUpdate, resetSectionTracking,
  scanForKeywords, addKeywordFlags,
  compileSignals, formatSignals,
  createDetectionState, DEFAULT_THRESHOLDS,
  createGovernanceCounters,
  computeGovernanceSeverity,
  computeViolationSeriousness,
  registerGovernanceSignal,
  acknowledgeGovernanceSignals,
  resetGovernanceCounters,
  type DetectionState, type ToolTypeCounts, type DetectionThresholds,
} from "../src/lib/detection.js";

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

// ─── Tool Classification Tests ───────────────────────────────────────

function test_tool_classification() {
  process.stderr.write("\n--- tool-classification ---\n");

  // 1. Exact match: read
  assert(classifyTool("read") === "read", "classifyTool('read') → 'read'");

  // 2. Exact match: write
  assert(classifyTool("write") === "write", "classifyTool('write') → 'write'");

  // 3. Exact match: edit → write
  assert(classifyTool("edit") === "write", "classifyTool('edit') → 'write'");

  // 4. Exact match: bash → write
  assert(classifyTool("bash") === "write", "classifyTool('bash') → 'write'");

  // 5. Exact match: glob → read
  assert(classifyTool("glob") === "read", "classifyTool('glob') → 'read'");

  // 6. Exact match: grep → read
  assert(classifyTool("grep") === "read", "classifyTool('grep') → 'read'");

  // 7. Exact match: task → query
  assert(classifyTool("task") === "query", "classifyTool('task') → 'query'");

  // 8. Exact match: declare_intent → governance
  assert(classifyTool("declare_intent") === "governance", "classifyTool('declare_intent') → 'governance'");

  // 9. Exact match: map_context → governance
  assert(classifyTool("map_context") === "governance", "classifyTool('map_context') → 'governance'");

  // 10. Unknown tool defaults to query
  assert(classifyTool("unknown_custom_tool") === "query", "classifyTool('unknown_custom_tool') → 'query' (default)");

  // 11. Heuristic: contains "get" → read
  assert(classifyTool("getData") === "read", "classifyTool('getData') → 'read' (heuristic: contains 'get')");

  // 12. Heuristic: contains "create" → write
  assert(classifyTool("createFile") === "write", "classifyTool('createFile') → 'write' (heuristic: contains 'create')");
}

// ─── Counter Logic Tests ─────────────────────────────────────────────

function test_counter_logic() {
  process.stderr.write("\n--- counter-logic ---\n");

  // 1. createDetectionState initializes all zeros
  const fresh = createDetectionState();
  assert(
    fresh.consecutive_failures === 0 &&
    fresh.consecutive_same_section === 0 &&
    fresh.last_section_content === "" &&
    fresh.tool_type_counts.read === 0 &&
    fresh.tool_type_counts.write === 0 &&
    fresh.tool_type_counts.query === 0 &&
    fresh.tool_type_counts.governance === 0 &&
    fresh.keyword_flags.length === 0,
    "createDetectionState initializes all zeros"
  );

  // 2. incrementToolType increments correct category
  const counts: ToolTypeCounts = { read: 0, write: 0, query: 0, governance: 0 };
  const after = incrementToolType(counts, "read");
  assert(after.read === 1, "incrementToolType increments correct category");

  // 3. incrementToolType preserves other categories
  assert(
    after.write === 0 && after.query === 0 && after.governance === 0,
    "incrementToolType preserves other categories"
  );

  // 4. trackToolResult success resets consecutive_failures
  const failing: DetectionState = { ...fresh, consecutive_failures: 5 };
  const afterSuccess = trackToolResult(failing, true);
  assert(afterSuccess.consecutive_failures === 0, "trackToolResult success resets consecutive_failures");

  // 5. trackToolResult failure increments consecutive_failures
  const afterFailure = trackToolResult(fresh, false);
  assert(afterFailure.consecutive_failures === 1, "trackToolResult failure increments consecutive_failures");

  // 6. trackSectionUpdate same content increments repetition
  const withContent: DetectionState = { ...fresh, last_section_content: "implement auth", consecutive_same_section: 1 };
  const afterSame = trackSectionUpdate(withContent, "implement auth");
  assert(afterSame.consecutive_same_section === 2, "trackSectionUpdate same content increments repetition");

  // 7. trackSectionUpdate different content resets repetition
  const afterDiff = trackSectionUpdate(withContent, "completely different topic about databases");
  assert(afterDiff.consecutive_same_section === 0, "trackSectionUpdate different content resets repetition");

  // 8. resetSectionTracking resets counter and content
  const withTracking: DetectionState = { ...fresh, consecutive_same_section: 5, last_section_content: "something" };
  const afterReset = resetSectionTracking(withTracking);
  assert(
    afterReset.consecutive_same_section === 0 && afterReset.last_section_content === "",
    "resetSectionTracking resets counter and content"
  );
}

// ─── Keyword Scanning Tests ──────────────────────────────────────────

function test_keyword_scanning() {
  process.stderr.write("\n--- keyword-scanning ---\n");

  // 1. scanForKeywords finds "stuck" in text
  const stuckFlags = scanForKeywords("I'm stuck on this problem", []);
  assert(stuckFlags.includes("stuck"), "scanForKeywords finds 'stuck' in text");

  // 2. scanForKeywords finds "confused" in text
  const confusedFlags = scanForKeywords("I'm confused about the API", []);
  assert(confusedFlags.includes("confused"), "scanForKeywords finds 'confused' in text");

  // 3. scanForKeywords finds "not working" in text
  const notWorkingFlags = scanForKeywords("This is not working as expected", []);
  assert(notWorkingFlags.includes("blocked"), "scanForKeywords finds 'not working' in text");

  // 4. scanForKeywords returns empty for clean text
  const cleanFlags = scanForKeywords("Everything is great and running smoothly", []);
  assert(cleanFlags.length === 0, "scanForKeywords returns empty for clean text");

  // 5. scanForKeywords skips already-existing flags
  const existingFlags = scanForKeywords("I'm stuck on this problem", ["stuck"]);
  assert(!existingFlags.includes("stuck"), "scanForKeywords skips already-existing flags");

  // 6. addKeywordFlags adds new flags to state
  const state = createDetectionState();
  const withFlags = addKeywordFlags(state, ["stuck", "retry"]);
  assert(
    withFlags.keyword_flags.length === 2 &&
    withFlags.keyword_flags.includes("stuck") &&
    withFlags.keyword_flags.includes("retry"),
    "addKeywordFlags adds new flags to state"
  );

  // 7. addKeywordFlags deduplicates
  const withDup = addKeywordFlags(withFlags, ["stuck", "confused"]);
  assert(
    withDup.keyword_flags.length === 3 &&
    withDup.keyword_flags.filter(f => f === "stuck").length === 1,
    "addKeywordFlags deduplicates"
  );

  // 8. addKeywordFlags returns same state if no new flags
  const noNew = addKeywordFlags(withFlags, ["stuck", "retry"]);
  assert(noNew === withFlags, "addKeywordFlags returns same state if no new flags");
}

// ─── Signal Compilation Tests ────────────────────────────────────────

function test_signal_compilation() {
  process.stderr.write("\n--- signal-compilation ---\n");

  const baseDetection = createDetectionState();

  // 1. compileSignals with 0 turns returns empty
  const empty = compileSignals({ turnCount: 0, detection: baseDetection });
  assert(empty.length === 0, "compileSignals with 0 turns returns empty");

  // 2. compileSignals with turns >= threshold returns turn_count signal
  const turnSignals = compileSignals({ turnCount: 5, detection: baseDetection });
  assert(
    turnSignals.some(s => s.type === "turn_count"),
    "compileSignals with turns >= threshold returns turn_count signal"
  );

  // 3. compileSignals with consecutive_failures >= 3 returns failure signal
  const failDetection: DetectionState = { ...baseDetection, consecutive_failures: 3 };
  const failSignals = compileSignals({ turnCount: 0, detection: failDetection });
  assert(
    failSignals.some(s => s.type === "consecutive_failures"),
    "compileSignals with consecutive_failures >= 3 returns failure signal"
  );

  // 4. compileSignals with section_repetition >= 4 returns circling signal
  const circleDetection: DetectionState = { ...baseDetection, consecutive_same_section: 4 };
  const circleSignals = compileSignals({ turnCount: 0, detection: circleDetection });
  assert(
    circleSignals.some(s => s.type === "section_repetition"),
    "compileSignals with section_repetition >= 4 returns circling signal"
  );

  // 5. compileSignals with read_write_imbalance (8 reads, 0 writes) returns signal
  const imbalanceDetection: DetectionState = {
    ...baseDetection,
    tool_type_counts: { read: 8, write: 0, query: 0, governance: 0 },
  };
  const imbalanceSignals = compileSignals({ turnCount: 0, detection: imbalanceDetection });
  assert(
    imbalanceSignals.some(s => s.type === "read_write_imbalance"),
    "compileSignals with read_write_imbalance (8 reads, 0 writes) returns signal"
  );

  // 6. compileSignals with keyword_flags returns keyword signal
  const kwDetection: DetectionState = { ...baseDetection, keyword_flags: ["stuck", "retry"] };
  const kwSignals = compileSignals({ turnCount: 0, detection: kwDetection });
  assert(
    kwSignals.some(s => s.type === "keyword_flags"),
    "compileSignals with keyword_flags returns keyword signal"
  );

  // 7. compileSignals with completedBranches >= 5 returns prune signal
  const pruneSignals = compileSignals({
    turnCount: 0, detection: baseDetection, completedBranches: 5,
  });
  assert(
    pruneSignals.some(s => s.type === "completed_pileup"),
    "compileSignals with completedBranches >= 5 returns prune signal"
  );

  // 8. compileSignals with timestampGapMs >= 2h returns gap signal
  const gapSignals = compileSignals({
    turnCount: 0, detection: baseDetection, timestampGapMs: 2 * 60 * 60 * 1000,
  });
  assert(
    gapSignals.some(s => s.type === "timestamp_gap"),
    "compileSignals with timestampGapMs >= 2h returns gap signal"
  );

  // 9. compileSignals with missingTree returns migration signal
  const migrationSignals = compileSignals({
    turnCount: 0, detection: baseDetection, missingTree: true,
  });
  assert(
    migrationSignals.some(s => s.type === "missing_tree"),
    "compileSignals with missingTree returns migration signal"
  );

  // 10. compileSignals sorts by severity (lower number = higher priority)
  const multiDetection: DetectionState = {
    ...baseDetection,
    consecutive_failures: 3,   // severity 1
    keyword_flags: ["stuck"],  // severity 2
  };
  const multiSignals = compileSignals({
    turnCount: 5,              // severity 3
    detection: multiDetection,
  });
  assert(
    multiSignals.length >= 2 &&
    multiSignals[0].severity <= multiSignals[1].severity,
    "compileSignals sorts by severity (lower number = higher priority)"
  );

  // 11. compileSignals respects maxSignals cap (returns at most N)
  const heavyDetection: DetectionState = {
    ...baseDetection,
    consecutive_failures: 5,
    consecutive_same_section: 10,
    keyword_flags: ["stuck", "retry"],
    tool_type_counts: { read: 10, write: 0, query: 0, governance: 0 },
  };
  const cappedSignals = compileSignals({
    turnCount: 10,
    detection: heavyDetection,
    completedBranches: 10,
    timestampGapMs: 10 * 60 * 60 * 1000,
    missingTree: true,
    sessionFileLines: 100,
    maxSignals: 2,
  });
  assert(cappedSignals.length <= 2, "compileSignals respects maxSignals cap (returns at most N)");

  // 12. formatSignals returns empty string for 0 signals
  assert(formatSignals([]) === "", "formatSignals returns empty string for 0 signals");

  // 13. formatSignals returns [ALERTS] block with correct format
  const formatted = formatSignals([
    { type: "turn_count", severity: 3, message: "5 turns on current section.", suggestion: "map_context" },
  ]);
  assert(
    formatted.startsWith("[ALERTS]") && formatted.includes("5 turns on current section.") && formatted.includes("→ use map_context"),
    "formatSignals returns [ALERTS] block with correct format"
  );

  // 14. compileSignals with write tools + empty action → tool_hierarchy_mismatch signal
  {
    const signals = compileSignals({
      turnCount: 0,
      detection: { ...createDetectionState(), tool_type_counts: { read: 0, write: 3, query: 0, governance: 0 } },
      hierarchyActionEmpty: true,
    });
    const mismatch = signals.find(s => s.type === 'tool_hierarchy_mismatch');
    assert(!!mismatch, 'compileSignals with write tools + empty action → tool_hierarchy_mismatch signal');
  }

  // 15. compileSignals with write tools + action set → no mismatch signal
  {
    const signals = compileSignals({
      turnCount: 0,
      detection: { ...createDetectionState(), tool_type_counts: { read: 0, write: 3, query: 0, governance: 0 } },
      hierarchyActionEmpty: false,
    });
    const mismatch = signals.find(s => s.type === 'tool_hierarchy_mismatch');
    assert(mismatch === undefined, 'compileSignals with write tools + action set → no mismatch signal');
  }

  // 16. compileSignals with empty action but no writes → no mismatch signal
  {
    const signals = compileSignals({
      turnCount: 0,
      detection: createDetectionState(),
      hierarchyActionEmpty: true,
    });
    const mismatch = signals.find(s => s.type === 'tool_hierarchy_mismatch');
    assert(mismatch === undefined, 'compileSignals with empty action but no writes → no mismatch signal');
  }

  // 17. compileSignals with sessionFileLines >= 50 returns session_file_long signal
  const longFileSignals = compileSignals({
    turnCount: 0, detection: baseDetection, sessionFileLines: 50,
  });
  assert(
    longFileSignals.some(s => s.type === "session_file_long"),
    "compileSignals with sessionFileLines >= 50 returns session_file_long signal"
  );
}

function test_governance_primitives() {
  process.stderr.write("\n--- governance-primitives ---\n");

  const counters = createGovernanceCounters();
  assert(counters.out_of_order === 0 && counters.acknowledged === false, "createGovernanceCounters initializes defaults");

  const infoSeverity = computeGovernanceSeverity({ kind: "out_of_order", repetitionCount: 0 });
  assert(infoSeverity === "info", "out_of_order starts at info");

  const warningSeverity = computeGovernanceSeverity({ kind: "out_of_order", repetitionCount: 1 });
  assert(warningSeverity === "warning", "out_of_order escalates to warning on repeat");

  const errorSeverity = computeGovernanceSeverity({ kind: "out_of_order", repetitionCount: 2 });
  assert(errorSeverity === "error", "out_of_order escalates to error after repeated violations");

  const driftWarning = computeGovernanceSeverity({ kind: "drift", repetitionCount: 0 });
  const driftError = computeGovernanceSeverity({ kind: "drift", repetitionCount: 1 });
  assert(driftWarning === "warning" && driftError === "error", "drift maps warning then error");

  const compactionInfo = computeGovernanceSeverity({ kind: "compaction", repetitionCount: 99 });
  assert(compactionInfo === "info", "compaction stays informational");

  const evidenceWarning = computeGovernanceSeverity({ kind: "evidence_pressure", repetitionCount: 0 });
  const evidenceError = computeGovernanceSeverity({ kind: "evidence_pressure", repetitionCount: 1 });
  assert(evidenceWarning === "warning" && evidenceError === "error", "evidence pressure maps warning then error");

  const ignoredError = computeGovernanceSeverity({ kind: "ignored", repetitionCount: 0 });
  assert(ignoredError === "error", "ignored tier is always error");

  const highSeriousness = computeViolationSeriousness({
    declaredIntentMismatch: true,
    hierarchyMismatch: true,
    roleMetadataMismatch: false,
  });
  assert(highSeriousness.score === 75 && highSeriousness.tier === "high", "seriousness score combines intent/hierarchy/role mismatches");

  const mediumSeriousness = computeViolationSeriousness({
    declaredIntentMismatch: false,
    hierarchyMismatch: true,
    roleMetadataMismatch: false,
  });
  assert(mediumSeriousness.score === 35 && mediumSeriousness.tier === "medium", "single hierarchy mismatch yields medium seriousness");

  const lowSeriousness = computeViolationSeriousness({
    declaredIntentMismatch: false,
    hierarchyMismatch: false,
    roleMetadataMismatch: false,
  });
  assert(lowSeriousness.score === 0 && lowSeriousness.tier === "low", "no mismatches yields low seriousness");

  const incremented = registerGovernanceSignal(counters, "out_of_order");
  assert(incremented.out_of_order === 1 && incremented.acknowledged === false, "registerGovernanceSignal increments counters and clears ack");

  const acknowledged = acknowledgeGovernanceSignals(incremented);
  const downgraded = computeGovernanceSeverity({
    kind: "out_of_order",
    repetitionCount: acknowledged.out_of_order,
    acknowledged: acknowledged.acknowledged,
  });
  assert(downgraded === "info", "acknowledgment downgrades effective repetition severity");

  const blockedReset = resetGovernanceCounters(
    { ...acknowledged, out_of_order: 3, prerequisites_completed: false },
    { full: true, prerequisitesCompleted: false }
  );
  assert(blockedReset.out_of_order === 3, "full reset is blocked until prerequisites are complete");

  const fullReset = resetGovernanceCounters(
    { ...acknowledged, out_of_order: 3, prerequisites_completed: true },
    { full: true, prerequisitesCompleted: true }
  );
  assert(fullReset.out_of_order === 0 && fullReset.prerequisites_completed === true, "full reset clears counters after prerequisite completion");
}

// ─── Runner ──────────────────────────────────────────────────────────

function main() {
  process.stderr.write("=== Detection Engine Tests ===\n");

  test_tool_classification();
  test_counter_logic();
  test_keyword_scanning();
  test_signal_compilation();
  test_governance_primitives();

  process.stderr.write(`\n=== Detection Engine: ${passed} passed, ${failed_} failed ===\n`);
  if (failed_ > 0) process.exit(1);
}

main();
