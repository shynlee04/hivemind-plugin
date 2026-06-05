---
sessionID: ses_16a7b4487ffeBZ12xqaWkx7d1k
created: 2026-06-05T02:02:44.546Z
updated: 2026-06-05T02:02:44.637Z
parentSessionID: null
delegationDepth: 0
children:
  - sessionID: ses_16a6f81d4ffeJTPAbYRU2z6Ul3
    childFile: ses_16a6f81d4ffeJTPAbYRU2z6Ul3.json
continuityIndex: session-continuity.json
status: completed
title: New session - 2026-06-05T02:02:44.472Z
lastMessage: >-
  **Phán quyết: Đúng một phần, nhưng phóng đại.** Real API tests có giá trị cao
  hơn mock ở một số layer, nhưng không thể thay thế hoàn toàn mock tests. Câu
  này thiếu cân nhắc về cost, determinism, và test pyramid balance.


  **Phần đúng:**


  1. **Mock có thể "nói dối"** — Test pass với mock nhưng real system fail là
  vấn đề thật. Đặc biệt với Hivemind, nơi orchestration layer điều phối real
  sessions, real SDK calls, real concurrency — mock quá nhiều sẽ tạo "false
  confidence".

  2. **Smoke tests thiết yếu** — End-to-end happy path với real infrastructure
  là bằng chứng integration thật.

  3. **Real API > mock khi test integration boundaries** — SDK call patterns,
  session persistence, delegation handoff, tool registration — tất cả những thứ
  này cần test thật.


  **Phần thiếu/sai:**


  1. **"Mock-heavy is not sufficient"** — Sai tuyệt đối. Mock-heavy là CẦN THIẾT
  cho:
     - Pure logic (queue, validation, type guards, edge cases như "API trả 500", "timeout", "rate limit hit")
     - Determinism (CI/CD cần reproducible)
     - Speed (LLM real call: 2-10s, mock: <1ms)
     - Cost (2,963 tests hiện tại × real LLM calls = cháy budget)
  2. **Real API tests có cost không thể bỏ qua** — LLM token cost, network
  latency, rate limits, flakiness, secrets management trong CI. Chạy 2,963
  real-LLM tests mỗi commit là không khả thi.

  3. **Smoke test ≠ thay thế unit test** — Smoke test ngày càng nhiều không
  compensate được cho unit tests yếu.


  **Lời khuyên cụ thể cho Hivemind (testing pyramid áp dụng):**


  | Layer | % tests | Phương pháp | Ví dụ cụ thể |

  |-------|---------|-------------|--------------|

  | **Unit (mock)** | 70% | Pure logic, edge cases | Queue ordering, validation,
  type guards, error paths, concurrency state |

  | **Integration (real local)** | 20% | Real SDK + in-process | Session
  persistence thực, delegation chain thực, tool registration thực, plugin load
  thực |

  | **E2E/Smoke (real API)** | 10% | Real OpenCode + real LLM | Full plugin load
  → tool call → delegation → completion; chạy ở staging/pre-merge, không phải
  mỗi commit |


  **Quy tắc ngón tay cái:**


  - Test pure logic → **mock** (không có lý do gì để real)

  - Test module boundary → **real local** (mock sẽ nói dối)

  - Test critical user journey → **real API smoke** (nhưng giới hạn số lượng,
  chạy ở environment riêng)


  **Best choice (nếu bắt buộc chọn 1):** Tăng **integration tests với real local
  SDK/process**, giữ unit tests với mock, và thêm 1 bộ smoke tests chạy real LLM
  trên staging trước khi release. Bỏ "pure mock-heavy" và "pure real API" — cả
  hai cực đoan đều sai.


  Bằng chứng: dự án hiện có 2,963 tests pass với mock + 1 bộ smoke test Phase
  39.8 với real execution. Mở rộng integration layer (real SDK nhưng không real
  LLM cho mỗi test) là sweet spot — cho real behavior verification mà không cháy
  budget hay CI timeout.
