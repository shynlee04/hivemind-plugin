# HiveMind OpenCode Ecosystem — Strategic Rebuild Master Plan

> **Created:** 2026-05-10 | **Revised:** 2026-05-10 (focused hierarchy)
> **Orchestrator:** hf-l0-orchestrator
> **Root Cause:** `stack-l3-opencode` skill built from archived `sst/opencode` (v1.14.28), not active `anomalyco/opencode` (v1.14.44)
> **Status:** IN PROGRESS — PHASE 1: 2/4 DONE, 3 GATE SKILLS IN PROGRESS
> **Active Session:** `ses_1f11e2cdbffeRR9iIo1D10tSek` (hf-l2-skill-builder)
> **Last Action:** stack-l3-opencode complete rebuild (2026-05-10 14:00)

---

## 0. Ground Truth

| Fact | Evidence |
|------|----------|
| Correct repo | `anomalyco/opencode` (150K+ stars, branch `dev`) |
| Current npm version | `@opencode-ai/sdk@1.14.44`, `@opencode-ai/plugin@1.14.44` |
| Wrong repo | `sst/opencode` (ARCHIVED) |
| Old version in skills | 1.14.28 (16 versions / 13 releases behind) |
| Correct source ingested | ✅ anomalyco/opencode → repomix (55 files, 127K tokens) |

---

## 1. Contamination Map (Verified)

### 💀 CRITICAL: Literal wrong-repo references (must REBUILD)

| # | Skill | Contamination | Severity |
|---|-------|--------------|----------|
| 1 | `stack-l3-opencode` | 10+ `sst/opencode` refs in SKILL.md, TOC.md, architecture.md, metadata.json, scripts/update.sh (10 curl URLs), metrics scorecard | 🔴 ROOT | ✅ REBUILT |
| 2 | `hm-l3-opencode-platform-reference` | 12 `sst/opencode` refs in 20K-line repomix dump (wrong repo bundled) | 🔴 FULL WRONG DUMP | ✅ REBUILT + AUDITED |
| 3 | `hm-l3-omo-reference` | 8 `sst/opencode` URLs in bundled OMO source (oh-my-openagent) | 🔴 ADAPTED FROM WRONG SOURCE | ⏳ PENDING |
| 4 | `gate-l3-lifecycle-integration` | 5 refs to v1.14.28 SDK surface (validates against wrong version) | 🟡 WRONG VALIDATION SURFACE | 🔄 NEXT |

### 🟡 SUSPECT: Content 13 versions behind (must AUDIT against corrected TIER 1)

| # | Skill | Dependency on OpenCode | Risk |
|---|-------|----------------------|------|
| 5 | `gate-l3-spec-compliance` | EARS criteria, SDK type references | MEDIUM |
| 6 | `gate-l3-evidence-truth` | Runtime evidence patterns, tool execution | MEDIUM |
| 7 | `hm-l3-opencode-project-audit` | Audits OpenCode project structure | MEDIUM |
| 8 | `hm-l3-opencode-non-interactive-shell` | Shell safety patterns, tool() patterns | LOW |
| 9 | `hf-l2-custom-tools-dev` | Teaches tool(), Zod schema, plugin hooks | HIGH — teaches patterns |
| 10 | `hf-l2-command-parser` | Command execution patterns | LOW |
| 11 | `stack-l3-zod` | tool.schema re-export validation | LOW |
| 12 | `stack-l3-bun-pty` | BunShell integration patterns | MEDIUM |

### ✅ CLEAN: No literal contamination, content not OpenCode-source-dependent

| # | Skill | Reason |
|---|-------|--------|
| — | `hm-l3-hivemind-engine-contracts` | References harness internals (src/), not OpenCode source |
| — | `hm-l3-integration-contracts` | Skill↔agent bindings, not source-dependent |
| — | `hm-l3-tool-capability-matrix` | Tool descriptions, not source-pattern dependent |
| — | `stack-l3-nextjs` | Next.js reference, not OpenCode-dependent |
| — | `stack-l3-vitest` | Vitest reference, not OpenCode-dependent |
| — | `stack-l3-json-render` | json-render reference, not OpenCode-dependent |
| — | `gsd-*` (all) | Separate framework, unrelated |
| — | `.archive/` (all) | FROZEN, never touched |

---

## 2. Execution Plan: 3 Phases

