---
name: hm-research-chain
description: >
  Orchestrate the canonical research chain: ingest → detect → research → synthesize → artifact.
  Use when starting a research task, chaining investigation skills, producing a final artifact
  from multiple sources, when the user needs comprehensive analysis, or when research needs
  to be structured and repeatable. Even when the user says "look into this" or "find out about."
  Triggers: "research", "investigate", "analysis", "deep dive", "comprehensive research",
  "research chain", "multi-source", "synthesize findings".
  Sibling skills: use with "hm-detective" for codebase detection, "hm-deep-research" for evidence
  gathering, "hm-synthesis" for compression, "hm-tech-stack-ingest" for dependency caching.
  NOT for single-source lookups or quick fact-checking.
metadata:
  layer: "1"
  role: "orchestrator"
  pattern: P1
  version: "1.0.0"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - Task
---

## Overview

Orchestrate the canonical research pipeline: detect → research → synthesize → artifact. Use when starting research tasks, chaining investigation skills, producing final artifacts from multiple sources, or when research needs to be structured and repeatable. Produces synthesized research outputs with citation tracking and evidence persistence.

## The Iron Law

```
Research without synthesis is hoarding. Synthesis without evidence is hallucination.
```

# Research Chain
## The Canonical Chain

```
┌─────────────┐     ┌──────────────┐     ┌───────────┐     ┌──────────┐
│  DETECT     │ ──→ │   RESEARCH   │ ──→ │ SYNTHESIZE│ ──→ │ ARTIFACT │
│(hm-detective)│     │(hm-deep-research)│  │(hm-synthesis)│   │ (export) │
└─────────────┘     └──────────────┘     └───────────┘     └──────────┘
```

### Stage 1: Detect (hm-detective)

**Purpose:** Understand what you are looking at before researching.

```bash
# SCAN mode — tech stack detection
# READ mode — targeted file reads
# DEEP mode — comprehensive codebase scan
```

**Output:** `.tech-registry.json` + initial findings

**Gate:** detection output must name scope, search modes used, and any missing/inaccessible areas before research starts.

### Stage 2: Research (hm-deep-research)

**Purpose:** Gather evidence using version-matched documentation and MCP tools.

```bash
# Context7 for API verification
# Tavily for current information
# Repomix for codebase structure
```

**Output:** Structured findings with citations

**Gate:** research output must include source evaluation, contradiction status, and blocked-source notes before synthesis starts.

### Stage 3: Synthesize (hm-synthesis)

**Purpose:** Compress findings into actionable artifacts.

```bash
# Compression tiers: Snapshot → Focused → Signature
# Artifact export: markdown, JSON, or plan files
```

**Output:** Final artifact (report, plan, or specification)

**Gate:** synthesis output must include methodology/limitations and link each recommendation to evidence.

### Stage 4: Artifact + Continuation

**Purpose:** Persist lineage so a later agent can resume without rediscovering the chain.

**Required artifact metadata:**

```yaml
research_chain_id: YYYY-MM-DD-topic-slug
detect_artifact: path-or-summary
research_artifact: path-or-summary
synthesis_artifact: path-or-summary
sources_reviewed: []
blocked_sources: []
contradictions: resolved | unresolved | none
next_action: verify | implement | ask | block
```

**Stop rule:** If a required stage artifact is missing, return `BLOCKED` with the missing gate. Do not synthesize or mark complete from partial chain state.

## When to Use the Full Chain

| Situation | Use Chain? |
|-----------|-----------|
| Exploring an unfamiliar codebase | Yes — full chain |
| Verifying a single API signature | No — Context7 only |
| Writing a project specification | Yes — full chain |
| Quick bug investigation | Partial — detect + research, skip synthesis |
| Producing a migration plan | Yes — full chain |

## Anti-Patterns

| Anti-Pattern | Detection | Correction |
|-------------|-----------|------------|
| **The Skipped Detect** | Jumps straight to research without scanning | Always run hm-detective SCAN first |
| **The Hoarder** | Gathers 50 sources but never synthesizes | Cap research time, force synthesis stage |
| **The Single-Source** | Uses only one tool (e.g., only web search) | Use the full MCP matrix |
| **The Orphan Artifact** | Produces artifact but never links to source evidence | Every claim in artifact must cite source |
| **The Ungated Chain** | Starts a later stage while prior stage output is missing | Stop and create the missing stage artifact first |

## Reference Map

| File | When to Read |
|------|-------------|
| `references/chain-stages.md` | Detailed stage contracts and handoff formats |
| `references/tool-matrix.md` | Which MCP tool to use for which research question |
| `templates/chain-continuation.md` | Artifact lineage and continuation metadata |

## Cross-References

### Downstream Skills (This Skill Orchestrates)

| Related Skill | Boundary |
|---------------|----------|
| `hm-detective` | Stage 1 — detection and scanning. This skill triggers hm-detective as the first chain stage. |
| `hm-deep-research` | Stage 2 — evidence gathering. This skill ensures it feeds into synthesis. |
| `hm-synthesis` | Stage 3 — compression and artifact export. This skill triggers it at the right time. |

### Upstream Skills (Feeds Into This Skill)

| Related Skill | Boundary |
|---------------|----------|
| `hm-tech-stack-ingest` | Foundation — cached API signatures and repo references. Ingest before researching to validate against real code, not assumptions. |

### Boundary Clarification

| Nearby Skill | What hm-research-chain Does | What the Other Skill Does |
|-------------|---------------------------|--------------------------|
| `hm-tech-stack-ingest` | Orchestrates the full research pipeline end-to-end | Ingests and caches individual tech stacks as bundled assets |
| `hm-detective` | Calls hm-detective for Stage 1 codebase scanning | Performs the actual SCAN/READ/DEEP investigation of the codebase |
| `hm-deep-research` | Calls hm-deep-research for Stage 2 evidence gathering | Conducts version-matched research with MCP tools and citations |
| `hm-synthesis` | Calls hm-synthesis for Stage 3 artifact compression | Compresses findings into actionable artifacts with tiered reduction |