---

## USER (turn 1)

**source:** real-human

give me advice on this and judge if it is true "since this project is using it to build it and is running on opencode runtime with all the engines and infrastructure enabled and available, also the llm with real agent calls api is also viable ; most of tests with mock-heavy is not sufficient nor efficient. Hence, smoke test and test utilizing real api is much beneficial and give better real-life pass"

## ASSISTANT (turn 1)

**Phán quyết: Đúng một phần, nhưng phóng đại.** Real API tests có giá trị cao hơn mock ở một số layer, nhưng không thể thay thế hoàn toàn mock tests. Câu này thiếu cân nhắc về cost, determinism, và test pyramid balance.

**Phần đúng:**

1. **Mock có thể "nói dối"** — Test pass với mock nhưng real system fail là vấn đề thật. Đặc biệt với Hivemind, nơi orchestration layer điều phối real sessions, real SDK calls, real concurrency — mock quá nhiều sẽ tạo "false confidence".
2. **Smoke tests thiết yếu** — End-to-end happy path với real infrastructure là bằng chứng integration thật.
3. **Real API > mock khi test integration boundaries** — SDK call patterns, session persistence, delegation handoff, tool registration — tất cả những thứ này cần test thật.

**Phần thiếu/sai:**

1. **"Mock-heavy is not sufficient"** — Sai tuyệt đối. Mock-heavy là CẦN THIẾT cho:
   - Pure logic (queue, validation, type guards, edge cases như "API trả 500", "timeout", "rate limit hit")
   - Determinism (CI/CD cần reproducible)
   - Speed (LLM real call: 2-10s, mock: <1ms)
   - Cost (2,963 tests hiện tại × real LLM calls = cháy budget)
2. **Real API tests có cost không thể bỏ qua** — LLM token cost, network latency, rate limits, flakiness, secrets management trong CI. Chạy 2,963 real-LLM tests mỗi commit là không khả thi.
3. **Smoke test ≠ thay thế unit test** — Smoke test ngày càng nhiều không compensate được cho unit tests yếu.

**Lời khuyên cụ thể cho Hivemind (testing pyramid áp dụng):**

| Layer | % tests | Phương pháp | Ví dụ cụ thể |
|-------|---------|-------------|--------------|
| **Unit (mock)** | 70% | Pure logic, edge cases | Queue ordering, validation, type guards, error paths, concurrency state |
| **Integration (real local)** | 20% | Real SDK + in-process | Session persistence thực, delegation chain thực, tool registration thực, plugin load thực |
| **E2E/Smoke (real API)** | 10% | Real OpenCode + real LLM | Full plugin load → tool call → delegation → completion; chạy ở staging/pre-merge, không phải mỗi commit |

**Quy tắc ngón tay cái:**

- Test pure logic → **mock** (không có lý do gì để real)
- Test module boundary → **real local** (mock sẽ nói dối)
- Test critical user journey → **real API smoke** (nhưng giới hạn số lượng, chạy ở environment riêng)

**Best choice (nếu bắt buộc chọn 1):** Tăng **integration tests với real local SDK/process**, giữ unit tests với mock, và thêm 1 bộ smoke tests chạy real LLM trên staging trước khi release. Bỏ "pure mock-heavy" và "pure real API" — cả hai cực đoan đều sai.

Bằng chứng: dự án hiện có 2,963 tests pass với mock + 1 bộ smoke test Phase 39.8 với real execution. Mở rộng integration layer (real SDK nhưng không real LLM cho mỗi test) là sweet spot — cho real behavior verification mà không cháy budget hay CI timeout.

## ASSISTANT (turn 1)

**Phán quyết: Đúng một phần, nhưng phóng đại.** Real API tests có giá trị cao hơn mock ở một số layer, nhưng không thể thay thế hoàn toàn mock tests. Câu này thiếu cân nhắc về cost, determinism, và test pyramid balance.

**Phần đúng:**

