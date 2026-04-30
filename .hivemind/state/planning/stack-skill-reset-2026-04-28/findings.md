# Stack Skill Reset — Findings

## Audit Results (Phase 1 — to be filled)

Skills to audit with skill-judge (8 dimensions, 120 points):

### Stack Skills
| Skill | D1:Delta | D2:Mindset | D3:Anti | D4:Spec | D5:Progress | D6:Freedom | D7:Pattern | D8:Usable | Total | Grade |
|-------|----------|------------|---------|---------|-------------|------------|------------|-----------|-------|-------|
| stack-opencode | 10 | 6 | 6 | 11 | 10 | 9 | 7 | 8 | 67/120 | F |
| stack-vitest | 14 | 11 | 11 | 14 | 14 | 13 | 9 | 14 | 100/120 | A |
| stack-zod | 12 | 8 | 4 | 11 | 14 | 12 | 9 | 10 | 80/120 | B |
| stack-nextjs | 13 | 9 | 10 | 12 | 14 | 12 | 9 | 11 | 90/120 | A |
| stack-json-render | 13 | 8 | 4 | 13 | 14 | 11 | 9 | 10 | 82/120 | B |
| stack-bun-pty | 12 | 8 | 7 | 9 | 10 | 10 | 6 | 9 | 71/120 | C |

### Gate Skills
| Skill | D1 | D2 | D3 | D4 | D5 | D6 | D7 | D8 | Total | Grade |
|-------|----|----|----|----|----|----|----|----|----|-------|
| gate-evidence-truth | 17 | 14 | 14 | 14 | 10 | 13 | 9 | 14 | 105/120 | A |
| gate-lifecycle-integration | 16 | 14 | 13 | 14 | 7 | 13 | 8 | 12 | 97/120 | A |
| gate-spec-compliance | 17 | 14 | 14 | 14 | 9 | 14 | 9 | 13 | 104/120 | A |

### Summary Statistics
- **Average score:** 89.4/120 (74.5%)
- **Grade distribution:** A×5, B×2, C×1, F×1
- **Weakest skill:** stack-opencode (67/120, F) — highest priority for Phase 2
- **Strongest skill:** gate-evidence-truth (105/120, A)
- **Common weakness:** D3 (Anti-Patterns) averages 8.8/15 — lowest dimension
- **Common strength:** D7 (Pattern) averages 8.3/10 — consistent pattern compliance

## Detailed Audit: stack-opencode (67/120 — Grade F)

### D1: Knowledge Delta — 10/20
**Knowledge Ratio: E(30%) : A(40%) : R(30%)**

Expert (genuinely valuable):
- "Under the Hood: client injection" — explains client is pre-initialized with interceptors and x-opencode-directory header
- "Under the Hood: loader() re-reads stored credentials each time" — auth lifecycle detail
- "Under the Hood: Model injection timing — models() called AFTER auth resolved" — critical ordering
- "Gotcha: Plugin is NOT a class" — prevents a real mistake
- "Gotcha: Hook output mutation pattern" — mutate in place, don't return new object
- Hook complete catalog with exact type signatures from source

Activation (useful reminders but Claude would figure these out):
- Plugin is async function (stated in official docs)
- tool() helper usage patterns
- Testing patterns (generic mock setup)
- Gatekeeping type checks

Redundant (Claude already knows):
- "How to Use This Skill" navigation instructions
- Source file listing (redundant with TOC.md)
- Basic TypeScript patterns
- Simple code examples showing API usage without insight

### D2: Mindset + Procedures — 6/15
- Has domain procedures (plugin init, tool registration, hook wiring)
- Missing: thinking frameworks ("Before writing a tool, ask: should this be a tool or a hook?")
- Missing: decision trees for complex scenarios (when to use tool vs hook vs event subscription)
- Missing: cross-cutting concern guidance

### D3: Anti-Pattern Quality — 6/15
Has some NEVERs:
- No definePlugin
- No PascalCase hooks
- No any types in signatures

Missing expert anti-patterns:
- When tool.execute.before throws — what happens? (untested)
- Multiple plugins composing same hook — execution order? Last wins? Merge?
- Zod schema runtime validation — what silently breaks with nested objects?
- SDK client reconnection — timeout behavior?
- Memory/context management via SDK — what leaks?
- Recursive tool calls — detected and blocked, but how?
- Structured output validation failures — retry behavior?

