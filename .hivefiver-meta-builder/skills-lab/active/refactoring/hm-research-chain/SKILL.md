---
name: hm-research-chain
description: >
  Orchestrate the canonical research chain: detect → research → synthesize → artifact.
  Use when starting a research task, chaining investigation skills, producing a final artifact
  from multiple sources, when the user needs comprehensive analysis, or when research needs
  to be structured and repeatable. Even when the user says "look into this" or "find out about."
  Triggers: "research", "investigate", "analysis", "deep dive", "comprehensive research",
  "research chain", "multi-source", "synthesize findings".
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

# Research Chain

## The Iron Law

```
Research without synthesis is hoarding. Synthesis without evidence is hallucination.
```

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

### Stage 2: Research (hm-deep-research)

**Purpose:** Gather evidence using version-matched documentation and MCP tools.

```bash
# Context7 for API verification
# Tavily for current information
# Repomix for codebase structure
```

**Output:** Structured findings with citations

### Stage 3: Synthesize (hm-synthesis)

**Purpose:** Compress findings into actionable artifacts.

```bash
# Compression tiers: Snapshot → Focused → Signature
# Artifact export: markdown, JSON, or plan files
```

**Output:** Final artifact (report, plan, or specification)

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

## Reference Map

| File | When to Read |
|------|-------------|
| `references/chain-stages.md` | Detailed stage contracts and handoff formats |
| `references/tool-matrix.md` | Which MCP tool to use for which research question |

## Cross-References

| Related Skill | Boundary |
|---------------|----------|
| `hm-detective` | Stage 1 — detection and scanning. This skill orchestrates the full chain. |
| `hm-deep-research` | Stage 2 — evidence gathering. This skill ensures it feeds into synthesis. |
| `hm-synthesis` | Stage 3 — compression and artifact export. This skill triggers it at the right time. |
