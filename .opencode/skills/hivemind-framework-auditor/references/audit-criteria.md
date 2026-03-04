# Audit Criteria — What "Working" Means

> Load this reference in Modes 1 (AUDIT), 2 (EVALUATE), 3 (INTEGRATE).
> For Mode 2, load ONLY the section relevant to the entity type being evaluated.

---

## 1. Structural Integrity (Static Analysis)

Every Sector-2 entity must pass these checks BEFORE any runtime evaluation.

### S-01: Agent YAML Completeness

**Pass**: All agents in `.opencode/agents/` have these frontmatter fields: `mode`, `tools`, `permissions`, `tasks`, `workflows`, `prompts`
**Check**: `grep -c "^tasks:" .opencode/agents/*.md` — count must equal agent count
**Severity**: P0 — agents without task declarations are invisible to delegation routing
**Fix**: Add missing fields from the agent schema template

### S-02: Command Wiring

**Pass**: Every `kind: router` command has `execution_context` pointing to an existing workflow file
**Check**: `scripts/structural-audit.sh` rule R03
**Severity**: P0 — unwired commands execute without workflow guardrails
**Fix**: Add `execution_context: workflows/<name>.yaml` and verify file exists

### S-03: Workflow V2 Compliance

**Pass**: Every workflow has `contract_version: 2`, `target_agent`, `steps` array where each step has `wave`, `entry_criteria`, `exit_criteria`, `skill_bundles`
**Check**: `scripts/structural-audit.sh` rule R03
**Severity**: P0 — v1 workflows lack guard enforcement and progressive disclosure
**Fix**: Migrate using the workflow pattern in `development-patterns.md` Section 2

### S-04: Skill Registry Sync

**Pass**: Every skill directory in `skills/*/SKILL.md` has a matching entry in `skills/registry.yaml` with `bundle`, `disclosure_level`, `status`
**Check**: `scripts/structural-audit.sh` rule R02
**Severity**: P0 — unregistered skills are invisible to bundle-based loading
**Fix**: Add entry to registry.yaml following existing pattern

### S-05: Parity Sync

**Pass**: Root-level framework assets byte-match their `.opencode/` counterparts after sync
**Check**: `diff -rq agents/ .opencode/agents/` (repeat for commands/, workflows/, skills/)
**Severity**: P1 — parity drift means changes in one location are invisible to the other
**Fix**: Run `npx tsx src/cli/cli.ts sync` or manual copy

### S-06: Template Coverage

**Pass**: Every workflow step that produces output references a matching template in `templates/`
**Check**: Manual audit — grep workflow `steps[].output_template` against `ls templates/`
**Severity**: P1 — missing templates mean agents produce unstructured output
**Fix**: Create template following output structure from workflow step description

### S-07: Reference Coverage

**Pass**: Every prompt that cites domain knowledge references an existing file in `references/`
**Check**: Manual audit — grep prompts for `references/` paths, verify each exists
**Severity**: P2 — missing references mean prompts inject dead links into context
**Fix**: Create reference file or remove the citation from the prompt

### S-08: No Orphan Skills

**Pass**: No skill directory exists without a registry entry; no registry entry lacks a SKILL.md
**Check**: `scripts/structural-audit.sh` rule R02 (bidirectional)
**Severity**: P1 — orphan skills waste discovery tokens or create ghost references
**Fix**: Either add to registry or delete the orphan directory

### S-09: TypeScript Clean

**Pass**: `npx tsc --noEmit` exits 0
**Check**: CI gate / manual run
**Severity**: P0 — type errors indicate broken contracts between Sector-1 components
**Note**: This checks Sector-1 code. Sector-2 auditors should verify Sector-1 hasn't broken Zod schemas that validate Sector-2 YAML.

### S-10: Full Test Pass

**Pass**: `npm test` exits 0, all tests pass
**Check**: CI gate / manual run
**Severity**: P0 — test failures indicate regression
**Note**: Same as S-09 — Sector-2 auditor verifies tests that validate framework assets

---

## 2. Behavioral Integrity (Runtime Verification)

These require actual session execution to verify. Cannot be checked statically.

### B-01: Session Init Guard

**Pass**: `declare_intent` / `map_context(trajectory)` fires before any write operation
**Verify**: Run `/hiveminder status` after fresh session — should show active trajectory
**Severity**: P0 — without session init, drift detection is OFF and work is untracked

