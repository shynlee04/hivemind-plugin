PHASE 1: Frame Skeleton — Audit Findings & Improvement Roadmap
1. CURRENT STATE — Critical Issues Found
The four research agents uncovered systemic structural problems. Here's the severity-ranked inventory:
🔴 CRITICAL (Blocks Correctness)
#	Issue	Evidence
C1	Frontmatter Contradiction	04-tdd-workflow.md GREEN phase template shows 8 fields (version, framework, pack, entry-level, pattern, stacking, owner, status) that 02-frontmatter-standard.md explicitly FORBIDS
C2	Missing File 06	references/06-agent-activation.md referenced by 07 and 08 but doesn't exist
C3	Byte-for-byte Duplicate	sw-04-tdd-workflow.md ≡ 04-tdd-workflow.md (392 lines identical)
C4	Self-Violating SKILL.md	Main SKILL.md doesn't follow the frontmatter standard its own references teach
🟠 HIGH (Degrades Quality)
#	Issue	Evidence
H1	Massive Cross-File Duplication	P1/P2/P3 templates appear identically in both 01-skill-anatomy.md and 03-three-patterns.md (~160 lines duplicated)
H2	"Only name+description" Repeated 6x	File 02 restates its core rule 6 separate times
H3	No Real Worked Examples	Every template uses [placeholder] syntax across all 9 files
H4	Copy-Paste Errors	03-three-patterns.md:275-276 shows skill integrating with itself
H5	Off-Topic Content	File 02 has "HiveMind-Specific Notes" (anatomy content in frontmatter spec file)
🟡 MEDIUM (Limits Usefulness)
#	Issue	Evidence
M1	Audit Checklist Too Thin	audit-checklist.md is only 32 lines; needs 3-5× expansion
M2	Audit JSON Template Inadequate	skill-audit.json is only 15 lines; doesn't map to 9-phase workflow
M3	No Token Budget Awareness	Files specify line counts but never discuss token impact
M4	No Loading Sequence Guidance	Files numbered 01-08 but content doesn't build sequentially
M5	No Migration/Debugging Guidance	No file addresses evolving skills or debugging trigger failures
Reference File Quality Scores
File	Score	Key Issue
01-skill-anatomy.md	6.5/10	Duplication with 03
02-frontmatter-standard.md	5.5/10	6× repetition, off-topic content
03-three-patterns.md	5.0/10	Copy-paste of 01, self-integration error
04-tdd-workflow.md	4.5/10	Contradicts file 02
05-skill-quality-matrix.md	8.0/10	Best file — needs minor fixes
06-agent-activation.md	MISSING	Dead links in 07, 08
07-iterative-refinement.md	5.0/10	Aspirational, no concrete examples
08-conflict-detection.md	7.0/10	Duplicates 05's matrix
sw-04-tdd-workflow.md	3.0/10	100% duplicate of 04
audit-checklist.md	4.0/10	Only 32 lines
---
2. DESIRED STATE — User's Vision
From the two requirements documents, the rebuilt skill must:
Core Requirements
1. Agent Skills Spec-Compliant — YAML frontmatter (name, description only), directory structure, naming
2. Progressive Disclosure — 3 tiers: metadata (~100 tokens) → instructions (<5000 tokens) → references (on demand)
3. Two Skill Type Taxonomy — "how-to-process" (horizontal breadth) vs "how-to-implement" (routed depth)
4. Eval-Driven Lifecycle — evals.json, workspace structure, grading, benchmark aggregation, iteration loop
5. Script Authoring for Agents — Non-interactive, self-contained, multi-language, structured output
6. Description Optimization — 20-query trigger testing, train/validation splits, overfitting avoidance
7. Anti-Deception Guardrails — Observation limits, pattern/anti-pattern pairs, shadowing, context boundaries
8. Gatekeeping Intelligence — Domain boundaries, refusal capability, consultant role outside domain
9. Cross-Platform Determinism — 2026 agentic ecosystem awareness, portable patterns
10. Cross-Package Bridgeability — Connects to agent, tool, command, and workflow authoring skill packages
Success Metrics
Metric	Target
SKILL.md line count	<500 lines
Description trigger rate	>50% on should-trigger queries
Eval pass rate	Measurable improvement between iterations
Validation compliance	Passes skills-ref validate
Cross-platform portability	No breaking on platform changes
---
3. GAP ANALYSIS — Critical Path
CURRENT STATE                          DESIRED STATE
─────────────                          ─────────────
282-line flat SKILL.md        →       <500-line routed SKILL.md
Self-violating frontmatter    →       Spec-compliant frontmatter
9 reference files (broken)    →       Restructured reference tree
1 template (15 lines)         →       Eval infrastructure (scripts + templates)
No worked examples            →       Concrete examples per pattern
Broken internal links         →       Complete cross-reference network
Massive duplication           →       Deduplicated, single-source-of-truth
Contradictory guidance        →       Internally consistent
Platform-specific only        →       Cross-platform deterministic
Single flat package           →       Bridgeable to other meta-packages
---
4. PROPOSED NEW ARCHITECTURE
Directory Structure
use-hivemind-skill-authoring/
├── SKILL.md                              # <500 lines, routing hub
│   ├── Frontmatter (spec-compliant)
│   ├── Overview + Phase Gate System
│   ├── Pattern Selection Guide (inline)
│   ├── Quick Reference Tables
│   └── Reference Map (what to load when)
│
├── references/
│   ├── 01-skill-anatomy.md               # Structure + naming (deduplicated)
│   ├── 02-frontmatter-spec.md            # ONLY frontmatter rules (deduplicated)
│   ├── 03-skill-patterns.md              # P1/P2/P3 + decision tree (deduplicated)
│   ├── 04-tdd-workflow.md                # RED→GREEN→REFACTOR (FIXED)
│   ├── 05-quality-matrix.md              # Scoring rubric (best file, minor fixes)
│   ├── 06-agent-activation.md            # NEW: How skills activate in agents
│   ├── 07-iterative-refinement.md        # Eval-driven improvement (rewritten)
│   ├── 08-conflict-detection.md          # Overlap resolution (deduplicated)
│   ├── 09-script-authoring.md            # NEW: Agentic script design
│   ├── 10-description-optimization.md    # NEW: Trigger testing methodology
│   ├── 11-anti-deception.md              # NEW: Guardrails + gatekeeping
│   └── 12-cross-platform-determinism.md  # NEW: 2026 ecosystem patterns
│
├── templates/
│   ├── skill-audit.json                  # Expanded: maps to all phases
│   ├── evals.json                        # NEW: Eval case template
│   ├── grading-rubric.json               # NEW: Scoring template
│   └── skill-scaffold/                   # NEW: Starter directory template
│       └── SKILL.md
│
├── scripts/                              # NEW: Portable tooling
│   ├── validate-skill.sh                 # Validate frontmatter + structure
│   └── check-overlaps.sh                # Detect content duplication
│
└── examples/                             # NEW: Worked examples
    ├── example-p1-simple.md              # Concrete P1 skill creation
    ├── example-p2-technique.md           # Concrete P2 skill creation
    └── example-p3-routed.md              # Concrete P3 skill creation
