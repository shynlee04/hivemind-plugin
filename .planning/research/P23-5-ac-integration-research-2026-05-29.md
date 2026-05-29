# Phase 23.5: A→C Cross-Cluster Integration Gate — Research

**Researched:** 2026-05-29
**Domain:** Agent-Command-Workflow integration audit
**Confidence:** HIGH

## Summary

This research conducts a cross-cluster integration audit between the Agent cluster (hm-* agents in `.opencode/agents/`) and the Commands cluster (hm-* commands in `.opencode/commands/` and `.opencode/command/`). The Workflow cluster (`.opencode/workflows/`) is included as the bridge layer that often dispatches agents independently of command routing.

**Key finding:** The command→agent YAML frontmatter layer is clean — all 14 unique agent targets reference existing agent files. However, **7 agents are orphaned** (no command dispatch, no workflow dispatch), and command descriptions claim more routing than the YAML `agent:` field delivers. The command/command/ directories are in perfect sync — no duplication drift.

**Primary recommendation:** Repair the 7 orphan agents by either (a) routing them to existing commands, (b) creating new commands for them, (c) wiring them into workflow dispatch, or (d) archiving them if they are genuinely dead code. Fix the `hm-plan-phase` description to match its actual agent routing.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Agent definitions | `.opencode/agents/` | — | Canonical agent files |
| Command→agent routing | YAML frontmatter `agent:` field | Workflow body dispatch | Primary routing is YAML; workflows may override for sub-agent dispatch |
| Workflow→agent dispatch | Workflow body (subagent_type, delegate-task) | — | Workflows can spawn agents not directly exposed by commands |
| Agent discovery | OpenCode agent registration | — | Agents must exist as files to be dispatched |

## Standard Stack

No external packages needed. This is a pure configuration audit spanning three OpenCode primitive directories.

## Complete Inventory

### Agents (31 total)

| Agent | Command Route? | Workflow Dispatch? | Status |
|-------|---------------|-------------------|--------|
| `hm-architect` | ❌ | ❌ | **ORPHAN** |
| `hm-code-fixer` | ✓ (hm-audit-fix) | ❌ | ✅ |
| `hm-code-reviewer` | ✓ (6 cmds) | ❀ (mentioned in workflows) | ✅ |
| `hm-codebase-mapper` | ✓ (hm-map-codebase, hm-graphify) | ❌ | ✅ |
| `hm-debug-session-manager` | ❌ | ❀ (hm-debug) | ✅ (workflow-bridged) |
| `hm-debugger` | ✓ (hm-debug, hm-forensics) | ❌ | ✅ |
| `hm-doc-verifier` | ❌ | ❀ (hm-docs-update) | ✅ (workflow-bridged) |
| `hm-doc-writer` | ❌ | ❀ (hm-docs-update) | ✅ (workflow-bridged) |
| `hm-ecologist` | ❌ | ❌ | **ORPHAN** |
| `hm-executor` | ✓ (5 cmds) | ❌ | ✅ |
| `hm-integration-checker` | ❌ | ❀ (hm-audit-milestone) | ✅ (workflow-bridged) |
| `hm-intel-updater` | ❌ | ❌ | **ORPHAN** |
| `hm-intent-loop` | ✓ (hm-discuss-phase, hm-discuss) | ❀ (workflow mentions) | ✅ |
| `hm-l0-orchestrator` | ❌ | ❌ | **ORPHAN** |
| `hm-nyquist-auditor` | ✓ (9 cmds) | ❌ | ✅ |
| `hm-orchestrator` | ✓ (51 cmds) | ❌ | ✅ |
| `hm-pattern-mapper` | ❌ | ❀ (hm-plan-phase) | ✅ (workflow-bridged) |
| `hm-phase-researcher` | ✓ (4 cmds) | ❀ (workflow mentions) | ✅ |
| `hm-plan-checker` | ❌ | ❀ (hm-plan-phase, hm-execute-phase, hm-verify-work) | ✅ (workflow-bridged) |
| `hm-planner` | ✓ (9 cmds) | ❌ | ✅ |
| `hm-project-researcher` | ✓ (hm-ingest-docs) | ❌ | ✅ |
| `hm-roadmapper` | ✓ (4 cmds) | ❌ | ✅ |
| `hm-security-auditor` | ❌ | ❀ (hm-secure-phase) | ✅ (workflow-bridged) |
| `hm-shipper` | ❌ | ❌ | **ORPHAN** |
| `hm-specifier` | ❌ | ❌ | **SEMI-ORPHAN** |
| `hm-synthesizer` | ❌ | ❀ (listed in table only) | **WEAK** |
| `hm-ui-auditor` | ❌ | ❀ (hm-ui-review) | ✅ (workflow-bridged) |
| `hm-ui-checker` | ❌ | ❀ (hm-ui-phase) | ✅ (workflow-bridged) |
| `hm-ui-researcher` | ❌ | ❀ (hm-ui-phase) | ✅ (workflow-bridged) |
| `hm-user-profiler` | ✓ (hm-profile-user) | ❌ | ✅ |
| `hm-verifier` | ✓ (hm-verify, hm-verify-work) | ❀ (workflow mentions) | ✅ |

