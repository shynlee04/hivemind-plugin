# HiveMind Master Plan — Living Document

**Created:** 2026-02-12
**Last Updated:** 2026-02-12 (Iteration 6 COMPLETE)
**Status:** ACTIVE — Iteration 6 complete, Ink TUI dashboard + semantic validation + cleanup
**Branch:** `dev/iteration-6-tui-cleanup` (off master `212e15e`)

**Source of truth references:**
- Architecture: `docs/plans/2026-02-11-hierarchy-redesign.md` (651 lines)
- Concepts: `docs/plans/the-concepts-diagram.png`
- Stress test: `docs/plans/STRESS-TEST-1.MD`
- GSD reference: `/Users/apple/Documents/coding-projects/idumb/v2/.claude/get-shit-done/`

---

## 1. The 3-Approach Matrix

Every feature must satisfy ALL THREE approaches simultaneously. Not alternatives — a matrix. If any cell is empty, the feature is incomplete.

### Approach 1: CONCEPTS (What survives)

The system survives when:
- No tools are called
- 10 compactions happened in one chaotic conversation
- The user is in "I am retard" mode (STRESS-TEST-1.MD)
- A different model (Claude/GPT/Gemini/Llama) picks up mid-session

**Core concepts:**
- Mems Brain + 3-cycle agent collaboration
- Drift detection through timestamps, not just counters
- Context anchoring (immutable anchors survive compaction)
- Surviving long-haul iterative phases
- Cross-session traceability via grep-able stamps (`MiMiHrHrDDMMYY`)
- Hierarchy integrity (parent-child chain never orphaned)
- Path integrity (config → plugin → brain → tools all traced)

### Approach 2: TOOLS (How it runs)

**Sophisticated tools-in-tools with internal scripts:**
- Each tool contains scripts that parse schema, extract parts, read hierarchy, compute staleness
- **Bidirectional**: export to brain → next hook/turn retrieves back in correct order
- **Self-correcting**: tool detects inconsistencies → fixes programmatically
- **Brain-as-a-whole**: every tool reads FULL state, not just its domain
- **Model-agnostic**: scripts produce same result regardless of which model runs

**GSD pattern reference (`gsd-tools.js`):**
- Atomic commands: `state load`, `find-phase`, `commit`, `verify-summary`
- Each command is one-shot, pure-function, structured JSON output
- Compound commands for workflow initialization: `init execute-phase`, `init plan-phase`
- Frontmatter CRUD, state progression engine, verification suite
- **Our equivalent: `bin/hivemind-tools.cjs`** — must grow to match this sophistication

### Approach 3: MECHANISM TO ACTIVATE (When/How it fires)

Even with perfect tools, they need activation WITHOUT agent cooperation:

| Mechanism | Hook/Entry Point | What It Does |
|-----------|-----------------|--------------|
| Config persistence | `config.json` → every turn | Settings TRUE across all turns/sessions unless changed |
| Counter engine | `tool.execute.after` | Classify tools, track failures, detect repetition |
| Prompt injection | `system.transform` | Inject `<hivemind>` with signals, hierarchy, alerts |
| Compaction purification | `session.compacting` | Auto-export + custom prompt + tree context |
| Auto-compact trigger | Counter threshold | Fires when turns exceed max |
| Entry/exit transform | System prompt + last message | Next API call gets updated state |
| Event watching | Keyword scan, anchor states | Detect rage, stuck patterns, drift |
| Context janitor | Programmatic purification | Runs in hooks, not through agent cooperation |
| CLI verification | `bin/hivemind-tools.cjs` | One bash command = full truth about any state |

### The Matrix Table

| Concept | Tool (scripts inside) | Mechanism (activation) |
|---------|----------------------|----------------------|
| Hierarchy integrity | `declare_intent` auto-migrates, `map_context` auto-validates chain + tree ops | `system.transform` injects chain breaks |
| Drift detection | `check_drift` computes all signals one-shot | `tool.execute.after` counts + `system.transform` warns |
| Context anchoring | `save_anchor` + scripts inside `think_back` | Compaction hook preserves anchors |
| Mems Brain | `save_mem`/`recall_mems` bidirectional | Auto-mem on compaction + prompt lists shelves |
| Surviving long-haul | `compact_session` internal purification scripts | Auto-compact threshold + custom prompt + export |
| Timestamp tracing | Every tool uses stamps, every hook reads them | `grep stamp` from any session, any time |
| Path integrity | Config symlinks + trace paths | CLI `verify-install` + `trace-paths` |
| Self-correction | Each tool validates + repairs on entry | Hooks detect inconsistency → inject repair signal |
| Smart tool selection | Tool descriptions match agent's natural thought | `system.transform` suggests which tool to use next |

