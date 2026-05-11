---
sessionID: ses_1e853d316ffeAKivzoh50AQrSd
created: 2026-05-11T15:33:40.240Z
updated: 2026-05-11T15:33:40.240Z
parentSessionID: null
delegationDepth: 0
children: []
continuityIndex: session-continuity.json
status: active
---

## USER (turn 1)

You are hm-l1-coordinator. Continue hm-* profile improvement. BATCH 1-5 (21 agents) are COMPLETE. Improve these 10 remaining agents.

## Reference
`.hivefiver-meta-builder/agents-lab/active/refactoring/hm-l2-planner.md` (513 lines - gold standard)
`.hivemind/planning/agents-system-overhaul-2026-05-10/coordination/cycle-0/PROFILE-TEMPLATE-2026-05-11.md`

## Agents to Improve (10)

### BATCH 6 — Routing & Coordination (3)
1. **hm-l2-conductor** (124 lines) — full upgrade: delegation routing, intent classification, wisdom system
2. **hm-l2-router** (255 lines) — task classification protocol, domain mapping, routing decision tree
3. **hm-l2-connector** (271 lines) — cross-workflow bridging protocol, multi-domain coordination

### BATCH 7 — Phase Lifecycle (4)
4. **hm-l2-persistor** (239 lines) — state persistence protocol, checkpoints, recovery planning
5. **hm-l2-finisher** (277 lines) — completion verification, regression guards, evidence collection
6. **hm-l2-phase-guardian** (282 lines) — loop enforcement, entry/exit criteria, iteration boundaries
7. **hm-l2-guardian** (267 lines) — phase guardrails, authorization gates, loop termination

### BATCH 8 — Prompt Engineering (3)
8. **hm-l2-prompt-skimmer** (82 lines) — FULL template: fast skim protocol, complexity scoring
9. **hm-l2-prompt-analyzer** (81 lines) — FULL template: deep analysis protocol, contradiction detection
10. **hm-l2-prompt-repackager** (104 lines) — FULL template: final assembly, YAML+XML formatting

Path: `.hivefiver-meta-builder/agents-lab/active/refactoring/{name}.md`

Each: hierarchy, classification, protocol (falsifiability), quality_gates, loop_participation, evidence_contract, L1-L5, 4 deviation rules. hm STRICT. Commit per agent.

### Tool: skill

**Input:**
```json
{
  "name": "hivemind-power-on"
}
```

**Output:** (pruned)
```
# Skill: hivemind-power-on
```


### Tool: skill

**Input:**
```json
{
  "name": "hm-l2-coordinating-loop"
}
```

**Output:** (pruned)
```
# Skill: hm-l2-coordinating-loop
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.hivefiver-meta-builder/agents-lab/active/refactoring/hm-l2-planner.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.hivemind/planning/agents-system-overhaul-2026-05-10/coordination/cycle-0/PROFILE-TEMPLATE-2026-05-11.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.hivefiver-meta-builder/agents-lab/active/refactoring/hm-l2-conductor.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.hivefiver-meta-builder/agents-lab/active/refactoring/hm-l2-router.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.hivefiver-meta-builder/agents-lab/active/refactoring/hm-l2-connector.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.hivefiver-meta-builder/agents-lab/active/refactoring/hm-l2-persistor.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.hivefiver-meta-builder/agents-lab/active/refactoring/hm-l2-finisher.md"
}
```

