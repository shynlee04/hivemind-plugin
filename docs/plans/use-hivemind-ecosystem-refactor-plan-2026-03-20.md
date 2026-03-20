# use-hivemind* Ecosystem Refactor Plan

**Date:** 2026-03-20
**Status:** Planning
**Lineage:** hivefiver (meta-builder)
**Framework:** HiveMind Context Governance
**Supersedes:** `docs/plans/git-memory-delegation-skills-plan-2026-03-20.md`

---

## Executive Summary

This plan addresses the systemic refactoring of the HiveMind `use-hivemind*` skill ecosystem to achieve:

1. **Unified Naming Convention** — All entry/activator skills follow `use-hivemind-*` pattern
2. **Zero Conflict** — No overlapping triggers, no noise, no context pollution
3. **Hierarchy Bridging** — Skills work across agents/subagents AND human collaboration
4. **Standalone Usability** — Each skill works alone AND composes with others
5. **Systematic Design** — TDD cycles, Skill-Judge validation, deterministic behavior

### Key Problems Solved

| Problem | Old State | New State |
|---------|-----------|-----------|
| Naming chaos | `git-atomic-memory`, `hivemind-skill-writer` | `use-hivemind-git-memory`, `use-hivemind-skill-writer` |
| Ghost references | `delegation-handoff`, `session-memory-resume` not created | Resolved or explicitly removed |
| Context pollution | No hygiene protocols | Explicit pollution detection and prevention |
| Conflict detection | Partial overlap matrix | Full priority resolution with entry gates |
| Hierarchy bridging | Git memory only | Cross-domain anchor types with translation |

---

## Part 1: Current State Analysis

### 1.1 Skills Inventory

#### Existing `use-hivemind*` Skills

| Skill | Location | Status | Registry |
|-------|----------|--------|----------|
| `use-hivemind-skill-writer` | `.opencode/skills/` | Active (router only) | NOT LISTED |
| `use-hivemind-meta-builder` | `.opencode/skills/` | Active | NOT LISTED |

#### Existing Context/Memory/Delegation Skills

| Skill | Location | Status | Registry |
|-------|----------|--------|----------|
| `git-atomic-memory` | `skills/` + `.opencode/skills/` | Needs rename | NOT LISTED |
| `context-intelligence-entry` | `skills/` + `.opencode/skills/` | Active | NOT LISTED |
| `context-entry-verify` | `skills/` + `.opencode/skills/` | Active | NOT LISTED |
| `opencode-delegation` | `skills/` | Active | NOT LISTED |
| `hivemind-skill-writer` | `skills/` + `.opencode/skills/` | Different content | NOT LISTED |
| `hivemind-skill-write` | `.opencode/skills/` only | Active | NOT LISTED |
| `hivemind-skill-doctor` | `.opencode/skills/` only | Active | NOT LISTED |

#### Registered Skills (12 Active)

| Skill | Domain | Bundle | KDS |
|-------|--------|--------|-----|
| `agent-role-boundary` | agent-governance | governance-core | 0.88 |
| `meta-builder-governance` | framework-governance | meta-core | 0.92 |
| `context-integrity` | context-governance | governance-core | 0.90 |
| `delegation-framework` | delegation-governance | governance-core | 0.89 |
| `evidence-discipline` | verification | verification-core | 0.91 |
| `verification-methodology` | verification | verification-core | 0.83 |
| `research-methodology` | research-ops | research-core | 0.80 |
| `platform-adapter` | platform-governance | governance-core | 0.93 |
| `wrong-start-resolver` | session-governance | governance-core | 0.88 |
| `entry-resolution` | session-governance | governance-core | 0.95 |
| `spec-distillation` | spec-engineering | meta-core | 0.82 |
| `ralph-tasking` | task-orchestration | meta-core | 0.67 |

#### Ghost References (Mentioned But Not Created)

| Ghost Skill | Referenced By | Intent |
|-------------|--------------|--------|
| `delegation-handoff` | `git-atomic-memory` | Handoff context linking |
| `session-memory-resume` | `git-atomic-memory` frontmatter | Session continuation |
| `delegation-scope` | `hivemind-skill-writer` references | Scope inheritance rules |

#### Deprecated Skills (`_deprecated_hive/`)

| Deprecated Skill | Superseded By | Status |
|-----------------|---------------|--------|
| `context-integrity` | `context-intelligence-entry` | Active reference remains |
| `delegation-framework` | Current delegation skills | Registry active |
| `entry-resolution` | Current entry skills | Registry active |
| `evidence-discipline` | Current verification | Registry active |

---

