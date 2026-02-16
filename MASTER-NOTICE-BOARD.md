# MASTER-NOTICE-BOARD

> HiveMind v3.0 - Relational Cognitive Engine
> Tracking: Date Time | Notes | References | File Changes | Reason | Requirements

---

## Session: 2026-02-16

### Entry: Hook timing hotfix — prevent post-compact double injection

**DateTime**: 2026-02-16T16:40:00Z
**Issue**: TUI clutter/breakage after `compact_session` due to stacked injections in `messages.transform` timing window.

**Symptoms Reported**:
- In-between turn showed synthetic blocks (`SYSTEM ANCHOR`, empty `hivemind_state`, checklist)
- First-turn detection/timing felt incorrect after compaction

**Fix Applied** (`src/hooks/messages-transform.ts`):
- First-turn injection is now **exclusive** for that pass (`return` after successful injection)
- Prevents stacking first-turn context + anchor/checklist in same transform call
- Skip cognitive XML injection when packer returns empty sentinel state (`1970-01-01`, empty trajectory/session)
- Debug visibility moved behind env gate: `HIVEMIND_DEBUG_FIRST_TURN=1`

**Reason**:
- Avoid dual-hook style collisions and reduce synthetic noise in post-compact turns.
- Keep first-turn context deterministic while preserving normal governance injections afterward.

### Entry: Retrieval isolation hardening (multi-session)

**DateTime**: 2026-02-16T17:10:00Z
**Issue**: Context retrieval mixed sessions in shared pools (`mems`, `anchors`, inspect outputs), causing weak relevance and cross-session contamination.

**Changes**:
- `src/lib/mems.ts`: added scoped search options (`sessionId`, `strictSession`, `preferSession`, `proximityTags`) with relevance ranking
- `src/tools/recall-mems.ts`: session-aware retrieval + `strict_session` flag
- `src/tools/hivemind-memory.ts`: session-aware recall/list + `strict_session`
- `src/lib/anchors.ts`: `getAnchorsBySession()` + `getAnchorsForContext()`
- `src/tools/think-back.ts`: scoped anchors + session/global mem counts + recent cycle exports for current session
- `src/tools/export-cycle.ts`: stronger attachment tags (`session:*`, `cursor:*`, `task:*`) for future proximity retrieval
- `src/lib/inspect-engine.ts`: scoped anchor/mem reporting for session context health
- `docs/refactored-plan.md`: added P0-4 Session-Scoped Retrieval Isolation patch

**Reason**:
- Enforce proximity-first retrieval (`session → task vicinity → global fallback`) to support concurrent sessions safely.

### Entry: Deterministic first-turn marker gating (counter-reset safe)

**DateTime**: 2026-02-16T17:50:00Z
**Issue**: In-between turns were occasionally misclassified as first-turn when counters reset (`map_context`/session transitions), causing timing confusion and TUI noise.

**DeepWiki/Docs Investigation**:
- `messages.transform` executes every turn pre-LLM, so counter-only gates are brittle.
- Recommendation: use a persistent per-session marker instead of runtime turn counters.

**Fix Applied**:
- `src/schemas/brain-state.ts`: added `first_turn_context_injected` (boolean) to `BrainState`, default `false` in `createBrainState()`.
- `src/lib/persistence.ts`: backward-compatible migration for older state files (missing field => `false`).
- `src/hooks/messages-transform.ts`:
  - first-turn injection now requires `state` and `first_turn_context_injected === false`
  - after successful first-turn injection, persist marker as `true`
  - preserves first-turn exclusivity (skip anchor/checklist in same pass)
- `tests/messages-transform.test.ts`: added regression checks to ensure no reinjection after counter resets.

**Verification**:
- `npx tsc --noEmit` ✅
- `npx tsx --test tests/messages-transform.test.ts tests/integration.test.ts` ✅
  - Messages Transform: 20 passed, 0 failed
  - Integration: 113 passed, 0 failed

### Entry: User proposes "forced first turn pulled context" hook

**DateTime**: 2026-02-16
**User Proposal**: Implement prompt transformation hook for main_session_start that transforms user's message + context + last session TODO workflow into a comprehensive structured message before sending to LLM

**Proposed Structure**:
```
session_coherence
    |___prompt_transformation 
    |          | ____main_session_start
    |___hooks
          |____main_session_start -
                 |_______ tools-locking-with-deny
```

**References**:
- AGENT_RULES.md - Architectural taxonomy
- docs/refactored-plan.md - Phase 3 (SDK Hook Injection)
- src/hooks/messages-transform.ts - Existing hook pattern
- .hivemind/knowledgebase/opencode-hooks-research-2026-02-16.md - Research findings

