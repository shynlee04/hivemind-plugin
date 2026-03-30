# HiveMind UI/UX Harness — Multi-Round Remediation Plan

**Date:** 2026-03-30  
**Branch:** `v2.9.5-detox-dev`  
**Status:** DRAFT — awaiting user authorization per round  
**Author:** Hiveminder (orchestrator)

---

## Corrected Baseline Assessment

### What Was Claimed vs What's True

| Claim (prior report) | Reality (post-screenshot) |
|---|---|
| "Pipeline works end-to-end" | Data flow works. Visual render is broken. |
| "TUI renders properly" | Not verified — screenshot was browser only |
| "Interactive elements functional" | Select/Tabs/Buttons exist in spec but render as collapsed text |
| "30/30 tests pass" | Tests pass but test WHAT, not HOW IT LOOKS |
| "Side-car has working Save/Reset" | Save logs to console. Reset changes in-memory state. Neither persists. |

### The Truth

We have a **working data pipeline** feeding a **broken visual layer**. The spec builds correctly. The file writes. The API reads. The renderer fires. But what the user sees is an unstyled, collapsed, near-plaintext dump. We built the nervous system and forgot the skin.

---

## Architecture Vision (from user requirements)

```
┌──────────────────────────────────────────────────────────────┐
│                        OpenCode SDK                           │
│  Session lifecycle · Agent dispatch · Tool invocation         │
│  Permission gates · Command execution · Event hooks           │
└───────────────────────────────┬──────────────────────────────┘
                                │
┌───────────────────────────────▼──────────────────────────────┐
│                    HiveMind Harness Core                      │
│  Plugin registry · Schema validation · Gatekeeping            │
│  Workflow engine · Skill catalog · Governance config           │
└───────────────────────────────┬──────────────────────────────┘
                                │
┌───────────────────────────────▼──────────────────────────────┐
│                    UI Renderer Layer                           │
│  @json-render/react (shadcn) · @json-render/ink (TUI)         │
│  JSON spec → interactive components                           │
│  SSE/WebSocket for real-time updates                          │
└───────────────────────────────┬──────────────────────────────┘
                                │
┌───────────────────────────────▼──────────────────────────────┐
│                    E2E Testing Layer                           │
│  agent-browser (headless Chrome, snapshot-ref pattern)         │
│  Automated visual + interaction verification                  │
└──────────────────────────────────────────────────────────────┘
```

### Integration Points

| Point | Protocol | Direction |
|---|---|---|
| Harness → SDK | `client.session.*`, `client.tool.*`, `client.config.*` | Outbound RPC |
| SDK → UI | JSON spec writes to `.hivemind/activity/state/` | Push |
| UI → SDK | Side-car API routes proxy to OpenCode `/api/v1/` | Pull/Push |
| UI ↔ User | Browser (Next.js) + TUI (ink) | Bidirectional |
| Tests → UI | agent-browser CLI (snapshot, click, evaluate) | Verification |

---

## Multi-Round Plan

### Round 0: Visual Foundation (CSS + Layout)
**Goal:** Make the side-car look like an actual UI  
**Requires:** User authorization  
**Effort:** Small (1 session)

| Task | Scope | Files |
|---|---|---|
| Add `@theme` tokens to `globals.css` | CSS | `apps/side-car/app/globals.css` |
| Verify shadcn component styling works | Verification | Browser test |
| Add base styles (fonts, spacing, reset) | CSS | `apps/side-car/app/globals.css` |

**Gate:** Dashboard renders with visible cards, styled buttons, proper tabs, bordered inputs.  
**Exit:** Screenshot comparison — before vs after.

---

### Round 1: Settings Persistence (Save/Reset/Poll)
**Goal:** Make Save actually save, make the dashboard stay in sync  
**Requires:** User authorization  
**Effort:** Medium (1–2 sessions)

