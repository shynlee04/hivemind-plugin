---
type: coordination-cycle
cycle: cycle-0
created: 2026-05-10
status: READY_TO_EXECUTE
master: agents-system-overhaul-2026-05-10
phases: PH-01, PH-02
priority: P0-CRITICAL
previous_state: RESEARCH_COMPLETE + T6_VERIFIED
---

# Cycle 0 Coordination — P0 Critical Path

## Starting Condition

All planning documents verified (T6 PASS). No execution has started.
Cycle 0 contains 2 P0 phases that CAN run in parallel:

| Phase | Scope | Risk | Files |
|-------|-------|------|-------|
| PH-01: Permissions Fix | 56 agents (deny→ask) | LOW | .opencode/agents/hm-*.md, hf-*.md |
| PH-02: Agent Profile Repair | 15 agents (3 sub-tiers) | MEDIUM | .opencode/agents/hm-*.md |

## PH-01: Permissions Fix — Execution Spec

### Scope
- All 45 hm-*.md agents
- All 11 hf-*.md agents
- Total: 56 files

### Permission Schema Rules (from opencode-permissions.md)

OpenCode permissions cascade: wildcard `*` is the parent, specific patterns are children.
Last matching rule wins. We must be GRANULAR, not mechanical.

### Current Permission Landscape

| Permission | Current | Where | Action |
|------------|---------|-------|--------|
| `read` | `allow` | Most agents | PRESERVE (no change) |
| `edit` | `ask` | Most agents | PRESERVE (no change) |
| `write` | `ask` | Most agents | PRESERVE (no change) |
| `bash` `'*'` | `ask` | Most agents | PRESERVE (no change) |
| `bash` specific (`git *`, etc.) | `allow` | Most agents | PRESERVE (no change) |
| `glob` | `allow` | Most agents | PRESERVE (no change) |
| `grep` | `allow` | Most agents | PRESERVE (no change) |
| `task` `'*'` | `deny` | L2 terminal agents | → `ask` (wildcard parent → ask) |
| `task` specific (`hm-l2-*`, etc.) | `allow` | L0/L1 only | PRESERVE (children already allow) |
| `delegate-task` | `deny` | L2 terminal, most hf-L2 | → `ask` (tool-level deny → ask) |
| `delegation-status` | `deny` | L2 terminal, most hf-L2 | → `ask` (tool-level deny → ask) |
| `session-journal-export` | `deny` | L2 terminal, most hf-L2 | → `ask` (tool-level deny → ask) |
| `session-patch` | `deny` | Even L0 | → `ask` (tool-level deny → ask) |
| `webfetch` | `allow` / varies | Some agents | PRESERVE or → `ask` if deny |
| `websearch` | varies | Some agents | PRESERVE or → `ask` if deny |
| `skill` `'*'` | varies | Some agents | → `ask` if deny; PRESERVE if allow/specific |

### Decision Matrix for deny→ask vs deny→allow

| Pattern | deny on wildcard `*` | deny on specific pattern | deny on entire tool |
|---------|---------------------|------------------------|-------------------|
| **Action** | → `ask` | → `allow` if the specific pattern is a legitimate child (e.g., `task: hm-l2-*`) | → `ask` |
| **Rationale** | User approves at runtime | Specific patterns are intentional grants, not blanket | User approves at runtime |

### Exceptions
- hf-l2-prompter: retains `edit: allow` and `write: allow` — PRESERVE
- L0/L1 agents with `delegate-task: allow` — PRESERVE
- L0/L1 agents with specific `task` children like `hm-l2-*: allow` — PRESERVE

### Verification
```bash
# Must return zero deny on wildcards and tool-level:
grep -n "deny" .opencode/agents/hm-*.md .opencode/agents/hf-*.md
# Must confirm allow preserved where expected:
grep "allow" .opencode/agents/hf-l2-prompter.md
# Must confirm bash children still allow:
grep "git \*: allow" .opencode/agents/hm-l0-orchestrator.md
```

## PH-02: Agent Profile Repair — Execution Spec

### Sub-Tier A: Silent Dead (7 agents) — instructions→instruction
- hm-l2-context-mapper, hm-l2-context-purifier, hm-l2-critic
- hm-l2-prompt-analyzer, hm-l2-prompt-repackager, hm-l2-prompt-skimmer
- hm-l2-risk-assessor

### Sub-Tier B: Minimal Shells (3 agents) — Complete Frontmatter
- hm-l2-meta-synthesis: domain=Meta, temp=0.1, task block, skills, instruction
- hm-l2-general: domain=Meta, temp=0.2, task block, skills, instruction
- hm-l2-test-router: domain=Test, temp=0.1, edit, write, glob, grep, skills, instruction

### Sub-Tier C: Incomplete (5 agents) — Fill Missing Fields
- hm-l2-build: domain=Build, temp=0.15; fix skill:allow outside permission block
- hm-l2-conductor: domain=Phase Lifecycle, delegation-status=allow
- hm-l2-intent-loop: domain=Phase Lifecycle, delegate-task=allow, delegation-status=allow
- hm-l2-phase-guardian: domain=Phase Lifecycle, delegation-status=allow
- hm-l2-spec-verifier: domain=Quality Audit, delegate-task=allow, delegation-status=allow

### Verification
```bash
# Must return zero:
grep -r "instructions:" .opencode/agents/
# Must confirm all 15 agents have complete frontmatter
```

## Cycle 0 Gate Criteria

- [ ] Zero `deny` in any shipped agent permission block
- [ ] Zero `instructions:` (plural) in any agent file
- [ ] All 15 broken agents have complete YAML frontmatter
- [ ] hf-l2-prompter still has `edit: allow` and `write: allow`
- [ ] hm-l2-build no longer has `skill: allow` outside permission block
- [ ] Spot-check 5 random agents load without YAML errors

## Delegation Strategy

PH-01 and PH-02 are INDEPENDENT — dispatch as parallel subagents:
1. Subagent A: PH-01 (permissions) — mechanical find-replace, LOW risk
2. Subagent B: PH-02 (profiles) — requires domain knowledge for Sub-Tier B/C, MEDIUM risk

Both must complete before Cycle 0 GATE check.

## Post-Cycle-0

After gate passes, advance to Cycle 1:
- PH-03 (mode reclassification)
- PH-12A (name collision fix)
- PH-11 (hf-l0 verification)
