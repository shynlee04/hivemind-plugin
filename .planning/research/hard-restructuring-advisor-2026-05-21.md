# Hard Restructuring — Gray-Area Decision Advisor

**Date:** 2026-05-21  
**Status:** Analysis for human judgment  
**Context:** Hard restructuring phases to be inserted between Phase 18 (COMPLETE) and Phase 19 (planned). Must fix "hard" (src/) before "soft" (.opencode/ primitives), starting non-destructively.

---

## Decision 1: Phase Ordering Strategy

**Question:** Should non-destructive fixes (dead code, sync I/O, error typing) come first, or should architectural decomposition (plugin split, injection unification) lead?

### Option A: Non-destructive First → Then Architecture

| Option | Pros | Cons | Complexity | Recommendation |
|--------|------|------|------------|----------------|
| **A: Non-destructive first** (sync I/O → errors → legacy cleanup → then architecture) | Lowest risk per phase; builds confidence; no regression on existing runtime; produces visible LOC/type-safety wins immediately; creates clean slate for architecture work | Defers critical architectural decisions (plugin.ts cap breach risk continues); may discover architecture-blocking issues during non-destructive work; Phase 19/Package workflow blocked longer | 4-5 phases, ~12 files — Risk: LOW per phase, cumulative regression risk from state changes | **Rec if confidence needs to be rebuilt** after CP-DT-01 debacle; Rec if team prefers measurable progress |
| **B: Architecture first** (plugin split → DelegationManager unification → then cleanup) | Unblocks plugin.ts 100-LOC target early; removes the highest-brittleness surface (delegation dual-facade) early; enables cleaner package distribution for Phase 20 | Higher risk per commit (touches composition root); requires integration retest after every architectural change; sync I/O and error typing remain as background noise; could break runtime if miswired | 3-4 phases, ~6 files — Risk: MODERATE-HIGH per commit (composition root + delegation runtime paths) | **Rec if plugin.ts cap breach is urgent** (at 493/500); Rec if Phase 20 distribution is time-sensitive |
| **C: Interleaved** (one architectural fix per cleanup cycle) | Spreads risk across phases; prevents architecture-only overwhelm; each cleanup cycle has a visible "win" | Requires careful dependency sequencing; architectural fix may depend on prior cleanup (e.g., extract tool registry depends on removing legacy hooks first); harder to track completion criteria | 6-8 phases — Risk: MODERATE, management overhead of coordination | **Rec if team wants balanced approach** with steady progress in both dimensions |

### Rationale

The CONCERNS.md and DI-ARCHITECTURE-ANALYSIS.md reveal that Phase 18 already removed the largest dead-code blocks (toggle-gates, steering-engine, runtime-detection, recovery/). What remains is **diffuse, not concentrated** — 44 readFileSync calls scattered across 7 files, 25 legacy references across 6 files, 100 `throw new Error` sites across 45 files. These are low-risk-per-touch but high-coordination-cost items. Meanwhile, plugin.ts sits at 493/500 LOC — one new tool registration away from a violation. The **Architecture First** approach is stronger here because: (1) the plugin.ts cap is actively constraining development, (2) the DelegationManager dual-facade anti-pattern (DI-ARCHITECTURE-ANALYSIS §5) is the highest-complexity architectural debt, (3) removing legacy hooks (`system.transform`, `messages.transform`) from the plugin return is a quick architectural win that directly reduces noise. Non-destructive fixes can be interleaved in subsequent waves.

---

## Decision 2: Legacy/Deprecation Removal Strategy

**Question:** Remove all legacy/deprecated code at once, annotate with removal gates, or defer until after restructuring?

### Option A: Remove All at Once (One Phase)

| Option | Pros | Cons | Complexity | Recommendation |
|--------|------|------|------------|----------------|
| **A: Remove all at once** | Cleanest outcome; one-phase scope; no "forgotten remnant" risk; all callers must be correct or break | High risk of breaking something (25 legacy refs + 10 deprecated + 100 throw Error sites); needs thorough regression; one big bang change is hard to review thoroughly | 1 phase, 15+ files — Risk: HIGH (regression surface is broad and poorly tested at integration level) | **Rec only if** accompanied by full `npm test` + manual delegation/PTY smoke test; not recommended without runtime-proofing layer |
| **B: Per-file annotations with removal gates** | Each removal is atomic and reverable; gates ensure no downstream consumer breaks; builds a removal audit trail; lower psychological barrier to start | More phases/commits; some legacy code remains during restructuring; annotation drift risk if not enforced | 3-5 phases, 6-8 files per — Risk: LOW-MODERATE per phase | **Rec as default approach** — aligns with HIVEMIND-PHILOSOPHY "Iteratively Granular" and "Strategically Measurable" pillars |
| **C: Defer until after restructuring** | Zero risk of breaking architecture work; cleanest focus for each wave | Legacy debt compounds; restructuring may need to work around legacy paths; CP-DT-01 proved that deferred cleanup creates confusion (event-tracker remnants in documentation 3 phases after deletion) | 0 phases now — Risk: LOW short-term, HIGH cumulative | **Rec only if** the architectural work is time-critical AND legacy code is provably isolated (tested, no active callers); NOT recommended per CP-DT-01 lesson |

