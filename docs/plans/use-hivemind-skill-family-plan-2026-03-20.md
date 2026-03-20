# use-hivemind* Skill Family Refactor Plan

**Date:** 2026-03-20
**Status:** Planning
**Lineage:** hivefiver (meta-builder) > terminal-planner
**Parent Document:** `docs/plans/use-hivemind-ecosystem-refactor-plan-2026-03-20.md`
**Framework:** HiveMind Context Governance

---

## Executive Summary

This plan provides a systematic refactoring of the HiveMind `use-hivemind*` skill family to establish:

1. **Unified Naming Convention** — All entry/activator skills follow `use-hivemind-*` prefix
2. **Three-Skill Architecture** — Entry (`use-*`) → Implementation (`hivemind-*-write`) → Audit (`hivemind-*-doctor`)
3. **Zero Conflicts** — No overlapping triggers, duplicate files, or registry inconsistencies
4. **Registry Alignment** — All operational skills registered with proper metadata
5. **Clean Hierarchy** — Clear routing from entry to specialist skills

---

## Part 1: Current State Assessment

### 1.1 Implemented Skills Inventory

#### Active Entry/Router Skills (`.opencode/skills/`)

| Skill | Location | Correct Naming? | Registry Status |
|-------|----------|-----------------|-----------------|
| `use-hivemind-skill-writer` | `.opencode/skills/` | YES | NOT LISTED |
| `hivemind-skill-write` | `.opencode/skills/` | YES | NOT LISTED |
| `hivemind-skill-doctor` | `.opencode/skills/` | YES | NOT LISTED |

#### Context/Memory Skills (Duplicated in both locations)

| Skill | Locations | Issue | Resolution |
|-------|-----------|-------|------------|
| `context-intelligence-entry` | `skills/` + `.opencode/skills/` | DUPLICATE | Consolidate to `.opencode/skills/` |
| `context-entry-verify` | `skills/` + `.opencode/skills/` | DUPLICATE | Consolidate to `.opencode/skills/` |
| `git-atomic-memory` | `skills/` + `.opencode/skills/` | DUPLICATE + WRONG NAME | Rename to `use-hivemind-git-memory` |
| `hivemind-skill-writer` | `skills/` + `.opencode/skills/` | DUPLICATE + ROLE CONFUSION | One is entry, one claims implementation - consolidate |

#### Other Skills Requiring Rename/Creation

| Current Name | Target Name | Status | Action |
|--------------|-------------|--------|--------|
| N/A | `use-hivemind-context-integrity` | MISSING | Create new |
| N/A | `use-hivemind-context-verify` | MISSING | Create new |
| N/A | `use-hivemind-delegation` | MISSING | Create new |
| N/A | `use-hivemind-hierarchy` | MISSING | Create new |
| N/A | `use-hivemind-session-resume` | MISSING | Create new |
| `agent-role-boundary` | `use-hivemind-hierarchy` | RENAME NEEDED | Migrate content |

### 1.2 Registry Analysis

#### Current Registry (`skills/registry.yaml`)

**12 Skills Listed as Active:**

```yaml
skills:
  - agent-role-boundary (NOT in .opencode/skills/)
  - meta-builder-governance (NOT in .opencode/skills/)
  - context-integrity (deprecated but listed as active)  - delegation-framework (deprecated but listed as active)
  - evidence-discipline (deprecated but listed as active)
  - verification-methodology
  - research-methodology
  - platform-adapter
  - wrong-start-resolver
  - entry-resolution (deprecated but listed as active)
  - spec-distillation
  - ralph-tasking
```

**Critical Issues:**

1. **Location Mismatch:** Registry lists skills in `skills/` but operational skills are in `.opencode/skills/`
2. **Deprecated References:** Skills in `_deprecated_hive/` are still marked as active
3. **Missing Operational Skills:** `use-hivemind-skill-writer`, `hivemind-skill-write`, `hivemind-skill-doctor` are NOT registered
4. **Ghost References:** `delegation-intelligence`, `swarm-planner`, `session-lifecycle` referenced in AGENTS.md but not created

### 1.3 Duplicate File Analysis

