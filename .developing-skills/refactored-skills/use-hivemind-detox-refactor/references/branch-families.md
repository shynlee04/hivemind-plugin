# Branch Families

## Center Rule
- `use-hivemind-detox-refactor` is the center.
- It selects branch families.
- It does not absorb their deep mechanics.

## 1. Context Family
- Purpose: establish trust, verify authority, detect rot, and close with evidence-based verification.
- Current roots:
  - `context-intelligence-entry`
  - `context-entry-verify`
- Router entry conditions:
  - authority conflict
  - drift uncertainty
  - completion claims without proof
  - contaminated entry behavior
- Expected outputs:
  - investigation report
  - verification handoff
  - stabilization report

## 2. Delegation Family
- Purpose: define bounded partitioning, role envelopes, and deterministic handoff rules.
- Current roots:
  - `hivemind-delegation-protocol`
- Router entry conditions:
  - multi-slice work
  - swarm planning
  - need for explicit handoff packets
  - need to choose sequential vs parallel safely
- Expected outputs:
  - partition plan
  - bounded delegation packet
  - handoff brief

## 3. Git-Memory Family
- Purpose: recover continuity through commit history, branch awareness, and retrieval anchors.
- Current roots:
  - `git-continuity-memory`
- Router entry conditions:
  - incident spans prior sessions
  - trust in history affects present routing
  - continuity output is needed before recovery or stabilization
- Expected outputs:
  - continuity manifest
  - knowledge synthesis
  - recovery anchors

## 4. Codemap Family
- Purpose: perform whole-codebase mapping, high/low scan passes, seam discovery, and structural concern slicing.
- Current roots:
  - `hivemind-codemap`
- Router entry conditions:
  - architecture fragmentation
  - hidden overlap between concerns
  - need for repo-wide extraction before choosing refactor
  - need for high-level then low-level scan lattice
- Expected outputs:
  - scan plan
  - codemap scan state
  - detox assessment report
  - seam inventory
  - scan synthesis
  - optional repomix extraction report

## 5. System-Debug Family
- Purpose: integrate reproducibility, narrowing, containment, and debug-to-refactor transition inside the restoration path.
- Current roots:
  - `hivemind-system-debug`
- Router entry conditions:
  - unresolved breakage
  - failing verification with unclear cause
  - rollback or containment needed before refactor
  - evidence gap between symptoms and repair plan
- Expected outputs:
  - debug stage report
  - containment notes
  - refactor readiness recommendation

## Routing Priority
1. `context` when trust or authority is unclear
2. `git-memory` when continuity quality changes present decisions
3. `codemap` when structure is unclear
4. `system-debug` when breakage is unresolved
5. `delegation` whenever the chosen path must be partitioned

## Family Combination Rules
- `context + delegation`: safe default for polluted multi-step work
- `git-memory + codemap`: use when history and structure both matter
- `codemap + system-debug`: use when structural overlap masks root cause
- `delegation + codemap + system-debug`: allowed only after Stage 4 partitioning

## Promotion Rule
- Do not promote the center until these families each own their deep references, templates, tests, and execution guidance.