Legend: ✓ = directly routed via YAML; ❀ = dispatched/spawned by workflow body; ❌ = not found

### Commands (99 in each directory — perfectly synced)

Command→agent mapping via YAML `agent:` field:

| Target Agent | Count | Command Examples |
|-------------|-------|------------------|
| `hm-orchestrator` | 51 | Most routing commands |
| `hm-planner` | 9 | hm-plan-phase, hm-spec-phase, hm-mvp-phase, hm-ui-phase, hm-hf-prompt-enhance-to-plan, hm-ai-integration-phase, hm-plan, hm-plan-review-convergence, hm-ultraplan-phase |
| `hm-nyquist-auditor` | 9 | hm-audit, hm-audit-milestone, hm-audit-uat, hm-validate-phase, hm-secure-phase, hm-doctor, hm-harness-doctor, hm-harness-audit, hm-hf-audit |
| `hm-code-reviewer` | 6 | hm-code-review, hm-review, hm-review-backlog, hm-ui-review, hm-eval-review, hm-ns-review |
| `hm-executor` | 5 | hm-execute, hm-execute-phase, hm-quick, hm-fast, hm-test-spike-execute |
| `hm-roadmapper` | 4 | hm-new-milestone, hm-new-project, hm-milestone-summary, hm-complete-milestone |
| `hm-phase-researcher` | 4 | hm-research, hm-spike, hm-sketch, hm-deep-research-synthesis-repomix |
| `hm-verifier` | 2 | hm-verify, hm-verify-work |
| `hm-intent-loop` | 2 | hm-discuss-phase, hm-discuss |
| `hm-debugger` | 2 | hm-debug, hm-forensics |
| `hm-codebase-mapper` | 2 | hm-map-codebase, hm-graphify |
| `hm-user-profiler` | 1 | hm-profile-user |
| `hm-project-researcher` | 1 | hm-ingest-docs |
| `hm-code-fixer` | 1 | hm-audit-fix |

**All 14 unique agent targets verify as existing files in `.opencode/agents/`. Zero broken command→agent links.**

### Workflows (103 files)

Workflows do NOT use YAML `agent:` field. Instead, they dispatch agents inline via:
- `subagent_type=` in spawn commands
- Agent name references in table cells and procedural text
- SDK queries (`$Hivemind_SDK query agent-skills <name>`) followed by spawn

## Integration Gaps

### Gap 1: 5 Truly Orphan Agents

These agents exist as files but have ZERO command routing AND ZERO workflow dispatch. They are dead code unless purposefully retained as future stubs.

| Agent | Agent Description (from file) | Last Dispatch Path | Risk |
|-------|-------------------------------|-------------------|------|
| `hm-architect` | Design authority | None | Dead agent |
| `hm-ecologist` | Codebase ecology analysis | None | Dead agent |
| `hm-intel-updater` | Intelligence/baseline maintenance | None | Dead agent |
| `hm-l0-orchestrator` | Front-facing L0 strategist for hm-* | None | Dead agent (note: hf-l0-orchestrator may be the active variant) |
| `hm-shipper` | Release coordination | None | Dead agent |