| Task | Scope | Files |
|---|---|---|
| Wire `saveSettings` → PATCH `/api/config` → `hivemind_hm_setting` | API | `apps/side-car/lib/registry.tsx`, `apps/side-car/app/api/config/route.ts` |
| Wire `resetSettings` → same API path with defaults | API | `apps/side-car/lib/registry.tsx` |
| Add polling (`setInterval(fetch, 5000)`) to page.tsx | React | `apps/side-car/app/page.tsx` |
| Add toast/notification on save success/failure | UI | `apps/side-car/lib/registry.tsx` |

**Gate:** Open dashboard → change language → Save → refresh → language persists.  
**Exit:** agent-browser E2E: `open localhost:3001 → snapshot → click Save → snapshot → verify state change`.

---

### Round 2: Session Management UI
**Goal:** Create/resume/monitor sessions from the dashboard  
**Requires:** User authorization  
**Effort:** Large (2–3 sessions)

| Task | Scope | Files |
|---|---|---|
| New route: `/api/sessions` → `client.session.list()` | API | New file |
| New route: `/api/sessions/create` → `client.session.create()` | API | New file |
| New route: `/api/sessions/:id` → `client.session.get()` | API | New file |
| Session list panel in dashboard (left pane upgrade) | Spec | `src/tools/hivefiver-setting/spec-builder.ts` |
| Session detail panel (right pane addition) | Spec | New spec-builder module |
| Real-time session status via polling or SSE | React | `apps/side-car/app/page.tsx` |

**Gate:** Dashboard shows active sessions with status. Click session → detail loads. Create session → appears in list.  
**Exit:** agent-browser E2E: full session lifecycle test.

---

### Round 3: Dynamic Dashboard Architecture
**Goal:** Multi-pane, nested hierarchy, on-demand artifact rendering  
**Requires:** User authorization  
**Effort:** Large (2–3 sessions)

| Task | Scope | Files |
|---|---|---|
| Layout engine: configurable pane system | Core | New `src/ui/layout/` module |
| Nested shelf component (accordion/tree) | Spec | Extend spec-builder |
| Artifact renderer: markdown, PDF, slides | Plugin | New `src/ui/artifacts/` module |
| Inline comment system with agent feedback loop | API + React | New routes + components |
| Tab system: dynamic tab creation from workflow state | Spec | Extend spec-builder |

**Gate:** Dashboard shows multiple tabs, each with nested shelves. Artifact renders on click. Comment box sends message to agent.  
**Exit:** agent-browser E2E: navigate tabs → expand shelf → render artifact → submit comment.

---

### Round 4: Agent Interaction Layer
**Goal:** Inject prompts, trigger delegations, see progress  
**Requires:** User authorization  
**Effort:** Large (2–3 sessions)

| Task | Scope | Files |
|---|---|---|
| Prompt injection UI (textarea + send) | React | New component |
| Background delegation trigger (button → `client.session.create()` with agent config) | API + React | New route + component |
| Progress bar component (polling session status) | Spec | Extend spec-builder |
| Live log stream (SSE or polling) | API + React | New route + component |
| Integration with `hivemind_trajectory` for workflow state | Hook | Connect trajectory to UI |

**Gate:** Type prompt → agent receives it. Click "Delegate" → new subagent starts. Progress bar updates. Logs stream in real-time.  
**Exit:** agent-browser E2E: inject prompt → verify agent responds.

---

### Round 5: Workflow & Skill Builder
**Goal:** Compose chains of commands/tools/skills via wizard UI  
**Requires:** User authorization  
**Effort:** Large (3–4 sessions)

| Task | Scope | Files |
|---|---|---|
| Skill catalog browser (read `skills/` directory) | API | New route |
| Command catalog browser (read `command-bundles.ts`) | API | New route |
| Chain builder: drag-and-drop or step wizard | React | New components |
| Schema validation: validate chain against Hivemind schema | Core | Extend schema-kernel |
| Execution trigger: run composed chain via `client.command.*` | API | New route |
| Result display: show chain execution results | Spec | Extend spec-builder |

**Gate:** Browse skills → pick 3 → arrange in chain → validate → trigger → see results.  
**Exit:** agent-browser E2E: full builder flow.

---

