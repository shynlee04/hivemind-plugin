# Phase 43: Tmux Co-Pilot Model — Orchestrator Intervention - Research

**Researched:** 2026-05-31
**Domain:** Tmux integration — send-keys intervention, pane grid planning, co-pilot tool
**Confidence:** HIGH

## Summary

Phase 43 builds on the Phase 42 foundation (forked `@hivemind/opencode-tmux`, Hivemind tmux module, plugin wiring) to enable **orchestrator intervention** in running subagent sessions via tmux `send-keys`, and **pane grid planning** that arranges tmux panes to reflect delegation hierarchy.

The fork (`opencode-tmux/src/tmux.ts`) already uses `tmux send-keys` for `C-c` in `closePane()` (line 180) and `tmux split-window` for horizontal pane splits (line 117). What Phase 43 adds is: (1) a `sendKeys()` method for arbitrary text input, (2) a grid planner that calculates pane layout from delegation depth/width, (3) a Hivemind-side `co-pilot` tool that agents can call to send text or query pane state, and (4) wiring the placeholder `onSessionCreated` callback in `plugin.ts` (line 579) to forward enriched events to the fork's SessionManager.

**Primary recommendation:** Add `sendKeys()` and `listPanes()` methods to `TmuxMultiplexer`, create a `PaneGridPlanner` that computes `tmux split-window` sequences from delegation tree shape, and expose a `tmux-copilot` tool in `src/tools/` for orchestrator agent intervention.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| send-keys text injection | Fork (`opencode-tmux/src/tmux.ts`) | Hivemind tool (`src/tools/tmux-copilot.ts`) | Fork owns tmux binary interaction; Hivemind owns agent-facing API |
| Pane grid layout computation | Fork (`PaneGridPlanner`) | — | Layout is a tmux concept; planner must emit tmux commands |
| Co-pilot tool (agent-callable) | Hivemind (`src/tools/`) | — | Agent-callable tools live in Hivemind's CQRS write-side |
| Enriched event forwarding | Hivemind (`src/plugin.ts`) | Fork (`SessionManager`) | Hivemind enriches events; fork consumes them |
| Pane state query | Fork (`listPanes`) | Hivemind tool | Fork queries tmux binary; Hivemind exposes to agents |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `execFile` (Node built-in) | Node 20+ | Spawn tmux subprocess commands | Already used in fork `tmux.ts` and Hivemind `integration.ts` — consistent pattern |
| `@opencode-ai/plugin` | >=1.14.44 | Plugin SDK for tool registration | Already in `package.json` peer dependencies [VERIFIED: package.json] |
| `@opencode-ai/sdk` | latest | Session event types | Already imported in `session-manager.ts` |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Zod | v3 (existing) | Tool input schema validation | Already used across all Hivemind tools |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `execFile` for tmux commands | `node-pty` or `bun-pty` | PTY gives interactive shell but overkill for one-shot commands; `execFile` is simpler, already proven |
| Custom grid planner | tmux's built-in layouts only | Built-in layouts (`main-vertical`, `tiled`) are flat — no hierarchy awareness. Custom planner needed for depth-aware grids. |

**Installation:**
```bash
# No new packages needed — all functionality built on existing dependencies
```

**Version verification:**
```bash
npm view @opencode-ai/plugin version    # Already in peerDeps
npm view zod version                     # Already in deps
```

## Package Legitimacy Audit

> No new packages installed in this phase — all functionality uses existing Node.js built-ins and already-declared dependencies.

| Package | Registry | Age | Downloads | Source Repo | slopcheck | Disposition |
|---------|----------|-----|-----------|-------------|-----------|-------------|
| (none) | — | — | — | — | — | No new packages |

*No new packages to audit.*

## Architecture Patterns

### System Architecture Diagram

