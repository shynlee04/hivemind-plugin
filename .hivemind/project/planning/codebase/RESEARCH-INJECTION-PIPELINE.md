# Wave β Research: Context Injection Pipeline
> Date: 2026-02-28
> Source: 3 parallel hivexplorer brownfield reconnaissance agents
> Status: VALIDATED (fresh line numbers confirmed against current codebase)

---

## 1. Architecture Summary

### Plugin Entry Point (`src/index.ts`)
- Exports `HiveMindPlugin` (async factory → Plugin object)
- Registers **6 hooks** and **14 tools**
- Init sequence: `initSdkContext` → `createLogger` → `loadConfig` → `regenerateManifests` → wire file watcher → return Plugin

### Registered Hooks
| Hook | Type | File |
|------|------|------|
| Event handler | `event` | `src/hooks/event-handler.ts` |
| Session lifecycle | `experimental.chat.system.transform` | `src/hooks/session-lifecycle.ts` |
| Messages transform | `experimental.chat.messages.transform` | `src/hooks/messages-transform.ts` |
| Soft governance | `tool.execute.after` | `src/hooks/soft-governance.ts` |
| Tool gate | `tool.execute.before` | `src/hooks/tool-gate.ts` |
| Compaction | `experimental.session.compacting` | `src/hooks/compaction.ts` |

### Two Independent Injection Channels (NO cross-channel dedup)
1. **SYSTEM channel** ← `session-lifecycle.ts` (governance hook via `experimental.chat.system.transform`)
2. **USER channel** ← `messages-transform.ts` (message hook via `experimental.chat.messages.transform`, calls `cognitive-packer.ts`)

---

## 2. Injection Point Catalog (Fresh Line Numbers)

### File 1: `src/hooks/session-lifecycle.ts` (231 lines)
| ID | Lines | Function | What It Injects | Classification | Tokens |
|----|-------|----------|-----------------|----------------|--------|
| SL-1 | 43-64 | `injectGovernanceInstruction()` | HiveMaster governance instruction | VALID | ~1200 |
| SL-2 | 66-71 | `appendChecklistFailureReminder()` | Pre-stop checklist reminder | DUPLICATE (also in MT) | ~200 |
| SL-3 | 92 | `generateSetupGuidanceBlock()` | Setup wizard guidance | DUPLICATE (also in helpers) | ~600 |
| SL-4 | 129 | `buildGovernanceSignals()` | Governance signals | VALID | ~800 |
| SL-5 | 132 | `buildBootstrapContext()` | Bootstrap/evidence/team/first-turn blocks | VALID | ~1000 |
| SL-6 | 148-149 | `buildTaskBlock()` / `buildStatusBlock()` | Tasks tracking + session status | HELPFUL | ~150 |

### File 2: `src/hooks/session-lifecycle-helpers.ts` (479 lines)
| ID | Lines | Function | What It Injects | Classification | Tokens |
|----|-------|----------|-----------------|----------------|--------|
| SH-1 | 177-196 | `generateBootstrapBlock()` | HiveMind governance workflow instructions | VALID | ~400 |
| SH-2 | 198-246 | `generateSetupGuidanceBlock()` | Setup wizard guidance | VALID (primary) | ~600 |
| SH-3 | 248-255 | `generateEvidenceDisciplineBlock()` | Evidence discipline instructions | VALID | ~100 |
| SH-4 | 257-264 | `generateTeamBehaviorBlock()` | Team behavior instructions | VALID | ~100 |
| SH-5 | 266-291 | `generateFirstTurnConfirmationBlock()` | First-turn contract block | VALID | ~250 |
| SH-6 | 293-314 | `getV29OutputStyleDirective()` | Output style directive | VALID | ~80 |
| SH-7 | 359-452 | `compileFirstTurnContext()` | Anchors, mems, tasks, prior session summary | VALID | ~800 |
| SH-8 | 454-479 | `generateProjectBackboneBlock()` | Project backbone summary | VALID | ~300 |

### File 3: `src/lib/session-governance.ts` (317 lines)
| ID | Lines | Function | What It Injects | Classification | Tokens |
|----|-------|----------|-----------------|----------------|--------|
| SG-1 | 59-64 | `buildGovernanceSignals()` | Onboarding backbone | VALID | ~300 |
| SG-2 | 67-83 | framework warning lines | Framework conflict/warning | VALID | ~200 |
| SG-3 | 86-99 | detection signals + ignored tier | Detection signals | VALID | ~400 |
| SG-4 | 102-110 | chain breaks detection | Chain break warnings | VALID | ~150 |
| SG-5 | 113-118 | long session detection | Long session warnings | VALID | ~100 |
| SG-6 | 121-131 | session boundary + tool activation | Tool hints | VALID | ~250 |

### File 4: `src/hooks/messages-transform.ts` (679 lines)
| ID | Lines | Function | What It Injects | Classification | Tokens |
|----|-------|----------|-----------------|----------------|--------|
| MT-1 | 76-89 | `buildChecklist()` | Pre-stop checklist reminder | DUPLICATE (also SL-2) | ~200 |
| MT-2 | 91-113 | `buildAutoRealignReminder()` | Auto-realign workflow reminder | VALID | ~300 |
| MT-3 | 191-197 | `buildAnchorContext()` | System anchor header | DUPLICATE (also MT-7) | ~80 |
| MT-4 | 345-351 | first-turn context | Anchors + mems + tasks | VALID | ~2500 |
| MT-5 | 356 | `generateFirstTurnConfirmationBlock()` | First-turn contract | DUPLICATE (also SH-5) | ~250 |
| MT-6 | 536-538 | `packCognitiveState()` | Cognitive state XML | VALID | ~4000 |
| MT-7 | 542-543 | `buildAnchorContext()` | System anchor header | VALID (canonical) | ~80 |
| MT-8 | 669-671 | `buildChecklist()` | Pre-stop checklist (APPEND) | VALID (canonical) | ~200 |

