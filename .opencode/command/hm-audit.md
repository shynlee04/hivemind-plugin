---
namespace: hm
agent: hm-nyquist-auditor
subtask: false
description: "Run codebase and primitive audit to identify structure drift, orphaned configurations, or type check warnings."
argument-hint: "[--strict] [--fix]"
requires: []
validation-gates: ["lifecycle-gate"]
output-templates: ["hm-summary.md"]
coordination-model: "waiter-model"
completion-signals: ["audit-completed"]
tools:
  read: true
  write: true
  bash: true
  glob: true
  grep: true
  agent: true
---

<objective>
Audit workspace structure, config schemas, session lineage, and primitive health against harness rules — producing a structured report with PASS/FAIL/WARNINGS verdict.

**How it works:**
1. Parse $ARGUMENTS for mode flags (--strict escalates warnings to failures; --fix enables auto-repair of recoverable issues)
2. Audit directory structure — verify Tier-1 paths under `.hivemind/` and `.planning/`, check `.gitkeep` coverage
3. Validate config schemas — compare runtime configs against compiled schema definitions
4. Trace session lineage — scan `.hivemind/session-tracker/` for orphaned sessions, broken parent refs, incomplete journals
5. Run health diagnostics — TypeScript compilation check, unit test suite, primitive registration integrity
6. Compile verdict — produce structured report mapping each check to PASS/FAIL/WARNINGS with file:line evidence

**Output:** audit report committed to workspace — actionable for hm-doctor and hm-gate remediation workflows
</objective>

<execution_context>
Workflow files are loaded on-demand in the <process> section below — not upfront.
Do not pre-load any workflow files before reading the mode routing instructions.
</execution_context>

<context>
Flags: $ARGUMENTS
  --strict    Treat all warnings as errors (non-zero exit on any finding)
  --fix       Enable automatic repair of recoverable issues (missing .gitkeep, orphan cleanup)

Namespace: hm
Routed Agent: hm-nyquist-auditor
Validation gates configured: lifecycle-gate (scoped audit outputs feed into the full gate triad)
</context>

<process>
**Mode routing:**
```bash
AUDIT_MODE=$(hm-sdk query config-get workflow.audit_mode 2>/dev/null || echo "standard")
STRICT_FLAG=$(echo "$ARGUMENTS" | grep -q -- "--strict" && echo "true" || echo "false")
FIX_FLAG=$(echo "$ARGUMENTS" | grep -q -- "--fix" && echo "true" || echo "false")
```

If `--help` or `-h` is in $ARGUMENTS:
  Print usage: `hm-audit [--strict] [--fix]`
  Describe modes and exit.

Otherwise:
  Read and execute `.opencode/workflows/hm-audit.md` end-to-end.

  The workflow processes audit domains in sequence:
  1. **Initialize** — parse flags, resolve workspace root, set strict/fix modes
  2. **Structure audit** — scan `.hivemind/`, `.planning/`, `.opencode/` for missing directories, broken `.gitkeep` files, stale artifacts
  3. **Config audit** — validate `configs.json` against compiled `configs.schema.json`; verify `package.json` version against `.hivemind/state/version.json`
  4. **Session lineage audit** — scan session-tracker for active/pending sessions, verify parent-child refs, detect orphans
  5. **Health check execution** — run `npx tsc --noEmit` for type errors, `npm run test` for correctness; check primitive discoverability via `validate-restart`
  6. **Gate-triad scope check** — flag findings that correspond to lifecycle-gate violations (surface ownership drift), spec-compliance gaps (missing output templates), or evidence-truth failures (stale or missing verification artifacts)
  7. **Generate report** — compile all findings into a structured report with PASS/FAIL/WARNINGS per check domain
  8. **Auto-repair (if --fix)** — write missing `.gitkeep` files, archive orphaned sessions, close stale journals
  9. **Commit results** — stage and commit the audit report

  When `--strict` is active:
  - Every WARNINGS-level finding is elevated to FAIL
  - The process exits with a non-zero code if any FAIL exists
  - No auto-repair is attempted — report-only mode

**MANDATORY:** Read the workflow file BEFORE taking any action. The objective and success_criteria sections here are summaries — the workflow file contains the complete step-by-step process.

**Gate-triad integration:** Audit outputs feed into the three-gate pipeline:
1. **lifecycle-gate** → surface/mutation authority violations. Source: `.opencode/references/hm-gate-triad.md`
2. **spec-compliance-gate** → gap detection (missing templates, undeclared outputs)
3. **evidence-truth-gate** → stale or missing verification artifacts

The audit covers all three dimensions but does not itself gate — it produces evidence for downstream gate execution.
</process>

<success_criteria>
- All Tier-1 directories under `.hivemind/`, `.planning/`, and `.opencode/` verified present
- Config schema vs. runtime config comparison completed with no mismatches
- Session lineage traced — all child sessions link to valid parents, no orphans
- TypeScript compilation check run (`npx tsc --noEmit`) — pass/fail captured
- Unit test suite run — pass/fail captured per test file
- Primitive registration scan (agents, commands, skills) — discoverability confirmed
- Gate-triad scope cross-referenced — lifecycle, spec, and evidence categories flagged
- Structured audit report generated with file:line evidence per finding
- `--strict` mode correctly escalates warnings to failures with non-zero exit
- `--fix` mode repairs recoverable issues (`.gitkeep`, orphan archiving) without touching code
- Report committed to workspace for downstream hm-doctor and hm-gate consumption
</success_criteria>