```
Orchestrator Agent
       │
       ▼
tmux-copilot tool (src/tools/tmux-copilot.ts)
       │
       ├─── send-keys action ───► TmuxMultiplexer.sendKeys(paneId, text)
       │                                   │
       │                                   ▼
       │                              tmux send-keys -t <paneId> <text>
       │                                   │
       │                                   ▼
       │                              Target subagent pane receives input
       │
       ├─── list-panes action ──► TmuxMultiplexer.listPanes()
       │                                   │
       │                                   ▼
       │                              tmux list-panes -F '#{pane_id} ...'
       │                                   │
       │                                   ▼
       │                              Returns pane state to orchestrator
       │
       └─── plan-grid action ───► PaneGridPlanner.computeLayout(tree)
                                         │
                                         ▼
                                    tmux split-window / select-layout sequence
                                         │
                                         ▼
                                    Delegation hierarchy reflected in pane grid
```

### Recommended Project Structure
```
src/features/tmux/
├── integration.ts       # Existing — binary detection, port persistence, factory
├── observers.ts         # Existing — session.created enrichment
├── copilot.ts           # NEW — co-pilot intervention logic
├── grid-planner.ts      # NEW — delegation-tree → tmux layout calculator
└── types.ts             # NEW (optional) — shared tmux types if needed

src/tools/
├── tmux-copilot.ts      # NEW — agent-callable co-pilot tool

opencode-tmux/src/
├── tmux.ts              # MODIFY — add sendKeys(), listPanes()
├── session-manager.ts   # MODIFY — expose sendKeys via tracked sessions
└── grid-planner.ts      # NEW — pane grid layout calculator
```

### Pattern 1: send-keys Intervention
**What:** Send arbitrary text input to a running tmux pane via `tmux send-keys -t <paneId> <text> Enter`
**When to use:** Orchestrator needs to intervene in a running subagent session (redirect, correct, stop)
**Example:**
```typescript
// Source: opencode-tmux/src/tmux.ts (extending existing TmuxMultiplexer)
async sendKeys(paneId: string, text: string): Promise<boolean> {
  const tmux = await this.getBinary();
  if (!tmux) return false;
  try {
    await execFileAsync(tmux, ["send-keys", "-t", paneId, text, "Enter"]);
    return true;
  } catch (err) {
    this.log?.debug("sendKeys: ERROR", err);
    return false;
  }
}
```

### Pattern 2: Pane Grid Planning
**What:** Compute a sequence of `tmux split-window` commands from delegation tree shape
**When to use:** When multiple subagents are active and pane layout should reflect hierarchy
**Example:**
```typescript
// Source: opencode-tmux/src/grid-planner.ts (NEW)
interface GridNode {
  sessionId: string;
  agent: string;
  depth: number;
  children: GridNode[];
}

function computeSplitSequence(tree: GridNode): SplitCommand[] {
  // BFS: each level splits horizontally, children split vertically
  // Main pane = root orchestrator
  // Level 1: split main horizontally for each direct child
  // Level 2+: split parent pane vertically for grandchildren
  const commands: SplitCommand[] = [];
  // ... layout computation logic
  return commands;
}
```

### Pattern 3: Co-pilot Tool Registration
**What:** Register a Hivemind tool that orchestrator agents call to interact with tmux panes
**When to use:** Agent needs to send input to, query, or rearrange tmux panes
**Example:**
```typescript
// Source: src/tools/tmux-copilot.ts (NEW)
import { z } from "zod";

const TmuxCopilotInputSchema = z.object({
  action: z.enum(["send-keys", "list-panes", "plan-grid", "get-pane"]),
  paneId: z.string().optional(),
  text: z.string().optional(),
  sessionId: z.string().optional(),
});
```

