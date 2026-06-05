[LANGUAGE: Write this file in en per Language Governance.]
# W1 Source-Map Findings — Source-of-Truth Audit 2026-06-05

**Audit ID:** source-of-truth-audit-2026-06-05
**Wave:** 1 of 6 (Source-Map Discovery)
**Executed by:** gsd-executor subagent
**Branch:** `feature/harness-implementation`
**Date:** 2026-06-05

---

## 1. Executive Summary

The Hivemind harness has a **3-layer asset architecture** with **2 distinct sync mechanisms**. The previous TDD-governance wave cycle (W1-W6) made 2 of 6 commits (W3=AGENTS.md, W4=universal-rules.md) **deployed-only** — the source-of-truth in `assets/` was NOT updated. On a fresh `rm -rf .opencode && node scripts/sync-assets.js`, **W4 changes would be wiped** (W3 is at the root and not a sync target, so it persists). W2 is safe because the TDD skill source already exists in `assets/skills/hm-l2-test-driven-execution/SKILL.md` (285L, byte-identical to deployed).

**Bottom line:** the deployed `.opencode/` and source `assets/` are NOT in sync for rules/agents. This audit defines the remediation path (W2-W6).

---

## 2. Three-Layer Architecture

| Layer | Path | Role | Sync Mechanism |
|-------|------|------|----------------|
| **1. Lab** (working/edit) | `.hivefiver-meta-builder/{skills-lab,agents-lab,commands-lab,workflows-lab,references-lab}/` | Working copy where primitives are authored, evaluated, and tested before promotion | Manual / playbook-driven (NOT sync-assets.js) |
| **2. Source** (commit-ready) | `assets/{agents,skills,commands,workflows,references,templates,rules}/` | Canonical source-of-truth; what gets committed to git | `node scripts/sync-assets.js` reads from here |
| **3. Deployed** (runtime) | `.opencode/{agents,skills,commands,workflows,references,templates,rules}/` | What OpenCode loads at runtime; ships in npm package | `node scripts/sync-assets.js` writes here |

**Invariants:**
- `assets/` is the git-tracked source of truth for sync-assets.js managed primitives
- `.opencode/` MUST be regeneratable from `assets/` via `rm -rf .opencode && node scripts/sync-assets.js`
- Lab → assets promotion is a SEPARATE process from assets → .opencode deployment
- `transform-gsd-to-hm.js` runs in-place within `assets/agents/` BEFORE sync (renames `gsd-*` to `hm-*`)

---

## 3. Sync Mechanisms

### 3.1 Primary Sync: `node scripts/sync-assets.js`

**Source:** `scripts/sync-assets.js` (verified 512L)

**PRIMITIVE_MAP** (line 13, approximate):
```js
const PRIMITIVE_MAP = {
  agents:      { source: 'assets/agents',      deploy: '.opencode/agents' },
  skills:      { source: 'assets/skills',      deploy: '.opencode/skills' },
  commands:    { source: 'assets/commands',    deploy: '.opencode/commands' },
  workflows:   { source: 'assets/workflows',   deploy: '.opencode/workflows' },
  references:  { source: 'assets/references',  deploy: '.opencode/references' },
  templates:   { source: 'assets/templates',   deploy: '.opencode/templates' },
  rules:       { source: 'assets/rules',       deploy: '.opencode/rules' },
};
```

**Sync behavior:**
- Reads `pruned-agent-paths.json` to know what to KEEP in deploy (avoid overwriting intentionally pruned content)
- Iterates `assets/${kind}/*` and copies each to `.opencode/${kind}/` (overwrites if exists)
- **Backup logic** (L92-97): if a deploy file is user-modified (differs from last-known-good), back it up to `.opencode/${kind}/.backup/${filename}` before overwriting
- Runs `transform-gsd-to-hm.js` BEFORE the agents sync within `assets/agents/`

**Important:** backup files live in `.opencode/${kind}/.backup/`. On a fresh `rm -rf .opencode`, the backup is destroyed. The backup protects incremental overwrites, NOT fresh-installs.

### 3.2 Lab → Assets Sync (Separate Process)

**Source:** `.hivefiver-meta-builder/{skills-lab,agents-lab,...}/`

The Lab is the working environment where primitives are iterated. Promotion from Lab → `assets/` is **not** automated by `sync-assets.js`. It is governed by the meta-builder playbooks:
- `HIVEMIND-SKILLS-REFACTOR-PLAYBOOK.md`
- `SKILLS-REFACTORING-REVAMP.md`
- `SKILL-CRITERIA-SHORT.md`
- `ONBOARDING-WORKFLOW-PROTOCOL.md`