### File 5: `src/lib/cognitive-packer.ts` (622 lines)
| ID | Lines | Function | What It Injects | Classification | Tokens |
|----|-------|----------|-----------------|----------------|--------|
| CP-1 | 91-107 | `buildEmptyStateXml()` | Empty hivemind_state XML | VALID | ~300 |
| CP-2 | 242-248 | `buildMemXmlLines()` | Mem XML lines | VALID | ~50/mem |
| CP-3 | 258-562 | `packCognitiveState()` | Full cognitive state XML | VALID | ~4000 |
| CP-4 | 525-548 | anti-patterns section | False paths + invalid tasks | VALID | ~500 |
| CP-5 | 550-560 | context summary section | Anchors/mems/drift counts | DUPLICATE (also SL status) | ~150 |

---

## 3. Cross-File Duplication Map

| Content | Source A | Source B | Resolution |
|---------|---------|---------|------------|
| Pre-stop checklist | SL-2 (session-lifecycle.ts:66-71) | MT-8 (messages-transform.ts:669-671) | Keep MT-8 (canonical APPEND), remove SL-2 |
| First-turn confirmation | SH-5 (helpers:266-291) via SL-5 | MT-5 (messages-transform.ts:356) | Investigate call conditions before removing |
| Setup guidance | SL-3 (session-lifecycle.ts:92) | SH-2 (helpers:198-246) | Remove SL-3, keep SH-2 |
| Anchor context | MT-3 (messages-transform.ts:191-197) | MT-7 (messages-transform.ts:542-543) | Remove MT-3, keep MT-7 |
| Context summary | CP-5 (cognitive-packer.ts:550-560) | SL-6 status block | Keep both (different channels, different purposes) |

---

## 4. Token Budget

| Channel | Component | Tokens/Turn | Conditional? |
|---------|-----------|-------------|--------------|
| **SYSTEM** | Governance instruction (SL-1) | ~1200 | NO |
| | Setup guidance (SL-3) | ~600 | YES (no config) |
| | Governance signals (SG-1-6) | ~1400 | NO |
| | Bootstrap blocks (SH-1,3,4,5,6) | ~930 | YES (first 2 turns) |
| | Task/status blocks (SL-6) | ~150 | NO |
| | **SUBTOTAL** | **~4280** | |
| **USER** | First-turn context (MT-4) | ~2500 | YES (first turn) |
| | Cognitive state XML (MT-6) | ~4000 | NO (budget-capped) |
| | Anchor header (MT-7) | ~80 | NO |
| | Auto-realign (MT-2) | ~300 | YES |
| | Pre-stop checklist (MT-8) | ~200 | NO |
| | **SUBTOTAL** | **~7080** | |
| **TOTAL** | | **~11,360** | |

**Target**: < 1200 tokens/turn steady state (per master plan acceptance criteria)

---

## 5. Test Coverage for β Targets

### Direct Coverage
| Target File | Test File | Test Count | Coverage Type |
|-------------|-----------|------------|---------------|
| session-lifecycle-helpers.ts | tests/session-lifecycle-helpers.test.ts | 22 | Logic |
| session-lifecycle-helpers.ts | tests/v29-context-governance.test.ts | 2 | Logic |
| messages-transform.ts | tests/messages-transform.test.ts | 12 | Injection |
| messages-transform.ts | tests/hooks/messages-transform-checklist.test.ts | 3 | Injection |
| session-lifecycle.ts | tests/hooks/session-lifecycle-constitution.test.ts | 5 | Injection |
| session-lifecycle.ts | tests/session-lifecycle-boundary.test.ts | 1 | Injection |
| session-lifecycle.ts | tests/integration.test.ts | ~15+ | Injection |
| cognitive-packer.ts | tests/lib/cognitive-packer-digest.test.ts | 5 | Logic |

### Critical Coverage Gaps
| Function | Source | Risk If Modified |
|----------|--------|------------------|
| `buildBootstrapContext` | session-lifecycle.ts:162 | HIGH — no unit test |
| `assembleSections` | session-lifecycle.ts:219 | HIGH — no unit test |
| `buildTaskBlock` | session-lifecycle.ts:203 | MEDIUM — no unit test |
| `detectOffTrackIntent` | messages-transform.ts:169 | HIGH — no unit test |

### Pre-Existing Failures
- 31 failures in tests/sync-assets.test.ts — NOT related to β targets

### Regression Test Commands Per Knot
```bash
# After β.1 (remove duplications from session-lifecycle)
npx tsx --test tests/hooks/session-lifecycle-constitution.test.ts
npx tsx --test tests/integration.test.ts

# After β.2 (remove pollution from session-lifecycle)
npx tsx --test tests/governance-stress.test.ts

# After β.3 (conditionalize auto-realign)
npx tsx --test tests/messages-transform.test.ts
npx tsx --test tests/hooks/messages-transform-checklist.test.ts

# After all β knots
npx tsc --noEmit
```

---

## 6. Dead/Unwired Libs (Wave α — ready for β.4 wiring)

| File | Lines | Status | Safe Insertion Point |
|------|-------|--------|---------------------|
| `src/lib/event-consumers.ts` | 69 | Bug-free, 0 callers | `src/index.ts` after event bus setup |
| `src/lib/planning-materializer.ts` | 262 | Bug-free, 0 callers | `src/lib/session-engine.ts` closeSession() |
| `src/lib/session-intent-classifier.ts` | 144 | Bug-free, 0 callers | `src/hooks/event-handler.ts` session.created |

---

*Research complete. Ready for plan validation.*
