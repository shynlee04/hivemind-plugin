# Phase 24 — Cross-Phase Incoherence Report

**Analysis Date:** 2026-05-29  
**Scope:** Phase-to-phase contradiction analysis across 5 phase directories  
**Evidence Level:** L2-L3 (source read, grep, file comparison)

---

## Incoherence Matrix

| # | Conflict | Phases Involved | Severity | Type |
|---|----------|-----------------|----------|------|
| I-01 | Agent naming convention: `hm-l2-*` vs `hm-*` | 24.1 ↔ 24.3.1 | 🔴 HIGH | Direct contradiction |
| I-02 | `renderToolResult()` existence claim | 24.3.2 ↔ 24.3.1 | 🔴 HIGH | Factual contradiction |
| I-03 | Module size cap claim vs reality | 24.3.2 ↔ 24.3.3 | 🔴 HIGH | Broken constraint chain |
| I-04 | Namespace routing deferral chain | 24.3.2 ↔ 24.3.3 | 🟡 MEDIUM | Buck-passing pattern |
| I-05 | Session tool move scope discrepancy | 24.3.2 SPEC ↔ 24.3.2 PLAN | 🟡 MEDIUM | Internal inconsistency |
| I-06 | Root phase empty, sub-phases orphaned | 24 (root) ↔ ALL | 🔴 HIGH | Structural gap |
| I-07 | Agent count claim vs actual | 24.1 ↔ live code | 🟡 MEDIUM | Claim inconsistency |
| I-08 | `namespace` field purpose misalignment | 24.3.3-SPEC ↔ 24.3.3 schema code | 🟢 LOW | Semantic drift |

---

## I-01: Agent Naming Convention: `hm-l2-*` vs `hm-*` (🔴 HIGH)

### Conflict
**Phase 24.1** renamed all agents to drop the `-lX-` tier suffix (e.g., `hm-l2-executor` → `hm-executor`).  
**Phase 24.3.1** created a governance config that references agents using the OLD `-l2-` naming convention.

### Evidence
**Phase 24.1 (claim):**
```markdown
# 24.1-RESEARCH.md, line 381
| File naming | hm-l2-{name}.md | hm-{name}.md |
```

**Phase 24.3.1 (reality):**
```json
// .hivemind/governance/config.json
"defaultAgent": "hm-l2-scout",          // 🚨 doesn't exist in .opencode/agents/
"agents": {
  "hm-l2-scout": { ... },               // 🚨 doesn't exist
  "hm-l2-researcher": { ... },          // 🚨 doesn't exist
  "hm-l2-debugger": { ... },            // 🚨 doesn't exist
  "hm-l2-reviewer": { ... },            // 🚨 doesn't exist
  "hm-l2-architect": { ... },           // 🚨 doesn't exist
  "hm-l2-synthesizer": { "description": "Research synthesis" },  // 🚨 doesn't exist
  "hm-l2-spec-verifier": { ... },       // 🚨 doesn't exist
  "hm-l2-planner": { ... },             // 🚨 doesn't exist
  "hm-l2-auditor": { ... }              // 🚨 doesn't exist
}
```

### Impact
The `create-governance-session` tool relies on `resolveAgentForBrief()` which scans `config.agents`. ALL 9 agent entries in the governance config reference names that don't exist in `.opencode/agents/`. This means governance dispatch to named agents will silently fail or fall back to a default that is also wrong (`hm-l2-scout`).

### Root Cause
Phase 24.3.1's Plan 05 was researched and planned BEFORE Phase 24.1's agent renaming was complete. The config was seeded with the old naming convention and never updated.

---

## I-02: `renderToolResult()` Existence Claim (🔴 HIGH)

### Conflict
**Phase 24.3.2-SPEC.md** explicitly states `renderToolResult()` does NOT exist in the codebase.  
**Phase 24.3.1** created code that HEAVILY USES `renderToolResult()`.

### Evidence
**Phase 24.3.2-SPEC.md, line 37:**
```markdown
> Note: `renderToolResult()` does NOT exist in codebase. PATTERNS.md and earlier
> SPEC drafts incorrectly referenced it. All 23 other tools in `src/tools/` return
> raw `{ output, metadata }` shape directly.
```

