[LANGUAGE: Write this file in en per Language Governance.]
# Lane 3 — Primitives Audit (Phase 58.9 UAT)

**Auditor:** gsd-pattern-mapper (leaf subagent)
**Date:** 2026-06-06
**Scope:** `.opencode/agents/`, `.opencode/skills/`, `.hivefiver-meta-builder/`, `AGENTS.md`, `.opencode/rules/universal-rules.md`, `command/` vs `commands/` plurality
**Severity scale:** P0 (correctness-blocking) · P1 (drift) · P2 (style/naming) · P3 (informational)

---

## 1. Executive Summary

The primitives tree carries a large, layered set of integrity gaps. The most severe
is a **P0 contradiction between AGENTS.md and disk reality**: AGENTS.md claims
"all 35 former hm-l2/l3-* skills have been archived", but **36 of them are still
active in `.opencode/skills/`** (and an additional 35+ copies sit untouched in
`.hivefiver-meta-builder/skills-lab/active/refactoring/`). The 2026-05-26 refactor
moved files into the archive directory without removing them from the runtime
discovery surface, and without running `node scripts/sync-assets.js` to regenerate
`.opencode/` from source-of-truth.

A second P0 is the **total divergence between `command/` and `commands/`**. The
two directory names are documented as "duplicated identically", but they hold
disjoint content: `command/` is pure gsd-* (67 files), `commands/` is pure
hm-*/hf-*/test/ultrawork (125 active + 124 `.backup`). 19 commands claimed,
249 actual files in one dir, 67 in the other.

A third P0 is **agent-count drift**: AGENTS.md claims 75, disk has 77 (33 gsd +
**32** hm + 11 hf + 1 `build.md` gateway). The hm-* lineage is off-by-one (claimed
31, actual 32). The `explore` agent acknowledged as "MISSING from the filesystem"
in AGENTS.md line 339 has not been restored.

A fourth P0 is **178 stale `.backup` files** left from an incomplete 2026-05-26
sync — 42 agents, 12 skills, 124 commands. These are invisible to OpenCode
discovery (no `.md` extension) but they double-count on every grep, every
manifest, and every auditor.

A fifth P0 is **hf-* string density in `hm-l0-orchestrator.md`** (34 hits). The
agent's STRICT binding rule (AGENTS.md L159) forbids loading hf-* skills; the
references are in routing descriptions and not in a "load" config, so the rule
is *technically* not violated — but the symbol density suggests a `hf-*` skill
slipped into the load list at some point and was incompletely scrubbed. Needs
direct file verification of the `permission.skill` or frontmatter `skills:`
section.

**Severity counts**

| Severity | Count |
|----------|-------|
| P0       | 5     |
| P1       | 6     |
| P2       | 3     |
| P3       | 2     |
| **Total**| **16** |

---

## 2. File Classification (Lane 3 surfaces)

| Surface | Role | Discovered | AGENTS.md claim | Match |
|---------|------|-----------:|----------------:|-------|
| `.opencode/agents/` | agent catalog | 77 active + 42 `.backup` | 75 active | off-by-2 |
| `.opencode/skills/` | skill catalog | 70 active dirs + 12 `.backup` dirs | 34 non-GSD | off-by-36 (claim excludes 36 hm-* still live) |
| `.opencode/command/` | command catalog (singular) | 67 active gsd-* | n/a | not duplicated |
| `.opencode/commands/` | command catalog (plural) | 125 active + 124 `.backup` | 19 active | off-by-106 |
| `.opencode/agents/build.md` | gateway agent | 1 | not enumerated | undocumented |
| `.hivefiver-meta-builder/skills-lab/.archive-refactoring-skills/.archive/` | archive | 46 dirs (20 hm-l2 + 15 hm-l3 + 11 other) | "all 35" | off-by-1 |
| `.hivefiver-meta-builder/skills-lab/active/refactoring/` | source-of-truth | large | authoritative | need 1:1 sync |
| `AGENTS.md` | project constitution | present | authoritative | drifted |

---

## 3. P0 Findings (correctness-blocking)

### P0-1 — 36 hm-l2/l3 skills still active in `.opencode/skills/`, contradicting AGENTS.md "all 35 archived" claim

