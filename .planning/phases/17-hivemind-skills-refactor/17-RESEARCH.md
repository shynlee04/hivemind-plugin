# Phase 17: Hivemind Skills Refactor — Critical Fixes - Research

**Researched:** 2026-04-23
**Domain:** OpenCode soft meta-concepts (skills), skill quality audit, progressive disclosure patterns
**Confidence:** HIGH (all files read from disk, line numbers verified)

## Summary

Phase 17 resolves five locked critical issues (C1–C5) in the `.opencode/skills/` layer and integrates tech-stack synthesis across the `hm-*` skill family. Research confirms that **all five issues are real and actionable**, with no blockers. The retired `skill-synthesis` skill is structurally complete (174-line SKILL.md + references + scripts + evals + templates) and should be **restored to active duty** rather than refactored or migrated, because its integration points (`validate-gate.sh` synthesize action, meta-builder routing table line 303) are already live. The four meta-builder depth stubs are genuine orphans — they exist on disk but are not referenced in the SKILL.md body, creating a discoverability gap. The `oh-my-openagent-reference` audit reveals **zero dead references in the SKILL.md body** but a missing `tech-stack.md` file that the skill's design spec promises. IDE skill directories (`.trae/`, `.windsurf/`, `.codex/`, `.github/skills/`) are **not gitignored** and risk polluting commits. Finally, the `hm-*` skills have a **schema conflict** in their `.tech-registry.json` formats that must be unified before distributed tech-stack synthesis can work.

**Primary recommendation:** Restore `skill-synthesis` from retired → active; fill the 4 depth stubs AND add them to meta-builder's Reference Map; generate missing `tech-stack.md` for oh-my-openagent-reference; gitignore IDE directories; unify tech-registry schema on the `hm-detective` format.

---

## User Constraints (from CONTEXT.md)

### Locked Decisions
- **C1:** Audit retired `skill-synthesis` at `.hivefiver-meta-builder/skills-lab/retired/skill-synthesis/` before deciding restore vs. refactor vs. migrate. Decision deferred to researcher/planner after audit.
- **C2:** Fill all 4 meta-builder depth reference files with real content (not stubs). Each must have: what it does, WHY it matters, WHEN to use, inline examples, permission recommendations.
- **C3+C4:** Full audit of `oh-my-openagent-reference` for ALL dead references. C4 (empty `project-structure.md`) is verified RESOLVED (674 lines). C3 (`tech-stack.md` missing) must be generated from packed repo data.
- **C5:** IDE-managed skill directories (`.trae/skills/`, `.windsurf/skills/`, `.codex/skills/`, `.github/skills/`) are third-party sync artifacts — LEFT UNTOUCHED. Add them to `.gitignore`. Document `.opencode/skills/` as canonical in AGENTS.md.
- **NEW:** Tech-stack synthesis distributed across `hm-synthesis`, `hm-deep-research`, `hm-detective`. All 3 share a common tech-registry format.

### the agent's Discretion
- Exact content for each depth file (C2).
- Exact tech-registry format shape (D-15).
- Whether to create new reference files or integrate into existing sections.
- Ordering/priority of fixes within the phase plans.
- Test/verification approach for skill content changes (no `src/` tests affected).

### Deferred Ideas (OUT OF SCOPE)
- `hm-*` naming mandate for all 23 skills — Phase 18.
- Agent or command refactoring — subsequent cycle.
- Hard harness `src/` code changes.
- New skill creation beyond tech-stack synthesis integration.
- IDE-managed skill directories themselves — left untouched, only gitignored.