### Round 6: Configuration & Governance Polish
**Goal:** One-click init/settings/doctor, polished config flow  
**Requires:** User authorization  
**Effort:** Medium (1–2 sessions)

| Task | Scope | Files |
|---|---|---|
| `hm-init` dashboard flow (guided onboarding) | Spec | Extend spec-builder |
| `hm-doctor` dashboard flow (diagnostics panel) | Spec | Extend spec-builder |
| Settings change → re-prompt current session | API | Wire `client.session.*` |
| Config versioning and rollback UI | API + React | New route + component |
| Remove deprecated `formatCurrentConfig`/`formatLanguageField` | Cleanup | `src/tools/hivefiver-setting/render.ts` |
| Register `commands/hm-settings.md` or delete the noise | Cleanup | `src/commands/slash-command/command-bundles.ts` |

**Gate:** Click hm-init → guided setup runs. Click hm-doctor → diagnostics panel shows. Change setting → session re-prompts with new config.  
**Exit:** agent-browser E2E: init flow + settings flow.

---

### Round 7: E2E Testing Harness
**Goal:** Automated visual + interaction verification via agent-browser  
**Requires:** User authorization  
**Effort:** Medium (1–2 sessions)

| Task | Scope | Files |
|---|---|---|
| Install `agent-browser` as dev dependency | Config | `apps/side-car/package.json` |
| Create test suite: dashboard rendering | Tests | New `tests/e2e/dashboard.test.ts` |
| Create test suite: settings persistence | Tests | New `tests/e2e/settings.test.ts` |
| Create test suite: session management | Tests | New `tests/e2e/sessions.test.ts` |
| Create test suite: agent interaction | Tests | New `tests/e2e/agent-interaction.test.ts` |
| CI integration: run E2E on `npm test` | Config | `package.json` scripts |

**Gate:** `npm run test:e2e` passes all suites. Visual regression baseline captured.  
**Exit:** All E2E tests green. Screenshot baselines stored.

---

## Round Dependencies

```
Round 0 (CSS) ──→ Round 1 (Persistence) ──→ Round 2 (Sessions)
                                                 │
                                                 ├──→ Round 3 (Dashboard)
                                                 ├──→ Round 4 (Agent Interaction)
                                                 └──→ Round 6 (Config Polish)
                                                           │
                                                           └──→ Round 5 (Workflow Builder)
                                                                      │
                                                                      └──→ Round 7 (E2E Testing)
```

**Round 0** is the gate — nothing else is visible without it.  
**Round 1** is the foundation — nothing persists without it.  
**Round 2** unlocks Rounds 3, 4, 6 in parallel.  
**Round 5** depends on Round 6 (needs catalog browser).  
**Round 7** depends on all prior rounds (tests what exists).

---

## Decision Points Per Round

| Round | Decision | Options |
|---|---|---|
| 0 | Theme approach | A: shadcn defaults / B: custom HiveMind theme |
| 1 | Persistence method | A: PATCH `/api/config` (existing) / B: new dedicated endpoint |
| 2 | Real-time protocol | A: Polling (simple) / B: SSE (medium) / C: WebSocket (complex) |
| 3 | Layout engine | A: Extend spec-builder / B: New layout module |
| 4 | Prompt injection | A: Direct tool call / B: Via session API |
| 5 | Builder UI | A: Step wizard (simpler) / B: Drag-and-drop (complex) |
| 7 | E2E framework | A: agent-browser CLI / B: Playwright directly |

---

## Artifact Tracking

| Artifact | Location | Updated |
|---|---|---|
| This plan | `docs/plans/2026-03-30-dashboard-ui-ux-remediation-plan.md` | 2026-03-30 |
| Continuity state | `.hivemind/activity/sessions/continuity.json` | After each round |
| Dashboard spec | `.hivemind/activity/state/dashboard-spec.json` | Runtime |
| E2E baselines | `tests/e2e/baselines/` | Round 7 |
| Research report | `.hivemind/activity/agents/hiverd/research-report-agent-browser-2026-03-30.md` | 2026-03-30 |
