---
name: user-intent-patterns
description: >
  Use when designing or evaluating how AI frameworks extract and clarify user intent, when choosing between interactive probing vs passive context absorption, when user requests are vague and you need a systematic approach to surface requirements, or when comparing GSD discuss-phase, BMAD context absorption, or Hivemind iterative probing patterns. Triggers on: "how to extract user intent", "interactive probing vs passive absorption", "when to ask questions vs infer from context", "framework intent patterns", "clarify intent systematically", "intent clarity to probing depth", "too many questions anti-pattern", "question fatigue", "progressive intent extraction". NOT for teaching specific delegation tools (that's subagent-delegation-patterns), NOT for session discovery or resumption (that's session-foundation).
---

## Overview

Different frameworks take fundamentally different approaches to the same problem: **understanding what the user actually wants.** This skill maps those approaches, extracts transferable principles, and provides a decision matrix for choosing the right strategy based on intent clarity.

The value here is not rote learning of one framework's protocol. It's understanding **why** GSD asks structured QA questions, **why** BMAD absorbs context passively, and **why** Hivemind probes iteratively — and knowing when each strategy is appropriate.

### What This Skill Covers

- How GSD, BMAD, and Hivemind each approach user intent extraction
- The decision matrix: intent clarity → probing depth
- When interactive probing beats passive absorption (and vice versa)
- Anti-patterns: too many questions, too few questions, wrong timing
- Framework-agnostic principles you can apply to any agent architecture

### What This Skill Does NOT Cover

- Specific delegation tools (`delegate-task`, `task`) — covered by `subagent-delegation-patterns`
- Session discovery and resumption — covered by `session-foundation`
- Implementation of any specific framework's intent loop
- Tool-level permission configuration

---

## Three Frameworks, Three Philosophies

### GSD: Discuss-Phase Structured QA

GSD treats intent extraction as a **formal discovery phase** — `discuss-phase` — that runs BEFORE any planning or implementation.

**Core pattern:** Structured question rounds with explicit stop conditions.

The GSD approach asks adaptive questions organized by dimension: scope, constraints, priorities, success criteria. It persists answers to `SPEC.md` or `PROJECT.md` artifacts. Questions are capped (typically 3 per round) and the phase terminates when all required dimensions are covered.

**When GSD's approach shines:**
- The user has a vague idea needing structured exploration
- The project is early-stage and requirements are genuinely unknown
- You need a durable, documented requirements baseline before development begins

**When GSD's approach breaks:**
- The user already knows exactly what they want — structured QA feels like bureaucracy
- The task is trivial (single-file, well-understood) — QA overhead > task effort
- The user is providing dense context (links, files, logs) that passive absorption handles better

### BMAD: Context Absorption

BMAD treats intent extraction as a **passive ingestion problem.** Instead of asking questions, it absorbs everything the user provides — prompts, files, links, narrative — and builds a unified context model.

**Core pattern:** Multi-wave swarm absorption → narrative synthesis → progressive refinement.

BMAD orchestrates parallel subagent waves to parse, extract, and merge context from all sources. It constructs a `session-context-prompt.md` that grows incrementally. Questions are asked only when absorption reveals gaps.

**When BMAD's approach shines:**
- The user provides rich, dense context (a long prompt with links, code samples, and requirements)
- The user is an expert who communicates well in writing — questions feel like interruptions
- Multiple unrelated information sources need unification before intent emerges

**When BMAD's approach breaks:**
- The user's context is sparse or ambiguous — absorption has nothing to absorb
- The user is non-technical and can't articulate requirements in writing
- Silent absorption leaves the user wondering "is anything happening?"

### Hivemind: Iterative Probing

Hivemind treats intent extraction as an **iterative conversation** — a PROBE → UNDERSTAND → PLAN → DELEGATE → UPDATE → DELIVER loop where each user response refines the model.

**Core pattern:** Iterative probing with hard gates. Max 3 questions per PROBE phase. Six stop conditions must ALL be met before proceeding. Intent state is persisted (intent.json + progress.md) so interrupted sessions can resume.

**When Hivemind's approach shines:**
- Sessions span many turns and context decay is a risk
- The user relationship needs nurturing — not just one-shot extraction
- Work involves delegation to subagents where intent must be preserved across handoffs

**When Hivemind's approach breaks:**
- The task is one-shot and quick — the loop overhead is excessive
- The user wants fast execution, not conversation
- The framework requires tools/scripts that aren't available on the current platform

---

## Decision Matrix: Intent Clarity → Probing Depth

Use this matrix to choose your strategy. Read the rows — find where your situation lands, then apply the recommended approach.

