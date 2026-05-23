# Phase 23: Notification Architecture Fix + Holistic Tool Surface Documentation

**Spec date:** 2026-05-22 (UPDATED v2)
**Domain:** Notification delivery architecture, two-mechanism injection system, tool surface documentation, comprehensive hm-* skill restructuring
**Primary sources:** Phase 22 completion evidence, SDK research (`@opencode-ai/sdk v1.15.5` — `TextPartInput.synthetic` CONFIRMED), user deep analysis 2026-05-22
**Phase dependency:** Phase 22 (Coordination Status + Error Unification) — COMPLETE
**Status:** ACTIVE (2026-05-22)

---

## 0. Inter-Phase Linkage Analysis

### 0.1 Dependency Chain

```
P22 (Status+Error Unification) ✅
  └── P23 (Notification Fix + Skill Restructure) 🟡 ACTIVE
        ├── P24 (Coordination Dispatch + Delegate-Task Fix) — Sửa notification xong thì P24 mới gọi delegate-task chính xác
        ├── P25 (Trajectory + Agent-Work-Contract Redesign) — P23-06 assessment sẽ định hướng redesign
        └── P26 (Pressure + Notification Redesign) — P23-01 notification fix LÀ foundation cho P26
              └── P27 (Routing + Intent Loop Foundation — depends P21-P26)
                    └── P28 (Hook Injection Plane Redesign — P23-07 injection patterns là input)
```

### 0.2 Conflict & Overlap Boundaries

| Overlap Risk | Phase 23 Boundary | Affected Phase | Resolution |
|-------------|-------------------|----------------|------------|
| P23-01 notification fix vs P26 pressure redesign | P23-01 fix CHỈ delivery mechanism (synthetic:true + two-tier) | P26 | P26 handles scoring/thresholds redesign. P23 không touch pressure scoring logic |
| P23-06 trajectory/pressure/work-contract assessment vs P25/P26 | P23-06 produce assessment doc ONLY — no code changes | P25, P26 | Assessment doc consumed by P25 (trajectory redesign) and P26 (pressure redesign) as input |
| P23-04 skill rewrite vs P24 delegate-task | P23-04 rewrite hm-* coordination skills to reflect REAL tool surfaces | P24 | P24 uses rewritten skills. P24 must not duplicate the skill documentation effort |
| P23-07 injection patterns vs P28 hooks | P23-07 create patterns skill | P28 | P28 consumes the patterns and implements hook-plane changes based on them |
| Phase 17-22 notification flaws | All existing flaw fixes consolidated in P23-01 | P14, P22 | Root cause (missing synthetic:true) fixed at source. No need to revisit prior phases |

### 0.3 Regression Risks

- **Phase 22 notification-router.ts** — P23-01 modifies notification delivery chain. If synthetic:true breaks notification routing, P22's retry/TTL work is lost.
- **Phase 21 session-tracker** — message-capture.ts already filters synthetic parts (line 356). If our fix mis-flags parts, session capture may mis-filter.
- **Phase 14 delegation** — Notification injection to parent sessions was wired in P14. Synthetic:true addition must not break the delegation completion flow.
- **CP-DT-01** — Delegate-task ecosystem uses notification system. Any notification change affects delegation completion detection.

---

## 1. Foundational Analysis: Two Notification Mechanisms

### 1.1 The Core Architecture Decision

Based on user deep analysis + codebase evidence, the notification system requires TWO distinct delivery mechanisms:

| Mechanism | Delivery Method | Response Expected | When | Use Case |
|-----------|----------------|------------------|------|----------|
| **Silent Injection** | `synthetic: true` + `noReply: true` → body context | NO — agent decides when to poll `delegation-status` | Task progress updates, non-critical status | Status injection, context enrichment |
| **Urgent Notification** | Direct notification with forced delivery | YES — requires immediate agent response (NOT via user message input) | Failure (via early detection thresholds), Success completion | Delegation terminal states |