### Anti-Patterns to Avoid
- **Direct tmux CLI from agents:** Agents should NEVER call `tmux` directly — they must go through the co-pilot tool. The tool enforces boundaries and validation.
- **Blocking on send-keys:** `send-keys` is fire-and-forget. Never `await` confirmation from the subagent pane.
- **Grid planner on every event:** Layout recalculation should be debounced/throttled. Don't recalculate on every `session.created`.
- **Assuming pane IDs are stable:** Pane IDs can change after layout changes. Always query current state before operating.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Shell argument escaping | Custom regex escaping | `quoteShellArg()` already in `tmux.ts` line 25-27 | Edge cases with special characters, already tested |
| Binary path resolution | New `which` logic | `resolveBinary()` in `integration.ts` / `findBinary()` in `tmux.ts` | Consistent across fork and Hivemind |
| Pane tracking | New Map in Hivemind | `SessionManager.sessions` Map (tracks session→paneId) | Already tracks pane lifecycle with dedup guards |
| Event enrichment | New observer | `createTmuxEventObserver()` in `observers.ts` | Already enriches with `hivemindMeta` |

**Key insight:** The fork's `SessionManager` (295 LOC) already handles the full session→pane lifecycle (spawn, track, idle/busy status, auto-close, respawn, cleanup). Phase 43 extends this, not replaces it.

## Common Pitfalls

### Pitfall 1: send-keys Escaping
**What goes wrong:** Special characters in intervention text (`'`, `"`, `$`, `\`) get interpreted by the shell
**Why it happens:** `tmux send-keys` passes through shell interpretation
**How to avoid:** Use `tmux send-keys -l` flag for literal text (no special interpretation), or use the existing `quoteShellArg()` helper
**Warning signs:** Agent sends "stop what you're doing" and tmux interprets `$what` as variable expansion

### Pitfall 2: Race Condition Between spawnPane and sendKeys
**What goes wrong:** Orchestrator sends keys to a pane that hasn't finished spawning
**Why it happens:** `spawnPane` is async; `send-keys` executes before `opencode attach` is ready
**How to avoid:** Check `SessionManager.isTrackedOrSpawning()` before sending keys; add a small delay or health-check after spawn
**Warning signs:** Keys sent but subagent doesn't receive them

### Pitfall 3: Grid Planner Thrashing
**What goes wrong:** Every `session.created` or `session.deleted` triggers a full layout recalculation, causing visible pane flickering
**Why it happens:** No debouncing on layout changes
**How to avoid:** Debounce layout recalculation (e.g., 500ms batch window); only recalculate when delegation tree shape actually changes
**Warning signs:** Panes visibly jump around when multiple subagents spawn in quick succession

### Pitfall 4: send-keys to Closed Pane
**What goes wrong:** Orchestrator tries to intervene in a session whose pane was auto-closed (idle timeout)
**Why it happens:** Session still exists in OpenCode but tmux pane was killed
**How to avoid:** Check `SessionManager.sessions.has(sessionId)` and handle `closedSessions` — if auto-closed, respawn first
**Warning signs:** `tmux send-keys` returns error for nonexistent pane

## Code Examples

### send-keys Method (extending TmuxMultiplexer)
```typescript
// Source: opencode-tmux/src/tmux.ts — add to TmuxMultiplexer class
async sendKeys(paneId: string, text: string, literal = true): Promise<boolean> {
  const tmux = await this.getBinary();
  if (!tmux) return false;
  try {
    const args = ["send-keys", "-t", paneId];
    if (literal) args.push("-l"); // literal mode: no special interpretation
    args.push(text);
    await execFileAsync(tmux, args);
    // Follow with Enter key if not in literal mode
    if (!literal) {
      await execFileAsync(tmux, ["send-keys", "-t", paneId, "Enter"]);
    }
    return true;
  } catch (err) {
    this.log?.debug("sendKeys: ERROR", err);
    return false;
  }
}
```

### list-panes Method (extending TmuxMultiplexer)
```typescript
// Source: opencode-tmux/src/tmux.ts — add to TmuxMultiplexer class
async listPanes(): Promise<Array<{ paneId: string; title: string; active: boolean; size: string }>> {
  const tmux = await this.getBinary();
  if (!tmux) return [];
  try {
    const format = "#{pane_id}\t#{pane_title}\t#{pane_active}\t#{pane_width}x#{pane_height}";
    const { stdout } = await execFileAsync(tmux, [
      "list-panes", ...this.targetArgs(), "-F", format,
    ]);
    return stdout.trim().split("\n").filter(Boolean).map((line) => {
      const [paneId, title, active, size] = line.split("\t");
      return { paneId: paneId ?? "", title: title ?? "", active: active === "1", size: size ?? "" };
    });
  } catch {
    return [];
  }
}
```

### Co-pilot Tool Skeleton
```typescript
// Source: src/tools/tmux-copilot.ts (NEW)
import { z } from "zod";

export const TmuxCopilotInputSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("send-keys"),
    sessionId: z.string().describe("Target session to send keys to"),
    text: z.string().describe("Text to send to the session pane"),
  }),
  z.object({
    action: z.literal("list-panes"),
  }),
  z.object({
    action: z.literal("get-pane"),
    sessionId: z.string().describe("Get pane info for a specific session"),
  }),
  z.object({
    action: z.literal("plan-grid"),
    rootSessionId: z.string().describe("Root session ID to compute layout from"),
  }),
]);
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| tmux `split-window -h` always | Hierarchy-aware grid planning | Phase 43 (this phase) | Panes reflect delegation tree depth |
| `closePane` only `send-keys` usage | Arbitrary text `send-keys` | Phase 43 (this phase) | Enables co-pilot intervention |
| Placeholder `void _enriched` in plugin.ts | Wired event forwarding | Phase 43 (this phase) | Fork receives enriched metadata |