---

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| REQ-17-01 | Audit retired `skill-synthesis` and produce restore/refactor/migrate recommendation | Retired skill fully inventoried; design spec and plan doc on disk; integration points verified live |
| REQ-17-02 | Fill 4 meta-builder depth stubs with real content | All 4 stubs read; line counts confirmed; orphan status verified (not in Reference Map) |
| REQ-17-03 | Audit `oh-my-openagent-reference` for dead references and generate missing `tech-stack.md` | SKILL.md body cross-checked against `references/` directory; `tech-stack.md` confirmed absent |
| REQ-17-04 | Gitignore IDE skill directories and document canonical location | `.gitignore` read; IDE directories confirmed present and un-ignored; `.claude/skills/` confirmed absent |
| REQ-17-05 | Integrate tech-stack synthesis across `hm-synthesis`, `hm-deep-research`, `hm-detective` | All 3 SKILL.md files read; existing `.tech-registry.json` schemas extracted; schema conflict identified |

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Skill routing & progressive disclosure | OpenCode Skill Loader (Client) | — | OpenCode reads `.opencode/skills/` at runtime; no server involvement |
| Skill authoring & validation | Hivefiver Meta-Builder (Local Dev) | — | `.hivefiver-meta-builder/skills-lab/` is source of truth; symlinked to `.opencode/` for testing |
| Tech-stack detection | `hm-detective` (Client, on load) | `hm-synthesis` (Client, on export) | Detective discovers stack; synthesis persists it to registry |
| Version-matched documentation research | `hm-deep-research` (Client, on load) | — | Queries Context7 with resolved versions; no backend state |
| Git hygiene for IDE artifacts | Local Git Working Tree | — | `.gitignore` only; no runtime behavior |

---

## Standard Stack

### Core
| Library/Tool | Version | Purpose | Why Standard |
|--------------|---------|---------|--------------|
| repomix | latest (npm) | Remote repo packing, tech-stack extraction | Already used by `hm-synthesis` and retired `skill-synthesis` |
| OpenCode `skill` tool | built-in | Progressive disclosure, skill loading | Native OpenCode capability; no alternative |
| Bash (non-interactive) | system | Validation scripts (`validate-gate.sh`, `check-overlaps.sh`) | Required by `use-authoring-skills` scripts; must be `CI=true` safe |

### Supporting
| Asset | Location | Purpose | When to Use |
|-------|----------|---------|-------------|
| `validate-gate.sh` | `.hivefiver-meta-builder/skills-lab/active/refactoring/use-authoring-skills/scripts/` | Pre-flight intent/pattern/checklist gate | Before any skill creation, edit, audit, or synthesis |
| `check-overlaps.sh` | same | Detects duplicate triggers between skills | Before declaring a skill complete |
| `skill-judge` (external) | `.agents/skills/skill-judge/` | 5-dimension quality matrix | When scoring skill quality (external to this repo) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Restore retired `skill-synthesis` | Migrate capability into `hm-synthesis` | `hm-synthesis` is a P2 domain skill with different scope (compression/artifact export); adding GitHub ingestion would bloat it and violate single-responsibility |
| Generate `tech-stack.md` manually | Auto-generate from repomix metadata | Auto-generation is feasible but manual is safer for a one-time fix; recommend manual with repomix as source |

---

## Architecture Patterns

### System Architecture Diagram

```
User Request ("create skill from GitHub")
    ↓
meta-builder SKILL.md (routing table line 303)
    ↓
skill-synthesis SKILL.md (if restored)
    ├── Phase 1: INGEST → repomix --remote → packed XML
    ├── Phase 2: CLASSIFY → classify-pattern.sh → JSON report
    ├── Phase 3: SCAFFOLD → SKILL.md + references + scripts + evals
    └── Phase 4: VALIDATE → validate-gate.sh → validate-skill.sh → check-overlaps.sh
        ↓
    Output: Complete skill directory in .hivefiver-meta-builder/skills-lab/
        ↓
    Symlink to .opencode/skills/ for live testing
```

### Recommended Project Structure (Skills Layer)

```
.hivefiver-meta-builder/skills-lab/
├── active/
│   └── refactoring/
│       ├── meta-builder/           # C2 target: fill 4 depth stubs
│       ├── oh-my-openagent-reference/  # C3+C4 target: generate tech-stack.md
│       ├── hm-synthesis/           # D-14 target: add tech-stack detection section
│       ├── hm-deep-research/       # D-14 target: add version-matched research section
│       ├── hm-detective/           # D-14 target: add "scan for tech stack" reading mode
│       └── skill-synthesis/        # C1 target: restore from retired/
└── retired/
    └── skill-synthesis/            # C1 source (to be moved)

.opencode/skills/  ← symlinks to ../.hivefiver-meta-builder/skills-lab/active/refactoring/
```