---

## 2. Implementation Status — What Exists vs What's Missing

### Built and Working (from 17 implementation steps)

| Component | File(s) | Lines | Tests |
|-----------|---------|-------|-------|
| Hierarchy tree engine | `src/lib/hierarchy-tree.ts` | ~810 | 55 |
| Detection engine (9/9 signals) | `src/lib/detection.ts` | ~485 | 45 |
| Planning FS rewrite (templates, manifest, per-session, FileGuard tracking) | `src/lib/planning-fs.ts` | ~719 | 30 |
| Brain state schema (extended metrics + detection counters) | `src/schemas/brain-state.ts` | ~297 | 35 |
| Hierarchy tools (prune + migrate) | `src/tools/hierarchy.ts` | — | — |
| Core tools wired to tree | `declare-intent.ts`, `map-context.ts`, `compact-session.ts` | — | 84 |
| Cognitive mesh wired to tree | `scan-hierarchy.ts`, `think-back.ts` | — | 32 |
| Counter engine wired | `src/hooks/soft-governance.ts` | ~200 | 27 |
| Prompt engine wired | `src/hooks/session-lifecycle.ts` | ~250 | — |
| Compaction tree context | `src/hooks/compaction.ts` | ~164 | — |
| Tree-aware chain analysis | `src/lib/chain-analysis.ts` | — | 6 |
| Config dead fields wired | `src/schemas/config.ts` | — | — |
| CLI init updated | `src/cli/init.ts` | — | — |
| Ecosystem verification utility | `bin/hivemind-tools.cjs` | ~1340 | — |
| export_cycle tool + auto-capture hook | `src/tools/export-cycle.ts`, `src/hooks/soft-governance.ts` | ~130 | 36 |
| Per-session stamp files + manifest | `planning-fs.ts` + `declare-intent.ts` | — | — |
| Entry chain tests (JSONC, re-init, config, AGENTS.md) | `tests/entry-chain.test.ts` | — | 69 |
| Ink TUI dashboard (5 panels, bilingual EN/VI, 2s poll) | `src/dashboard/server.ts` | ~564 | 9 |
| Semantic validation in ecosystem-check | `bin/hivemind-tools.cjs` | — | 8 |
| **TOTAL** | **43 source files** | — | **705 assertions** |

### Iteration 1 Gaps — RESOLVED in code (verified 2026-02-12)

| # | Gap | Status | Evidence |
|---|-----|--------|----------|
| 3 | Signal #6: tool-hierarchy mismatch | ✅ WIRED | `detection.ts:356,426` + `session-lifecycle.ts:219` |
| 4 | Post-compaction detection | ✅ WIRED | `compact-session.ts:394-395` |
| A | `completedBranches` not passed | ✅ WIRED | `session-lifecycle.ts:193,218` + `detection.ts:439` |
| B | `setFileGuard()`/`getFileGuard()` dead | ✅ REMOVED | grep returns 0 results |
| — | `compaction_count` dead | ✅ WIRED | `compact-session.ts:387,394` |
| — | `last_compaction_time` dead | ✅ WIRED | `compact-session.ts:395` |
| — | `next_compaction_report` dead | ✅ WIRED | `compact-session.ts:396` → `compaction.ts:52-54` |

### ⚠ LOGIC FAILURES — Tests pass but product doesn't work (audited 2026-02-12)

**Tests test internal functions in isolation. The following are REAL product failures that no test catches.**

| # | Failure | Severity | Evidence | Matrix Violation |
|---|---------|----------|----------|------------------|
| L1 | **README lies** — says "11 tools, 386 assertions" | CRITICAL | ✅ FIXED — now "14 tools, 621 assertions", bilingual EN+VI | PATH INTEGRITY |
| L2 | **CHANGELOG stops at 2.0.0** — 3 releases undocumented | CRITICAL | ✅ FIXED — 2.1.0, 2.2.0, 2.3.0 entries added with comparison links | PATH INTEGRITY |
| L3 | **`bin/hivemind-tools.cjs` NOT in npm package** | CRITICAL | ✅ FIXED — `bin/` added to `package.json` files array | TOOL |
| L4 | **Skills NOT in npm package** | CRITICAL | ✅ FIXED — `skills/` added to `package.json` files array | CONCEPT |
| L5 | **CLI `--help` runs init** | HIGH | ✅ FIXED — early return on `--help`/`-h` in `src/cli.ts` | TOOL |
| L6 | **npm is at 1.3.0** — 7 versions behind | CRITICAL | BLOCKED — requires user `npm login` | PATH INTEGRITY |
| L7 | **Never tested in real OpenCode** | CRITICAL | SOLVED — behavioral bootstrap + AGENTS.md injection (Iteration 4) | MECHANISM |
| L8 | **Hooks use frozen config** | HIGH | ✅ FIXED — all 3 hooks call `loadConfig(directory)` per invocation | MECHANISM |
| L9 | **Duplicated gate logic ~120 lines** | MEDIUM | ✅ FIXED — `createToolGateHookInternal` now delegates to `.internal` | TOOL |
| L10 | **Dead `sentiment_signals` field** | LOW | ✅ FIXED — removed from schema, migration deletes from disk | CLEAN |
| L11 | **`src/index.ts` says "11 tools"** | LOW | ✅ FIXED — changed to 14 | PATH INTEGRITY |
| L12 | **Stale `tasks/prd-production-ready.md`** | LOW | ✅ FIXED — deleted, `tasks/` dir removed | CLEAN |
| L13 | **Skills not code-wired** | HIGH | PARTIALLY SOLVED — bootstrap is prompt-injected via hook (L7), AGENTS.md carries full skill content | MECHANISM |
| L14 | **No bilingual docs (EN/VI)** | MEDIUM | ✅ FIXED — README has `## Tiếng Việt` section | PRESENTATION |