**SDK evidence:** Confirmed via node_modules inspection:
- `@opencode-ai/sdk v1.15.5` — `TextPartInput.synthetic?: boolean` exists in BOTH v1 and v2 types
- Runtime: synthetic parts → `SessionEvent.Synthetic` (NOT user-role message)
- `message-capture.ts:356` already filters `.filter((part) => getNestedValue(part, ["synthetic"]) !== true)`

### 1.2 The Critical Bug (Root Cause)

Current notification delivery chain (BROKEN):
```
notification-handler.ts:notifyDelegationTerminal()
  → sendPrompt(client, parentSessionID, { noReply: true, parts: [text] })
    → client.session.prompt({ body: { noReply: true, parts } })  ← MISSING synthetic:true
      → Appends as user-role message ← BUG
```

What should happen (FIXED):
```
notification-handler.ts
  → Silent Injection: { parts: [{ type: "text", text, synthetic: true }], noReply: true }
  → Urgent Notification: { parts: [{ type: "text", text, synthetic: true }], noReply: false } + TUI append
```

### 1.3 delegation-status Correct Architecture

- `delegation-status` is an **opt-in polling** tool — agent decides WHEN to check
- Silent injection puts status into context; agent can check or ignore
- Urgent notification overrides for terminal states with required response
- Tool description and schema must make this unambiguous

### 1.4 Failure Detection Requirements

- MUST implement early detection thresholds (not just passive timeout)
- Failure → immediate urgent notification to parent session
- Success → immediate completion notification (NOT via user message input — current bug)

---

## 2. Codebase Evidence: Current State

### 2.1 Confirmed Missing `synthetic: true` Sites

| File | Lines | Current | Should Be | Impact |
|------|-------|---------|-----------|--------|
| `src/coordination/completion/notification-handler.ts` | 170-199 | `noReply: true` only | `synthetic: true` on all text parts | Notifications stored as user-role messages |
| `src/tools/routing/execute-slash-command.ts` | 106-119 | Not using `synthetic: true` | Add `synthetic: true` for synthetic parent prompts | Message capture mis-filters |

### 2.2 Working Infrastructure (`session-api.ts`)

Already provides:
- `sendPrompt()` — general prompt delivery (needs synthetic support)
- `appendTuiPrompt()` — writes to TUI prompt (for urgent notifications)
- `showTuiToast()` — TUI toast display (for failure urgency)

### 2.3 Message Capture Layer (`message-capture.ts`)

- Line 356: already filters parts with `synthetic: true` — ✅ correct
- This confirms the fix is additive: add `synthetic: true` → message capture handles it

---

## 3. Surface Audit: Complete Tool Documentation

### 3.1 Tools That Must Be Documented

| Tool | Current Status | Documentation Gap |
|------|---------------|-------------------|
| **execute-slash-command** | 3 dispatch paths (subtask:true, subtask:false, TUI) | No single authoritative source on when to use which path |
| **delegate-task** | WaiterModel dispatch via SDK child-session | Confused with native `task` tool — no clear differentiation |
| **delegation-status** | Status polling + control actions | Missing use cases and stacking patterns |
| **task** (native) | OpenCode native subagent dispatch | No documentation distinguishing from delegate-task |
| **session-tracker** | 5 actions (export, list, search, filter, get-summary) | Missing query optimization patterns |
| **session-hierarchy** | 4 actions (children, parent-chain, depth, manifest) | Missing depth navigation patterns |
| **session-context** | 4 actions (find-related, cross-ref, synthesize, aggregate) | Missing cross-session synthesis patterns |
| **hivemind-session-view** | Cross-root unified query | Missing fallback handling documentation |
| **hivemind-trajectory** | 7 actions | Assessment needed (P23-06) — may be redesign/deprecation |
| **hivemind-pressure** | 4 actions | Assessment needed (P23-06) — may be redesign/deprecation |
| **hivemind-agent-work-create** | Work contract creation | Assessment needed (P23-06) — may be redesign/deprecation |
| **hivemind-command-engine** | 6 read-side actions | Missing browse/preview/transform patterns |
| **hivemind-doc** | 5 actions (skim, read, chunk, search, skim-dir) | Missing intelligence patterns |
| **hivemind-sdk-supervisor** | 4 actions | Missing health interpretation patterns |