### Pattern 1: Progressive Disclosure (Reference Loading)
**What:** SKILL.md body contains a decision tree; agents load ONLY the one reference file that matches their intent. Never load all references. [VERIFIED: meta-builder SKILL.md line 123-124]
**When to use:** All P2 domain skills with >3 reference files.
**Example:**
```markdown
User says...                                    → Load
"create skills from GitHub" / "synthesize"      → references/01-github-ingestion.md
"find skill patterns" / "classify skills"       → references/02-pattern-classifier.md
```

### Pattern 2: Lab → Symlink → Runtime
**What:** Source of truth is `.hivefiver-meta-builder/**-lab/`. `.opencode/` contains symlinks for OpenCode runtime consumption. [VERIFIED: meta-builder SKILL.md line 60, AGENTS.md]
**When to use:** All soft meta-concepts (skills, agents, commands).
**Anti-pattern to avoid:** Editing `.opencode/skills/` directly — changes are lost because they are symlinks, not real files. [VERIFIED: meta-builder SKILL.md anti-pattern "The Lab Ignorer"]

### Pattern 3: Dual-Layer Validation
**What:** `validate-gate.sh` runs BEFORE any work (intent + checklist). `validate-skill.sh` runs AFTER work (structure + frontmatter). `check-overlaps.sh` runs at the end (trigger uniqueness). [VERIFIED: validate-gate.sh lines 20-23, 96-101]
**When to use:** Every skill creation, edit, audit, or synthesis pipeline.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| GitHub repo packing for skill ingestion | Custom `git clone` + parser pipeline | `repomix --remote` with `--include` flags | Handles auth, branch targeting, compression, and output formats in one CLI call |
| Skill quality scoring | Ad-hoc bash checks | `skill-judge` 5-dimension matrix + `grade-outputs.sh` mechanical proxies | The matrix is battle-tested; ad-hoc scores are inconsistent |
| Trigger query validation | LLM simulation in bash | Structural keyword overlap (`run-trigger-evals.sh`) | Bash cannot simulate LLM semantic matching; structural checks are verifiable |
| Tech registry schema | Each skill invents its own | Unified schema from `hm-detective/references/tech-registry.md` | Prevents schema drift and enables cross-skill consumption |

---

## Runtime State Inventory

> This phase modifies soft meta-concepts (skills) that are read at runtime by OpenCode. No stored data, live service config, or OS-registered state is affected. However, symlink state must be preserved.

| Category | Items Found | Action Required |
|----------|-------------|-----------------|
| Symlink state | `.opencode/skills/` → `../.hivefiver-meta-builder/skills-lab/active/refactoring/` | Verify symlinks remain intact after moving `skill-synthesis` from `retired/` to `active/refactoring/` |
| Live skill cache | OpenCode may cache skill content in session state | None — skill edits are picked up on next session start |
| Build artifacts | None for skills layer | None |
| Secrets/env vars | None | None |
| Stored data | None | None |

**Nothing found in category:** OS-registered state, live service config, secrets/env vars, build artifacts — all explicitly "None" for this phase.

---

## Common Pitfalls

### Pitfall 1: Context-Bomb Skills Waste Agent Context
**What goes wrong:** `oh-my-openagent-reference` has `context-bomb: true` in frontmatter and ships 11MB `files.md` + 11MB `oh-my-openagent-full.xml`. Any dead reference in the SKILL.md body causes the agent to waste context searching for a non-existent file. [VERIFIED: oh-my-openagent-reference SKILL.md line 9]
**Why it happens:** Large reference files are unavoidable for packed repos, but the SKILL.md must be surgically precise about what exists.
**How to avoid:** After every edit, grep the SKILL.md body for `references/` links and verify each target file exists with `ls`.
**Warning signs:** Agent logs showing "file not found" after loading a reference skill.

### Pitfall 2: Orphan Reference Files
**What goes wrong:** The 4 meta-builder depth stubs exist on disk but are **not listed in the SKILL.md Reference Map** (lines 348-361). Agents following progressive disclosure will never discover them. [VERIFIED: meta-builder SKILL.md Reference Map omits all `depth-*.md` files]
**Why it happens:** Stubs were created as placeholders but never wired into the loading table.
**How to avoid:** Every `references/` file must appear in either the decision tree or the Reference Map.
**Warning signs:** Reference file exists but `grep` in SKILL.md shows zero mentions of its basename.