1. **Mock có thể "nói dối"** — Test pass với mock nhưng real system fail là vấn đề thật. Đặc biệt với Hivemind, nơi orchestration layer điều phối real sessions, real SDK calls, real concurrency — mock quá nhiều sẽ tạo "false confidence".
2. **Smoke tests thiết yếu** — End-to-end happy path với real infrastructure là bằng chứng integration thật.
3. **Real API > mock khi test integration boundaries** — SDK call patterns, session persistence, delegation handoff, tool registration — tất cả những thứ này cần test thật.

**Phần thiếu/sai:**

1. **"Mock-heavy is not sufficient"** — Sai tuyệt đối. Mock-heavy là CẦN THIẾT cho:
   - Pure logic (queue, validation, type guards, edge cases như "API trả 500", "timeout", "rate limit hit")
   - Determinism (CI/CD cần reproducible)
   - Speed (LLM real call: 2-10s, mock: <1ms)
   - Cost (2,963 tests hiện tại × real LLM calls = cháy budget)
2. **Real API tests có cost không thể bỏ qua** — LLM token cost, network latency, rate limits, flakiness, secrets management trong CI. Chạy 2,963 real-LLM tests mỗi commit là không khả thi.
3. **Smoke test ≠ thay thế unit test** — Smoke test ngày càng nhiều không compensate được cho unit tests yếu.

**Lời khuyên cụ thể cho Hivemind (testing pyramid áp dụng):**

| Layer | % tests | Phương pháp | Ví dụ cụ thể |
|-------|---------|-------------|--------------|
| **Unit (mock)** | 70% | Pure logic, edge cases | Queue ordering, validation, type guards, error paths, concurrency state |
| **Integration (real local)** | 20% | Real SDK + in-process | Session persistence thực, delegation chain thực, tool registration thực, plugin load thực |
| **E2E/Smoke (real API)** | 10% | Real OpenCode + real LLM | Full plugin load → tool call → delegation → completion; chạy ở staging/pre-merge, không phải mỗi commit |

**Quy tắc ngón tay cái:**

- Test pure logic → **mock** (không có lý do gì để real)
- Test module boundary → **real local** (mock sẽ nói dối)
- Test critical user journey → **real API smoke** (nhưng giới hạn số lượng, chạy ở environment riêng)

**Best choice (nếu bắt buộc chọn 1):** Tăng **integration tests với real local SDK/process**, giữ unit tests với mock, và thêm 1 bộ smoke tests chạy real LLM trên staging trước khi release. Bỏ "pure mock-heavy" và "pure real API" — cả hai cực đoan đều sai.

Bằng chứng: dự án hiện có 2,963 tests pass với mock + 1 bộ smoke test Phase 39.8 với real execution. Mở rộng integration layer (real SDK nhưng không real LLM cho mỗi test) là sweet spot — cho real behavior verification mà không cháy budget hay CI timeout.

## ASSISTANT (turn 2)

**Phán quyết: Đúng một phần, nhưng phóng đại.** Real API tests có giá trị cao hơn mock ở một số layer, nhưng không thể thay thế hoàn toàn mock tests. Câu này thiếu cân nhắc về cost, determinism, và test pyramid balance.

**Phần đúng:**

1. **Mock có thể "nói dối"** — Test pass với mock nhưng real system fail là vấn đề thật. Đặc biệt với Hivemind, nơi orchestration layer điều phối real sessions, real SDK calls, real concurrency — mock quá nhiều sẽ tạo "false confidence".
2. **Smoke tests thiết yếu** — End-to-end happy path với real infrastructure là bằng chứng integration thật.
3. **Real API > mock khi test integration boundaries** — SDK call patterns, session persistence, delegation handoff, tool registration — tất cả những thứ này cần test thật.

**Phần thiếu/sai:**