| Skill | `skills/` | `.opencode/skills/` | Resolution |
|-------|-----------|---------------------|------------|
| `context-intelligence-entry` | EXISTS | EXISTS | REMOVE from `skills/` |
| `context-entry-verify` | EXISTS | EXISTS | REMOVE from `skills/` |
| `git-atomic-memory` | EXISTS | EXISTS | REMOVE from `skills/`, RENAME to `use-hivemind-git-memory` |
| `hivemind-skill-writer` | EXISTS | EXISTS | DIFFERENT CONTENT - RESOLVE |
| `spec-distillation` | EXISTS | EXISTS | Consolidate to `.opencode/skills/` |
| `research-methodology` | EXISTS | EXISTS | Consolidate to `.opencode/skills/` |
| `ralph-tasking` | EXISTS | EXISTS | Consolidate to `.opencode/skills/` |
| `platform-adapter` | EXISTS | NOT EXISTS | MOVE to `.opencode/skills/` |
| `harness-architecture` | EXISTS | EXISTS | Consolidate to `.opencode/skills/` |

### 1.4 Deprecated Skills Still Present

| Deprecated Skill | Location | Registry Status | Action |
|------------------|----------|-----------------|--------|
| `delegation-framework` | `skills/_deprecated_hive/` + `.codex/skills/` | ACTIVE | ARCHIVE |
| `context-integrity` | `skills/_deprecated_hive/` + `.codex/skills/` | ACTIVE | ARCHIVE |
| `evidence-discipline` | `skills/_deprecated_hive/` + `.codex/skills/` | ACTIVE | ARCHIVE |
| `entry-resolution` | `skills/_deprecated_hive/` + `.codex/skills/` | ACTIVE | ARCHIVE |
| `wrong-start-resolver` | `skills/_deprecated_hive/` + `.codex/skills/` | ACTIVE | ARCHIVE |
| `verification-methodology` | `skills/_deprecated_hive/` + `.codex/skills/` | ACTIVE | ARCHIVE |
| `meta-builder-governance` | `skills/_deprecated_hive/` + `.codex/skills/` | ACTIVE | ARCHIVE |

---

## Part 2: Hierarchy Design

### 2.1 Three-Skill Architecture

The `use-hivemind*` family follows a consistent three-tier pattern:

```
┌─────────────────────────────────────────────────────────────────┐
│                    ENTRY LAYER (use-*)                          │
│                    ~50-150 lines                               │
│   - Thin routing, broad triggering                             │
│   - Degree 1 freedom (high judgment)                          │
│   - Coordinator behavior                                       │
│   - Does NOT implement, only ROUTES                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              IMPLEMENTATION LAYER (hivemind-*-write)             │
│                    ~200-400 lines                               │
│   - Deep content, step-by-step guidance                        │
│   - Degree 2/3 freedom (measured determinism)                  │
│   - Specialist behavior                                        │
│   - ACTUALLY IMPLEMENTS the domain work                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 AUDIT LAYER (hivemind-*-doctor)                 │
│                    ~300-500 lines                               │
│   - Diagnostic, repair, hardening                             │
│   - Degree 3 freedom (strict determinism)                      │
│   - Quality validation                                         │
│   - Skill-Judge integration                                    │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Skill Family Topology

```
                    ┌──────────────────────────────┐
                    │     use-hivemind-main        │
                    │     (Top-level activator)     │
                    │     Broad bundle trigger      │
                    └──────────────┬───────────────┘
                                   │
        ┌──────────────────────────┼──────────────────────────┐
        │                          │                          │
        ▼                          ▼                          ▼
┌───────────────────┐  ┌────────────────────┐  ┌─────────────────────┐
│ use-hivemind-     │  │ use-hivemind-      │  │ use-hivemind-       │
│ context-integrity │  │ skill-writer       │  │ delegation          │
│                   │  │                    │  │                      │
│ Context health    │  │ Skill authoring    │  │ Handoff protocol    │
│ & rot detection   │  │ & quality          │  │ & scope inheritance  │
└────────┬──────────┘  └─────────┬──────────┘  └──────────┬──────────┘
         │                       │                         │
         ▼                       ▼                         ▼