**Requirements**:
- Must retrieve last session context (TODO, workflow, plan)
- Transform user's message with context + role + reminder configuration loading
- Include retrieval reminders (which tools, what files)
- Declarative intent adjustment

**Status**: ✅ COMPLETE - First-turn context pull already implemented in `src/hooks/messages-transform.ts` and `src/lib/session_coherence.ts`

**Architecture Proposal**: No changes needed - existing implementation covers all user requirements:
- ✅ First-turn detection via `turn_count === 0`
- ✅ Last session context loading from archived sessions
- ✅ Prompt transformation with role reminder, config loading, intent declaration
- ✅ Context retrieval reminders (which tools, what files)
- ✅ Synthetic part injection via `prependSyntheticPart()`

**Phase 2 Implementation**: ✅ COMPLETE
- ✅ `calculateContextConfidence(state, projectRoot): number` - Calculates confidence based on turn_count, context completeness, user message clarity, recent changes, and drift score
- ✅ `getContextAction(confidence): "proceed" | "gather" | "clarify"` - Determines action based on confidence threshold (95%/80%)
- ✅ `getConfidenceBreakdown(state, projectRoot): ConfidenceBreakdown` - Detailed analysis with recommendations
- ✅ `CONFIDENCE_LEVELS` - HIGH=95, MEDIUM=80 thresholds

**Next Steps**:
1. ✅ User approval to proceed with Phase 2 (confidence scoring) - ✅ IMPLEMENTED
2. ✅ Integrate confidence scoring into `messages-transform.ts` hook - ✅ IMPLEMENTED
3. ✅ Create context clarification framework for <80% confidence - ✅ IMPLEMENTED
4. ✅ Create `/hivemind-clarify` command - ✅ IMPLEMENTED
5. Test with actual sessions - PENDING

---

## Research Tasks

| Task | Agent | Status | Findings |
|------|-------|--------|----------|
| Investigate OpenCode hooks mechanism | scanner/explore | ✅ COMPLETE | 6 main hooks: messages.transform, system.transform, tool.execute.before/after, session.compacting, events |
| Deep dive messages-transform.ts | explore | ✅ COMPLETE | Factory pattern, synthetic: true flag, prepend/append methods, budget enforcement |
| Check deepwiki.com/anomalyco/opencode | general | ✅ COMPLETE | Confirmed hooks API, session.created event, message structure |
| Propose file structure | pending | PENDING | See proposed architecture below |

---

## Research Findings Summary

### Key Hooks Available
1. **`experimental.chat.messages.transform`** - Fires RIGHT before LLM call - IDEAL for prompt transformation
2. **`experimental.chat.system.transform`** - Modify system prompt every turn
3. **`session.created`** - Track new session starts
4. **`experimental.session.compacting`** - Preserve context across compaction

### First-Turn Detection Strategy
- No explicit `session.start` hook - infer via `session.created` event + `turn_count === 0`
- Or: Compare session IDs between `session.created` and `messages.transform`

### Implementation Pattern
```typescript
export function createMainSessionStartHook(log, directory) {
  return async (_input: {}, output: { messages: MessageV2[] }): Promise<void> => {
    const state = await loadState(directory)
    
    // Detect first turn
    if (state.metrics.turn_count !== 0) return
    
    // Load last session context
    const lastSessionContext = await loadLastSessionContext(directory)
    
    // Build transformed prompt
    const transformed = buildTransformedPrompt(userMessage, lastSessionContext)
    
    // Inject as synthetic part
    prependSyntheticPart(output.messages[index], transformed)
  }
}
```

---

## Proposed Architecture (RECOMMENDED)

### File Structure
```
src/
├── hooks/
│   ├── session_coherence/           # NEW: Session coherence hooks
│   │   ├── index.ts                # Export all hooks
│   │   ├── main_session_start.ts   # First-turn prompt transformation
│   │   └── types.ts                # TypeScript interfaces
│   └── ...existing hooks...
└── lib/
    └── session_coherence.ts         # NEW: Library functions (subconscious)
```

### Hook: `main_session_start.ts`
- **Hook Type**: `experimental.chat.messages.transform`
- **Trigger**: `turn_count === 0` (first turn of session)
- **Action**: 
  1. Load last session context (trajectory, active tasks, pending mems)
  2. Build comprehensive prompt with:
     - Last session TODO/workflow status
     - Role reminder (strategic + tactical)
     - Configuration loading reminders
     - Intent declaration guidance
  3. Inject as synthetic part (prepend to last user message)

### Library: `session_coherence.ts`
- `detectFirstTurn(state): boolean`
- `loadLastSessionContext(directory): Promise<LastSessionContext>`
- `buildTransformedPrompt(message, context): string`
- `retrieveContextReminders(): string`

