# HIVEMIND-RESEARCH SKILL

## Overview

Flat skill package enabling comprehensive research capabilities through stacked sub-skills, deterministic execution protocols, and MCP server optimization.

---

## Sub-Skills Stack

### 1. HIVEMIND-RESEARCH-FRAMEWORK

Reference path: `/Users/apple/hivemind-plugin/.worktrees/product-detox/.developing-skills/refactored-skills/research-methodology`

#### Purpose
Systematic research methodology for categorizing, investigating, and synthesizing knowledge across tech stacks, APIs, SDKs, and requirements.

#### Research Categories

| Category | Use Case | Framework Approach |
|----------|----------|-------------------|
| Comparative Research | Stack comparison, tool evaluation | Side-by-side analysis with weighted criteria |
| Market Research | Landscape analysis, trend identification | Multi-source triangulation with temporal mapping |
| Best-in-Class Research | Industry standards, proven patterns | Pattern extraction and adoption pathway |
| Pattern Research | Architectural decisions, anti-patterns | Cross-reference synthesis from multiple sources |
| Technical Deep-Dive | API internals, SDK architecture | Iterative investigation with documentation correlation |
| Requirements Synthesis | Spec-driven development | Question formulation from technical specifications |

#### Framework Architecture

```
RESEARCH WORKFLOW
├── Phase 1: Question Formation
│   ├── Derive from technical specifications
│   ├── Break into atomic research queries
│   └── Sequence based on dependency hierarchy
├── Phase 2: Source Identification
│   ├── Match query type to appropriate MCP tool
│   ├── Identify fallback sources
│   └── Validate source accessibility
├── Phase 3: Investigation
│   ├── Pull → Ingest → Investigate → Synthesize → Iterate
│   ├── Cross-reference findings
│   └── Validate against primary sources
├── Phase 4: Synthesis
│   ├── Consolidate evidence-based findings
│   ├── Flag contradictions for resolution
│   └── Structure for knowledge-base indexing
└── Phase 5: Verification
    ├── Hard-proof evidence requirements
    ├── Cross-validation of claims
    └── Confidence scoring
```

#### Delegation Protocol Integration

Reference paths:
- `/Users/apple/hivemind-plugin/.worktrees/product-detox/.developing-skills/refactored-skills/hivemind-delegation-protocol`
- `/Users/apple/hivemind-plugin/.worktrees/product-detox/.developing-skills/refactored-skills/spec-distillation`
- `/Users/apple/hivemind-plugin/.worktrees/product-detox/.developing-skills/refactored-skills/context-intelligence-entry`
- `/Users/apple/hivemind-plugin/.worktrees/product-detox/.developing-skills/refactored-skills/context-entry-verify`

Delegation patterns:
- Sequential agent execution (never parallel for research tasks)
- Iterative refinement between delegator and delegate
- Verification gates before synthesis advancement

---

### 2. HIVEMIND-RESEARCH-TOOLS

Reference path: Flattened from skill bundles for MCP and online tools.

#### A. MCP Server Configuration

**Documentation:** https://opencode.ai/docs/mcp-servers/

**Configuration Scopes:**
- Global: `opencode.json`
- Project: `.opencode/config.json`

**Configuration Syntax:**
```json
{
  "mcpServers": {
    "server_name": {
      "enabled": true|false,
      "command": "server_command",
      "args": ["arg1", "arg2"],
      "env": {
        "VARIABLE": "value"
      }
    }
  }
}
```

##### Active MCP Servers

| Server | Purpose | Configuration |
|--------|---------|---------------|
| Tavily | Semantic search | Remote: `https://mcp.tavily.com/mcp/?tavilyApiKey={key}` |
| Repomix | In-depth code analysis | Standard configuration |
| Context7 | Official documentation | Standard configuration |
| Deepwiki | Single-stack synthesis | Requires public GitHub repo link |

