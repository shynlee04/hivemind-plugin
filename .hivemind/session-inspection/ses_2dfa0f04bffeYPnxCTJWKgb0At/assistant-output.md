# Session Inspection Export

- ses_id: `ses_2dfa0f04bffeYPnxCTJWKgb0At`
- prepared_at: `2026-03-24T15:04:19.018Z`

## Assistant Output

## Skill Summaries

### 1. `git-continuity-memory`

**Key Mechanisms:** Four modes (`resume`, `trace`, `retrieve`, `anchor`) for recovering task state from git history. Stores session continuity in `{project}/.hivemind/activity/sessions/continuity.json` and long-haul state in `longhaul/task-state.json`. Uses typed continuity markers (`activity_type`, `phase_type`, `branch`, `worktree`, `worktree_role`).

**Consolidation Impact:** Central session-resume authority. Replaces ad-hoc chat memory with deterministic, disk-based continuity. Every other skill that crosses a turn boundary depends on this.

**Cross-References:** `use-hivemind-delegation` (task_id resume), `hivemind-atomic-commit` (commit anchors), `hivemind-gatekeeping-delegation` (loop checkpoints). Sibling of `git-memory-enforce` (memory enforcement layers on top of this skill's anchors).

---

### 2. `git-memory-enforce`

**Key Mechanisms:** Five-step memory commit protocol: (1) context capture (`what`, `why`, `who_decided`, `evidence`, `alternatives_considered`), (2) packet linkage (`packet_id`, `plan_phase`, `decision_id`), (3) memory-first commit message format with `retrieval_tags`, (4) index registration in `.hivemind/activity/memory-index/`, (5) git-log-based retrieval queries. Three enforcement gates beyond `hivemind-atomic-commit`: memory context, linkage minimum, tag validity. Builds a queryable knowledge graph (`commit → decision → packet → phase → epic`).

**Consolidation Impact:** Transforms git history from a flat code log into a semantic knowledge network. Every commit must carry decision context or be flagged `memory_orphan`.

**Cross-References:** `hivemind-atomic-commit` (prerequisite — runs first), `git-continuity-memory` (session continuity — this adds commit-level enforcement), `use-hivemind-git-memory` (entry router), `hivemind-codemap` (surface ownership validation).

---

### 3. `hierarchy-retrace`

**Key Mechanisms:** 7-node decision hierarchy model (`epic → phase → slice → packet → return → commit → gate-result`) with typed edges (`produces`, `depends-on`, `validates`, `executes`, `commits`). Forward trace (epic→commits), backward trace (commit→epic), and filtered audit queries. Master index at `index.json` with `by_phase_type`, `by_activity_type`, `by_agent`, `by_status` pre-built indices. Append-only edge files with `revoked_at` for non-destructive updates.

**Consolidation Impact:** Single source of truth for the full decision chain. Replaces scattered delegation logs, commit histories, and gate results with a unified traversable graph. Prevents orphan nodes, disconnected edges, and lost traceability.

**Cross-References:** `git-continuity-memory` (commit anchors as leaf nodes), `use-hivemind-delegation` (packet/return nodes), `hivemind-atomic-commit` (commit nodes), `hivemind-gatekeeping-delegation` (gate-result nodes), `hivemind-codemap` (codescan evidence at slice level).

---

### 4. `hivemind-atomic-commit`

**Key Mechanisms:** Activity classification (5 classes: `artifact`, `code`, `meta`, `runtime`, `projection`) with granularity levels. Activity mapping with dependency detection (`import`, `type-ref`, `config`, `generate`, `test-of`). Six pre-commit gates (branch, worktree, clean tree, branch appropriateness, secrets, conflicts). Typed conventional commit messages with `activity_classes` and `rollback_method` metadata. Rollback plans with 5 methods (`revert-commit`, `file-restore`, `branch-rollback`, `manual-steps`, `irreversible`).

**Consolidation Impact:** Replaces ad-hoc `git commit` with a disciplined pipeline. Ensures every commit is atomic, typed, classified, dependency-ordered, and reversible.

**Cross-References:** `git-continuity-memory` (produces commits that continuity tracks), `git-memory-enforce` (layers memory gates on top), `use-hivemind-delegation` (commit discipline for delegated work), `hivemind-codemap` (surface ownership validation).

---

### 5. `hivemind-system-debug`

**Key Mechanisms:** Debug loop: capture failing behavior → bound symptom to smallest slice → collect evidence + track hypotheses → record rollback/containment posture → declare root cause or bounded unknown. Evidence classification: `confirmed`, `inferred`, `unverified`. Debug artifacts stored in `.hivemind/activity/agents/{agent_name}/{pass_id}/`. Always delegated — orchestrator never loads raw debug logs.

**Consolidation Impact:** Prevents speculative fixes. Forces reproduction before repair, explicit containment boundaries, and debug-to-refactor readiness declarations before handoff.

**Cross-References:** `course-correction-delegation` (debug delegation phases — this skill provides the mechanics), `hivemind-codemap` (when bug scope exceeds single file), `context-intelligence-entry` (false signal detection protocol).

---

### 6. `hivemind-skill-doctor`

**Key Mechanisms:** Redirect skill — delegates core skill auditing to external `skill-review`. Retains only HiveMind-specific guidance: naming conventions, skill stacking rules (max 3 active), framework integration edge cases. Internal references preserved for compatibility: 120-point Skill-Judge system, TDD methodology, iterative refinement, conflict detection.

**Consolidation Impact:** Lightweight shim. Core auditing logic externalized to `skill-review`; this skill provides only the HiveMind-convention overlay.

**Cross-References:** `skill-review` (external — core audit patterns), `skill-conflict-detect` (cross-pack overlap), `hivemind-skill-write` (authoring conventions), `skill-universal-design` (platform-agnostic validation).

---

### 7. `hivemind-skill-write`

**Key Mechanisms:** Redirect skill — delegates core skill authoring to external `skill-creator`. Retains only HiveMind-specific guidance: naming/tagging conventions, skill stacking rules, tool vs skill distinction. Internal references: skill anatomy template, YAML frontmatter standard, P1/P2/P3 pattern system, TDD workflow for skills.

**Consolidation Impact:** Lightweight shim. Core authoring patterns externalized to `skill-creator`; this skill provides only the HiveMind-convention overlay.

**Cross-References:** `skill-creator` (external — core authoring patterns), `hivemind-skill-doctor` (quality auditing after authoring), `skill-universal-design` (universal applicability validation), `skill-conflict-detect` (conflict checking before deployment).

---

### 8. `skill-universal-design`

**Key Mechanisms:** Five universal design principles: (1) Terminology Abstraction (replace branded terms with generic equivalents), (2) Capability Contract (define WHAT not HOW), (3) Framework-Agnostic Workflow (generic cognitive verbs), (4) Portable Evidence Format (versioned JSON/Meta with `_meta`), (5) Progressive Enhancement (core works everywhere; platform extensions are opt-in). Platform Abstraction Matrix mapping 16 concepts across OpenCode, Claude Code, and generic. 20-point validation checklist across terminology, workflow, evidence, and structure categories.

**Consolidation Impact:** Prevents framework lock-in. Ensures skills are consumable by any agent system (OpenCode, Claude Code, Cursor, Gemini CLI, custom runtimes). The abstraction matrix is the canonical cross-platform mapping.

**Cross-References:** `hivemind-skill-write` / `skill-creator` (authoring — this validates universality), `hivemind-skill-doctor` (quality scoring — this checks for platform lock-in), `skill-conflict-detect` (conflicts from non-universal patterns), `agent-role-boundary` (role definitions are framework-agnostic).

---

### 9. `skill-conflict-detect`

**Key Mechanisms:** Five-type conflict taxonomy: (1) Scope Overlap, (2) Contradictory Instructions, (3) Shared State Conflict, (4) Boundary Violation, (5) Dependency Cycle. Six-step detection methodology: scope mapping → overlap analysis → instruction comparison → state audit → classification → resolution. Resolution decision tree with strategies (specialize, merge, clarify, precede, deprecate, contextualize, escalate, coordinate, partition, order, remove, relocate, break, extract, inline). Precedence rules: user instructions > loaded order > specificity > recency > framework authority.

**Consolidation Impact:** Ecosystem health enforcement. Prevents skills from silently conflicting. Structured conflict report with severity ratings and resolution plans.

**Cross-References:** `hivemind-skill-doctor` (overall quality — this detects specific conflicts), `skill-universal-design` (platform-locked conflicts), `agent-role-boundary` (role conflict subtype), `use-hivemind-delegation` (delegation conflicts), `use-hivemind-skill-writer` (pre-authoring validation).

---

### 10. `agent-role-boundary`

**Key Mechanisms:** Diamond Role Model with 6 roles: Orchestrator (delegates + validates), Executor (implements only), Verifier (reports evidence), Researcher (finds + analyzes), Planner (structures approach), Meta-Builder (framework assets only). Permission matrix defining which actions each role may perform. Escalation rules: each role returns to orchestrator when blocked — no improvisation. Platform adaptation: multi-agent maps roles to separate agents; single-agent maps roles to sequential phases.

**Consolidation Impact:** Prevents role bleed, recursive delegation, and self-verification. Critical for multi-agent delegation integrity — ensures executors don't delegate, verifiers don't fix, orchestrators don't execute.

**Cross-References:** `skill-conflict-detect` (role conflicts are a conflict subtype), `use-hivemind-delegation` (delegation packets enforce role boundaries), `course-correction-delegation` (domain delegation respects role constraints), `skill-universal-design` (role model is framework-agnostic).

---

### 11. `course-correction-delegation`

**Key Mechanisms:** Three domain delegation patterns with mandatory phased protocols:
- **Debug:** `reproduce → narrow → contain → evidence` — each phase requires proof, not prose. Hard gates block progression without evidence.
- **Refactor:** `assess → plan → execute → verify` — assessment must precede execution; broken tests reject the refactor.
- **Audit:** `scan → analyze → recommend` — recommendations without scan data are rejected.

Cross-domain transitions: debug→refactor, audit→refactor, refactor→debug. Domain-specific packet fields (`debug_phase`, `refactor_phase`, `audit_phase`, `seam_inventory`, `hypotheses`). Rationalization prevention tables explicitly counter common excuses for skipping phases.

**Consolidation Impact:** Enforces disciplined multi-phase delegation. Prevents guessing-as-debugging, demolition-as-refactoring, and opinion-as-auditing. Hard gates make phase-skipping impossible.

**Cross-References:** `use-hivemind-delegation` (prerequisite — base packet structure), `hivemind-system-debug` (debug mechanics), `use-hivemind-detox-refactor` (refactor mechanics), `hivemind-codemap` (audit scan mechanics), `hivemind-gatekeeping-delegation` (loop iteration control), `tdd-delegation` (TDD fallback).

---

### 12. `research-delegation`

**Key Mechanisms:** Evidence collection delegation: decompose research into sub-questions, one packet per sub-question. Evidence item format with `claim`, `source`, `source_type`, `confidence`, `freshness`, `corroborated`, `contradictions`. Source validation: 5-level authority hierarchy (official docs > project code > blogs > forums > uncited). Freshness grading (`current`, `recent`, `stale`, `unknown`). Multi-source synthesis: group by claim, per-source attribution, contradictions listed without resolution (synthesizer decides). Research thread lifecycle: open → collecting → synthesizing → complete/blocked. Checkpoint compression (≤3 findings per sub-question + open contradictions).

**Consolidation Impact:** Prevents unfocused research, uncited claims, and premature contradiction resolution. Parallel delegation of independent sub-questions saves time.

**Cross-References:** `use-hivemind-delegation` (prerequisite — base packet structure), `hivemind-gatekeeping-delegation` (multi-pass research loops), `hivemind-research-framework` (methodology — this skill is the delegation harness), `hivemind-research-tools` (MCP tool protocols for evidence collection), `spec-distillation` (research findings feed into distillation).