1. **"Mock-heavy is not sufficient"** — Sai tuyệt đối. Mock-heavy là CẦN THIẾT cho:
   - Pure logic (queue, validation, type guards, edge cases như "API trả 500", "timeout", "rate limit hit")
   - Determinism (CI/CD cần reproducible)
   - Speed (LLM real call: 2-10s, mock: <1ms)
   - Cost (2,963 tests hiện tại × real LLM calls = cháy budget)
2. **Real API tests có cost không thể bỏ qua** — LLM token cost, network latency, rate limits, flakiness, secrets management trong CI. Chạy 2,963 real-LLM tests mỗi commit là không khả thi.
3. **Smoke test ≠ thay thế unit test** — Smoke test ngày càng nhiều không compensate được cho unit tests yếu.

**Lời khuyên cụ thể cho Hivemind (testing pyramid áp dụng):**

| Layer | % tests | Phương pháp | Ví dụ cụ thể |
|-------|---------|-------------|--------------|
| **Unit (mock)** | 70% | Pure logic, edge cases | Queue ordering, validation, type guards, error paths, concurrency state |
| **Integration (real local)** | 20% | Real SDK + in-process | Session persistence thực, delegation chain thực, tool registration thực, plugin load thực |
| **E2E/Smoke (real API)** | 10% | Real OpenCode + real LLM | Full plugin load → tool call → delegation → completion; chạy ở staging/pre-merge, không phải mỗi commit |

**Quy tắc ngón tay cái:**

- Test pure logic → **mock** (không có lý do gì để real)
- Test module boundary → **real local** (mock sẽ nói dối)
- Test critical user journey → **real API smoke** (nhưng giới hạn số lượng, chạy ở environment riêng)

**Best choice (nếu bắt buộc chọn 1):** Tăng **integration tests với real local SDK/process**, giữ unit tests với mock, và thêm 1 bộ smoke tests chạy real LLM trên staging trước khi release. Bỏ "pure mock-heavy" và "pure real API" — cả hai cực đoan đều sai.

Bằng chứng: dự án hiện có 2,963 tests pass với mock + 1 bộ smoke test Phase 39.8 với real execution. Mở rộng integration layer (real SDK nhưng không real LLM cho mỗi test) là sweet spot — cho real behavior verification mà không cháy budget hay CI timeout.

## USER (turn 2)

**source:** real-human