**Evidence**
- AGENTS.md:340 — `Note: all 35 former hm-l2/l3-* skills have been archived to .hivefiver-meta-builder/skills-lab/.archive-refactoring-skills/.archive/`
- `ls .opencode/skills/hm-l2-*` → **21 active dirs** (brainstorm, completion-looping, coordinating-loop, cross-cutting-change, debug, feature-ecosystem, gate-orchestrator, governance-config, lineage-router, phase-execution, phase-loop, planning-persistence, product-validation, production-readiness, refactor, requirements-analysis, roadmap-maintainability, skill-router, spec-driven-authoring, test-driven-execution, user-intent-interactive-loop)
- `ls .opencode/skills/hm-l3-*` → **15 active dirs** (deep-research, detective, hivemind-engine-contracts, hivemind-state-reference, integration-contracts, omo-reference, opencode-non-interactive-shell, opencode-platform-reference, opencode-project-audit, research-chain, subagent-delegation-patterns, synthesis, tech-context-compliance, tech-stack-ingest, tool-capability-matrix)
- **Total: 36 active** (not 35 claimed)
- AGENTS.md:342 — `AGENTS.md line 342 mentions 67 gsd-* skills` (informational)

**Impact**
- The skill discovery surface contains 36 skills that AGENTS.md says no longer exist.
- `node scripts/sync-assets.js` should have removed these from `.opencode/skills/`
  on refactor. Either the sync was not run, or it was run before archive was
  populated, or the archive script only wrote a copy and never deleted the
  source. Result: agents that load `hm-l2-test-driven-execution` (a real file
  on disk) will get the OLD definition, not the replacement unprefixed skill
  the AGENTS.md claim describes.
- Off-by-one: archive says 35, disk has 36. The 36th skill is most likely
  `hm-l2-user-intent-interactive-loop` (the newest of the hm-l2 cohort and
  the most likely to have been added after the archive script was run).

**Fix**
- `rm -rf .opencode/skills/hm-l2-* .opencode/skills/hm-l3-*` after backing up to
  `.hivefiver-meta-builder/skills-lab/.archive-refactoring-skills/.archive/`
  (already done — file is already there).
- Run `node scripts/sync-assets.js` to confirm `.opencode/skills/` is regenerated
  from source-of-truth (which should NOT contain the archived hm-l2/l3 skills).
- Update AGENTS.md:340 from "all 35" to "all 36" (or 37 if `hm-l2-user-intent-interactive-loop`
  is in fact a post-archive addition that should also be archived).

**File:line**
- `/Users/apple/hivemind-plugin-private/AGENTS.md:340`
- `/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l2-user-intent-interactive-loop/SKILL.md` (suspected post-archive addition)

---

### P0-2 — `command/` vs `commands/` total divergence

**Evidence**
- `ls .opencode/command/*.md | grep -v .backup | wc -l` → **67 (all gsd-*)**
- `ls .opencode/commands/*.md | grep -v .backup | wc -l` → **125 (no gsd-*)**
- `diff <(ls command/) <(ls commands/)` → files in `command/` start with `gsd-`, files in `commands/` start with `hm-`/`hf-`/`deep-init`/`plan`/`start-work`/`steer`/`sync-agents-md`/`test-*`/`ultrawork`/`harness-*`
- AGENTS.md:342 — `19 commands AUTHORED in .hivefiver-meta-builder/commands-lab/active/refactoring/ and reflected to .opencode/commands/`
- AGENTS.md also documents the plurality rule: "Both `.opencode/command/` and `.opencode/commands/` folders are primary roots. All command schemas MUST be duplicated identically in both directories to prevent version drift across different OpenCode host releases."

**Impact**
- The plurality rule is fully violated. `command/` and `commands/` hold
  disjoint content. OpenCode host versions that scan the singular path will
  only see gsd-*; those that scan the plural path will only see hm-*/hf-*/test.
- AGENTS.md:342 claims 19 commands. `commands/` has 125 active + 124 `.backup`
  = 249 files; `command/` has 67. Neither number is 19.
