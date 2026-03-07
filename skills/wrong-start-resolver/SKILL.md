---
name: "wrong-start-resolver"
description: "Use when an agent detects it was initiated with the wrong orchestrator, command, or lineage. Non-destructive: gathers context, composes a restart message, and stops. NEVER auto-corrects a running session."
triggers:
  - "When lineage mismatch is detected"
  - "When domain expertise doesn't match task requirements"
  - "When required tools are unavailable on current platform"
  - "When user explicitly says 'wrong agent' or 'wrong command'"
version: "2.0.0"
---

# Wrong-Start Resolver

**Core principle:** A wrong start cannot be fixed mid-run. Gather context, compose a restart message, and STOP. The user starts fresh with the right setup.

> [!CAUTION]
> This skill is a SESSION-END pattern. Once triggered, the ONLY acceptable outcome is a restart message. Never attempt to "fix" the session in place.

## Platform Adaptation

> This protocol works identically on all platforms.
> The wrong-start condition is CONCEPTUAL (wrong lineage/domain/tool), not platform-specific.
> The restart message adapts to the platform by noting which tools/commands are needed.

## The Resolution Protocol

### DETECT — Is this a wrong start?

```
Check signals in order of confidence:

  User explicitly says "wrong agent/command"
    → Confidence: VERY HIGH → Skip to COMPOSE

  Lineage doesn't match intent domain
    → Confidence: HIGH → Proceed to GATHER

  Required tools not available on platform
    → Confidence: HIGH → Proceed to GATHER

  Loaded skills don't cover the task domain
    → Confidence: MEDIUM → Ask ONE question first

  Vague unease, unclear fit
    → Confidence: LOW → Do NOT trigger wrong-start
    → Monitor and reassess
```

> For the full signal taxonomy with examples, see [references/wrong-start-signals.md](references/wrong-start-signals.md).

### GATHER — Collect context before composing

**Even though the session is wrong, the work done so far has value.** Capture:

1. **User's original intent** — in their words, not interpreted
2. **Context discovered** — files read, decisions made, facts learned
3. **Why this setup is wrong** — specific mismatch (lineage/domain/tool/command)
4. **What setup IS right** — recommended orchestrator + agent type + tools

### COMPOSE — Build the restart message

Use the template in [templates/restart-message.md](templates/restart-message.md).

**Required sections:**
1. What the user asked for (verbatim)
2. Why this session can't serve it (specific mismatch)
3. Context gathered (don't waste the session's work)
4. Copy-paste message for the new session

### OUTPUT — Present to user

```
"I've noticed this session started with [MISMATCH TYPE].
Rather than risk a degraded result, here's a restart message
with all the context I've gathered.

Copy the message below and start a new session with [RECOMMENDED COMBO]."
```

### STOP — End here

**MANDATORY:** After outputting the restart message:
- Do NOT attempt to fix the run
- Do NOT auto-delegate to the correct agent
- Do NOT "try anyway"
- Do NOT continue working

The session ends. The user starts fresh.

## Conditional Signal Routing

| Confidence | Action |
|-----------|--------|
| Very High | DETECT → COMPOSE → OUTPUT → STOP (skip GATHER — user already knows) |
| High | DETECT → GATHER → COMPOSE → OUTPUT → STOP (full protocol) |
| Medium | DETECT → Ask → Re-evaluate → If confirmed: GATHER → COMPOSE → OUTPUT → STOP |
| Low | Do NOT trigger. Monitor and document uncertainty. |

## Anti-Patterns

| Pattern | Problem | Why It Fails |
|---------|---------|-------------|
| **Auto-correct** | "I'll just switch to the right mode" | Context pollution from 50 wrong-start turns |
| **Ignore and continue** | "Close enough, I'll make it work" | Degraded results, wrong governance |
| **Over-trigger** | Every slight mismatch = wrong start | Interrupts legitimate cross-domain work |
| **Silent abort** | Stop without composing restart info | Wastes all gathered context |
| **Half measures** | "Let me try one thing first" | Delays the inevitable, adds noise |

## Bundled Resources

| Resource | Purpose |
|----------|---------|
| [wrong-start-signals.md](references/wrong-start-signals.md) | Full signal taxonomy with confidence levels and false positive warnings |
| [restart-message.md](templates/restart-message.md) | Deterministic template for composing the restart message |
