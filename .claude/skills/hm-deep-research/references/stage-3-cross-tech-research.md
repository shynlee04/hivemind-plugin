# Stage 3: Cross-Tech Research

Deep dive on multi-agent, cross-domain research. This stage activates only when Stage 2 identifies research scope that exceeds single-agent capacity.

**PREREQUISITE**: Load the `coordinating-loop` skill before executing any delegation. It provides the wave structure, prompt envelope format, and gate enforcement patterns.

---

## Trigger Scenarios (when Stage 3 is required)

| # | Scenario | Why Single Agent Fails | Pattern |
|---|----------|----------------------|---------|
| 1 | Compare 3+ libraries in depth | Each library needs dedicated Context7 queries + doc extraction | Parallel: 1 agent per library |
| 2 | Investigate bug across full stack | Frontend + backend + DB each have different failure modes | Parallel: competing hypotheses |
| 3 | Feasibility check for multi-component system | Each component has separate dependency chains | Sequential: stack -> code -> validate |
| 4 | Architecture audit of large codebase | Single repomix pack too large, need focused analysis | 4-batch: survey -> deep -> cross-ref -> persist |
| 5 | Research spans 4+ distinct domains | Context budget insufficient for all domains | Parallel: 1 agent per domain pair |

---

## Agent Type Selection

| Agent Type | Use For | Tools Prioritized | Output Style |
|------------|---------|-------------------|--------------|
| **researcher** | Web/doc research, library comparison, market analysis | tavily-search, Context7, DeepWiki, tavily-extract | Structured findings with citations |
| **explore** | Codebase investigation, architecture mapping, pattern search | repomix pack, grep, read, glob | Dependency maps, code excerpts |
| **critic** | Validation, contradiction detection, gap analysis | grep, read (on existing findings files) | Annotated gap reports |
| **builder** | NOT for research. Only if prototype validation is needed. | (not applicable in research) | (not applicable in research) |

**Rule**: Never use `general`, `plan`, or other generic agent types. They lack project context and audit logging.

---

## Subagent Prompt Envelope

Every research subagent receives a 5-section envelope. No exceptions.

### Template

```
## Task
[One sentence describing the specific research task]

## Scope
- INCLUDE: [specific files, domains, URLs, or topics]
- EXCLUDE: [unrelated areas — be explicit]
- CONSTRAINTS: [time budget, max tool calls, context limits]

## Context
[Max 50 lines of background. Include:
 - The overall research question
 - What Stage 2 already found
 - Why this specific sub-task is needed
 - Any known constraints or risks]

## Expected Output
Write findings to: [exact file path, e.g., .planning/research/findings-wave1-prisma.md]
Format: [references/findings-format-template.md]
Sections required:
  1. [section name]
  2. [section name]
  3. [section name]
Min sources: [N]

## Verification
After writing, run: [command to validate output]
Expected: [what the command should return]
```

### Example Envelope (Library Comparison)

```
## Task
Investigate Drizzle ORM's PostgreSQL composite type support and migration system.

## Scope
- INCLUDE: Drizzle ORM official docs, GitHub repo, npm package
- EXCLUDE: Drizzle Kit (CLI tool), MySQL/SQLite adapters
- CONSTRAINTS: Max 15 tool calls. Use Context7 first, then tavily-search.

## Context
Overall research: "Which ORM between Prisma, Drizzle, and Kysely provides the best
TypeScript type inference for PostgreSQL composite types?"

Stage 2 found: Prisma does not natively support PG composite types. Kysely provides
raw SQL type mapping. Drizzle is untested.

Hypothesis: Drizzle's column-based schema definition provides better type inference
for composite types than Prisma's declarative schema.

## Expected Output
Write findings to: .planning/research/findings-wave1-drizzle.md
Format: Use findings-format-template.md
Sections required:
  1. Schema Definition API (with code examples)
  2. PostgreSQL Composite Type Support (Direct evidence or absence)
  3. Migration System Overview
  4. Type Inference Quality (with examples)
Min sources: 3

## Verification
After writing, run: grep -c "^## " .planning/research/findings-wave1-drizzle.md
Expected: >= 4 section headers found
```

---

## Wave Structure

### Wave 1: Broad Discovery (2-3 parallel agents)

Launch 2-3 researcher agents in parallel. Each gets a unique scope/hypothesis — never broadcast the same prompt to all agents.

```
Agent 1: researcher -> "Investigate [Library/Domain A]"
Agent 2: researcher -> "Investigate [Library/Domain B]"
Agent 3: researcher -> "Investigate [Library/Domain C]" (if 3+ domains)
```

Output: `findings-wave1-agent-{1,2,3}.md`

**After Wave 1 completes**: Read all outputs. Identify leads that need deeper investigation.

### Wave 2: Deep Dive (1-2 explore agents)

Launch 1-2 explore agents to deep-dive on the most promising leads from Wave 1. Each agent targets a specific area.

```
Agent 4: explore -> "Deep-dive [Lead from Wave 1, Agent 2]"
Agent 5: explore -> "Deep-dive [Lead from Wave 1, Agent 1]" (if needed)
```

Output: `findings-wave2-deep-{1,2}.md`

**After Wave 2 completes**: Read all outputs. Cross-reference with Wave 1.

### Wave 3: Validation (1 critic agent)

Launch 1 critic agent to cross-reference all findings, flag contradictions, and identify gaps.

```
Agent 6: critic -> "Cross-reference all findings files, flag contradictions and gaps"
```

The critic agent reads all `findings-wave*.md` files and produces:
- Contradiction list (Finding X vs Finding Y)
- Gap list (unanswered questions)
- Evidence quality assessment

Output: `findings-wave3-validation.md`

**After Wave 3 completes**: Read validation output. Resolve any critical contradictions before synthesis.

### Wave 4: Synthesis (coordinator — YOU)

Merge all findings into `synthesis-report.md`. Follow Stage 4 procedures.

---

## Partial Failure Recovery

### When an agent fails or returns incomplete results

1. **Do NOT discard successful results.** If Agent 2 returned findings but Agent 3 failed, integrate Agent 2's results.
2. **Document the failure.** In the synthesis report, note: "Agent 3 (investigation of X) failed due to [reason]. Results for X are incomplete."
3. **Decide: retry or accept gap?**
   - Retry if: the missing information is critical and budget allows.
   - Accept gap if: the missing information is non-critical or budget is exhausted.
4. **If retrying**: launch a new agent with a narrower scope targeting only the failed area.

### When context budget runs out mid-wave

1. **Immediately stop launching new agents.**
2. **Collect all completed results.**
3. **Write findings for what you have.**
4. **Document which waves/agents were NOT launched.**
5. **Proceed to Stage 4 with incomplete but honest findings.**

---

## Linked Prerequisites

Before executing Stage 3, verify:

- [ ] Stage 2 findings are written to disk at `findings-stage2.md`
- [ ] `coordinating-loop` skill loaded (provides wave execution patterns)
- [ ] All agent output file paths planned (e.g., `.planning/research/findings-wave1-*.md`)
- [ ] Context budget recalculated: Stage 2 consumed X%, remaining Y% for Stage 3
- [ ] Each agent's scope is unique — no overlapping hypotheses between agents
- [ ] Verification commands planned for each agent's output

---

## Gate Check

Before leaving Stage 3:

- [ ] All parallel streams completed OR documented why incomplete
- [ ] Partial failures integrated (successful results preserved)
- [ ] Critic agent (Wave 3) has reviewed all findings
- [ ] Contradictions between streams identified and flagged
- [ ] All agent output files written to disk
- [ ] Ready to synthesize in Stage 4
