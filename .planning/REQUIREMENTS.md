# Requirements: HiveMind v3 — Cognitive Mesh for AI Agents

**Defined:** 2026-02-12
**Core Value:** We create a hivemind's brain that boosts intelligence and provides users' true expertise of AI agents — work faster, more efficiently, handle with full bulletproof of context drift.

**Philosophy:** NOT a feature list. 5 interconnected systems forming a cognitive mesh. SDK materializes the concepts. Concepts are platform-portable.

## v1 Requirements

Categories map to the 5 cognitive mesh systems from the idumb-v2 architecture.

### SDK Foundation (Materialization Layer)

- [ ] **SDK-RESEARCH-01**: **RESEARCH** — Verify OpenCode SDK TUI capabilities. Can plugins register custom panels or only use `showToast()`? See `.planning/research/SDK-RESEARCH-01.md`. **Decision:** If YES → add embedded dashboard to Phase 1. If NO → document as v2 requirement, proceed with standalone TUI.
- [ ] **SDK-01**: Plugin entry wires `client`, `$` (BunShell), `serverUrl`, `project` from PluginInput (currently only `directory` + `worktree` used)
- [ ] **SDK-02**: Event-driven governance via `event` hook subscribing to `session.created`, `session.idle`, `session.compacted`, `file.edited`, `session.diff`
- [ ] **SDK-03**: SDK client stored safely (not during init — deadlock caveat) and available to all hooks/tools
- [ ] **SDK-04**: `src/lib/` NEVER imports SDK — enforced by lint rule or build-time check
- [ ] **SDK-05**: All SDK calls wrapped in try/catch with graceful fallback to filesystem-only mode (plugin works without SDK)

### Auto-Hooks & Governance (Triggers & Rules)

- [ ] **GOV-01**: Bootstrap fires in ALL governance modes (strict, assisted, permissive) — condition on `turn_count <= 2`, not `governance_status`
- [ ] **GOV-02**: Evidence discipline + team behavior injected into system prompt from turn 0 unconditionally
- [ ] **GOV-03**: Permissive mode suppresses detection signal warnings to match "silent tracking" documentation
- [ ] **GOV-04**: `client.tui.showToast()` for visual governance warnings — drift alerts, compaction notices, evidence reminders
- [ ] **GOV-05**: Event-driven Time-to-Stale: `session.idle` triggers staleness check instead of turn-counting approximation
- [ ] **GOV-06**: Framework detector identifies GSD (`.planning/`) and Spec-kit (`.spec-kit/`) and injects framework-specific context
- [ ] **GOV-07**: Framework-aware drift: when GSD phase goal exists, drift measured against phase goal + hierarchy
- [ ] **GOV-08**: IGNORED escalation tier (10+ unacknowledged warnings) with dynamic argue-back using hierarchy + metrics data

### Session Management & Auto-Export (Lifecycle)

- [ ] **SES-01**: Session = On-going Plan: use `client.session.*` to track real session lifecycle (create, get, update)
- [ ] **SES-02**: Auto-Export of whole session: `client.session.messages()` exports complete session for archival
- [ ] **SES-03**: Long session handling: `client.session.summarize()` for smart compaction instead of raw truncation
- [ ] **SES-04**: Session structure: each session has ID, date, meta key, role metadata linked to hierarchy nodes
- [ ] **SES-05**: `session.compacted` event triggers post-compaction integrity checks automatically
- [ ] **SES-06**: Context injection via `client.session.prompt({ noReply: true })` for governance context without triggering AI response

### Unique Agent Tools (Hook-Activated Utilities)

- [ ] **TUL-01**: Fast Read via `client.file.read()` + `client.file.status()` for structured file access
- [ ] **TUL-02**: Fast Search via `client.find.text()` (ripgrep), `client.find.files()` (fd), `client.find.symbols()` (LSP)
- [ ] **TUL-03**: Codebase extraction via BunShell `$`: `$\`npx repomix --output - --compress\`` with token counting
- [ ] **TUL-04**: Precision extraction: grep, glob, read CLI commands with `--json` structured output
- [ ] **TUL-05**: Hierarchy reading tools enhanced with session context from `client.session.get()`
- [ ] **TUL-06**: Thinking frameworks: cognitive models injected based on detected complexity level
- [ ] **TUL-07**: All extraction tools support `--json` flag for structured output consumable by other systems

### The Mems Brain (Shared Knowledge Repository)

- [ ] **MEM-01**: Shared Brain: mems share across sessions via atomic git commits (mems → git → any session reads)
- [ ] **MEM-02**: Orchestration state: Ralph loop pattern (prd.json → loop-state.json → story selection → completion)
- [ ] **MEM-03**: Just-in-Time Memory: recall relevant mems using `client.find.text()` for semantic relevance matching
- [ ] **MEM-04**: Loop state persists across compactions and session restarts in `.hivemind/loop-state.json`
- [ ] **MEM-05**: Quality gate integration: acceptance criteria from prd.json checked against test/build output
- [ ] **MEM-06**: Meta Data & IDs: every mem tagged with timestamp, session ID, hierarchy stamp, git hash

### Stress Test & Integration Validation

