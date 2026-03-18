# Phase 09: Non-Breaking Skills for Context Intelligence - Research

**Researched:** 2026-03-19
**Domain:** OpenCode Skills System, Context Intelligence Architecture, Non-Breaking Skill Design
**Confidence:** HIGH (verified via Context7 + project audit)

## Summary

This phase researches creating **non-breaking skills** for context intelligence that:
1. Provide defense against context rot, pollution, and poisoning
2. Enable meta-builder as "framework healer/doctor" 
3. Allow customization for end users
4. Resolve conflicts between hive-* pollution patterns and GSD legitimate framework
5. Implement hierarchy with "this happens first, others later" without ceremony

**Key Understanding (VERIFIED):**
- **GSD = LEGITIMATE** — `.opencode/get-shit-done/`, `.opencode/agents/gsd-*.md`, GSD skills in `.github/skills/`, `.codex/skills/`, `.qwen/skills/` are all legitimate and KEEP
- **hive-* = POLLUTION** — Already moved to `_deprecated_hive/` — blocking skills (entry-resolution, delegation-framework, context-integrity, evidence-discipline) are deprecated
- The project needs context intelligence, but it must be **non-blocking** and **GSD-aligned**

## User Constraints (from CONTEXT.md)

### Locked Decisions
- GSD is the legitimate framework to follow
- hive-* prefixed/suffixed patterns are false governance and must be deprecated
- Non-breaking skills must not add ceremony overhead
- Context intelligence must not block GSD direct-action workflow

### Claude's Discretion
- How to structure progressive disclosure loading
- Specific implementation of trust scoring
- Entry-state awareness model details
- Meta-builder "healer" patterns

### Deferred Ideas (OUT OF SCOPE)
- Complex multi-framework routing ceremonies
- Legacy hive-* governance restoration
- Blocking verification rituals

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **GSD = LEGITIMATE framework (KEEP)**: `.opencode/get-shit-done/` - 38 GSD workflows, `.opencode/agents/gsd-*.md` - 15 GSD agents, GSD skills in `.github/skills/`, `.codex/skills/`, `.qwen/skills/`
- **hive-* = POLLUTION (DEPRECATE/REMOVE)**: `skills/entry-resolution/SKILL.md`, `skills/delegation-framework/SKILL.md`, `skills/context-integrity/SKILL.md`, `agents/hive*.md` (9 agents), AGENTS.md lines 177-197 + 210-222
- Skills must be **non-breaking** (no ceremony, no blocking)
- Context intelligence = defense against rot/pollution/poisoning
- Meta-builder should heal conflicts, not create them

### Claude's Discretion
- How to implement progressive disclosure loading
- Specific trust scoring algorithm
- Entry-state awareness model details
- "Framework doctor" healing patterns

### Deferred Ideas (OUT OF SCOPE)
- Complex multi-framework routing ceremonies
- Legacy hive-* governance restoration attempts
- Blocking verification rituals that interrupt GSD workflows
</user_constraints>

---

## Standard Stack

### Core Skills Infrastructure
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| OpenCode Skills Plugin | Latest | Discovers and registers skills as dynamic tools | Official OpenCode skill system |
| SKILL.md format | v1 | YAML frontmatter + Markdown body | Industry standard (Anthropic Agent Skills Spec) |
| `noReply: true` message pattern | - | Progressive disclosure without blocking | Official OpenCode pattern for skill loading |

### Supporting Pattern Libraries
| Library | Purpose | When to Use |
|---------|---------|-------------|
| GSD framework | `.opencode/get-shit-done/` | Primary workflow execution |
| GSD agents | `.opencode/agents/gsd-*.md` | 15 pre-built agents for all phases |
| Context7 | MCP server | Current library API verification |

### Already Deprecated (Do NOT Use)
| Instead of | Was | Why Deprecated |
|------------|-----|----------------|
| `skills/entry-resolution/` | 6-step mandatory protocol | Blocked GSD direct action |
| `skills/delegation-framework/` | 6 gates before delegation | Added ceremony overhead |
| `skills/context-integrity/` | L1-L4 escalation system | Interrupted long sessions |
| `skills/evidence-discipline/` | Mandatory evidence chains | Ritual, not practical |

---

## Architecture Patterns

### Recommended Project Structure