### D4: Specification — 11/15
- Valid frontmatter, good name, comprehensive triggers
- Description covers WHAT and WHEN but not cross-ecosystem routing
- Missing: links to gate-*, hm-*, other stack-* in description
- Missing: official doc URLs (https://opencode.ai/docs/sdk, https://opencode.ai/docs/plugins)

### D5: Progressive Disclosure — 10/15
- SKILL.md = 94 lines (excellent)
- Navigation table present
- TOC.md present
- references/ directory with multiple files
- MISSING: explicit "MANDATORY READ" triggers in workflow
- MISSING: "Do NOT Load" guidance for preventing context waste
- MISSING: cross-reference to bundled/ for deep inspection

### D6: Freedom Calibration — 9/15
- Medium freedom for SDK development is correct
- Some patterns are too prescriptive (exact test code)
- Could use more principle-based guidance for experienced devs

### D7: Pattern — 7/10
- Follows Navigation pattern (SKILL.md routes to references)
- Hybrid with Tool pattern elements in gatekeeping
- Clear structure

### D8: Usability — 8/15
- Code examples look functional
- Test patterns are usable for basic cases
- MISSING: error handling strategies (SDK call failures, network issues)
- MISSING: cross-stack interaction guidance (OpenCode+Zod, OpenCode+Vitest)
- MISSING: fallback strategies
- MISSING: advanced edge cases from source code

## Top 3 Fixes for stack-opencode

1. **DEEP KNOWLEDGE EXTRACTION**: Read the 20K-line bundled source and extract what the docs don't say:
   - Hook composition mechanics (multiple plugins, execution order, error propagation)
   - tool() Zod schema validation at runtime (what breaks, what silently passes)
   - Client-server protocol internals (HTTP shapes, SSE format, reconnection)
   - Session lifecycle state machine (full lifecycle, not just create/get)
   - Permission cascading resolution chain
   - Structured output validation + retry internals

2. **CROSS-ECOSYSTEM ROUTING**: Add references in SKILL.md and TOC.md to:
   - gate-* skills (which stack knowledge each gate needs)
   - hm-* skills (which process skills consume this stack)
   - Other stack-* skills (Zod for schemas, Vitest for testing, bun-pty for PTY)
   - Official docs (https://opencode.ai/docs/sdk, https://opencode.ai/docs/plugins, https://github.com/sst/opencode)

3. **EXPERT ANTI-PATTERNS**: Replace surface-level NEVER lists with deep anti-patterns:
   - "NEVER return a new object from hook output — mutate in place because the runtime holds a reference"
   - "NEVER catch and swallow errors in tool.execute.before — the runtime depends on thrown errors to cancel execution"
   - "NEVER use z.any() in tool schemas — validation silently passes everything"
   - Each with specific WHY from source code

## Cross-Reference Audit
- [x] stack-* → gate-* links: NONE (zero cross-references)
- [x] stack-* → hm-* links: NONE
- [x] gate-* → stack-* links: NONE
- [x] stack-* → stack-* cross-stack: NONE
- [x] Official doc/repo references: ONE (GitHub repo URL in SKILL.md header)

## Knowledge Delta Analysis
- [x] stack-opencode: E(30%) : A(40%) : R(30%) — TARGET: E(>70%)
- [x] stack-vitest: E(30%) : A(55%) : R(15%) — harness-specific testing wisdom; target: add general expert testing patterns
- [x] stack-zod: E(20%) : A(20%) : R(60%) — v4 migration is expert but bulk is API re-docs; TARGET: add anti-patterns + decision trees
- [x] stack-nextjs: E(20%) : A(35%) : R(45%) — sidecar-specific is expert but API files re-doc; TARGET: add decision trees + anti-patterns
- [x] stack-json-render: E(25%) : A(45%) : R(30%) — architecture synthesis is expert but types are verbatim; TARGET: add anti-patterns + error handling
- [x] stack-bun-pty: E(25%) : A(40%) : R(35%) — signal normalization is expert but API surface is re-docs; TARGET: fix broken links, add zombie handling

---

## Detailed Audit: stack-vitest (100/120 — Grade A)

### Key Strengths
- D5 (14/15): Exemplary progressive disclosure — 84-line SKILL.md, clear routing
- D6 (13/15): Well-calibrated constraints for testing framework
- D8 (14/15): Excellent project-specific testing patterns (continuity, semaphore, delegation)

### Key Weaknesses
- D1 (14/20): 55% activation-level content, only 30% expert
- D3 (11/15): Missing vi.mock hoisting gotchas, toStrictEqual vs toEqual subtleties

### Top 3 Fixes
1. Add ecosystem routing to frontmatter → stack-opencode, tdd, hm-test-driven-execution
2. Expand anti-patterns: vi.mock hoisting, toEqual vs toStrictEqual, coverage-threshold gaming
3. Add decision tree: module type → testing pattern (leaf→P1, stateful→P3, concurrent→P4, tool→P6)

---

## Detailed Audit: stack-zod (80/120 — Grade B)

### Key Strengths
- D5 (14/15): Excellent progressive disclosure — 104-line SKILL.md, clean structure
- D6 (12/15): Good freedom calibration for validation library
- D7 (9/10): Clean Navigation/Tool/Playbook pattern

### Key Weaknesses
- D3 (4/15): NO anti-patterns section anywhere — critical gap
- D2 (8/15): No decision trees or "before X ask Y" frameworks
- D1 (12/20): 60% redundant API re-documentation

### Top 3 Fixes
1. Add anti-patterns section: z.any() vs z.unknown(), z.lazy() for recursive, .catch() masking
2. Add ecosystem routing: stack-vitest, hm-test-driven-execution, stack-opencode
3. Add decision tree: "Schema Design Checklist" with procedural guidance

---

## Detailed Audit: stack-nextjs (90/120 — Grade A)

### Key Strengths
- D5 (14/15): 127-line SKILL.md, excellent progressive disclosure
- D8 (11/15): Extensive code examples with Next.js 16 patterns
- D6 (12/15): Well-calibrated framework-mandatory vs project-convention

### Key Weaknesses
- D2 (9/15): No component type decision tree
- D3 (10/15): No consolidated NEVER list with source-backed WHY

### Top 3 Fixes
1. Add ecosystem routing: stack-zod, stack-vitest, gate-lifecycle-integration
2. Add NEVER anti-patterns: sync params, sidecar mutation, middleware.ts deprecation
3. Add decision tree: "Need interactivity? → client. Need DB? → server. Both? → wrapper + island"

---

## Detailed Audit: stack-json-render (82/120 — Grade B)

### Key Strengths
- D5 (14/15): 105-line SKILL.md, exemplary progressive disclosure
- D4 (13/15): Excellent frontmatter with 13 triggers and comprehensive metadata.json
- D1 (13/15): Strong architectural synthesis from repo source

### Key Weaknesses
- D3 (4/15): ZERO anti-patterns or gotchas — silent rendering failures undocumented
- D2 (8/15): No decision frameworks for $state vs $bindState vs $computed
- D8 (10/15): No error handling patterns or try/catch examples

### Top 3 Fixes
1. Add anti-patterns: silent fallback on unknown types, circular children, $template injection
2. Add decision framework: $state vs $bindState vs $computed routing table
3. Add error handling: try/catch, fallback prop, validateSpec + autoFixSpec patterns

---

## Detailed Audit: stack-bun-pty (71/120 — Grade C)

### Key Strengths
- D1 (12/20): Signal normalization and Bun 1.3.5 migration are genuine expert insights
- D5 (10/15): 80-line SKILL.md, proper 3-tier structure

### Key Weaknesses
- D4 (9/15): 5 navigation links point to non-existent files (harness-integration.md, architect.md, etc.)
- D7 (6/10): Only 2 of 7 referenced files exist — broken structure
- D5 (10/15): Navigation broken for most topics

### Top 3 Fixes
1. Remove or stub 5 broken navigation links in SKILL.md
2. Add zombie process and subscription leak anti-patterns
3. Add harness-integration.md with actual run-background-command → PtyManager → spawn() chain

---

## Detailed Audit: gate-evidence-truth (105/120 — Grade A)

### Key Strengths
- D1 (17/20): L1-L5 evidence hierarchy is genuinely expert knowledge
- D3 (14/15): 7 anti-patterns with grep detection commands
- D8 (14/15): Production-ready bash script (175 LOC) and evals

### Key Weaknesses
- D5 (10/15): SKILL.md is 271 lines — over 200-line target

### Top 3 Fixes
1. Create missing references/project-adapter-guide.md
2. Compress SKILL.md to ≤200 lines
3. Add guard questions at step boundaries

---

## Detailed Audit: gate-lifecycle-integration (97/120 — Grade A)

### Key Strengths
- D1 (16/20): 9-surface mutation authority table from real SDK source
- D2 (14/15): Excellent classification-first decision tree
- D3 (13/15): 7 BLOCK-level anti-patterns with grep detection

### Key Weaknesses
- D5 (7/15): SKILL.md is 329 lines — worst progressive disclosure score
- D8 (12/15): No L1-L5 evidence hierarchy reference

### Top 3 Fixes
1. Extract 9-surface table + CQRS rules + SDK signatures from SKILL.md → references/
2. Add evidence hierarchy (L1-L5) in evaluation workflow
3. Clarify tool.execute.after exception boundary criteria

---

## Detailed Audit: gate-spec-compliance (104/120 — Grade A)

### Key Strengths
- D1 (17/20): DO-178C traceability adaptation is deeply expert
- D2 (14/15): 7-node decision tree with gap-type routing
- D6 (14/15): Excellent constraint calibration (blocks on HIGH/CRITICAL, warns on others)

### Key Weaknesses
- D5 (9/15): SKILL.md is 261 lines — over 200-line target

### Top 3 Fixes
1. Extract EARS table + gap detection detail to references/ (get under 200 lines)
2. Document scripts/run-compliance-check.sh integration
3. Strengthen AP-07 Self-Certification detection with specific file checks
