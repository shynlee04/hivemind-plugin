---
sessionID: ses_1e7b01e5bffeOLdJ0dndclG3J8
created: 2026-05-11T18:32:40.457Z
updated: 2026-05-11T18:32:40.457Z
parentSessionID: null
delegationDepth: 0
children: []
continuityIndex: session-continuity.json
status: active
---

## USER (turn 1)

<objective>
Clarify phase requirements through structured Socratic questioning with quantitative ambiguity scoring.

**Position in workflow:** `spec-phase → discuss-phase → plan-phase → execute-phase → verify`

**How it works:**
1. Load phase context (PROJECT.md, REQUIREMENTS.md, ROADMAP.md, STATE.md)
2. Scout the codebase — understand current state before asking questions
3. Run Socratic interview loop (up to 6 rounds, rotating perspectives)
4. Score ambiguity across 4 weighted dimensions after each round
5. Gate: ambiguity ≤ 0.20 AND all dimensions meet minimums → write SPEC.md
6. Commit SPEC.md — discuss-phase picks it up automatically on next run

**Output:** `{phase_dir}/{padded_phase}-SPEC.md` — falsifiable requirements that lock "what/why" before discuss-phase handles "how"
</objective>

<execution_context>
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/spec-phase.md
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/spec.md
</execution_context>

<runtime_note>
**Copilot (VS Code):** Use `vscode_askquestions` wherever this workflow calls `question`. They are equivalent.
</runtime_note>

<context>
Phase number: <by inspecting and learning over the current flaws of this configf plane implementation surface your assumptions over the WHAT and WHAT Wrong before, and knowing the life cycles of these schema fields are controlling toward the downstream consumers, through which mechanism, and the user pipeline toward how these contribute to which features etc to then form the correct questions over the spec>  (required)

**Flags:**
- `--auto` — Skip interactive questions; the agent selects recommended defaults and writes SPEC.md
- `--text` — Use plain-text numbered lists instead of TUI menus (required for `/rc` remote sessions)

Context files are resolved in-workflow using `init phase-op`.
</context>

<process>
Execute end-to-end.

**MANDATORY:** Read the workflow file BEFORE taking any action. The workflow contains the complete step-by-step process including the Socratic interview loop, ambiguity scoring gate, and SPEC.md generation. Do not improvise from the objective summary above.
</process>

<success_criteria>
- Codebase scouted for current state before questioning begins
- All 4 ambiguity dimensions scored after each interview round
- Gate passed: ambiguity ≤ 0.20 AND all dimension minimums met
- SPEC.md written with falsifiable requirements, explicit boundaries, and acceptance criteria
- SPEC.md committed atomically
- User knows they can now run /gsd-discuss-phase which will load SPEC.md automatically
</success_criteria>Called the Read tool with the following input: {"filePath":"/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/spec-phase.md"}<path>/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/spec-phase.md</path>
<type>file</type>
<content>
1: <purpose>
2: Clarify WHAT a phase delivers through a Socratic interview loop with quantitative ambiguity scoring.
3: Produces a SPEC.md with falsifiable requirements that discuss-phase treats as locked decisions.
4: 
5: This workflow handles "what" and "why" — discuss-phase handles "how".
6: </purpose>
7: 
8: <ambiguity_model>
9: Score each dimension 0.0 (completely unclear) to 1.0 (crystal clear):
10: 
11: | Dimension         | Weight | Minimum | What it measures                                  |
12: |-------------------|--------|---------|---------------------------------------------------|
13: | Goal Clarity      | 35%    | 0.75    | Is the outcome specific and measurable?           |
14: | Boundary Clarity  | 25%    | 0.70    | What's in scope vs out of scope?                  |
15: | Constraint Clarity| 20%    | 0.65    | Performance, compatibility, data requirements?    |
16: | Acceptance Criteria| 20%   | 0.70    | How do we know it's done?                         |
17: 
18: **Ambiguity score** = 1.0 − (0.35×goal + 0.25×boundary + 0.20×constraint + 0.20×acceptance)
19: 
20: **Gate:** ambiguity ≤ 0.20 AND all dimensions ≥ their minimums → ready to write SPEC.md.
21: 
22: A score of 0.20 means 80% weighted clarity — enough precision that the planner won't silently make wrong assumptions.
23: </ambiguity_model>
24: 
25: <interview_perspectives>
26: Rotate through these perspectives — each naturally surfaces different blindspots:
27: 
28: **Researcher (rounds 1–2):** Ground the discussion in current reality.
29: - "What exists in the codebase today related to this phase?"
30: - "What's the delta between today and the target state?"
31: - "What triggers this work — what's broken or missing?"
32: 
33: **Simplifier (round 2):** Surface minimum viable scope.
34: - "What's the simplest version that solves the core problem?"
35: - "If you had to cut 50%, what's the irreducible core?"
36: - "What would make this phase a success even without the nice-to-haves?"
37: 
38: **Boundary Keeper (round 3):** Lock the perimeter.
39: - "What explicitly will NOT be done in this phase?"
40: - "What adjacent problems is it tempting to solve but shouldn't?"
41: - "What does 'done' look like — what's the final deliverable?"
42: 
43: **Failure Analyst (round 4):** Find the edge cases that invalidate requirements.
44: - "What's the worst thing that could go wrong if we get the requirements wrong?"
45: - "What does a broken version of this look like?"
46: - "What would cause a verifier to reject the output?"
47: 
48: **Seed Closer (rounds 5–6):** Lock remaining undecided territory.
49: - "We have [dimension] at [score] — what would make it completely clear?"
50: - "The remaining ambiguity is in [area] — can we make a decision now?"
51: - "Is there anything you'd regret not specifying before planning starts?"
52: </interview_perspectives>
53: 
54: <process>
55: 
56: ## Step 1: Initialize
57: 
58: ```bash
59: INIT=$(node "/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/gsd-tools.cjs" init phase-op "${PHASE}")
60: if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
61: ```
62: 
63: Parse JSON for: `phase_found`, `phase_dir`, `phase_number`, `phase_name`, `phase_slug`, `padded_phase`, `state_path`, `requirements_path`, `roadmap_path`, `planning_path`, `response_language`, `commit_docs`.
64: 
65: **If `response_language` is set:** All user-facing text in this workflow MUST be in `{response_language}`. Technical terms, code, and file paths stay in English.
66: 
67: **If `phase_found` is false:**
68: ```
69: Phase [X] not found in roadmap.
70: Use /gsd-progress to see available phases.
71: ```
72: Exit.
73: 
74: **Check for existing SPEC.md:**
75: ```bash
76: ls ${phase_dir}/*-SPEC.md 2>/dev/null | grep -v AI-SPEC | head -1 || true
77: ```
78: 
79: If SPEC.md already exists:
80: 
81: **If `--auto`:** Auto-select "Update it". Log: `[auto] SPEC.md exists — updating.`
82: 
83: **Otherwise:** Use question:
84: - header: "Spec"
85: - question: "Phase [X] already has a SPEC.md. What do you want to do?"
86: - options:
87:   - "Update it" — Revise and re-score
88:   - "View it" — Show current spec
89:   - "Skip" — Exit (use existing spec as-is)
90: 
91: If "View": Display SPEC.md, then offer Update/Skip.
92: If "Skip": Exit with message: "Existing SPEC.md unchanged. Run /gsd-discuss-phase [X] to continue."
93: If "Update": Load existing SPEC.md, continue to Step 3.
94: 
95: ## Step 2: Scout Codebase
96: 
97: **Read these files before any questions:**
98: - `{requirements_path}` — Project requirements
99: - `{state_path}` — Decisions already made, current phase, blockers
100: - ROADMAP.md phase entry — Phase description, goals, canonical refs
101: 
102: **Grep the codebase** for code/files relevant to this phase goal. Look for:
103: - Existing implementations of similar functionality
104: - Integration points where new code will connect
105: - Test coverage gaps relevant to the phase
106: - Prior phase artifacts (SUMMARY.md, VERIFICATION.md) that inform current state
107: 
108: **Synthesize current state** — the grounded baseline for the interview:
109: - What exists today related to this phase
110: - The gap between current state and the phase goal
111: - The primary deliverable: what file/behavior/capability does NOT exist yet?
112: 
113: Confirm your current state synthesis internally. Do not present it to the user yet — you'll use it to ask precise, grounded questions.
114: 
115: ## Step 3: First Ambiguity Assessment
116: 
117: Before questioning begins, score the phase's current ambiguity based only on what ROADMAP.md and REQUIREMENTS.md say:
118: 
119: ```
120: Goal Clarity:       [score 0.0–1.0]
121: Boundary Clarity:   [score 0.0–1.0]
122: Constraint Clarity: [score 0.0–1.0]
123: Acceptance Criteria:[score 0.0–1.0]
124: 
125: Ambiguity: [score] ([calculate])
126: ```
127: 
128: **If `--auto` and initial ambiguity already ≤ 0.20 with all minimums met:** Skip interview — derive SPEC.md directly from roadmap + requirements. Log: `[auto] Phase requirements are already sufficiently clear — generating SPEC.md from existing context.` Jump to Step 6.
129: 
130: **Otherwise:** Continue to Step 4.
131: 
132: ## Step 4: Socratic Interview Loop
133: 
134: **Max 6 rounds.** Each round: 2–3 questions max. End round after user responds.
135: 
136: **Round selection by perspective:**
137: - Round 1: Researcher
138: - Round 2: Researcher + Simplifier
139: - Round 3: Boundary Keeper
140: - Round 4: Failure Analyst
141: - Rounds 5–6: Seed Closer (focus on lowest-scoring dimensions)
142: 
143: **After each round:**
144: 1. Update all 4 dimension scores from the user's answers
145: 2. Calculate new ambiguity score
146: 3. Display the updated scoring:
147: 
148: ```
149: After round [N]:
150:   Goal Clarity:       [score] (min 0.75) [✓ or ↑ needed]
151:   Boundary Clarity:   [score] (min 0.70) [✓ or ↑ needed]
152:   Constraint Clarity: [score] (min 0.65) [✓ or ↑ needed]
153:   Acceptance Criteria:[score] (min 0.70) [✓ or ↑ needed]
154:   Ambiguity: [score] (gate: ≤ 0.20)
155: ```
156: 
157: **Gate check after each round:**
158: 
159: If gate passes (ambiguity ≤ 0.20 AND all minimums met):
160: 
161: **If `--auto`:** Jump to Step 6.
162: 
163: **Otherwise:** question:
164: - header: "Spec Gate Passed"
165: - question: "Ambiguity is [score] — requirements are clear enough to write SPEC.md. Proceed?"
166: - options:
167:   - "Yes — write SPEC.md" → Jump to Step 6
168:   - "One more round" → Continue interview
169:   - "Done talking — write it" → Jump to Step 6
170: 
171: **If max rounds reached (6) and gate not passed:**
172: 
173: **If `--auto`:** Write SPEC.md anyway — flag unresolved dimensions. Log: `[auto] Max rounds reached. Writing SPEC.md with [N] dimensions below minimum. Planner will need to treat these as assumptions.`
174: 
175: **Otherwise:** question:
176: - header: "Max Rounds"
177: - question: "After 6 rounds, ambiguity is [score]. [List dimensions still below minimum.] What would you like to do?"
178: - options:
179:   - "Write SPEC.md anyway — flag gaps" → Write SPEC.md, mark unresolved dimensions in Ambiguity Report
180:   - "Keep talking" → Continue (no round limit from here)
181:   - "Abandon" → Exit without writing
182: 
183: **If `--auto` mode throughout:** Replace all question calls above with the agent's recommended choice. Log decisions inline. Apply the same logic as `--auto` in discuss-phase.
184: 
185: **Text mode (`workflow.text_mode: true` or `--text` flag):** Use plain-text numbered lists instead of question TUI menus.
186: 
187: ## Step 5: (covered inline — ambiguity scoring is per-round)
188: 
189: ## Step 6: Generate SPEC.md
190: 
191: Use the SPEC.md template from @/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/spec.md.
192: 
193: **Requirements for every requirement entry:**
194: - One specific, testable statement
195: - Current state (what exists now)
196: - Target state (what it should become)
197: - Acceptance criterion (how to verify it was met)
198: 
199: **Vague requirements are rejected:**
200: - ✗ "The system should be fast"
201: - ✗ "Improve user experience"
202: - ✓ "API endpoint responds in < 200ms at p95 under 100 concurrent requests"
203: - ✓ "CLI command exits with code 1 and prints to stderr on invalid input"
204: 
205: **Count requirements.** The display in discuss-phase reads: "Found SPEC.md — {N} requirements locked."
206: 
207: **Boundaries must be explicit lists:**
208: - "In scope" — what this phase produces
209: - "Out of scope" — what it explicitly does NOT do (with brief reasoning)
210: 
211: **Acceptance criteria must be pass/fail checkboxes** — no "should feel good" or "looks reasonable."
212: 
213: **If any dimensions are below minimum**, mark them in the Ambiguity Report with: `⚠ Below minimum — planner must treat as assumption`.
214: 
215: Write to: `{phase_dir}/{padded_phase}-SPEC.md`
216: 
217: ## Step 7: Commit
218: 
219: ```bash
220: git add "${phase_dir}/${padded_phase}-SPEC.md"
221: git commit -m "spec(phase-${phase_number}): add SPEC.md for ${phase_name} — ${requirement_count} requirements (#2213)"
222: ```
223: 
224: If `commit_docs` is false: Skip commit. Note that SPEC.md was written but not committed.
225: 
226: ## Step 8: Wrap Up
227: 
228: Display:
229: 
230: ```
231: SPEC.md written — {N} requirements locked.
232: 
233:   Phase {X}: {name}
234:   Ambiguity: {final_score} (gate: ≤ 0.20)
235: 
236: Next: /gsd-discuss-phase {X}
237:   discuss-phase will detect SPEC.md and focus on implementation decisions only.
238: ```
239: 
240: </process>
241: 
242: <critical_rules>
243: - Every requirement MUST have current state, target state, and acceptance criterion
244: - Boundaries section is MANDATORY — cannot be empty
245: - "In scope" and "Out of scope" must be explicit lists, not narrative prose
246: - Acceptance criteria must be pass/fail — no subjective criteria
247: - SPEC.md is NEVER written if the user selects "Abandon"
248: - Do NOT ask about HOW to implement — that is discuss-phase territory
249: - Scout the codebase BEFORE the first question — grounded questions only
250: - Max 2–3 questions per round — do not frontload all questions at once
251: </critical_rules>
252: 
253: <success_criteria>
254: - Codebase scouted and current state understood before questioning
255: - All 4 dimensions scored after every round
256: - Gate passed OR user explicitly chose to write despite gaps
257: - SPEC.md contains only falsifiable requirements
258: - Boundaries are explicit (in scope / out of scope with reasoning)
259: - Acceptance criteria are pass/fail checkboxes
260: - SPEC.md committed atomically (when commit_docs is true)
261: - User directed to /gsd-discuss-phase as next step
262: </success_criteria>

(End of file - total 262 lines)
</content>

<system-reminder>
Instructions from: /Users/apple/hivemind-plugin-private/.opencode/AGENTS.md
# Soft Meta-Concept Sector Guidance


## NON-NEGOTIABLE RULES