```
skills/
├── context-intelligence/           # NEW - non-breaking entry skill
│   ├── SKILL.md                   # L1 entry (~100 tokens)
│   └── references/               # Heavy content (loaded on demand)
│       ├── context-rot-taxonomy.md
│       ├── entry-state-matrix.md
│       ├── trust-scoring.md
│       └── recovery-protocols.md
├── meta-builder-hivemind/         # NEW - healer/framework-doctor skill
│   ├── SKILL.md
│   └── references/
│       ├── conflict-resolution.md
│       ├── hierarchy-awareness.md
│       └── gsd-alignment.md
├── _deprecated_hive/              # Already deprecated (keep quarantine)
│   ├── entry-resolution/
│   ├── delegation-framework/
│   ├── context-integrity/
│   └── evidence-discipline/
└── hivemind-skill-writer/        # EXISTING - skill authoring (keep)
    └── SKILL.md
```

### Pattern 1: Non-Breaking Skill Loading

**What:** Skills that provide context intelligence without blocking execution

**When to use:** Context defense, trust scoring, rot detection

**Example (L1 - Always Loaded, ~100 tokens):**
```yaml
---
name: context-intelligence-entry
description: >
  Use at session start, when detecting context drift, or when delegation 
  scope is unclear. Provides non-blocking context defense for multi-agent 
  IDE environments. Works with GSD workflow — no mandatory protocols.
  Triggers: context rot, drift detection, scope confusion, trust issues.
---

# Context-Intelligence Entry Pack (L1)

## Core Principles (Non-Negotiable)

1. **GSD First** — Follow GSD direct-action workflow unless rot detected
2. **Skeptical Reading** — Trust but verify inherited context
3. **Non-Blocking** — Context defense does NOT stop execution
4. **User Gates** — Verification gates at user-specified points, not ritual

## Context Rot Signals (Watch For)

- Document timestamps contradict git history
- Governance files reference non-existent entities
- Skills load unexpectedly or contradict each other
- Session state doesn't match observable reality
```

**Example (L2 - On Trigger, loaded via noReply):**
```yaml
## Trust Scoring (L2 - On Demand)

When trust score calculation needed:

| Signal | Score | Weight |
|--------|-------|--------|
| Live SDK/plugin behavior | 100% | 1.0 |
| User confirmation | 100% | 1.0 |
| Git-verified file | 95% | 0.9 |
| Documentation | 50% | 0.5 |
| Inherited context | 40% | 0.4 |

**Formula:** `Effective Trust = Σ(Signal × Weight) / Σ(Weight)`
**Threshold:** If Effective Trust < 0.6 → Context Rot suspected
```

### Pattern 2: Progressive Disclosure Loading

**What:** Skills load content in layers based on actual need

**When to use:** Complex skills that shouldn't burden every session

**Loading Flow:**
```
L1: Metadata (name + description) — Always available (~100 tokens)
    ↓ (on trigger match)
L2: SKILL.md body — Loaded via noReply: true (~500 lines max)
    ↓ (on explicit reference)
L3: references/, scripts/, templates/ — As needed
```

**Source: Context7 OpenCode Skills Plugin implementation**

### Pattern 3: Meta-Builder as "Framework Doctor"

**What:** Skill that heals conflicts between framework patterns

**When to use:** When GSD and hive-* patterns conflict

**Example:**
```yaml
---
name: meta-builder-framework-doctor
description: >
  Use when framework conflicts detected, when hive-* patterns block GSD,
  or when healing context pollution. The "framework doctor" that resolves
  conflicts without blocking. Triggers: framework conflict, pattern clash,
  governance collision, harness strikes.
---

# Meta-Builder: Framework Doctor

## Healing Protocol (Non-Blocking)

1. **IDENTIFY** — Which framework owns the conflicted area?
2. **ASSESS** — Is it GSD (legitimate) or hive-* (pollution)?
3. **RESOLVE** — Apply correct pattern, document decision
4. **HEAL** — Remove pollution reference, preserve legitimate

## GSD vs Hive-* Resolution Table

| Signal | GSD (KEEP) | Hive-* (POLLUTION) |
|--------|-----------|---------------------|
| Directory | `.opencode/get-shit-done/` | `skills/entry-resolution/` |
| Agents | `gsd-*.md` | `hive*.md` |
| Skills | GSD-aligned | Blocking protocols |
| Workflow | Direct action | Mandatory gates |

## Hierarchy Rules (This Happens First, Others Later)

1. **GSD workflow** — Always primary (direct action)
2. **Context defense** — Runs silently, non-blocking
3. **Rot detection** — Alerts, doesn't stop
4. **Verification** — User-specified points only
```

### Anti-Patterns to Avoid

