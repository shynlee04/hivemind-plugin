# The 10 Commandments for Writing AI Agent Tools

This document synthesizes the foundational principles for creating tools that AI agents will naturally select, use correctly, and find valuable. It combines wisdom from three sources:

- **iDumb MASTER-PLAN.md** — 5 NON-NEGOTIABLE principles for agent-native tools
- **iDumb pitfalls-when-creating-tools.md** — 6 tool design principles + 7-point evaluation rubric
- **opencode-tool-architect skill** — Refined 5 principles + 7-point checklist

Follow these commandments, and your tools will work seamlessly with AI agents. Ignore them, and agents will struggle to use your tools or ignore them entirely.

---

## The 10 Commandments

### Commandment 1: ONE ARGUMENT MAX (The Iceberg Principle)

**Rule:** Tools take 0-2 required arguments maximum. Hide complexity behind simple interfaces.

**Why:** Agents track state, not IDs. The system knows the active session, file context, and current focus. Exposing these IDs as arguments forces agents to remember and pass values they don't naturally track.

**Example:**
- ✅ **GOOD:** `declare_intent({ focus: "Build auth system" })` → System handles mode, session ID, write-unlock
- ❌ **BAD:** `declare_intent({ session_id: "abc123", mode: "plan_driven", focus: "...", unlock_writes: true })` → Agent must track IDs, ceremony

**Enforcement:** Use opencode-tool-architect skill's 7-point checklist. Point 4: "Low Argument Burden" — 0-2 required args maximum?

---

### Commandment 2: NATURAL SELECTION (No Shadowing)

**Rule:** Tool descriptions must match the agent's natural thought. No prompt reminders in agent profiles. No "use X tool" hints.

**Why:** If a tool needs a prompt reminder, the description is bad (the "Hollow Tool Trap"). Agents select tools based on natural language matching. If the description uses jargon or doesn't align with agent cognition, it won't be selected.

**Example:**
- ✅ **GOOD:** "Start tracking your work and unlock file writes." → Agent thought: "I want to start working" → naturally selects
- ❌ **BAD:** "Initialize governance lifecycle entity management with mode and focus parameters." → PM jargon, agent won't pick naturally

**Enforcement:** Pitfalls Question 1: "Do agents select this without prompt reminders?" If no → redesign description.

---

### Commandment 3: HIGH FREQUENCY, NOT NICHE

**Rule:** Build tools for many use cases, called frequently. One-shot workflows should be CLI scripts, not tools.

**Why:** High-frequency tools justify their existence and become second nature. Niche tools clutter the tool list and waste tokens when agents scan available tools. One-off workflows belong in CLI scripts or automation, not in the agent's tool belt.

**Example:**
- ✅ **GOOD:** `fast_read({ path: "src/auth.ts" })` → Called constantly during debugging
  ✅ **GOOD:** `map_context({ level: "action", ... })` → Called every context switch
- ❌ **BAD:** `generate_changelog({ format: "markdown" })` → Called once per release → Make a CLI script

**Enforcement:** Pitfalls Question 2: "Made for few specific use cases or many with high frequency?" If few → move to CLI script.

---

### Commandment 4: NO OVERLAP (Distinct Verb Domains)

**Rule:** Each tool has a distinct purpose. No two tools answer the same agent intent.

**Why:** Overlap confuses agents. When two tools appear to solve the same problem, agents struggle to choose, leading to hesitation or random selection. Every tool should own a unique verb domain.

**Example:**
- ✅ **GOOD:** `read()` → Reads full file
  ✅ **GOOD:** `fast_read()` → Hierarchical index + section reading
  ✅ **GOOD:** `grep()` → Search across files
- ❌ **BAD:** `scan_file()`, `inspect_file()`, `analyze_file()` → 3 tools, same intent, confusion

**Enforcement:** Pitfalls Question 3: "Conflict with other tools? Overlapping solutions?" If yes → merge or delete.

---

### Commandment 5: CONTEXT IS KING (Context Inference)

**Rule:** Never ask for IDs or values the system already knows. The system knows the active session, current file, last action.

**Why:** Agents forget IDs. They track "what I'm doing now," not "task abc123." IDs create shadowing—the agent needs reminders to remember them. Inference removes this burden entirely.

**Example:**
- ✅ **GOOD:** `map_context({ level: "tactic", content: "..." })` → System knows active session
- ❌ **BAD:** `map_context({ session_id: "abc123", hierarchy_id: "xyz789", ... })` → Agent must remember IDs

**Enforcement:** Agent-Native Principle 4: "Context Inference" — Don't ask for what's already known.

---

### Commandment 6: SIGNAL OVER NOISE (1-Line Output)

**Rule:** Return ONLY what the agent needs to continue working. 1-line success message or structured JSON. Pull-not-push.

**Why:** Agents don't read navigation menus. Verbose output wastes tokens and distracts from the next action. The agent already knows what it did—it only needs confirmation or actionable data.

**Example:**
- ✅ **GOOD:** `"Session OPEN. Trajectory set."`
  ✅ **GOOD:** `{ allowed: true, warning: "..." }`
- ❌ **BAD:** Long task ID, plan, status, next steps, navigation menu

**Enforcement:** Agent-Native Principle 3: "Signal-to-Noise" — 1-line output. Pitfall Checklist Point 7.

---

### Commandment 7: HARMONIZE WITH HOOKS