- The 19 number is plausible as "active shipped primitives" if you exclude
  gsd-* (developer tooling) and hm-* (which is a different product area), but
  the breakdown at AGENTS.md:342 is `7 core + 7 extended + 1 sync + 4 test = 19`.
  The current 125 contains 4 test (test-echo, test-list, test-spike-execute,
  test-status) + 1 sync (sync-agents-md) + several core (start-work, plan,
  deep-init, deep-research-synthesis-repomix, harness-doctor, harness-audit,
  ultrawork) + 7 extended (hf-absorb, hf-audit, hf-configure, hf-create,
  hf-prompt-enhance, hf-prompt-enhance-to-plan, hf-stack) → roughly 19 in the
  19-cmd set. So the 19 might still match for SHIPPED commands. The drift is
  the **un-shipped legacy** that was never cleaned up: hm-add-tests,
  hm-audit-fix, hm-audit-milestone, hm-capture, hm-cleanup, hm-code-review,
  hm-config, hm-debug, hm-deep-init, hm-doctor, hm-eval-review, hm-execute,
  hm-explore, hm-extract-learnings, hm-fast, hm-forensics, hm-gate,
  hm-graphify, hm-harness-*, hm-help, hm-import, hm-inbox, hm-init-project,
  hm-intel-updater, hm-l0-orchestrate, hm-manager, hm-map-codebase,
  hm-milestone-summary, hm-mvp-phase, hm-new-*, hm-ns-*, hm-pause-work,
  hm-phase, hm-plan-*, hm-pr-branch, hm-profile, hm-progress, hm-quick,
  hm-research, hm-resume-work, hm-review, hm-roadmap, hm-secure-phase,
  hm-session, hm-settings, hm-ship, hm-shipper, hm-sketch, hm-spec-*, hm-spike,
  hm-start-work, hm-state, hm-stats, hm-surface, hm-synthesize, hm-test-*,
  hm-thread, hm-ui-*, hm-ultraplan-phase, hm-ultrawork, hm-undo, hm-update,
  hm-validate-phase, hm-verify, hm-workspace, hm-workstreams — **100+**
  hm-* commands that do not appear in the AGENTS.md inventory.

**Fix**
- Decide: are these hm-* commands shipped or developer-only? If shipped,
  AGENTS.md:342 must list them. If developer-only, they should be in
  `.hivefiver-meta-builder/commands-lab/dev/` (not yet visible) and excluded
  from `.opencode/commands/`.
- Whichever side, run `node scripts/sync-assets.js` to bring `.opencode/commands/`
  into the canonical state, and replicate it to `.opencode/command/`.
- 124 `.backup` command files in `commands/` should be removed (they double
  the file count and create grep noise).

**File:line**
- `/Users/apple/hivemind-plugin-private/AGENTS.md:342`
- `/Users/apple/hivemind-plugin-private/.opencode/commands/hm-explore.md` (line 1+ — see P1-2)

---

### P0-3 — Agent count drift: 77 on disk vs 75 in AGENTS.md

**Evidence**
- AGENTS.md:339 — `75 agents AUTHORED: 33 GSD + 31 hm-* + 11 hf-*` (= 75, no build.md mention)
- Disk counts in `.opencode/agents/`:
  - `ls *.md | grep -v '\.backup' | grep '^gsd-' | wc -l` → 33 ✓
  - `ls *.md | grep -v '\.backup' | grep '^hm-' | wc -l` → **32** (off-by-1)
  - `ls *.md | grep -v '\.backup' | grep '^hf-' | wc -l` → 11 ✓
  - `ls build.md` → 1 (not in any count)
  - `ls *.md | grep -v '\.backup' | wc -l` → **77** (off-by-2)