**Severity:** MEDIUM — agents exist but are undiscoverable. No command dispatches them, no workflow spawns them.

### Gap 2: 1 Semi-Orphan Agent

| Agent | Issue | Evidence |
|-------|-------|----------|
| `hm-specifier` | Listed in `hm-plan-phase` command description as part of routing chain, but the command routes to `hm-planner` (not `hm-specifier`). The `hm-intent-loop` agent body says "Signal next step — Requirements ready for hm-specifier or hm-planner" but no workflow actually spawns `hm-specifier`. | Command description claims routing through hm-specifier; YAML routes to hm-planner only. Agent file mentions being signaled next; no signal happens. |

**Severity:** MEDIUM — the command description (`hm-plan-phase`) is misleading about the actual agent routing.

### Gap 3: 1 Weakly Referenced Agent

| Agent | Issue | Evidence |
|-------|-------|----------|
| `hm-synthesizer` | Listed in a table within `hm-synthesize` workflow, but the `hm-synthesize` command routes to `hm-orchestrator`. The workflow body does not actually spawn `hm-synthesizer` — it only mentions it in a reference table cell. | Workflow table line 13: `\| Synthesis \| hm-synthesizer \| ... \|` but no `subagent_type="hm-synthesizer"` exists anywhere. |

**Severity:** LOW — the table may be aspirational documentation rather than active routing.

### Gap 4: Command Description ≠ YAML Agent Routing

The `hm-plan-phase` command description states:

> "Routes through hm-phase-researcher, hm-planner, hm-pattern-mapper, hm-plan-checker, hm-intent-loop, and hm-specifier agents."

But the YAML `agent:` field only routes to `hm-planner`. The other named agents are handled by the workflow body (hm-plan-checker, hm-pattern-mapper) or not at all (hm-specifier).

**Severity:** LOW-MEDIUM — causes confusion about actual routing. The description should be updated to reflect actual workflow behavior.

### Gap 5: Missing Cross-Integration Check (P23.5's own gap)

No command or workflow exists that actually runs the A→C integration check defined by this phase. The `hm-integration-checker` agent exists and is dispatched by `hm-audit-milestone`, but there is no standalone "verify agent→command integration" workflow or command.

**Severity:** LOW — this phase IS the integration check; the output serves as the verification artifact.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Agent dispatch | Custom dispatch scripts | OpenCode YAML `agent:` field + workflow subagent spawn | OpenCode framework handles session lifecycle and routing |
| Agent inventory tracking | Manual spreadsheets | Filesystem audit (`glob`, `grep`) | Config is data — `ls` + `grep` replaces manual tracking |

## Common Pitfalls

### Pitfall 1: Description/Routing Mismatch
**What goes wrong:** Command descriptions list agents that aren't in the YAML `agent:` field.
**Why it happens:** Description copy-pasted from rough spec; YAML is the actual routing authority.
**How to avoid:** Audit every command: the YAML `agent:` field is the source of truth. Description should match or defer to workflow details.

### Pitfall 2: Workflow-Dispatched Agents Missing from Command Routing
**What goes wrong:** An agent is spawned by a workflow but has no command→agent YAML link. Users can't discover the agent via command routing.
**Why it happens:** Valid pattern for sub-agents (workflows spawn assistants), but creates opacity.
**How to avoid:** Document which workflows dispatch which agents. A reference file (`hm-agent-contracts.md`) already exists for this.

### Pitfall 3: Double Maintenance (commands/ vs command/)
**What goes wrong:** Files in `.opencode/commands/` and `.opencode/command/` drift apart.
**Why it happens:** OpenCode supports both directories for different host versions.
**How to avoid:** Mirroring is required by project rules. Currently in perfect sync (verified: same 99 files in both).