**Rule:** Tool state changes must be visible to hooks. Hooks read what tools write. Shared state (brain.json, files) is the contract.

**Why:** Tools and hooks are two halves of one system. Tools change state; hooks enforce rules on that state. If a tool makes changes that hooks can't see, governance breaks down. Shared state files are the contract.

**Example:**
- ✅ **GOOD:** `map_context()` updates `brain.json.hierarchy` → tool-gate hook reads `brain.json`
- ❌ **BAD:** `map_context()` only returns string, no state change → tool-gate can't know

**Enforcement:** Pitfalls Principle 5: "Tools must harmonize with hooks — state changes visible to hooks."

---

### Commandment 8: ACTIONABLE OUTPUT

**Rule:** Agent can DO something with the output. If output is decorative or informational, it's noise.

**Why:** Tools exist to help agents work. Decorative output (e.g., "This file has 5 sections") can't be acted upon. Structured output (e.g., `{ sections: [...] }`) enables the agent to make decisions.

**Example:**
- ✅ **GOOD:** `fast_read()` returns `{ sections: [...] }` → Agent can pick section
- ❌ **BAD:** `fast_read()` returns `"This file has 5 sections and 200 lines."` → Agent can't act

**Enforcement:** Pitfalls Principle 4: "Tool output must be actionable."

---

### Commandment 9: PARALLEL BY DESIGN (Native Parallelism)

**Rule:** Tools designed to be called N times in one turn. Each call is atomic. No JSON batch parsing.

**Why:** Agents think in parallel. They want to do 5 file operations in one turn. If tools require JSON batch arrays, agents must construct complex structures. Atomic tools that accept N parallel calls are simpler and more reliable.

**Example:**
- ✅ **GOOD:** 3 calls to `map_context`, each atomic
- ❌ **BAD:** `map_context({ actions: [...] })` → Agent must parse JSON, error-prone

**Enforcement:** Agent-Native Principle 5: "Native Parallelism" — N calls in one turn.

---

### Commandment 10: SCHEMA FIRST, THEN CODE

**Rule:** Define schema first, derive types, write code. Never hand-write interfaces.

**Why:** Schemas are the contract. Hand-written interfaces drift from the schema. By using tool.schema from the SDK, you get compile-time guarantees that your implementation matches the contract.

**Example:**
- ✅ **GOOD:** Use `tool.schema` from `@opencode-ai/plugin/tool`, derive types
- ❌ **BAD:** `interface MapContextArgs { level: string }` → No compile-time check

**Enforcement:** Pitfalls Principle 6: "Schema-first — define schema, derive type, write tool."

---

## The 7-Point Validation Checklist

Before creating ANY tool, answer these 7 questions. If ANY answer is **NO**, redesign the tool.

| # | Question | Why It Matters |
|---|----------|----------------|
| 1 | **Natural Selection:** Does the description match the agent's natural thought? | Prevents "Hollow Tool Trap" where tools need prompt reminders |
| 2 | **High Frequency:** Will this be called often, or is it a rare one-off? | Niche tools belong in CLI scripts, not the agent's tool belt |
| 3 | **No Overlap:** Does this conflict with innate tools or existing custom tools? | Overlapping tools confuse agents and waste tokens |
| 4 | **Low Argument Burden:** 0-2 required args maximum? | Agents forget IDs; system should infer context |
| 5 | **Lifecycle Granularity:** Does it map to ONE workflow moment? | Tools doing multiple things violate single responsibility |
| 6 | **Hook vs Tool:** Should enforcement live in a hook instead? | Hooks handle enforcement; tools handle action |
| 7 | **Signal-to-Noise:** Is output 1-line or structured JSON? | Verbose output wastes tokens; agents need actionable data |

**How to use:** After designing a tool, run through this checklist. Redesign until all answers are YES.

---

## Summary Table

| # | Commandment | Key Phrase | Skill Reference |
|---|-------------|------------|-----------------|
| 1 | ONE ARGUMENT MAX | The Iceberg Principle | iDumb MASTER-PLAN.md |
| 2 | NATURAL SELECTION | No Shadowing | iDumb pitfalls-when-creating-tools.md |
| 3 | HIGH FREQUENCY | Not Niche | iDumb pitfalls-when-creating-tools.md |
| 4 | NO OVERLAP | Distinct Verb Domains | iDumb pitfalls-when-creating-tools.md |
| 5 | CONTEXT IS KING | Context Inference | iDumb MASTER-PLAN.md |
| 6 | SIGNAL OVER NOISE | 1-Line Output | iDumb MASTER-PLAN.md |
| 7 | HARMONIZE WITH HOOKS | Shared State Contract | iDumb pitfalls-when-creating-tools.md |
| 8 | ACTIONABLE OUTPUT | Not Decorative | iDumb pitfalls-when-creating-tools.md |
| 9 | PARALLEL BY DESIGN | Native Parallelism | iDumb MASTER-PLAN.md |
| 10 | SCHEMA FIRST | Derive Types | iDumb pitfalls-when-creating-tools.md |

---

## Footer

Following these commandments is not optional—it's the difference between tools that agents love and tools that agents ignore. Every commandment comes from real failures where tools were built with good intentions but failed in practice.

**The agent is your user. Think like an agent. Build for the agent.**

When you respect these principles, tools become invisible agents of intent. When you ignore them, tools become obstacles agents learn to avoid.

Choose wisely.
