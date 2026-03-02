---
title: "Context Engineering Guardrails"
description: "LLM runtime awareness — context budget, rot detection, escalation protocol, evidence-before-claims, SOT validation"
tags: ["context", "guardrails", "rot-detection", "escalation", "evidence", "compaction", "anthropic"]
last_synced: "2026-03-02"
---

# Context Engineering Guardrails — Practical LLM Runtime Awareness

> **STATUS**: FILLED — synthesized from Anthropic engineering blog, Claude Code best practices, and industry research
> **Last synced**: 2026-03-02
> **Sources**:
> - anthropic.com/engineering/effective-context-engineering-for-ai-agents (PRIMARY)
> - code.claude.com/docs/en/best-practices (VERIFIED)
> - Context7 `/anomalyco/opencode` documentation (VERIFIED)
> - Anthropic 2026 Agentic Coding Trends Report (CITED)

---

## 1. The Context Budget Mental Model

> "Context engineering has replaced prompt engineering as the critical discipline."
> — Agentic AI Infrastructure Landscape 2025-2026

### The Core Constraint

Every frontier LLM has a fixed context window (Claude: ~200K tokens). **Performance degrades as it fills.** This isn't a cliff — it's a slope:

| Context Usage | Effect on Agent |
|--------------|----------------|
| 0-30% | Peak performance. Instructions followed precisely. |
| 30-60% | Good performance. Minor instruction drift possible. |
| 60-80% | Noticeable degradation. Earlier instructions may be "forgotten." Agent may repeat decisions. |
| 80-95% | Significant degradation. Circular outputs, contradictions, missed context. |
| 95%+ | Auto-compaction triggers. Session boundary created. |

### HiveFiver Budget Targets

| Session Type | Target Max Usage | Action at Threshold |
|-------------|-----------------|---------------------|
| Main session | 50% at stage completion | Checkpoint + self-delegate if higher |
| Sub-session | 30% at task completion | Return evidence immediately |
| Recovery session | 40% before loading new work | Re-orient, then execute |

---

## 2. Context Rot — Causes and Detection

> "As context grows, output quality may degrade." — Anthropic Engineering

### Four Causes of Context Rot (Anthropic-Verified)

| Cause | What Happens | How to Detect |
|-------|-------------|---------------|
| **Instruction dilution** | Too many instructions compete for attention | Agent ignores rules stated 50+ turns ago |
| **Information overload** | Raw tool outputs accumulate | Agent references wrong file version |
| **Decision amnesia** | Prior decisions lost in noise | Agent re-makes a decision already made |
| **Context pollution** | Irrelevant content crowds out relevant | Agent conflates unrelated topics |

### HiveFiver Rot Detection Signals

| Signal | Severity | Action |
|--------|----------|--------|
| Repeating a decision already made | L3 — Critical | Checkpoint state, stop loading new skills |
| Can't find a file referenced 5 turns ago | L3 — Critical | Spawn sub-agent for context collection |
| Output contradicts earlier output | L4 — Emergency | STOP. Emit handoff payload immediately. |
| User forcing completion but context degraded | L3 — Critical | Push back with evidence of degradation |
| Generating narrative instead of structured output | L2 — Alert | Consolidate, switch to table/list format |
| Loading 4th+ skill in session | L2 — Alert | STOP loading. Use what you have. |

---

## 3. Three Techniques for Long-Horizon Tasks

### Technique 1: Compaction (OpenCode Built-In)

**How it works** in OpenCode:
- When tokens hit overflow threshold (model context - 20K buffer), compaction triggers
- History sent to compaction agent (all tools denied)
- Summary format: Goal / Instructions / Discoveries / Accomplished / Files
- Post-compaction: only messages after the boundary are visible to the model
- Old tool outputs replaced with `"[Old tool result content cleared]"`
- **Skills are protected from pruning** — they survive compaction

**Best practices** (Anthropic-verified):
- Start by maximizing recall (capture everything), then iterate for precision
- Overly aggressive compaction loses subtle but critical context
- Customize compaction via AGENTS.md: "When compacting, always preserve: [list]"
- Use `experimental.session.compacting` hook to inject framework state

**HiveFiver-specific**:
- Our `hiveops-governance` plugin's compaction hook preserves: current stage, completed gates, active TODOs, blockers
- STATE.md exists on disk — survives compaction. Always re-read it on recovery.

### Technique 2: Structured Note-Taking (Agentic Memory)

**How it works**:
- Agent writes persistent notes to files OUTSIDE the context window
- Notes pulled back in when needed
- Like maintaining a NOTES.md or TODO.md file

**HiveFiver-specific**:
- STATE.md is our structured note file — current position, completed work, decisions, blockers
- Hierarchy.json is our SOT for trajectory context
- These files survive compaction — always available for re-read

**Best practices**:
- Write notes BEFORE context gets full (proactive, not reactive)
- Keep notes structured (tables, not prose)
- Include "next action" in notes for recovery

### Technique 3: Sub-Agent Architecture (Divide and Conquer)

**How it works** (Anthropic-verified):
- Break complex problems into specialized sub-agents
- Each sub-agent gets a focused, clean, narrow context window
- Main agent coordinates and synthesizes condensed summaries
- "The detailed search context remains isolated within sub-agents, while the lead agent focuses on synthesizing and analyzing the results"