### Rationale

The OpenCode SDK audit (§7) identified 2 legacy hooks (`system.transform`, `messages.transform`) that are silently ignored by the runtime and 6 minor mismatches (loose hook typing, no-op config hook). These are low-risk, high-visibility-clarity wins. The 25 `legacy` references span 6 files with known owners per CONCERNS.md — each can carry a `@deprecated — remove after <gate>` JSDoc annotation with a tracking issue. Option B (per-file with gates) aligns with the HIVEMIND-PHILOSOPHY "Strategically Measurable" and "Iteratively Granular" pillars. The exception is `throw new Error` → typed error hierarchy: 100 sites across 45 files is too diffuse for per-file gates — consider a single "typed errors" sub-phase that converts all 100 sites in one wave (low risk because the runtime behavior is identical until callers begin catching specific error types).

---

## Decision 3: Dependency Cleanup Timing

**Question:** Should unused deps be removed before restructuring (clean slate), after (avoid conflicts), or only bumped without removal?

### Option A: Remove Before Restructuring

| Option | Pros | Cons | Complexity | Recommendation |
|--------|------|------|------------|----------------|
| **A: Remove before restructuring** | Cleanest dependency graph for architecture work; no "is this dep used?" ambiguity during refactors; reduces install size early | May conflict with restructuring if a dep is removed that a restructured module still imports (indirectly); needs thorough import scanning | 1 phase, 1 file (package.json) + verification — Risk: MODERATE (needs careful tree-shaking analysis) | **Rec if** the unused dep list is small and known (React/Ink, tree-sitter-*); warn if any restructuring phase might reintroduce a dependency |
| **B: Remove after restructuring** | No conflict with architecture work; restructuring can freely change imports without worrying about dep tracking | Remove phase may find that restructuring already removed last usage — missed opportunity for clean slate; delayed benefit of smaller install footprint | 1 phase after architecture — Risk: LOW | **Rec as conservative default** but requires discipline to track removal as a committed phase, not an indefinite "later" |
| **C: Bump versions only, defer removal** | Lowest effort; version bumps are safe (semver); no architecture conflict | Unused deps remain; install footprint doesn't shrink; "bump only" can mask the removal work indefinitely; React/Ink at risk of dragging major version bumps into runtime | 1 sub-phase — Risk: VERY LOW | **Rec against** — this is deferral masquerading as action; only viable if the restructuring timeline is <1 week and a dedicated cleanup phase immediately follows |

### Rationale

CONCERNS.md §"Dependencies at Risk" identifies `bun-pty`, `node-pty`, `@ast-grep/napi`, `tree-sitter-*` as platform-sensitive, and React 19 + `@json-render/*` as runtime footprint concerns. The React/Ink sidecar dependencies are the highest-priority cleanup target because they inflate install footprint for users who only need delegation/session harness functionality — and they are already lazily-loadable per the CONCERNS.md migration plan. Option B (remove after restructuring) is safest because restructuring may change which modules import which tools/tool paths, which could affect the dependency tree. However, this requires a committed phase slot. **Recommendation:** Do a quick `depcheck` or `npx knip` scan before any restructuring begins to document the "known unused" baseline, then commit to a dedicated Phase 18.5 or Phase 19.5 removal phase.

---

## Decision 4: Plugin.ts Decomposition Approach

**Question:** Should plugin.ts be minimally decomposed (extract tool registry only), fully decomposed (startup + tools + hooks + assembly), or rewritten from a clean spec?

### Option A: Minimal — Extract Tool Registry Only

