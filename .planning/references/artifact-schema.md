# Hivemind Canonical Artifact Registry

**Status:** Active
**Created:** 2026-05-26
**Last updated:** 2026-05-26
**Reference authority:** This document is the single source of truth for artifact naming conventions, lifecycle rules, producer/consumer mappings, and location standards for all Hivemind phase artifacts. All hm-* agent Artifact Contract sections derive naming and location from this registry.

---

## Section 1: Artifact Registry Table

| Artifact | Pattern | Location | Producer Agent(s) | Consumer Agent(s) | Lifecycle Phase | Retention |
|----------|---------|----------|-------------------|-------------------|-----------------|-----------|
| CONTEXT.md | `{NN}-CONTEXT.md` | `.planning/phases/{NN}-name/` | hm-intent-loop | hm-planner, hm-executor | Planning | Archive on milestone complete |
| RESEARCH.md | `{NN}-RESEARCH.md` | `.planning/phases/{NN}-name/` | hm-phase-researcher | hm-planner | Research | Archive on phase complete |
| SPEC.md | `{NN}-SPEC.md` | `.planning/phases/{NN}-name/` | hm-specifier | hm-planner, hm-code-reviewer | Planning | Archive on phase complete |
| PLAN.md | `{NN}-{MM}-PLAN.md` | `.planning/phases/{NN}-name/` | hm-planner | hm-executor, hm-plan-checker | Planning | Archive on milestone complete |
| SUMMARY.md | `{NN}-{MM}-SUMMARY.md` | `.planning/phases/{NN}-name/` | hm-executor | hm-integration-checker, hm-verifier | Execution | Archive on milestone complete |
| REVIEW.md | `{NN}-REVIEW.md` | `.planning/phases/{NN}-name/` | hm-code-reviewer | hm-code-fixer | Review | Archive on phase complete |
| REVIEW-FIX.md | `{NN}-REVIEW-FIX.md` | `.planning/phases/{NN}-name/` | hm-code-fixer | hm-code-reviewer | Review | Archive on phase complete |
| VERIFICATION.md | `{NN}-VERIFICATION.md` | `.planning/phases/{NN}-name/` | hm-verifier | hm-nyquist-auditor | Verification | Archive on phase complete |
| SECURITY.md | `{NN}-SECURITY.md` | `.planning/phases/{NN}-name/` | hm-security-auditor | hm-orchestrator | Security | Archive on milestone complete |
| UI-SPEC.md | `{NN}-UI-SPEC.md` | `.planning/phases/{NN}-name/` | hm-ui-researcher | hm-ui-checker, frontend executor | Design | Archive on phase complete |
| UI-REVIEW.md | `{NN}-UI-REVIEW.md` | `.planning/phases/{NN}-name/` | hm-ui-auditor | hm-code-fixer | Review | Archive on phase complete |
| VALIDATION.md | `{NN}-VALIDATION.md` | `.planning/phases/{NN}-name/` | hm-nyquist-auditor | hm-orchestrator | Validation | Archive on milestone complete |
| STACK.md | `{name}-{YYYY-MM-DD}.md` | `.planning/research/` | hm-project-researcher | hm-roadmapper | Research | Permanent reference |
| FEATURES.md | `{name}-{YYYY-MM-DD}.md` | `.planning/research/` | hm-project-researcher | hm-roadmapper | Research | Permanent reference |
| ARCHITECTURE.md | `{name}-{YYYY-MM-DD}.md` | `.planning/research/` or `.planning/codebase/` | hm-project-researcher / hm-architect | hm-planner, hm-executor | Research/Design | Permanent reference |
| PITFALLS.md | `{name}-{YYYY-MM-DD}.md` | `.planning/research/` | hm-project-researcher | hm-planner | Research | Permanent reference |
| SUMMARY.md (research) | `SUMMARY.md` | `.planning/research/` | hm-synthesizer | hm-roadmapper | Research | Archive on project complete |
| INTENT.md | `INTENT.md` | `.planning/phases/{phase}/` | hm-intent-loop | hm-specifier, hm-planner | Planning | Archive on phase complete |
| ECOSYSTEM.md | `ECOSYSTEM.md` | `.planning/` or `.planning/research/` | hm-ecologist | hm-roadmapper | Planning | Permanent reference |
| ROADMAP.md | `ROADMAP.md` | `.planning/` | hm-roadmapper | All agents | Planning | Permanent (updated per cycle) |
| ADR-{NNN}.md | `ADR-{NNN}.md` | `.planning/architecture/` | hm-architect | hm-planner, hm-executor | Design | Permanent reference |
| PATTERNS.md | `PATTERNS.md` | `.planning/` or `.planning/codebase/` | hm-pattern-mapper | hm-planner, hm-executor | Planning | Permanent reference |
| STRUCTURE.md | `STRUCTURE.md` | `.planning/codebase/` | hm-codebase-mapper | hm-planner | Research | Permanent reference |
| CONVENTIONS.md | `CONVENTIONS.md` | `.planning/codebase/` | hm-codebase-mapper | hm-executor | Research | Permanent reference |
| CONCERNS.md | `CONCERNS.md` | `.planning/codebase/` | hm-codebase-mapper | hm-planner | Research | Permanent reference |
| USER-PROFILE.md | `USER-PROFILE.md` | Project root or `.planning/` | hm-user-profiler | hm-orchestrator | Profiling | Permanent (updated per session) |
| CHANGELOG.md | `CHANGELOG.md` | Project root | hm-shipper | All agents, users | Release | Permanent (append-only) |
| Debug report | `{timestamp}-debug-{id}.md` | `.planning/debug/` | hm-debugger, hm-debug-session-manager | hm-orchestrator | Debug | Archive on resolution |
| PROJECT.md | `PROJECT.md` | `.planning/` | hm-roadmapper / project init | All agents | Init | Permanent (updated per milestone) |
| STATE.md | `STATE.md` | `.planning/` | hm-orchestrator | All agents | All | Permanent (updated per operation) |
| Integration report | `{NN}-INTEGRATION.md` | `.planning/phases/{NN}-name/` | hm-integration-checker | hm-orchestrator | Validation | Archive on milestone complete |
| PATTERNS.md (codebase) | `PATTERNS.md` | `.planning/codebase/` | hm-pattern-mapper | hm-planner, hm-executor | Planning | Permanent reference |
| Intel JSON | `*.json` | `.planning/intel/` | hm-intel-updater | hm-orchestrator, all agents | Maintenance | Permanent (updated per change) |