so please update this portion to both agents.md and to @.opencode/rules/universal-rules.md as test-driven then find the hm-* skill about test-driven to generically teach this to the process of building test for different purposes (as they can be utilize for various other projects not just this one)
Called the Read tool with the following input: {"filePath":"/Users/apple/hivemind-plugin-private/.opencode/rules/universal-rules.md"}
<path>/Users/apple/hivemind-plugin-private/.opencode/rules/universal-rules.md</path>
<type>file</type>
<content>
1: # Universal Rules & Execution Constitution
2: 
3: These rules govern all multi-agent orchestration, coordination, and execution workflows within the Hivemind composition engine runtime. All agents must comply with these guidelines.
4: 
5: ---
6: 
7: ## 1. Top-Level Role Hierarchy & Banned Inline Work
8: 
9: - **L0/L1 Orchestrator Strategic Boundary**: Front-facing L0/L1 orchestrator agents (e.g., `hm-l0-orchestrator`, `hm-orchestrator`) are strictly banned from performing detail work. They must NEVER read files for comprehension, analyze code blocks, write source code files, run tests, or execute command tasks inline.
10: - **Routing Enforced**: The orchestrator's sole authority is top-level intent classification, landscape mapping, path routing, coordinate delegation, and quality gatekeeping. All detail implementation, research, planning, and verification tasks must be routed to specialist subagents using the native `task` tool.
11: - **Generic Agent Prohibition**: It is strictly prohibited to use generic, untyped, or default agent types (e.g., `general`, `Explore`, `Plan`, or standard LLM models). All tasks must be assigned to domain-specific specialist agents (e.g., `hm-planner`, `hm-executor`, `hm-verifier`) defined under `.opencode/agents/hm-*`.
12: 
13: ---
14: 
15: ## 2. Context Budget & Performance Rules
16: 
17: - **Disk-First Loading**: Never inline full files into subagent prompts. Direct agents to relative paths on disk.
18: - **Scouting Strategy**: Before performing full file reads, use skimming and offset-reading strategies (glob, list, grep, regex, TOC offsets) to locate exact code regions and save token context.
19: - **Compaction Warning**: Monitor context growth. If significant context has been consumed, checkpoint progress. At 70% context budget, run the context compaction command and resume in a clean session.
20: - **History Preservation**: When a session is compacted or interrupted, always discover and resume from the deepest active/aborted child using its exact `task_id` rather than starting a fresh session. Do not repeat prompts when resuming.
21: 
22: ---
23: 
24: ## 3. Delegation, Session & Task Management
25: 
26: - **Discovery and Resuming**: Before spawning any subagent delegation, orchestrators must call `delegation-status({ action: "find-stackable" })` to discover active, aborted, or completed sessions. If a stackable session exists for the target agent, you MUST stack the new task onto it using `task_id` / `stackOnSessionId` to preserve state lineage.
27: - **Work Contracts & Trajectory**: Track all progress in the session trajectory. At each phase boundary, initialize and verify the `agent-work-contract`.
28: - **Checkpoint Verification**: Utilize `execute-slash-command` to transition through workflow checkpoints. Never execute phases sequentially in a single turn. Yield control after each dispatch.
29: 
30: ---
31: 
32: ## 4. The Canonical Hivemind (`hm-*`) Phase Loop Cycle
33: 
34: Every development phase must proceed through the following ordered, traversal-friendly loop cycle. Atomic git commits (incorporating both code changes and updated docs/plans) are mandatory after each checkpoint.
35: 
36: ```mermaid
37: graph TD
38:     Start([Session Start]) --> Scout[1. Codebase Scouting]
39:     Scout --> CRUD[2. Intent & Phase CRUD]
40:     CRUD --> Init[3. Trajectory & Contract Init]
41:     Init --> Spec[4. SPECIFICATION: hm-spec-phase]
42:     Spec --> Context[5. CONTEXT & ASSUMPTIONS: hm-discuss-phase]
43:     Context --> Research[6. RESEARCH: hm-research]
44:     Research --> Patterns[7. PATTERNS.md Schema]
45:     Patterns --> Plan[8. PLANNING: hm-plan-phase]
46:     Plan --> Exec[9. EXECUTION: hm-execute-phase]
47:     Exec --> Verify[10. VERIFICATION: hm-verify-work]
48:     Verify --> Ship([11. SHIP & MERGE: hm-ship])
49: ```
50: 
51: ### Checkpoint 1: Codebase Scouting & Reading
52: - **When:** Starting of a session.
53: - **Action:** Read `.planning/ROADMAP.md`, `.planning/STATE.md`, and `.planning/REQUIREMENTS.md`. Cross-reference all claims with codebase truth. Never accept document claims without hard codebase verification. Decide the scan level of the code cluster to gain intelligence.
54: 
55: ### Checkpoint 2: Phase CRUD & Document Alignment
56: - **When:** Based on user intent.
57: - **Action:** CRUD the phase and align the core documents (`ROADMAP.md`, `STATE.md`, `REQUIREMENTS.md`). Phase naming and numbering must be strictly conforming (e.g., `NN-name`). Validate against dependencies, global requirements, and architectural boundaries. Ensure the phase directory exists with aligned templates.
58: 
59: ### Checkpoint 3: Trajectory & Contract Initialization
60: - **When:** Entering the active phase.
61: - **Action:** Initialize the phase trajectory and write/verify the `agent-work-contract`. Set bounds and success metrics.
62: 
63: ### Checkpoint 4: SPECIFICATION (`hm-spec-phase`)
64: - **When:** Defining requirements.
65: - **Action:** Route to the `hm-planner` agent via `/hm-spec-phase`. Conduct a Socratic requirements loop. Score requirements ambiguity ( Composite clarity must meet ambiguity score ≤ 0.20). Write and commit `{phase_num}-SPEC.md`.
66: 
67: ### Checkpoint 5: CONTEXT & ASSUMPTIONS (`hm-discuss-phase`)
68: - **When:** Aligning implementation decisions.
69: - **Action:** Route to the `hm-intent-loop` agent via `/hm-discuss-phase`. Identify gray areas, resolve assumptions, and lock key design decisions into `{phase_num}-CONTEXT.md`.
70: 
71: ### Checkpoint 6: RESEARCH (`hm-research`)
72: - **When:** Investigating the stack and codebase.
73: - **Action:** Route to the `hm-phase-researcher` agent via `/hm-research`. Validate dependency versions in the lockfile and package.json. Query canonical docs and resolve library IDs using Context7 MCP. Formulate a STRIDE threat model. Write and commit `{phase_num}-RESEARCH.md`.
74: 
75: ### Checkpoint 7: PATTERNS
76: - **When:** Designing complex or spec-compliant modules.
77: - **Action:** Generate `{phase_num}-PATTERNS.md` to specify reuse design patterns, classes, interfaces, and architecture structure before planning.
78: 
79: ### Checkpoint 8: PLANNING (`hm-plan-phase`)
80: - **When:** Building the execution step list.
81: - **Action:** Route to the `hm-planner` agent via `/hm-plan-phase` to write `PLAN.md`. Loop with `hm-plan-checker` for correctness verification.
82: 
83: ### Checkpoint 9: EXECUTION (`hm-execute-phase`)
84: - **When:** Implementing the changes.
85: - **Action:** Route to the `hm-executor` agent via `/hm-execute-phase`. Run execution tasks in waves, perform atomic commits, handle deviations, and verify output functionality.
86: 
87: ### Checkpoint 10: VERIFICATION (`hm-verify-work`)
88: - **When:** Conducting final audits.
89: - **Action:** Route to the `hm-verifier` agent via `/hm-verify-work` to perform comprehensive verification checks.
90: 
91: ### Checkpoint 11: SHIPPING (`hm-ship`)
92: - **When:** Completing work.
93: - **Action:** Route to the `hm-shipper` agent via `/hm-ship` to create pull requests, run final CI audits, and prepare for merging.
94: 
95: ---
96: 
97: ## 5. Quality Gate Triad Governance
98: 
99: All returned deliverables from specialist waves must pass the three-gate quality triad in strict sequence before final approval:
100: 1. **Lifecycle Integration Gate** (`gate-lifecycle-integration`): Check component directory compliance, CQRS write/read boundaries, event wiring, and SDK surface compliance.
101: 2. **Spec Compliance Gate** (`gate-spec-compliance`): Scan for spec-to-code gap analysis, bidirectional traceability, EARS acceptance criteria, and anti-patterns.
102: 3. **Evidence Truth Gate** (`gate-evidence-truth`): Evaluate the evidence hierarchy. Require live runtime proof (L1/L2 test output) over documentation summaries (L5). Reject mocked assertions.