### B-02: Delegation Packet Quality

**Pass**: Every `Task()` delegation produces a well-formed packet with `intent_id`, `target_agent`, `scope`, `constraints`, `success_metrics`
**Verify**: Intercept delegation output in session log; check against delegation-intelligence skill (Explicit Delegation Mandatory section)
**Severity**: P0 — malformed packets cause sub-agent scope creep and garbage returns

### B-03: Skill Loading Precision

**Pass**: Only step-declared `skill_bundles` are loaded per workflow step, not all skills
**Verify**: Check session token count before/after workflow step — should increase by <5K per skill, not 50K+
**Severity**: P1 — loading all skills causes D-02 (skill avalanche)

### B-04: Context Rot Detection

**Pass**: `think_back` or `scan_hierarchy` detects drift_score > 60 and triggers recovery
**Verify**: Intentionally inject contradictory context after 15+ turns, observe if recovery triggers
**Severity**: P1 — undetected rot leads to contradictory decisions

### B-05: Memory Classification

**Pass**: Session outputs are auto-classified into schema: discovery/research/planning/implementing/debug/testing
**Verify**: Check `.hivemind/memory/` after diverse task execution
**Severity**: P2 — unclassified memories are unsearchable in future sessions

### B-06: Guard Enforcement

**Pass**: Workflow guards HALT execution on check failure (not silently skip)
**Verify**: Deliberately violate a guard condition, confirm execution stops
**Severity**: P0 — silent guard skipping defeats the entire governance model

### B-07: Chain Trace

**Pass**: Command -> Workflow -> Skill -> Agent execution path is traceable from output
**Verify**: Review session logs for unbroken chain from user command to agent action
**Severity**: P2 — broken chains mean debugging delegation failures is impossible

### B-08: Return Format Compliance

**Pass**: Delegated sub-agents return structured results matching delegation packet's `return_schema`
**Verify**: Compare completed task output structure against packet's expected format
**Severity**: P1 — unstructured returns force parent to re-investigate or guess

---

## 3. Non-Destructive Coexistence (Sector-1 <-> Sector-2)

### C-01: Sector-2 Independence

**Pass**: Removing all `src/` (Sector-1) still allows Sector-2 framework assets to function as static configuration that agents can read and follow
**Verify**: In a clean checkout without `src/`, verify agents can still discover commands, read workflows, load skills
**Severity**: P0 — Sector-2 must work standalone for manual/non-programmatic use

### C-02: No Overwrite Without Backup

**Pass**: Sector-1 init/sync never overwrites user-modified `.opencode/agents/*.md` without creating a backup
**Verify**: Modify an agent file, run sync, check if backup was created
**Severity**: P0 — user customizations are sacred

### C-03: Schema Compatibility

**Pass**: Sector-1 Zod schemas validate all Sector-2 YAML without errors
**Verify**: Run schema validation on all workflow/command YAML files
**Severity**: P1 — schema drift means Sector-1 rejects valid Sector-2 configs

### C-04: Config Respect

**Pass**: User's `opencode.json` and global config are never overwritten by framework installation. Specifically:
- `opencode.json` top-level fields (`model`, `permission`, `provider`, `agent`) are user-owned
- Agent-specific overrides in `opencode.json > agent.{name}` (model, mode, temperature, etc.) survive sync
- User language preferences (communication language, document language) persist across sessions and turns
- MCP server configuration is additive (new servers added, existing preserved)
**Verify**: Modify `opencode.json` agent settings, run sync, verify settings preserved
**Severity**: P0 — config overwrite breaks user's environment and preferences

### C-05: AGENTS.md Preservation

**Pass**: Existing `AGENTS.md` and `CLAUDE.md` (if user has them) are appended to, not replaced
**Verify**: Check sync logic for append vs overwrite behavior
**Severity**: P0 — replacing AGENTS.md destroys user's cross-session instructions

---

## 4. Extended Structural Integrity (Entity Quality)

These criteria extend S-01→S-10 to cover meta-entity types that were not validated in the base set.

### S-11: Prompt Quality

**Pass**: Every file in `prompts/` has: (1) a clear title, (2) actionable instructions (not just descriptions), (3) explicit "Never Do" guidance, (4) connection to at least one command via `required_prompts`
**Check**: For each prompt, `grep -rl "$(basename prompt)" commands/` returns at least one match
**Severity**: P1 — orphan prompts waste discovery; vague prompts produce agent guesswork

