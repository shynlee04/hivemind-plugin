[LANGUAGE: Write this file in en per Language Governance.]
# Test-Driven Governance Update — Landscape

**Session:** ses_16a7b4487ffeBZ12xqaWkx7d1k
**Date:** 2026-06-05
**L0 Orchestrator:** hm-l0-orchestrator
**Path Type:** coordinated-path (multi-domain: Research + Documentation + Governance Application + Quality)
**Lineage Routing:** gsd-* tooling agents (this project is the harness under development; hm-*/hf-* are subjects of development, not developers of it)

---

## 1. Task Summary

Update two governance files with a test-driven section, and produce a GENERIC (project-agnostic) test-driven guidance artifact for reuse across any project.

**Targets:**
- `AGENTS.md` (40,854 bytes) — add a "Test-Driven Development" section
- `.opencode/rules/universal-rules.md` (7,454 bytes) — add a test-driven portion

**Deliverable:**
- The two updated governance files
- A GENERIC, project-agnostic test-driven skill/guidance artifact in `.hivemind/planning/test-driven-governance-2026-06-05/GENERIC-TEST-DRIVEN-GUIDE.md` (or similar) that can be lifted into any project

**Source of Truth:** `hm-l2-test-driven-execution` skill at `.opencode/skills/hm-l2-test-driven-execution/` — extract its project-agnostic principles.

**Constraint:** Content must remain GENERIC — no Hivemind-specific delegation/agent jargon in the extracted skill. The application to AGENTS.md / universal-rules.md can reference Hivemind specifics; the GENERIC skill artifact must not.

---

## 2. Domain Breakdown & Specialist Mapping

| Domain | Wave | Specialist | Purpose |
|---|---|---|---|
| **Research** | W1 | `gsd-phase-researcher` (or `gsd-domain-researcher`) | Read `hm-l2-test-driven-execution` SKILL.md + references (red-green-refactor, coverage-verification, source-synthesis) + templates + workflows; extract GENERIC principles |
| **Documentation** | W2 | `gsd-doc-writer` | Author the GENERIC test-driven guidance artifact (project-agnostic, reusable) |
| **Documentation** | W3 | `gsd-doc-writer` | Apply test-driven section to `AGENTS.md` (atomic, scoped add) |
| **Documentation** | W4 | `gsd-doc-writer` | Apply test-driven portion to `.opencode/rules/universal-rules.md` (atomic, scoped add) |
| **Quality** | W5 | `gsd-verifier` | Goal-backward verification: does the update achieve the user's stated goal? Cross-check content vs source skill |
| **Quality** | W6 | (gate triad) | AQUAL/quality-triad-style review: lifecycle → spec → evidence on outputs |

**Wave ordering:**
- W1 (research) is sequential predecessor to W2, W3, W4
- W2 can run in parallel with W3/W4 after W1 completes (different artifacts, no conflict)
- W5 depends on W2, W3, W4 all complete
- W6 depends on W5

---

## 3. Delegation Path Decision

**Path:** coordinated-path
**Rationale:**
- 6 sub-tasks across 4 domains (Research, Documentation, Quality, Architecture-via-Application)
- Dependent waves (W1 → W2/W3/W4 → W5 → W6)
- High-stakes governance files (mistakes propagate to all agents)
- Output must be SYNTHESIZED to be GENERIC, not just copied — requires writer + researcher

**Why not fast-path:** Too many independent sub-deliverables; L0 cannot decompose inline without violating execution_banned.

**Why not hf-coordinator:** Not a meta-concept (agent/skill/command authoring) task; this is governance doc update — hm-/gsd- domain only.

---

## 4. Output Contracts Per Sub-Deliverable

### W1: Research Artifact
- **Path:** `.hivemind/planning/test-driven-governance-2026-06-05/01-research-findings.md`
- **Format:** Structured extraction of GENERIC principles from `hm-l2-test-driven-execution`
- **Content:** 5-10 distilled principles, each with: principle, source location (file:line in skill), example, anti-pattern
- **Gate:** Must NOT reference Hivemind/agents/SDK/delegation — purely software-engineering TDD doctrine

### W2: Generic Skill Artifact
- **Path:** `.hivemind/planning/test-driven-governance-2026-06-05/GENERIC-TEST-DRIVEN-GUIDE.md`
- **Format:** Reusable skill/guide in same shape as hm-* skills (description, when-to-use, core principles, workflows, templates, anti-patterns)
- **Content:** Project-agnostic, copy-paste-ready for any project

### W3: AGENTS.md Section
- **Path:** append to `/Users/apple/hivemind-plugin-private/AGENTS.md`
- **Format:** New "## Test-Driven Development" section before the final metadata/footer
- **Content:** Brief section (~50-150 lines) with Hivemind-specific anchors + reference to GENERIC guide

### W4: universal-rules.md Section
- **Path:** append to `/Users/apple/hivemind-plugin-private/.opencode/rules/universal-rules.md`
- **Format:** New test-driven portion (rule 7 or similar) — TDD discipline as a universal rule
- **Content:** Concise, normative, enforceable

### W5: Verification Report
- **Path:** `.hivemind/planning/test-driven-governance-2026-06-05/05-verification.md`
- **Format:** Goal-backward: does each output achieve its stated goal? Evidence: file:line, section location
- **Gate:** All 3 outputs must be GENERIC-leaning (the test-driven doctrine) + on-brand (Hivemind governance style)

---

## 5. Quality Gate Expectations