**Impact**
- The 32nd hm-* agent is `hm-pattern-mapper` (this agent's own archetype).
  AGENTS.md:339 enumerates 31 hm-* names explicitly: `architect, code-fixer,
  code-reviewer, codebase-mapper, debug-session-manager, debugger, doc-verifier,
  doc-writer, ecologist, executor, integration-checker, intel-updater,
  intent-loop, l0-orchestrator, nyquist-auditor, orchestrator, pattern-mapper,
  phase-researcher, plan-checker, planner, project-researcher, roadmapper,
  security-auditor, shipper, specifier, synthesizer, ui-auditor, ui-checker,
  ui-researcher, user-profiler, verifier` — count: 31. The disk has 32
  because `hm-pattern-mapper` and `hm-debug-session-manager` are both
  present, and `hm-pattern-mapper` was added after the count was frozen.
  Re-count: AGENTS.md names 31 including `pattern-mapper` — so the count IS
  31 by name. The 32nd is the **gateway/agent `build.md`** plus one extra
  hm-* agent. Most likely: AGENTS.md was written before `hm-specifier` was
  added or before one of the others (e.g., `hm-steer` or `hm-ecologist`) was
  committed. The exact identity of the 32nd requires a diff against the
  enumerated list.
- `build.md` is the OpenCode gateway agent (a built-in convention, not a
  shipped product primitive) — it is correct to exclude from the 75 count,
  but it should be mentioned in AGENTS.md as "plus build.md gateway".

**Fix**
- `diff <(ls .opencode/agents/hm-*.md | xargs -n1 basename | sed 's/.md//') <(grep -oE 'hm-[a-z-]+' AGENTS.md | sort -u)` to identify the 32nd name.
- Add the missing agent to AGENTS.md:339, or remove the orphan from disk.
- Add a one-line note: "Plus `build.md` gateway agent (not shipped)."

**File:line**
- `/Users/apple/hivemind-plugin-private/AGENTS.md:339`
- `/Users/apple/hivemind-plugin-private/.opencode/agents/` (32 hm-*.md files vs 31 named)

---

### P0-4 — 178 `.backup` files left from incomplete 2026-05-26 sync

**Evidence**
- `ls .opencode/agents/*.md.backup | wc -l` → 42
- `ls -d .opencode/skills/*.backup | wc -l` → 12
- `ls .opencode/commands/*.md.backup | wc -l` → 124
- AGENTS.md:339-342 make no mention of `.backup` files in the inventory
- AGENTS.md:Sync protocol: `node scripts/sync-assets.js` (per AGENTS.md L67).

**Impact**
- 178 files are invisible to OpenCode (`.md` discovery requires `.md` suffix;
  `.md.backup` is not loaded) but they still cost disk, slow `ls`/`grep`,
  and confuse any auditor who doesn't `grep -v .backup`.
- The presence of `.backup` files indicates the sync script's pre-flight
  rename step ran (it copies `agent.md` → `agent.md.backup` before overwrite)
  but the post-flight restore step did not, OR the restore step was skipped
  intentionally and the `.backup` files were never cleaned.
- The 12 `.backup` skill dirs is a particularly bad smell — these are full
  directory trees (each ~hundreds of KB) left dormant.

**Fix**
- `find .opencode/agents -name '*.md.backup' -delete`
- `find .opencode/skills -name '*.backup' -type d -exec rm -rf {} +`
- `find .opencode/commands -name '*.md.backup' -delete`
- Verify `node scripts/sync-assets.js` runs to completion on a clean tree and
  produces zero `.backup` artifacts.

**File:line**
- `/Users/apple/hivemind-plugin-private/.opencode/agents/*.md.backup` (42 files)
- `/Users/apple/hivemind-plugin-private/.opencode/skills/*.backup` (12 dirs)
- `/Users/apple/hivemind-plugin-private/.opencode/commands/*.md.backup` (124 files)

---

### P0-5 — hf-* string density in `hm-l0-orchestrator.md` (STRICT binding risk)

**Evidence**
- `grep -c 'hf-' .opencode/agents/hm-l0-orchestrator.md` → **34**
- AGENTS.md:159 — `hm-* (STRICT). Only loads hm-* skills, gate-* quality triad skills, and stack-* reference skills. Cannot access hf-* skills under any circumstance.`
- Sample lines (excerpted):
  - L3: `Routes user intent through intelligent delegation: fast-path to L2/L3, coordinated-path via L1, cross-lineage to hf-*.`
  - L86-89: `hf_requires_codebase_investigation: hf-* needs codebase pattern discovery` / `- hf-l0-orchestrator` / `- hf-coordinator`
  - L140: `cross-lineage to hf-* for meta-concept creation`
  - L149: `Cross-lineage (to hf-*): For meta-concept work...`
  - L159: STRICT binding rule (mentions hf-* in prohibition context)
  - L168: `Cross-lineage (to hf-*): meta-concept creation detected...`
  - L186: `Cross-lineage routing to hf-orchestrator...`
  - L199: `hf-* meta-concept creation (route to hf-orchestrator...)`

**Impact**
- The 34 references are concentrated in **routing descriptions and the STRICT
  rule's text**, not in any "load skills" config. The OpenCode agent frontmatter
  shown has no `skills:` array (only `permission:` and `mode: primary`); so the
  34 references are likely policy/routing text, not skill-loading instructions.
- However, the **density** is alarming. A single subagent reading the file
  and copying the routing structure into a new file (e.g., a new orchestrator)
  could easily add a `skills: [hf-meta-builder-core, ...]` block by analogy.
- Compare `hm-orchestrator.md` (the L1 fallback): only **1** `hf-*` reference.
  That is the right density for "I know hf-* exists for cross-lineage, full stop".

**Fix**
- Read the file's full frontmatter and the section between L80 and L200 to
  verify there is no `skills:` array referencing hf-*.
- If clean: trim hf-* mentions in body text to ≤ 5 (one in description, one
  in the STRICT rule, one in cross-lineage routing, one in escalation, one in
  handoff). Move the rest to a `.references/` subdoc.
- If a `skills:` array exists: remove it (violates STRICT binding).

**File:line**
- `/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l0-orchestrator.md:3`
- `/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l0-orchestrator.md:88-89`
- `/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l0-orchestrator.md:159` (STRICT rule)

---

## 4. P1 Findings (drift)

### P1-1 — `explore` agent acknowledged missing in AGENTS.md but not restored

**Evidence**
- AGENTS.md:339 — `Note: explore agent is MISSING from the filesystem.`
- `ls .opencode/agents/ | grep -iE 'explore'` → empty
- `ls .opencode/commands/ | grep -iE 'hm-explore'` → `hm-explore.md` exists
- `command/` has `gsd-explore.md` (GSD counterpart exists)
- Multiple skills and agents reference an "explore" agent:
  - `gsd-advisor-researcher.md`, `gsd-doc-writer.md`, `gsd-codebase-mapper.md`, `gsd-phase-researcher.md`, `gsd-planner.md` (5 GSD agents)
  - `iterative-loop/SKILL.md`, `hm-l3-opencode-platform-reference/references/opencode-agents.md`, `opencode-server.md`, `repomix-opencode.md/xml` (skills + reference docs)

**Impact**
- The `hm-explore` command exists in `.opencode/commands/` but its
  implementation invokes an `explore` subagent that does not exist. The
  command will fail at runtime when OpenCode tries to dispatch.
- AGENTS.md acknowledges the gap rather than fixing it. That's a TODO in a
  doc, not a TODO in code.

**Fix**
- Add a minimal `.opencode/agents/explore.md` that proxies the OpenCode
  built-in `explore` subagent (read-only, glob/grep, scoped to project).
- OR remove `hm-explore.md` from `.opencode/commands/` if the team no longer
  uses it.
- OR rewrite the GSD/agent references to use the built-in name (e.g.,
  `@explore`) and let OpenCode handle dispatch.

**File:line**
- `/Users/apple/hivemind-plugin-private/AGENTS.md:339` (ack)
- `/Users/apple/hivemind-plugin-private/.opencode/commands/hm-explore.md` (orphan)
- `/Users/apple/hivemind-plugin-private/.opencode/agents/` (no explore.md)

---

### P1-2 — `delegate-task` is on maintenance but AGENTS.md still references it 5 times

**Evidence**
- AGENTS.md: `grep -c 'delegate-task' AGENTS.md` → 5
- `.hivemind/AGENTS.md`: `grep -c 'delegate-task'` → 0
- The maintenance notice (per Phase 39.8 brief): "The delegate-task tool is on maintenance; use task tool instead for delegation."

**Impact**
- Documentation drift: L0 orchestrators reading AGENTS.md may try to invoke
  `delegate-task` instead of the `task` tool. The skill-router
  (`hm-l2-skill-router`) and subagent-delegation-patterns both teach the
  task-based workflow; AGENTS.md contradicts that.

**Fix**
- Search AGENTS.md for the 5 `delegate-task` mentions.
- For each: either replace with `task` tool reference or strike entirely if
  the surrounding paragraph is no longer relevant.
- Verify `.hivemind/AGENTS.md` is the source of truth and is consistent.

**File:line**
- `/Users/apple/hivemind-plugin-private/AGENTS.md` (5 hits — exact lines TBD)

---

### P1-3 — 19 commands claimed vs 125 active (off-by-106)

**Evidence**
- AGENTS.md:342 — `19 commands ... 7 core + 7 extended + 1 sync + 4 test = 19`
- `ls .opencode/commands/*.md | grep -v '\.backup' | wc -l` → 125
- 19-cmd subset (visible in `commands/`): start-work, plan, deep-init,
  deep-research-synthesis-repomix, harness-doctor, harness-audit, ultrawork
  (7 core) + hf-absorb, hf-audit, hf-configure, hf-create, hf-prompt-enhance,
  hf-prompt-enhance-to-plan, hf-stack (7 extended) + sync-agents-md (1 sync)
  + test-echo, test-list, test-spike-execute, test-status (4 test) = 19 ✓

**Impact**
- 106 unaccounted commands in `commands/`. These are the hm-* and hf-* legacy
  surface (see P0-2). AGENTS.md:342 does not enumerate them; they are shipped
  to `.opencode/commands/` but not documented.

**Fix**
- Either:
  - (a) add an inventory section to AGENTS.md listing the legacy hm-*/hf-*
    commands, OR
  - (b) move them to `.hivefiver-meta-builder/commands-lab/dev/` and exclude
    from `.opencode/commands/`.
- Whichever: the 19 number in AGENTS.md:342 must match disk reality.

**File:line**
- `/Users/apple/hivemind-plugin-private/AGENTS.md:342`

---

### P1-4 — `build.md` gateway agent not mentioned in AGENTS.md inventory

**Evidence**
- `.opencode/agents/build.md` exists (1 file, the OpenCode gateway convention)
- AGENTS.md:339 enumerates only gsd-/hm-/hf- agents (no gateway mention)
- AGENTS.md talks about agents in two layers (`.hivefiver-meta-builder/` source
  + `.opencode/` deployed) but does not address the gateway

**Impact**
- Minor: the gateway is OpenCode-platform, not project-domain. Most auditors
  would not count it. But the AGENTS.md claim of 75 agents is then wrong by
  exactly 1 (the gateway).

**Fix**
- Add a footnote to AGENTS.md:339: "Plus `build.md` gateway agent (OpenCode
  platform convention, not authored in this repo)."