##### Disabled Servers
- `z-reader`
- `web-reader`
- `web-prime-search`

#### B. MCP Tool Protocols

##### Context7 (Official Documentation)
- **Best For:** Official documentation, SDK guides, API references
- **Constraints:** Connection timeouts, request denials possible
- **Protocol:**
  1. Aggressive retry logic (3 attempts)
  2. Delay sequence: 3s → 5s → 10s
  3. Do not use for advanced cross-dependency synthesis

##### Deepwiki (Single Stack Synthesis)
- **Best For:** Shallow synthesis of single technology stacks
- **Prerequisites:** Valid, public GitHub repository link required
- **Strict Execution Sequence:**
  1. Input: Valid GitHub repo URL
  2. Query: Specific question
- **Prohibited:** Multi-stack questions (causes hallucination)
- **Behavior:** Must be iterative (multi-turn); never one-shot

##### Repomix (In-depth & Cross-dependency)
- **Best For:** Primary tool for in-depth analysis and cross-dependency synthesis
- **Protocol:**
  1. Use `find-skill` to locate necessary skills
  2. Combine: search + agentic reading (grep, glob, list, regex, hop-reading, cross-traversal-reading)
- **Fallback:** If connection fails, download dependency to local project storage (exclude from commits) and execute local ingest-investigate-synthesize cycle

#### C. OpenCode Innate Tools

**Documentation:**
- https://opencode.ai/docs/tools/
- https://opencode.ai/docs/agents/
- https://opencode.ai/docs/commands/
- https://opencode.ai/docs/permissions/

##### Webfetch
- Retrieve web content programmatically
- Use for: Documentation pages, blog posts, non-searchable content

##### Websearch
- Web search functionality
- Use for: General queries, current information, non-documentation sources

##### Agent Types
- `explore` - Investigation and discovery
- `general` - Broad task handling
- `build` - Implementation tasks
- `plan` - Planning and architecture
- `summary` - Consolidation and reporting

##### Tool Categories (Often Underutilized)
- LSP: `search`, `search_code`
- Patch: Instead of `edit`/`write`, use `patch` for precision
- GitHub operations
- Offset reading for large files
- Regex searching
- Batch write operations

##### Shell Integration
Reference: `/product-detox/docs/prompts/how-to-write-audit-skill/opencode-knowledge/non-interactive-shell.md`
- Chain bash commands for automation
- Schema validation via deterministic scripts
- Export/extract with hierarchy support

#### D. Fallback Hierarchy & Rate Limiting

```
FALLBACK SEQUENCE
When MCP tool fails:
1. Retry up to 3 times
2. Delay sequence: 3s → 5s → 10s
3. Route to fallback tool
4. If all fail: Use OpenCode innate tools (webfetch, websearch)

SPECIFIC FALLBACKS:
- Context7 fails → Deepwiki (if single-stack) or websearch
- Deepwiki fails → Context7 or websearch
- Repomix fails → Local download + local analysis
- All fail → OpenCode innate tools with manual synthesis
```

#### E. MCP Setup Templates

##### Tavily Setup
```json
{
  "mcpServers": {
    "tavily": {
      "enabled": true,
      "remoteServer": "https://mcp.tavily.com/mcp/?tavilyApiKey=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"
    }
  }
}
```

##### Repomix Setup
```json
{
  "mcpServers": {
    "repomix": {
      "enabled": true,
      "command": "npx",
      "args": ["-y", "repomix"]
    }
  }
}
```

##### Context7 Setup
```json
{
  "mcpServers": {
    "context7": {
      "enabled": true,
      "command": "npx",
      "args": ["-y", "@context7/mcp-server"]
    }
  }
}
```

##### Deepwiki Setup
```json
{
  "mcpServers": {
    "deepwiki": {
      "enabled": true,
      "command": "npx",
      "args": ["-y", "@deepwiki/mcp-server"]
    }
  }
}
```

---

## Deterministic Execution Framework

