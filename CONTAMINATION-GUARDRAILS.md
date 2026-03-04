# CONTAMINATION GUARDRAILS

**Last Updated**: 2026-03-04
**Authority**: Forensic analysis of 7 session exports (ses_34a7, ses_34a8, ses_34ba, ses_34e5, ses_34f7, ses_34fc, ses_34ff)
**Enforcement**: ALL agents, ALL sessions, NO exceptions

> This document exists because context poisoning is real, systemic, and has been forensically proven across 7 sessions totaling 30,000+ lines of evidence. Agents that ignore these guardrails WILL produce contaminated work that wastes entire sessions.

---

## 1. TOXIC ARTIFACT REGISTRY (DO NOT CONSUME)

These files are proven contamination vectors. Reading them for infrastructure routing, decision-making, or truth-assertion is FORBIDDEN.

| File | Toxicity | Forensic Evidence |
|------|----------|-------------------|
| `.hivemind/state/brain.json` | **CRITICAL** | Contains blank agent fields, contradictory scores (drift:70 vs health:100), 183-entry cycle_log with ~90K chars of raw output. Session ses_34a8 consumed it 142 times — became primary contamination source |
| `.hivemind/state/hierarchy.json` | **HIGH** | Contains conversational paragraphs instead of SOT lineage IDs. Shared by TWO independent injection systems that can diverge. Session ses_34a8 consumed it 99 times |
| `session-ses_*.md` (root exports) | **HIGH** | Session export chains propagate poison: ses_34a8→ses_34a7→ses_34fc→ses_34ff. Never read another session's export without explicit user authorization |
| `.hivemind/state/health-metrics.json` | **MEDIUM** | Written by 12 signal scripts firing every 10 tool calls. Metrics are arbitrary increments with no action thresholds |
| `.hivemind/state/enforcement.json` | **MEDIUM** | Governance state that can steer agent behavior through false directives |
| `AGENTS-temp-disabled.md` | **CRITICAL** | Old polluted version — explicitly marked DO NOT USE |
| `.hivemind/hive-modules/hivefiver-v2/STATE.md` | **MEDIUM** | Module state document — unvalidated, potentially stale |

### Safe Exceptions
- `.hivemind/state/brain.json` MAY be read for **schema auditing** (verifying what fields exist) but NEVER for routing decisions
- `.hivemind/state/hierarchy.json` MAY be read by hivexplorer for **investigation** but NEVER trusted as truth without git-diff validation

## 2. PROVEN CONTAMINATION PATTERNS (Anti-Patterns)

### Pattern 1: Context Explosion Glob — Severity: CRITICAL
**What**: Agent runs `glob("**/*.md")` at session start to "understand context"
**Evidence**: ses_34ff did this, returned 100+ file paths, consumed ~9,500 lines of context in a 5-minute session
**Defense**: NEVER glob all markdown files. Use targeted paths only. If you need discovery, delegate to hivexplorer with bounded scope.

### Pattern 2: Session Import Chain — Severity: CRITICAL
**What**: Agent reads another session's export file to continue work
**Evidence**: ses_34ff read ses_350e (8,074 lines). ses_34fc consumed contaminated NODE-1 plan from ses_34a8
**Defense**: NEVER read session export files unless the human user explicitly instructs you to and specifies which file. Session exports are NOT handoff artifacts.

### Pattern 3: Phantom Plan Hallucination — Severity: CRITICAL
**What**: Agent receives handoff claiming plans exist that don't
**Evidence**: ses_34fc received handoff saying "META02-SUB03-PLAN.md exists" — file was never created. Agent wasted entire session chasing phantom work (35 META02 mentions)
**Defense**: ALWAYS verify referenced files exist before proceeding. If a handoff claims "X exists", your FIRST action is to check if X exists. If not, STOP and report.

### Pattern 4: brain.json Trust — Severity: CRITICAL
**What**: Agent reads brain.json and uses its contents for routing/decisions
**Evidence**: ses_34a8 consumed brain.json 142 times. Fields are blank (`role: ""`, `meta_key: ""`), contradictory (`drift_score: 70` while `auto_health_score: 100`), and contain voodoo metrics (`evidence_pressure: 364`)
**Defense**: brain.json is a write-target for the mutation queue, NOT a read-source for decisions. Treat it as an append-only log, never as state.

### Pattern 5: Protocol Bypass Under Context Pressure — Severity: HIGH
**What**: Agent loads required skills but skips mandatory protocols (declaration, intent classification)
**Evidence**: ses_34ff loaded hivefiver-prime which requires a declaration protocol. Agent never emitted it — went straight to globbing files
**Defense**: If a skill requires a protocol step, you MUST execute it before any other action. Skills are contracts, not suggestions.

### Pattern 6: Skill Avalanche — Severity: HIGH
**What**: Session loads 5+ skills, each injecting thousands of tokens of instructions
**Evidence**: ses_34e5 had 612 skill mentions across 14,584 lines
**Defense**: Maximum 2 skills per session (hivefiver-prime + one stage skill). If you need a 3rd, checkpoint and self-delegate.

### Pattern 7: False Completion Claims — Severity: HIGH
**What**: Agent claims work is complete without running verification commands
**Evidence**: ses_34ff edited agent files but never ran `npm test` or `npx tsc --noEmit`. ses_34e5 had 138 completion claims
**Defense**: NO completion claim without command output evidence. Period.

## 3. SAFE DELEGATION CONTRACT

### Before Delegating to a Sub-Agent
1. Include ONLY the specific file paths the sub-agent needs
2. Include the EXACT scope boundary ("you may read X, you may NOT read Y")
3. Include the verification command the sub-agent must run before claiming done
4. Do NOT pass entire session context — pass a 5-line summary max
5. Do NOT reference brain.json, hierarchy.json, or session exports in delegation packets