| Option | Pros | Cons | Complexity | Recommendation |
|--------|------|------|------------|----------------|
| **A: Extract tool registry only** | Lowest effort (~40 LOC extraction); immediately frees ~40 LOC from plugin.ts (493 → ~453); preserves all existing wiring; no behavioral risk | Doesn't address the main complexity: startup migration, hook composition, fire-and-forget promises; plugin.ts still owns too many concerns | 1 file, ~1 phase — Risk: VERY LOW | **Rec if** plugin.ts cap breach is the ONLY concern and architecture complexity is acceptable |
| **B: Full decomposition** (startup → `plugin/startup.ts`, tool-map → `plugin/tool-registry.ts`, hook-compose → `plugin/hook-composition.ts`, assembly → `plugin.ts`) | Each concern gets its own module at ~100 LOC; plugin.ts becomes true composition root (~50 LOC); aligns with PHILOSOPHY CQRS/zero-logic assembly target; opens path to independent testing of startup/hooks/tools | Most effort; changes 4+ files; hook composition has subtle ordering constraints (observers created before consumers, consumers wired before hooks); startup fire-and-forget patterns need careful handling | 4-5 files, 2-3 phases — Risk: MODERATE (composition ordering must be correct) | **Rec as the architecturally correct choice** — aligns with the "plugin as zero-logic assembly" target (PHILOSOPHY §7); repays effort over next 20 phases |
| **C: Rewrite plugin.ts from clean spec** | Cleanest outcome; can incorporate OpenCode SDK audit §8 recommendations (typed hooks, remove legacy hooks); eliminates all accumulated cruft | Highest risk — one wrong return value breaks the plugin contract; loses tested composition ordering from current implementation; difficult to regression-test without live OpenCode runtime | 1 file, 1-2 phases — Risk: HIGH (no incremental checkpoint) | **Rec against** — the current implementation WORKS (proven through 2382 tests and 23 registered tools). Rewrite from scratch introduces unnecessary risk. The DI-ARCHITECTURE-ANALYSIS §1 shows the pattern is consistent, just bloated. |

### Rationale

Plugin.ts at 493 LOC within striking distance of the 500 LOC cap (CONCERNS.md line 20, DI-ARCHITECTURE-ANALYSIS §1). The DI-ARCHITECTURE-ANALYSIS §10 identifies 5 anti-patterns, of which 2 are in plugin.ts: fire-and-forget promise hygiene and `setupDelegationModules` temporal coupling. The OpenCode SDK audit (§8) adds 2 more: hook type safety improvements and removal of legacy non-SDK hooks. **Full decomposition (Option B)** is the right choice because: (1) each concern (startup, tool-registry, hook-composition) is independently testable once extracted; (2) the 100-LOC target for composition root is a PHILOSOPHY pillar, not an arbitrary goal; (3) the extraction itself is mechanical (move factory call sites to dedicated files, keep only the wiring in plugin.ts) — the hardest part is getting the import dependency order right, which is already correct in the current code. Use 3 phases: Phase 18.1 (extract tool registry), Phase 18.2 (extract startup + hook composition), Phase 18.3 (type-safety cleanup + legacy hook removal).

---

## Decision 5: The "Soft Routing" Problem — Runtime Lineage Boundary

**Question:** Should hm-* vs hf-* lineage routing be implemented as runtime code in src/, kept as soft skill-only, or hybrid?

### Option A: Full Runtime Lineage Routing

| Option | Pros | Cons | Complexity | Recommendation |
|--------|------|------|------------|----------------|
| **A: Full runtime lineage routing** | Agents get automatic skill loading based on lineage context; no skill-loading mistakes; deterministic behavior; enables tool-permission-by-lineage enforcement | New src/ module needed (routing engine); changes agent dispatch path; skills must declare lineage in machine-parseable metadata; heavy coordination with .opencode/ primitives | 3-5 files, 2-3 phases — Risk: HIGH (crosses hard/soft boundary, changes delegation behavior, needs L1 runtime proof) | **Rec against for now** — crosses the HIVE/MIND boundary in a way that mixes hard and soft concerns. More appropriate for a later "runtime intelligence" workstream. |
| **B: Keep soft-only, improve skills** | Zero src/ changes; lowest risk; skill documents can be incrementally improved; no runtime contract changes | Agents still depend on correct skill-loading by the model; no enforcement — only guidance; skill loading failures are silent and invisible to diagnostics | 0 src/ phases — Risk: LOW short-term, CONTINUOUS long-term (model-dependent correctness) | **Rec as conservative default** — the 45 hm-* and 13 hf-* skills (STATE.md) are already working through soft mechanisms. The model's skill loading accuracy is adequate for current scale. |
| **C: Hybrid — minimal runtime boundary** | Create a lightweight `src/routing/lineage-resolver.ts` that maps agent names to lineage categories; expose via `hivemind-command-engine` read-side; skills remain soft but can be validated against the runtime registry | Minimal src/ change (1 file, ~50 LOC); adds machine-readable lineage validation without changing delegation behavior; enables `hivemind doctor` to flag mismatches; preserves soft nature of skills | 1 file, 1 sub-phase — Risk: LOW (read-side only, no delegation impact, no L1 proof needed) | **Rec as pragmatic middle ground** — it's a thin validation layer, NOT a routing engine. The skills stay soft. The runtime just provides a registry that skills are validated against. Unblocks MCM-03 (Config Plane Integration) which requires doctor validation. |

