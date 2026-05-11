# Phase BOOT-09: MVP Config Schema + Entry Init Verification - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-12
**Phase:** BOOT-09-mvp-config-schema-entry-init
**Areas discussed:** Child session detection, Language block format & position, Document paths schema, Document enforcement mechanism

---

## Child Session Detection

| Option | Description | Selected |
|--------|-------------|----------|
| Inject isMainSession via deps (Recommended) | Add isMainSession(sessionId) to HookDependencies that checks delegationManager.state.delegationsBySession | |
| SDK session lookup per call | Use OpenCode client to fetch session metadata and check parentID | |

**User's choice:** None of the above — research the interfaces because child session format is unknown

**Follow-up research:** Validated via DeepWiki (anomalyco/opencode):
- Native `task` tool creates child sessions via `sessions.create({ parentID: ctx.sessionID })`
- Child sessions have `parentID` field set; main sessions have `parentID: null/undefined`
- Hivemind's `DelegationManager.delegationsBySession` only tracks Hivemind's own `delegate-task` — NOT native `task` tool sessions

**Re-vote:**

| Option | Description | Selected |
|--------|-------------|----------|
| Cache on session entry (Recommended) | Check parentID once per session via session.created event, cache isMainSession boolean | ✓ |
| SDK call per hook invocation | Each system.transform call makes client.session.get() — adds latency | |

**User's choice:** Cache on session entry
**Notes:** User emphasized "do not consume or use any Delegation interfaces they are internal broken hallucination." Native task tool child sessions are entirely managed by OpenCode runtime.

---

## Language Block Format & Position

**Block position:**

| Option | Description | Selected |
|--------|-------------|----------|
| Before governance block (Recommended) | Push to output.system[0], shifts governance block to position 1 | ✓ |
| After governance block | Push after governance block, before intake context | |

**Instruction text:**

| Option | Description | Selected |
|--------|-------------|----------|
| Minimal imperative | "You MUST respond in LANGUAGE. Even if the user writes in another language..." | |
| Stronger framing | "--- Language Governance ---\nCRITICAL: You MUST respond in LANGUAGE..." | ✓ |
| You decide | Let implementer choose | |

**User's choice:** Language block BEFORE governance block, with stronger framing
**Notes:** Governance block format (buildGovernanceBlock) is LOCKED by downstream tests. Language is a separate injection.

---

## Document Paths Schema

**Schema shape:**

| Option | Description | Selected |
|--------|-------------|----------|
| Flat string array (Recommended) | document_paths: z.array(z.string()).default(['.hivemind/planning/']) | ✓ |
| Object with per-path language | { paths: [...], default_language: 'en' } — deferred | |

**Path scope:**

| Option | Description | Selected |
|--------|-------------|----------|
| Only .hivemind/planning/ for MVP | Default is ['.hivemind/planning/'] only | |
| Expandable but default only (Recommended) | Schema accepts any path, default is ['.hivemind/planning/'] | ✓ |

**User's choice:** Flat string array, expandable (default `[".hivemind/planning/"]`, users add more via config)

---

## Document Enforcement Mechanism

**Tool guard approach:**

| Option | Description | Selected |
|--------|-------------|----------|
| Inject path-specific reminder in tool context (Recommended) | tool.execute.before injects language reminder when Write/Edit/apply_patch targets document_paths | ✓ |
| Block non-compliant writes | Content analysis — SPEC says out of scope | |
| System prompt only — no tool guard | Simpler but no per-tool reinforcement | |

**User's choice:** Inject path-specific reminder in tool context (two-layer enforcement: system prompt + tool guard)
**Notes:** User specifically noted OpenCode tools: write, edit, patch, and potentially others. The enforcement is "injection alone but injection before write, edit, patch tools at path and the same set of tools guard at the config path enforcing write in targeted language."

---

## the agent's Discretion

- Exact wording of the language block (must satisfy SPEC: imperative "MUST", override behavior, document paths reference)
- Cache implementation detail for `isMainSession` (Map vs WeakMap vs other)
- Tool guard reminder exact text injected in `tool.execute.before`

## Deferred Ideas

- Per-path or per-document language override — deferred to future phase
- `user_expert_level` runtime enforcement — deferred to future phase
- Mode/delegation/tool/skill enforcement (WS-4) — deferred to WS-4 workstream