---

## Section 2: YAML Frontmatter Field Definitions

Standard frontmatter fields used across all phase-level artifacts:

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `phase` | String | Yes | Phase identifier | `24.2-agent-profile-quality-enforcement` |
| `plan` | String | For plan-level artifacts | Plan number within phase | `01` |
| `type` | String | Yes | Artifact type identifier | `plan`, `research`, `spec`, `summary`, `review` |
| `status` | String | Yes | Lifecycle status | `draft`, `review`, `approved`, `superseded`, `archived` |
| `depends_on` | Array | No | Plan IDs this artifact depends on | `[01, 02]` |
| `requirements` | Array | For phase artifacts | Requirement IDs addressed | `[Q-01, Q-02]` |
| `date` | String (YYYY-MM-DD) | Yes | Creation or last-update date | `2026-05-26` |
| `author` | String | No | Agent or human author | `hm-executor`, `hm-planner` |
| `title` | String | No | Human-readable title | `Agent Profile Quality Enforcement` |
| `reviewed` | String (YYYY-MM-DD) | For review artifacts | Last review date | `2026-05-26` |

### Field Usage Rules

- `phase` and `type` are always required for artifact identification
- `status` transitions: `draft` → `review` → `approved` → `superseded` or `archived`
- `depends_on` enables cross-plan dependency tracking for the executor
- `requirements` enables bidirectional traceability between requirements and artifacts
- `date` should match the file's date-stamp suffix for date-stamped artifacts

---

## Section 3: Lifecycle Rules

### Create
- **When:** When a phase starts, research begins, or a new artifact type is needed
- **Who:** The designated producer agent (see Artifact Registry Table)
- **How:** Write with correct naming pattern and required frontmatter fields
- **Initial status:** `draft`

### Update
- **By:** Only the producing agent or a human editor
- **Version management:** Update `status` field through lifecycle: `draft` → `review` → `approved`
- **Minor updates:** Update `date` field and `last updated` metadata
- **Significant changes:** Increment via supersede workflow (see below)

### Archive
- **When:** Phase is complete and milestone is archived
- **Action:** Move artifact files to `.planning/archive/{milestone}/` preserving directory structure
- **By:** hm-orchestrator during milestone completion workflow
- **Note:** Root-level artifacts (ROADMAP.md, STATE.md, PROJECT.md) are never archived

### Supersede
- **When:** A newer version of an artifact replaces an older one
- **Action:** Update old artifact `status` to `superseded`; new artifact gets `status: approved`
- **Cross-reference:** Old artifact should reference superseding artifact by path
- **By:** The producing agent or hm-orchestrator

### Delete
- **Rule:** Never delete artifacts. Git preserves history.
- **Alternatives:** Supersede (if replaced) or archive (if no longer current)
- **Exception:** Scratch/work-in-progress files not yet committed may be removed

---

## Section 4: Naming Convention Rules

### Phase-Level Artifacts
```
{NN}-{TYPE}.md
```
Where `NN` = zero-padded phase number, `TYPE` = uppercase artifact type.
Examples: `24.2-RESEARCH.md`, `24.2-SPEC.md`, `24.2-SECURITY.md`

### Plan-Level Artifacts
```
{NN}-{MM}-{TYPE}.md
```
Where `NN` = phase number, `MM` = zero-padded plan number, `TYPE` = uppercase artifact type.
Examples: `24.2-01-PLAN.md`, `24.2-01-SUMMARY.md`

### Research Artifacts (Date-Stamped)
```
{name}-{YYYY-MM-DD}.md
```
Where `name` = descriptive lowercase-hyphenated name.
Examples: `omo-adaptation-architecture-2026-05-07.md`, `hivemind-source-plane-architecture-2026-05-07.md`