┌───────────────────┐  ┌────────────────────┐  ┌─────────────────────┐
│ context-          │  │ hivemind-skill-    │  │ hivemind-delegation │
│ intelligence-     │  │ write              │  │ -write              │
│ entry             │  │                    │  │                      │
│ (implementation)  │  │ hivemind-skill-     │  │ (implementation)     │
│                   │  │ doctor              │  │                      │
│ context-entry-    │  │                    │  │                      │
│ verify            │  │                    │  │                      │
│ (verification)    │  │                    │  │                      │
└───────────────────┘  └────────────────────┘  └─────────────────────┘

        ┌──────────────────────────┼──────────────────────────┐
        │                          │                          │
        ▼                          ▼                          ▼
┌───────────────────┐  ┌────────────────────┐  ┌─────────────────────┐
│ use-hivemind-     │  │ use-hivemind-      │  │ use-hivemind-       │
│ git-memory        │  │ hierarchy          │  │ session-resume      │
│                   │  │                    │  │                     │
│ Git-based memory  │  │ Role boundaries    │  │ Session continuation│
│ & anchor encoding │  │ & authority        │  │ & state retrieval   │
└────────┬──────────┘  └─────────┬──────────┘  └──────────┬──────────┘
         │                       │                         │
         ▼                       ▼                         ▼
┌───────────────────┐  ┌────────────────────┐  ┌─────────────────────┐
│ git-atomic-       │  │ [implementation    │  │ [implementation      │
│ memory            │  │  to be created]    │  │  to be created]       │
│ (implementation)  │  │                    │  │                      │
└───────────────────┘  └────────────────────┘  └─────────────────────┘
```

### 2.3 Entry Skill Routing Logic

Each `use-hivemind-*` skill must have explicit routing logic:

```yaml
# Standard Routing Block for Entry Skills

## Routing Logic

INTENT DETECTION:
├── [domain-specific intent]
│   ├── [sub-intent A] → route to [specialist A]
│   ├── [sub-intent B] → route to [specialist B]
│   └── [sub-intent C] → route to [specialist C]
│
├── [cross-domain intent]
│   └── route to [coordinator skill]
│
└── UNKNOWN
    └── Ask clarifying question before routing

NO-LOAD Rules:
- Context depth >70% → Defer to context recovery
- Session degraded → Skip activation
- Active skills ≥3 → Skip activation
```

### 2.4 Trigger Phrase Mapping

| Skill | Primary Triggers | Secondary Triggers |
|-------|------------------|-------------------|
| `use-hivemind-main` | "use hivemind", "hivemind skills" | Broad system question |
| `use-hivemind-context-integrity` | "context drift", "rot detected", "pollution" | "session degraded" |
| `use-hivemind-context-verify` | "verify context", "truth check", "validate state" | "completion claim" |
| `use-hivemind-skill-writer` | "write a skill", "create skill", "skill design" | "audit this skill" |
| `use-hivemind-git-memory` | "git memory", "commit intent", "anchor" | "session resume from git" |
| `use-hivemind-delegation` | "delegate", "handoff", "subagent scope" | "parent context" |
| `use-hivemind-hierarchy` | "role boundary", "agent hierarchy", "authority" | "permission envelope" |
| `use-hivemind-session-resume` | "resume session", "continue from", "session state" | "after clear" |

---

## Part 3: Cleanup Phase

### 3.1 Deprecated Skills Removal

**Batch A: Archive Deprecated Skills**

```bash
# Skills to archive (remove from registry, keep files for reference)
skills/_deprecated_hive/delegation-framework/
skills/_deprecated_hive/context-integrity/
skills/_deprecated_hive/evidence-discipline/
skills/_deprecated_hive/entry-resolution/
skills/_deprecated_hive/wrong-start-resolver/
skills/_deprecated_hive/verification-methodology/
skills/_deprecated_hive/meta-builder-governance/