**File:line**
- `/Users/apple/hivemind-plugin-private/AGENTS.md:339`

---

### P1-5 — `iterative-loop` skill still references an "explore" agent

**Evidence**
- `grep 'explore' .opencode/skills/iterative-loop/SKILL.md` → hit
- `iterative-loop` is an unprefixed skill (1 of 11 in AGENTS.md:340 enumeration)

**Impact**
- Stale reference to a missing agent (see P1-1). Iterative-loop will not
  break at runtime (it just describes a workflow that invokes explore), but
  the description lies.

**Fix**
- Update `iterative-loop/SKILL.md` to use `@explore` (built-in) or remove
  the explore reference.

**File:line**
- `/Users/apple/hivemind-plugin-private/.opencode/skills/iterative-loop/SKILL.md` (line TBD)

---

### P1-6 — Stack-* naming drift between source-of-truth and deployed

**Evidence**
- `.opencode/skills/stack-*` dirs use prefix `stack-` (no `l3-`)
  (stack-bun-pty, stack-json-render, stack-nextjs, stack-opencode,
  stack-vitest, stack-zod)
- `.hivefiver-meta-builder/skills-lab/active/refactoring/` likely has
  `stack-l3-*` source dirs (not verified this pass, but AGENTS.md:340
  enumeration uses `stack-*` form)

