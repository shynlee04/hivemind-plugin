# Phase BOOT-09: MVP Config Schema + Entry Init Verification — Specification

**Created:** 2026-05-12
**Ambiguity score:** 0.16 (gate: ≤ 0.20)
**Requirements:** 3 locked

## Goal

`conversation_language` and `documents_and_artifacts_language` config fields produce enforced language behavior in agent output and document writing — not just decorative text injection — via the `system.transform` hook.

## Background

### Current state (from live codebase investigation)

The `system.transform` hook (`src/hooks/lifecycle/core-hooks.ts:69-134`) currently injects governance block text, intake context, and behavioral profile metadata into every main session's system prompt. The language fields appear as **decorative metadata only**:

```
Behavioral profile context:
- language.conversation: en
- language.documents: en
```

This text is informational — no code enforces that the agent actually responds in the configured language or writes documents in the configured language. The hook fires on **every** session including child/delegated sessions, which is incorrect — child sessions (from `delegate-task`) execute automated work where language enforcement is irrelevant.

### OpenCode SDK hook interface (live-verified via Context7 + DeepWiki)

```
system.transform: (input: SystemInput, output: SystemOutput) => Promise<void>
  - input:  { sessionID?: string }
  - output: { system?: unknown }  — array of system prompt strings
```

The `system.transform` hook mutates `output.system` (string array) to inject content before the user prompt. This is the correct interface for conversation language enforcement because injected content appears at the top of the system prompt, framing the agent's behavior for the entire session.

Differentiating main vs child sessions is available through:
- `sessionID` from the hook input — can cross-reference against delegation records in `src/coordination/delegation/`
- `parentSessionID` — sessions created by `delegate-task` have a parent; main sessions do not

### Documents language enforcement

No mechanism currently enforces the language of `.md` file output. Documents are written through tool calls (write, edit) with no language validation. The `documents_and_artifacts_language` field is parsed and stored in the behavioral profile but produces no observable effect on file output.

### Hook registration (already wired)

Both hooks are already registered in `src/plugin.ts`:
- `system.transform` via `createCoreHooks()` at line 150-153
- Tool guards via `createToolGuardHooks()` at line 148

No new hook registration is needed — only logic changes within existing hooks.

## Requirements

### Requirement 1: conversation_language enforced in main session via system.transform

The `conversation_language` config field must produce an enforceable language instruction in the `system.transform` hook output, injected BEFORE the user prompt, affecting both the thinking block and the response. The instruction must ONLY be injected into main (non-delegated) sessions.

- **Current:** `language.conversation` value appears as decorative metadata text in the behavioral profile block. No enforcement. Hook fires on all sessions including child/delegated.
- **Target:** `system.transform` hook (core-hooks.ts:69) injects a language governance block at `output.system[0]` (BEFORE the existing governance block) for main sessions only. The block contains an imperative instruction with strong framing. Child/delegated sessions skip this injection entirely. Child session detection uses OpenCode's native `parentID` field on session records (cached at session entry), NOT Hivemind's DelegationManager.
- **Acceptance:**
  1. `system.transform` output.system[0] contains language governance block for main sessions (no parentID)
  2. `system.transform` output.system does NOT contain language governance block for child/delegated sessions (has parentID)
  3. Changing config from `conversation_language: "en"` to `conversation_language: "vi"` changes the injected instruction text
  4. Instruction uses imperative tone with header ("--- Language Governance ---"), "CRITICAL:" prefix, and "MUST respond in" language
  5. Instruction includes override behavior explicitly ("Even if the user writes in another language...")
  6. All existing governance block, intake context, and behavioral profile injections remain unchanged

### Requirement 2: conversation_language overrides user's writing language

The language enforcement must instruct the agent to override the user's writing language. If the user writes in English but config says Vietnamese, the agent must respond in Vietnamese.

- **Current:** No language override exists — agent responds in whatever language the user writes in.
- **Target:** The `system.transform` language block includes explicit override instruction with strong framing: a `--- Language Governance ---` header, `CRITICAL:` urgency prefix, and explicit override: "You MUST respond in LANGUAGE. Even if the user writes in another language, you MUST override and respond in LANGUAGE."
- **Acceptance:**
  1. Instruction explicitly states override behavior ("even if the user writes in [other language], you MUST respond in LANGUAGE")
  2. Instruction is injected into output.system at position 0 (before user messages) — currently governance-block.ts injects at position 0, so language must be part of or adjacent to governance block
  3. No new hooks required — logic change within existing `system.transform` handler

### Requirement 3: documents_and_artifacts_language enforced with configurable paths

Output `.md` files must be written in the configured `documents_and_artifacts_language`. The output paths are configurable in the JSON schema, support a list of base paths relative to `.hivemind/planning/`, and include subdirectory recursion.

- **Current:** No document language enforcement exists. `.md` files are written in whatever language the agent chooses.
- **Target:**
  1. A `document_paths` field is added to `HivemindConfigsSchema` as a flat array of strings with default `[".hivemind/planning/"]`
  2. Each path supports recursive subdirectory globbing; paths are resolved relative to project root
  3. **Two-layer enforcement:**
     - Layer 1: System prompt injection — combined Language Governance block includes document language instruction referencing configured paths
     - Layer 2: Tool guard — `tool.execute.before` hook injects a path-specific language reminder when Write/Edit/apply_patch tools target `.md` files under `document_paths`
  4. Paths are freely configurable via `configs.json` — validated by Zod schema
