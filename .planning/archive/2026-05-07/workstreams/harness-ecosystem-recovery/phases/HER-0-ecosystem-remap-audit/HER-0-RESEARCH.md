# Phase HER-0: Ecosystem Re-map & Reality Audit - Research

**Researched:** 2026-05-05
**Domain:** Codebase ecosystem mapping & audit (multi-lineage, multi-path classification)
**Confidence:** HIGH

## Summary

This phase is the entry point of an 8-workstream ecosystem recovery program. It does NOT produce code — it establishes ground truth about what exists, what works, what's broken, and how everything connects. The deliverable is a comprehensive reality map that all 7 subsequent workstreams consume as their single source of truth.

The current ecosystem is a complex, multi-lineage system with 175 source files (23,360 LOC), 86 agents, 57 skills, 7 unwired subsystems (~2,596 LOC dead code), and 6 UAT gaps blocking production readiness. The project has accumulated significant drift between governance artifacts (.planning/) and implementation reality (src/). Four detailed research documents already exist (GAP-MATRIX, FEATURE-DEPENDENCY-GRAPH, IMPLEMENTATION-INVENTORY, legacy-concept-catalog) that were produced 2026-05-05 — these are the foundation, not the deliverable.

**Primary recommendation:** Execute 5 parallel audit lanes using existing GSD research patterns (hm-l3-detective for codebase investigation, hm-l3-deep-research for external validation), with a hard gate at the end where all lanes reconcile into a single ecosystem map. Use the 4-path × 2-lineage × 5-surface taxonomy already defined in the GAP-MATRIX. Do NOT redo the existing research — extend it with cross-referencing, conflict detection, and reality verification.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Classify features (4 paths × 2 lineages) | Planning/Governance (.planning/) | — | Classification is a planning artifact, not runtime code |
| Audit governance artifact freshness | Planning/Governance (.planning/) | — | Audit reads .planning/ files, does not touch src/ |
| Map module ownership  | Hard Harness (src/) | Governance (.planning/) | Primary evidence is in source; ownership matrix is a governance artifact |
| Verify OpenCode SDK integration | Hard Harness (src/) | Runtime (OpenCode) | Source code + external docs verification |
| Extract legacy patterns | Governance (.planning/) | — | Patterns extraction from legacy archive, not code changes |

## User Constraints (from CONTEXT.md)

> **No CONTEXT.md exists for this phase.** HER-0 is a new workstream entry point without prior discuss-phase context. All decisions are at the agent's discretion within the locked Q1-Q6 framework.

### Locked Decisions (from VALIDATION-DECISIONS-2026-04-25)

| ID | Decision | Impact on HER-0 |
|----|----------|-----------------|
| Q1 | Hybrid + Spec-Driven Automated Runtime Detection | Lane D must verify OpenCode SDK integration against current docs (not training data) |
| Q2 | Artifact-Focused Sidecar (Next.js 15 + @json-render/react) | Lane A must classify sidecar-specific UAT findings to Path 4 |
| Q3 | Session Journal as Complement + Time-Machine | Lane C must verify journal module ownership (src/lib/session-journal.ts) |
| Q4 | MVP = 5 of 8 memory categories | Lane B must verify governance docs reference correct MVP categories |
| Q5 | Full RICH gate required (0 of 25 skills pass today) | Lane B must audit RICH gate governance artifacts for accuracy |
| Q6 | `.hivemind/` is internal state root; `.opencode/` is ONLY for OpenCode primitives | Lane B must verify state root compliance in all .planning/ artifacts |

### the agent's Discretion

- Research methodology: 5 parallel audit lanes architecture
- Agent allocation per lane
- Audit depth per lane
- Gate structure between lanes
- Output format for ecosystem map

### Deferred Ideas (OUT OF SCOPE)

- Any code changes — this is a read-only audit
- Fixing gaps found — that's HER-1 through HER-8
- Reclassifying agents/skills — that's HER-3 (Primitive Registry)

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| HER-0-A | Reclassify all UAT findings by 4 paths + 2 lineages | Supported by UAT final audit (116/125 PASS, 6 gaps), GAP-MATRIX classification taxonomy |
| HER-0-B | Audit .planning/ for stale/contradictory governance artifacts | Supported by ARCHITECTURE.md (last refreshed 2026-04-28), CONCERNS.md, Q1-Q6 decisions |
| HER-0-C | Module ownership matrix — which module owns which lifecycle responsibility | Supported by IMPLEMENTATION-INVENTORY (175 files, 120 lib files), ARCHITECTURE.md component responsibilities table |
| HER-0-D | OpenCode runtime integration — verified SDK hooks, compaction, events | Supported by Context7 OpenCode plugin docs (verified 2026-05-05), src/plugin.ts tool registration, src/hooks/ 8 files |
| HER-0-E | Extract concepts from product-detox legacy | Supported by legacy-concept-catalog (84 concepts, 16 unique missing patterns) |