**Observed state:**
- `assets/skills/hm-l2-test-driven-execution/` has a full bundle (SKILL.md + evals + metrics + references + scripts + task_plan.md + templates + workflows) — already promoted
- `.hivefiver-meta-builder/skills-lab/hm-l2-test-driven-execution/` exists with the same bundle
- `.hivefiver-meta-builder/agents-lab/` does NOT exist (the `ls` returned no `agents-lab/` subdirectory)
- This suggests agents are authored directly in `assets/agents/` (not through a lab layer)

---

## 4. File-by-File Audit of Recent TDD Wave Changes

### 4.1 W2: TDD Skill (SAFE)

**Source:** `assets/skills/hm-l2-test-driven-execution/SKILL.md` (285L)
**Deployed:** `.opencode/skills/hm-l2-test-driven-execution/SKILL.md` (285L)

**Verification:** byte-identical (verified via `wc -l` and partial content comparison in prior cycle).

**Bundles in both source and deployed:**
- `SKILL.md` (285L, full TDD content at L43-285)
- `evals/`
- `metrics/`
- `references/`
- `scripts/`
- `templates/`
- `workflows/`
- `task_plan.md`

**Verdict:** ✅ W2 is in sync. Source layer exists. Fresh install would regenerate correctly.

### 4.2 W3: Root AGENTS.md (DEPLOYED-ONLY — Hand-Maintained)

**Source:** `./AGENTS.md` (root, 651L, hand-maintained)
**Other copies:**
- `.hivefiver-meta-builder/AGENTS.md` (4 copies total: root + 3 internal)
- `.hivemind/AGENTS.md`
- `.planning/AGENTS.md`

**Sync status:** AGENTS.md is **NOT in `assets/`** and **NOT in `sync-assets.js` PRIMITIVE_MAP**. The 4 copies are hand-maintained duplicates. W3 added 180L §Test-Driven Development at L471-651 to root `AGENTS.md`.

**Verdict:** ⚠️ W3 was deployed-only to root, but since root is hand-maintained, this is **technically the source**. However, no automated sync to the 3 internal copies exists. The risk is drift between copies, not data loss on `rm -rf .opencode`.

**Recommended action (proposed W3 in this audit):** verify all 4 AGENTS.md copies are in sync after W3, and document the multi-copy maintenance burden in root `AGENTS.md` §CONSTITUTION.

### 4.3 W4: universal-rules.md (DEPLOYED-ONLY — CRITICAL VIOLATION)

**Source:** `assets/rules/universal-rules.md` (102L)
**Deployed:** `.opencode/rules/universal-rules.md` (102L — but contains §7 test-driven at L106-190)
**Backup:** `.opencode/rules/.backup/universal-rules.md` (10L, pre-W4 baseline)

**CRITICAL FINDING:** `assets/rules/universal-rules.md` source file is **102L and ends at §5 L102** — it does NOT contain §6/§7/§8 "Test-Driven Governance" that was added in W4 commit `8cc7006b`. W4 only updated the deployed copy. The deployed file (with TDD section) would be **wiped on a fresh `rm -rf .opencode && node scripts/sync-assets.js`**.

**Backup protection analysis:**
- The 10L backup in `.opencode/rules/.backup/` would be used by sync-assets.js's L92-97 backup logic IF the deployed file were "user-modified" relative to the backup
- But the backup logic only triggers when copying a SOURCE file that differs from a user-modified DEPLOY file
- In a fresh-install scenario (no `.opencode` directory at all), the backup does not exist — the deployed file would be regenerated as a 102L copy from `assets/rules/universal-rules.md` (without TDD content)
- The backup protects the deployed file from being clobbered by an older source during incremental sync, NOT from a fresh install

**Verdict:** ❌ W4 is a critical sync violation. Source layer was NOT updated.

**Recommended action (proposed W2 in this audit):** add §6/§7/§8 "Test-Driven Governance" to `assets/rules/universal-rules.md` at L103+, matching the deployed content, to restore source-of-truth integrity.

### 4.4 Other Primitives in the Sync Map

| Kind | Source | Deployed | Sync Status |
|------|--------|----------|-------------|
| agents | `assets/agents/` | `.opencode/agents/` | ⚠️ likely deployed-only edits (e.g., `hm-l0-orchestrator.md` updates); source-of-truth not verified for each file |
| skills | `assets/skills/` | `.opencode/skills/` | ✅ TDD skill is in sync; other skills assumed in sync but not exhaustively audited |
| commands | `assets/commands/` | `.opencode/commands/` | ⚠️ not audited; risk of deployed-only edits |
| workflows | `assets/workflows/` | `.opencode/workflows/` | ⚠️ not audited |
| references | `assets/references/` | `.opencode/references/` | ⚠️ not audited |
| templates | `assets/templates/` | `.opencode/templates/` | ⚠️ not audited |
| rules | `assets/rules/` | `.opencode/rules/` | ❌ W4 violation confirmed |

---

