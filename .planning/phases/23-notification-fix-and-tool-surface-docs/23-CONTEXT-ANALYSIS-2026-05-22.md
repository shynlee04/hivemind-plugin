# Phase 23 Core Analysis: Notification Architecture Correction

**Date:** 2026-05-22
**Source:** User deep-dive analysis after Phase 22 completion, GATE 1 PASS

---

## 1. The Core Fix: System Notification Mechanism

### 1.1 Two Notification Mechanisms (Critical Distinction)

| Mechanism | Delivery Method | Response Expected | When |
|-----------|----------------|------------------|------|
| **Silent Injection** | `synthetic: true` + `noReply: true` → body context | NO — agent decides when to poll `delegation-status` | Task progress updates, non-critical status |
| **Urgent Notification** | Direct notification with forced delivery | YES — requires immediate agent response | Failure (via early detection thresholds), Success completion |

### 1.2 Current Flaw (Repeated Across Phases 13-22)

- ALL notifications currently use `session.prompt()` WITHOUT `synthetic: true`
- This appends them as **user-role messages**, corrupting session history
- Success notifications currently go to **user's message input** — WRONG
- No distinction between "silent context injection" and "urgent required-response notification"

### 1.3 delegation-status Correct Behavior

- `delegation-status` is an **opt-in polling** tool
- Agent decides WHEN to poll — NOT forced by the system
- Silent injection puts status info into context; agent can choose to check or not
- Urgent notification overrides with required response when thresholds are breached

### 1.4 Failure Detection Requirements

- MUST implement early detection thresholds (not just passive timeout)
- Failure → immediate urgent notification back to parent session
- Success → immediate completion notification (NOT via user message input)

---

## 2. Ecosystem Assessment (Prerequisite for All Skill Rewrites)

### 2.1 Functionality Completeness Categories

#### A. Schema & Configuration
- `hm-*` lineage: end-user project concerns
- `hf-*` lineage: user configures OpenCode primitives
- Directly hits:
  1. Setup/configuration of users + sidecar
  2. Shipped primitives (agents, skills, commands, workflows) — soft .md approach, integration later
  3. Governance, permissions, wiring of primitives

#### B. Orchestration Logics (Focus + Total Revamp Needed)
1. **Session-Tracker + toolings** (session-tracker, session-hierarchy, session-context, hivemind-session-view)
   - Foundation for orchestrator to track session continuity
   - 3-level depth delegation, cross-session, long-haul sessions
   - Current flaws: hierarchy, writer logics, status, continuity context
   - Reference: `/Users/apple/hivemind-plugin-private/session-ses_1baf.md`

2. **Delegate-Task + Delegation-Status**
   - Custom delegation with tons of flaws
   - Tightly coupled to session-tracker group

3. **Trajectory, Pressure, Agent-Work-Contract**
   - "Mess of flaws, nonsensical designs, not serving true benefits"
   - Need complete redesign

#### C. Routing & Auto-Looping (Under-developed)
Goal: Natural prompting → auto-dissect → graphical routing → cycling with context intelligence → collaborative guidance → spec/dependency/pattern/gatekeeping tracking

1. **Intent → Classification → Improvement → Dissection → Orchestrator Routes**
   - Auto-slash-command exists but very weak
   - No ability to switch front-facing agent
   - No management of autonomy with delegation integration

2. **PTY, Background Commands, Interactive Bash**
   - "Superficial and nonsensical designs, no clear purposes"

3. **Hooks & Injection Planes (Mis-designed)**
   - Silent vs required responses → direct injection to body context
   - Body context vs append directly through messages
   - TUI-queued vs direct appended
   - Injection of other primitives to govern multi-branch routing

4. **Ralph loops** — "totally nonsensical"

### 2.2 Spec Compliance
- All of the above must be validated against original specs

### 2.3 Patterns
- Must obey reusability and extensibility patterns

### 2.4 OpenCode Runtime Integration
- Harness works with diverse user project types
- Other frameworks/plugins may coexist (BMAD, GSD, Spec-driven frameworks)

### 2.5 Competitive Study
- **GSD**: routing + strategic approach (rigid spec-driven, phasing, research-first)
- **OMO**: delegation logics + context intelligence
- Expectation: **Superiority, not copycat**

---

## 3. Execution Strategy

### Step 1: Fix Notification Architecture (THIS PHASE - P23)
- Implement two-mechanism notification system
- Fix `synthetic: true` for silent injection
- Implement urgent notification with required response
- Add early failure detection thresholds
- Fix success notification delivery (NOT to user input)

### Step 2: After Notification Fixed → Rewrite ALL hm-* Skills
- Execute-slash-command: proper usage docs, options, routing for ANY command/workflow
- Delegate-task vs Task vs Execute-slash-command: when to use what, stacking patterns, use cases
- Session-tracker tool group: correct usage patterns
- All orchestration skills: based on working tools, not aspirational patterns

### Step 3: Create Super-Phase for Comprehensive Overhaul
- Session-tracker redesign
- Delegate-task overhaul
- Trajectory/Pressure/Work-Contract redesign or deprecation
- Routing + Auto-looping rebuild
- Hook injection plane proper design

---

## 4. Success Criteria for This Phase

- [ ] Silent injection: `synthetic: true` + `noReply: true` correctly implemented
- [ ] Urgent notification: immediate delivery with required response (NOT via user input)
- [ ] Failure detection: early thresholds trigger urgent notification
- [ ] Success notification: completion signal (NOT via user input)
- [ ] delegation-status: opt-in polling, not forced
- [ ] All existing tests pass
- [ ] All hm-* навыки (skills) updated with correct tool surface documentation
- [ ] hivemind-power-on rewritten with real tool capabilities
