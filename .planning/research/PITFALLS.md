# Domain Pitfalls

**Domain:** OpenCode-native AI coding governance plugin/CLI with runtime orchestration, deterministic agent execution, and terminal UI
**Project:** HiveMind Runtime Refactor and Deterministic Execution Migration
**Researched:** 2026-03-17

## Critical Pitfalls

Mistakes here usually force architectural rework, invalidate runtime claims, or make determinism impossible to prove.

### Pitfall 1: Control Plane and Execution Plane Collapse
**Confidence:** HIGH - directly supported by current OpenCode SDK/server/plugin docs and this repo's active sector governance.

**What goes wrong:** Projects mix `@opencode-ai/sdk` orchestration code with `@opencode-ai/plugin` runtime code, or create fresh client/server instances inside hooks and tools instead of using the provided plugin context.

**Why it happens:** OpenCode supports both a programmatic server/client plane and an in-loop plugin/tool plane. Teams treat them as interchangeable because both can reach sessions, tools, and the TUI.

**Warning signs:**
- Hooks or tool files create their own OpenCode server/client instead of using injected `client`
- CLI/control-plane modules import plugin-only helpers like `tool()` or hook contracts
- Sessions appear to exist, but tool execution, events, or TUI state belong to a different instance
- Bugs reproduce only when using `serve`, `attach`, or harness automation

**Consequences:** Detached sessions, duplicated runtimes, random "works in harness but not in live OpenCode" failures, and in the worst case recursive or split-brain behavior across instances.

**Prevention:**
- Keep `@opencode-ai/sdk` usage in CLI/control-plane orchestration only
- Keep `@opencode-ai/plugin` usage in plugin/hooks/tools only
- Use `createOpencode()` or `createOpencodeClient()` only where the control plane owns process lifecycle
- In plugins, use the provided `client`, hook surfaces, and `tool.schema`/`tool()` primitives rather than rehydrating runtime access yourself

**Detection:**
- Grep for `createOpencode(` or `createOpencodeClient(` inside plugin/hook/tool code
- Grep for `@opencode-ai/plugin` imports inside CLI/control-plane code
- Run live probes against one known server URL and confirm sessions, events, and tool IDs all resolve from the same instance

**Roadmap phase:** Phase 1 - Runtime Boundary Alignment

### Pitfall 2: Treating Mocks, Health Checks, or Local Harness Runs as Runtime Proof
**Confidence:** HIGH - official OpenCode docs establish the authoritative HTTP/SSE/server boundary; project governance explicitly requires live proof.

**What goes wrong:** Teams claim plugin correctness or deterministic execution based on mocked `PluginInput`, local unit tests, or harness-only health checks without verifying behavior through a real OpenCode server/client/plugin load path.

**Why it happens:** Mock-based tests are faster and easier to automate than live plugin loading, event streaming, permission flows, and TUI attachment.

**Warning signs:**
- Test suites never exercise `opencode serve`, `createOpencodeClient()`, or `client.event.subscribe()`
- Completion notes say "verified" but only cite unit tests or synthetic runtime JSON
- No proof that hooks fire in the actual load order or that tool interception works in a live session

**Consequences:** False confidence, repeated regressions at integration time, and governance drift where documentation and shipped runtime behavior quietly diverge.

**Prevention:**
- Classify evidence explicitly: mock, local slice, or live OpenCode proof
- Add live verification gates for plugin load, session creation, event subscription, tool interception, and TUI control endpoints
- Require at least one official-interface proof path before claiming determinism or runtime readiness

**Detection:**
- Check whether CI or manual verification hits `/global/health`, `/event`, `/experimental/tool/ids`, session APIs, and TUI endpoints on a real server
- Fail reviews when runtime claims lack either official docs or live server evidence

**Roadmap phase:** Phase 1 - Live Proof Baseline

### Pitfall 3: Toolless Agents and Prompt-Only Orchestration
**Confidence:** HIGH - official docs show custom tools, tool hooks, permissions, and experimental tool listing as first-class surfaces.