## Standard Stack

### Core (Research/Audit Patterns)

| Library/Pattern | Version/Source | Purpose | Why Standard |
|---------|---------|---------|--------------|
| GSD Phase Management | STATE.md + ROADMAP.md pattern | Phase lifecycle: Ready → In Progress → Complete | Proven state machine pattern from GSD framework. RESEARCH.md → STATE.md progression. |
| hm-l3-detective | `.opencode/skills/hm-l3-detective/` | Codebase investigation (SCAN/READ/DEEP modes) | Existing project skill. Used for Lane C (module ownership) and cross-verifying Lane D findings. |
| hm-l3-deep-research | `.opencode/skills/hm-l3-deep-research/` | External documentation research with citations | Used for Lane D (OpenCode SDK docs). Proven MCP-tool research pipeline with evidence levels. |
| hm-l3-synthesis | `.opencode/skills/hm-l3-synthesis/` | Compress research findings into actionable artifacts | Used for final ecosystem map synthesis across all 5 lanes. Stage 3 of research chain. |
| Context7 MCP | `context7_resolve-library-id` + `context7_query-docs` | Current OpenCode plugin SDK documentation | Verified source for Lane D. Not training data — live docs. |
| Tavily Search | `tavily_tavily_search` | Broad web research for OpenCode SDK latest | Fallback when Context7 coverage is insufficient. |

### Supporting (Documentation/Quality)

| Library/Pattern | Purpose | When to Use |
|---------|---------|-------------|
| gate-l3-evidence-truth | Evidence hierarchy enforcement (L1-L5) | Gate between Lane auditing and final report — all claims need evidence |
| gate-l3-spec-compliance | Spec-to-artifact traceability | Verify audit output matches what HER-0 was asked to deliver |
| hm-l3-hivemind-state-reference | `.hivemind/` state root structure | Cross-reference Lane C ownership with state root category documentation |

**No npm packages needed** — this is a read-only audit phase. All tools are existing project skills and MCP services.

## Architecture Patterns

