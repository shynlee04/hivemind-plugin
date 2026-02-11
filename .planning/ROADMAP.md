# Roadmap: HiveMind v3 — Cognitive Mesh

**Created:** 2026-02-12
**Phases:** 6 (each materializes one cognitive mesh system)
**Requirements:** 37

**Core Value:** We create a hivemind's brain that boosts intelligence and provides users' true expertise of AI agents — work faster, more efficiently, handle with full bulletproof of context drift.

## Progress

| # | Phase | Mesh System | Status | Plans | Progress |
|---|-------|-------------|--------|-------|----------|
| 1 | SDK Foundation + System Core | Materialization Layer | ◐ | 0/2 | 0% |
| 2 | Auto-Hooks & Governance Mesh | Triggers & Rules | ○ | 0/0 | 0% |
| 3 | Session Management & Auto-Export | Lifecycle | ○ | 0/0 | 0% |
| 4 | Unique Agent Tools | Hook-Activated Utilities | ○ | 0/0 | 0% |
| 5 | The Mems Brain Enhanced | Shared Knowledge Repository | ○ | 0/0 | 0% |
| 6 | Stress Test & Integration | Mesh Validation | ○ | 0/0 | 0% |

---

## Phase 1: SDK Foundation + System Core

**Mesh System:** Materialization Layer — wiring the SDK client that gives all other systems their power
**Goal:** Plugin uses full SDK surface (`client`, `$`, events) with graceful fallback. Core lib remains SDK-free.
**Requirements:** SDK-01, SDK-02, SDK-03, SDK-04, SDK-05
**Plans:** 2 plans
**Status:** Planned

Plans:
- [ ] 01-01-PLAN.md — SDK context singleton + plugin entry wiring (Wave 1)
- [ ] 01-02-PLAN.md — Event handler, boundary enforcement, tests (Wave 2)

### Success Criteria

1. Plugin entry destructures `client`, `$`, `serverUrl`, `project` from PluginInput alongside `directory` and `worktree`
2. `event` hook receives and logs `session.created`, `session.idle`, `file.edited` events in dev mode
3. `src/lib/` has zero `@opencode-ai` imports (verified by grep/lint rule)
4. Plugin still functions fully (14 tools, 4 hooks) when SDK client is unavailable (graceful fallback)
5. SDK client stored in module state (not during init) and accessible from all hooks and tools

### Depends On

- Nothing (foundation for everything)

### Why First

Every other system needs the SDK client to materialize its concepts. Without `client`, we can't do real sessions, toasts, file search, or event-driven hooks. This unblocks ALL subsequent phases.

---

## Phase 2: Auto-Hooks & Governance Mesh

**Mesh System:** Triggers & Rules — the governance engine that watches everything
**Goal:** Governance fires from turn 0 in every mode, framework-aware, event-driven, with visual feedback via showToast
**Requirements:** GOV-01, GOV-02, GOV-03, GOV-04, GOV-05, GOV-06, GOV-07, GOV-08
**Status:** Not started

### Success Criteria

1. Agent in **assisted** mode receives evidence + team teaching in system prompt on turn 1 (ST12 fix)
2. Agent in **permissive** mode receives bootstrap but zero detection warnings (ST11 fix)
3. `client.tui.showToast()` fires on drift detection, evidence gate escalation, and compaction — user sees visual feedback
4. `session.idle` event triggers Time-to-Stale check instead of turn-count approximation
5. GSD project detected → system prompt includes current phase goal from `.planning/ROADMAP.md`
6. All 13 stress test conditions from STRESS-TEST-1.MD evaluate to PASS

### Depends On

- Phase 1 (needs `client` for showToast, `event` for event-driven hooks)

### Why Second

Governance is the core promise — "from turn 0, in every mode." This fixes the stress test FAIL (ST12) and CONDITIONAL PASS (ST11). With SDK wired in Phase 1, governance can now use `showToast()` for visual feedback and real events instead of turn-counting hacks.

---

## Phase 3: Session Management & Auto-Export

**Mesh System:** Lifecycle — sessions as first-class objects, not just file-based state
**Goal:** Sessions are real objects via SDK. Auto-export captures complete history. Long sessions handled gracefully.
**Requirements:** SES-01, SES-02, SES-03, SES-04, SES-05, SES-06
**Status:** Not started

### Success Criteria

1. `compact_session` tool uses `client.session.messages()` to export full session history before archiving
2. `client.session.prompt({ noReply: true })` injects governance context without triggering AI response
3. `session.compacted` event auto-triggers integrity check (hierarchy, brain state, mems consistency)
4. Each session archive includes real session ID, message count, and duration from SDK (not approximated)
5. Long session handling uses `client.session.summarize()` for intelligent compaction

### Depends On

- Phase 2 (governance must be solid before managing sessions through it)

### Why Third

