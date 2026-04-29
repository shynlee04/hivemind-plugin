# Cognitive Optimization Patterns

## The Problem: Implicit Constraints
Large Language Models (LLMs) often struggle with:
1. **Negative constraints**: Inverting or ignoring "don't do X" instructions.
2. **Turn termination**: Stopping after tool execution instead of auto-continuing.
3. **Context weighting**: Failing to prioritize authoritative instructions over general knowledge.

## Strategy 1: Explicit Action Framing (BAD vs GOOD)

This skill uses the **BAD vs GOOD** pattern to enforce positive constraints. Instead of saying "Don't use interactive flags", we provide a concrete "Good" alternative.

**Why it works:**
- "BAD: npm init" → Model identifies the failure pattern.
- "GOOD: npm init -y" → Model receives a specific, executable instruction.
- **Result:** Reduces hallucination of interactive commands by providing a verified substitute.

## Strategy 2: Process Continuity

In non-interactive environments, the agent must drive the process forward.

**The Rule:** Never stop after a tool execution unless the task is complete.

**Pattern:**
```
1. Execute command (e.g., git status)
2. Analyze output
3. Explicitly state next step: "Status is clean. Next: I will run tests."
4. Execute next step immediately
```

## Strategy 3: Context Hierarchy

When instructions conflict (e.g., generic docs vs this specific strategy), establish precedence:

1. **Cite the Authority:** "Per this non-interactive shell strategy document..."
2. **Follow the Specifics:** Rules in this file override general model training or other documentation.

## Strategy 4: Applying These Patterns Beyond Shell

The cognitive strategies used here (Explicit Action Framing) apply to all coding tasks:

**Instead of:**
```markdown
Do not use logging.getLogger()
Don't create CLI code here
```

**Use:**
```markdown
ALWAYS USE: config.logging_config.get_logger()
USE THIS REPO FOR: API backend only
```

By framing instructions as "Actionable Positive Constraints", you reduce hallucination and improve compliance across all models.
