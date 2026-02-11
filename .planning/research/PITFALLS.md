# Domain Pitfalls: HiveMind Cognitive Mesh

**Domain:** AI Agent Context Governance
**Researched:** 2026-02-12

## Pitfall Philosophy

> The mesh creates intelligence multipliers — but also failure multipliers.
> A broken chain in one system cascades to all connected systems.
> Prevention = design for graceful degradation, not perfection.

## Critical Pitfalls (Cause Rewrites or Major Issues)

### Pitfall 1: Blocking/Denying Tool Execution
**What goes wrong:** Plugin uses `permission.ask` to deny writes or `tool.execute.before` to block. Other plugins try to use those tools. Clash. User can't work. User uninstalls HiveMind.
**Why it happens:** "Strict governance" sounds like it should mean "prevent bad actions."
**Consequences:** Plugin conflict, user frustration, ecosystem reputation damage.
**Prevention:** NEVER use `permission.ask`. Never set `output.status = "deny"`. Soft governance only: warn, escalate, argue back, track. Zero plugins in the ecosystem use blocking (verified across 8 plugins).
**Detection:** Any PR that imports `permission.ask` or sets status to "deny" fails review.

### Pitfall 2: SDK Client in Plugin Init (Deadlock)
**What goes wrong:** Plugin calls `client.session.list()` or `client.tui.showToast()` during the `async (input) => { ... }` init function. Server waits for plugin init to complete. Plugin waits for server response. Deadlock.
**Why it happens:** Seems natural to "check state" during init. oh-my-opencode hit this (issue #1301).
**Consequences:** OpenCode hangs on startup. User has to kill process, disable plugin.
**Prevention:** Store client reference during init. Use it ONLY from within hooks and tool handlers, which fire after init completes.
**Detection:** Lint rule: no `client.*` calls in the top-level plugin function body.

```typescript
// ❌ DEADLOCK
const plugin: Plugin = async ({ client }) => {
  const sessions = await client.session.list(); // HANGS
  return hooks;
};

// ✅ SAFE
let sdkClient: ReturnType<typeof createOpencodeClient>;
const plugin: Plugin = async ({ client }) => {
  sdkClient = client; // Just store reference
  return hooks; // Use sdkClient in hooks later
};
```

### Pitfall 3: SDK as Foundation (Non-Portable Architecture)
**What goes wrong:** Core logic imports `@opencode-ai/plugin`. Hierarchy tree, detection engine, mems brain become SDK-dependent. Can't port to Claude Code, Cursor, or standalone.
**Why it happens:** SDK is convenient. `client.find.text()` is easier than building your own search.
**Consequences:** Locked to OpenCode forever. Concepts die with the platform.
**Prevention:** Strict boundary: `src/lib/` NEVER imports SDK. `src/hooks/` is the ONLY place SDK appears. Core concepts operate on pure data structures.
**Detection:** CI check: `grep -r "@opencode-ai" src/lib/` must return empty.

### Pitfall 4: Single-System Features (Breaking the Mesh)
**What goes wrong:** New tool registered that just wraps a CLI command. No hierarchy update, no mems persistence, no detection signal. It's `bash` with extra steps. No intelligence multiplier.
**Why it happens:** Easier to build isolated features. Mesh integration takes thought.
**Consequences:** Feature bloat without intelligence gain. Plugin becomes a tool bag, not a cognitive mesh.
**Prevention:** Every new feature must answer: "Which 2+ systems does this touch? How does it chain?" If it only touches one system, it probably shouldn't be a standalone tool.
**Detection:** Feature review: draw the data flow across systems. If the line only touches one box, redesign.

### Pitfall 5: Teaching Only in Strict Mode (Bootstrap Gap)
**What goes wrong:** Bootstrap block fires only when `governance_status === "LOCKED"` (strict mode). Assisted/permissive mode starts OPEN. Agent never learns evidence discipline, team behavior, or governance principles.
**Why it happens:** Original design: strict = full governance, permissive = no governance. But "no governance" ≠ "no teaching."
**Consequences:** ST12 FAIL. In the default mode (assisted), agents get zero governance education. The mesh's intelligence-boosting capability is disabled for most users.
**Prevention:** Bootstrap fires based on `turn_count <= 2`, not lock status. ALL modes teach principles. Modes differ in enforcement level, not education level.
**Detection:** Test: start session in assisted mode, verify bootstrap content appears in first turn.

## Moderate Pitfalls

### Pitfall 6: Conflicting Signals Across Modes
**What goes wrong:** Permissive mode documented as "silent tracking only" but detection engine pushes [WARN]/[CRITICAL] signals unconditionally. Agent gets confused by contradictory signals.
**Prevention:** Mode-aware signal filtering in session-lifecycle.ts. Permissive: INFO only. Assisted: INFO+WARN. Strict: all tiers. Retard: all tiers + argue-back.

### Pitfall 7: Turn-Counting as Primary Drift Detection
**What goes wrong:** Agent makes 20 productive turns on one task. Gets "drift warning" at turn 6. Warning becomes noise. Agent learns to ignore governance.
**Prevention:** Replace turn-counting with event-driven signals. `session.idle` = real stale. `file.edited` frequency = real activity. Turn count as ONE of 9 signals, not the trigger.

### Pitfall 8: Large Context Budget in Compaction
**What goes wrong:** Compaction hook injects too much context. Eats into agent's context window. Agent has less room for actual work.
**Prevention:** Budget cap (currently 1800 chars / ~500 tokens). Hierarchy + metrics only. Mems brain stays on disk, not in context. Just-in-time recall via tools.

### Pitfall 9: Static Argue-Back Strings
**What goes wrong:** 11 counter-excuses in detection engine are pre-authored. Agent sees same responses repeatedly. Becomes noise.
**Prevention:** Context-aware argue-back: "You've ignored 3 warnings about [specific hierarchy node]. Last map_context was 12 turns ago." Dynamic, not template.

## Minor Pitfalls

### Pitfall 10: Manifest-File Consistency
**What goes wrong:** `manifest.json` tracks session files but actual `.hivemind/sessions/` directory has orphan files.
**Prevention:** Periodic manifest-to-disk reconciliation. `hivemind validate` CLI command.

### Pitfall 11: Mems Shelf Bloat
**What goes wrong:** Agent saves everything to mems. Shelves grow unbounded. Recall becomes slow and noisy.
**Prevention:** Shelf size limits. Staleness-based pruning. Relevance scoring on recall.

### Pitfall 12: Git Hash as Timestamp
**What goes wrong:** Git hash computed at render-time, not stored with hierarchy nodes. Can't trace back to exact git state of a decision.
**Prevention:** Store git hash with each hierarchy node creation. `$\`git rev-parse HEAD\`` via BunShell.

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Governance foundation fix | Pitfall 5 (bootstrap gap) | Test bootstrap in ALL 3 modes |
| SDK client integration | Pitfall 2 (deadlock) | Store ref, use in hooks only |
| Event-driven governance | Pitfall 7 (turn-counting noise) | Events as primary, turns as backup |
| Session-as-plan lifecycle | Pitfall 3 (SDK dependency) | Session concepts in lib/, SDK calls in hooks/ |
| Fast extraction tools | Pitfall 4 (single-system) | Tools MUST update hierarchy + save to mems |
| Orchestration loop | Pitfall 8 (context budget) | Loop state on disk, not in context |
| Stress testing | Pitfall 9 (static argue-back) | Test with dynamic context, not just static |

## Sources

- oh-my-opencode issue #1301 (deadlock)
- Stress test investigation: ST11 (signal conflict) and ST12 (bootstrap gap)
- 8 plugin repos: zero use `permission.ask` — ecosystem consensus against blocking
- idumb-v2 diagram: mesh requires multi-system integration

---
*Last updated: 2026-02-12 after SDK verification + cognitive mesh reframing*