**Deprecated/outdated:**
- Phase 42 placeholder `void _enriched` in `plugin.ts:579` — must be replaced with actual SessionManager call

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `tmux send-keys -l` flag exists for literal text sending | Code Examples | If `-l` doesn't exist, escaping logic needed |
| A2 | `tmux list-panes -F` supports `#{pane_title}` format variable | Code Examples | If not, title query needs different approach |
| A3 | The fork's `SessionManager` is accessible from Hivemind-side code at runtime | Architecture Patterns | If fork runs as separate plugin, need IPC bridge |
| A4 | OpenCode `opencode attach` session accepts `send-keys` input | send-keys Intervention | If `opencode attach` is read-only, send-keys won't reach subagent |

**Verification notes:**
- A1: `tmux send-keys -l` is documented in tmux man page [ASSUMED] — verified against tmux source in training data
- A2: `#{pane_title}` is a standard tmux format variable [ASSUMED] — needs runtime verification
- A3: Fork runs as OpenCode plugin — may not be directly importable from Hivemind. Need to check if `PluginInput` allows inter-plugin communication or if we need to call tmux CLI directly from Hivemind side.
- A4: `opencode attach` creates a terminal UI connected to the session — it should accept stdin including tmux send-keys [ASSUMED]

## Open Questions

1. **Inter-plugin communication:** Can Hivemind's plugin code directly call the fork's `SessionManager` methods, or must it go through `tmux` CLI directly?
   - What we know: Fork and Hivemind are both OpenCode plugins loaded independently
   - What's unclear: Whether OpenCode plugin API allows inter-plugin method calls
   - Recommendation: Assume CLI-only access initially; if inter-plugin API exists, use it as optimization

2. **`opencode attach` stdin behavior:** Does `opencode attach` in a tmux pane accept input from `tmux send-keys`?
   - What we know: `opencode attach` creates a TUI connected to the session
   - What's unclear: Whether the TUI processes stdin from tmux send-keys as user input
   - Recommendation: Test empirically in Wave 0; if not, alternative is OpenCode SDK's `session.prompt()` instead

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| tmux | Pane management | ✗ (macOS) | — | Mock in tests; skip real tmux calls |
| Node.js >= 20 | Build/runtime | ✓ | v22.x | — |
| opencode CLI | Pane spawn commands | ✗ | — | Mock in tests |
| Bun | Fork runtime | ✗ | — | Fork code tested separately |