### System Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────────┐
│                    HER-0: ECOSYSTEM RE-MAP AUDIT                      │
│                                                                       │
│  Input Sources (already exist, read-only):                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────────────────┐   │
│  │ GAP      │  │ FEATURE  │  │ IMPL     │  │ LEGACY CONCEPT    │   │
│  │ MATRIX   │  │ DEP GRAPH│  │ INVENTORY│  │ CATALOG           │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └───────┬───────────┘   │
│       └──────────────┼─────────────┼───────────────┘               │
│                      ▼             ▼                                  │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                   5 PARALLEL AUDIT LANES                        │  │
│  ├───────────┬───────────┬───────────┬───────────┬───────────────┤  │
│  │  LANE A   │  LANE B   │  LANE C   │  LANE D   │    LANE E     │  │
│  │ UAT       │ Governance│ Module    │ OpenCode  │ Legacy        │  │
│  │ Reclass   │ Artifact  │ Ownership │ Runtime   │ Pattern       │  │
│  │ by Path+  │ Audit     │ Matrix    │ Integration│ Extraction   │  │
│  │ Lineage   │           │           │           │               │  │
│  ├───────────┼───────────┼───────────┼───────────┼───────────────┤  │
│  │ Source:   │ Source:   │ Source:   │ Source:   │ Source:       │  │
│  │ .hivemind │ .planning │ src/lib/  │ src/hooks │ .archive/     │  │
│  │ /uat/     │ /codebase │ src/tools │ src/plugin│ legacy-src/   │  │
│  │           │ /PROJECT  │ src/lib/  │ .ts       │               │  │
│  │           │ /ARCH     │ types.ts  │ Context7   │               │  │
│  │           │ /CONCERNS │ AGENTS.md │ MCP docs  │               │  │
│  ├───────────┴───────────┴───────────┴───────────┴───────────────┤  │
│  │                     ▼  ▼  ▼  ▼  ▼                               │  │
│  │              ┌────────────────────────────┐                     │  │
│  │              │    HARD GATE: RECONCILE    │                     │  │
│  │              │  - Cross-lane conflicts?   │                     │  │
│  │              │  - Missing cross-refs?     │                     │  │
│  │              │  - Evidence levels match?  │                     │  │
│  │              └────────────┬───────────────┘                     │  │
│  │                           ▼                                      │  │
│  │              ┌────────────────────────────┐                     │  │
│  │              │    ECOSYSTEM MAP OUTPUT     │                     │  │
│  │              │  - Feature × Path × Lineage │                     │  │
│  │              │  - Module Ownership Matrix  │                     │  │
│  │              │  - Governance Drift Report  │                     │  │
│  │              │  - Runtime Integration Map  │                     │  │
│  │              │  - Legacy Pattern Index     │                     │  │
│  │              └────────────────────────────┘                     │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  Downstream Consumers: HER-1 through HER-8 workstreams               │
└──────────────────────────────────────────────────────────────────────┘
```

### Classification Taxonomy

Every finding in the ecosystem map is tagged with 3 dimensions:

| Dimension | Values | Source of Truth |
|-----------|--------|----------------|
| **Feature Path** | Path 1 (Agent-Callable), Path 2 (Runtime), Path 3 (Governance), Path 4 (Sidecar) | GAP-MATRIX by-path table |
| **Lineage** | hm-* (product dev), hf-* (meta-builder), hm+hf (shared infrastructure) | GAP-MATRIX by-lineage table |
| **Classification Surface** | hard harness (src/), soft primitives (.opencode/), internal state (.hivemind/), planning docs (.planning/), OpenCode runtime | ARCHITECTURE.md two-halves table + Q6 decision |

### Recommended Project Structure

```
.planning/workstreams/harness-ecosystem-recovery/
├── HER-0-ecosystem-remap-audit/
│   ├── HER-0-RESEARCH.md           # This file
│   ├── HER-0-CONTEXT.md            # Created by discuss-phase (if run)
│   ├── HER-0-PLAN.md               # Created by plan-phase
│   ├── HER-0-SUMMARY.md            # Created post-execution
│   ├── HER-0-VERIFICATION.md       # Created post-verification
│   └── outputs/                     # Lane-specific outputs
│       ├── lane-a-uat-reclass/      # UAT findings reclassified
│       ├── lane-b-governance-audit/ # .planning/ drift report
│       ├── lane-c-ownership-matrix/ # Module ownership matrix
│       ├── lane-d-runtime-verify/   # OpenCode SDK integration map
│       └── lane-e-legacy-patterns/  # Validated pattern index
└── ecosystem-map.md                 # Final reconciled ecosystem map
```

### Pattern 1: Parallel Audit with Hard Reconciliation Gate

**What:** 5 independent audit lanes execute in parallel (or near-parallel via subagent dispatch). Each lane produces its own findings document. A reconciliation gate cross-references all 5 outputs, flags conflicts, and produces a single unified ecosystem map.

**When to use:** Audit phases where sub-domains are independent (no lane depends on another lane's output).

**Example:**
```markdown
Wave 0: Load all existing research documents (already done — these exist)
Wave 1: Lane A (UAT Reclass) ∥ Lane B (Governance Audit) ∥ Lane E (Legacy Patterns) 
        → All 3 are independent read-only analysis