| Anti-Pattern | Why It's Bad | What to Do Instead |
|--------------|-------------|-------------------|
| **Mandatory 6-step protocol** | Blocks GSD direct action | Optional decision tree, non-blocking |
| **6 gates before delegation** | Adds ceremony overhead | Delegation allowed by default |
| **L1-L4 escalation halts** | Interrupts long sessions | Alert-only, no execution stop |
| **Evidence chains as ritual** | Ceremony, not practical | User-specified verification points |
| **Lineage-based routing** | Forces framework by name | Situation-based, user intent |

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Skill discovery | Custom loader | OpenCode Skills Plugin | Official system, auto-discovers |
| Progressive loading | Custom injection | `noReply: true` messages | Official pattern for persistence |
| Trust scoring | Arbitrary thresholds | Weighted signal matrix | Defined in context-intelligence plan |
| Context rot detection | ad-hoc checks | Taxonomy + detection checklist | Already designed in draft plan |
| Framework conflict resolution | Case-by-case | GSD vs hive-* resolution table | Systematic approach |

---

## Common Pitfalls

### Pitfall 1: Skill Over-Triggering
**What goes wrong:** Skills load on every message, consuming context budget
**Why it happens:** Vague descriptions trigger too broadly
**How to avoid:** Specific trigger conditions in description (WHAT + WHEN + KEYWORDS)
**Warning signs:** Skills loading without clear activation reason

### Pitfall 2: Blocking "Defense"
**What goes wrong:** Context intelligence stops execution "for safety"
**Why it happens:** Modeling after deprecated hive-* patterns
**How to avoid:** Alert-only, never halt. User gates, not mandatory gates
**Warning signs:** phrases like "MUST stop", "NEVER proceed", "HALT execution"

### Pitfall 3: Ceremony Replication
**What goes wrong:** New skills add same ceremony with different labels
**Why it happens:** Copying pattern without understanding anti-pattern
**How to avoid:** Non-breaking by default. User-specified gates only
**Warning signs:** Mandatory checklists, readiness gates, pre-action protocols

### Pitfall 4: Stack Bloat
**What goes wrong:** Too many skills loading at entry
**Why it happens:** No stacking discipline
**How to avoid:** Max 3 skills at entry (context-intelligence + delegation-scope + workflow-hierarchy)
**Warning signs:** Context budget warning on session start

---

## Code Examples

### Verified Skill Frontmatter (Context7)

```yaml
---
name: skill-name-with-hyphens
description: >
  Use when [specific triggering conditions] — third person, 
  max 1024 chars. Must be 20+ chars for discoverability.
  Include keywords that should trigger activation.
---
```

**Rules:**
- Name: lowercase alphanumeric + hyphens only (`[a-z-]+`)
- Description: minimum 20 characters for discoverability
- Description format: "Use when..." + specific conditions + keywords

### Verified Progressive Loading (Context7)

```typescript
// From SkillsPlugin - skill loading via noReply pattern
const sendSilentPrompt = (text: string) =>
  ctx.client.session.prompt({
    path: { id: toolCtx.sessionID },
    body: {
      noReply: true,  // Critical: doesn't break conversation flow
      parts: [{ type: "text", text }],
    },
  })

// Skill activation sequence
await sendSilentPrompt(`The "${skill.name}" skill is loading`)
await sendSilentPrompt(`Base directory: ${skill.fullPath}\n\n${skill.content}`)
return `Launching skill: ${skill.name}`
```

### Non-Breaking Entry Skill Structure

