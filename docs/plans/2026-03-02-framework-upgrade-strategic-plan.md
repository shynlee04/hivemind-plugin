# Framework Upgrade Strategic Plan

> **Document ID:** STRATEGIC-PLAN-2026-03-02
> **Version:** 1.0.0
> **Status:** DRAFT — Awaiting user confirmation
> **Author:** hivefiver (meta-builder)
> **Predecessor:** `docs/plans/2026-02-27-hybrid-ab-master-plan.md` (v2.1)
> **Context:** User's wall-of-text intake covering 9 improvement domains + GSD learning + OpenCode SDK research

---

## 1. Executive Summary

The HiveMind framework needs a comprehensive upgrade across **9 improvement domains** to prepare for the upcoming GSD-inspired development methodology integration and OpenCode SDK session manipulation capabilities. This plan synthesizes findings from:

- **GSD Framework Research** — 9 patterns analyzed from `gsd-build/get-shit-done`
- **OpenCode SDK/Server Research** — Full capabilities assessment (sessions, events, plugins, HTTP API)
- **Current State Assessment** — 38 commands, 8 agents, 34+ skills, 15 scripts, master plan v2.1

### Key Findings

| Finding | Source | Impact |
|---------|--------|--------|
| Context injection poisoning is RANK 1 blocker | Master Plan v2.1 | CRITICAL — gates all other work |
| OpenCode supports programmatic session creation | SDK Docs | ENABLES D3 (session manipulation) |
| GSD's gsd-tools.cjs pattern is adaptable | GSD Research | ENABLES D4 (unified CLI) |
| TODO management needs graph-sync layer | User Request | NEW requirement — not in master plan |
| 3-level delegation needs architecture | User Request | NEW requirement — not in master plan |
| SOT artifacts not chained/searchable | User + PITFALLS.md | EXTENDS existing gap |
| Quality gates are mechanical not journey-based | User Request | EXTENDS existing gap |

---

## 2. The 9 Improvement Domains

### Domain Map (Dependency Graph)

```
D7 (Context Injection) ──┬──► D8 (Memory/Events)
                         │
                         ├──► D2 (TODO Workflow)
                         │
                         └──► D9 (Knowledge Export)

D4 (Deterministic CLI) ──┬──► D5 (SOT Artifacts)
                         │
                         └──► D6 (Quality Gates)

D1 (Agent Delegation) ───┬──► D3 (Session Manipulation)
                         │
                         └──► D2 (TODO Workflow)

D3 (Session Manipulation) ──► LATER (worktree-based, after team upgrade)
```

### Domain Details

#### D1: Agent Delegation — 3-Level Depth

| Aspect | Value |
|--------|-------|
| **Priority** | HIGH |
| **Dependency** | None (foundational) |
| **GSD Pattern** | Agent files with `<role>`, `<execution_flow>`, `<structured_returns>` |
| **OpenCode Support** | Session parentID chains, plugin orchestration |
| **Current State** | 8 agents exist, delegation ad-hoc, no 3-level enforcement |

**Requirements:**
- Level 1: `hiveminder` (primary coordinator, strategic + tactical architect)
- Level 2: `hivefiver` (framework meta-builder), `hiveminder`→delegates to:
- Level 3: `hivemaker` (implementation), `hivexplorer` (investigation), `hiverd` (research), `hiveplanner` (planning), `hiveq` (quality), `hivehealer` (debugging)
- Auto-constructing agent profiles at runtime
- Delegation packet enforcement at all 3 levels
- Delegation depth tracking prevents infinite chains

**Acceptance Criteria:**
- [ ] 3-level delegation chain works end-to-end
- [ ] validate-delegation.sh enforces packets at all levels
- [ ] Agent profiles auto-constructed from frontmatter + context
- [ ] Delegation depth ≤ 3 enforced programmatically

---

#### D2: TODO Workflow Management — Stateful, 40-Item, Graph-Synced

| Aspect | Value |
|--------|-------|
| **Priority** | HIGH |
| **Dependency** | D7 (context injection), D4 (CLI tooling) |
| **GSD Pattern** | `gsd-tools list-todos`, `todo complete`, phase-level tracking |
| **OpenCode Support** | `/session/:id/todo` endpoint, `todo.updated` event |
| **Current State** | TodoWrite is volatile in-memory only |