**Phase 24.3.1's `create-governance-session.ts` (completed BEFORE 24.3.2 research):**
```typescript
// line 40
import { renderToolResult } from "../../shared/tool-helpers.js"

// line 98 — used in error path
return renderToolResult(
  error(`[Harness] Invalid governance session input: ...`)
)

// line 168 — used in error path
return renderToolResult(
  error(`[Harness] Failed to create governance session: ...`)
)

// line 244 — used in success path
return renderToolResult(
  success(`[Harness] Governance session created: ...`, {
    sessionID,
    title: sessionTitle,
  })
)
```

**Phase 24.3.2-SPEC.md, line 156-157 (acceptance criteria):**
```markdown
- [ ] `renderToolResult()` used in all success paths (2 matches in grep)
- [ ] `renderToolResult()` used in all error paths (2 matches in grep)
```

### Impact
The SPEC's foundational claim that `renderToolResult()` "does NOT exist" is factually wrong. The acceptance criteria then contradict themselves by requiring `renderToolResult()` usage. This suggests the SPEC draft was written without reading the codebase that Phase 24.3.1 had already modified. The "23 other tools" count is also suspicious — if `renderToolResult()` exists and is used by 24.3.1's tool, the count should be "22 other tools."

### Root Cause
Phase 24.3.2 was researched and specified without reading the implementation created by Phase 24.3.1. The phases ran in parallel or the 24.3.2 specification was based on a stale codebase snapshot.

---

## I-03: Module Size Cap Claim vs Reality (🔴 HIGH)

### Conflict
**Phase 24.3.2** mandates module size ≤ 500 LOC.  
**Phase 24.3.3** claims to have reduced execute-slash-command.ts from 527→402 LOC.  
**Actual code** shows 631 LOC.

### Evidence
**Phase 24.3.2-SPEC.md, line 142:**
```markdown
Module size must stay under 500 LOC cap — estimate after refactor: ~460 LOC
(current 372 + ~90 LOC for schema/validation/metadata helpers)
```

**Phase 24.3.3-01-SUMMARY.md, line 15:**
```markdown
6. execute-slash-command.ts — Refactored from 527→402 LOC, imports from new modules
```

**Actual (2026-05-29):**
```bash
$ wc -l src/tools/session/execute-slash-command.ts
631
```

### Impact
Three contradictory statements about the same file:
1. 24.3.2 SPEC says target is ≤ 500 LOC
2. 24.3.3 SUMMARY says current is 402 LOC
3. Actual file is 631 LOC