# Also present in .codex/skills/ - cleanup those too
.codex/skills/delegation-framework/
.codex/skills/context-integrity/
.codex/skills/evidence-discipline/
.codex/skills/entry-resolution/
```

**Registry Changes:** Mark all deprecated skills with `status: archived`

### 3.2 Duplicate Resolution

**Batch B: Consolidate Duplicates**

| Action | Source | Target |
|--------|--------|--------|
| REMOVE | `skills/context-intelligence-entry/` | Keep `.opencode/skills/context-intelligence-entry/` |
| REMOVE | `skills/context-entry-verify/` | Keep `.opencode/skills/context-entry-verify/` |
| REMOVE + RENAME | `skills/git-atomic-memory/` + `.opencode/skills/git-atomic-memory/` | Create `.opencode/skills/use-hivemind-git-memory/` |
| RESOLVE | `skills/hivemind-skill-writer/` vs `.opencode/skills/` | Analyze and merge content |
| REMOVE | `skills/spec-distillation/` | Keep `.opencode/skills/spec-distillation/` |
| REMOVE | `skills/research-methodology/` | Keep `.opencode/skills/research-methodology/` |
| REMOVE | `skills/ralph-tasking/` | Keep `.opencode/skills/ralph-tasking/` |
| MOVE | `skills/platform-adapter/` | `.opencode/skills/platform-adapter/` |

### 3.3 `hivemind-skill-writer` Conflict Resolution

**Current State:**
- `skills/hivemind-skill-writer/SKILL.md` - Claims to be entry router + meta-builder
- `.opencode/skills/hivemind-skill-writer/SKILL.md` - Also exists
- `.opencode/skills/use-hivemind-skill-writer/SKILL.md` - Explicit entry router

**Resolution:**

1. **`use-hivemind-skill-writer`** → Entry router (thin, ~50-100 lines)
   - Triggers: "write a skill", "create a new skill", "skill design"
   - Routes to: `hivemind-skill-write` (create) or `hivemind-skill-doctor` (audit)

2. **`hivemind-skill-write`** → Implementation layer (~200-400 lines)
   - Contains: Step-by-step authoring guidance
   - Pattern templates, TDD workflow

3. **`hivemind-skill-doctor`** → Audit layer (~300-500 lines)
   - Contains: Skill-Judge metrics, diagnostic procedures

4. **`skills/hivemind-skill-writer/`** → REMOVE (superseded by proper three-tier structure)

---

## Part 4: Missing Skills Implementation

### 4.1 `use-hivemind-context-integrity` (P0)

**Purpose:** Entry router for context health and rot detection

**Pattern:** P1 (Entry routing)

**Routing Logic:**
```yaml
CONTEXT ISSUE DETECTED:
├── Drift > threshold → route to context-intelligence-entry
├── Pollution detected → route to context-entry-verify
├── Chain break detected → route to use-hivemind-delegation
├── Verification needed → route to use-hivemind-context-verify
└── Clean state → proceed without intervention
```

**Must Have:**
- [ ] Entry health check protocol (route, not implement)
- [ ] Drift detection thresholds (reference to context-intelligence-entry)
- [ ] Pollution detection flags
- [ ] Chain integrity verification routing
- [ ] Hygiene enforcement delegation

**Must NOT Have:**
- [ ] Implementation details (delegate to specialists)
- [ ] Duplicate context-intelligence-entry content
- [ ] Verification logic (separate skill)

**Target Location:** `.opencode/skills/use-hivemind-context-integrity/SKILL.md`

### 4.2 `use-hivemind-context-verify` (P0)

**Purpose:** Entry router for context truth verification

**Pattern:** P1 (Entry routing)

**Routing Logic:**
```yaml
VERIFICATION REQUEST:
├── Build verification → route to build-gate verification
├── Test verification → route to test-gate verification
├── Git state verification → route to git-workflows
├── Truth anchor verification → route to context-entry-verify
└── Completion claim → enforce verification before approval
```

**Must Have:**
- [ ] Verification routing logic
- [ ] Gate protocol references
- [ ] Truth anchor determination
- [ ] Completion claim enforcement

**Target Location:** `.opencode/skills/use-hivemind-context-verify/SKILL.md`

### 4.3 `use-hivemind-git-memory` (P1)

**Purpose:** Entry router for git-based semantic memory

**Pattern:** P2 (Domain-specific entry)

**Routing Logic:**
```yaml
GIT MEMORY REQUEST:
├── retrieve --session-id → route to git-atomic-memory (retrieve mode)
├── encode --commit → route to git-atomic-memory (encode mode)
├── network --build → route to git-atomic-memory (network mode)
├── resume --from-git → route to use-hivemind-session-resume
└── intent --extract → route to git-atomic-memory (intent mode)
```

**Must Have:**
- [ ] Git command → knowledge type mapping (routing)
- [ ] Semantic network formation rules (reference)
- [ ] Commit → session linking protocol (reference)
- [ ] Intent encoding schema (reference)

**Target Location:** `.opencode/skills/use-hivemind-git-memory/SKILL.md`
**Implementation:** `.opencode/skills/git-atomic-memory/SKILL.md` (rename from current)

### 4.4 `use-hivemind-delegation` (P1)

**Purpose:** Entry router for handoff protocol and scope inheritance

**Pattern:** P1 (Entry routing)

**Routing Logic:**
```yaml
DELEGATION CONTEXT DETECTED:
├── incoming-handoff → process handoff packet
├── scope-declaration → set scope boundaries
├── result-contract → establish return format
├── parent-link → document parent-child relationship
└── chain-audit → record delegation for traceability
```

**Must Have:**
- [ ] Handoff detection protocol
- [ ] Scope inheritance routing
- [ ] Result contract template (reference)
- [ ] Chain audit format (reference)

**Target Location:** `.opencode/skills/use-hivemind-delegation/SKILL.md`

### 4.5 `use-hivemind-hierarchy` (P1)

**Purpose:** Entry router for role boundaries and authority

**Pattern:** P1 (Entry routing)

**Routing Logic:**
```yaml
HIERARCHY REQUEST:
├── role-boundary → route to agent-role-boundary
├── permission-envelope → route to permission design
├── authority-check → route to governance enforcement
└── agent-profile → route to profile management
```

**Must Have:**
- [ ] Role model routing
- [ ] Boundary enforcement routing
- [ ] Permission envelope design (reference)
- [ ] Agent profile routing

**Target Location:** `.opencode/skills/use-hivemind-hierarchy/SKILL.md`
**Migration:** Content from `agent-role-boundary` → rename + thin routing layer

### 4.6 `use-hivemind-session-resume` (P2)

**Purpose:** Entry router for session continuation and state retrieval

**Pattern:** P2 (Domain-specific entry)

**Routing Logic:**
```yaml
SESSION RESUME REQUEST:
├── resume --session-id → route to session state retrieval
├── resume --from-git → route to use-hivemind-git-memory
├── resume --from-anchor → route to anchor retrieval
└── resume --from-handoff → route to use-hivemind-delegation
```

**Must Have:**
- [ ] Session state retrieval routing
- [ ] Resume anchor determination (reference)
- [ ] Git anchor integration (reference to use-hivemind-git-memory)
- [ ] Handoff packet integration (reference to use-hivemind-delegation)

**Target Location:** `.opencode/skills/use-hivemind-session-resume/SKILL.md`

---

## Part 5: Registry Updates

### 5.1 New Registry Structure

```yaml
version: "1.0.0"
source_of_truth: true
local_first_resolution: true
external_opt_in: true