- [ ] **STR-01**: All 13 stress test conditions from STRESS-TEST-1.MD pass programmatically
- [ ] **STR-02**: 10+ sequential compaction test verifies hierarchy, brain, session, and loop state preservation
- [ ] **STR-03**: Framework detection stress test: greenfield, brownfield, GSD-only, Spec-kit-only, multi-framework
- [ ] **STR-04**: Cognitive mesh integration test: all 5 systems chaining correctly (hook → session → tool → mem → core)
- [ ] **STR-05**: `npm run stress-test` command runs full suite

## v2 Requirements

Deferred. Tracked but not in current roadmap.

### Advanced Materialization

- **SDK-06**: `chat.params` hook to adjust temperature/topP by governance mode
- **SDK-07**: `experimental.chat.messages.transform` for smart context pruning
- **SDK-08**: `shell.env` hook to inject `HIVEMIND_SESSION_ID`, `HIVEMIND_MODE` into all shell commands

### Advanced Orchestration

- **MEM-07**: Beads integration (`.beads/beads.jsonl` format alongside prd.json)
- **MEM-08**: Multi-loop coordination (multiple prd.json files running in parallel)

### Framework Extensions

- **GOV-09**: BMAD framework detection and integration
- **GOV-10**: Framework-specific skill auto-loading

## Out of Scope

| Feature | Reason |
|---------|--------|
| Blocking/denying tool execution | NEVER — will clash with other plugins, violates core philosophy |
| `permission.ask` hook | ZERO plugins in ecosystem use it; collision guaranteed with multi-plugin setups |
| Running GSD/Spec-kit commands | HiveMind governs, doesn't orchestrate. Frameworks run their own workflows |
| Full Repomix reimplementation | Wrap via BunShell `$`, don't rebuild. Repomix evolves independently |
| Agent spawning/management | Frameworks spawn agents. HiveMind governs them via context injection |
| Custom LLM model support | Model-agnostic by design |

## Traceability

| Requirement | Phase | Phase Name | Status |
|-------------|-------|------------|--------|
| SDK-RESEARCH-01 | 1 | SDK Foundation + System Core | Pending |
| SDK-01 | 1 | SDK Foundation + System Core | Pending |
| SDK-02 | 1 | SDK Foundation + System Core | Pending |
| SDK-03 | 1 | SDK Foundation + System Core | Pending |
| SDK-04 | 1 | SDK Foundation + System Core | Pending |
| SDK-05 | 1 | SDK Foundation + System Core | Pending |
| GOV-01 | 2 | Auto-Hooks & Governance Mesh | Pending |
| GOV-02 | 2 | Auto-Hooks & Governance Mesh | Pending |
| GOV-03 | 2 | Auto-Hooks & Governance Mesh | Pending |
| GOV-04 | 2 | Auto-Hooks & Governance Mesh | Pending |
| GOV-05 | 2 | Auto-Hooks & Governance Mesh | Pending |
| GOV-06 | 2 | Auto-Hooks & Governance Mesh | Pending |
| GOV-07 | 2 | Auto-Hooks & Governance Mesh | Pending |
| GOV-08 | 2 | Auto-Hooks & Governance Mesh | Pending |
| SES-01 | 3 | Session Management & Auto-Export | Pending |
| SES-02 | 3 | Session Management & Auto-Export | Pending |
| SES-03 | 3 | Session Management & Auto-Export | Pending |
| SES-04 | 3 | Session Management & Auto-Export | Pending |
| SES-05 | 3 | Session Management & Auto-Export | Pending |
| SES-06 | 3 | Session Management & Auto-Export | Pending |
| TUL-01 | 4 | Unique Agent Tools | Pending |
| TUL-02 | 4 | Unique Agent Tools | Pending |
| TUL-03 | 4 | Unique Agent Tools | Pending |
| TUL-04 | 4 | Unique Agent Tools | Pending |
| TUL-05 | 4 | Unique Agent Tools | Pending |
| TUL-06 | 4 | Unique Agent Tools | Pending |
| TUL-07 | 4 | Unique Agent Tools | Pending |
| MEM-01 | 5 | The Mems Brain Enhanced | Pending |
| MEM-02 | 5 | The Mems Brain Enhanced | Pending |
| MEM-03 | 5 | The Mems Brain Enhanced | Pending |
| MEM-04 | 5 | The Mems Brain Enhanced | Pending |
| MEM-05 | 5 | The Mems Brain Enhanced | Pending |
| MEM-06 | 5 | The Mems Brain Enhanced | Pending |
| STR-01 | 6 | Stress Test & Integration | Pending |
| STR-02 | 6 | Stress Test & Integration | Pending |
| STR-03 | 6 | Stress Test & Integration | Pending |
| STR-04 | 6 | Stress Test & Integration | Pending |
| STR-05 | 6 | Stress Test & Integration | Pending |

**Coverage:**
- v1 requirements: 37 total
- Mapped to phases: 37
- Unmapped: 0 ✓

**Phase distribution (maps to cognitive mesh):**
- Phase 1: 5 requirements (SDK — materialization foundation)
- Phase 2: 8 requirements (GOV — Auto-Hooks & Governance)
- Phase 3: 6 requirements (SES — Session Management & Auto-Export)
- Phase 4: 7 requirements (TUL — Unique Agent Tools)
- Phase 5: 6 requirements (MEM — The Mems Brain)
- Phase 6: 5 requirements (STR — Stress Test & Integration)

---
*Requirements defined: 2026-02-12*
*Last updated: 2026-02-12 — restructured around 5-system cognitive mesh*
