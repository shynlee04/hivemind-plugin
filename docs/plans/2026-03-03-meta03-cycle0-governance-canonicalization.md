# META03 Cycle 0 — Governance Canonicalization Execution Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Resolve 4 governance conflicts validated by cross-team synthesis.

**Architecture:** Sequential atomic fixes, each gated by verification before proceeding.

**Tech Stack:** TypeScript (types.ts), Markdown (skills, agents), bash (verification)

---

## Task 1: F1 — Delegation Depth Alignment

**Files:**
- Modify: `.opencode/plugin/hiveops-governance/types.ts:66-67`

**Step 1: Apply fix**
Change lines 66-67 from:
```typescript
    maxDepth: 3,
    recursive: true,
```
to:
```typescript
    maxDepth: 1,
    recursive: false,
```

**Step 2: Verify TypeScript compiles**
Run: `npx tsc --noEmit`
Expected: No errors related to types.ts

**Step 3: Verify alignment with agent profile**
Run: `grep -A2 "max_delegation_depth\|recursive_delegation" agents/hiveminder.md`
Expected: Both values match (depth=1, recursive=false)

**Step 4: Gate checkpoint**
- [ ] tsc passes
- [ ] Values match agent profile
- [ ] No other files reference maxDepth:3 for hiveminder

---

## Task 2: F3 — Hierarchy Path Canonicalization

**Files:**
- Modify: `.opencode/skills/session-lifecycle/SKILL.md:174`

**Step 1: Apply fix**
Change line 174 from:
```markdown
- `.hivemind/hierarchy.json` — Tree hierarchy (source of truth)
```
to:
```markdown
- `.hivemind/state/hierarchy.json` — Tree hierarchy (source of truth)
```

**Step 2: Verify no remaining stale references in active skills**
Run: `grep -r "\.hivemind/hierarchy\.json" .opencode/skills/ --include="*.md" | grep -v state/`
Expected: Zero matches (all use state/ path)

**Step 3: Gate checkpoint**
- [ ] Line updated
- [ ] No stale refs in active skills
- [ ] Canonical path matches src/lib/paths.ts

---

## Task 3: F4 — Prime-First Load Order

**Files:**
- Modify: `agents/hivefiver.md:94`

**Step 1: Apply fix**
Change line 94 from:
```markdown
**EVERY STARTING TURN: Load `hivefiver-mode` and `hivefiver-coordination` skills FIRST.**
```
to:
```markdown
**EVERY STARTING TURN: Load `hivefiver-prime` skill FIRST — it bootstraps role boundaries, session hierarchy, and decides which skills load next (typically `hivefiver-mode` and `hivefiver-coordination`).**
```

**Step 2: Verify hivefiver-prime exists and declares first-load**
Run: `head -15 .opencode/skills/hivefiver-prime/SKILL.md`
Expected: Contains "MANDATORY first-load" and "Load this BEFORE any other skill"

**Step 3: Gate checkpoint**
- [ ] Line updated
- [ ] Prime skill exists and is designed for first-load
- [ ] No conflicting load-order instructions elsewhere in hivefiver.md

---

## Task 4: F2 — Session Boundary Deadlock Resolution

**Files:**
- Modify: `.opencode/skills/hivemind-governance/SKILL.md:147` (insert after)

**Step 1: Apply fix**
After line 147 (`- WAIT "yes/proceed" before executing`), insert:

```markdown

**Sub-session exception:** Delegated sub-sessions (agents dispatched via Task
tool with explicit delegation packets) execute within their packet scope
WITHOUT user confirmation. The parent session's dispatch approval serves as
the authorization gate. Sub-sessions MUST still STATE intent and capture
evidence, but do NOT wait for interactive confirmation.
```

**Step 2: Verify no contradiction with hiveminder.md sub-session policy**
Run: `grep -A2 "Sub-session\|sub-session\|sub_session" agents/hiveminder.md`
Expected: Aligns — hiveminder says sub-sessions "do not ask user for confirmation"

**Step 3: Verify governance skill still mandates confirmation for main sessions**
Read: SKILL.md section 8 after edit — main session rules unchanged.

**Step 4: Gate checkpoint**
- [ ] Exception added
- [ ] Main session governance intact
- [ ] Sub-session policy aligned with hiveminder.md
- [ ] No other skills reference section 8 conflictingly

---

## Task 5: D1 — Contract Matrix Deliverable

**Files:**
- Create: `.hivemind/plans/governance-contract-matrix-2026-03-03.md`

**Contents:** All 4 conflicts with before/after values, evidence sources, resolution rationale, cross-reference map, and Cycle 1 prerequisites.

**Gate checkpoint:**
- [ ] All 4 conflicts documented
- [ ] Before/after values match actual changes
- [ ] Cross-references verified

---

## Task 6: Full Verification

**Step 1:** `npx tsc --noEmit`
**Step 2:** `npm test` (if tests exist for governance)
**Step 3:** Verify META03-PLAN.md status table updated
**Step 4:** Export session checkpoint for Cycle 1 handoff
