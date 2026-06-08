---
name: hm-l3-research-chain
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
  consumed-by:
    - "hm-l2-researcher"
  lineage-scope: "hm-*"
  access: "STRICT"
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
Ingestion without caching is repetition.
```

# Research Chain
## The Canonical Chain

```
┌──────────┐     ┌─────────────┐     ┌──────────────┐     ┌───────────┐     ┌──────────┐
│  INGEST  │ ──→ │   DETECT    │ ──→ │   RESEARCH   │ ──→ │ SYNTHESIZE│ ──→ │ ARTIFACT │
│(hm-tech-  │     │(hm-detective)│     │(hm-deep-     │     │(hm-synthesis)│   │ (export) │
│ stack-ingest)│  │             │     │   research)  │     │           │     │          │
└──────────┘     └─────────────┘     └──────────────┘     └───────────┘     └──────────┘
```

### Stage 0: Ingest (hm-tech-stack-ingest)

**Purpose:** Cache third-party repositories, SDK docs, and API references BEFORE researching. This ensures all downstream stages validate against REAL code, not assumptions.

```bash
# Check if the target tech stack is already cached
ls references/tech-stacks/<name>/ && cat references/tech-stacks/<name>/metadata.json

# If missing or stale, run the ingestion pipeline
# hm-tech-stack-ingest handles: DETECT → DISCOVER → INGEST → ORGANIZE → INDEX
```

**Output:** Cached tech stack in `references/tech-stacks/<name>/` with TOC.md, metadata.json, api/, docs/, examples/

**Gate:** Cached assets must have valid `metadata.json` with `version`, `source_url`, and `ingest_date`. If the cached version differs from the installed version, re-ingestion must complete before research starts.

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

## Self-Correction

When the chain stalls, produces incomplete artifacts, or skips a required stage, use these correction modes:

### Mode 1: Missing Stage Artifact (a later stage was started without prior stage output)

```
Which stage artifact is missing?
├── Stage 0 (Ingest) output missing → no cache available
│   └── Run `ls references/tech-stacks/` + `cat index.json` to check cache state
├── Stage 1 (Detect) output missing → no .tech-registry.json
│   └── Trigger hm-detective SCAN (Tech Stack) + write .tech-registry.json
├── Stage 2 (Research) output missing → no structured findings
│   └── Trigger hm-deep-research with the original research question
├── Stage 3 (Synthesize) output missing → no compressed artifact
│   └── Trigger hm-synthesis with all prior stage outputs
└── Return BLOCKED with the specific missing gate — do NOT synthesize from partial state.
```

### Mode 2: Stale Cache (ingested assets are out of date)

```
1. Check hm-tech-stack-ingest staleness: compare installed version vs cached version
2. If stale → trigger re-ingestion before any research starts
3. If fresh → proceed with Stage 1
4. If uncertain → flag for hm-tech-stack-ingest verification
```

### Mode 3: Single-Source Research (only one tool used, findings are thin)

```
1. Check the MCP tool matrix: was the right tool used for the research question?
2. If only web search was used → add Context7 for API verification, DeepWiki for architecture
3. If only repomix was used → add Context7 for version-matched docs, Tavily for current info
4. If all tools exhausted → document as limitation, proceed with available evidence
```

### Mode 4: Ungated Chain (anti-pattern: jumping from detect directly to artifact)

```
Self-check:
└── Stage 0 (Ingest) was skipped? → STOP. Ingest before detecting.
└── Stage 1 (Detect) done but Stage 2 (Research) skipped? → STOP. Research before synthesizing.
└── Stage 2 (Research) done but Stage 3 (Synthesize) skipped? → STOP. Synthesize before exporting.
└── Producing an artifact without all prior stage outputs? → STOP. Document missing gates.
```

### Mode 5: Orphan Artifact (artifact created but no source traceability)

```
1. Check: does each claim in the artifact have a source citation?
2. Check: does the artifact have continuation metadata (chain_id, detect_artifact, research_artifact, synthesis_artifact)?
3. If sources are missing → re-run Stage 2 (Research) with traceability requirements
4. If continuation metadata is missing → re-run Stage 4 (Artifact + Continuation) with the full metadata template
```

### Maximum Correction Attempts

3 per chain execution. After 3 correction cycles without passing all gates:
- Document which gates passed and which failed
- Write a chain state report with continuation metadata
- Return BLOCKED with a specific gate failure — do NOT produce a partial artifact

## Reference Map

| File | When to Read |
|------|-------------|
| `references/chain-stages.md` | Detailed stage contracts and handoff formats |
| `references/tool-matrix.md` | Which MCP tool to use for which research question |
| `templates/chain-continuation.md` | Artifact lineage and continuation metadata |

## Cross-References

### Research Chain Position

```
hm-tech-stack-ingest → hm-detective → hm-deep-research → hm-synthesis
    (Stage 0)          (Stage 1)       (Stage 2)          (Stage 3)
         ↑ orchestrated by hm-research-chain (this skill)
                    ↓
              Stage 4: Artifact + Continuation
```

hm-research-chain is the **orchestrator** of the full 5-stage canonical research pipeline: Ingest (Stage 0) → Detect (Stage 1) → Research (Stage 2) → Synthesize (Stage 3) → Artifact + Continuation (Stage 4).

### Downstream Skills (This Skill Orchestrates)

| Related Skill | Boundary |
|---------------|----------|
| `hm-tech-stack-ingest` | Stage 0 — ingestion and caching. This skill triggers hm-tech-stack-ingest BEFORE detection to ensure all downstream stages validate against cached assets. |
| `hm-detective` | Stage 1 — detection and scanning. This skill triggers hm-detective as the first investigation stage. |
| `hm-deep-research` | Stage 2 — evidence gathering. This skill ensures research output includes source evaluation and contradiction handling before synthesis. |
| `hm-synthesis` | Stage 3 — compression and artifact export. This skill triggers hm-synthesis when all prior stage artifacts are ready. |

### Upstream Skills (Feeds Into This Skill)

| Related Skill | Boundary |
|---------------|----------|
| `hm-tech-stack-ingest` | Foundation — provides the cached assets that hm-research-chain validates before starting the research pipeline. Stale cache halts the chain at Stage 0. |

### Boundary Clarification

| Nearby Skill | What hm-research-chain Does | What the Other Skill Does |
|-------------|---------------------------|--------------------------|
| `hm-tech-stack-ingest` | Orchestrates Stage 0 ingestion timing — decides when to ingest before research starts | Downloads, caches, and organizes individual tech stacks as bundled assets |
| `hm-detective` | Calls hm-detective for Stage 1 codebase scanning after cache validation | Performs the actual SCAN/READ/DEEP investigation of the codebase |
| `hm-deep-research` | Calls hm-deep-research for Stage 2 evidence gathering after detection | Conducts version-matched research with MCP tools and citations |
| `hm-synthesis` | Calls hm-synthesis for Stage 3 artifact compression after research | Compresses findings into actionable artifacts with tiered reduction |