**What goes wrong:** Harness agents and orchestration layers rely on prompts, markdown conventions, or slash-command prose instead of registered tools and official runtime APIs.

**Why it happens:** Prompt-only orchestration feels faster in brownfield systems because it avoids rebuilding tool contracts, schemas, and event assertions.

**Warning signs:**
- Harness runs cannot show which tools were available or invoked
- Runtime control depends on system-prompt instructions like "always use this workflow" without tool-level enforcement
- There is no assertion around `tool.execute.before` / `tool.execute.after` activity
- Agent behavior changes materially by model choice because control is mostly prompt-shaped

**Consequences:** Non-deterministic behavior, weak runtime control, inability to prove that agents can actually operate the system programmatically, and fragile automation that breaks under model or prompt drift.

**Prevention:**
- Route critical writes and runtime actions through explicit tools
- Use `tool.schema` contracts and inspect effective tool availability via official APIs
- Assert tool interception events in live sessions, not only in local mocks
- Keep slash commands and prompts as thin entry surfaces over tool-backed behavior

**Detection:**
- Verify sessions expose the expected tool IDs from the live server
- Confirm harness traces include tool calls, permission decisions, and resulting state changes

**Roadmap phase:** Phase 2 - Deterministic Tool Control

### Pitfall 4: Fragmented Runtime Truth Across CLI, Plugin, TUI, and Generated State
**Confidence:** HIGH - supported by project governance and official docs showing one server with multiple clients and TUI control APIs.

**What goes wrong:** Different layers each own their own session, workflow, status, or readiness model. The CLI thinks one thing, the plugin another, the TUI a third, and generated runtime files become a fourth pseudo-authority.

**Why it happens:** Brownfield systems accrete temporary adapters, caches, and compatibility shims faster than they retire them.

**Warning signs:**
- Similar status or session concepts are defined in multiple layers
- Root markdown assets, `.hivemind/`, control-plane state, and TUI state each claim to be authoritative
- A fix in backend runtime status does not automatically fix what the TUI shows
- Frontend hangs correlate with stale or duplicated orchestration state

**Consequences:** Split-brain UI, stale diagnostics, impossible-to-reason-about migrations, and repeated rewrites because every feature restoration has to rediscover which layer is real.

**Prevention:**
- Choose one authoritative contract owner per concern
- Treat root markdown and runtime-generated artifacts as projections, not execution authorities
- Bind TUI actions to the same server-backed control plane used by backend orchestration
- Make schema-kernel/control-plane ownership explicit before restoring higher-level features

**Detection:**
- Inventory duplicate session/status/workflow structures before each migration slice
- Require a map from every user-visible status field back to one owning source

**Roadmap phase:** Phase 2 - Contract Consolidation, then Phase 4 - TUI Binding

### Pitfall 5: Losing State Across Compaction, Resume, Fork, and Attach Flows
**Confidence:** HIGH - official plugin docs document `experimental.session.compacting`; official CLI/TUI docs document resume, attach, and multi-client flows.

**What goes wrong:** Deterministic runtime state lives only in ephemeral prompts or in-memory objects, so compaction, resume, fork, or attach flows discard the real execution context.

**Why it happens:** Teams optimize for the happy path of one uninterrupted session and treat compaction or reattachment as edge cases.

**Warning signs:**
- After compaction, agents repeat work or lose the active plan
- Attached TUI sessions cannot accurately resume backend state
- Handoffs depend on conversational memory rather than a structured runtime record
- Forked or resumed sessions behave differently from fresh ones without an explicit reason

**Consequences:** Apparent nondeterminism, duplicate work, broken handoff chains, and frontend sessions that look connected but are missing the actual runtime story.

**Prevention:**
- Persist the minimum deterministic state needed for continuation in an authoritative store
- Use compaction hooks to inject only missing domain state, not to smuggle whole runtime systems through prompts
- Verify `session.compacted`, resume, and attach flows against the live server