### Debug Artifacts
```
{timestamp}-debug-{id}.md
```
Where `timestamp` = ISO timestamp, `id` = short debug identifier.
Example: `20260526T143000-debug-T-24-02.md`

### Root-Level Artifacts (Fixed Names)
- `ROADMAP.md` — Never date-stamped, always at `.planning/ROADMAP.md`
- `PROJECT.md` — Never date-stamped, always at `.planning/PROJECT.md`
- `STATE.md` — Never date-stamped, always at `.planning/STATE.md`
- `CHANGELOG.md` — Never date-stamped, always at project root

### Codebase Intelligence Artifacts
- `STRUCTURE.md` at `.planning/codebase/STRUCTURE.md`
- `ARCHITECTURE.md` at `.planning/codebase/ARCHITECTURE.md`
- `CONVENTIONS.md` at `.planning/codebase/CONVENTIONS.md`
- `CONCERNS.md` at `.planning/codebase/CONCERNS.md`
- `STACK.md` at `.planning/codebase/STACK.md`
- Intel JSON files at `.planning/intel/*.json`

### Architecture Artifacts
- `ADR-{NNN}.md` at `.planning/architecture/ADR-{NNN}.md` where NNN = zero-padded ADR number

---

## Section 5: Cross-Reference — Per-Agent Artifact Summary

| Agent | Produces | Pattern | Location |
|-------|----------|---------|----------|
| hm-orchestrator | Session state, delegations.json | JSON | `.hivemind/state/` |
| hm-project-researcher | STACK.md, FEATURES.md, ARCHITECTURE.md, PITFALLS.md | `{name}-{YYYY-MM-DD}.md` | `.planning/research/` |
| hm-phase-researcher | RESEARCH.md | `{NN}-RESEARCH.md` | `.planning/phases/{NN}-name/` |
| hm-synthesizer | SUMMARY.md | `SUMMARY.md` | `.planning/research/` |
| hm-codebase-mapper | STRUCTURE.md, ARCHITECTURE.md, CONVENTIONS.md, STACK.md, CONCERNS.md | Fixed names | `.planning/codebase/` |
| hm-pattern-mapper | PATTERNS.md | `PATTERNS.md` | `.planning/` or `.planning/codebase/` |
| hm-architect | ARCHITECTURE.md, ADR-{NNN}.md | Fixed name + `ADR-{NNN}.md` | `.planning/` + `.planning/architecture/` |
| hm-roadmapper | ROADMAP.md | `ROADMAP.md` | `.planning/` |
| hm-specifier | SPEC.md | `{NN}-SPEC.md` | `.planning/phases/{NN}-name/` |
| hm-planner | PLAN.md | `{NN}-{MM}-PLAN.md` | `.planning/phases/{NN}-name/` |
| hm-plan-checker | PASS/FAIL verdict | Text | Returned to orchestrator |
| hm-executor | Code changes, SUMMARY.md | `{NN}-{MM}-SUMMARY.md` | `.planning/phases/{NN}-name/` |
| hm-verifier | VERIFICATION.md | `{NN}-VERIFICATION.md` | `.planning/phases/{NN}-name/` |
| hm-code-reviewer | REVIEW.md | `{NN}-REVIEW.md` | `.planning/phases/{NN}-name/` |
| hm-code-fixer | Code fixes, REVIEW-FIX.md | `{NN}-REVIEW-FIX.md` | `.planning/phases/{NN}-name/` |
| hm-integration-checker | Integration report | `{NN}-INTEGRATION.md` | `.planning/phases/{NN}-name/` |
| hm-intent-loop | INTENT.md | `INTENT.md` | `.planning/phases/{phase}/` |
| hm-ecologist | ECOSYSTEM.md | `ECOSYSTEM.md` | `.planning/` or `.planning/research/` |
| hm-shipper | CHANGELOG.md, Release manifest | `CHANGELOG.md` | Project root |
| hm-nyquist-auditor | VALIDATION.md, Test files | `{NN}-VALIDATION.md` | `.planning/phases/{NN}-name/` |
| hm-intel-updater | Intel JSON files | `*.json` | `.planning/intel/` |
| hm-security-auditor | SECURITY.md | `{NN}-SECURITY.md` | `.planning/phases/{NN}-name/` |
| hm-debug-session-manager | Debug session log, Escalation report | `{timestamp}-debug-{id}.md` | `.planning/debug/` |
| hm-debugger | Debug report | `{timestamp}-debug-{id}.md` | `.planning/debug/` |
| hm-ui-researcher | UI-SPEC.md | `{NN}-UI-SPEC.md` | `.planning/phases/{NN}-name/` |
| hm-ui-checker | BLOCK/FLAG/PASS verdict | Text | Returned to orchestrator |
| hm-ui-auditor | UI-REVIEW.md | `{NN}-UI-REVIEW.md` | `.planning/phases/{NN}-name/` |
| hm-doc-writer | Project documentation | Varies | Project root, `docs/` |
| hm-doc-verifier | JSON verification report | JSON | Alongside doc or returned |
| hm-user-profiler | USER-PROFILE.md | `USER-PROFILE.md` | Project root or `.planning/` |