The idumb-v2 diagram shows "Session = On-going Plan." Today sessions are just files. With `client.session.*`, sessions become real objects with messages, diffs, and lifecycle events. Auto-export becomes `session.messages()` instead of reconstructing from files. This transforms Session Management from a hack into a first-class system.

---

## Phase 4: Unique Agent Tools

**Mesh System:** Hook-Activated Utilities — the cognitive prosthetics agents actually use
**Goal:** Fast, structured access to codebase via SDK file/find APIs + BunShell subprocess tools
**Requirements:** TUL-01, TUL-02, TUL-03, TUL-04, TUL-05, TUL-06, TUL-07
**Status:** Not started

### Success Criteria

1. `hivemind read <file>` uses `client.file.read()` for structured file access with offset/limit
2. `hivemind search <pattern>` uses `client.find.text()` (ripgrep) with context lines and JSON output
3. `hivemind extract` wraps `$\`npx repomix\`` via BunShell with `--compress` and `--token-count` support
4. All tool commands support `--json` flag producing structured output consumable by other systems
5. Hierarchy reading tools enriched with session context from `client.session.get()`

### Depends On

- Phase 3 (session context needed for tool enrichment)

### Why Fourth

The idumb-v2 diagram shows 4 tool categories: Hierarchy Reading, Fast Read/Extract, Precision Extraction, Thinking Frameworks. Today tools use raw `fs` calls. With `client.file.*` and `client.find.*`, tools get structured access. With BunShell `$`, tools can spawn `repomix`, `rg`, `fd` as subprocesses. The tools become genuinely powerful cognitive prosthetics.

---

## Phase 5: The Mems Brain Enhanced

**Mesh System:** Shared Knowledge Repository — persistent cross-session intelligence
**Goal:** Mems brain enhanced with orchestration state (Ralph loop), semantic recall, and atomic git persistence
**Requirements:** MEM-01, MEM-02, MEM-03, MEM-04, MEM-05, MEM-06
**Status:** Not started

### Success Criteria

1. `hivemind loop init prd.json && hivemind loop next` loads stories and selects first actionable story
2. Loop state survives 5+ compactions — `hivemind loop status` shows consistent progress
3. `recall_mems` tool uses `client.find.text()` for semantic relevance matching (not just keyword)
4. Every mem tagged with timestamp, session ID (from real SDK session), hierarchy stamp, git hash
5. Quality gate checks acceptance criteria against test/build output before marking story complete

### Depends On

- Phase 4 (extraction tools support orchestration — loop needs codebase context)

### Why Fifth

The Mems Brain is the "long-term memory" of the cognitive mesh. With SDK session integration (Phase 3) and file search (Phase 4), mems can now be recalled by semantic relevance rather than just keywords. Ralph loop pattern adds orchestration intelligence — the brain doesn't just remember, it plans and tracks multi-story work.

---

## Phase 6: Stress Test & Integration

**Mesh System:** Mesh Validation — proving the 5 systems chain correctly
**Goal:** `npm run stress-test` validates ALL conditions. The cognitive mesh works as a whole, not just as parts.
**Requirements:** STR-01, STR-02, STR-03, STR-04, STR-05
**Status:** Not started

### Success Criteria

1. `npm run stress-test` reports pass/fail for every condition in a single run
2. 10+ sequential compaction test verifies ALL 5 systems preserve state correctly
3. Cognitive mesh integration test: hook triggers → session updates → tool enriches → mem stores → core reflects
4. Framework detection covers greenfield, brownfield, GSD, Spec-kit, and no-framework projects
5. Stress test is itself a regression guard — runs in CI via `npm run stress-test`

### Depends On

- Phase 5 (all systems must exist before validating they chain correctly)

### Why Last

You can't stress test a mesh until all 5 systems exist and are wired together. Phase 6 doesn't test features — it tests that the **chaining** works. Auto-Hooks detect drift → Session Management captures context → Agent Tools provide evidence → Mems Brain stores knowledge → System Core reflects truth. If any link breaks, the stress test catches it.

---

## Phase Ordering Rationale

```
Phase 1 (SDK) → Phase 2 (Governance):
  Governance needs client for showToast, events for event-driven hooks

Phase 2 (Governance) → Phase 3 (Sessions):
  Governance must be solid before managing sessions through it

Phase 3 (Sessions) → Phase 4 (Tools):
  Tools need session context for enrichment

Phase 4 (Tools) → Phase 5 (Mems):
  Orchestration loop needs extraction tools for codebase context

Phase 5 (Mems) → Phase 6 (Stress Test):
  All systems must exist before testing their chaining
```

**The ordering IS the cognitive mesh dependency chain.** Each phase adds one system that depends on the previous systems being functional. By Phase 6, all 5 systems are wired and the stress test validates the mesh as a whole.

---
*Roadmap created: 2026-02-12*
*Last updated: 2026-02-12 — restructured around 5-system cognitive mesh*