### 1.2 Conflict and Overlap Analysis

#### Naming Conflicts

| Old Name | New Name | Reason |
|----------|----------|--------|
| `git-atomic-memory` | `use-hivemind-git-memory` | Must follow `use-hivemind*` initiator pattern |
| `context-intelligence-entry` | `use-hivemind-context-integrity` | Must follow `use-hivemind*` pattern |
| `context-entry-verify` | `use-hivemind-context-verify` | Must follow `use-hivemind*` pattern |

#### Skill Overlap Matrix

| Skill A | Skill B | Overlap Type | Resolution |
|---------|---------|--------------|------------|
| `use-hivemind-skill-writer` | `hivemind-skill-write` | Sequential | Router → Implementation |
| `use-hivemind-skill-writer` | `hivemind-skill-doctor` | Sequential | Router → Audit |
| `use-hivemind-context-integrity` | `context-entry-verify` | Complementary | Context health → Verification |
| `use-hivemind-git-memory` | `git-atomic-memory` | Rename | Migrate content |
| `opencode-delegation` | `delegation-framework` | Conflicting | `opencode-delegation` is OpenCode-specific; `delegation-framework` is deprecated |

#### Terminology Resolution

| Term | Usage | Scope |
|------|-------|-------|
| **Handoff** | Delegation contract between sessions | HiveMind-specific |
| **Delegate** | OpenCode Task tool invocation | Framework-agnostic |
| **SessionLineage** | HiveMind session context | HiveMind-specific |
| **opencode_session_id** | OpenCode session identifier | Framework-agnostic |
| **GitMemoryAnchor** | Commit-based semantic memory | HiveMind-specific |
| **SemanticMemory** | Knowledge storage | Framework-agnostic |
| **ContextPollution** | Unwanted cross-contamination | HiveMind-specific |
| **ContextHygiene** | Prevention protocols | HiveMind-specific |

---

## Part 2: New Skill Taxonomy

### 2.1 Naming Convention

All entry/activator skills MUST follow the `use-hivemind-*` pattern:

```
use-hivemind-{concept}
```

Where `{concept}` is a singular noun describing the primary domain:

| New Name | Old Name | Concept |
|----------|----------|---------|
| `use-hivemind-skill-writer` | (existing) | Skill authoring |
| `use-hivemind-skill-doctor` | `hivemind-skill-doctor` | Skill audit/repair |
| `use-hivemind-context-integrity` | `context-intelligence-entry` | Context health |
| `use-hivemind-context-verify` | `context-entry-verify` | Context verification |
| `use-hivemind-git-memory` | `git-atomic-memory` | Git-based memory |
| `use-hivemind-delegation` | (new) | Handoff protocol |
| `use-hivemind-session-resume` | (new) | Session continuation |
| `use-hivemind-hierarchy` | `agent-role-boundary` | Role hierarchy |

### 2.2 Skill Categories

#### Category 1: Meta-Builder (hivefiver lineage)

| Skill | Purpose | Entry Level |
|-------|---------|-------------|
| `use-hivemind-skill-writer` | Entry router for skill creation | P0 |
| `use-hivemind-skill-doctor` | Entry router for skill audit | P0 |
| `hivemind-skill-write` | Implementation: skill authoring | P1 |
| `hivemind-skill-doctor` | Implementation: skill audit | P1 |

#### Category 2: Context Governance (P0 Mandatory)

| Skill | Purpose | Entry Level |
|-------|---------|-------------|
| `use-hivemind-context-integrity` | Entry router for context health | P0 |
| `use-hivemind-context-verify` | Entry router for context verification | P0 |
| `context-intelligence-entry` | Implementation: rot/pollution detection | P1 |
| `context-entry-verify` | Implementation: truth verification | P1 |

#### Category 3: Memory Anchors

| Skill | Purpose | Entry Level |
|-------|---------|-------------|
| `use-hivemind-git-memory` | Entry router for git-based memory | P1 |
| `use-hivemind-session-resume` | Entry router for session continuation | P2 |
| `git-atomic-memory` | Implementation: commit → memory encoding | P2 |

#### Category 4: Delegation & Hierarchy

| Skill | Purpose | Entry Level |
|-------|---------|-------------|
| `use-hivemind-delegation` | Entry router for handoff protocol | P1 |
| `use-hivemind-hierarchy` | Entry router for role boundaries | P1 |
| `opencode-delegation` | Implementation: OpenCode-specific delegation | P2 |

---

## Part 3: New Skill Designs

### 3.1 `use-hivemind-context-integrity` (P0 Entry Router)

**Pattern:** P1 (Entry routing)

