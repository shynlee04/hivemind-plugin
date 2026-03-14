# Hivefiver Denoise Governance Plan (2026-03-03)

## Goal

Reduce context poisoning by shrinking entry-skill surface, clarifying hivefiver role boundaries,
and separating META framework planning from PROJECT planning with deterministic export/gate flow.

## Recommended Rollout

Use a multi-round, approval-gated rollout (safe + reversible):

1. Round 1 - Entry denoise and contradiction cleanup
2. Round 2 - Plan hierarchy normalization (META vs PROJ)
3. Round 3 - Tooling integration (`hiveops_todo`, `hiveops_sot`, `hiveops_gate`, `hiveops_export`)
4. Round 4 - Strict upstream/downstream handoff enforcement

Each round ends with explicit approval before continuing.

---

## Option Analysis

### Option A (Recommended): Metadata-First Layering
- First normalize skill entry/routing metadata and plan schemas.
- Then wire runtime enforcement and export contracts.
- Lowest blast radius, fastest rollback.

### Option B: Integration-First
- Wire tools/hooks first, normalize schemas later.
- Higher risk due hidden coupling.

### Option C: Big Bang
- Single cutover across skills + hooks + plans + exports.
- Highest risk, hardest rollback.

Recommendation: **Option A**.

---

## Round Details

## Round 1 - Entry Denoise (Safe)

### Objective
- Keep about 10 top-level entry skills total.
- Keep exactly 2 direct hivefiver entries: `hivefiver-prime` -> `hivefiver-mode`.
- Convert `hivefiver-context-enforcer` into a conditional helper (degraded/recovery only).

### Files
- `.opencode/agents/hivefiver.md`
- `agents/hivefiver.md`
- `.opencode/skills/hivefiver-prime/SKILL.md`
- `.opencode/skills/hivefiver-mode/SKILL.md`
- `.opencode/skills/hivefiver-context-enforcer/SKILL.md`

### Acceptance
- No conflicting "mandatory first/second load" claims.
- Startup path is deterministic and bash-agnostic for blind hivefiver.
- Entry order is explicit and stable.

### Rollback
- Revert only the five files above.

---

## Round 2 - Hierarchy Paths (META vs PROJ)

### Objective
- Normalize `.hivemind/plans/` into explicit META and PROJ lanes.
- Preserve simple Markdown + YAML frontmatter (no custom DB/parser).

### Acceptance
- Deterministic traversal: open -> routing -> branch -> pivot -> completion -> close.
- Every plan node has `id`, `parent`, `status`, `priority`, `created`, `last_sync`.

### Rollback
- Revert plan files and manifest entries only.

---

## Round 3 - Tooling Integration

### Objective
- Map plan transitions to tool actions:
  - planning state -> `hiveops_todo`
  - artifact registration -> `hiveops_sot`
  - quality gates -> `hiveops_gate`
  - handoff/checkpoint -> `hiveops_export`

### Acceptance
- Each transition emits deterministic artifacts.
- Gate pass/fail evidence is linked from plan nodes.

### Rollback
- Disable integration calls and keep plan artifacts read-only.

---

## Round 4 - Export and Session Enforcement

### Objective
- Enforce upstream/downstream handoff contracts before phase close.
- Require checkpoint + residual risk + next deterministic action.

### Acceptance
- No close operation without export artifact.
- Compaction recovery context remains consistent with handoff payload.

### Rollback
- Downgrade enforcement to warnings while preserving logs.

---

## Parallelization Guidance

- Parallel-safe:
  - Skill wording cleanup in separate files.
  - Plan metadata cleanup independent of hook code.
- Sequential-required:
  - Plugin hook behavior changes.
  - Enforcement activation after schema/tool mappings stabilize.

## First Safe Slice (Implemented)

- Entry routing denoise started in Round 1.
- Context-enforcer repositioned as conditional helper.
- Hivefiver startup guidance shifted from direct bash execution to delegated evidence flow.