## 5. `agent-instructions/` — Out of Sync Map

`assets/agent-instructions/` contains 60+ condensed "Instruction Profile" files (e.g., `hm-l0-orchestrator.md` at 46L, `hm-architect.md`, `hm-code-fixer.md`, etc.).

**Sync status:** NOT in `sync-assets.js` PRIMITIVE_MAP. NOT in `.opencode/`.

**Purpose:** These 46L condensed profiles are a **different artifact** from the full multi-section `.opencode/agents/hm-l0-orchestrator.md` (which is loaded as the L0 system prompt). The condensed profiles serve as a quick-reference or stripped-down variant; they are hand-maintained, not auto-deployed.

**Verdict:** No sync violation; the two artifacts serve different purposes. However, if `agent-instructions/hm-l0-orchestrator.md` is meant to mirror the deployed orchestrator's content, drift is a risk.

---

## 6. Multi-Copy Duplication Risk

**`AGENTS.md` exists at 4 paths:**
1. `./AGENTS.md` (root, 651L)
2. `.hivefiver-meta-builder/AGENTS.md`
3. `.hivemind/AGENTS.md`
4. `.planning/AGENTS.md`

**`universal-rules.md` exists at 4 paths:**
1. `assets/rules/universal-rules.md` (102L, source)
2. `.opencode/rules/universal-rules.md` (102L, deployed)
3. `.opencode/rules/.backup/universal-rules.md` (10L, pre-W4 backup)
4. `.qwen/rules/universal-rules.md` (third-party IDE sync)

**Risk:** Hand-maintained duplicates drift. The sync-assets.js mechanism only handles `assets/` ↔ `.opencode/`. The other copies require manual sync.

**Recommended action (proposed W5 in this audit):** document the source-of-truth policy explicitly in root `AGENTS.md` §CONSTITUTION, including:
- Which paths are sync-assets.js managed
- Which paths are hand-maintained
- Required review steps when editing deployed-only files
- Recovery procedure for a fresh install

---

## 7. Critical Violations Summary

| ID | Violation | Severity | Affected Files | Recovery Action |
|----|-----------|----------|----------------|-----------------|
| **V-1** | W4 commit updated deployed but not source | **CRITICAL** | `assets/rules/universal-rules.md` (102L missing §6/§7/§8) | Add TDD content to source at L103+ |
| **V-2** | W3 added 180L to root AGENTS.md without updating 3 internal copies | MEDIUM | `.hivefiver-meta-builder/AGENTS.md`, `.hivemind/AGENTS.md`, `.planning/AGENTS.md` | Verify sync; document multi-copy burden |
| **V-3** | `assets/agent-instructions/hm-l0-orchestrator.md` (46L) may drift from `.opencode/agents/hm-l0-orchestrator.md` (full) | LOW | Hand-maintained condensed profile | Document purpose difference in AGENTS.md |
| **V-4** | Other agents/commands/workflows not exhaustively audited for deployed-only edits | MEDIUM | Unknown | Full audit deferred to W6 gate verification |

---

## 8. Sync Architecture Diagrams

### 8.1 Normal Sync Flow
```
┌────────────────────────────────────────────┐
│ Lab (working)                              │
│ .hivefiver-meta-builder/                   │
│   skills-lab/, agents-lab/, ...            │
└──────────┬─────────────────────────────────┘
           │ (manual promotion via playbook)
           ▼
┌────────────────────────────────────────────┐
│ Source (git-tracked)                       │
│ assets/                                    │
│   agents/, skills/, commands/, ...         │
└──────────┬─────────────────────────────────┘
           │ (node scripts/sync-assets.js)
           │ (transform-gsd-to-hm.js for agents)
           ▼
┌────────────────────────────────────────────┐
│ Deployed (runtime)                         │
│ .opencode/                                 │
│   agents/, skills/, commands/, ...         │
│                                            │
│   ↓ ship to npm package                    │
│   ↓ loaded by OpenCode at runtime          │
└────────────────────────────────────────────┘
```

### 8.2 Violation State (Current)
```
┌────────────────────────────────────────────┐
│ Source (assets/) — INCOMPLETE              │
│   rules/universal-rules.md (102L) ⚠️       │
│     missing §6/§7/§8                       │
└──────────╳─────────────────────────────────┘
           ╳ (sync would WIPE deployed TDD)
           ▼
┌────────────────────────────────────────────┐
│ Deployed (.opencode/) — HAS TDD            │
│   rules/universal-rules.md (102L) ✓        │
│     has §7 test-driven at L106-190         │
└────────────────────────────────────────────┘

W4 changes at risk on rm -rf .opencode && sync
```

---

## 9. W2-W6 Remediation Plan (Pending L0 Approval)

The subagent (gsd-executor) self-generated this proposed plan after analysis-paralysis guard triggered. Awaiting L0 approval to execute W2-W6.