### Dead Schema Fields (remaining)

All dead schema fields have been cleaned. `sentiment_signals` removed in Iteration 3.

---

## 3. Iteration Methodology

### Entry Testing Chain (EVERY iteration)

After each iteration completes, verify the FULL chain:

```
1. Installation
   npm install / git clone → README → edge cases (old installs, opencode.jsonc with other plugins)

2. CLI Init
   hivemind init → config persistence → path tracing → project vs global
   Edge: old .hivemind/ exists, opencode.jsonc (not .json), other plugins present

3. Config Persistence
   config.json settings TRUE every turn, across sessions, unless explicitly changed
   Config → hooks → commands → starting points → response messages
   Trace paths: .hivemind/ → opencode.json → plugin entry → brain.json → tools

4. First Session
   declare_intent → hierarchy tree created → brain initialized → prompt injection active
   Edge: no hierarchy.json (migration), stale brain.json, corrupt config

5. Tool Usage
   map_context → tree updated → active.md rendered → counters reset
   Edge: wrong level, empty content, rapid successive calls

6. Detection + Signals
   tool.execute.after fires → counters updated → system.transform compiles signals
   Edge: consecutive failures, keyword spam, section repetition

7. Compaction
   compact_session → auto-prune → auto-export (JSON + MD) → auto-mem → custom prompt
   Edge: empty session, corrupt tree, no archives dir

8. Next Session
   Cross-session tracing → timestamps grep-able → mems recall → anchors survive
   Edge: different model, different agent, hours/days gap

9. Ecosystem Verification
   node bin/hivemind-tools.cjs ecosystem-check
   node bin/hivemind-tools.cjs source-audit → 0 unmapped, 0 missing
   npx tsc --noEmit → 0 errors
   npm test → all pass
```

### Iteration Update Protocol

After each iteration:
1. Update this master plan — add completed iteration to log, update status table
2. Update file tree — no orphan files, every file has responsibilities
3. Run ecosystem check — one change leads to hierarchy and relational changes
4. Update AGENTS.md if tools/hooks/tests changed
5. Atomic git commit with meaningful message

---

## 4. TODO Iterations

### Iteration 1: Sophisticated Tools-in-Tools + Activation Wiring

**Goal:** Make every tool self-correcting with internal scripts. Wire all dead fields. Wire all missing signals. Make `bin/hivemind-tools.cjs` the single bash-command truth oracle. Ensure config persistence end-to-end.

**Entry test after completion:** Full chain from `hivemind init` through session lifecycle through compaction through next session.

#### 1.1 Wire dead brain fields (zero-cooperation, pure hook work)

**Files:**
- Modify: `src/tools/compact-session.ts`
- Modify: `src/hooks/session-lifecycle.ts`

**What:**
- `compact-session.ts`: Before creating fresh brain, set `compaction_count = old.compaction_count + 1` and `last_compaction_time = Date.now()` on the OLD state, then carry both to new state
- `session-lifecycle.ts`: Read `last_compaction_time`, compare with `session.last_activity` — if compaction happened since last tool call → inject post-compaction alert into `<hivemind>` block

**Test:** Unit test: compact twice → `compaction_count === 2`, `last_compaction_time > 0`. Integration: post-compaction alert appears in system prompt.

#### 1.2 Wire Signal #6: tool-hierarchy mismatch

**Files:**
- Modify: `src/lib/detection.ts` — add `hierarchyActionEmpty?: boolean` to `compileSignals()` opts
- Modify: `src/hooks/session-lifecycle.ts` — pass `hierarchyActionEmpty: state.hierarchy.action === ''` to `compileSignals()`