**Impact**
- If source-of-truth uses `stack-l3-*` and deployed uses `stack-*`, the sync
  script must rename. The two forms are easy to confuse in audit reports.

**Fix**
- Verify: `ls .hivefiver-meta-builder/skills-lab/active/refactoring/ | grep ^stack`
- If both forms exist, choose one and update the other.

**File:line**
- `/Users/apple/hivemind-plugin-private/.opencode/skills/stack-*/SKILL.md` (6 files)

---

## 5. P2 Findings (style / naming)

### P2-1 — `command/` dir name violates SDK plurality convention

**Evidence**
- AGENTS.md:Plurality rule — "Declarative agent files live in the plural
  `.opencode/agents/` folder, but are referenced by the singular SDK term
  `agent`."
- OpenCode SDK uses singular `command` (not `commands`).
- `.opencode/command/` (singular) is the SDK term; `.opencode/commands/`
  (plural) is the filesystem convention. The plurality rule says BOTH must
  hold identical content — but they do not (see P0-2).

**Impact**
- Host versions that scan `command/` will miss the hm-*/hf-* surface;
  versions that scan `commands/` will miss the gsd-* surface. This is a
  runtime discovery hazard, not just a documentation issue.

**Fix**
- Make `command/` and `commands/` identical (mirror the full set in both).
- Or, drop `command/` and use `commands/` only (the filesystem path is
  what OpenCode actually walks; the SDK term is the API contract).

