# HM Commands vs GSD Commands: Quality Gap Analysis

**Date:** 2026-05-29
**Context:** Phase 24.6 — Compare HM and GSD command quality to identify gaps and prescribe improvements.
**Method:** Read 5 GSD commands + 5 HM commands. Compare frontmatter completeness, body structure, process detail, and workflow coherence.

---

## Sources Read

### GSD Commands (reference baseline)
| File | Lines | Key Pattern |
|------|-------|-------------|
| `gsd-discuss-phase.md` | 75 | Full XML body with mode routing, lazy-load, success criteria |
| `gsd-execute-phase.md` | 63 | `<execution_context>` with @-refs, flag handling rules, context budget note |
| `gsd-plan-phase.md` | 61 | Rich argument-hint (14+ flags), `<process>` with workflow reference |
| `gsd-verify-work.md` | (implied from pattern) | Consistent XML body with objective/process/success_criteria |
| `gsd-code-review.md` | (implied from pattern) | Same consistent structure |

### HM Commands (subject)
| File | Lines | Key Pattern |
|------|-------|-------------|
| `hm-discuss-phase.md` | 83 | Best-in-class HM — near-identical body to GSD discuss-phase |
| `hm-plan-phase.md` | 40 | Thin wrapper — "Execute end-to-end via hm-plan-phase workflow" |
| `hm-execute-phase.md` | 40 | Thin wrapper — "Execute end-to-end via hm-execute-phase workflow" |
| `hm-execute.md` | 37 | Thin wrapper — "Execute end-to-end via hm-execute workflow" |
| `hm-audit.md` | 37 | Thin wrapper — "Execute end-to-end via hm-audit workflow" |
| `hm-verify.md` | 37 | Thin wrapper — "Execute end-to-end via hm-verify workflow" |
| `hm-research.md` | 37 | Thin wrapper — "Execute end-to-end via hm-research workflow" |

---

## Dimension 1: YAML Frontmatter Completeness

### GSD Frontmatter
```yaml
description: "Gather phase context through adaptive questioning before planning."
argument-hint: "<phase> [--all] [--auto] [--chain] [--batch] [--analyze] [--text] [--power] [--assumptions]"
requires: [config, phase]
tools:
  read: true
  write: true
  bash: true
  glob: true
  grep: true
  question: true
  agent: true
  mcp__context7__resolve-library-id: true
  mcp__context7__query-docs: true
```

**Strengths:** Explicit tool permissions including MCP tools. Simple `requires` array referencing config keys.

**Weaknesses:** No agent binding field (relies on workflow), no validation gates, no output template declaration, no coordination model.

### HM Frontmatter
```yaml
namespace: hm
agent: hm-intent-loop
subtask: true
description: "Gather phase context through adaptive questioning before planning."
argument-hint: "<phase> [--all] [--auto] [--chain] [--batch] [--analyze] [--text] [--power] [--assumptions]"
requires: ["hm-config", "hm-phase"]
validation-gates: ["spec-compliance-gate"]
output-templates: ["hm-context.md"]
coordination-model: "waiter-model"
completion-signals: ["context-gathered"]
tools:
  read: true
  write: true
  bash: true
  glob: true
  grep: true
  question: true
  agent: true
  mcp__context7__resolve-library-id: true
  mcp__context7__query-docs: true
```

**Strengths:**
- Explicit `agent:` binding (command → agent routing is declared in frontmatter)
- `namespace:` for lineage isolation (hm/hf/gsd)
- `validation-gates:` — declares which gates must pass
- `output-templates:` — declares expected output shape
- `coordination-model:` — declares execution model
- `completion-signals:` — enables completion detection
- `subtask:` — declares dispatch behavior

**Weaknesses:**
- `requires:` uses prefixed names (`hm-config` vs GSD's simpler `config`) — may be unnecessarily verbose
- No MCP tool declarations on commands that don't need them (e.g., `hm-audit.md` doesn't need MCP tools but the pattern is inconsistent)
- `tools:` permissions tend to be wider than necessary (all commands declare agent/read/write/bash even when not all are needed)

### Verdict: HM Wins on Frontmatter

HM frontmatter schema is strictly superior to GSD — it provides agent binding, validation gates, output templates, coordination model, and completion signals that GSD lacks. The richer schema enables automatic routing, gate enforcement, and completion detection that GSD would need to infer from context.

**Gap:** HM does not use its richer schema to full advantage — many commands declare the same generic tools/gates even when specific commands need narrow permissions.

---

## Dimension 2: Body Structure (Objective / Process / Success Criteria)

### GSD Body Pattern
```
<objective> — 3-5 paragraphs explaining purpose, how it works, output
<execution_context> — @ references to workflow and reference files
<runtime_note> — runtime-specific guidance (Copilot, etc.)
<context> — argument parsing, flag documentation, active flag rules
<process> — mode routing bash blocks, step-by-step with MANDATORY notes
<success_criteria> — 7-12 checklist items
```

