---
session_id: ses_2e56f09baffe5wiTdd9QocNCUh
timestamp: 2026-03-23T12:01:45.134Z
purpose: planning
session_state: ready
trajectory: none
workflow: none
agent: unset
---

## Assistant Output

Now I have all the information needed. Let me compile the findings into a structured delegation return.

---

## Delegation Return: Injection Pathway Audit Analysis

### 1. Summary of Injection Behavior Status

**Overall Classification:**

| Category | Count | Status |
|----------|-------|--------|
| Total Hook Registrations | 18 | Catalogued |
| Alive Hooks | 17 | Operational |
| Dead Hooks | 1 | Intentionally disabled |
| Pre-Send Injection Hooks | 1 | Active (Primary Pathway) |
| Active Injection Components | 4 | All operational |

**Primary Injection Mechanism:**
- **Hook:** `experimental.chat.messages.transform`
- **Location:** `dist/plugin/opencode-plugin.js:171`
- **Guard Condition:** Only activates when `variant === 'new'` or `variant === 'continue'`
- **Exclusions:** Tool results and thinking turns are excluded from injection

---

### 2. Working Pathways

**Pre-Send Injection Components (All ACTIVE):**

| Component | Function | Source File |
|-----------|----------|-------------|
| **Turn Hierarchy Block** | Injects trajectory/workflow/task context | `src/plugin/context-renderer.ts` |
| **HiveMind Context Block** | Injects session, lineage, purpose, risk assessment | `src/plugin/context-renderer.ts` |
| **Skill Focus Block** | Injects available skills + session role directive | `src/plugin/skill-focus-renderer.ts` |
| **Route Hint Block** | Injects command routing reminder (after user parts) | `src/plugin/route-hint.ts` |

**Operational Hook Categories (17 Alive):**

| Category | Hooks | Pre-Send? |
|----------|-------|-----------|
| Delegation routing | `delegation.start`, `delegation.complete`, `delegation.error` | No |
| Session compaction | `session.compaction`, `session.compaction.evaluate` | No (Post-compaction) |
| Tool execution | `tool.execute`, `tool.execute.error`, `tool.execute.result`| No (During execution) |
| Command execution | `command.execute`, `command.execute.after` | No |
| Agent loop lifecycle | `agent_loop.enter`, `agent_loop.exit` | No |
| Start-work routing | `start_work.router`, `start_work.skill_resolution`, `start_work.capability_discovery` | No |
| Session query | `experimental.session.query` | No |
| **Messages transform** | `experimental.chat.messages.transform` | **YES - Primary** |

---

### 3. Dead/Incomplete Pathways

**Single Dead Pathway:**

| Pathway | File | Status | Reason |
|---------|------|--------|--------|
| `runtime_entry.nl_first` | `src/features/runtime-entry/nl-first-dispatch.ts` | **DEAD** | Unconditionally returns `shouldDispatch: false` |

**Evidence:**
```javascript
const DISPATCH_UNAVAILABLE_REASON = 'NL-first runtime dispatch execution is not available in the messages transform flow; preserving the route hint.';
```

**Analysis:** This pathway was intentionally disabled. The code stub remains for historical alignment but poses no injection risk. It was originally intended for NL-first runtime dispatch but was disabled in favor of preserving route hints for user guidance.

---

### 4. Gaps Relevant to Export System

**Identified Gaps:**

| Gap | Description | Export System Relevance |
|-----|-------------|------------------------|
| **Route Hint Timing Anomaly** | Route Hint Block is appended AFTER user parts, while other 3 blocks are prepended | Export system must handle both prepended and appended injection positions |
| **Variant Guard Dependency** | Injection only triggers on `variant: 'new'` or `'continue'` | Export system must preserve variant metadata for correct injection behavior |
| **Skill Bundle Resolution Chain** | Complex chain: `messages-transform-adapter` -> `resolveSkillBundle` -> `resolveSessionRole` -> `skill-exposure-map` | Export system must trace full resolution chain if exposing skill injection |
|**Injection Payload Storage** | Uses `setInjectionPayload` fordiagnostic logging | Export system could leverage payload storage for export metadata |
| **Dead Code Accumulation** | `maybeExecuteNlFirstRuntimeDispatch` is dead code kept as stub | Export system may inherit dead code if not cleaned up |

**SDK Dependencies for Injection:**

| Dependency | Purpose |
|------------|---------|
| `@opencode-ai/plugin` | Plugin framework for hook registration |
| `turnSnapshot` | Turn state snapshot for trajectory context |
| `resolveSkillBundle` | Resolves available skills for session role |
| `resolveSessionRole` | Resolves session role directive |
| `createSyntheticPart` | Creates synthetic message parts for injection |

---

### 5. Pre-Existing Recommendations

From Audit Report Section 9.3:

| # | Recommendation | Priority |
|---|----------------|----------|
| 1 | **Monitor `experimental.chat.messages.transform` Guard** — The variant check is the gatekeeper for all injection; changes to variant enumeration could expand/contract injection scope | High |
| 2 | **Audit Skill Bundle Resolution** — `resolveSkillBundle` and `resolveSessionRole` functions determine what skills are injected; review if skill exposure changes planned | Medium