**File:line**
- `/Users/apple/hivemind-plugin-private/.opencode/command/` (67 gsd-* files)
- `/Users/apple/hivemind-plugin-private/.opencode/commands/` (125 + 124 files)

---

### P2-2 — Test-Driven Development section is verbose (operationalization lag)

**Evidence**
- AGENTS.md:## Test-Driven Development — extensive (4 pages of rules)
- `.opencode/rules/universal-rules.md:## 6. Test-Driven Development Discipline`
  — duplicated 8-page section with mostly-identical content

**Impact**
- Two near-identical rule bodies in two locations. Updates to TDD discipline
  must be made in both. The skill at `.opencode/skills/hm-l2-test-driven-execution/`
  is the canonical source; AGENTS.md and universal-rules.md should link to it,
  not duplicate it.

**Fix**
- Replace duplicated rule bodies in AGENTS.md and universal-rules.md with a
  single paragraph + a `@skills/hm-l2-test-driven-execution` reference.

**File:line**
- `/Users/apple/hivemind-plugin-private/AGENTS.md:## Test-Driven Development`
- `/Users/apple/hivemind-plugin-private/.opencode/rules/universal-rules.md:## 6.`

---

### P2-3 — hf-l0-orchestrator.md has 36 hm-* string references (FLEXIBLE binding OK but verify)

**Evidence**
- `grep -c 'hm-l2\|hm-l3' .opencode/agents/hf-l0-orchestrator.md` → 36
- AGENTS.md FLEXIBLE binding for hf-* lineage — may route to hm-* skills

**Impact**
- FLEXIBLE binding permits this. The number is high but the count is
  consistent with hf-l0-orchestrator's role of routing meta-concept work
  to hm-* execution (skill-router lineage, hm-l2-lineage-router, etc.).

**Fix**
- No fix needed. Document in PATTERNS.md for future auditors.

**File:line**
- `/Users/apple/hivemind-plugin-private/.opencode/agents/hf-l0-orchestrator.md`

---

## 6. P3 Findings (informational)

### P3-1 — Phase 39.8 active claim + 2,963 tests claim unverified

**Evidence**
- AGENTS.md:462 — `Active phase: Phase 39.8 ... 2,963 tests pass`
- No runtime evidence captured this audit lane (Lane 3 is primitives-only)

**Impact**
- Lane 5 (tests) should verify. Out of scope here.

**Fix**
- Cross-reference with Lane 5 audit.

**File:line**
- `/Users/apple/hivemind-plugin-private/AGENTS.md:462`

---

### P3-2 — `hm-harness-audit`, `hm-harness-doctor` (and 5 others) duplicate harness-* names with hf- prefix

**Evidence**
- `.opencode/commands/hm-harness-audit.md` and `.opencode/commands/harness-audit.md` both exist
- `.opencode/commands/hm-harness-doctor.md` and `.opencode/commands/harness-doctor.md` both exist
- AGENTS.md:342 lists `harness-doctor` and `harness-audit` in the 7-core
  shipped commands; the `hm-harness-*` files are not enumerated

**Impact**
- Two distinct command files with the same functional name, different
  prefixes. OpenCode would expose both; the user would not know which to call.

**Fix**
- Decide ownership (hm- or unprefixed) and delete the other.
- Update AGENTS.md inventory.

**File:line**
- `/Users/apple/hivemind-plugin-private/.opencode/commands/hm-harness-audit.md`
- `/Users/apple/hivemind-plugin-private/.opencode/commands/harness-audit.md`

---

## 7. Shared Cross-Cutting Patterns (for PATTERNS.md consumers)

