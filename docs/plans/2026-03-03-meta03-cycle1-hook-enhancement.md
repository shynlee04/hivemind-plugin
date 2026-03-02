# META03 Cycle 1 — Governance Plugin Hook Enhancement Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enhance the hiveops-governance plugin's existing hooks to inject richer context during compaction and system prompt, and add message dedup capabilities.

**Architecture:** Enhance 2 existing hooks (compaction + system.transform) and wire 1 new hook (messages.transform for dedup). All hooks follow the existing builder pattern with defensive programming. Sequential implementation — each hook change depends on types.ts foundation.

**Tech Stack:** TypeScript, OpenCode Plugin SDK (@opencode-ai/plugin), node:fs, node:path

**Parent Plan:** META03-PLAN.md (Cycle 0 complete at 87fdc06)

---

## Research-Driven Scope Adjustment

The cross-team synthesis proposed `messages.transform` for auto-dedup. Research confirms:
- `messages.transform` CAN be used for dedup/filtering (messages are UserMessage | AssistantMessage)
- `messages.transform` CANNOT inject system context (no system role in Message type)
- The existing `system.transform` already handles context injection correctly
- The existing `compaction` hook has a 7-phase pipeline that can be extended

---

## Task 1: Types Extension — Add CompactionContext and MessageDedup Types

**Files:**
- Modify: `.opencode/plugin/hiveops-governance/types.ts`

**Step 1: Add new interfaces after CompactionRecovery**

```typescript
/** Extended compaction context with hiveops state */
export interface CompactionHiveOpsContext {
  sotRegistry: { path: string; domain: string; tags: string[] }[];
  activeGates: { gate: string; status: string; evidence?: string }[];
  delegationChain: DelegationChainEntry[];
  brainDecisions: { key: string; value: string; timestamp: number }[];
  turnCount: number;
  agent: string;
}

/** Message dedup tracking */
export interface MessageDedupState {
  lastToolCalls: Map<string, { hash: string; turnIndex: number }>;
  suppressedCount: number;
}
```

**Step 2: Verify tsc compiles**
Run: `npx tsc --noEmit`
Expected: No new errors

**Step 3: Commit**
```bash
git add .opencode/plugin/hiveops-governance/types.ts
git commit -m "feat(META03-C1): add CompactionHiveOpsContext and MessageDedupState types"
```

---

## Task 2: Enhance Compaction Hook — Inject HiveOps State

**Files:**
- Modify: `.opencode/plugin/hiveops-governance/hooks/compaction.ts`

**Step 1: Add state file reading**

After the existing `loadRecoveryFile()` call, add reading of:
- `.hivemind/state/sot-index.json` — SOT registry
- `.hivemind/state/todo.json` — Active todos (already in context-injection, add here too)
- `.hivemind/state/brain.json` — Agent decisions/memories (if exists, from `.hivemind/graph/mems.json`)

**Step 2: Enhance synthesizeContext() to include hiveops state**

Add sections for:
- SOT Registry summary (top 10 most recent registrations)
- Active gate status from enforcement state
- Delegation chain history
- Agent decisions from brain

**Step 3: Verify tsc + test fallback path**
Run: `npx tsc --noEmit`
Verify: Fallback context still works if new files don't exist

**Step 4: Commit**

---

## Task 3: Enhance System Transform — Add Brain and Delegation Context

**Files:**
- Modify: `.opencode/plugin/hiveops-governance/hooks/context-injection.ts`

**Step 1: Add more state file reads**

Currently reads 5 files. Add:
- `.hivemind/graph/mems.json` — Agent memories (decisions shelf)
- `.hivemind/state/sot-index.json` — SOT registry for cross-reference

**Step 2: Add delegation chain section to context block**

After the existing "Active TODO" section, add:
- Recent decisions (last 5 from mems brain)
- SOT artifact count and freshest entries

**Step 3: Verify tsc compiles**
Run: `npx tsc --noEmit`

**Step 4: Commit**

---

## Task 4: Add Messages Transform Hook — Dedup Engine

**Files:**
- Modify: `.opencode/plugin/hiveops-governance/index.ts` (wire new hook)
- Create: `.opencode/plugin/hiveops-governance/hooks/messages-transform.ts` (new hook)

**Step 1: Create the messages-transform hook builder**

```typescript
// hooks/messages-transform.ts
export function buildMessagesTransformHook(state: EnforcementStateRef) {
  return async (_input: any, output: any) => {
    if (!output.messages || !Array.isArray(output.messages)) return;
    
    // 1. Dedup: Remove consecutive identical tool call results
    // 2. Supersede: If write followed by read of same file, keep only write
    // 3. Track: Count suppressions in enforcement state
  }
}
```

**Step 2: Wire in index.ts**

Add to the return object:
```typescript
"experimental.chat.messages.transform": async (input: any, output: any) => {
  const hook = buildMessagesTransformHook(enforcementState)
  await hook(input, output)
}
```

**Step 3: Verify tsc compiles + no regression**
Run: `npx tsc --noEmit`

**Step 4: Commit**

---

## Task 5: Code Review Gate

**Skill:** code-review-excellence

Review all Cycle 1 changes against:
- [ ] Type safety (no `any` without defensive runtime checks)
- [ ] Error handling (try/catch with fallback in all hooks)
- [ ] Performance (no blocking I/O in system.transform hot path)
- [ ] State file reads are defensive (file may not exist)
- [ ] No mutation of shared state between hooks
- [ ] Follows existing builder pattern

---

## Task 6: Full Verification + Export

**Step 1:** `npx tsc --noEmit`
**Step 2:** `npm test 2>&1 | grep -E "pass|fail"` (check no new failures)
**Step 3:** Update META03-PLAN.md with Cycle 1 status
**Step 4:** Export checkpoint for Cycle 2 handoff
**Step 5:** Commit final state