**Requirements:**
- Stateful TODO persisted to `.hivemind/state/todo.json`
- Supports up to 40 items with hierarchical sub-tasks
- Loads upstream (parent workflow) and downstream (child tasks) context
- Graph-sync: TODO items linked to hierarchy.json nodes (trajectory→tactic→action)
- Auto-export TODO state on session compact/end
- Programmatic read/update (not just tick) via CLI tool
- Routing helper: TODO items suggest next agent/command
- OpenCode `todo.updated` event wired to persistence

**Acceptance Criteria:**
- [ ] TODO state persists across sessions via `.hivemind/state/todo.json`
- [ ] TODO items linked to hierarchy nodes with bidirectional references
- [ ] Up to 40 items with 3-level nesting (workflow→task→subtask)
- [ ] CLI: `hivemind-tools todo list|add|complete|sync|export`
- [ ] Auto-export on compact_session

---

#### D3: Session Manipulation — Auto New Session, Prompt Transform (DEFERRED)

| Aspect | Value |
|--------|-------|
| **Priority** | MEDIUM (deferred to worktree) |
| **Dependency** | D1 (delegation), D7 (context injection) |
| **OpenCode Support** | ✅ Create/fork sessions, ✅ noReply injection, ❌ No metadata/tags natively |
| **Current State** | session-continue.sh exists but limited |

**Requirements (for LATER worktree implementation):**
- Programmatic session creation with SDK client
- Metadata encoded as JSON in title field (workaround for no native metadata)
- Parent-child session chains via parentID
- Message injection without LLM response (noReply: true)
- Prompt transformation via custom plugin
- Event monitoring via SSE stream subscription
- Denial/routing via tool.execute.before plugin hook

**Why Deferred:**
User specified: "remember this later is for when the team and bundles of mine are upgraded and recovered." The OpenCode SDK deep integration requires stable framework foundations first.

---

#### D4: Deterministic Tooling/Scripts — Unified CLI

| Aspect | Value |
|--------|-------|
| **Priority** | HIGH |
| **Dependency** | None (foundational) |
| **GSD Pattern** | gsd-tools.cjs (60+ commands, JSON output, compound init) |
| **Current State** | hivefiver-tools.sh (238L) covers hivefiver scope only |

**Requirements:**
- Unified `hivemind-tools.cjs` (or `.sh`) covering ALL domains:
  - `state load|update|get|json|snapshot` — STATE management
  - `todo list|add|complete|sync|export` — TODO workflow
  - `hierarchy create|read|update|validate` — Graph operations
  - `session init|export|compact|list` — Session management
  - `verify plan|phase|artifacts|references` — Validation
  - `template fill <type> --fields '{}'` — Template instantiation
  - `frontmatter get|set|merge|validate` — Frontmatter CRUD
  - `commit <type>(scope): message --files` — Atomic git commits
  - `inventory scan|health|drift` — Asset inventory
  - `parity check|sync` — Root↔.opencode sync
- JSON output with `--raw` flag
- Non-overlapping command namespaces
- Every turn entry enforcement via pre-turn hook
- Mid-session enforcement via checkpoint mechanism

**Acceptance Criteria:**
- [ ] Single CLI entry point for all framework operations
- [ ] JSON output mode for machine consumption
- [ ] Zero command namespace overlap
- [ ] Pre-turn/mid-turn enforcement wired to all commands
- [ ] Compound `init` commands returning structured context packets

---

#### D5: SOT Artifact Management — Chained, Searchable

| Aspect | Value |
|--------|-------|
| **Priority** | MEDIUM |
| **Dependency** | D4 (CLI tooling) |
| **GSD Pattern** | .planning/ directory with structured phases, RESEARCH.md, STACK.md |
| **Current State** | .hivemind/ exists but JSON-heavy, not easily searchable |

**Requirements:**
- Artifacts chained: changes trigger downstream updates
- Searchable format: markdown with structured headers, grep-friendly
- Long-doc consumable: like the existing docs/ files with TOC, sections, cross-refs
- Script for bashing hierarchy into readable format
- Auto-generated index files (like KNOWLEDGE-MASTER-INDEX.md)
- `hivemind-tools docs generate|index|search|validate` commands