| Intent Clarity | User Communication Style | Recommended Approach | Questions to Ask | Expected Turns |
|---------------|--------------------------|---------------------|------------------|----------------|
| **Crystal clear** — exact file, exact change | Any | **Zero questions.** Execute directly. | None. Just confirm scope. | 1 |
| **Mostly clear** — domain known, details fuzzy | Any | **1-2 clarifying questions.** Confirm scope, constraints. | Scope boundary + success criteria | 2-3 |
| **Partially clear** — intent known, approach unknown | Writes well, provides context | **BMAD-style absorption.** Read provided context first, ask only about gaps. | Constraint check only | 2-4 |
| **Partially clear** — intent known, approach unknown | Needs conversation | **GSD-style structured QA.** 2-3 rounds: scope → constraints → priorities. | Scope + constraints + priorities | 3-5 |
| **Vague** — "help me with my project" | Writes well | **Mixed.** Absorb what's provided, ask targeting questions about uncovered dimensions. | All 5 dimensions over 2 rounds | 4-6 |
| **Vague** — "help me with my project" | Needs conversation | **Hivemind-style iterative probing.** Full PROBE phase with 6 stop conditions. | Systematic across all dimensions | 5-8 |
| **Multi-session** — work spanning restarts | Any | **Hivemind-style with persistence.** Must persist intent state to disk for recovery. | All dimensions + persistence checkpoints | 5-10+ |

### The 5 Core Dimensions to Probe

Regardless of which approach you use, these 5 dimensions should be covered before acting:

| # | Dimension | What to Ask | Example Artifact |
|---|-----------|------------|-----------------|
| 1 | **Scope boundary** | What's in? What's out? | `scope_in`: ["create skill file"], `scope_out`: ["edit agents", "write code"] |
| 2 | **Success criteria** | What does "done" look like? | "Skill has trigger phrases, body, validated references" |
| 3 | **Constraints** | What limits exist? | "No hm- prefix, no delegation tools, no session discovery" |
| 4 | **Priority** | What matters most? | high = trigger accuracy, medium = reference depth |
| 5 | **Delegation appetite** | Execute or delegate? | execute = do it yourself, delegate = dispatch subagent |

> **Full terminology mapping between frameworks:** see `references/terminology-map.md` for how GSD, BMAD, and Hivemind name these same concepts differently.

---

## Interactive Probing vs Passive Context Extraction

### When to Probe Interactively

Interactive probing means **asking the user questions** — through whatever question mechanism the platform provides.

**Use interactive probing when:**
- The user's initial message is under 50 words and lacks specifics
- The user is non-technical and needs guidance to articulate requirements
- The task involves decisions the user MUST make (scope, priority, delegation)
- Previous passive absorption led to wrong assumptions
- The user explicitly asks "what do you need from me?"

**Costs of interactive probing:**
- Each question turn costs time and the user's attention
- Too many questions → "question fatigue" → user disengages
- Each question is an opportunity for the user to change their mind → scope creep risk
- Context window accumulates Q&A that may not add value

### When to Extract Passively

Passive extraction means **inferring intent from what's already provided** — prompts, files, links, conversation history.

**Use passive extraction when:**
- The user provides rich context (200+ word prompt, file references, links)
- The user is clearly an expert who knows what they want
- The task domain is well-understood (common patterns, standard operations)
- You have access to conversation history or project state that fills gaps
- The user seems impatient or time-constrained

**Costs of passive extraction:**
- Assumptions made from incomplete context may be wrong → rework
- The user may not realize you misunderstood until output is produced
- Without explicit confirmation, scope boundaries are fuzzy

### The Hybrid Sweet Spot

In practice, most effective intent extraction is hybrid:

1. **Absorb everything** the user provided (passive)
2. **Identify gaps** against the 5 core dimensions
3. **Ask 1-3 targeting questions** about the uncovered dimensions (interactive)
4. **Restate understanding** and get confirmation (passive absorption of confirmation)

This is the pattern that BMAD's "ask only when absorption reveals gaps" and Hivemind's "PROBE with max 3 questions" both converge on, from different starting points.

---

## Anti-Patterns

| # | Anti-Pattern | Symptom | Why It Fails | Fix |
|---|-------------|---------|-------------|-----|
| 1 | **The Interrogator** | 5+ questions in one turn or continuous questioning without synthesis | User feels like they're being interviewed by a machine. They disengage or give short, frustrated answers. | Cap at 3 questions per round. Between rounds, restate what you understand. |
| 2 | **The Mind Reader** | Zero questions asked. Proceeds directly to implementation based on assumptions. | Assumptions are wrong more often than you think. Scope creep happens silently. User gets something they didn't ask for. | Always confirm scope boundary and success criteria before acting — even if it's a one-sentence confirmation. |
| 3 | **The Wrong-Time Questioner** | Asks about success criteria when the user hasn't even confirmed the scope. Asks about delegation when the task isn't understood. | Questions feel random and disconnected. User can't answer well because the framing is wrong. | Order matters: scope → constraints → priorities → success criteria → delegation. Don't ask about what comes later until earlier dimensions are covered. |
| 4 | **The Scoper Creeper** | Each question round adds new requirements instead of clarifying existing ones. The task grows 2x per interaction. | The original intent gets buried. User walks away with a different task than they came with. | Record the original scope boundary. Each new question round must reference it. New requirements → new session, not scope expansion. |
| 5 | **The Silent Absorber** | Absorbs context for many turns without any user-visible output. User wonders if anything is happening. | User disengages. They may restart the session or repeat themselves — creating noise. | Output intermediate synthesis after each absorption round. "I've processed your context. I understand X, Y, Z. I'm missing A. Should I proceed with what I have?" |
| 6 | **The Persister Without Purpose** | Persists every question and answer to disk without a concrete handoff plan. Creates state files that never get read. | Disk clutter. Recovery becomes harder because there's too much stale state. | Only persist what's needed for recovery. Clean up after delivery. If a session won't be resumed, don't persist. |

