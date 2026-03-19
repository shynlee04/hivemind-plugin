# Phase 9: Context-Intelligence Skills Package - Research

**Researched:** 2026-03-19**Domain:** OpenCode Agent Skills Architecture, Conditional Skill Triggering, Skill Package Patterns
**Confidence:** HIGH

## Summary

This research establishes how to restructure the monolithic `context-intelligence-entry` skill (270+ lines SKILL.md + 1900 line script) into a package of 6 focused skills following OpenCode'sofficial skill architecture. The key insight is that OpenCode uses on-demand skill loading via the `skill` tool, with discovery based on directory structure and description-based triggering.

**Primary recommendation:** Create 6 separate skills under `context-intelligence/` package directory, each <100 lines,using progressive disclosure with bundled scripts and laser-focused descriptions that trigger conditionally.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

**Architecture: Package, Not Skill**
- `context-intelligence/` is a PACKAGE containing multiple SKILLS, not a single SKILL
- Structure:6 skills (hierarchy-check, session-check, task-check, workflow-context, user-intent, rot-check)

**Triggering: Conditional Chain**
- Skills trigger in ORDER, not all at once
- Trigger Chain: hierarchy→ session → task → workflow → intent → rot

**Skill Size: <100 lines each**
- Each SKILL.md under 100 lines (body)
- Progressive disclosure: metadata → body → references→ scripts

**Horizontal Coverage**
- Each skill covers ONE domain, not deep analysis across all domains- Skills can call each other through conditional chain

### Claude's Discretion

Research and recommend:
- Best patterns for conditional skill triggering
- How skills share scripts and references
- SOTA for OpenCode skill architecture

### Deferred Ideas (OUT OF SCOPE)

- Phase 10 integration (broken, related to this work)
- Session file cleanup (belongs in separate utility)
- Document flood cleanup (belongs in separate housekeeping task)

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| REQ-09-01 | DELETE wrong `context-intelligence-entry/` structure | Current structure identified: 270 line SKILL.md + 1900 line script + 5 reference files |
| REQ-09-02 | CREATE `context-intelligence/` package directory | Standard pattern: `skills/<package-name>/<skill-name>/SKILL.md` |
| REQ-09-03 | CREATE6 separate skills with conditional triggers | Each skill needs unique `	description` for triggering |
| REQ-09-04 | EACH skill: <100 lines, single domain | Progressive disclosure pattern established |
| REQ-09-05 | CONDITIONAL CHAIN: hierarchy → session → task → workflow → intent → rot | Cross-skill calling via `skill({ name: "skill-name" })` |
| REQ-09-06 | WORKFLOW INTEGRATION: Skills trigger at appropriate workflow points | Description-based triggering with symptom keywords |

</phase_requirements>

## Standard Stack

### Core (Skill Architecture)

| Component | Version | Purpose | Why Standard |
|-----------|---------|---------|--------------|
| OpenCode Skills | Official | Primary skill delivery mechanism | Native discovery, on-demand loading, permission control |
| SKILL.md | YAML+MD | Skill definition format | Required by OpenCode |
| `skill` tool | Built-in | Cross-skill calling | Loads skill on demand |

### Supporting (Bundled Resources)

| Resource | Pattern | Purpose | When to Use |
|----------|---------|---------|-------------|
| `scripts/` | Optional | Executable code for deterministic tasks | When skill needs to run commands |
| `references/` | Optional | Docs loaded into context as needed | Heavy documentation (>300 lines) |
| `assets/` | Optional | Files used in output | Templates, icons, fonts |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Single giant skill | 6 focused skills | Focused skills prevent context burn, enable conditional loading |
| In-script logic | External scripts | Scripts execute without loading full skill |
| @ file references | Skill name references | @ links force-load and burn context |

**Installation:**
```bash
# Skills are discovered automatically by OpenCode
# Place in: skills/context-intelligence/<skill-name>/SKILL.md
# Or globally: ~/.config/opencode/skills/<skill-name>/SKILL.md
```

**Version verification:** OpenCode skill architecture is stable (official docsas of 2026-03-19)