(End of file - total 102 lines)
</content>

## ASSISTANT (turn 2)

Tôi là **hm-orchestrator**, front-facing L0 strategist cho hm-* product development. Tôi sẽ không execute trực tiếp — phải delegate theo governance. Trước khi dispatch, tôi cần recon để form landscape.

### Tool: grep

**Input:**
```json
{
  "callID": "call_function_1skabj5ucsxm_1"
}
```


### Tool: glob

**Input:**
```json
{
  "callID": "call_function_1skabj5ucsxm_2"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_function_1skabj5ucsxm_4"
}
```


### Tool: delegation-status

**Input:**
```json
{
  "callID": "call_function_1skabj5ucsxm_3"
}
```


## ASSISTANT (turn 3)

Tôi đã có recon. Tóm tắt findings:

- **Skill tìm thấy**: `.opencode/skills/hm-l2-test-driven-execution/SKILL.md` (rich assets: workflows, templates, references, evals, scripts)
- **File targets**: AGENTS.md (40KB) + universal-rules.md (7.4KB) — both exist
- **Session**: Không có stackable, fresh dispatch OK
- **Ecosystem signals**: 51 matches từ grep cho thấy skill này là central authority, đã được reference bởi cross-cutting, refactor, spec-driven, planning-persistence, quality gate triad