---

## Framework-Agnostic Principles

These principles apply regardless of which framework or platform you're building for:

### Principle 1: Intent Extraction Is Progressive, Not One-Shot

You will rarely understand everything the user wants from their first message. This is not a failure — it's the nature of human communication. Design for multiple rounds of refinement.

**Applied:** Even GSD's structured QA (which looks one-shot on paper) runs 2-3 rounds in practice. BMAD's absorption is inherently multi-wave. Hivemind's PROBE phase is explicitly iterative.

### Principle 2: The Question Budget Is Finite

Users have limited patience for questions. Every question you ask spends from this budget. Spend it on the highest-value unknowns.

**Applied:** All three frameworks converge on a cap: GSD caps at 3 per round, Hivemind caps at 3 per PROBE phase, BMAD minimizes questions by absorbing first.

### Principle 3: Confirmation Is Cheaper Than Correction

Getting confirmation on your understanding (one sentence: "I understand X, correct?") costs one turn. Correcting a wrong implementation costs many turns. Confirm before acting.

**Applied:** GSD writes SPEC.md and confirms. Hivemind has UNDERSTAND phase with explicit confirmation. BMAD's narrative synthesis serves the same purpose.

### Principle 4: Intent State Must Survive Context Loss

Sessions get interrupted. Context windows get compacted. Agents get restarted. If intent only lives in conversation memory, it's lost on restart.

**Applied:** GSD persists to SPEC.md/PROJECT.md. Hivemind persists to intent.json/progress.md. BMAD persists to session-context-prompt.md.

### Principle 5: The Strategy Must Match the User, Not the Framework

The best framework is the one that matches the user's communication style. A user who writes 500-word prompts doesn't need structured QA. A user who says "help me with my project" doesn't need passive absorption.

**Applied:** The decision matrix above maps user style to approach. Don't force one framework's philosophy onto a user it doesn't fit.

---

## References

When you need deeper understanding:

| Reference | When to Read |
|-----------|-------------|
| `references/terminology-map.md` | When you need to translate intent concepts between GSD, BMAD, and Hivemind frameworks |
| `references/philosophy.md` | When you need to understand *why* progressive intent extraction works better than one-shot questioning |

### Cross-References to Other Skills

| Skill | Relationship |
|-------|-------------|
| `subagent-delegation-patterns` | This skill tells you **when** to delegate after intent is clear. Subagent-delegation tells you **how** to dispatch. |
| `session-foundation` | This skill tells you **what** intent state to persist. Session-foundation tells you **how** to discover and resume sessions. |
| `hm-l2-brainstorm` | Brainstorm is for ideation when intent is completely unknown. This skill is for extraction when intent is partially formed. |

---

## Quick Reference: Strategy Selection Flowchart

```
User sends a message
    │
    ▼
Is the intent crystal clear? (specific file, specific action)
    │
    ├── YES → Execute directly. Confirm scope in 1 sentence.
    │
    └── NO → Does the user provide rich context? (200+ words, files, links)
              │
              ├── YES → Absorb context first. Identify gaps against 5 dimensions.
              │         Then ask 1-3 targeting questions about gaps only.
              │
              └── NO → Is the task simple or complex?
                        │
                        ├── SIMPLE → 1-2 clarifying questions. Then execute.
                        │
                        └── COMPLEX → Structured extraction:
                                      1. Scope boundary (1 question)
                                      2. Constraints + priorities (1 question)
                                      3. Restate understanding → confirm
                                      Then proceed.
```

---

## Verification Checklist

Before claiming intent is understood, verify:

- [ ] All 5 core dimensions are covered (scope, success, constraints, priority, delegation)
- [ ] The user has explicitly confirmed the restated understanding (not just "ok" to everything)
- [ ] Intent state is persisted if the session may be interrupted
- [ ] Scope boundaries are documented (what's IN, what's OUT)
- [ ] Question count has not exceeded the budget without good reason
- [ ] The user's communication style matches the chosen approach

## Hivemind Tooling Alignment

This skill aligns with Hivemind's custom toolings. The loading agent should declare:

```yaml
tools:
  - hivemind-doc
  - delegate-task
  - configure-primitive
```

### Cross-References

- Routing: `hm-coord-router` (intent classification)
- Coordination: `hm-coord-loop` (multi-agent dispatch)
- Governance: `hivemind-power-on` (load first)
- Quality gates: `hm-gate-triad` (3-gate sequence)

When this skill is loaded, the agent should also load these as needed.