**Acceptance Criteria:**
- [ ] All SOT artifacts have markdown counterparts for human consumption
- [ ] Index files auto-generated from directory structure
- [ ] `hivemind-tools docs search <query>` returns matching sections with context
- [ ] Changes to upstream artifacts trigger notification to downstream consumers

---

#### D6: Quality Gates — Journey-Based Validation

| Aspect | Value |
|--------|-------|
| **Priority** | MEDIUM |
| **Dependency** | D4 (CLI tooling) |
| **GSD Pattern** | Nyquist 8-dimensional validation, plan-checker agent |
| **Current State** | quality-check.sh (9 categories) + legacy test runner |

**Requirements:**
- Beyond mechanical test running: journey-based validation
- Edge case assessment: spec-driven, not just happy-path
- Incremental integration verification: no gaps, no drift
- Dimensional scoring (like GSD's Nyquist layer):
  1. Hierarchy integrity
  2. Delegation contract compliance
  3. Context budget adherence
  4. SOT artifact consistency
  5. Agent role boundary compliance
  6. TODO state coherence
  7. Session export completeness
  8. Regression detection
- Revision loop: generate → check → revise (max 3 iterations)

**Acceptance Criteria:**
- [ ] 8-dimensional validation scoring for every artifact type
- [ ] Journey-based test scenarios (not just unit assertions)
- [ ] Incremental integration checks at wave boundaries
- [ ] Revision loop protocol with max 3 iterations

---

#### D7: Context Injection/Purification — RANK 1

| Aspect | Value |
|--------|-------|
| **Priority** | CRITICAL (RANK 1 in master plan) |
| **Dependency** | None (gates everything else) |
| **GSD Pattern** | Context monitor hook, STATE.md auto-updates |
| **Current State** | RANK 1 blocker — dual-channel, 1700-6300 tokens/turn |
| **Master Plan** | Wave β (S2-01) — "Context Injection Remediation" |

**Requirements:**
- Remove P0 duplication between session-lifecycle.ts and messages-transform.ts
- Single-channel context delivery with < 1200 tokens/turn target
- Session output transformed into hierarchy workflow anchoring
- Filter out confusion, conflict, overlapping directives
- Connect with ongoing session context (not stale)
- Purification pipeline: raw exports → cleaned → structured → SOT materialized

**Acceptance Criteria:**
- [ ] Single context delivery channel (not dual)
- [ ] Token footprint < 1200 tokens/turn
- [ ] Zero P0 duplication across channels
- [ ] Purification pipeline produces structured output
- [ ] Session continuity maintained across compaction

---

#### D8: Memory/Thinking Tools — Auto-Inject, Event Queuing

| Aspect | Value |
|--------|-------|
| **Priority** | MEDIUM |
| **Dependency** | D7 (context injection) |
| **GSD Pattern** | PostToolUse context monitor, debounced warnings |
| **OpenCode Support** | Plugin event hooks, tool.execute.after |
| **Current State** | soft-governance.ts is passive, no auto-reminders |

**Requirements:**
- Auto-mechanism to inject memory save reminders at key events
- Event queuing: important events buffered and injected as prompts
- Thinking tool enforcement: remind agents to save anchors, update mems
- Auto-classification of generated data (discovery/research/planning/debug)
- Purge protocol: temporary → consolidated → persistent lifecycle
- PostToolUse hook for context budget monitoring (GSD pattern)

**Acceptance Criteria:**
- [ ] Key events trigger memory save reminders (auto-injected)
- [ ] Event queue persists important events for next-turn injection
- [ ] Auto-classification of session data into 7 categories
- [ ] Purge protocol: temporary data purged after consolidation
- [ ] Context budget monitoring with WARNING/CRITICAL thresholds

---

#### D9: Synthesis Knowledge Export — Searchable, Glob-Friendly

| Aspect | Value |
|--------|-------|
| **Priority** | LOW-MEDIUM |
| **Dependency** | D5 (SOT artifacts), D7 (context injection) |
| **GSD Pattern** | RESEARCH.md, STACK.md, CONVENTIONS.md, CONCERNS.md |
| **Current State** | GSD-style codebase mapping partially started |

**Requirements:**
- Holistic knowledge export from sessions → searchable markdown
- Auto-formed into grep/glob/regex-friendly format
- Structured headers for section-level retrieval
- Long-doc consumable: table of contents, cross-references
- Integration with docs/ folder structure
- Existing docs (OPENCODE-ARCHITECTURE-NARRATIVE.md etc.) as templates

**Acceptance Criteria:**
- [ ] Session knowledge auto-exported to searchable markdown
- [ ] Documents have structured headers for grep/glob retrieval
- [ ] Cross-references between documents maintained automatically
- [ ] Index files updated when new knowledge documents created

---

## 3. GSD → HiveMind Adoption Matrix

| GSD Pattern | HiveMind Equivalent | Gap | Adoption Priority |
|-------------|---------------------|-----|-------------------|
| gsd-tools.cjs (unified CLI) | hivefiver-tools.sh (scope-limited) | Need project-wide CLI | 1 (D4) |
| STATE.md + config.json (dual state) | brain.json + hierarchy.json (machine only) | Need human-readable STATE | 2 (D5) |
| Context monitor hook | soft-governance.ts (passive) | Need active monitoring | 1 (D7) |
| Atomic git commits | auto-commit.ts (batch) | Need per-task granularity | 3 (D4) |
| Nyquist 8-dim validation | quality-check.sh (9 cats) | Need journey-based | 2 (D6) |
| Template system | `.opencode/templates/` (8 files) | Need CLI fill commands | 3 (D5) |
| Agent init packets | Ad-hoc delegation | Need structured init | 1 (D1) |
| Atomic/compound commands | Router commands exist | Need argument schemas | 2 (D4) |
| Plan-checker revision loop | No equivalent | Need dimensional scoring | 3 (D6) |

---

## 4. OpenCode SDK Capabilities Matrix

| Capability | Supported | HiveMind Usage |
|------------|-----------|----------------|
| Session create (SDK) | ✅ Full | D3: programmatic session creation |
| Session naming (title) | ✅ Full | D3: JSON-encoded metadata in title |
| Parent-child sessions | ✅ Full | D1: 3-level delegation chains |
| Session fork | ✅ Full | D3: fork at checkpoint |
| Message injection (noReply) | ✅ Full | D3: context steering without LLM |
| Event system (30+ events) | ✅ Full | D8: memory save reminders, monitoring |
| Plugin custom tools | ✅ Full | D4: CLI tool wiring |
| Plugin event hooks | ✅ Full | D7: context injection control |
| Tool execution interception | ✅ Full | D6: quality gate enforcement |
| TODO endpoint | ✅ Full | D2: TODO persistence |
| Session metadata/tags | ❌ None | D3: workaround via JSON title |
| Pre-LLM prompt transform | ❌ None | D3: workaround via noReply injection |
| Native denial/routing | ❌ None | D3: workaround via plugin |

---

## 5. Strategic Options

### Option A: SPEC-First Sequential (EXPERT RECOMMENDATION)

**Approach:** Write a comprehensive SPEC document covering all 9 domains with acceptance criteria, then execute in dependency-ordered phases.

**Execution Order:**
1. **Phase 0**: SPEC document (this plan → formal SPEC) — 1 session
2. **Phase 1**: D7 (Context Injection) + D4 (CLI Tooling) — foundational, gates everything — 2-3 sessions
3. **Phase 2**: D1 (Delegation) + D2 (TODO) — agent architecture + workflow state — 2-3 sessions
4. **Phase 3**: D5 (SOT) + D6 (Quality Gates) + D8 (Memory) — artifact management — 2-3 sessions
5. **Phase 4**: D9 (Knowledge Export) — synthesis and searchability — 1-2 sessions
6. **Phase 5**: D3 (Session Manipulation) — deferred to worktree — LATER

**Pros:**
- Prevents drift — all domains designed coherently before building
- Dependency ordering prevents integration conflicts
- Follows TDD/spec-driven approach (user mandate)
- Cross-domain design decisions captured upfront
- Each phase has clear acceptance criteria and verification

**Cons:**
- Slower start (SPEC phase first)
- 1 session delay before any code changes

**Estimated:** 10-14 sessions total, 4-6 weeks

---

### Option B: Domain-Parallel Sprint

**Approach:** Split 9 domains into 3 parallel tracks, execute simultaneously with integration gates.

**Tracks:**
- Track 1: D7 + D1 + D6 (Context + Agents + Quality)
- Track 2: D4 + D5 + D9 (CLI + SOT + Knowledge)
- Track 3: D2 + D8 + D3-deferred (TODO + Memory + Session-later)

**Pros:**
- Faster overall completion
- Parallel tracks reduce total wall-clock time

**Cons:**
- HIGH RISK: Domains are deeply interdependent (D4 feeds D2, D5, D6; D7 feeds D8, D9)
- Integration conflicts likely — parallel file modifications
- Context budget overrun from tracking 3 tracks simultaneously
- Violates evidence-discipline: hard to verify in parallel
- D7 (RANK 1 blocker) must complete first anyway, negating true parallelism

**Why NOT recommended:** The dependency graph (Section 2) shows D7 and D4 are root nodes — almost everything depends on them. True parallelism is impossible until those complete. This option creates an illusion of speed while increasing risk of rework.

---

### Option C: Incremental Domain Patching

**Approach:** Address domains one-at-a-time in strict priority order, each with micro-spec → build → verify cycle.

**Execution Order:** D7 → D4 → D1 → D2 → D5 → D6 → D8 → D9 → D3-deferred

**Pros:**
- Simple mental model
- Each domain fully complete before next starts
- Lowest risk of integration conflicts

**Cons:**
- SLOW: No cross-domain design decisions made upfront
- Late-stage domains (D5, D8, D9) may force redesign of early domains
- No architectural coherence — each domain designed in isolation
- Misses cross-cutting concerns (e.g., D2's graph-sync needs D4's CLI AND D7's context)

**Why NOT recommended:** The user's request explicitly calls out SYSTEMIC improvements — "deterministic and programmatic approach to ensure agents always behave." Incremental patching doesn't capture the systemic vision. Cross-domain patterns (like TODO ↔ hierarchy graph-sync, or SOT artifacts ↔ knowledge export) need joint design.

---

## 6. Recommendation: Option A with Fast SPEC

**Expert Choice:** Option A modified with an accelerated SPEC phase.

Instead of a full formal SPEC session, I produce the SPEC document NOW (in this session) as Section 2 above already contains domain-level acceptance criteria. This collapses Phase 0 into the current session.

**Immediate Next Actions:**
1. **User confirms** Option A direction and priority ordering
2. **HiveFiver writes** `SPEC-FRAMEWORK-UPGRADE-2026-03-02.md` (formalizing Section 2)
3. **Phase 1 begins**: D7 (Context Injection Remediation) — already Wave β in master plan
4. **Phase 1 parallel**: D4 (Unified CLI) — independent of D7, can run in parallel

---

## 7. Artifacts Referenced

| Artifact | Path | Purpose |
|----------|------|---------|
| This plan | `docs/plans/2026-03-02-framework-upgrade-strategic-plan.md` | Strategic framing |
| Master plan v2.1 | `docs/plans/2026-02-27-hybrid-ab-master-plan.md` | Predecessor plan |
| HiveFiver STATE | `.hivemind/hive-modules/hivefiver-v2/STATE.md` | Module state |
| PITFALLS | `docs/PITFALLS.md` | Anti-pattern catalog |
| ZERO EVENT | `docs/THE-ZERO-EVENT.md` | Strategic reference |
| SYSTEM DIRECTIVES | `SYSTEM-DIRECTIVES.md` | Governance patterns |
| GSD Patterns | `.hivemind/hive-modules/hivefiver-v2/synthesis/GSD-PATTERNS.md` | Pattern synthesis |
| Knowledge Index | `docs/OPENCODE-KNOWLEDGE-MASTER-INDEX.md` | Document registry |

---

*Document maintained by HiveFiver meta-builder agent.*
*Created: 2026-03-02*