Wave 2: Lane D (Runtime Verify) requires CONTEXT-7 for current docs → may need async web calls
Wave 3: Lane C (Ownership Matrix) can run in parallel with Wave 2, no dependencies
Gate:   Reconcile all 5 outputs → produce ecosystem-map.md
```

### Pattern 2: Evidence-Tagged Claims

**What:** Every claim in audit outputs carries an evidence tag (DIRECT, CORROBORATED, TESTIMONIAL, ABSENCE) following the hm-l3-deep-research evidence hierarchy.

**When to use:** All audit lanes. The reconciliation gate uses evidence levels to detect conflicts (e.g., DIRECT evidence trumps TESTIMONIAL).

### Anti-Patterns to Avoid

- **Re-researching what already exists:** The GAP-MATRIX, FEATURE-DEPENDENCY-GRAPH, IMPLEMENTATION-INVENTORY, and legacy-concept-catalog were produced 2026-05-05. Use them as input, do not recreate them.
- **Classifying by feature name instead of lifecycle ownership:** The module ownership matrix must classify by WHAT module owns WHAT responsibility (CQRS separation), not by which feature the code relates to.
- **Missing cross-references between lanes:** Lane A (UAT findings) should cross-reference Lane C (which module owns the broken behavior) and Lane B (does governance doc match?). If lanes don't cross-reference, the reconciliation gate cannot detect conflicts.
- **Trusting governance docs without verification:** ARCHITECTURE.md claims 9 tools; plugin.ts registers 16. This is a known drift. Lane B must verify every claim against source.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Codebase investigation methodology | Custom reading patterns | hm-l3-detective (SCAN/READ/DEEP modes) | Existing project skill with token-efficient investigation patterns. Already understands the codebase. |
| External documentation research | Manual web searches | Context7 MCP + hm-l3-deep-research | Version-matched docs, evidence hierarchy, citation tracking. Used for OpenCode SDK verification in Lane D. |
| Feature classification | Ad-hoc tagging | 4-path × 2-lineage × 5-surface taxonomy from GAP-MATRIX | Already defined and used across 20 features. Consistency with existing research prevents classification drift. |
| State root verification | Manual directory checks | Q6 decision table + hm-l3-hivemind-state-reference | Locked decision from 2026-04-25. The state root categories are canonical — verify against them, don't redefine. |
| Dependency graph analysis | Manual BFS | FEATURE-DEPENDENCY-GRAPH (35 edges, 0 cycles) | Already analyzed. Use as reference for Lane C ownership matrix, not as a task to recreate. |
| Module inventory | Manual file listing | IMPLEMENTATION-INVENTORY (175 files, 23,360 LOC) | Complete inventory exists. Lane C extends it with ownership, doesn't recreate it. |
| UAT finding severity classification | New severity system | UAT final audit (6 gaps, HIGH/MED/LOW) | Existing severity + gap ID system. Lane A reclassifies by path+lineage, keeps existing severity. |

**Key insight:** The 4 foundational research documents (GAP-MATRIX, FEATURE-DEPENDENCY-GRAPH, IMPLEMENTATION-INVENTORY, legacy-concept-catalog) are 2026-05-05 — fresh as of today. HER-0's value is NOT in recreating them but in CROSS-REFERENCING them against each other and against reality (source code, live docs, runtime behavior). The "don't hand-roll" rule is: extend existing research, don't replace it.

## Common Pitfalls

### Pitfall 1: Confusing "Implemented" with "Wired"

**What goes wrong:** Classifying a module as "working" because it has real logic, when it's actually dead code with zero runtime consumers (e.g., session-entry/ is 644 LOC of implemented but unwired code).

**Why it happens:** The IMPLEMENTATION-INVENTORY correctly classifies these as "IMPLEMENTED (UNUSED)" but auditors scanning the inventory may miss the distinction.

**How to avoid:** Lane C MUST verify that every module classified as "IMPLEMENTED" has an active import chain to plugin.ts. Use grep-based verification: `grep -r "from.*module-name" src/plugin.ts src/hooks/ src/tools/`.

**Warning signs:** A module with >100 LOC that appears in inventory but has "Nobody" in the "Used By" column. The IMPLEMENTATION-INVENTORY already flags these — the audit must verify the flags are still accurate.

### Pitfall 2: Governance Artifact Date Blindness

**What goes wrong:** Treating a governance artifact (ARCHITECTURE.md, CONCERNS.md, PROJECT.md) as authoritative because it exists, without checking its last refresh date against source reality.

**Why it happens:** Governance artifacts are written for human consumption and decay faster than source code. ARCHITECTURE.md says "9 tools" — plugin.ts registers 16. This is a known drift.

**How to avoid:** Lane B must compare every factual claim in each governance artifact against the source files it references. Claims without source file references (e.g., "51 skills in `.opencode/skills/`") need a freshness date and verification.

**Warning signs:** An artifact reference date more than 30 days old. ARCHITECTURE.md says "50 skills" but AGENTS.md says "51 skills." Both may be wrong. Count from source, not from docs.

### Pitfall 3: OpenCode SDK Assumptions from Training Data

**What goes wrong:** Making claims about OpenCode SDK APIs (hook types, event signatures, compaction behavior) based on training data knowledge rather than current documentation.

**Why it happens:** The OpenCode plugin SDK is actively developed. Training data (6-18 months stale) may reference APIs that have changed or been deprecated.

**How to avoid:** Lane D MUST use Context7 MCP or web searches to verify every SDK API claim. The research above has already verified tool(), Plugin(), `experimental.session.compacting` hook, and event hooks (session.idle). Additional APIs (session.error, session.deleted, messages.transform) need similar verification.

**Warning signs:** Any claim that says "[ASSUMED]" without a Context7 or official docs citation. Lane D should have ZERO assumed claims.

### Pitfall 4: Single-Lane Blindness

**What goes wrong:** Each lane produces correct findings within its scope, but cross-lane contradictions go undetected because no reconciliation step exists.

**Why it happens:** Parallel audit lanes are efficient but create silos. Lane B might say "F-09a is IMPLEMENTED" (from governance docs), while Lane C finds it's "DEAD" (no plugin.ts consumer). Both are correct within their scopes but contradictory.

**How to avoid:** The reconciliation gate (between Wave 3 and final output) must explicitly compare lane findings for the same feature/path/lineage intersection. Any feature that appears in multiple lanes must have consistent classification across all lane outputs.

**Warning signs:** Any feature with different status in Lane A vs Lane B vs Lane C. The reconciliation gate should flag these as HIGH priority conflicts.

### Pitfall 5: Classifying Everything as hm+hf

**What goes wrong:** Because most harness infrastructure is shared, the temptation is to classify everything as "hm+hf" (shared). The GAP-MATRIX already does this for all lineage counts — identical counts for both lineages.

**Why it happens:** The harness provides shared infrastructure. But the distinction matters for permission profiles (hm STRICT vs hf FLEXIBLE per AGENTS.md) and routing rules.

**How to avoid:** When a feature is "hm+hf," Lane A must document HOW each lineage consumes it differently. For example: F-08b (Permission model) is shared code, but hm-* agents use STRICT profile and hf-* agents use FLEXIBLE profile. The classification is "hm+hf" but the sub-classification matters.

**Warning signs:** All 20 features classified as hm+hf without lineage-specific notes. The GAP-MATRIX already has this pattern — Lane A must add the lineage-specific consumption notes.

## Implementation Approach

### Agent Dispatch Strategy

This is a subagent-heavy phase. The orchestrator should dispatch specialist agents for each lane:

| Lane | Recommended Agent | Skills to Load | Input Documents |
|------|-------------------|----------------|-----------------|
| A | gsd-phase-researcher or hm-l2-researcher | hm-l3-detective, hm-l3-synthesis | GAP-MATRIX, UAT final audit, FEATURE-DEPENDENCY-GRAPH |
| B | gsd-phase-researcher or hm-l2-researcher | hm-l3-detective | ARCHITECTURE.md, CONCERNS.md, PROJECT.md, ROADMAP.md, STATE.md, VALIDATION-DECISIONS, GAP-MATRIX |
| C | gsd-phase-researcher or hm-l2-researcher | hm-l3-detective | IMPLEMENTATION-INVENTORY, ARCHITECTURE.md, src/plugin.ts, src/lib/types.ts, src/lib/AGENTS.md |
| D | gsd-phase-researcher or hm-l2-researcher | hm-l3-deep-research | src/plugin.ts, src/hooks/ (8 files), Context7 MCP (OpenCode docs), src/lib/AGENTS.md |
| E | gsd-phase-researcher or hm-l2-researcher | hm-l3-synthesis, hm-l3-detective | legacy-concept-catalog (84 concepts), legacy-src archive |

### Wave Execution Plan

```
Wave 0: Pre-audit (orchestrator)
  - Load all 4 existing research documents
  - Verify they are current (all dated 2026-05-05 — confirmed current)
  - Establish classification taxonomy (already defined in GAP-MATRIX)
  - Define per-lane output format