## Architecture Patterns

### Recommended Package Structure

```
skills/
├── context-intelligence/        # PACKAGE (multiple skills)
│   ├── hierarchy-check/
│   │   ├── SKILL.md             # <100 lines
│   │   └── references/          # Optional deep docs│   ├── session-check/
│   │   └── SKILL.md             # <100 lines
│   ├── task-check/
│   │   └── SKILL.md             # <100 lines
│   ├── workflow-context/
│   │   └── SKILL.md             # <100 lines
│   ├── user-intent/
│   │   └── SKILL.md             # <100 lines
│   └── rot-check/
│       ├── SKILL.md             # <100 lines
│       └── scripts/
│           └── context-harness-init.cjs  # Shared or dedicated script
```

### Pattern 1: SkillDiscovery and Loading

**What:** OpenCode discovers skills by walking up directories and loading matching `skills/*/SKILL.md`

**Discovery paths:**
- Project: `.opencode/skills/<name>/SKILL.md`
- Global: `~/.config/opencode/skills/<name>/SKILL.md`
- Claude-compatible: `.claude/skills/<name>/SKILL.md`
- Agent-compatible: `.agents/skills/<name>/SKILL.md`

**Example frontmatter:**
```yaml
---
name: rot-check
description: Deep context rot analysis. Triggers when: (1) agent detects inconsistency, (2) mentions "rot" "pollution" "drift", (3) after major changes, (4) before claiming completion.
---
```

**Source:** https://opencode.ai/docs/skills/

### Pattern 2: Cross-Skill Calling

**What:** Skills load other skills on-demand using the `skill` tool

**When to use:** When one skill needs knowledge from another

**Example:**
```markdown
<!-- In hierarchy-check/SKILL.md -->
## Trigger Chain

If hierarchy check finds nothing:
1. Call `skill({ name: "session-check" })` to check session state

If session check finds nothing:
1. Call `skill({ name: "task-check" })` to check active task
```

**Source:** OpenCode primitives, skill-creator documentation

### Pattern 3: Progressive Disclosure

**What:** Three-level loading to minimize context burn

**Levels:**
1. **Metadata** (name + description) - Always visible (~100 words)
2. **SKILL.md body** - Loaded when skill triggers (<500 lines ideal)
3. **Bundled resources** - Loaded as needed (unlimited)

**Example:**
```markdown
<!-- SKILL.md body references deeper docs -->
## Reference Files

For deep dives, read as needed:
| Reference | Trigger | Content |
|-----------|---------|---------|
| [context-rot-taxonomy.md](references/context-rot-taxonomy.md) | Any rot detected | Full severity model |
```

**Source:** skill-creator/SKILL.md

### Pattern 4: Laser-Focused Descriptions

**What:** Descriptions trigger skills, not explain what they do

**Critical insight:** Description = When to Use, NOT What the Skill Does

**Bad (causes under-triggering):**
```yaml
description: Use for context rot detection, session checks, and workflow validation
```

**Good (triggers correctly):**
```yaml
description: Use when agent detects inconsistency, mentions "rot/pollution/drift", after major changes, or before claiming completion
```

**Source:** writing-skills/SKILL.md CSO section

### Anti-Patterns to Avoid

- **Giant skill files (>500 lines):** Burns context, expensive to load
- **Description explains workflow:** Agent follows description instead of reading skill body
- **@ file links:** Force-loads files, burns context immediately
- **No separation of concerns:** One skill doing multiple things
- **Missing progressive disclosure:** Everything loaded atonce

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|--------------|-----|
| Skills discovery | Custom directory walking | OpenCode's built-in discovery | Official mechanism, permission control |
| Permission gating | Manual checks | `opencode.json` permissions | Declarative, overrideable per-agent |
| Script execution | Inline code | Bundle in `scripts/` | Executes without loading skill body |
| Cross-skill calling | Custom loader | `skill({ name: "skill-name" })` | Native tool, on-demand loading |
| Deep documentation | Inline everything | `references/` directory | Loaded only when needed |

