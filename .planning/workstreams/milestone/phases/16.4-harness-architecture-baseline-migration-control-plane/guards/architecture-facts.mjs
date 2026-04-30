#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import process from "node:process";

const phaseDir = dirname(resolve(new URL(import.meta.url).pathname, ".."));

const files = {
  guardManifest: resolve(phaseDir, "guards", "README.md"),
  register: resolve(phaseDir, "16.4-DECISION-REGISTER.md"),
  baseline: resolve(phaseDir, "16.4-ARCHITECTURE-BASELINE.md"),
  migration: resolve(phaseDir, "16.4-MIGRATION-CONTROL-PLANE.md"),
  scorecard: resolve(phaseDir, "16.4-FIRST-BIG-WIN-SCORECARD.md"),
  sourceCoverage: resolve(phaseDir, "16.4-SOURCE-COVERAGE-AUDIT.md"),
  validation: resolve(phaseDir, "16.4-VALIDATION.md"),
};

const supportedChecks = new Set([
  "--check-guard-manifest",
  "--check-register",
  "--check-mutation-authority",
  "--check-state-taxonomy",
  "--check-lifecycle-owners",
  "--check-move-map",
  "--check-platform-evidence",
  "--check-migration-gates",
  "--check-first-big-win",
  "--check-source-coverage",
]);

function usage() {
  return `Usage: node architecture-facts.mjs [checks]\n\nChecks:\n${Array.from(supportedChecks).map((flag) => `  ${flag}`).join("\n")}\n\nOutput: JSON { ok, checks }. This script reads files only and never mutates runtime state.`;
}

function read(path) {
  if (!existsSync(path)) return null;
  return readFileSync(path, "utf8");
}

function requireFile(label, path, errors) {
  if (!existsSync(path)) errors.push(`missing file: ${label}`);
}

function requireIncludes(label, content, needles, errors) {
  for (const needle of needles) {
    if (!content?.includes(needle)) errors.push(`${label} missing: ${needle}`);
  }
}

function result(name, errors) {
  return { name, ok: errors.length === 0, errors };
}

function checkGuardManifest() {
  const errors = [];
  requireFile("guards/README.md", files.guardManifest, errors);
  const content = read(files.guardManifest);
  requireIncludes("guards/README.md", content, [
    "Guard", "Classification", "Purpose", "Input", "Output", "Failure Behavior", "SPEC Requirement", "Decision Trace",
    "fact-reporting", "P16.4-14", "D-01, D-04, D-05", "no runtime state mutation",
  ], errors);
  return result("guard-manifest", errors);
}

function checkRegister() {
  const errors = [];
  requireFile("16.4-DECISION-REGISTER.md", files.register, errors);
  const content = read(files.register);
  requireIncludes("16.4-DECISION-REGISTER.md", content, [
    "# Phase 16.4 Decision Validation Register", "## Verdict Vocabulary", "## Register", "## Reuse Rules for Future Agents",
    "Claim", "Source Path", "Current Code/Platform Evidence", "Verdict", "Replacement Rule", "Downstream Impact", "Reuse Safe?", "SPEC Requirement", "Decision Trace",
    "valid", "partial", "stale", "rejected", "needs-research",
    "REG-01", "REG-02", "REG-03", "REG-04", "REG-05", "REG-06", "REG-07",
    "docs are evidence inputs, not runtime truth",
  ], errors);
  return result("register", errors);
}

function checkMutationAuthority() {
  const errors = [];
  requireFile("16.4-ARCHITECTURE-BASELINE.md", files.baseline, errors);
  const content = read(files.baseline);
  requireIncludes("16.4-ARCHITECTURE-BASELINE.md", content, [
    "## Mutation Authority Matrix", "tool surface", "tool.execute.before hook", "tool.execute.after hook", "messages.transform hook", "event hook", "library persistence module", "OpenCode SDK wrapper", "fact-reporting script", "sidecar/read model",
    "global tools-write/hooks-read CQRS is stale", "bounded hook output mutation is allowed", "REG-01",
  ], errors);
  return result("mutation-authority", errors);
}