**Failing Scenario:**
```
Without skill:
- Context drifts without detection
- Chain breaks invisible until failure
- Context pollution spreads silently
- No hygiene protocols exist

With skill:
- Drift detected at entry gates
- Chain integrity verified continuously
- Pollution sources identified and isolated
- Hygiene protocols prevent contamination
```

**Core Responsibilities:**
1. **Entry Gate** — Check context health at session start
2. **Drift Detection** — Monitor for context rot, pollution, poisoning
3. **Chain Verification** — Ensure session lineage integrity
4. **Hygiene Enforcement** — Prevent cross-contamination between domains
5. **Routing** — Delegate to appropriate sub-skill based on detected issue

**Routing Logic:**
```
CONTEXT ISSUE DETECTED:
├── Drift > threshold → context-intelligence-entry
├── Pollution detected → context-entry-verify
├── Chain break → use-hivemind-delegation (for handoff repair)
├── Verification needed → use-hivemind-context-verify
└── Clean state → proceed without intervention
```

**Must Have:**
- [ ] Entry health check protocol
- [ ] Drift detection thresholds
- [ ] Pollution source identification
- [ ] Chain integrity verification
- [ ] Hygiene enforcement rules
- [ ] Routing to appropriate sub-skill

**Must NOT Have:**
- [ ] Implementation details for修复
- [ ] Duplicate context-intelligence-entry content
- [ ] Verification logic (separate skill)

---

### 3.2 `use-hivemind-git-memory` (Git-Based Memory Entry)

**Pattern:** P2 (Domain-specific entry)

**Failing Scenario:**
```
Without skill:
- Commits exist but intent is lost
- No semantic link between commits and session
- Cannot reconstruct "why" decisions were made
- Context compaction = complete memory loss

With skill:
- Commit intent encoded as semantic memory
- Commit → session → intent chain preserved
- Resume from git anchors after context loss
- Knowledge network formed from commit history
```

**Core Responsibilities:**
1. **Entry Router** — Detect when git memory retrieval is needed
2. **Anchor Detection** — Find relevant commits for current context
3. **Network Formation** — Build semantic network from commit chains
4. **Intent Retrieval** — Extract "why" from commit messages and diffs
5. **Resume Support** — Enable session continuation from git anchors

**Routing Logic:**
```
GIT MEMORY REQUEST:
├── retrieve --session-id → Load session-git anchors
├── encode --commit → Encode intent as semantic memory
├── network --build → Form knowledge network from commits
├── resume --from-git → Resume session from git anchors
└── intent --extract → Extract decision rationale from commits
```

**Must Have:**
- [ ] Git command → knowledge type mapping
- [ ] Semantic network formation rules
- [ ] Commit → session linking protocol
- [ ] Intent encoding schema
- [ ] Resume anchor determination

**Must NOT Have:**
- [ ] Duplicate conventional-commit functionality
- [ ] Generic git workflow (use git-advanced-workflows)
- [ ] File-level operations (use existing tools)

---

### 3.3 `use-hivemind-delegation` (Handoff Protocol Entry)

**Pattern:** P1 (Entry routing)

**Failing Scenario:**
```
Without skill:
- Subagent doesn't know it's delegated
- No scope inheritance from parent
- No proper result handoff
- Parent intent lost after first output

With skill:
- Subagent aware of delegation status
- Scope constraints inherited from parent
- Result contract established
- Parent-child relationship documented
```

**Core Responsibilities:**
1. **Handoff Detection** — Detect when entering a delegated session
2. **Packet Processing** — Read and validate handoff packet
3. **Scope Inheritance** — Apply parent constraints to child session
4. **Result Contract** — Establish return format for parent
5. **Chain Documentation** — Record delegation chain for audit

**Routing Logic:**
```
DELEGATION CONTEXT DETECTED:
├── incoming-handoff → Process handoff packet
├── scope-declaration → Set scope boundaries
├── result-contract → Establish return format
├── parent-link → Document parent-child relationship
└── chain-audit → Record delegation for traceability
```

**Must Have:**
- [ ] Handoff packet schema
- [ ] Sub-session detection protocol
- [ ] Scope inheritance rules
- [ ] Result contract template
- [ ] Chain audit format

**Must NOT Have:**
- [ ] OpenCode Task tool replacement
- [ ] Generic scope rules (reference only)
- [ ] Implementation of delegation execution

---

## Part 4: Ghost Reference Resolution

### 4.1 Resolve or Remove Matrix