Wave 1: Independent Lanes (parallel dispatch)
  - Lane A: UAT Reclassification (estimated: 1 subagent, ~30 min)
    Input: .hivemind/uat/team-b/results/ (11 batches)
    Output: lane-a-uat-reclass.md — all 116 UAT tests reclassified by 4 paths + 2 lineages
  
  - Lane B: Governance Audit (estimated: 1 subagent, ~45 min)
    Input: .planning/codebase/ARCHITECTURE.md, CONCERNS.md, PROJECT.md, ROADMAP.md, STATE.md
    Output: lane-b-governance-audit.md — drift report with per-claim verification
  
  - Lane E: Legacy Pattern Validation (estimated: 1 subagent, ~30 min)
    Input: legacy-concept-catalog (84 concepts)
    Output: lane-e-legacy-patterns.md — validated pattern index with Path mapping

Wave 2: Runtime Verification (parallel with Wave 3 if context allows)
  - Lane D: OpenCode Runtime Verify (estimated: 1 subagent, ~45 min, MCP-dependent)
    Input: src/plugin.ts, src/hooks/, Context7 MCP, OpenCode docs site
    Output: lane-d-runtime-verify.md — verified SDK integration map with evidence levels

Wave 3: Module Ownership (parallel with Wave 2 if context allows)
  - Lane C: Module Ownership Matrix (estimated: 1 subagent, ~45 min)
    Input: IMPLEMENTATION-INVENTORY, ARCHITECTURE.md, src/lib/AGENTS.md
    Output: lane-c-ownership-matrix.md — which module owns which lifecycle responsibility