Đây là **coordinated-path** (multi-domain: research + documentation + governance application), nên route qua gsd-executor. L0 chỉ form landscape + dispatch.

### Tool: bash

**Input:**
```json
{
  "callID": "call_function_hmsr54o4icsp_1"
}
```


## ASSISTANT (turn 4)

## Goal
- Update `AGENTS.md` and `.opencode/rules/universal-rules.md` with test-driven section, and find/derive GENERIC (project-agnostic) test-driven guidance from `hm-*` skill for reuse across projects.

## Constraints & Preferences
- L0 orchestrator (`hm-l0-orchestrator`) is execution_banned — must delegate, never edit source/governance files inline.
- Content must be GENERIC and reusable across projects, not Hivemind-specific.
- Write scope: L0 only allowed `.md/.xml/.json` in `.hivemind/planning/**`; cannot directly write `AGENTS.md` or `universal-rules.md`.
- Test-driven guidance must reflect prior judgment: real API > mock at integration layer only, mock-heavy appropriate for unit tests, real API tests have cost/determinism/CI tradeoffs.
- Language: vi for conversation, en for documents.

## Progress
### Done
- Provided judgment on user's mock-vs-real-API claim: partially true, overstated. Recommended testing pyramid (70% unit mock / 20% integration real local / 10% E2E real API smoke).
- Announced L0 role; ran parallel recon.
- Confirmed target files exist: `AGENTS.md` (40854 bytes), `.opencode/rules/universal-rules.md` (7454 bytes).
- Identified source skill: `hm-l2-test-driven-execution` at `.opencode/skills/hm-l2-test-driven-execution/` with subdirs: `workflows/tdd-session-workflow.md`, `templates/test-case-template.md`, `references/{red-green-refactor,source-synthesis,coverage-verification}.md`, `metrics/`, `evals/`, `scripts/`, `task_plan.md`, `SKILL.md`.
- Skill is referenced by: `stack-zod`, `stack-vitest`, `hm-l3-integration-contracts` (roles: Executor, Builder, Reviewer, Validator, Critic, Finisher).
- `delegation-status find-stackable`: no stackable/resumable sessions — fresh dispatch appropriate.

### In Progress
- Forming end-to-end landscape in `.hivemind/planning/<session>/landscape.md` before dispatch.
- Determining delegation path (leaning coordinated-path via `hm-coordinator` — multi-domain: Research + Documentation + Architecture + Quality).

### Blocked
- (none)

## Key Decisions
- **Coordinated-path over fast-path**: task spans 4 domains (Research, Documentation, Architecture, Quality), involves governance files (high stakes), and output must be GENERIC (needs synthesis design), so → `hm-coordinator` (docs wave) with dependent sub-waves.
- **Source of truth = `hm-l2-test-driven-execution` skill**: this is the canonical hm-* TDD skill; coordinator should extract generic principles from its `SKILL.md` + `references/*` and adapt into project-agnostic guidance.
- **Two-track output**: (1) GENERIC test-driven skill/guidance as reusable artifact; (2) targeted test-driven section appended to both governance files referencing the skill.
- **Prior judgment anchors content**: anti-extremes stance — neither "mock-heavy" nor "real-API-only" is correct; pyramid balance is the doctrine.