```markdown
# L1: Always Available (~100 tokens)

## Purpose (1 sentence)
Non-blocking context defense for multi-agent IDE environments.

## Core Principles (3-4 bullets)
- GSD first, defense silently
- Trust but verify inherited context
- Alert on rot, never block
- User gates, not ritual gates

## Rot Signals (5-7 bullets)
- Watch for: [list signals]

---

# L2: On Trigger (~500 tokens max)

## Trust Scoring
[Weighted matrix]

## Entry State Recognition  
[Matrix table]

## Recovery Protocols
[On-demand protocols]

---

# L3: References (As Needed)
[Heavy content in separate files]
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|-----------------|--------------|--------|
| **Mandatory 6-step entry** | Non-blocking entry awareness | 2026-03-18 | GSD direct action restored |
| **6 delegation gates** | Delegation allowed by default | 2026-03-18 | Ceremony removed |
| **L1-L4 execution halt** | Alert-only escalation | 2026-03-18 | Long sessions preserved |
| **Lineage-based routing** | Situation-based selection | 2026-03-18 | User intent respected |
| **Ritual verification** | User-specified gates | 2026-03-18 | Overhead eliminated |

**Deprecated/outdated:**
- `skills/entry-resolution/SKILL.md` — Replaced by non-blocking context-intelligence
- `skills/delegation-framework/SKILL.md` — Replaced by GSD-native delegation
- `skills/context-integrity/SKILL.md` — Replaced by alert-only monitoring
- `skills/evidence-discipline/SKILL.md` — Replaced by practical verification

---

## Open Questions

1. **Skill Location**
   - What we know: Skills can be in `.opencode/skills/` or `skills/`
   - What's unclear: Which location is auto-discovered vs manual
   - Recommendation: Use `skills/` for project-specific, `.opencode/skills/` for cross-project

2. **Stacking Limit**
   - What we know: Max 3 skills recommended at entry
   - What's unclear: Whether this is enforced or advisory
   - Recommendation: Design for 3-entry max, trust OpenCode to manage

3. **GSD Integration Points**
   - What we know: GSD has `gsd-plan-phase`, `gsd-execute-phase`, etc.
   - What's unclear: Exact integration with context-intelligence skill
   - Recommendation: Context-intelligence runs BEFORE GSD phase agents, silent

4. **Trust Score Calibration**
   - What we know: Weighted signal matrix approach defined
   - What's unclear: Exact weights for GSD vs hive-* signals
   - Recommendation: Start with 0.6 threshold, calibrate based on user feedback

---

## Validation Architecture

> Validation section included per `.planning/config.json` workflow.nyquist_validation enabled.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (if present) or Node.js assert |
| Config file | `vitest.config.ts` or `package.json` test script |
| Quick run command | `npm test -- --run` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|---------------|
| REQ-09-01 | Context-intelligence skill loads on session start | Smoke | Skill file exists + valid frontmatter | ✅ SKILL.md |
| REQ-09-02 | Non-blocking: no mandatory protocols | Unit | Verify no "MUST", "NEVER", "HALT" in L1 | ✅ |
| REQ-09-03 | Progressive disclosure: L1 < 200 tokens | Unit | Count L1 token estimate | ✅ |
| REQ-09-04 | Meta-builder resolves GSD vs hive-* conflicts | Unit | Resolution table present | ✅ |
| REQ-09-05 | Hierarchy: "this first, others later" documented | Unit | Hierarchy section exists | ✅ |

### Sampling Rate
- **Per task commit:** `npm test -- --run --reporter=verbose` (quick)
- **Per wave merge:** `npm test` (full suite)
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `tests/skills/context-intelligence.test.ts` — covers REQ-09-01 through 09-05
- [ ] `tests/skills/meta-builder-hivemind.test.ts` — covers meta-builder patterns
- [ ] `tests/skills/progressive-disclosure.test.ts` — validates L1 token count
- Framework install: `npm install` — if none detected

---

## Sources

### Primary (HIGH confidence)
- **Context7 `/malhashemi/opencode-skills`** — SKILL.md format, progressive loading, `noReply: true` pattern
- **Context7 `/websites/opencode_ai_plugins`** — Plugin hooks (17 events), skill integration
- **HIVEMIND-POLLUTION-AUDIT.md** — Verified hive-* = pollution, GSD = legitimate

### Secondary (MEDIUM confidence)
- **`docs/draft-notes/context-intelligence-entry-pack-plan-2026-03-19.md`** — Context rot taxonomy, trust scoring, entry state matrix (1095-line draft)
- **`docs/draft-notes/the-second-context-investigation-round.md`** — Emission sources, auto-mechanism mapping
- **`skills/_deprecated_hive/*/`** — Deprecation pattern verified (entry-resolution, delegation-framework, context-integrity moved)

### Tertiary (LOW confidence)
- **`skills/hivemind-skill-writer/SKILL.md`** — hivemind-skill-writer patterns (project-specific, needs validation)
- **`skills/agent-role-boundary/SKILL.md`** — Diamond model patterns (useful but GSD-aligned skill needed)

---

## Metadata

**Confidence breakdown:**
- Standard stack: **HIGH** — Verified via Context7 official docs
- Architecture: **HIGH** — Based on verified draft plan + deprecated patterns analysis
- Pitfalls: **HIGH** — Derived from actual deprecated hive-* patterns

**Research date:** 2026-03-19
**Valid until:** 2026-04-19 (30 days — stable domain)