**What:**
- In `compileSignals()`: if `opts.hierarchyActionEmpty && detection.tool_type_counts.write > 0` → push signal `{ type: 'tool_hierarchy_mismatch', severity: 3, message: 'Writing files but no action declared in hierarchy.' }`

**Test:** Unit test: write tools fired + no action → signal generated. No action + no writes → no signal.

#### 1.3 Wire `completedBranches` into signal compilation

**Files:**
- Modify: `src/hooks/session-lifecycle.ts` — import `countCompleted` from hierarchy-tree, pass to `compileSignals()`

**What:**
- Load tree, call `countCompleted(tree)`, pass as `completedBranches` to `compileSignals()`

**Test:** Unit test: tree with 5+ completed branches → `completed_pileup` signal fires.

#### 1.4 Sophisticated `compact_session` with internal purification scripts

**Files:**
- Modify: `src/tools/compact-session.ts`
- May add: internal helper functions (scripts-inside-tool pattern)

**What — internal scripts, NOT agent cooperation:**
1. `identifyTurningPoints(tree, metrics)` — programmatic: nodes where status changed to complete, timestamp gaps > 2hr between siblings, cursor ancestry chain
2. `generateContextReport(turningPoints, anchors, mems)` — structured string: current trajectory, active tactic, key decisions, file list
3. `generateNextCompactionReport(turningPoints, tree)` — what to preserve when THIS session compacts next
4. Write `compaction_count++`, `last_compaction_time = now`, `next_compaction_report = report` to brain BEFORE reset
5. Auto-prune: if `countCompleted(tree) >= threshold` → `pruneCompleted(tree)`
6. The tool's RETURN VALUE is the purification report — agent gets it one-shot

**Test:** Integration: compact session → next compaction hook reads `next_compaction_report` → uses it as context. Verify turning points identified from timestamp gaps. Verify auto-prune fires.

#### 1.5 Compaction hook reads `next_compaction_report`

**Files:**
- Modify: `src/hooks/compaction.ts`

**What:**
- On compaction fire: read `brain.next_compaction_report`
- If found → `output.context.push(report)` as the FIRST context item (highest priority)
- If not found → existing behavior (hierarchy context injection)

**Test:** Integration: write report to brain → trigger compaction → verify report appears in `output.context`.

#### 1.6 FileGuard → tracking + repair signal (not blocking)

**Files:**
- Modify: `src/lib/planning-fs.ts` — remove dead exports `getFileGuard()`, `setFileGuard()`
- Modify: `src/hooks/soft-governance.ts` — add file guard tracking to `tool.execute.after`
- Modify: `src/lib/detection.ts` — add `file_guard_mismatch` signal (optional, lower priority)

**What:**
- Keep `FileGuard` type and `createFileGuard()` as internal tracking
- In `soft-governance.ts`: when a write tool fires, check if the same file was read this session (from `brain.metrics.files_touched`) — if write without read → increment a `write_without_read` counter
- In `detection.ts`: optional signal when `write_without_read > threshold`
- Remove `file_guard` from `brain-state.ts` (was never used)

**Test:** Unit test: write tool fires on file not in `files_touched` → counter increments. Signal fires at threshold.

#### 1.7 Enhance `bin/hivemind-tools.cjs` — GSD-level sophistication

**Files:**
- Modify: `bin/hivemind-tools.cjs`

**New atomic commands (following GSD pattern):**

```
State:
  state load [dir]                    Load brain + config + tree as structured JSON
  state get <field> [dir]             Get specific brain field (dot notation)
  state hierarchy [dir]               Render ASCII tree from hierarchy.json

Session:
  session active [dir]                Show active session stamp + manifest entry
  session history [dir]               List all sessions with stamps and status
  session trace <stamp> [dir]         Grep stamp across ALL artifacts (brain, mems, anchors, archives, git)

Config:
  config get <key> [dir]              Get config value (dot notation)
  config set <key> <value> [dir]      Set config value (persists immediately)
  config trace-paths [dir]            Show all symlinks and trace paths

Validation:
  validate schema [dir]               Validate ALL JSON files against expected shapes
  validate chain [dir]                Check hierarchy parent-child integrity
  validate stamps [dir]               Check all timestamps parse correctly

Verification:
  verify-install [dir]                Check plugin registration + file integrity + opencode.jsonc edge case
  ecosystem-check [dir]               Full chain: install → init → config → brain → hooks → tools
  source-audit                        42/42/0 — every file has responsibilities
```

**Test:** Run each command against a test `.hivemind/` directory. Verify JSON output parses. Verify `session trace` finds stamps across files.

#### 1.8 Config persistence end-to-end

