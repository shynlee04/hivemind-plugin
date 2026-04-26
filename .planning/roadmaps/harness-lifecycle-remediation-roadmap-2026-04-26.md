# Harness Lifecycle Remediation Roadmap

**Date:** 2026-04-26  
**Source artifacts:**
- `.planning/codebase/harness-lifecycle-map-2026-04-26.md`
- `.planning/research/opencode-interface-research-2026-04-26.md`
- `.planning/audits/harness-lifecycle-code-review-2026-04-26.md`

**Scope:** Remediate all Critical, High, and Medium findings from the lifecycle code review through concrete GSD phases.  
**Exclusions:** No source changes in this artifact; no Markdown primitive audit; Minor findings are deferred unless they naturally support contract validation.

## Dependency Order

Existing **Phase 35** remains the immediate prerequisite because STATE documents the build as broken. After Phase 35 restores green build, execute:

1. **Phase 43: Hook Composition Observability Integrity** — CR-01.
2. **Phase 44: Tool Write-Surface & Secret Hardening** — CR-03, HIGH-05, MED-01, inline MCP secret risk.
3. **Phase 45: OpenCode SDK Permission Boundary** — CR-02, HIGH-01.
4. **Phase 46: Delegation Dispatch, Completion & Recovery Truth** — HIGH-02, HIGH-03, HIGH-04.
5. **Phase 47: Runtime Policy & Command Buffer Hardening** — MED-02, MED-03.
6. **Phase 48: Real OpenCode Runtime Integration Verification** — live proof for all remediation.

## Phase Details

### Phase 43: Hook Composition Observability Integrity

**Goal:** Tool-guard after-hook behavior and plugin-level event tracking both run in real OpenCode runtime, preserving lifecycle activity and `_harness` metadata.

**Rationale:** CR-01 shows `src/plugin.ts` defines a second `tool.execute.after` after spreading `createToolGuardHooks()`, overwriting lifecycle activity and metadata injection.

**Scope:** Compose both after-hook behaviors; preserve configure-primitive/event-tracker persistence; add regression coverage.

**Exclusions:** No broad hook-system rewrite; no unrelated event-tracker feature work.

**Severity coverage:** CR-01.

**Depends on:** Phase 35.

**Success Criteria:**
1. Tool execution after-hooks preserve both metadata injection and event-tracker persistence.
2. Lifecycle activity is observed after tool execution.
3. Regression tests fail if either branch is skipped.

**Validation commands/evidence:** `npm run typecheck`; focused hook/plugin tests; `npm test`.

**Risk notes:** Hook payload shape must be rechecked against current OpenCode plugin source and later live-verified in Phase 48.

### Phase 44: Tool Write-Surface & Secret Hardening

**Goal:** Write-capable harness tools cannot write/read outside approved roots, write success is only reported after completion, and MCP descriptors do not contain literal secrets.

**Rationale:** CR-03 exposes arbitrary absolute writes in `session-patch`; MED-01 exposes primitive path traversal; HIGH-05 reports success before writes finish. The lifecycle map also flags inline MCP secret risk.

**Scope:** Restrict `session-patch`; sanitize primitive names; await/catch `configure-primitive` writes; replace MCP literal secrets with env placeholders; add negative tests.

**Exclusions:** No broad permission redesign; no Markdown primitive content audit.

**Severity coverage:** CR-03, HIGH-05, MED-01, lifecycle-map Top Risk Signal 2.

**Depends on:** Phase 43.

**Success Criteria:**
1. Arbitrary absolute session patch paths are rejected.
2. Primitive read/inspect traversal inputs are rejected.
3. Configure-primitive write failures return failure, not success.
4. MCP descriptors use secret placeholders only.

**Validation commands/evidence:** `npm run typecheck`; focused `session-patch` and `configure-primitive` tests; static secret inspection/scan for `mcp.json`; `npm test`.

**Risk notes:** Tight path validation can break legitimate workflows; approved roots and artifact names must be explicit.

### Phase 45: OpenCode SDK Permission Boundary

**Goal:** Delegated child-session permissions and selected-agent capabilities use OpenCode-supported runtime surfaces instead of unsupported `session.create` fields.

**Rationale:** CR-02 proves `permission` is passed into `session.create` even though current SDK types allow only `parentID` and `title`; HIGH-01 shows hard-coded delegated permissions ignore selected agent primitives.

**Scope:** Remove unsupported `session.create` permission payloads; resolve selected-agent primitive policy; apply harness denial overlays; add SDK shape tests.

**Exclusions:** No completion semantics changes; no agent Markdown content audit beyond runtime policy resolution needs.

**Severity coverage:** CR-02, HIGH-01.

**Depends on:** Phase 44.

**Success Criteria:**
1. Child session creation matches installed SDK request types.
2. Selected-agent policy is derived from the agent primitive or explicit fallback.
3. Recursive delegation remains denied without globally overriding user-configured permissions.

**Validation commands/evidence:** `npm run typecheck`; SDK request-shape contract test; focused spawner/delegation tests; live proof deferred to Phase 48.

**Risk notes:** Permission naming has docs/source divergence; live proof is mandatory before closure.

### Phase 46: Delegation Dispatch, Completion & Recovery Truth

**Goal:** Delegation status reflects prompt acceptance, explicit completion, and restart uncertainty honestly.