Either the 402 claim was false, or subsequent changes (24.3.3 Plan 02's semantic-agent-selector integration + workflow-parser) added 229 LOC without updating the summary. This violates the atomic verification promise.

### Root Cause
Summary documents were not updated after additional work was layered on. The 402 LOC claim was likely the state immediately after Plan 01 of 24.3.3, but Plan 02 bloated it back up.

---

## I-04: Namespace Routing Deferral Chain (🟡 MEDIUM)

### Conflict
**Phase 24.3.2** defers namespace routing to 24.3.3.  
**Phase 24.3.3** also defers namespace routing ("placeholder only").  

### Evidence
**Phase 24.3.2-SPEC.md, lines 77-82:**
```markdown
> **Deferred to P24.3.3** (namespace routing — no pain signal at ~90 commands...)
> - REQ-9: Namespace frontmatter field (`gsd | hf | test | core`)
> - REQ-10: `resolveCommandNamespace()` read-side method on command-engine
```

**Phase 24.3.3-SPEC.md, lines 31-34:**
```markdown
3. **Namespace field**: Add optional namespace field to command frontmatter (DEFERRED)
   - Current: No namespace field in command frontmatter
   - Target: `namespace?: string` field in YAML frontmatter (optional, placeholder only)
   - Acceptance: Schema accepts any string value, NO validation logic, NO routing logic, NO enforcement
```

### Impact
Namespace routing was the primary reason Phase 24.3.3 exists as a separate phase. Both phases deferred it:
- 24.3.2: "No pain signal at ~90 commands"
- 24.3.3: "Placeholder only, no routing logic"

The namespace field was added to the Zod schema (`commands.schema.ts` line 13) but no routing logic, no contract validation for namespace, and no `resolveCommandNamespace()` method were ever implemented.

### Root Cause
Scope creep avoidance gone wrong. Both phases decided namespace routing was "not needed yet" but nobody made the decision to formally remove it from scope.

---

## I-05: Session Tool Move Scope Discrepancy (🟡 MEDIUM)

### Conflict
**Phase 24.3.2-SPEC.md** says move 3 session tools.  
**Phase 24.3.2-PLAN.md** says move 4 files (including session-resolver.ts).  
**Interview log** says "move 4 files."

### Evidence
**24.3.2-SPEC.md, line 67 (REQ-7):**
```markdown
7. **Move session tools**: Relocate `session-context.ts`, `session-hierarchy.ts`, 
   `session-tracker.ts`, `session-resolver.ts` from `src/tools/hivemind/` to `src/tools/session/`.
```

**Same SPEC, lines 114-115 (In scope):**
```markdown
- Move 3 session tools from `hivemind/` to `session/`
```

Count is inconsistent within the SAME document: REQ-7 names 4 files, "In scope" says 3 tools. The PLAN lists 4 files but calls them "3 session tools + session-resolver.ts."

### Impact
Minor inconsistency, but indicates hurried editing. The 3 vs 4 count suggests the writer wasn't sure which files should move and made inconsistent edits.

---

## I-06: Root Phase Empty, Sub-Phases Orphaned (🔴 HIGH)

### Conflict
**Phase 24** directory exists but is empty.  
**Sub-phases** 24.1, 24.3.1, 24.3.2, 24.3.3 all have detailed plans but no parent specification.

### Evidence
```bash
$ ls .planning/phases/24-coordination-dispatch-delegate-task-fix/
.gitkeep              # ONLY file — phase is empty

$ ls .planning/phases/24.1-agent-hierarchy-restructure/ | wc -l
9                     # Full documentation

$ ls .planning/phases/24.3.1-governance-session-prototype/ | wc -l
25                    # Very extensive
```

### Impact
- No parent specification means sub-phases defined their own scope without coordination
- Independent scope definition directly led to I-01 (agent naming conflict)
- No centralized authority validates cross-phase coherence
- The `.planning/ROADMAP.md` phase listing is untrustworthy — it shows a phase that was never planned or executed

### Root Cause
Phase numbering scheme was set up in ROADMAP.md before execution happened. The parent phase (24) was listed as the "coordination dispatch fix" container but no one ever wrote its plan. Sub-phases were created under it but never linked through a parent specification.

---

## I-07: Agent Count Claim vs Actual (🟡 MEDIUM)

### Conflict
**Phase 24.1 RESEARCH** claims 45→30 agent consolidation, targeting 31 hm-* files.  
**Actual count** is 31 hm-* files, but the consolidation map shows 29 L2 + 1 L0 = 30, while RESEARCH Table says "30 hm-* agents total (1 L0 + 29 L2)."

### Evidence
**24.1-RESEARCH.md, lines 353-357:**
```
| L0 agents | 1 | 1 | 0 |
| L1 agents | 1 | 0 | -1 |
| L2/L3 agents | 43 | 29 | -14 |
| **Total** | **45** | **30** | **-15** |
```

**Actual count (2026-05-29):** `ls .opencode/agents/hm-*.md | wc -l` = 31

**24.1-RESEARCH.md, line 552:**
```markdown
2. **45→30 agent consolidation**: 22 agents removed, 17 renamed/kept, 13 new agents created
```

### Impact
The proposed 30-agent target and the 31-agent actual count differ by 1. This is likely because hm-orchestrator was kept (1 L0) but one extra L2 agent was created. Neither the research nor the summary acknowledges the discrepancy.

---

## I-08: `namespace` Field Purpose Misalignment (🟢 LOW)

### Conflict
**Phase 24.3.3-SPEC.md** says namespace field is "placeholder only" with "NO routing logic, NO enforcement."  
**Actual schema code** describes the field as "Namespace override" — implying active use.

### Evidence
**24.3.3-SPEC.md, line 34:**
```markdown
- Acceptance: Schema accepts any string value, NO validation logic, NO routing logic, NO enforcement
```

**`src/schema-kernel/commands.schema.ts`, line 13:**
```typescript
namespace: z.string().optional().describe("Namespace override"),
```

### Impact
Minor semantic drift. The "Namespace override" description could be interpreted as an active control mechanism rather than a placeholder. When an agent reads the schema description, it may attempt to use the field for routing, which hasn't been implemented.

---

## Architecture & Structure Document Accuracy Assessment

### `.planning/codebase/ARCHITECTURE.md` (Last mapped: 2026-05-28)

**Still accurate:**
- 9-layer CQRS architecture is correct
- Plugin architecture has not changed
- Most file structure descriptions match

**Outdated / Needs update:**
| Section | Issue |
|---------|-------|
| Tools Layer — `src/tools/session/execute-slash-command.ts` | Listed as 1 file, now part of 7-file module (resolve-command, dispatch-command, validate-command, semantic-agent-selector, workflow-parser) |
| Features Layer — `governance-engine/` | Described as 1+ files, now has config-reader.ts, create-governance-session.ts, index.ts, .gitkeep |
| Shared Layer — `src/shared/session-naming.ts` | NOT listed in ARCHITECTURE.md at all. Should appear under shared/ |
| `.hivemind/governance/` | NOT listed. New governance internal state directory was created |
| Tool count | States "22 tools total" — needs audit for exact count after 24.3.x additions |

### `.planning/codebase/STRUCTURE.md` (Last mapped: 2026-05-28)

**Still accurate:**
- Directory tree structure is correct for most directories
- File counts for `src/` (~228) and `tests/` (~204) are approximately correct
- Most of the large structural claims hold

**Outdated / Needs update:**
| Section | Issue |
|---------|-------|
| `src/coordination/delegation/` | Lists 15 files. After 24.3.1's sdk-child-session-starter update, count may differ |
| `src/features/governance-engine/` | Described as 2 files (barrel + types). Now has config-reader.ts and create-governance-session.ts |
| `src/tools/session/` | Lists `execute-slash-command.ts` as single file. Now has **14 entries** (13 .ts + `session-patch/` dir): index.ts, execute-slash-command.ts, resolve-command.ts, dispatch-command.ts, validate-command.ts, semantic-agent-selector.ts, workflow-parser.ts, session-context.ts, session-hierarchy.ts, session-tracker.ts, session-resolver.ts, session-journal-export.ts, session-patch/dir |
| `src/schema-kernel/` | Doesn't mention `commands.schema.ts` which was added by 24.3.2 (now 21 files total) |
| `src/shared/errors/` | Doesn't mention `commands.ts` error classes |
| `.opencode/agents/` | Agent count: 42 (31 hm-* + 11 hf-*) — correct but hm-* changed from 45→31 |
| `assets/` | **NOT mentioned at all** — contains 43 agents, 137 commands, 34 skills, 106 workflows (separate from .opencode/) |
| `.opencode/workflows/` | **NOT mentioned** — 106 workflow files exist (103 hm-* + 3 other) |
| `src/tools/session/execute-slash-command.ts` | 631 LOC (not 402 as claimed in summaries), **1 of 8 files exceeding 500 LOC cap** |
| `scripts/` | `sync-assets.js`, `transform-gsd-to-hm.js` — NOT documented |
| `bin/` | `hivemind.cjs` + 3 validation scripts — NOT documented |

---

## Recommendations

### Immediate Fixes (HIGH priority)

1. **Purge or rebuild the empty root phase 24.** Either plan it properly or update ROADMAP.md to remove it as a parent phase.

2. **Update `.hivemind/governance/config.json`** to reference current agent names (drop `-l2-` suffix). All 9 agent entries are dead references.

3. **Reduce `execute-slash-command.ts` below 500 LOC** or update the architectural constraint to reflect the new ceiling.

4. **Audit and fix the `renderToolResult()` discrepancy** in 24.3.2-SPEC.md: verify the function's existence and update the claim.

### Medium Priority

5. **Execute Phase 24.2** — agent profile body writing. The 8 skeleton agents have been waiting for full body content since 2026-05-26.

6. **Resolve the namespace routing double-deferral.** Either implement it or formally remove it from scope.

7. **Check `semantic-agent-selector.ts`** for the `createTuiPrompt()` layer violation — should not import CLI UI from tool layer.

### Documentation Fixes

8. **Update ARCHITECTURE.md** to include session-naming.ts, governance-engine file list, commands.schema.ts, and updated tool counts.

9. **Update STRUCTURE.md** to reflect 7 files in `src/tools/session/` (up from 1).

10. **Write the parent phase 24 SPEC** even if retroactively, to provide specification context for all sub-phases.

---

## Summary

The Phase 24 cycle exhibits a pattern of **uncoordinated parallel work**: 24.1 renamed agents while 24.3.1 created tools referencing old names; 24.3.2 wrote specs based on stale codebase without reading 24.3.1's output; 24.3.3's module extraction made the 500 LOC problem worse, not better. The empty root phase is the clearest symptom — without a parent specification, sub-phases created their own scope and never reconciled their outputs.

**7 confirmed cross-phase contradictions found. 3 are HIGH severity (agent naming, renderToolResult existence, module size cap).**

---

*Incoherence analysis completed: 2026-05-29*