function checkStateTaxonomy() {
  const errors = [];
  const content = read(files.baseline);
  requireIncludes("16.4-ARCHITECTURE-BASELINE.md", content, [
    "## State Ownership Model", ".hivemind/", ".opencode/state/opencode-harness/", "canonical runtime state", "derived projection", "audit trail", "archived", "future/optional",
    "continuity records", "delegation records", "pending notifications", "future delegation manifest", "session journal", "trajectory/lineage", "workflow task graph", "agent-work-contract", "vector memory", "graph memory", "GUI/sidecar read models",
    "single-authority sync direction",
  ], errors);
  return result("state-taxonomy", errors);
}

function checkLifecycleOwners() {
  const errors = [];
  const content = read(files.baseline);
  requireIncludes("16.4-ARCHITECTURE-BASELINE.md", content, [
    "## Runtime Classification Matrix", "## Lifecycle Ownership Table",
    "session initiation runtime", "mid-flow intervention runtime", "post-completion runtime", "delegated subtask runtime", "background command/runtime surface",
    "SDK delegation dispatch/completion", "PTY/headless command lifecycle", "terminal transition", "pending notification replay", "turn-start hydration", "future manifest update", "future journal append", "sidecar projection refresh",
    "FAIL if a new component writes terminal delegation status",
  ], errors);
  return result("lifecycle-owners", errors);
}

function checkMoveMap() {
  const errors = [];
  const content = read(files.baseline);
  requireIncludes("16.4-ARCHITECTURE-BASELINE.md", content, [
    "## Target Code-Tree Baseline Superseding Phase 11", "## File Classification Move Map", "keep", "split", "move later", "retire", "validate first", "future/optional",
    "src/plugin.ts", "src/hooks/", "src/tools/", "src/lib/continuity.ts", "src/lib/delegation-manager.ts", "src/lib/delegation-persistence.ts", "src/lib/lifecycle-manager.ts", "src/lib/notification-handler.ts", "src/lib/spawner/", "src/lib/pty/", "src/shared/", "src/schema-kernel/", ".opencode/skills/", ".opencode/agents/", ".opencode/commands/", ".hivemind/",
    "Phase 16.4 supersedes stale Phase 11 assumptions",
  ], errors);
  return result("move-map", errors);
}

function checkPlatformEvidence() {
  const errors = [];
  const content = read(files.baseline);
  requireIncludes("16.4-ARCHITECTURE-BASELINE.md", content, [
    "## Hiveminder / Hivefiver / Shared Boundary", "## OpenCode Platform Conformance Rules",
    "Hiveminder is the built-in meta-concept/runtime-integration module for Hivemind Harness", "Hivefiver is the end-user meta-builder module for OpenCode primitives", "neither is a soft harness", ".md files are transition-stage artifacts",
    "plugins may expose multiple tools", "custom tools are TS/JS definitions that may call other languages", "hooks may mutate documented hook outputs", "event hooks must not be sole blocking transaction gates", "permissions are first-class", "SDK/server APIs own session orchestration surfaces",
  ], errors);
  return result("platform-evidence", errors);
}

function checkMigrationGates() {
  const errors = [];
  requireFile("16.4-MIGRATION-CONTROL-PLANE.md", files.migration, errors);
  const content = read(files.migration);
  requireIncludes("16.4-MIGRATION-CONTROL-PLANE.md", content, [
    "## Control Plane Rules", "## .opencode/state to .hivemind Transition", "## Product-Detox Concept Gate", "## Candidate Concept Matrix", "## Rejected / Blocked Inputs", "## Validation Commands",
    "No product-detox code is copied as-is", "Concepts and contracts migrate before code", "No second runtime authority without an explicit architecture gate", "Current .opencode/state/opencode-harness persistence is migration input",
    "Candidate Concept", "Source Paths", "Purpose", "Target Runtime Category", "State Owner", "Conflict Risk", "Concept-Migration Plan", "Code-Copy Exception", "Tests/Guards Required", "First-Big-Win Score Ref", "Decision Trace",
    "event-tracker", "session-journal", "trajectory", "task", "agent-work-contract", "runtime-entry", "session-entry", "workflow-management", ".hivemind", "apps/side-car",
  ], errors);
  return result("migration-gates", errors);
}