### Pitfall 4: Orphan Agent Accumulation
**What goes wrong:** Agents are created but never wired into command routing or workflow dispatch.
**Why it happens:** Agent creation is separate from command/workflow creation. No gate prevents orphan agents.
**How to avoid:** Add integration check to the agent-creation workflow: every agent must have at least one command route or workflow dispatch before being considered complete.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | An agent with no command route and no workflow dispatch is "orphaned" (i.e., dead code) | Integration Gaps | Low — some agents may be reserved for future phases; verified against `.opencode/workflows/`, `.opencode/commands/`, `.opencode/command/` |
| A2 | The `hm-l0-orchestrator` agent may be superseded by `hf-l0-orchestrator` | Gap 1 | Low — confirmed hf-l0-orchestrator handles L0 routing for hf-* lineage; hm-l0-orchestrator may be vestigial |

## Open Questions

1. **Intent of orphan agents?**
   - What we know: 5 agents exist with no dispatch pathways (hm-architect, hm-ecologist, hm-intel-updater, hm-l0-orchestrator, hm-shipper).
   - What's unclear: Are these future-phase stubs, abandoned implementations, or in-progress agents awaiting wiring?
   - Recommendation: Flag for human decision. Options: (a) create commands for them, (b) archive/deregister them, (c) document as "reserved" if intentional.

2. **Should hm-specifier be dispatched by hm-plan-phase?**
   - What we know: The command description claims it's part of the routing chain, but the workflow doesn't dispatch it.
   - What's unclear: Is this a description bug, a missing workflow step, or a removed agent step that wasn't cleaned up?
   - Recommendation: Audit hm-plan-phase's actual agent dispatch (workflow step analysis) and align description with reality.

3. **Is hm-synthesizer actually dispatched?**
   - What we know: The hm-synthesize workflow table lists it, but no `subagent_type="hm-synthesizer"` spawn exists.
   - What's unclear: Is the workflow intended to dispatch it in the future, or is the table a stale reference?
   - Recommendation: Check if hm-synthesize workflow step 7+ spawns the synthesizer; if not, update the reference table.

## Verification Commands

```bash
# Verify command→agent mapping: all agent: fields reference existing agent files
for agent in $(grep -rh '^agent:' .opencode/commands/hm-*.md | sort -u | sed 's/agent: //'); do
  if [ -f ".opencode/agents/$agent.md" ]; then echo "✓ $agent"; else echo "✗ $agent MISSING"; fi
done

# Find orphan agents (no command route, no workflow dispatch)
for f in .opencode/agents/hm-*.md; do
  agent=$(basename "$f" .md)
  cmd_refs=$(grep -rl "agent: $agent" .opencode/commands/ .opencode/command/ 2>/dev/null | wc -l)
  wf_refs=$(grep -rl "$agent" .opencode/workflows/ 2>/dev/null | wc -l)
  if [ "$cmd_refs" -eq 0 ] && [ "$wf_refs" -eq 0 ]; then echo "ORPHAN: $agent"; fi
done

# Verify command/commands sync
diff <(ls .opencode/commands/hm-*.md | xargs -n1 basename | sort) \
     <(ls .opencode/command/hm-*.md | xargs -n1 basename | sort)
```

## Sources

### Primary (HIGH confidence)
- Direct filesystem audit of `.opencode/agents/` — 31 agent files
- Direct filesystem audit of `.opencode/commands/` — 99 command files
- Direct filesystem audit of `.opencode/command/` — 99 command files (mirror)
- Direct filesystem audit of `.opencode/workflows/` — 103 workflow files
- YAML `agent:` field extraction from all 99 command files
- Workflow body grep for each of the 31 agent names

## Metadata

**Confidence breakdown:**
- Agent inventory: HIGH — direct filesystem ls
- Command→agent mapping: HIGH — grep of YAML frontmatter field
- Workflow→agent dispatch: HIGH — full-text grep across all workflow files
- Orphan detection: HIGH — cross-referenced three sources (commands, command, workflows)

**Research date:** 2026-05-29
**Valid until:** Until agent/command/workflow files change