### 3.2 Differentiation Matrix Required

Every skill must clearly document:

| Dimension | Task Tool | delegate-task | execute-slash-command |
|-----------|-----------|---------------|----------------------|
| **Mechanism** | Native OpenCode subagent | WaiterModel SDK child-session | Command dispatch + synthetic prompt |
| **When to use** | Simple delegation, no tracking | Complex async with progress monitoring | Command execution, agent override |
| **Monitoring** | Automatic (OpenCode runtime) | delegation-status polling | Tool return + synthetic response |
| **Stacking** | Automatic (task_id resume) | Explicit parentSessionId | N/A (one-shot) |
| **Limitations** | No progress tracking | Async-only (WaiterModel) | Agent must exist |

---

## 4. Comprehensive Skill Restructure Plan

### 4.1 Skills to Rewrite (COMPREHENSIVE — ALL hm-* orchestration)

| Skill | Current Flaw | Action | Priority |
|-------|-------------|--------|----------|
| **hm-l2-coordinating-loop** | Non-existent scripts/ directory references; aspirational gate scripts | Full rewrite — real tool surfaces only | HIGH |
| **hm-l2-gate-orchestrator** | References non-existent gate scripts; no actual gate tool integration | Full rewrite — use gsd-verifier + actual flows | HIGH |
| **hm-l2-phase-execution** | Non-existent wave-based infrastructure | Full rewrite — real execution paths | HIGH |
| **hm-l2-phase-loop** | Aspirational loop semantics; no real loop primitives | Full rewrite as thin orchestration skill | HIGH |
| **hm-l2-completion-looping** | Ralph-loop references ("totally nonsensical") | Complete rewrite or deprecation | HIGH |
| **hm-l2-subagent-delegation-patterns** | May contain inaccurate tool surface descriptions | Audit + fix | MEDIUM |
| **hm-l2-user-intent-interactive-loop** | May contain aspirational patterns | Audit + fix | MEDIUM |
| **hm-l2-cross-cutting-change** | Cross-pane references may be outdated | Audit + fix | MEDIUM |
| **hm-l2-debug** | Check for aspirational debug infrastructure | Audit + fix | MEDIUM |
| **hm-l3-hivemind-engine-contracts** | Engine contract documentation may have drifted | Sync with current src/ surfaces | MEDIUM |
| **hm-l3-hivemind-state-reference** | State reference may have drifted | Sync with current .hivemind/ structure | MEDIUM |
| **hm-l3-integration-contracts** | Agent-skill binding contracts | Validate against actual agent definitions | MEDIUM |
| **hm-l3-tool-capability-matrix** | Tool permissions matrix | Sync with current tool catalog (23+ tools) | MEDIUM |
| **hivemind-power-on** | Special case — FOUNDATION skill | Full rewrite — tool-based session governance | HIGH |

### 4.2 hivemind-power-on Rewrite Requirements

Must provide:
- Accurate session discovery using actual tool capabilities
- Filtering for active/resumable sessions
- Hierarchy query patterns
- Cross-session aggregation
- NO aspirational workflow — only real tool capabilities
- Works as a LOAD-FIRST governance skill

---

## 5. Requirements

### P23-01: Fix notification delivery — two mechanisms

**Condition:** The system SHALL implement two notification delivery mechanisms:
1. **Silent Injection:** uses `synthetic: true` + `noReply: true` — injects into session body context. Agent decides when to poll `delegation-status`.
2. **Urgent Notification:** Failure (via early detection thresholds) and Success completion — delivered with required response but NOT injected via user message input.

