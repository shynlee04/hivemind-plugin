# Dashboard-v2 Phase 8 W2.4 Mouse Path Declaration

> Date: 2026-02-26
> Wave: `W2.4` (mouse capability audit + interaction matrix closeout)
> Scope: docs + contract only (no `src/**` changes)

---

## 1) Evidence (Files/Lines Inspected)

Primary runtime and interaction files inspected:
- `src/dashboard-v2/src/index.tsx:239` -> renderer creation is `createCliRenderer()` with no mouse capability options.
- `src/dashboard-v2/src/index.tsx:159` -> footer advertises keyboard navigation hints (`Tab/j/k`, `1-7`, `r`, `cmaxt`, `l`, `?`, `q`), no mouse hint.
- `src/dashboard-v2/src/hooks/useKeyboardHandler.ts:20` -> single stdin `data` handler (`chunk`-based keyboard parsing).
- `src/dashboard-v2/src/hooks/useKeyboardHandler.ts:34` -> tab-next via keyboard chunks.
- `src/dashboard-v2/src/hooks/useKeyboardHandler.ts:38` -> tab-prev via keyboard chunks.
- `src/dashboard-v2/src/hooks/useKeyboardHandler.ts:42` -> refresh via `r`.
- `src/dashboard-v2/src/hooks/useKeyboardHandler.ts:47` -> session-create modal via `c`.
- `src/dashboard-v2/src/hooks/useKeyboardHandler.ts:55` -> message modal via `m`.
- `src/dashboard-v2/src/hooks/useKeyboardHandler.ts:68` -> command modal via `x`.
- `src/dashboard-v2/src/hooks/useKeyboardHandler.ts:81` -> todos action via `t`.
- `src/dashboard-v2/src/hooks/useKeyboardHandler.ts:106` -> agents summary via `a`.
- `src/dashboard-v2/src/hooks/useKeyboardHandler.ts:115` -> direct tab set via `1..7`.
- `src/dashboard-v2/src/hooks/useKeyboardHandler.ts:125` -> help overlay toggle via `?`.
- `src/dashboard-v2/src/hooks/useKeyboardHandler.ts:129` -> exit via `q`/Ctrl-C.
- `src/dashboard-v2/src/snapshot.ts:423` -> explicit boundary statement: keyboard-first, no hidden mouse-only behavior.

Negative evidence from symbol scan:
- No mouse handlers found in `src/dashboard-v2/src/**/*.ts(x)` for `onMouse`, `useMouse`, `enableMouseMovement`.
- No click/pointer handlers found in `src/dashboard-v2/src/**/*.ts(x)` for `onClick`, `mouseDown`, `pointer`.

---

## 2) Capability Verdict

- Current architecture is keyboard-first.
- Explicit mouse interaction support is not wired in renderer config or event handlers.
- Mouse lane is closed as unsupported-in-current-wave with controlled defer (Phase 9 obligations).

---

## 3) Supported Paths (Mouse Lane)

| Path | Status | Evidence | Notes |
|---|---|---|---|
| Direct mouse click to change tab | Unsupported | `src/dashboard-v2/src/index.tsx:239`, `src/dashboard-v2/src/hooks/useKeyboardHandler.ts:20` | No mouse event source/handler present |
| Direct mouse click to open help | Unsupported | `src/dashboard-v2/src/hooks/useKeyboardHandler.ts:125` | Help is keyboard-triggered (`?`) only |
| Direct mouse click to open modal actions (`c/m/x`) | Unsupported | `src/dashboard-v2/src/hooks/useKeyboardHandler.ts:47`, `src/dashboard-v2/src/hooks/useKeyboardHandler.ts:55`, `src/dashboard-v2/src/hooks/useKeyboardHandler.ts:68` | Actions mapped only to key chunks |

---

## 4) Unsupported Paths and Reasons

| Path | Reason | Evidence |
|---|---|---|
| Pointer/click target dispatch in UI nodes | No pointer/click handler contracts in dashboard-v2 components | symbol scan (no `onClick`/`pointer`) + `src/dashboard-v2/src/index.tsx:102` navigation is render-only |
| Mouse-enabled renderer behavior | Renderer instantiated without mouse options contract | `src/dashboard-v2/src/index.tsx:239` |
| Mouse-only workflow affordances | Product boundary explicitly forbids hidden mouse-only behavior | `src/dashboard-v2/src/snapshot.ts:423` |

---

## 5) Interaction Matrix (Mouse Lane Closeout)

| Trigger | Precondition | Transition | Feedback | Failure Handling |
|---|---|---|---|---|
| Left click on sidebar tab row | Dashboard mounted, pointer device present | No state transition (`activeTab` unchanged) | Existing selected tab stays highlighted | Use keyboard fallback (`Tab/j/k` or `1..7`) |
| Left click on help label/region | Dashboard mounted, no modal | No state transition (`helpOverlay` unchanged) | No overlay toggle from mouse action | Use `?` to toggle help; `Esc/?/q` to close |
| Left click on footer action labels (`r/c/m/x/t/a/l/q`) | Dashboard mounted | No state transition from mouse path | No command/action executed | Use corresponding keyboard key path |
| Scroll wheel over views/panels | Dashboard mounted | No explicit pagination/scroll transition in interaction contract | Terminal default behavior only (non-contractual) | Use tab/navigation keys for deterministic movement |

---

## 6) Keyboard Fallback Behavior Table

| Intent | Keyboard Trigger | Transition | Failure Guard |
|---|---|---|---|
| Navigate tabs | `Tab`, `j`, `k`, arrow sequences, `1..7` | `TAB_NEXT` / `TAB_PREV` / `TAB_SET` | None required beyond key parsing |
| Refresh snapshot | `r` | refresh call + `LAST_ACTION=Refreshed` | N/A |
| Create session | `c` | open `session-create` modal | blocks with server offline message |
| Send message | `m` | open `message` modal (session required) | server/session availability checks |
| Execute command | `x` | open `command` modal (session required) | server/session availability checks |
| List todos | `t` | action-loading + todos summary | server/session availability checks |
| Toggle language | `l` | `SET_LANG` and status message | N/A |
| Toggle help overlay | `?` | `TOGGLE_HELP_OVERLAY` | when overlay open, `?`/`Esc`/`q` closes |
| Quit app | `q` or Ctrl-C | renderer destroy | deterministic exit path |

---

## 7) Phase 9 Defer Obligations

| Obligation | Owner | Verification Requirement |
|---|---|---|
| P9.1 Mouse reliability contract | Dashboard-v2 maintainers | Add explicit renderer/input mouse capability decision and verify no-op safety on unsupported terminals |
| P9.2 Interaction ownership refactor | Dashboard-v2 maintainers | Define per-panel pointer routing ownership before enabling click behaviors |
| P9.3 Mixed-input regression gate | QA/Release lane | Run keyboard+mouse interaction E2E checklist before production readiness sign-off |

---

## 8) Gate Decision

- W2.4 decision: `partial`
- Rationale: keyboard lane is explicit and deterministic; mouse lane is explicitly unsupported and now formally documented with Phase 9 obligations.
- Carry-forward status: controlled defer (no silent carry-forward).
