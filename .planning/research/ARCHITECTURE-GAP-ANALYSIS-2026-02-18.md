# Architecture Gap Analysis: HiveMind v3.0

**Date:** 2026-02-18
**Status:** PENDING ONLINE RESEARCH
**Confidence:** NOT YET VALIDATED

---

## Executive Summary

Analysis of 3 planning documents (PRD, Roadmap, Master Plan) for HiveMind v3.0 identified **6 critical gaps** and **7 architectural claims** requiring industry validation before implementation can proceed with confidence.

---

## Documents Analyzed

| Document | File | Lines | Last Updated |
|----------|------|-------|--------------|
| PRD | `docs/plans/prd-hivemind-v3-relational-engine-2026-02-16.md` | 822 | 2026-02-16 |
| Roadmap | `docs/plans/prd-hivemind-v3-roadmap-2026-02-18.md` | 458 | 2026-02-18 |
| Master Plan | `docs/refactored-plan.md` | 352 | 2026-02-17 |

---

## Phase 1-6 Specifications Comparison

### Phase 1: Graph Schemas & Dumb Tool Diet

**Specifications (All 3 docs agree):**
- S1.1: Create `src/schemas/graph-nodes.ts` with 5 node types
- S1.2: All IDs are UUIDs via `z.string().uuid()`
- S1.3: TaskNode has `parent_phase_id` FK (required)
- S1.4: MemNode has `origin_task_id` FK (nullable)
- S1.5-S1.11: Create 7 lib files for extracted business logic

**Functional Requirements:**
- FR-1: All graph nodes MUST have UUID id field
- FR-4: Tools MUST be ≤100 lines with no business logic

**Gap:**
| ID | Issue | Evidence |
|----|-------|----------|
| GAP-3 | ≤100 lines rule violated | 5/6 tools exceed: 231, 368, 139, 204, 210 lines |

**Architectural Claim to Validate:**
| Claim | Source | Status |
|-------|--------|--------|
| Tools ≤100 lines = architecturally correct | PRD Line 85, Master Plan Line 16 | UNVERIFIED - No industry research cited |

---

### Phase 2: Cognitive Packer

**Specifications:**
- S2.1: Create `src/lib/cognitive-packer.ts`
- S2.2: `packCognitiveState()` returns XML string
- S2.3: NO LLM prompts, NO tool definitions
- S2.4: Time Machine filter (drop false_path/invalidated)
- S2.5: TTS filter (drop stale mems unless linked)
- S2.6: XML budget cap
- S2.7: Create `src/lib/graph-io.ts`

**Gap:**
| ID | Issue | Evidence |
|----|-------|----------|
| GAP-2 | XML budget conflict | PRD/Roadmap: 2000 chars. Master Plan: 15360 chars (12% context) |

**Architectural Claims to Validate:**
| Claim | Source | Status |
|-------|--------|--------|
| XML format for context injection | PRD Line 181 | UNVERIFIED - Do others use XML? |
| 2000 chars budget | PRD Line 182 | UNVERIFIED - Why 2000? |
| 12% context window | Master Plan Line 138 | UNVERIFIED - Why 12%? |
| <10ms runtime target | PRD Line 425 | UNVERIFIED - Why 10ms? |

---

### Phase 3: SDK Hook Injection

**Specifications:**
- S3.1: Wire packer to `messages-transform.ts`
- S3.2: Inject as `synthetic: true` part at START
- S3.3: Pre-Stop Gate checklist from trajectory.json
- S3.4: Refactor session-lifecycle to ≤200 lines

**Gap:**
| ID | Issue | Evidence |
|----|-------|----------|
| GAP-4 | SDK APIs unverified | `synthetic: true`, `messages.transform` not confirmed in OpenCode SDK docs |

**Architectural Claims to Validate:**
| Claim | Source | Status |
|-------|--------|--------|
| `messages.transform` hook exists | Master Plan Line 26 | UNVERIFIED - Check OpenCode SDK |
| `synthetic: true` parts API | PRD Line 210 | UNVERIFIED - Check OpenCode SDK |
| `session.compacting` hook | Master Plan Line 26 | UNVERIFIED - Check OpenCode SDK |