**Acceptance Criteria:**
- Given a delegation completes normally, when `notifyDelegationTerminal()` is called with success, then the notification is delivered via Silent Injection (synthetic:true).
- Given a delegation fails, when failure is detected via threshold, then the notification is delivered via Urgent Notification with required response.
- Given a delegation succeeds, when success notification is sent, then it is NOT appended to the user's message input.
- The `sendPrompt()` wrapper in `session-api.ts` SHALL support `synthetic: true` in text parts.

**Verification Method:** Unit test + code inspection of `notification-handler.ts` payload construction

### P23-02: Add stream reactivation after notification delivery

**Condition:** When delivering a notification to a parent session whose stream has stopped, the system SHALL re-activate the stream by sending an empty synthetic prompt (no AI loop triggered).

**Acceptance Criteria:**
- Given a parent session is in idle state, when a terminal notification needs delivery, then the session stream is re-activated.
- Given a parent session is busy, when a notification is delivered, then no re-activation is needed.
- Re-activation SHALL NOT trigger an AI assistant response.

**Verification Method:** Integration test or live UAT with session state monitoring

### P23-03: Create tool surface differentiation skill (`hm-l3-tool-surface-documentation`)

**Condition:** The system SHALL produce a definitive skill documenting ALL Hivemind custom tools.

**Acceptance Criteria:**
- Covers all 14+ Hivemind custom tools
- Each tool has: description, actions table, when-to-use, limitations
- Differentiation matrix for task/delegate-task/execute-slash-command is present
- All information verified against actual source code
- Reference OpenCode ecosystem repos for patterns (awesome-opencode, opencode-pty, opencode-dynamic-context-pruning) — but TRANSFORMED to Hivemind philosophy, not copy-pasted

**Verification Method:** Cross-reference against src/tools/ directory listing

### P23-04: Audit and rewrite ALL hm-* coordination skills

**Condition:** ALL hm-* coordination skills SHALL be audited against actual tool surfaces and rewritten to remove aspirational patterns.

**Acceptance Criteria:**
- Every referenced tool/script in each skill exists in the codebase
- No aspirational references to non-existent scripts, tools, gates
- Skills reference only real tool capabilities
- Ralph-loop references replaced with practical verification patterns (completion-looping, phase-loop mechanisms)
- GSD/OMO patterns studied and TRANSFORMED to Hivemind conventions (NOT copied)

**Verification Method:** Read every skill file, verify every tool/script reference against filesystem

### P23-05: Rewrite hivemind-power-on skill

**Condition:** The `hivemind-power-on` skill SHALL be rewritten to provide accurate, tool-based session governance.

**Acceptance Criteria:**
- Uses `session-tracker` tool for session discovery
- Uses `session-hierarchy` for parent-child navigation
- Uses `session-context` for cross-session synthesis
- Uses `hivemind-session-view` for unified views
- NO aspirational workflows — every action achievable with actual tools

**Verification Method:** Read rewritten skill, verify every tool reference against src/tools/

### P23-06: Structured assessment of trajectory/pressure/agent-work-contract

**Condition:** The system SHALL produce a structured assessment of 3 tools:
- `hivemind-trajectory` — is this tool serving a real purpose?
- `hivemind-pressure` — is this tool serving a real purpose?
- `hivemind-agent-work-create` — is this tool serving a real purpose?

**Acceptance Criteria:**
- Each tool assessed with evidence from codebase (file:line references)
- If kept: documentation added to tool-surface skill
- If deprecated: removal phase scheduled (target P25/P26)
- Assessment document saved in `.planning/phases/23/trajectory-pressure-workcontract-assessment.md`

**Verification Method:** Read tool source + output structured assessment