**Key insight:** OpenCode handles discovery, loading, and permissions. Skills should focus on domain knowledge.

## Common Pitfalls

### Pitfall 1: Giant Skill Files

**What goes wrong:** 500+ line skills burn context window, slow loading, hard to maintain

**Why it happens:** Trying to cover all cases in one skill

**How to avoid:** Split by domain. Each skill <100 lines body. Use progressive disclosure.

**Warning signs:** SKILL.md approaching 300+ lines

### Pitfall 2: Description Summarizes Workflow

**What goes wrong:** Agent follows description instead of reading skill body, misses important details

**Why it happens:** Natural tendency to explain what the skill does

**How to avoid:** Description = triggering conditions ONLY. Put workflow in skill body.

**Example:**
```yaml
# BAD: "Use for TDD -write test first, watch it fail, write minimal code, refactor"
# GOOD: "Use when implementing any feature or bugfix, before writing implementation code"
```

### Pitfall 3: Force-Loading References

**What goes wrong:** `@` syntax loads files immediately, burning context before needed

**Why it happens:** Wanting to ensure context is available

**How to avoid:** Reference files by name. Let agent load as needed.

**Warning signs:** Multiple `@file` references in skill body

### Pitfall 4: Missing Progressive Disclosure

**What goes wrong:** Everything loaded at once, context pollution

**Why it happens:** Simplifying by putting everything inline

**How to avoid:** Split into metadata → body → references → scripts

**Pattern:**
- Metadata: What triggers the skill
- Body: Core patterns, quick reference
- References: Deep dives for complex situations
- Scripts: Executable tools that run without loading

### Pitfall 5: Single Skill Doing Multiple Things

**What goes wrong:** Skill becomes a "god object", hard to trigger correctly

**Why it happens:** DRY principle misapplied to skills

**How to avoid:** Horizontal coverage, not vertical drilling. Each skill owns ONE domain.

**Check:** Can you describe what the skill does in one phrase? If not, split.

## Code Examples

### Skill Frontmatter (Minimal)

```yaml
---
name: hierarchy-check
description: Check planning hierarchy exists. Triggers at session start, after compaction, when delegate receives scope.
---

# Hierarchy Check

**Core principle:** Fast state read. NOdeep analysis.

## When to Use

- Session start (first message)
- After compaction
- Before starting work
- When delegation scope unclear
```

### Cross-Skill Calling Pattern

```markdown
## Trigger Chain

This skill is the FIRST in the chain. If nothing found:

```typescript
// If hierarchy check returns nothing, call session-check
skill({ name: "session-check" })
```

The chain order:
1. **hierarchy-check** ← START HERE
2. session-check (if hierarchy empty)
3. task-check (if session empty)
4. rot-check (if task empty - DEEP ANALYSIS)
```

### Progressive Disclosure Pattern

```markdown
## Quick Reference

| State | Action |
|-------|--------|
| NEW | Map context, identify authorities |
| RESUMED | Verify continuity, check gaps |
| DEGRADED | STOP, rebuild from sources |

## Deep Dive

For complete state definitions:
- Read [entry-state-matrix.md](references/entry-state-matrix.md) for all 6 states

## Quick Script

```bash
# Fast check (~50ms)
node scripts/context-harness-init.cjs --quick
```

For deep rot analysis:
```bash
node scripts/context-harness-init.cjs --rot
```
```

### Shared Script Execution