function checkFirstBigWin() {
  const errors = [];
  requireFile("16.4-FIRST-BIG-WIN-SCORECARD.md", files.scorecard, errors);
  const content = read(files.scorecard);
  requireIncludes("16.4-FIRST-BIG-WIN-SCORECARD.md", content, [
    "## Scoring Criteria", "## Candidate Scorecard", "## Recommendation", "## Deferred Candidate Rationale",
    "User Value", "Architecture Leverage", "Reversibility", "State Risk", "OpenCode Fit", "Testability",
    "delegation manifest/notification mediation", "session journal + execution lineage bridge", "doc intelligence", "agent-work-contract schema", "task/trajectory graph", "sidecar visibility",
    "D-21", "D-22", "D-23", "D-24",
  ], errors);
  return result("first-big-win", errors);
}

function checkSourceCoverage() {
  const errors = [];
  requireFile("16.4-SOURCE-COVERAGE-AUDIT.md", files.sourceCoverage, errors);
  requireFile("16.4-VALIDATION.md", files.validation, errors);
  const coverage = read(files.sourceCoverage);
  const validation = read(files.validation);
  requireIncludes("16.4-SOURCE-COVERAGE-AUDIT.md", coverage, [
    "GOAL: ROADMAP Phase 16.4", "REQ: ROADMAP Requirements TBD", "P16.4-01 through P16.4-14", "D-01 through D-24", "16.4-01", "16.4-02", "16.4-03", "16.4-04",
    "full delegation manifest + notification mediation implementation", "full GUI/Hivefive sidecar implementation", "vector memory and graph query implementation", "full product-detox code migration",
    "No unplanned source items remain; formal ROADMAP requirement IDs are TBD, so plans use ROADMAP-16.4 plus P16.4 markers and D-XX decision traces.",
  ], errors);
  requireIncludes("16.4-VALIDATION.md", validation, [
    "status: ready", "nyquist_compliant: true", "wave_0_complete: true", "## Phase Gate Command", "--check-source-coverage", "npm run typecheck",
    "16.4-01-01", "16.4-01-02", "16.4-02-01", "16.4-02-02", "16.4-02-03", "16.4-03-01", "16.4-03-02", "16.4-04-01", "16.4-04-02",
    "[x] All tasks have <automated> verify or Wave 0 dependencies",
  ], errors);
  return result("source-coverage", errors);
}

const checkers = {
  "--check-guard-manifest": checkGuardManifest,
  "--check-register": checkRegister,
  "--check-mutation-authority": checkMutationAuthority,
  "--check-state-taxonomy": checkStateTaxonomy,
  "--check-lifecycle-owners": checkLifecycleOwners,
  "--check-move-map": checkMoveMap,
  "--check-platform-evidence": checkPlatformEvidence,
  "--check-migration-gates": checkMigrationGates,
  "--check-first-big-win": checkFirstBigWin,
  "--check-source-coverage": checkSourceCoverage,
};

const args = process.argv.slice(2);
if (args.includes("--help") || args.length === 0) {
  console.log(usage());
  process.exit(0);
}

const unknown = args.filter((arg) => !supportedChecks.has(arg));
if (unknown.length > 0) {
  console.log(JSON.stringify({ ok: false, checks: [], errors: unknown.map((arg) => `unknown flag: ${arg}`) }, null, 2));
  process.exit(1);
}

const checks = args.map((arg) => checkers[arg]());
const ok = checks.every((check) => check.ok);
console.log(JSON.stringify({ ok, checks }, null, 2));
if (!ok) process.exit(1);