| Ghost Reference | Decision | Action |
|-----------------|----------|--------|
| `delegation-handoff` | **RESOLVE** | Create `use-hivemind-delegation` |
| `session-memory-resume` | **RESOLVE** | Create `use-hivemind-session-resume` (merged into context-integrity) |
| `delegation-scope` | **REMOVE** | Reference `use-hivemind-hierarchy` instead |
| `quality-improvement-loop` | **ABSORB** | Merge into `use-hivemind-context-integrity` as pattern module |

### 4.2 Deprecated Skill Handling

| Deprecated Skill | Action | Rationale |
|-----------------|--------|-----------|
| `_deprecated_hive/context-integrity` | **ARCHIVE** | Superseded by `use-hivemind-context-integrity` |
| `_deprecated_hive/delegation-framework` | **ARCHIVE** | OpenCode-specific `opencode-delegation` sufficient |
| `_deprecated_hive/entry-resolution` | **ARCHIVE** | Functions absorbed into `use-hivemind*` entry skills |
| `_deprecated_hive/evidence-discipline` | **KEEP ACTIVE** | Still referenced in registry, valid concept |
| `_deprecated_hive/meta-builder-governance` | **KEEP ACTIVE** | Still referenced in registry, valid concept |

---

## Part 5: Conflict Elimination Protocol

### 5.1 Skill Boundary Rules

| Rule | Description | Enforcement |
|------|-------------|-------------|
| **Entry Only** | `use-hivemind-*` skills ONLY route, never implement | SKILL.md Must-Have section |
| **No Overlap** | Same trigger phrase routes to ONE skill only | Routing matrix validation |
| **No Noise** | Each skill has max 5 trigger phrases | Skill-Judge Trigger ≥3.0 |
| **Hierarchy Preserved** | P0 → P1 → P2 strict ordering | Entry level in frontmatter |

### 5.2 Priority Resolution

When multiple skills could handle the same request:

```
PRIORITY ORDER:
1. use-hivemind-context-integrity (P0 mandatory)
2. use-hivemind-skill-writer (meta-builder)
3. use-hivemind-delegation (hierarchy)
4. use-hivemind-git-memory (memory)
5. use-hivemind-session-resume (continuation)
```

### 5.3 Noise Filtering

| Noise Type | Filter Rule |
|-------------|-------------|
| Generic triggers | Must be domain-specific ("fix bug" → "audit this skill") |
| Overlapping phrases | Only one skill per semantic intent |
| Redundant knowledge | Skill-Judge Non-Redundancy ≥3.0 |

---

## Part 6: Implementation Sequence

### Phase 1: Foundation (P0 Skills)

#### Batch 1.1: `use-hivemind-context-integrity`

**TDD Cycle:**
1. **RED:** Document failing scenario (context drift, pollution, chain break)
2. **GREEN:** Write minimal entry router
3. **REFACTOR:** Validate with Skill-Judge ≥3.5

**Artifacts:**
- `.opencode/skills/use-hivemind-context-integrity/SKILL.md`
- References: drift-detection.md, pollution-sources.md, chain-verification.md

**Dependencies:** None (P0 entry)

#### Batch 1.2: `use-hivemind-context-verify`

**TDD Cycle:**
1. **RED:** Document failing scenario (truth verification, gate checks)
2. **GREEN:** Write minimal verification router
3. **REFACTOR:** Validate with Skill-Judge ≥3.5

**Artifacts:**
- `.opencode/skills/use-hivemind-context-verify/SKILL.md`
- References: gate-protocols.md, truth-anchors.md

**Dependencies:** `use-hivemind-context-integrity`

---

### Phase 2: Core Migration

#### Batch 2.1: Rename `git-atomic-memory` → `use-hivemind-git-memory`

**TDD Cycle:**
1. **RED:** Document failing scenario (git memory retrieval)
2. **GREEN:** Create new `use-hivemind-git-memory` with content migrated
3. **REFACTOR:** Validate with Skill-Judge ≥3.5
4. **CLEANUP:** Archive old `git-atomic-memory`

**Artifacts:**
- `.opencode/skills/use-hivemind-git-memory/SKILL.md`
- References: intent-encoding.md, semantic-network.md, commit-linking.md

**Dependencies:** `use-hivemind-context-integrity`

#### Batch 2.2: Create `use-hivemind-delegation`

**TDD Cycle:**
1. **RED:** Document failing scenario (handoff detection, scope inheritance)
2. **GREEN:** Write minimal handoff router
3. **REFACTOR:** Validate with Skill-Judge ≥3.5

**Artifacts:**
- `.opencode/skills/use-hivemind-delegation/SKILL.md`
- References: handoff-packet-schema.md, scope-inheritance.md, chain-audit.md