### P23-07: Create injection delivery patterns skill (`hm-l3-injection-delivery-patterns`)

**Condition:** The system SHALL produce a skill documenting 4 delivery patterns:
1. **Silent vs required responses** (noReply:true vs false)
2. **Direct injection to session body context** (synthetic messages)
3. **Append directly through messages** (appendMessage pattern)
4. **TUI-queued vs direct delivery** (appendPrompt vs session injection)

**Acceptance Criteria:**
- Covers all 4 delivery patterns
- Each pattern has: when to use, code example, limitations
- Differentiates between TUI notification and session injection
- Consumes GSD/OMO study insights (transformed to Hivemind conventions)

**Verification Method:** Cross-reference against actual notification-router.ts + session-api.ts + plugin.ts patterns

---

## 6. OpenCode Ecosystem Synthesis

Per `repo-for-learning-and-synthesis.md`, Phase 23 SHALL reference and synthesize from:

| Source | What to Extract | How to Transform |
|--------|----------------|------------------|
| `awesome-opencode` directory | Tool patterns, plugin patterns, ecosystem standards | Filter through Hivemind CQRS + lineage conventions |
| `opencode-dynamic-context-pruning` | Context management patterns | Adapt to Hivemind session-body injection patterns |
| `opencode-pty` | Background command patterns | NOT P23 scope — route to P29 auto-looping |
| `opencode-background-agents` | Background agent patterns | NOT P23 scope — route to P29 |

**Rule:** ALL external patterns must be TRANSFORMED to Hivemind conventions (prefixes, suffixes, naming, architecture, CQRS). NO copy-pasting GSD or OMO conventions.

---

## 7. Scope Boundary

### IN SCOPE

| File/Surface | What changes | Why |
|-------------|-------------|-----|
| `src/coordination/completion/notification-handler.ts` | Two-mechanism notification delivery (silent + urgent) + stream reactivation | P23-01, P23-02 |
| `src/shared/session-api.ts` | Support synthetic parts in sendPrompt() body + appendTuiPrompt for urgent | P23-01 |
| `.opencode/skills/hm-l2-coordinating-loop/SKILL.md` | Full rewrite | P23-04 |
| `.opencode/skills/hm-l2-gate-orchestrator/SKILL.md` | Full rewrite | P23-04 |
| `.opencode/skills/hm-l2-phase-execution/SKILL.md` | Full rewrite | P23-04 |
| `.opencode/skills/hm-l2-phase-loop/SKILL.md` | Full rewrite | P23-04 |
| `.opencode/skills/hm-l2-completion-looping/SKILL.md` | Rewrite or deprecate | P23-04 |
| `.opencode/skills/hm-l2-subagent-delegation-patterns/SKILL.md` | Audit + fix | P23-04 |
| `.opencode/skills/hm-l2-user-intent-interactive-loop/SKILL.md` | Audit + fix | P23-04 |
| `.opencode/skills/hm-l2-cross-cutting-change/SKILL.md` | Audit + fix | P23-04 |
| `.opencode/skills/hm-l2-debug/SKILL.md` | Audit + fix | P23-04 |
| `.opencode/skills/hivemind-power-on/SKILL.md` | Full rewrite | P23-05 |
| `.opencode/skills/hm-l3-hivemind-engine-contracts/SKILL.md` | Sync with actual surfaces | P23-04 |
| `.opencode/skills/hm-l3-hivemind-state-reference/SKILL.md` | Sync with .hivemind/ structure | P23-04 |
| `.opencode/skills/hm-l3-integration-contracts/SKILL.md` | Validate agent-skill bindings | P23-04 |
| `.opencode/skills/hm-l3-tool-capability-matrix/SKILL.md` | Sync with tool catalog | P23-03 |
| `docs/draft/` or `.planning/` | Assessment doc for trajectory/pressure/work-contract | P23-06 |
| `.opencode/skills/hm-l3-tool-surface-documentation/` (NEW) | Tool differentiation skill | P23-03 |
| `.opencode/skills/hm-l3-injection-delivery-patterns/` (NEW) | Injection patterns skill | P23-07 |