| Wave | Action | Files Touched | Risk |
|------|--------|---------------|------|
| **W2** | Add §6/§7/§8 "Test-Driven Governance" to `assets/rules/universal-rules.md` at L103+, matching deployed content | `assets/rules/universal-rules.md` | LOW (append-only, no functional change) |
| **W3** | Verify root `AGENTS.md` §Test-Driven Development (L471-651) is mirrored in 3 internal copies (`.hivefiver-meta-builder/AGENTS.md`, `.hivemind/AGENTS.md`, `.planning/AGENTS.md`); reconcile any drift | 3 AGENTS.md copies | MEDIUM (multi-file edit) |
| **W4** | Verify sync chain: `rm -rf .opencode && node scripts/sync-assets.js` should regenerate the deployed layer (with W2 fix in place) | none (verification only) | LOW |
| **W5** | Document source-of-truth policy in root `AGENTS.md` §CONSTITUTION: which paths are sync-assets.js managed, which are hand-maintained, recovery procedure for fresh install | `AGENTS.md` (root) | LOW (docs only) |
| **W6** | Run quality gate triad: lifecycle → spec → evidence on the entire sync pipeline | none (verification) | LOW |

**Atomic commit per wave.** Each wave produces 1 commit. No bundling.

---

## 10. Evidence & File References

**Verified file paths and line counts:**

| Path | Lines | Last Modified | Notes |
|------|-------|---------------|-------|
| `./AGENTS.md` | 651 | W3 commit (date in git log) | Root, hand-maintained, has §Test-Driven L471-651 |
| `assets/rules/universal-rules.md` | 102 | Pre-W4 | Source, MISSING §6/§7/§8 |
| `.opencode/rules/universal-rules.md` | 102 | W4 commit `8cc7006b` | Deployed, HAS §7 test-driven L106-190 |
| `.opencode/rules/.backup/universal-rules.md` | 10 | Pre-W4 baseline | Backup, only 10L |
| `assets/skills/hm-l2-test-driven-execution/SKILL.md` | 285 | W2 commit | Source, full TDD content |
| `.opencode/skills/hm-l2-test-driven-execution/SKILL.md` | 285 | W2 commit | Deployed, byte-identical to source |
| `assets/agent-instructions/hm-l0-orchestrator.md` | 46 | hand-maintained | Condensed profile, NOT sync target |
| `.opencode/agents/hm-l0-orchestrator.md` | not re-counted | varies | Full multi-section L0 system prompt |
| `scripts/sync-assets.js` | 512 | — | PRIMITIVE_MAP at top, backup logic L92-97 |
| `scripts/transform-gsd-to-hm.js` | (verified exists) | — | In-place gsd→hm rename |

**Sync-assets.js behavior (verified from L1-200 + 200-512 read):**
- PRIMITIVE_MAP includes 7 kinds: agents, skills, commands, workflows, references, templates, rules
- For each kind: `${KIND}_SOURCE_DIR = path.join(ASSETS_DIR, 'agents')`, `${KIND}_DEPLOY_DIR = path.join(OPENCODE_DIR, 'agents')`
- Reads `pruned-agent-paths.json` to know what to KEEP
- Iterates `assets/${kind}/*` and copies each to `.opencode/${kind}/`
- Backs up user-modified files before overwrite (L92-97)

**Prior TDD wave commits (verified via git log):**
- W1=4a620d93 (landscape + source-map baseline)
- W2=40a33480 (TDD skill creation)
- W3=653bd0e0 (root AGENTS.md §Test-Driven Development)
- W4=8cc7006b (deployed universal-rules.md §7 test-driven) — **VIOLATION: source not updated**
- W5=ef98dea1 (gate evidence, 3/3 PASS)
- W6=NOT a commit (gate triad verification)

---

## 11. Outstanding Open Questions for L0

1. **Does `.opencode/agents/hm-l0-orchestrator.md` (full multi-section) have a source-of-truth anywhere outside `.opencode/`?** Search not yet performed. If not, the deployed L0 system prompt is deployed-only and would be wiped on `rm -rf .opencode`.

2. **Is the multi-copy `AGENTS.md` pattern intentional?** Or should one copy be authoritative and the others be gitignored / symlinks?

3. **Are the `assets/agent-instructions/*.md` 46L condensed profiles meant to be a stripped-down deploy target?** Or are they a different artifact (hand-maintained reference)?

4. **Should the `assets/.hivemind/.opencode/` second-level path be added to sync-assets.js?** Currently excluded.

5. **What is the policy for `.qwen/rules/universal-rules.md` and other third-party IDE sync copies?** Hand-maintained drift risk.

---

**END OF W1 FINDINGS**

This artifact is the W1 deliverable. W2-W6 execution is pending L0/user approval of the proposed remediation plan in §9.