- **Acceptance:**
  1. `document_paths` field exists in schema as `z.array(z.string()).default([".hivemind/planning/"])`
  2. Default paths include `.hivemind/planning/` with recursive subdirectories
  3. Language instruction appears in system context for sessions where document writing tools are relevant
  4. `tool.execute.before` injects language reminder when Write/Edit/apply_patch targets a path under `document_paths`
  5. The language can be overridden per-path or per-document (deferred — must at minimum have global enforcement)

## Boundaries

**In scope:**
- `conversation_language` → imperative instruction injected via `system.transform` hook — main sessions only
- `documents_and_artifacts_language` → language instruction for document writing at configured paths (system prompt + tool guard)
- `document_paths` schema field (`z.array(z.string()).default([".hivemind/planning/"])`) in HivemindConfigsSchema
- Child session exclusion logic via OpenCode native `parentID` (cached at session entry) — NOT via DelegationManager
- Language block injected at `output.system[0]` before governance block
- Tool guard layer: `tool.execute.before` language reminder for Write/Edit/apply_patch at `document_paths`
- Integration with existing `system.transform` handler and `tool.execute.before` hook

**Out of scope:**
- Mode enforcement (`delegationMode`, `guardrailLevel`, `toolAccessPattern`, `skillFilter`) — deferred to WS-4
- `user_expert_level` enforcement — deferred to future phase
- Translation services or NLU language detection — language enforcement is prompt-level, not ML-level
- Output content validation (verifying agent actually complied) — enforcement is via instruction, not post-hoc validation
- All other config fields (parallelization, atomic_commit, workflow toggles, delegation_systems) — unchanged
- Session tracker or event tracker integration — handled by Phase 12 team
- Runtime policy changes — existing policy handling is unchanged

## Constraints

- Must use existing `system.transform` hook — no new hook registration in plugin.ts
- Must NOT modify the governance block format (downstream tests rely on exact string matching)
- Must NOT inject language instructions into child/delegated sessions (automated work should be language-agnostic)
- Child session detection uses OpenCode native `parentID` field (cached). NOT Hivemind's DelegationManager — native `task` tool sessions are managed by OpenCode runtime, not DelegationManager
- Config schema remains backward-compatible with v2.0.0
- No new npm dependencies
- All existing tests must pass

## Acceptance Criteria

- [ ] `system.transform` injects language governance block into output.system for main sessions
- [ ] `system.transform` skips language injection for child/delegated sessions
- [ ] Language instruction uses imperative tone ("MUST respond in LANGUAGE")
- [ ] Language instruction includes override behavior ("even if user writes in other language")
- [ ] Changing `conversation_language` in config changes injected instruction text
- [ ] `document_paths` field added to HivemindConfigsSchema as `z.array(z.string()).default([".hivemind/planning/"])`
- [ ] Documents language instruction appears in system prompt for main sessions (combined in Language Governance block)
- [ ] `tool.execute.before` injects language reminder when Write/Edit/apply_patch targets `.md` file under `document_paths`
- [ ] `npm run typecheck` passes
- [ ] All existing tests pass (governance-block, behavioral-profile, core-hooks, tool-guard test suites)

## Ambiguity Report

| Dimension | Score | Min | Status | Notes |
|-----------|-------|-----|--------|-------|
| Goal Clarity | 0.92 | 0.75 | ✓ | Two language fields, specific hook, specific behaviors |
| Boundary Clarity | 0.88 | 0.70 | ✓ | Only language fields; mode/expertise/delegation/WS-4 excluded |
| Constraint Clarity | 0.85 | 0.65 | ✓ | Must use existing hooks, no child sessions, backward compat |
| Acceptance Criteria | 0.78 | 0.70 | ✓ | 10 pass/fail criteria covering enforcement, exclusion, override |
| **Ambiguity** | **0.16** | ≤0.20 | ✓ | Gate passed |

## Interview Log

| Round | Perspective | Question summary | Decision locked |
|-------|-------------|------------------|-----------------|
| 1 | Researcher (hm-l2-investigator) | Full codebase config consumer audit — 47 file:line refs | All profile dimensions are decorative, only parallelization enforced |
| 2 | Researcher (hm-l2-auditor) | Behavioral profile enforcement scoring | 18/100 enforcement score; 3 methods orphaned |
| 3 | Researcher (live SDK validation) | OpenCode plugin hook API via Context7 + DeepWiki | system.transform and experimental.chat.system.transform signatures confirmed |
| 4 | Simplifier (user scoping) | Scope collapse from 4 fields + enforcement to only 2 language fields | Mode/expertise/delegation/skills/commands deferred |
| 5 | Boundary Keeper | Child session exclusion, no new hooks, backward compat | Constraints locked |

---

*Phase: BOOT-09-mvp-config-schema-entry-init*
*Spec created: 2026-05-12*
*Next step: /gsd-discuss-phase BOOT-09 — implementation decisions (exact hook logic, child session detection, path schema design)*