**Files:**
- Modify: `src/schemas/config.ts` — ensure ALL config fields are read by hooks
- Modify: `src/hooks/session-lifecycle.ts` — config values influence prompt injection
- Modify: `src/hooks/soft-governance.ts` — config values influence detection thresholds

**What:**
- `governance_mode` → influences tool gate behavior (already works)
- `max_turns_before_warning` → detection threshold (already wired)
- `max_active_md_lines` → session file length signal (already wired)
- `detection_thresholds` → passed to `compileSignals()` (already wired)
- **NEW:** Verify config is re-read from disk every turn, not cached stale
- **NEW:** `bin/hivemind-tools.cjs config trace-paths` shows full path chain

**Test:** Change config value → next tool call uses new value. No restart needed.

#### 1.9 Smart tool selection via prompt injection

**Files:**
- Modify: `src/hooks/session-lifecycle.ts`

**What:**
- Already has `suggestToolActivation()` in auto-hooks-pure — verify it covers all cases:
  - LOCKED session → suggest `declare_intent`
  - High drift → suggest `map_context`
  - Long session → suggest `compact_session`
  - No hierarchy + OPEN → suggest `map_context`
- **NEW:** Add suggestion for `hierarchy_prune` when completed branches high
- **NEW:** Add suggestion for `hierarchy_migrate` when no tree found
- **NEW:** Add suggestion for `think_back` when post-compaction detected
- These are prompt injections, not tool calls — zero cooperation needed

**Test:** Unit test each suggestion trigger. Integration: verify suggestions appear in `<hivemind>` block.

#### 1.10 Entry testing — full chain verification

**Files:**
- New or extend: `tests/entry-chain.test.ts`
- Modify: `bin/hivemind-tools.cjs` — add `ecosystem-check` compound command

**What:** Full entry chain test:
1. `hivemind init` → verify all files created (config, brain, active.md, templates, manifest, hierarchy.json)
2. `declare_intent` → verify tree created, stamp file created, manifest updated, brain unlocked
3. `map_context` (tactic) → verify child node added, cursor moved, active.md rendered
4. `map_context` (action) → verify chain intact
5. Simulate 6 tool calls → verify drift warning fires in prompt
6. `compact_session` → verify archive, export, auto-mem, auto-prune, report written
7. New `declare_intent` → verify cross-session: old stamps grep-able, mems recall works
8. Edge cases: old install (no hierarchy.json), opencode.jsonc, corrupt brain.json

**Test:** Integration test that runs the full chain. Should be its own test suite.

---

## 5. File Tree with Responsibilities