**Missing dependencies with no fallback:**
- tmux and opencode CLI not available in current environment — real tmux integration must be tested in a tmux session manually

**Missing dependencies with fallback:**
- Tests mock all tmux CLI calls using `execFile` mocking (pattern already established in `tests/lib/tmux/`)

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest |
| Config file | `vitest.config.ts` (project root) |
| Quick run command | `npx vitest run tests/lib/tmux/ tests/tools/tmux-copilot.test.ts -t "copilot"` |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| REQ-01 | sendKeys sends literal text to tmux pane | unit | `npx vitest run tests/lib/tmux/ -t "sendKeys"` | ❌ Wave 0 |
| REQ-02 | listPanes returns structured pane state | unit | `npx vitest run tests/lib/tmux/ -t "listPanes"` | ❌ Wave 0 |
| REQ-03 | Grid planner computes layout from delegation tree | unit | `npx vitest run tests/lib/tmux/ -t "grid"` | ❌ Wave 0 |
| REQ-04 | Co-pilot tool validates input with Zod | unit | `npx vitest run tests/tools/tmux-copilot.test.ts` | ❌ Wave 0 |
| REQ-05 | Enriched event forwarded to fork SessionManager | unit | `npx vitest run tests/lib/tmux/ -t "enriched"` | ✅ (observers.test.ts) |
| REQ-06 | send-keys to closed pane returns graceful error | unit | `npx vitest run tests/lib/tmux/ -t "sendKeys.*closed"` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run tests/lib/tmux/ tests/tools/tmux-copilot.test.ts`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green + typecheck clean before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `tests/lib/tmux/tmux-extended.test.ts` — covers REQ-01 (sendKeys), REQ-02 (listPanes)
- [ ] `tests/lib/tmux/grid-planner.test.ts` — covers REQ-03 (grid planner)
- [ ] `tests/tools/tmux-copilot.test.ts` — covers REQ-04 (tool validation), REQ-06 (error handling)
- [ ] Framework install: not needed — Vitest already configured

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | — (tmux session implies local auth) |
| V3 Session Management | no | — |
| V4 Access Control | yes | Tool validates sessionId exists in tracked sessions before send-keys |
| V5 Input Validation | yes | Zod schema on co-pilot tool input; `quoteShellArg` for tmux commands |
| V6 Cryptography | no | — |

### Known Threat Patterns for Tmux Integration

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Command injection via send-keys text | Tampering | `send-keys -l` literal mode + Zod input validation + max text length |
| Unauthorized pane access | Elevation of privilege | sessionId must be tracked in SessionManager; reject unknown sessions |
| Pane title injection | Spoofing | Sanitize agent names and delegation IDs before setting pane title |

## Sources

### Primary (HIGH confidence)
- `opencode-tmux/src/tmux.ts` — fork source code, verified send-keys usage at line 180
- `opencode-tmux/src/session-manager.ts` — session tracking, spawn/close lifecycle
- `src/features/tmux/integration.ts` — Hivemind tmux integration factory
- `src/features/tmux/observers.ts` — event enrichment pattern
- `src/plugin.ts` lines 569-582 — current wiring with placeholder

### Secondary (MEDIUM confidence)
- `.planning/phases/42-tmux-visual-orchestration-layer-fork-extension/42-SPEC.md` — Phase 42 boundaries (Phase 43 explicitly out-of-scope)
- `.planning/seeds/tmux-visual-orchestration-layer-2026-05-31.md` — seed idea for visual orchestration

### Tertiary (LOW confidence)
- tmux `send-keys -l` flag behavior [ASSUMED] — from training data, not verified against current tmux version

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new packages; all based on existing Node built-ins and project dependencies
- Architecture: HIGH — Phase 42 established clear patterns; Phase 43 extends naturally
- Pitfalls: MEDIUM — inter-plugin communication assumption needs runtime validation (A3)

**Research date:** 2026-05-31
**Valid until:** 2026-06-30 (stable — tmux API doesn't change frequently)