skills:
  # === Entry Skills (use-hivemind-* prefix) ===
  
  - name: use-hivemind-skill-writer
    domain: meta-builder
    bundle: meta-core
    knowledge_delta_score: 0.88
    status: active
    owner: hivemind-core
    disclosure_level: L1
    triggers:
      - "write a skill"
      - "create a new skill"
      - "skill design"
      - "skill authoring"
    supersedes: []
    depends_on: []
    
  - name: use-hivemind-context-integrity
    domain: context-governance
    bundle: governance-core
    knowledge_delta_score: 0.90
    status: active
    owner: hivemind-core
    disclosure_level: L0
    triggers:
      - "context drift"
      - "rot detected"
      - "pollution"
      - "session start"
    supersedes:
      - context-intelligence-entry
    depends_on: []
    
  - name: use-hivemind-context-verify
    domain: context-governance
    bundle: verification-core
    knowledge_delta_score: 0.85
    status: active
    owner: hivemind-core
    disclosure_level: L1
    triggers:
      - "verify context"
      - "truth check"
      - "validate state"
      - "completion claim"
    supersedes: []
    depends_on:
      - use-hivemind-context-integrity
      
  - name: use-hivemind-git-memory
    domain: memory-governance
    bundle: memory-core
    knowledge_delta_score: 0.82
    status: active
    owner: hivemind-core
    disclosure_level: L1
    triggers:
      - "git memory"
      - "commit intent"
      - "anchor"
      - "session resume from git"
    supersedes:
      - git-atomic-memory
    depends_on: []
    
  - name: use-hivemind-delegation
    domain: delegation-governance
    bundle: governance-core
    knowledge_delta_score: 0.88
    status: active
    owner: hivemind-core
    disclosure_level: L1
    triggers:
      - "delegate"
      - "handoff"
      - "subagent scope"
      - "parent context"
    supersedes:
      - delegation-framework
    depends_on:
      - use-hivemind-context-integrity
      
  - name: use-hivemind-hierarchy
    domain: agent-governance
    bundle: governance-core
    knowledge_delta_score: 0.87
    status: active
    owner: hivemind-core
    disclosure_level: L1
    triggers:
      - "role boundary"
      - "agent hierarchy"
      - "authority"
      - "permission envelope"
    supersedes:
      - agent-role-boundary
    depends_on: []
    
  - name: use-hivemind-session-resume
    domain: session-governance
    bundle: governance-core
    knowledge_delta_score: 0.80
    status: active
    owner: hivemind-core
    disclosure_level: L2
    triggers:
      - "resume session"
      - "continue from"
      - "session state"
      - "after clear"
    supersedes: []
    depends_on:
      - use-hivemind-git-memory
      - use-hivemind-delegation

  # === Implementation Skills (hivemind-*-write) ===
  
  - name: hivemind-skill-write
    domain: meta-builder
    bundle: meta-core
    knowledge_delta_score: 0.92
    status: active
    owner: hivemind-core
    disclosure_level: L2
    triggers:
      - "implement skill"
      - "write skill content"
    supersedes: []
    depends_on:
      - use-hivemind-skill-writer
      
  - name: hivemind-skill-doctor
    domain: meta-builder
    bundle: meta-core
    knowledge_delta_score: 0.91
    status: active
    owner: hivemind-core
    disclosure_level: L2
    triggers:
      - "audit skill"
      - "skill doctor"
      - "skill judge"
    supersedes: []
    depends_on:
      - use-hivemind-skill-writer

  # === Implementation Skills (context) ===
  
  - name: context-intelligence-entry
    domain: context-governance
    bundle: governance-core
    knowledge_delta_score: 0.93
    status: active
    owner: hivemind-core
    disclosure_level: L1
    triggers:
      - "rot check"
      - "session state"
      - "context health"
    supersedes: []
    depends_on:
      - use-hivemind-context-integrity
      
  - name: context-entry-verify
    domain: context-governance
    bundle: verification-core
    knowledge_delta_score: 0.89
    status: active
    owner: hivemind-core
    disclosure_level: L1
    triggers:
      - "verify gates"
      - "truth verification"
    supersedes: []
    depends_on:
      - use-hivemind-context-verify

  # === Implementation Skills (memory) ===
  
  - name: git-atomic-memory
    domain: memory-governance
    bundle: memory-core
    knowledge_delta_score: 0.85
    status: active
    owner: hivemind-core
    disclosure_level: L2
    triggers:
      - "git memory encode"
      - "semantic anchor"
      - "commit intent"
    supersedes: []
    depends_on:
      - use-hivemind-git-memory

  # === Archived Skills (deprecated) ===
  
  - name: delegation-framework
    domain: delegation-governance
    bundle: governance-core
    knowledge_delta_score: 0.89
    status: archived
    owner: hivemind-core
    supersedes: []
    
  - name: context-integrity
    domain: context-governance
    bundle: governance-core
    knowledge_delta_score: 0.90
    status: archived
    owner: hivemind-core
    supersedes: []
    
  - name: agent-role-boundary
    domain: agent-governance
    bundle: governance-core
    knowledge_delta_score: 0.88
    status: archived
    owner: hivemind-core
    supersedes: []
    
  - name: git-atomic-memory-legacy
    domain: memory-governance
    bundle: memory-core
    knowledge_delta_score: 0.82
    status: archived
    owner: hivemind-core
    supersedes: []