**Dependencies:** `use-hivemind-context-integrity`

---

### Phase 3: Hierarchy & Composition

#### Batch 3.1: Rename `agent-role-boundary` → `use-hivemind-hierarchy`

**TDD Cycle:**
1. **RED:** Document failing scenario (role boundary enforcement)
2. **GREEN:** Create new `use-hivemind-hierarchy`
3. **REFACTOR:** Validate with Skill-Judge ≥3.5

**Artifacts:**
- `.opencode/skills/use-hivemind-hierarchy/SKILL.md`
- References: role-model.md, boundary-enforcement.md

**Dependencies:** `use-hivemind-delegation`

#### Batch 3.2: Create `use-hivemind-session-resume`

**TDD Cycle:**
1. **RED:** Document failing scenario (session continuation)
2. **GREEN:** Write minimal resume router
3. **REFACTOR:** Validate with Skill-Judge ≥3.5

**Artifacts:**
- `.opencode/skills/use-hivemind-session-resume/SKILL.md`
- References: resume-protocol.md, anchor-determination.md

**Dependencies:** `use-hivemind-git-memory`, `use-hivemind-delegation`

---

## Part 7: Verification Criteria

### Skill-Judge Thresholds (All Must Pass)

| Skill | Trigger ≥3.0 | Action ≥4.0 | Ref ≥3.0 | Non-Red ≥3.0 | Edge ≥3.0 | Overall ≥3.5 |
|-------|-------------|-------------|---------|--------------|-----------|---------------|
| `use-hivemind-context-integrity` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `use-hivemind-context-verify` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `use-hivemind-git-memory` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `use-hivemind-delegation` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `use-hivemind-hierarchy` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `use-hivemind-session-resume` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

### Non-Breaking Tests

- [ ] GSD workflows unaffected
- [ ] No added ceremony
- [ ] Stack budget ≤3
- [ ] All existing skills still work
- [ ] No ghost references remain
- [ ] Registry updated with new names

---

## Part 8: Migration Map

### Skills to CREATE (New)

| Skill | Priority | Phase |
|-------|----------|-------|
| `use-hivemind-context-integrity` | P0 | Phase 1 |
| `use-hivemind-context-verify` | P0 | Phase 1 |
| `use-hivemind-delegation` | P1 | Phase 2 |
| `use-hivemind-session-resume` | P2 | Phase 3 |

### Skills to RENAME

| Old Name | New Name | Migration Action |
|----------|----------|------------------|
| `git-atomic-memory` | `use-hivemind-git-memory` | Create new, archive old |
| `agent-role-boundary` | `use-hivemind-hierarchy` | Create new, archive old |
| `context-intelligence-entry` | (absorbed into use-hivemind-context-integrity) | Migrate content |
| `context-entry-verify` | `use-hivemind-context-verify` | Create new, archive old |

### Skills to ARCHIVE

| Skill | Location | Rationale |
|-------|----------|-----------|
| `_deprecated_hive/context-integrity` | `skills/_deprecated_hive/` | Superseded |
| `_deprecated_hive/delegation-framework` | `skills/_deprecated_hive/` | Superseded |
| `_deprecated_hive/entry-resolution` | `skills/_deprecated_hive/` | Absorbed |

### Skills to KEEP ACTIVE (Registry)

| Skill | Reason |
|-------|--------|
| `evidence-discipline` | Still valid, not replaced |
| `meta-builder-governance` | Still valid, not replaced |
| `verification-methodology` | Still valid, not replaced |
| `wrong-start-resolver` | Still valid, not replaced |

---

## Part 9: Rollback Protocol

If any batch fails verification:

| Failed Skill | Rollback Action |
|--------------|-----------------|
| `use-hivemind-context-integrity` | Revert to `context-intelligence-entry` |
| `use-hivemind-git-memory` | Revert to `git-atomic-memory` |
| `use-hivemind-delegation` | Revert to ghost reference (no change) |

---

## References

- `knowledge-of-skill-for-HIVEMIND-meta-builder.md` — Three-skill architecture
- `HIVEMIND-FRAMEWORK-OVERVIEW.md` — Platform knowledge, lineage rules
- `docs/plans/git-memory-delegation-skills-plan-2026-03-20.md` — Superseded plan
- `.opencode/skills/use-hivemind-skill-writer/SKILL.md` — Entry router pattern
- `skills/registry.yaml` — Active registry

---

**Status:** Ready for incremental batch execution

**Next Step:** User authorization to begin Phase 1 Batch 1.1 (`use-hivemind-context-integrity`)