**Rationale:** HIGH-02 returns success before prompt delivery is accepted; HIGH-03 treats stability as completion; HIGH-04 terminalizes recovery after one transient status gap.

**Scope:** Await prompt acceptance or introduce created-not-yet-prompted; replace stability-only completion with explicit terminal evidence or `unknown/stalled/needs-review`; persist `unverified-after-restart` and retry before terminalizing.

**Exclusions:** No child-result harvesting beyond what is required for truthful status; no CLI/sidecar work.

**Severity coverage:** HIGH-02, HIGH-03, HIGH-04.

**Depends on:** Phase 45.

**Success Criteria:**
1. Prompt-not-yet-accepted and dispatched are distinguishable.
2. Silent/dead child sessions are not marked complete from stable message counts alone.
3. Restart recovery does not convert transient missing status into immediate terminal error.

**Validation commands/evidence:** `npm run typecheck`; focused `delegation-manager`, `sdk-delegation`, and `delegation-status` tests; recovery tests; live proof deferred to Phase 48.

**Risk notes:** Preserve coarse compatibility statuses while adding truthful detail.

### Phase 47: Runtime Policy & Command Buffer Hardening

**Goal:** Runtime policy can be provided from workspace/plugin configuration, and headless command output is bounded.

**Rationale:** MED-02 shows policy fields exist but plugin startup ignores workspace config; MED-03 shows unbounded headless output accumulation.

**Scope:** Accept/validate plugin options or project-local policy; pass parsed policy to `loadRuntimePolicy(workspacePolicy)`; cap headless output and expose truncation metadata.

**Exclusions:** No auto-loop engine; no sidecar; no broad config workflow redesign.

**Severity coverage:** MED-02, MED-03.

**Depends on:** Phase 46.

**Success Criteria:**
1. Workspace policy overrides affect runtime behavior through validated input.
2. Invalid policy is rejected with actionable errors.
3. Noisy headless command output is capped with visible truncation metadata.

**Validation commands/evidence:** `npm run typecheck`; runtime-policy tests; command-delegation output-cap tests; `npm test`.

**Risk notes:** Policy loading must keep safe defaults and avoid untrusted config broadening write surfaces.

### Phase 48: Real OpenCode Runtime Integration Verification

**Goal:** Prove the remediated harness loads and behaves correctly in a live OpenCode runtime, not just mocks.

**Rationale:** Research identifies unresolved runtime uncertainties around hook keys, permission naming, tool registration, SDK envelopes, and live server/OpenAPI behavior. The audit found mock-vs-runtime gaps.

**Scope:** Run static/package checks; start disposable `opencode serve`; load compiled plugin in a disposable fixture; verify tool IDs; probe hook payloads; exercise delegate-task/delegation-status end-to-end.

**Exclusions:** No product additions; no sidecar; no Markdown primitive audit except fixture primitives.

**Severity coverage:** Verification coverage for CR-01, CR-02, CR-03, HIGH-01 through HIGH-05, MED-01 through MED-03; research uncertainties 1-6.

**Depends on:** Phases 43-47.

**Success Criteria:**
1. Compiled plugin loads in a disposable OpenCode project.
2. Harness tool IDs are visible through OpenCode SDK/server listing.
3. Live hook payloads match source assumptions or documented adapters.
4. Real parent/child delegation can be created, prompted, observed, and polled without false lifecycle states.
5. Runtime verification evidence is captured before remediation is called complete.

**Validation commands/evidence:** `npm view @opencode-ai/sdk version time.modified dist-tags --json`; `npm view @opencode-ai/plugin version time.modified dist-tags exports --json`; `npm run typecheck`; `npm test`; `npm run build`; disposable `opencode serve` fixture checks.

**Risk notes:** Requires OpenCode CLI/runtime and disposable fixture availability; otherwise block honestly.

## Finding-to-Phase Coverage

| Finding | Severity | Assigned Phase | Disposition |
|---|---:|---|---|
| CR-01 Plugin overwrites tool-guard after hook | Critical | Phase 43 | Assigned |
| CR-02 Unsupported permission profile in `session.create` | Critical | Phase 45 | Assigned |
| CR-03 Session patch arbitrary absolute write | Critical | Phase 44 | Assigned |
| HIGH-01 Hard-coded delegated permissions ignore agent primitives | High | Phase 45 | Assigned |
| HIGH-02 Delegate-task returns success before prompt acceptance | High | Phase 46 | Assigned |
| HIGH-03 Stability polling can mark dead/silent child completed | High | Phase 46 | Assigned |
| HIGH-04 Recovery treats missing status as terminal error after 5s | High | Phase 46 | Assigned |
| HIGH-05 Configure-primitive reports success before write completes | High | Phase 44 | Assigned |
| MED-01 Primitive path traversal in read/inspect paths | Medium | Phase 44 | Assigned |
| MED-02 Runtime policy ignores workspace/user config | Medium | Phase 47 | Assigned |
| MED-03 Headless command output unbounded | Medium | Phase 47 | Assigned |

## Blockers / Unresolved Gaps

- Phase 35 must restore green build before remediation implementation phases can be honestly verified.
- Phase 48 requires local OpenCode runtime and a disposable fixture project; user authorization may be required to run/install/start it.
- MIN-01 and MIN-02 are minor findings and explicitly deferred. MIN-01 should be naturally covered by Phase 45/48 contract tests; MIN-02 can be handled later by documentation sync.