### Pitfall 3: Schema Drift Between `hm-*` Skills
**What goes wrong:** `hm-detective` expects `.tech-registry.json` with `stack`, `modules`, `concerns` keys. `hm-synthesis` (in `artifact-export.md`) expects `version`, `updated`, `technologies`, `patterns` keys. If both skills write to the same file, they will corrupt each other's data. [VERIFIED: hm-detective/references/tech-registry.md lines 19-68 vs hm-synthesis/references/artifact-export.md lines 137-161]
**Why it happens:** Independent skill development without a shared schema contract.
**How to avoid:** Lock one schema before Phase 17 execution. Recommend `hm-detective` schema because it is already referenced by the SKILL.md body and is more mature.
**Warning signs:** `hm-synthesis` overwrites `.tech-registry.json` and `hm-detective` can no longer read `modules` on next session start.

### Pitfall 4: `synthesize` Action With Missing Target Skill
**What goes wrong:** `validate-gate.sh` accepts `synthesize` action (line 21) and `meta-builder` routes to `skill-synthesis` (line 303), but the skill is in `retired/` and not symlinked to `.opencode/skills/`. Any agent attempting synthesis will route to a missing skill. [VERIFIED: validate-gate.sh line 21; meta-builder SKILL.md line 303; `skill-synthesis` NOT in `.opencode/skills/`]
**Why it happens:** Skill was retired without updating routing table or gate script.
**How to avoid:** Before retiring a skill, audit all routing tables and gate scripts for references.
**Warning signs:** `meta-builder` routes to `skill-synthesis`, OpenCode reports "skill not found".

---

## Code Examples

### Verified Pattern: Non-Interactive Shell Safety
```bash
#!/usr/bin/env bash
set -euo pipefail
export CI=true GIT_TERMINAL_PROMPT=0 GIT_PAGER=cat PAGER=cat GCM_INTERACTIVE=never
```
*Source: retired skill-synthesis design spec, Section 6; validate-gate.sh line 2*

### Verified Pattern: Decision Tree in SKILL.md
```markdown
User says...                                    → Load
"create skills from GitHub" / "synthesize"      → references/01-github-ingestion.md
"find skill patterns" / "classify skills"       → references/02-pattern-classifier.md
```
*Source: retired skill-synthesis SKILL.md lines 112-122*

### Verified Pattern: Tech Registry Schema (hm-detective)
```json
{
  "project": "project-name",
  "last_updated": "2026-04-08",
  "stack": {
    "language": "TypeScript",
    "runtime": "Node.js 20",
    "framework": "OpenCode Plugin SDK"
  },
  "modules": {
    "src/lib/types.ts": {
      "role": "leaf",
      "loc": 85,
      "deps": []
    }
  }
}
```
*Source: hm-detective/references/tech-registry.md lines 19-68*

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `skill-synthesis` in `retired/` | Restore to `active/refactoring/` | Phase 17 (planned) | Enables meta-builder routing table to function correctly |
| Empty `project-structure.md` (4 lines) | 674-line real file | Already resolved (Apr 2026) | C4 closed; agents can now navigate OMO codebase structure |
| Phantom `tech-stack.md` reference | Generate from repomix metadata | Phase 17 (planned) | Closes C3; removes dead-reference risk |
| Depth stubs as placeholders | Fill with real content + add to Reference Map | Phase 17 (planned) | Makes 4 orphaned references discoverable |
| IDE skill directories un-ignored | Gitignore + AGENTS.md documentation | Phase 17 (planned) | Prevents accidental commits of sync artifacts |
| Dual `.tech-registry.json` schemas | Unify on `hm-detective` schema | Phase 17 (planned) | Enables cross-skill tech-stack synthesis |