### Research Execution Protocol

```
1. WORKFLOW STRUCTURE: Strictly sequential (Never parallel)
2. ITERATION CYCLE: Pull → Ingest → Investigate → Synthesize → Iterate
3. FAILURE ROUTING: Immediate route to fallback on timeout/connection failure
4. SUCCESS METRICS: Hard-proof evidence required for all synthesis outputs
5. VERIFICATION GATE: Validate before synthesis advancement
```

### Agent Collaboration Model

```
MAIN CONTROLLER
├── Orchestrates research workflow
├── Validates findings at each phase
├── Manages delegation to sub-agents
└── Synthesizes final output

SUB-AGENTS
├── Execute investigation tasks
├── Report findings with evidence
├── Flag contradictions
└── Request clarification when needed
```

---

## Knowledge-Base Structure

### File Hierarchy

```
RESEARCH OUTPUT STRUCTURE
├── Tier 1 (Governance)
│   ├── Architecture decisions
│   ├── PRD documents
│   └── Standards (no daily date stamps)
├── Tier 2 (Research Outputs)
│   ├── API documentation
│   ├── SDK patterns
│   ├── Requirements specifications
│   └── Pattern catalogs
└── Tier 3 (Working Documents)
    └── Daily/temporary artifacts (date-stamped, low hierarchy)
```

### YAML Frontmatter Attributes

```yaml
---
title: Research Document Title
type: api-docs | sdk-reference | pattern | requirements
parent: parent-document-id
created: YYYY-MM-DD
updated: YYYY-MM-DD
version: semantic-version
status: draft | review | approved | deprecated
tags: [tag1, tag2, tag3]
relationships:
  - type: relates-to
    target: document-id
  - type: extends
    target: parent-id
---
```

### Indexing Requirements

- Hierarchical structure with clear parent-child relationships
- In-document TOC with in-link jumps
- Cross-reference capabilities
- Temporal tracking via YAML frontmatter updates
- Searchable metadata via frontmatter attributes

---

## Execution Constraints

### Prohibited Actions

1. Using non-existent tools (e.g., `google_search` does not exist)
2. Querying Deepwiki without valid public GitHub repository link
3. Multi-stack questions to Deepwiki
4. One-shot Deepwiki queries (must be iterative)
5. Parallel execution of research tasks
6. Synthesis without evidence

### Required Actions

1. Validate tool availability before use
2. Implement retry logic with specified delay sequence
3. Provide hard-proof evidence for all claims
4. Update YAML frontmatter on all research outputs
5. Exclude temporary files from version control

---

## Configuration Summary

### Immediate Actions Required

1. Replace Tavily with new API key or remote server configuration
2. Disable: `z-reader`, `web-reader`, `web-prime-search`
3. Enable: `repomix`, `context7`, `deepwiki`
4. Verify OpenCode innate tools availability

### Post-Configuration Notification

After configuration completion, user must restart session to apply changes.

---

## Skill Dependencies

| Dependency | Purpose | Priority |
|------------|---------|----------|
| hivemind-delegation-protocol | Agent orchestration | Critical |
| spec-distillation | Requirements formation | Critical |
| context-intelligence-entry | Prior knowledge integration | High |
| context-entry-verify | Verification gates | High |

---

## Usage Protocol

```
INITIATING RESEARCH:
1. Identify research category from framework
2. Formulate atomic questions
3. Select appropriate MCP tool based on protocol
4. Execute with deterministic workflow
5. Verify findings at each phase
6. Synthesize with evidence requirements
7. Index with proper YAML frontmatter

TOOL SELECTION MATRIX:
| Query Type | Primary Tool | Fallback 1 | Fallback 2 |
|------------|--------------|------------|------------|
| Official docs | Context7 | Deepwiki | webfetch |
| Single stack | Deepwiki | Context7 | websearch |
| Code analysis | Repomix | local download | websearch |
| General web | websearch | webfetch | - |
```