### S-12: Template Structure Validation

**Pass**: Every file in `templates/` has: (1) clearly marked placeholder variables (e.g., `{{variable}}`), (2) section structure matching the workflow step that uses it, (3) connection to at least one command or workflow via `required_templates`
**Check**: `grep -c '{{' templates/*.md` shows each template has ≥1 placeholder; `grep -rl "$(basename template)" commands/ workflows/` returns matches
**Severity**: P1 — templates without placeholders are just documentation; unlinked templates are invisible

### S-13: Reference Completeness

**Pass**: Every file in `references/` is: (1) referenced by at least one command, workflow, or skill, (2) contains domain-specific knowledge (not generic advice), (3) has a table of contents if >100 lines
**Check**: `grep -rl "$(basename ref)" commands/ workflows/ skills/` returns matches for each reference
**Severity**: P2 — orphan references waste storage; generic references waste context tokens

### S-14: Command Body Quality (GREEN-FLAG Pattern)

**Pass**: Every `kind: router` command body contains: (1) `<objective>` or `## Objective` section, (2) `<context>` or `## Context` with deterministic bash checks, (3) `<process>` or `## Process` with numbered steps, (4) `<success_criteria>` or `## Success Criteria` with checkboxes
**Check**: `grep -c "objective\|Objective" commands/*.md` for each router command
**Severity**: P1 — commands without structured bodies produce inconsistent agent behavior
**Note**: `kind: utility` commands may use simpler structure; this criterion applies to `kind: router` only

### S-15: Agent Reference Integrity

**Pass**: Every `references:` field in agent frontmatter points to an existing file in `references/`. Every `workflows:` entry points to an existing workflow YAML. Every `prompts:` entry points to an existing prompt file.
**Check**: Extract agent YAML fields, verify each reference resolves to a real file
**Severity**: P1 — broken agent references cause silent failures during delegation

### S-16: Command Chain Consistency

**Pass**: Every `chain_group` value used across commands is consistent (same group → same owner_agent or logical domain). Every `alias_resolved_to` value points to itself or a valid command name.
**Check**: `grep "chain_group:" commands/*.md | sort | uniq -c` shows logical grouping; `grep "alias_resolved_to:" commands/*.md` values exist as command names
**Severity**: P1 — inconsistent chain groups break command discovery and grouping

### S-17: Workflow Hand-off Validation

**Pass**: When a workflow's step N has `target_agent: A` and step N+1 has `target_agent: B`, the exit_criteria of step N matches the entry_criteria of step N+1 (hand-off contract)
**Check**: Manual audit — compare adjacent steps with different target_agents
**Severity**: P1 — broken hand-offs cause the receiving agent to start from scratch

### S-18: Planning Artifact Hierarchy

**Pass**: Planning artifacts in `.hivemind/` follow the hierarchy: `project/ > planning/ > phases/ > tasks/`. Files at each level reference their parent. No orphan artifacts exist at any level.
**Check**: `find .hivemind/project -type f | head -20` shows structured hierarchy; grep for `parent:` or `phase:` references in artifacts
**Severity**: P2 — flat artifact dumps cause D-04 (planning artifact dump)

---

## 5. User Configuration Preservation (Extended Coexistence)

### C-06: Language Preference Persistence

**Pass**: When user sets communication language (e.g., Vietnamese) or document language in agent config or session, that preference persists across: (1) turns within a session, (2) compaction events, (3) session restarts
**Verify**: Set language preference in opencode.json `agent` block or AGENTS.md, compact session, verify preference survives
**Severity**: P1 — language reset forces user to re-specify every session, breaking accessibility

### C-07: Model/Provider Override Preservation

**Pass**: User-specified `model`, `temperature`, `reasoningEffort`, `textVerbosity` in `opencode.json > agent.{name}` blocks are never overwritten by framework sync or init
**Verify**: Set custom model in opencode.json for an agent, run sync, verify model setting unchanged
**Severity**: P0 — model overwrite can incur unexpected costs or degrade performance

### C-08: Permission Granularity Preservation

**Pass**: User's fine-grained permission rules (e.g., `bash: { "git push": "ask", "*": "allow" }`) survive framework operations intact — not flattened to simple `bash: "allow"`
**Verify**: Set granular permissions, run init/sync, verify nested permission structure preserved
**Severity**: P0 — permission flattening is a security regression
