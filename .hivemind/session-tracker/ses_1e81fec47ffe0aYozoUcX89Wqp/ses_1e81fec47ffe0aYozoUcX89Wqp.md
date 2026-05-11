---
sessionID: ses_1e81fec47ffe0aYozoUcX89Wqp
created: 2026-05-11T16:30:21.648Z
updated: 2026-05-11T16:30:21.648Z
parentSessionID: null
delegationDepth: 0
children: []
continuityIndex: session-continuity.json
status: active
---

## USER (turn 1)

You are the subagent hm-l1-coordinator. You are receiving a coordinated-path research delegation from hm-l0-orchestrator.

## DELEGATION CONTEXT

The user needs deep research into OpenCode's runtime architecture — specifically how OpenCode manages context across turns, sessions, compactions, and multi-agent operations. The end goal is to inform building a **context continuity and dynamic pruning system** for the Hivemind harness that:
- Economically saves token consumption
- Provides high-level context views with stems, branches, and jump links to on-disk artifacts
- Maintains fluid human-agent conversation across multiple sessions
- Ensures front-facing agents only consume context when needed for delegation downstream
- Uses on-disk session tracking (like the existing `session-tracker`)

## RESEARCH SCOPE (WHAT TO INVESTIGATE — NOT how to implement)

Research the following from **live online sources** (do NOT make assumptions):

### 1. OpenCode SDK & Architecture
- Source: https://opencode.ai/ and its /docs/* sections
- Crawl/scrape documentation for: SDK API, client-server architecture, plugin system, tool registration, hook system
- How the runtime composes context for each LLM turn

### 2. Session & Context Management
- How OpenCode handles sessions — session lifecycle, session IDs, how context is preserved across turns
- What happens during context compaction — what gets pruned vs preserved
- How system instructions are layered (CLAUDE.md, AGENTS.md, rules, skills)
- How context appears to the LLM after multi-turn agentic operations (tools called, delegations made, outputs received)

### 3. Agent Profiles & Primitives
- How agent definitions (frontmatter: temperature, tools, permissions) affect runtime context
- How skills are loaded/injected into context at runtime
- How slash commands inject context
- How delegation (subagent dispatch) affects the parent agent's context window

### 4. Context Pruning & Interception
- Any built-in mechanisms for context pruning, summarization, or compaction
- How OpenCode decides what context to keep vs discard between turns
- Whether there are hooks/APIs for custom context interception or filtering
- How tool outputs (especially large ones) are managed in the context window

### 5. Ecosystem & Related Implementations
- Find open-source repos that implement context management, session continuity, or dynamic pruning for OpenCode or similar agent frameworks
- Look for patterns in how others have solved the "long-haul session" problem
- Check OpenCode's GitHub (anomalyco/opencode) for relevant issues, discussions, or extensions

## PROCESS (HOW TO APPROACH)

**Wave 1 — Scrape & Gather:** Dispatch hm-l2-researcher subagent(s) to crawl/scrape OpenCode docs, GitHub repos, and ecosystem references. Use web fetching and search tools. Capture raw evidence.

**Wave 2 — Analyze & Map:** After Wave 1 returns, dispatch hm-l2-analyst or hm-l2-context-mapper to analyze findings — map architecture patterns, identify APIs, detect context-handling mechanisms.

**Wave 3 — Synthesize:** Dispatch hm-l2-synthesizer to compress findings into a structured research report.

## EXPECTED OUTPUT (WHAT TO RETURN TO L0)

A structured research report containing:

1. **OpenCode Context Architecture** — how context is built, layered, and managed per turn
2. **Session Lifecycle Map** — from session start through compaction to disconnect, what happens to context at each stage  
3. **Context Window Composition** — what the LLM actually "sees" at each turn (system prompt + skills + messages + tool outputs)
4. **Pruning & Compaction Mechanisms** — all built-in and programmable ways OpenCode manages context size
5. **API/Hook Surface for Context Interception** — what APIs exist for custom context filtering/pruning
6. **Ecosystem Patterns** — what repos/implementations exist that are relevant
7. **Actionable Recommendations** — what patterns/APIs from OpenCode can be leveraged for the Hivemind context continuity system

Each section must have:
- Evidence citations (URLs, doc sections, code references)
- Confidence level (HIGH/MEDIUM/LOW)
- Gaps noted where documentation is incomplete

## CONSTRAINTS & BOUNDARIES

- **Use live sources only.** Validate against opencode.ai/docs, GitHub anomalyco/opencode, and real ecosystem repos. Do NOT rely on training data assumptions.
- **Use web search, web fetch, and crawl tools** to access documentation. Use Context7, Deepwiki, or Tavily as needed.
- **Max 2 parallel delegations at once.**
- **Do NOT implement anything.** This is research-only.
- **Report gaps honestly** — if certain information isn't documented, say so.
- **Write findings to disk** at `.hivemind/research/opencode-context-architecture-2026-05-11/` for session continuity.

## SUCCESS METRICS

- [ ] All 7 report sections are populated with live evidence
- [ ] At least 5 distinct sources cited (docs pages, GitHub files, ecosystem repos)
- [ ] Confidence levels assigned to every claim
- [ ] Gaps explicitly documented
- [ ] Actionable patterns identified for Hivemind context continuity system
- [ ] Research artifacts committed to disk

## DELEGATION METADATA
- Path type: coordinated
- Scope: Research-only (no implementation)
- Output format: Structured research report (.md)
- Gate expectations: hm-l2-reviewer quality check on return
- Session: Current session — child delegations tracked via session-tracker

Report back to hm-l0-orchestrator with consolidated findings when complete.

### Tool: skill

**Input:**
```json
{
  "name": "hm-l2-coordinating-loop"
}
```

**Output:** (pruned)
```
# Skill: hm-l2-coordinating-loop
```


### Tool: skill

**Input:**
```json
{
  "name": "hm-l3-subagent-delegation-patterns"
}
```

**Output:** (pruned)
```
# Skill: hm-l3-subagent-delegation-patterns
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_02_u4D72y2nydSgaOiGwgEI1733"
}
```


### Tool: write

**Input:**
```json
{
  "callID": "call_00_c5aEulenyWT1PIElI70b1759"
}
```


### Tool: task

**Input:**
```json
{
  "description": "Research OpenCode docs & SDK",
  "subagent_type": "hm-l2-researcher",
  "task_id": "ses_1e81e05bcffeapmHqdn80AwdLG"
}
```

**Output:** (pruned)
```
task_id: ses_1e81e05bcffeapmHqdn80AwdLG
```


### Tool: task

**Input:**
```json
{
  "description": "Research ecosystem context patterns",
  "subagent_type": "hm-l2-researcher",
  "task_id": "ses_1e81d7883ffeJNhJKH5epcwqUm"
}
```

**Output:** (pruned)
```
task_id: ses_1e81d7883ffeJNhJKH5epcwqUm
```

