# Task Classification

How to classify incoming user requests into work types and route them correctly.

---

## Classification Matrix

| Type | Signals | Routing Target |
|------|---------|----------------|
| **Research** | "what is", "compare", "investigate", "find out" | Research agent |
| **Planning** | "plan", "roadmap", "what order", "strategy" | Planning agent |
| **Implementation** | "build", "create", "add", "implement", "write" | Implementation agent / TDD |
| **Debug/Recovery** | "broken", "failing", "error", "fix", "crash" | Debug agent |
| **Refactoring** | "clean up", "restructure", "simplify", "reorganize" | Refactor agent |
| **Testing** | "test", "coverage", "verify", "validate" | TDD workflow |
| **Documentation** | "document", "explain", "README", "guide" | Documentation skill |
| **Architecture** | "design", "architecture", "pattern", "ADR", "decide" | Architect agent |
| **Skill Authoring** | "create skill", "extend agent", "new capability" | Skill-authoring |
| **Configuration** | "configure", "setup", "settings", "install" | Config skill |
| **Exploration** | "explore", "show me", "what's in", "list", "scan" | Explorer agent |

---

## Multi-Domain Detection

| Pattern | Primary | Secondary (Queue) |
|---------|---------|-------------------|
| "Research and implement" | Implementation | Research |
| "Plan the refactor" | Planning | Refactoring |
| "Debug and fix" | Debug/Recovery | Implementation |
| "Design and document" | Architecture | Documentation |
| "Investigate and test" | Research | Testing |

**Rule:** Primary intent = action producing user's desired outcome. Secondary = prerequisite/follow-up. Complete research before any implementation routing.

---

## Ambiguity Resolution

**Ask ONE question when:** contradictory signals, unclear scope, could be research OR implementation, "fix" with no specifics.

**Assume and proceed when:** single clear signal, user provides file paths, established prior context resolves ambiguity.

### Decision Tree

```
Simple question? → YES → Answer inline
                  → NO
Code changes needed? → YES → Behavior broken? → YES → Debug/Recovery
                                            → NO → Structure only? → YES → Refactoring
                                                                  → NO → Implementation
                      → NO → Structural decision? → YES → Architecture
                            → Investigation? → YES → Research/Exploration
                            → Otherwise → Planning/Documentation/Configuration
```

---

## Inline vs Route

| Condition | Action |
|-----------|--------|
| Factual question, no code change | Answer inline |
| Clarification about existing work | Answer inline |
| Affects 1-2 files, clear scope | Route to agent |
| Spans multiple modules | Route to planning first |
| Requires external research | Route to research |
| "Show me X" with no action | Route to explorer |
| User asks for a decision | Route to architect |

---

## Scope Detection

| Bounded | Unbounded |
|---------|-----------|
| Named specific file(s) | "the whole project" / "everything" |
| Named specific module | "all tests" / "all docs" |
| Clear feature boundary | No file or module specified |

**Rule:** Bounded → route directly. Unbounded → planning first, then decompose. Ambiguous → assume unbounded, offer to narrow.

---

## Anti-Patterns

| Anti-Pattern | Fix |
|-------------|-----|
| Everything classified as "implementation" | Check for research/planning signals first |
| Skipping classification | Always classify before routing |
| Routing to self | Orchestrator coordinates, does not implement |
| Over-classifying simple questions | Answer inline when no code change needed |
| Ignoring multi-domain signals | Detect and queue secondary domains |
| "Refactor" = "implementation" | Different agents, different constraints |

---

## Speed Rules

1. **3 seconds max** to classify — can't tell? Ask one question.
2. **One classification** per request — primary + queued secondary.
3. **When in doubt, Research** — safe to investigate before acting.
4. **"Fix" = Debug first** — never skip diagnosis.
5. **Architecture = never autonomous** — always requires human approval.
