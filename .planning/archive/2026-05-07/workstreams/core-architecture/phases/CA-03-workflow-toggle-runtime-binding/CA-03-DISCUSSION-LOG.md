# Phase CA-03: Workflow Toggle Runtime Binding - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-06
**Phase:** CA-03-workflow-toggle-runtime-binding
**Areas discussed:** CA-03 Scope, Governance Block Format, Toggle Selection, Toggle Consumer Types, Execution Field Consumers, Future Toggle Documentation, CA-03/CA-04 Boundary, Testing Strategy, UAT Evidence

---

## CA-03 Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Full runtime bridge | CA-03 becomes the phase that wires ALL config fields + behavioral profiles into hooks/tools/commands | ✓ |
| Workflow toggles only | Stick to roadmap scope | |
| Expand CA-04 instead | Defer broader wiring to CA-04 | |

**User's choice:** Full runtime bridge with governance types that impact output styles directly — mode, user_expert_level, language enforcements loaded at all time as reminder before prompt sent, concise enforcements as instructions.
**Notes:** User explicitly wants governance fields to be non-negotiable, always-active reminders.

---

## Governance Block Format

| Option | Description | Selected |
|--------|-------------|----------|
| Text block in system prompt | Appended to system.transform as structured text | |
| JSON system message | Separate system message with JSON content | |
| Prefix + block | Short prefix instruction + structured block | |
| Structured governance block | Recommended — structured sections for mode, expertise, language | ✓ |

**User's choice:** Structured governance block, but must include concise instruction of the governance description matched with the field and each value.
**Notes:** Text block format but with imperative instruction-style content.

---

## Governance Block — Format Details

| Option | Description | Selected |
|--------|-------------|----------|
| Instruction-style | Short imperative instruction per field | |
| Field + behavioral note | Field: value pairs with behavioral notes | |
| Hybrid instruction + fields | Instruction for mode/expertise/language + field:value for runtime | ✓ |

**User's choice:** Hybrid — instruction-style for mode/expertise/language directives, field:value pairs for runtime context.
**Notes:** Example: "You are operating in expert-advisor mode. Communicate at intermediate-high level. Use en for all conversation and documents." + field:value context lines.

---

## Toggle Selection (Which 6 toggles)

| Option | Description | Selected |
|--------|-------------|----------|
| Core quality gates (4) | research, plan_check, verifier, discuss_mode | |
| Core + dev workflow (6) | + use_worktrees, research_before_questions | ✓ |
| Core + dev + cross-session (7) | + cross_session_tasks_dependencies_validation | |

**User's choice:** 6 toggles — research, plan_check, verifier, discuss_mode, use_worktrees, research_before_questions.
**Notes:** Selective wiring — only toggles with clear, existing hook/skill consumer paths.

---

## Toggle Consumer Architecture

| Option | Description | Selected |
|--------|-------------|----------|
| Hooks primary, tools defensive | Hooks gate behavior, tools check defensively | ✓ |
| Hooks only | Only hooks gate, tools don't check | |
| All layers independent | Hooks, tools, skills all check independently | |

**User's choice:** Hooks primary authority, tools read defensively. Skills remain passive.
**Notes:** Hook-level gating is the enforcement mechanism.

---

## Execution Field Consumers

| Option | Description | Selected |
|--------|-------------|----------|
| DelegationManager + executor | parallelization gates wave dispatch, atomic_commit checks commits, commit_docs toggles doc persistence | ✓ |
| Composition root injection | One-time read at init | |
| Per-operation checks | Dynamic checks each operation | |

**User's choice:** DelegationManager + executor-style consumption within the harness (src/), not GSD workflows.
**Notes:** User clarified this is Hivemind V3 harness — execution fields consumed by harness modules (DelegationManager, continuity, persistence), applying across both hm-* and hf-* lineages. All three default to true.

---

## Future Toggle Documentation

| Option | Description | Selected |
|--------|-------------|----------|
| Schema JSDoc annotations | @future-consumer tags in schema file | ✓ |
| CONTEXT.md deferred table | Table in context document | |
| Both | JSDoc + CONTEXT.md table | |

**User's choice:** JSDoc annotations in schema file.
**Notes:** Pre-assign consumer modules now — trajectory_control → hivemind-trajectory tool, advanced_continuity → continuity.ts, task_plus → task-status.ts, ui_* → future sidecar, ai_integration → WS-4, cross_session → lifecycle-manager.

---

## CA-03 / CA-04 Boundary

| Option | Description | Selected |
|--------|-------------|----------|
| CRUD ownership only | CA-04 focuses on .hivemind/ directory CRUD | |
| CRUD + unwired toggle wiring | + remaining 7 toggles | |
| CRUD + toggles + naming debt | + cross-lineage naming validation | |
| Full lifecycle + everything | + runtime lifecycle audit | ✓ |

**User's choice:** CA-04 remains "Full lifecycle + everything" — CRUD ownership, unwired toggle wiring, naming validation, lifecycle audit.
**Notes:** CA-04 priority unchanged (PLANNED). All scope shifts and naming debt go to CA-04.

---

## Testing Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Unit + integration | Unit tests for gates + integration for tool chain | |
| Unit tests only | Simple unit tests recommended | |
| Unit + integration + E2E | Full suite | |

**User's choice:** Whatever test type but must follow strict TDD workflow testing authentic behaviors — no mocks allowed.
**Notes:** Authentic behavior testing is non-negotiable. Tests exercise real hook factories with real toggle configs.

---

## UAT Retro-Validation Evidence

| Option | Description | Selected |
|--------|-------------|----------|
| Vitest test evidence | Run vitest tests, capture output as evidence | ✓ |
| Verification script | Custom script exercising harness API | |
| Code review evidence | Verify wiring exists without re-running | |

**User's choice:** Vitest test evidence — update original CA-01-UAT.md and CA-02-UAT.md with fresh pass/fail results.
**Notes:** All 17 blocked UATs re-validated in CA-03 with vitest test output as evidence.

---

## the agent's Discretion

*No areas were deferred to the agent — all decisions were user-directed.*

## Deferred Ideas

- Remaining 7 toggle wiring → CA-04
- f-04 Auto-commands / workflow router → WS-4
- Cross-lineage naming convention audit → CA-04
- Tool guard enforcement (blocking) → Post-GA
- Per-mode hook injection profiles → Post-MVP
- Behavioral profile editor in sidecar → WS-2/WS-8
- A/B testing and metrics → Requires telemetry infra
