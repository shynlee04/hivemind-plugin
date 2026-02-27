# Anti-Pattern Catalog — Agent "Dumbness" Observable Behaviors

> Load this reference in Mode 4 (IMPROVE).
> Run `scripts/anti-pattern-detector.sh` first, then use this catalog to classify and fix findings.

---

## Table of Contents

1. [Token-Wasting (D-01 to D-05)](#1-token-wasting-anti-patterns)
2. [Context-Poisoning (D-06 to D-10)](#2-context-poisoning-anti-patterns)
3. [Governance-Failure (D-11 to D-15)](#3-governance-failure-anti-patterns)
4. [Detection Quick Reference](#4-detection-quick-reference)

---

## 1. Token-Wasting Anti-Patterns

These patterns burn tokens without producing value. Each wastes 5K-50K+ tokens per occurrence.

### D-01: Lint-on-Docs

**What**: Running `eslint`, `tsc`, `prettier` on markdown/yaml/json updates that have zero code changes.
**Why it happens**: Agent's "verify everything" instinct doesn't distinguish file types.
**Detection**: Session log shows lint/type-check commands immediately after doc-only edits.
**Detection script**: `grep -E "(eslint|tsc|prettier)" session.log | grep -v "\.ts\b"` — any matches are D-01.
**Fix**: Add `file_type_gate` to workflow steps: if `git diff --name-only` shows only `.md/.yaml/.json`, skip code linting. Run content-validation scripts instead (schema checks, reference existence checks).
**Severity**: P2 — wastes ~30s and ~2K tokens per occurrence; cumulative in bulk updates.

### D-02: Skill Avalanche

**What**: Loading 5+ skill bodies in one turn, filling 50K+ tokens with governance text.
**Why it happens**: Agent loads every "might be useful" skill instead of using progressive disclosure.
**Detection**: Token usage spikes >40K in a single turn with multiple `skill()` calls.
**Detection script**: Count skill-load events per turn in session log; flag turns with >3 loads.
**Fix**: Enforce progressive disclosure: L0 (metadata only) at session start. L1+ on demand per workflow step's `skill_bundles`. NEVER load skills "just in case."
**Severity**: P0 — fills 25% of context window with governance noise, leaving insufficient room for actual work.

### D-03: Redundant Research

**What**: Investigating the same codebase area or tech stack pattern multiple times across turns.
**Why it happens**: Agent doesn't check memory before investigating; each turn starts "fresh."
**Detection**: `grep` session logs for duplicate file-read or search patterns within same session.
**Detection script**: Extract all `Read()` and `grep()` targets; flag paths accessed 3+ times.
**Fix**: Require `recall_mems` check before any new investigation. Cache investigation results in session-scoped memory. Use `save_mem` after each significant finding.
**Severity**: P1 — wastes 5-10K tokens per redundant investigation cycle.

### D-04: Planning Artifact Dump

**What**: Creating 10+ markdown/yaml/json files without hierarchical or relational ordering.
**Why it happens**: Agent creates artifacts ad-hoc without connecting them to trajectory/tactic/action tree.
**Detection**: `find .hivemind/ -name "*.md" -newer session-start` returns files with no cross-references.
**Detection script**: Count new files created in session; check each for `trajectory_id` or `parent` references.
**Fix**: Enforce trajectory -> tactic -> action hierarchy BEFORE file creation. Every new file must reference its parent in the hierarchy tree. Use templates from `assets/` to ensure structure.
**Severity**: P1 — creates "archaeological dig" problem where future agents can't find or relate artifacts.

### D-05: Unrouted Execution

**What**: Agent starts coding/editing without checking which command/workflow they're supposed to follow.
**Why it happens**: Agent responds directly to user intent without checking governance chain.
**Detection**: No `execution_context` or workflow reference appears in the turn's tool calls.
**Detection script**: Check session turns for write operations without preceding workflow/command references.
**Fix**: Every write-operation turn must trace to a workflow step. If no workflow exists for the task, create one (even a minimal Tier-2) before executing.
**Severity**: P0 — unrouted execution bypasses all guards, scope constraints, and evidence requirements.

---

## 2. Context-Poisoning Anti-Patterns

These patterns degrade context quality. Effects compound across turns.

### D-06: Hallucinated Options

**What**: Presenting choices/options to user that are disconnected from conversation history or project state.
**Why it happens**: Agent generates plausible-sounding options from training data rather than project context.
**Detection**: User reports "none of these match what we're doing"; options reference nonexistent files or artifacts.
**Detection script**: Extract presented options; verify each references a real file path or prior conversation turn.
**Fix**: Require ALL presented options to cite specific files, artifacts, or prior turns. Add validation step: before presenting options, verify each option's referenced entities exist.
**Severity**: P1 — erodes user trust and wastes decision-making time on invalid choices.

### D-07: Upstream Amnesia

**What**: Sub-agent doesn't know delegation source was another agent (not human).
**Why it happens**: Delegation packet lacks `delegation_source` field; sub-agent treats all instructions as human-sourced.
**Detection**: Sub-agent asks user for information that parent agent already provided in the task prompt.
**Detection script**: Check delegation packets for missing `delegation_source` and `parent_agent` fields.
**Fix**: Include `delegation_source: agent`, `delegation_depth: N`, `parent_agent: <name>`, and `parent_context_summary` in every Task() packet. Sub-agents must check these fields before asking for clarification.
**Severity**: P0 — causes infinite clarification loops and breaks delegation chain entirely.

### D-08: Ghost Connections

**What**: Creating cross-references to files, artifacts, or skills that don't exist.
**Why it happens**: Agent assumes file will exist, or references a planned-but-not-yet-created artifact.
**Detection**: `find` or `ls` for referenced paths returns empty.
**Detection script**: Extract all file path references from created artifacts; verify each with `[ -f path ]`.
**Fix**: Pre-validate ALL references with existence checks before writing. For planned artifacts, use `TODO:` prefix clearly indicating the reference is aspirational.
**Severity**: P1 — ghost connections cause sub-agents to waste tokens searching for nonexistent files.

### D-09: Context Echo

**What**: Re-reading the same file multiple times in one session without caching.
**Why it happens**: Agent doesn't maintain session-scoped file cache; each decision point re-reads from disk.
**Detection**: Session log shows 3+ reads of the same file path within one session.
**Detection script**: Count `Read()` calls per unique file path; flag paths with >2 reads.
**Fix**: Cache file contents in session-scoped memory after first read. Use `hivemind_session_memory scratch` to store frequently-referenced content.
**Severity**: P2 — wastes ~1-3K tokens per redundant read; significant in long sessions.

### D-10: Scope Creep in Delegation

**What**: Delegated task expands beyond declared `scope` and modifies unexpected files.
**Why it happens**: Sub-agent's "helpful" instinct leads it to fix adjacent issues outside its mandate.
**Detection**: `git diff --name-only` shows files outside the delegation packet's `in_scope_paths`.
**Detection script**: Compare modified files against delegation packet's scope after each Task() completion.
**Fix**: Workflow guards must check modified files against scope BEFORE commit. Add `out_of_scope_paths` to every delegation packet. Set `failure_policy: "STOP and return error"` for scope violations.
**Severity**: P0 — scope creep causes cascading regressions and breaks parallel delegation isolation.

---

## 3. Governance-Failure Anti-Patterns

These patterns break the governance model itself.

### D-11: Depth Unawareness

**What**: Sub-agent doesn't distinguish user messages from parent delegation instructions.
**Why it happens**: Task() prompt is treated as "user said this" rather than "parent agent delegated this."
**Detection**: Sub-agent starts a new trajectory instead of continuing the parent's action chain.
**Detection script**: Check if delegated agents call `declare_intent` with new trajectories unrelated to parent's.
**Fix**: Set `is_delegated: true` + `delegation_depth: N` in every Task packet. Sub-agent MUST NOT create new trajectories — only action-level nodes under parent's tactic.
**Severity**: P0 — creates orphan trajectories that pollute the hierarchy tree.

### D-12: No Return Format

**What**: Sub-agent completes work but returns unstructured prose instead of structured result.
**Why it happens**: Delegation packet lacks explicit `return_schema`; sub-agent defaults to narrative summary.
**Detection**: Parent agent can't programmatically parse the result — triggers re-investigation.
**Detection script**: Check delegation packets for missing `return_schema` field.
**Fix**: Define explicit `return_schema` in every delegation packet with expected fields: `status`, `files_modified`, `evidence`, `issues`. Sub-agent MUST format return to match schema.
**Severity**: P1 — unstructured returns force parent to re-process, wasting 5-10K tokens.

### D-13: Broken Chain

**What**: Workflow steps execute without checking entry_criteria from previous step.
**Why it happens**: Guard enforcement is passive (logs warning) instead of active (halts execution).
**Detection**: Step N produces invalid output because Step N-1 failed silently.
**Detection script**: Check workflow execution logs for steps that ran despite preceding step failures.
**Fix**: Guard enforcement must HALT execution (not warn) when entry_criteria check fails. Each step must verify its own entry_criteria before starting, not rely on previous step's exit_criteria alone.
**Severity**: P0 — cascading from broken chain produces garbage artifacts that look valid.

### D-14: Session Rot Ignored

**What**: Agent continues working after 20+ turns without context health check.
**Why it happens**: No automatic trigger for `scan_hierarchy` at turn thresholds.
**Detection**: Turn count >15 without a `scan_hierarchy` or `think_back` call.
**Detection script**: Count turns since last hierarchy/drift check in session log.
**Fix**: Auto-trigger `scan_hierarchy` every 10 turns (configurable). If drift_score drops below 60, force context recovery before proceeding.
**Severity**: P1 — later turns silently contradict earlier decisions, producing incoherent output.

### D-15: Skill Without Routing

**What**: Agent loads a skill's body but doesn't follow its instructions — just has it in context.
**Why it happens**: Skill loaded as passive context rather than active instruction.
**Detection**: Skill body consumed tokens but agent's actions don't reflect skill's workflow.
**Detection script**: Check if skill-loaded turns produce actions matching skill's defined process steps.
**Fix**: Skill loader must inject skill body as active instruction (with routing checkpoint), not passive background. After loading, agent must acknowledge which workflow path from the skill it's following.
**Severity**: P1 — pure token waste with no behavioral benefit; 3-15K tokens burned per occurrence.

---

## 4. Detection Quick Reference

| ID | Name | Auto-Detectable? | Script Check |
|---|---|---|---|
| D-01 | Lint-on-docs | Yes | grep lint commands after doc edits |
| D-02 | Skill avalanche | Yes | count skill loads per turn |
| D-03 | Redundant research | Yes | count duplicate file reads |
| D-04 | Artifact dump | Partial | count unlinked new files |
| D-05 | Unrouted execution | Partial | check write ops for workflow refs |
| D-06 | Hallucinated options | No | requires human review |
| D-07 | Upstream amnesia | Yes | check packets for delegation_source |
| D-08 | Ghost connections | Yes | verify referenced paths exist |
| D-09 | Context echo | Yes | count reads per file path |
| D-10 | Scope creep | Yes | compare git diff against scope |
| D-11 | Depth unawareness | Partial | check for orphan trajectories |
| D-12 | No return format | Yes | check packets for return_schema |
| D-13 | Broken chain | Partial | check step execution after failures |
| D-14 | Session rot | Yes | count turns since last health check |
| D-15 | Skill without routing | No | requires behavioral analysis |
