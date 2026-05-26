# Gap Documentation

Documented gaps in lifecycle coverage — skills, agents, tools, and hooks that
are needed for full lifecycle verification but do not exist yet. Update this
file when gaps are discovered, filled, or superseded.

## Gap Severity

| Level | Meaning | Action |
|-------|---------|--------|
| CRITICAL | Gate cannot pass without this capability | Must be filled before gate can certify PASS |
| HIGH | Gate passes but with reduced confidence | Should be filled before deployment readiness |
| MEDIUM | Nice-to-have automation | Fill opportunistically |
| LOW | Theoretical gap, not yet encountered | Monitor, fill if encountered |

---

## Missing Skills

### GAP-SKILL-01: PTY Lifecycle Validation
**Severity:** MEDIUM
**Status:** OPEN
**Description:** No dedicated skill for validating PTY (pseudo-terminal) manager
integration. The `run-gate-eval.sh` script does not inspect PTY manager
lifecycle — lazy loading, graceful fallback, session cleanup.
**Impact:** PTY lifecycle issues (missing cleanup, stale PTY sessions) are not
caught by automated checks.
**Workaround:** Manual inspection of `src/plugin.ts` PTY wiring.
**Resolution:** Create a `gate-pty-lifecycle` skill or extend `run-gate-eval.sh`
with PTY-specific checks.

### GAP-SKILL-02: Hook Ordering Verification
**Severity:** HIGH
**Status:** OPEN
**Description:** No verification that hooks are registered in the correct
order in `plugin.ts`. Hook execution order matters for lifecycle correctness
(e.g., session-start observers must fire before tool guards).
**Impact:** Incorrect hook ordering may cause missed events or stale state reads.
**Workaround:** Manual review of `plugin.ts` event observer array ordering.
**Resolution:** Create an ordering validation that checks observer array
sequence against expected lifecycle phases.

### GAP-SKILL-03: Runtime Policy Validation
**Severity:** HIGH
**Status:** OPEN
**Description:** No independent verification of `runtimePolicy.ts` loading,
resolution, and override paths. Policy misconfiguration can bypass lifecycle
constraints (e.g., increasing MAX_DELEGATION_DEPTH).
**Impact:** Policy misconfiguration can silently bypass lifecycle constraints.
**Workaround:** Manual review of `runtime-policy.ts` and project-level overrides.
**Resolution:** Create a `gate-policy-compliance` skill that validates policy
loading and override semantics.

### GAP-SKILL-04: Session Recovery Validation
**Severity:** MEDIUM
**Status:** OPEN
**Description:** No verification that `recoverPending()` correctly handles all
delegation states (running, queued, terminal). Recovery guarantee compliance
not validated against execution mode (sdk vs pty vs headless).
**Impact:** Recovery failures may leave orphaned delegations.
**Workaround:** Manual inspection of `.hivemind/state/delegations.json` after
restart.
**Resolution:** Add recovery scenario tests to the evaluation script.

---

## Missing Agent Definitions

### GAP-AGENT-01: Lifecycle Auditor Agent
**Severity:** MEDIUM
**Status:** OPEN
**Description:** No dedicated `gate-lifecycle-auditor` agent for lifecycle gate
evaluation. Currently lifecycle audits require manual agent assignment by the
orchestrator.
**Impact:** Inconsistent lifecycle evaluation across sessions. Different agents
may apply rubrics differently.
**Workaround:** Orchestrator assigns a general code-reviewer agent with explicit
lifecycle instructions.
**Resolution:** Create `.opencode/agents/gate-lifecycle-auditor.md` with baked-in
lifecycle evaluation context, perspective rubrics, and routing knowledge.

### GAP-AGENT-02: Classification Enforcer Agent
**Severity:** MEDIUM
**Status:** OPEN
**Description:** No agent that proactively enforces root classification
(src/ vs .opencode/ vs .hivemind/) at file-creation time.
**Impact:** Files may be created in wrong root without detection until a gate
evaluation runs.
**Workaround:** Code review checklist includes classification verification.
**Resolution:** Create `.opencode/agents/classify-enforcer.md` that validates
new file placement against root rules.

---

## Missing Tools/Hooks

### GAP-TOOL-01: validate-lifecycle Tool
**Severity:** HIGH
**Status:** OPEN
**Description:** No harness-level `validate-lifecycle` tool that integrates
lifecycle verification into the SDK. Currently must run bash scripts
(`scripts/run-gate-eval.sh`) manually.
**Impact:** Lifecycle verification not integrated into the OpenCode tool
ecosystem. No standardized tool response envelope.
**Workaround:** Run `bash scripts/run-gate-eval.sh` from the Bash tool.
**Resolution:** Create `src/tools/validate-lifecycle.ts` with Zod schema,
tool registration in `plugin.ts`, and structured response via
`shared/tool-response.ts`.

### GAP-TOOL-02: classify-artifact Tool
**Severity:** MEDIUM
**Status:** OPEN
**Description:** No tool that classifies a file path into the correct root
(src/, .opencode/, .hivemind/) at creation time and warns if misclassified.
**Impact:** Reactive only — classification violations detected after the fact.
**Workaround:** Manual path validation during code review.
**Resolution:** Create `src/tools/classify-artifact.ts` that reads file path,
validates against classification rules, and returns a warning if misclassified.

### GAP-HOOK-01: file.created Lifecycle Hook
**Severity:** MEDIUM
**Status:** OPEN
**Description:** No hook that fires on file creation to proactively enforce
root classification. The harness has no mechanism to intercept file creation
events.
**Impact:** Reactive only — violations detected after the fact during gate eval.
**Workaround:** None currently — file creation is outside harness event scope.
**Resolution:** Explore whether OpenCode SDK exposes file-system events that
a hook could observe. If not, this gap may be inherent to the platform.

---

## Gap Resolution Log

Record closed gaps here with date and resolution details.

| Gap ID | Date Closed | Resolution | Impact |
|--------|-------------|------------|--------|
| <!-- none yet --> | | | |