**Deprecated/outdated:**
- `skill-synthesis` retired status: Should be removed from `retired/` once restored.
- `hm-synthesis` alternate registry schema (`artifact-export.md` lines 137-161): Should be updated to match `hm-detective` schema.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `skill-synthesis` should be restored (not refactored/migrated) | C1 Findings | If refactor is chosen, integration points (routing table, validate-gate) need updates; if migrate to `hm-synthesis`, that skill's scope bloats |
| A2 | `hm-detective` schema is the better canonical format for `.tech-registry.json` | Tech-Stack Synthesis | If `hm-synthesis` schema is chosen instead, `hm-detective` body references break |
| A3 | `oh-my-openagent-reference` has no other dead references beyond `tech-stack.md` | C3+C4 Findings | If additional dead refs exist, they must be added to the plan; audit was limited to SKILL.md body + references directory listing |
| A4 | Adding IDE directories to `.gitignore` has no side effects on existing workflows | C5 Findings | If a workflow depends on committing IDE artifacts, gitignoring them breaks CI; but CONTEXT.md says they are sync artifacts, not deliverables |

---

## Open Questions

1. **Should the 4 depth stubs be added to the meta-builder Reference Map or to the decision tree?**
   - What we know: They are not referenced anywhere in SKILL.md body currently.
   - What's unclear: Whether they were intended for the Reference Map (loaded on demand) or the decision tree (intent-based).
   - Recommendation: Add to Reference Map with explicit loading triggers, since they are depth references, not primary workflow paths.

2. **What is the exact content for `tech-stack.md`?**
   - What we know: It should describe the technology stack of the oh-my-openagent codebase.
   - What's unclear: Whether to extract from `package.json` in the packed repo or to write a high-level summary.
   - Recommendation: Extract from repomix metadata and `project-structure.md` — list primary language, runtime, key frameworks, and file counts.

3. **Should `skill-synthesis` be renamed to `hm-skill-synthesis` now or in Phase 18?**
   - What we know: Phase 18 has the `hm-*` naming mandate for all 23 skills.
   - What's unclear: Whether restoring the skill now under its old name creates unnecessary rename work later.
   - Recommendation: Restore under current name `skill-synthesis` in Phase 17; rename in Phase 18 as part of the bulk mandate. Prevents mixing scope.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js / npm | `npm run typecheck`, repomix | ✓ | >= 20.0.0 | — |
| repomix | C1 (skill-synthesis ingest), C3 (tech-stack generation) | ✓ | latest | `gh api` + manual parse (not recommended) |
| Bash | Validation scripts | ✓ | system default | — |
| OpenCode CLI | Runtime skill loading | ✓ | peer dep >= 1.1.0 | — |

**Missing dependencies with no fallback:** None.

**Missing dependencies with fallback:** None.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Bash scripts (structural validation) |
| Config file | None — see Wave 0 |
| Quick run command | `bash .hivefiver-meta-builder/skills-lab/active/refactoring/use-authoring-skills/scripts/validate-gate.sh synthesize "test" /tmp/test-synth` |
| Full suite command | `bash .hivefiver-meta-builder/skills-lab/active/refactoring/use-authoring-skills/scripts/validate-skill.sh <skill-dir> && bash scripts/check-overlaps.sh <skill-dir>` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| REQ-17-01 | `skill-synthesis` restores without breaking routing | structural | `grep "skill-synthesis" .opencode/skills/meta-builder/SKILL.md && ls .opencode/skills/skill-synthesis/SKILL.md` | ❌ Wave 0 (skill missing) |
| REQ-17-02 | All 4 depth files > 100 lines and referenced in SKILL.md | structural | `wc -l .opencode/skills/meta-builder/references/depth-*.md && grep "depth-" .opencode/skills/meta-builder/SKILL.md` | ❌ Wave 0 (stubs are < 20L, unreferenced) |
| REQ-17-03 | `oh-my-openagent-reference` has zero dead refs | structural | `grep -oP 'references/[\w-]+\.md' .opencode/skills/oh-my-openagent-reference/SKILL.md | while read f; do test -f ".opencode/skills/oh-my-openagent-reference/$f" || echo "DEAD: $f"; done` | ✅ (body refs exist; `tech-stack.md` is missing but not referenced in body) |
| REQ-17-04 | `.gitignore` ignores IDE directories | structural | `grep -E "\\.trae/|\\.windsurf/|\\.codex/|\\.github/skills/" .gitignore` | ❌ Wave 0 (entries missing) |
| REQ-17-05 | `hm-*` skills reference unified tech-registry schema | structural | `grep -A5 "tech-registry" .opencode/skills/hm-synthesis/SKILL.md .opencode/skills/hm-deep-research/SKILL.md .opencode/skills/hm-detective/SKILL.md` | ❌ Wave 0 (synthesis uses different schema) |