- **Lifecycle gate:** Sections placed in correct files, correct directories, no collisions
- **Spec gate:** Content matches user's request verbatim — test-driven portion, generic skill, both files updated
- **Evidence gate:** Atomic commits per file; file:line evidence; before/after diff summary; reference links between artifacts

---

## 6. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| AGENTS.md bloat (already 40KB) | Insert concise section (~50-100 lines) + reference external GENERIC guide |
| Content drifts Hivemind-specific into GENERIC artifact | W1 research must explicitly strip Hivemind jargon |
| Two files become inconsistent | Same source skill (hm-l2-test-driven-execution) feeds both; shared vocabulary section in W1 |
| Subagent over-edits existing content | Strict scope: APPEND new section, do not modify existing |

---

## 7. Final Acceptance

All three deliverables present + content gate passes:
1. `.hivemind/planning/test-driven-governance-2026-06-05/GENERIC-TEST-DRIVEN-GUIDE.md` exists and is project-agnostic
2. `AGENTS.md` has a test-driven section
3. `.opencode/rules/universal-rules.md` has a test-driven portion
4. Atomic git commits per change
5. Verification report at `.hivemind/planning/test-driven-governance-2026-06-05/05-verification.md` passes

---

[LANGUAGE: Write this file in en per Language Governance.]
## 8. Delegation Tracking

- To be updated in `.hivemind/state/delegations.json` after each wave returns
- Session ID: `ses_16a7b4487ffeBZ12xqaWkx7d1k`
- Depth: 0 → 1 (coordinator) → 2 (specialists)
- Path: coordinated-path via gsd-coordinator (or gsd-executor as direct subagent if no coordinator)

---

## 9. PIVOT — Source-vs-Deploy Architectural Correction (2026-06-05)

### Trigger
After W1-W6 of the original plan completed and all 5 atomic commits landed (4a620d93, 40a33480, 653bd0e0, 8cc7006b, ef98dea1), user flagged:
> "changes you made will be erased after `npm rebuild` they must be made with sync schema and bootstrap set up for skills and unversal-rules since I have rebuilt pretty much everything above gone"

### Violation
W3/W4 (original gsd-executor session `ses_16a6f81d4ffeJTPAbYRU2z6Ul3`) edited DEPLOYED layer directly:
- `AGENTS.md` (root) — DEPLOYED
- `.opencode/rules/universal-rules.md` — DEPLOYED
- `.opencode/skills/hm-l2-test-driven-execution/` — DEPLOYED

This violates AGENTS.md §"CONSTITUTION: Source vs Deploy":
> "NEVER develop directly in `.opencode/`. Development workflow: edit in `assets/` → run `node scripts/sync-assets.js` → verify in `.opencode/`."

The 5 commits survive in git history but will be WIPED on `npm rebuild` or fresh `node scripts/sync-assets.js` invocation.

### User Decision (clarification question answered)
**Option (a) — Source-level re-apply + sync (Recommended)**

### Corrected Wave DAG (re-dispatched, stacked on ses_16a6f81d4ffeJTPAbYRU2z6Ul3)

| Wave | Domain | Action | Output Artifact |
|------|--------|--------|-----------------|
| W1 | Research (source-map) | Inspect `assets/`, `scripts/sync-assets.js`, `.hivefiver-meta-builder/`, `.opencode/` to determine source-of-truth for skills, rules, AGENTS.md | `02-source-map.md` |
| W2 | Source Edits | Per W1 findings, edit SOURCE files with test-driven content (from 01-research + GENERIC-TEST-DRIVEN-GUIDE). Atomic commit per source file at source layer. | Source files updated + atomic commit(s) |
| W3 | Sync Exec | Run `node scripts/sync-assets.js`. Capture stdout/stderr. | `03-sync-execution.log` |
| W4 | Deployed Verify | Read `.opencode/rules/universal-rules.md`, root `AGENTS.md`, `.opencode/skills/hm-l2-test-driven-execution/SKILL.md`. Confirm content matches source. Atomic commit for any sync-induced changes to deployed layer. | `04-deployed-verification.md` |
| W5 | Resilience | Re-invoke `node scripts/sync-assets.js` to confirm idempotence. Document. | `05-resilience-test.md` |
| W6 | Gate Triad | Lifecycle → Spec → Evidence on all outputs. Self-claim with file:line evidence. | `06-gate-triad.md` |

### Revised Final Acceptance
1. `.hivemind/planning/test-driven-governance-2026-06-05/02-source-map.md` — source layout + sync schema discovery
2. Source files updated at their source-of-truth locations
3. `.hivemind/planning/test-driven-governance-2026-06-05/03-sync-execution.log` — sync stdout/stderr
4. `.hivemind/planning/test-driven-governance-2026-06-05/04-deployed-verification.md` — deployed layer verification with file:line evidence
5. `.hivemind/planning/test-driven-governance-2026-06-05/05-resilience-test.md` — idempotence proof
6. `.hivemind/planning/test-driven-governance-2026-06-05/06-gate-triad.md` — gate verdicts
7. Atomic git commits at source layer + sync output layer
8. Re-running `node scripts/sync-assets.js` regenerates test-driven content (does NOT wipe it)

---

## 10. Re-dispatch Tracking

- **Stacked on:** `ses_16a6f81d4ffeJTPAbYRU2z6Ul3` (gsd-executor, completed) — preserves prior context
- **L0 session ID:** `ses_16a7b4487ffeBZ12xqaWkx7d1k` (unchanged)
- **Path type:** coordinated-path (re-dispatch with corrected wave DAG)
- **Status:** IN PROGRESS — dispatched at 2026-06-05
- **Waves status:** W1-W6 to be tracked here as they return