### PHASE 1: REBUILD CORE (4 skills, sequential)
```
stack-l3-opencode                  ← ROOT. Complete rebuild from anomalyco/opencode.
  │                                  Fix all sst/opencode refs. Rewrite update.sh.
  │                                  Add: ACP docs, TUI v2 docs, pipeline patterns,
  │                                  stack chains, department bundles.
  ▼
hm-l3-opencode-platform-reference  ← Re-ingest repomix from anomalyco/opencode.
  │                                  Replace entire references/ directory.
  │
  ▼
hm-l3-omo-reference                ← Re-bundle OMO from correct source.
  │                                  Replace references/ with fresh repomix output.
  │
  ▼
gate-l3-lifecycle-integration      ← Rewrite SDK compliance docs against v1.14.44.
                                     Update all 5 v1.14.28 references. Revalidate
                                     all surface checks against corrected TIER 1.
```

### PHASE 2: DEEP AUDIT (8 skills, can parallel after PHASE 1)
```
⚠️  USER PRIORITY: 3 GATE SKILLS FIRST (before remaining Phase 1 + Phase 2)
  • gate-l3-lifecycle-integration  → 🔄 DISPATCHING NOW (SDK compliance rewrite)
  • gate-l3-evidence-truth         → 🟡 VALIDATE against v1.14.44 evidence hierarchy
  • gate-l3-spec-compliance        → 🟡 VALIDATE EARS criteria, SDK type references
  ⬇ (then continue with remaining skills)

Each skill audited against corrected stack-l3-opencode surface:
  - Are API signatures (tool(), hook(), PluginInput) correct?
  - Are new subsystems (ACP, TUI v2 keymap) reflected?
  - Are deprecated patterns (api.command, AuthOuathResult) marked?
  - Does chat.params.model reflect REQUIRED status?

Per-skill audit output: AUDIT-PASS / NEEDS-FIX / NEEDS-REBUILD
  Fixes applied by hf-l2-skill-builder. Rebuilds by hf-l2-skill-builder.
```

### PHASE 3: SYNTHESIS (3 new strategic skills)
```
NEW: pipeline-patterns     ← How OpenCode skills compose into development workflows
NEW: stack-chains          ← Dependency ordering between stack-* skills
NEW: department-bundles    ← Role-based skill loading bundles
```

---

## 3. Per-Skill Rebuild Criteria

Every PHASE 1 rebuild must pass these gates:

### Gate A: Source Correctness
- [ ] Zero `sst/opencode` references remain (grep verified)
- [ ] Version string is 1.14.44 (not 1.14.28)
- [ ] All API signatures match anomalyco/opencode source (not recalled from old docs)
- [ ] All curl/repomix URLs point to anomalyco/opencode

### Gate B: API Depth Compliance
- [ ] `ToolDefinition` documented as `ReturnType<typeof tool>` (derived, not inline)
- [ ] `chat.params.model` documented as REQUIRED (`model: Model`)
- [ ] `WorkspaceAdapter` spelled correctly (not Adaptor)
- [ ] `ProviderHookContext` documented as named exported type
- [ ] `AuthOAuthResult` marked as replacement for deprecated `AuthOuathResult`
- [ ] ACP protocol documented (new subsystem — JSON-RPC over stdio)
- [ ] TUI v2 keymap API documented (`api.keymap.registerLayer`, deprecation of `api.command`)
- [ ] V2 client `experimental_workspaceID` documented
- [ ] `command.executed` event type documented

### Gate C: Synthesis Completeness
- [ ] `pipeline-patterns.md` — how this skill composes with others in development workflows
- [ ] `stack-chains.md` — dependency ordering between stack skills
- [ ] `department-bundles.md` — role-based skill loading bundles
- [ ] Each synthesis reference cites specific skill names (not hypothetical)

### Gate D: Skill Quality (skill-judge criteria)
- [ ] Progressive disclosure: SKILL.md < 200 lines, references/ for depth
- [ ] Trigger phrases in description match actual user prompts
- [ ] All file paths verified (no dead references)
- [ ] Version in metadata.json matches SKILL.md
- [ ] All allowed-tools are actually needed by the skill

---

## 4. Delegation Approach

### L0 ORCHESTRATOR: DELEGATE ONLY — NEVER EXECUTE
- All file operations (repomix download, file copy, skill edits) delegated to hf-l1-coordinator
- Orchestrator classifies, dispatches, monitors, gates — never touches files
- This file is the single source of truth for what's rebuilt and why