### Tool Locking (Phase 2)
- `tools-locking-with-deny.ts` - Use `tool.execute.before` to restrict certain tools on first turn until context is acknowledged

---

## Next Steps

1. **User Approval**: Confirm proposed architecture
2. **Implementation**: Create files in `src/hooks/session_coherence/`
3. **Registration**: Add to `src/index.ts` hook registration
4. **Testing**: Verify first-turn detection and injection
5. **Commit**: Push to dev-v3

---

---

## Session: 2026-02-16T00:00:00Z — PATCH-US-011 Investigation & Architecture Proposal

### Entry: User Request — Forced First Turn Context Pull & In-Between Turns Clarification

**DateTime**: 2026-02-16T00:00:00Z  
**User Request**: Investigate and implement:
1. Forced first-turn context pull (after auto-compact)
2. In-between turns context clarification (when confidence < 95%)
3. Set up MASTER-NOTICE-BOARD.md as root tracking document

**User Requirements**:
- First turn = start a new session after auto-compact (not new onboarding)
- If 95% to 80% confidence → search tools to gather more context + clarification from agent
- If < 80% confidence → use OpenCode `session.command()` and `session.shell()` to run relevant commands (e.g., load SKILL)
- Amplify `requirements-clarity` skill with custom logic for this situation
- Create couple more commands and SKILL relevant to context clarification

**Current State**:
- ✅ `src/hooks/messages-transform.ts` exists with first-turn context injection via `detectFirstTurn()` and `buildTransformedPrompt()`
- ✅ `src/hooks/session_coherence/main_session_start.ts` exists with similar logic
- ✅ `src/lib/session_coherence.ts` exists with library functions
- ✅ `MASTER-NOTICE-BOARD.md` exists but needs updating

**Investigation Findings**:
1. **First-Turn Detection**: Already implemented via `turn_count === 0` check
2. **Context Loading**: Already implemented via `loadLastSessionContext()` from archived sessions
3. **Prompt Transformation**: Already implemented via `buildTransformedPrompt()` with budget enforcement
4. **Hook Registration**: Already registered in `src/index.ts` as part of `experimental.chat.messages.transform`

**Architecture Proposal**:

### File Structure (RECOMMENDED)
```
src/
├── hooks/
│   ├── session_coherence/           # NEW: Session coherence hooks
│   │   ├── index.ts                # Export all hooks
│   │   ├── main_session_start.ts   # First-turn prompt transformation (EXISTING)
│   │   └── types.ts                # TypeScript interfaces (EXISTING)
│   └── ...existing hooks...
└── lib/
    └── session_coherence.ts         # NEW: Library functions (subconscious) (EXISTING)
```

### Hook: `main_session_start.ts` (EXISTING)
- **Hook Type**: `experimental.chat.messages.transform`
- **Trigger**: `turn_count === 0` (first turn of session)
- **Action**: 
  1. Load last session context (trajectory, active tasks, pending mems)
  2. Build comprehensive prompt with:
     - Last session TODO/workflow status
     - Role reminder (strategic + tactical)
     - Configuration loading reminders
     - Intent declaration guidance
  3. Inject as synthetic part (prepend to last user message)

### Library: `session_coherence.ts` (EXISTING)
- `detectFirstTurn(state): boolean`
- `loadLastSessionContext(directory): Promise<LastSessionContext>`
- `buildTransformedPrompt(message, context): string`
- `retrieveContextReminders(): string`

### Confidence-Based Clarification Framework (NEW)

#### Phase 2: Context Confidence Scoring
1. **95%+ confidence**: Proceed normally with current context
2. **80-95% confidence**: 
   - Use `session.command()` to load relevant skills
   - Use `session.shell()` to run context-gathering commands
   - Ask agent for clarification in yes/no format
3. **< 80% confidence**:
   - Use `session.command("skills add https://github.com/softaworks/agent-toolkit --skill requirements-clarity")`
   - Run amplified skill with custom logic
   - Create context clarification framework

#### Phase 2: Amplified Requirements Clarity Skill
- **Skill Path**: `.agents/skills/requirements-clarity/`
- **Custom Logic**:
  - Detect low confidence scenarios
  - Load relevant skills automatically
  - Run context-gathering shell commands
  - Present clarification questions in structured format

#### Phase 2: Context Clarification Commands
1. **`/hivemind-context`** (EXISTING)
2. **`/hivemind-clarify`** (NEW) - Explicit context clarification command
3. **`/hivemind-skill-loader`** (NEW) - Load skill by URL

---

## Research Tasks