```
hivemind-plugin/
├── bin/
│   └── hivemind-tools.cjs              # CLI utility — ecosystem verification, state inspection, path tracing
├── docs/
│   └── plans/
│       ├── 2026-02-11-hierarchy-redesign.md   # Architecture design doc (source of truth for CONCEPTS)
│       ├── the-concepts-diagram.png            # Visual concepts reference
│       ├── STRESS-TEST-1.MD                    # Stress test specification
│       └── master-plan-2026-02-12.md           # THIS FILE — living plan, updated each iteration
├── src/
│   ├── index.ts                        # Plugin entry — registers all 14 tools + 4 hooks
│   ├── cli/
│   │   └── init.ts                     # CLI: hivemind init (creates .hivemind/)
│   ├── hooks/
│   │   ├── tool-gate.ts                # Hook: tool.execute.before — governance enforcement
│   │   ├── soft-governance.ts          # Hook: tool.execute.after — counter/detection engine
│   │   ├── session-lifecycle.ts        # Hook: system.transform — prompt compilation engine
│   │   └── compaction.ts              # Hook: session.compacting — tree context + purification report
│   ├── lib/
│   │   ├── hierarchy-tree.ts           # Engine: tree types, stamps, CRUD, queries, rendering, janitor, I/O, migration
│   │   ├── detection.ts               # Engine: tool classification, counters, keywords, signal compilation
│   │   ├── planning-fs.ts             # Engine: template system, per-session files, manifest, FileGuard tracking
│   │   ├── chain-analysis.ts          # Engine: staleness, chain breaks, tree-aware gap detection
│   │   ├── persistence.ts            # Engine: brain state I/O, config I/O, brain backup
│   │   ├── anchors.ts                # Engine: anchor CRUD and prompt formatting
│   │   ├── mems.ts                   # Engine: mems CRUD, search, shelf summary
│   │   ├── session-export.ts         # Engine: JSON + markdown export on compaction
│   │   ├── staleness.ts              # Engine: session stale detection (days idle)
│   │   ├── long-session.ts           # Engine: turn threshold for compact suggestion
│   │   ├── commit-advisor.ts         # Engine: files touched → commit suggestion
│   │   ├── complexity.ts             # Engine: session complexity assessment
│   │   ├── tool-activation.ts        # Engine: suggest which tool to use based on state
│   │   ├── sentiment.ts              # Engine: user sentiment regex for rage/frustration detection
│   │   ├── logging.ts                # Engine: logger interface
│   │   └── index.ts                  # Barrel: lib exports
│   ├── schemas/
│   │   ├── brain-state.ts             # Schema: BrainState, MetricsState, detection counters, session metadata
│   │   ├── config.ts                  # Schema: GovernanceConfig, detection thresholds
│   │   └── hierarchy.ts              # Schema: HierarchyState (flat projection), hierarchy types
│   └── tools/
│       ├── index.ts                   # Tool registry — exports all tool definitions
│       ├── declare-intent.ts          # Tool: start session, create tree root, stamp file, manifest
│       ├── map-context.ts             # Tool: update hierarchy, create tree nodes, render active.md
│       ├── compact-session.ts         # Tool: archive + purification scripts + auto-prune + auto-mem + export
│       ├── self-rate.ts               # Tool: agent self-assessment
│       ├── scan-hierarchy.ts          # Tool: ASCII tree rendering with cursor
│       ├── think-back.ts              # Tool: context refresh (tree + anchors + chain analysis + plan)
│       ├── check-drift.ts            # Tool: drift report (score + alignment + chain integrity)
│       ├── save-anchor.ts            # Tool: persist immutable anchors
│       ├── save-mem.ts               # Tool: persist cross-session memories
│       ├── list-shelves.ts           # Tool: show mem shelf overview
│       ├── recall-mems.ts            # Tool: search memories across sessions
│       ├── hierarchy.ts              # Tool: hierarchy_prune + hierarchy_migrate
│       └── export-cycle.ts           # Tool: capture subagent results into tree + mems
├── tests/
│   ├── auto-hooks-pure.test.ts        # 39 assertions — tests staleness, chain-analysis, commit-advisor, tool-activation
│   ├── complexity.test.ts             # 28 assertions
│   ├── detection.test.ts              # 45 assertions
│   ├── evidence-gate.test.ts          # 44 assertions
│   ├── hierarchy-tree.test.ts         # 55 assertions
│   ├── init-planning.test.ts          # 30 assertions
│   ├── integration.test.ts            # 74 assertions
│   ├── round3-tools.test.ts           # 32 assertions
│   ├── round4-mems.test.ts            # 40 assertions
│   ├── schemas.test.ts                # 35 assertions
│   ├── self-rate.test.ts              # 28 assertions
│   ├── session-export.test.ts         # 32 assertions
│   ├── session-structure.test.ts      # 18 assertions
│   ├── soft-governance.test.ts        # 27 assertions
│   ├── tool-gate.test.ts             # 12 assertions
│   ├── cycle-intelligence.test.ts   # 36 assertions
│   ├── dashboard-tui.test.ts        # 9 assertions — TUI snapshot panels, bilingual strings
│   └── ecosystem-check.test.ts      # 8 assertions — semantic validation pass/fail, trace metadata
├── AGENTS.md                          # Ground truth for what exists in codebase
├── CHANGELOG.md                       # User-facing changes
├── package.json                       # npm package config
└── tsconfig.json                      # TypeScript config
```

