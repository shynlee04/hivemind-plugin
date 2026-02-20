# MASTER FIX PLAN: HiveMind Foundation Repair

**Date:** 2026-02-18
**Status:** CRITICAL - Foundation collapsed
**Priority:** Production-ready fix required

---

## Problem Statement

The cognitive packer returns empty mems:
```xml
<mems count="0" relevant="0" />
```

**Root Cause:** Packer reads `graph/mems.json` which doesn't exist. Memories are in `memory/mems.json`.

**Gemini's 6 Critical Findings:**
1. 🛑 Runtime Schism (Node.js vs Bun)
2. ⚠️ 2000 char budget = starvation
3. ⚠️ No semantic fallback
4. 🛑 Implicit migration = roulette
5. ⚠️ Single-process bottleneck
6. ✅ Good: Dead code elimination, Zod schemas, Dumb Tool pattern

---

## Fix Phases (Incremental, Testable)

### PHASE 0: Immediate Fix (CRITICAL)

**US-001: Packer dual-read fallback**
- File: `src/lib/cognitive-packer.ts` (line 220)
- Change: Try `graph/mems.json`, fallback to `memory/mems.json`
- Test: `hivemind_inspect deep` shows mems count > 0
- Gate: `npm test` passes

### PHASE 1: Legacy Format Handling

**US-002: Convert legacy mem format**
- Handle: `session_id` → `origin_task_id`
- Handle: `created_at: number` → ISO string
- Handle: Missing `type`, `staleness_stamp`
- Test: All 124KB of existing mems readable

### PHASE 2: Anchors Injection

**US-003: Inject anchors in packer output**
- Add `<anchors>` section to XML
- Read from `state/anchors.json`
- Test: 22 anchors appear in context

### PHASE 3: Budget Fix

**US-004: Dynamic context budget**
- Replace 2000 chars with 12% of context window (~15360 chars)
- Already implemented in packer (line 186-192)
- Verify: Budget scales with model

### PHASE 4: Migration Safety

**US-005: Explicit migration command**
- Create `hivemind migrate` CLI command
- Remove implicit migration from hooks
- Test: Fresh install works without auto-migration

### PHASE 5: Fresh Install Test

**US-006: End-to-end validation**
- Remove `.hivemind/` directory
- Start fresh OpenCode session
- Verify: Context injection appears
- Verify: Hooks work
- Verify: Tools work

---

## Quality Gates (Per US)

```bash
npm test           # 126/126 pass
npx tsc --noEmit   # No errors
```

## Verification Command

```bash
# After each US, run:
node -e "
const { packCognitiveState } = require('./src/lib/cognitive-packer.ts');
const xml = packCognitiveState(process.cwd());
const match = xml.match(/mems count=\"(\d+)\"/);
console.log('Mems count:', match ? match[1] : 'NOT FOUND');
"
```

---

## Commit Strategy

```
US-001: Add dual-read fallback for mems location
US-002: Handle legacy mem format conversion
US-003: Inject anchors in packer output
US-004: Verify dynamic context budget
US-005: Add explicit hivemind migrate command
US-006: Fresh install validation
```

---

## Success Criteria

- [ ] `hivemind_inspect deep` shows mems count > 0
- [ ] Context injection contains actual memories
- [ ] 22 anchors injected
- [ ] Fresh install works
- [ ] All tests pass
- [ ] TypeScript compiles