**Detection:**
- Run a live sequence: create session -> execute tools -> compact -> attach or resume -> continue execution -> compare state
- Fail the slice if the resumed system cannot explain its current task, tool context, and pending next step

**Roadmap phase:** Phase 3 - Continuation and Handoff Integrity

## Moderate Pitfalls

### Pitfall 6: Plugin Load-Order and Name-Collision Surprises
**Confidence:** HIGH - official plugin and custom tool docs define load order and state that custom tools override built-ins on name collision.

**What goes wrong:** A local plugin, npm plugin, or custom tool silently overrides another surface, especially when using names like `bash`, `read`, or `edit`.

**Warning signs:**
- Behavior differs between clean machines and contributor machines
- The same package works differently in project scope vs global scope
- Tool lists differ unexpectedly after install or startup

**Consequences:** Hidden behavior changes, accidental security holes, debugging confusion, and "ghost" regressions caused by environment-specific plugin loading.

**Prevention:**
- Use unique tool names unless override is intentional and tested
- Validate effective plugin load order and effective tool IDs in a clean workspace
- Keep project-local runtime projection minimal so plugin precedence stays inspectable

**Roadmap phase:** Phase 2 - Tool Surface Hardening

### Pitfall 7: Implementing Governance in Prompts Instead of Permissions and Hooks
**Confidence:** HIGH - official permissions docs and plugin hook docs provide explicit enforcement surfaces.

**What goes wrong:** Teams rely on system prompts like "do not mutate state" instead of permission policies, `permission.ask`, and tool interception hooks.

**Warning signs:**
- Safety depends on natural-language rules rather than config or hooks
- The same agent is safe in one model and unsafe in another
- Permission prompts appear inconsistently or not at all for risky actions

**Consequences:** Weak enforcement, inconsistent approvals, brittle automation, and unsafe behavior whenever prompts or models shift.

**Prevention:**
- Put enforcement in permission config and hooks, not in prose alone
- Use agent-specific permission overrides for specialist agents
- Test denial, ask, and allow paths with live sessions

**Roadmap phase:** Phase 2 - Enforcement and Runtime Guardrails

### Pitfall 8: TUI and Backend Split-Brain
**Confidence:** HIGH - official docs show the TUI is a client of the server and can be driven through server TUI endpoints or `attach`.

**What goes wrong:** The frontend evolves as a separate app model rather than a thin client over the server-backed runtime contract.

**Warning signs:**
- TUI actions update local UI state before or without server acknowledgment
- Frontend code invents its own session lifecycle instead of using official session/TUI APIs
- Backend fixes do not resolve hanging UI behavior
- `tui.json` and `opencode.json` responsibilities get mixed together

**Consequences:** Hanging UI flows, stale prompts, impossible remote attach behavior, and expensive frontend rework whenever the backend contract changes.

**Prevention:**
- Treat the TUI as a client of the server, not a second runtime
- Use official TUI/session APIs for prompt submission, command execution, toasts, and attachment
- Keep visual state derived from authoritative runtime state wherever possible

**Roadmap phase:** Phase 4 - OpenTUI Convergence

### Pitfall 9: Configuration Scope Blindness
**Confidence:** HIGH - official docs define separate config scopes, plugin directories, permissions, and TUI config.

**What goes wrong:** The system works only with one developer's global config or hidden local plugin setup, while project-scoped behavior is incomplete or shadowed.

**Warning signs:**
- Repro steps only work after manual local setup outside the repo
- Bugs disappear when a maintainer runs them but fail in clean environments
- Global plugins or permissions silently mask project problems

**Consequences:** Environment-specific runtime behavior, poor reproducibility, and migrations that appear complete but fail for consumers.

**Prevention:**
- Verify global, project, and runtime-projected scopes separately
- Test with clean config directories and minimal global plugins
- Keep consumer-critical behavior in shipped package surfaces, not in undocumented local state

**Roadmap phase:** Phase 1 - Brownfield Baseline Audit