├── skills/
│   ├── hivemind-governance/              # BOOTSTRAP SKILL — gate, loaded every turn via AGENTS.md + system.transform
│   │   └── SKILL.md                      # Checkpoint flowchart, three-force tables, rationalization defense
│   ├── session-lifecycle/                # DISCIPLINE — session start/update/close with reward framing
│   │   └── SKILL.md                      # declare_intent, map_context, compact_session patterns
│   ├── evidence-discipline/              # DISCIPLINE — prove don't claim, verify before completion
│   │   └── SKILL.md                      # Evidence chain, subagent validation, minimum evidence bar
│   ├── context-integrity/                # DISCIPLINE — detect/repair/survive context loss
│   │   └── SKILL.md                      # Drift repair, post-compaction recovery, anchor/mem patterns
│   └── delegation-intelligence/          # DISCIPLINE — parallel vs sequential, export_cycle, team patterns
│       └── SKILL.md                      # Decision flowchart, auto-capture, subagent prompt engineering
```

**43 source files. 5 skill files. 20 test files. 705 assertions. 0 orphans.**

---

## 6. Skill System Architecture

### Two-Tier Design (modeled after `using-superpowers`)

**Tier 1: Bootstrap gate** (`hivemind-governance`) — ~638 words, loaded every turn:
- Checkpoint flowchart: session declared? → delegating? → making claims? → drift?
- Three-force framework: REWARD (what you gain) → CONSEQUENCE (what you lose) → RATIONALIZATION (what you're avoiding)
- Discipline skill router: which of the 4 content skills to load

**Tier 2: Discipline skills** (4 skills, loaded on demand):
- `session-lifecycle` — declare_intent/map_context/compact_session with reward framing
- `evidence-discipline` — prove, don't claim; verify before completion; evidence chain
- `context-integrity` — detect drift, repair state, survive compaction/chaos
- `delegation-intelligence` — parallel vs sequential, export_cycle, auto-capture

### Activation Paths (Two Entry Points)

1. **AGENTS.md anchor** — `<EXTREMELY-IMPORTANT>` block loaded by any agent tool
2. **`session-lifecycle.ts` hook** — programmatic backup injected via `<hivemind>` block every turn

### Three-Force Framework

| Force | Purpose | Placement |
|-------|---------|-----------|
| **REWARD** (first) | Show tools = cognitive prosthetics, agent becomes smarter | Each skill leads with gains |
| **CONSEQUENCE** (second) | Natural costs of skipping, not punishment | Each skill shows what's lost |
| **RATIONALIZATION** (last) | Explicit "if you think X, reality is Y" table | Bootstrap gate + each skill |

### New Mechanisms Introduced

| Mechanism | Type | What |
|-----------|------|------|
| `export_cycle` tool | Tool (14th) | Main agent calls after subagent returns — structures outcome + findings into tree + mems |
| Auto-capture hook | Hook logic | `tool.execute.after` auto-captures Task returns (last 500 chars) into `brain.cycle_log[]` |
| `pending_failure_ack` flag | Brain state | Set when subagent result contains failure signals, clears on `export_cycle` or `map_context(blocked)` |
| Failure warning injection | Prompt | `system.transform` warns every turn while `pending_failure_ack` is true |

### Matrix Row for Skill System

| Concept | Tool | Mechanism |
|---------|------|-----------|
| Agent behavioral governance | `export_cycle`, all existing tools referenced in skills | AGENTS.md anchor + `system.transform` skill checkpoint injection |

---

## 7. Iteration Log

| Iteration | Date | Focus | Outcome | Assertions |
|-----------|------|-------|---------|------------|
| Pre-1 | 2026-02-11 | Hierarchy redesign — 17 implementation steps | All complete. Tree engine, detection, hooks wired. | 489 |
| Skill-0 | 2026-02-11 | Skill system — 5 skills (bootstrap + 4 discipline) | Written. 3918 total words. Needs code wiring. | — |
| 1 | 2026-02-11 | Sophisticated tools-in-tools + activation wiring + `export_cycle` tool + auto-capture hook | **COMPLETE.** 12/12 sub-tasks done. export_cycle tool, auto-capture hook, pending_failure_ack, map_context blocked clears ack. | 607 |
| 2 | 2026-02-12 | Entry testing + foundation hardening — edge cases, docs accuracy, file tree reality | **COMPLETE.** Master plan file tree fixed (16 lib files listed), +14 entry test assertions (JSONC, re-init guard, config persistence). Commit `f1e6989`. | 621 |
| 3 | 2026-02-12 | Production integrity — fix logic failures L1-L14 | **COMPLETE.** 10/14 fixed (L1-5, L8-12, L14). L6 blocked (npm login), L7+L13 deferred to Iteration 4. Hooks read config from disk (Rule 6). Tool-gate deduped. Dead code removed. README bilingual. CHANGELOG complete. | 621 |
| 4 | 2026-02-12 | Agent behavioral activation (L7) — zero-cooperation bootstrap | **COMPLETE.** Behavioral bootstrap in system prompt (teaches agent HiveMind on first 2 LOCKED turns, budget expanded to 4000 chars). AGENTS.md/CLAUDE.md auto-injection during `hivemind init` (idempotent, marker-based). L7 solved, L13 partially solved. +23 assertions. | 644 |
| 5 | 2026-02-12 | Evidence Gate System — escalating prompt pressure + argument-back | **COMPLETE.** 4 escalation tiers (INFO→WARN→CRITICAL→DEGRADED), evidence-based signals with counter-excuses, "I am retard" mode (5 automation levels), write-without-read FileGuard tracking, `compileEscalatedSignals()` replaces `compileSignals()` in prompt injection. +44 assertions. | 688 |
| 6 | 2026-02-12 | Ink TUI dashboard + semantic validation + cleanup | **COMPLETE.** Ink-based TUI replacing HTTP dashboard (5 panels: session, hierarchy, metrics, alerts, traceability). Bilingual EN/VI with live toggle. Semantic chain validation in `ecosystem-check`. Cleanup: deleted `.npmignore`, `tasks/`, `historical-plans/`, `this-is-the-session5.md`. Version bumped to 2.6.0. +17 assertions. | 705 |
| 7+ | PENDING | npm publish, stress testing, real OpenCode validation, 3-approach matrix integration testing | — | — |

---

## 4.1 Iteration 3: Production Integrity — Fix Logic Failures

**Goal:** Fix every LOGIC FAILURE from L1-L14. After this iteration, the product actually works end-to-end when installed from npm/GitHub, not just in isolated test functions.

**Entry test after completion:** Install from GitHub → `npx hivemind init` → tools appear in OpenCode → hooks fire → config persists → `npx hivemind --help` shows help → `bin/hivemind-tools.cjs` ships → skills ship → README and CHANGELOG are accurate.

#### 3.1 Fix README — L1, L14
- Rewrite with accurate numbers: 14 tools, 621 assertions, 4 hooks
- Document all 14 tools organized by group
- Add Vietnamese section at bottom (`## Tiếng Việt`)
- Professional presentation