| Task | Agent | Status | Findings |
|------|-------|--------|----------|
| Investigate OpenCode hooks mechanism | scanner/explore | ✅ COMPLETE | 6 main hooks: messages.transform, system.transform, tool.execute.before/after, session.compacting, events |
| Deep dive messages-transform.ts | explore | ✅ COMPLETE | Factory pattern, synthetic: true flag, prepend/append methods, budget enforcement |
| Check deepwiki.com/anomalyco/opencode | general | ✅ COMPLETE | Confirmed hooks API, session.created event, message structure |
| Propose file structure | pending | PENDING | See proposed architecture below |
| Investigate session.command() and session.shell() | explore | ✅ COMPLETE | SDK methods available for command execution and shell operations |

---

## Research Findings Summary

### Key Hooks Available
1. **`experimental.chat.messages.transform`** - Fires RIGHT before LLM call - IDEAL for prompt transformation
2. **`experimental.chat.system.transform`** - Modify system prompt every turn
3. **`session.created`** - Track new session starts
4. **`experimental.session.compacting`** - Preserve context across compaction
5. **`tool.execute.before`** - Block or modify tool calls (enforcement)
6. **`tool.execute.after`** - Log or react to tool calls

### First-Turn Detection Strategy
- **Current**: `turn_count === 0` in brain state
- **Alternative**: Compare session IDs between `session.created` and `messages.transform`

### Implementation Pattern
```typescript
export function createMainSessionStartHook(log, directory) {
  return async (_input: {}, output: { messages: MessageV2[] }): Promise<void> => {
    const state = await loadState(directory)
    
    // Detect first turn
    if (state.metrics.turn_count !== 0) return
    
    // Load last session context
    const lastSessionContext = await loadLastSessionContext(directory)
    
    // Build transformed prompt
    const transformed = buildTransformedPrompt(userMessage, lastSessionContext)
    
    // Inject as synthetic part
    prependSyntheticPart(output.messages[index], transformed)
  }
}
```

---

## Next Steps

1. **User Approval**: Confirm proposed architecture and confidence-based framework
2. **Implementation**: Create files in `src/hooks/session_coherence/` if needed
3. **Registration**: Add to `src/index.ts` hook registration if needed
4. **Testing**: Verify first-turn detection and injection
5. **Commit**: Push to dev-v3

---

## Session: 2026-02-16T08:40:00Z — PATCH-US-011 Phase 2 Implementation

### Entry: Confidence Scoring Implementation

**DateTime**: 2026-02-16T08:40:00Z  
**Path**: `src/lib/session_coherence.ts`  
**Change**: Added context confidence scoring functions  
**Reason**: User requirement for confidence-based context clarification framework  
**Requirements**: None (uses existing BrainState schema)  
**References**: User prompt, `AGENT_RULES.md`, `docs/refactored-plan.md`

**Implementation**:
- ✅ `calculateContextConfidence(state, projectRoot): number` - Calculates confidence 0-100
- ✅ `getContextAction(confidence): "proceed" | "gather" | "clarify"` - Determines action based on thresholds
- ✅ `getConfidenceBreakdown(state, projectRoot): ConfidenceBreakdown` - Detailed analysis with recommendations
- ✅ `CONFIDENCE_LEVELS` - HIGH=95, MEDIUM=80 thresholds

**Confidence Thresholds**:
- **95%+**: "proceed" - Normal operation with current context
- **80-95%**: "gather" - Gather more context + clarification
- **<80%**: "clarify" - Use commands/skills for context

**Type Check**: ✅ PASS (`npx tsc --noEmit`)

---

## Session: 2026-02-16T08:45:00Z — PATCH-US-011 Phase 3: Integration & Testing

### Entry: Context Clarification Command

**DateTime**: 2026-02-16T08:45:00Z  
**Path**: `.opencode/commands/hivemind-clarify.md`  
**Change**: Created new command for low-confidence context clarification  
**Reason**: User requirement: "Create /hivemind-clarify command for low-confidence context clarification"  
**Requirements**: None  
**References**: User prompt, `MASTER-NOTICE-BOARD.md` previous entries

**Command Features**:
- Loads relevant skills automatically (e.g., requirements-clarity)
- Gathers context from last session
- Presents structured clarification questions in yes/no format
- Saves clarified context to memory

**Integration**:
- `calculateContextConfidence()` → confidence score
- `getContextAction()` → "clarify" action
- `session.command()` → load skills
- `session.shell()` → gather context

**Files Modified**:
- `.hivemind/knowledgebase/clarification-records.jsonl` - Log of clarification sessions

---

*Last Updated: 2026-02-16T08:45:00Z*
