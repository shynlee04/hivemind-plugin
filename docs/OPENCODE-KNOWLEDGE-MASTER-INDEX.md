---
description: "Master Index - OpenCode Knowledge Base Cross-Reference and Navigation Guide"
agent: hiveminder
source_repo: anomalyco/opencode
tags: ["opencode", "master-index", "navigation", "cross-reference", "knowledge-base"]
classification:
  domain: "opencode-knowledge"
  category: "master-index"
  subcategory: "navigation-guide"
  depth: "overview"
  cognitive_model: "reference"
fast_track:
  - "agent-taxonomy"
  - "session-lifecycle"
  - "permission-system"
  - "sdk-mechanisms"
  - "delegation-patterns"
  - "context-compaction"
  - "plugin-hooks"
  - "tool-registry"
synthesis_categories:
  - "architecture-concepts"
  - "implementation-patterns"
  - "reference-guides"
  - "navigation-aids"
related_docs: []
related_skills:
  - "context-integrity"
  - "session-lifecycle"
  - "delegation-intelligence"
  - "hivemind-governance"
  - "evidence-discipline"
created: "2026-02-28"
updated: "2026-02-28"
version: "1.0"
---

# OpenCode Knowledge Master Index

## Document Catalog

| # | Document | Purpose | Hub/Spoke | Reading Order |
|---|----------|---------|-----------|---------------|
| 1 | [OPENCODE-CONCEPTS-ADVANCED.md](OPENCODE-CONCEPTS-ADVANCED.md) | Foundation concepts & agent taxonomy | Hub | 1 |
| 2 | [opencode-full-sdk-mechanism.md](opencode-full-sdk-mechanism.md) | SDK internal mechanisms | Hub | 2 |
| 3 | [OPENCODE-DETERMINISTIC-CONTEX-AGENT-DELEGATION.md](OPENCODE-DETERMINISTIC-CONTEX-AGENT-DELEGATION.md) | Delegation patterns | Spoke | 3 |
| 4 | [OPENCODE-PRIMARY-COORDINATOR-AGENT.md](OPENCODE-PRIMARY-COORDINATOR-AGENT.md) | Coordinator patterns | Spoke | 3 |
| 5 | [opencode-sdk-QA-deepwiki.md](opencode-sdk-QA-deepwiki.md) | Q&A reference | Spoke | 4 |
| 6 | [OPENCODE-KNOWLEDGE-SYNTHESIS-MAP.md](OPENCODE-KNOWLEDGE-SYNTHESIS-MAP.md) | Synthesis map | Meta | - |
| 7 | [OPENCODE-ARCHITECTURE-NARRATIVE.md](OPENCODE-ARCHITECTURE-NARRATIVE.md) | Unified narrative | Meta | - |

## Relationship Matrix

### Document → Document Links

| From \ To | CONCEPTS | SDK-MECH | DELEGATION | COORD | SDK-QA | SYNTHESIS | NARRATIVE |
|-----------|----------|----------|------------|-------|--------|-----------|-----------|
| CONCEPTS | - | → | → | → | | → | → |
| SDK-MECH | ← | - | → | → | → | | |
| DELEGATION | ← | | - | | → | | |
| COORD | ← | | | - | | → | |
| SDK-QA | | ← | | | - | | |
| SYNTHESIS | ← | | | | | - | → |
| NARRATIVE | ← | | | | | | - |

### Fast Track Keyword Matrix

| Keyword | Primary Doc | Secondary Docs |
|---------|-------------|----------------|
| agent-taxonomy | CONCEPTS | SDK-MECH, NARRATIVE |
| session-lifecycle | CONCEPTS | SDK-MECH, DELEGATION, COORD |
| permission-system | CONCEPTS | SDK-MECH, NARRATIVE |
| sdk-mechanisms | SDK-MECH | CONCEPTS, SDK-QA |
| delegation-patterns | DELEGATION | CONCEPTS, COORD |
| context-compaction | SDK-MECH | CONCEPTS, SDK-QA |
| plugin-hooks | SDK-MECH | CONCEPTS, SDK-QA |
| tool-registry | CONCEPTS | SDK-MECH |

### Skill → Document Mapping

| Skill | Primary Document |
|-------|------------------|
| context-integrity | CONCEPTS, SDK-MECH |
| session-lifecycle | CONCEPTS, SDK-MECH |
| delegation-intelligence | DELEGATION, COORD |
| hivemind-governance | CONCEPTS, NARRATIVE |
| evidence-discipline | SYNTHESIS, NARRATIVE |

## Reading Paths

### Path 1: New to OpenCode (Foundation)
1. OPENCODE-CONCEPTS-ADVANCED.md (sections 1-4)
2. opencode-full-sdk-mechanism.md
3. OPENCODE-ARCHITECTURE-NARRATIVE.md

### Path 2: Building Custom Agents
1. OPENCODE-CONCEPTS-ADVANCED.md (sections 2, 7)
2. OPENCODE-PRIMARY-COORDINATOR-AGENT.md
3. OPENCODE-DETERMINISTIC-CONTEX-AGENT-DELEGATION.md

### Path 3: Implementing SDK Extensions
1. opencode-full-sdk-mechanism.md
2. opencode-sdk-QA-deepwiki.md
3. OPENCODE-DETERMINISTIC-CONTEX-AGENT-DELEGATION.md

### Path 4: Quick Reference
Use `fast_track` keywords in this document to jump directly to the relevant document section.

## Hub-and-Spoke Model

```
                    ┌─────────────────────┐
                    │   CONCEPTS-ADVANCED │
                    │   (Foundation Hub)  │
                    └──────────┬──────────┘
                               │
          ┌────────────────────┼────────────────────┐
          │                    │                    │
          ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  SDK-MECHANISM │  │   DELEGATION    │  │   COORDINATOR   │
│    (Impl Hub)   │  │    (Pattern)    │  │    (Pattern)    │
└────────┬────────┘  └────────┬────────┘  └────────┬────────┘
         │                    │                    │
         ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│     SDK-QA     │  │                 │  │                 │
│   (Reference)  │  │                 │  │                 │
└─────────────────┘  └─────────────────┘  └─────────────────┘

┌─────────────────────────────────────────────────────────┐
│              META DOCUMENTS (Navigation)                │
│   SYNTHESIS-MAP  ←→  ARCHITECTURE-NARRATIVE            │
└─────────────────────────────────────────────────────────┘
```

## Coverage Summary

| Topic | Document(s) | Coverage |
|-------|-------------|----------|
| Agent Taxonomy | CONCEPTS (L19-65), NARRATIVE | Full |
| Session Lifecycle | CONCEPTS (L429-486), SDK-MECH, DELEGATION | Full |
| Permission System | CONCEPTS (L146-190), SDK-MECH | Full |
| Tool Registry | CONCEPTS (L294-346), SDK-MECH | Full |
| Delegation Patterns | DELEGATION (Full), CONCEPTS | Full |
| SDK Hooks | SDK-MECH (L95-200), SDK-QA | Full |
| Context Compaction | CONCEPTS (L471-487), SDK-MECH | Full |
| Event System | SDK-MECH | Partial (code only) |
| Plugin Architecture | SDK-MECH, CONCEPTS | Full |

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-02-28 | Initial master index with 7 documents |