Content Ownership (Single Source of Truth)
Topic	Owner File	Other Files Say
Frontmatter fields	02-frontmatter-spec.md	"See 02 for spec"
P1/P2/P3 templates	03-skill-patterns.md	"See 03 for patterns"
Directory structure	01-skill-anatomy.md	"See 01 for structure"
Quality scoring	05-quality-matrix.md	"See 05 for rubric"
TDD workflow	04-tdd-workflow.md	FIXED: no forbidden fields
---
5. IMPLEMENTATION PHASES
Phase	Focus	Deliverable
P1: Fix Criticals	Resolve C1-C4	Contradiction fixed, duplicate removed, dead links resolved
P2: Deduplicate	Resolve H1-H5	Single source of truth per topic, remove ~300 lines of duplication
P3: Rebuild SKILL.md	New routing hub	Spec-compliant frontmatter, phase gates, pattern guide, reference map
P4: Expand References	New files 06, 09-12	Agent activation, script authoring, description optimization, anti-deception, cross-platform
P5: Add Infrastructure	Templates + scripts + examples	evals.json, grading rubric, validation scripts, 3 worked examples
P6: Validate	TDD cycle	Test against real scenarios, measure trigger rate
---
⚠️ CHECKPOINT: This is the framing skeleton. Before I proceed to Phase 2 (Deep Audit) and Phase 3 (Architecture Design), I need your confirmation on:
1. Architecture direction — Is this the right structure? Too many reference files? Too few?
2. Naming convention — Keep use-hivemind-skill-authoring or adopt spec naming like skill-authoring?
3. Scope — Start with P1-P3 (fix + deduplicate + rebuild) in this session, or attempt full P1-P6?
4. Priority tension — The 5 tensions identified between your requirements documents — which resolution do you prefer for each?
Shall I proceed, or do you want to adjust the roadmap first?