- all tech, stack, SDK implementation, audit, gatekeeping  must follow deep investigation - stack research ;skills are for references not for interfaces validation; "interfaces, patterns, methods, api, signatures of specs etc" must validate against the correct versions at package.json - **MUST VALIDATE AGAINST ONLINE RESOURCES AS FOR MCP SERVER TOOLS ACTUAL FETCH** - valid and evidences with Context7, Deepwiki, Gitmcp, Github repo, Exa **AND Repomix for accurate specific patterns** etc, official - loading references from skills of stacks are outdated, as so reading code in the codebase can be polluted as many implementations are not functioning and broken. DO NOT MAKE ASSUMPTIONS OF THE STACK REPO LINKs - **EXTREMELY IMPORNTANT:** Uses of Context7, Deepwiki, Gitmcp, Github, Exa, Repomix are enforced when researching, planning, and implementing - these MUST Comply with all the **Github and Npm links that up-to-date with versiosn and NOT A PRODUCT OF MAKING UP LINKS** >  glob, list this to check these links `.hivemind/STACKS-REFERENCES.md`

- any thing under .opencode/ are not shipped-with, they are symlinks or project toolings 

- all orchestrator, coordinator, conductor agents belonging to l0, and l1 classifications MUST FOCUS ON THE DELEGATIONS - NEVER Implement the tasks yourself - when delegating DO NOT SHOW THE SPECIALIST WHAT AND HOW TO IMPLEMENT - Show HOW TO PROCESS, WHAT TO EXPECT AS RESULTS, SETTING CONSTRAINTS AND BOUNDARIES, INDICATION OF CLEAR SUCCESS METRICS

- design patterns and must be obeyed strictly according to the architecture of the project.

- atomic git commit for context preservation.

- context git commit for both code implementation, docs, planning, researching, gatekeeping, verification artifacts - do not ask if commit needed

- AGENTS.md must be routinely updated - after each cycle, each batch of implementation.

- AGENTS.md are nested under dirs and subdirs, beware when maintaining them.

- files creation and structure must be registered and keep track - we love our codetree systematically structured and we **DO Registered** folders and subfolders with `.gitkeep` 

- folders must be created in a way that is easy to navigate and understand, following the best practice of this harness. Folders must be registered with gitkeep files to ensure they are tracked by git. 

- code file must JSDOC (Run JSDOC skill) documented with clear descriptions, parameters, return values, and examples. All functions and classes must be documented.

- The front facing agents must process high-level workflows, validate dependencies of tasks across sessions through faces

- The front facing agents must delegate to suagents of specialist; front facing agents are not allowed to execute any tasks

- The front facing agents are ones converse with USERS and must know the high-level tasks flow, following strict validations, gatekeeping, and coordination of the partificating frameworks

- When delegating to agents these are the list of agents that must learn and delegate to the correct ones. When delegate to subagents make sure setting up strict guardrails, boundaries, success metrics, making sure they are awared that they are subagents and fulfill the tasked within boundaries and without any deviation ans seriously go through gatekeeping.

<!-- NOTE: explore agent is MISSING from the filesystem -->

- For effective session-resume delegation (when user disconnected and there were previous aborted delegation tasks). Do not start new delegation, start the same start with **THE EXACT SESSION ID** to resume.

- The front facing agents must keep track, monitor, make sure not a single validation, verification, review steps are skips, planning , audit and verification must following format of the participated framework with honest verification and prevention of regressions. 

