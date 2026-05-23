# Phase 23: Discussion Context — Locked Decisions

**Date:** 2026-05-22
**Status:** LOCKED (all gray areas resolved)

---

## Decisions

### D1: Failure Detection Thresholds
- **Decision:** Fixed 60s stall timeout + early assistant error detection
- **Rationale:** Simple, sufficient for Phase 23. Adaptive thresholds deferred to P26 pressure redesign.
- **Implication:** Implement `STALL_TIMEOUT_MS = 60000` in notification-handler.ts. No env var or config needed.

### D2: Urgent Notification UX
- **Decision:** `appendTuiPrompt()` + `synthetic: true` body context
- **Rationale:** Agent sees urgency immediately via TUI prompt. Synthetic body not injected into user input — avoids context corruption.
- **Rejected alternatives:**
  - Toast only: too easy to miss
  - AppendMessage direct: urgency not distinguishable

### D3: Stream Reactivation
- **Decision:** Send empty `synthetic: true` prompt to reactivate stopped session stream, THEN deliver notification
- **Rationale:** Without reactivation, notification silently fails on stopped streams. Empty synthetic prompt does not trigger AI loop.
- **Implication:** Implement `reactivateSessionStream(parentSessionId)` → send `{ parts: [], synthetic: true }` → then proceed with notification delivery.

### D4: Skill Rewrite Priority (Wave Order)
- **Decision:** Wave order: Coordination → Foundation → Audit
  - **Wave 3A:** coordinating-loop, gate-orchestrator, phase-execution, phase-loop, completion-looping
  - **Wave 3B:** hivemind-power-on
  - **Wave 3C:** engine-contracts, state-reference, integration-contracts, tool-capability-matrix, subagent-delegation, user-intent-loop, cross-cutting-change, debug
- **Critical constraint:** Skills must be THIN but DEEP:
  - Use references, assets, and templates instead of inline content
  - Conditional loading — skill A loads skill B ONLY when workflow requires it
  - **Jump link + progressive disclosure verification REQUIRED** — user reports these mechanisms do NOT work in loaded skills. MUST test at runtime and document actual behavior.
  - Multiple thin skills loaded simultaneously waste context — design to avoid this

### D5: GSD/OMO Study Scope
- **Decision:** Deep full study phase — dedicated sub-phase before skill rewrite
- **Rationale:** Skills must surpass GSD/OMO (not copycat). Study their patterns, extract philosophical principles, transform to Hivemind conventions.
- **Resources:**
  - `repo-for-learning-and-synthesis.md` (primary)
  - awesome-opencode directory
  - opencode-dynamic-context-pruning
  - opencode-pty / opencode-background-agents
  - OMO architecture reference (from `.opencode/skills/hm-l3-omo-reference/SKILL.md` if it exists)

---

## Next Steps

1. **GSD/OMO Deep Study** — dedicated subagent to study GSD workflow patterns + OMO architecture. Produce synthesis artifact.
2. **Research Phase** — gsd-phase-researcher for implementation details (OpenCode SDK synthetic patterns, TUI prompt API signatures, stream reactivation patterns)
3. **Plan Phase** — gsd-planner for executable task breakdown
4. **Execute Waves** — Wave 1 (notification fix) → Wave 2 (surface docs) → Wave 3A/B/C (skill rewrite)

---

## Open Items (Escalated to P25/P26)

| Item | Target Phase | Description |
|------|-------------|-------------|
| Adaptive failure thresholds | P26 | Replace fixed 60s with configurable/adaptive timing based on task complexity |
| Durable notification delivery | P27+ | Queue-based notification with persistence across restarts |