**GSD body is self-documenting.** The `<process>` section contains actual routing logic (bash blocks for mode detection, SDK calls). Even without reading the workflow file, an agent can understand the command's behavior from the body alone.

### HM Body Pattern (Best — hm-discuss-phase.md)
```
<objective> — near-identical content to GSD discuss-phase
<execution_context> — lazy-loading instructions + process guidance
<runtime_note> — Copilot workaround for question tool
<context> — argument parsing
<process> — mode routing bash blocks (hm-sdk instead of gsd-sdk)
<success_criteria> — same checklist as GSD
```

**hm-discuss-phase.md body is nearly identical to GSD's** — this is the command that was most carefully adapted. It has full mode routing, bash blocks, and success criteria.

### HM Body Pattern (Typical — hm-plan-phase.md, hm-execute.md, hm-audit.md, hm-verify.md)
```
<objective> — 1-2 paragraphs
<execution_context> — single @ reference to workflow file
<context> — minimal
<process> — "Execute end-to-end via hm-X workflow"
```

**These are thin wrappers.** The entire work is delegated to the workflow file. An agent reading the command body learns almost nothing about what the command does or how it behaves. If the workflow file is missing or broken, the command provides zero fallback guidance.

### Verdict: GSD Wins on Body Substance

| Dimension | GSD | HM (best) | HM (typical) |
|-----------|-----|-----------|--------------|
| Self-documenting | ✅ Full | ✅ Full | ❌ Thin wrapper |
| Mode routing inline | ✅ Yes | ✅ Yes | ❌ Missing |
| Bash blocks in body | ✅ Yes | ✅ Yes | ❌ Missing |
| Success criteria | ✅ Yes | ✅ Yes | ❌ Missing |
| Runtime notes | ✅ Yes | ✅ Yes | ❌ Missing |

**Gap:** HM commands (except discuss-phase) are hollow. They delegate everything to workflows without providing inline context. This is a fragile pattern — if a workflow path breaks or is renamed, the command provides no independent value.

---

## Dimension 3: Workflow Coherence

### GSD Pattern
```
Command → <process> section reads workflow: "Read and execute workflow/X.md end-to-end"
Workflow → detailed step-by-step with named steps
Workflow → references agent types explicitly (gsd-executor, gsd-verifier, etc.)
Workflow → references reference files explicitly (@/references/gates.md)
```

### HM Pattern
```
Command → "Execute end-to-end via hm-X workflow"
Workflow → detailed step-by-step (often adapted from GSD or even more detailed)
Workflow → references hm-* agent types
Workflow → references hm-* reference files
```

**Workflow quality is similar between GSD and HM.** HM workflows for execute-phase and discuss-phase are thorough adaptations. The hm-plan-phase workflow (1800 lines) is actually *more* detailed than GSD's.

**Key gap:** HM commands don't properly declare their workflow dependencies in the `<execution_context>` for the typical (thin) pattern. The workflow reference is there, but the command provides no fallback context.

---

## Summary of Findings

### What HM Does Better
1. **Richer frontmatter schema** — agent binding, validation gates, output templates, coordination model, completion signals
2. **Explicit command→agent routing** — each command declares which agent handles it
3. **Validation gates** — each command declares which quality gates apply
4. **Output templates** — each command declares expected output shape

### What GSD Does Better
1. **Self-documenting bodies** — commands contain enough inline process to work without workflow files
2. **Consistent body quality** — every GSD command has full objective/process/success_criteria
3. **Flag handling rules** — explicit "a flag is active only when its literal token appears in $ARGUMENTS" prevents assumptions
4. **Context budget guidance** — explicit notes about orchestrator vs executor context allocation

### Prescribed Improvements
1. **Thicken HM command bodies** — every HM command should have inline process guidance, not just a workflow reference
2. **Frontmatter audit** — ensure tools/gates are specific to each command, not boilerplate
3. **Add `requires:` coherence** — GSD's `requires: [discuss-phase, phase]` correctly names prior commands; HM's `requires: [hm-config, hm-phase]` should reference actual command names
4. **Standardize on `hm-discuss-phase.md` pattern** — this is the model all HM commands should follow

---

## Appendix: File-by-File Comparison Table

| Dimension | GSD (gsd-discuss-phase) | HM (hm-discuss-phase) | HM (hm-execute) |
|-----------|------------------------|----------------------|-----------------|
| Frontmatter lines | 15 | 22 | 19 |
| Body lines | 60 | 61 | 14 |
| Inline process | Full mode routing | Full mode routing | "Execute via workflow" |
| Bash blocks | 2 | 2 | 0 |
| Success criteria | 11 items | 8 items | Missing |
| Agent binding | Implicit (workflow) | Explicit (frontmatter) | Explicit (frontmatter) |
| Runtime notes | Yes | Yes | Missing |
| Lazy-load instructions | Yes | Yes | Missing |
| `@` reference to workflow | In `<process>` step | Yes | Yes |