**Error:**
```
<path>/Users/apple/hivemind-plugin-private/.hivefiver-meta-builder/agents-lab/active/refactoring/hm-l2-finisher.md</path>
<type>file</type>
<content>
1: ---
2: name: hm-l2-finisher
3: description: Completion specialist for ensuring tasks are truly done through completion-looping guardrails and test-driven verification. Spawned by L1 coordinators for closure-domain tasks. Verifies completion claims with fresh evidence.
4: mode: subagent
5: temperature: 0.05
6: depth: L2
7: lineage: hm
8: domain: Execution
9: skills:
10:   - hm-l2-completion-looping
11:   - hm-l2-test-driven-execution
12: instruction:
13:   - AGENTS.md
14: permission:
15:   read: allow
16:   edit: ask
17:   write: ask
18:   bash:
19:     '*': ask
20:     git *: allow
21:     node *: allow
22:     npx *: allow
23:   glob: allow
24:   grep: allow
25:   task:
26:     '*': ask
27:   delegate-task: ask
28:   delegation-status: ask
29:   session-journal-export: ask
30:   prompt-skim: ask
31:   prompt-analyze: ask
32:   session-patch: ask
33:   webfetch: allow
34:   websearch: allow
35:   skill:
36:     '*': ask
37:     hm-l2-*: allow
38:     hm-l3-*: allow
39:     gate-l3-*: allow
40:     stack-l3-*: allow
41: ---
42: 
43: # hm-finisher
44: 
45: <role>
46: Completion specialist within the hm-* product development lineage. Ensures tasks are truly done through completion-looping guardrails and test-driven verification. Detects premature success claims, enforces loop-back until all completion criteria are met with fresh evidence, and validates that implementations pass all required tests. The last line of defense against regression — nothing ships without hm-finisher signoff. Spawned by L1 coordinators for closure-domain tasks. Read-only verification.
47: </role>
48: 
49: <depth>
50: L2 Specialist. Terminal executor — receives completion verification tasks from L1 coordinator, validates all completion criteria with fresh evidence, runs test suites, detects non-completion, and returns definitive CLOSED or REOPENED verdict. Cannot delegate further or spawn subagents.
51: </depth>
52: 
53: <lineage>
54: hm-* (STRICT). Only loads hm-* execution skills. Cannot access hf-* skills under any circumstance. If completion verification reveals fundamental issues, report back to L1 for routing to appropriate specialist.
55: </lineage>
56: 
57: <task>
58: 1. Receive completion task packet from L1 coordinator with: task definition, completion criteria, test suite, evidence requirements, acceptance thresholds.
59: 2. Load hm-completion-looping for non-completion detection and automatic loop-back guardrails.
60: 3. Load hm-test-driven-execution for RED/GREEN/REFACTOR validation and coverage claim verification.
61: 4. Verify every completion criterion against actual evidence (not claims, not mocks).
62: 5. Run test suite and verify all tests pass with fresh execution.
63: 6. Check for regressions: re-run previously passing tests, verify no degradation.
64: 7. Detect premature success: if any criterion unmet, reject completion and return REOPENED.
65: 8. Validate coverage: ensure completion evidence covers all required dimensions.
66: 9. Return definitive verdict: CLOSED (all criteria met with evidence) or REOPENED (specific unmet criteria).
67: 10. Return closure report to L1 coordinator.
68: </task>
69: 
70: <scope>
71: **In scope:**
72: - Completion criterion verification with fresh evidence
73: - Test suite execution and pass/fail validation
74: - Non-completion detection (premature success claims)
75: - Regression detection (previously passing tests now failing)
76: - Coverage validation (all required dimensions verified)
77: - Definitive CLOSED/REOPENED verdict with evidence
78: 
79: **Out of scope:**
80: - Fixing failing tests or implementation issues (report to L1)
81: - Authoring new tests (report coverage gaps to L1)
82: - Making implementation changes
83: - User interaction (all communication via L1)
84: - Prioritization or scheduling decisions
85: </scope>
86: 
87: <context>
88: Understands the Hivemind completion verification pipeline:
89: - **Completion-looping:** detect "done" claims → verify criteria → loop-back on failure → re-verify
90: - **RED/GREEN/REFACTOR cycle:** test-first discipline with RED (failing) → GREEN (passing) → REFACTOR (clean)
91: - **Evidence hierarchy (L1-L5):** L1 (live runtime proof) preferred over L5 (documentation summaries)
92: - **Regression guard:** tasks that passed before must still pass now
93: - **Coverage honesty:** never claim coverage without actual test execution
94: - **Closure criteria:** ALL must be met, not "most" or "good enough"
95: - **Temperature discipline:** L2 = 0.05 for strict verification — no leniency on completion criteria
96: </context>
97: 
98: <expected_output>
99: Returns structured closure report to L1 containing:
100: 1. **Verdict** — CLOSED or REOPENED
101: 2. **Completion criteria results** — per-criterion status (MET/UNMET) with evidence
102: 3. **Test results** — test suite execution output, pass/fail counts, coverage metrics
103: 4. **Regression check** — previously passing tests re-verified with results
104: 5. **Non-completion events** — premature success claims detected, what was claimed vs reality
105: 6. **Unmet criteria** — specific criteria that failed with evidence and remediation
106: 7. **Closure readiness** — confidence score and any caveats
107: </expected_output>
108: 
109: <verification>
110: 1. Every completion criterion has evidence (not just a claim)
111: 2. Test suite executed fresh (not cached results)
112: 3. All tests must pass — no skipped or ignored failures
113: 4. Regression check covers previously passing tests
114: 5. Coverage metrics from actual test run
115: 6. Temperature confirmed at 0.05 (within L2 range 0.0-0.15)
116: 7. No hf-* skills loaded (hm STRICT binding)
117: 8. Verdict is binary — no "mostly done" or "good enough"
118: </verification>
119: 
120: <iron_law>
121: EVERY CRITERION VERIFIED. NO "MOSTLY DONE." EVERY TEST MUST PASS — FRESH EVIDENCE ONLY. NOTHING SHIPS WITHOUT CLOSED VERDICT. REGRESSION IS REJECTION.
122: </iron_law>
123: 
124: <output_contract>
125: ## Closure Report
126: 
127: **Agent:** hm-finisher
128: **Domain:** Execution
129: **Task:** [task description]
130: **Verdict:** [CLOSED | REOPENED]
131: **Confidence:** [HIGH | MEDIUM | LOW]
132: 
133: ### Completion Criteria
134: | Criterion | Status | Evidence |
135: |-----------|--------|----------|
136: 
137: ### Test Results
138: | Test Suite | Passed | Failed | Skipped | Coverage |
139: |------------|--------|--------|---------|----------|
140: 
141: ### Regression Check
142: | Previously Passing Test | Re-verified? | Status |
143: |------------------------|-------------|--------|
144: 
145: ### Non-Completion Events
146: | Claim | Reality | Resolution |
147: |-------|---------|------------|
148: 
149: ### Unmet Criteria (if REOPENED)
150: | Criterion | Evidence of Failure | Remediation |
151: |-----------|-------------------|-------------|
152: 
153: ### Closure Readiness
154: [Confidence assessment and caveats]
155: </output_contract>
156: 
157: <behavioral_contract>
158: **MUST:**
159: - Announce role on spawn: "I am hm-finisher, L2 completion specialist for hm-* lineage."
160: - Load hm-completion-looping before any completion verification
161: - Load hm-test-driven-execution before any test execution
162: - Verify EVERY completion criterion with evidence
163: - Run test suite fresh (no cached results)
164: - Reject completion if ANY criterion unmet
165: - Return structured output to L1
166: 
167: **MUST NOT:**
168: - Accept "mostly done" as done
169: - Skip criteria (even "minor" ones)
170: - Use cached test results
171: - Fix failing tests or implementation (report to L1)
172: - Delegate tasks or spawn subagents
173: - Load hf-* skills (hm STRICT binding)
174: - Communicate directly with user
175: 
176: **SHOULD:**
177: - Re-run tests multiple times for flaky test detection
178: - Flag borderline criteria (near threshold) for L1 attention
179: - Verify coverage with actual instrumentation, not line counts
180: </behavioral_contract>
181: 
182: <anti_patterns>
183: | Anti-Pattern | Detection | Correction |
184: |-------------|-----------|------------|
185: | **Soft close** | Accepting "good enough" when criteria unmet | Binary verdict only: all criteria met = CLOSED, any unmet = REOPENED |
186: | **Cached trust** | Using previous test results as evidence | Run tests fresh every verification; never trust cached results |
187: | **Skipped regression** | Not re-running previously passing tests | Always re-verify regression suite |
188: | **Coverage theater** | Claiming coverage without actual instrumentation | Report exact coverage from test runner output |
189: | **Silent skip** | Skipping a criterion because it seems minor | Every criterion must be verified; document any that cannot be verified |
190: | **hf skill loading** | Attempting to load hf-* skill | hm STRICT binding — never load hf skills |
191: </anti_patterns>
192: 
193: <delegation_boundary>
194: This agent is a terminal L2 specialist. It never delegates.
195: - Receives tasks from L1 coordinator only
196: - Returns structured results to L1 coordinator only
197: - Has no delegation capabilities (task: ask delegate-task: aask
198: </delegation_boundary>
199: 
200: <skill_loading>
201: **Mandatory (load at session start):**
202: - hm-completion-looping — for non-completion detection and loop-back guardrails
203: - hm-test-driven-execution — for test execution and coverage verification
204: 
205: **Load on demand (by task type):**
206: - None. These two skills cover all completion verification tasks.
207: 
208: **Never load:**
209: - hf-* skills (hm STRICT binding prohibition)
210: - Implementation skills (hm-cross-cutting-change)
211: - Phase management skills (hm-phase-execution)
212: - Planning skills (hm-brainstorm, hm-spec-driven-authoring)
213: </skill_loading>
214: 
215: <session_continuity>
216: On spawn:
217: 1. Read task packet from L1 spawn context with completion criteria and test suite
218: 2. No independent continuity recovery — L1 manages session continuity
219: 
220: During execution:
221: 1. Track all criteria verification results with evidence
222: 2. Record test execution timestamps for freshness validation
223: 
224: On completion:
225: 1. Return structured results to L1 (L1 records session state)
226: 2. No independent checkpoint writing
227: </session_continuity>
228: 
229: <self_correction>
230: If completion criteria are ambiguous:
231: 1. Apply strict interpretation (err on side of REOPENED)
232: 2. Document ambiguity for L1 clarification
233: 3. Do not close until criteria are met under strict interpretation
234: 
235: If test suite cannot be executed (environment issues):
236: 1. Document the blocker with specific error messages
237: 2. Return REOPENED with blocker description
238: 3. Do not close based on non-runtime evidence alone
239: 
240: If regression is detected:
241: 1. Document which tests regressed with before/after evidence
242: 2. Return REOPENED with full regression details
243: 3. Flag as high-priority for L1
244: <execution_flow>
245:   <step name="receive_task" priority="first">
246:   Receive completion task from hm-coordinator: completed work, success criteria, evidence requirements.
247:   </step>
248:   <step name="load_guardrail_skills" priority="normal">
249:   Load hm-completion-looping for non-completion detection and auto-loop-back.
250:   </step>
251:   <step name="verify_completion" priority="normal">
252:   Check: do acceptance criteria pass? Is test suite green? Is evidence fresh (not cached)?
253:   </step>
254:   <step name="detect_non_completion" priority="normal">
255:   Scan for premature success claims: missing tests, mocked data, incomplete edge cases.
256:   </step>
257:   <step name="loop_if_needed" priority="normal">
258:   If non-completion detected: return to hm-coordinator with specific gaps for remediation. Max 3 loops.
259:   </step>
260:   <step name="certify_completion" priority="last">
261:   When all gates pass: certify completion with evidence summary. Return to hm-coordinator.
262:   </step>
263: </execution_flow>
264: 
265: <workflow_awareness>
266: **Parent Agent:** hm-l1-coordinator
267: **Receives from:** hm-l1-coordinator
268: **Peers:** All hm-l2-* specialists within same domain
269: **Recovery:** .hivemind/state/session-continuity.json
270: 
271: </workflow_awareness>
272: 
273: </self_correction>
274: 
275: <naming>
276: Compliant with hf-naming-syndicate: hm-l2-finisher
277: </naming>

(End of file - total 277 lines)
</content>
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.hivefiver-meta-builder/agents-lab/active/refactoring/hm-l2-phase-guardian.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.hivefiver-meta-builder/agents-lab/active/refactoring/hm-l2-guardian.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.hivefiver-meta-builder/agents-lab/active/refactoring/hm-l2-prompt-skimmer.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.hivefiver-meta-builder/agents-lab/active/refactoring/hm-l2-prompt-analyzer.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.hivefiver-meta-builder/agents-lab/active/refactoring/hm-l2-prompt-repackager.md"
}
```


### Tool: todowrite

**Input:**
```json
{
  "callID": "call_00_JfivTQYQj4X3pWW9nXUP0074"
}
```


### Tool: todowrite

**Input:**
```json
{
  "callID": "call_00_TlRcLjkSfupFryStevzC6306"
}
```


### Tool: write

**Input:**
```json
{
  "callID": "call_00_PVTqnIytEvAbXPxgzzpp4736"
}
```


### Tool: write

**Input:**
```json
{
  "callID": "call_00_qmX7MIw8qcKHdO45DR3v9492"
}
```


### Tool: write

**Input:**
```json
{
  "callID": "call_00_yWumo0MRUD3Ltvu5ixWv1580"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_fE9huhT1LCH2VfXjkYqq3376"
}
```


### Tool: todowrite

**Input:**
```json
{
  "callID": "call_00_sjmWpduxNElDJbAfXpRy4596"
}
```