#### 3.2 Fix CHANGELOG — L2
- Add entries for 2.1.0, 2.2.0, 2.3.0
- Each with Added/Changed/Fixed sections reflecting real commits

#### 3.3 Fix package.json — L3, L4
- Add `bin/` to `files` array so `hivemind-tools.cjs` ships
- Add `skills/` to `files` array so 5 behavioral governance skills ship

#### 3.4 Fix CLI --help — L5
- In `src/cli.ts`: check for `--help` or `-h` in flags BEFORE command dispatch
- If found → `printHelp()` and return, never fall through to init

#### 3.5 Fix src/index.ts comments — L11
- Line 8: change "11 Tools" to "14 Tools" and list all 14
- Line 61: change "11 context management tools" to "14 context management tools"

#### 3.6 Fix frozen config in hooks — L8
- In `src/index.ts:73`: pass `effectiveDir` to hook factories, NOT the config object
- Each hook factory re-reads config from disk via `loadConfig(dir)` on each invocation
- This is Rule 6: config persistence TRUE every turn, not cached stale

#### 3.7 Deduplicate tool-gate — L9
- Remove `createToolGateHookInternal` (line 231-364)
- Expose `internalHook` from `createToolGateHook` for testing via a separate export or test helper
- Verify `tool-gate.test.ts` still passes

#### 3.8 Remove dead code — L10, L12
- Remove `sentiment_signals` from `BrainState` interface and `createBrainState()`
- Delete `tasks/prd-production-ready.md` (v1.1.0 orphan)
- Delete `session-ses_3b3a.md` (stray session file in root)
- Update `persistence.ts` migration if it references `sentiment_signals`

#### 3.9 Update master plan — this section
- Mark iteration 3 as COMPLETE when done
- Update file tree if files added/removed
- Update assertion count if tests change

#### 3.10 Verification gate — MUST PASS before commit
- `npx tsc --noEmit` → 0 errors
- `npm test` → all pass
- `node bin/hivemind-tools.cjs source-audit` → N/N/0
- `npm pack --dry-run` → verify `bin/` and `skills/` appear
- `node dist/cli.js --help` → shows help, does NOT run init
- `node dist/cli.js help` → shows help
- README says 14 tools, 621 assertions
- CHANGELOG has 2.1.0, 2.2.0, 2.3.0

**NOTE on L6 (npm publish) and L7 (real OpenCode test):**
- L6 requires user to run `npm login` first — blocked on auth
- L7 requires loading plugin in a real OpenCode session — planned for Iteration 4
- These are NOT part of Iteration 3 scope

---

## 9. Non-Negotiable Rules

1. **ZERO agent cooperation**: If it requires the agent to follow a protocol, it WILL fail. Scripts inside tools. Hooks fire automatically. Disk is the truth.
2. **3-approach matrix**: Every feature must have a CONCEPT + TOOL + MECHANISM cell filled.
3. **Entry testing every iteration**: Full chain from install → init → session → compact → next session.
4. **Ecosystem-as-a-whole**: One change → check all related files → update tree → no orphans.
5. **File tree checked**: `source-audit` must pass 42/42/0 (or N/N/0 if files added/removed).
6. **Config persistence**: Settings TRUE every turn across sessions. No stale cache.
7. **Bidirectional**: Export to brain → next turn retrieves. Not one-way.
8. **Model-agnostic**: Scripts produce same result on any LLM.
9. **Git as context**: Atomic commits, meaningful messages, stamps in commit msgs when relevant.
10. **Design doc is theory**: Learn from it, implement pragmatically, update THIS plan with reality.

---

*This document is updated after every iteration. The iteration log grows. The status table changes. The file tree reflects reality. If you see a conflict between this file and the code, update this file.*
