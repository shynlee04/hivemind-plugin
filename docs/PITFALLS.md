# HiveMind Context Governance — PITFALLS

> **Document ID:** PITFALLS-2026-02-27  
> **Version:** 1.0.0  
> **Purpose:** Comprehensive catalog of anti-patterns, failure modes, and remediation strategies for the HiveMind framework.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Architecture Pitfalls](#2-architecture-pitfalls)
3. [Context Engineering Pitfalls](#3-context-engineering-pitfalls)
4. [Delegation Pitfalls](#4-delegation-pitfalls)
5. [Session Management Pitfalls](#5-session-management-pitfalls)
6. [Asset Design Pitfalls](#6-asset-design-pitfalls)
7. [Integration Pitfalls](#7-integration-pitfalls)
8. [User Experience Pitfalls](#8-user-experience-pitfalls)
9. [Quick Reference: Severity Classification](#9-quick-reference-severity-classification)
10. [Detection & Remediation Scripts](#10-detection--remediation-scripts)

---

## 1. Executive Summary

HiveMind is a context governance framework for AI agent teams. Its primary purpose is preventing **context poisoning**, **drift**, and **intelligence loss** across sessions. This document catalogs the known failure modes organized by domain.

### The Three Core Failure Categories

| Category | What Fails | Token Impact | Recovery Difficulty |
|----------|-----------|--------------|---------------------|
| **Token Waste** | Efficiency — burning context without value | 5K-50K per occurrence | Low (just stop doing it) |
| **Context Poisoning** | Quality — degrading agent reasoning | Compounds across turns | Medium (requires recovery) |
| **Governance Failure** | Structure — breaking the framework model | Systemic | High (requires architectural fix) |

### Critical Statistics (From Brain State)

```json
{
  "turn_count": 116,
  "drift_score": 70,
  "context_updates": 78,
  "governance_counters": {
    "evidence_pressure": 232,
    "ignored": 112
  }
}
```

**Warning Signs:**
- `drift_score < 60` → Context rot detected
- `drift_score < 40` → HALT and recover
- `ignored > 100` → Governance warnings being bypassed

---

## 2. Architecture Pitfalls

### PITFALL-ARCH-01: Sector Coupling Toxicity

**What:** Sector-1 (`src/`) and Sector-2 (`.opencode/`, root assets) have tangled dependencies that cause cascading failures.

**Symptoms:**
- Changes to `src/lib/` break YAML validation unexpectedly
- Sync operations destroy user configurations
- Tests pass but runtime behavior differs

**Root Cause:** Sector-1 was built with implicit assumptions about Sector-2 structure that weren't codified in schemas.

**Example from Project:**
```typescript
// BAD: Implicit coupling
const agentMode = agentYaml.mode; // Assumes 'mode' field exists

// GOOD: Schema-validated access
const agentMode = AgentSchema.parse(agentYaml).mode;
```

**Remediation:**
1. All Sector-1 → Sector-2 access must go through Zod schemas
2. Schema changes require migration scripts
3. Never assume YAML structure — always validate

**Severity:** P0 — architectural foundation

---

### PITFALL-ARCH-02: CQRS Contract Violations

**What:** Hooks read state that only tools should mutate, causing stale data and race conditions.

**Symptoms:**
- Brain state shows one value, filesystem shows another
- Compaction events lose data
- Session splits produce orphan artifacts

**Root Cause:** Hook-to-tool ownership boundaries weren't enforced at runtime.

**Historical Context:**
- Phase 3 remediation (2026-02-19): Hook-side flush ownership removed
- Contract isolation: Retrieval ownership isolated to tools

**Contract Rules:**
| Operation | Owner | Allowed In |
|-----------|-------|------------|
| Read state | Hooks | `session-lifecycle.ts`, `sdk-context.ts` |
| Write state | Tools | `hivemind-session.ts`, `hivemind-context.ts` |
| Flush/compact | Tools | `hivemind-cycle.ts` |

**Remediation:**
1. Hooks MUST NOT call `writeFile` on state files
2. Tools MUST NOT inject context directly (use hooks)
3. Any violation triggers `contract_isolation` test failure

**Severity:** P0 — data integrity

---

### PITFALL-ARCH-03: Foreign Key Integrity Gaps

**What:** Graph nodes reference non-existent parent entities, causing orphan data and broken traversals.

**Symptoms:**
- `mems.json` entries with no corresponding trajectory
- Session exports missing context
- `think_back` returns incomplete history

**Historical Context:**
- Phase 2 remediation (2026-02-19): Added `session_id` FK to `MemNodeSchema`
- Migration: `backfillMemSessionId()` for existing orphan mems

**FK Constraints:**
```
MemNode.session_id → Trajectory.id
Action.tactic_id → Tactic.id
Tactic.trajectory_id → Trajectory.id
```

**Remediation:**
1. All node creation must use `addGraphMem()` (validates FK)
2. Run `graph-migrate.ts` after schema changes
3. Monitor `orphans.json` for new orphans

**Severity:** P0 — data integrity

---

### PITFALL-ARCH-04: Parity Drift Between Root and .opencode

**What:** Root-level assets (`agents/`, `commands/`) diverge from `.opencode/` mirrors, causing inconsistent behavior.

**Symptoms:**
- Agent works in one context but not another
- Changes appear "lost" after restart
- Validation passes in root but fails in `.opencode`

**Detection:**
```bash
diff -rq agents/ .opencode/agents/
diff -rq commands/ .opencode/commands/
```

**Root Cause:** Sync was destructive (rsync overwrite) instead of smart merge.

**Remediation:**
1. Use `npx tsx src/cli/sync-assets.ts` (smart merge)
2. Smart merge preserves user-owned fields: `model`, `mode`, `temperature`, `reasoningEffort`, etc.
3. Never use raw `cp` or `rsync` for asset sync

**Severity:** P1 — operational consistency

---

## 3. Context Engineering Pitfalls

### PITFALL-CTX-01: Skill Avalanche (D-02)

**What:** Loading 5+ skill bodies in one turn, filling 50K+ tokens with governance text.

**Token Impact:** 25% of context window consumed per occurrence

**Symptoms:**
- Token usage spikes >40K in single turn
- Multiple `skill()` calls without workflow step context
- Agent "knows" everything but can't act

**Detection Script:**
```bash
# Count skill-load events per turn in session log
grep -c "skill(" session.log
# Flag turns with >3 loads
```

**Root Cause:** Agent loads every "might be useful" skill instead of using progressive disclosure.

**Progressive Disclosure Model:**
| Level | What Loads | When | Token Cost |
|-------|-----------|------|------------|
| L0 — Discovery | Skill name + description | Always | ~100 tokens |
| L1 — Triage | SKILL.md body | On trigger | ~500-2K tokens |
| L2 — Domain | Specific reference file | On explicit read | ~1K-5K tokens |
| L3 — Deep | All references + scripts | Full audit mode | ~5K-15K tokens |

**Remediation:**
1. Load ONLY step-declared `skill_bundles` per workflow step
2. NEVER load skills "just in case"
3. Use mode router to gate L2/L3 loading

**Severity:** P0 — context capacity

---

### PITFALL-CTX-02: Context Echo (D-09)

**What:** Re-reading the same file multiple times in one session without caching.

**Token Impact:** 1-3K tokens per redundant read

**Symptoms:**
- Session log shows 3+ reads of same file path
- Agent "forgets" what it just read
- Turn count grows without progress

**Detection Script:**
```bash
# Count Read() calls per unique file path
grep "Read(" session.log | awk '{print $NF}' | sort | uniq -c | sort -rn
# Flag paths with >2 reads
```

**Root Cause:** Agent doesn't maintain session-scoped file cache.

**Remediation:**
1. Cache file contents in session-scoped memory after first read
2. Use `hivemind_session_memory scratch` for frequently-referenced content
3. Check cache before any `read_file` call

**Severity:** P2 — efficiency

---

### PITFALL-CTX-03: Session Rot Ignored (D-14)

**What:** Agent continues working after 20+ turns without context health check.

**Token Impact:** Later turns contradict earlier decisions

**Symptoms:**
- Agent contradicts earlier decision within same session
- `drift_score` drops below 60
- Output inconsistent with active trajectory

**Detection:**
```json
// From brain.json
{
  "metrics": {
    "turn_count": 116,
    "drift_score": 70  // Below 60 = danger
  }
}
```

**Root Cause:** No automatic trigger for `scan_hierarchy` at turn thresholds.

**Remediation:**
1. Auto-trigger `scan_hierarchy` every 10 turns
2. If `drift_score < 60`: STOP, run `think_back`, realign
3. If `drift_score < 40`: HALT, explain to user, request guidance

**Severity:** P1 — decision quality

---

### PITFALL-CTX-04: Hallucinated Options (D-06)

**What:** Presenting choices to user that are disconnected from conversation history or project state.

**Token Impact:** Wastes user decision-making time on invalid choices

**Symptoms:**
- User reports "none of these match what we're doing"
- Options reference nonexistent files or artifacts
- Agent suggests paths that don't exist

**Detection:**
```bash
# Extract presented options; verify each references real entity
grep -E "(option|choice|alternative)" session.log | verify_references.sh
```

**Root Cause:** Agent generates plausible-sounding options from training data rather than project context.

**Remediation:**
1. ALL presented options must cite specific files, artifacts, or prior turns
2. Add validation step: before presenting options, verify each option's referenced entities exist
3. Use `[ -f path ]` checks for file references

**Severity:** P1 — trust erosion

---

## 4. Delegation Pitfalls

### PITFALL-DELEG-01: Upstream Amnesia (D-07)

**What:** Sub-agent doesn't know delegation source was another agent (not human).

**Token Impact:** Infinite clarification loops

**Symptoms:**
- Sub-agent asks user for information parent agent already provided
- Sub-agent treats delegation instructions as user conversation
- Context re-requested that was in delegation packet

**Detection:**
```bash
# Check delegation packets for missing delegation_source
grep -L "delegation_source" .hivemind/sessions/*/delegation-*.json
```

**Root Cause:** Delegation packet lacks `delegation_source` field.

**Required Packet Fields:**
```yaml
delegation_packet:
  delegation_source: "agent"          # vs "human" — CRITICAL
  delegation_depth: 1                 # How many levels deep
  parent_agent: "hiveminder"          # Who delegated
  parent_context_summary: "2-3 lines of context"
```

**Remediation:**
1. Include `delegation_source: agent` in EVERY Task() packet
2. Sub-agents MUST check this field before asking for clarification
3. Track `delegation_depth` to prevent infinite chains

**Severity:** P0 — delegation chain integrity

---

### PITFALL-DELEG-02: Scope Creep in Delegation (D-10)

**What:** Delegated task expands beyond declared scope and modifies unexpected files.

**Token Impact:** Cascading regressions, broken parallel delegation isolation

**Symptoms:**
- `git diff --name-only` shows files outside `in_scope_paths`
- Sub-agent "helpfully" fixes adjacent issues
- Tests fail for unrelated components

**Detection:**
```bash
# Compare modified files against delegation packet scope
git diff --name-only | grep -v -F -f in_scope_paths.txt
```

**Root Cause:** Sub-agent's "helpful" instinct leads it to fix adjacent issues outside mandate.

**Remediation:**
1. Define `in_scope_paths` AND `out_of_scope_paths` in every packet
2. Set `failure_policy: "STOP and return error"` for scope violations
3. Guard checks modified files against scope BEFORE commit

**Severity:** P0 — isolation boundary

---

### PITFALL-DELEG-03: No Return Format (D-12)

**What:** Sub-agent completes work but returns unstructured prose instead of structured result.

**Token Impact:** 5-10K tokens wasted on re-processing

**Symptoms:**
- Parent agent can't programmatically parse result
- Triggers re-investigation to extract information
- Inconsistent output formats across delegations

**Detection:**
```bash
# Check delegation packets for missing return_schema
grep -L "return_schema" commands/*.md
```

**Root Cause:** Delegation packet lacks explicit `return_schema`.

**Required Return Schema:**
```yaml
return_schema:
  format: "structured"
  fields:
    - status: "success | partial | failure"
    - files_modified: "string[]"
    - evidence: "string"
    - issues: "string[]"
```

**Remediation:**
1. Define explicit `return_schema` in EVERY delegation packet
2. Sub-agent MUST format return to match schema
3. Parent validates against schema before proceeding

**Severity:** P1 — handoff efficiency

---

### PITFALL-DELEG-04: Depth Unawareness (D-11)

**What:** Sub-agent doesn't distinguish user messages from parent delegation instructions.

**Token Impact:** Orphan trajectories pollute hierarchy tree

**Symptoms:**
- Sub-agent starts new trajectory instead of continuing parent's action chain
- Hierarchy tree shows disconnected branches
- `map_context` creates wrong-level nodes

**Detection:**
```bash
# Check for orphan trajectories
grep -L "parent:" .hivemind/state/hierarchy.json
```

**Root Cause:** Task() prompt treated as "user said this" rather than "parent agent delegated this."

**Remediation:**
1. Set `is_delegated: true` + `delegation_depth: N` in every Task packet
2. Sub-agent MUST NOT create new trajectories — only action-level nodes under parent's tactic
3. Validate hierarchy tree integrity after delegation returns

**Severity:** P0 — hierarchy integrity

---

## 5. Session Management Pitfalls

### PITFALL-SESS-01: Missing Session Initialization

**What:** Agent starts work without `declare_intent`, bypassing drift detection.

**Token Impact:** Entire session untracked

**Symptoms:**
- No trajectory in `hierarchy.json`
- `brain.json` shows `governance_status: "OPEN"` indefinitely
- Context warnings pile up without resolution

**Detection:**
```json
// Check brain.json at session start
{
  "session": { "mode": "" },  // Empty = not initialized
  "hierarchy": { "trajectory": "" }  // Empty = drift detection OFF
}
```

**Root Cause:** Agent skips initialization to "get to work faster."

**Required Initialization:**
```
1. declare_intent({ mode: "plan_driven" | "quick_fix" | "exploration", focus: "..." })
2. map_context({ level: "trajectory", content: "..." })
3. Read STATE.md (if exists)
4. recall_mems --query "active plan" --limit 3
5. User confirmation before first write
```

**Remediation:**
1. NO write operations before `declare_intent` fires
2. Hook enforcement: block writes if trajectory missing
3. Session-lifecycle hook validates initialization

**Severity:** P0 — governance foundation

---

### PITFALL-SESS-02: Broken Chain (D-13)

**What:** Workflow steps execute without checking `entry_criteria` from previous step.

**Token Impact:** Garbage artifacts that look valid

**Symptoms:**
- Step N produces invalid output because Step N-1 failed silently
- Guards log warnings but don't halt
- Cascading failures across workflow

**Detection:**
```bash
# Check workflow execution logs for steps that ran despite failures
grep "entry_criteria.*FAIL" workflow.log | grep -v "HALT"
```

**Root Cause:** Guard enforcement is passive (logs warning) instead of active (halts execution).

**Remediation:**
1. Guard enforcement MUST HALT execution on check failure
2. Each step verifies its own `entry_criteria` before starting
3. Never rely on previous step's `exit_criteria` alone

**Severity:** P0 — workflow integrity

---

### PITFALL-SESS-03: Compaction Without Persistence

**What:** Session compacted without saving critical intelligence to filesystem.

**Token Impact:** All accumulated context lost

**Symptoms:**
- Next session starts "fresh" with no memory
- Decisions must be re-made
- Previous work appears undone

**What Survives vs What Dies:**
| Entity | Survives Session? | Survives Compact? |
|--------|-------------------|-------------------|
| Agent YAML frontmatter | Always | Always |
| AGENTS.md | Always | Always |
| `.hivemind/` state | Always | Always |
| Anchors | Always | Always |
| Memories (mems) | Always | Always |
| Conversation history | In session | **LOST** |
| Skill bodies | On trigger | **LOST** |
| Command bodies | On invoke | **LOST** |

**Remediation:**
1. Run session end checklist before ANY compaction
2. Save anchors for critical decisions
3. Classify session memory before compact
4. Update STATE.md with decisions and blockers

**Severity:** P0 — intelligence preservation

---

### PITFALL-SESS-04: Mid-Session Topic Switch

**What:** User changes topic entirely without closing current context.

**Token Impact:** Previous context pollutes new topic decisions

**Symptoms:**
- Agent references old topic in new context
- Decisions contradict earlier work
- `drift_score` drops rapidly

**Remediation:**
1. Detect topic switch via intent comparison
2. Save current state with `compact_session` summary
3. Start new trajectory for new topic
4. Keep old trajectory accessible via `think_back`

**Severity:** P1 — context coherence

---

## 6. Asset Design Pitfalls

### PITFALL-ASSET-01: Unwired Command (S-02)

**What:** Command has `kind: router` but no `execution_context` pointing to workflow.

**Token Impact:** Command executes without workflow guardrails

**Symptoms:**
- Command runs but bypasses governance
- No entry/exit criteria enforced
- Skills not loaded via progressive disclosure

**Detection:**
```bash
# Find router commands without execution_context
grep -l "kind: router" commands/*.md | xargs grep -L "execution_context:"
```

**Remediation:**
1. Add `execution_context: workflows/<name>.yaml` to every router command
2. Verify workflow file exists
3. Run `structural-audit.sh` S-02 check

**Severity:** P0 — command governance

---

### PITFALL-ASSET-02: Workflow V1 Remnants (S-03)

**What:** Workflow lacks `contract_version: 2` or missing required fields.

**Token Impact:** Old workflows bypass guards

**Symptoms:**
- Steps without `skill_bundles` trigger D-02
- Missing `entry_criteria` triggers D-13
- No `target_agent` causes routing confusion

**Required V2 Fields:**
```yaml
contract_version: 2
name: workflow-name
target_agent: agent-name
steps:
  - name: step-name
    wave: 1
    skill_bundles: [bundle-name]
    entry_criteria: "precondition"
    exit_criteria: "postcondition"
guards:
  - rule: guard-name
    check: "deterministic condition"
```

**Remediation:**
1. Migrate all v1 workflows using development-patterns.md Section 2
2. Run `structural-audit.sh` S-03 check
3. Delete or archive v1 workflows

**Severity:** P0 — workflow governance

---

### PITFALL-ASSET-03: Skill Without Routing (D-15)

**What:** Skill body loaded but agent doesn't follow its instructions.

**Token Impact:** 3-15K tokens burned with no behavioral benefit

**Symptoms:**
- Skill in context but actions don't match workflow
- Agent "has" the skill but doesn't use it
- No routing checkpoint after skill load

**Root Cause:** Skill loaded as passive context rather than active instruction.

**Remediation:**
1. Skill loader must inject body as active instruction with routing checkpoint
2. After loading, agent MUST acknowledge which workflow path it's following
3. Include "NEVER Do" section in every skill

**Severity:** P1 — skill effectiveness

---

### PITFALL-ASSET-04: Orphan Templates/References (S-06, S-07)

**What:** Templates or references exist but no command/workflow references them.

**Token Impact:** Discovery tokens wasted on invisible assets

**Symptoms:**
- Template file exists but never used
- Reference content not injected anywhere
- Asset audit shows "unlinked" status

**Detection:**
```bash
# Find templates not referenced by any command/workflow
for t in templates/*.md; do
  name=$(basename "$t")
  grep -rq "$name" commands/ workflows/ || echo "ORPHAN: $t"
done
```

**Remediation:**
1. Wire template to command's `required_templates`
2. Wire reference to skill's references section
3. Delete truly unused assets

**Severity:** P2 — asset hygiene

---

### PITFALL-ASSET-05: Agent Missing Tasks Field (S-01)

**What:** Agent frontmatter lacks `tasks:` field.

**Token Impact:** Agent invisible to delegation routing

**Symptoms:**
- Agent not considered for task delegation
- Routing logic skips this agent
- "No eligible agent" errors

**Historical Context:**
- Wave 2-P0 fix (2026-02-27): Added `tasks: {}` to 6 agents

**Required Agent Fields:**
```yaml
---
mode: primary | subagent | all
tools: [tool-list]
permissions: { permission-map }
tasks: { task-map }        # REQUIRED even if empty
workflows: [workflow-list]
prompts: [prompt-list]
---
```

**Remediation:**
1. Add `tasks: {}` to every agent frontmatter
2. Run `structural-audit.sh` S-01 check
3. Sync to `.opencode/agents/`

**Severity:** P0 — agent discoverability

---

## 7. Integration Pitfalls

### PITFALL-INT-01: Zod Schema Drift (C-03)

**What:** Sector-1 Zod schemas reject valid Sector-2 YAML.

**Token Impact:** Valid configurations fail unexpectedly

**Symptoms:**
- YAML that worked yesterday fails validation
- Schema error messages reference wrong fields
- Tests fail after schema update

**Root Cause:** Schema updated without migrating existing YAML files.

**Remediation:**
1. Schema changes require migration script
2. Run migration on all existing YAML before deploying schema
3. C-03 check in every wave gate

**Severity:** P1 — compatibility

---

### PITFALL-INT-02: Config Overwrite (C-04, C-07)

**What:** Framework sync overwrites user's `opencode.json` or agent settings.

**Token Impact:** User environment destroyed

**Symptoms:**
- Custom model settings lost
- Permission rules flattened
- Temperature/reasoning settings reset

**Historical Context:**
- P0 blocker (2026-02-21): rsync sync destroyed user OpenCode config
- Fix: Smart merge sync implemented

**User-Owned Fields (PRESERVE):**
```yaml
model: "custom-model"
mode: "primary"
temperature: 0.7
reasoningEffort: "high"
textVerbosity: "high"
reasoningSummary: "auto"
permissions:
  bash:
    "git push": "ask"
    "*": "allow"
```

**Remediation:**
1. Use smart merge sync (preserves user fields)
2. NEVER flatten nested permission structures
3. Run preservation verification after sync

**Severity:** P0 — user trust

---

### PITFALL-INT-03: MCP Server Connection Failures

**What:** Free MCP servers (Context7, DeepWiki, Repomix) fail due to rate limiting or timeouts.

**Token Impact:** Research workflows incomplete

**Symptoms:**
- "Connection timeout" errors
- Partial synthesis results
- Agent hallucinates instead of researching

**Known Limitations:**
| Server | Limitation | Workaround |
|--------|-----------|------------|
| Context7 | Official docs only, rate limits | Cache results, fallback to web search |
| DeepWiki | Needs public GitHub repo, shallow synthesis | Sequential questions, validate repo link first |
| Repomix | Connection issues, large repos | Download locally, use as library |

**Remediation:**
1. Implement retry with exponential backoff
2. Cache successful results in `.hivemind/`
3. Have fallback research path (web search)
4. Download large repos for local analysis

**Severity:** P1 — research capability

---

### PITFALL-INT-04: Language Preference Reset (C-06)

**What:** User's communication language preference doesn't persist across sessions/compactions.

**Token Impact:** Accessibility broken, user must re-specify every session

**Symptoms:**
- Agent responds in wrong language after compact
- Language setting in `opencode.json` ignored
- AGENTS.md language preference lost

**Remediation:**
1. Persist language in `.hivemind/config.json`
2. Read language preference at session start
3. Inject into every turn's system context

**Severity:** P1 — accessibility

---

## 8. User Experience Pitfalls

### PITFALL-UX-01: Wall-of-Text Prompt

**What:** User dumps massive unstructured prompt with nested ideas.

**Token Impact:** D-02 (avalanche) + D-04 (artifact dump)

**Symptoms:**
- Agent tries to address everything at once
- No clear priority or sequencing
- Context fills with conflicting goals

**Mitigation:**
1. Parse prompt into discrete requirements
2. Classify each by priority and complexity
3. Create structured plan before executing
4. Address one requirement at a time

**Severity:** P2 — user behavior

---

### PITFALL-UX-02: Contradictory Instructions

**What:** User gives instructions that contradict earlier decisions or anchors.

**Token Impact:** Agent follows latest instruction, breaking commitments

**Symptoms:**
- New instruction conflicts with anchor
- Agent doesn't detect contradiction
- Previous decision silently overridden

**Mitigation:**
1. Check new instruction against anchors and recent mems
2. If contradiction: present both positions to user
3. Get explicit "override previous decision" confirmation
4. Update anchor if decision changes

**Severity:** P1 — decision integrity

---

### PITFALL-UX-03: Random Agent Selection

**What:** User starts complex task with wrong agent.

**Token Impact:** Low-quality work, out-of-role execution

**Symptoms:**
- Planning task sent to execution agent
- Research task sent to build agent
- Agent operates outside role boundaries

**Agent Role Matrix:**
| Agent | Role | Correct For |
|-------|------|-------------|
| hiveminder | Primary/Coordinator | Orchestration, delegation, governance |
| hivefiver | Meta-builder | Framework construction, skill creation |
| hivemaker | Builder | Implementation, code changes |
| hivexplorer | Researcher | Codebase investigation, synthesis |
| hivehealer | Fixer | Debugging, repair, recovery |
| hiveplanner | Planner | Phase planning, research, knots |
| hiveq | QA | Testing, validation, gatekeeping |
| hiverd | Researcher | Web research, documentation |

**Mitigation:**
1. Agent checks role boundaries against task type
2. If mismatch: suggest correct agent with routing reason
3. If user insists: proceed but flag as out-of-role

**Severity:** P2 — quality assurance

---

## 9. Quick Reference: Severity Classification

| Severity | Definition | Response Time | Authorization |
|----------|-----------|---------------|---------------|
| **P0** | System broken / data loss / governance failure | Immediate | Auto-fix allowed |
| **P1** | Quality degraded / efficiency loss | Within session | Auto-fix with tracking |
| **P2** | Minor issue / user experience | Next available | User approval preferred |

### P0 Triggers (STOP and fix immediately)
- Missing `declare_intent`
- D-02 skill avalanche
- D-07 upstream amnesia
- D-10 scope creep
- D-13 broken chain
- S-01 missing agent tasks
- S-02 unwired command
- S-03 workflow v1
- C-04 config overwrite
- ARCH-02 CQRS violation
- ARCH-03 FK integrity gap

### P1 Triggers (Fix within session)
- D-03 redundant research
- D-04 artifact dump
- D-06 hallucinated options
- D-08 ghost connections
- D-09 context echo
- D-11 depth unawareness
- D-12 no return format
- D-14 session rot
- D-15 skill without routing
- S-05 parity drift
- S-06 template coverage
- C-03 schema drift
- C-06 language reset

### P2 Triggers (Address when convenient)
- D-01 lint-on-docs
- S-07 reference coverage
- S-08 orphan skills
- UX-01 wall-of-text
- UX-03 random agent

---

## 10. Detection & Remediation Scripts

### Structural Audit

```bash
# Run full structural audit
bash .opencode/skills/hivemind-framework-auditor/scripts/structural-audit.sh

# Checks S-01 through S-18
# Output: PASS/FAIL/WARN per criterion
```

### Anti-Pattern Detection

```bash
# Run anti-pattern detector
bash .opencode/skills/hivemind-framework-auditor/scripts/anti-pattern-detector.sh

# Checks D-01 through D-15
# Output: DETECTED/CLEAN/SKIPPED per pattern
```

### Parity Check

```bash
# Verify root ↔ .opencode parity
diff -rq agents/ .opencode/agents/ && echo "AGENTS: OK" || echo "AGENTS: DRIFT"
diff -rq commands/ .opencode/commands/ && echo "COMMANDS: OK" || echo "COMMANDS: DRIFT"
diff -rq workflows/ .opencode/workflows/ && echo "WORKFLOWS: OK" || echo "WORKFLOWS: DRIFT"
```

### Health Check

```bash
# Full verification gate
npx tsc --noEmit   # TypeScript clean
npm test           # All tests pass
npm run guard:public  # Public release safety
```

### Session State Check

```bash
# Check brain state health
cat .hivemind/state/brain.json | jq '{
  turn_count: .metrics.turn_count,
  drift_score: .metrics.drift_score,
  governance_status: .session.governance_status,
  trajectory: .hierarchy.trajectory
}'
```

---

## Appendix: Cross-Reference Index

### By Anti-Pattern ID

| ID | Name | Section |
|----|------|---------|
| D-01 | Lint-on-docs | PITFALL-CTX-01 (related) |
| D-02 | Skill avalanche | PITFALL-CTX-01 |
| D-03 | Redundant research | PITFALL-CTX-02 (related) |
| D-04 | Artifact dump | PITFALL-ASSET-04 (related) |
| D-05 | Unrouted execution | PITFALL-ASSET-01 |
| D-06 | Hallucinated options | PITFALL-CTX-04 |
| D-07 | Upstream amnesia | PITFALL-DELEG-01 |
| D-08 | Ghost connections | PITFALL-CTX-04 (related) |
| D-09 | Context echo | PITFALL-CTX-02 |
| D-10 | Scope creep | PITFALL-DELEG-02 |
| D-11 | Depth unawareness | PITFALL-DELEG-04 |
| D-12 | No return format | PITFALL-DELEG-03 |
| D-13 | Broken chain | PITFALL-SESS-02 |
| D-14 | Session rot | PITFALL-CTX-03 |
| D-15 | Skill without routing | PITFALL-ASSET-03 |

### By Audit Criterion ID

| ID | Name | Section |
|----|------|---------|
| S-01 | Agent YAML completeness | PITFALL-ASSET-05 |
| S-02 | Command wiring | PITFALL-ASSET-01 |
| S-03 | Workflow V2 compliance | PITFALL-ASSET-02 |
| S-05 | Parity sync | PITFALL-ARCH-04 |
| S-06 | Template coverage | PITFALL-ASSET-04 |
| S-07 | Reference coverage | PITFALL-ASSET-04 |
| C-03 | Schema compatibility | PITFALL-INT-01 |
| C-04 | Config respect | PITFALL-INT-02 |
| C-06 | Language persistence | PITFALL-INT-04 |
| C-07 | Model/provider preservation | PITFALL-INT-02 |

---

*Document maintained by HiveMind Context Governance framework.*  
*Last updated: 2026-02-27*