**HiveFiver-specific**:
- Self-delegation: hivefiver delegates to itself in a fresh session for stage transitions
- Investigation delegation: hivexplorer handles codebase exploration with clean context
- Research delegation: hiverd handles external research
- Planning delegation: hiveplanner handles phase sequencing

**Best practices**:
- Sub-agents return compressed summaries (2K tokens), not raw exploration (50K+)
- Each sub-agent loads only the skills it needs (no inheritance)
- Default child permissions: `todowrite: deny`, `todoread: deny`, `task: deny`

---

## 4. Context Stacking Effects

### The Instruction Priority Problem

OpenCode assembles instructions from multiple sources:

| Source | Priority | Loaded When |
|--------|----------|-------------|
| Provider default prompt | LOWEST | Every LLM call |
| Agent body (YAML frontmatter + markdown) | LOW | Session init (once) |
| Walk-up discovery (AGENTS.md, CLAUDE.md) | MEDIUM | When agent enters new directory |
| Skill content | MEDIUM-HIGH | On-demand (persists) |
| User messages | HIGH | Each turn |
| System reminders (ephemeral) | HIGH | Step > 1 with queued messages |
| Plugin hooks (system.transform) | HIGHEST | Every LLM call |

### Contradiction Resolution

There is NO formal contradiction resolution in LLMs. In practice:

| Pattern | Observed Behavior |
|---------|-------------------|
| **Recency bias** | Instructions seen later in context tend to win |
| **Loudness bias** | Instructions with emphasis (CAPS, bold, "CRITICAL") win over quiet ones |
| **Repetition effect** | Instructions repeated in multiple sources are more likely followed |
| **Specificity wins** | Specific instruction > general instruction |
| **User message priority** | Human messages tend to override system instructions |

### HiveFiver Mitigation

- **Don't stack contradictory instructions** across prime, mode, and coordination skills
- **Prime declares role boundaries** — mode and coordination respect them
- **Use specific instructions** over general principles
- **Repeat critical constraints** in skill, agent body, AND commands (reinforcement)
- **Test with degraded context** — verify instructions survive at 60%+ usage

---

## 5. Practical Guardrails for HiveFiver

### Turn-Based Escalation Protocol

| Escalation Level | Trigger | Agent Behavior |
|-----------------|---------|----------------|
| **L1 — Mild** | Early session, context clean | Instructive. Remind of hierarchy and disclosure rules. |
| **L2 — Alert** | Multiple topics active, branching context | Urgent. Consolidate knowledge. Stop loading new skills. Switch to tables. |
| **L3 — Critical** | Rot signals detected (see §2) | Forceful. Spawn sub-agent for context collection. Summarize done vs pending. |
| **L4 — Emergency** | Circular outputs, contradictions, lost decisions | STOP. Emit handoff payload. Do NOT continue work. |

### Evidence-Before-Claims Enforcement

> "It works" is not evidence.

| Claim Type | Required Evidence |
|------------|------------------|
| "Tests pass" | Show test output with pass count |
| "No regressions" | Show diff of test results before/after |
| "File is correct" | Show file content or relevant excerpt |
| "Parity verified" | Show diff command with exit code 0 |
| "Stage complete" | Show runtime-gate.sh post-turn output |

### Anti-Pattern: Over-Confidence Bias

LLMs exhibit over-confidence in agentic runs. Common failure modes:

| Failure Mode | What Happens | Mitigation |
|-------------|-------------|------------|
| Premature completion claim | Agent says "done" without verification | Require evidence before claims |
| Happy-path assumption | Agent assumes everything worked | Always check return codes / test output |
| Hallucinated file content | Agent "remembers" file content incorrectly | Re-read file before referencing |
| Scope creep | Agent fixes things that weren't asked for | Stay within delegation packet scope |
| Skill avalanche | Agent loads every skill "just in case" | Max 4 skills per session, checkpoint at 5th |

### SOT Validation Rules (Context Quality Check)

Before trusting ANY file as Source of Truth:

| Check | Pass Condition | Fail Action |
|-------|---------------|-------------|
| Hierarchically structured? | In a grouped folder, not loose at root | Treat as hypothesis |
| Date-stamped filename? | NO date = SOT, YES date = branch artifact | If dated, check for newer version |
| Connected to other artifacts? | Referenced by other files | If disconnected, likely stale |
| Recent and iteratively updated? | Modified within 48h | If older, verify against codebase |

If ANY check fails → treat content as hypothesis, not truth.

---

## 6. Provider-Specific Awareness

### Claude (Anthropic) — Primary Model

| Behavior | Implication for HiveFiver |
|----------|--------------------------|
| 200K token context window | ~80K turns before compaction (varies with tool output size) |
| Extended thinking available | Use for complex architecture decisions |
| Tool use: parallel calls supported | Can call multiple tools in one turn for efficiency |
| Compaction is lossy | Always write STATE.md before approaching limits |
| Skills never pruned | Load early → they persist → use for anchoring instructions |

### Gemini (Google) — Alternative Model

| Behavior | Implication for HiveFiver |
|----------|--------------------------|
| Thinking budget configurable | Match to task complexity |
| Larger context windows (1M+) | Compaction less frequent but still needed |
| Different tool calling patterns | Test commands with both models |

### General Rule

Design for the SMALLEST context window your agents might use. If a pattern works at 200K tokens, it'll work at 1M. The reverse isn't true.