### Batch 0: Repomix Replacement (delegate once, handle 4 files)
```
TARGET: 4 massive repomix dumps (>700K lines total, all from wrong source):
  ① hm-l3-opencode-platform-reference/references/repomix-opencode.xml  (717K lines)
  ② hm-l3-opencode-platform-reference/references/repomix-opencode.md   (737K lines)
  ③ hm-l3-omo-reference/references/oh-my-openagent-full.xml            (276K lines)
  ④ hm-l3-omo-reference/references/files.md                            (276K lines)

ACTION: Fresh repomix from anomalyco/opencode → replace files ①②.
        Re-bundle OMO from correct source (if available) → replace files ③④.
        ZERO content fixes. Complete file replacement. 
        No reading needed — these are 20K+ line dumps.
```

### Batch 1: Skill Rewrite (delegate per skill group)
```
④ SKILLS, REWRITTEN (not patched — 13 versions behind means content is stale):

  SKILL SET A — Root + References (2 skills, can parallel):
  • stack-l3-opencode: Complete rewrite. Fix ALL sst/opencode refs, 
    rewrite update.sh (10 curl URLs), rewrite API docs (plugin.md, sdk.md, types.md),
    add ACP docs, TUI v2 docs, pipeline patterns, stack chains, department bundles.
  • gate-l3-lifecycle-integration: Rewrite SDK compliance docs against v1.14.44.
    Update all 5 version references. Revalidate surface checks.

  SKILL SET B — Platform Docs (2 skills, after SET A):
  • hm-l3-opencode-platform-reference: Update SKILL.md metadata/version/source.
    Repomix dumps already replaced in Batch 0.
  • hm-l3-omo-reference: Update SKILL.md. Repomix dumps already replaced in Batch 0.
```

### Batch 2: Deep Audit (8 skills, after Batch 1)
```
Per-skill audit against corrected stack-l3-opencode surface.
Audit criteria: API signatures, new subsystems, deprecated patterns.
Output: AUDIT-PASS / NEEDS-FIX / NEEDS-REBUILD.
Fixes/replacements dispatched to hf-l2-skill-builder per findings.
```

### Delegation Rules
1. **Coordinator dispatched for each batch** — hf-l1-coordinator handles Batch 0+1, then Batch 2.
2. **Checkpoints at batch completion** — `.scratch/batch-N-checkpoint-*.md`.
3. **Delegations tracked** in `.hivemind/state/delegations.json`.
4. **Gate triad runs per batch** before advancing.
5. **3 gate failures = escalate.**

### Resume Protocol
1. Read this file → find current batch
2. Read batch checkpoint for status
3. Read `.hivemind/state/delegations.json` for active delegation IDs
4. Resume with EXACT session ID

---

## 5. What NOT to Touch

| Category | Skills |
|----------|--------|
| ARCHIVE (frozen) | `.archive/`, `.archive-refactoring-skills/` |
| Clean stack skills (audit in PHASE 2, rebuild only if audit fails) | `stack-l3-nextjs`, `stack-l3-vitest`, `stack-l3-json-render` |
| Contract skills (audit in PHASE 2) | `hm-l3-hivemind-engine-contracts`, `hm-l3-integration-contracts`, `hm-l3-tool-capability-matrix` |
| GSD framework | All 65 `gsd-*` skills — separate framework |
| Authoring skills not OpenCode-source-dependent | `hf-l2-naming-syndicate`, `hf-l2-meta-builder`, `hf-l2-agents-md-sync` |

---

## 6. Checkpoint File Map

| File | Purpose |
|------|---------|
| `.scratch/ecosystem-rebuild-master-plan-2026-05-10.md` | ← THIS FILE — master anchor |
| `.scratch/opencode-source-audit-2026-05-10.md` | Source diff report (ground truth) |
| `.scratch/phase-1-checkpoint-stack-opencode-2026-05-10.md` | stack-l3-opencode rebuild status |
| `.scratch/phase-1-checkpoint-platform-reference-2026-05-10.md` | platform-reference rebuild status |
| `.scratch/phase-1-checkpoint-omo-reference-2026-05-10.md` | omo-reference rebuild status |
| `.scratch/phase-1-checkpoint-gate-lifecycle-2026-05-10.md` | gate-lifecycle rebuild status |
| `.scratch/phase-2-audit-report-2026-05-10.md` | PHASE 2 combined audit report |
| `.scratch/phase-3-synthesis-2026-05-10.md` | PHASE 3 synthesis status |