---

### Phase 4: Graph Migration & Session Swarms

**Specifications:**
- S4.1: Create `src/lib/graph-migrate.ts`
- S4.2: Dual-read backward compat
- S4.3: 80% session splitter
- S4.4: Headless researcher swarms with `noReply: true`
- S4.5: Call `client.session.create()`

**Gaps:**
| ID | Issue | Evidence |
|----|-------|----------|
| GAP-1 | 80% splitter WRONG | User corrected: 80% is defensive, not split trigger |
| GAP-4 | SDK APIs unverified | `client.session.create()`, `noReply: true` not confirmed |

**Architectural Claims to Validate:**
| Claim | Source | Status |
|-------|--------|--------|
| `client.session.create()` API | PRD Line 272 | UNVERIFIED - Check OpenCode SDK |
| `noReply: true` option | PRD Line 282 | UNVERIFIED - Check OpenCode SDK |
| Actor Model for sessions | Master Plan Line 39 | UNVERIFIED - Do others use Actor Model? |

---

### Phase 5: Tool Consolidation

**Specifications:**
- S5.1: Register 6 tools in index.ts
- S5.2: Delete old tool files
- S5.3: All tools ≤100 lines

**Gap:**
| ID | Issue | Evidence |
|----|-------|----------|
| GAP-3 | 5/6 tools violate ≤100 lines | See Phase 1 |

---

### Phase 6: Testing

**Specifications:**
- S6.1: All tests pass
- S6.2-S6.6: Create test files

**Non-Functional Requirements:**
| NFR | Target | Status |
|-----|--------|--------|
| Performance | <10ms packer runtime | UNVERIFIED - Why 10ms? |
| Memory | <1MB per graph file | UNVERIFIED - Why 1MB? |
| Coverage | ≥90% on new files | UNVERIFIED - Why 90%? |

---

## Summary: Gaps Requiring Research

| Gap ID | Phase | Issue | Severity | Research Needed |
|--------|-------|-------|----------|-----------------|
| GAP-1 | 4 | 80% splitter logic wrong | CRITICAL | Context splitting patterns in industry |
| GAP-2 | 2 | XML budget conflict (2000 vs 15360) | HIGH | Context budget best practices |
| GAP-3 | 1, 5 | ≤100 lines rule violated + unverified | HIGH | Tool architecture patterns |
| GAP-4 | 3, 4 | SDK APIs unverified | HIGH | OpenCode SDK documentation |
| GAP-5 | 2, 6 | Performance targets arbitrary | MEDIUM | Performance benchmarking standards |
| GAP-6 | All | Edge cases not handled | MEDIUM | Token dump, context whiplash patterns |

---

## Summary: Architectural Claims Requiring Validation

| # | Claim | Category | Research Target |
|---|-------|----------|-----------------|
| 1 | Tools ≤100 lines | Code Organization | Claude Code, Cursor, Aider tool file sizes |
| 2 | CQRS (Tools=Write, Hooks=Read) | Architecture | How do others separate read/write? |
| 3 | UUID FKs for graph structure | Data Model | How do others handle context graph? |
| 4 | XML for context injection | Format | JSON vs XML vs other for context |
| 5 | 80% token threshold | Session Management | What thresholds do others use? |
| 6 | `client.session.create()` + `noReply: true` | SDK API | OpenCode SDK documentation |
| 7 | `messages.transform` + `synthetic: true` | SDK API | OpenCode SDK hooks documentation |
| 8 | Actor Model for sessions | Architecture | How do others isolate sessions? |
| 9 | Headless swarm agents | Concurrency | Claude Code Task, Cursor background agents |
| 10 | <10ms, <1MB, ≥90% targets | Performance | Industry benchmarks |

---

## Next Steps

1. **Research Online** (Not codebase):
   - Context7 for OpenCode SDK
   - Web search for Claude Code, Cursor, Windsurf, Aider architectures
   - Official documentation for each platform

2. **Update PRD** with validated findings

3. **Create GSD Plan** with evidence-backed requirements only

4. **OpenTUI Test Scenarios** for validated features

---

*Generated: 2026-02-18*
*Status: Awaiting online research validation*