### Sampling Rate
- **Per task commit:** Run `validate-gate.sh` against modified skill.
- **Per wave merge:** Run `validate-skill.sh` + `check-overlaps.sh` against all modified skills.
- **Phase gate:** All 5 requirement tests pass before `/gsd-verify-work`.

### Wave 0 Gaps
- [ ] `skill-synthesis` directory does not exist in `.opencode/skills/` (restore from retired).
- [ ] 4 depth stubs are < 20 lines and unreferenced.
- [ ] `.gitignore` missing IDE directory entries.
- [ ] `hm-synthesis/references/artifact-export.md` uses alternate tech-registry schema.

---

## Security Domain

> This phase touches only soft meta-concepts (markdown files and bash scripts). No auth, session, or input surfaces change. However, bash scripts in the skill pipeline must remain non-interactive safe.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | — |
| V3 Session Management | No | — |
| V4 Access Control | No | — |
| V5 Input Validation | Yes | Bash scripts must sanitize `$1`, `$2` inputs; `set -euo pipefail` required |
| V6 Cryptography | No | — |

### Known Threat Patterns for Skill Bash Scripts

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Unquoted variables in bash | Tampering | Always quote `"$VAR"`; use `set -euo pipefail` |
| TTY-dependent commands | Denial of Service | `CI=true`, `PAGER=cat`, `GIT_PAGER=cat` |
| `/tmp` race conditions | Tampering | Use `mktemp -d` or `$$` PID suffix; trap cleanup |

---

## Sources

### Primary (HIGH confidence)
- `.hivefiver-meta-builder/skills-lab/retired/skill-synthesis/SKILL.md` — 174 lines, full structure inventoried
- `.opencode/skills/meta-builder/SKILL.md` — 385 lines, Reference Map at lines 348-361, routing table at line 303
- `.opencode/skills/meta-builder/references/depth-built-in-tools.md` — 17 lines (stub)
- `.opencode/skills/meta-builder/references/depth-github-stacks.md` — 12 lines (stub)
- `.opencode/skills/meta-builder/references/depth-repo-analysis.md` — 13 lines (stub)
- `.opencode/skills/meta-builder/references/depth-skill-synthesis.md` — 13 lines (stub)
- `.hivefiver-meta-builder/skills-lab/active/refactoring/oh-my-openagent-reference/SKILL.md` — 65 lines
- `.hivefiver-meta-builder/skills-lab/active/refactoring/oh-my-openagent-reference/references/summary.md` — 48 lines
- `.hivefiver-meta-builder/skills-lab/active/refactoring/oh-my-openagent-reference/references/project-structure.md` — 674 lines
- `.hivefiver-meta-builder/skills-lab/active/refactoring/use-authoring-skills/scripts/validate-gate.sh` — 118 lines, `synthesize` action at line 21
- `.opencode/skills/hm-synthesis/SKILL.md` — 311 lines
- `.opencode/skills/hm-deep-research/SKILL.md` — 334 lines
- `.opencode/skills/hm-detective/SKILL.md` — 221 lines
- `.opencode/skills/hm-detective/references/tech-registry.md` — 205 lines
- `.opencode/skills/hm-synthesis/references/artifact-export.md` — 203 lines
- `.gitignore` — 32 lines

### Secondary (MEDIUM confidence)
- `docs/superpowers/specs/2026-04-05-skill-synthesis-design.md` — 328 lines, design spec for retired skill
- `docs/superpowers/plans/2026-04-05-skill-synthesis-plan.md` — 506 lines, implementation plan
- `.hivefiver-meta-builder/HIVEMIND-SKILLS-REFACTOR-PLAYBOOK.md` — referenced in CONTEXT.md as canonical source for critical issues

### Tertiary (LOW confidence)
- `.planning/phases/17-hivemind-skills-refactor/17-CONTEXT.md` — upstream input, treated as ground truth for scope

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all tools verified on disk or in package.json
- Architecture: HIGH — all SKILL.md files read, line numbers verified
- Pitfalls: HIGH — dead references verified by `ls` and `grep`

**Research date:** 2026-04-23
**Valid until:** 2026-05-23 (skills layer is relatively stable)

**Research complete. Planner can now create PLAN.md files.**