## Minor Pitfalls

### Pitfall 10: Treating Runtime Projection Artifacts as Authoring Surfaces
**Confidence:** MEDIUM - strongly supported by this repo's governance; only indirectly supported by official OpenCode docs.

**What goes wrong:** Teams edit generated runtime files or projected command/agent markdown as if they were the real implementation.

**Warning signs:**
- Fixes land in generated or consumer-local projection paths instead of the owning source sector
- Runtime sync regenerates and appears to "undo" valid fixes

**Consequences:** Permanent drift between source and runtime, confusing review history, and fragile installs.

**Prevention:**
- Make projection vs authority explicit in every migration slice
- Fix the owner surface, then regenerate or sync projections

**Roadmap phase:** Phase 1 - Source of Truth Cleanup

### Pitfall 11: Restoring Features Before Runtime Determinism Exists
**Confidence:** MEDIUM - mostly project-specific, but common in brownfield orchestration refactors.

**What goes wrong:** Teams re-expand docs, intelligence features, or UI capability before proving the runtime/control-plane contract.

**Warning signs:**
- New surface area lands while live proof gaps remain open
- Roadmap work restores capability faster than it hardens runtime evidence

**Consequences:** More drift, broader blast radius, and repeated rollback/rewrite cycles.

**Prevention:**
- Gate restoration behind live proof and contract ownership milestones
- Restore features only after the relevant runtime boundary is verified

**Roadmap phase:** Phase 5 - Feature Restoration

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Phase 1 - Runtime boundary alignment | Control-plane/execution-plane collapse; config-scope blindness; projection files mistaken for source | Freeze authority map first, audit imports and instance creation, verify on clean config and one live server |
| Phase 1 - Live proof baseline | Mock-only verification | Add live OpenCode proof suite for server, sessions, events, tools, and plugin load before broader refactor claims |
| Phase 2 - Deterministic tool control | Toolless agents; prompt-only governance; plugin load-order surprises | Make tools the control surface, assert hook activity, inspect effective tool IDs and permissions in live runs |
| Phase 2 - Contract consolidation | Fragmented runtime truth | Collapse duplicate session/status/workflow ownership into one contract owner before expanding capabilities |
| Phase 3 - Continuation and handoff | State loss across compact/resume/fork/attach | Persist structured state and verify continuation flows end to end against live session APIs |
| Phase 4 - OpenTUI convergence | TUI/backend split-brain | Bind the frontend to session and TUI APIs from the same server, not a parallel local state machine |
| Phase 5 - Feature restoration | Re-expanding surface area before runtime stability | Restore features only after the underlying runtime boundary has live proof and one owner |

## Sources

- HIGH - OpenCode SDK docs, `https://opencode.ai/docs/sdk/` (last updated Mar 15, 2026)
- HIGH - OpenCode Server docs, `https://opencode.ai/docs/server/` (last updated Mar 15, 2026)
- HIGH - OpenCode Plugins docs, `https://opencode.ai/docs/plugins/` (last updated Mar 15, 2026)
- HIGH - OpenCode Custom Tools docs, `https://opencode.ai/docs/custom-tools/` (last updated Mar 15, 2026)
- HIGH - OpenCode CLI docs, `https://opencode.ai/docs/cli/` (last updated Mar 15, 2026)
- HIGH - OpenCode TUI docs, `https://opencode.ai/docs/tui/` (last updated Mar 15, 2026)
- HIGH - OpenCode Permissions docs, `https://opencode.ai/docs/permissions/` (last updated Mar 15, 2026)
- HIGH - Repo governance authority, `/Users/apple/hivemind-plugin/s/ecosystem-revamp/AGENTS.md`
- HIGH - Repo source boundary authority, `/Users/apple/hivemind-plugin/s/ecosystem-revamp/src/AGENTS.md`
- HIGH - Repo plugin assembly authority, `/Users/apple/hivemind-plugin/s/ecosystem-revamp/src/plugin/AGENTS.md`
