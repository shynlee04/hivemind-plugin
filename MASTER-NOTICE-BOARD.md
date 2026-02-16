# MASTER-NOTICE-BOARD

> HiveMind v3.0 - Relational Cognitive Engine
> Tracking: Date Time | Notes | References | File Changes | Reason | Requirements

---

## Session: 2026-02-16

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

**Status**: RESEARCH COMPLETE - Awaiting architecture proposal

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

*Last Updated: 2026-02-16*
