# Adopted Patterns

Synthesized patterns from third-party research that inform this gate's
evaluation methodology. Each pattern is adapted for the Hivemind harness
context.

---

## Pattern 1: Gateguard Fact-Forcing

**Source:** Gateguard methodology — separation of fact collection from judgment.

**Principle:** Evaluation scripts and checklists REPORT FACTS. The evaluating
agent applies JUDGMENT. Never mix fact collection with judgment in the same
step.

**Application in this gate:**
- `scripts/run-gate-eval.sh` reports structural facts (LOC counts, import
  chains, registration presence) without interpretation.
- The agent reads the report and applies the rubrics from
  `references/perspective-rubrics.md` to score.
- The gate report template (`templates/gate-report.md`) separates the facts
  section from the verdict section.

**Why it matters:** Mixed fact-judgment leads to confirmation bias. Scripts
that both detect and evaluate tend to be gamed. By separating them, the
gate maintains objectivity.

---

## Pattern 2: ISO 25010 Quality Grounding

**Source:** ISO/IEC 25010 software quality model.

**Mapping to gate dimensions:**

| ISO 25010 Characteristic | Gate Dimension | Evaluation Method |
|--------------------------|----------------|-------------------|
| Functional suitability | Classification fit | Correct root placement |
| Reliability | CQRS boundary | Write/read separation |
| Security | Actor hierarchy | Depth limits, category validation |
| Maintainability | Size and structure | LOC limits, dependency graph |
| Compatibility | OpenCode surface | SDK interface correctness |
| Performance efficiency | Event-driven wiring | Async patterns, no sync blocks |
| Portability | Classification fit | No cross-root contamination |
| Usability | (not evaluated — internal gate) | — |

**Application in this gate:**
- Each evaluation dimension maps to one or more ISO 25010 characteristics.
- The anti-pattern catalog (AP-01 through AP-14) is classified by which
  ISO characteristic they violate.
- Scoring rubrics weight dimensions by their ISO criticality for the harness.

---

## Pattern 3: CQRS Verification

**Source:** Command Query Responsibility Segregation — adapted for OpenCode
plugin architecture.

**Principle:** Tools are the write-side (commands). Hooks are the read-side
(queries). Events flow from write to read, never the reverse. State mutations
happen only on the write-side.

**Verification rules:**
1. WRITE-SIDE (Tools): Implements `tool()` in plugin, has Zod schema, calls
   SDK mutations, may call `patchSessionContinuity()`, returns structured tool
   response, NEVER reads event stream directly.
2. READ-SIDE (Hooks): Implements hook handlers, observes events, may read
   continuity, NEVER calls `patchSessionContinuity()` (except documented
   exceptions in `tool.execute.after`), NEVER calls `delegationManager.dispatch()`.
3. The event stream is the sole communication channel from write-side to
   read-side. No direct function calls from hooks into tools.

**Application in this gate:**
- AP-01 (WRITE FROM READ-SIDE) and AP-02 (DIRECT SDK CALL FROM HOOK) are
  direct CQRS violations — always BLOCK severity.
- The evaluation checklist dedicates Dimension 2 to CQRS correctness for
  both TOOL and HOOK artifact types.
- The Architect lens weights CQRS Boundary at 2x in scoring.

---

## Pattern 4: Bounded Context Enforcement

**Source:** Domain-Driven Design bounded contexts — adapted for the three-root
architecture.

**Principle:** The three roots (`src/`, `.opencode/`, `.hivemind/`) are bounded
contexts. Each has its own data model, its own lifecycle, and its own
communication patterns. Cross-boundary references are one-directional.

**Boundary rules:**
- `src/` → `.opencode/`: NEVER (hard harness does not reference soft meta)
- `src/` → `.hivemind/`: YES (writes state via continuity.ts and delegation-persistence.ts)
- `.opencode/` → `src/`: NEVER (skills/agents are declarative, not importers)
- `.opencode/` → `.hivemind/`: NEVER (skills read state at runtime, not at build time)
- `.hivemind/` → anywhere: NEVER (state is a sink, not a source for code)

**Application in this gate:**
- AP-13 (CROSS-ROOT IMPORT) detects boundary violations.
- Classification Fit (Architect A3, weight 2x) scores placement correctness.

---

## Pattern 5: Fail-Fast with Evidence

**Source:** Engineering reliability principle — detect errors as close to the
source as possible with sufficient context for remediation.

**Principle:** BLOCK-level anti-patterns are detected and reported immediately
with file:line references. The gate does not continue evaluation past a BLOCK
finding for the affected dimension.

**Application in this gate:**
- The evaluation script (`run-gate-eval.sh`) exits non-zero on first BLOCK
  finding in each dimension.
- The gate report template requires evidence for every finding (file, line,
  code snippet).
- Cross-skill routing only happens when ALL dimensions PASS. A single BLOCK
  prevents routing to `gate-spec-compliance`.

---

## Pattern 6: Dual-Signal Confirmation

**Source:** Hivemind's own `CompletionDetector` architecture — applied as a
meta-pattern for gate evaluation itself.

**Principle:** Gate evaluation requires two confirming signals before declaring
PASS: (1) automated script output shows no violations, and (2) agent review
confirms the script output is complete and accurate.

**Application in this gate:**
- Signal 1: `run-gate-eval.sh` reports facts (exit 0 = no BLOCK findings).
- Signal 2: Agent applies perspective rubrics and confirms the report covers
  all five dimensions.
- Both signals must agree for PASS. If the script passes but the agent finds
  an issue (or vice versa), the gate fails.
