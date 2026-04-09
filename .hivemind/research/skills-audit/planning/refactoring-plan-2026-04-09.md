# Skills Refactoring Plan — 2026-04-09

## Status: PROPOSED (awaiting user authorization)

## Execution Phases

### Phase A: Structural Cleanup (no content changes)
**Priority: CRITICAL | Estimated Skills: 5**
**Dependencies: None**

| Step | Action | Rationale |
|------|--------|-----------|
| A1 | Determine canonical location (.claude/ or .opencode/) | Source-of-truth ambiguity |
| A2 | Delete duplicate skills from non-canonical location | Maintenance burden |
| A3 | Merge unique content from deleted duplicates | Preserve boundary clarifications, Iron Laws |
| A4 | Move eval-harness from .agents/ to canonical location | Consistency |

**Skills affected:** coordinating-loop, phase-loop, planning-with-files, session-context-manager, user-intent-interactive-loop, eval-harness

### Phase B: Description Rewrite Sprint
**Priority: HIGH | Estimated Skills: 11**
**Dependencies: Phase A complete**

Each skill gets a rewritten description following this template:
- Lead with what the skill DOES (active verb, not "This skill should be used when")
- Include 5-10 natural trigger phrases that users would actually say
- State WHEN to use it and when NOT to
- No internal vocabulary (no "harness", "GSD", "OMO", "hivefiver", "/hf-*")
- Max 40 words

| Order | Skill | Current Issue | Target |
|-------|-------|--------------|--------|
| B1 | use-authoring-skills | Zero trigger phrases (self-contradiction) | 8+ natural triggers |
| B2 | agent-authorization | Internal vocab, misleading framing | Universal gate language |
| B3 | harness-audit | "harness" in triggers | "OpenCode project audit" framing |
| B4 | harness-delegation-inspection | GSD references, scope too broad | Split scope for new skills |
| B5 | oh-my-openagent-reference | Assumes domain knowledge | Explain what OMO IS |
| B6 | eval-harness → eval-driven-development | No triggers | 8+ natural triggers |
| B7 | meta-builder | Trigger collision with children | Ambiguity-only triggers |
| B8 | skill-synthesis | Too narrow | Include eval-driven angle |
| B9 | agents-and-subagents-dev | Formulaic 68-word sentence | Punchy active-voice |
| B10 | session-context-manager | Circular | Distinct from planning-with-files |
| B11 | phase-loop | Search-index style | Natural language |

### Phase C: Structural Refactoring
**Priority: HIGH | Estimated Skills: 6**
**Dependencies: Phase B complete**

| Step | Action | Rationale |
|------|--------|-----------|
| C1 | Merge session-context-manager into planning-with-files | Functional overlap — one cross-session persistence system |
| C2 | Split harness-delegation-inspection into 2 skills | Identity crisis — covers 4+ distinct concerns |
| C3 | Reduce meta-builder from 403 → ~200 lines | Router should be thin; move Power Tools to references |
| C4 | Expand phase-loop from 117 → ~200 lines | Too thin — add worked example, remove HiveMind agents |
| C5 | Rename eval-harness → eval-driven-development | Name collision with harness-writing |
| C6 | Add domain synthesis to oh-my-openagent-reference | Currently just a navigation index |

**New skills created:**
- `subagent-delegation-patterns` (from harness-delegation-inspection split)
- `opencode-project-inspection` (from harness-delegation-inspection split)

**Skills removed:**
- `session-context-manager` (merged into planning-with-files)
- `harness-delegation-inspection` (split into two)
- `eval-harness` (renamed to eval-driven-development)

### Phase D: Naming Cleanup
**Priority: MEDIUM | Estimated Skills: 4**
**Dependencies: Phase C complete**

| Current Name | New Name | Rationale |
|-------------|----------|-----------|
| harness-audit | opencode-project-audit | Remove internal vocabulary |
| harness-delegation-inspection | (removed in C2) | — |
| eval-harness | eval-driven-development | Remove name collision |
| agent-authorization | delegation-gates | Match actual purpose |

### Phase E: Script Dependency Hardening
**Priority: MEDIUM | Estimated Skills: 6**
**Dependencies: Phase D complete**

For each skill with script dependencies, add inline fallback documentation:
- What the script checks (behavior, not implementation)
- Manual check procedure when script is unavailable
- Graceful degradation path

| Skill | Scripts to Harden |
|-------|------------------|
| coordinating-loop | 8 scripts → inline fallbacks for gate checks |
| user-intent-interactive-loop | 5 scripts → Gate 3 soft dependency |
| skill-synthesis | 7 scripts → prerequisite check before pipeline start |
| use-authoring-skills | 8+ scripts → hierarchy enforcement should be warning not blocker |
| harness-audit → opencode-project-audit | 2 scripts → graceful degradation |
| session-context-manager → planning-with-files | 1 script → merge into parent |

### Phase F: Body Quality Enhancement
**Priority: LOW | Estimated Skills: 3**
**Dependencies: Phase E complete**

| Skill | Enhancement |
|-------|------------|
| phase-loop | Add worked example with step-by-step walkthrough |
| oh-my-openagent-reference | Add "Key Design Patterns" summary section |
| skill-synthesis | Explain agentskills.io/llms.txt inline; add fallback |

## Expected End State

### Before (Current)
- 20 skills
- 8 PASS, 11 NEEDS_REFACTOR, 1 FAIL
- 5+ duplicate locations
- 7 skills with internal vocabulary leak
- 1 skill with phantom CLI commands

### After (Target)
- 21 skills (merge 1, split 1, rename 1)
- Target: 18+ PASS, ≤3 NEEDS_REFACTOR, 0 FAIL
- Single canonical location
- 0 skills with internal vocabulary in descriptions
- 0 phantom commands
- All scripts have inline fallbacks

### Skill Count Change
| Action | Count |
|--------|-------|
| Start | 20 |
| Merge (session-context-manager → planning-with-files) | -1 |
| Split (harness-delegation-inspection → 2 new) | +1 |
| Rename (eval-harness → eval-driven-development) | 0 |
| Rename (harness-audit → opencode-project-audit) | 0 |
| Rename (agent-authorization → delegation-gates) | 0 |
| **End** | **20** |

## Phases Requiring User Authorization

Each phase (A through F) requires explicit user authorization before execution.
No code changes will be made without a plan being authorized.

## Next Step

Awaiting user decision on:
1. Canonical location (.claude/ vs .opencode/) — determines Phase A
2. Authorization to proceed with Phase A (structural cleanup)
3. Prioritization of phases (may reorder B-F based on user preference)
