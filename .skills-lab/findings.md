# Locked Decisions: use-authoring-skills Rebuild

**Extracted:** 2026-04-03 from session `ses_2b05` (9,990 lines)
**Method:** 3 parallel wave agents mined session history for every decision, tension resolution, correction, and methodology constraint
**Status:** CANONICAL — overrides any conflicting claims in other documents

---

## Frontmatter Fields (LOCKED)

| Field | Required | Decision | User Quote |
|-------|----------|----------|------------|
| `name` | YES | Max 64 chars, lowercase + hyphens, matches directory | Spec constraint |
| `description` | YES | Max 1024 chars, trigger-focused | Spec constraint |
| `metadata` | Optional USEFUL | Key-value for discovery/stacking/pairing | "these are the fields that should put in if known" (line 5503) |
| `allowed-tools` | Optional USEFUL | Space-delimited pre-approved tools | "allowed-tools No Space-delimited list of pre-approved tools" (line 5503) |
| `license` | Optional RARELY USEFUL | Short name or file reference | Allowed by spec |
| `compatibility` | **BANNED** | User called it "nonsense" | "what important not include includ ecompatibility which os senselense -????" (line 5503) |

---

## Tension Resolutions (LOCKED)

### T1: Coverage Wins Over Concision
> "as long as when proceeding expert-knowledge of implement something the agent using the skill must not having troubl researching and investigate depth because when this is used, all sorts of users of all majors and walks can be expected to use the skill authoring" (line 4380)

**Locked:** Coverage wins. Agents must NOT struggle to find depth. Users of all backgrounds will use this skill.

### T2: Keep `use-authoring-skills` Naming
**Locked:** Retain directory name. Make frontmatter spec-compliant. No rename.

### T3: "Adaptive with Constraints" — NOT "Flexibility"
> "this must be by case because determinism of various level, and I don't think flexibility exist in my framework - it must be adaptive with constraints (by giving templates, examples, expectated cases, how to handle variants, and fallbacks, etc)" (line 4380)

**Locked:** By case, with templates, examples, expected cases, variant handling, fallbacks. The word "flexibility" does NOT exist in user's framework.

### T4: Programmatic Measurable Gates
> "granularly approach following hieararchy with incremental integration check points to ensure 1 all passed before the next - and for gate = programatic and measurable metrics, something that are boolean, something like this (and can be integrated to something like this https://skills.sh/andrelandgraf/fullstackrecipes/ralph-loop" (line 4380)

**Locked:** Granular hierarchy. Incremental checkpoints. ALL must pass before next. Gates are programmatic (boolean/scoring). Compatible with ralph-loop pattern.

### T5: UNIVERSAL — Not a Question
> "This should not be asked!! this is SKILL and it is to facilitate all end-users kind of projects, and since it is then stacked with other OpenCode concepts so that OpenCode is the closet measurements - but that's said other Coding Agentic platforms like Claude Code, Anti gravity , Codex, Cursor etc should not have any problem - just remember to replace CLAUDE = AGENT, CLAUDE.md = AGENTS.md when referring to these 2 terminologies" (line 4380)

**Locked:** Universal platform. "Agent" not "Claude". "AGENTS.md" not "CLAUDE.md". OpenCode is closest measurement but ALL platforms must work.

---

## Scope Decision

### D1: Align with agentskills.io Spec
> "if it is allowed, it should load well with other so let them in to latter paired and stacked or support with grep, and glob of agents easier" (line 4380)

**Locked:** Allow spec-optional fields for grep/glob discovery and stacking. OVERRIDDEN for `compatibility` — see frontmatter table above.

### D2: Incremental Waves with Complete Nodes
> "B (but should them be making complete nodes and cycles of workflows so that conducting testing and correct mor eeasily and keep track of your planning and delegation of synthesis must output knowledge documents)" (line 4380)

**Locked:** Each wave produces COMPLETE workflow nodes. Every delegation outputs knowledge documents. Testing must be easy per wave.

### D4: Explicit Skill Loads Required
> "ALL load with explicit skill references" (line 4400-4402)