## Next Steps
1. Form landscape in `.hivemind/planning/ses_16a7b4487ffeBZ12xqaWkx7d1k/landscape.md` (wave DAG, agent assignments, artifact expectations).
2. Dispatch via native `task` tool to `hm-coordinator` (subagent_type) with structured context packet: path=coordinated-path, scope=2 governance files + 1 generic skill artifact, output format, gate expectations.
3. Coordinator sub-waves: (a) `hm-l3-detective` or `hm-l2-scout` to extract generic TDD principles from `hm-l2-test-driven-execution`; (b) `hm-l2-writer` to draft GENERIC test-driven guidance; (c) `hm-l2-writer` + `hm-l2-architect` to apply targeted section to `AGENTS.md` and `universal-rules.md`; (d) gate triad (lifecycle → spec → evidence).
4. Verify artifacts (disk-written, classified, with file:line evidence) on each return.
5. Report completion with artifact inventory + gate verdicts.

## Critical Context
- Session ID: `ses_16a7b4487ffeBZ12xqaWkx7d1k`, purpose_category=discovery, delegation_depth=0, queue_key=null.
- User's exact ask phrasing: "update this portion to both agents.md and to @.opencode/rules/universal-rules.md as test-driven then find the hm-* skill about test-driven to generically teach this to the process of building test for different purposes (as they can be utilize for various other projects not just this one)".
- Prior advice quoted: smoke test + real API is beneficial for real-life pass — accepted as judgment input but flagged as overstated.
- Skill content hint (from grep): skill draws from `addyosmani/agent-skills@test-driven-development` (Prove-It pattern, test sizes, state-over-interactions, DAMP, real/fake/stub/mock preference) and `helderberto/skills@tdd` (one-test-at-a-time vertical TDD, public-interface discipline, refactor-after-green) and `jellydn/my-ai-tools@tdd`.
- Files to be updated are NOT in L0 write-allowed paths → must be modified by a delegated specialist via worktree.
- MAX 3 skills loaded at once; current loaded = `hivemind-power-on` (1).
- Recon result: 51 grep matches for `test-driven|tdd|test_driven` across `.opencode/skills/**/SKILL.md`.

## Relevant Files
- `/Users/apple/hivemind-plugin-private/AGENTS.md`: target governance file to update with test-driven section (40854 bytes).
- `/Users/apple/hivemind-plugin-private/.opencode/rules/universal-rules.md`: target governance file to update with test-driven section (7454 bytes).
- `/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l2-test-driven-execution/SKILL.md`: canonical TDD skill — source of generic principles.
- `/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l2-test-driven-execution/references/red-green-refactor.md`: TDD cycle reference.
- `/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l2-test-driven-execution/references/coverage-verification.md`: evidence/coverage doctrine reference.
- `/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l2-test-driven-execution/references/source-synthesis.md`: cross-source synthesis reference.
- `/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l2-test-driven-execution/workflows/tdd-session-workflow.md`: workflow template.
- `/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l2-test-driven-execution/templates/test-case-template.md`: test case template.
- `/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l2-test-driven-execution/task_plan.md`: in-skill task plan reference.
- `/Users/apple/hivemind-plugin-private/.hivemind/planning/ses_16a7b4487ffeBZ12xqaWkx7d1k/landscape.md`: to be created — authoritative dispatch plan.
- `/Users/apple/hivemind-plugin-private/.hivemind/state/delegations.json`: delegation tracking (to be updated post-dispatch).
- `/Users/apple/hivemind-plugin-private/.hivemind/state/session-continuity.json`: session state (to be updated on completion).

## COMPACTED (2026-06-05T02:12:34.968Z)

**Compaction occurred — summary unavailable.**

**Continuity index:** See `session-continuity.json` for active delegations and pending work at time of compaction.

## ASSISTANT (turn 5)

Tiếp tục. Tôi sẽ form landscape trước, rồi dispatch.

### Tool: bash

**Input:**
```json
{
  "callID": "call_function_464yayisw7iy_1"
}
```


### Tool: write

**Input:**
```json
{
  "callID": "call_function_29iqkzb0xxl7_1"
}
```


## ASSISTANT (turn 6)

Landscape written. Dispatching to `gsd-executor` (fast-path within gsd lineage; gsd-* are the project tooling agents per project rules).