- **all agents** at every turn (after PER USER's prompt, **even mid-session**, after each turn), entries, shift of workflows there should be matching SKILLS that you must load, load and reload of suitable skills for the task, select ones with framework consistencies. Do not miss loading SKILLS. SKILLS are extremely important


- - **all agents** : do not confuse between the project as the harness which you are building so that users can run it with OpenCode under their projects VS. your environment of works -> meaning there are assumptions that ARE NOT ALLOWED to interprete as this sole environment but must be as wider scopes, in terms of how different projects' states, tasks types, langues, frameworks and use cases.
---
**Evidence level:** L5 documentation guidance only. This file does not prove runtime readiness; runtime claims require L1-L3 proof from authorized verification workflows.

Source architecture: `.planning/architecture/hivemind-source-plane-architecture-2026-05-07.md` — `.opencode/` is the Soft Meta-Concepts sector: OpenCode primitives (agents, commands, skills, rules, permissions) ONLY. No runtime state. No development implementation.

## 1. Sector purpose and lifecycle role

`.opencode/` is the Soft Meta-Concept sector: OpenCode primitives, rules, plugin loader wrappers, commands, skills, agents, permissions, and project configuration that compose runtime behavior from outside the npm package source. Source evidence: `.planning/codebase/ARCHITECTURE.md:209-245`, `.planning/codebase/STRUCTURE.md:124-129`.

Source evidence: `.planning/architecture/hivemind-runtime-identity-taxonomy-2026-05-07.md` — hm/hf/gate/stack/gsd lineages, L0-L3 hierarchy contract. `.planning/codebase/ARCHITECTURE.md:209-245` — Soft Meta-Concept layer.

## 2. Allowed mutation authority

- Agents, skills, commands, rules, permissions, and OpenCode config may be created or updated here when explicitly authorized by a meta-concept workflow.
- `.opencode/plugins/` may contain thin plugin loader wrappers that point OpenCode at built harness plugin entrypoints. Evidence: `.planning/codebase/STRUCTURE.md:157-164`.
- Primitive/config changes must preserve hm/hf/gate/stack lineage conventions and the L0→L3 delegation hierarchy. Evidence: `.planning/codebase/ARCHITECTURE.md:217-245`, `.planning/codebase/STRUCTURE.md:197-216`.
- Closest-sector deviation: no `src/config/` folder is created for primitive/config boundary guidance; this sector owns soft primitive/config placement while runtime config consumers remain in `src/`.

## 3. Forbidden mutations / explicit no-go boundaries

- `.opencode/` SHALL NOT store internal runtime state; `.hivemind/` is canonical state root. Evidence: `.planning/codebase/ARCHITECTURE.md:247-255`, `.planning/codebase/STRUCTURE.md:124-134`.
- `.opencode/` SHALL NOT be treated as development implementation, source code, or build output. It is exclusively for OpenCode primitives (agents, commands, skills, rules, permissions) that configure runtime behavior.
- `.opencode/` SHALL NOT contain business logic, state persistence, compiled code, or npm package source — those belong in `src/` (Hard Harness) and `.hivemind/` (Internal State).
- `.opencode/state/` is legacy migration-only and must not receive new internal state ownership. Evidence: `.planning/codebase/STRUCTURE.md:295-299`.
- Do not blur hm/hf/gate/stack lineages or ship gsd-* internal developer tooling as product primitives. Evidence: `.planning/codebase/ARCHITECTURE.md:217-233`, `.planning/codebase/STRUCTURE.md:209-216`.
- Do not edit runtime TypeScript implementation here; runtime source authority remains in `src/`.

## 4. Actors and consumers

| Actor / consumer | Uses this sector for | Boundary |
|---|---|---|
| OpenCode runtime | Discovers project config, plugin loader, commands, agents, skills, and rules | Runtime state still belongs in `.hivemind/` |
| hm-* lineage agents/skills | Product-dev workflows and specialists | STRICT lineage; no hf-* skill loading by hm-* unless explicitly routed |
| hf-* lineage agents/skills | Meta-concept authoring/building | May modify primitives only under meta-builder authorization |
| gate-* skills | Internal quality gate triad | Project-only quality gates, not shipped as generic product claims |
| stack-* skills | Framework/reference knowledge | Reference only, not implementation authority |
| `src/` Hard Harness tools | Configured through `.opencode/` primitives (agents call tools, commands route to agents) | Never imports from `.opencode/` — reads only through OpenCode SDK |

## 5. Naming and placement conventions

- Agent files use `hm-*`, `hf-*`, or `gsd-*` prefixes according to lineage; skills use `hm-*`, `hf-*`, `gate-*`, `stack-*`, or `gsd-*` prefixes. Evidence: `.planning/codebase/STRUCTURE.md:197-216`.
- Canonical runtime skill location is `.opencode/skills/`; meta-builder source may be reflected from `.hivefiver-meta-builder/`. Evidence: `.planning/codebase/ARCHITECTURE.md:209-215`.
- New agents, skills, and commands should originate from the meta-builder source areas before reflection to `.opencode/`. Evidence: `.planning/codebase/STRUCTURE.md:241-254`.
- Commands use OpenCode command files under `.opencode/commands/`; do not invent parallel command roots.

## 6. Quality gates and evidence expectations

- Primitive changes require discoverability validation, lineage validation, and restart/compile checks when applicable; docs-only edits here are not runtime proof.
- Do not claim permission enforcement, registry completeness, or runtime routing readiness when requirements still mark them missing/partial. Evidence: `.planning/REQUIREMENTS.md:42-56`, `.planning/PROJECT.md:29-42`.
- O3 docs-only guidance remains L5 evidence and cannot change runtime readiness. Evidence: `.planning/ROADMAP.md:47-49`.

## 7. Cross-sector alignment

- **Hard Harness (`src/`):** Runtime implementation. Compiles to dist/. Calls OpenCode SDK. Does not depend on `.opencode/` at build time.
- **Internal State (`.hivemind/`):** Durable persistence. Owned by `src/` modules through tool/hook CQRS boundaries. Canonical per Q6.
- **Meta-Authoring (`.hivefiver-meta-builder/`):** Source-of-truth for primitive authoring. Reflected to `.opencode/` via symlink or sync.
- **Governance (`.planning/`):** Documents architecture, provides phase authorization. Does not mutate `.opencode/`.
- **OMO Adaptation:** Per `.planning/research/omo-adaptation-architecture-2026-05-07.md`, OMO folder roots (`.sisyphus`, `.omx`) are REJECTED; `.opencode/` remains primitives-only.

</system-reminder>Called the Read tool with the following input: {"filePath":"/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/spec.md"}<path>/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/spec.md</path>
<type>file</type>
<content>
1: # Phase Spec Template
2: 
3: Template for `.planning/phases/XX-name/{phase_num}-SPEC.md` — locks requirements before discuss-phase.
4: 
5: **Purpose:** Capture WHAT a phase delivers and WHY, with enough precision that requirements are falsifiable. discuss-phase reads this file and focuses on HOW to implement (skipping "what/why" questions already answered here).
6: 
7: **Key principle:** Every requirement must be falsifiable — you can write a test or check that proves it was met or not. Vague requirements like "improve performance" are not allowed.
8: 
9: **Downstream consumers:**
10: - `discuss-phase` — reads SPEC.md at startup; treats Requirements, Boundaries, and Acceptance Criteria as locked; skips "what/why" questions
11: - `gsd-planner` — reads locked requirements to constrain plan scope
12: - `gsd-verifier` — uses acceptance criteria as explicit pass/fail checks
13: 
14: ---
15: 
16: ## File Template
17: 
18: ```markdown
19: # Phase [X]: [Name] — Specification
20: 
21: **Created:** [date]
22: **Ambiguity score:** [score] (gate: ≤ 0.20)
23: **Requirements:** [N] locked
24: 
25: ## Goal
26: 
27: [One precise sentence — specific and measurable. NOT "improve X" — instead "X changes from A to B".]
28: 
29: ## Background
30: 
31: [Current state from codebase — what exists today, what's broken or missing, what triggers this work. Grounded in code reality, not abstract description.]
32: 
33: ## Requirements
34: 
35: 1. **[Short label]**: [Specific, testable statement.]
36:    - Current: [what exists or does NOT exist today]
37:    - Target: [what it should become after this phase]
38:    - Acceptance: [concrete pass/fail check — how a verifier confirms this was met]
39: 
40: 2. **[Short label]**: [Specific, testable statement.]
41:    - Current: [what exists or does NOT exist today]
42:    - Target: [what it should become after this phase]
43:    - Acceptance: [concrete pass/fail check]
44: 
45: [Continue for all requirements. Each must have Current/Target/Acceptance.]
46: 
47: ## Boundaries
48: 
49: **In scope:**
50: - [Explicit list of what this phase produces]
51: - [Each item is a concrete deliverable or behavior]
52: 
53: **Out of scope:**
54: - [Explicit list of what this phase does NOT do] — [brief reason why it's excluded]
55: - [Adjacent problems excluded from this phase] — [brief reason]
56: 
57: ## Constraints
58: 
59: [Performance, compatibility, data volume, dependency, or platform constraints.
60: If none: "No additional constraints beyond standard project conventions."]
61: 
62: ## Acceptance Criteria
63: 
64: - [ ] [Pass/fail criterion — unambiguous, verifiable]
65: - [ ] [Pass/fail criterion]
66: - [ ] [Pass/fail criterion]
67: 
68: [Every acceptance criterion must be a checkbox that resolves to PASS or FAIL.
69: No "should feel good", "looks reasonable", or "generally works" — those are not checkboxes.]
70: 
71: ## Ambiguity Report
72: 
73: | Dimension          | Score | Min  | Status | Notes                              |
74: |--------------------|-------|------|--------|------------------------------------|
75: | Goal Clarity       |       | 0.75 |        |                                    |
76: | Boundary Clarity   |       | 0.70 |        |                                    |
77: | Constraint Clarity |       | 0.65 |        |                                    |
78: | Acceptance Criteria|       | 0.70 |        |                                    |
79: | **Ambiguity**      |       | ≤0.20|        |                                    |
80: 
81: Status: ✓ = met minimum, ⚠ = below minimum (planner treats as assumption)
82: 
83: ## Interview Log
84: 
85: [Key decisions made during the Socratic interview. Format: round → question → answer → decision locked.]
86: 
87: | Round | Perspective    | Question summary         | Decision locked                    |
88: |-------|----------------|-------------------------|------------------------------------|
89: | 1     | Researcher     | [what was asked]        | [what was decided]                 |
90: | 2     | Simplifier     | [what was asked]        | [what was decided]                 |
91: | 3     | Boundary Keeper| [what was asked]        | [what was decided]                 |
92: 
93: [If --auto mode: note "auto-selected" decisions with the reasoning the agent used.]
94: 
95: ---
96: 
97: *Phase: [XX-name]*
98: *Spec created: [date]*
99: *Next step: /gsd-discuss-phase [X] — implementation decisions (how to build what's specified above)*
100: ```
101: 
102: <good_examples>
103: 
104: **Example 1: Feature addition (Post Feed)**
105: 
106: ```markdown
107: # Phase 3: Post Feed — Specification
108: 
109: **Created:** 2025-01-20
110: **Ambiguity score:** 0.12
111: **Requirements:** 4 locked
112: 
113: ## Goal
114: 
115: Users can scroll through posts from accounts they follow, with new posts available after pull-to-refresh.
116: 
117: ## Background
118: 
119: The database has a `posts` table and `follows` table. No feed query or feed UI exists today. The home screen shows a placeholder "Your feed will appear here." This phase builds the feed query, API endpoint, and the feed list component.
120: 
121: ## Requirements
122: 
123: 1. **Feed query**: Returns posts from followed accounts ordered by creation time, descending.
124:    - Current: No feed query exists — `posts` table is queried directly only from profile pages
125:    - Target: `GET /api/feed` returns paginated posts from followed accounts, newest first, max 20 per page
126:    - Acceptance: Query returns correct posts for a user who follows 3 accounts with known post counts; cursor-based pagination advances correctly
127: 
128: 2. **Feed display**: Posts display in a scrollable card list.
129:    - Current: Home screen shows static placeholder text
130:    - Target: Home screen renders feed cards with author, timestamp, post content, and reaction count
131:    - Acceptance: Feed renders without error for 0 posts (empty state shown), 1 post, and 20+ posts
132: 
133: 3. **Pull-to-refresh**: User can refresh the feed manually.
134:    - Current: No refresh mechanism exists
135:    - Target: Pull-down gesture triggers refetch; new posts appear at top of list
136:    - Acceptance: After a new post is created in test, pull-to-refresh shows the new post without full app restart
137: 
138: 4. **New posts indicator**: When new posts arrive, a banner appears instead of auto-scrolling.
139:    - Current: No such mechanism
140:    - Target: "3 new posts" banner appears when refetch returns posts newer than the oldest visible post; tapping banner scrolls to top and shows new posts
141:    - Acceptance: Banner appears for ≥1 new post, does not appear when no new posts, tap navigates to top
142: 
143: ## Boundaries
144: 
145: **In scope:**
146: - Feed query (backend) — posts from followed accounts, paginated
147: - Feed list UI (frontend) — post cards with author, timestamp, content, reaction counts
148: - Pull-to-refresh gesture
149: - New posts indicator banner
150: - Empty state when user follows no one or no posts exist
151: 
152: **Out of scope:**
153: - Creating posts — that is Phase 4
154: - Reacting to posts — that is Phase 5
155: - Following/unfollowing accounts — that is Phase 2 (already done)
156: - Push notifications for new posts — separate backlog item
157: 
158: ## Constraints
159: 
160: - Feed query must use cursor-based pagination (not offset) — the database has 500K+ posts and offset pagination is unacceptably slow beyond page 3
161: - The feed card component must reuse the existing `<AvatarImage>` component from Phase 2
162: 
163: ## Acceptance Criteria
164: 
165: - [ ] `GET /api/feed` returns posts only from followed accounts (not all posts)
166: - [ ] `GET /api/feed` supports `cursor` parameter for pagination
167: - [ ] Feed renders correctly at 0, 1, and 20+ posts
168: - [ ] Pull-to-refresh triggers refetch
169: - [ ] New posts indicator appears when posts newer than current view exist
170: - [ ] Empty state renders when user follows no one
171: 
172: ## Ambiguity Report
173: 
174: | Dimension          | Score | Min  | Status | Notes                            |
175: |--------------------|-------|------|--------|----------------------------------|
176: | Goal Clarity       | 0.92  | 0.75 | ✓      |                                  |
177: | Boundary Clarity   | 0.95  | 0.70 | ✓      | Explicit out-of-scope list       |
178: | Constraint Clarity | 0.80  | 0.65 | ✓      | Cursor pagination required       |
179: | Acceptance Criteria| 0.85  | 0.70 | ✓      | 6 pass/fail criteria             |
180: | **Ambiguity**      | 0.12  | ≤0.20| ✓      |                                  |
181: 
182: ## Interview Log
183: 
184: | Round | Perspective     | Question summary              | Decision locked                         |
185: |-------|-----------------|------------------------------|-----------------------------------------|
186: | 1     | Researcher      | What exists in posts today?  | posts + follows tables exist, no feed  |
187: | 2     | Simplifier      | Minimum viable feed?         | Cards + pull-refresh, no auto-scroll   |
188: | 3     | Boundary Keeper | What's NOT this phase?       | Creating posts, reactions out of scope |
189: | 3     | Boundary Keeper | What does done look like?    | Scrollable feed with 4 card fields     |
190: 
191: ---
192: 
193: *Phase: 03-post-feed*
194: *Spec created: 2025-01-20*
195: *Next step: /gsd-discuss-phase 3 — implementation decisions (card layout, loading skeleton, etc.)*
196: ```
197: 
198: **Example 2: CLI tool (Database backup)**
199: 
200: ```markdown
201: # Phase 2: Backup Command — Specification
202: 
203: **Created:** 2025-01-20
204: **Ambiguity score:** 0.15
205: **Requirements:** 3 locked
206: 
207: ## Goal
208: 
209: A `gsd backup` CLI command creates a reproducible database snapshot that can be restored by `gsd restore` (a separate phase).
210: 
211: ## Background
212: 
213: No backup tooling exists. The project uses PostgreSQL. Developers currently use `pg_dump` manually — there is no standardized process, no output naming convention, and no CI integration. Three incidents in the last quarter involved restoring from wrong or corrupt dumps.
214: 
215: ## Requirements
216: 
217: 1. **Backup creation**: CLI command executes a full database backup.
218:    - Current: No `backup` subcommand exists in the CLI
219:    - Target: `gsd backup` connects to the database (via `DATABASE_URL` env or `--db` flag), runs pg_dump, writes output to `./backups/YYYY-MM-DD_HH-MM-SS.dump`
220:    - Acceptance: Running `gsd backup` on a test database creates a `.dump` file; running `pg_restore` on that file recreates the database without error
221: 
222: 2. **Network retry**: Transient network failures are retried automatically.
223:    - Current: pg_dump fails immediately on network error
224:    - Target: Backup retries up to 3 times with 5-second delay; 4th failure exits with code 1 and a message to stderr
225:    - Acceptance: Simulating 2 sequential network failures causes 2 retries then success; simulating 4 failures causes exit code 1 and stderr message
226: 
227: 3. **Partial cleanup**: Failed backups do not leave corrupt files.
228:    - Current: Manual pg_dump leaves partial files on failure
229:    - Target: If backup fails after starting, the partial `.dump` file is deleted before exit
230:    - Acceptance: After a simulated failure mid-dump, no `.dump` file exists in `./backups/`
231: 
232: ## Boundaries
233: 
234: **In scope:**
235: - `gsd backup` subcommand (full dump only)
236: - Output to `./backups/` directory (created if missing)
237: - Network retry (3 attempts)
238: - Partial file cleanup on failure
239: 
240: **Out of scope:**
241: - `gsd restore` — that is Phase 3
242: - Incremental backups — separate backlog item (full dump only for now)
243: - S3 or remote storage — separate backlog item
244: - Encryption — separate backlog item
245: - Scheduled/cron backups — separate backlog item
246: 
247: ## Constraints
248: 
249: - Must use `pg_dump` (not a custom query) — ensures compatibility with standard `pg_restore`
250: - `--no-retry` flag must be available for CI use (fail fast, no retries)
251: 
252: ## Acceptance Criteria
253: 
254: - [ ] `gsd backup` creates a `.dump` file in `./backups/YYYY-MM-DD_HH-MM-SS.dump` format
255: - [ ] `gsd backup` uses `DATABASE_URL` env var or `--db` flag for connection
256: - [ ] 3 retries on network failure, then exit code 1 with stderr message
257: - [ ] `--no-retry` flag skips retries and fails immediately on first error
258: - [ ] No partial `.dump` file left after a failed backup
259: 
260: ## Ambiguity Report
261: 
262: | Dimension          | Score | Min  | Status | Notes                          |
263: |--------------------|-------|------|--------|--------------------------------|
264: | Goal Clarity       | 0.90  | 0.75 | ✓      |                                |
265: | Boundary Clarity   | 0.95  | 0.70 | ✓      | Explicit out-of-scope list     |
266: | Constraint Clarity | 0.75  | 0.65 | ✓      | pg_dump required               |
267: | Acceptance Criteria| 0.80  | 0.70 | ✓      | 5 pass/fail criteria           |
268: | **Ambiguity**      | 0.15  | ≤0.20| ✓      |                                |
269: 
270: ## Interview Log
271: 
272: | Round | Perspective     | Question summary              | Decision locked                         |
273: |-------|-----------------|------------------------------|-----------------------------------------|
274: | 1     | Researcher      | What backup tooling exists?  | None — pg_dump manual only             |
275: | 2     | Simplifier      | Minimum viable backup?       | Full dump only, local only             |
276: | 3     | Boundary Keeper | What's NOT this phase?       | Restore, S3, encryption excluded       |
277: | 4     | Failure Analyst | What goes wrong on failure?  | Partial files, CI fail-fast needed     |
278: 
279: ---
280: 
281: *Phase: 02-backup-command*
282: *Spec created: 2025-01-20*
283: *Next step: /gsd-discuss-phase 2 — implementation decisions (progress reporting, flag design, etc.)*
284: ```
285: 
286: </good_examples>
287: 
288: <guidelines>
289: **Every requirement needs all three fields:**
290: - Current: grounds the requirement in reality — what exists today?
291: - Target: the concrete change — not "improve X" but "X becomes Y"
292: - Acceptance: the falsifiable check — how does a verifier confirm this?
293: 
294: **Ambiguity Report must reflect the actual interview.** If a dimension is below minimum, mark it ⚠ — the planner knows to treat it as an assumption rather than a locked requirement.
295: 
296: **Interview Log is evidence of rigor.** Don't skip it. It shows that requirements came from discovery, not assumption.
297: 
298: **Boundaries protect the phase from scope creep.** The out-of-scope list with reasoning is as important as the in-scope list. Future phases that touch adjacent areas can point to this SPEC.md to understand what was intentionally excluded.
299: 
300: **SPEC.md is a one-way door for requirements.** discuss-phase will treat these as locked. If requirements change after SPEC.md is written, the user should update SPEC.md first, then re-run discuss-phase.
301: 
302: **SPEC.md does NOT replace CONTEXT.md.** They serve different purposes:
303: - SPEC.md: what the phase delivers (requirements, boundaries, acceptance criteria)
304: - CONTEXT.md: how the phase will be implemented (decisions, patterns, tradeoffs)
305: 
306: discuss-phase generates CONTEXT.md after reading SPEC.md.
307: </guidelines>

(End of file - total 307 lines)
</content>

<system-reminder>
Instructions from: /Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/CONTEXT.md
# Phase Context Template

Template for `.planning/phases/XX-name/{phase_num}-CONTEXT.md` - captures implementation decisions for a phase.

**Purpose:** Document decisions that downstream agents need. Researcher uses this to know WHAT to investigate. Planner uses this to know WHAT choices are locked vs flexible.

**Key principle:** Categories are NOT predefined. They emerge from what was actually discussed for THIS phase. A CLI phase has CLI-relevant sections, a UI phase has UI-relevant sections.

**Downstream consumers:**
- `gsd-phase-researcher` — Reads decisions to focus research (e.g., "card layout" → research card component patterns)
- `gsd-planner` — Reads decisions to create specific tasks (e.g., "infinite scroll" → task includes virtualization)

---

## File Template

```markdown
# Phase [X]: [Name] - Context

**Gathered:** [date]
**Status:** Ready for planning

<domain>
## Phase Boundary

[Clear statement of what this phase delivers — the scope anchor. This comes from ROADMAP.md and is fixed. Discussion clarifies implementation within this boundary.]

</domain>

<decisions>
## Implementation Decisions

### [Area 1 that was discussed]
- **D-01:** [Specific decision made]
- **D-02:** [Another decision if applicable]

### [Area 2 that was discussed]
- **D-03:** [Specific decision made]

### [Area 3 that was discussed]
- **D-04:** [Specific decision made]

### the agent's Discretion
[Areas where user explicitly said "you decide" — the agent has flexibility here during planning/implementation]

</decisions>

<specifics>
## Specific Ideas

[Any particular references, examples, or "I want it like X" moments from discussion. Product references, specific behaviors, interaction patterns.]

[If none: "No specific requirements — open to standard approaches"]

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

[List every spec, ADR, feature doc, or design doc that defines requirements or constraints for this phase. Use full relative paths so agents can read them directly. Group by topic area when the phase has multiple concerns.]

### [Topic area 1]
- `path/to/spec-or-adr.md` — [What this doc decides/defines that's relevant]
- `path/to/doc.md` §N — [Specific section and what it covers]

### [Topic area 2]
- `path/to/feature-doc.md` — [What capability this defines]

[If the project has no external specs: "No external specs — requirements are fully captured in decisions above"]

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- [Component/hook/utility]: [How it could be used in this phase]

### Established Patterns
- [Pattern]: [How it constrains/enables this phase]

### Integration Points
- [Where new code connects to existing system]

</code_context>

<deferred>
## Deferred Ideas

[Ideas that came up during discussion but belong in other phases. Captured here so they're not lost, but explicitly out of scope for this phase.]

[If none: "None — discussion stayed within phase scope"]

</deferred>

---

*Phase: XX-name*
*Context gathered: [date]*
```

<good_examples>

**Example 1: Visual feature (Post Feed)**

```markdown
# Phase 3: Post Feed - Context

**Gathered:** 2025-01-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Display posts from followed users in a scrollable feed. Users can view posts and see engagement counts. Creating posts and interactions are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Layout style
- Card-based layout, not timeline or list
- Each card shows: author avatar, name, timestamp, full post content, reaction counts
- Cards have subtle shadows, rounded corners — modern feel

### Loading behavior
- Infinite scroll, not pagination
- Pull-to-refresh on mobile
- New posts indicator at top ("3 new posts") rather than auto-inserting

### Empty state
- Friendly illustration + "Follow people to see posts here"
- Suggest 3-5 accounts to follow based on interests

### the agent's Discretion
- Loading skeleton design
- Exact spacing and typography
- Error state handling

</decisions>

<canonical_refs>
## Canonical References

### Feed display
- `docs/features/social-feed.md` — Feed requirements, post card fields, engagement display rules
- `docs/decisions/adr-012-infinite-scroll.md` — Scroll strategy decision, virtualization requirements

### Empty states
- `docs/design/empty-states.md` — Empty state patterns, illustration guidelines

</canonical_refs>

<specifics>
## Specific Ideas

- "I like how Twitter shows the new posts indicator without disrupting your scroll position"
- Cards should feel like Linear's issue cards — clean, not cluttered

</specifics>

<deferred>
## Deferred Ideas

- Commenting on posts — Phase 5
- Bookmarking posts — add to backlog

</deferred>

---

*Phase: 03-post-feed*
*Context gathered: 2025-01-20*
```

**Example 2: CLI tool (Database backup)**

```markdown
# Phase 2: Backup Command - Context

**Gathered:** 2025-01-20
**Status:** Ready for planning

<domain>
## Phase Boundary

CLI command to backup database to local file or S3. Supports full and incremental backups. Restore command is a separate phase.

</domain>

<decisions>
## Implementation Decisions

### Output format
- JSON for programmatic use, table format for humans
- Default to table, --json flag for JSON
- Verbose mode (-v) shows progress, silent by default

### Flag design
- Short flags for common options: -o (output), -v (verbose), -f (force)
- Long flags for clarity: --incremental, --compress, --encrypt
- Required: database connection string (positional or --db)

### Error recovery
- Retry 3 times on network failure, then fail with clear message
- --no-retry flag to fail fast
- Partial backups are deleted on failure (no corrupt files)

### the agent's Discretion
- Exact progress bar implementation
- Compression algorithm choice
- Temp file handling

</decisions>

<canonical_refs>
## Canonical References

### Backup CLI
- `docs/features/backup-restore.md` — Backup requirements, supported backends, encryption spec
- `docs/decisions/adr-007-cli-conventions.md` — Flag naming, exit codes, output format standards

</canonical_refs>

<specifics>
## Specific Ideas

- "I want it to feel like pg_dump — familiar to database people"
- Should work in CI pipelines (exit codes, no interactive prompts)

</specifics>

<deferred>
## Deferred Ideas

- Scheduled backups — separate phase
- Backup rotation/retention — add to backlog

</deferred>

---

*Phase: 02-backup-command*
*Context gathered: 2025-01-20*
```

**Example 3: Organization task (Photo library)**

```markdown
# Phase 1: Photo Organization - Context

**Gathered:** 2025-01-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Organize existing photo library into structured folders. Handle duplicates and apply consistent naming. Tagging and search are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Grouping criteria
- Primary grouping by year, then by month
- Events detected by time clustering (photos within 2 hours = same event)
- Event folders named by date + location if available

### Duplicate handling
- Keep highest resolution version
- Move duplicates to _duplicates folder (don't delete)
- Log all duplicate decisions for review

### Naming convention
- Format: YYYY-MM-DD_HH-MM-SS_originalname.ext
- Preserve original filename as suffix for searchability
- Handle name collisions with incrementing suffix

### the agent's Discretion
- Exact clustering algorithm
- How to handle photos with no EXIF data
- Folder emoji usage

</decisions>

<canonical_refs>
## Canonical References

### Organization rules
- `docs/features/photo-organization.md` — Grouping rules, duplicate policy, naming spec
- `docs/decisions/adr-003-exif-handling.md` — EXIF extraction strategy, fallback for missing metadata

</canonical_refs>

<specifics>
## Specific Ideas

- "I want to be able to find photos by roughly when they were taken"
- Don't delete anything — worst case, move to a review folder

</specifics>

<deferred>
## Deferred Ideas

- Face detection grouping — future phase
- Cloud sync — out of scope for now

</deferred>

---

*Phase: 01-photo-organization*
*Context gathered: 2025-01-20*
```

</good_examples>

<guidelines>
**This template captures DECISIONS for downstream agents.**

The output should answer: "What does the researcher need to investigate? What choices are locked for the planner?"

**Good content (concrete decisions):**
- "Card-based layout, not timeline"
- "Retry 3 times on network failure, then fail"
- "Group by year, then by month"
- "JSON for programmatic use, table for humans"

**Bad content (too vague):**
- "Should feel modern and clean"
- "Good user experience"
- "Fast and responsive"
- "Easy to use"

**After creation:**
- File lives in phase directory: `.planning/phases/XX-name/{phase_num}-CONTEXT.md`
- `gsd-phase-researcher` uses decisions to focus investigation AND reads canonical_refs to know WHAT docs to study
- `gsd-planner` uses decisions + research to create executable tasks AND reads canonical_refs to verify alignment
- Downstream agents should NOT need to ask the user again about captured decisions

**CRITICAL — Canonical references:**
- The `<canonical_refs>` section is MANDATORY. Every CONTEXT.md must have one.
- If your project has external specs, ADRs, or design docs, list them with full relative paths grouped by topic
- If ROADMAP.md lists `Canonical refs:` per phase, extract and expand those
- Inline mentions like "see ADR-019" scattered in decisions are useless to downstream agents — they need full paths and section references in a dedicated section they can find
- If no external specs exist, say so explicitly — don't silently omit the section
</guidelines>

</system-reminder>

### Tool: todowrite

**Input:**
```json
{
  "callID": "call_00_UcT2Dzy2OUga2WgWivFg1129"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_Y6AtL8HBjjpOPKlMA7Oe0016"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_01_sJMho7fhedUOQ0kPazw68569"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_B6ZxEiUzjb50vcs60QC68621"
}
```


### Tool: todowrite

**Input:**
```json
{
  "callID": "call_00_GgqDquNe4YOfZ4mbLomF2814"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/phases/BOOT-02-cli-framework-entry-point/BOOT-02-SPEC.md"
}
```

**Error:**
```
<path>/Users/apple/hivemind-plugin-private/.planning/phases/BOOT-02-cli-framework-entry-point/BOOT-02-SPEC.md</path>
<type>file</type>
<content>
1: # Phase BOOT-02: CLI Framework + Entry Point — Specification
2: 
3: **Created:** 2026-05-07
4: **Ambiguity score:** 0.084 (gate: ≤ 0.20)
5: **Requirements:** 13 locked
6: 
7: ## Goal
8: 
9: The `hivemind` CLI binary accepts `init`, `doctor`, `recover`, `version`, and `help` subcommands through the existing `CliCommand` router, with Zod-validated write-side bootstrap tools, non-interactive `--yes` mode, and contract tests.
10: 
11: ## Background
12: 
13: **Current state:** T01 delivered `src/lib/bootstrap-structure.ts` (124 LOC) — directory name constants (`HIVE_MIND_DIR`, `OPEN_CODE_DIR`, `META_BUILDER_DIR`), Tier-1 subdirectories, primitive types, doctor check names, default config JSON, and path resolution helpers. The existing CLI router (`src/cli/router.ts`) supports `CliCommand` registration through `extraCommands`. The existing `help` command (`src/cli/commands/help.ts`) serves as a reference implementation.
14: 
15: **What triggers this work:** No `hivemind init`, `doctor`, `recover`, or `version` commands exist. The bootstrap spec (`.planning/specs/bootstrap-cli-spec-2026-05-07.md`) defines 42 requirements across BOOT-02 through BOOT-07. `.hivemind/` state root has no creation mechanism. `.opencode/` symlinks have no creation or recovery mechanism. configs.json has no initialization path.
16: 
17: **Primary deliverable:** `npx hivemind --help` shows all 5 subcommands. `npx hivemind init` creates `.hivemind/` structure and `.opencode/` symlinks. `npx hivemind doctor` passes all health checks.
18: 
19: ## Requirements
20: 
21: 1. **Init tool (write-side):** `src/tools/bootstrap-init.ts` creates `.hivemind/` directory tree and `.opencode/` symlinks.
22:    - Current: No init tool exists. `src/lib/bootstrap-structure.ts` provides constants only.
23:    - Target: Tool accepts `projectRoot: string`, `nonInteractive: boolean`, `config: Partial<HivemindConfigs>`. Creates Tier-1 directories with `.gitkeep`. Creates `.opencode/agents|skills|commands/` with symlinks to `.hivefiver-meta-builder/`. Writes `configs.json` with `$schema` reference and wizard-provided values (or empty `{}` in non-interactive mode). Returns `BootstrapInitResult` with created/missing/existing counts.
24:    - Acceptance: Calling the tool on a test project root creates `.hivemind/state/`, `.hivemind/delegation/`, `.hivemind/event-tracker/` with `.gitkeep`; creates `.opencode/skills/` symlinks for all shipped skills; writes valid `configs.json`.
25: 
26: 2. **Recover tool (write-side):** `src/tools/bootstrap-recover.ts` repairs missing or broken symlinks without overwriting real files.
27:    - Current: No recover tool exists.
28:    - Target: Tool walks `.hivefiver-meta-builder/agents|skills|commands/`. For each source entry, checks `.opencode/<type>/<name>`: MISSING → create symlink; BROKEN (symlink exists but target absent) → recreate symlink; FILE (real file, not symlink) → skip; OK → skip. Returns `BootstrapRecoverResult` with counts per status. Never deletes or overwrites real files.
29:    - Acceptance: After deleting 3 symlinks from `.opencode/skills/`, running recover restores exactly those 3. After replacing a symlink with a real file, recover skips it. After corrupting a symlink target, recover repairs it.
30: 
31: 3. **Init CLI command:** `src/cli/commands/init.ts` wraps the init tool with TTY detection, `@clack/prompts` lazy-loading, and `--yes` flag support.
32:    - Current: No init command exists.
33:    - Target: `hivemind init` detects TTY. If TTY: lazy-loads `@clack/prompts`, runs full onboarding wizard (5 config fields: conversation_language, documents_and_artifacts_language, mode, user_expert_level, delegation_systems; meta-concept scope choice: global or project; summary before creation). If non-TTY or `--yes`: skips wizard, installs everything with defaults (`en`, `expert-advisor`, `intermediate-high-level`, all delegation enabled). Calls `bootstrapInitTool`. Reports results.
34:    - Acceptance: `hivemind init --yes` completes without prompting. `CI=true hivemind init` skips wizard. TTY mode presents a multi-step wizard with `@clack/prompts` (spinner, intro/outro, step indicators). Exit code 0 on success, 1 on error with `[Harness]` prefix.
35: 
36: 4. **Doctor CLI command:** `src/cli/commands/doctor.ts` runs health checks and outputs a formatted table.
37:    - Current: No doctor command exists. `src/lib/bootstrap-structure.ts` exports `DOCTOR_CHECKS`.
38:    - Target: `hivemind doctor` runs structure, symlinks, config, and SDK checks. Output format exactly matches spec REQ-BOOT02-06: ASCII table with check name, PASS/FAIL/WARN verdict, details column; verdict line at bottom. Exit code 0 if all PASS, 1 if any FAIL. Uses `renderError()` for internal errors.
39:    - Acceptance: On a healthy project, `hivemind doctor` outputs all PASS and exits 0. After deleting `.hivemind/state/.gitkeep`, doctor reports FAIL for structure check and exits 1. Table format matches spec exactly.
40: 
41: 5. **Recover CLI command:** `src/cli/commands/recover.ts` wraps the recover tool with status reporting.
42:    - Current: No recover command exists.
43:    - Target: `hivemind recover` calls `bootstrapRecoverTool`. Reports counts: OK (already healthy), REPAIRED (fixed), SKIPPED (real files, not overwritten). Non-interactive only — no prompts. Exit code 0 always (recover is idempotent; no failures block completion).
44:    - Acceptance: After deleting 3 symlinks, `hivemind recover` reports 3 REPAIRED and exits 0. Running again immediately reports 0 REPAIRED (all OK). Exit code 0 even when nothing to repair.
45: 
46: 6. **Version CLI command:** `src/cli/commands/version.ts` reads and prints the installed version.
47:    - Current: No version command exists.
48:    - Target: `hivemind version` or `hivemind --version` reads from `package.json` at runtime (not hardcoded). Prints version string to stdout. Exit code 0.
49:    - Acceptance: `hivemind version` prints the version matching `package.json:version`. `hivemind --version` prints the same output.
50: 
51: 7. **Command registration wiring:** `src/cli/index.ts` registers all new commands with the existing router.
52:    - Current: `src/cli/index.ts` exports `buildHarnessCli()` with `extraCommands` array. Currently empty or contains only help.
53:    - Target: Add `initCmd`, `doctorCmd`, `recoverCmd`, `versionCmd` to `extraCommands`. Each command implements `CliCommand` interface. Discovery via `discoverCommands()` picks them up automatically.
54:    - Acceptance: `npx hivemind --help` lists init, doctor, recover, version, and help. `npx hivemind doctor --help` shows doctor-specific help. No orphan commands (all are reachable).
55: 
56: 8. **Tool schema registration:** Write-side tools are registered with Zod schemas in `src/plugin.ts`.
57:    - Current: No bootstrap tools registered. Plugin registers 16 existing tools.
58:    - Target: Register `bootstrapInitTool` and `bootstrapRecoverTool` with Zod input schemas. Both accept `{ projectRoot: string, ... }`. Init additionally accepts `{ nonInteractive: boolean, config: object }`. The tools' Zod schemas live in `src/schema-kernel/`.
59:    - Acceptance: `npm run typecheck` passes. Tool schemas are importable and validatable. Test that invalid input (wrong types, missing fields) produces Zod validation errors.
60: 
61: 9. **Version-controlled install:** Init detects existing `.opencode/` primitives from a different version and backs them up.
62:    - Current: No version tracking or backup mechanism exists.
63:    - Target: Before creating symlinks, init checks if `.opencode/` contains symlinks from a prior Hivemind version. If the tracked version (stored in `.hivemind/state/version.json`) differs from the installed version, backup existing `.opencode/` to `.opencode-backup-<iso-date>/` before replacing. Doctor can reference the backup for recovery. New installs (no prior `.hivemind/`) skip backup.
64:    - Acceptance: Installing Hivemind v3.0 over a project previously bootstrapped with v2.x creates `.opencode-backup-2026-05-07/` with the old symlinks. Fresh install creates no backup directory. Version file is created on first init.
65: 
66: 10. **Config initialization:** `hivemind init` writes `configs.json` with the `$schema` reference and wizard-provided values.
67:     - Current: `src/lib/bootstrap-structure.ts` exports `DEFAULT_CONFIG_JSON` as `'{ "$schema": "./configs.schema.json" }\n'`. No configs.json creation mechanism exists.
68:     - Target: Init writes `.hivemind/configs.json`. If wizard ran: includes wizard-provided values for the 5 core fields plus `$schema`. If `--yes`: writes only `$schema` reference (all fields resolve from Zod defaults at runtime). `$schema` points to `.hivemind/configs.schema.json` (relative path within `.hivemind/`).
69:     - Acceptance: After `hivemind init --yes`, `.hivemind/configs.json` contains valid JSON with `$schema` field. After TTY wizard run, configs.json contains all 5 user-selected values. `hivemind doctor config` check validates the file is parseable JSON with a valid `$schema` reference.
70: 
71: 11. **Schema file generation:** `configs.schema.json` is a build artifact generated from the Zod schema.
72:     - Current: `$schema` references `./configs.schema.json` which does not exist. Zod schema in `src/schema-kernel/hivemind-configs.schema.ts` is the source of truth.
73:     - Target: `src/schema-kernel/generate-config-json-schema.ts` reads the Zod schema, converts to JSON Schema format (using `zod-to-json-schema` or manual serialization), and writes `.hivemind/configs.schema.json`. This file is committed and shipped in the npm package. `npm run build` includes schema generation. Init copies the file into `.hivemind/` alongside `configs.json`.
74:     - Acceptance: `.hivemind/configs.schema.json` exists in the repo and validates as valid JSON Schema. `npm run build` regenerates it if the Zod schema changed. Init copies it to the project's `.hivemind/` directory. Doctor checks it exists and is valid JSON Schema.
75: 
76: 12. **Non-destructive guarantee:** No command overwrites existing user files.
77:     - Current: N/A — no bootstrap commands exist.
78:     - Target: Init skips `.hivemind/` directories that already exist (reports "exists"). Recover skips real files (reports "skipped"). Neither command deletes or overwrites anything. Doctor is read-only.
79:     - Acceptance: Running `hivemind init` twice on the same project produces no errors and reports "exists" for all paths. Running `hivemind recover` after manually creating a real file in `.opencode/agents/` skips that file. No file is ever deleted by these commands.
80: 

(Showing lines 1-80 of 181. Use offset=81 to continue.)
</content>
```


### Tool: glob

**Input:**
```json
{
  "callID": "call_01_631wn0PpQSPTa4DSxFvx3205"
}
```


### Tool: glob

**Input:**
```json
{
  "callID": "call_02_8iAb0uqi9k4O8zrRXjxM2712"
}
```


### Tool: glob

**Input:**
```json
{
  "callID": "call_03_bWlppNwaYiT0W69Oms6x8663"
}
```


### Tool: glob

**Input:**
```json
{
  "callID": "call_00_9vRQvhkeBdbj3ZM2GGQQ2512"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/schema-kernel/hivemind-configs.schema.ts"
}
```

**Error:**
```
<path>/Users/apple/hivemind-plugin-private/src/schema-kernel/hivemind-configs.schema.ts</path>
<type>file</type>
<content>
1: import { z } from "zod"
2: 
3: export const HIVEMIND_CONFIGS_SCHEMA_VERSION = "2.0.0"
4: 
5: // ---------------------------------------------------------------------------
6: // 1. Supported languages — shared enum for conversation and document output
7: // ---------------------------------------------------------------------------
8: 
9: /**
10:  * Supported language codes for agent conversation output and artifact generation.
11:  *
12:  * @example
13:  * ```typescript
14:  * const result = SupportedLanguageSchema.safeParse("en")
15:  * // result.success === true
16:  * ```
17:  */
18: export const SupportedLanguageSchema = z.enum([
19:   "en",
20:   "vi",
21:   "zh",
22:   "fr",
23:   "ja",
24:   "ko",
25:   "de",
26:   "es",
27:   "th",
28:   "id",
29: ])
30: 
31: export type SupportedLanguage = z.infer<typeof SupportedLanguageSchema>
32: 
33: // ---------------------------------------------------------------------------
34: // 2. Mode — guardrail intensity level
35: // ---------------------------------------------------------------------------
36: 
37: /**
38:  * Hivemind operation mode controlling guardrail intensity.
39:  *
40:  * - `expert-advisor`: Agent-led with TDD, spec-driven, research-first, systematic planning.
41:  * - `hivemind-powered`: Stricter guardrails, hierarchical tracking, cross-context persistence.
42:  * - `free-style`: Features only available if child control-panes are active or explicitly requested.
43:  *
44:  * @example
45:  * ```typescript
46:  * const result = HivemindModeSchema.safeParse("expert-advisor")
47:  * // result.success === true
48:  * ```
49:  */
50: export const HivemindModeSchema = z.enum([
51:   "expert-advisor",
52:   "hivemind-powered",
53:   "free-style",
54: ])
55: 
56: export type HivemindMode = z.infer<typeof HivemindModeSchema>
57: 
58: // ---------------------------------------------------------------------------
59: // 3. User expert level — output style adaptation
60: // ---------------------------------------------------------------------------
61: 
62: /**
63:  * User proficiency level affecting agent output style, jargon level, and elaboration depth.
64:  *
65:  * @example
66:  * ```typescript
67:  * const result = UserExpertLevelSchema.safeParse("architecture-driven")
68:  * // result.success === true
69:  * ```
70:  */
71: export const UserExpertLevelSchema = z.enum([
72:   "clumsy-vibecoder",
73:   "beginner-friendly",
74:   "intermediate-high-level",
75:   "architecture-driven",
76:   "absolute-expert",
77: ])
78: 
79: export type UserExpertLevel = z.infer<typeof UserExpertLevelSchema>
80: 
81: // ---------------------------------------------------------------------------
82: // 4. Discuss mode — GSD discuss-phase mode selection
83: // ---------------------------------------------------------------------------
84: 
85: /**
86:  * Phase discussion intensity controlling how the discuss-phase skill operates.
87:  *
88:  * - `sufficient-phase-discussion`: Gather enough context, then move on.
89:  * - `intensive-phase-discussion`: Deep exploration before planning.
90:  * - `skip-phase-discussion`: Skip discussion, go straight to planning.
91:  *
92:  * @example
93:  * ```typescript
94:  * const result = DiscussModeSchema.safeParse("sufficient-phase-discussion")
95:  * // result.success === true
96:  * ```
97:  */
98: export const DiscussModeSchema = z.enum([
99:   "sufficient-phase-discussion",
100:   "intensive-phase-discussion",
101:   "skip-phase-discussion",
102: ])
103: 
104: export type DiscussMode = z.infer<typeof DiscussModeSchema>
105: 
106: // ---------------------------------------------------------------------------
107: // 5. Workflow config — runtime feature toggles
108: // ---------------------------------------------------------------------------
109: 
110: /**
111:  * Workflow configuration controlling runtime feature toggles.
112:  * Each toggle controls a separate runtime feature — implemented as OpenCode primitives,
113:  * custom tools, engines, or event-hook injections.
114:  *
115:  * @example
116:  * ```typescript
117:  * const result = WorkflowConfigSchema.safeParse({
118:  *   research: true,
119:  *   plan_check: true,
120:  *   discuss_mode: "sufficient-phase-discussion",
121:  * })
122:  * // result.success === true
123:  * ```
124:  */
125: /**
126:  * Internal workflow config object schema (without outer default).
127:  * Used to generate a fully-resolved default value for the outer schema.
128:  *
129:  * @internal
130:  */
131: const WorkflowConfigInnerSchema = z.object({
132:   research: z.boolean().default(true),
133:   /** @future-consumer lifecycle-manager.ts — CA-04 */
134:   cross_session_tasks_dependencies_validation: z.boolean().default(false),
135:   /** @future-consumer hivemind-trajectory tool — CA-04 */
136:   trajectory_control: z.boolean().default(false),
137:   /** @future-consumer continuity.ts — CA-04 */
138:   advanced_continuity_validation: z.boolean().default(false),
139:   /** @future-consumer task-status.ts — CA-04 */
140:   task_plus_enabled: z.boolean().default(false),
141:   plan_check: z.boolean().default(true),
142:   verifier: z.boolean().default(true),
143:   /** @future-consumer sidecar UI (WS-2/WS-8) — Future */
144:   ui_phase: z.boolean().default(false),
145:   /** @future-consumer sidecar UI (WS-2/WS-8) — Future */
146:   ui_safety_gate: z.boolean().default(false),
147:   /** @future-consumer WS-4 workstream — Future */
148:   ai_integration_phase: z.boolean().default(false),
149:   research_before_questions: z.boolean().default(true),
150:   discuss_mode: DiscussModeSchema.default("sufficient-phase-discussion"),
151:   use_worktrees: z.boolean().default(false),
152: })
153: 
154: /**
155:  * Workflow config schema with a factory default that produces
156:  * fully-resolved values (satisfies Zod v4 `.default()` type requirements).
157:  */
158: export const WorkflowConfigSchema = WorkflowConfigInnerSchema.default(
159:   () => WorkflowConfigInnerSchema.parse({}),
160: )
161: 
162: export type WorkflowConfig = z.infer<typeof WorkflowConfigSchema>
163: 
164: // ---------------------------------------------------------------------------
165: // 6. Delegation systems — enabled delegation modes
166: // ---------------------------------------------------------------------------
167: 
168: /**
169:  * Toggles for available delegation mechanisms.
170:  *
171:  * - `native_task`: OpenCode innate task tool (always available).
172:  * - `delegate_task`: Custom delegation via harness (f-06).
173:  * - `background_delegation`: Background/async delegation (f-06 advanced).
174:  *
175:  * @example
176:  * ```typescript
177:  * const result = DelegationSystemsSchema.safeParse({
178:  *   native_task: true,
179:  *   delegate_task: true,
180:  *   background_delegation: false,
181:  * })
182:  * // result.success === true
183:  * ```
184:  */
185: export const DelegationSystemsSchema = z
186:   .object({
187:     native_task: z.boolean().default(true),
188:     delegate_task: z.boolean().default(true),
189:     background_delegation: z.boolean().default(true),
190:   })
191:   .default({
192:     native_task: true,
193:     delegate_task: true,
194:     background_delegation: true,
195:   })
196: 
197: export type DelegationSystems = z.infer<typeof DelegationSystemsSchema>
198: 
199: // ---------------------------------------------------------------------------
200: // 7. Legacy key migration — camelCase → snake_case
201: // ---------------------------------------------------------------------------
202: 
203: /**
204:  * Maps legacy camelCase JSON keys to canonical snake_case keys.
205:  * Applied during `readConfigs()` to support backward-compatible config files.
206:  *
207:  * @example
208:  * ```typescript
209:  * // Input: { "conversationLanguage": "en" }
210:  * // After migration: { "conversation_language": "en" }
211:  * ```
212:  */
213: export const LEGACY_KEY_MAP: Record<string, string> = {
214:   conversationLanguage: "conversation_language",
215:   documentsLanguage: "documents_and_artifacts_language",
216:   userExpertLevel: "user_expert_level",
217:   delegationSystems: "delegation_systems",
218: } as const
219: 
220: /**
221:  * Applies legacy camelCase → snake_case key migration to a raw config object.
222:  * Mutates the input object in-place for efficiency.
223:  *
224:  * @param raw - The raw parsed JSON object from configs.json.
225:  * @returns The same object with legacy keys renamed to snake_case.
226:  */
227: export function migrateKeys(raw: Record<string, unknown>): Record<string, unknown> {
228:   for (const [oldKey, newKey] of Object.entries(LEGACY_KEY_MAP)) {
229:     if (oldKey in raw && !(newKey in raw)) {
230:       raw[newKey] = raw[oldKey]
231:       delete raw[oldKey]
232:     }
233:   }
234:   return raw
235: }
236: 
237: // ---------------------------------------------------------------------------
238: // 8. Hivemind configs — top-level .hivemind/configs.json schema
239: // ---------------------------------------------------------------------------
240: 
241: /**
242:  * Schema for `.hivemind/configs.json` — the full skeleton v2 §9.1 runtime configuration.
243:  * Loaded at every front-facing session start and reloaded after each user prompt.
244:  *
245:  * Unknown fields are stripped (lenient parsing) to support forward-compatible
246:  * configs from future versions without rejecting the entire file.
247:  *
248:  * @see SKELETON-INTEGRATED-SYSTEMATIC-APPROACH-v2 §9.1 for the full schema specification.
249:  *
250:  * @example
251:  * ```typescript
252:  * import { HivemindConfigsSchema, readConfigs } from "./configs.js"
253:  *
254:  * // Validate a config object
255:  * const result = HivemindConfigsSchema.safeParse({
256:  *   conversation_language: "en",
257:  *   mode: "expert-advisor",
258:  *   workflow: { research: true, plan_check: true },
259:  * })
260:  *
261:  * // Read from disk
262:  * const configs = readConfigs("/path/to/project")
263:  * ```
264:  */
265: export const HivemindConfigsSchema = z
266:   .object({
267:     conversation_language: SupportedLanguageSchema.default("en"),
268:     documents_and_artifacts_language: SupportedLanguageSchema.default("en"),
269:     mode: HivemindModeSchema.default("expert-advisor"),
270:     user_expert_level: UserExpertLevelSchema.default("intermediate-high-level"),
271:     delegation_systems: DelegationSystemsSchema,
272:     parallelization: z.boolean().default(true),
273:     atomic_commit: z.boolean().default(true),
274:     commit_docs: z.boolean().default(true),
275:     workflow: WorkflowConfigSchema,
276:   })
277:   .strip()
278: 
279: export type HivemindConfigs = z.infer<typeof HivemindConfigsSchema>
280: 
281: // ---------------------------------------------------------------------------
282: // 9. Defaults helper
283: // ---------------------------------------------------------------------------
284: 
285: /**
286:  * Returns the default Hivemind configuration object.
287:  * Equivalent to `HivemindConfigsSchema.parse({})`.
288:  *
289:  * @returns Default configuration with all fields set to their default values.
290:  *
291:  * @example
292:  * ```typescript
293:  * const defaults = getDefaultConfigs()
294:  * // defaults.conversationLanguage === "en"
295:  * // defaults.mode === "expert-advisor"
296:  * ```
297:  */
298: export function getDefaultConfigs(): HivemindConfigs {
299:   return HivemindConfigsSchema.parse({})
300: }
301: 
302: // ---------------------------------------------------------------------------
303: // 10. Read/write helpers
304: // ---------------------------------------------------------------------------
305: 
306: import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
307: import { dirname, resolve } from "node:path"
308: 
309: /**
310:  * Resolves the canonical path to `.hivemind/configs.json` for a given project root.
311:  *
312:  * @param projectRoot - Absolute path to the project root directory.
313:  * @returns Absolute path to `.hivemind/configs.json`.
314:  */
315: export function getConfigsPath(projectRoot: string): string {
316:   return resolve(projectRoot, ".hivemind", "configs.json")
317: }
318: 
319: /**
320:  * Reads and validates `.hivemind/configs.json` from disk. Returns defaults if
321:  * the file is missing or contains invalid JSON. Unknown fields are silently
322:  * stripped.
323:  *
324:  * @param projectRoot - Absolute path to the project root directory.
325:  * @returns Validated Hivemind configuration object.
326:  *
327:  * @example
328:  * ```typescript
329:  * const configs = readConfigs("/path/to/project")
330:  * console.log(configs.mode) // "expert-advisor"
331:  * ```
332:  */
333: export function readConfigs(projectRoot: string): HivemindConfigs {
334:   const configPath = getConfigsPath(projectRoot)
335: 
336:   if (!existsSync(configPath)) {
337:     return getDefaultConfigs()
338:   }
339: 
340:   try {
341:     const raw = readFileSync(configPath, "utf8")
342:     const parsed = JSON.parse(raw) as Record<string, unknown>
343: 
344:     // Apply legacy camelCase → snake_case key migration
345:     migrateKeys(parsed)
346: 
347:     const result = HivemindConfigsSchema.safeParse(parsed)
348: 
349:     if (result.success) {
350:       return result.data
351:     }
352: 
353:     // Invalid schema — return defaults rather than crashing
354:     return getDefaultConfigs()
355:   } catch {
356:     // Corrupt JSON or read error — return defaults
357:     return getDefaultConfigs()
358:   }
359: }
360: 
361: export type ConfigFileValidationResult =
362:   | { success: true; data: HivemindConfigs }
363:   | { success: false; error: string }
364: 
365: /**
366:  * Validate `.hivemind/configs.json` without silently falling back to defaults.
367:  *
368:  * This helper is intended for diagnostics such as `hivemind doctor`, where the
369:  * caller needs a precise success/failure result instead of the lenient runtime
370:  * fallback behavior used by {@link readConfigs}.
371:  *
372:  * @param projectRoot - Absolute path to the project root directory.
373:  * @returns Explicit validation success or a human-readable failure message.
374:  *
375:  * @example
376:  * ```typescript
377:  * const result = validateConfigsFile("/path/to/project")
378:  * if (!result.success) console.error(result.error)
379:  * ```
380:  */
381: export function validateConfigsFile(projectRoot: string): ConfigFileValidationResult {
382:   const configPath = getConfigsPath(projectRoot)
383: 
384:   if (!existsSync(configPath)) {
385:     return { success: false, error: `Missing ${configPath}` }
386:   }
387: 
388:   try {
389:     const raw = readFileSync(configPath, "utf8")
390:     const parsed = JSON.parse(raw) as Record<string, unknown>
391:     migrateKeys(parsed)
392:     const result = HivemindConfigsSchema.safeParse(parsed)
393:     if (!result.success) {
394:       return {
395:         success: false,
396:         error: result.error.issues
397:           .map((issue) => `${issue.path.join(".") || "<root>"}: ${issue.message}`)
398:           .join("; "),
399:       }
400:     }
401:     return { success: true, data: result.data }
402:   } catch (cause) {
403:     return { success: false, error: cause instanceof Error ? cause.message : String(cause) }
404:   }
405: }
406: 
407: /**
408:  * Validates and writes a Hivemind configuration object to `.hivemind/configs.json`.
409:  * Creates the parent directory if it does not exist.
410:  *
411:  * @param projectRoot - Absolute path to the project root directory.
412:  * @param config - Configuration object to validate and persist.
413:  * @returns The validated configuration that was written.
414:  * @throws {Error} If the config object fails Zod validation.
415:  *
416:  * @example
417:  * ```typescript
418:  * const written = writeConfigs("/path/to/project", {
419:  *   conversationLanguage: "vi",
420:  *   documentsLanguage: "en",
421:  *   mode: "hivemind-powered",
422:  *   userExpertLevel: "architecture-driven",
423:  *   delegationSystems: {
424:  *     native_task: true,
425:  *     delegate_task: true,
426:  *     background_delegation: true,
427:  *   },
428:  * })
429:  * ```
430:  */
431: export function writeConfigs(projectRoot: string, config: HivemindConfigs): HivemindConfigs {
432:   const validated = HivemindConfigsSchema.parse(config)
433:   const configPath = getConfigsPath(projectRoot)
434:   mkdirSync(dirname(configPath), { recursive: true })
435:   // Always write canonical snake_case JSON keys (schema already uses snake_case)
436:   writeFileSync(configPath, `${JSON.stringify(validated, null, 2)}\n`, "utf8")
437:   return validated
438: }

(End of file - total 438 lines)
</content>

<system-reminder>
Instructions from: /Users/apple/hivemind-plugin-private/src/schema-kernel/AGENTS.md
# Schema Kernel Sector Guidance

**Parent sector:** `src/AGENTS.md` | **Architecture:** `.planning/codebase/ARCHITECTURE.md` | **Classification:** Hard Harness — validation-leaf (Zod v4 contracts, no durable writes)

**Evidence level:** L5 documentation guidance only. This file does not prove runtime readiness; runtime claims require L1-L3 proof from authorized verification workflows.

## 1. Sector purpose and lifecycle role

`src/schema-kernel/` is the Hard Harness validation-contract sector. It owns Zod v4 schemas for OpenCode meta-concepts, permissions, MCP servers, prompt enhancement, config precedence, agent work contracts, runtime pressure, SDK supervision, command engine, doc intelligence, and trajectory surfaces. Source evidence: `.planning/codebase/ARCHITECTURE.md:195-200`, `.planning/codebase/STRUCTURE.md:114-118`.

## 2. Allowed mutation authority

- Schema files may define and export validation contracts, typed parse results, fallback validation helpers, and barrel exports.
- Schema changes may support tools, config workflow, validation/restart checks, and primitive configuration when paired with consumers. Evidence: `.planning/codebase/ARCHITECTURE.md:195-200`, `.planning/REQUIREMENTS.md:42-56`.
- Schema changes may reject, strip, or warn on invalid structures according to the owning tool or config workflow contract. Evidence: `.planning/codebase/ARCHITECTURE.md:397-401`.

## 3. Forbidden mutations / explicit no-go boundaries

- Schemas SHALL NOT perform durable writes, SDK calls, filesystem state mutation, or command execution.
- Schemas SHALL NOT become hidden runtime feature implementations; they define contracts consumed by tools/lib modules.
- Schemas SHALL NOT introduce `any` on new code or bypass TypeScript strictness. Evidence: `.planning/codebase/CONVENTIONS.md:70-75`.
- Schemas SHALL NOT claim registry/config completeness when consumers are partial or missing. Evidence: `.planning/REQUIREMENTS.md:42-56`.

## 4. Actors and consumers

| Actor / consumer | Uses this sector for | Boundary |
|---|---|---|
| `src/tools/configure-primitive.ts` and `validate-restart` | Validate primitive and restart contracts | Must handle schema errors through tool responses |
| Config workflow and runtime policy modules | Parse and validate workspace/config contracts | Must own side effects outside the schema |
| Tests | Validate accepted/rejected shapes | Schema tests do not prove runtime integration |
| `.opencode/` primitives | Are validated by schemas where supported | Schema existence is not registry enforcement by itself |

## 5. Naming and placement conventions

- Schema files use `kebab-case.schema.ts`; barrel exports live in `src/schema-kernel/index.ts`. Evidence: `.planning/codebase/STRUCTURE.md:186-195`, `.planning/codebase/STRUCTURE.md:237-240`.
- Tests live under `tests/schema-kernel/` and validate real Zod behavior. Evidence: `.planning/codebase/TESTING.md:52-64`, `.planning/codebase/TESTING.md:208-213`.
- Use named exports and ESM `.js` import conventions where imports are needed. Evidence: `.planning/codebase/CONVENTIONS.md:80-98`, `.planning/codebase/CONVENTIONS.md:169-181`.

## 6. Quality gates and evidence expectations

- Schema changes require `npm run typecheck` and scoped `npx vitest run tests/schema-kernel/...` evidence.
- If a schema change claims runtime enforcement, provide consumer evidence from the owning tool/lib module; schema-only proof is insufficient.
- Docs-only edits remain L5 evidence and must not alter readiness status. Evidence: `.planning/ROADMAP.md:47-49`.


Instructions from: /Users/apple/hivemind-plugin-private/src/AGENTS.md
# Hard Harness Sector Guidance

**Evidence level:** L5 documentation guidance only. This file does not prove runtime readiness; runtime claims require L1-L3 proof from authorized verification workflows.

## 1. Sector purpose and lifecycle role

`src/` is the Hard Harness npm package source for the OpenCode runtime composition engine: `src/plugin.ts` assembles dependencies, tools expose write-side commands, hooks observe read-side events, `src/task-management/`, `src/coordination/`, `src/features/`, `src/config/`, `src/routing/` own runtime logic, `src/schema-kernel/` owns validation contracts, and `src/shared/` owns leaf tool utilities. Source evidence: `.planning/codebase/ARCHITECTURE.md:38-45`, `.planning/codebase/ARCHITECTURE.md:48-68`, `.planning/codebase/STRUCTURE.md:88-118`. Source-plane ownership model: `.planning/architecture/hivemind-source-plane-architecture-2026-05-07.md` — defines the split between Hard Harness (`src/`), Soft Meta-Concepts (`.opencode/`), and Internal State (`.hivemind/`).

## 2. Allowed mutation authority

- `src/plugin.ts` may wire runtime dependencies, instantiate hooks, register tools, and load runtime policy; keep business logic in `src/task-management/`, `src/coordination/`, `src/features/`, `src/config/`, `src/routing/`, tools, hooks, or schemas. Evidence: `.planning/codebase/ARCHITECTURE.md:48-50`, `.planning/codebase/ARCHITECTURE.md:70-82`.
- `src/tools/` owns write-side tool entrypoints and may call `src/task-management/`, `src/coordination/`, `src/features/`, `src/schema-kernel/`, and `src/shared/` to perform validated mutations. Evidence: `.planning/codebase/ARCHITECTURE.md:87-113`.
- `src/hooks/` owns read-side observers, response shaping, and guard decisions, subject to the CQRS hook boundary. Evidence: `.planning/codebase/ARCHITECTURE.md:115-134`, `.planning/codebase/ARCHITECTURE.md:339-353`.
- `src/task-management/` owns continuity, journal, event tracker, recovery, trajectory, and lifecycle modules.
- `src/coordination/` owns delegation, completion, concurrency, SDK/command delegation, and spawner modules.
- `src/features/` owns standalone runtime features: bootstrap, PTY/background command, doc intelligence, prompt packets, pressure, SDK supervisor, and work contracts.
- `src/config/` owns config subscriber, compiler, and workflow modules.
- `src/routing/` owns session entry, behavioral profile, and command engine modules.
Evidence: `.planning/codebase/ARCHITECTURE.md:136-183`.
- `src/schema-kernel/` owns Zod validation schemas; `src/shared/` owns leaf utility surfaces used by tools. Evidence: `.planning/codebase/ARCHITECTURE.md:188-200`.

## 3. Forbidden mutations / explicit no-go boundaries

- Do not store internal runtime state in `.opencode/`; `.hivemind/` is canonical state root. Evidence: `.planning/codebase/ARCHITECTURE.md:247-255`, `.planning/codebase/ARCHITECTURE.md:351-353`.
- Do not authorize hooks to perform durable writes; only tools have CQRS mutation authority. Evidence: `.planning/codebase/ARCHITECTURE.md:339-353`.
- Do not move business logic into `src/plugin.ts`; it is a thin composition root. Evidence: `.planning/codebase/ARCHITECTURE.md:70-82`.
- Do not create `src/plugin/`, `src/config/`, or broad `src/features/` folders without a separate, source-backed architecture decision. `src/config/` and `src/features/` are authorized by `.planning/architecture/sr-remediation-architecture-decision-2026-05-08.md`; `src/plugin.ts` remains the plugin authority and `src/plugin/` is still not authorized.
- Do not exceed the 500 LOC module cap or introduce circular imports. Evidence: `.planning/codebase/ARCHITECTURE.md:345-353`, `.planning/codebase/CONVENTIONS.md:19-28`.

## 4. Actors and consumers

| Actor / consumer | Uses this sector for | Boundary |
|---|---|---|
| OpenCode runtime | Loads the plugin, tools, hooks, and SDK-facing wrappers | Must consume compiled/package entrypoints, not planning artifacts |
| Harness tools | Execute mutation commands through validated inputs | Must use schemas and shared response envelopes |
| Harness hooks | Observe events and shape/guard responses | Must not perform durable writes |
| Tests and gates | Verify runtime behavior, type safety, and integration boundaries | Docs-only changes remain L5 evidence |
| `.opencode/` primitives | Configure agents/commands/skills that call harness tools | Must not become internal state owners |

## 5. Naming and placement conventions

- TypeScript source files use `kebab-case.ts`; schemas use `kebab-case.schema.ts`; tests mirror source with `.test.ts`. Evidence: `.planning/codebase/STRUCTURE.md:186-195`.
- Tool implementations live in `src/tools/{tool-name}.ts` or `src/tools/{tool-name}/index.ts`; schemas live in `src/schema-kernel/{tool-name}.schema.ts`; tests live under `tests/`. Evidence: `.planning/codebase/STRUCTURE.md:218-261`.
- Empty reserved folders must be registered with `.gitkeep`; do not create unregistered broad folders. Evidence: `.planning/codebase/STRUCTURE.md:268-278`.
- TypeScript remains strict ESM with `.js` import extensions and `import type` for type-only imports. Evidence: `.planning/codebase/CONVENTIONS.md:5-18`, `.planning/codebase/CONVENTIONS.md:80-98`.

## 6. Quality gates and evidence expectations

- For runtime code changes, minimum local evidence is `npm run typecheck`, relevant `npx vitest run ...`, and `npm test` or scoped justification; docs-only changes may use diff/path inspection only. Evidence: `.planning/codebase/TESTING.md:41-48`.
- Integration readiness cannot be claimed from unit tests or docs-only evidence; O3 docs artifacts are L5 until authorized runtime proof exists. Evidence: `.planning/ROADMAP.md:29-49`, `.planning/architecture/sector-agents-docs-implementation-plan-2026-05-07.md:1-8`.
- Completion claims must preserve CQRS, state-root, lineage, naming, and module-size constraints. Evidence: `.planning/codebase/ARCHITECTURE.md:339-353`, `.planning/codebase/CONVENTIONS.md:19-28`.

## 7. Cross-sector alignment

`.opencode/` is the Soft Meta-Concepts sector — NEVER treated as development assets or implementation source. Skills, agents, and commands in `.opencode/` CONFIGURE runtime behavior from outside the npm package. They contain no business logic, no state persistence, and no compiled code.

- **OMO Adaptation:** Per `.planning/research/omo-adaptation-architecture-2026-05-07.md`, factory injection patterns, CQRS boundaries, and staged initialization are ADAPTED from OMO where they align with Hivemind surfaces. OMO folder roots (`.sisyphus`, `.omx`) are REJECTED.
- **State root:** `.hivemind/` is the canonical deep module persistence root per `.planning/architecture/hivemind-runtime-identity-taxonomy-2026-05-07.md`. No internal runtime state may be stored in `.opencode/` or `src/` without going through `.hivemind/` authority surfaces.
- **Hard Harness = `src/`:** This sector contains compiled TypeScript that ships in the npm package. Soft Meta-Concepts = `.opencode/`: user-configurable primitives. Internal State = `.hivemind/`: runtime journals, delegation records, event tracker, lineage.

</system-reminder>
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/config/subscriber.ts"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/routing/behavioral-profile/profiles.ts"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/routing/behavioral-profile/resolve-behavioral-profile.ts"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/routing/behavioral-profile/types.ts"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/routing/session-entry/language-resolution.ts"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/routing/session-entry/profile-resolver.ts"
}
```


### Tool: glob

**Input:**
```json
{
  "callID": "call_00_dplkfeKskrL4X80LJRaP8448"
}
```


### Tool: glob

**Input:**
```json
{
  "callID": "call_01_5dopB82OVP4v2h5QftWa3469"
}
```


### Tool: grep

**Input:**
```json
{
  "callID": "call_02_cfUneNGNUiJhUiMZ1GZy2046"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/tools/config/bootstrap-init.ts"
}
```

**Error:**
```
<path>/Users/apple/hivemind-plugin-private/src/tools/config/bootstrap-init.ts</path>
<type>file</type>
<content>
1: import { accessSync, constants, cpSync, existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, readlinkSync, symlinkSync, unlinkSync, writeFileSync } from "node:fs"
2: import { dirname, join, relative, resolve } from "node:path"
3: 
4: import { tool } from "@opencode-ai/plugin"
5: 
6: import { DEFAULT_CONFIG_JSON, GITKEEP_FILE, PRIMITIVE_TYPES, TIER_1_DIRECTORIES, resolveHiveMindRoot, resolveMetaBuilderRoot, resolveOpenCodeRoot } from "../../features/bootstrap/structure.js"
7: import { renderToolResult } from "../../shared/tool-helpers.js"
8: import { error, success } from "../../shared/tool-response.js"
9: import { generateHivemindConfigsJsonSchema, writeConfigJsonSchema } from "../../schema-kernel/generate-config-json-schema.js"
10: import { BootstrapInitInputSchema, type BootstrapInitInput, type BootstrapInitResult, type BootstrapScope } from "../../schema-kernel/bootstrap.schema.js"
11: 
12: type PrimitiveKind = (typeof PRIMITIVE_TYPES)[number]
13: 
14: type PrimitiveSource = {
15:   kind: PrimitiveKind
16:   name: string
17:   sourcePath: string
18: }
19: 
20: type ScopeResolution = {
21:   requestedScope: BootstrapScope
22:   effectiveScope: BootstrapScope
23:   primitiveTargetRoot: string
24:   fallbackApplied: boolean
25:   fallbackReason?: string
26: }
27: 
28: /**
29:  * Create the OpenCode write-side `bootstrap-init` tool.
30:  *
31:  * The tool validates BOOT-02 init input, then delegates all filesystem work to
32:  * {@link bootstrapInit}. Invalid scope or root input is rejected before any
33:  * mutation occurs.
34:  *
35:  * @returns An OpenCode tool definition for BOOT-02 bootstrap init.
36:  *
37:  * @example
38:  * ```ts
39:  * const tool = createBootstrapInitTool()
40:  * ```
41:  */
42: export function createBootstrapInitTool(): ReturnType<typeof tool> {
43:   const s = tool.schema
44:   return tool({
45:     description: "Create BOOT-02 local .hivemind surfaces and install project/global OpenCode primitive symlinks with project-scope fallback when global install is unavailable.",
46:     args: {
47:       projectRoot: s.string().describe("Project root receiving local .hivemind artifacts"),
48:       scope: s.string().describe("Primitive install scope: project or global"),
49:       nonInteractive: s.boolean().describe("Whether init is running in --yes/CI mode"),
50:       globalConfigDir: s.string().describe("Optional explicit OpenCode global config path"),
51:       config: s.object({}).describe("Optional wizard-derived config values"),
52:     },
53:     async execute(rawArgs): Promise<string> {
54:       const parsed = BootstrapInitInputSchema.safeParse(rawArgs)
55:       if (!parsed.success) {
56:         return renderToolResult(error("Invalid bootstrap-init arguments", { issues: parsed.error.issues }))
57:       }
58: 
59:       try {
60:         const result = await bootstrapInit(parsed.data)
61:         return renderToolResult(success("Bootstrap init completed", result))
62:       } catch (cause) {
63:         return renderToolResult(error(cause instanceof Error ? cause.message : String(cause)))
64:       }
65:     },
66:   })
67: }
68: 
69: /**
70:  * Initialize a project's BOOT-02 bootstrap surfaces.
71:  *
72:  * This creates the local `.hivemind/` Tier-1 directories, writes gitkeep files,
73:  * installs `configs.json`, ships `configs.schema.json`, updates
74:  * `.hivemind/state/version.json`, and installs primitive symlinks into either the
75:  * project `.opencode/` root or the selected global OpenCode config root.
76:  * Existing user files are preserved; non-symlink targets are never overwritten.
77:  *
78:  * @param input - Validated init request including project root, requested scope, and optional wizard config.
79:  * @returns Detailed init result including requested/effective scope and fallback status.
80:  *
81:  * @example
82:  * ```ts
83:  * const result = await bootstrapInit({ projectRoot: process.cwd(), scope: "project", nonInteractive: true, config: {} })
84:  * console.log(result.effectiveScope)
85:  * ```
86:  */
87: export async function bootstrapInit(input: BootstrapInitInput): Promise<BootstrapInitResult> {
88:   const projectRoot = resolve(input.projectRoot)
89:   const hiveMindRoot = resolveHiveMindRoot(projectRoot)
90:   const versionFilePath = join(hiveMindRoot, "state", "version.json")
91:   const configsPath = join(hiveMindRoot, "configs.json")
92:   const schemaPath = join(hiveMindRoot, "configs.schema.json")
93:   const scope = resolveBootstrapScope(projectRoot, input.scope, input.globalConfigDir)
94:   const sources = listPrimitiveSources(projectRoot)
95:   const currentVersion = readInstalledPackageVersion()
96:   const previousVersion = readTrackedVersion(versionFilePath)
97: 
98:   const created = {
99:     hiveMindDirectories: 0,
100:     gitkeepFiles: 0,
101:     primitiveSymlinks: 0,
102:     configsJson: false,
103:     configSchemaJson: false,
104:     versionFile: false,
105:   }
106:   const existing = {
107:     hiveMindDirectories: 0,
108:     primitiveEntries: 0,
109:     configsJson: existsSync(configsPath),
110:     configSchemaJson: existsSync(schemaPath),
111:   }
112: 
113:   mkdirSync(hiveMindRoot, { recursive: true })
114:   for (const directory of TIER_1_DIRECTORIES) {
115:     const directoryPath = join(hiveMindRoot, directory)
116:     if (existsSync(directoryPath)) {
117:       existing.hiveMindDirectories += 1
118:     } else {
119:       mkdirSync(directoryPath, { recursive: true })
120:       created.hiveMindDirectories += 1
121:     }
122: 
123:     const gitkeepPath = join(directoryPath, GITKEEP_FILE)
124:     if (!existsSync(gitkeepPath)) {
125:       writeFileSync(gitkeepPath, "", "utf8")
126:       created.gitkeepFiles += 1
127:     }
128:   }
129: 
130:   let backupPath: string | undefined
131:   if (previousVersion !== null && previousVersion !== currentVersion) {
132:     backupPath = backupPrimitiveTarget(scope.primitiveTargetRoot)
133:   }
134: 
135:   if (!existsSync(configsPath)) {
136:     writeFileSync(configsPath, renderConfigJson(input.config, input.nonInteractive), "utf8")
137:     created.configsJson = true
138:   }
139: 
140:   const schemaDriftDetected = shouldRefreshSchemaArtifact(schemaPath)
141:   if (schemaDriftDetected) {
142:     writeConfigJsonSchema(projectRoot)
143:     created.configSchemaJson = true
144:   }
145: 
146:   const hadVersionFile = existsSync(versionFilePath)
147:   writeVersionFile(versionFilePath, currentVersion)
148:   created.versionFile = !hadVersionFile || previousVersion !== currentVersion
149: 
150:   for (const primitive of sources) {
151:     const targetPath = resolvePrimitiveTargetPath(scope.primitiveTargetRoot, primitive)
152:     ensurePrimitiveSymlink(targetPath, primitive.sourcePath)
153:     if (existsSync(targetPath) && lstatSync(targetPath).isSymbolicLink()) {
154:       created.primitiveSymlinks += 1
155:     } else {
156:       existing.primitiveEntries += 1
157:     }
158:   }
159: 
160:   return {
161:     projectRoot,
162:     requestedScope: scope.requestedScope,
163:     effectiveScope: scope.effectiveScope,
164:     fallbackApplied: scope.fallbackApplied,
165:     fallbackReason: scope.fallbackReason,
166:     primitiveTargetRoot: scope.primitiveTargetRoot,
167:     backupPath,
168:     created,
169:     existing,
170:   }
171: }
172: 
173: function shouldRefreshSchemaArtifact(schemaPath: string): boolean {
174:   if (!existsSync(schemaPath)) {
175:     return true
176:   }
177: 
178:   const currentContents = readFileSync(schemaPath, "utf8")
179:   const expectedContents = `${JSON.stringify(generateHivemindConfigsJsonSchema(), null, 2)}\n`
180:   return currentContents !== expectedContents
181: }
182: 
183: function resolveBootstrapScope(
184:   projectRoot: string,
185:   requestedScope: BootstrapScope,
186:   explicitGlobalConfigDir?: string,
187: ): ScopeResolution {
188:   if (requestedScope === "project") {
189:     return {
190:       requestedScope,
191:       effectiveScope: "project",
192:       primitiveTargetRoot: resolveOpenCodeRoot(projectRoot),
193:       fallbackApplied: false,
194:     }
195:   }
196: 
197:   const globalRoot = resolve(explicitGlobalConfigDir ?? process.env.OPENCODE_CONFIG_DIR ?? `${process.env.HOME || "/tmp"}/.config/opencode`)
198:   try {
199:     mkdirSync(globalRoot, { recursive: true })
200:     accessSync(globalRoot, constants.W_OK)
201:     return {
202:       requestedScope,
203:       effectiveScope: "global",
204:       primitiveTargetRoot: globalRoot,
205:       fallbackApplied: false,
206:     }
207:   } catch {
208:     return {
209:       requestedScope,
210:       effectiveScope: "project",
211:       primitiveTargetRoot: resolveOpenCodeRoot(projectRoot),
212:       fallbackApplied: true,
213:       fallbackReason: "Global OpenCode config path is unavailable or not writable; falling back to project scope.",
214:     }
215:   }
216: }
217: 
218: function readInstalledPackageVersion(): string {
219:   const packageJsonPath = new URL("../../../package.json", import.meta.url)
220:   const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8")) as { version?: string }
221:   return packageJson.version ?? "0.0.0"
222: }
223: 
224: function readTrackedVersion(versionFilePath: string): string | null {
225:   if (!existsSync(versionFilePath)) return null
226:   try {
227:     const parsed = JSON.parse(readFileSync(versionFilePath, "utf8")) as { version?: string }
228:     return typeof parsed.version === "string" ? parsed.version : null
229:   } catch {
230:     return null
231:   }
232: }
233: 
234: function writeVersionFile(versionFilePath: string, version: string): void {
235:   mkdirSync(dirname(versionFilePath), { recursive: true })
236:   writeFileSync(versionFilePath, `${JSON.stringify({ version }, null, 2)}\n`, "utf8")
237: }
238: 
239: function renderConfigJson(config: BootstrapInitInput["config"], nonInteractive: boolean): string {
240:   if (nonInteractive || Object.keys(config).length === 0) {
241:     return DEFAULT_CONFIG_JSON
242:   }
243: 
244:   return `${JSON.stringify({ $schema: "./configs.schema.json", ...config }, null, 2)}\n`
245: }
246: 
247: function backupPrimitiveTarget(primitiveTargetRoot: string): string | undefined {
248:   if (!existsSync(primitiveTargetRoot)) return undefined
249:   const backupPath = join(dirname(primitiveTargetRoot), `.opencode-backup-${new Date().toISOString().slice(0, 10)}`)
250:   if (!existsSync(backupPath)) {
251:     cpSync(primitiveTargetRoot, backupPath, { recursive: true })
252:   }
253:   return backupPath
254: }
255: 
256: function listPrimitiveSources(projectRoot: string): PrimitiveSource[] {
257:   const metaBuilderRoot = resolveMetaBuilderRoot(projectRoot)
258:   const sources: PrimitiveSource[] = []
259: 
260:   const roots: Record<PrimitiveKind, string[]> = {
261:     agents: [join(metaBuilderRoot, "agents"), join(metaBuilderRoot, "agents-lab", "active", "refactoring")],
262:     skills: [join(metaBuilderRoot, "skills"), join(metaBuilderRoot, "skills-lab", "active", "refactoring")],
263:     commands: [join(metaBuilderRoot, "commands"), join(metaBuilderRoot, "commands-lab", "active", "refactoring")],
264:   }
265: 
266:   for (const kind of PRIMITIVE_TYPES) {
267:     const sourceRoot = roots[kind].find((candidate) => existsSync(candidate))
268:     if (!sourceRoot) continue
269:     for (const entry of readdirSync(sourceRoot)) {
270:       const sourcePath = join(sourceRoot, entry)
271:       if (kind === "skills") {
272:         if (existsSync(join(sourcePath, "SKILL.md"))) {
273:           sources.push({ kind, name: entry, sourcePath })
274:         }
275:         continue
276:       }
277: 
278:       if (entry.endsWith(".md") && lstatSync(sourcePath).isFile()) {
279:         sources.push({ kind, name: entry, sourcePath })
280:       }
281:     }
282:   }
283: 
284:   return sources
285: }
286: 
287: function resolvePrimitiveTargetPath(primitiveTargetRoot: string, primitive: PrimitiveSource): string {
288:   return join(primitiveTargetRoot, primitive.kind, primitive.name)
289: }
290: 
291: function ensurePrimitiveSymlink(targetPath: string, sourcePath: string): void {
292:   mkdirSync(dirname(targetPath), { recursive: true })
293:   if (existsSync(targetPath)) {
294:     const stat = lstatSync(targetPath)
295:     if (!stat.isSymbolicLink()) {
296:       return
297:     }
298: 
299:     const linkedPath = resolve(dirname(targetPath), readlinkSync(targetPath))
300:     if (linkedPath === sourcePath) {
301:       return
302:     }
303: 
304:     unlinkSync(targetPath)
305:   }
306: 
307:   const relativeTarget = relative(dirname(targetPath), sourcePath)
308:   symlinkSync(relativeTarget, targetPath)
309: }

(End of file - total 309 lines)
</content>

<system-reminder>
Instructions from: /Users/apple/hivemind-plugin-private/src/tools/config/AGENTS.md
# Config Tools Guidance

**Evidence level:** L5 documentation guidance only. This file does not prove runtime readiness; runtime claims require L1-L3 proof from authorized verification workflows.

## 1. Sector purpose and lifecycle role

`src/tools/config/` owns OpenCode primitive configuration and bootstrap layout tool entrypoints. `configure-primitive.ts` creates, reads, lists, or inspects OpenCode primitives (agents, commands, skills). `validate-restart.ts` verifies compiled primitives are discoverable and free of runtime issues after restart. `bootstrap-init.ts` creates local `.hivemind/` surfaces and installs symlinks. `bootstrap-recover.ts` repairs missing or broken symlinks. Source evidence: `.planning/codebase/ARCHITECTURE.md:87-113`, `.planning/codebase/STRUCTURE.md:104-108`.

Key tools: `configure-primitive.ts`, `validate-restart.ts`, `bootstrap-init.ts`, `bootstrap-recover.ts`. These tools WRITE to `.opencode/` (primitives) and `.hivemind/` (surfaces) but own NO logic in `.opencode/` — they are Hard Harness tools that CONFIGURE Soft Meta-Concepts from outside. Architecture: `.planning/codebase/ARCHITECTURE.md:87-113`.

## 2. Allowed mutation authority

- Tools may parse input via Zod schemas and render standardized responses with `src/shared/`.
- Tools may call config modules, schema-kernel validators, and bootstrap feature modules.
- Tools may write primitive files and symlinks through approved filesystem operations. Source evidence: `.planning/codebase/ARCHITECTURE.md:339-353`.

## 3. Forbidden mutations / explicit no-go boundaries

- Tools SHALL NOT bypass schema validation for agent-provided input.
- Tools SHALL NOT write internal runtime state into `.opencode/`; `.hivemind/` is canonical. Source evidence: `.planning/codebase/ARCHITECTURE.md:247-255`.
- Tools SHALL NOT register themselves; `src/plugin.ts` owns registration. Source evidence: `.planning/codebase/STRUCTURE.md:221-224`.
- Tools SHALL NOT bypass config module contracts or schema validation.

## 4. Actors and consumers

| Actor / consumer | Uses this sector for | Boundary |
|---|---|---|
| Agents and commands | Invoke config tools for primitive management | Must pass schema-valid inputs |
| `src/config/` | Owns config compilation and workflow logic | Tools call config; tools do not duplicate logic |
| `src/features/bootstrap/` | Owns primitive loading and detection | Tools call bootstrap; tools do not own detection |
| `src/schema-kernel/` | Provides validation contracts | Schemas are leaf; tools own behavior |
| Tests | Validate primitive configuration and restart validation | Integration claims require integration evidence |

## 5. Naming and placement conventions

- Tool files use `kebab-case.ts`: `configure-primitive.ts`, `validate-restart.ts`, `bootstrap-init.ts`, `bootstrap-recover.ts`. Source evidence: `.planning/codebase/STRUCTURE.md:221-224`.
- Schemas belong in `src/schema-kernel/` when validation is needed.
- Tests live under `tests/tools/config/`. Source evidence: `.planning/codebase/TESTING.md:52-64`.

## 6. Quality gates and evidence expectations

- Code changes require `npm run typecheck` and scoped tool tests. Source evidence: `.planning/codebase/TESTING.md:41-48`.
- Bootstrap operations must verify symlink correctness and filesystem safety.
- Docs-only edits remain L5 evidence. Source evidence: `.planning/ROADMAP.md:47-49`.


Instructions from: /Users/apple/hivemind-plugin-private/src/tools/AGENTS.md
# Tools Sector Guidance

**Evidence level:** L5 documentation guidance only. This file does not prove runtime readiness; runtime claims require L1-L3 proof from authorized verification workflows.

## 1. Sector purpose and lifecycle role

`src/tools/` is the Hard Harness write-side sector. Tool implementations expose validated OpenCode tool commands for delegation, status polling, background commands, prompt enhancement, primitive configuration, trajectory, pressure, SDK supervision, command engine, and agent work contracts. Source evidence: `.planning/codebase/ARCHITECTURE.md:87-113`, `.planning/codebase/STRUCTURE.md:104-108`.

Source architecture: `.planning/codebase/ARCHITECTURE.md:87-113` — CQRS write-side mutation authority. Tools call `src/task-management/`, `src/coordination/`, `src/features/` for durable operations. Soft Meta-Concepts (`.opencode/`) configure tool behavior via agent/command/skill primitives; `.opencode/` NEVER owns tool business logic or runtime state.

## 2. Allowed mutation authority

- Tools are the CQRS mutation authority for runtime operations and may write through approved library state owners. Evidence: `.planning/codebase/ARCHITECTURE.md:72-80`, `.planning/codebase/ARCHITECTURE.md:339-353`.
- Tools may parse input via Zod schemas and render standardized responses with `src/shared/`. Evidence: `.planning/codebase/ARCHITECTURE.md:87-113`, `.planning/codebase/ARCHITECTURE.md:295-300`.
- Tools may call OpenCode SDK wrappers, delegation managers, state owners, config workflow, and schema validators when the tool contract explicitly requires it. Evidence: `.planning/codebase/ARCHITECTURE.md:273-285`.

## 3. Forbidden mutations / explicit no-go boundaries

- Tools SHALL NOT bypass schema validation for external or agent-provided input.
- Tools SHALL NOT write internal runtime state into `.opencode/`; state writes go through `.hivemind/` owners. Evidence: `.planning/codebase/ARCHITECTURE.md:247-255`, `.planning/codebase/ARCHITECTURE.md:351-353`.
- Tools SHALL NOT register themselves directly in arbitrary files; `src/plugin.ts` owns registration. Evidence: `.planning/codebase/STRUCTURE.md:221-224`.
- Tools SHALL NOT claim completion, integration, or runtime readiness from mocked/unit-only proof when the claim is about OpenCode integration.

## 4. Actors and consumers

| Actor / consumer | Uses this sector for | Boundary |
|---|---|---|
| Agents and commands | Invoke tool contracts during workflows | Must pass schema-valid inputs |
| `src/plugin.ts` | Registers tool definitions with OpenCode | Does not embed tool business logic |
| `src/task-management/`, `src/coordination/`, `src/features/` owners | Perform durable state, lifecycle, SDK, and orchestration logic | Tools call them; tools do not duplicate deep logic |
| `src/shared/` | Provides response envelope rendering | Shared stays leaf |
| Tests/gates | Verify validation, outputs, and side effects | Integration claims require integration evidence |

## 5. Naming and placement conventions

- Single-file tools live at `src/tools/{tool-name}.ts`; multi-file tools live at `src/tools/{tool-name}/index.ts`. Evidence: `.planning/codebase/STRUCTURE.md:221-224`.
- Add or update schemas in `src/schema-kernel/{tool-name}.schema.ts` when validation is needed. Evidence: `.planning/codebase/STRUCTURE.md:221-224`, `.planning/codebase/STRUCTURE.md:237-240`.
- Tool tests live under `tests/tools/{tool-name}.test.ts` and mirror the source contract. Evidence: `.planning/codebase/STRUCTURE.md:221-224`, `.planning/codebase/TESTING.md:52-64`.
- Tool output must use the shared envelope rather than bespoke response shapes. Evidence: `.planning/codebase/ARCHITECTURE.md:334-337`.

## 6. Quality gates and evidence expectations

- Code changes require `npm run typecheck` and scoped tool tests; run broader `npm test` when touching shared contracts or state owners. Evidence: `.planning/codebase/TESTING.md:41-48`.
- Mutation claims require evidence of the intended state surface and proof that `.opencode/` was not used for internal state.
- Docs-only edits to this file are L5 evidence and must not be used to claim runtime readiness. Evidence: `.planning/ROADMAP.md:47-49`.

</system-reminder>
```


### Tool: grep

**Input:**
```json
{
  "callID": "call_00_S1sOvVfgv9vMMTGZ3eLW0246"
}
```


### Tool: grep

**Input:**
```json
{
  "callID": "call_01_xoMn8NIZA2kdmLng8ME69830"
}
```


### Tool: grep

**Input:**
```json
{
  "callID": "call_02_f5oqOj7MDFKFdE4rxC3n3602"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/cli/commands/init.ts"
}
```

**Error:**
```
<path>/Users/apple/hivemind-plugin-private/src/cli/commands/init.ts</path>
<type>file</type>
<content>
1: import type * as ClackPrompts from "@clack/prompts"
2: import { dirname, resolve } from "node:path"
3: import { existsSync } from "node:fs"
4: 
5: import { bootstrapInit } from "../../tools/config/bootstrap-init.js"
6: import type { BootstrapConfigInput, BootstrapInitResult, BootstrapScope } from "../../schema-kernel/bootstrap.schema.js"
7: import type {
8:   SupportedLanguage,
9:   HivemindMode,
10:   UserExpertLevel,
11:   DelegationSystems,
12: } from "../../schema-kernel/hivemind-configs.schema.js"
13: import type { CliCommand, CliCommandContext, CliRouterResult } from "../router.js"
14: 
15: type PromptModule = typeof ClackPrompts
16: 
17: type InitCommandDeps = {
18:   bootstrapInitFn: typeof bootstrapInit
19:   loadPrompts: () => Promise<PromptModule>
20:   resolveProjectRoot: (explicitRoot?: string) => string | null
21:   isInteractiveTerminal: () => boolean
22: }
23: 
24: /**
25:  * Lazy-load `@clack/prompts` for the interactive init wizard.
26:  *
27:  * @returns The loaded prompts module.
28:  *
29:  * @example
30:  * ```ts
31:  * const prompts = await loadClackPrompts()
32:  * ```
33:  */
34: export async function loadClackPrompts(): Promise<PromptModule> {
35:   return import("@clack/prompts")
36: }
37: 
38: /**
39:  * Create the BOOT-02 `init` CLI command.
40:  *
41:  * The command is a thin router handler: it resolves the project root, decides
42:  * between non-interactive defaults and the TTY wizard, then delegates all
43:  * filesystem mutation to {@link bootstrapInit} with an explicit scope contract.
44:  *
45:  * @param deps - Optional injectable dependencies for tests.
46:  * @returns The `init` command implementation.
47:  *
48:  * @example
49:  * ```ts
50:  * const command = createInitCommand()
51:  * ```
52:  */
53: export function createInitCommand(deps: Partial<InitCommandDeps> = {}): CliCommand {
54:   const resolvedDeps: InitCommandDeps = {
55:     bootstrapInitFn: deps.bootstrapInitFn ?? bootstrapInit,
56:     loadPrompts: deps.loadPrompts ?? loadClackPrompts,
57:     resolveProjectRoot: deps.resolveProjectRoot ?? resolveProjectRoot,
58:     isInteractiveTerminal: deps.isInteractiveTerminal ?? (() => Boolean(process.stdout.isTTY && !process.env.CI)),
59:   }
60: 
61:   return {
62:     name: "init",
63:     summary: "Initialize local .hivemind state and install OpenCode primitive symlinks.",
64:     handler: async (ctx) => handleInit(ctx, resolvedDeps),
65:   }
66: }
67: 
68: /**
69:  * Canonical BOOT-02 `init` command export.
70:  *
71:  * @example
72:  * ```ts
73:  * const result = await initCmd.handler({ flags: { yes: true }, positionals: [], argv: ["init", "--yes"] })
74:  * ```
75:  */
76: export const initCmd = createInitCommand()
77: 
78: async function handleInit(ctx: CliCommandContext, deps: InitCommandDeps): Promise<CliRouterResult> {
79:   if (hasHelpFlag(ctx.flags)) {
80:     return { exitCode: 0, output: renderInitHelp() }
81:   }
82: 
83:   const explicitRoot = getStringFlag(ctx.flags, "root")
84:   const projectRoot = deps.resolveProjectRoot(explicitRoot)
85:   if (projectRoot === null) {
86:     return { exitCode: 64, error: "[Harness] Unable to resolve a project root from --root, package.json, or .hivemind." }
87:   }
88: 
89:   const scopeResult = parseScopeFlag(ctx.flags.scope)
90:   if (!scopeResult.success) {
91:     return { exitCode: 64, error: scopeResult.error }
92:   }
93: 
94:   const nonInteractive = Boolean(ctx.flags.yes === true || ctx.flags.y === true || process.env.CI || !deps.isInteractiveTerminal())
95:   let scope: BootstrapScope = scopeResult.scope
96:   let config: BootstrapConfigInput = {}
97: 
98:   if (!nonInteractive) {
99:     const promptResult = await promptForInitConfig(deps.loadPrompts)
100:     if (promptResult === null) {
101:       return { exitCode: 0, output: "Initialization cancelled." }
102:     }
103:     scope = promptResult.scope
104:     config = promptResult.config
105:   }
106: 
107:   try {
108:     const result = await deps.bootstrapInitFn({
109:       projectRoot,
110:       scope,
111:       nonInteractive,
112:       config,
113:     })
114: 
115:     return {
116:       exitCode: 0,
117:       output: renderInitSuccess(result),
118:     }
119:   } catch (cause) {
120:     return {
121:       exitCode: 1,
122:       error: cause instanceof Error ? cause.message : String(cause),
123:     }
124:   }
125: }
126: 
127: async function promptForInitConfig(
128:   loadPrompts: () => Promise<PromptModule>,
129: ): Promise<{ scope: BootstrapScope; config: BootstrapConfigInput } | null> {
130:   const prompts = await loadPrompts()
131:   prompts.intro("hivemind init")
132: 
133:   const conversationLanguage = await prompts.select({
134:     message: "Conversation language",
135:     initialValue: "en",
136:     options: [
137:       { value: "en", label: "English" },
138:       { value: "vi", label: "Vietnamese" },
139:       { value: "zh", label: "Chinese" },
140:       { value: "ja", label: "Japanese" },
141:     ],
142:   })
143:   if (prompts.isCancel(conversationLanguage)) {
144:     prompts.cancel("Initialization cancelled.")
145:     return null
146:   }
147: 
148:   const artifactLanguage = await prompts.select({
149:     message: "Documents and artifacts language",
150:     initialValue: "en",
151:     options: [
152:       { value: "en", label: "English" },
153:       { value: "vi", label: "Vietnamese" },
154:       { value: "zh", label: "Chinese" },
155:       { value: "ja", label: "Japanese" },
156:     ],
157:   })
158:   if (prompts.isCancel(artifactLanguage)) {
159:     prompts.cancel("Initialization cancelled.")
160:     return null
161:   }
162: 
163:   const mode = await prompts.select({
164:     message: "Working mode",
165:     initialValue: "expert-advisor",
166:     options: [
167:       { value: "expert-advisor", label: "expert-advisor", hint: "guided, structured default" },
168:       { value: "hivemind-powered", label: "hivemind-powered", hint: "stricter orchestration" },
169:       { value: "free-style", label: "free-style", hint: "lighter guardrails" },
170:     ],
171:   })
172:   if (prompts.isCancel(mode)) {
173:     prompts.cancel("Initialization cancelled.")
174:     return null
175:   }
176: 
177:   const expertLevel = await prompts.select({
178:     message: "User expertise level",
179:     initialValue: "intermediate-high-level",
180:     options: [
181:       { value: "clumsy-vibecoder", label: "clumsy-vibecoder" },
182:       { value: "beginner-friendly", label: "beginner-friendly" },
183:       { value: "intermediate-high-level", label: "intermediate-high-level" },
184:       { value: "architecture-driven", label: "architecture-driven" },
185:       { value: "absolute-expert", label: "absolute-expert" },
186:     ],
187:   })
188:   if (prompts.isCancel(expertLevel)) {
189:     prompts.cancel("Initialization cancelled.")
190:     return null
191:   }
192: 
193:   const delegationSystems = await prompts.multiselect({
194:     message: "Delegation systems",
195:     required: false,
196:     initialValues: ["native_task", "delegate_task"],
197:     options: [
198:       { value: "native_task", label: "native_task" },
199:       { value: "delegate_task", label: "delegate_task" },
200:       { value: "background_delegation", label: "background_delegation" },
201:     ],
202:   })
203:   if (prompts.isCancel(delegationSystems)) {
204:     prompts.cancel("Initialization cancelled.")
205:     return null
206:   }
207: 
208:   const scope = await prompts.select({
209:     message: "Primitive install scope",
210:     initialValue: "project",
211:     options: [
212:       { value: "project", label: "project", hint: "default" },
213:       { value: "global", label: "global", hint: "use OpenCode global config" },
214:     ],
215:   })
216:   if (prompts.isCancel(scope)) {
217:     prompts.cancel("Initialization cancelled.")
218:     return null
219:   }
220: 
221:   prompts.outro(`Using ${scope} primitive scope.`)
222:   const selected = new Set(delegationSystems as string[])
223:   const normalizedScope = scope as BootstrapScope
224:   const normalizedConversationLanguage = conversationLanguage as SupportedLanguage
225:   const normalizedArtifactLanguage = artifactLanguage as SupportedLanguage
226:   const normalizedMode = mode as HivemindMode
227:   const normalizedExpertLevel = expertLevel as UserExpertLevel
228:   const normalizedDelegationSystems: DelegationSystems = {
229:     native_task: selected.has("native_task"),
230:     delegate_task: selected.has("delegate_task"),
231:     background_delegation: selected.has("background_delegation"),
232:   }
233:   return {
234:     scope: normalizedScope,
235:     config: {
236:       conversation_language: normalizedConversationLanguage,
237:       documents_and_artifacts_language: normalizedArtifactLanguage,
238:       mode: normalizedMode,
239:       user_expert_level: normalizedExpertLevel,
240:       delegation_systems: normalizedDelegationSystems,
241:     },
242:   }
243: }
244: 
245: function renderInitSuccess(result: BootstrapInitResult): string {
246:   const lines = [
247:     "Hivemind init complete",
248:     `Project root: ${result.projectRoot}`,
249:     `Requested scope: ${result.requestedScope}`,
250:     `Effective scope: ${result.effectiveScope}`,
251:   ]
252: 
253:   if (result.fallbackApplied && result.fallbackReason) {
254:     lines.push(`Scope fallback: ${result.fallbackReason}`)
255:   }
256: 
257:   lines.push(`Primitive target: ${result.primitiveTargetRoot}`)
258:   return lines.join("\n")
259: }
260: 
261: function renderInitHelp(): string {
262:   return [
263:     "Usage: hivemind init [--yes|-y] [--root=<path>] [--scope=project|global]",
264:     "",
265:     "Flags:",
266:     "  --yes, -y       Run non-interactively with BOOT-02 defaults",
267:     "  --root=<path>   Resolve bootstrap state relative to an explicit project root",
268:     "  --scope=<mode>  Install primitives into project or global OpenCode scope",
269:   ].join("\n")
270: }
271: 
272: function resolveProjectRoot(explicitRoot?: string): string | null {
273:   if (explicitRoot?.trim()) {
274:     const resolved = resolve(explicitRoot)
275:     return hasProjectMarkers(resolved) ? resolved : null
276:   }
277: 
278:   let current = process.cwd()
279:   while (true) {
280:     if (hasProjectMarkers(current)) {
281:       return current
282:     }
283:     const parent = dirname(current)
284:     if (parent === current) {
285:       return null
286:     }
287:     current = parent
288:   }
289: }
290: 
291: function hasProjectMarkers(directory: string): boolean {
292:   return existsSync(resolve(directory, "package.json")) || existsSync(resolve(directory, ".hivemind"))
293: }
294: 
295: function getStringFlag(flags: Record<string, string | boolean>, key: string): string | undefined {
296:   const value = flags[key]
297:   return typeof value === "string" ? value : undefined
298: }
299: 
300: function hasHelpFlag(flags: Record<string, string | boolean>): boolean {
301:   return flags.help === true || flags.h === true
302: }
303: 
304: function parseScopeFlag(rawScope: string | boolean | undefined):
305:   | { success: true; scope: BootstrapScope }
306:   | { success: false; error: string } {
307:   if (rawScope === undefined) {
308:     return { success: true, scope: "project" }
309:   }
310:   if (rawScope === "project" || rawScope === "global") {
311:     return { success: true, scope: rawScope }
312:   }
313:   return { success: false, error: `[Harness] Invalid scope: ${String(rawScope)}` }
314: }

(End of file - total 314 lines)
</content>
```


### Tool: grep

**Input:**
```json
{
  "callID": "call_00_5qmSHiCCCwnIua2ZMCdn2813"
}
```


### Tool: grep

**Input:**
```json
{
  "callID": "call_01_typ2xaZMTsIqX5cz9cKG2445"
}
```