```

### 5.2 Registry Update Checklist

- [ ] Add all `use-hivemind-*` entry skills to registry
- [ ] Add all implementation skills (`hivemind-*-write`, `context-*`, `git-*`)
- [ ] Mark deprecated skills with `status: archived`
- [ ] Add `supersedes` relationships
- [ ] Add `depends_on` relationships
- [ ] Remove ghost references (`delegation-handoff`, `session-memory-resume` as uncreated)
- [ ] Set correct `disclosure_level` for each skill

---

## Part 6: Conflict Prevention Matrix

### 6.1 Skill Boundary Rules

| Rule | Description | Enforcement |
|------|-------------|-------------|
| **Entry Only** | `use-hivemind-*` skills ONLY route, never implement | SKILL.md routing section |
| **No Trigger Overlap** | Same trigger phrase routes to ONE skill only | Registry validation |
| **Max 5 Triggers** | Each skill has maximum 5 primary trigger phrases | Skill-Judge Trigger ≥3.0 |
| **Hierarchy Preserved** | P0 → P1 → P2 strict ordering | Entry level in skill |
| **No Duplicate Files** | Skill exists in ONE location (`.opencode/skills/`) | File audit |

### 6.2 Trigger Phrase Exclusivity

| Trigger | Skill | No Overlap With |
|---------|-------|-----------------|
| "context drift" | use-hivemind-context-integrity | context-intelligence-entry (implementation) |
| "write a skill" | use-hivemind-skill-writer | hivemind-skill-write (implementation) |
| "audit skill" | use-hivemind-skill-writer → routes to hivemind-skill-doctor | (proper routing) |
| "git memory" | use-hivemind-git-memory | git-atomic-memory (implementation) |
| "delegate" | use-hivemind-delegation | delegation-framework (deprecated) |
| "role boundary" | use-hivemind-hierarchy | agent-role-boundary (deprecated) |
| "resume session" | use-hivemind-session-resume | session-memory-resume (uncreated) |

### 6.3 Priority Resolution

When multiple skills could handle the same request:

```
PRIORITY ORDER:
1. use-hivemind-context-integrity (P0 mandatory - context health)
2. use-hivemind-skill-writer (meta-builder - skill authoring)
3. use-hivemind-delegation (hierarchy - handoff protocol)
4. use-hivemind-git-memory (memory - git anchors)
5. use-hivemind-session-resume (continuation - session state)
```

### 6.4 Location Rules

| Location | Purpose | Who Uses It |
|----------|---------|-------------|
| `.opencode/skills/` | Operational skills (loaded by OpenCode) | Primary runtime |
| `skills/` | Source of truth for registry | Build/pack time |
| `skills/_deprecated_hive/` | Archived skills (reference only) | Historical |
| `.codex/skills/` | Codex-specific (should not have HiveMind skills) | Cleanup target |

**Rule:** All HiveMind skills should exist in `.opencode/skills/` for runtime AND be registered in `skills/registry.yaml` for documentation/build.

---

## Part 7: Verification Criteria

### 7.1 Skill-Judge Thresholds

All skills must pass Skill-Judge validation with minimum scores:

| Skill | Trigger ≥3.0 | Action ≥4.0 | Ref ≥3.0 | Non-Red ≥3.0 | Edge ≥3.0 | Overall ≥3.5 |
|-------|-------------|-------------|---------|--------------|-----------|---------------|
| use-hivemind-skill-writer | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| use-hivemind-context-integrity | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| use-hivemind-context-verify | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| use-hivemind-git-memory | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| use-hivemind-delegation | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| use-hivemind-hierarchy | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| use-hivemind-session-resume | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| hivemind-skill-write | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| hivemind-skill-doctor | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

### 7.2 Non-Breaking Tests

- [ ] All existing GSD workflows unaffected
- [ ] No added ceremony to existing workflows
- [ ] Stack budget ≤3 for any operation
- [ ] All legacy triggers still route correctly
- [ ] No ghost references remain in any skill file
- [ ] Registry validates against actual file locations
- [ ] Deprecated skills marked but files preserved

### 7.3 Integration Tests

```bash
# Test 1: Entry skill routing
npx skill-judge use-hivemind-skill-writer --trigger "write a skill"
# Expected: Routes to hivemind-skill-write