```markdown
## Execution

The skill delegates to shared script:

```bash
# Script runs without loading full skill body
node scripts/context-harness-init.cjs --quick
```

Script is bundled with package, shared across skills.
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Giant skils (500+ lines) | Focused skills (<100 lines) | OpenCode official docs | Context efficiency, conditional loading |
| Description explains workflow | Description = triggers only | skill-creator research | Correct triggering behavior |
| In-skill logic | External scripts | Progressive disclosure pattern | Scripts run without context burn |
| Manual discovery | OpenCode auto-discovery | Native to platform | Permission control, on-demand loading |

**Deprecated/outdated:**
- Single monolithic skill: Replaced by package of focused skills
- `@` file references: Replaced by name references (avoid context burn)

## Open Questions

1. **How should scripts be shared across skills?**- Options: (a) Single shared script in package root, (b) Each skill has own script copy, (c) Symlinks
   - Recommendation: Single shared script in `context-intelligence/scripts/` with dispatch logic
   
   **We know:** Scripts can execute without loading skill body

2. **Should the rot-check script stay as-is or be modularized?**
   - Current: 1900 line monolithic script
   - Target: Potentially smaller scripts per-check, or keep as dispatcher
   - Recommendation: Keep as dispatcher with `--quick` vs `--rot` vs `--full` modes

   **We know:** Script already supports multiple modes via flags

## Validation Architecture

> Skip this section entirely if workflow.nyquist_validation is explicitly set to false in .planning/config.json. If the key is absent, treat as enabled.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Bun test (native) |
| Config file | `package.json` scripts |
| Quick run command | `bun test tests/skills/` |
| Full suite command | `bun test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| REQ-09-01 | DELETE wrong structure | integration | `bun test tests/skills/context-intelligence/delete-old.test.ts` | ❌ Wave 0 |
| REQ-09-02 | CREATE package directory | integration | `bun test tests/skills/context-intelligence/create-package.test.ts` | ❌ Wave 0 |
| REQ-09-03 | CREATE 6 separate skills | unit | `bun test tests/skills/context-intelligence/skill-structure.test.ts` | ❌ Wave 0 |
| REQ-09-04 | Each skill <100 lines | unit | `bun test tests/skills/context-intelligence/skill-size.test.ts` | ❌ Wave 0 |
| REQ-09-05 | Conditional chain works | integration | `bun test tests/skills/context-intelligence/trigger-chain.test.ts` | ❌ Wave 0 |
| REQ-09-06 | Workflow integration | e2e | `bun test tests/skills/context-intelligence/workflow-triggers.test.ts` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `bun test tests/skills/context-intelligence/`
- **Per wave merge:** `bun test`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `tests/skills/context-intelligence/delete-old.test.ts` — covers REQ-09-01
- [ ] `tests/skills/context-intelligence/create-package.test.ts` — covers REQ-09-02
- [ ] `tests/skills/context-intelligence/skill-structure.test.ts` — covers REQ-09-03
- [ ] `tests/skills/context-intelligence/skill-size.test.ts` — covers REQ-09-04
- [ ] `tests/skills/context-intelligence/trigger-chain.test.ts` — covers REQ-09-05
- [ ] `tests/skills/context-intelligence/workflow-triggers.test.ts` — covers REQ-09-06
- [ ] `tests/skills/context-intelligence/helpers/skill-loader.ts` — shared fixtures

*(If no gaps: "None — existing test infrastructure covers all phase requirements")*

## Sources

### Primary (HIGH confidence)

- **OpenCode Skills Documentation** - https://opencode.ai/docs/skills/ - Discovery, frontmatter, permissions
- **skill-creator/SKILL.md** - Skill creation workflow, testing, progressive disclosure
- **writing-skills/SKILL.md** - TDD for skills, CSO patterns, token efficiency
- **opencode-primitives/SKILL.md** - OpenCode native mechanisms, skill discovery paths

### Secondary (MEDIUM confidence)

- **skill-judge/SKILL.md** - Quality dimensions, knowledge delta, anti-patterns
- **context-integrity/SKILL.md** - Small focused skill example (~190 lines)
- **evidence-discipline/SKILL.md** - Single-domain skill example (~122 lines)

### Tertiary (LOW confidence)

- **Current context-intelligence-entry/SKILL.md** - Monolithic structure TO BE REPLACED

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - OpenCode official docs support all patterns
- Architecture: HIGH - Clear patterns from skill-creator and writing-skills
- Pitfalls: HIGH - Documented in skill-creator and writing-skills
- Don't hand-roll: HIGH - Clear from OpenCode platform capabilities

**Research date:** 2026-03-19
**Valid until:** 2026-05-19 (stable OpenCode skill architecture, 60 days)