### Before Consuming a Delegation Result
1. Check: did the sub-agent run the verification command?
2. Check: did the sub-agent stay within declared scope?
3. Check: does the result reference any TOXIC artifacts?
4. If ANY check fails, discard the result and re-delegate with tighter constraints

## 4. DUAL-INJECTION CONFLICT (Root Cause)

Two independent auto-injection systems fire on EVERY LLM turn, unaware of each other:

| System | Entry Point | Channel | Agent-Aware? |
|--------|-------------|---------|-------------|
| System 1 (Plugin) | `.opencode/plugins/hiveops-governance/hooks/context-injection.ts` | `output.messages[]` prepend | PARTIAL (hivefiver block only) |
| System 2a (Engine) | `src/hooks/session-lifecycle.ts` | `output.system[]` append | NO |
| System 2b (Engine) | `src/hooks/messages-transform.ts` | `output.messages[].parts[]` synthetic | NO |

**Impact**: Both systems read overlapping state files (hierarchy.json, brain.json, todo.json) and inject potentially contradictory context directives into every turn. This is the architectural root cause of context rot.

**Current Status**: Node 1 Step 1-2 partially executed (session isolation foundation + schema detox). TypeScript compiles. 11 tests still failing due to schema contract changes. Full test alignment deferred pending user authorization.

## 5. CURRENT DEVELOPMENT STATUS

### Node 1: Injection Layer Refactoring (IN PROGRESS)
**Planning artifact**: `docs/plans/NODE-1-INJECTION-LAYER-REFACTOR-2026-03-04.md`

| Step | Status | What Changed |
|------|--------|-------------|
| Fix 3A (Session Paths) | ✅ Done | `src/lib/paths.ts` — `SessionPaths` + `getSessionPaths()` |
| Fix 3B (Session Bootstrap) | ✅ Done | `src/hooks/event-handler.ts` — `session.created` creates profile.json |
| Fix 1.5A (Schema Detox) | ✅ Done | `src/schemas/brain-state.ts` — orphans pruned, cycle_log lobotomized |
| Fix 1.5B (Counter Reduction) | ✅ Done | `src/lib/detection.ts` — GovernanceCounters → {drift, compaction} only |
| Fix 1.5C (Lineage IDs) | ⏳ Not started | hierarchy schema validation |
| Fix 1.5D (Dead Counter Callers) | ⏳ Not started | soft-governance.ts cleanup |
| Fix 3C-D (Session State Init) | ⏳ Not started | clean-slate session initialization |
| Fix 1 (Dual-Injection Decouple) | ⏳ Not started | agent guards in hook files |
| Fix 2 (Relational Staleness) | ⏳ Not started | rewrite freshness script |
| Test alignment | ⏳ Blocked | 11 tests fail from schema detox |

### Files Modified (Node 1 Steps 1-2)
```
src/lib/paths.ts                     (+22)
src/hooks/event-handler.ts           (+23)
src/schemas/brain-state.ts           (+93, -235)
src/lib/detection.ts                 (+103, -235)
src/hooks/messages-transform.ts      (-11)
src/hooks/soft-governance.ts         (-24)
src/hooks/tool-gate.ts               (+8, -8)
src/lib/commit-advisor.ts            (+3, -1)
src/lib/persistence.ts               (-6)
src/lib/session-export.ts            (+37, -60)
src/lib/session-split.ts             (-1)
src/tools/hivemind-session-memory.ts (-5)
src/tools/hivemind-session.ts        (+6, -6)
```

### Verification Evidence
- `npx tsc --noEmit` → **PASS**
- `npm test` → **203 pass, 11 fail** (schema contract mismatches in test expectations)

## 6. REGIONS NOT TO ADVANCE INTO (Without Explicit Authorization)

| Region | Why | Risk |
|--------|-----|------|
| `.opencode/plugins/hiveops-governance/hooks/` | System 1 injection — requires Fix 1 (agent guards) first | Editing without session isolation = new poisoning vectors |
| `src/hooks/session-lifecycle.ts` | System 2a injection — requires Fix 1 | Same as above |
| `src/hooks/messages-transform.ts` | System 2b injection — requires Fix 1 | Same as above |
| `.opencode/skills/gx-context-engine/scripts/` | 18+ bash enforcement scripts — requires Fix 2 (relational staleness) | Touching without relational model = more voodoo metrics |
| `.hivemind/plans/` | Contains unvalidated planning artifacts from multiple agents | Consuming these without verification = phantom plan hallucination |
| `.hivemind/state/` | Global singleton state — requires Fix 3C-D (session scoping) | Reading = trusting toxic data |
| `dist/`, `cli/` | Build artifacts with hidden entrypoints | May inject context or trigger workflows |

## 7. SAFE ENTRY PROTOCOL (For Any Agent Starting a Session)

1. **DO NOT** glob `**/*.md` or read any `.hivemind/state/` files
2. **DO** read this document (CONTAMINATION-GUARDRAILS.md) and AGENTS.md
3. **DO** check the human user's most recent message for current intent
4. **DO** declare your agent identity and session type before any action
5. **DO** verify any referenced planning artifacts exist before consuming them
6. **DO** run `npx tsc --noEmit` before and after any code changes
7. **DO** limit skill loading to 2 per session maximum
8. **DO NOT** trust handoff claims without file-existence verification
9. **DO NOT** read session export files (session-ses_*.md) without explicit user instruction
10. **DO NOT** advance into restricted regions (Section 6) without explicit authorization