**Locked:** SKILL.md must reference these skills:
- Creating/improving: `skill-creator`, `skill-development`, `writing-skills`
- Audit/refactor: `skill-judge`, `skill-review`
- Memory: `gcc`
- Planning: `planning-with-files`

---

## User Corrections (Locked as Hard Rules)

### RC-Archive: NEVER Delete, ALWAYS Archive
> "DO NOT REMOVE SKILLS THAT ARE REFACTORING - ALWAYS MOVE THE ON-GOING TO ARCHIVE, ONLY ONCE THE NEW PACK CRAETED AND FULLY FUNCTIONAL THE OLD ARE REMOVED" (line 6142)

**Locked:** Move to `.skills-lab/.archive/YYYY-MM-DD-<topic>/`. Only remove after new pack is fully functional and user confirms.

### RC-Commit: Record and Commit ALL Changes
> "YOU ASKED ALOT MAKE CHANGES BUT NOT RECORDED, NOT COMMIT, CHANGES EVERYTHING IN THIS FRONT USER FACING CONTEXT, NOW YOU DID NOT FUCKING KNOW WHAT HAVE HAPPEDN WHAT HAVE CHANGED WHAT MUST DO NEXT" (line 9672)

**Locked:** ALL changes MUST be committed. If it's not in git, it doesn't exist.

### RC-Coordinator: NEVER Execute Directly
> "set the fucking constraint that never work on this main front know your role do not execute you cantt pollute this any more" (line 8574)

**Locked:** Coordinator = PLAN + DELEGATE, NOT execute. Must not pollute skill files directly.

### RC-WriteToDisk: Every Turn
> "YOU MUST AWARE EVERY TURN YOU LOOSE THE FUCK OUT OF COHERENCE YOU MUST HAVE THE WRITE-TO-DISK AND THE HIERARCHICAL STRATEGY TO APPROACH THE WHOLE THIS" (line 6142)

**Locked:** Write to disk every turn. Coherence is lost by default — only defense is persistent write-to-disk + hierarchical strategy.

---

## Methodology Constraints (from Initial Prompt)

### M1: Frame Skeleton First
> "Establish skeleton: Map the high-level architecture, directory structure, and major components. Identify nodes: Locate key actors, services, modules, and entry points. Map branches: Trace relationships, dependencies, and interaction patterns. Acknowledge hypotheses. Rerouting awareness." (lines 52-60)

### M2: Hierarchical Thinking (MARKED MANDATORY)
> "Cause-effect understanding: Every decision traces back to reasoning. Compare and contrast: Weigh importance. Importance ranking: Distinguish critical from peripheral. Structural relationships: Understand parent-child, dependency, ownership." (lines 62-67)

### M3: Strategic Traversal
> "Sequenced exploration. Conditional logic. Time-machine awareness. Actor tracing. Context network mapping." (lines 69-75)

### M4: Cyclical Judgment
> "Never judge on first encounter; return to entities multiple times. Real-life use case grounding. Efficiency recognition. Prejudice avoidance. Maturity principle: Only draw conclusions after repeated cycles." (lines 77-84)

### M5: Subagent Orchestration
> "Batch planning: Always plan in batches and cycles. Never single-round execution. Extreme iteration. Sequential preference over parallel. Disk-based synthesis: ALL outputs written to disk. Named exports. Consumable format. Chain continuity." (lines 90-102)

### M6: Subagent Window Limits
> "not launching one and asking to read more than 3 domains of content nor greater than 5k of LOC nor Text" (line 28)

**Locked:** Max 3 domains, max 5k LOC/text per subagent.

### M7: Selective Deep Improvement
> "improve on the based content, so that these are improved on the advanced concepts, the reasoning when selected, improvement of the AI iterations → pay attention to selective, improvement, not the mere grep, glob, surface reading; nor one time completion" (line 28)

**Locked:** No surface-level grep-and-shrink. Deep, selective, multi-cycle improvement.

---

## Strategic Directives (5 Directives from User)

### SD1: Iterative Case Handling + Progressive Disclosure
> "Build a system capable of processing conditional returns and real-world test trials through multiple phases. Implement progressive disclosure mechanisms that allow agents to reveal information and capabilities strategically over time rather than all at once." (line 3082)