| Pattern | Source | Apply to | Notes |
|---------|--------|----------|-------|
| **AGENTS.md → disk drift** | AGENTS.md:339-342 vs `ls .opencode/` | All L0 orchestrators, all auditors | Always re-verify count claims at the start of any audit |
| **`.backup` pollution** | 42 agents + 12 skills + 124 commands = 178 files | `node scripts/sync-assets.js` workflow | Sync script must clean `.backup` files, not leave them |
| **Plurality rule violation** | `command/` (67 gsd) vs `commands/` (125 hm/hf) | All command authors | SDK term `command`, filesystem `commands/`, but they must hold identical content |
| **STRICT vs FLEXIBLE binding** | AGENTS.md:159 (hm STRICT, hf FLEXIBLE) | All agent frontmatter | Body text may mention the other lineage; frontmatter `skills:` array must not |
| **Archive ≠ Removal** | `.hivefiver-meta-builder/skills-lab/.archive-refactoring-skills/.archive/` (35) vs `.opencode/skills/hm-l2-*` (21) + `hm-l3-*` (15) = 36 | All refactor scripts | Archiving to a source-of-truth dir does NOT remove the runtime copy. Run sync after archive. |
| **Gateway agent omission** | `.opencode/agents/build.md` (1) | AGENTS.md inventory | `build.md` is OpenCode convention; document or exclude consistently |

---

## 8. Verification Commands (re-runnable)

```bash
# P0-1: Count active hm-l2/l3 in .opencode/skills/
ls -d /Users/apple/hivemind-plugin-private/.opencode/skills/hm-l2-*/ | wc -l
ls -d /Users/apple/hivemind-plugin-private/.opencode/skills/hm-l3-*/ | wc -l

# P0-2: Diff command/ vs commands/
diff <(ls /Users/apple/hivemind-plugin-private/.opencode/command/*.md 2>/dev/null | xargs -n1 basename | sort) \
     <(ls /Users/apple/hivemind-plugin-private/.opencode/commands/*.md 2>/dev/null | xargs -n1 basename | sort) | head -20

# P0-3: Agent count by lineage
cd /Users/apple/hivemind-plugin-private/.opencode/agents && \
  echo "gsd: $(ls *.md 2>/dev/null | grep -v .backup | grep -c ^gsd-)" && \
  echo "hm:  $(ls *.md 2>/dev/null | grep -v .backup | grep -c ^hm-)" && \
  echo "hf:  $(ls *.md 2>/dev/null | grep -v .backup | grep -c ^hf-)" && \
  echo "build.md: $(ls build.md 2>/dev/null | wc -l)"

# P0-4: .backup counts
echo "agents: $(find /Users/apple/hivemind-plugin-private/.opencode/agents -name '*.md.backup' | wc -l)"
echo "skills: $(find /Users/apple/hivemind-plugin-private/.opencode/skills -name '*.backup' -type d | wc -l)"
echo "cmds:   $(find /Users/apple/hivemind-plugin-private/.opencode/commands -name '*.md.backup' | wc -l)"

# P0-5: hf-* string density in hm-l0-orchestrator
grep -c 'hf-' /Users/apple/hivemind-plugin-private/.opencode/agents/hm-l0-orchestrator.md

# P1-1: explore agent absence
ls /Users/apple/hivemind-plugin-private/.opencode/agents/ | grep -iE 'explore'

# P1-2: delegate-task references
grep -c 'delegate-task' /Users/apple/hivemind-plugin-private/AGENTS.md
```

---

## 9. Metadata

- **Audit date:** 2026-06-06
- **Auditor:** gsd-pattern-mapper (leaf subagent, no delegation)
- **Lane:** 3 (Primitives)
- **Phase:** 58.9 UAT
- **Files scanned:** 119 agent entries + 82 skill dirs + 192 command files + AGENTS.md + universal-rules.md = 395 files
- **Findings opened:** 16 (5 P0, 6 P1, 3 P2, 2 P3)
- **Analog patterns available:** ARCHITECTURE.md (9-surface authority), STRUCTURE.md (placement), hm-l3-hivemind-state-reference (.hivemind/ layout), hm-l3-integration-contracts (agent↔skill bindings)
- **Out of scope (for other lanes):** hooks/lifecycle (Lane 2), schemas (Lane 4), tests (Lane 5)