Wave 4: Reconciliation Gate (orchestrator + 1 subagent)
  - Cross-reference all 5 lane outputs
  - Detect conflicts (same feature, different classification in different lanes)
  - Flag missing cross-references
  - Produce: ecosystem-map.md (unified ecosystem map)
  - Produce: HER-0-SUMMARY.md (execution summary)

Wave 5: Quality Gate (optional — if nyquist_validation enabled)
  - gate-l3-spec-compliance: verify ecosystem-map.md covers all HER-0 requirements
  - gate-l3-evidence-truth: verify all claims have evidence at L1-L3 level
```

### Total Estimated Agent Cycles

| Activity | Agent Cycles | Estimated Duration |
|----------|-------------|-------------------|
| Wave 0 (orchestrator prep) | 0 (orchestrator direct) | 15 min |
| Wave 1 (3 parallel lanes) | 3 subagents | 45 min |
| Wave 2+3 (2 parallel lanes) | 2 subagents | 45 min |
| Wave 4 (reconciliation) | 1 subagent | 30 min |
| Wave 5 (quality gates) | 1 subagent (if enabled) | 20 min |
| **Total** | **6-7 agent cycles** | **~2-3 hours** |

## Runtime State Inventory

> This is a greenfield audit phase — no runtime state is modified. All files are read-only.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None — audit reads existing files only | None |
| Live service config | None verified | None |
| OS-registered state | None | None |
| Secrets/env vars | None accessed | None |
| Build artifacts | None affected | None |

**Nothing found in any category** — this is a read-only research/audit phase. No state mutation occurs.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | N/A — this is a read-only audit phase. No code is written. |
| Config file | N/A — no test framework needed |
| Quick run command | N/A |
| Full suite command | N/A |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Verification Method | Automated? |
|--------|----------|-----------|---------------------|------------|
| HER-0-A | UAT findings reclassified by 4 paths × 2 lineages | Audit validation | Manual: spot-check 10 random UAT findings for correct classification | ❌ Manual |
| HER-0-B | .planning/ drift report with per-claim verification | Audit validation | Manual: verify 5 random drift claims against source | ❌ Manual |
| HER-0-C | Module ownership matrix covers all src/lib/ files | Audit validation | Automated: grep count of classified modules vs IMPLEMENTATION-INVENTORY total | ✅ Count verification script |
| HER-0-D | OpenCode SDK claims verified with Context7 citations | Audit validation | Manual: verify 5 random SDK claims have Context7/URL citations | ❌ Manual |
| HER-0-E | Legacy patterns validated with evidence tags | Audit validation | Manual: spot-check pattern-to-source traceability | ❌ Manual |

### Wave 0 Gaps

No test infrastructure exists or is needed for this phase. The phase produces documentation, not code. Quality is enforced by:

1. **Evidence tags** (DIRECT, CORROBORATED, TESTIMONIAL) on all claims
2. **Reconciliation gate** cross-referencing all 5 lane outputs
3. **Citation requirement** — every factual claim has a source file path or URL

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Notes |
|---------------|---------|-------|
| V2 Authentication | no | Read-only audit |
| V3 Session Management | no | Read-only audit |
| V4 Access Control | no | Read-only audit |
| V5 Input Validation | no | Read-only audit |
| V6 Cryptography | no | Read-only audit |

**Security context:** This is a read-only audit phase. No code is written, no state is mutated, no external services are accessed (except Context7 MCP for documentation). Standard security considerations for research phases: do not commit secrets, do not access `.env` files, redact any session IDs that appear in output documents.

## OpenCode Runtime Integration (Lane D — Verified Documentation)

The following OpenCode plugin SDK APIs were verified via Context7 on 2026-05-05:

| API Surface | Verified? | Source | Key Details |
|-------------|-----------|--------|-------------|
| `Plugin` type | ✅ VERIFIED | Context7: `/websites/opencode_ai_plugins` | `export const MyPlugin: Plugin = async (ctx) => { return { ... } }` |
| `tool()` helper | ✅ VERIFIED | Context7: `/websites/opencode_ai_plugins` | `tool({ description, args: Zod schema, execute: async (args, context) => {} })` |
| `tool.schema` | ✅ VERIFIED | Context7: `/websites/opencode_ai_plugins` | Zod-based schema helpers: `tool.schema.string()`, etc. |
| `session.idle` event | ✅ VERIFIED | Context7: `/websites/opencode_ai_plugins` | `event.type === "session.idle"` — used for completion detection |
| `event` hook | ✅ VERIFIED | Context7: `/websites/opencode_ai_plugins` | `event: async ({ event }) => { ... }` — session lifecycle events |
| `experimental.session.compacting` | ✅ VERIFIED | Context7: `/websites/opencode_ai_plugins` | `output.context.push(...)` or `output.prompt = "..."` for custom compaction |
| `tool.execute.before` | ✅ VERIFIED | Context7: `/websites/opencode_ai_plugins` | `"tool.execute.before": async (input, output) => { ... }` |
| `tool.execute.after` | ✅ VERIFIED | Context7: `/websites/opencode_ai_plugins` | Used in plugin.ts for event tracking and config-workflow persistence |
| Plugin context (`directory`, `worktree`, `client`) | ✅ VERIFIED | Context7: `/websites/opencode_ai_plugins` | `const { directory, worktree } = context` in execute handler |
| `session.error` / `session.deleted` | ⚠️ NOT VERIFIED | Not found in current Context7 docs | Used in harness (src/lib/lifecycle-manager.ts, consumeDelegationFact). Need verification against live OpenCode instance or changelog. |

### Harness SDK Usage vs Official API

| Harness Pattern | Source File | Official API Matched? | Notes |
|----------------|-------------|----------------------|-------|
| `tool: { "delegate-task": tool({...}) }` | plugin.ts:109 | ✅ Yes | Standard tool registration |
| `"tool.execute.after"` hook | plugin.ts:128 | ✅ Yes | Standard after-execute hook |
| `event: async ({ event }) => { ... }` | plugin.ts:103-104 | ✅ Yes | Via createCoreHooks eventObservers |
| `session.idle` detection | lifecycle-manager.ts | ✅ Yes | Standard event type |
| `sendPromptAsync` via SDK client | session-api.ts | ⚠️ Not verified | Pattern used in harness but not in official plugin docs. May be OpenCode internal API. |

### Critical Gap for Lane D Investigation

The harness uses `session.error` and `session.deleted` event types in `consumeDelegationFact` (plugin.ts lines 79-87). These event types were NOT found in the current Context7 plugin documentation. Lane D MUST determine:

1. Are `session.error` and `session.deleted` part of the official OpenCode event API or are they harness-internal abstractions?
2. What other event types does OpenCode emit that the harness does NOT handle?
3. Has the `experimental.session.compacting` hook changed since the harness's implementation?
4. Is `sendPromptAsync` part of the public SDK or an internal API?

**Investigation method:** Search the OpenCode GitHub repo for event types (`github_search_code`), check the OpenCode SDK package exports, or verify against a live OpenCode instance.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The 4 foundational research documents (GAP-MATRIX, FEATURE-DEPENDENCY-GRAPH, IMPLEMENTATION-INVENTORY, legacy-concept-catalog) are accurate as of 2026-05-05 and can be trusted as input | Don't Hand-Roll | MEDIUM — if any of these are stale, the audit builds on a shaky foundation. Lane B's governance audit would catch this by verifying key claims. |
| A2 | The OpenCode plugin SDK has not introduced breaking changes since the harness was built | OpenCode Runtime Integration | MEDIUM — Lane D is designed to verify this assumption. If broken, Lane D's output flags it. |
| A3 | All 5 audit lanes can execute in parallel without cross-dependencies | Implementation Approach | LOW — if Lane B finds a governance issue that affects Lane C's module classification, the reconciliation gate catches it. |
| A4 | The 4-path × 2-lineage taxonomy from GAP-MATRIX is complete and doesn't need new categories | Architecture Patterns | LOW — Lane A would discover any UAT findings that don't fit the taxonomy. |

## Open Questions

1. **Are `session.error` and `session.deleted` official OpenCode SDK events?**
   - What we know: These are used in harness code (plugin.ts, lifecycle-manager.ts) but not found in Context7 plugin docs
   - What's unclear: Whether they're part of the public API or harness-internal event transformations
   - Recommendation: Lane D should search the OpenCode GitHub repo for these event types or verify against a live instance

2. **Should the ecosystem map be a single document or structured directory of files?**
   - What we know: Previous research documents are individual .md files (250-476 lines each). A combined ecosystem map could be 1000+ lines.
   - What's unclear: Whether downstream workstreams (HER-1 through HER-8) consume a single map or query individual documents
   - Recommendation: Produce both — a structured directory of per-domain maps + an index document (ecosystem-map.md) that cross-references all outputs

3. **Does the ROADMAP.md even exist?**
   - What we know: The SDK says `roadmap_exists: false`. PROJECT.md describes workstream-rooted phase layout.
   - What's unclear: Whether there's a surviving ROADMAP.md at a non-standard location or it was genuinely never created
   - Recommendation: Lane B should search for any ROADMAP.md files across all workstream directories

4. **Should Lane E skip the 18 "Concepts to NOT Re-implement"?**
   - What we know: The legacy-concept-catalog already identifies 18 concepts as "outdated/unnecessary"
   - What's unclear: Whether HER-0 should validate those skip recommendations or just accept them
   - Recommendation: Lane E should spot-check 3-5 of the "skip" concepts for correctness, then accept the catalog's recommendations

## Sources

### Primary (HIGH confidence)
- Context7 `/websites/opencode_ai_plugins` — OpenCode plugin SDK (tool(), Plugin(), hooks, compaction events) — verified 2026-05-05
- `.planning/research/GAP-MATRIX-2026-05-05.md` — 20 features classified by 4 paths × 2 lineages, 7 unwired subsystems
- `.planning/research/FEATURE-DEPENDENCY-GRAPH-2026-05-05.md` — 35 edges, 0 cycles, impact scores
- `.planning/codebase/IMPLEMENTATION-INVENTORY-2026-05-05.md` — 175 files, 23,360 LOC, full module inventory
- `.planning/research/legacy-concept-catalog-2026-05-05.md` — 84 concepts, 16 unique missing patterns
- `docs/proposals/VALIDATION-DECISIONS-2026-04-25.md` — Locked Q1-Q6 decisions
- `.planning/codebase/ARCHITECTURE.md` — System overview, component responsibilities, CQRS architecture
- `.planning/codebase/CONCERNS.md` — Tech debt, security, performance, fragile areas

### Secondary (MEDIUM confidence)
- `.planning/research/gsd-framework-reconnaissance.md` — GSD state machine, gate taxonomy, wave-based execution patterns
- `.hivemind/uat/team-b/results/team-b-batch-11-final-audit-2026-05-05.md` — 116/125 PASS, 6 production gaps
- `.planning/PROJECT.md` — Project overview, workstream-rooted phase layout, Q6 state root
- `.planning/workstreams/skill-ecosystem/CONTEXT.md` — SE-1 through SE-14 skill ecosystem phases
- `.planning/workstreams/agent-synthesis/CONTEXT.md` — AS-0 through AS-11 agent synthesis phases
- `src/plugin.ts` — Thin composition root, 16 tool registrations, CQRS hook wiring
- `src/lib/types.ts` — Shared types, TaskStatus, DelegationMeta, PermissionRule

### Tertiary (LOW confidence)
- `src/lib/AGENTS.md` — Module responsibilities table (may be stale — see CONCERNS.md notification-handler drift)

## Metadata

**Confidence breakdown:**
- Standard Stack: HIGH — all tools are existing project skills and verified MCP services. No new dependencies needed.
- Architecture: HIGH — the 5-parallel-audit-lane pattern is derived directly from the GAP-MATRIX's 4-path structure and the existing 4 foundational research documents. The OpenCode SDK integration was verified via Context7.
- Pitfalls: HIGH — all 5 pitfalls are derived from analysis of the existing research documents (the CONCERNS.md's documented drift, the IMPLEMENTATION-INVENTORY's unwired subsystem discovery, the UAT audit's gap catalog).

**Research date:** 2026-05-05
**Valid until:** 2026-05-19 (14 days — ecosystem changes slowly, but OpenCode SDK may update)