### SD2: Living Master Plan
> "Create an automated mechanism to output a master plan that can be iterated upon and adjusted throughout execution. This plan must serve as a living document that guides ongoing operations and enables the system to adapt based on accumulated results and discoveries." (line 3084)

### SD3: Hierarchical Planning Infrastructure
> "Develop a scripted, hierarchical pathing system that: Creates structured domain hierarchies; Establishes clear session boundaries and relationships; Enables subagents to operate within defined scopes while maintaining awareness of the larger system context; Provides path documentation so returning users can quickly orient themselves." (line 3086)

### SD4: Knowledge Synthesis + Persistence
> "Implement mechanisms for both the main agent and all subagents to output synthesized knowledge that: Captures learned insights and decisions; Maintains state across sessions; Creates traceable knowledge graphs that preserve the reasoning path." (line 3092)

### SD5: Strategic Breadth-Depth Resolution
> "Ensure the system can dynamically balance exploration (breadth) with exploitation (depth), strategically allocating resources based on task requirements, identified constraints, and emerging patterns." (line 3097)

---

## Architecture Decisions

### Target Structure (12 ref files)
```
use-authoring-skills/
├── SKILL.md                          # Routing hub (<500 lines)
├── references/
│   ├── 01-skill-anatomy.md           # File structure + naming
│   ├── 02-frontmatter-spec.md        # Frontmatter schema
│   ├── 03-skill-patterns.md          # P1/P2/P3 definitions
│   ├── 04-tdd-workflow.md            # TDD methodology
│   ├── 05-quality-matrix.md          # Quality evaluation + release
│   ├── 06-cross-platform-activation.md  # NEW
│   ├── 07-iterative-refinement.md    # Improvement + memory
│   ├── 08-conflict-detection.md      # Cross-pack coordination
│   ├── 09-script-authoring.md        # NEW
│   ├── 10-eval-lifecycle.md          # NEW
│   ├── 11-description-optimization.md # NEW
│   └── 12-anti-deception.md          # NEW
├── templates/                        # evals.json, grading-rubric, benchmark, trigger-queries, skill-scaffold
├── scripts/                          # validate-skill.sh, check-overlaps.sh, test-triggers.sh
└── examples/                         # P1, P2, P3 worked walkthroughs
```

### Ownership Model (Single Source of Truth)
| Topic | OWNER | Others Cross-Ref |
|-------|-------|-----------------|
| File structure + naming | 01 | "See 01" |
| Frontmatter schema | 02 | "See 02" |
| Pattern definitions (P1/P2/P3) | 03 | "See 03" |
| TDD methodology | 04 | "See 04" |
| Quality evaluation | 05 | "See 05" |
| Cross-platform activation | 06 | "See 06" |
| Iterative refinement | 07 | "See 07" |
| Cross-pack coordination | 08 | "See 08" |
| Script authoring | 09 | "See 09" |
| Eval-driven development | 10 | "See 10" |
| Description optimization | 11 | "See 11" |
| Anti-deception + gatekeeping | 12 | "See 12" |

### SKILL.md Body Structure (~400 lines)
- Overview (20 lines)
- Phase Gate System (40 lines)
- Pattern Selection Guide (50 lines)
- Quick Reference Tables (60 lines)
- TDD Workflow Summary (30 lines)
- Reference Map with Progressive Disclosure (80 lines)
- Templates & Scripts Index (30 lines)
- Anti-Patterns (40 lines)
- Cross-Package Integration (30 lines)
- Gatekeeping (20 lines)

### Success Criteria
| Criterion | Measure | Target |
|-----------|---------|--------|
| SKILL.md line count | `wc -l` | < 500 |
| Frontmatter compliance | Only name + description | Pass |
| Cross-file duplication | Shared line count | < 5% |
| Spec coverage | TAB requirements met | > 85% |
| Reference file count | Total | 12 |
| Dead links | Refs to non-existent files | 0 |
| Contradictions | Opposing rules | 0 |

---

## Terminology Mandate
- "Claude" → "Agent" (AI entity)
- "CLAUDE.md" → "AGENTS.md" (config file)
- Universal — not platform-specific
- OpenCode is closest measurement
- All agentic platforms must work (Claude Code, Codex, Cursor, etc.)