# Test 2: Context health routing
npx skill-judge use-hivemind-context-integrity --trigger "context drift"
# Expected: Routes to context-intelligence-entry

# Test 3: Git memory routing
npx skill-judge use-hivemind-git-memory --trigger "git memory"
# Expected: Routes to git-atomic-memory

# Test 4: No duplicate triggers
npx skill-conflict-check --all
# Expected: No overlapping trigger phrases

# Test 5: Registry validation
npx registry-validate
# Expected: All skills in registry exist in .opencode/skills/
```

---

## Part 8: Implementation Batches

### Batch 1: Cleanup (P0)

**Actions:**
1. Archive deprecated skills in `_deprecated_hive/`
2. Remove duplicate files from `skills/` (keep `.opencode/skills/`)
3. Resolve `hivemind-skill-writer` conflict
4. Update registry to mark deprecated skills

**Verification:**
- No duplicate files
- Deprecated skills marked `status: archived`
- Registry reflects actual file structure

### Batch 2: Entry Skills Creation (P0)

**Skills to Create:**
1. `use-hivemind-context-integrity`
2. `use-hivemind-context-verify`

**TDD Cycle:**
1. RED: Document failing scenarios
2. GREEN: Write minimal routing skill
3. REFACTOR: Validate with Skill-Judge ≥3.5

### Batch 3: Memory/Delegation Skills (P1)

**Skills to Create/Rename:**
1. `use-hivemind-git-memory` (rename from git-atomic-memory)
2. `use-hivemind-delegation`

**TDD Cycle:**
1. RED: Document failing scenarios
2. GREEN: Write minimal routing skill
3. REFACTOR: Validate with Skill-Judge ≥3.5

### Batch 4: Hierarchy/Resume Skills (P2)

**Skills to Create/Rename:**
1. `use-hivemind-hierarchy` (rename from agent-role-boundary)
2. `use-hivemind-session-resume`

**TDD Cycle:**
1. RED: Document failing scenarios
2. GREEN: Write minimal routing skill
3. REFACTOR: Validate with Skill-Judge ≥3.5

### Batch 5: Registry Finalization (P0)

**Actions:**
1. Update `skills/registry.yaml` with all new skills
2. Add supersedes/depends_on relationships
3. Validate registry against file structure
4. Remove ghost references from documentation

---

## Part 9: Rollback Protocol

If any batch fails verification:

| Failed Batch | Rollback Action |
|--------------|-----------------|
| Batch 1 (Cleanup) | Restore archived files from `_deprecated_hive/` |
| Batch 2 (Entry P0) | Remove created skills, use existing implementation |
| Batch 3 (Memory P1) | Revert to `git-atomic-memory`, remove new entry |
| Batch 4 (Hierarchy P2) | Revert to `agent-role-boundary`, remove new entry |
| Batch 5 (Registry) | Restore previous registry.yaml |

---

## References

- `docs/plans/use-hivemind-ecosystem-refactor-plan-2026-03-20.md` — Broader ecosystem context
- `docs/plans/git-memory-delegation-skills-plan-2026-03-20.md` — Detailed design
- `.opencode/skills/use-hivemind-skill-writer/SKILL.md` — Entry router pattern
- `.opencode/skills/hivemind-skill-write/SKILL.md` — Implementation pattern
- `.opencode/skills/hivemind-skill-doctor/SKILL.md` — Audit pattern
- `skills/registry.yaml` — Current registry structure
- `AGENTS.md` — Framework governance

---

## Handoff Instructions

When delegating implementation:

1. **Include this plan document** as authoritative specification
2. **Specify batch number** (start with Batch 1: Cleanup)
3. **Enforce TDD cycle** — RED first, then GREEN, then REFACTOR
4. **Validate with Skill-Judge** before claiming completion
5. **Report format:**
   - Batch X.1: Cleanup actions completed
   - Batch X.2: Skills created/renamed
   - Batch X.3: Registry updated
   - Verification: Skill-Judge scores

---

**Status:** Ready for incremental batch execution

**Next Step:** User authorization to begin Batch 1 (Cleanup Phase)