# Cross-Batch Synthesis — 2026-04-09

## Critical Systemic Issues (affecting 3+ skills)

### S1. Internal Vocabulary Leak in Descriptions
**Severity: CRITICAL | Affected: 7 skills**
| Skill | Internal Term | Should Be |
|-------|--------------|-----------|
| meta-builder | `/hf-create`, `/hf-audit`, `hivefiver-*` agents | Generic trigger phrases |
| harness-audit | "audit harness", "full harness audit" | "audit my project", "review my setup" |
| harness-delegation-inspection | "GSD execution model", "ecosystem structure" | "delegation patterns", "project inspection" |
| oh-my-openagent-reference | "OMO architecture", "compare harness to OMO" | "agent architecture patterns" |
| agent-authorization | "hivefiver-skill-author", specialist profiles | Generic role placeholders |
| session-context-manager | `.hivemind/state/` hardcoded paths | Configurable path |
| eval-harness | "harness" in name | "eval-driven-development" |

**Impact:** Runtime pick-rate drops to near-zero for agents outside this project. Skills become invisible when they should be discoverable.

### S2. Formulaic Description Pattern
**Severity: HIGH | Affected: 5 skills**

All domain execution skills use: `"This skill should be used when the user asks to..."`

| Skill | Opening Words |
|-------|--------------|
| agents-and-subagents-dev | "This skill should be used when" |
| command-dev | "This skill should be used when" |
| custom-tools-dev | "This skill should be used when" |
| agent-authorization | Uses similar passive construction |
| coordinating-loop | ".opencode/" variant has same pattern |

**Impact:** Runtime sees identical first 6 words across skills — reduces discrimination. Reads as AI-generated boilerplate.

### S3. Duplicate Skills Across .claude/ and .opencode/
**Severity: CRITICAL | Affected: 5+ skills**

| Skill | .claude/ Version | .opencode/ Version | Divergence |
|-------|-----------------|-------------------|------------|
| coordinating-loop | v1 | v2 (has boundary clarification) | Content differs |
| phase-loop | v1 | v2 (minor) | Description format differs |
| planning-with-files | v1.0.0 | v2.0.0 (has Iron Law) | Version differs |
| session-context-manager | v1 | v2 (has boundary clarification) | Content differs |
| user-intent-interactive-loop | v1 | v2 (minor) | Trivial differences |

**Impact:** Source-of-truth ambiguity. Runtime may load different versions depending on platform. Maintenance burden doubles.

### S4. Script Dependencies Without Fallbacks
**Severity: MEDIUM | Affected: 6 skills**

| Skill | Script Count | Risk |
|-------|-------------|------|
| coordinating-loop | 8 scripts | HIGH — gates break silently |
| user-intent-interactive-loop | 5 scripts | HIGH — Gate 3 hard-depends on external skills |
| skill-synthesis | 7 scripts | MEDIUM — pipeline calls scripts sequentially |
| harness-audit | 2 scripts | MEDIUM — On Load depends on scripts |
| session-context-manager | 1 script | LOW |
| use-authoring-skills | 8+ scripts | MEDIUM — gates enforced by scripts |

**Impact:** If any script is missing, the skill's core enforcement breaks silently. Agent has no fallback procedure.

## Overlap and Conflict Map

### HIGH Severity Conflicts

```
meta-builder ←→ use-authoring-skills, agents-and-subagents-dev, command-dev
  Issue: Trigger collision — router and children compete for identical phrases
  Fix: Differentiate router triggers (ambiguity, stacking) from child triggers (specific actions)

session-context-manager ←→ planning-with-files
  Issue: Both manage cross-session state via markdown files. No clear boundary.
  Fix: Merge session-context-manager INTO planning-with-files as alternative schema

harness-audit ←→ harness-delegation-inspection
  Issue: Both include inspection protocols. Phase 0 of audit overlaps with delegation-inspection.
  Fix: Split delegation-inspection; merge inspection part with audit

agent-authorization ←→ coordinating-loop
  Issue: Both define pre-delegation gates. 4-gate auth vs 5-gate coordination may conflict.
  Fix: Clarify relationship — auth is a pre-check, coordination is the execution flow
```

### MEDIUM Severity Conflicts

```
eval-harness ←→ harness-writing (external skill)
  Issue: Name collision — "harness" in this project = HiveMind plugin, elsewhere = fuzzing
  Fix: Rename eval-harness to eval-driven-development

hm-deep-research ←→ deep-research, parallel-deep-research (external skills)
  Issue: Trigger overlap on "research", "investigate", "analyze"
  Fix: hm-deep-research should be the methodology; external ones are single-tool quick paths

harness-delegation-inspection ←→ opencode-platform-reference
  Issue: MCP usage sections overlap with platform reference content
  Fix: Cross-reference instead of duplicate
```

## Architecture Alignment Issues

### Hierarchy Mismatches

| Skill | Claims | Reality | Fix |
|-------|--------|---------|-----|
| meta-builder | Thin router (Layer 0) | Contains 113 lines of tool docs | Move to references |
| phase-loop | Sub-session (Layer 2) | Used BY coordinators, not discovered | Clarify dependency chain |
| session-context-manager | Layer 2 | Should be sub-component of planning-with-files | Merge |
| harness-delegation-inspection | Layer 1 domain-execution | Actually covers 4+ distinct concerns | Split |

### Task Group Mismatches

| Skill | Classified | Should Be | Reason |
|-------|-----------|-----------|--------|
| harness-delegation-inspection | Group 1 | Split: G1 (delegation) + G2 (reference) | Covers both process and reference |

## Gold Standard Skills (Use as Templates)

| Template For | Use This Skill | Why |
|-------------|---------------|-----|
| Reference skills | `opencode-platform-reference` | Key patterns section, TOC, progressive disclosure |
| Tactical skills | `command-dev` | Lean (80 lines), Iron Law, clear anatomy |
| Methodology skills | `hm-deep-research` | Stage gates, tool matrix, anti-patterns, "when NOT to" |
| Behavioral skills | `opencode-non-interactive-shell` | BAD/GOOD examples, self-contained, no background needed |
| Planning skills | `planning-with-files` | Complete schemas, tiered response, subagent envelope |

## Skills Recommended for Removal/Migration

| Skill | Action | Destination |
|-------|--------|-------------|
| session-context-manager | MERGE into planning-with-files | planning-with-files references/ |
| harness-delegation-inspection | SPLIT into 2 skills | subagent-delegation-patterns + opencode-project-inspection |
| eval-harness | MIGRATE to .claude/skills/ + rename | eval-driven-development |

## Skills Needing Description Rewrite (Priority Order)

1. **use-authoring-skills** — Self-contradiction (teaches trigger phrases, has none)
2. **agent-authorization** — Internal vocabulary, misleading name
3. **harness-audit** — Internal vocabulary in triggers
4. **harness-delegation-inspection** — GSD references, scope too broad
5. **oh-my-openagent-reference** — Assumes domain knowledge
6. **eval-harness** — No trigger phrases at all
7. **meta-builder** — Trigger collision with children
8. **skill-synthesis** — Triggers too narrow, missing key differentiator
9. **agents-and-subagents-dev** — Formulaic opening, 68-word description
10. **session-context-manager** — Circular description
11. **phase-loop** — Reads like search index, not description