### OUT OF SCOPE

| Surface | Why excluded | Phase Assignment |
|---------|--------------|------------------|
| `src/coordination/delegation/manager.ts` | Delegation dispatch logic — NOT notification delivery | P24 |
| `src/coordination/pressure.ts` | Pressure scoring logic — NOT notification | P26 |
| `src/coordination/trajectory.ts` | Trajectory tool logic | P25 |
| `src/routing/`, `src/config/`, `src/features/` | Not related to notification delivery or tool surface docs | P27+ |
| hf-* lineage skills | Meta-builder domain — separate lineage | hf-coordinator domain |
| gate-l3-* skills | Quality gate tools — internal | — |
| stack-l3-* skills | Stack reference skills — not affected | — |
| Native OpenCode `task` tool | Cannot modify — OpenCode native | — |
| GSD/OMO agent/skill migration | Dev tooling → product migration | MCM workstream |
| `execute-slash-command.ts` synthetic fix | Already identified but part of P21.1 domain | P21.1 boundary |

---

## 8. Execution Plan

### Wave 1: Fix Notification Architecture (P23-01, P23-02)
- Implement two-mechanism notification system (silent + urgent)
- Add `synthetic: true` to all notification parts in `notification-handler.ts`
- Update `session-api.ts` to support synthetic parts
- Implement stream reactivation for idle sessions
- VERIFY: `npx vitest run tests/lib/coordination/completion/notification-handler.test.ts`

### Wave 2: Surface Audit + Documentation Skills (P23-03, P23-07)
- Read all src/tools/ files → produce tool-surface-documentation skill
- Create injection-delivery-patterns skill
- Reference OpenCode ecosystem patterns (transformed)
- VERIFY: Cross-reference every tool mention against actual source

### Wave 3: Audit ALL hm-* Skills (P23-04)
- Read each hm-* orchestration/coordination skill
- Identify aspirational content
- Rewrite with real tool capabilities
- VERIFY: Every tool/script reference exists

### Wave 4: hivemind-power-on Rewrite (P23-05)
- Tool-based discovery patterns
- Real capability documentation
- VERIFY: Tool references match src/tools/

### Wave 5: Assessment + Gatekeeping (P23-06)
- Read trajectory, pressure, agent-work-create source code
- Produce structured assessment
- VERIFY: Assessment consumed by P25/P26

---

## 9. Inter-Phase Gatekeeping Checklist

Before claiming Phase 23 complete, verify:

- [ ] P23 code changes do NOT break Phase 22 notification routing (regression test)
- [ ] P23 synthetic:true filter does NOT break Phase 21 message-capture (existing unit tests)
- [ ] P23 notification fix does NOT break Phase 14 delegation completion flow
- [ ] P23-06 assessment boundary clear: assessment ONLY, no code changes to trajectory/pressure/work-contract (reserved for P25/P26)
- [ ] P23-07 patterns explicitly consumed by P28 hooks injection plane (documented handoff)
- [ ] All hm-* skill rewrites are consistent with each other (no contradictory guidance)
- [ ] No GSD/OMO conventions leaked into shipped primitives (prefix, naming, CQRS check)

---

## 10. Quality Self-Assessment

- [x] All sections present
- [x] Requirements are falsifiable (EARS "SHALL" syntax with testable acceptance criteria)
- [x] Traceability to cross-phase synthesis
- [x] Scope boundary explicitly defined (IN/OUT tables with phase assignments)
- [x] Inter-phase linkage analysis complete
- [x] Conflict/overlap boundaries defined with resolution plan ✓
- [x] OpenCode ecosystem synthesis reference included
- [x] Design decisions LOCKED ✓
- [x] Verification commands specified for each wave
