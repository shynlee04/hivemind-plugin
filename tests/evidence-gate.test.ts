/**
 * Evidence Gate System Tests
 * Tests for: escalation tiers, evidence-based signals, counter-excuses,
 * write-without-read tracking, retard mode, argument-back prompt injection
 */

import {
  compileEscalatedSignals,
  computeEscalationTier,
  formatSignals,
  createDetectionState,
  DEFAULT_THRESHOLDS,
  type EscalatedSignal,
  type EscalationTier,
  type DetectionState,
} from "../src/lib/detection.js";
import {
  createConfig,
  isValidAutomationLevel,
  type AutomationLevel,
} from "../src/schemas/config.js";
import {
  createBrainState,
  generateSessionId,
} from "../src/schemas/brain-state.js";
import { initProject } from "../src/cli/init.js";
import { createStateManager, loadConfig } from "../src/lib/persistence.js";
import { mkdtempSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

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

// ─── Escalation Tier Tests ───────────────────────────────────────────

function test_escalation_tiers() {
  process.stderr.write("\n--- escalation-tiers ---\n");

  // 1. At threshold = INFO
  assert(computeEscalationTier(5, 5) === "INFO", "at threshold → INFO");

  // 2. Below threshold = INFO
  assert(computeEscalationTier(3, 5) === "INFO", "below threshold → INFO");

  // 3. 1-3 turns over = WARN
  assert(computeEscalationTier(7, 5) === "WARN", "2 over threshold → WARN");

  // 4. 4-7 turns over = CRITICAL
  assert(computeEscalationTier(10, 5) === "CRITICAL", "5 over threshold → CRITICAL");

  // 5. 8+ turns over = DEGRADED
  assert(computeEscalationTier(15, 5) === "DEGRADED", "10 over threshold → DEGRADED");

  // 6. Boundary: exactly 3 over = WARN
  assert(computeEscalationTier(8, 5) === "WARN", "3 over threshold → WARN");

  // 7. Boundary: exactly 7 over = CRITICAL
  assert(computeEscalationTier(12, 5) === "CRITICAL", "7 over threshold → CRITICAL");

  // 8. Zero threshold = at least INFO
  assert(computeEscalationTier(0, 0) === "INFO", "zero/zero → INFO");
}

// ─── Escalated Signal Tests ──────────────────────────────────────────

function test_escalated_signals() {
  process.stderr.write("\n--- escalated-signals ---\n");

  const baseDetection = createDetectionState();

  // 1. compileEscalatedSignals returns EscalatedSignal with tier
  const signals = compileEscalatedSignals({
    turnCount: 5,
    detection: baseDetection,
  });
  assert(
    signals.length > 0 && signals[0].tier !== undefined,
    "compileEscalatedSignals returns signals with tier"
  );

  // 2. Each signal has evidence string
  assert(
    signals.every(s => typeof s.evidence === "string" && s.evidence.length > 0),
    "every escalated signal has non-empty evidence"
  );

  // 3. Each signal has counter_excuse (for known types)
  const turnSignal = signals.find(s => s.type === "turn_count");
  assert(
    turnSignal !== undefined && turnSignal.counter_excuse !== undefined,
    "turn_count signal has counter_excuse"
  );

  // 4. Evidence includes actual counter data
  assert(
    turnSignal!.evidence.includes("5 turns"),
    "evidence includes actual turn count data"
  );

  // 5. Counter-excuse argues back
  assert(
    turnSignal!.counter_excuse!.includes("checkpoint later"),
    "counter_excuse contains argument against delay"
  );

  // 6. Multiple signals all escalated
  const heavyDetection: DetectionState = {
    ...baseDetection,
    consecutive_failures: 5,
    keyword_flags: ["stuck"],
  };
  const multiSignals = compileEscalatedSignals({
    turnCount: 10,
    detection: heavyDetection,
    maxSignals: 5,
  });
  assert(
    multiSignals.every(s => s.tier && s.evidence),
    "all signals in multi-signal case have tier + evidence"
  );

  // 7. Escalation tier intensifies with turns
  const lowTurn = compileEscalatedSignals({ turnCount: 5, detection: baseDetection });
  const highTurn = compileEscalatedSignals({ turnCount: 15, detection: baseDetection });
  const lowTier = lowTurn.find(s => s.type === "turn_count")?.tier;
  const highTier = highTurn.find(s => s.type === "turn_count")?.tier;
  const tierOrder: EscalationTier[] = ["INFO", "WARN", "CRITICAL", "DEGRADED"];
  assert(
    tierOrder.indexOf(highTier!) >= tierOrder.indexOf(lowTier!),
    "higher turn count → equal or higher escalation tier"
  );
}

// ─── Write-Without-Read Signal Tests ─────────────────────────────────

function test_write_without_read() {
  process.stderr.write("\n--- write-without-read ---\n");

  const base = createDetectionState();

  // 1. writeWithoutReadCount > 0 → signal generated
  const signals = compileEscalatedSignals({
    turnCount: 0,
    detection: base,
    writeWithoutReadCount: 3,
    maxSignals: 5,
  });
  const wwrSignal = signals.find(s => s.type === "write_without_read");
  assert(wwrSignal !== undefined, "write_without_read signal generated when count > 0");

  // 2. Evidence includes count
  assert(
    wwrSignal!.evidence.includes("3"),
    "write_without_read evidence includes count"
  );

  // 3. writeWithoutReadCount = 0 → no signal
  const noSignals = compileEscalatedSignals({
    turnCount: 0,
    detection: base,
    writeWithoutReadCount: 0,
    maxSignals: 5,
  });
  const noWwr = noSignals.find(s => s.type === "write_without_read");
  assert(noWwr === undefined, "no write_without_read signal when count is 0");

  // 4. brain-state has write_without_read_count field
  const config = createConfig();
  const state = createBrainState(generateSessionId(), config);
  assert(
    state.metrics.write_without_read_count === 0,
    "brain state initializes write_without_read_count to 0"
  );
}

// ─── Format with Escalation Tests ────────────────────────────────────

function test_format_escalated() {
  process.stderr.write("\n--- format-escalated ---\n");

  // 1. Escalated signals get [TIER] prefix
  const escalated: EscalatedSignal[] = [{
    type: "turn_count",
    severity: 3,
    message: "5 turns on current section.",
    suggestion: "map_context",
    tier: "WARN",
    evidence: "5 turns elapsed.",
    counter_excuse: "Don't delay.",
  }];
  const formatted = formatSignals(escalated);
  assert(formatted.includes("[WARN]"), "formatted output includes [TIER] prefix");

  // 2. Formatted includes EVIDENCE line
  assert(formatted.includes("EVIDENCE:"), "formatted output includes EVIDENCE line");

  // 3. Formatted includes counter-excuse with arrow
  assert(formatted.includes("↳"), "formatted output includes counter-excuse with arrow");

  // 4. CRITICAL tier formats correctly
  const critical: EscalatedSignal[] = [{
    type: "consecutive_failures",
    severity: 1,
    message: "3 consecutive failures.",
    tier: "CRITICAL",
    evidence: "3 failures. Health degrading.",
  }];
  const critFormatted = formatSignals(critical);
  assert(critFormatted.includes("[CRITICAL]"), "CRITICAL tier formats correctly");

  // 5. Non-escalated signals still format with - prefix (backward compat)
  const plain = formatSignals([{
    type: "turn_count",
    severity: 3,
    message: "5 turns on current section.",
    suggestion: "map_context",
  }]);
  assert(plain.includes("- 5 turns"), "non-escalated signals still use - prefix");
}

// ─── Automation Level + Retard Mode Tests ────────────────────────────

function test_automation_level() {
  process.stderr.write("\n--- automation-level ---\n");

  // 1. isValidAutomationLevel validates all options
  assert(isValidAutomationLevel("manual"), "manual is valid automation level");
  assert(isValidAutomationLevel("guided"), "guided is valid automation level");
  assert(isValidAutomationLevel("assisted"), "assisted is valid automation level");
  assert(isValidAutomationLevel("full"), "full is valid automation level");
  assert(isValidAutomationLevel("retard"), "retard is valid automation level");
  assert(!isValidAutomationLevel("invalid"), "invalid is NOT valid automation level");

  // 2. Default config has automation_level = "assisted"
  const config = createConfig();
  assert(config.automation_level === "assisted", "default automation_level is assisted");

  // 3. Config can be created with retard mode
  const retardConfig = createConfig({ automation_level: "retard" });
  assert(retardConfig.automation_level === "retard", "config can be created with retard");
}

// ─── Retard Mode Init Tests ──────────────────────────────────────────

async function test_retard_mode_init() {
  process.stderr.write("\n--- retard-mode-init ---\n");

  const tmpDir = mkdtempSync(join(tmpdir(), "hm-retard-"));

  // Init with retard mode
  await initProject(tmpDir, {
    automationLevel: "retard" as AutomationLevel,
    silent: true,
  });

  // 1. Config saved with retard automation_level
  const config = await loadConfig(tmpDir);
  assert(config.automation_level === "retard", "init saves retard automation_level to config");

  // 2. Retard mode forces strict governance
  assert(config.governance_mode === "strict", "retard mode forces strict governance");

  // 3. Retard mode forces skeptical output
  assert(config.agent_behavior.output_style === "skeptical", "retard mode forces skeptical output");

  // 4. Retard mode forces beginner expert level
  assert(config.agent_behavior.expert_level === "beginner", "retard mode forces beginner expert level");

  // 5. Retard mode forces code review
  assert(config.agent_behavior.constraints.require_code_review === true, "retard mode forces code review");

  // 6. Retard mode forces be_skeptical
  assert(config.agent_behavior.constraints.be_skeptical === true, "retard mode forces be_skeptical");

  // 7. Brain state starts LOCKED (due to strict)
  const stateManager = createStateManager(tmpDir);
  const state = await stateManager.load();
  assert(state?.session.governance_status === "LOCKED", "retard mode starts session LOCKED");
}

// ─── Evidence Quality Tests ──────────────────────────────────────────

function test_evidence_quality() {
  process.stderr.write("\n--- evidence-quality ---\n");

  const base = createDetectionState();

  // 1. Failure evidence includes failure count
  const failDet: DetectionState = { ...base, consecutive_failures: 5 };
  const failSignals = compileEscalatedSignals({
    turnCount: 0,
    detection: failDet,
    maxSignals: 5,
  });
  const failSig = failSignals.find(s => s.type === "consecutive_failures");
  assert(
    failSig !== undefined && failSig.evidence.includes("5"),
    "failure evidence includes actual failure count"
  );

  // 2. Keyword evidence includes detected keywords
  const kwDet: DetectionState = { ...base, keyword_flags: ["stuck", "retry"] };
  const kwSignals = compileEscalatedSignals({
    turnCount: 0,
    detection: kwDet,
    maxSignals: 5,
  });
  const kwSig = kwSignals.find(s => s.type === "keyword_flags");
  assert(
    kwSig !== undefined && kwSig.evidence.includes("stuck") && kwSig.evidence.includes("retry"),
    "keyword evidence includes detected keywords"
  );

  // 3. Timestamp gap evidence includes hours
  const gapSignals = compileEscalatedSignals({
    turnCount: 0,
    detection: base,
    timestampGapMs: 4 * 60 * 60 * 1000, // 4 hours
    maxSignals: 5,
  });
  const gapSig = gapSignals.find(s => s.type === "timestamp_gap");
  assert(
    gapSig !== undefined && gapSig.evidence.includes("4"),
    "timestamp gap evidence includes hours"
  );

  // 4. Missing tree evidence is explicit
  const treeSignals = compileEscalatedSignals({
    turnCount: 0,
    detection: base,
    missingTree: true,
    maxSignals: 5,
  });
  const treeSig = treeSignals.find(s => s.type === "missing_tree");
  assert(
    treeSig !== undefined && treeSig.evidence.includes("ALL drift detection"),
    "missing tree evidence explains consequences"
  );

  // 5. Read-write imbalance evidence includes actual counts
  const imbalanceDet: DetectionState = {
    ...base,
    tool_type_counts: { read: 12, write: 0, query: 0, governance: 0 },
  };
  const imbalanceSignals = compileEscalatedSignals({
    turnCount: 0,
    detection: imbalanceDet,
    maxSignals: 5,
  });
  const imbalanceSig = imbalanceSignals.find(s => s.type === "read_write_imbalance");
  assert(
    imbalanceSig !== undefined && imbalanceSig.evidence.includes("12 reads"),
    "read-write imbalance evidence includes actual read count"
  );
}

// ─── Runner ──────────────────────────────────────────────────────────

async function main() {
  process.stderr.write("=== Evidence Gate System Tests ===\n");

  test_escalation_tiers();
  test_escalated_signals();
  test_write_without_read();
  test_format_escalated();
  test_automation_level();
  await test_retard_mode_init();
  test_evidence_quality();

  process.stderr.write(`\n=== Evidence Gate: ${passed} passed, ${failed_} failed ===\n`);
  if (failed_ > 0) process.exit(1);
}

main();