### Rationale

The "soft routing" concern is about whether the 45 hm-* and 13 hf-* skills (MCM-02) should have runtime verification that they're being loaded for the right lineage. Currently, skill loading is entirely model-driven — the model sees a task and loads skills based on trigger descriptions. There's no enforcement. Option C (hybrid) is the pragmatic choice because: (1) it creates a **read-side only** registry (no delegation change, no enforcement) that `hivemind doctor` can validate skills against; (2) it preserves the PHILOSOPHY's "Soft Meta-Concepts are flexible" principle — skills remain in `.opencode/` and are not migrated to `src/`; (3) it gives MCM-03 a concrete validation surface without changing delegation behavior; (4) it can grow into Option A later if runtime enforcement becomes necessary. The implementation is small: parse agent names from `.opencode/agents/`, extract lineage prefix (`hm-`, `hf-`, `gate-`, `stack-`), and expose a registry. No mutation, no delegation impact.

---

## Summary Recommendation: Phase Sequence

Based on the 5 gray-area decisions above, the recommended phase sequence between Phase 18 and Phase 19:

1. **Phase 18.1 — Plugin Decomposition, Part 1: Tool Registry Extraction** (Decision 4, Option B subset)
   - Extract `src/tools/tool-registry.ts` — moves inline tool factory calls to a factory map
   - plugin.ts: 493 → ~440 LOC
   - Risk: VERY LOW (mechanical extraction, no behavior change)

2. **Phase 18.2 — Plugin Decomposition, Part 2: Startup + Hook Composition** (Decision 4, Option B subset)
   - Extract `src/plugin/startup.ts`, `src/plugin/hook-composition.ts`
   - Fix fire-and-forget promise hygiene (Decision 4, anti-patterns 2 & 3)
   - Fix `setupDelegationModules` temporal coupling (line 204 `coordinatorRef`)
   - Remove legacy non-SDK hooks (`system.transform`, `messages.transform`)
   - Plugin.ts: ~440 → ~150 LOC
   - Risk: MODERATE (composition ordering must be verified)

3. **Phase 18.3 — Hook Type Safety + Legacy Cleanup** (Decision 2, Option B)
   - Typed hook signatures per OpenCode SDK audit §8
   - Per-file `@deprecated` annotations with gates for all 6 files with legacy/deprecated refs
   - Risk: LOW

4. **Phase 18.4 — Sync I/O Conversion** (Decision 1, variant of Option A)
   - Convert runtime paths (plugin.ts, tool paths) from sync `fs` to `fs/promises`
   - Keep sync I/O only in CLI/bootstrap cold paths per CONCERNS.md
   - Risk: MODERATE (must not break cold-start/CLI paths)

5. **Phase 18.5 — Typed Error Hierarchy** (Decision 2, special case)
   - Define structured error types (ValidationError, PermissionError, RuntimeUnavailableError, NotFoundError, PersistenceError)
   - Convert all 100 `throw new Error` sites across 45 files
   - Risk: LOW (behaviorally equivalent until callers catch specific types)

6. **Phase 18.6 — Lineage Resolver (Hybrid)** (Decision 5, Option C)
   - Create `src/routing/lineage-resolver.ts` (~50 LOC)
   - Agent-to-lineage registry, read-side only
   - Wire into `hivemind-command-engine` for doctor validation
   - Risk: VERY LOW

7. **Phase 18.7 — Dependency Cleanup** (Decision 3, Option B)
   - Remove React/Ink/`@json-render/*` unused deps; bump remaining
   - Verify tree-shaking with `depcheck`/`knip`
   - Risk: LOW

Then Phase 19 (fix sync-oss.yml workflow), Phase 20 (package primitives).

### References

- CONCERNS.md — full tech debt/bugs/security/performance/fragile inventory
- DI-ARCHITECTURE-ANALYSIS.md — DI pattern analysis, anti-patterns, wiring diagram
- HIVEMIND-PHILOSOPHY.md — 5 pillars, CQRS, zero-logic assembly, hard/soft separation
- ROADMAP.md — Phase 17-20 definitions, SR restructuring plan
- STATE.md — current project state, what's broken/missing, decisions record
- opencode-sdk-v1155-api-audit-2026-05-21.md — SDK contract verification, hook mismatches, `context.task` absence
