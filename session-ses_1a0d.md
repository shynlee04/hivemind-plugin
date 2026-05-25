# New session - 2026-05-25T12:45:54.837Z

**Session ID:** ses_1a0d460ebffeSDYLxy2j2LNaQp
**Created:** 5/25/2026, 7:45:54 PM
**Updated:** 5/25/2026, 7:57:36 PM

---

## User

## Nghiên cứu và báo cáo các vấn đề sau liên quan trực tiếp tới các vấn đề sau

## Cần đọc các kiến thức sau

```markdown
/Users/apple/hivemind-plugin-private/.hivemind/registries
/Users/apple/hivemind-plugin-private/.planning/phases/23-notification-fix-and-tool-surface-docs/23-W4-SYNTHESIS.md
/Users/apple/hivemind-plugin-private/.planning/phases/23-notification-fix-and-tool-surface-docs/23-W3-SYNTHESIS.md
/Users/apple/hivemind-plugin-private/.planning/phases/23-notification-fix-and-tool-surface-docs/23-W2-SYNTHESIS.md
/Users/apple/hivemind-plugin-private/.planning/phases/23-notification-fix-and-tool-surface-docs/23-SYNTHESIS-REPORT-2026-05-23.md
/Users/apple/hivemind-plugin-private/.planning/phases/23-notification-fix-and-tool-surface-docs/23-GSD-workflow-pipeline-2026-05-23.md
/Users/apple/hivemind-plugin-private/.planning/phases/23-notification-fix-and-tool-surface-docs/23-GSD-sdk-surface-2026-05-23.md
/Users/apple/hivemind-plugin-private/.planning/phases/23-notification-fix-and-tool-surface-docs/23-GSD-REFERENCE-2026-05-23.md
/Users/apple/hivemind-plugin-private/.planning/phases/23-notification-fix-and-tool-surface-docs/23-GSD-quality-gates-2026-05-23.md
/Users/apple/hivemind-plugin-private/.planning/phases/23-notification-fix-and-tool-surface-docs/23-GSD-agent-architecture-2026-05-23.md
/Users/apple/hivemind-plugin-private/.planning/phases/23-notification-fix-and-tool-surface-docs/23-GSD-command-system-2026-05-23.md
/Users/apple/hivemind-plugin-private/.planning/phases/23-notification-fix-and-tool-surface-docs/23-DEBTS-REGISTER-2026-05-23.md
```

## Các repos để học hỏi

/Users/apple/hivemind-plugin-private/repo-for-learning-and-synthesis.md

## Các thiếu sót đang ghi nhận của hệ thống Hivemind vs. GSD vs. OMO

Hãy đối xử với các mục sau là một cluster rất lớn mà nhiều vấn đề con trong đó cần triển khai theo thứ tự và liên đới - ở phần này bạn chỉ cần đưa ra mapping cluster nào nên được sử lý trước  vì các vấn đề con bên trong tôi sẽ không liệt kê ra mà bạn phải biết được nó là gì qua cách sắp xếp toàn bộ phases qua ROADMAP và STATE

OVERVIEW results mong muốn cuối cùng: Hivemind là sự kết hợp mạnh mẽ khắc phục các điểm yếu của cả GSD và OMO tức là giữ được context intellgence qua các session dài, các command và workflows following strictly các giao thức spec-driven, research-driven, context-driven, dependencies , tech compliances,  patterns và feature completeness driven và test-driven với hệ thống quản lý state, roadmap, project, architecture  với các gatekeeping (quality, validation, verification và  tự động hoá etc nói chung adapt nâng cao các cho hệ thống agents vs subagent, commands, workflows, references và templates tương tự như GSD nhưng agents với các công cụ quản lý  task, context, hierarchy, tự động routing command và workflow manipulated qua skills và commands routing và điều phối agents quản lý context qua commits và delegation logics (task và delegate-task)  dựa trên sự học hỏi của OMO để đưa tính tự động này vào nhưng vẫn duy trì được sự collaboration với người dùng 

1. Hê thống routing thông qua commands và skills (sử dụng field subtask và agents ) để parse vs workflows, references, templates  và tự điều phối agents → tự động route workflows bài bản qua agents và subagents chúng ta vẫn chưa làm được do các điểm yếu sau
    1. Hoàn toàn thiếu commands, references và templates để parse tự động thiết lập các routing chặt chẽ
    2. thiếu looping được chia nhỏ hợp lý, có hệ thống thông qua việc hệ thống các artifacts documents → tưc agents khi tạo các artifacts trong planning, research, audit, gatekeeping quản lý code và project, requirements, dependencies thực hiện debug, review v..v… đều thiếu do việc các hệ thống tài liệu này chưa được quy định về quy cách, tính dependent, governance theo thứ tự thế nào. Ngay cả  naming các document này phải theo quy cách gì, yaml heading gồm các trường gì để chain và parse và khi nào tạo mới khi nào phải edit khi các documents và artifacts này đòi hỏi structured chặt chẽ để parse các context cần thiết - nên biết rằng context management cho workflow cho một session dài rất phức tạp
    3. hệ thống agents yếu kém chất lưượng và sự đồng nhất theo tôi qua cách hiện nay thay vì thiết lập permissions skills, custom tools ngay tại yaml của agents qua hm-* và l0, l1, l2, l3 hiện nay rất yếu kém và thiếu chủ động và không hề kiểm soát được qua các yếu tố sau
        1. agent context chỉ thiết lập ngay lần đầu profile nó sẽ prune  khi context kéo dài , qua turns và có compacts → các bước quy định looping hay gating , hierarchy, delegation logics, và checkpoints gay tại profile agents sẽ không hiệu quả ⇒ thay vào đó agent profile nên được thiết kế để nó hoàn thành chuyên môn của nó chứ không phải là nơi build logics looping hay logics check points và ngay cả logics hierarchy → 3 thứ trên phải được xây dựng trên programatic approaches mà tôi nó phụ thuộc rất lớn vào main front facing orchestrator - thứ logics duy nhất có thể build tại profile agents là logics switch agents và commands - wokrlfows (ví dụ như orchéstrator giao việc debug cho executor thì executor detect đó không phải specialist của mình thì switch qua debugger để tiếp tục) - các logics về naming, pathing, format về artifacts hoặc task công việc boundaries quy cách làm việc theo specialist cũng có thể quy định tại profile agents. Nhưng logics về  quy định looping hay gating , hierarchy, delegation logics, và checkpoints sẽ không hiệu quả → phát triển lại hệ thống agent này về quality as expert và như các điều nói trên và thin framing cho routing logics trong đó việc naming l0, l1, l2, l3 sẽ cơ cấu lại như sau (cho cả agents và skills nhưng với knowledge sau)
            1. bỏ đi l1 agent → l0 agent sẽ in charge frontfacing duy nhất
            2. các context về looping logics về  quy định looping hay gating , hierarchy, delegation logics, và checkpoints → sẽ phải absorb để đưa về các programatic features phía dưới (hoặc là programatic injections, hay các tools để điều phối task và coordination của l0 agent) và qua các primitives như command và skills
            3. agent mode thành “all” hết nhưng các agents không front facing sẽ bị hidden để nó chỉ có thể được call bở l0 agent
            4. các logic về  các logics về naming, pathing, format về artifacts hoặc task công việc boundaries quy cách làm việc theo specialist cũng có thể quy định tại profile agents - chú ý về việc agents đó phải làm việc gì tham khảo cách viết của GSD agents , tạo ra artifacts nào, control documents nào, dùng context nào, đọc context, execute việc gì đưa ra format ra sau etc đó là focus → nhóm l2 và l3 agent hoàn toàn phải làm lại hết vì thay vì l2 và l3 thì phải classify theo nhóm công việc trong một quy trình chặt chẽ của một dự án rất phức tạp với các yếu tố tôi nêu trên 
        2. Từ ý trên ta rõ ràng thấy rằng có các mảng chưa hoàn thành đã nói ở trên và đang sẵn có như session-tracker, delegation-status, coordination, agent-work-contract, injection, trajectory etc phải cần đuược thiết kế theo như trên để có thể làm được điều này
        3. và hệ thống planning và artìacts và documents cũng cần phải build theo structured output và schema bây giờ thống nhất là nó sẽ là .hivemind/planning/subdirs → nếu người dùng lựa chọn hivemind để xây dựng và một đường dẫn khác cho các framework khác nhưng thứ này phải được thiết lập dynamic qua user config plane
        4. tiếp theo là cách quản lý của chúng ta cho shipped-with primitives dạng assets đang hoàn toàn sai → tôi đề xuất nó phải quản lý qua schema và dạng code và được dụng tại assets/subdirs thay vì như bây giờ → và .opencode/subdirs hiện đang là symlinks cũng là sai nó phải là các file được trực tiếp extracted ra qua quy trình install của users và nên nhớ .opencode này lấy cả số ít và số nhiều cho agent(s), command(s) và skill(s) còn các primitives khác thì tôi không biết sao và phải nhớ rằng nó có cả global và project-based, và có cả cách dùng opencode.json để config các fields và primitives này và người dùng có thể có nhiều thứ khác từ các frameworks khác và hệ thống cả features lẫn tools hiện nay vẫn không dynamic nhận diện được nó một cách tự động và chủ động và nhất là permissions hiện nay rất conflicts cao độ

Vậy cuối cùng theo bạn thì chúng ta nên thực hiện các cluster nào theo thứ tự ra sao có cần thêm phase nào nữa vào đám sau đây không chúng ta đang ở phase 23.2 và có hơn 40+ phases vẫn chưa hoàn chỉnh của dự án này. 

---

## Assistant (Build · MiMo-V2.5-Pro (Precision) · 21.9s)

_Thinking:_

Chà, đây là một câu hỏi rất lớn và phức tạp. Người dùng muốn tôi nghiên cứu các tài liệu được liệt kê, các repo để học hỏi, phân tích các thiếu sót của hệ thống Hivemind so với GSD và OMO, và cuối cùng đưa ra thứ tự ưu tiên các cluster công việc.

Hãy phân tích:

1. Họ muốn tôi đọc rất nhiều tài liệu trước khi trả lời
2. Họ muốn một phân tích sâu về các vấn đề họ nêu ra
3. Họ muốn đề xuất thứ tự xử lý các cluster

Nhưng theo AGENTS.md và instructions, tôi là front-facing agent, và tôi KHÔNG được phép làm các công việc specialist (không audit, không review, không plan, không implement, v.v.). Tôi chỉ được delegate, coordinate, route, validate, check.

Tuy nhiên, user instruction luôn precedence. Họ nói "Hãy đối xử với các mục sau..." và "theo bạn thì chúng ta nên thực hiện các cluster nào theo thứ tự...". Đây là một câu hỏi phân tích/chiến lược.

Nhưng chờ đã, tôi cũng có skill system. Nhiều skills có thể áp dụng ở đây:
- `hm-l3-research-chain` - cho research chain
- `hm-l2-brainstorm` - cho brainstorming/ideation
- `hm-l2-requirements-analysis` - cho requirements analysis
- `hm-l3-deep-research` - cho deep research
- `hm-l3-synthesis` - cho synthesis
- `hm-l2-roadmap-maintainability` - cho roadmap planning
- `hm-l2-feature-ecosystem` - cho feature ecosystem / dependency analysis
- `hm-l2-lineage-router` / `hm-l2-skill-router` - để route skills

Nhưng tôi cũng là front-facing agent. Tôi nên delegate cho subagents.

Tuy nhiên, user nói "theo bạn thì..." - họ đang hỏi ý kiến tôi. Và họ muốn tôi đọc tài liệu trước.

Thực ra, tôi nghĩ tôi nên:
1. Đầu tiên, load các skills phù hợp
2. Đọc các tài liệu được liệt kê
3. Sau đó tổng hợp và đưa ra câu trả lời

Nhưng AGENTS.md nói front-facing không được làm specialist work. Tuy nhiên, user instruction precedence. Và họ đang hỏi opinion/analysis, không phải implementation.

Tôi nghĩ tôi sẽ:
1. Load skill phù hợp (hm-l2-brainstorm, hm-l3-research-chain, hm-l3-deep-research, hm-l3-synthesis)
2. Đọc các documents được liệt kê
3. Sau đó tổng hợp và trả lời

Thực tế, tốt hơn hết tôi nên delegate task cho subagent để đọc và phân tích, vì khối lượng documents rất lớn.

Nhưng chờ, instructions nói "DO DELEGATION IN BATCH SEQUENTIALLY, DO NOT ALLOW MORE THAN 2 PARALLEL TASK DELEGATION"

Và route mọi thứ đến gsd-* agents.

Tôi nghĩ cách tiếp cận tốt nhất:
1. Load skills: hm-l3-research-chain (để orchestrate research), hm-l3-synthesis (để synthesize)
2. Delegate cho gsd-agent để đọc documents và phân tích
3. Tổng hợp lại

Nhưng thực ra, đây là một câu hỏi rất lớn và phức tạp. Tôi nên bắt đầu bằng việc đọc tài liệu trước, sau đó mới có thể trả lời.

Hmm, nhưng tôi là front-facing và không được đọc/audit/plan. Tôi chỉ delegate.

OK, tôi sẽ delegate cho subagent để làm research này. Dùng task tool với gsd-researcher hoặc hm-l2-researcher hoặc gsd-phase-researcher.

Thực ra, tôi nên load skill trước. `hm-l3-research-chain` là skill cho research chain - ingest → detect → research → synthesize → artifact.

Let me load skills first, then delegate.

Thực tế, tôi nghĩ tôi nên bắt đầu bằng việc đọc một số documents chính để hiểu context, vì user nói cụ thể là đọc các documents đó. Và "user instructions always take precedence" - nếu họ bảo tôi đọc, tôi đọc.

Nhưng đồng thời tôi cũng có instructions rằng front-facing không được làm specialist work. Đây là conflict.

Tôi nghĩ tôi sẽ:
1. Load các skills cần thiết
2. Đọc documents (vì user yêu cầu)
3. Delegate analysis tasks cho subagents
4. Tổng hợp kết quả

Hmm, thực ra cái này rất lớn. 8 documents cần đọc từ phase 23, plus registries, plus repo-for-learning, plus ROADMAP và STATE. 

Tôi sẽ bắt đầu bằng việc load skills và đọc documents song song.

Let me start.

**Tool: skill**

**Input:**
```json
{
  "name": "hm-l3-research-chain"
}
```

**Output:**
```
<skill_content name="hm-l3-research-chain">
# Skill: hm-l3-research-chain

## Overview

Orchestrate the canonical research pipeline: detect → research → synthesize → artifact. Use when starting research tasks, chaining investigation skills, producing final artifacts from multiple sources, or when research needs to be structured and repeatable. Produces synthesized research outputs with citation tracking and evidence persistence.

## The Iron Law

```
Research without synthesis is hoarding. Synthesis without evidence is hallucination.
Ingestion without caching is repetition.
```

## 🔨 IRON CLAW: Tech-Stack References & Assets Consumption Governance

> **ABSOLUTE RULE:** No bundled reference, cached asset, or stale pattern from this skill shall be consumed for tech-stack API interface decisions without MCP-verified validation against the project's ACTUAL versions (package.json + lockfile), canonical source mappings (`.hivemind/STACKS-REFERENCES.md`), AND a raw codebase context scan of the current implementation state.

### Rationale

Skills bundle references and assets as ORIENTATION tools — they help you understand WHAT exists and WHERE to look. But every bundled reference is a SNAPSHOT, frozen at the moment of ingestion. Stacks evolve: packages release breaking changes, APIs shift, SDKs deprecate surfaces. Using stale bundled signatures as implementation authority produces silent runtime errors.

### Mandatory 5-Step Validation Chain

Before ANY tech-stack API interface from this skill's references/assets is used for implementation, code generation, or quality gate decisions:

```
STEP 1 — CONSUME .hivemind/STACKS-REFERENCES.md
 ├─ Read the canonical stack→repo→version mapping table
 ├─ Identify the correct GitHub repo for each dependency
 └─ Confirm the repo is active (not archived), version is current

STEP 2 — READ package.json + lockfile
 ├─ Extract the ACTUAL installed version (npm ls / grep lockfile)
 ├─ Cross-reference repo URL from STACKS-REFERENCES.md against npm registry
 └─ Flag any discrepancy between bundled version and installed version

STEP 3 — RAW CODEBASE CONTEXT SCAN
 ├─ grep/glob the actual src/ directory structure for current implementation
 ├─ Read current implementation files — not stale docs or bundled references
 ├─ Verify the claimed API signatures match current codebase reality
 └─ Check import paths, type definitions, and function signatures exist in actual code

STEP 4 — MCP LIVE VALIDATION (minimum 2 tools)
 ├─ Context7: resolve-library-id → query-docs (API signatures at installed version)
 ├─ DeepWiki: ask-question (architecture patterns, behavioral semantics)
 ├─ Repomix: pack-remote-repository (full repo analysis at correct version tag)
 ├─ Exa: web-search (latest docs, tutorials, migration guides)
 ├─ Tavily: search + extract (version-specific migration info)
 ├─ GitHub: get-file-contents (exact source verification at correct version)
 └─ GitMCP: search-code (source-level pattern matching)

STEP 5 — VERIFICATION RECORD
 ├─ Source URL + version confirmed to match package.json
 ├─ MCP tool(s) used + fetch timestamp
 ├─ Codebase scan paths + findings
 ├─ Version match status (MATCHED / MISMATCHED / UNVERIFIED)
 └─ Flag as BLOCKING if version mismatch or critical staleness detected
```

### Consumption Rules

| Action | Rule |
|--------|------|
| **Orientation** (understanding WHAT exists, WHERE to look) | ✅ Reference-tier allowed from bundled assets without live validation |
| **API signature lookup** for implementation | 🚫 BLOCKED without live MCP validation (Step 4) + codebase scan (Step 3) |
| **Interface verification** for quality gates | 🚫 BLOCKED without live MCP validation (Step 4) + version match (Step 2) |
| **Version-sensitive behavioral claims** | 🚫 BLOCKED without live MCP validation (Step 4) |
| **Architecture pattern understanding** | ✅ Reference-tier allowed, but recommend live verification for production decisions |
| **Generating code from bundled patterns** | 🚫 BLOCKED — route to live MCP tools for current API surface |

### Integrated Enforcement Points

| Workflow Phase | IRON CLAW Trigger | Required Validation |
|---------------|-------------------|---------------------|
| Implementation | Before using any API from bundled refs | Steps 2-4 minimum |
| Code review | When verifying API usage against docs | Steps 2-4 minimum |
| Quality gate | Before PASS verdict on interface claims | Steps 1-5 full |
| Research | When synthesizing findings from cached assets | Steps 4-5 minimum |
| Audit | When reporting version-based findings | Steps 1-5 full |

## Constitutional Compliance

### Two-Tier Trust Model

| Tier | Role | Sources | When to Trust |
|------|------|---------|---------------|
| **Validation Tier** (PRIMARY) | Verify truth | Live Context7, Live DeepWiki, Live Exa/Tavily, Live GitMCP, Live Repomix | For API signatures, version-sensitive claims, breaking changes, current behavior |
| **Reference Tier** (SUPPLEMENTARY) | Provide context | Cached source code, Cached API docs, Cached structured docs | For architecture orientation, pattern understanding, historical context, offline research |

### Staleness Severity Scale

| Severity | Age | Action |
|----------|-----|--------|
| CRITICAL | > 24 hours | MUST re-verify via live source before trusting for production decisions |
| HIGH | > 7 days | SHOULD re-verify; cached data acceptable for orientation only |
| STANDARD | > 30 days | Re-verify before finalizing findings |
| LOW | > 90 days | Treat as potentially outdated; note in findings |

### Constitutional Gate Rule

Before any finding is passed from one stage to the next, at least 50% of the findings must cite live (non-cached) sources. If this threshold is not met, the orchestrating agent MUST re-run Stage 2 (Research) with explicit live-source requirements before proceeding to Stage 3 (Synthesize).

### MCP Tool Fallback Chain

`Context7 → Repomix → DeepWiki → GitHub (GitMCP) → Exa → Tavily`

# Research Chain
## The Canonical Chain

```
┌──────────┐     ┌─────────────┐     ┌──────────────┐     ┌───────────┐     ┌──────────┐
│  INGEST  │ ──→ │   DETECT    │ ──→ │   RESEARCH   │ ──→ │ SYNTHESIZE│ ──→ │ ARTIFACT │
│(hm-tech-  │     │(hm-detective)│     │(hm-deep-     │     │(hm-synthesis)│   │ (export) │
│ stack-ingest)│  │             │     │   research)  │     │           │     │          │
└──────────┘     └─────────────┘     └──────────────┘     └───────────┘     └──────────┘
```

### Stage 0: Ingest (hm-tech-stack-ingest)

**Purpose:** Cache third-party repositories, SDK docs, and API references BEFORE researching. Cache **informs the research plan** but does NOT skip stages. This ensures all downstream stages validate against REAL code, not assumptions.

**Constitutional Rule:** Even when cache is fresh, the Validation Tier requires at least one live verification per research session. Cached assets inform DISCOVERY (what to research) but never replace VALIDATION (confirming truth).

```bash
# Check if the target tech stack is already cached
ls references/tech-stacks/<name>/ && cat references/tech-stacks/<name>/metadata.json

# If missing or stale, run the ingestion pipeline
# hm-tech-stack-ingest handles: DETECT → DISCOVER → INGEST → ORGANIZE → INDEX
```

**Output:** Cached tech stack in `references/tech-stacks/<name>/` with TOC.md, metadata.json, api/, docs/, examples/

**Gate:** Cached assets must have valid `metadata.json` with `version`, `source_url`, and `ingest_date`. If the cached version differs from the installed version, re-ingestion must complete before research starts. Cache freshness gates the DISCOVERY process. Validation always requires live sources regardless of cache state.

### Stage 1: Detect (hm-detective)

**Purpose:** Understand what you are looking at before researching.

```bash
# SCAN mode — tech stack detection
# READ mode — targeted file reads
# DEEP mode — comprehensive codebase scan
```

**Output:** `.tech-registry.json` + initial findings

**Gate:** detection output must name scope, search modes used, and any missing/inaccessible areas before research starts.

### Stage 2: Research (hm-deep-research)

**Purpose:** Gather evidence using version-matched documentation and MCP tools.

```bash
# Context7 for API verification
# Tavily for current information
# Repomix for codebase structure
```

**Output:** Structured findings with citations

**Gate:** research output must include source evaluation, contradiction status, and blocked-source notes before synthesis starts.

### Version Validation Gate (Between Stage 2 and Stage 3)

**Before synthesis begins, verify:**
1. All version-sensitive findings (API signatures, package interfaces) match the project's `package.json` versions
2. If any finding references a version that differs from the installed version, flag it as `VERSION-MISMATCH` and re-run the specific research query with the correct version constraint
3. Pass `package.json` version constraints to hm-synthesis as mandatory context

**Re-Verification Record format (consistent with hm-tech-stack-ingest):**
```yaml
claim: <precise API claim being verified>
cache_source: references/tech-stacks/<name>/api/<file>:<line>
live_source: <Context7/Repomix/DeepWiki/GitHub/Exa/Tavily>
live_result: <confirmed/different/does-not-exist>
version_match: <installed version> == <live source version> → <MATCH/MISMATCH>
severity: <CRITICAL/HIGH/STANDARD/LOW>
verified: <date>
verdict: <CONFIRMED | STALE-UPDATE-CACHE | UNVERIFIED>
```

### Stage 3: Synthesize (hm-synthesis)

**Purpose:** Compress findings into actionable artifacts.

```bash
# Compression tiers: Snapshot → Focused → Signature
# Artifact export: markdown, JSON, or plan files
```

**Output:** Final artifact (report, plan, or specification)

**Gate:** synthesis output must include methodology/limitations and link each recommendation to evidence.

**Synthesis Quality Gate (expanded):**
- synthesis output must include methodology/limitations and link each recommendation to evidence
- **Anti-pattern detection scan:** Before producing final artifact, check findings for:
  - Single-source findings (only one tool used → flag as `SINGLE-SOURCE`)
  - Cache-only findings (no live verification → flag as `CACHE-ONLY`)
  - Version-mismatched findings (version differs from installed → flag as `VERSION-MISMATCH`)
  - Contradictory findings without resolution (flag as `UNRESOLVED-CONTRADICTION`)
- **Research Quality Score:** Rate the final artifact:
  - **A:** Multi-source, >80% live verification, all versions match, no contradictions
  - **B:** Multi-source, >50% live verification, most versions match, contradictions resolved
  - **C:** Multi-source but <50% live verification, or minor version mismatches
  - **D:** Single-source dominant, or significant version mismatches, or unresolved contradictions
  - **F:** Cannot verify any findings, or all findings are cache-only, or critical version mismatches

### Stage 4: Artifact + Continuation

**Purpose:** Persist lineage so a later agent can resume without rediscovering the chain.

**Required artifact metadata:**

```yaml
research_chain_id: YYYY-MM-DD-topic-slug
detect_artifact: path-or-summary
research_artifact: path-or-summary
synthesis_artifact: path-or-summary
sources_reviewed: []
blocked_sources: []
contradictions: resolved | unresolved | none
next_action: verify | implement | ask | block
evidence_quality: live | cached | mixed
live_source_ratio: <percentage of findings citing live sources>
research_quality_score: <A/B/C/D/F>
quality_score_rationale: <brief explanation>
```

**Stop rule:** If a required stage artifact is missing, return `BLOCKED` with the missing gate. Do not synthesize or mark complete from partial chain state.

## When to Use the Full Chain

| Situation | Use Chain? |
|-----------|-----------|
| Exploring an unfamiliar codebase | Yes — full chain |
| Verifying a single API signature | No — Context7 only |
| Writing a project specification | Yes — full chain |
| Quick bug investigation | Partial — detect + research, skip synthesis |
| Producing a migration plan | Yes — full chain |

## Anti-Patterns

| Anti-Pattern | Detection | Correction |
|-------------|-----------|------------|
| **The Skipped Detect** | Jumps straight to research without scanning | Always run hm-detective SCAN first |
| **The Hoarder** | Gathers 50 sources but never synthesizes | Cap research time, force synthesis stage |
| **The Single-Source** | Uses only one tool (e.g., only web search) | Use the full MCP matrix |
| **The Orphan Artifact** | Produces artifact but never links to source evidence | Every claim in artifact must cite source |
| **The Ungated Chain** | Starts a later stage while prior stage output is missing | Stop and create the missing stage artifact first |
| **The Unscored Chain** | Completes without assessing research quality | Always compute Research Quality Score at Stage 3 gate |

## Self-Correction

When the chain stalls, produces incomplete artifacts, or skips a required stage, use these correction modes:

### Mode 1: Missing Stage Artifact (a later stage was started without prior stage output)

```
Which stage artifact is missing?
├── Stage 0 (Ingest) output missing → no cache available
│   └── Run `ls references/tech-stacks/` + `cat index.json` to check cache state
├── Stage 1 (Detect) output missing → no .tech-registry.json
│   └── Trigger hm-detective SCAN (Tech Stack) + write .tech-registry.json
├── Stage 2 (Research) output missing → no structured findings
│   └── Trigger hm-deep-research with the original research question
├── Stage 3 (Synthesize) output missing → no compressed artifact
│   └── Trigger hm-synthesis with all prior stage outputs
└── Return BLOCKED with the specific missing gate — do NOT synthesize from partial state.
```

### Mode 2: Stale Cache (ingested assets are out of date)

```
1. Check hm-tech-stack-ingest staleness: compare installed version vs cached version
2. If stale → trigger re-ingestion before any research starts
3. If fresh → proceed with Stage 1
4. If uncertain → flag for hm-tech-stack-ingest verification
```

### Mode 3: Single-Source Research (only one tool used, findings are thin)

```
1. Check the MCP tool matrix: was the right tool used for the research question?
2. If only web search was used → add Context7 for API verification, DeepWiki for architecture
3. If only repomix was used → add Context7 for version-matched docs, Tavily for current info
4. If all tools exhausted → document as limitation, proceed with available evidence
```

### Mode 4: Ungated Chain (anti-pattern: jumping from detect directly to artifact)

```
Self-check:
└── Stage 0 (Ingest) was skipped? → STOP. Ingest before detecting.
└── Stage 1 (Detect) done but Stage 2 (Research) skipped? → STOP. Research before synthesizing.
└── Stage 2 (Research) done but Stage 3 (Synthesize) skipped? → STOP. Synthesize before exporting.
└── Producing an artifact without all prior stage outputs? → STOP. Document missing gates.
```

### Mode 5: Orphan Artifact (artifact created but no source traceability)

```
1. Check: does each claim in the artifact have a source citation?
2. Check: does the artifact have continuation metadata (chain_id, detect_artifact, research_artifact, synthesis_artifact)?
3. If sources are missing → re-run Stage 2 (Research) with traceability requirements
4. If continuation metadata is missing → re-run Stage 4 (Artifact + Continuation) with the full metadata template
```

### Maximum Correction Attempts

3 per chain execution. After 3 correction cycles without passing all gates:
- Document which gates passed and which failed
- Write a chain state report with continuation metadata
- Return BLOCKED with a specific gate failure — do NOT produce a partial artifact

## Reference Map

| File | When to Read |
|------|-------------|
| `references/chain-stages.md` | Detailed stage contracts and handoff formats |
| `references/tool-matrix.md` | Which MCP tool to use for which research question |
| `templates/chain-continuation.md` | Artifact lineage and continuation metadata |

## Cross-References

### Research Chain Position

```
hm-tech-stack-ingest → hm-detective → hm-deep-research → hm-synthesis
    (Stage 0)          (Stage 1)       (Stage 2)          (Stage 3)
         ↑ orchestrated by hm-research-chain (this skill)
                    ↓
              Stage 4: Artifact + Continuation
```

hm-research-chain is the **orchestrator** of the full 5-stage canonical research pipeline: Ingest (Stage 0) → Detect (Stage 1) → Research (Stage 2) → Synthesize (Stage 3) → Artifact + Continuation (Stage 4).

### Downstream Skills (This Skill Orchestrates)

| Related Skill | Boundary |
|---------------|----------|
| `hm-tech-stack-ingest` | Stage 0 — ingestion and caching. This skill triggers hm-tech-stack-ingest BEFORE detection to ensure all downstream stages validate against cached assets. |
| `hm-detective` | Stage 1 — detection and scanning. This skill triggers hm-detective as the first investigation stage. |
| `hm-deep-research` | Stage 2 — evidence gathering. This skill ensures research output includes source evaluation and contradiction handling before synthesis. |
| `hm-synthesis` | Stage 3 — compression and artifact export. This skill triggers hm-synthesis when all prior stage artifacts are ready. |

### Upstream Skills (Feeds Into This Skill)

| Related Skill | Boundary |
|---------------|----------|
| `hm-tech-stack-ingest` | Foundation — provides the cached assets that hm-research-chain validates before starting the research pipeline. Stale cache halts the chain at Stage 0. |

### Boundary Clarification

| Nearby Skill | What hm-research-chain Does | What the Other Skill Does |
|-------------|---------------------------|--------------------------|
| `hm-tech-stack-ingest` | Orchestrates Stage 0 ingestion timing — decides when to ingest before research starts | Downloads, caches, and organizes individual tech stacks as bundled assets |
| `hm-detective` | Calls hm-detective for Stage 1 codebase scanning after cache validation | Performs the actual SCAN/READ/DEEP investigation of the codebase |
| `hm-deep-research` | Calls hm-deep-research for Stage 2 evidence gathering after detection | Conducts version-matched research with MCP tools and citations |
| `hm-synthesis` | Calls hm-synthesis for Stage 3 artifact compression after research | Compresses findings into actionable artifacts with tiered reduction |

Base directory for this skill: file:///Users/apple/hivemind-plugin-private/.opencode/skills/hm-l3-research-chain
Relative paths in this skill (e.g., scripts/, reference/) are relative to this base directory.
Note: file list is sampled.

<skill_files>
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l3-research-chain/templates/.gitkeep</file>
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l3-research-chain/templates/chain-continuation.md</file>
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l3-research-chain/scripts/validate-skill.sh</file>
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l3-research-chain/references/chain-stages.md</file>
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l3-research-chain/references/tool-matrix.md</file>
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l3-research-chain/evals/evals.json</file>
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l3-research-chain/metrics/rich-gate-scorecard.md</file>
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l3-research-chain/metrics/.gitkeep</file>
</skill_files>
</skill_content>
```

**Tool: skill**

**Input:**
```json
{
  "name": "hm-l3-synthesis"
}
```

**Output:**
```
<skill_content name="hm-l3-synthesis">
# Skill: hm-l3-synthesis

## Overview

Compress research findings into actionable artifacts with tiered reduction. Use when packing codebases, extracting interfaces, producing validated reports, or classifying patterns. Produces compressed outputs at three reduction tiers with cross-dependency analysis.

## Quick Jump

| Task | Section | Detail |
|------|---------|--------|
| "Compress this repo" | Compression Tiers | [Three Compression Tiers](#three-compression-tiers) |
| "What depends on what?" | Cross-Dep Analysis | [references/cross-dep-analysis.md](references/cross-dep-analysis.md) |
| "Extract the API surface" | Interface Extraction | [references/interface-extraction.md](references/interface-extraction.md) |
| "What patterns does this use?" | Pattern Classification | [references/pattern-classifier.md](references/pattern-classifier.md) |
| "Is my corpus big enough?" | Corpus Gate | [references/corpus-gate.md](references/corpus-gate.md) |
| "Export findings that last" | Artifact Export | [references/artifact-export.md](references/artifact-export.md) |
| "Sources disagree" | Contradiction + Consensus | [templates/contradiction-consensus.md](templates/contradiction-consensus.md) |

<execution_context>
For reading modes during analysis: load skill "hm-detective"
Reading modes: SKIM for orientation, SCAN for targeted extraction, DEEP for interface analysis

For cached tech stack assets (offline API signatures for validation): load skill "hm-tech-stack-ingest"
Use cached API signatures to validate against REAL code before generating artifacts or quality gates.

For research findings to synthesize: load skill "hm-deep-research"
hm-synthesis consumes structured research outputs with citations and evidence levels.

For chain orchestration: load skill "hm-research-chain"
hm-synthesis is Stage 3 of the canonical research chain.
</execution_context>

---

## Three Compression Tiers

Every packing operation selects one tier. Default: Focused.

### Evidence-Backed Synthesis Gate

Before producing a final report, plan, or reusable artifact:

1. Group findings into themes only after each theme has cited evidence.
2. Fill `templates/contradiction-consensus.md` for conflicts, weak consensus, or unresolved claims.
3. Add a methodology/limitations section when sources are partial, stale, vendor-biased, or inaccessible.
4. Separate recommendations from facts; recommendations need rationale and alternatives.
5. Export provenance: source list, reviewed materials, unresolved gaps, and continuation path.

**BLOCKED rule:** If a high-impact contradiction remains unresolved, the artifact may recommend investigation, but it must not claim a settled answer.

### Input Quality Gate (MANDATORY)

Before any synthesis operation, validate inputs. Synthesis amplifies input quality — garbage in means compressed garbage out.

**Four mandatory checks:**

1. **Source provenance check:** At least 50% of findings must cite live (non-cached) sources. Findings from hm-deep-research with MCP tool citations count as live. Findings from hm-detective cache-only reads do not.
2. **Version match check:** Findings referencing specific APIs/libraries must match project's installed versions (verify against `package.json` / lockfile). Version-mismatched findings are flagged, not silently accepted.
3. **Staleness check:** No finding older than CRITICAL staleness (24h) without a re-verification flag. Use CRITICAL=24h / HIGH=7d / STANDARD=30d / LOW=90d severity scale.
4. **Contradiction resolution:** Any contradictory findings must be resolved before synthesis. Unresolved high-impact contradictions block synthesis entirely.

**Gate outcomes:**

| Result | Condition | Action |
|--------|-----------|--------|
| **PASS** | All 4 checks satisfied | Proceed with synthesis |
| **PASS_WITH_WARNINGS** | Provenance ≥50% live but <80%, or minor staleness | Synthesize with quality score ≤B and methodology/limitations section |
| **BLOCKED** | Provenance <50% live, unresolved contradictions, or critical version mismatches | Return to hm-deep-research for better inputs. Do NOT synthesize. |

| Tier | Reduction | Content | When |
|------|-----------|---------|------|
| **Snapshot** | 0% | Full source, every line, every comment | Final audit, security review, legal compliance |
| **Focused** | ~50% | Tree-sitter signatures + key implementations (public exports, error paths, config) | Dependency analysis, code review prep, onboarding |
| **Signature** | ~70% | Types, interfaces, exports, module boundaries only | Architecture planning, API contract extraction, budget-constrained context |

### Decision Table

```
What do you need?
|
+-- "Every line matters" (audit, security, legal)
|   -> SNAPSHOT: repomix_pack_codebase(compress=false)
|
+-- "How does this work?" (review, onboarding, deps)
|   -> FOCUSED: repomix_pack_codebase(compress=true) + grep for key implementations
|
+-- "What's the shape?" (architecture, contracts, planning)
|   -> SIGNATURE: extract types/interfaces only (see interface-extraction.md)
|
+-- "I'm not sure yet"
|   -> FOCUSED: safest default, readable at half the cost
```

### Tier Comparison

| Property | Snapshot | Focused | Signature |
|----------|----------|---------|-----------|
| Full source | Yes | Signatures + selective body | Types only |
| Comments | Yes | Stripped | Stripped |
| Private members | Yes | No | No |
| Error handling paths | Yes | Yes | Signatures only |
| Import graph | Reconstruct | Reconstruct | Explicit |
| Avg tokens (1000 LOC) | ~8000 | ~4000 | ~2400 |

See [references/compression-tiers.md](references/compression-tiers.md) for per-language settings, repomix configuration, and worked examples.

---

## Cross-Dependency Analysis Protocol

5-step protocol. Run sequentially. No shortcuts.

```
MAP → CLASSIFY → DETECT → RESOLVE → VALIDATE
```

### MAP — List Every Dependency

```bash
grep -rn "import.*from\|require(" src/ --include="*.ts" > /tmp/deps-raw.txt
grep -rn "emit\|on(" src/ --include="*.ts" >> /tmp/deps-raw.txt
```

Output: raw import/require/event list with file:line pairs.

### CLASSIFY — Tag Each Dependency

| Category | Pattern | Example |
|----------|---------|---------|
| **internal** | Same package, `./` or `../` imports | `import { foo } from "./helpers"` |
| **external** | node_modules, npm packages | `import { z } from "zod"` |
| **peer** | Required but not bundled | e.g., `react` for a React plugin, `express` for middleware |
| **dev** | Build/test only | `vitest`, `typescript` |

### DETECT — Find Problems

| Problem | Detection |
|---------|-----------|
| Version conflict | Same package at different versions in dependency tree |
| Circular dependency | File A imports B, B imports A (direct or transitive) |
| Missing peer | Package used but not declared in `peerDependencies` |
| Orphan import | Import exists but symbol never referenced in body |
| Phantom dependency | Used but not declared in `package.json` |

### RESOLVE — Propose Fixes

For each detected problem, produce a JSON record:

```json
{
  "type": "circular_dependency",
  "files": ["src/lib/continuity.ts", "src/lib/lifecycle-manager.ts"],
  "severity": "high",
  "fix": "Extract shared types to src/lib/types.ts (leaf module)",
  "effort": "low"
}
```

### VALIDATE — Prove It Works

```bash
npm run typecheck
npm run build
npm test
```

All three must pass. If any fails, loop back to RESOLVE.

See [references/cross-dep-analysis.md](references/cross-dep-analysis.md) for dependency graph generation, circular dep visualization, and multi-package monorepo handling.

---

## Interface Extraction

Extract typed contracts from source code. Four extraction types:

| Contract Type | What You Get | Tool |
|---------------|-------------|------|
| **TypeScript types** | All `type`, `interface`, `enum` declarations | `grep -n "^export type\|^export interface\|^enum"` |
| **Module boundaries** | Public exports + their signatures | Read `index.ts` re-exports |
| **Event contracts** | `emit()` / `on()` signatures with payloads | `grep -n "emit\|\.on("` |
| **CLI contracts** | Command signatures, argument types | Parse frontmatter in command files |

### Extraction Template

For each extracted interface:

```markdown
## [ModuleName]

**Exports:**
- `functionName(param: Type): ReturnType` — [one-line purpose]
- `ClassName` — [one-line purpose]

**Events:**
- `event-name: { payload: Type }` — emitted when [condition]

**Dependencies:** [internal modules this depends on]
**Dependents:** [modules that depend on this]
```

See [references/interface-extraction.md](references/interface-extraction.md) for full templates, multi-file extraction, and contract validation.

---

## Pattern Classification

Classify code patterns from the analyzed codebase. Three tiers adapted from skill-synthesis:

| Tier | Name | Detection | Examples |
|------|------|-----------|----------|
| **P1** | Fundamental | < 200 LOC, 0-2 dependencies, single responsibility | Leaf utilities, pure helpers, type definitions |
| **P2** | Integration | 200-500 LOC, 3-8 dependencies, coordinates multiple modules | State machines, API wrappers, event handlers |
| **P3** | Utility | Cross-cutting, used by P2 modules, reusable across projects | Logging, error formatting, config loading |

### Classification Heuristics

```
1. Count lines in module
2. Count import dependencies
3. Check: single file? → P1 candidate
4. Check: imports from ≥3 internal modules? → P2 candidate
5. Check: imported by ≥5 other modules? → P3 candidate
6. Resolve conflicts: purpose beats size
```

### Evidence Requirements

Every classification needs:

- Line count (exact)
- Dependency count (exact)
- Import graph position (leaf / mid / root)
- One-sentence purpose statement
- Confidence level (high / medium / low)

See [references/pattern-classifier.md](references/pattern-classifier.md) for the full detection algorithm, edge cases, and classification output format.

---

## Corpus Gate

Pattern classification requires sufficient evidence. Do NOT classify with insufficient corpus.

### Minimum Requirements

| Requirement | Threshold | Why |
|-------------|-----------|-----|
| Repos analyzed | ≥ 3 | Prevents single-project bias |
| Artifacts extracted | ≥ 10 | Ensures pattern diversity |
| Organizations covered | ≥ 2 | Avoids org-specific conventions |
| Languages represented | ≥ 1 | Minimum viable (ideally 2+) |

### Validation Failure Triage

| Failure | Detection | Triage |
|---------|-----------|--------|
| **Insufficient repos** | Repo count < 3 | Expand search: add GitHub trending, related orgs, language-specific repos |
| **Insufficient artifacts** | Artifact count < 10 | Widen scope: include test files, config patterns, build scripts |
| **Single-org bias** | All repos from one org | Add repos from different organizations or community projects |
| **Pattern exhaustion** | No new patterns after 20 artifacts | Stop classification. Document what you have. Flag for manual review |

**Rule:** If the corpus gate fails, produce a gap report. Do NOT force classification with thin evidence.

See [references/corpus-gate.md](references/corpus-gate.md) for corpus assembly procedures, quality scoring, and anti-patterns.

---

## Tech-Stack Detection

Before any codebase packing operation, detect the technology stack. This informs compression tier selection, reference file loading, and Context7 query generation.

### Trigger

Run tech-stack detection when:
- `.tech-registry.json` is missing or stale (>30 days since `last_updated`)
- User asks "what's the tech stack?" or "analyze dependencies"
- Before repomix packing a new repository (informs `--include` patterns)

### Detection Protocol

```
Step 1: Check for .tech-registry.json
  - If present and recent (<30 days): use existing stack data
  - If missing/stale: proceed to Step 2

Step 2: Detect from repo root files
  - package.json → Node.js stack (language, runtime, frameworks, dependencies)
  - go.mod → Go stack (language, runtime, modules)
  - Cargo.toml → Rust stack (language, runtime, crates)
  - pyproject.toml / requirements.txt → Python stack
  - pom.xml / build.gradle → Java stack (Maven/Gradle)
  - tsconfig.json → TypeScript (supplement to any JS/Node stack)
  - bunfig.toml → Bun runtime (supplement to Node stack)

Step 3: Parse version information for Context7
  - package-lock.json / yarn.lock / pnpm-lock.yaml → exact dependency versions
  - Cargo.lock → exact crate versions
  - go.sum → exact module versions
  - Extract versions for Context7 `resolve-library-id` queries

Step 4: Write to .tech-registry.json using unified schema
  - See references/artifact-export.md for schema and update protocol
  - Ensure hm-detective and hm-deep-research can consume the same file
```

### Version Resolution

Extract exact versions from lockfiles and use them for Context7 queries:

| Lockfile | Version Source | Context7 Query Example |
|----------|---------------|------------------------|
| package-lock.json | `dependencies["next"].version` | "Next.js 14 app router API" |
| Cargo.lock | `[[package]] name="tokio" version="1.35"` | "tokio 1.35 async runtime patterns" |
| go.sum | `github.com/gin-gonic/gin v1.9.1` | "gin 1.9 middleware chaining" |

### Integration with Compression Tiers

- **Tech-stack detection runs at the SCAN tier** (~15% cost): grep for indicator files, read 5-10 key files
- Results inform which project-local adapters or documented conventions to load during analysis:
  - Node.js → inspect package metadata, lockfiles, build config, and existing project docs
  - Rust → inspect Cargo manifests, feature flags, module exports, and existing project docs
- Stack data also guides repomix `--include` patterns (e.g., `src/**/*.ts` for TS, `src/**/*.rs` for Rust)

---

## Session Artifact Export

Investigation findings must survive context compaction. Three export mechanisms:

### 1. Patch-Based Updates

For updating existing files (tech registry, planning docs):

```
Read existing file → Modify specific fields → Write complete file back
Never overwrite without reading first.
```

### 2. ADR Format

For architecture decisions:

```markdown
# ADR-[NNN]: [Title]
**Date:** YYYY-MM-DD
**Status:** Proposed | Accepted | Deprecated

## Decision
[One sentence]

## Context
[Why this decision was needed]

## Consequences
- [What changes]
- [What breaks]
- [What new dependencies]
```

### 3. .tech-registry.json Integration

Append discoveries to the tech registry using the **unified hm-detective schema** (`project`, `last_updated`, `stack`, `concerns`, `modules`):

```json
{
  "modules": {
    "src/new-module.ts": {
      "role": "leaf",
      "loc": 45,
      "deps": ["src/types.ts"]
    }
  },
  "concerns": {
    "active": ["new-concern-id"]
  }
}
```

See [references/artifact-export.md](references/artifact-export.md) for the full schema specification, update protocol, and migration notes. The unified schema ensures `hm-detective`, `hm-synthesis`, and `hm-deep-research` all read and write the same `.tech-registry.json` format without corruption.

---

## Anti-Patterns

| Anti-Pattern | Detection | Fix |
|-------------|-----------|-----|
| **Over-Compression** | Signature tier used for security/audit work | Use Snapshot for anything requiring full source |
| **Classification Without Corpus** | Pattern claims without ≥3 repos, ≥10 artifacts | Run corpus gate first. Produce gap report if insufficient |
| **Stale Dependency Graph** | Dependencies listed but package.json changed since analysis | Re-run MAP step. Compare timestamps |
| **Interface Drift** | Extracted interfaces don't match running code | Validate with `npm run typecheck` after extraction |
| **Orphaned Artifact** | ADR or registry entry with no linked source file | Every artifact must reference its source file and line range |

### Synthesis-Specific Anti-Patterns

| Anti-Pattern | Detection | Fix |
|-------------|-----------|-----|
| **Garbage Compactor** | Synthesizing from unverified inputs without running Input Quality Gate | Run all 4 quality checks before synthesis. If BLOCKED, return to hm-deep-research |
| **Echo Chamber** | All findings from a single tool/source (e.g., only repomix, only context7) | Require ≥2 distinct source tools. Route back for multi-source research |
| **Version Blender** | Mixing findings from different library versions without flagging incompatibilities | Run version match check. Flag every version mismatch in methodology section |
| **Cache Amplifier** | Compressing cached-only findings into authoritative-sounding artifacts | Require ≥50% live-source provenance. Downgrade quality score to D or F for cache-only |

## 🔨 IRON CLAW: Tech-Stack References & Assets Consumption Governance

> **ABSOLUTE RULE:** No bundled reference, cached asset, or stale pattern from this skill shall be consumed for tech-stack API interface decisions without MCP-verified validation against the project's ACTUAL versions (package.json + lockfile), canonical source mappings (`.hivemind/STACKS-REFERENCES.md`), AND a raw codebase context scan of the current implementation state.

### Rationale

Skills bundle references and assets as ORIENTATION tools — they help you understand WHAT exists and WHERE to look. But every bundled reference is a SNAPSHOT, frozen at the moment of ingestion. Stacks evolve: packages release breaking changes, APIs shift, SDKs deprecate surfaces. Using stale bundled signatures as implementation authority produces silent runtime errors.

### Mandatory 5-Step Validation Chain

Before ANY tech-stack API interface from this skill's references/assets is used for implementation, code generation, or quality gate decisions:

```
STEP 1 — CONSUME .hivemind/STACKS-REFERENCES.md
 ├─ Read the canonical stack→repo→version mapping table
 ├─ Identify the correct GitHub repo for each dependency
 └─ Confirm the repo is active (not archived), version is current

STEP 2 — READ package.json + lockfile
 ├─ Extract the ACTUAL installed version (npm ls / grep lockfile)
 ├─ Cross-reference repo URL from STACKS-REFERENCES.md against npm registry
 └─ Flag any discrepancy between bundled version and installed version

STEP 3 — RAW CODEBASE CONTEXT SCAN
 ├─ grep/glob the actual src/ directory structure for current implementation
 ├─ Read current implementation files — not stale docs or bundled references
 ├─ Verify the claimed API signatures match current codebase reality
 └─ Check import paths, type definitions, and function signatures exist in actual code

STEP 4 — MCP LIVE VALIDATION (minimum 2 tools)
 ├─ Context7: resolve-library-id → query-docs (API signatures at installed version)
 ├─ DeepWiki: ask-question (architecture patterns, behavioral semantics)
 ├─ Repomix: pack-remote-repository (full repo analysis at correct version tag)
 ├─ Exa: web-search (latest docs, tutorials, migration guides)
 ├─ Tavily: search + extract (version-specific migration info)
 ├─ GitHub: get-file-contents (exact source verification at correct version)
 └─ GitMCP: search-code (source-level pattern matching)

STEP 5 — VERIFICATION RECORD
 ├─ Source URL + version confirmed to match package.json
 ├─ MCP tool(s) used + fetch timestamp
 ├─ Codebase scan paths + findings
 ├─ Version match status (MATCHED / MISMATCHED / UNVERIFIED)
 └─ Flag as BLOCKING if version mismatch or critical staleness detected
```

### Consumption Rules

| Action | Rule |
|--------|------|
| **Orientation** (understanding WHAT exists, WHERE to look) | ✅ Reference-tier allowed from bundled assets without live validation |
| **API signature lookup** for implementation | 🚫 BLOCKED without live MCP validation (Step 4) + codebase scan (Step 3) |
| **Interface verification** for quality gates | 🚫 BLOCKED without live MCP validation (Step 4) + version match (Step 2) |
| **Version-sensitive behavioral claims** | 🚫 BLOCKED without live MCP validation (Step 4) |
| **Architecture pattern understanding** | ✅ Reference-tier allowed, but recommend live verification for production decisions |
| **Generating code from bundled patterns** | 🚫 BLOCKED — route to live MCP tools for current API surface |

### Integrated Enforcement Points

| Workflow Phase | IRON CLAW Trigger | Required Validation |
|---------------|-------------------|---------------------|
| Implementation | Before using any API from bundled refs | Steps 2-4 minimum |
| Code review | When verifying API usage against docs | Steps 2-4 minimum |
| Quality gate | Before PASS verdict on interface claims | Steps 1-5 full |
| Research | When synthesizing findings from cached assets | Steps 4-5 minimum |
| Audit | When reporting version-based findings | Steps 1-5 full |

## Constitutional Compliance — Two-Tier Trust Model

Synthesis outputs inherit the trust level of their inputs. Enforce this model:

| Tier | Role | Tools | When to Trust |
|------|------|-------|--------------|
| **Validation (PRIMARY)** | Live verification of synthesis claims | `context7_query_docs`, `deepwiki_ask_question`, `exa_web_search_exa`, `repomix_grep_repomix_output` | Every claim about API behavior, library interfaces, or architectural patterns |
| **Reference (SUPPLEMENTARY)** | Orientation and context understanding | Cached hm-tech-stack-ingest assets, hm-detective structural maps, local .tech-registry.json | Understanding project context, framing research scope, gap identification |

**Rule:** Validation-tier sources MUST confirm any claim that the artifact presents as fact. Reference-tier sources support understanding but cannot substantiate claims alone.

**Staleness Severity Scale:** CRITICAL=24h / HIGH=7d / STANDARD=30d / LOW=90d. Synthesis claims about rapidly-evolving APIs (e.g., AI SDKs) default to CRITICAL. Stable APIs (e.g., core Node.js) default to STANDARD.

## MCP Tool Integration for Synthesis Verification

After producing a synthesis artifact, verify key claims against live sources:

| Verification Target | MCP Tool | Query Pattern |
|---------------------|----------|--------------|
| API signatures and method existence | `context7_query_docs` | "Does [library] [version] export [method] with [signature]?" |
| Architectural patterns and conventions | `deepwiki_ask_question` | "Is [pattern] the recommended approach in [repo]?" |
| Counter-evidence and recent changes | `exa_web_search_exa` | "[library] [feature] breaking change [year]" or "[library] alternative to [claim]" |
| Cross-reference against packed codebase | `repomix_grep_repomix_output` | grep for specific function/class names in packed output |

**Minimum verification:** For synthesis quality A or B, at least 2 of the 4 tools must confirm key claims. For C or below, all 4 should be attempted.

## Synthesis Quality Score

After producing a synthesis artifact, rate it using this scale. The score is MANDATORY — every artifact must include it.

| Score | Criteria | Allowed Actions |
|-------|----------|----------------|
| **A** | Multi-source inputs, >80% live-verified, no contradictions, all versions match | Publish as authoritative artifact |
| **B** | Multi-source inputs, >50% live-verified, contradictions resolved with rationale | Publish with methodology/limitations section |
| **C** | Multi-source but <50% live-verified, or minor version mismatches | Publish with WARNING header and re-verification recommendation |
| **D** | Dominated by single source or cache-only inputs | Do NOT publish. Return to hm-deep-research for additional sources |
| **F** | Cannot verify inputs, all findings are cache-only | BLOCK synthesis entirely. Route back to research stage |

**Score assignment rule:** When in doubt between two scores, use the lower one. Honest low scores prevent downstream errors from compressed garbage.

## Synthesis Output Evidence Requirements

Every synthesis artifact MUST include this evidence header:

```markdown
## Synthesis Evidence

- **Quality Score:** [A-F]
- **Live-source percentage:** [X]% of findings from live MCP tool queries
- **Source count:** [N] distinct sources across [M] tools
- **Unresolved contradictions:** [list or "none"]
- **Version constraints:** Findings apply to [library@version], [library@version]
- **Methodology:** [compression tier] tier, [synthesis approach used]
- **Staleness window:** Newest finding: [date]. Oldest: [date]. Max age: [X]d
```

Artifacts missing this header are incomplete and must not be exported.

## References (Progressive Disclosure)

Load references ONLY when the SKILL.md procedures are insufficient for your task.

- **[Compression Tiers](references/compression-tiers.md)** — Per-language settings, repomix config, worked examples
- **[Cross-Dependency Analysis](references/cross-dep-analysis.md)** — Full 5-step protocol, graph generation, monorepo handling
- **[Interface Extraction](references/interface-extraction.md)** — Templates, multi-file extraction, contract validation
- **[Pattern Classifier](references/pattern-classifier.md)** — Detection algorithm, edge cases, output format
- **[Corpus Gate](references/corpus-gate.md)** — Assembly procedures, quality scoring, anti-patterns
- **[Validated Playbooks](references/validated-playbooks.md)** — End-to-end synthesis workflows with validation gates
- **[Artifact Export](references/artifact-export.md)** — Export formats, naming conventions, promotion gates

## Self-Correction

When synthesis produces unreliable artifacts or hits a dead end, use these correction modes:

### Mode 1: Over-Compression (Signature tier used where Snapshot was needed)

```
What was the compression objective?
├── Security audit, legal compliance → MUST use Snapshot (0% reduction). Re-run with compress=false.
├── Code review, onboarding → Focused is appropriate. If still too thin, re-run with compress=false on key files.
├── Architecture planning → Signature may be sufficient. If missing crucial impl details, escalate to Focused.
└── Unsure → Default to Focused. Never use Signature for audit/security work.
```

### Mode 2: Corpus Gate Failure (insufficient evidence for classification)

```
Which criterion failed?
├── Repos < 3 → expand search: add GitHub trending repos, related orgs, language-specific repos
├── Artifacts < 10 → widen scope: include test files, config patterns, build scripts
├── Single org → add repos from different organizations or community projects
├── Pattern exhaustion (no new patterns after 20 artifacts) → stop classification, document what you have, flag for manual review
└── All criteria met but classification is shaky → produce a gap report, do NOT force classification
```

### Mode 3: Contradiction Consensus Failure (sources disagree, no resolution)

```
1. Fill templates/contradiction-consensus.md with each position and evidence
2. If high-impact contradiction → artifact recommends investigation, does NOT claim settled answer
3. If low-impact → document the disagreement, pick one with rationale, note the alternative
4. If tied on evidence → document both, flag for external decision
```

### Mode 4: Artifact Validation Failure (generated artifact doesn't match source)

```
1. Re-read the source findings from hm-deep-research or hm-detective
2. Check if the source was stale (re-run staleness check on .tech-registry.json)
3. If hm-tech-stack-ingest has cached API signatures → validate artifact claims against cached source
4. If validation still fails → re-run the synthesis from scratch with fresh source reads
5. If source itself is questionable → route back to hm-deep-research for re-investigation
```

### Mode 5: Dependency Graph Staleness (package.json changed since last MAP)

```
1. Compare timestamps: ls -la package.json against .tech-registry.json last_updated
2. If out of sync → re-run MAP step: grep import/require/emit
3. Re-run CLASSIFY → DETECT → RESOLVE sequence
4. Validate: npm run typecheck && npm run build && npm test
```

### Mode 6: Low-Quality Input Detected (Input Quality Gate returned BLOCKED)

```
Input Quality Gate result?
├── Provenance <50% live → STOP. Route back to hm-deep-research with specific gaps:
│   "Need live verification for: [list of cache-only findings]. Use MCP tools."
├── Version mismatch (critical) → STOP. Route to hm-deep-research:
│   "Findings reference [lib@X] but project uses [lib@Y]. Re-research with correct version."
├── Unresolved contradiction → STOP. Fill contradiction-consensus.md. Route:
│   "Resolve contradiction between [A] and [B] before synthesis can proceed."
└── Staleness > CRITICAL → STOP. Route to hm-deep-research:
    "Finding [X] is [N] days old (CRITICAL threshold: 24h). Re-verify with live source."
```

**Critical rule:** The fix for low-quality synthesis output is NEVER to re-synthesize the same bad inputs. The fix is ALWAYS to go back to the research stage for better inputs. Re-synthesizing bad inputs at a different compression tier is the Garbage Compactor anti-pattern.

### Maximum Correction Attempts

3 per synthesis task. After 3 correction cycles without resolution:
- Produce artifact with methodology/limitations section
- Document unresolved contradictions and gaps
- Export provenance: sources reviewed, blocked sources, continuation path
- Do NOT claim settled answers for unresolved high-impact contradictions

## Cross-References

### Research Chain Position

```
hm-tech-stack-ingest → hm-detective → hm-deep-research → hm-synthesis
         (upstream)    (upstream)     (upstream)     (this skill)
```

hm-synthesis is **Stage 3 (Synthesize)** of the canonical `hm-research-chain` pipeline.

### Upstream Skills (Feeds Into This Skill)

| Related Skill | Boundary |
|---------------|----------|
| `hm-tech-stack-ingest` | Cached API signatures, type definitions, and repo references for offline validation. Use cached assets to verify generated artifacts against REAL code. |
| `hm-detective` | Codebase map, `.tech-registry.json`, and dependency graph. hm-detective provides the structural understanding needed for pattern classification and interface extraction. |
| `hm-deep-research` | Structured research findings with citations, evidence levels, contradiction matrices, and source evaluations. hm-synthesis compresses these into artifacts. |

### Downstream Skills (This Skill Feeds Into)

| Related Skill | Boundary |
|---------------|----------|
| `hm-research-chain` | hm-synthesis produces the final artifact that hm-research-chain exports and persists with continuation metadata. |

### Related / Sibling Skills

| Related Skill | Boundary |
|---------------|----------|
| `hm-research-chain` | Orchestrator. hm-synthesis is Stage 3 of the chain. hm-research-chain triggers hm-synthesis after Stage 2 research completes and routes its output to artifact export. |

### Boundary Clarification

| Nearby Skill | What hm-synthesis Does | What the Other Skill Does |
|-------------|----------------------|--------------------------|
| `hm-tech-stack-ingest` | Uses cached API signatures to validate generated artifacts; does NOT download repositories | Downloads, caches, and organizes third-party repositories as bundled assets |
| `hm-detective` | Compresses codebase structure into pattern classifications and interface extractions | Investigates the live codebase with SCAN/READ/DEEP modes |
| `hm-deep-research` | Synthesizes, compresses, and restructures research findings into actionable artifacts | Generates structured research findings with MCP tools and multi-source evidence |
| `hm-research-chain` | Executes Stage 3 artifact compression when triggered by the chain | Orchestrates the full ingest → detect → research → synthesize pipeline |

Base directory for this skill: file:///Users/apple/hivemind-plugin-private/.opencode/skills/hm-l3-synthesis
Relative paths in this skill (e.g., scripts/, reference/) are relative to this base directory.
Note: file list is sampled.

<skill_files>
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l3-synthesis/templates/contradiction-consensus.md</file>
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l3-synthesis/templates/.gitkeep</file>
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l3-synthesis/scripts/.gitkeep</file>
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l3-synthesis/scripts/validate-rich-package.sh</file>
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l3-synthesis/references/artifact-export.md</file>
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l3-synthesis/references/corpus-gate.md</file>
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l3-synthesis/references/interface-extraction.md</file>
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l3-synthesis/references/validated-playbooks.md</file>
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l3-synthesis/references/cross-dep-analysis.md</file>
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l3-synthesis/references/compression-tiers.md</file>
</skill_files>
</skill_content>
```

**Tool: skill**

**Input:**
```json
{
  "name": "hm-l2-feature-ecosystem"
}
```

**Output:**
```
<skill_content name="hm-l2-feature-ecosystem">
# Skill: hm-l2-feature-ecosystem

# Feature Ecosystem: Interdependence Design

Design and validate a set of features as an interdependent ecosystem — not isolated units. This skill owns cross-feature dependency mapping, cycle detection, impact analysis, delivery ordering, and interface contract design. It does NOT define single-feature requirements or implement changes — it designs the relationships BETWEEN features.

This package synthesizes patterns from inspected third-party sources:

| Source | Adopt / adapt decision | Local transformation |
|--------|------------------------|----------------------|
| `dependency-audit@agensi.io` | Adopt dependency cross-referencing and unused-check patterns; adapt from package-level to feature-level graph. | Feature dependency graph with data, interface, temporal, and deployment edge types. |
| `topological-sort / DAG delivery patterns` (general CS) | Adopt topological ordering and parallelizable-group identification. | Adapted for feature delivery with risk/value/blocking overrides. |
| `interface contract patterns` (general API design) | Adopt contract-first design between feature owners. | Transformed to agent-team contract design with version locking. |

## HARD GATE — No Implementation Without Validated Ecosystem

```
DO NOT begin implementing any feature until the ecosystem dependency
graph is validated: no circular dependencies, no missing interfaces,
no orphan features, and delivery order confirmed.
```

## Entry Gate

Proceed when any of these are true:
- User describes 2+ features that interact or depend on each other
- User asks about "what order" to build features
- User mentions "dependency between features" or "feature X needs feature Y"
- User asks for impact analysis of a feature change
- A coordinator skill routes multiple feature ideas to ecosystem design
- A requirements brief lists features with cross-references to other features

Do NOT proceed when:
- Only one feature is in scope → route to `hm-brainstorm` or `hm-spec-driven-authoring`
- The question is about code-level dependencies (imports, `package.json`) → route to `hm-detective`
- The question is about long-term roadmap strategy (quarters, epics) → route to `hm-roadmap-maintainability`
- Features are already ordered and implemented → route to `hm-cross-cutting-change` for impact analysis

## Checklist

Create a task for each item and complete them in order. Do not skip phases.

- [ ] Phase 1: Build Dependency Graph — identify all features, map their dependency types
- [ ] Phase 2: Validate Graph — detect cycles, missing interfaces, orphan features
- [ ] Phase 3: Analyze Impact Propagation — trace downstream effects when features change
- [ ] Phase 4: Determine Delivery Order — topological sort, identify parallelizable groups
- [ ] Phase 5: Design Interface Contracts — contracts between features owned by different teams
- [ ] Phase 6: Handoff — route to next skill with validated ecosystem

## Phase 1: Build Dependency Graph

### 1.1 Gather Feature Inputs

Before constructing the graph, collect all feature descriptions:

1. If features come from `hm-brainstorm`, read the requirements briefs
2. If features come from `hm-requirements-analysis`, read the validated requirement tables
3. If features are described in the current conversation, list each one with its stated purpose
4. Check for any existing architecture documents, ADRs, or technical specs that define feature boundaries

### 1.2 Identify Feature Nodes

For each feature, record:
- **Feature name** — unique identifier (kebab-case, max 48 chars)
- **Purpose** — 1 sentence: what it provides to users/the system
- **Owner/team** — who owns it (if known; otherwise mark "unowned")
- **Requirements source** — pointer to requirements brief, spec, or conversation

```markdown
### Feature Node: `user-authentication`
- **Purpose:** Provides login, logout, session management for end users
- **Owner:** Auth Team
- **Source:** `.planning/requirements/auth-brief.md`
```

### 1.3 Map Dependency Types

For each pair of features (A, B), classify the dependency using four types:

| Dependency Type | Question | Example |
|----------------|----------|---------|
| **Data** | Does A need data that B produces? | `checkout` needs `user-authentication` for user identity |
| **Interface** | Does A call B's API/endpoint/function? | `dashboard` calls `analytics` API for metrics |
| **Temporal** | Must B exist before A can function? | `migration-tool` must run before `new-schema` can be used |
| **Deployment** | Can A and B deploy independently? | `payment-gateway` and `notification-service` deploy together |

For each dependency found, record as: `A → B [type, rationale]`

Use `references/dependency-graph-guide.md` for graph construction algorithms and edge type details.

### 1.4 Create the Dependency Matrix

Produce a scored dependency matrix:

```markdown
| From \ To | auth | checkout | dashboard | analytics |
|-----------|------|----------|-----------|-----------|
| auth      | —    |          | D(1)      | D(2)      |
| checkout  | D(3) | —        |           |           |
| dashboard | D(4) |          | —         | I(5)      |
| analytics |      |          |           | —         |

Legend: D = data, I = interface, T = temporal, P = deployment
Number in parens = dependency priority (1=highest risk)
```

### 1.5 Pause for Graph Review

Present the graph and dependency matrix to the user. Ask:

> "This is my understanding of how these features depend on each other. Are there any missing dependencies, or any I've captured that don't actually exist?"

Wait for confirmation before proceeding to Phase 2.

## Phase 2: Validate Graph

### 2.1 Detect Circular Dependencies

Run cycle detection using the algorithm in `references/dependency-graph-guide.md`:

1. Build a directed graph from the dependency matrix (A → B means A depends on B)
2. Run DFS with a recursion stack to detect back edges
3. For each cycle found, report the cycle and its severity:

```markdown
### Cycle Detected: `auth` → `user-profile` → `permissions` → `auth`
- **Severity:** HIGH — blocks all three features from independent delivery
- **Resolution options:**
  1. Merge into a single feature with sub-components
  2. Extract the shared dependency into a new foundational feature
  3. Break the cycle by removing the weakest dependency edge
```

**Any cycle is BLOCKING.** Do not proceed to Phase 3 until all cycles are resolved.

### 2.2 Detect Missing Interfaces

For every Interface-type dependency A → B, verify that B's intended API exposes what A needs:

1. List all interface dependencies from the matrix
2. For each, check: does B's requirements brief or spec mention the capability A needs?
3. If not found, flag as a missing interface:

```markdown
### Missing Interface: `dashboard` depends on `analytics.getMetrics()`
- **Consumer:** `dashboard` needs aggregated metrics for display
- **Provider:** `analytics` requirements do not mention a `getMetrics` endpoint
- **Impact:** `dashboard` cannot be built until `analytics` commits to this interface
- **Resolution:** Add `getMetrics(orgId, dateRange) → MetricSummary[]` to `analytics` requirements
```

### 2.3 Detect Orphan Features

Identify features that nothing depends on and serve no external consumer:

1. For each node in the graph, count incoming edges (features that depend on it)
2. For each feature with zero incoming edges, ask: "Does this feature serve a user-facing purpose or external consumer?"
3. If no, flag as orphan:

```markdown
### Orphan Feature: `admin-audit-log`
- **Incoming dependencies:** 0
- **User-facing value:** None stated — no user story references audit log
- **Recommendation:** Remove from scope, defer to future release, or integrate into feature that needs it
```

### 2.4 Pause for Validation Confirmation

Present all validation findings (cycles, missing interfaces, orphans) to the user with resolution options. Resolve before continuing.

## Phase 3: Analyze Impact Propagation

### 3.1 Trace Downstream Effects

For each feature, trace what changes if it's modified or delayed.

Use the algorithm from `references/impact-propagation.md`:

1. Select a feature node
2. Traverse all outgoing edges (features that depend on it)
3. For each dependent, assess the impact level (CRITICAL, HIGH, MEDIUM, LOW)
4. Continue recursively until all transitive dependents are covered

```markdown
### Impact Chain: `user-authentication` change
1. **user-authentication** (root change)
   ├── **checkout** [CRITICAL] — needs user identity; checkout breaks without auth
   │   └── **order-history** [HIGH] — depends on checkout for order records
   ├── **dashboard** [HIGH] — user context required for personalized view
   └── **admin-panel** [HIGH] — admin login depends on auth service
```

### 3.2 Compute Impact Scores

Assign each feature an impact score = 1 + number of transitive dependents:

| Feature | Direct Dependents | Transitive Dependents | Impact Score |
|---------|-------------------|----------------------|--------------|
| `user-authentication` | 3 | 4 | **5** |
| `checkout` | 1 | 1 | **2** |
| `order-history` | 0 | 0 | **1** |

Higher impact scores = higher risk if changed; build these earlier and more carefully.

## Phase 4: Determine Delivery Order

### 4.1 Topological Sort

Apply topological ordering on the DAG (guaranteed acyclic after Phase 2):

1. Compute in-degree for each node
2. Queue nodes with in-degree 0 (no dependencies on other features)
3. Process queue: remove node, decrement in-degrees of its dependents
4. Add newly in-degree-0 nodes to queue
5. Result is a valid build order respecting all dependencies

### 4.2 Identify Parallelizable Groups

Features at the same topological depth with no dependencies on each other can be built in parallel:

```markdown
### Delivery Wave Plan
**Wave 1 (Foundation):** `user-authentication`, `data-migration`
**Wave 2 (Core):** `checkout`, `product-catalog`  ← parallelizable
**Wave 3 (Integration):** `order-history`, `dashboard`, `analytics`  ← parallelizable
**Wave 4 (Polish):** `admin-audit-log`, `notification-service`
```

### 4.3 Apply Ordering Overrides

Use `references/ordering-strategies.md` to override pure topological ordering:

| Strategy | When to Apply | Example |
|----------|--------------|---------|
| **Risk-first** | High uncertainty features should be built early | Prototype new ML model before dependent UI |
| **Value-first** | High-value features regardless of dependency position | Build `checkout` before internal tooling |
| **Dependency-first** | Default (topological order) | Foundation features before dependent features |
| **Team-constrained** | Parallel features need same team | Resequence if 3 features need the same 2-person team |

Present the wave plan with a clear recommendation and ask:

> "Here is the proposed delivery order with [X] waves. I recommend [risk-first | dependency-first | value-first] because [rationale]. Does this order work for you?"

## Phase 5: Design Interface Contracts

### 5.1 Identify Cross-Team Interfaces

From the dependency matrix, extract interface-type dependencies where features have different owners:

```markdown
| Consumer Feature | Owner | Provider Feature | Owner | Required Interface |
|-----------------|-------|-----------------|-------|-------------------|
| `dashboard` | Frontend Team | `analytics` | Data Team | `getMetrics(orgId, dateRange)` |
| `checkout` | Payments Team | `user-authentication` | Auth Team | `getCurrentUser()`, `validateSession()` |
```

### 5.2 Design Each Contract

Use `references/interface-contracts.md` for contract design guidance. For each cross-team interface, define:

```markdown
### Contract: `checkout` ↔ `user-authentication`

**Version:** 1.0.0 (locked until both teams agree to rev)

**Provider API (user-authentication must expose):**
- `getCurrentUser()` → `{ userId: string, orgId: string, role: string }`
- `validateSession(sessionToken: string)` → `{ valid: boolean, expiresAt: ISO8601 }`

**Consumer API (checkout will call):**
- Blocking: checkout cannot complete without valid session
- Error contract: if auth returns `{ valid: false }`, checkout redirects to login
- SLA: auth must respond within 200ms p95

**Change protocol:**
- Provider proposes change → consumer has 48h to object
- Breaking changes require version bump and migration window
- Non-breaking additions allowed without consumer sign-off
```

### 5.3 Lock Contracts

Present all contracts to relevant teams/agents. Once confirmed:

- Write contracts to `<project-root>/.planning/contracts/<provider>-<consumer>-v1.md`
- Reference them in each feature's requirements brief
- Any future change that breaks a contract must go through change protocol

## Phase 6: Handoff

Present clear routing options:

1. **Proceed to spec-driven authoring** → For each feature in Wave 1, load `hm-spec-driven-authoring` with requirements brief + validated contract
2. **Plan implementation waves** → Load `hm-phase-execution` with the wave plan for orchestrated delivery
3. **Start implementation** → Load `hm-test-driven-execution` for each feature, respecting dependency order
4. **Ecosystem change detected** → If a feature's scope changes, return to Phase 2 (validate graph) and Phase 3 (impact propagation)
5. **All features delivered** → Route to `hm-roadmap-maintainability` for long-term evolution tracking

## Decision Tree

```
Is this a single feature or 2+ interdependent features?
  SINGLE → Route to hm-brainstorm or hm-spec-driven-authoring
  2+ FEATURES → Has the dependency graph been built?
    NO → Start Phase 1 (Build Dependency Graph)
    YES → Are there circular dependencies?
      YES → Resolve cycles → return to Phase 2
      NO → Are there missing interfaces or orphan features?
        YES → Resolve → return to Phase 2
        NO → Is delivery order determined?
          NO → Phase 4 (Determine Delivery Order)
          YES → Are all cross-team interfaces contracted?
            NO → Phase 5 (Design Interface Contracts)
            YES → Handoff (Phase 6)
```

## Routing Table

| Situation | Skill to Load |
|-----------|---------------|
| Single feature, no dependencies on others | `hm-brainstorm` → `hm-spec-driven-authoring` |
| Requirements brief needed for a feature | `hm-brainstorm` |
| Validate requirements against tech constraints | `hm-tech-context-compliance` |
| Lock requirements into falsifiable contracts | `hm-spec-driven-authoring` |
| Code-level dependency analysis (imports, packages) | `hm-detective` |
| Cross-pan implementation changes | `hm-cross-cutting-change` |
| Orchestrated wave-based delivery | `hm-phase-execution` |
| RED/GREEN/REFACTOR implementation cycle | `hm-test-driven-execution` |
| Long-term product roadmap and evolution | `hm-roadmap-maintainability` |

## Boundary Rules

| Nearby workflow | Boundary |
|----------------|----------|
| `hm-brainstorm` | Produces single-feature requirements briefs. This skill consumes MULTIPLE briefs and designs the relationships between them. |
| `hm-requirements-analysis` | Produces validated, traceable requirements per feature. This skill consumes those tables for dependency identification. |
| `hm-tech-context-compliance` | Validates individual features against tech constraints. This skill's dependency graph may reveal cross-feature constraint violations (e.g., two features compete for the same resource). |
| `hm-spec-driven-authoring` | Consumes the validated ecosystem + contracts to lock requirements. This skill produces the graph; spec-driven-authoring locks each feature. |
| `hm-cross-cutting-change` | Governs code-level pan-impact when a change spans layers. This skill governs feature-level ecosystem impact BEFORE implementation begins. |
| `hm-test-driven-execution` | Executes RED/GREEN/REFACTOR with ordered features from the wave plan. |
| `hm-phase-execution` | Consumes the wave plan for orchestrated multi-feature delivery. |
| `hm-roadmap-maintainability` | Owns long-term product evolution (quarters, epics). This skill handles current-release feature interdependence design. |

## Dependency Type Reference

| Type | Code | Question | Impact If Misidentified |
|------|------|----------|------------------------|
| **Data** | D | Does A need data B produces? | A blocked; B's data model changes break A |
| **Interface** | I | Does A call B's API? | A blocked; B's API contract changes break A |
| **Temporal** | T | Must B exist before A? | A cannot start until B is deployed |
| **Deployment** | P | Must A and B deploy together? | Coupled release risk; rollback complexity |

## Anti-Patterns

| Anti-Pattern | Detection | Correction |
|-------------|-----------|------------|
| **Single-feature scope** — applying ecosystem analysis to one feature | Dependency matrix is 1x1 | Redirect to `hm-brainstorm` or `hm-spec-driven-authoring` |
| **Hidden dependency** — dependency not declared but exists in practice | Feature A references B's data type in conversation but not in the matrix | Add to matrix before proceeding. Interview both feature owners. |
| **Fake independence** — claiming features are independent when they share a database or auth layer | Multiple features reference "user" or "organization" without declaring it | Extract shared concepts as foundational features in Wave 1. |
| **Delivery ordering by intuition** — ordering features by "what feels right" instead of graph analysis | No topological sort, no impact scores | Always run Phase 4. Intuition is a useful sanity check, not a substitute. |
| **Skipping contract design** — assuming teams will "figure out" the interface | Cross-team interface dependencies with no written contract | Write contracts in Phase 5. Verbal agreements are the #1 source of integration failures. |
| **Ignoring transitive impact** — only assessing direct dependents | Impact analysis stops after one hop | Continue recursively until leaf nodes. Changes propagate. |
| **Treating all dependencies as equal** — no distinction between data, interface, temporal, deployment | All edges labeled "depends on" | Use the four dependency types. Each implies different resolution strategies. |
| **Circular dependency workaround** — "we'll just build both at the same time" | Cycle detected but resolved by "parallel development" | Parallel development of mutually dependent features is a recipe for integration hell. Break the cycle structurally. |

## Framework Adapter Notes

This skill is framework-agnostic. When loaded in a project that uses a specific methodology, adapt as follows:

| Framework | Adaptation |
|-----------|------------|
| **GSD** (Get Shit Done) | Write dependency graph and contracts to `<project-root>/.planning/` directory. Map waves to GSD phases. |
| **BMAD** | Align feature nodes with BMAD's architecture decisions. Use BMAD's cross-cutting concern taxonomy for dependency types. |
| **OpenCode native** | Write contracts to `<project-root>/.planning/contracts/`. Use `session-patch` to link contracts to requirement files. |
| **None / generic** | Write all artifacts to `<project-root>/.planning/ecosystem/YYYY-MM-DD-<ecosystem-name>`. Use plain markdown for everything. |

## Validation Before Handoff

Before routing to the next skill, verify:

- [ ] Dependency matrix exists and covers all features (no feature is missing)
- [ ] All dependency types (D/I/T/P) are classified for every edge
- [ ] No circular dependencies remain unresolved
- [ ] All missing interfaces are either resolved or documented as accepted gaps
- [ ] All orphan features are either removed, integrated, or explicitly deferred
- [ ] Impact propagation trace exists for every feature (direct + transitive)
- [ ] Delivery wave plan is produced with parallelizable groups identified
- [ ] All cross-team interface contracts are written and referenced
- [ ] User confirmed the ecosystem design in Phase 6
- [ ] Routing recommendation is clear and actionable

## Self-Correction

### When a cycle won't break easily

If circular dependencies persist after attempting all three resolution options (merge, extract, break weakest edge), do NOT force a solution. Escalate with a decision packet listing the cycle, the attempted resolutions, and the trade-offs. Let the user pick the least-worst break.

### When features lack requirements

If a feature node has no requirements source (no brief, no spec, no conversation context), do NOT invent its purpose or dependencies. Mark it `blocked: missing-requirements` and exclude it from the dependency graph until clarification arrives.

### When the ecosystem is too large

If the feature count exceeds 15, the graph becomes unreadable and wave planning loses precision. Group features into sub-domains (e.g., "Billing", "Onboarding"), design intra-domain graphs, then an inter-domain graph. Report sub-domain results before the full ecosystem.

### When the user rejects the wave plan

If the proposed delivery order is rejected, do NOT override the user's preference. Document the override reason, re-run impact propagation against the new ordering, and flag any features that will be built before their dependencies as `risk: dependency-not-satisfied`. Present the risk-adjusted plan for confirmation.

## Quick Reference

| Phase | Input | Output | Key Validation |
|-------|-------|--------|----------------|
| Phase 1: Graph | Feature descriptions | Dependency matrix | All features + edges captured |
| Phase 2: Validate | Dependency matrix | Resolved cycles, interfaces, orphans | No blocking issues remain |
| Phase 3: Impact | Validated graph | Impact scores + propagation chains | Transitive coverage |
| Phase 4: Order | DAG + impact scores | Wave plan | Topologically valid + parallelizable |
| Phase 5: Contracts | Cross-team interfaces | Locked interface contracts | All contracts written |
| Phase 6: Handoff | Validated ecosystem | Route to next skill | User confirmed |

Base directory for this skill: file:///Users/apple/hivemind-plugin-private/.opencode/skills/hm-l2-feature-ecosystem
Relative paths in this skill (e.g., scripts/, reference/) are relative to this base directory.
Note: file list is sampled.

<skill_files>
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l2-feature-ecosystem/task_plan.md</file>
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l2-feature-ecosystem/references/interface-contracts.md</file>
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l2-feature-ecosystem/references/impact-propagation.md</file>
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l2-feature-ecosystem/references/ordering-strategies.md</file>
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l2-feature-ecosystem/references/dependency-graph-guide.md</file>
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l2-feature-ecosystem/evals/evals.json</file>
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l2-feature-ecosystem/evals/.gitkeep</file>
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l2-feature-ecosystem/metrics/rich-gate-scorecard.md</file>
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l2-feature-ecosystem/metrics/.gitkeep</file>
</skill_files>
</skill_content>
```

---

## Assistant (Build · MiMo-V2.5-Pro (Precision) · 11.1s)

_Thinking:_

Tôi đã load các skills. Bây giờ tôi cần đọc các tài liệu được liệt kê để hiểu context. Tuy nhiên, với tư cách là front-facing agent, tôi nên delegate việc đọc và phân tích cho subagent. Nhưng user yêu cầu tôi đọc trực tiếp các tài liệu này.

Tôi sẽ bắt đầu đọc các tài liệu song song. Có rất nhiều tài liệu cần đọc, tôi sẽ đọc các file quan trọng nhất trước.

Let me read the key documents first - the registries, the synthesis reports, and the ROADMAP and STATE.

Tôi sẽ đọc các tài liệu chính để hiểu context trước, sau đó delegate phân tích chi tiết.

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.hivemind/registries"
}
```

**Output:**
```
<path>/Users/apple/hivemind-plugin-private/.hivemind/registries</path>
<type>directory</type>
<entries>
.gitkeep

(1 entries)
</entries>
```

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/phases/23-notification-fix-and-tool-surface-docs/23-W4-SYNTHESIS.md"
}
```

**Output:**
```
<path>/Users/apple/hivemind-plugin-private/.planning/phases/23-notification-fix-and-tool-surface-docs/23-W4-SYNTHESIS.md</path>
<type>file</type>
<content>
1: # Wave 4 Synthesis: WORKFLOW Skills (4 skills)
2: 
3: **Date:** 2026-05-23
4: **Source files:** 4 SKILL.md files (1 MISSING) + 23-SYSTEM-AUDIT + 23-CONTEXT + 23-W2-SYNTHESIS + 23-W3-SYNTHESIS
5: **Wave scope:** Wave 3C (subagent-delegation-patterns, user-intent-interactive-loop, cross-cutting-change, debug)
6: **Status:** READY — scoping complete, gaps/debts documented
7: 
8: ---
9: 
10: ## Summary
11: 
12: | Metric | Value |
13: |--------|-------|
14: | Skills analyzed | 4 |
15: | Skills that EXIST on disk | 3 (`user-intent-interactive-loop`, `cross-cutting-change`, `debug`) |
16: | Skills that are MISSING (need NEW creation) | 1 (`hm-l2-subagent-delegation-patterns`) |
17: | Total current LOC (3 existing skills) | 970 |
18: | Total target LOC post-edit (3 existing + 1 NEW) | ~1,400 (existing: ~800, new: ~600) |
19: | Operational tools — include | 18 (✅ fully operational) |
20: | Partial tools — EXCLUDE from Wave 4 | 4 (🚫 TBD: run-background-command, hivemind-trajectory, hivemind-pressure, hivemind-agent-work) |
21: | Broken reference paths in SKILL.md | 8 paths (all in user-intent-interactive-loop — `hm-` vs `hm-l2-` prefix mismatch) |
22: | Scripts directory exists | 2 skills have scripts/ (user-intent-interactive-loop: 6 scripts, debug: scripts/ dir present) |
23: | References directories with content | 3/3 existing skills have populated references/ |
24: | Evals/metrics directories | 3/3 existing skills have evals/ + metrics/ |
25: | NEW skill needed from scratch | `hm-l2-subagent-delegation-patterns` (directory MISSING entirely) |
26: 
27: ---
28: 
29: ## Tool Scope
30: 
31: ### Operational — Include in Skills (✅ 18 tools)
32: 
33: | Tool | Phase Origin | Include In |
34: |------|-------------|-----------|
35: | `delegate-task` | CP-DT-01 ✅ | subagent-delegation (PRIMARY), user-intent-interactive-loop, cross-cutting-change, debug |
36: | `delegation-status` | CP-DT-01 ✅ | subagent-delegation (PRIMARY), user-intent-interactive-loop, debug |
37: | `execute-slash-command` | P21.1 ✅ | subagent-delegation, user-intent-interactive-loop |
38: | `hivemind-command-engine` | CP-CMD-01 ✅ | subagent-delegation (command discovery), user-intent-interactive-loop |
39: | `session-tracker` | CP-ST-01 ✅ | subagent-delegation (delegation tracking), user-intent-interactive-loop |
40: | `session-hierarchy` | CP-ST-01 ✅ | subagent-delegation (parent-child navigation) |
41: | `session-context` | CP-ST-01 ✅ | subagent-delegation (cross-session), user-intent-interactive-loop |
42: | `hivemind-session-view` | P16 ✅ | subagent-delegation (unified view) |
43: | `prompt-skim` | Pre-restructuring ✅ | user-intent-interactive-loop (prompt analysis) |
44: | `prompt-analyze` | Pre-restructuring ✅ | user-intent-interactive-loop (intent analysis) |
45: | `session-patch` | Pre-restructuring ✅ | user-intent-interactive-loop (intent state), debug (debug state) |
46: | `session-journal-export` | Pre-restructuring ✅ | subagent-delegation (delegation lineage), debug (debug state export) |
47: | `hivemind-doc` | Pre-restructuring ✅ | cross-cutting-change (read plan/context), debug (read code/docs) |
48: | `hivemind-sdk-supervisor` | P14 ✅ | subagent-delegation (SDK health before dispatch) |
49: | `configure-primitive` | BOOT ✅ | subagent-delegation (agent/command discovery) |
50: | `validate-restart` | BOOT ✅ | subagent-delegation (post-dispatch validation) |
51: | `bootstrap-init` | BOOT ✅ | user-intent-interactive-loop (session init context) |
52: | `bootstrap-recover` | BOOT ✅ | user-intent-interactive-loop (session recovery) |
53: 
54: ### Partial — EXCLUDE from Wave 4 Scope (🚫 4 tools)
55: 
56: | Tool | Status | Blocking Phase | Exclusion Reason |
57: |------|--------|---------------|------------------|
58: | `run-background-command` | 🟡 PARTIAL | CP-PTY-01 chưa start | PTY control-plane MVP not implemented. NOT for WORKFLOW skills. |
59: | `hivemind-trajectory` | 🟡 PARTIAL | P24 chưa tới | State machine untested. Redesign pending. NOT for WORKFLOW skills. |
60: | `hivemind-pressure` | 🟡 PARTIAL | P26 chưa tới | Redesign pending. NOT for WORKFLOW skills. |
61: | `hivemind-agent-work` | 🟡 PARTIAL | P24-25 chưa tới | Lifecycle untested. Redesign pending. NOT for WORKFLOW skills. |
62: 
63: ---
64: 
65: ## Skill 1: hm-l2-subagent-delegation-patterns — ⚠️ NEW SKILL (DIRECTORY MISSING)
66: 
67: ### Discovery
68: 
69: | Field | Value |
70: |-------|-------|
71: | **Location** | `.opencode/skills/hm-l2-subagent-delegation-patterns/` |
72: | **Status** | ❌ **DIRECTORY DOES NOT EXIST** — verified via glob (zero files returned) |
73: | **Current SKILL.md** | NONE — needs full creation, not rewrite |
74: | **Cross-referenced by** | `hm-l2-coordinating-loop` (W2 synthesis: "cross-references subagent-delegation-patterns"), `hm-l2-phase-execution` (W2 synthesis: "hm-subagent-delegation-patterns" in cross-refs), `hm-l3-tool-capability-matrix` (W3: cross-references this skill) |
75: | **Layer** | L2 (execution/delegation domain) |
76: | **Role** | delegation-specialist |
77: 
78: ### Why This Skill Is Needed
79: 
80: 1. **Coordinating-loop** references subagent-delegation patterns for dispatch protocols (W2 finding)
81: 2. **Phase-execution** references it for wave-based delegation (W2 finding)
82: 3. **Tool-capability-matrix** references it for permission-aware delegation (W3 finding)
83: 4. **No existing skill** documents the delegation patterns, session stacking, or checkpoint protocols
84: 5. **Phase 23 CONTEXT D4** lists it in Wave 3C as a planned creation
85: 
86: ### Target Scope
87: 
88: | Dimension | Target |
89: |-----------|--------|
90: | **Lines** | ~500-600 (new creation — must be THIN but DEEP with references) |
91: | **Layer** | L2 |
92: | **Role** | delegation-specialist |
93: | **Pattern** | P2 |
94: | **allowed-tools** | `Read, Write, Edit, Bash, Glob, Grep, delegate-task, delegation-status, execute-slash-command, session-tracker, session-hierarchy, hivemind-session-view, hivemind-command-engine, session-journal-export, hivemind-sdk-supervisor, configure-primitive` |
95: 
96: ### Content Requirements
97: 
98: | Section | Description |
99: |---------|-------------|
100: | **Iron Law** | "Delegate scope, not trust. Stack context, not sessions." |
101: | **Overview** | Documents subagent delegation patterns for OpenCode: WaiterModel dispatch, session stacking via `parentSessionId`, checkpoint protocols, dual-signal completion, and permission-aware agent dispatch |
102: | **Entry Gate** | Delegation must include: agent, prompt, success criteria, budget (turn/token limit). If any missing → STOP. |
103: | **Core Patterns** | (1) **WaiterModel dispatch** — delegate-task returns immediately, delegation-status polls for completion. (2) **Session stacking** — attach as child via `parentSessionId`. (3) **Checkpoint protocol** — structured handoff for long-running subagents. (4) **Dual-signal completion** — task output + explicit completion signal. (5) **Permission-aware dispatch** — match agent to tool permissions via tool-capability-matrix. |
104: | **Workflows** | Sequential delegation → Parallel delegation (via dispatching-parallel-agents) → Conditional branching → Retry/failover |
105: | **Anti-Patterns** | (1) Orphan dispatch — delegating without `parentSessionId`. (2) Context dumping — injecting full session context instead of bounded intent. (3) No success criteria — subagent completes but output is unusable. (4) Budget starvation — no turn/token limit. (5) Permission mismatch — agent lacks required tools for its task. |
106: | **Cross-References** | `hm-l2-coordinating-loop` (coordination patterns), `hm-l2-phase-execution` (wave dispatch), `hm-l3-tool-capability-matrix` (permission enforcement), `hm-l2-user-intent-interactive-loop` (intent capture before delegation), `hm-l3-hivemind-engine-contracts` (session API contracts), `hm-l3-subagent-delegation-patterns` (⚠️ circular — ensure this is named correctly) |
107: | **References** | 4 files in `references/`: `waiter-model-detailed.md`, `session-stacking-protocol.md`, `checkpoint-handoff.md`, `permission-agent-matching.md` |
108: | **Self-Correction** | Standard 4-mode pattern (task failing, unsure, user contradicts, edge case) |
109: | **Anti-Patterns Table** | Standard table with 5-7 anti-patterns |
110: 
111: ### D4 Constraint
112: 
113: Per CONTEXT.md D4: **THIN but DEEP**. The new skill MUST:
114: - Use references directory for deep content (keep SKILL.md ~500-600 lines)
115: - Use jump links to reference files (but verify at runtime that they render — user reports jump links may NOT work when skills are loaded)
116: - Cross-reference existing skills rather than duplicating content
117: 
118: ### Gaps & Debts
119: 
120: | Gap | Severity | Description |
121: |-----|----------|-------------|
122: | No existing codebase to audit | N/A | This is a NEW creation, not a rewrite. No stale paths, no script dependencies, no legacy state paths. |
123: | Jump link runtime behavior unverified | 🔴 HIGH | D4 constraint applies to NEW skill too. Reference files in `references/` must be verifiable at runtime. User reports jump links may not render when loaded. |
124: | Cross-skill consistency | 🟡 MEDIUM | Must match the naming convention (`hm-l2-subagent-delegation-patterns`), allowed-tools pattern, and HMQUAL template used by other Wave skills |
125: 
126: ---
127: 
128: ## Skill 2: hm-l2-user-intent-interactive-loop — Interactive Probing Skill
129: 
130: ### Current State
131: 
132: | Field | Value |
133: |-------|-------|
134: | **Lines** | 446 |
135: | **Layer** | L1 |
136: | **Role** | front-agent |
137: | **Pattern** | P3 |
138: | **allowed-tools** | `Read, Write, Edit, Bash, Glob, Grep, Task, Question` |
139: | **Consumed-by** | orchestrator, coordinator (front-facing agents) |
140: | **References** | `references/` ✅ 6 files (question-protocols, context-preservation, brainstorming, long-session, worked-examples, durable-human-interrupts) |
141: | **Scripts** | `scripts/` ✅ 6 scripts (first-action, intent-verify, register-skill, session-checkpoint, validate-skill, verify-hierarchy) |
142: | **Evals** | ✅ `evals/` directory exists |
143: | **Metrics** | ✅ `metrics/` directory exists |
144: 
145: ### Critical Issues
146: 
147: | # | Issue | Lines | Severity |
148: |---|-------|-------|----------|
149: | 1 | **ALL 8 `<files_to_read>` paths use WRONG directory name** | 101-108 | 🔴 HIGH — SKILL.md references `.opencode/skills/hm-user-intent-interactive-loop/` (without `-l2-` infix) but actual directory is `.opencode/skills/hm-l2-user-intent-interactive-loop/`. All 6 reference files + 2 script files will fail to load. |
150: | 2 | **No operational tools in allowed-tools** | 10-19 | 🟡 MEDIUM — allowed-tools only has generic tools (Read, Write, Edit, Bash, Glob, Grep, Task, Question). No harness tools (`prompt-skim`, `prompt-analyze`, `session-patch`, `delegate-task`, `hivemind-command-engine`, `session-journal-export`). |
151: | 3 | **Script-based gate enforcement** | 27-96 | 🟡 MEDIUM — 5 gates implemented as bash scripts (`intent-verify.sh`, `verify-hierarchy.sh`, `register-skill.sh`). Scripts DO exist (verified on disk) but script-based enforcement is fragile compared to tool-based verification. |
152: | 4 | **Question tool caps via file counting** | 31-36 | 🟡 LOW — Question count tracked in `.opencode/state/question-count.json`. Per Q6, state should live under `.hivemind/`. This is legacy path. |
153: | 5 | **Intent state stored under `.opencode/state/`** | 140, 340-349 | 🟡 LOW — Multiple references to `.opencode/state/intent.json`, `.opencode/state/question-count.json`. Per Q6, these should be `.hivemind/state/`. |
154: | 6 | **Anti-pattern #9 mismatch** | 377 | 🟡 LOW — "The Skill Ignorer" anti-pattern references "loading a skill for its file list but bypassing its workflow." This is a meta-observation that should be in integration-contracts, not here. |
155: | 7 | **No `session-patch` tool for intent state** | — | 🟡 LOW — Skill writes to `intent.json` via Bash (lines 139-142) but has no structured tool for patching intent state. `session-patch` would be appropriate. |
156: 
157: ### Reference Files Status
158: 
159: | File | Path | On Disk? | Path Correct in SKILL.md? |
160: |------|------|----------|--------------------------|
161: | 01-question-protocols.md | `references/01-question-protocols.md` | ✅ 13,458 bytes | ❌ path uses `hm-` prefix (line 101) |
162: | 02-context-preservation.md | `references/02-context-preservation.md` | ✅ 11,660 bytes | ❌ path uses `hm-` prefix (line 102) |
163: | 03-brainstorming-patterns.md | `references/03-brainstorming-patterns.md` | ✅ 13,303 bytes | ❌ path uses `hm-` prefix (line 103) |
164: | 04-long-session-management.md | `references/04-long-session-management.md` | ✅ 15,175 bytes | ❌ path uses `hm-` prefix (line 104) |
165: | 05-worked-examples.md | `references/05-worked-examples.md` | ✅ 3,049 bytes | ❌ path uses `hm-` prefix (line 105) |
166: | 06-durable-human-interrupts.md | `references/06-durable-human-interrupts.md` | ✅ 1,122 bytes | ❌ path uses `hm-` prefix (line 106) |
167: | intent-verify.sh | `scripts/intent-verify.sh` | ✅ 11,801 bytes | ❌ path uses `hm-` prefix (line 107) |
168: | verify-hierarchy.sh | `scripts/verify-hierarchy.sh` | ✅ 7,609 bytes | ❌ path uses `hm-` prefix (line 108) |
169: 
170: **Impact:** ALL 8 `<files_to_read>` paths are broken. They reference a non-existent directory (`hm-user-intent-interactive-loop`) instead of the actual directory (`hm-l2-user-intent-interactive-loop`). When this skill is loaded, none of the reference files or scripts will resolve.
171: 
172: ### Scripts vs. Tools Decision
173: 
174: | Script | LOC | Tool Alternative |
175: |--------|-----|-----------------|
176: | `intent-verify.sh` | 11,801 bytes | Replace with `prompt-analyze` + inline intent state check |
177: | `verify-hierarchy.sh` | 7,609 bytes | Replace with `hivemind-sdk-supervisor` readiness check |
178: | `register-skill.sh` | 3,902 bytes | Replace with `configure-primitive` read/list |
179: | `session-checkpoint.sh` | 5,867 bytes | Replace with `session-journal-export` + `session-patch` |
180: | `validate-skill.sh` | 754 bytes | Replace with inline validation (small script — fine to keep or inline) |
181: | `first-action.sh` | 6,302 bytes | Replace with inline tool sequence in "On Load" section |
182: 
183: **Recommendation:** Keep scripts for Phase 23 (proven E2E with 5 gates). Add operational tools to allowed-tools. Script rewrite can be deferred to a future cleanup phase.
184: 
185: ### Target Scope (Reduce & Fix)
186: 
187: | Dimension | Current | Target |
188: |-----------|---------|--------|
189: | Lines | 446 | <400 |
190: | Broken `<files_to_read>` paths | 8 | 0 (fix all to `hm-l2-` prefix) |
191: | allowed-tools additions | 0 | +5 (prompt-skim, prompt-analyze, session-patch, delegate-task, session-journal-export) |
192: | Legacy `.opencode/state/` paths | 2 locations | Flag for migration — defer actual migration |
193: | Script references | 6 | Keep (scripts exist on disk and work) — mark as "may be migrated to tools in future" |
194: 
195: ### Edits Required
196: 
197: 1. **Fix 8 broken `<files_to_read>` paths**: `hm-user-intent-interactive-loop` → `hm-l2-user-intent-interactive-loop` (lines 101-108)
198: 2. **Expand allowed-tools**: Add `prompt-skim`, `prompt-analyze`, `session-patch`, `delegate-task`, `session-journal-export`, `hivemind-command-engine`
199: 3. **Fix script path references** throughout SKILL.md (lines 26, 52, 56, 122, etc. — all reference `scripts/` which IS correct because scripts exist at that relative path; only the `<files_to_read>` paths are wrong)
200: 4. **Verify question count persistence path**: `.opencode/state/question-count.json` (line 31) — flag as legacy per Q6 but do NOT migrate in this edit (would break existing scripts)
201: 5. **Verify script shebangs and execution**: All 6 scripts have `+x` permission. Quick test needed to confirm they run.
202: 6. **Update Gate 3 loading order** (lines 70-72): Remove `opencode-non-interactive-shell` from required background skills? D4 CONTEXT.md says skills should use thin references — check if this is still needed.
203: 7. **Update Platform Adaptation table** (lines 425-435): Add `hivemind-command-engine` as a new row for OpenCode command discovery.
204: 
205: ### Gaps & Debts
206: 
207: | Gap | Severity | Description |
208: |-----|----------|-------------|
209: | 8 broken reference/script paths in `<files_to_read>` | 🔴 HIGH | ALL paths use wrong directory name (`hm-` not `hm-l2-`). No reference files or scripts will load until fixed. |
210: | No harness operational tools in allowed-tools | 🟡 MEDIUM | Skill governs delegation (DELEGATE phase) but cannot `delegate-task`. Cannot analyze prompts (`prompt-analyze`). Cannot persist state (`session-patch`, `session-journal-export`). |
211: | Legacy state paths under `.opencode/state/` | 🟡 MEDIUM | Q6 compliance requires `.hivemind/`. However, scripts hardcode `.opencode/state/` paths. Migration must update both SKILL.md and scripts. Defer to cleanup phase. |
212: | Script-based gates are platform-specific | 🟡 LOW | 5 bash scripts work on macOS/Linux but not Windows. SKILL.md "Platform Adaptation" table (line 425) only covers OpenCode/Claude Code/Codex/Cursor — all POSIX environments. Acceptable for now. |
213: | Gate 3 loading order (lines 52-72) has cross-lineage load | 🟡 LOW | Requires loading `opencode-platform-reference` (hm-l3 skill) and `repomix-exploration-guide` (non-hm). This is correct per the cross-lineage bridge rules. |
214: | D4 jump link verification | 🔴 HIGH | After fixing paths, test at runtime whether reference content renders when skill is loaded. |
215: 
216: ---
217: 
218: ## Skill 3: hm-l2-cross-cutting-change — Cross-Pane Change Governance
219: 
220: ### Current State
221: 
222: | Field | Value |
223: |-------|-------|
224: | **Lines** | 330 |
225: | **Layer** | L2 |
226: | **Role** | domain-execution |
227: | **Pattern** | P2 |
228: | **allowed-tools** | `Read, Write, Edit, Bash, Glob, Grep` |
229: | **References** | `references/` ✅ 4 files (pan-classification, red-first-protocol, lifecycle-impact-matrix, mock-honesty-detection) |
230: | **Scripts** | ❌ NO scripts directory — clean |
231: | **Evals** | ✅ `evals/` directory exists |
232: | **Metrics** | ✅ `metrics/` directory exists |
233: | **Cross-references** | hm-test-driven-execution, hm-spec-driven-authoring, hm-completion-looping, hm-phase-execution |
234: 
235: ### Assessments
236: 
237: | Criterion | Status |
238: |-----------|--------|
239: | **HMQUAL compliance** | ✅ COMPLETE — all sections present (Iron Law, Overview, Entry Gate, Boundary Rules, Core Workflow 7 phases, Gates, Rollback Plan, Anti-Patterns, Decision Tree, Self-Correction, Verification Checklist) |
240: | **Broken paths** | ✅ NONE — all 4 reference paths use correct `hm-l2-cross-cutting-change` directory prefix |
241: | **allowed-tools match usage** | ⚠️ PARTIAL — only generic tools listed. Needs `hivemind-doc` for reading plan/context docs, `session-journal-export` for change packet export, `delegate-task` for dispatching sub-changes. |
242: | **Third-party patterns** | ✅ 3 sources documented (addyosmani/agent-skills, helderberto/skills, kw12121212/auto-spec-driven) with adopt/adapt decisions |
243: | **RICH gate sources** | ✅ 3 sources listed with decisions |
244: | **Independence Notes** | ✅ No GSD/planning dependency |
245: | **Self-correction** | ✅ 4-mode pattern present |
246: | **Anti-Patterns table** | ✅ 8 anti-patterns documented |
247: | **Verification Checklist** | ✅ 11-item checklist at end |
248: | **Target lines** | 330 — could reduce to <300 but healthy as-is |
249: 
250: ### Issues
251: 
252: | # | Issue | Lines | Severity |
253: |---|-------|-------|----------|
254: | 1 | **No operational tools in allowed-tools** | 15-21 | 🟡 MEDIUM — SKILL.md orchestrates multi-pan changes (Phase 5 ordering) but cannot read PAN.md/PLAN.md (`hivemind-doc`), cannot export handoff packets (`session-journal-export`), cannot dispatch subagents (`delegate-task`). |
255: | 2 | **Phase 5 verification uses `npm run`** | 186-193 | 🟡 LOW — Verification commands assume Node.js/npm. For a general-purpose skill, should note platform adaptation or reference a tool. |
256: | 3 | **Phase 1 scan uses `grep -rl`** | 96-101 | 🟡 LOW — Suggests grep commands inline but allowed-tools includes `Grep` and `Glob`. Actually correct — these could be executed via Bash. No issue. |
257: | 4 | **No `hivemind-doc` for reading dependency maps** | — | 🟡 LOW — Phase 1 Scan and Phase 3 Impact Analysis would benefit from reading architecture docs. Optional enhancement. |
258: | 5 | **No `session-journal-export` for handoff** | — | 🟡 LOW — Phase 7 Handoff packet (lines 217-233) is written as YAML. Could use `session-journal-export` for structured export. |
259: 
260: ### Reference Files Status
261: 
262: | File | Path | On Disk? | Path Correct? |
263: |------|------|----------|---------------|
264: | pan-classification.md | `references/pan-classification.md` | ✅ 10,554 bytes | ✅ |
265: | red-first-protocol.md | `references/red-first-protocol.md` | ✅ 6,930 bytes | ✅ |
266: | lifecycle-impact-matrix.md | `references/lifecycle-impact-matrix.md` | ✅ 9,664 bytes | ✅ |
267: | mock-honesty-detection.md | `references/mock-honesty-detection.md` | ✅ 9,579 bytes | ✅ |
268: 
269: **All 4 references exist, all paths correct.**
270: 
271: ### Target Scope (Minor edits)
272: 
273: | Dimension | Current | Target |
274: |-----------|---------|--------|
275: | Lines | 330 | <310 |
276: | allowed-tools additions | 0 | +3 (hivemind-doc, session-journal-export, delegate-task) optional |
277: | Broken paths | 0 | 0 |
278: | Script references | 0 | 0 (clean — keep this way) |
279: 
280: ### Edits Required
281: 
282: 1. **Add operational tools to allowed-tools** (lines 15-21): `hivemind-doc` (for reading plan/context/architecture docs), `session-journal-export` (for handoff packet export), `delegate-task` (for dispatching sub-changes). Mark as LOW priority — skill functions without them.
283: 2. **Update "On Load" section** (lines 53-59): Add cross-reference to `hm-l3-tool-capability-matrix` for operational tool permission levels.
284: 3. **No path fixes needed** — all 4 reference paths use correct `hm-l2-` prefix. Cleanest skill in the W4 set.
285: 
286: ### Gaps & Debts
287: 
288: | Gap | Severity | Description |
289: |-----|----------|-------------|
290: | No operational tool dependencies | 🟡 LOW | Skill is self-contained with generic tools. Enhancement possible but not critical. |
291: | Phase 5 verification commands assume npm | 🟡 LOW | `npm run typecheck`, `npm test` are Node.js-specific. For a general-purpose skill, note that platform-specific verification commands should be substituted. |
292: | D4 jump link verification | 🔴 HIGH | 4 reference files (pan-classification, red-first-protocol, lifecycle-impact-matrix, mock-honesty-detection) may not render when loaded. Must test at runtime. |
293: 
294: ---
295: 
296: ## Skill 4: hm-l2-debug — Systematic Debugging
297: 
298: ### Current State
299: 
300: | Field | Value |
301: |-------|-------|
302: | **Lines** | 194 |
303: | **Layer** | L2 |
304: | **Role** | domain-execution |
305: | **Pattern** | P2 |
306: | **allowed-tools** | `Read, Write, Edit, Bash, Glob, Grep` |
307: | **References** | `references/` ✅ 2 files (debug-state-machine, evidence-framework) |
308: | **Scripts** | ✅ `scripts/` directory exists (content unverified — empty by glob? but ls showed directory exists) |
309: | **Evals** | ✅ `evals/` directory exists |
310: | **Metrics** | ✅ `metrics/` directory exists |
311: | **Cross-references** | hm-l3-detective (codebase investigation), hm-l3-synthesis (evidence synthesis), hivemind-power-on (planning persistence) |
312: 
313: ### Assessments
314: 
315: | Criterion | Status |
316: |-----------|--------|
317: | **HMQUAL compliance** | ✅ COMPLETE — Iron Law, Overview, Entry Gate, 6-Step Protocol, Persistent State, RICH Gate Sources, Independence Notes, Anti-Patterns, Self-Correction, Cross-References, Verification (implied) |
318: | **Broken paths** | ✅ NONE — all reference paths use correct `hm-l2-debug` prefix |
319: | **allowed-tools match usage** | ⚠️ PARTIAL — missing `hivemind-doc` for reading code, `session-patch` for debug state persistence, `session-journal-export` for debug state export, `delegate-task` for dispatching investigation subagents |
320: | **Most concise skill in set** | ✅ Only 194 lines — clean, focused, well-structured |
321: | **Debug state path** | `.debug/<bug-id>.md` — good, project-scoped, no legacy `.opencode/state/` paths |
322: | **Independence Notes** | ✅ Explicitly says "Do not assume GSD, BMAD, or this repository's `.planning/` layout" — correct |
323: | **Self-correction** | ✅ 4-mode pattern present |
324: | **Anti-Patterns table** | ✅ 4 anti-patterns documented |
325: 
326: ### Issues
327: 
328: | # | Issue | Lines | Severity |
329: |---|-------|-------|----------|
330: | 1 | **No operational tools in allowed-tools** | 17-23 | 🟡 MEDIUM — Debug workflow uses Bash for grep/glob but could benefit from `hivemind-doc` (structured code reading), `session-patch` (debug state persistence to `.debug/<bug-id>.md`), `session-journal-export` (export debug state for handoff), `delegate-task` (dispatch parallel investigation subagents). |
331: | 2 | **Cross-reference to `hm-planning-persistence`** | 190 | 🟡 LOW — Line 190: "hm-planning-persistence" referenced in Cross-References table. This skill does NOT exist (confirmed W2 finding). Should be replaced with `hivemind-power-on`. |
332: | 3 | **`hivemind-power-on` cross-reference name** | 193 | 🟡 LOW — Cross-references `hivemind-power-on` (line 193) as the replacement for planning persistence. This is correct per W2 recommendation. |
333: | 4 | **Scripts directory empty on glob, but ls showed files** | — | 🟡 LOW — Investigate. `ls -la` showed `scripts/` directory exists with `.gitkeep` or empty. SKILL.md references `scripts/` paths? Check: SKILL.md has no `bash scripts/` references — correct. |
334: | 5 | **No evidence hierarchy section** | — | 🟡 LOW — Debug skill references "evidence framework" but doesn't define L1-L5 hierarchy. SYSTEM-AUDIT uses evidence hierarchy. Optional cross-reference to `hm-l3-evidence-truth` gate skill. |
335: 
336: ### Reference Files Status
337: 
338: | File | Path | On Disk? | Path Correct? |
339: |------|------|----------|---------------|
340: | debug-state-machine.md | `references/debug-state-machine.md` | ✅ 1,639 bytes | ✅ |
341: | evidence-framework.md | `references/evidence-framework.md` | ✅ 507 bytes | ✅ |
342: 
343: **Both references exist, both paths correct.** Evidence framework is only 507 bytes — may need expansion.
344: 
345: ### Target Scope (Minor edits, could stay as-is)
346: 
347: | Dimension | Current | Target |
348: |-----------|---------|--------|
349: | Lines | 194 | <200 (most concise — could stay or slightly expand) |
350: | allowed-tools additions | 0 | +4 optional (hivemind-doc, session-patch, session-journal-export, delegate-task) |
351: | Non-existent skill refs | 1 (hm-planning-persistence) | 0 |
352: | Broken paths | 0 | 0 |
353: 
354: ### Edits Required
355: 
356: 1. **Remove/Replace `hm-planning-persistence` cross-reference** (line 190) — this skill does not exist. Replace with `hivemind-power-on`. Or simply remove the row — debug already cross-references `hivemind-power-on` on line 193.
357: 2. **Add operational tools to allowed-tops** (lines 17-23): `hivemind-doc` (for structured code reading during isolation), `session-patch` (for debug state persistence), `session-journal-export` (for exporting debug state as handoff). `delegate-task` optional (for parallel investigation).
358: 3. **Verify scripts directory content** — if scripts/ is empty, remove the directory or add relevant debug scripts. If `ls` showed files, confirm they exist and are needed.
359: 4. **Update evidence framework** — reference `hm-l3-evidence-truth` gate skill as the "evidence hierarchy" source.
360: 
361: ### Gaps & Debts
362: 
363: | Gap | Severity | Description |
364: |-----|----------|-------------|
365: | Non-existent `hm-planning-persistence` cross-reference | 🟡 LOW | Line 190 references a skill that never existed. Easy fix (replace with `hivemind-power-on`). |
366: | No harness tools for structured state persistence | 🟡 LOW | Debug state is currently written/read via Write/Bash. `session-patch` would be more structured. |
367: | Evidence framework reference file is tiny (507 bytes) | 🟡 LOW | May need expansion to cover L1-L5 evidence hierarchy. Could cross-reference `hm-l3-evidence-truth` instead. |
368: | D4 jump link verification | 🔴 HIGH | 2 reference files (debug-state-machine, evidence-framework) must be verified at runtime. |
369: | Debug state path `.debug/` is project-root-level | 🟡 LOW | Could conflict with other tools. Independence Notes say to use existing convention if available. Acceptable as default. |
370: 
371: ---
372: 
373: ## Cross-Skill Findings
374: 
375: ### Redundancies
376: 
377: | Pattern | Appears In | Recommendation |
378: |---------|-----------|---------------|
379: | **No operational tools in allowed-tools** | user-intent-interactive-loop, cross-cutting-change, debug — **3/3 existing skills** | All 3 skills lack harness operational tools. Add tools per each skill's needs. |
380: | **Iron Law pattern** | cross-cutting-change, debug — **2/3 existing** | Consistent pattern. Keep as-is. New skill (subagent-delegation) should also have an Iron Law. |
381: | **Self-Correction 4-mode pattern** | user-intent-interactive-loop, cross-cutting-change, debug — **3/3 existing** | Consistent pattern. Keep as-is. New skill must follow same template. |
382: | **Anti-Patterns table** | user-intent-interactive-loop, cross-cutting-change, debug — **3/3 existing** | Consistent pattern. Keep as-is. New skill must follow same template. |
383: | **Cross-References table** | user-intent-interactive-loop, cross-cutting-change, debug — **3/3 existing** | Consistent pattern. Keep as-is. New skill must follow same template. |
384: | **HMQUAL compliance** | **3/3 existing skills** | All pass HMQUAL. New skill must be HMQUAL-compliant. |
385: | **`hm-planning-persistence` non-existent ref** | debug only (line 190) | 1 skill references this non-existent skill. Easy fix. |
386: 
387: ### Path Integrity Issues
388: 
389: | Skill | `<files_to_read>` paths broken? | Reference files exist on disk? |
390: |-------|--------------------------------|-------------------------------|
391: | hm-l2-subagent-delegation-patterns | N/A (directory missing) | N/A |
392: | hm-l2-user-intent-interactive-loop | 🔴 **8 paths broken** (hm- vs hm-l2- prefix) | ✅ 6 ref files + 6 scripts exist at correct filesystem paths |
393: | hm-l2-cross-cutting-change | ✅ All 4 paths correct | ✅ 4 ref files exist |
394: | hm-l2-debug | ✅ All 2 paths correct | ✅ 2 ref files exist |
395: 
396: ### allowed-tools Baseline for WORKFLOW Skills
397: 
398: | Tool | user-intent | cross-cutting | debug | subagent-delegation (NEW) |
399: |------|:-----------:|:-------------:|:-----:|:-------------------------:|
400: | Read | ✅ | ✅ | ✅ | ✅ |
401: | Write | ✅ | ✅ | ✅ | ✅ |
402: | Edit | ✅ | ✅ | ✅ | ✅ |
403: | Bash | ✅ | ✅ | ✅ | ✅ |
404: | Glob | ✅ | ✅ | ✅ | ✅ |
405: | Grep | ✅ | ✅ | ✅ | ✅ |
406: | Task | ✅ | ❌ | ❌ | ❌ |
407: | Question | ✅ | ❌ | ❌ | ❌ |
408: | **prompt-skim** | 🚫 ADD | ❌ | ❌ | ❌ |
409: | **prompt-analyze** | 🚫 ADD | ❌ | ❌ | ❌ |
410: | **session-patch** | 🚫 ADD | ❌ | 🚫 ADD | ❌ |
411: | **hivemind-doc** | ❌ | 🚫 ADD | 🚫 ADD | ❌ |
412: | **delegate-task** | 🚫 ADD | 🚫 ADD | 🚫 ADD | ✅ PRIMARY |
413: | **delegation-status** | ❌ | ❌ | ❌ | ✅ PRIMARY |
414: | **session-journal-export** | 🚫 ADD | 🚫 ADD | 🚫 ADD | ✅ |
415: | **session-tracker** | ❌ | ❌ | ❌ | ✅ |
416: | **session-hierarchy** | ❌ | ❌ | ❌ | ✅ |
417: | **hivemind-session-view** | ❌ | ❌ | ❌ | ✅ |
418: | **hivemind-command-engine** | 🚫 ADD | ❌ | ❌ | ✅ |
419: | **hivemind-sdk-supervisor** | ❌ | ❌ | ❌ | ✅ |
420: | **configure-primitive** | ❌ | ❌ | ❌ | ✅ |
421: | **execute-slash-command** | ❌ | ❌ | ❌ | ✅ |
422: 
423: ### Dependency Issues
424: 
425: | Issue | Impact | Resolution |
426: |-------|--------|------------|
427: | subagent-delegation-patterns is NEW — all cross-refs from W2/W3 skills are pending | 🟡 HIGH — coordinating-loop and phase-execution reference a skill that doesn't exist yet | Create the skill as Phase 23 Wave 4 work. Until then, cross-references from other skills point to nothing. |
428: | user-intent-interactive-loop has all 8 reference/script paths broken | 🔴 HIGH — skill loads but no references resolve | Fix 8 paths in SKILL.md (hm- → hm-l2-). High priority — breaks E2E user-intent flow. |
429: | Script vs. tool tension | 🟡 MEDIUM — user-intent-interactive-loop has 6 scripts for gate enforcement. W2 synthesis removed scripts from coordinating-loop/skills. Keeping scripts works but creates inconsistency. | Document scripts as "Phase 23 keep" with note to evaluate tool migration in future phase. |
430: | D4 constraint across 4 skills | 🔴 HIGH — ALL 4 skills have reference files that need jump link runtime verification. User reports jump links may not render when loaded. | Must create a verification test protocol after edits. |
431: 
432: ---
433: 
434: ## Skill Edit Priority Order
435: 
436: | Priority | Skill | Effort | Risk | Reason |
437: |----------|-------|--------|------|--------|
438: | 1 | **hm-l2-subagent-delegation-patterns** (NEW) | HIGH | HIGH | Directory doesn't exist. Needed by coordinating-loop and phase-execution. Must be created with full HMQUAL compliance. Foundation for all delegation workflow. |
439: | 2 | **hm-l2-user-intent-interactive-loop** | MEDIUM | HIGH | 8 broken paths (all reference/script paths use wrong prefix). L1 front-agent skill — impacts user experience directly. Allowed-tools also missing operational tools. |
440: | 3 | **hm-l2-debug** | LOW | LOW | 1 non-existent skill ref to fix. Most concise skill (194 lines). Tool additions optional. |
441: | 4 | **hm-l2-cross-cutting-change** | LOWEST | LOWEST | Cleanest skill — no path issues, all refs exist, all HMQUAL sections present. Tool additions entirely optional. |
442: 
443: ### Edit Dependency Chain
444: 
445: ```
446: subagent-delegation-patterns (CREATE new — coordinator dependency)
447:     ↓
448: user-intent-interactive-loop (fix 8 paths — front-agent critical path)
449:     ↓
450: debug (fix cross-ref, optional tool additions)
451:     ↓
452: cross-cutting-change (optional: tool additions, lowest priority)
453: ```
454: 
455: ---
456: 
457: ## Total Edit Summary
458: 
459: | Metric | Value |
460: |--------|-------|
461: | Skills to edit | 3 (existing) + 1 (NEW) |
462: | Total current lines (3 existing) | 970 |
463: | Total target lines (3 existing after edits) | ~800 |
464: | Total target lines with NEW skill | ~1,400 |
465: | Broken `<files_to_read>` paths to fix | 8 (all in user-intent-interactive-loop) |
466: | allowed-tools additions across 3 existing skills | ~12 |
467: | NEW skill creation | 1 (hm-l2-subagent-delegation-patterns, ~500-600 lines) |
468: | Non-existent skill refs to remove | 1 (hm-planning-persistence in debug) |
469: | Reference files that exist on disk | 12 files across 3 skills (all ✅ present) |
470: | Scripts that exist on disk | 6 scripts in user-intent-interactive-loop (✅ all present, all executable) |
471: | Jump-link runtime tests required | 4 skills (D4 compliance — critical: user reports jump links may NOT render) |
472: | Legacy `.opencode/state/` paths to flag | 2 (user-intent-interactive-loop — defer migration) |
473: 
474: ---
475: 
476: ## Verification Checklist (post-edit)
477: 
478: - [ ] **subagent-delegation-patterns**: SKILL.md created at `.opencode/skills/hm-l2-subagent-delegation-patterns/SKILL.md`
479: - [ ] **subagent-delegation-patterns**: `references/` directory created with 4 reference files
480: - [ ] **subagent-delegation-patterns**: `evals/` + `metrics/` directories created
481: - [ ] **subagent-delegation-patterns**: HMQUAL compliance verified (all sections present)
482: - [ ] **user-intent-interactive-loop**: 8 broken paths fixed (`hm-` → `hm-l2-` in all `<files_to_read>`)
483: - [ ] **user-intent-interactive-loop**: allowed-tools expanded with harness tools
484: - [ ] **user-intent-interactive-loop**: legacy `.opencode/state/` paths flagged for future migration
485: - [ ] **debug**: `hm-planning-persistence` cross-reference removed/replaced
486: - [ ] **debug**: allowed-tools expanded with harness tools (optional)
487: - [ ] **cross-cutting-change**: allowed-tools expanded with harness tools (optional)
488: - [ ] **ALL 4 skills**: D4 constraint — jump link rendering verified at runtime
489: - [ ] **ALL 4 skills**: Self-Correction, Anti-Patterns, Cross-References tables present and consistent
490: - [ ] **ALL 4 skills**: No references to PARTIAL tools (run-background-command, trajectory, pressure, agent-work)

(End of file - total 490 lines)
</content>

<system-reminder>
Instructions from: /Users/apple/hivemind-plugin-private/.planning/AGENTS.md
# Planning and Governance Sector Guidance

**Evidence level:** L5 documentation guidance only. This file does not prove runtime readiness; runtime claims require L1-L3 proof from authorized verification workflows.

## 1. Sector purpose and lifecycle role

`.planning/` is the Planning/Governance sector for source-backed requirements, roadmaps, architecture maps, audits, research, lifecycle notes, and phase authorization artifacts. It explains and gates work; it does not implement runtime behavior. Source evidence: `.planning/ROADMAP.md:29-49`, `.planning/architecture/sector-agents-docs-implementation-plan-2026-05-07.md:12-15`, `.planning/codebase/STRUCTURE.md:73-79`.

## 2. Allowed mutation authority

- Planning artifacts may document requirements, acceptance matrices, target architecture, audits, roadmaps, and source-backed decisions.
- Planning artifacts may authorize future work only when they explicitly state scope, dependencies, evidence requirements, and gate conditions. Evidence: `.planning/ROADMAP.md:29-49`.
- Date-stamped artifacts are expected for generated plans, reports, and architecture documents when creating new governance outputs.

## 3. Forbidden mutations / explicit no-go boundaries

- Planning docs SHALL NOT claim runtime readiness from docs-only evidence. Evidence: `.planning/ROADMAP.md:47-49`, `.planning/architecture/sector-agents-docs-implementation-plan-2026-05-07.md:1-8`.
- Planning docs SHALL NOT authorize runtime code, `.opencode/**` primitive, or `.hivemind/**` state mutation unless the current phase/user authorization explicitly allows it. Evidence: `.planning/architecture/sector-agents-docs-implementation-plan-2026-05-07.md:12-15`.
- Do not blindly copy OMO or adopt OMO roots; sector mapping must preserve Hivemind surfaces. Evidence: `.planning/architecture/hivemind-sector-agents-target-2026-05-07.md:28-37`.
- Do not treat archived planning artifacts as current authority without a fresh date/status check.

## 4. Actors and consumers

| Actor / consumer | Uses this sector for | Boundary |
|---|---|---|
| Coordinators and specialists | Source contracts, acceptance criteria, gate status, and phase boundaries | Must not infer implementation authorization from drafts |
| Quality gates | Trace requirements to evidence and readiness claims | Docs-only artifacts are L5 unless runtime proof is attached |
| Runtime/source sectors | Consume approved requirements and architecture constraints | Implementation occurs outside `.planning/` |
| Human reviewers | Decide authorization and priority | Planning can recommend but not self-approve runtime readiness |

## 5. Naming and placement conventions

- Generated artifacts should be grouped by purpose (`architecture/`, `research/`, `audits/`, `checklists/`, `roadmap/`, `lifecycle/`) and date-stamped with `name-YYYY-MM-DD` where applicable.
- Current codebase intelligence lives under `.planning/codebase/`; active roadmap/requirements/project state live at `.planning/ROADMAP.md`, `.planning/REQUIREMENTS.md`, `.planning/PROJECT.md`, and `.planning/STATE.md`. Evidence: `.planning/codebase/STRUCTURE.md:73-79`.
- Archived artifacts under `.planning/archive/` require current validation before use as authority.

## 6. Quality gates and evidence expectations

- Planning requirements should be falsifiable, source-backed, and mapped to acceptance/verification methods.
- Completion claims must state evidence level; O3 and docs-only artifacts are L5 and keep runtime readiness blocked. Evidence: `.planning/ROADMAP.md:47-49`.
- Before a planning artifact authorizes work, it must identify allowed surfaces, forbidden surfaces, actors/consumers, verification commands or inspection methods, and stop conditions.

## 7. Current CP-PTY runway note

- `CP-PTY-00-shell-pty-control-plane-spike` is a docs/spec-only phase. It may update `.planning/**` but must not mutate `src/**`, `tests/**`, `.opencode/**`, or `.hivemind/**`.
- `CP-PTY-01-background-shell-control-plane-mvp` is READY (BOOT-07 complete). Covers command-process delegation (PTY/headless).
- `CP-PTY-02-sdk-session-delegation-integration` covers OpenCode SDK child-session delegation, async/sync dispatch, context injection.
- `CP-PTY-03-agent-subagent-background-task-coordination` covers wave dispatch, completion-looping, queue dedup, lifecycle cascade.
- `CP-PTY-04-cross-cutting-shell-integration` wires everything to session/task/journal/hooks/permissions.
- `SC-PTY-01-read-only-terminal-projection` remains DEFERRED until CP-PTY-01 and Q2 sidecar confirmation.
- Any routing or sidecar plan that invokes background command, PTY, headless shell, or terminal projection behavior must depend on the CP-PTY artifacts and preserve read-only projection boundaries unless a later phase changes them.

</system-reminder>
```

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/phases/23-notification-fix-and-tool-surface-docs/23-SYNTHESIS-REPORT-2026-05-23.md"
}
```

**Output:**
```
<path>/Users/apple/hivemind-plugin-private/.planning/phases/23-notification-fix-and-tool-surface-docs/23-SYNTHESIS-REPORT-2026-05-23.md</path>
<type>file</type>
<content>
1: # Structured Synthesis Report — hm-* Orchestration Skills
2: 
3: **Date:** 2026-05-23
4: **Session Scope:** Deep study of GSD workflow patterns and OMO architecture to guide comprehensive rewrite of all hm-* orchestration skills for Hivemind Phase 23.
5: **Evidence Level:** L5 (documentation analysis with path verification)
6: 
7: ---
8: 
9: ## 1. ADOPT / REJECT / TRANSFORM Analysis
10: 
11: ### 1.1 GSD Patterns
12: 
13: | Pattern | Verdict | Rationale |
14: |---------|---------|-----------|
15: | GSD gate system (G1-G5 scripts that exit non-zero) | **TRANSFORM** | Rigorous pre/post-dispatch passing gating is worth adopting. But Hivemind coordinate is not GSD — transform: replace `bash scripts/check-gate.sh <session> G1` with tool-based or hook-based gates that integrate with the existing `gate-l3-*` triad, not standalone bash scripts. |
16: | GSD wave-based parallelization | **TRANSFORM** | Useful for dispatching independent work to subagents. But Hivemind uses `delegate-task` (WaiterModel SDK), not bash scripts. Transform the concept to `hm-coordinating-loop` tool-based dispatch with parallel child sessions. |
17: | GSD checkpoint recovery (task_plan, findings, progress) | **ADOPT WITH CAVEAT** | The update-to-disk pattern is sound. `.hivemind/state/planning/` already exists. Caveat: must work with `.hivemind/` state root, NOT `.coordination/` or `.opencode/`. |
18: | GSD envelope-based task dispatch (5-section template) | **ADOPT** | The envelope protocol (Task, Scope, Context, Expected Output, Verification) is clean and compatible with Hivemind delegation patterns. |
19: | GSD max-3-loop with escalation | **TRANSFORM** | The hard limit + escalation pattern is needed. Transform: integrate with `hm-l2-completion-looping`'s durable cursor fields instead of using bash-based counters. |
20: | GSD `scripts/` directory per skill | **REJECT** | Not architecturally compatible. Hivemind skills are instructions + references only. Shell scripts belong in `bin/` CLI substrate or `src/` tooling, not in `.opencode/skills/`. The existing scripts under `hm-l2-coordinating-loop/scripts/` are an artifact of GSD pattern — they should be migrated to proper harness tool surfaces or removed. |
21: 
22: ### 1.2 OMO Patterns (from `hm-l3-omo-reference`)
23: 
24: | Pattern | Verdict | Rationale |
25: |---------|---------|-----------|
26: | IRON CLAW 5-step validation (lockfile → source-map → lockfile-scan → fetch → diff) | **ADOPT** | Strong validation discipline for reference skills. ADOPT as standard for all `hm-l3-*` reference skills. Already present in `hm-l3-omo-reference`. |
27: | `plugin.ts` as composition root | **ADOPT** | Already the Hivemind approach. Verified: `src/plugin.ts:219-452` handles startup, delegation, hooks, tools. |
28: | CQRS boundary enforcement | **ADOPT** | Already locked (ARCHITECTURE.md:247-255). `hivemind-session-view` etc enforce read-only. |
29: | L0-L3 multi-agent hierarchy | **TRANSFORM** | OMO uses stage/assistant/coordinator pattern. Hivemind uses hm-L0 → hm-L1 → hm-L2 → hm-L3 lineage. The hierarchy exists but naming differs. Transform: keep hm/hf/gate/stack lineage, not OMO numeric stage system. |
30: | Skill loader with auto-discover | **REJECT** | OMO scans directories dynamically. Hivemind relies on OpenCode's native skill discovery via `/skill` tool. No custom loader needed. |
31: | Background task manager | **REJECT** | OMO's `BackgroundTaskManager` is not needed. Hivemind uses WaiterModel delegation (background agent dispatch via SDK). |
32: | Dynamic prompt builder | **REJECT** | OMO's `DynamicPromptBuilder` assembling context from tool results is too coupled. Hivemind uses skill-driven prompt construction within skill instructions. |
33: 
34: ---
35: 
36: ## 2. Tool Truth Table — Claimed vs Actual
37: 
38: ### 2.1 `hm-l2-coordinating-loop`
39: **Allowed-tools (frontmatter):** `Bash Read Write Edit Glob Grep todowrite skill`
40: **Actual required capabilities from SKILL.md body:**
41: - `delegate-task` — used for dispatching child agents (required by Step 3 DISPATCH)
42: - `execute-slash-command` — used at Step 2 DECIDE MODE decision tree (line 97)
43: - `hivemind-command-engine` — used for command discovery (line 156-158)
44: - Session tools — used in ralph-loop integration, monitor, verify
45: 
46: **Gap:** `allowed-tools` is missing `delegate-task`, `execute-slash-command`, `hivemind-command-engine`, and all session tools. Skill body references tools not in its allowed set.
47: 
48: ### 2.2 `hm-l2-gate-orchestrator`
49: **Allowed-tools (frontmatter):** `Read Write Edit Bash Glob Grep`
50: **Actual:** Routes to `gate-l3-lifecycle-integration`, `gate-l3-spec-compliance`, `gate-l3-evidence-truth` skills. Does not directly call any tools beyond reading files and loading skills. No **Gap**.
51: 
52: ### 2.3 `hm-l2-completion-looping`
53: **Allowed-tools (frontmatter):** `Read Write Edit Bash Glob Grep`
54: **Actual:** All references are to internal reference files and self-correction checks. No tools beyond allowed set are needed. No **Gap**.
55: 
56: ### 2.4 `hivemind-power-on`
57: **Allowed-tools (frontmatter):** `skill read grep glob bash task todowrite session-tracker session-hierarchy session-context hivemind-session-view delegation-status hivemind-trajectory prompt-skim prompt-analyze hivemind-doc hivemind-pressure`
58: **Actual:** Body references `gate-l3-*` triad skills and `hm-l2-gate-orchestrator`. The `skill` tool is in allowed-tools (needed to load those gate skills). No **Gap** — this is the most complete tool authorization among the four.
59: 
60: ---
61: 
62: ## 3. Jump Link Audit — Path Verification
63: 
64: ### 3.1 `hm-l2-coordinating-loop`
65: 
66: | Reference in SKILL.md | Expected Path | Status |
67: |------------------------|--------------|--------|
68: | `scripts/register-skill.sh` | `.opencode/skills/hm-l2-coordinating-loop/scripts/register-skill.sh` | ✅ EXISTS |
69: | `scripts/coordination-check.sh` | `.opencode/skills/hm-l2-coordinating-loop/scripts/coordination-check.sh` | ✅ EXISTS |
70: | `scripts/check-gate.sh` | `.opencode/skills/hm-l2-coordinating-loop/scripts/check-gate.sh` | ✅ EXISTS |
71: | `scripts/validate-envelope.sh` | `.opencode/skills/hm-l2-coordinating-loop/scripts/validate-envelope.sh` | ✅ EXISTS |
72: | `scripts/init-session.sh` | `.opencode/skills/hm-l2-coordinating-loop/scripts/init-session.sh` | ✅ EXISTS |
73: | `scripts/run-ralph-loop.sh` | `.opencode/skills/hm-l2-coordinating-loop/scripts/run-ralph-loop.sh` | ✅ EXISTS |
74: | `scripts/loop-status.sh` | `.opencode/skills/hm-l2-coordinating-loop/scripts/loop-status.sh` | ✅ EXISTS |
75: | `references/01-handoff-protocols.md` | `.opencode/skills/hm-coordinating-loop/references/01-handoff-protocols.md` | ❌ **BROKEN** — uses `hm-coordinating-loop` (missing `l2-`) |
76: | `references/02-sequential-vs-parallel.md` | `.opencode/skills/hm-coordinating-loop/references/02-sequential-vs-parallel.md` | ❌ **BROKEN** — same issue |
77: | `references/03-parent-child-cycles.md` | `.opencode/skills/hm-coordinating-loop/references/03-parent-child-cycles.md` | ❌ **BROKEN** — same issue |
78: | `references/04-ralph-loop-integration.md` | `.opencode/skills/hm-coordinating-loop/references/04-ralph-loop-integration.md` | ❌ **BROKEN** — same issue |
79: | `references/05-edge-guardrails.md` | `.opencode/skills/hm-coordinating-loop/references/05-edge-guardrails.md` | ❌ **BROKEN** — same issue |
80: 
81: **Fix:** Replace `hm-coordinating-loop` → `hm-l2-coordinating-loop` in all `<files_to_read>` paths at lines 35-39.
82: 
83: ### 3.2 `hivemind-power-on`
84: All 6 reference paths use `references/XX-*.md` which resolve relative to the skill directory at `.opencode/skills/hivemind-power-on/references/`. All 6 files **EXIST**. No broken links.
85: 
86: ### 3.3 `hm-l2-gate-orchestrator`
87: Reference `references/gate-flow.md` resolves relative to skill directory. File **EXISTS**. No broken links.
88: 
89: ### 3.4 `hm-l2-completion-looping`
90: All 3 reference paths (`references/verification-checklist.md`, `references/loop-patterns.md`, `references/durable-completion-cursors.md`) resolve relative to skill directory. All 3 **EXIST**. No broken links.
91: 
92: ---
93: 
94: ## 4. Context Budget Report
95: 
96: ### 4.1 Skill Size Estimates
97: 
98: | Skill | Lines | Est. Tokens | Budget Tier |
99: |-------|-------|-------------|-------------|
100: | `hm-l2-coordinating-loop` | 448 | ~3,500 | MEDIUM |
101: | `hm-l2-gate-orchestrator` | 221 | ~1,800 | SMALL |
102: | `hm-l2-completion-looping` | 149 | ~1,200 | SMALL |
103: | `hivemind-power-on` | 236 | ~2,000 | SMALL |
104: | `hm-l3-omo-reference` (not re-read but from prev context) | ~250 | ~2,000 | SMALL |
105: 
106: ### 4.2 Budget Efficiency Issues
107: 
108: 1. **`hm-l2-coordinating-loop`** is the largest skill at 448 lines. The worked example (lines 242-314, ~70 lines) is helpful but takes significant budget. Consider trimming or moving to references.
109: 2. **`hivemind-power-on`** has two redundant sections: Section 7 (Short Version, lines 206-214) duplicates Section 2 (Real Tools). Section 5.5 (Tool Catalog) duplicates `hm-l3-tool-capability-matrix` content. Could save ~80 lines.
110: 3. **Anti-pattern tables** in all skills are efficient (6-10 rows each, compact). Good pattern to keep.
111: 4. **Platform Adaptation** section (lines 388-410) in `coordinating-loop` is heavy (~20 lines) for rarely-used fallback paths. Consider moving to references or removing.
112: 
113: ---
114: 
115: ## 5. Recommendations
116: 
117: ### P0 — Fix Broken `<files_to_read>` Paths in `hm-l2-coordinating-loop`
118: 
119: Patch 5 lines in `.opencode/skills/hm-l2-coordinating-loop/SKILL.md:35-39`:
120: - `hm-coordinating-loop` → `hm-l2-coordinating-loop`
121: 
122: ### P1 — Update `allowed-tools` in `hm-l2-coordinating-loop`
123: 
124: Add missing tools: `delegate-task`, `execute-slash-command`, `hivemind-command-engine`.
125: 
126: ### P2 — Audit `hm-planning-persistence` References
127: 
128: `hm-l2-coordinating-loop` references `hm-planning-persistence` at lines 20, 31, 53, 420 and cross-references. If `hm-planning-persistence` does not exist at `.opencode/skills/hm-l2-planning-persistence/`, these are dead references. (This skill was not within scope of the current read but should be verified.)
129: 
130: ### P3 — Evaluate Script Migration
131: 
132: The `scripts/` directory under `hm-l2-coordinating-loop` contains 9 bash scripts that enforce gates. These work as-is but are an architectural impurity — shell scripts under `.opencode/skills/` is a GSD pattern, not a Hivemind pattern. Two options:
133: - (A) **Leave as-is** for now — they work and pass gates. Document the exception.
134: - (B) **Migrate** to `bin/` CLI substrate with proper error handling, removing `scripts/` from `.opencode/skills/`.
135: - **Recommendation: (A)** — not worth the migration effort for Phase 23. The scripts are small, well-tested, and work.
136: 
137: ### P4 — `hivemind-power-on` Budget Trim
138: 
139: Remove redundant Section 7 (Short Version) — it fully duplicates Section 2. Save ~30 lines.
140: 
141: ---
142: 
143: ## 6. Summary Statistics
144: 
145: | Metric | Value |
146: |--------|-------|
147: | Skills analyzed | 5 (hm-l2-coordinating-loop, hm-l2-gate-orchestrator, hm-l2-completion-looping, hivemind-power-on, hm-l3-omo-reference) |
148: | Broken `<files_to_read>` paths | 5 (all in hm-l2-coordinating-loop — wrong directory name) |
149: | Broken script/reference paths | 0 (all subdirectories have the right content) |
150: | `allowed-tools` gaps | 1 (hm-l2-coordinating-loop missing `delegate-task`, `execute-slash-command`, `hivemind-command-engine`) |
151: | ADOPT patterns | 2 (GSD envelope protocol, OMO IRON CLAW) |
152: | TRANSFORM patterns | 3 (GSD gate system, GSD wave dispatch, OMO hierarchy) |
153: | REJECT patterns | 4 (GSD scripts dir, OMO skill loader, OMO background task manager, OMO dynamic prompt builder) |
154: | Total report size | ~ | tokens |
155: 
156: ---
157: 
158: *Generated by front-facing agent during synthesis phase. Next step: route to hm-l2-debug for coordinating-loop path fix, or to hm-l2-spec-driven-authoring for tool-authorization update.*

(End of file - total 158 lines)
</content>
```

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/repo-for-learning-and-synthesis.md"
}
```

**Output:**
```
<path>/Users/apple/hivemind-plugin-private/repo-for-learning-and-synthesis.md</path>
<type>file</type>
<content>
1: **IMPORTANT HEAD-UP!**: 
2: 
3: - For any “other frameworks/projects synthesis” - such as gsd-* https://github.com/gsd-build/get-shit-done or OMO https://github.com/code-yeongyu/oh-my-openagent → DO NOT SIMPLY INGEST everything and throw-in without deeply synthesize towards the HIVEMIND philosophies, concepts and visions
4: - And as above all those editions of primitives - config, naming, prefixes, suffixes, designs as for workflows and harness features must completely be transformed, adapt, and integrate coherently toward `the Hivemind`  under OpenCode (with specs compliance, harness lifecycles validation, ecosystem validation) - also, the gsd-* (or any keyword as prefixes or suffixes in skills, agents, commands, workflows, custom tools, etc are not expected to ship with the project and they are there just because I am using GSD framework to develop this - and if any “synthesis” that the units are expected to ship-with → they must follow the above rules and mindsets
5: - other  repos of OpenCode projects and plugins utilizing OpenCode SDK, plugins , client-server API - can be found here with these note-worthy repos vs. harness features categories
6:     1. Context-managements categories:
7:         1. https://github.com/Opencode-DCP/opencode-dynamic-context-pruning
8:     2. Harness features addressing  OpenCode innate shortcomings - the task, command and delegation feature class
9:         1. https://github.com/shekohex/opencode-ptyhttps://github.com/shekohex/opencode-pty#features  → resolve non-interactive commands, background runnings and multiple sessions - with OMO synthesis of background tasks, background agent, polling system to address this repo’s known limitations https://github.com/shekohex/opencode-pty#permissions
10:         2. related to the above is the background-agent repo https://github.com/kdcokenny/opencode-background-agents 
11:     3. A  **HUGE LIST OF CURATED OPENCODE ECOSYSTEM PROJECTS and PLUGINS -**  https://github.com/awesome-opencode/awesome-opencode - check this directory very often as you need to synthesize for feature-development, learn patterns, ideating and knowledge ingestion - I have also made a local copy of this under this path `/Users/apple/Documents/coding-projects/hivemind-plugin-1/.planning/research/OPENCODE-ECOSYSTEM-REPO-DIRECTORIES.md`

(End of file - total 11 lines)
</content>
```

---

## Assistant (Build · MiMo-V2.5-Pro (Precision) · 7.7s)

_Thinking:_

Alright, I've read some key documents. Let me continue reading the remaining documents to get a full picture. I need to read:
1. The remaining phase 23 documents (W2, W3, GSD-workflow-pipeline, GSD-sdk-surface, GSD-REFERENCE, GSD-quality-gates, GSD-agent-architecture, GSD-command-system, DEBTS-REGISTER)
2. The ROADMAP and STATE files to understand phase planning

Let me read more in parallel.

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/phases/23-notification-fix-and-tool-surface-docs/23-W2-SYNTHESIS.md"
}
```

**Output:**
```
<path>/Users/apple/hivemind-plugin-private/.planning/phases/23-notification-fix-and-tool-surface-docs/23-W2-SYNTHESIS.md</path>
<type>file</type>
<content>
1: # Wave 2 Synthesis: ORCHESTRATION Skills
2: 
3: **Date:** 2026-05-23
4: **Source files:** 5 ORCHESTRATION SKILL.md files + 23-SYSTEM-AUDIT + 23-RESEARCH + 23-PATTERNS + 23-CONTEXT + 23-CONTEXT-ANALYSIS
5: **Status:** READY — gaps/debts documented, edits scoped
6: 
7: ---
8: 
9: ## Summary
10: 
11: | Metric | Value |
12: |--------|-------|
13: | Skills analyzed | 5 |
14: | Total current LOC | 1,166 |
15: | Total target LOC (post-edit) | <970 |
16: | Operational tools available | 18 (✅ fully operational) |
17: | Partial tools available | 4 (🟡 note limitations, do NOT reference as primary) |
18: | TBD tools excluded | 4 (phase not reached) |
19: | Broken `<files_to_read>` paths | 6 (all in coordinating-loop) |
20: | Non-existent skill references | 4 skills reference `hm-planning-persistence` (does not exist) |
21: | Legacy state paths (`.opencode/state/`) | 2 skills (phase-execution, phase-loop) |
22: | Ralph-loop references to remove | 3 skills (coordinating-loop, phase-loop, completion-looping) |
23: 
24: ---
25: 
26: ## Tool Scope
27: 
28: ### Operational — Include in Skills (✅ 18 tools)
29: 
30: | Tool | Phase Origin | Include In |
31: |------|-------------|-----------|
32: | `delegate-task` | CP-DT-01 ✅ | coordinating-loop, phase-execution, completion-looping |
33: | `delegation-status` | CP-DT-01 ✅ | coordinating-loop, completion-looping |
34: | `execute-slash-command` | P21.1 ✅ | coordinating-loop, phase-execution, phase-loop |
35: | `hivemind-command-engine` | CP-CMD-01 ✅ | coordinating-loop, phase-execution |
36: | `session-tracker` | CP-ST-01 ✅ | coordinating-loop, hivemind-power-on |
37: | `session-hierarchy` | CP-ST-01 ✅ | coordinating-loop, hivemind-power-on |
38: | `session-context` | CP-ST-01 ✅ | coordinating-loop, hivemind-power-on |
39: | `hivemind-session-view` | P16 ✅ | coordinating-loop, hivemind-power-on |
40: | `prompt-skim` | Pre-restructuring ✅ | gate-orchestrator (pre-gate analysis) |
41: | `prompt-analyze` | Pre-restructuring ✅ | gate-orchestrator (pre-gate analysis) |
42: | `session-patch` | Pre-restructuring ✅ | hivemind-power-on (session state) |
43: | `session-journal-export` | Pre-restructuring ✅ | completion-looping (loop state export) |
44: | `hivemind-doc` | Pre-restructuring ✅ | phase-execution (read PLAN.md, CONTEXT.md) |
45: | `hivemind-sdk-supervisor` | P14 ✅ | hivemind-power-on (SDK health) |
46: | `configure-primitive` | BOOT ✅ | hivemind-power-on (primitive compile) |
47: | `validate-restart` | BOOT ✅ | hivemind-power-on (restart validation) |
48: | `bootstrap-init` | BOOT ✅ | hivemind-power-on (init context) |
49: | `bootstrap-recover` | BOOT ✅ | hivemind-power-on (recovery) |
50: 
51: ### Partial — Reference with Caveats (🟡 4 tools)
52: 
53: | Tool | Caveat | Include In |
54: |------|--------|-----------|
55: | `run-background-command` | PTY control-plane incomplete (CP-PTY-01 pending). DO NOT reference from ORCHESTRATION skills — only from CP-PTY dedicated skills when that phase starts. | ❌ EXCLUDE from Wave 2 |
56: | `hivemind-trajectory` | State machine untested. Redesign pending P24. DO NOT reference as stable surface. | ❌ EXCLUDE from Wave 2 |
57: | `hivemind-pressure` | Redesign pending P26. Core classify/detect works but design is unstable. | ❌ EXCLUDE from Wave 2 |
58: | `hivemind-agent-work-create/export` | Lifecycle untested. Redesign pending P24-25. | ❌ EXCLUDE from Wave 2 |
59: 
60: ### TBD — Do NOT Reference (4 tools)
61: 
62: | Tool | Blocking Phase | Reason |
63: |------|---------------|--------|
64: | `run-background-command` | CP-PTY-01 chưa start | PTY control-plane MVP not implemented |
65: | `hivemind-trajectory` | P24 chưa tới | Trajectory state machine redesign pending |
66: | `hivemind-pressure` | P26 chưa tới | Pressure + notification redesign pending |
67: | `hivemind-agent-work` | P24-25 chưa tới | Agent-work-contract lifecycle redesign pending |
68: 
69: ---
70: 
71: ## Skill 1: hm-l2-coordinating-loop
72: 
73: ### Current State
74: 
75: | Field | Value |
76: |-------|-------|
77: | **Lines** | 448 |
78: | **Layer** | L3 |
79: | **Role** | coordinator |
80: | **allowed-tools** | `Bash Read Write Edit Glob Grep todowrite skill` |
81: | **References** | 5 `<files_to_read>` paths + 9 scripts |
82: | **Cross-references** | dispatching-parallel-agents, user-intent-interactive-loop, **hm-planning-persistence (NON-EXISTENT)**, phase-loop |
83: 
84: ### Broken Paths (6)
85: 
86: | # | Line | Current Path | Fix |
87: |---|------|-------------|-----|
88: | 1 | 35 | `.opencode/skills/hm-coordinating-loop/references/01-handoff-protocols.md` | `hm-coordinating-loop` → `hm-l2-coordinating-loop` |
89: | 2 | 36 | `.opencode/skills/hm-coordinating-loop/references/02-sequential-vs-parallel.md` | `hm-coordinating-loop` → `hm-l2-coordinating-loop` |
90: | 3 | 37 | `.opencode/skills/hm-coordinating-loop/references/03-parent-child-cycles.md` | `hm-coordinating-loop` → `hm-l2-coordinating-loop` |
91: | 4 | 38 | `.opencode/skills/hm-coordinating-loop/references/04-ralph-loop-integration.md` | `hm-coordinating-loop` → `hm-l2-coordinating-loop` |
92: | 5 | 39 | `.opencode/skills/hm-coordinating-loop/references/05-edge-guardrails.md` | `hm-coordinating-loop` → `hm-l2-coordinating-loop` |
93: | 6 | 40 | `.opencode/get-shit-done/references/thinking-models-execution.md` | **Likely non-existent** — verify with glob, then either fix path or remove |
94: 
95: Additionally: All 9 script references (lines 26, 52, 56, 86, 149, 150, 151, 166, 167, 207, 221, etc.) reference `bash scripts/` paths that almost certainly do not exist in the current codebase.
96: 
97: ### Missing Allowed-Tools
98: 
99: Required for coordinator role — current list lacks:
100: 
101: | Tool | Why Needed | Priority |
102: |------|-----------|----------|
103: | `delegate-task` | Primary dispatch mechanism for subagent delegation | HIGH |
104: | `execute-slash-command` | Command dispatch path for deterministic tasks (referenced in flowchart line 97) | HIGH |
105: | `hivemind-command-engine` | Command discovery before execute-slash-command (line 96-97) | HIGH |
106: | `session-tracker` | Session continuity tracking during coordination | MEDIUM |
107: | `session-hierarchy` | Parent-child session navigation during dispatch | MEDIUM |
108: | `session-context` | Cross-session context synthesis | LOW |
109: | `hivemind-doc` | Read SKILL.md files for agent selection | MEDIUM |
110: 
111: ### Non-Existent Skill References
112: 
113: | Skill Referenced | Exists? | Impact |
114: |-----------------|---------|--------|
115: | `hm-planning-persistence` | ❌ DOES NOT EXIST | Cross-reference table (lines 420-421) references a skill that was never created. Must be removed or replaced. |
116: | `dispatching-parallel-agents` | ✅ exists (not hm-* lineage) | Cross-reference valid but non-hm lineage — note the cross-lineage bridge |
117: | `user-intent-interactive-loop` | ✅ exists as `hm-l2-user-intent-interactive-loop` | Name mismatch: references `user-intent-interactive-loop` without `hm-l2-` prefix |
118: 
119: ### Ralph-Loop Patterns to Remove
120: 
121: Lines 165-171, 213-238 contain ralph-loop validator integration (`bash scripts/run-ralph-loop.sh`). Ralph loops are considered "totally nonsensical" per CONTEXT-ANALYSIS (Section 2.1.B.4). **Must remove all ralph-loop references** and replace with practical verification patterns.
122: 
123: ### Target Scope (Reduce)
124: 
125: | Dimension | Current | Target |
126: |-----------|---------|--------|
127: | Lines | 448 | <300 |
128: | allowed-tools | 8 | 12+ |
129: | Broken paths | 6 | 0 |
130: | Script references | 9 | 0 (use tools instead) |
131: | Ralph-loop refs | 30+ lines | 0 |
132: | Cross-references to non-existent skills | 1 | 0 |
133: 
134: ### Edits Required
135: 
136: 1. **Fix 6 broken `<files_to_read>` paths** — rename `hm-coordinating-loop` → `hm-l2-coordinating-loop`, verify/remove GSD reference
137: 2. **Expand `allowed-tools`** — add delegate-task, execute-slash-command, hivemind-command-engine, session-tracker, session-hierarchy, hivemind-doc
138: 3. **Remove ralph-loop sections** (lines 165-171, 213-238)
139: 4. **Remove all `bash scripts/` references** — replace with actual tool calls
140: 5. **Remove `hm-planning-persistence` cross-reference** — replace with hivemind-power-on or hivemind-state-reference
141: 6. **Fix `user-intent-interactive-loop` name** → `hm-l2-user-intent-interactive-loop`
142: 7. **Trim worked example** (lines 241-314) — 70+ lines, compress to <30
143: 8. **Update Kit Bundle Contents** (lines 434-448) — replace scripts with operational tools
144: 9. **Update Platform Adaptation** section — remove bash-script-heavy patterns
145: 
146: ### Gaps & Debts
147: 
148: | Gap | Severity | Description |
149: |-----|----------|-------------|
150: | References directory may not exist | MEDIUM | `.opencode/skills/hm-l2-coordinating-loop/references/` — check existence of all 5 reference files after fixing paths. If they don't exist, create minimal references or eliminate bundled references entirely (per D4: THIN but DEEP). |
151: | Jump link runtime behavior unverified | HIGH | Per D4 constraint: "Jump link + progressive disclosure verification REQUIRED — user reports these mechanisms do NOT work in loaded skills." Must test at runtime. |
152: | Missing subagent-delegation-patterns partner | MEDIUM | coordinating-loop cross-references subagent-delegation-patterns but `hm-l2-subagent-delegation-patterns` may not exist on disk. |
153: | Scripts directory does not exist | HIGH | All 9 `bash scripts/` references point to non-existent infrastructure. Must either create scripts or migrate to tool-based gates. |
154: 
155: ---
156: 
157: ## Skill 2: hm-l2-gate-orchestrator
158: 
159: ### Current State
160: 
161: | Field | Value |
162: |-------|-------|
163: | **Lines** | 221 |
164: | **Layer** | L2 |
165: | **Role** | domain-execution |
166: | **allowed-tools** | `Read, Write, Edit, Bash, Glob, Grep` |
167: | **References** | 1 (`references/gate-flow.md`) |
168: | **Scripts** | 0 |
169: | **Cross-references** | gate-lifecycle-integration, gate-spec-compliance, gate-evidence-truth, hm-production-readiness, hm-requirements-analysis, hm-roadmap-maintainability, hm-lineage-router |
170: 
171: ### Assessment — HEALTHIEST SKILL IN SET
172: 
173: | Criterion | Status |
174: |-----------|--------|
175: | Broken paths | ✅ NONE |
176: | Allowed-tools match actual usage | ✅ YES (Read/Write/Edit/Bash/Glob/Grep correct for document analysis) |
177: | HMQUAL compliance | ✅ COMPLETE (all 8 HMQUAL sections present) |
178: | Cross-references valid | ✅ All 7 cross-references point to existing skills |
179: | Routes-to metadata | ✅ Valid: routes to 3 gate-* skills that all exist |
180: | Self-correction | ✅ 4 anti-patterns documented |
181: | Progressive disclosure | ✅ Uses `references/gate-flow.md` |
182: 
183: ### Minor Issues
184: 
185: | Issue | Line | Description |
186: |-------|------|-------------|
187: | `references/gate-flow.md` existence | 55 | Needs runtime verification per D4 constraint — skill says "Read references/gate-flow.md" but jump links may not render when loaded |
188: | Missing operational tools | — | Could benefit from `prompt-skim`/`prompt-analyze` for pre-gate context analysis, but not critical |
189: | Skill name in usage protocol | 161 | References `hm-gate-orchestrator` (missing `-l2-` infix) — line 161: `Load this skill (\`hm-gate-orchestrator\`)` |
190: 
191: ### Target Scope (Reduce)
192: 
193: | Dimension | Current | Target |
194: |-----------|---------|--------|
195: | Lines | 221 | <200 |
196: | Allowable-tools additions | 0 | +2 (prompt-skim, prompt-analyze) optional |
197: 
198: ### Edits Required
199: 
200: 1. **Fix skill name** line 161: `hm-gate-orchestrator` → `hm-l2-gate-orchestrator`
201: 2. **Optional: add** `prompt-skim` and `prompt-analyze` to allowed-tools for pre-gate context analysis
202: 3. **Verify** `references/gate-flow.md` exists on disk after edit
203: 
204: ### Gaps & Debts
205: 
206: | Gap | Severity | Description |
207: |-----|----------|-------------|
208: | References file may not render when loaded | HIGH | D4 constraint: jump link verification required. Must test at runtime. |
209: | No verification of gate-* skill existence | LOW | Assumes 3 gate skills exist. Would benefit from a compatibility check section. |
210: 
211: ---
212: 
213: ## Skill 3: hm-l2-phase-execution
214: 
215: ### Current State
216: 
217: | Field | Value |
218: |-------|-------|
219: | **Lines** | 190 |
220: | **Layer** | L1 |
221: | **Role** | orchestrator |
222: | **allowed-tools** | `Read, Write, Edit, Bash, Glob, Grep, Task` |
223: | **References** | 3 (`references/wave-protocol.md`, `references/checkpoint-recovery.md`, `references/execution-state-template.md`) |
224: | **Scripts** | 1 (verify.sh) |
225: | **Cross-references** | hm-coordinating-loop (**name mismatch**), hm-planning-persistence (**NON-EXISTENT**), hm-phase-loop, hm-subagent-delegation-patterns |
226: 
227: ### Critical Issues
228: 
229: | Issue | Lines | Description |
230: |-------|-------|-------------|
231: | Legacy state path | 50-51 | References `.opencode/state/opencode-harness/phase-execution/` — per Q6, state belongs in `.hivemind/`. Must migrate all 4 state artifacts. |
232: | Legacy state path | 146 | Independence Notes section: `.opencode/state/opencode-harness/phase-execution/` again |
233: | `Task` in allowed-tools | 23 | `Task` is not an operational tool. May be a platform-native tool but should be explicitly documented. |
234: | Missing delegate-task | — | Phase execution dispatches plans. Should reference delegate-task for subagent plan execution. |
235: | Missing execute-slash-command | — | For command-based plan dispatch. |
236: | Non-existent skill ref | 188 | `hm-planning-persistence` cross-reference — skill does not exist. |
237: | Name mismatch | 187 | `hm-coordinating-loop` → `hm-l2-coordinating-loop` |
238: 
239: ### Target Scope (Reduce)
240: 
241: | Dimension | Current | Target |
242: |-----------|---------|--------|
243: | Lines | 190 | <180 |
244: | Allowed-tools additions | 0 | +3 (delegate-task, execute-slash-command, hivemind-command-engine) |
245: | Legacy paths | 2 locations | 0 |
246: 
247: ### Edits Required
248: 
249: 1. **Migrate state paths**: `.opencode/state/opencode-harness/phase-execution/` → `.hivemind/state/phase-execution/` (lines 50-51, 146)
250: 2. **Add tools**: delegate-task, execute-slash-command, hivemind-command-engine to allowed-tools
251: 3. **Remove `Task`** from allowed-tools unless it's a verified platform tool
252: 4. **Fix cross-reference**: `hm-coordinating-loop` → `hm-l2-coordinating-loop` (line 187)
253: 5. **Remove or replace**: `hm-planning-persistence` cross-reference (line 188) — refer to hivemind-power-on instead
254: 6. **Check** `references/execution-state-template.md` for legacy path references and fix them too
255: 
256: ### Gaps & Debts
257: 
258: | Gap | Severity | Description |
259: |-----|----------|-------------|
260: | `.opencode/state/` → `.hivemind/` migration | HIGH | Q6 compliance — ALL internal state must live under `.hivemind/`. Phase execution state artifacts are internal state. |
261: | Missing subagent-dispatch tools | MEDIUM | Cannot execute plans via subagents without delegate-task in allowed-tools |
262: | Independence Notes (line 146) GSD/non-GSD | LOW | Claims "does not require GSD" but path patterns suggest GSD-specific assumptions. Verify non-GSD compatibility. |
263: 
264: ---
265: 
266: ## Skill 4: hm-l2-phase-loop
267: 
268: ### Current State
269: 
270: | Field | Value |
271: |-------|-------|
272: | **Lines** | 158 |
273: | **Layer** | L2 |
274: | **Role** | domain-execution |
275: | **allowed-tools** | `Read, Write, Edit, Bash, Glob, Grep` |
276: | **References** | 1 (implicit — durable cursor pattern from phase-loop) |
277: | **Scripts** | 0 (but references checker/validator scripts loosely) |
278: | **Cross-references** | hm-planning-persistence (**NON-EXISTENT**), hm-phase-execution |
279: 
280: ### Issues
281: 
282: | Issue | Lines | Description |
283: |-------|-------|-------------|
284: | Legacy state path | 65 | Durable cursor location: `.opencode/state/...` — should be `.hivemind/state/phase-loop/` |
285: | Non-existent skill ref | 157 | `hm-planning-persistence` — skill does not exist |
286: | Ralph-loop adjacency | 44 | Loop flowchart pattern references re-spawning agents in a ralph-like loop (line 44f: "Re-spawn implementer subagent") — should use delegate-task with delegation-status polling |
287: | Missing allowed-tools | — | No session-management tools. Phase loops need to persist durable cursors — `hivemind-doc` for reading cursor state, hivemind-session-view for session context |
288: 
289: ### Target Scope (Reduce)
290: 
291: | Dimension | Current | Target |
292: |-----------|---------|--------|
293: | Lines | 158 | <150 |
294: | Legacy paths | 1 | 0 |
295: | Non-existent skill refs | 1 | 0 |
296: 
297: ### Edits Required
298: 
299: 1. **Migrate cursor path**: `.opencode/state/` → `.hivemind/state/phase-loop/` (line 65)
300: 2. **Remove `hm-planning-persistence`** cross-reference (line 157) — replace with `hivemind-power-on`
301: 3. **Replace ralph-loop agent re-spawn** (line 44f) with `delegate-task` + `delegation-status` polling pattern
302: 4. **Add allowed-tools**: `hivemind-doc` for durable cursor persistence, `delegate-task` for agent dispatch
303: 5. **Verify** cross-reference `hm-phase-execution` exists (line 158) — ✅ exists as `hm-l2-phase-execution`
304: 
305: ### Gaps & Debts
306: 
307: | Gap | Severity | Description |
308: |-----|----------|-------------|
309: | Durable cursor path migration | MEDIUM | Q6 compliance: state under `.opencode/` is legacy; must move to `.hivemind/` |
310: | No tool-based cursor persistence | LOW | Loop cursor is described as a YAML structure but no tool is assigned for reading/writing it. hivemind-doc could serve for reading, but Write is also needed. |
311: 
312: ---
313: 
314: ## Skill 5: hm-l2-completion-looping
315: 
316: ### Current State
317: 
318: | Field | Value |
319: |-------|-------|
320: | **Lines** | 149 |
321: | **Layer** | L2 |
322: | **Role** | domain-execution |
323: | **allowed-tools** | `Read, Write, Edit, Bash, Glob, Grep` |
324: | **References** | 3 (`references/verification-checklist.md`, `references/loop-patterns.md`, `references/durable-completion-cursors.md`) |
325: | **Scripts** | 0 |
326: | **Cross-references** | hm-coordinating-loop (**name mismatch**), hm-phase-loop, hm-planning-persistence (**NON-EXISTENT**) |
327: 
328: ### Issues
329: 
330: | Issue | Lines | Description |
331: |-------|-------|-------------|
332: | Name mismatch | 145-148 | `hm-coordinating-loop` → `hm-l2-coordinating-loop` |
333: | Non-existent skill ref | 149 | `hm-planning-persistence` — does not exist |
334: | Missing allowed-tools | — | For self-verification envelopes, needs `delegation-status` for checking subagent completion. Also needs `session-journal-export` for loop state export. |
335: | Ralph-loop guardrails | 51-53 | Phase 30 hardening section (lines 47-55) references "per-edge guardrail evidence" pattern from ralph-loop era — should be simplified |
336: | Durable cursor path | 75 | Cursor fields described as schema but no persistence path specified. Should reference `.hivemind/state/completion-loop/`. |
337: 
338: ### Target Scope (Reduce)
339: 
340: | Dimension | Current | Target |
341: |-----------|---------|--------|
342: | Lines | 149 | <140 |
343: | Allowed-tools additions | 0 | +2 (delegation-status, session-journal-export) |
344: | Non-existent skill refs | 1 | 0 |
345: | Name mismatches | 1 | 0 |
346: 
347: ### Edits Required
348: 
349: 1. **Fix name mismatch**: `hm-coordinating-loop` → `hm-l2-coordinating-loop` (line 145)
350: 2. **Remove `hm-planning-persistence`** cross-reference (line 149) — replace with `hivemind-power-on`
351: 3. **Add allowed-tools**: `delegation-status`, `session-journal-export`
352: 4. **Specify cursor persistence path**: Add `Session journal: session-journal-export` to the durable cursor fields (line 75)
353: 5. **Simplify guardrail lineage** (lines 45-55) — remove LangGraph/AutoGen/OpenAI source lineage, keep local adaptation only
354: 
355: ### Gaps & Debts
356: 
357: | Gap | Severity | Description |
358: |-----|----------|-------------|
359: | Durable cursor has no persistence tool | LOW | Schema is defined but no tool writes it to disk. session-journal-export can read but what writes? Add Write to allowed-tools for cursor persistence. |
360: | References directory contents unverified | MEDIUM | 3 reference files may or may not exist. Must verify after fix: `references/verification-checklist.md`, `references/loop-patterns.md`, `references/durable-completion-cursors.md`. |
361: | D4 jump link verification | HIGH | Same D4 constraint: must test at runtime whether references render when skill is loaded. |
362: 
363: ---
364: 
365: ## Cross-Skill Findings
366: 
367: ### Redundancies
368: 
369: | Pattern | Appears In | Recommendation |
370: |---------|-----------|---------------|
371: | `hm-planning-persistence` cross-reference | coordinating-loop, phase-execution, phase-loop, completion-looping **(4/5 skills)** | Replace all with `hivemind-power-on` or remove. Skill never existed. |
372: | Ralph-loop validator pattern | coordinating-loop, phase-loop, completion-looping **(3/5 skills)** | Replace all with `delegate-task` + `delegation-status` polling. Ralph-loops are deprecated per CONTEXT-ANALYSIS. |
373: | Legacy `.opencode/state/` paths | phase-execution, phase-loop **(2/5 skills)** | Migrate all to `.hivemind/state/` per Q6 |
374: | Bash script gate enforcement | coordinating-loop **(9 scripts)** | Replace with tool-based verification (delegate-task + delegation-status) |
375: | `hm-coordinating-loop` name mismatch | phase-execution, completion-looping **(2/5 skills)** | Fix to `hm-l2-coordinating-loop` |
376: | "Iron Law" enforcement section | gate-orchestrator, phase-execution, completion-looping **(3/5 skills)** | Redundant pattern — keep if useful but ensure consistent style |
377: | Self-Correction 4-mode pattern | **ALL 5 skills** | Consistent pattern — good. Keep as standard template. |
378: | Anti-Patterns table | **ALL 5 skills** | Consistent pattern — good. Keep as standard template. |
379: | Cross-References table | **ALL 5 skills** | Consistent pattern — good. Keep as standard template. |
380: 
381: ### Dependency Issues
382: 
383: | Issue | Impact | Resolution |
384: |-------|--------|------------|
385: | coordinating-loop references non-existent scripts directory | HIGH — script-based gates cannot work | Must either create scripts/ directory or remove all bash script references in favor of tool-based gates |
386: | No skill has `delegate-task` in allowed-tools | HIGH — cannot dispatch subagents | All ORCHESTRATION skills must have at minimum `delegate-task` and `delegation-status` |
387: | No skill has `execute-slash-command` in allowed-tools | MEDIUM — coordinating-loop flowchart references command dispatch but tool not whitelisted | Add to coordinating-loop and phase-execution |
388: | 0/5 skills reference session tools | MEDIUM — no session context available | coordinating-loop should reference session-tracker, session-hierarchy, session-context |
389: | Gate-orchestrator has no operational tool gaps | ✅ HEALTHY | Only skill without severe gaps — use as reference model |
390: 
391: ### Cross-Reference Integrity Map
392: 
393: | Source Skill | References | Valid? |
394: |-------------|-----------|--------|
395: | coordinating-loop | dispatching-parallel-agents | ✅ exists |
396: | coordinating-loop | user-intent-interactive-loop | ⚠️ exists as `hm-l2-user-intent-interactive-loop` (prefix mismatch) |
397: | coordinating-loop | hm-planning-persistence | ❌ does not exist |
398: | coordinating-loop | phase-loop | ✅ exists as `hm-l2-phase-loop` (prefix mismatch — OK for text, bad for automation) |
399: | gate-orchestrator | gate-lifecycle-integration | ✅ exists |
400: | gate-orchestrator | gate-spec-compliance | ✅ exists |
401: | gate-orchestrator | gate-evidence-truth | ✅ exists |
402: | gate-orchestrator | hm-production-readiness | ✅ exists |
403: | gate-orchestrator | hm-requirements-analysis | ✅ exists |
404: | gate-orchestrator | hm-roadmap-maintainability | ✅ exists |
405: | gate-orchestrator | hm-lineage-router | ✅ exists |
406: | phase-execution | hm-coordinating-loop | ⚠️ name prefix mismatch — exists as `hm-l2-coordinating-loop` |
407: | phase-execution | hm-planning-persistence | ❌ does not exist |
408: | phase-execution | hm-phase-loop | ✅ exists |
409: | phase-execution | hm-subagent-delegation-patterns | ⚠️ may not exist as L2 — L3 version exists |
410: | phase-loop | hm-planning-persistence | ❌ does not exist |
411: | phase-loop | hm-phase-execution | ✅ exists |
412: | completion-looping | hm-coordinating-loop | ⚠️ name prefix mismatch |
413: | completion-looping | hm-phase-loop | ✅ exists |
414: | completion-looping | hm-planning-persistence | ❌ does not exist |
415: 
416: **Summary:**
417: - 4/5 skills reference `hm-planning-persistence` — ❌ NON-EXISTENT, remove from all
418: - 3/5 skills have name prefix mismatches — fix all to `hm-l2-` prefix
419: - 1 reference may point to wrong layer (subagent-delegation-patterns L3 vs L2)
420: 
421: ### Overall Recommendations
422: 
423: 1. **Unified allowed-tools baseline for ORCHESTRATION skills:**
424:    ```yaml
425:    allowed-tools:
426:      - Read
427:      - Write
428:      - Edit
429:      - Bash
430:      - Glob
431:      - Grep
432:      - delegate-task
433:      - delegation-status
434:      - execute-slash-command
435:      - hivemind-command-engine
436:      - hivemind-doc
437:    ```
438:    (Each skill may add more per its specific needs)
439: 
440: 2. **Migrate all state paths** from `.opencode/state/` to `.hivemind/state/` across all skills
441: 
442: 3. **Normalize cross-reference names** to full `hm-l2-*` prefixes
443: 
444: 4. **Remove all `hm-planning-persistence` references** — replace with `hivemind-power-on` or remove entirely
445: 
446: 5. **Replace bash script gates** with tool-based equivalents:
447:    - `bash scripts/check-gate.sh` → `delegate-task` + verify
448:    - `bash scripts/validate-envelope.sh` → inline validation + `delegation-status`
449:    - `bash scripts/run-ralph-loop.sh` → remove entirely
450: 
451: 6. **D4 constraint enforcement:** After all edits, test jump link behavior at runtime by loading each rewritten skill and verifying that `<files_to_read>` paths render. Document actual behavior in a follow-up artifact.
452: 
453: 7. **Add `hm-l2-subagent-delegation-patterns` existence check** to the rewrite plan. If it doesn't exist, either create it or remove cross-references from coordinating-loop and phase-execution.
454: 
455: ---
456: 
457: ## Skill Edit Priority Order
458: 
459: | Priority | Skill | Effort | Risk | Reason |
460: |----------|-------|--------|------|--------|
461: | 1 | hm-l2-coordinating-loop | HIGH | HIGH | Most broken (448 lines, 6 paths, 9 scripts, missing tools). Blocks all coordination. |
462: | 2 | hm-l2-phase-execution | MEDIUM | MEDIUM | Legacy paths, missing tools, broken cross-refs. Foundation for wave execution. |
463: | 3 | hm-l2-completion-looping | LOW | LOW | Mostly sound. Name fix + tool additions + 1 cross-ref removal. |
464: | 4 | hm-l2-phase-loop | LOW | LOW | Path migration + cross-ref fix + ralph-loop removal. |
465: | 5 | hm-l2-gate-orchestrator | LOWEST | LOWEST | Healthiest skill. 1 name fix + optional tool additions. |
466: 
467: ---
468: 
469: ## Total Edit Summary
470: 
471: | Metric | Value |
472: |--------|-------|
473: | Skills to edit | 5 |
474: | Total current lines | 1,166 |
475: | Total target lines | <970 (~17% reduction) |
476: | Broken paths to fix | 6 |
477: | Allowed-tools additions | ~15 across all skills |
478: | Non-existent skill refs to remove | 4 (hm-planning-persistence) |
479: | Name mismatches to fix | 5 |
480: | Legacy state paths to migrate | 3 |
481: | Ralph-loop sections to remove | 3 skills |
482: | Script references to eliminate | 9 (coordinating-loop only) |
483: | Cross-references to verify | 22 (14 valid, 5 name-fix, 4 remove) |
484: | Jump-link runtime tests required | 5 (D4 compliance) |

(End of file - total 484 lines)
</content>
```

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/phases/23-notification-fix-and-tool-surface-docs/23-W3-SYNTHESIS.md"
}
```

**Output:**
```
<path>/Users/apple/hivemind-plugin-private/.planning/phases/23-notification-fix-and-tool-surface-docs/23-W3-SYNTHESIS.md</path>
<type>file</type>
<content>
1: # Wave 3 Synthesis: FOUNDATION + REFERENCE Skills (5 skills)
2: 
3: **Date:** 2026-05-23
4: **Source files:** 5 SKILL.md files + 23-SYSTEM-AUDIT + 23-CONTEXT + 23-PATTERNS
5: **Wave scope:** Wave 3B (hivemind-power-on) + Wave 3C (4 REFERENCE skills)
6: **Status:** READY — scoping complete, gaps/debts documented
7: 
8: ---
9: 
10: ## Summary
11: 
12: | Metric | Value |
13: |--------|-------|
14: | Skills analyzed | 5 |
15: | Total current LOC | 2,125 (hivemind-power-on: 236 + engine-contracts: 451 + state-reference: 414 + integration-contracts: 447 + tool-capability-matrix: 577) |
16: | Total target LOC (post-edit) | <1,700 (~20% reduction) |
17: | Operational tools — include | 18 (✅ fully operational) |
18: | Partial tools — EXCLUDE from Wave 3 | 4 (🚫 TBD: run-background-command, hivemind-trajectory, hivemind-pressure, hivemind-agent-work) |
19: | Tools currently in allowed-tools that MUST be removed | 2 (hivemind-power-on lists hivemind-trajectory + hivemind-pressure) |
20: | Reference directories missing | 2 skills (engine-contracts, state-reference) |
21: | Reference directories empty | 1 skill (tool-capability-matrix has 0 content files) |
22: | IRON CLAW blocks (boilerplate duplication) | 4/5 skills — 5-step validation chain repeated identically |
23: | Anti-pattern tables | 3/5 skills present |
24: | Self-correction sections | 5/5 skills present (consistent pattern) |
25: 
26: ---
27: 
28: ## Tool Scope
29: 
30: ### Operational — Include as Reference (✅ 18 tools)
31: 
32: | Tool | Phase Origin | Include In |
33: |------|-------------|-----------|
34: | `delegate-task` | CP-DT-01 ✅ | hivemind-power-on, engine-contracts, tool-capability-matrix |
35: | `delegation-status` | CP-DT-01 ✅ | hivemind-power-on, engine-contracts |
36: | `execute-slash-command` | P21.1 ✅ | hivemind-power-on (tool catalog), engine-contracts |
37: | `session-tracker` | CP-ST-01 ✅ | hivemind-power-on, state-reference |
38: | `session-hierarchy` | CP-ST-01 ✅ | hivemind-power-on |
39: | `session-context` | CP-ST-01 ✅ | hivemind-power-on |
40: | `hivemind-session-view` | P16 ✅ | hivemind-power-on |
41: | `hivemind-command-engine` | CP-CMD-01 ✅ | hivemind-power-on (tool catalog), engine-contracts |
42: | `prompt-skim` | Pre-restructuring ✅ | hivemind-power-on (tool catalog) |
43: | `prompt-analyze` | Pre-restructuring ✅ | hivemind-power-on (tool catalog) |
44: | `session-patch` | Pre-restructuring ✅ | hivemind-power-on |
45: | `session-journal-export` | Pre-restructuring ✅ | state-reference |
46: | `hivemind-doc` | Pre-restructuring ✅ | engine-contracts |
47: | `hivemind-sdk-supervisor` | P14 ✅ | engine-contracts |
48: | `configure-primitive` | BOOT ✅ | tool-capability-matrix (meta-builder tools), integration-contracts |
49: | `validate-restart` | BOOT ✅ | tool-capability-matrix |
50: | `bootstrap-init` | BOOT ✅ | hivemind-power-on (init context) |
51: | `bootstrap-recover` | BOOT ✅ | hivemind-power-on (recovery context) |
52: 
53: ### Partial — EXCLUDE from Wave 3 Scope (🚫 4 tools)
54: 
55: These tools are 🟡 PARTIAL per 23-SYSTEM-AUDIT. They MUST NOT appear in Wave 3 skill edits because their designs are pending future phases:
56: 
57: | Tool | Status | Blocking Phase | Exclusion Reason |
58: |------|--------|---------------|------------------|
59: | `run-background-command` | 🟡 PARTIAL | CP-PTY-01 chưa start | PTY control-plane MVP not implemented. Currently in tool-capability-matrix Hivemind custom tools list — must NOT be removed from matrix (it's catalogued) but must be flagged as PARTIAL. Must NOT appear in hivemind-power-on tool catalog after trim. |
60: | `hivemind-trajectory` | 🟡 PARTIAL | P24 chưa tới | State machine untested. Currently in hivemind-power-on allowed-tools (line 30) and tool catalog (line 175) — **MUST BE REMOVED** from both. In engine-contracts (line 176 for trajectory) — must be removed or flagged PARTIAL with caveat. |
61: | `hivemind-pressure` | 🟡 PARTIAL | P26 chưa tới | Redesign pending. Currently in hivemind-power-on allowed-tools (line 34) and tool catalog (line 178) — **MUST BE REMOVED** from both. In engine-contracts tool table — must be removed or flagged PARTIAL. |
62: | `hivemind-agent-work` | 🟡 PARTIAL | P24-25 chưa tới | Lifecycle untested. In hivemind-power-on tool catalog (lines 183-184) — must be removed during trim. In engine-contracts tool table — must be removed or flagged PARTIAL. |
63: 
64: ### Mapping to Skill Files (confirmed from glob + read)
65: 
66: | Tool Exists In | Skills |
67: |----------------|--------|
68: | hivemind-power-on allowed-tools (line 30) | `hivemind-trajectory` ← 🚫 REMOVE |
69: | hivemind-power-on allowed-tools (line 34) | `hivemind-pressure` ← 🚫 REMOVE |
70: | hivemind-power-on tool catalog (lines 168-188) | Lists all 18 tools including `hivemind-trajectory`, `hivemind-pressure`, `hivemind-agent-work` ← 🚫 REMOVE 4 PARTIAL tools, keep 18 operational |
71: | engine-contracts tool table (lines 124-137) | Lists `run-background-command` (line 129), plus `delegate-task`, `delegation-status`, `prompt-skim`, `prompt-analyze`, `session-patch`, `session-journal-export`, `configure-primitive`, `validate-restart` |
72: | engine-contracts cross-ref (line 176, 178) | References `hivemind-trajectory` and `hivemind-pressure` — must be removed or flagged with PARTIAL caveat |
73: | tool-capability-matrix (lines 156-165) | Lists `run-background-command` (line 157) — must NOT be removed from catalog (documentation) but must be flagged 🟡 PARTIAL with caveat |
74: 
75: ---
76: 
77: ## Skill 1: hivemind-power-on — Session Governance Core
78: 
79: ### Current State
80: 
81: | Field | Value |
82: |-------|-------|
83: | **Lines** | 236 |
84: | **Layer** | — (hivemind lineage, L0-support) |
85: | **Load priority** | 1 (LOAD FIRST) |
86: | **allowed-tools** | skill, read, grep, glob, bash, task, todowrite, session-tracker, session-hierarchy, session-context, hivemind-session-view, delegation-status, **hivemind-trajectory 🚫**, prompt-skim, prompt-analyze, hivemind-doc, **hivemind-pressure 🚫** |
87: | **Consumed-by** | hm-l0-orchestrator, hf-l0-orchestrator, hm-l1-coordinator, hf-l1-coordinator, hm-l2-conductor, hf-l2-meta-builder |
88: | **References** | `references/` directory ✅ (6 files: session-tracker-anatomy, task-tool-resume, lineage-routing, project-phase-routing, continuity-navigation, delegation-depth-recovery) |
89: | **Tool catalog** | 18 tools (lines 166-188) — includes 4 PARTIAL tools that must be removed |
90: | **Jump links** | Lines 149-162 — progressive disclosure table with 6 reference files |
91: 
92: ### Critical Issues
93: 
94: | # | Issue | Lines | Severity |
95: |---|-------|-------|----------|
96: | 1 | **`hivemind-trajectory` in allowed-tools** | Line 30 | 🔴 HIGH — PARTIAL tool, not operational per SYSTEM-AUDIT, redesign pending P24 |
97: | 2 | **`hivemind-pressure` in allowed-tools** | Line 34 | 🔴 HIGH — PARTIAL tool, redesign pending P26 |
98: | 3 | **Tool catalog includes 4 PARTIAL tools** | Lines 175-184 | 🟡 MEDIUM — trajectory (line 175), pressure (line 178), agent-work-create (line 183), agent-work-export (line 184) must be removed or flagged with caveats |
99: | 4 | **Tool catalog too long (18 tools)** | Lines 166-188 | 🟡 MEDIUM — per PATTERNS.md trim plan, compress to 6-line summary or remove (tools already documented in tool-capability-matrix) |
100: | 5 | **Bootstrap/recovery tools missing from allowed-tools** | — | 🟡 LOW — `bootstrap-init` and `bootstrap-recover` are not in allowed-tools but should be for init/recovery workflows |
101: | 6 | **`delegate-task` not in allowed-tools** | — | 🟡 LOW — referenced in tool catalog (line 176) but not in allowed-tools frontmatter. As "LOAD FIRST" skill for orchestrators, this is inconsistent. |
102: 
103: ### Target Scope (Reduce)
104: 
105: | Dimension | Current | Target |
106: |-----------|---------|--------|
107: | Lines | 236 | ~150-160 |
108: | allowed-tools | 17 | 17 (remove 2 TBD, add 0 if bootstrap stays implicit) |
109: | Tool catalog tools | 18 | 14 (remove 4 PARTIAL, keep 14 operational) |
110: | Tool catalog lines | 22 lines (168-188) | ~6-8 lines (summary format) |
111: | Broken/missing ref paths | 0 | 0 (verify after edits) |
112: 
113: ### Edits Required
114: 
115: 1. **Remove `hivemind-trajectory`** from allowed-tools (line 30)
116: 2. **Remove `hivemind-pressure`** from allowed-tools (line 34)
117: 3. **Compress tool catalog** (lines 164-188) — replace 22-line per-tool table with:
118:    - Brief sentence pointing to `hm-l3-tool-capability-matrix` for full catalog
119:    - 4-6 line summary of key tool categories (session, delegation, prompt, config)
120:    - Cross-reference: "See hm-l3-tool-capability-matrix for complete catalog with permission levels"
121: 4. **Remove hivemind-trajectory, hivemind-pressure, hivemind-agent-work-create, hivemind-agent-work-export** from tool catalog (or mark with 🟡 PARTIAL caveat)
122: 5. **Add `delegate-task`** to allowed-tools (consistency with tool catalog)
123: 6. **Verify all 6 reference files exist** and path references are correct (lines 155-162)
124: 7. **Verify jump link rendering** at runtime per D4 constraint
125: 
126: ### Gaps & Debts
127: 
128: | Gap | Severity | Description |
129: |-----|----------|-------------|
130: | References dir exists (6 files) | ✅ VERIFIED | No gap — 6 reference files confirmed on disk |
131: | `bootstrap-init`/`bootstrap-recover` not in allowed-tools | 🟡 LOW | Only in tool catalog. If orchestrators need to init/recover sessions, they need these tools. Add to allowed-tools or document that these are hf-meta-builder tools. |
132: | D4 jump link verification required | 🔴 HIGH | Per CONTEXT.md D4: "Jump link + progressive disclosure verification REQUIRED — user reports these mechanisms do NOT work in loaded skills." Must test at runtime after edits. |
133: | `delegate-task` in catalog but not in allowed-tools | 🟡 LOW | Trimming tool catalog may solve this (remove individual entries, point to tool-capability-matrix) |
134: 
135: ---
136: 
137: ## Skill 2: hm-l3-hivemind-engine-contracts — Engine Integration Contracts
138: 
139: ### Current State
140: 
141: | Field | Value |
142: |-------|-------|
143: | **Lines** | 451 |
144: | **Layer** | L3 REFERENCE |
145: | **Role** | reference |
146: | **Pattern** | P2 |
147: | **context-bomb** | true |
148: | **allowed-tools** | Read, Grep, Glob, Bash |
149: | **References** | `references/` directory ❌ **DOES NOT EXIST** |
150: | **Source verification** | Claims "All contracts verified against src/plugin.ts and src/lib/ source code (2026-04-30)" — **~23 days stale** |
151: | **Cross-references** | hm-l3-hivemind-state-reference (line 449) |
152: 
153: ### IRON CLAW Block
154: 
155: **4,600+ characters** (lines 24-90) — the full 5-step validation chain, consumption rules table, and integrated enforcement points table. Identical boilerplate across engine-contracts, state-reference, integration-contracts, tool-capability-matrix.
156: 
157: ### Critical Issues
158: 
159: | # | Issue | Lines | Severity |
160: |---|-------|-------|----------|
161: | 1 | **No `references/` directory** | — | 🔴 HIGH — skill references external docs for plugin load order, tool registration, hook composition but has no reference files on disk |
162: | 2 | **Source verification 23 days stale** | Line 20 | 🔴 HIGH — claims verified against `src/plugin.ts` as of 2026-04-30. Today is 2026-05-23. Plugin load order, tool count, and registrations may have changed (e.g., Phase 22 added delegation-status notification routing, P21 added execute-slash-command). Must reverify. |
163: | 3 | **Tool registration table omits 15 tools** | Lines 124-137 | 🟡 MEDIUM — table lists 9 tools but SYSTEM-AUDIT confirms 23 tools registered. Missing: `session-tracker`, `session-hierarchy`, `session-context`, `hivemind-session-view`, `hivemind-command-engine`, `hivemind-sdk-supervisor`, `hivemind-doc`, `hivemind-trajectory` (PARTIAL), `hivemind-pressure` (PARTIAL), `hivemind-agent-work-create/export`, `bootstrap-init`, `bootstrap-recover`, `run-background-command` (PARTIAL). Skill says "Currently registered tools (8 tools)" — count is wrong. |
164: | 4 | **References `hivemind-trajectory`, `hivemind-pressure` as stable tools** | Lines 176, 178 | 🟡 MEDIUM — cross-references in tool sections reference PARTIAL tools as if they are stable. Must flag with PARTIAL caveat. |
165: | 5 | **IRON CLAW bloated** | Lines 24-90 | 🟡 MEDIUM — 67 lines of boilerplate. Can be compressed to ~15 lines with cross-reference to a canonical source. |
166: | 6 | **Concurrency defaults outdated?** | Lines 269-293 | 🟡 LOW — may still reference `src/lib/` paths. Per WS-SR restructuring, `src/lib/` was removed. Code now lives under `src/shared/`, `src/coordination/`, etc. Verify paths. |
167: 
168: ### Target Scope (Reduce)
169: 
170: | Dimension | Current | Target |
171: |-----------|---------|--------|
172: | Lines | 451 | <380 |
173: | IRON CLAW | 67 lines | ~20 lines (cross-ref to canonical IRON CLAW doc) |
174: | Source verification staleness | 23 days | 0 days (reverify against current src/plugin.ts) |
175: | Tool registration table | 9 tools | 23 tools (complete from SYSTEM-AUDIT) |
176: | References directory | MISSING | Optional — all content is inline, no external refs needed |
177: | PARTIAL tool refs | 3 unmarked | All flagged with 🟡 PARTIAL caveat |
178: 
179: ### Edits Required
180: 
181: 1. **Reverify plugin load order** against current `src/plugin.ts` — load order may have changed since April 30
182: 2. **Update tool registration table** (lines 124-137) — expand from 9 tools to all 23 tools, or note that some are documented in tool-capability-matrix and point there
183: 3. **Remove or flag `hivemind-trajectory`, `hivemind-pressure`, `hivemind-agent-work`, `run-background-command`** as PARTIAL (or remove them from stable tool groups)
184: 4. **Compress IRON CLAW** (lines 24-90) — keep Step 1-5 outline but remove consumption rules and enforcement points tables (those are for implementation authority, not needed for a read-only reference skill)
185: 5. **Update stale path references** — `src/lib/` → `src/shared/`, `src/coordination/`, etc. per WS-SR restructuring
186: 6. **Remove or update** the "Source verification" date claim — reverify and update
187: 7. **Add cross-reference** to `hm-l3-tool-capability-matrix` for complete tool catalog
188: 
189: ### Gaps & Debts
190: 
191: | Gap | Severity | Description |
192: |-----|----------|-------------|
193: | References directory missing | 🟡 LOW | No reference files shipped with this skill. This is actually fine — all content is inline. But the skill's frontmatter or "On Load" section should not reference external files that don't exist. |
194: | 23-day staleness of source verification | 🔴 HIGH | Contract accuracy depends on current source code. Must reverify `src/plugin.ts` load order (line 96-106), tool registration (line 124-137), budget defaults (line 300-306), concurrency policies (line 269-293). |
195: | `src/lib/` → restructured paths | 🟡 MEDIUM | Per WS-SR restructuring (CP-ST-04 etc.), `src/lib/` was removed. Skill still references `src/lib/completion-detector.ts`, `src/lib/concurrency.ts`, `src/lib/types.ts`. Must update to current paths. |
196: | Tool count wrong ("8 tools" → 23 tools) | 🟡 MEDIUM | Skill claims 8 registered tools but SYSTEM-AUDIT confirms 23. Must fix. |
197: | Locked decisions Q1-Q6 reference (line 10) | 🟡 LOW | Frontmatter `requires: Q1-Q6-validation-decisions` — Q6 decisions have been made but may need reverification per current state. |
198: 
199: ---
200: 
201: ## Skill 3: hm-l3-hivemind-state-reference — State Root Reference
202: 
203: ### Current State
204: 
205: | Field | Value |
206: |-------|-------|
207: | **Lines** | 414 |
208: | **Layer** | L3 REFERENCE |
209: | **Role** | reference |
210: | **Pattern** | P2 |
211: | **context-bomb** | true |
212: | **allowed-tools** | Read, Grep, Glob, Bash |
213: | **References** | `references/` directory ❌ **DOES NOT EXIST** |
214: | **Cross-references** | hm-l3-hivemind-engine-contracts (line 412) |
215: 
216: ### Issues
217: 
218: | # | Issue | Lines | Severity |
219: |---|-------|-------|----------|
220: | 1 | **IRON CLAW boilerplate** | Lines 24-90 | 🟡 MEDIUM — 67 lines identical to engine-contracts, integration-contracts, tool-capability-matrix |
221: | 2 | **No references directory** | — | 🟡 LOW — all content inline, no external files needed |
222: | 3 | **`.hivemind/` structure may have changed** | Lines 93-115 | 🟡 MEDIUM — directory tree documented from writing date may not match current filesystem. Must verify with `ls -R .hivemind/`. |
223: | 4 | **`config-workflows.json` documented but stale?** | Lines 271-311 | 🟡 LOW — Phase 21 may have changed workflow persistence format. Verify against current file on disk. |
224: | 5 | **Planning persistence documented** | Lines 312-329 | 🟡 LOW — references `hm-planning-persistence` template format. This skill was identified as non-existent in W2 synthesis. |
225: | 6 | **Agent Access Boundaries table may need update** | Lines 360-366 | 🟡 LOW — L3 reference say "read-only, no direct write" — correct. But L2 specialists listed as "read-only" which matches W2 findings. |
226: | 7 | **Legacy `.opencode/state/` references** | Lines 373-374 | 🟡 LOW — Anti-pattern #3 flags `.opencode/state/` as migration-only. Good — this is correct guidance. |
227: 
228: ### Target Scope (Reduce)
229: 
230: | Dimension | Current | Target |
231: |-----------|---------|--------|
232: | Lines | 414 | <350 |
233: | IRON CLAW | 67 lines | ~20 lines |
234: | `.hivemind/` accuracy | Assumed | Verified against disk |
235: 
236: ### Edits Required
237: 
238: 1. **Compress IRON CLAW** (lines 24-90) — keep 5 steps, remove consumption/enforcement tables
239: 2. **Verify `.hivemind/` directory structure** (lines 93-115) against current filesystem — run `ls -R .hivemind/` and update any discrepancies
240: 3. **Verify `session-continuity.json` schema** (lines 121-178) — particularly `PendingNotification` format which was modified in Phase 22 (notification TTL, retry). Ensure `delivered` boolean and `metadata.delegationId` fields are documented.
241: 4. **Verify `delegations.json` schema** (lines 203-228) — check if Phase 22 added fields (`errorCode`, `notificationRetryCount`, `notificationTTL`)
242: 5. **Update planning persistence section** (lines 312-329) — remove `hm-planning-persistence` reference, or note it's a template format
243: 6. **Remove `event-tracker/` legacy section** (lines 244-269) — or compress to 2-line note. Currently 24 lines documenting a removed system.
244: 7. **Verify anti-pattern #3** (line 374-375) — `.opencode/state/` → `.hivemind/` migration guidance is correct, keep as-is
245: 
246: ### Gaps & Debts
247: 
248: | Gap | Severity | Description |
249: |-----|----------|-------------|
250: | `.hivemind/` structure not verified against disk | 🟡 MEDIUM | May contain artifacts from Phase 22 (notification TTL records), Phase 21 (delegation refactoring), or other recent phases that the docs don't reflect. Must verify. |
251: | `event-tracker/` section is dead weight | 🟡 LOW | 24 lines documenting a removed system. "REMOVED in CP-ST-03" (line 244). Could compress to "REMOVED — see session-tracker instead" (2 lines). |
252: | IRON CLAW duplication across 4 REFERENCE skills | 🟡 HIGH | Every REFERENCE skill copies the exact same 67-line IRON CLAW block. 4 × 67 = 268 lines of identical boilerplate. Consider centralizing into a shared reference file that all skills cross-reference. |
253: | `hm-planning-persistence` name inconsistency | 🟡 LOW | W2 found this skill does not exist. State-reference documents its template format as if it exists. Either remove or note that the template is used but the skill was never created. |
254: 
255: ---
256: 
257: ## Skill 4: hm-l3-integration-contracts — Agent↔Skill Binding Contracts
258: 
259: ### Current State
260: 
261: | Field | Value |
262: |-------|-------|
263: | **Lines** | 447 |
264: | **Layer** | L3 REFERENCE |
265: | **Role** | integration-contracts |
266: | **Pattern** | P2 |
267: | **Lineage** | hm-\* |
268: | **allowed-tools** | Read, Write, Edit, Bash, Glob, Grep |
269: | **References** | `references/` ✅ **(4 files: agent-to-skill-bindings.md, contract-schema.md, cross-lineage-rules.md, skill-to-agent-bindings.md)** |
270: | **Consumed-by** | hm-l0, hm-l1, hm-l2-\*, hf-l2-\*, both skill-routers |
271: | **Cross-references** | hm-l2-skill-router, hf-l2-skill-router, hf-l2-naming-syndicate, gate-l3-evidence-truth |
272: 
273: ### Issues
274: 
275: | # | Issue | Lines | Severity |
276: |---|-------|-------|----------|
277: | 1 | **IRON CLAW boilerplate** | Lines 46-111 | 🟡 MEDIUM — 66 lines identical to other REFERENCE skills |
278: | 2 | **Agent inventory may be stale (97 agents)** | Line 413 | 🟡 MEDIUM — claims "97 agents mapped" but this is from April 2026. Current agent count may differ. Must verify against `.opencode/agents/`. |
279: | 3 | **RICH-8 self-scoring asserts PASS** | Lines 410-422 | 🟡 MEDIUM — self-scored at 108/120 (A-grade). This is a claim that needs reverification per current codebase. |
280: | 4 | **On Load instructions point to non-existent validation script** | Line 129 | 🟡 MEDIUM — `scripts/validate-contracts.sh` — does this script exist on disk? If not, the "On Load" instruction is broken. |
281: | 5 | **Write + Edit in allowed-tools for a REFERENCE skill** | Line 36 | 🟡 LOW — `Write` and `Edit` in allowed-tools is unusual for an L3 reference skill. Allowed-tools should match the REFERENCE standard: `Read, Grep, Glob, Bash`. Write/Edit may be for updating contract bindings but this contradicts the L3 read-only role. |
282: | 6 | **`configure-primitive` not in allowed-tools** | — | 🟡 LOW — integration contracts need to compile/decompile agent and skill definitions to verify bindings. Tool is operational but missing from allowed-tools. |
283: 
284: ### Target Scope (Reduce)
285: 
286: | Dimension | Current | Target |
287: |-----------|---------|--------|
288: | Lines | 447 | <380 |
289: | IRON CLAW | 66 lines | ~20 lines |
290: | allowed-tools | Read, Write, Edit, Bash, Glob, Grep | Read, Grep, Glob, Bash, configure-primitive (remove Write/Edit for L3 reference role) |
291: | Agent inventory | 97 (claimed) | Verified actual count |
292: | Validation script | referenced | verified existence or remove reference |
293: 
294: ### Edits Required
295: 
296: 1. **Compress IRON CLAW** (lines 46-111) — keep 5 steps, remove consumption/enforcement tables
297: 2. **Remove `Write` and `Edit` from allowed-tools** (line 36) — L3 reference skill should not need write/edit permissions. If writing contracts is needed, it's a meta-builder task (hf-* lineage).
298: 3. **Add `configure-primitive`** to allowed-tools — for reading current agent/skill definitions
299: 4. **Verify agent count** — check `.opencode/agents/` for actual count. Update "97 agents" claim if stale.
300: 5. **Verify `scripts/validate-contracts.sh` exists** (line 129) — if not, either create it or remove the reference
301: 6. **Verify all 4 reference files content** — `agent-to-skill-bindings.md`, `contract-schema.md`, `cross-lineage-rules.md`, `skill-to-agent-bindings.md` exist at 7-8KB each (confirmed). Verify paths match current `.opencode/skills/hm-l3-integration-contracts/references/`.
302: 7. **Update RICH-8 scorecard** (lines 410-422) — reverify PASS claims against current state
303: 8. **Verify cross-lineage rules** (lines 322-328) — Rule 5 says hf agents MAY load hm skills. Confirm this is still the correct policy per D-AD-01.
304: 
305: ### Gaps & Debts
306: 
307: | Gap | Severity | Description |
308: |-----|----------|-------------|
309: | 97 agent count claim unverified | 🟡 MEDIUM | Agent definitions may have been added/renamed since April. Must glob and count. |
310: | `scripts/validate-contracts.sh` existence unknown | 🟡 MEDIUM | Referenced as executable validation (line 129) but may not exist. Must verify. |
311: | Write/Edit on L3 reference skill | 🟡 LOW | Contradicts REFERENCE standard pattern. Contracts should be maintained by hf-meta-builder, not updated by reference skills. |
312: | Integration contracts reference non-existent `hm-planning-persistence` | 🟡 LOW | Skill-to-agent table (lines 237-238): `hm-l2-planning-persistence` appears in "Planning Skills" section. This skill was created but what about `scripts/validate-contracts.sh`? |
313: | RICH-8 self-scoring is L5 claim | 🟡 MEDIUM | Scorecard is a self-assessment. Does not validate contracts against current disk state. The score may be stale. |
314: 
315: ---
316: 
317: ## Skill 5: hm-l3-tool-capability-matrix — Complete Tool Catalog
318: 
319: ### Current State
320: 
321: | Field | Value |
322: |-------|-------|
323: | **Lines** | 577 |
324: | **Layer** | L3 REFERENCE |
325: | **Role** | reference |
326: | **Pattern** | P2 |
327: | **context-bomb** | false |
328: | **allowed-tools** | Read, Grep, Glob |
329: | **References** | `references/` directory ✅ **exists but EMPTY (0 content files)** |
330: | **Cross-references** | hm-l3-opencode-platform-reference, hm-l3-subagent-delegation-patterns, hf-l2-naming-syndicate, hf-l2-delegation-gates, opencode-config-workflow |
331: 
332: ### Issues
333: 
334: | # | Issue | Lines | Severity |
335: |---|-------|-------|----------|
336: | 1 | **IRON CLAW boilerplate** | Lines 34-99 | 🟡 MEDIUM — 66 lines identical to other REFERENCE skills |
337: | 2 | **Hivemind custom tools list may be stale** | Lines 154-165 | 🟡 MEDIUM — lists 10 tools. SYSTEM-AUDIT confirms 23 tools registered. Missing: session-tracker, session-hierarchy, session-context, hivemind-session-view, hivemind-command-engine, hivemind-sdk-supervisor, hivemind-doc, hivemind-trajectory (PARTIAL), hivemind-pressure (PARTIAL), hivemind-agent-work (PARTIAL), bootstrap-init, bootstrap-recover. Table may need expansion. |
338: | 3 | **56-agent analysis may be stale** | Lines 451-463 | 🟡 MEDIUM — "Based on actual agent definitions in .opencode/agents/ (April 2026)". Agent definitions may have changed. Must reverify. |
339: | 4 | **Per-depth permissions may not match current agent frontmatter** | Lines 200-290 | 🟡 MEDIUM — Derived from "56 agent definitions" but agents may have been updated. Must spot-check L0/L1/L2 permissions against current frontmatter. |
340: | 5 | **References directory EMPTY** | — | 🟡 LOW — `references/` exists but contains only `.gitkeep`. Skill has no external reference files. This is fine if all content is inline. |
341: | 6 | **`run-background-command` listed as stable Hivemind tool** | Line 157 | 🟡 MEDIUM — Listed without PARTIAL caveat. SYSTEM-AUDIT classifies it as 🟡 PARTIAL. Must add caveat. |
342: | 7 | **Hivemind Session-View missing from Hivemind tools table** | — | 🟡 MEDIUM — `hivemind-session-view` is operational (P16 ✅) but not listed in the Hivemind custom tools section. |
343: | 8 | **Hivemind Command Engine missing from Hivemind tools table** | — | 🟡 MEDIUM — `hivemind-command-engine` is operational (CP-CMD-01 ✅) but not listed. |
344: | 9 | **Bootstrap tools missing from Hivemind tools table** | — | 🟡 MEDIUM — `bootstrap-init` and `bootstrap-recover` are operational (BOOT ✅) but not listed. |
345: | 10 | **Session-tracker/hierarchy/context missing** | — | 🟡 MEDIUM — these 3 tools are operational (CP-ST-01 ✅) but the Hivemind tools table only lists 10 tools, missing these foundational session tools. |
346: 
347: ### Target Scope (Reduce)
348: 
349: | Dimension | Current | Target |
350: |-----------|---------|--------|
351: | Lines | 577 | <480 |
352: | IRON CLAW | 66 lines | ~20 lines |
353: | Hivemind tools listed | 10 | 18 (add missing operational tools) |
354: | Agent count | 56 (claimed) | Verified actual count |
355: | PARTIAL tool flags | 0 | 4 (mark all PARTIAL tools with 🟡 caveat) |
356: 
357: ### Edits Required
358: 
359: 1. **Compress IRON CLAW** (lines 34-99) — keep 5 steps, remove consumption/enforcement tables
360: 2. **Expand Hivemind custom tools table** (lines 154-165) — add missing operational tools:
361:    - `session-tracker`, `session-hierarchy`, `session-context`, `hivemind-session-view`
362:    - `hivemind-command-engine`, `hivemind-sdk-supervisor`, `hivemind-doc`
363:    - `bootstrap-init`, `bootstrap-recover`
364: 3. **Add 🟡 PARTIAL flags** to: `run-background-command`, `hivemind-trajectory`, `hivemind-pressure`, `hivemind-agent-work-create/export`
365: 4. **Update 56-agent analysis** (lines 451-463) — reverify agent count from `.opencode/agents/`
366: 5. **Verify per-depth permissions** (lines 200-290) — spot-check 3-4 agent frontmatter files for permission drift
367: 6. **Update "April 2026" date claim** (line 452) — to current verification date
368: 7. **Add PARTIAL tool section** — new section after the stable tool catalog documenting all 4 PARTIAL tools with their caveats and target phases
369: 8. **Update per-lineage rules** (lines 311-391) — verify hm STRICT rules against current agent frontmatter (particularly `configure-primitive` always ask on hm — confirm this is still the policy)
370: 
371: ### Gaps & Debts
372: 
373: | Gap | Severity | Description |
374: |-----|----------|-------------|
375: | 56-agent count likely stale | 🟡 MEDIUM | Last verified April 2026. Agent definitions may have been added in Phase 21 (execute-slash-command agents), Phase 22 (error/status agents), or other phases. Must recount. |
376: | 10/18 operational Hivemind tools documented | 🟡 HIGH | Table lists 10 tools but SYSTEM-AUDIT confirms 18 operational + 4 PARTIAL. Missing operational tools include core session tools (session-tracker, session-hierarchy, session-context) and bootstrap tools. |
377: | `hivemind-session-view` not documented despite being in hivemind-power-on | 🟡 MEDIUM | P16 session-view tool is operational but absent from the Hivemind tool catalog in this skill. |
378: | Per-depth L2 tool denials (lines 279-292) need verification | 🟡 LOW | Claims L2 agents "explicitly ask" harness tools. This is a generalization — must verify against current agent frontmatter. |
379: | References directory empty with `On Load` instructions | 🟡 LOW | Skill's "On Load" says to scan references — but refs dir is empty. Either remove On Load instruction or add actual reference files. |
380: 
381: ---
382: 
383: ## Cross-Skill Findings
384: 
385: ### Redundancies
386: 
387: | Pattern | Appears In | Recommendation |
388: |---------|-----------|---------------|
389: | **IRON CLAW 5-step validation block** (67 lines) | engine-contracts (lines 24-90), state-reference (lines 24-90), integration-contracts (lines 46-111), tool-capability-matrix (lines 34-99) — **4/5 skills** | Extract to shared reference file (e.g., `references/IRON-CLAW-STANDARD.md`) that all REFERENCE skills cross-reference. Saves ~200 lines total. Each skill carries: `## IRON CLAW — see [references/IRON-CLAW-STANDARD.md]` (3 lines). |
390: | **Anti-Patterns table** | engine-contracts (lines 398-407), state-reference (lines 369-376), tool-capability-matrix (lines 467-476) — **3/5 skills** | Consistent pattern. Keep as-is. |
391: | **Self-Correction 4-mode pattern** | hivemind-power-on, engine-contracts, state-reference, integration-contracts, tool-capability-matrix — **5/5 skills** | Consistent pattern. Keep as-is. |
392: | **Cross-References table** | engine-contracts, state-reference, integration-contracts, tool-capability-matrix — **4/5 skills** | Consistent pattern. Keep as-is. |
393: | **PARTIAL tools referenced without caveats** | engine-contracts (trajectory, pressure — lines 176, 178), tool-capability-matrix (run-background-command — line 157) | Both reference PARTIAL tools as if stable. Must add 🟡 caveats. |
394: 
395: ### Staleness Issues
396: 
397: | Claim | Skills | Verification Needed |
398: |-------|--------|-------------------|
399: | "Verified against source 2026-04-30" | engine-contracts (line 20) | 23 days stale. Plugin load order, tool count, budget defaults may have changed. |
400: | "From 56 agent definitions (April 2026)" | tool-capability-matrix (line 452) | Agent count may have changed. Phase 21/P22 may have added agents. |
401: | "97 agents mapped" | integration-contracts (line 413) | Claim may be stale. Must glob and recount. |
402: | `.hivemind/` directory structure | state-reference (lines 93-115) | Structure may have changed with Phase 22 notification TTL, Phase 21 delegation refactoring. |
403: | "All contracts verified" claim | engine-contracts (line 451) | Must reverify plugin load order, tool registration, hook composition against current `src/plugin.ts`. |
404: 
405: ### Missing Tools in Skill Catalogs
406: 
407: | Missing Tool | Operational? | Appears In | Missing From |
408: |-------------|-------------|------------|-------------|
409: | `session-tracker` | ✅ OPERATIONAL | hivemind-power-on | tool-capability-matrix, engine-contracts |
410: | `session-hierarchy` | ✅ OPERATIONAL | hivemind-power-on | tool-capability-matrix, engine-contracts |
411: | `session-context` | ✅ OPERATIONAL | hivemind-power-on | tool-capability-matrix, engine-contracts |
412: | `hivemind-session-view` | ✅ OPERATIONAL | hivemind-power-on | tool-capability-matrix, engine-contracts |
413: | `hivemind-command-engine` | ✅ OPERATIONAL | hivemind-power-on | tool-capability-matrix, engine-contracts |
414: | `hivemind-sdk-supervisor` | ✅ OPERATIONAL | engine-contracts | tool-capability-matrix |
415: | `hivemind-doc` | ✅ OPERATIONAL | engine-contracts | tool-capability-matrix |
416: | `bootstrap-init` | ✅ OPERATIONAL | hivemind-power-on | tool-capability-matrix, engine-contracts |
417: | `bootstrap-recover` | ✅ OPERATIONAL | hivemind-power-on | tool-capability-matrix, engine-contracts |
418: 
419: ### PARTIAL Tools — Reference Audit (Wave 3 Scope Enforcement)
420: 
421: | Tool | Appears In Skill | Current Treatment | Required Action |
422: |------|-----------------|------------------|-----------------|
423: | `run-background-command` | tool-capability-matrix (line 157) | Listed without caveat | Add 🟡 PARTIAL caveat + "CP-PTY-01 pending" |
424: | `hivemind-trajectory` | hivemind-power-on (line 30, 175) | In allowed-tools + tool catalog | **REMOVE from allowed-tools** + flag as PARTIAL in tool catalog |
425: | `hivemind-trajectory` | engine-contracts (line 176) | Cross-referenced as stable tool | Flag with 🟡 PARTIAL caveat or remove |
426: | `hivemind-pressure` | hivemind-power-on (line 34, 178) | In allowed-tools + tool catalog | **REMOVE from allowed-tools** + flag as PARTIAL in tool catalog |
427: | `hivemind-pressure` | engine-contracts (line 178) | Cross-referenced as stable tool | Flag with 🟡 PARTIAL caveat or remove |
428: | `hivemind-agent-work` | hivemind-power-on (lines 183-184) | In tool catalog | Remove from tool catalog during trim |
429: | `hivemind-agent-work` | engine-contracts (cross-ref) | Not directly listed but related | No action needed if not explicitly referenced |
430: 
431: ### Dependency Issues
432: 
433: | Issue | Impact | Resolution |
434: |-------|--------|------------|
435: | No skill has `delegate-task` in allowed-tools | 🟡 MEDIUM — hivemind-power-on references it in catalog but cannot call it | Add to hivemind-power-on allowed-tools |
436: | 4/5 skills have near-identical IRON CLAW blocks | 🟡 MEDIUM — 268 lines of duplicate content | Create shared IRON CLAW reference file |
437: | 2 skills missing references/ directory (engine-contracts, state-reference) | 🟡 LOW — all content is inline, no external refs needed | No action if content is complete without refs |
438: | tool-capability-matrix references empty dir | 🟡 LOW — On Load section says "Scan references" but none exist | Either add reference files or remove On Load instruction |
439: | PARTIAL tools inconsistently flagged | 🟡 HIGH — some skills flag them, others don't, some list in allowed-tools | Create consistent PARTIAL tool flagging protocol across all skills |
440: | Source staleness across all REFERENCE skills | 🟡 HIGH — each has "verified at date" claims that are 23+ days old | All need reverification against current codebase |
441: 
442: ---
443: 
444: ## Skill Edit Priority Order
445: 
446: | Priority | Skill | Effort | Risk | Reason |
447: |----------|-------|--------|------|--------|
448: | 1 | **hm-l3-tool-capability-matrix** | HIGH | HIGH | Most lines (577), missing 8+ operational tools, needs 4 PARTIAL caveats. Foundation for all other skills' tool references. Must be updated FIRST so other skills can cross-reference it. |
449: | 2 | **hivemind-power-on** | MEDIUM | HIGH | Critical allowed-tools fixes (remove 2 PARTIAL tools from allowed-tools). Tool catalog trim. Bootstrap/init tools may need addition. Used by all L0/L1 agents. |
450: | 3 | **hm-l3-hivemind-engine-contracts** | HIGH | HIGH | 23-day stale source verification. Tool registration table needs update (8 → 18+ tools). `src/lib/` → restructured paths. Staleness could produce incorrect guidance. |
451: | 4 | **hm-l3-integration-contracts** | MEDIUM | MEDIUM | 97-agent count unverified. RICH-8 scorecard may be stale. allowed-tools has Write/Edit for L3 ref skill. `configure-primitive` missing. |
452: | 5 | **hm-l3-hivemind-state-reference** | LOW | MEDIUM | `.hivemind/` structure verification needed. `event-tracker/` dead weight. IRON CLAW compression. Least critical of the set. |
453: 
454: ### Edit Dependency Chain
455: 
456: ```
457: tool-capability-matrix (fix tool catalog FIRST)
458:     ↓
459: hivemind-power-on (trim catalog → cross-ref tool-capability-matrix)
460:     ↓
461: engine-contracts (update tool registration → cross-ref tool-capability-matrix)
462:     ↓
463: integration-contracts (verify bindings, verify agent count)
464:     ↓
465: state-reference (verify .hivemind/ structure)
466: ```
467: 
468: ---
469: 
470: ## Total Edit Summary
471: 
472: | Metric | Value |
473: |--------|-------|
474: | Skills to edit | 5 |
475: | Total current lines | 2,125 |
476: | Total target lines (post-edit) | <1,700 (~20% reduction) |
477: | IRON CLAW blocks to compress | 4 skills (saves ~180 lines) |
478: | Allowed-tools additions | +3 across all skills (delegate-task, configure-primitive) |
479: | Allowed-tools removals | 4 total: +2 from power-on (trajectory, pressure) + 2 from integration-contracts (Write, Edit) |
480: | PARTIAL tool caveats to add | 7 mentions across 3 skills |
481: | Missing operational tools to add to catalog | 9 tools in tool-capability-matrix |
482: | Stale date/claim to reverify | 4 claims across 3 skills |
483: | Cross-references to verify | ~25 across all skills |
484: | `.hivemind/` structure to verify | 1 skill (state-reference) |
485: | Agent counts to reverify | 2 skills (integration-contracts: 97, tool-capability-matrix: 56) |
486: | Jump-link runtime tests required | 3 skills (D4 compliance: power-on, integration-contracts, tool-capability-matrix — skills with reference files) |
487: 
488: ---
489: 
490: ## Verification Checklist (post-edit)
491: 
492: - [ ] hivemind-power-on: `hivemind-trajectory` and `hivemind-pressure` removed from allowed-tools
493: - [ ] hivemind-power-on: tool catalog compressed (22 lines → ~6 lines, cross-ref to tool-capability-matrix)
494: - [ ] hivemind-power-on: 4 PARTIAL tools removed from catalog
495: - [ ] engine-contracts: tool registration table updated (9 → 18+ operational tools)
496: - [ ] engine-contracts: stale "2026-04-30" verification date reverified and updated
497: - [ ] engine-contracts: `src/lib/` path references updated to restructured paths
498: - [ ] engine-contracts: PARTIAL tools flagged with 🟡 caveat
499: - [ ] state-reference: `.hivemind/` directory structure verified against disk
500: - [ ] state-reference: `event-tracker/` section compressed
501: - [ ] integration-contracts: Write/Edit removed from allowed-tools
502: - [ ] integration-contracts: agent count reverified
503: - [ ] integration-contracts: `configure-primitive` added to allowed-tools
504: - [ ] integration-contracts: `scripts/validate-contracts.sh` existence verified
505: - [ ] tool-capability-matrix: 9 missing operational tools added to Hivemind custom tools table
506: - [ ] tool-capability-matrix: 4 PARTIAL tools flagged with 🟡 caveat
507: - [ ] tool-capability-matrix: agent count reverified (current vs. "56" claim)
508: - [ ] ALL skills: IRON CLAW blocks compressed (~67 → ~20 lines each, or shared cross-ref)
509: - [ ] ALL skills: D4 constraint — jump link rendering verified at runtime
510: - [ ] ALL skills: PARTIAL tool reference protocol consistent (always flag with 🟡 + phase caveat)

(End of file - total 510 lines)
</content>
```

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/phases/23-notification-fix-and-tool-surface-docs/23-DEBTS-REGISTER-2026-05-23.md"
}
```

**Output:**
```
<path>/Users/apple/hivemind-plugin-private/.planning/phases/23-notification-fix-and-tool-surface-docs/23-DEBTS-REGISTER-2026-05-23.md</path>
<type>file</type>
<content>
1: # Debts & Gaps Register
2: 
3: **Maintained by:** Orchestrator agent (front-facing)
4: **Updated:** 2026-05-23
5: **Next review:** At Phase 24 entry gate
6: 
7: This file tracks **gaps, debts, conflicts, and hallucinations** found across hm-*/hf-* agents, commands, skills, and workflows during Phase 23. 
8: 
9: **Phase 23 does NOT fix these debts.** This is a **reference document only** — each debt is deferred to its appropriate later phase. When a delegated task or phase handler touches any of the affected files, consult this register first.
10: 
11: **Deferral policy:** Each entry has a `Defers to` field pointing to the phase that owns the fix. Phase 23 only documents, classifies, and routes — never remediates.
12: 
13: ---
14: 
15: ## CRITICAL
16: 
17: ### C-1: `delegate-task` vs `task` Proxy War
18: 
19: **Severity:** CRITICAL | **Type:** CONFLICT | **Defers to:** Phase 24 (Coordination Dispatch + Delegate-Task Fix)
20: - `file:///Users/apple/hivemind-plugin-private/.opencode/agents/hm-l0-orchestrator.md:598` — says "Never use `delegate-task` (custom tool, not production-ready)"
21: - `file:///Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-conductor.md:121` — says "NEVER use the built-in `task` tool for delegation. Use `delegate-task` every time."
22: - `file:///Users/apple/hivemind-plugin-private/.opencode/commands/start-work.md:14` — routes to conductor → follows conductor protocol
23: - `file:///Users/apple/hivemind-plugin-private/.opencode/agents/hm-l1-coordinator.md:21-23` — has `delegate-task: allow`
24: 
25: **Impact:** L0 says "deprecated", Conductor says "NEVER use task". Incompatible directives. Agent dispatched L0→L1→L2 gets contradictions. `start-work.md` → conductor → `delegate-task` which L0 says is broken.
26: 
27: **Fix:** Standardize on `task` tool as PREFERRED. Fix L0 to say "task preferred, delegate-task async only". Fix Conductor to match. Fix start-work.md to use task tool.
28: 
29: ---
30: 
31: ### C-2: Broken Agent Name Cross-References in hf-l1-coordinator
32: 
33: **Severity:** CRITICAL | **Type:** GAP | **Defers to:** Phase 32 (Shipped Primitives + Governance Wire)
34: - `file:///Users/apple/hivemind-plugin-private/.opencode/agents/hf-l1-coordinator.md:99-103` — references `hf-agent-builder` (should be `hf-l2-agent-builder`)
35: - `file:///Users/apple/hivemind-plugin-private/.opencode/agents/hf-l1-coordinator.md:102` — references `hf-skill-author` (should be `hf-l2-skill-builder`)
36: - `file:///Users/apple/hivemind-plugin-private/.opencode/agents/hf-l1-coordinator.md:276-279` — references `hf-agent-builder`, `hf-skill-author`, `hf-command-builder`, `hf-tool-builder` (should be `hf-l2-*`)
37: - `file:///Users/apple/hivemind-plugin-private/.opencode/agents/hf-l1-coordinator.md:233` — references `hm-research-detective` (doesn't exist)
38: 
39: **Impact:** Agent dispatch will fail silently (agent not found) when hf-coordinator tries to delegate to non-existent agents.
40: 
41: **Fix:** Replace all bare names with correct `hf-l2-*` names.
42: 
43: ---
44: 
45: ### C-3: Hallucinated `websearch` Tool in Permissions
46: 
47: **Severity:** CRITICAL | **Type:** HALLUCINATION | **Defers to:** Phase 32 (Shipped Primitives + Governance Wire)
48: - `file:///Users/apple/hivemind-plugin-private/.opencode/agents/hm-l0-orchestrator.md:39` — `websearch: allow`
49: - `file:///Users/apple/hivemind-plugin-private/.opencode/agents/hf-l0-orchestrator.md:44` — `websearch: allow`
50: - `file:///Users/apple/hivemind-plugin-private/.opencode/agents/hm-l1-coordinator.md:31` — `websearch: allow`
51: 
52: **Impact:** `websearch` is not an OpenCode tool. Will cause permission resolution errors at runtime. Should be `webfetch` if web access is needed.
53: 
54: **Fix:** Remove `websearch: allow` from all agents. Replace with `webfetch: allow` if needed.
55: 
56: ---
57: 
58: ### C-4: Q6 State Path Violation — Skills Write to `.opencode/state/`
59: 
60: **Severity:** CRITICAL | **Type:** DEBT | **Defers to:** Phase 35 (Module Splits + Legacy Inventory)
61: - `file:///Users/apple/hivemind-plugin-private/.opencode/skills/hm-l2-phase-execution/SKILL.md:50-53` — writes to `.opencode/state/opencode-harness/phase-execution/`
62: - `file:///Users/apple/hivemind-plugin-private/.opencode/skills/hm-l2-phase-loop/SKILL.md:65` — references `.opencode/state/` and `.planning/phases/.../STATE.md`
63: - `file:///Users/apple/hivemind-plugin-private/.opencode/skills/hm-l2-user-intent-interactive-loop/SKILL.md:140-145` — writes to `.opencode/state/intent.json` and `.opencode/state/question-count.json`
64: - `file:///Users/apple/hivemind-plugin-private/.opencode/skills/hm-l3-subagent-delegation-patterns/SKILL.md:235-238` — references `.planning/` for state
65: 
66: **Impact:** Q6 (locked 2026-04-25) mandates `.hivemind/` as canonical state root. `.opencode/state/` is legacy. State written to `.opencode/` violates Soft Meta-Concepts sector boundaries. These paths may not persist across plugin updates.
67: 
68: **Fix:** Migrate all state writes to `.hivemind/state/`. Update skill references.
69: 
70: ---
71: 
72: ### C-5: Document/Artifact Naming & Pathing Governance Collapse
73: 
74: **Severity:** CRITICAL | **Type:** SYSTEMIC DEBT
75: **Defers to:** Phase 31 (Config Plane Redesign + Artifact Governance)
76: **Files:** Toàn bộ `.planning/phases/`, `.hivemind/research/`, `.hivemind/tracking/`, `.hivemind/planning/`
77: 
78: **Vấn đề:** Hivemind không có hệ thống naming convention, pathing, format, gatekeeping, và dependency validation cho documents và artifacts. Hậu quả:
79: - Documents tạo ra vô tội vại, không phân loại theo mục/sub
80: - Không có gatekeeping loops kiểm tra chất lượng document
81: - Không có integration/dependencies validation giữa các documents
82: - Regressions xảy ra vì không ai kiểm soát cross-session
83: - Multiple sessions tạo documents overlapping/conflicting
84: - Không có standardized artifact structure cho phases
85: - Ảnh hưởng tới: commands (reference sai path), workflows (đọc sai artifact), references (dead links), agent routing (load nhầm skill), skills (content overlap)
86: 
87: **Biểu hiện cụ thể:**
88: - `.hivemind/research/` có documents từ nhiều sessions khác nhau, không có phase mapping
89: - Phase artifacts format không đồng nhất: có chỗ dùng `23-SPEC.md`, có chỗ dùng `23-01-PLAN.md` với số thứ tự
90: - Naming convention không được enforce: lowercase vs uppercase lẫn lộn
91: - Gatekeeping: không có workflow nào verify rằng documents được tạo đúng format, đúng location, đúng naming
92: - Cross-session: Session A tạo research → Session B tạo research khác → không ai kiểm tra overlap/dependency
93: - debt tracking file mới tạo — chưa có process nào đảm bảo nó được update
94: 
95: **Fix:** 
96: 1. Standardize naming convention: `{PHASE}-{TYPE}[-{SUBTYPE}][-{DATE}].md` với TYPE = uppercase
97: 2. Standardize artifact structure per phase: SPEC.md, RESEARCH.md, PLAN.md, SUMMARY.md, VERIFICATION.md, SYNTHESIS.md
98: 3. Phân loại documents theo mục: research/, specs/, plans/, syntheses/, audits/
99: 4. Thêm gatekeeping: mỗi khi create document → validate naming, location, format
100: 5. Thêm cross-session validation: trước khi tạo document mới → check existing documents cùng loại
101: 6. Đưa `debt-register` vào workflow command mặc định
102: 
103: **Affects:**
104: - `file:///Users/apple/hivemind-plugin-private/.opencode/commands/` — commands reference sai paths
105: - `file:///Users/apple/hivemind-plugin-private/.opencode/agents/` — agents load sai skills do path errors
106: - `file:///Users/apple/hivemind-plugin-private/.opencode/skills/` — skills overlap do không có boundary validation
107: - `.planning/phases/*/` — artifact formats không đồng nhất
108: - `.hivemind/research/` — documents không có phase mapping
109: - `.hivemind/tracking/` — tracking file mới, chưa có enforcement
110: 
111: ### H-1: Bash Permission Trailing Space in L0 Orchestrators
112: 
113: **Severity:** HIGH | **Type:** GAP
114: **Defers to:** IMMEDIATE (trivial fix)
115: **Files:**
116: - `file:///Users/apple/hivemind-plugin-private/.opencode/agents/hm-l0-orchestrator.md:16` — `"node * ": allow` (trailing space)
117: - `file:///Users/apple/hivemind-plugin-private/.opencode/agents/hf-l0-orchestrator.md:19` — same trailing space
118: 
119: **Impact:** Bash commands like `node index.js` won't match `"node * "` due to trailing space. Will deny legitimate Node.js execution.
120: 
121: **Fix:** Remove trailing space: `"node *": allow`
122: 
123: ---
124: 
125: ### H-2: hm-l2-build Severely Underspecified
126: 
127: **Severity:** HIGH | **Type:** GAP
128: **Defers to:** Phase 30 (Schema Kernel Cleanup)
129: **File:** `file:///Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-build.md`
130: 
131: **Impact:** Only 86 lines. Default primary agent with "all tools enabled" but no execution flow, behavioral contract, anti-patterns, or verification guidance. Will produce unpredictable results.
132: 
133: **Fix:** Add task description, scope, context, behavioral contract, anti-patterns, verification protocol. Target ~300+ lines.
134: 
135: ---
136: 
137: ### H-3: hm-l2-phase-guardian Temperature Too High
138: 
139: **Severity:** HIGH | **Type:** DEBT
140: **Defers to:** Phase 30 (Schema Kernel Cleanup)
141: **File:** `file:///Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-phase-guardian.md:5` — `temperature: 0.25`
142: 
143: **Impact:** Guardrail enforcement and phase exit decisions should be deterministic (≤0.15). 0.25 allows too much creativity for a gatekeeping role.
144: 
145: **Fix:** Lower to 0.1.
146: 
147: ---
148: 
149: ### H-4: hf-create Command Broken Path Reference
150: 
151: **Severity:** HIGH | **Type:** GAP
152: **Defers to:** Phase 32 (Shipped Primitives + Governance Wire)
153: **File:** `file:///Users/apple/hivemind-plugin-private/.opencode/commands/hf-create.md:14`
154: 
155: **Impact:** References `@.hivefiver-hm-meta-builder/workflows-lab/active/refactoring/create.md` but actual directory is `.hivefiver-meta-builder` (no `-hm-` infix). Path will fail.
156: 
157: **Fix:** Correct path to `.hivefiver-meta-builder/workflows-lab/active/refactoring/create.md`
158: 
159: ---
160: 
161: ### H-5: Skills Reference External Scripts — Not Verified
162: 
163: **Severity:** HIGH | **Type:** DEBT
164: **Defers to:** Phase 29 (Auto-Looping + PTY Revamp)
165: **Files:**
166: - `file:///Users/apple/hivemind-plugin-private/.opencode/skills/hm-l2-coordinating-loop/SKILL.md` — references `scripts/register-skill.sh`, `scripts/check-gate.sh`, `scripts/validate-envelope.sh`, `scripts/run-ralph-loop.sh`, `scripts/coordination-check.sh`, `scripts/init-session.sh`
167: - `file:///Users/apple/hivemind-plugin-private/.opencode/skills/hm-l2-user-intent-interactive-loop/SKILL.md` — references `scripts/intent-verify.sh`, `scripts/verify-hierarchy.sh`, `scripts/register-skill.sh`
168: 
169: **Impact:** ~10 script references across 2 skills. These scripts must exist at `scripts/` or within skill directories. Not verified. If missing, gate enforcement fails silently.
170: 
171: **Fix:** Verify all scripts exist, or remove references. Use inline logic instead of script calls.
172: 
173: ---
174: 
175: ## MEDIUM
176: 
177: ### M-1: hm-l0-orchestrator Exceeds Max Skills
178: 
179: **Severity:** MEDIUM | **Type:** CONFLICT
180: **Defers to:** Phase 24 (Coordination Dispatch + Delegate-Task Fix)
181: **File:** `file:///Users/apple/hivemind-plugin-private/.opencode/agents/hm-l0-orchestrator.md:108-117` vs `:684`
182: 
183: **Impact:** YAML declares 8 skills. Iron Law #10 says max 3. Internal contradiction.
184: 
185: **Fix:** Either reduce declared skills to 3, or remove "max 3" constraint.
186: 
187: ---
188: 
189: ### M-2: hf-l0-orchestrator Lists Default hm-* Skills
190: 
191: **Severity:** MEDIUM | **Type:** DEBT
192: **Defers to:** Phase 32 (Shipped Primitives + Governance Wire)
193: **File:** `file:///Users/apple/hivemind-plugin-private/.opencode/agents/hf-l0-orchestrator.md:123-130`
194: 
195: **Impact:** Loads hm-* skills as default (not on-demand). Blurs lineage boundaries. Requires "justified" cross-lineage access per architecture.
196: 
197: **Fix:** Load hm-* skills on demand only, not as defaults.
198: 
199: ---
200: 
201: ### M-3: hm-l2-conductor Domain Mismatch
202: 
203: **Severity:** MEDIUM | **Type:** DEBT
204: **Defers to:** Phase 27 (Routing + Intent Loop Foundation)
205: **File:** `file:///Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-conductor.md:48` — `domain: Phase Lifecycle`
206: 
207: **Impact:** Domain "Phase Lifecycle" doesn't match role "Delegation routing specialist".
208: 
209: **Fix:** Change to `domain: Routing` or `domain: Coordination`.
210: 
211: ---
212: 
213: ### M-4: hm-l2-conductor References Legacy `.harness/` Path
214: 
215: **Severity:** MEDIUM | **Type:** DEBT
216: **Defers to:** Phase 25 (Trajectory + Agent-Work-Contract Redesign)
217: **File:** `file:///Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-conductor.md:99-105` — references `.harness/wisdom/`
218: 
219: **Impact:** Dead path. Wisdom system won't work as described. Legacy from old architecture.
220: 
221: **Fix:** Remove or replace with `.hivemind/` equivalent.
222: 
223: ---
224: 
225: ### M-5: hm-l2-build GSD Agent List Not Validated
226: 
227: **Severity:** MEDIUM | **Type:** DEBT
228: **Defers to:** Phase 36 (Integration Verification)
229: **File:** `file:///Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-build.md:39-75`
230: 
231: **Impact:** Lists 33 GSD agents from `.hivefiver-meta-builder/agents-lab/active/refactoring/`. Depends on meta-builder directory existing. References may be dead.
232: 
233: **Fix:** Verify directory exists. Validate file names match.
234: 
235: ---
236: 
237: ### M-6: `.coordination/` Unregistered State Directory
238: 
239: **Severity:** MEDIUM | **Type:** DEBT
240: **Defers to:** Phase 35 (Module Splits + Legacy Inventory)
241: **File:** `file:///Users/apple/hivemind-plugin-private/.opencode/skills/hm-l2-coordinating-loop/SKILL.md:21,52,55`
242: 
243: **Impact:** References `.coordination/` directory — not defined in `.hivemind/` state structure. New untracked persistence location.
244: 
245: **Fix:** Register under `.hivemind/` or remove. Must comply with Q6.
246: 
247: ---
248: 
249: ### M-7: hm-l2-context-mapper Underspecified
250: 
251: **Severity:** MEDIUM | **Type:** GAP
252: **Defers to:** Phase 27 (Routing + Intent Loop Foundation)
253: **File:** `file:///Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-context-mapper.md`
254: 
255: **Impact:** ~112 lines. Purpose stated but no execution flow or protocol.
256: 
257: **Fix:** Add execution flow, input/output contract, anti-patterns.
258: 
259: ---
260: 
261: ### M-8: start-work Routes to Conductor Despite L0 Contradiction
262: 
263: **Severity:** MEDIUM | **Type:** CONFLICT
264: **Defers to:** Phase 24 (Coordination Dispatch + Delegate-Task Fix)
265: **File:** `file:///Users/apple/hivemind-plugin-private/.opencode/commands/start-work.md:2-4`
266: 
267: **Impact:** Routes to conductor. Conductor says use delegate-task. L0 says delegate-task deprecated. Inconsistent behavior.
268: 
269: **Fix:** Align with resolution of C-1.
270: 
271: ---
272: 
273: ### M-9: harness-audit Cross-Lineage Routing
274: 
275: **Severity:** MEDIUM | **Type:** GAP
276: **Defers to:** Phase 32 (Shipped Primitives + Governance Wire)
277: **File:** `file:///Users/apple/hivemind-plugin-private/.opencode/commands/harness-audit.md:3` — `agent: hf-l0-orchestrator`
278: 
279: **Impact:** Harness audit is product-dev task, not meta-concept. Should go to hm-l0-orchestrator. hf will just forward back.
280: 
281: **Fix:** Change to `agent: hm-l0-orchestrator`.
282: 
283: ---
284: 
285: ### M-10: hf- Commands Have Dead References
286: 
287: **Severity:** MEDIUM | **Type:** GAP
288: **Defers to:** Phase 32 (Shipped Primitives + Governance Wire)
289: **Files:**
290: - `file:///Users/apple/hivemind-plugin-private/.opencode/commands/hf-create.md:14` — wrong path infix
291: - `file:///Users/apple/hivemind-plugin-private/.opencode/commands/harness-audit.md:40` — `hm-opencode-project-audit` should be `hm-l3-opencode-project-audit`
292: 
293: **Impact:** Dead references cause silent failures.
294: 
295: **Fix:** Correct all broken references.
296: 
297: ---
298: 
299: ### M-11: user-intent Skill Heavy Gate Dependencies
300: 
301: **Severity:** MEDIUM | **Type:** DEBT
302: **Defers to:** Phase 29 (Auto-Looping + PTY Revamp)
303: **File:** `file:///Users/apple/hivemind-plugin-private/.opencode/skills/hm-l2-user-intent-interactive-loop/SKILL.md:27-96`
304: 
305: **Impact:** Defines 5 HARD GATES depending on external scripts + platform skills. In minimal OpenCode install, gates unenforceable.
306: 
307: **Fix:** Provide fallback mechanisms or reduce external dependencies.
308: 
309: ---
310: 
311: ### M-12: Skill Cross-References Missing Depth Suffix
312: 
313: **Severity:** MEDIUM | **Type:** DEBT
314: **Defers to:** Phase 32 (Shipped Primitives + Governance Wire)
315: **File:** `file:///Users/apple/hivemind-plugin-private/.opencode/skills/hm-l2-coordinating-loop/SKILL.md:35`
316: 
317: **Impact:** References `hm-coordinating-loop` (missing `-l2-`). May cause broken links.
318: 
319: **Fix:** Use full prefix: `hm-l2-coordinating-loop`.
320: 
321: ---
322: 
323: ## LOW
324: 
325: ### L-1: hm-l2-guardian / hm-l2-phase-guardian Possible Overlap
326: 
327: **Severity:** LOW | **Type:** DEBT
328: **Defers to:** Phase 35 (Module Splits + Legacy Inventory)
329: **Files:** `file:///Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-guardian.md`, `hm-l2-phase-guardian.md`
330: 
331: **Impact:** Both describe "phase loop" and "guardrail" responsibilities. Possible duplication.
332: 
333: **Fix:** Confirm scope boundary. Merge or differentiate.
334: 
335: ---
336: 
337: ### L-2: L2 Agents Exceed Temperature Range
338: 
339: **Severity:** LOW | **Type:** DEBT
340: **Defers to:** Phase 30 (Schema Kernel Cleanup)
341: **Files:**
342: - `hm-l2-general.md` — 0.2 (should be ≤0.15)
343: - `hm-l2-conductor.md` — 0.3 (should be ≤0.15)
344: - `hm-l2-phase-guardian.md` — 0.25 (should be ≤0.15)
345: 
346: **Impact:** Architecture mandates L2 temperature 0.0–0.15. These exceed spec.
347: 
348: **Fix:** Lower temps to ≤0.15.
349: 
350: ---
351: 
352: ### L-3: Agent Files Exceed 500-Line Limit
353: 
354: **Severity:** LOW | **Type:** DEBT
355: **Defers to:** Phase 38 (Package primitives for distribution)
356: **Files:**
357: - `hm-l0-orchestrator.md` — 806 lines
358: - `hf-l0-orchestrator.md` — 659 lines
359: - `hm-l2-planner.md` — 526 lines
360: 
361: **Impact:** Max module size convention is 500 LOC. L0 orchestrators are inherently large.
362: 
363: **Fix:** Accept or refactor into multiple files.
364: 
365: ---
366: 
367: ## Tracking Update Protocol
368: 
369: When a delegated task touches any of the above files or areas:
370: 
371: 1. Read this file first to understand existing debts
372: 2. If new violations found: add new entries with jump links
373: 3. If existing debts are fixed: mark as `FIXED` with commit hash
374: 4. If debts were partially addressed: add note with `(PARTIAL)` tag
375: 
376: **Format for new entries:**
377: 
378: ```
379: ### ID: [Severity] Short Name
380: 
381: | Field | Value |
382: |-------|-------|
383: | Severity | CRITICAL/HIGH/MEDIUM/LOW |
384: | Type | CONFLICT/GAP/DEBT/HALLUCINATION/TBD |
385: | File | `file:///...` |
386: | Line | 123 |
387: 
388: **Description:** ...
389: 
390: **Fix:** ...
391: ```

(End of file - total 391 lines)
</content>
```

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/phases/23-notification-fix-and-tool-surface-docs/23-GSD-REFERENCE-2026-05-23.md"
}
```

**Output:**
```
<path>/Users/apple/hivemind-plugin-private/.planning/phases/23-notification-fix-and-tool-surface-docs/23-GSD-REFERENCE-2026-05-23.md</path>
<type>file</type>
<content>
1: # GSD Framework Reference — Academic Research Synthesis
2: 
3: **Date:** 2026-05-23
4: **Source:** github.com/gsd-build/get-shit-done (docs/)
5: **Scope:** 113 docs files, 425K tokens
6: **Method:** Multi-dimension deep research via `hm-l2-researcher`
7: **Purpose:** Learn from GSD to upgrade Hivemind while preserving its unique automation, delegation logics, and tools
8: 
9: ---
10: 
11: ## 1. GSD Architecture Overview
12: 
13: GSD (Get Shit Done) is an OpenCode-native productivity framework built entirely from **soft meta-concepts**: agents, commands, skills, workflows. No custom tools, no plugin — everything runs through OpenCode's native Task/SubAgent dispatch and file-based state in `.planning/`.
14: 
15: ### Core Principles
16: | Principle | Description |
17: |-----------|-------------|
18: | **File-based state** | All state in `.planning/` — human-readable Markdown + JSON. No database, no server |
19: | **Two-stage routing** | 6 namespace meta-skills sit above 67 concrete commands. Eager listing sees 6 entries (~120 tokens) instead of 67 (~2,150 tokens) |
20: | **Wave execution** | Plans grouped by dependency → parallel within waves → sequential across waves |
21: | **Adaptive context** | Subagent prompt richness dynamically adjusts to available context window (200K vs 500K+) |
22: | **Golden test parity** | SDK + CLI run identical tests to verify behavior match |
23: 
24: ### Agent Hierarchy (Flat)
25: 33 shipped agents, **flat categorization** (no L0/L1/L2):
26: - Researchers (4), Analyzers (2), Synthesizers (1), Planners (2)
27: - Executors (1), Checkers (3), Verifiers (1), Auditors (3)
28: - Mappers (1), Debuggers (1), Doc Writers (2), Profilers (1)
29: 
30: ### Command Structure
31: 67 commands, 88 workflow files. Commands are `.md` files with YAML frontmatter + prompt body. Two-stage hierarchy: namespace router (6) → concrete command (67).
32: 
33: ### State Management
34: STATE.md with YAML frontmatter:
35: ```
36: gsd_state_version, milestone, milestone_name, status,
37: active_phase, next_action, next_phases,
38: progress: {total_phases, completed_phases, percent}
39: ```
40: 
41: ---
42: 
43: ## 2. GSD vs Hivemind Comparison
44: 
45: ### 2.1 Command System
46: 
47: | Aspect | GSD | Hivemind |
48: |--------|-----|----------|
49: | **Count** | 67 shipped commands | 19 commands |
50: | **Structure** | Flat `.md` files | `.opencode/commands/` with YAML frontmatter |
51: | **Routing** | Two-stage: namespace router → concrete | Single-stage flat listing |
52: | **Workflow files** | 88 thin orchestrator files | None — logic in commands |
53: | **Platform adapters** | Claude Code, Gemini, Codex (3 variants) | OpenCode only |
54: 
55: **Learn:** Two-stage namespace routing reduces listing cost. 6 routers × 120 tokens vs 67 flat commands × 2,150 tokens.
56: 
57: **Preserve:** `execute-slash-command` with `subtask:true/false` + `agent` override is more flexible. `hivemind-command-engine` with `discover`/`analyze_contract` is richer read-side.
58: 
59: ### 2.2 Agent Architecture
60: 
61: | Aspect | GSD | Hivemind |
62: |--------|-----|----------|
63: | **Count** | 33 agents | 89 agents (33 gsd + 45 hm-* + 11 hf-*) |
64: | **Hierarchy** | Flat | L0 → L1 → L2 → L3 |
65: | **Dispatch** | Synchronous Task() calls | WaiterModel: task + delegate-task |
66: | **Model resolution** | Runtime (`resolve-model <agent>`) | Baked in frontmatter |
67: | **Context enrichment** | Adaptive (200K vs 500K+) | Static per agent |
68: 
69: **Learn:** Runtime model resolution from a catalog. Adaptive context enrichment based on available window.
70: 
71: **Preserve:** L0-L2 hierarchy is strictly superior. WaiterModel with dual-signal. Evidence contracts (L1-L5 evidence hierarchy). Session stacking via `parentSessionId`.
72: 
73: ### 2.3 Skill System
74: 
75: | Aspect | GSD | Hivemind |
76: |--------|-----|----------|
77: | **Count** | 86 skills | 59 skills |
78: | **Discovery** | Formal `discovery-contract.md` | Informal — skill tool listing |
79: | **Taxonomy** | 10-cluster | Prefix-based (hm-*/hf-*/gate-*/stack-*) |
80: | **Surface control** | Profile-based staging (minimal/standard/full) | Binary installed/not installed |
81: | **Install** | Workspace symlinks | `.opencode/skills/` symlinks |
82: 
83: **Learn:** Formal skill discovery contract. Cluster taxonomy for grouping. Profile-based surface budgeting.
84: 
85: **Preserve:** IRON CLAW consumption governance (5-step validation). `hm-l3-tech-stack-ingest` with version-matched caching.
86: 
87: ### 2.4 Workflow Pipeline
88: 
89: | Aspect | GSD | Hivemind |
90: |--------|-----|----------|
91: | **Pipeline** | discuss → plan → execute → verify → ship | Ad-hoc |
92: | **Discuss** | Two modes (interview + assumptions) | hm-l2-brainstorm, hm-l2-user-intent-interactive-loop |
93: | **Research gate** | Blocks planning on unresolved questions | Missing |
94: | **Plan-check** | 8 verification dimensions, max 3 iterations | hm-l2-phase-execution |
95: | **Execute** | Wave-based parallel, fresh context per agent | hm-l2-phase-execution (wave-based) |
96: | **Verify** | Conversational UAT + auto-diagnosis | hm-l2-gate-orchestrator (triad) |
97: 
98: **Learn:** Research gate (block on unresolved questions). Package Legitimacy Gate (supply-chain security). Post-execute codebase drift gate.
99: 
100: **Preserve:** completion-looping with re-looping. L1-L5 evidence hierarchy. spec-driven + tdd-driven tight loop. Gate triad (lifecycle → spec → evidence).
101: 
102: ### 2.5 State Management
103: 
104: | Aspect | GSD | Hivemind |
105: |--------|-----|----------|
106: | **Storage** | STATE.md (file-based) | `.hivemind/state/` (JSON files) |
107: | **Phase tracking** | active_phase, next_action, next_phases | Session-tree with continuity |
108: | **Concurrent writes** | STATE.md.lock (O_EXCL) | Single-writer pattern |
109: | **Query** | `gsd-sdk query state.*` | session-tracker with 6 actions |
110: | **Lineage** | Reconstructed from artifacts | trajectory ledger |
111: 
112: **Learn:** Phase-lifecycle frontmatter fields. STATE.md.lock with O_EXCL + jitter. Progress dimensions (phase vs plan).
113: 
114: **Preserve:** session-tracker with rich queries (search, filter, export, hierarchy). hivemind-session-view with enriched nested tree. trajectory ledger.
115: 
116: ### 2.6 Delegation
117: 
118: | Aspect | GSD | Hivemind |
119: |--------|-----|----------|
120: | **Model** | Synchronous Task() | WaiterModel (async + dual-signal) |
121: | **Monitoring** | None — wait and collect | delegation-status with polling |
122: | **Journal** | None — reconstructed | delegations.json + trajectory |
123: | **Stacking** | Not supported | parentSessionId / task_id stacking |
124: | **Parallel** | Wave-based (planner decides) | Wave-based + checkpoint |
125: 
126: **Learn:** Wave-based parallelization algorithm. Adaptive context enrichment for subagents.
127: 
128: **Preserve:** WaiterModel with dual-signal. delegation journal + trajectory ledger. session-stacking. delegation-status polling.
129: 
130: ### 2.7 Quality Gates
131: 
132: | Aspect | GSD | Hivemind |
133: |--------|-----|----------|
134: | **Gate model** | 8-dim plan-check + verifier | Triad: lifecycle → spec → evidence |
135: | **Evidence** | Binary PASS/FAIL | L1-L5 hierarchy |
136: | **Test audit** | Disabled tests, circular patterns, assertion strength | Missing |
137: | **Supply chain** | Package Legitimacy Gate | Missing |
138: | **Drift detection** | Codebase structural drift gate | Missing |
139: 
140: **Learn:** Test quality audit (assertion strength, disabled tests, circular patterns). Package Legitimacy Gate (supply-chain security). Codebase drift gate (structural change detection).
141: 
142: **Preserve:** L1-L5 evidence hierarchy. Quality gate triad. 9-surface mutation authority. Mock-only detection.
143: 
144: ### 2.8 Phase Management
145: 
146: | Aspect | GSD | Hivemind |
147: |--------|-----|----------|
148: | **Numbering** | Decimal (e.g., 4.5) | Integer only |
149: | **Milestones** | `/gsd-new-milestone`, MILESTONES.md | None |
150: | **Artifacts** | Standardized: CONTEXT.md, RESEARCH.md, PLAN.md, etc. | Ad-hoc |
151: | **Granularity** | fine/standard/coarse | Hardcoded |
152: | **Autonomous** | `/gsd-autonomous` — per-phase loop | hm-l2-phase-loop |
153: 
154: **Learn:** Decimal phase insertion for urgent work. Milestone management with archive. Standardized phase artifact structure. Granularity setting.
155: 
156: **Preserve:** phase-loop with entry/exit gates + checkpoint gates. completion-looping against premature completion.
157: 
158: ### 2.9 SDK Integration
159: 
160: | Aspect | GSD | Hivemind |
161: |--------|-----|----------|
162: | **SDK** | `@gsd-build/sdk` — typed query registry | Plugin-based (`@opencode-ai/plugin`) |
163: | **CLI** | `gsd-sdk query` — structured JSON + error codes | `hivemind-sdk-supervisor` (health only) |
164: | **Tests** | Golden tests — same tests for CLI + SDK | None for SDK wrappers |
165: | **Observability** | `onDispatchEvent` per call | Basic diagnostics |
166: 
167: **Learn:** Query handler registry. Golden test parity (identical tests for old + new surfaces). Structured dispatch observability. Error classification (GSDError with ErrorClassification enum). Phased migration (CJS → SDK via Shared Module architecture).
168: 
169: **Preserve:** Plugin-based composition (tool + hook duality). SDK supervisor with health/heartbeat/diagnostics/readiness. Layered leaf architecture (shared/ types).
170: 
171: ---
172: 
173: ## 3. Actionable Recommendations for Hivemind
174: 
175: ### HIGH Impact
176: 1. **Two-stage namespace routing for commands** — Reduce eager listing cost. 6 namespace routers vs 19 flat commands
177: 2. **Research gate for phase planning** — Block planning if RESEARCH.md has unresolved questions. Adopt into phase-execution
178: 3. **Test quality audit** — Add assertion strength analysis, circular test detection, disabled-test audit to critic/evidence-truth
179: 4. **Package Legitimacy Gate** — Supply-chain security for hallucinated dependencies. Critical for code-gen agents
180: 
181: ### MEDIUM Impact
182: 5. **Phase-lifecycle state fields** — `active_phase`, `next_action`, `next_phases` in session state
183: 6. **Standardized phase artifact structure** — Formal file paths for all phase artifacts
184: 7. **Codebase drift detection** — Structural change detection vs last_mapped_commit
185: 8. **Decimal phase insertion** — Urgent mid-milestone work
186: 
187: ### LOW Impact
188: 9. **Milestone management with archive** — Commands + MILESTONES.md
189: 10. **Adaptive context enrichment** — Dynamic prompt richness per available window
190: 11. **Skill discovery contract** — Formalized in `.opencode/skills/DISCOVERY.md`
191: 12. **Golden test parity** — CLI + SDK tests
192: 
193: ---
194: 
195: ## 4. Things Hivemind Must NEVER Surrender
196: 
197: | Capability | Why Unique |
198: |------------|-----------|
199: | WaiterModel with dual-signal | Async dispatch + completion monitoring. GSD only has synchronous Task() |
200: | L1-L5 evidence hierarchy | Precision quality measurement. GSD only has binary PASS/FAIL |
201: | Quality gate triad | Layered validation. GSD has no equivalent structure |
202: | 9-surface mutation authority | Lifecycle integration model. GSD doesn't distinguish surfaces |
203: | session-stacking via parentSessionId | Attach new work to ANY session. GSD can't |
204: | trajectory ledger | Execution lineage. GSD reconstructs from artifacts |
205: | L0-L1-L2-L3 hierarchy | Structured delegation. GSD flat model can't scale to Hivemind complexity |
206: | IRON CLAW consumption governance | 5-step validation chain. GSD loads flat files |
207: | Plugin-based composition | tool + hook duality. GSD lives outside plugin system |
208: | execute-slash-command subtask/agent overrides | Flexible dispatch modes. GSD has flat Task() only |

(End of file - total 208 lines)
</content>
```

---

## Assistant (Build · MiMo-V2.5-Pro (Precision) · 8.2s)

_Thinking:_

Let me continue reading the remaining documents to get a full picture of the context before providing my analysis.

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/phases/23-notification-fix-and-tool-surface-docs/23-GSD-workflow-pipeline-2026-05-23.md"
}
```

**Output:**
```
<path>/Users/apple/hivemind-plugin-private/.planning/phases/23-notification-fix-and-tool-surface-docs/23-GSD-workflow-pipeline-2026-05-23.md</path>
<type>file</type>
<content>
1: # GSD Workflow Pipeline — Deep Analysis
2: 
3: > **Source:** GSD Repomix output `5875fd23ec62fc70` — docs/FEATURES.md, docs/ARCHITECTURE.md §Data Flow, docs/USER-GUIDE.md, docs/workflow-discuss-mode.md, docs/STATE-MD-LIFECYCLE.md
4: > **Date:** 2026-05-23
5: > **Evidence Level:** L3 (documented observation from GSD docs)
6: > **Audience:** Hivemind engineers building phase execution pipeline
7: 
8: ---
9: 
10: ## 1. THE COMPLETE PIPELINE
11: 
12: GSD's end-to-end pipeline:
13: 
14: ```
15: new-project → discuss-phase → [ui-phase] → plan-phase → execute-phase → verify-work → [ui-review] → ship
16: ```
17: 
18: [L22407-L22420]
19: 
20: Each stage produces artifacts consumed by the next:
21: 
22: ```
23: PROJECT.md ─────────────────────────────────────► All agents
24: REQUIREMENTS.md ────────────────────────────────► Planner, Verifier, Auditor
25: ROADMAP.md ─────────────────────────────────────► Orchestrators
26: STATE.md ───────────────────────────────────────► All agents (decisions, blockers)
27: CONTEXT.md (per phase) ─────────────────────────► Researcher, Planner, Executor
28: RESEARCH.md (per phase) ────────────────────────► Planner, Plan Checker
29: PLAN.md (per plan) ─────────────────────────────► Executor, Plan Checker
30: SUMMARY.md (per plan) ──────────────────────────► Verifier, State tracking
31: UI-SPEC.md (per phase) ─────────────────────────► Executor, UI Auditor
32: ```
33: 
34: [L22410-L22420]
35: 
36: ---
37: 
38: ## 2. STAGE 1: PROJECT INITIALIZATION (`/gsd-new-project`)
39: 
40: **Purpose:** Transform an idea into structured project with research, requirements, and roadmap.
41: 
42: **Process:**
43: 1. **Adaptive questioning** — Guided by "dream extraction" philosophy (not requirements gathering). Questions surface what the user wants to build, who the user is, tech preferences
44: 2. **4 parallel researcher agents** — Investigate stack, features, architecture, and pitfalls simultaneously
45: 3. **Research synthesis** — `gsd-research-synthesizer` combines into SUMMARY.md
46: 4. **Requirements extraction** — Categorized into v1 (must-have), v2 (future), out-of-scope
47: 5. **Roadmap generation** — Phase breakdown mapped to requirements with granularity control
48: 6. **User approval** — User must approve before any code is written
49: 
50: [L26337-L26550]
51: 
52: **Produced artifacts:**
53: | Artifact | Description |
54: |----------|-------------|
55: | PROJECT.md | Project vision, constraints, decisions, evolution rules |
56: | REQUIREMENTS.md | Scoped requirements with unique IDs (REQ-XX) |
57: | ROADMAP.md | Phase breakdown with status + requirement mapping |
58: | STATE.md | Initial state: position, decisions, metrics |
59: | config.json | Workflow configuration |
60: | research/SUMMARY.md | Synthesized domain research |
61: 
62: [L26520-L26530]
63: 
64: **Granularity** controls phase count:
65: - `coarse`: 3-5 phases
66: - `standard`: 5-8 phases  
67: - `fine`: 8-12 phases
68: 
69: [L25040-L25050]
70: 
71: ---
72: 
73: ## 3. STAGE 2: PHASE DISCUSSION (`/gsd-discuss-phase`)
74: 
75: GSD has TWO modes for gathering implementation context before planning:
76: 
77: ### 3.1 Mode 1: `discuss` (interview-style, default)
78: 
79: The original flow: Claude identifies gray areas in the phase, presents them for selection, then asks ~4 questions per area. Good for early phases, strong user opinions, conversational context gathering. [L34244-L34250]
80: 
81: ### 3.2 Mode 2: `assumptions` (codebase-first)
82: 
83: Claude deeply analyzes the codebase first (reading 5-15 files via subagent), forms assumptions with file:line evidence, and presents them for confirmation or correction. Good for established codebases, experienced users, faster context gathering (~2-4 interactions vs ~15-20). [L34252-L34260]
84: 
85: **How assumptions mode works:**
86: 1. **Init** — Load prior context, scout codebase, check todos
87: 2. **Deep analysis** — Subagent reads 5-15 codebase files related to the phase
88: 3. **Surface assumptions** — Each includes: what Claude would do + why (citing file paths), what goes wrong if incorrect, confidence level (Confident / Likely / Unclear)
89: 4. **Confirm or correct** — User reviews, selects items needing change
90: 5. **Write CONTEXT.md** — Identical output to interview mode
91: 
92: [L34274-L34284]
93: 
94: ### 3.3 Both modes produce identical CONTEXT.md format:
95: 
96: ```markdown
97: <domain> — Phase boundary
98: <decisions> — Locked implementation decisions  
99: <canonical_refs> — Specs/docs downstream agents must read
100: <code_context> — Reusable assets, patterns, integration points
101: <specifics> — User references and preferences
102: <deferred> — Ideas noted for future phases
103: ```
104: 
105: [L34288-L34297]
106: 
107: **Flag compatibility:**
108: 
109: | Flag | discuss mode | assumptions mode |
110: |------|-------------|-----------------|
111: | --all | Discuss all gray areas | N/A |
112: | --auto | Auto-select defaults | Skips confirm gate |
113: | --batch | Batch intake | N/A (already batched) |
114: | --power | File-based answers | N/A |
115: | --assumptions | N/A | Surface assumptions |
116: | --analyze | Trade-off tables | N/A (assumptions include evidence) |
117: 
118: ---
119: 
120: ## 4. STAGE 3: PHASE PLANNING (`/gsd-plan-phase`)
121: 
122: This is the most complex stage with multiple sub-steps and gates:
123: 
124: ```
125: plan-phase:
126:   1. Research gate: blocks if RESEARCH.md has unresolved questions
127:   2. Phase Researcher → RESEARCH.md
128:      └── Package Legitimacy Gate: slopcheck on every package
129:   3. Planner (with reachability check) → PLAN.md files
130:      └── checkpoint:human-verify for [ASSUMED]/[SUS] installs
131:   4. Plan Checker → Verify loop (max 3 iterations)
132:   5. Requirements coverage gate (REQ-IDs → plans)
133:   6. Decision coverage gate (CONTEXT.md decisions → plans, BLOCKING)
134:   └── → state planned-phase → STATE.md updated
135: ```
136: 
137: [L22407-L22420]
138: 
139: ### 4.1 Research Gate (v1.32)
140: 
141: Blocks planning if RESEARCH.md has unresolved open questions. Ensures the planner has enough information before creating plans. Without this gate, the planner would make assumptions based on incomplete research. [L26627-L26678]
142: 
143: ### 4.2 Package Legitimacy Gate (v1.42.1)
144: 
145: Three-layer supply-chain security gate:
146: 
147: | Layer | Component | Action |
148: |-------|-----------|--------|
149: | Research | gsd-phase-researcher | Runs `slopcheck install <pkgs> --json`; writes `## Package Legitimacy Audit` table to RESEARCH.md; strips `[SLOP]` packages entirely |
150: | Planning | gsd-planner | Reads Audit table; inserts `checkpoint:human-verify` before `[ASSUMED]`/`[SUS]` install tasks; adds `T-{phase}-SC` STRIDE supply-chain row |
151: | Execution | gsd-executor | RULE 3 excludes package installation from auto-fix scope; failed installs surface as checkpoints, never silent substitutions |
152: 
153: [L22680-L22720]
154: 
155: **Provenance system:** Package names sourced from WebSearch are tagged `[ASSUMED]` (not `[VERIFIED]`). `[ASSUMED]` always generates a checkpoint. Three verdicts:
156: - `[SLOP]` — removed from RESEARCH.md entirely, never reaches planner
157: - `[SUS]` — flagged; planner inserts `checkpoint:human-verify`
158: - `[OK]` — approved; no checkpoint
159: 
160: **Ecosystem coverage:** Uses registry-specific commands — `npm view` (Node), `pip index versions` (Python), `cargo search` (Rust). Graceful degradation: if `slopcheck` unavailable, every package tagged `[ASSUMED]`. [L22710-L22720]
161: 
162: ### 4.3 Planner Reachability Check (v1.32)
163: 
164: Validates that every plan step references accessible files and APIs. Checks that file paths exist, module names resolve, and no steps reference things that don't exist. This prevents "plan against nothing" bugs. [L21314-L21316]
165: 
166: ### 4.4 Plan Checker (8 Verification Dimensions)
167: 
168: Max 3 iterations. Checks each PLAN.md against:
169: 
170: | Dimension | Description |
171: |-----------|-------------|
172: | 1. Requirement coverage | Every REQ-ID maps to at least one plan |
173: | 2. Task atomicity | Each task is single-purpose, self-contained |
174: | 3. Dependency ordering | Plans respect declared dependency ordering |
175: | 4. File scope | Files to be modified are within declared scope |
176: | 5. Verification commands | Plans include how to verify completion |
177: | 6. Context fit | Plan fits in a single context window |
178: | 7. Gap detection | Detects gaps between requirements and tasks |
179: | 8. Nyquist compliance | When enabled, test coverage requirements are met |
180: 
181: [L21338-L21360]
182: 
183: ### 4.5 Requirements Coverage Gate
184: 
185: Verifies that every REQ-ID in REQUIREMENTS.md maps to at least one plan. If a requirement has no plan, the gate blocks. This is enforced at planning time, not after execution. [L22407-L22420]
186: 
187: ### 4.6 Decision Coverage Gate (v1.32, BLOCKING in plan-phase)
188: 
189: Verifies that every `<decision>` in CONTEXT.md is reflected in at least one plan. This prevents the scenario where a user-specified decision is silently dropped during planning. The same gate runs NON-BLOCKING in execute-phase (shipped artifacts should reflect decisions, but missing decisions are not a blocker). [L22410-L22415]
190: 
191: ---
192: 
193: ## 5. STAGE 4: PHASE EXECUTION (`/gsd-execute-phase`)
194: 
195: ```
196: execute-phase:
197:   1. Context reduction: truncated prompts, cache-friendly ordering
198:   2. Wave analysis: dependency grouping
199:   3. Executor per plan → code + atomic commits
200:   4. SUMMARY.md per plan
201:   5. Verifier → VERIFICATION.md
202:      └── Decision coverage gate (NON-BLOCKING)
203:   6. Codebase drift gate: compare last_mapped_commit..HEAD
204: ```
205: 
206: [L22407-L22420]
207: 
208: ### 5.1 Wave Analysis
209: 
210: Plans are grouped into dependency waves:
211: 
212: ```
213: Plan 01 (no deps): served in Wave 1
214: Plan 02 (no deps): served in Wave 1 (parallel with Plan 01)
215: Plan 03 (depends: 01): served in Wave 2 (waits for Wave 1)
216: Plan 04 (depends: 02): served in Wave 2 (parallel with Plan 03)
217: Plan 05 (depends: 03,04): served in Wave 3 (waits for Wave 2)
218: ```
219: 
220: [L22304-L22310]
221: 
222: ### 5.2 Post-Execute Codebase Drift Gate (v1.39, #2003)
223: 
224: After the last wave commits, GSD compares `last_mapped_commit..HEAD` against `.planning/codebase/STRUCTURE.md` and counts structural elements:
225: 
226: 1. New directories outside mapped paths
227: 2. New barrel exports at `(packages|apps)/<name>/src/index.*`
228: 3. New migration files
229: 4. New route modules under `routes/` or `api/`
230: 
231: If count ≥ `workflow.drift_threshold` (default 3):
232: - **warn** (default): prints suggested `/gsd-map-codebase --paths …` command
233: - **auto-remap**: spawns `gsd-codebase-mapper` scoped to affected paths
234: 
235: [L22538-L22548]
236: 
237: `last_mapped_commit` lives in YAML frontmatter at the top of each `.planning/codebase/*.md` file. `bin/lib/drift.cjs` provides `readMappedCommit` and `writeMappedCommit` round-trip helpers.
238: 
239: ### 5.3 Parallel Commit Safety
240: 
241: When multiple executors run:
242: 1. `--no-verify` commits (paralysis agents skip hooks to avoid build lock contention)
243: 2. `STATE.md.lock` (O_EXCL atomic creation, 10s timeout, spin-wait with jitter)
244: 3. Orchestrator runs `git hook run pre-commit` once after each wave
245: 
246: [L22352-L22356]
247: 
248: ---
249: 
250: ## 6. STAGE 5: WORK VERIFICATION (`/gsd-verify-work`)
251: 
252: **Purpose:** Validate built features through conversational UAT with auto-diagnosis.
253: 
254: **Process:**
255: 1. GSD loads the phase CONTEXT.md, PLAN.md, SUMMARY.md, VERIFICATION.md
256: 2. Presents the user with a summary of what was built
257: 3. User tests the feature, reports findings
258: 4. On failure, GSD spawns parallel debug agents for auto-diagnosis
259: 5. Produces UAT.md with pass/fail results and fix plans
260: 
261: **Auto-diagnosis:** `diagnose-issues.md` workflow orchestrates parallel debug agents to investigate UAT gaps and find root causes — without the user having to describe the problem in technical detail. [L28452-L28462]
262: 
263: ---
264: 
265: ## 7. STAGE 6: SHIP (`/gsd-ship`)
266: 
267: **Purpose:** Create PR, run review, and prepare for merge after verification passes.
268: 
269: The ship workflow:
270: 1. Creates a clean PR branch (filtering .planning/ commits via `/gsd-pr-branch`)
271: 2. Runs code review via `/gsd-code-review`  
272: 3. Auto-fixes issues via `/gsd-code-review --fix`
273: 4. Creates the PR with structured body sections
274: 5. Marks the phase complete in STATE.md + ROADMAP.md
275: 
276: [L30130-L30134]
277: 
278: ---
279: 
280: ## 8. CROSS-PHASE REGRESSION GATE
281: 
282: When a new phase is planned, GSD checks that the phase changes don't break prior phases. This is enforced by the integration-checker during milestone audits. [L26627-L26678]
283: 
284: ---
285: 
286: ## 9. STATE MD LIFECYCLE INTEGRATION
287: 
288: GSD's STATE.md has four lifecycle fields that the status-line reads on every render:
289: 
290: ```yaml
291: active_phase: "4.5"        # Set when orchestrator is in flight
292: next_action: "execute-phase" # Set when idle with a recommendation
293: next_phases: ["4.5"]        # Phases the recommendation applies to
294: progress:
295:   total_phases: 17
296:   completed_phases: 10
297:   percent: 59              # !!! Only percent triggers the progress bar
298: ```
299: 
300: [L32402-L32465]
301: 
302: **Status-line rendering scenes (4 scenes):**
303: 
304: | Scene | Trigger | Display |
305: |-------|---------|---------|
306: | 1. Phase active | `active_phase` populated | `v2.0 [██░░░] X% · Phase 4.5 executing` |
307: | 2. Idle, next recommended | `next_action` + `next_phases` | `v2.0 [██░░░] X% · next execute-phase 4.5` |
308: | 3. Milestone complete | `percent: 100` | `v2.0 [██████████] 100% · milestone complete` |
309: | 4. Default | None of above | `v1.9 Code Quality · executing · ph (1/5)` |
310: 
311: [L32450-L32465]
312: 
313: **Important:** `progress.percent` represents phase completion (`completed_phases / total_phases`), NOT plan completion. Plan-dimension (`completed_plans / total_plans`) trends optimistic because future phases haven't been planned yet — denominator is structurally smaller. [L32435-L32442]
314: 
315: **Stage labels** when Scene 1 is active:
316: 
317: | Command | `status` value |
318: |---------|---------------|
319: | /gsd-discuss-phase | `discussing` |
320: | /gsd-plan-phase | `planning` |
321: | /gsd-execute-phase | `executing` |
322: | /gsd-verify-work | `verifying` |
323: 
324: ---
325: 
326: ## 10. COMPARISON WITH HIVEMIND PHASE PIPELINE
327: 
328: | Stage | GSD | Hivemind | Advantage |
329: |-------|-----|----------|-----------|
330: | **Init** | /gsd-new-project with 4 parallel researchers + synthesis | hm-l2-brainstorm + hm-l2-product-validation | GSD (more structured, parallel research) |
331: | **Discuss** | 2 modes: interview + assumptions. Both produce same CONTEXT.md | hm-l2-user-intent-interactive-loop + hm-l2-requirements-analysis | GSD (assumptions mode is unique) |
332: | **Plan** | Research gate, Package Legitimacy Gate, Plan Checker (8 dims), 2 coverage gates | hm-l2-spec-driven-authoring + hm-l2-phase-execution | GSD (more gates) |
333: | **Execute** | Wave parallelization, STATE.md.lock, node repair | hm-l2-phase-execution wave model | Similar |
334: | **Verify** | Conversational UAT, auto-diagnosis, goal-backward analysis | hm-l2-completion-looping + hm-l2-test-driven-execution | Different approaches |
335: | **Quality** | Plan checker, verifier, Nyquist auditor, security auditor, codebase drift gate | Gate triad (lifecycle→spec→evidence) | Different (Hivemind is more rigorous on evidence) |
336: | **Ship** | /gsd-ship: PR + review + merge | Not formalized | GSD |
337: | **State tracking** | STATE.md with lifecycle fields, 4 scene rendering | session-tracker with rich queries | Hivemind (more powerful queries) |
338: | **Continuity** | /gsd-pause-work + /gsd-resume-work | Session journal + delegation persistence | Hivemind (more durable) |
339: 
340: ---
341: 
342: ## 11. ACTIONABLE RECOMMENDATIONS FOR HIVEMIND
343: 
344: ### RECOMMENDATION A: Research Gate (HIGH IMPACT)
345: 
346: **Problem:** Hivemind's phase planning has no formal gate that blocks on unresolved research questions.
347: 
348: **Solution:** Add a `researchGate` check to `hm-l2-phase-loop`:
349: 
350: ```markdown
351: ## Research Gate Check
352: 
353: Before entering planning:
354: 1. Read all RESEARCH.md files for phase
355: 2. Identify unresolved open questions (marked with `[UNRESOLVED]`)
356: 3. IF unresolved questions exist → BLOCK planning → return to research phase
357: 4. ELSE → proceed to planning
358: ```
359: 
360: ### RECOMMENDATION B: Package Legitimacy Gate (HIGH IMPACT)
361: 
362: **Problem:** Hivemind's agents can innocently recommend hallucinated packages (slopsquatting). The `hm-l3-deep-research` skill has no supply-chain gate.
363: 
364: **Solution:** Add a Package Legitimacy Gate to `hm-l3-deep-research`:
365: 
366: ```markdown
367: ## Package Legitimacy Gate (NEW)
368: 
369: When RESEARCH.md recommends external packages:
370: 1. For each package, run registry-specific verification:
371:    - npm: `npm view <pkg>` → check age, downloads, source repo
372:    - pip: `pip index versions <pkg>` → check PyPI metadata
373:    - cargo: `cargo search <pkg>` → check crates.io
374: 2. Tag each package: [VERIFIED] / [ASSUMED] / [SUS] / [SLOP]
375: 3. [SLOP] → remove from recommendations entirely  
376: 4. [ASSUMED]/[SUS] → add checkpoint:human-verify to plan
377: 5. [VERIFIED] → no checkpoint needed
378: ```
379: 
380: ### RECOMMENDATION C: Codebase Drift Gate (MEDIUM IMPACT)
381: 
382: **Problem:** After Hivemind's phase execution, there is no check that the codebase structure has drifted from expectations.
383: 
384: **Solution:** Implement a drift gate that compares `last_mapped_commit..HEAD`:
385: 
386: ```
387: After executor completes, before claiming phase done:
388: 1. Read last_mapped_commit from .planning/codebase/*.md frontmatter
389: 2. git diff --name-only last_mapped_commit..HEAD
390: 3. Check for: new directories, new barrel exports, new route modules
391: 4. If ≥ threshold (default 3): WARN with suggested remap command
392: ```
393: 
394: ### RECOMMENDATION D: Assumptions Mode for Discuss (MEDIUM IMPACT)
395: 
396: **Problem:** Hivemind's hm-l2-brainstorm is pure question-asking. There's no "codebase-first" mode.
397: 
398: **Solution:** Add an assumptions flag to hm-l2-user-intent-interactive-loop:
399: 
400: ```
401: --assumptions: Instead of asking questions, analyze the codebase first
402: 1. Read 5-15 files related to the task
403: 2. Form assumptions with file:line evidence
404: 3. Present for confirmation/correction
405: 4. Output: structured assumptions with confidence levels
406: ```
407: 
408: ### RECOMMENDATION E: Pipeline Standardization (HIGH IMPACT)
409: 
410: **Problem:** Hivemind has the component skills (brainstorm → spec → execute → loop) but no standardized pipeline that connects them.
411: 
412: **Solution:** Create a formal pipeline document that specifies:
413: 
414: ```
415: Phase N Pipeline:
416: 1. [hm-l2-brainstorm or hm-l2-user-intent-interactive-loop] → CONTEXT.md
417: 2. [Research Gate] → checks for unresolved questions
418: 3. [hm-l2-spec-driven-authoring] → SPEC.md with acceptance criteria
419: 4. [hm-l2-phase-execution] → code + tests
420: 5. [hm-l2-completion-looping or hm-l2-validator] → verification
421: 6. [Codebase Drift Gate] → structural change check
422: ```
423: 
424: ---
425: 
426: ## 12. KEY TAKEAWAYS
427: 
428: 1. **GSD's pipeline has 5+ formal gates** that Hivemind lacks entirely: research gate, package legitimacy gate, requirements coverage gate, decision coverage gate, codebase drift gate.
429: 2. **GSD's discuss-phase with assumptions mode** is a unique innovation — codebase-first context gathering. Hivemind should adopt this.
430: 3. **GSD's 3-layer Package Legitimacy Gate** is essential for any AI coding agent that recommends dependencies.
431: 4. **GSD's conversational UAT with auto-diagnosis** is more user-friendly than Hivemind's test-only verification.
432: 5. **Hivemind's evidence hierarchy + gate triad is more rigorous** than GSD's binary PASS/FAIL. Never regress on this.
433: 6. **GSD's STATE.md lifecycle fields** (active_phase, next_action, progress) provide a clear "what's next" signal that Hivemind's session-tracker lacks.

(End of file - total 433 lines)
</content>
```

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/phases/23-notification-fix-and-tool-surface-docs/23-GSD-sdk-surface-2026-05-23.md"
}
```

**Output:**
```
<path>/Users/apple/hivemind-plugin-private/.planning/phases/23-notification-fix-and-tool-surface-docs/23-GSD-sdk-surface-2026-05-23.md</path>
<type>file</type>
<content>
1: # GSD SDK & Integration — Deep Analysis
2: 
3: > **Source:** GSD Repomix output `5875fd23ec62fc70` — docs/ARCHITECTURE.md (SDK Runtime Bridge, CLI Tools), docs/CLI-TOOLS.md (SDK and programmatic access), docs/adr/0005-sdk-architecture-seam-map.md, docs/adr/3524-cjs-sdk-hard-seam.md
4: > **Date:** 2026-05-23
5: > **Evidence Level:** L3 (documented observation from GSD docs)
6: > **Audience:** Hivemind engineers building plugin/SDK architecture
7: 
8: ---
9: 
10: ## 1. OVERVIEW
11: 
12: GSD has TWO CLI tool layers that coexist:
13: 
14: ```
15: LEGACY:     node gsd-tools.cjs <command> [args]      (CJS, ~20 modules)
16: MODERN:     gsd-sdk query <command> [args]            (SDK, typed registry)
17: ```
18: 
19: [L22918-L22931]
20: 
21: The CJS tool (`gsd-tools.cjs`) is the original Node.js CLI with 20 domain modules. The SDK (`@gsd-build/sdk`) is a newer TypeScript library with a typed query registry. Both are maintained — the SDK is the preferred path for new orchestration, while CJS is kept for parity tests and CJS-only entrypoints.
22: 
23: This dual-layer architecture is directly analogous to Hivemind's architecture:
24: 
25: ```
26: GSD:          gsd-tools.cjs (legacy)  +  gsd-sdk query (typed registry)  +  @gsd-build/sdk (TS library)
27: Hivemind:     native tools (bash)     +  hivemind-* tools (custom)        +  @opencode-ai/plugin (SDK)
28: ```
29: 
30: ---
31: 
32: ## 2. SDK ARCHITECTURE
33: 
34: ### 2.1 Three Access Paths
35: 
36: 1. **CLI — `gsd-sdk query <argv…>`**
37:    - Resolves argv with longest-prefix rules from typed registry (`resolveQueryArgv` in `sdk/src/query/registry.ts`)
38:    - Unregistered commands FAIL FAST — use `gsd-tools.cjs` only for handlers not in registry
39: 
40: 2. **TypeScript — `@gsd-build/sdk` (`GSDTools`, `createRegistry`)**
41:    - Routes through SDK Runtime Bridge Module (`sdk/src/query-runtime-bridge.ts`)
42:    - Native registry dispatch is preferred
43:    - Subprocess fallback is explicit policy (`allowFallbackToSubprocess`)
44:    - Can be disabled for strict SDK-only execution (`strictSdk`)
45: 
46: 3. **Direct — `createRegistry()` from `sdk/src/query/index.ts`**
47:    - For direct typed dispatch without `GSDTools` wrapper
48:    - Used by workflows that need programmatic access without CLI overhead
49: 
50: [L22940-L22972]
51: 
52: ### 2.2 Query Registry
53: 
54: The query registry at `sdk/src/query/` is a typed handler registry. Each registered handler maps a command string to an implementation function:
55: 
56: ```
57: Registry entries:
58:   init.*         → Context loading per workflow type
59:   state.*        → STATE.md read/write/update
60:   roadmap.*      → ROADMAP.md parse/analyze
61:   phase.*        → Phase operations (next-decimal, plan-index, mvp-mode)
62:   config.*       → Config read/write/get/set
63:   commit         → Git commit for planning artifacts
64:   resolve-model  → Model resolution per agent
65:   agent-skills   → Load skill files per agent type
66:   validate.*     → Context validation, task classification
67:   template.fill  → Template rendering
68: ```
69: 
70: [L29182-L29192]
71: 
72: **Example registry queries:**
73: | Command | Purpose |
74: |---------|---------|
75: | `gsd-sdk query init.plan-phase 12` | Load context for plan-phase on phase 12 |
76: | `gsd-sdk query state json` | Output STATE.md frontmatter as JSON |
77: | `gsd-sdk query roadmap analyze` | Full roadmap parse with disk status |
78: | `gsd-sdk query config-set workflow.tdd_mode true` | Set config value |
79: | `gsd-sdk query resolve-model gsd-planner` | Get model for planner agent |
80: | `gsd-sdk query commit "docs: update state" --files .planning/STATE.md` | Git commit |
81: | `gsd-sdk query phase.next-decimal 6` | Next decimal phase number |
82: | `gsd-sdk query validate.context --tokens-used 150000 --context-window 200000` | Context usage validation |
83: 
84: [L29185-L29192]
85: 
86: ### 2.3 SDK Runtime Bridge (`sdk/src/query-runtime-bridge.ts`)
87: 
88: This is the central dispatch seam. Programmatic SDK callers (`GSDTools`) route through one seam that owns query dispatch policy:
89: 
90: ```
91: GSDTools.dispatch(command, args)
92:   → RuntimeBridge.execute(command, args)
93:     → if (native registry has handler): execute natively
94:     → else if (allowFallbackToSubprocess): spawn gsd-tools.cjs as subprocess
95:     → else (strictSdk): fail fast with error
96:     → emit onDispatchEvent({ mode, reason, duration, outcome })
97: ```
98: 
99: [L22265-L22275]
100: 
101: **Key properties:**
102: - **Mode selection:** `sdk` when `tryLoadSdk()` succeeds and no `GSD_WORKSTREAM` is active, `cjs` otherwise — set once at construction
103: - **No-throw contract:** `hub.dispatch()` catches all exceptions and returns `{ ok: false, errorKind, message, details }` instead of propagating
104: - **Six-value errorKind enum:** Exported as frozen `ERROR_KINDS` object — `SdkLoadFailed`, `SdkDispatchFailed`, `ValidationFailed`, `NotFound`, `PermissionDenied`, `InternalError`
105: 
106: [L22265-L22275]
107: 
108: ### 2.4 Structured Dispatch Observability
109: 
110: Every SDK dispatch call emits an `onDispatchEvent` with:
111: 
112: | Field | Description |
113: |-------|-------------|
114: | `mode` | sdk / cjs / subprocess |
115: | `reason` | Why this mode was chosen (native handler exists / SDK loaded / fallback policy) |
116: | `duration` | Execution time in ms |
117: | `outcome` | success / error / timeout |
118: | `errorKind` | From ERROR_KINDS enum (if error) |
119: 
120: This provides full observability into which execution path was taken for every command.
121: 
122: ---
123: 
124: ## 3. CJS → SDK MIGRATION: Shared Module Architecture
125: 
126: GSD is migrating from the monolithic CJS CLI to the typed SDK through a phased "Shared Module" architecture. Each module moves ONE piece of logic from CJS to SDK, with generated adapters for both surfaces. [L22600-L22650]
127: 
128: ### The 6-Phase Migration Plan
129: 
130: | Phase | Module | What it moves | CJS consumed by | SDK consumed by |
131: |-------|--------|--------------|----------------|----------------|
132: | 1 | STATE.md Document Module | State document parsing/generation | `bin/lib/state.cjs` | `sdk/src/query/state-document.generated.ts` |
133: | 2 | Configuration Module | Config load, legacy-key normalization, defaults merge, on-disk migration | `bin/lib/config.cjs`, `bin/lib/core.cjs:loadConfig` | `sdk/src/query/config-schema.generated.ts`, `configuration.generated.cjs` |
134: | 3 | Workstream Inventory Module | Pure projection from directory entries + STATE.md text + plan scan results → typed inventory | Per-side fs Readers | `sdk/src/query/workstream-inventory-builder.generated.ts` |
135: | 4 | Planning Path Projection Module | Planning directory path resolution | `bin/lib/planning-workspace.cjs` | `sdk/src/query/planning-path.generated.ts` |
136: | 5 | Query Runtime Bridge | CJS dispatch collapses onto SDK runtime bridge | CJS routers replaced by thin delegates over `QueryRuntimeBridge.execute()` | Native SDK dispatch |
137: | 6 | Dispatch Policy Module | Final routing seam consolidation | `CommandRoutingHub` | Full SDK-native dispatch |
138: 
139: [L1445-L1501]
140: 
141: **Why phased:** Each phase ships one Shared Module. The smallest (STATE.md Document Module) ships first because both files are already character-identical. Phase 2 closes the critical bug class (#3523). The seam becomes a real wall in Phase 5 when CJS routers stop holding parallel handler implementations. [L1500]
142: 
143: ---
144: 
145: ## 4. COMMAND ROUTING HUB (`CommandRoutingHub`)
146: 
147: The CJS side has its own dispatch hub at `get-shit-done/bin/lib/command-routing-hub.cjs`. This replaces duplicated routing logic in each command family router. [L22265-L22275]
148: 
149: **Three cross-cutting concerns consolidated:**
150: 1. **Mode selection:** `sdk` or `cjs` — set once at construction
151: 2. **No-throw contract:** Returns `{ ok: false, errorKind, message, details }` instead of propagating exceptions
152: 3. **Six-value errorKind enum:** `SdkLoadFailed`, `SdkDispatchFailed`, `ValidationFailed`, `NotFound`, `PermissionDenied`, `InternalError`
153: 
154: **Important design decision:** No transparent SDK→CJS fallback. An SDK-mode hub that encounters a load or dispatch failure returns `SdkLoadFailed` or `SdkDispatchFailed` WITHOUT retrying via CJS. This prevents silent fallback masking SDK bugs. [L22270-L22275]
155: 
156: ---
157: 
158: ## 5. GOLDEN TEST PARITY
159: 
160: GSD maintains a golden test suite at `sdk/src/golden/golden.integration.test.ts` that verifies identical exit code + stdout chunks + stderr lines between the CLI (`gsd-tools <family> <subcommand>`) and the SDK (`gsd-sdk query <canonical>`) for every canonical command in the manifest. [L15429-L15430]
161: 
162: This is the final quality gate before marking a command as fully migrated. If the SDK handler produces different output than the CJS version, the test fails and the migration is reverted.
163: 
164: ---
165: 
166: ## 6. MUTATION EVENTS (SDK)
167: 
168: The SDK has a concept of mutation events — commands that may emit structured events after a successful dispatch. `QUERY_MUTATION_COMMANDS` in `sdk/src/query/index.ts` lists which commands are mutation-bearing. [L22980-L22982]
169: 
170: Examples:
171: - `state validate` — read-only (no mutation)
172: - `skill-manifest` — writes only with `--write` flag
173: - `intel update` — stub (not yet implemented)
174: 
175: This distinction between read and mutation commands is critical for the SDK's CQRS compliance.
176: 
177: ---
178: 
179: ## 7. CLI TOOLS LAYER (CJS Legacy)
180: 
181: The legacy CLI at `get-shit-done/bin/gsd-tools.cjs` has 20 domain modules: [L22920-L23130]
182: 
183: | Module | Responsibility |
184: |--------|---------------|
185: | `core.cjs` | Error handling, output formatting, shared utilities |
186: | `planning-workspace.cjs` | Planning seam, workstream routing, .planning/.lock |
187: | `state.cjs` | STATE.md parsing, updating, progression, metrics |
188: | `phase.cjs` | Phase directory ops, decimal numbering, plan indexing |
189: | `roadmap.cjs` | ROADMAP.md parsing, phase extraction, plan progress |
190: | `config.cjs` | config.json read/write, section initialization |
191: | `verify.cjs` | Plan structure, phase completeness, reference, commit validation |
192: | `template.cjs` | Template selection and filling with variable substitution |
193: | `frontmatter.cjs` | YAML frontmatter CRUD operations |
194: | `init.cjs` | Compound context loading for each workflow type |
195: | `milestone.cjs` | Milestone archival, requirements marking |
196: | `commands.cjs` | Misc (slug, timestamp, todos, scaffolding, stats) |
197: | `model-profiles.cjs` | Model profile resolution table |
198: | `security.cjs` | Path traversal prevention, prompt injection detection |
199: | `uat.cjs` | UAT file parsing, verification debt tracking |
200: | `docs.cjs` | Docs-update workflow init, Markdown scanning |
201: | `workstream.cjs` | Workstream CRUD, migration, session-scoped active pointer |
202: | `schema-detect.cjs` | Schema-drift detection for ORM patterns |
203: | `profile-pipeline.cjs` | User behavioral profiling pipeline |
204: | `profile-output.cjs` | Profile rendering, USER-PROFILE.md generation |
205: 
206: [L22931-L22940]
207: 
208: Global flags:
209: - `--raw`: Machine-readable output (JSON or plain text)
210: - `--cwd <path>`: Override working directory (for sandboxed subagents)
211: - `--ws <name>`: Workstream context
212: 
213: ---
214: 
215: ## 8. HOOK SYSTEM
216: 
217: GSD's hook system is a set of Node.js scripts registered in the host runtime's `settings.json`. Hooks integrate with host events: [L22216-L22230]
218: 
219: | Hook | Event | Purpose |
220: |------|-------|---------|
221: | `gsd-statusline.js` | `statusLine` | Displays model, task, directory, context usage |
222: | `gsd-context-monitor.js` | `PostToolUse` / `AfterTool` | Injects agent-facing context warnings at 35%/25% |
223: | `gsd-check-update.js` | `SessionStart` | Background check for new GSD versions |
224: | `gsd-check-update-worker.js` | (worker) | Background worker helper |
225: | `gsd-update-banner.js` | `SessionStart` | Opt-in update availability banner |
226: | `gsd-prompt-guard.js` | `PreToolUse` | Scans .planning/ writes for prompt injection |
227: | `gsd-read-injection-scanner.js` | `PostToolUse` | Scans Read output for injected instructions |
228: | `gsd-workflow-guard.js` | `PreToolUse` | Detects edits outside GSD workflow context |
229: | `gsd-read-guard.js` | `PreToolUse` | Prevents Edit/Write on unread files |
230: | `gsd-session-state.sh` | `PostToolUse` | Session state tracking (shell runtimes) |
231: | `gsd-validate-commit.sh` | `PostToolUse` | Conventional commit enforcement |
232: | `gsd-phase-boundary.sh` | `PostToolUse` | Phase boundary detection |
233: | `gsd-graphify-update.sh` | `PostToolUse` | Auto-rebuild knowledge graph |
234: 
235: [L30386-L30450]
236: 
237: **Context Monitor — Agent-Facing Context Warnings:**
238: 
239: | Remaining | Level | Agent Behavior |
240: |-----------|-------|---------------|
241: | > 35% | Normal | No warning |
242: | ≤ 35% | WARNING | "Avoid starting new complex work" |
243: | ≤ 25% | CRITICAL | "Context nearly exhausted, inform user" |
244: 
245: Debounce: 5 tool uses between warnings. Severity escalation bypasses debounce.
246: 
247: **Architecture:**
248: ```
249: Statusline Hook → writes /tmp/claude-ctx-{session}.json
250: Context Monitor → reads bridge file → injects additionalContext warning
251: ```
252: 
253: [L22600-L22620]
254: 
255: ---
256: 
257: ## 9. PLATFORM ABSTRACTION
258: 
259: GSD supports 15+ AI coding runtimes through a unified install contract: [L22700-L22750]
260: 
261: **Abstraction points:**
262: 1. **Tool name mapping** — Claude's `Bash` → Copilot's `execute`
263: 2. **Hook event names** — Claude `PostToolUse` → Gemini `AfterTool`
264: 3. **Agent frontmatter** — Different format per runtime
265: 4. **Path conventions** — Different config directories per runtime
266: 5. **Model references** — `inherit` profile defers to runtime's model selection
267: 
268: The installer handles all translation at install time. Workflows and agents are written in Claude Code's native format and transformed during deployment.
269: 
270: **Runtime matrix (15 runtimes):**
271: 
272: | Runtime | Global root | Command form | Agent format | Hooks |
273: |---------|-------------|-------------|-------------|-------|
274: | Claude Code | ~/.claude | /gsd-command | agents/gsd-*.md | Full |
275: | OpenCode | ~/.config/opencode | /gsd-command | agents/gsd-*.md | No GSD hooks |
276: | Kilo | ~/.config/kilo | /gsd-command | agents/gsd-*.md | No GSD hooks |
277: | Gemini CLI | ~/.gemini | /gsd:command | agents/gsd-*.md | AfterTool |
278: | Codex | ~/.codex | $gsd-command | TOML config + skills | Hook tables |
279: | Copilot | ~/.copilot | /gsd-command | .agent.md files | No |
280: | Cursor | ~/.cursor | /gsd-command | skills + rules | No |
281: | Windsurf | ~/.codeium/windsurf | /gsd-command | skills + rules | No |
282: | Trae | ~/.trae | /gsd-command | skills + rules | No |
283: | Qwen Code | ~/.qwen | /gsd-command | skills + rules | Partial |
284: | Cline | ~/.cline | .clinerules | Rules only | No |
285: 
286: [L22700-L22750]
287: 
288: ---
289: 
290: ## 10. COMPARISON WITH HIVEMIND PLUGIN/SDK
291: 
292: | Dimension | GSD | Hivemind | Advantage |
293: |-----------|-----|----------|-----------|
294: | **SDK typed registry** | `createRegistry()` + `gsd-sdk query` | Individual tools via `@opencode-ai/plugin` | GSD (unified query surface) |
295: | **Legacy migration** | Phased Shared Module (CJS → SDK, 6 phases) | Plugin-based, single composition root | Different (GSD migrating from monolithic, Hivemind plugin-native) |
296: | **Dispatch observability** | `onDispatchEvent` with mode/reason/duration/outcome | `hivemind-sdk-supervisor` health/heartbeat | GSD (per-call granularity) |
297: | **Error classification** | `GSDError` + `ErrorClassification` + `ERROR_KINDS` enum | `[Harness]` prefix on thrown errors | GSD (structured errors) |
298: | **Golden test parity** | `golden.integration.test.ts` | None | GSD |
299: | **Query handlers** | 30+ registered query handlers | N/A (tools are entrypoints) | GSD (more structured) |
300: | **Mutation events** | `QUERY_MUTATION_COMMANDS` list | Not formalized | GSD |
301: | **CQRS separation** | Read (query) vs Write (mutation) | read-side: hivemind-command-engine, write-side: various | Similar (both have CQRS) |
302: | **Runtime abstraction** | Install-time per-runtime transformation | Plugin composition at load time | Different approaches |
303: | **Hook system** | 13 hooks across 4 event types | Plugin hooks via SDK (PreToolUse, PostToolUse, etc.) | Hivemind (has lifecycle events GSD doesn't) |
304: | **Plugin composition** | Monolithic installer | `src/plugin.ts` with tools + hooks + lifecycle | Hivemind (more composable) |
305: | **Session recovery** | `/gsd-pause-work` + STATE.md | `hivemind-trajectory` + delegation persistence | Hivemind (more durable) |
306: | **Workspace isolation** | `/gsd-workspace` with worktrees/clones | Per-project `.hivemind/` | Equal |
307: 
308: ---
309: 
310: ## 11. GSD'S UNIQUE SDK INNOVATIONS
311: 
312: ### 11.1 Golden Test Parity
313: 
314: GSD maintains identical test suites for both CJS and SDK surfaces. Every canonical command must produce identical exit code + stdout + stderr from both paths. This catches SDK drift before it reaches production. [L15429-L15430]
315: 
316: ### 11.2 Phased Migration Architecture
317: 
318: Instead of a big-bang rewrite from CJS to SDK, GSD moves ONE module at a time through a Shared Module architecture. Each module has:
319: - Source of truth: `sdk/src/<module>/index.ts`
320: - Generated SDK adapter: `sdk/src/query/<module>.generated.ts`
321: - Generated CJS adapter: `get-shit-done/bin/lib/<module>.generated.cjs`
322: - Legacy CJS side: gradually replaced by the generated adapter
323: 
324: This means at any point, both CJS and SDK surfaces are fully functional — just some modules are SDK-native and some are delegating to CJS. [L1445-L1501]
325: 
326: ### 11.3 Structured Dispatch Observability
327: 
328: Every SDK dispatch emits a structured event with mode, reason, duration, and outcome. This enables:
329: - Performance profiling (which dispatches are slow?)
330: - Debugging (which path was taken for a given command?)
331: - Monitoring (are fallbacks being triggered? how often?)
332: 
333: ### 11.4 Command Routing Hub
334: 
335: The CJS side's `CommandRoutingHub` consolidates three duplicated concerns:
336: - Mode selection (sdk vs cjs)
337: - No-throw contract
338: - Error classification
339: 
340: This pattern ensures consistency across all command families. [L22265-L22275]
341: 
342: ---
343: 
344: ## 12. HIVEMIND'S UNIQUE ADVANTAGES
345: 
346: ### 12.1 Plugin-Based Composition
347: 
348: Hivemind's `src/plugin.ts` is a true composition root:
349: ```typescript
350: const plugin = {
351:   name: 'hivemind',
352:   tools: [delegateTaskTool, delegationStatusTool, ...],
353:   hooks: { PreToolUse, PostToolUse, ... },
354:   // lifecycle events GSD doesn't have
355: };
356: ```
357: 
358: GSD's installer is a ~10,700-line `bin/install.js` that copies files from source to destination. Hivemind's plugin architecture is cleaner, more modular, and easier to extend.
359: 
360: ### 12.2 Dual-Layer State
361: 
362: Hivemind has:
363: - In-memory Maps (fast access, session-scoped)
364: - Durable JSON files (`.hivemind/state/`, survives restarts)
365: 
366: GSD uses only file-based STATE.md. Hivemind's dual-layer approach is faster for in-session queries while maintaining durability.
367: 
368: ### 12.3 Trajectory Ledger
369: 
370: `hivemind-trajectory` provides execution lineage — not just "state at a point in time" but "how did we get here?" GSD relies on git log for this, which is coarser-grained (commit-level vs call-level).
371: 
372: ### 12.4 Delegation Journal
373: 
374: GSD doesn't persist delegation records. Hivemind's `delegations.json` + `session-journal-export` provide an audit trail that GSD lacks entirely.
375: 
376: ---
377: 
378: ## 13. ACTIONABLE RECOMMENDATIONS FOR HIVEMIND
379: 
380: ### RECOMMENDATION A: Query Handler Registry (HIGH IMPACT)
381: 
382: **Problem:** Hivemind's tools are individual entrypoints. There's no unified query surface for programmatic access.
383: 
384: **Solution:** Create a `query` handler registry similar to GSD's:
385: 
386: ```typescript
387: // In src/shared/ or src/query/
388: const queryRegistry = {
389:   'session.*': { get: ..., list: ..., search: ..., export: ... },
390:   'delegation.*': { status: ..., list: ..., control: ... },
391:   'state.*': { load: ..., update: ..., patch: ... },
392:   'config.*': { get: ..., set: ..., list: ... },
393:   'trajectory.*': { inspect: ..., traverse: ..., close: ... },
394: };
395: ```
396: 
397: Each handler:
398: - Returns typed responses (not arbitrary strings)
399: - Classifies errors (not `[Harness]` prefix)
400: - Follows CQRS (read vs write separation)
401: 
402: ### RECOMMENDATION B: Golden Test Parity (MEDIUM IMPACT)
403: 
404: **Problem:** No test suite verifies that Hivemind's SDK wrappers produce identical behavior to direct tool calls.
405: 
406: **Solution:** Add a golden test suite:
407: 
408: ```typescript
409: // tests/sdk/session-view.golden.test.ts
410: describe('session-view golden', () => {
411:   it('hivemind-session-view should produce identical output to session-tracker', async () => {
412:     const direct = await sessionTracker({ action: 'list-sessions' });
413:     const viaSdk = await hivemindSessionView({ action: 'get', sessionId: '...' });
414:     expect(viaSdk).toEqual(direct); // identical structure
415:   });
416: });
417: ```
418: 
419: ### RECOMMENDATION C: Structured Dispatch Observability (MEDIUM IMPACT)
420: 
421: **Problem:** `hivemind-sdk-supervisor` has health/heartbeat but no per-call observability.
422: 
423: **Solution:** Add `onDispatch` event to Hivemind's SDK wrappers:
424: 
425: ```typescript
426: interface DispatchEvent {
427:   mode: 'native' | 'subprocess' | 'fallback';
428:   reason: string;
429:   duration: number;  // ms
430:   outcome: 'success' | 'error' | 'timeout';
431:   errorKind?: 'NotFound' | 'PermissionDenied' | 'InternalError' | ...;
432: }
433: ```
434: 
435: ### RECOMMENDATION D: Error Classification Enum (MEDIUM IMPACT)
436: 
437: **Problem:** Hivemind uses `[Harness]` prefix on thrown errors — no structured classification.
438: 
439: **Solution:** Define a frozen error kind enum:
440: 
441: ```typescript
442: export const ERROR_KINDS = Object.freeze({
443:   NotFound: 'NotFound',
444:   PermissionDenied: 'PermissionDenied',
445:   ValidationFailed: 'ValidationFailed', 
446:   SdkLoadFailed: 'SdkLoadFailed',
447:   SdkDispatchFailed: 'SdkDispatchFailed',
448:   InternalError: 'InternalError',
449: } as const);
450: 
451: // All SDK dispatch returns: { ok: boolean, errorKind?: string, message?: string, details?: any }
452: ```
453: 
454: ### RECOMMENDATION E: Phased Migration Architecture (LOW IMPACT)
455: 
456: **Problem:** When Hivemind needs to refactor its tool surface, there's no migration path.
457: 
458: **Solution:** Follow GSD's Shared Module pattern:
459: 1. Identify one module to migrate (e.g., session-view from CJS query to typed handler)
460: 2. Source of truth: `src/shared/session-view.ts`
461: 3. Generated SDK adapter: auto-generated from types
462: 4. Legacy path: kept for backward compatibility
463: 5. Golden test: both paths must produce identical results
464: 
465: ---
466: 
467: ## 14. KEY TAKEAWAYS
468: 
469: 1. **GSD's query registry (`gsd-sdk query`)** provides a unified programmatic surface that Hivemind lacks. Implementing a similar registry would unify Hivemind's tool surface.
470: 
471: 2. **GSD's golden test parity** ensures SDK changes don't break CLI behavior. Hivemind should adopt this for its SDK wrappers.
472: 
473: 3. **GSD's phased migration architecture** is a blueprint for any SDK evolution — move one module at a time, maintain both surfaces, verify with golden tests.
474: 
475: 4. **GSD's CQRS separation** (read = query vs write = mutation) is already present in Hivemind (`hivemind-command-engine` = read, tool calls = write) but not formalized.
476: 
477: 5. **GSD's structured error classification** is more useful than Hivemind's `[Harness]` prefix pattern. Adopt error kind enums.
478: 
479: 6. **GSD's runtime abstraction at install time** vs Hivemind's plugin composition at load time — both are valid but different approaches. Hivemind's is cleaner for a plugin ecosystem.
480: 
481: 7. **Hivemind's plugin composition + trajectory + delegation journal** are unique advantages. Never regress on these while adopting GSD's query registry pattern.

(End of file - total 481 lines)
</content>
```

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/phases/23-notification-fix-and-tool-surface-docs/23-GSD-quality-gates-2026-05-23.md"
}
```

**Output:**
```
<path>/Users/apple/hivemind-plugin-private/.planning/phases/23-notification-fix-and-tool-surface-docs/23-GSD-quality-gates-2026-05-23.md</path>
<type>file</type>
<content>
1: # GSD Quality System — Deep Analysis
2: 
3: > **Source:** GSD Repomix output `5875fd23ec62fc70` — docs/AGENTS.md (plan-checker, verifier, nyquist-auditor, security-auditor), docs/ARCHITECTURE.md (gates, drift gate), docs/FEATURES.md (quality features)
4: > **Date:** 2026-05-23
5: > **Evidence Level:** L3 (documented observation from GSD docs)
6: > **Audience:** Hivemind engineers building quality gate system
7: 
8: ---
9: 
10: ## 1. OVERVIEW
11: 
12: GSD has multiple quality layers throughout the pipeline. Unlike Hivemind's tripartite gate system (lifecycle → spec → evidence), GSD's quality system is distributed across dedicated checker/verifier/auditor agents and in-line gates at decision points. [L21336-L21444]
13: 
14: GSD's approach can be summarized as:
15: 
16: ```
17: Research Gate → Plan Checker (8 dims) → Requirements Coverage Gate → Decision Coverage Gate
18: → Execution → Verifier (goal-backward + test quality audit) → Nyquist Auditor → Security Auditor
19: → Integration Checker → Codebase Drift Gate → Conversation UAT
20: ```
21: 
22: Hivemind's approach:
23: 
24: ```
25: Lifecycle Gate → Spec Compliance Gate → Evidence Truth Gate
26: (3 gates, highly structured, evidence hierarchy)
27: ```
28: 
29: The key difference: GSD has MORE gates but each is SIMPLER (binary PASS/FAIL). Hivemind has FEWER gates but each is DEEPER (L1-L5 evidence hierarchy). [L21336-L21360]
30: 
31: ---
32: 
33: ## 2. PLAN CHECKER (8 Verification Dimensions)
34: 
35: **Agent:** `gsd-plan-checker` [L21336-L21360]
36: **Spawned by:** `/gsd-plan-phase`  
37: **Read-only:** Yes (no Write, no Edit)  
38: **Model:** Sonnet  
39: **Output:** PASS/FAIL verdict with specific feedback  
40: **Max iterations:** 3 (if FAIL, planner replans and checker re-checks)
41: 
42: **The 8 dimensions:**
43: 
44: ### Dimension 1: Requirement Coverage
45: Every REQ-ID from REQUIREMENTS.md must be traceable to at least one task in the plan. If a requirement has no matching task, the checker flags it as a gap. This prevents "forgetting" requirements during planning.
46: 
47: ### Dimension 2: Task Atomicity
48: Each task must be single-purpose and self-contained. A task that says "implement auth AND add logging AND write tests" fails atomicity — it should be split into three tasks. This ensures each task fits in a single context window.
49: 
50: ### Dimension 3: Dependency Ordering
51: Plans must respect declared dependency ordering. If Plan A depends on Plan B but is scheduled in the same wave, the checker flags the ordering violation. Plans within a wave must be truly independent (no shared mutable state, no sequential processing).
52: 
53: ### Dimension 4: File Scope
54: Files to be modified must be within the declared scope of the phase. A task that modifies `src/api/` when the phase scope is `src/components/` is flagged. This prevents scope creep during execution.
55: 
56: ### Dimension 5: Verification Commands
57: Every plan must include at least one verification command (how to verify the task is complete). A plan without verification is incomplete. Example: `npm test src/foo.test.ts` or `curl http://localhost:3000/api/health`.
58: 
59: ### Dimension 6: Context Fit
60: The plan must fit in a single context window (200K tokens). If the combined size of all plan files + context exceeds the window, the checker FAILS. This prevents "plans that overflow the executor's context" bugs.
61: 
62: ### Dimension 7: Gap Detection
63: Detects gaps between requirements and tasks. This is more nuanced than "coverage" — it checks for missing intermediate steps. Example: if a plan says "migrate database" but doesn't include "test migration rollback", the checker flags a gap.
64: 
65: ### Dimension 8: Nyquist Compliance (when enabled)
66: When Nyquist validation is enabled, checks that every requirement has a matching test. If a requirement is testable but has no test, the checker flags a gap. This is turned on/off via `workflow.nyquist_validation`.
67: 
68: [L21338-L21360]
69: 
70: ---
71: 
72: ## 3. VERIFIER (Goal-Backward Analysis)
73: 
74: **Agent:** `gsd-verifier` [L21360-L21380]
75: **Spawned by:** `/gsd-execute-phase` (after all executors complete)  
76: **Read:** Yes (Write for VERIFICATION.md output)  
77: **Model:** Sonnet  
78: **Output:** `{phase}-VERIFICATION.md`
79: 
80: ### Goal-Backward Analysis
81: 
82: The verifier does NOT check "were the tasks completed?" — it checks "does the codebase now achieve the phase goal?" This is a subtle but critical distinction.
83: 
84: Example: A phase goal is "Add rate limiting to API". The verifier checks:
85: - Is rate limiting actually enforced? (telemetry, curl test)
86: - Are limits configurable? (config file, env vars)
87: - Do exceeded limits return correct error codes? (test output)
88: - Are different limits applied per route? (per original REQUIREMENTS.md)
89: 
90: If all plans were executed but the goal is NOT achieved (e.g., rate limiting logic has a bug), the verifier FAILS.
91: 
92: ### Milestone Scope Filtering (v1.32)
93: 
94: When the verifier finds gaps that are addressed in later phases of the same milestone, it marks them as "deferred" instead of reporting failures. This prevents false negatives during milestone execution. [L21372-L21376]
95: 
96: ### Test Quality Audit (v1.32) — Unique Innovation
97: 
98: The verifier checks that tests actually PROVE what they claim. This goes beyond "do tests exist?" to "are the tests meaningful?":
99: 
100: | Check | What it catches | Severity |
101: |-------|----------------|----------|
102: | **Disabled/skipped tests** | Tests that exist but never run (`it.skip`, `test.skip`, `xdescribe`) | BLOCKING — test exists but proves nothing |
103: | **Circular test patterns** | System generating its own expected values (e.g., API response matched against itself) | BLOCKING — test can never fail |
104: | **Assertion strength** | Existence assertions (`expect(foo).toBeDefined()`) vs value assertions (`expect(foo).toBe(42)`) vs behavioral assertions (`expect(mock.call).toHaveBeenCalledWith(...)`) | LOWERING — weak assertions reduce evidence value |
105: | **Expected value provenance** | Where do the expected values come from? Hand-written? Auto-generated? From the implementation? If the implementation produces the expected value (circular), the test is meaningless | BLOCKING — test cannot detect regression |
106: 
107: [L21376-L21380]
108: 
109: ---
110: 
111: ## 4. NYQUIST AUDITOR (Test Gap Filling)
112: 
113: **Agent:** `gsd-nyquist-auditor` [L21382-L21394]
114: **Spawned by:** `/gsd-validate-phase`  
115: **Has Edit access:** Yes (but ONLY for test files)  
116: **Model:** Sonnet  
117: **Max attempts:** 3 per gap
118: 
119: **Contract constraints:**
120: - NEVER modifies implementation code — only test files
121: - Max 3 attempts per gap (if test still fails after 3 attempts, flags as escalation for user)
122: - Flags implementation bugs as escalations for user (not silent fix)
123: 
124: This is a critical boundary: the Nyquist auditor is allowed to WRITE tests but never to MODIFY implementation. If a test fails because the implementation is buggy, the auditor escalates to a human rather than silently "fixing" the implementation.
125: 
126: ---
127: 
128: ## 5. SECURITY AUDITOR
129: 
130: **Agent:** `gsd-security-auditor` [L21650-L21680]
131: **Spawned by:** `/gsd-secure-phase`  
132: **Has Edit access:** Yes (for SECURITY.md output)  
133: **Model:** Sonnet  
134: **Output:** `{phase}-SECURITY.md`
135: 
136: **Verification scope:**
137: - Verifies each threat by its DECLARED disposition (mitigate / accept / transfer)
138: - Does NOT scan blindly for new vulnerabilities — verifies declared mitigations only
139: - Implementation files are read-only — never patches implementation code
140: - Supports ASVS levels 1/2/3 for verification depth
141: 
142: **Security audit is NOT a vulnerability scan.** It's a compliance check against a pre-declared threat model (from PLAN.md). This is a deliberate design choice: unlimited vulnerability scanning would be too expensive and too noisy.
143: 
144: ---
145: 
146: ## 6. CODEBASE DRIFT GATE (Post-Execution)
147: 
148: **Not an agent — an inline gate in the workflow** [L22538-L22548]
149: 
150: After the last wave of `/gsd-execute-phase` commits, the workflow runs a non-blocking `codebase_drift_gate` step between `schema_drift_gate` and `verify_phase_goal`.
151: 
152: **How it works:**
153: 1. Reads `last_mapped_commit` from `.planning/codebase/STRUCTURE.md` frontmatter
154: 2. Runs `git diff --name-only last_mapped_commit..HEAD`
155: 3. Counts 4 kinds of structural elements:
156:    - New directories outside mapped paths
157:    - New barrel exports at `(packages|apps)/<name>/src/index.*`
158:    - New migration files
159:    - New route modules under `routes/` or `api/`
160: 4. If count ≥ `workflow.drift_threshold` (default 3):
161:    - `warn` (default): prints suggested `/gsd-map-codebase --paths …` command
162:    - `auto-remap`: spawns `gsd-codebase-mapper` scoped to affected paths
163: 
164: **Important characteristics:**
165: - Non-blocking: drift detection can never fail verification
166: - Any error in detection or remap is logged and phase continues
167: - `last_mapped_commit` is stored per-file in YAML frontmatter
168: 
169: ---
170: 
171: ## 7. CROSS-PHASE REGRESSION GATE
172: 
173: **Agent:** `gsd-integration-checker` [L21220]
174: **Spawned by:** `/gsd-audit-milestone`  
175: **Read-only:** Yes  
176: **Model:** Sonnet  
177: **Output:** Integration verification report
178: 
179: Checks:
180: 1. Do earlier phase artifacts still exist and function correctly?
181: 2. Do interfaces between phases still match?
182: 3. Are there missing integration points?
183: 
184: This is a milestone-level check, not phase-level. It runs when a milestone is being completed, not after every phase.
185: 
186: ---
187: 
188: ## 8. REQUIREMENTS COVERAGE GATE
189: 
190: **Inline gate** [L22407-L22420]
191: 
192: Verifies every REQ-ID from REQUIREMENTS.md maps to at least one plan. Runs at planning time (before execution) so missing requirements are caught early.
193: 
194: This is different from the plan checker's requirement coverage check:
195: - **Requirements Coverage Gate:** Checks that every requirement has SOME plan addressing it
196: - **Plan Checker (Dimension 1):** Checks that every requirement has a SPECIFIC task addressing it
197: 
198: ---
199: 
200: ## 9. DECISION COVERAGE GATE
201: 
202: **Inline gate (BLOCKING in plan-phase, NON-BLOCKING in execute-phase)** [L22410-L22415]
203: 
204: Verifies every `<decision>` from CONTEXT.md is reflected in the plans/shipped artifacts.
205: 
206: - **BLOCKING at plan time:** If a user decision (e.g., "use Node built-in crypto, no external deps") is not reflected in any plan, the gate blocks
207: - **NON-BLOCKING at execute time:** If a shipped artifact doesn't reflect a decision, the gate warns but doesn't fail
208: 
209: This prevents "user says one thing, planner ignores it, executor builds something else" — a real problem in multi-agent systems.
210: 
211: ---
212: 
213: ## 10. PACKAGE LEGITIMACY GATE (Supply Chain Security)
214: 
215: **Multi-layer gate spanning research→planning→execution** [L22680-L22720]
216: 
217: ### Threat Model
218: GSD automates the path from "researcher names a package" to "executor runs `npm install`". ~20% of AI-generated package references are hallucinated. ~43% of those names recur consistently across prompts, making pre-registration economically viable for attackers.
219: 
220: ### Three Layers
221: 
222: | Layer | Component | Action |
223: |-------|-----------|--------|
224: | Research | gsd-phase-researcher | Runs `slopcheck install <pkgs> --json`; writes `## Package Legitimacy Audit` table to RESEARCH.md; strips `[SLOP]` packages entirely |
225: | Planning | gsd-planner | Reads Audit table; inserts `checkpoint:human-verify` before `[ASSUMED]`/`[SUS]` install tasks; adds `T-{phase}-SC` STRIDE supply-chain row to `<threat_model>` |
226: | Execution | gsd-executor | RULE 3 excludes package installation from auto-fix scope; failed installs surface as checkpoints, never silent substitutions |
227: 
228: ### Provenance System
229: Three verdicts + graceful degradation:
230: 
231: | Verdict | Meaning | Action |
232: |---------|---------|--------|
233: | `[SLOP]` | Verified hallucinated/unsafe package | Removed entirely from RESEARCH.md |
234: | `[SUS]` | Suspicious (low age, few downloads, no source repo) | Checkpoint:human-verify before install |
235: | `[OK]` | Approved (healthy registry metadata) | No checkpoint added |
236: | `[ASSUMED]` | Web-sourced (not registry-verified) | Treated as SUS — always gets checkpoint |
237: 
238: **Ecosystem coverage:**
239: - `npm view` (Node.js)
240: - `pip index versions` (Python)
241: - `cargo search` (Rust)
242: 
243: **Graceful degradation:** If `slopcheck` is unavailable, every package tagged `[ASSUMED]`. Research and planning proceed; never hard-fails.
244: 
245: ---
246: 
247: ## 11. CODE REVIEW PIPELINE
248: 
249: **Two agents, two workflows:**
250: 
251: ```
252: /gsd-code-review → gsd-code-reviewer → REVIEW.md (severity-classified findings)
253: /gsd-code-review --fix → gsd-code-fixer → REVIEW-FIX.md (atomic per-fix commits)
254: ```
255: 
256: [L24542-L24550]
257: 
258: **gsd-code-reviewer** detects:
259: - Bugs: logic errors, null/undefined checks, off-by-one, type mismatches, unreachable code
260: - Security: injection, XSS, hardcoded secrets, insecure crypto
261: - Quality: code organization, naming, duplication, error handling
262: 
263: **gsd-code-fixer** applies fixes from REVIEW.md:
264: - Treats REVIEW.md suggestions as guidance (not literal patches)
265: - One atomic git commit per fix (reviewable, revertable)
266: - Honors CLAUDE.md and project-skill rules during fixes
267: 
268: ---
269: 
270: ## 12. COMPARISON WITH HIVEMIND QUALITY SYSTEM
271: 
272: | Quality Gate | GSD | Hivemind | Strengths |
273: |-------------|-----|----------|-----------|
274: | **Pre-planning** | Research gate (unresolved questions block) | None | GSD |
275: | **Plan validation** | 8-dim plan-checker (max 3 iterations) | gate-l3-spec-compliance | Different (GSD broader, Hivemind deeper) |
276: | **Supply chain** | Package Legitimacy Gate (3 layers) | None | GSD |
277: | **Execution verification** | Goal-backward analysis + test quality audit | gate-l3-evidence-truth (L1-L5) | Different (GSD checks goals, Hivemind checks evidence) |
278: | **Test quality** | Assertion strength, circular patterns, disabled tests | None | GSD |
279: | **Security** | Threat mitigation verification (ASVS) | None | GSD |
280: | **Cross-phase** | Integration checker | None | GSD |
281: | **Drift detection** | Codebase drift gate (structural changes) | None | GSD |
282: | **Code review** | /gsd-code-review → REVIEW.md → fix → REVIEW-FIX.md | hm-l2-reviewer | GSD (more structured) |
283: | **Spec compliance** | Requirements coverage + decision coverage | gate-l3-spec-compliance (bidirectional traceability) | Hivemind (more rigorous with traceability) |
284: | **Evidence hierarchy** | Binary PASS/FAIL | L1-L5 with file:line references | Hivemind |
285: | **Lifecycle compliance** | None | gate-l3-lifecycle-integration (9-surface mutation authority) | Hivemind |
286: | **Mock detection** | None | gate-l3-evidence-truth (mock-only detection) | Hivemind |
287: | **Orchestration** | Sequential: plan-checker → verifier → auditor | gate-l3-lifecycle-integration → gate-l3-spec-compliance → gate-l3-evidence-truth | Both valid |
288: 
289: ---
290: 
291: ## 13. HIVEMIND'S UNIQUE QUALITY ADVANTAGES
292: 
293: Hivemind has capabilities that GSD lacks entirely:
294: 
295: 1. **L1-L5 Evidence Hierarchy** — Every claim tagged with evidence level. GSD uses binary PASS/FAIL. Hivemind's approach enables partial credit, graded quality assessment, and explicit knowledge gaps.
296: 
297: 2. **9-Surface Mutation Authority** — gate-l3-lifecycle-integration checks which surfaces an agent modifies (src/ vs .opencode/ vs .hivemind/) and validates against CQRS boundaries. GSD has no equivalent concept.
298: 
299: 3. **Mock-Only Detection** — gate-l3-evidence-truth can detect "integration testing" that's actually mocked at all layers. GSD has no such check.
300: 
301: 4. **Bidirectional Spec Traceability** — gate-l3-spec-compliance traces spec→implementation AND implementation→spec, detecting untraced implementation (feature creep) in addition to untraced requirements (gaps).
302: 
303: ---
304: 
305: ## 14. ACTIONABLE RECOMMENDATIONS FOR HIVEMIND
306: 
307: ### RECOMMENDATION A: Test Quality Audit (HIGH IMPACT)
308: 
309: **Add to gate-l3-evidence-truth or hm-l2-critic:**
310: 
311: ```
312: When verifying test evidence, check:
313: 1. [BLOCKING] Are any tests disabled? (it.skip, xdescribe, test.skip)
314: 2. [BLOCKING] Are there circular patterns? (system generates own expected values)
315: 3. [LOWERING] What assertion strength? (existence < value < behavioral)
316: 4. [BLOCKING] Expected value provenance? (hand-written, auto-generated, from impl?)
317: ```
318: 
319: ### RECOMMENDATION B: Package Legitimacy Gate (HIGH IMPACT)
320: 
321: **Add to hm-l3-deep-research or hm-l2-production-readiness:**
322: 
323: ```
324: When research recommends external packages:
325: 1. Run registry-specific verification: npm view / pip index / cargo search
326: 2. Tag: [VERIFIED] / [ASSUMED] / [SUS] / [SLOP]
327: 3. [SLOP] → strip from recommendations
328: 4. [ASSUMED]/[SUS] → add checkpoint:human-verify
329: 5. Ecosystem coverage: Node, Python, Rust (at minimum)
330: ```
331: 
332: ### RECOMMENDATION C: Codebase Drift Detection (MEDIUM IMPACT)
333: 
334: **Add to hm-l2-phase-execution:**
335: 
336: ```
337: After execution wave completes:
338: 1. Read last_mapped_commit from codebase docs frontmatter
339: 2. git diff --name-only last_mapped_commit..HEAD
340: 3. Check: new directories, new barrel exports, new route modules
341: 4. If ≥ threshold: WARN with remap suggestion
342: ```
343: 
344: ### RECOMMENDATION D: Decision Coverage Gate (MEDIUM IMPACT)
345: 
346: **Add to hm-l2-spec-driven-authoring or hm-l2-phase-loop:**
347: 
348: ```
349: After planning, check:
350: 1. Every decision from the brief/spec is reflected in at least one plan task
351: 2. If any decision is missing: BLOCK (re-plan to include it)
352: 3. After execution: check again (NON-BLOCKING this time)
353: ```
354: 
355: ### RECOMMENDATION E: Research Gate (MEDIUM IMPACT)
356: 
357: **Add between research and planning phases:**
358: 
359: ```
360: Before entering planning:
361: 1. Scan RESEARCH.md for [UNRESOLVED] markers
362: 2. If any exist: BLOCK planning → return to research
363: 3. If none: proceed to planning
364: ```
365: 
366: ### RECOMMENDATION F: Pre-Plan Scope Validation (LOW IMPACT)
367: 
368: **Add to hm-l2-spec-driven-authoring's output validation:**
369: 
370: ```
371: Verify for each plan file:
372: 1. Every REQ-ID from spec maps to at least one task
373: 2. Every file to be modified is within phase scope
374: 3. Verification commands are specified for each task
375: 4. Plan fits in one context window (200K tokens)
376: ```
377: 
378: ---
379: 
380: ## 15. KEY TAKEAWAYS
381: 
382: 1. **GSD has 10+ quality gates** vs Hivemind's 3-gate triad. However, GSD's gates are simpler (binary PASS/FAIL) while Hivemind's are deeper (L1-L5 evidence hierarchy). The optimal is a hybrid: Hivemind's gate depth + GSD's gate breadth.
383: 
384: 2. **The Package Legitimacy Gate** is GSD's most important innovation for AI coding agents. Supply-chain security is critical when AI agents recommend and install dependencies autonomously.
385: 
386: 3. **GSD's test quality audit** (assertion strength, circular patterns, disabled tests) verifies that tests actually PROVE something. Hivemind's gate-l3-evidence-truth checks that evidence EXISTS but not that it's MEANINGFUL.
387: 
388: 4. **GSD's codebase drift gate** is a simple but effective post-execution check. Hivemind has no equivalent.
389: 
390: 5. **Hivemind's evidence hierarchy + mock detection + 9-surface mutation authority** have no equivalent in GSD. These are unique Hivemind advantages.
391: 
392: 6. **Recommendation priority:** Package Legitimacy Gate > Test Quality Audit > Codebase Drift Detection > Decision Coverage Gate > Research Gate.

(End of file - total 392 lines)
</content>
```

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/phases/23-notification-fix-and-tool-surface-docs/23-GSD-agent-architecture-2026-05-23.md"
}
```

**Output:**
```
<path>/Users/apple/hivemind-plugin-private/.planning/phases/23-notification-fix-and-tool-surface-docs/23-GSD-agent-architecture-2026-05-23.md</path>
<type>file</type>
<content>
1: # GSD Agent Architecture — Deep Analysis
2: 
3: > **Source:** GSD Repomix output `5875fd23ec62fc70` — docs/AGENTS.md, docs/ARCHITECTURE.md §Agent Model, docs/INVENTORY.md §Agents (33 shipped)
4: > **Date:** 2026-05-23
5: > **Evidence Level:** L3 (documented observation from GSD docs)
6: > **Audience:** Hivemind engineers seeking to improve agent architecture
7: 
8: ---
9: 
10: ## 1. OVERVIEW
11: 
12: GSD ships **33 agents** stored as `agents/gsd-*.md` files. They are organized into 13 functional categories with **no hierarchical depth** — there is no L0/L1/L2 taxonomy. Every agent is a peer. The orchestration hierarchy comes from the workflow files, not the agent definitions. [L29950-L29952]
13: 
14: GSD's architecture is fundamentally different from Hivemind's:
15: 
16: ```
17: GSD:        Workflow (orchestrator) → Agent (specialist) → Agent (specialist) → ...
18: Hivemind:   L0 Orchestrator → L1 Coordinator → L2 Specialist → L3 Skill
19: ```
20: 
21: GSD's flat model trades hierarchical depth for simplicity. Every agent gets a fresh context window (up to 200K tokens). [L22032-L22036]
22: 
23: ---
24: 
25: ## 2. AGENT CATEGORIES (13 groups, 33 agents)
26: 
27: ### 2.1 Researchers (4 agents)
28: 
29: | Agent | Spawned by | Parallelism | Tools | Model | Produces |
30: |-------|-----------|-------------|-------|-------|----------|
31: | project-researcher | /gsd-new-project, /gsd-new-milestone | 4 parallel (stack, features, arch, pitfalls) | Read, Write, Bash, Grep, Glob, WebSearch, WebFetch, MCP | Sonnet | research/STACK.md, FEATURES.md, ARCHITECTURE.md, PITFALLS.md |
32: | phase-researcher | /gsd-plan-phase | 4 parallel | same as above | Sonnet | {phase}-RESEARCH.md |
33: | ui-researcher | /gsd-ui-phase | Single | same + MCP | Sonnet | {phase}-UI-SPEC.md |
34: | advisor-researcher | discuss-phase (advisor mode) | Multiple (one per gray area) | Read, Bash, Grep, Glob, WebSearch, WebFetch, MCP | Sonnet | 5-column comparison table |
35: 
36: [L21228-L21290]
37: 
38: **Key insight:** Researchers are the ONLY agents with WebSearch + WebFetch + MCP access. This is by design — research happens in a controlled phase before execution, and web access is restricted to prevent hallucinated dependencies from entering the execution pipeline. [L21946-L21956]
39: 
40: ### 2.2 Analyzers (2 agents)
41: 
42: | Agent | Spawned by | Parallelism | Tools | Model | Produces |
43: |-------|-----------|-------------|-------|-------|----------|
44: | assumptions-analyzer | discuss-phase (assumptions mode) | Single | Read, Bash, Grep, Glob (NO Write, NO Web) | Sonnet | Structured assumptions with evidence, confidence levels |
45: | advisor-researcher | discuss-phase (advisor mode) | Multiple | Read, Bash, Grep, Glob, WebSearch, WebFetch, MCP | Sonnet | 5-column comparison table |
46: 
47: [L21258-L21290]
48: 
49: **gsd-assumptions-analyzer** is a uniquely GSD pattern: it reads the codebase BEFORE interacting with the user, forms assumptions with file:line evidence, and surfaces them for confirmation. This is the "codebase-first" approach vs Hivemind's "ask questions first" approach.
50: 
51: Key behaviors:
52: - Reads 5-15 most relevant source files
53: - Classifies confidence: Confident / Likely / Unclear
54: - Output calibrated by tier: full_maturity (3-5 areas), standard (3-4), minimal_decisive (2-3)
55: 
56: [L21265-L21280]
57: 
58: ### 2.3 Synthesizers (1 agent)
59: 
60: | Agent | Spawned by | Tools | Model | Produces |
61: |-------|-----------|-------|-------|----------|
62: | research-synthesizer | /gsd-new-project | Read, Write, Bash | Sonnet | research/SUMMARY.md |
63: 
64: [L21292-L21300]
65: 
66: This is notable for having RESTRICTED tools (no Grep, no Glob, no Web) — it only reads the 4 research outputs and writes the summary. Principle of least privilege enforced. [L21946-L21956]
67: 
68: ### 2.4 Planners (2 agents)
69: 
70: | Agent | Spawned by | Tools | Model | Produces |
71: |-------|-----------|-------|-------|----------|
72: | planner | /gsd-plan-phase, /gsd-quick | Read, Write, Bash, Glob, Grep, WebFetch, MCP | **Opus** | {phase}-{N}-PLAN.md |
73: | roadmapper | /gsd-new-project | Read, Write, Bash, Glob, Grep | Sonnet | ROADMAP.md |
74: 
75: [L21302-L21320]
76: 
77: **Critical insight:** The planner uses Opus (highest-quality model) while all others use Sonnet. GSD reserves the most expensive model for the most cognitively demanding task: decomposing requirements into executable plans. This is a deliberate cost/quality tradeoff.
78: 
79: Key planner behaviors:
80: - Creates 2-3 atomic task plans sized for single context windows
81: - Uses XML structure with `<task>` elements
82: - Groups plans into dependency waves
83: - Performs reachability check (v1.32): validates plan steps reference accessible files and APIs
84: - Reads PROJECT.md + REQUIREMENTS.md + CONTEXT.md + RESEARCH.md
85: 
86: [L21305-L21316]
87: 
88: ### 2.5 Executors (1 agent)
89: 
90: | Agent | Spawned by | Parallelism | Tools | Model | Produces |
91: |-------|-----------|-------------|-------|-------|----------|
92: | executor | /gsd-execute-phase, /gsd-quick | Multiple (parallel within waves) | Read, Write, Edit, Bash, Grep, Glob (NO Web) | Sonnet | Code changes, git commits, SUMMARY.md |
93: 
94: [L21322-L21334]
95: 
96: Key behaviors:
97: - Fresh 200K context window per plan
98: - Follows XML task instructions precisely
99: - Atomic git commit per completed task
100: - Handles checkpoint types: auto, human-verify, decision, human-action
101: - Reports deviations in SUMMARY.md
102: - Invokes node repair on verification failure
103: 
104: The executor has Edit access (unlike researchers/checkers) but NO web access — consistent with the security principle that code modification agents should not have network access. [L21946-L21956]
105: 
106: ### 2.6 Checkers (3 agents, all read-only)
107: 
108: | Agent | Spawned by | Tools | Model | Produces |
109: |-------|-----------|-------|-------|----------|
110: | plan-checker | /gsd-plan-phase | Read, Bash, Glob, Grep | Sonnet | PASS/FAIL with feedback |
111: | integration-checker | /gsd-audit-milestone | Read, Bash, Glob, Grep | Sonnet | Integration report |
112: | ui-checker | /gsd-ui-phase | Read, Bash, Glob, Grep | Sonnet | BLOCK/FLAG/PASS |
113: 
114: [L21336-L21358]
115: 
116: **Critical pattern:** All checkers are Read-Only (no Write, no Edit). They evaluate but never modify. This is the principle of least privilege enforced consistently. [L21946-L21956]
117: 
118: ### 2.7 Verifiers (1 agent)
119: 
120: | Agent | Spawned by | Tools | Model | Produces |
121: |-------|-----------|-------|-------|----------|
122: | verifier | /gsd-execute-phase | Read, Write, Bash, Grep, Glob | Sonnet | {phase}-VERIFICATION.md |
123: 
124: [L21360-L21380]
125: 
126: **This agent does more than just "check."** It performs goal-backward analysis — checking the codebase against phase goals, not just that tasks completed. 
127: 
128: Unique capabilities:
129: - **Milestone scope filtering**: gaps addressed in later phases are marked as "deferred", not failures (v1.32)
130: - **Test quality audit** (v1.32): verifies tests prove what they claim by checking:
131:   1. Disabled/skipped tests on requirements
132:   2. Circular test patterns (system generating its own expected values)
133:   3. Assertion strength (existence vs. value vs. behavioral)
134:   4. Expected value provenance
135: 
136: [L21372-L21380]
137: 
138: ### 2.8 Auditors (3 agents)
139: 
140: | Agent | Spawned by | Tools | Model | Produces |
141: |-------|-----------|-------|-------|----------|
142: | nyquist-auditor | /gsd-validate-phase | Read, Write, Edit, Bash, Grep, Glob | Sonnet | Test files, VALIDATION.md |
143: | ui-auditor | /gsd-ui-review | Read, Write, Bash, Grep, Glob | Sonnet | {phase}-UI-REVIEW.md |
144: | security-auditor | /gsd-secure-phase | Read, Write, Edit, Bash, Grep, Glob | Sonnet | {phase}-SECURITY.md |
145: 
146: [L21382-L21414]
147: 
148: Notable: nyquist-auditor and security-auditor have Edit access (to generate test files). ui-auditor does NOT have Edit. This is a deliberate distinction.
149: 
150: ### 2.9 Mappers (1 agent)
151: 
152: | Agent | Spawned by | Parallelism | Tools | Model | Produces |
153: |-------|-----------|-------------|-------|-------|----------|
154: | codebase-mapper | /gsd-map-codebase | 4 parallel (tech, arch, quality, concerns) | Read, Bash, Grep, Glob, Write | **Haiku** | .planning/codebase/*.md |
155: 
156: [L21416-L21432]
157: 
158: **Key insight:** Uses Haiku (cheapest model) because the task is "pattern extraction from file contents" — no reasoning required. This is a cost optimization: expensive models don't add value for mechanical tasks.
159: 
160: ### 2.10 Debuggers (1 agent)
161: 
162: | Agent | Spawned by | Tools | Model | Produces |
163: |-------|-----------|-------|-------|----------|
164: | debugger | /gsd-debug, /gsd-verify-work | Read, Write, Edit, Bash, Grep, Glob, **WebSearch** | Sonnet | .planning/debug/*.md |
165: 
166: [L21434-L21446]
167: 
168: **Debug Session Lifecycle:** `gathering → investigating → fixing → verifying → awaiting_human_verify → resolved`
169: 
170: Note: The debugger has WebSearch (unlike executors) — it needs current information for bug investigation. It also has Edit for applying fixes.
171: 
172: ### 2.11 Doc Writers (2 agents)
173: 
174: | Agent | Spawned by | Tools | Model | Produces |
175: |-------|-----------|-------|-------|----------|
176: | doc-writer | /gsd-docs-update | Read, Write, Bash, Grep, Glob | Sonnet | Project docs |
177: | doc-verifier | /gsd-docs-update | Read, Write, Bash, Grep, Glob | Sonnet | JSON verification results |
178: 
179: [L21448-L21470]
180: 
181: Doc-writer supports 6 modes: create, update, supplement, fix + monorepo-aware. Fix mode accepts failure objects from doc-verifier for targeted corrections.
182: 
183: ### 2.12 Profilers (1 agent)
184: 
185: | Agent | Spawned by | Tools | Model | Produces |
186: |-------|-----------|-------|-------|----------|
187: | user-profiler | /gsd-profile-user | **Read ONLY** | Sonnet | USER-PROFILE.md |
188: 
189: [L21472-L21486]
190: 
191: Most restricted agent in the entire roster. Read-only. Analyzes session data, never modifies files.
192: 
193: ### 2.13 Advanced & Specialized Agents (12 agents, stub coverage)
194: 
195: | Agent | Spawned by | Key characteristic |
196: |-------|-----------|-------------------|
197: | pattern-mapper | /gsd-plan-phase | Read-only codebase analysis → PATTERNS.md |
198: | debug-session-manager | /gsd-debug | Runs debug loop in isolated context |
199: | code-reviewer | /gsd-code-review | Produces REVIEW.md with severity-classified findings |
200: | code-fixer | /gsd-code-review --fix | One atomic commit per fix |
201: | ai-researcher | /gsd-ai-integration-phase | Distills framework docs into AI-SPEC.md §3-4b |
202: | domain-researcher | /gsd-ai-integration-phase | Surfaces evaluation criteria for AI systems |
203: | eval-planner | /gsd-ai-integration-phase | Designs evaluation strategy for AI phases |
204: | eval-auditor | /gsd-eval-review | Scores eval coverage: COVERED/PARTIAL/MISSING |
205: | framework-selector | /gsd-ai-integration-phase | Interactive ≤6-question decision matrix |
206: | intel-updater | /gsd-map-codebase --query | Writes .planning/intel/*.json |
207: | doc-classifier | /gsd-ingest-docs | Classifies docs as ADR/PRD/SPEC/DOC/UNKNOWN |
208: | doc-synthesizer | /gsd-ingest-docs | Conflict detection + consolidation |
209: 
210: [L21682-L21940]
211: 
212: ---
213: 
214: ## 3. WAVE EXECUTION MODEL
215: 
216: GSD's parallelization strategy is fundamentally different from Hivemind's:
217: 
218: ```python
219: # GSD Wave Model
220: wave_1 = [plan_01, plan_02]      # No deps → parallel
221: wave_2 = [plan_03, plan_04]      # Depends on wave_1 → sequential after wave_1
222: wave_3 = [plan_05]               # Depends on wave_2 → sequential after wave_2
223: ```
224: 
225: [L22304-L22310]
226: 
227: **Key properties:**
228: - Plans within a wave execute in parallel (one executor agent per plan)
229: - Waves execute sequentially (wave 2 waits for all wave 1 plans to complete)
230: - Each executor gets a FRESH 200K context window
231: - Number of parallel executors is configurable: `parallelization.max_concurrent_agents` (default 3)
232: 
233: **Parallel commit safety mechanisms:**
234: 1. `--no-verify` commits — Parallel agents skip pre-commit hooks to avoid lock contention
235: 2. `STATE.md.lock` — Lockfile-based mutual exclusion (O_EXCL atomic creation, 10s timeout, spin-wait with jitter)
236: 3. Orchestrator runs `git hook run pre-commit` once after each wave completes
237: 
238: [L22352-L22356]
239: 
240: ---
241: 
242: ## 4. ADAPTIVE CONTEXT ENRICHMENT
243: 
244: When the context window is 500K+ tokens (1M-class models like Opus 4.6), GSD automatically enriches subagent prompts:
245: 
246: **Standard 200K windows:**
247: - Executor: PLAN.md + project context only
248: - Verifier: SUMMARY.md files only
249: 
250: **500K+ windows (adaptive):**
251: - Executor: Prior wave SUMMARY.md + CONTEXT.md + RESEARCH.md → cross-plan awareness
252: - Verifier: ALL PLAN.md + SUMMARY.md + CONTEXT.md + REQUIREMENTS.md → history-aware verification
253: 
254: [L22340-L22350]
255: 
256: The orchestrator reads `context_window` from config (`gsd-sdk query config-get context_window`) and conditionally includes richer context when `>= 500000`.
257: 
258: ---
259: 
260: ## 5. MODEL RESOLUTION
261: 
262: GSD has a multi-layered model resolution system:
263: 
264: ```
265: 1. model_profile (top level): quality / balanced / budget / adaptive / inherit
266: 2. model_overrides: Per-agent exceptions to the profile
267: 3. models.<phase_type>: Per-phase-type overrides (planning, discuss, research, execution, verification, completion)
268: 4. dynamic_routing: Failure-tier escalation
269: 5. runtime: Per-runtime native model ID resolution
270: ```
271: 
272: [L25040-L25100]
273: 
274: **Resolution order:** `model_overrides` > `models.<phase_type>` > `model_profile` > runtime defaults
275: 
276: **Dynamic routing** (v1.40, `dynamic_routing.enabled`):
277: - Agent tries `tier_models[default_tier]` (e.g., sonnet)
278: - If orchestrator detects soft failure, agent escalates one tier (e.g., sonnet → opus)
279: - `max_escalations` caps retries
280: - `escalate_on_failure: false` disables escalation
281: 
282: [L25080-L25100]
283: 
284: ---
285: 
286: ## 6. TOOL PERMISSION MATRIX (Principle of Least Privilege)
287: 
288: This table is GSD's most important security innovation:
289: 
290: | Permission | Who has it | Who does NOT |
291: |-----------|-----------|-------------|
292: | **WebSearch** | Researchers only | Executors, Checkers, Verifiers |
293: | **WebFetch** | Researchers + Planner | Executors, Debuggers |
294: | **MCP (context7)** | Researchers + Planner | All others |
295: | **Edit** | Executors, Nyquist-auditor, Security-auditor, Debugger | Researchers, Checkers, Verifiers |
296: | **Write** | Most agents (researchers, planners, executors, verifiers) | Checkers (read-only) |
297: | **Read-Only** | Checkers, user-profiler | — |
298: 
299: [L21946-L21956]
300: 
301: **Security invariant:** No agent that modifies code (Edit) has network access (WebSearch/WebFetch). This prevents data exfiltration and hallucinated dependency injection.
302: 
303: ---
304: 
305: ## 7. COMPARISON WITH HIVEMIND AGENT ARCHITECTURE
306: 
307: | Dimension | GSD | Hivemind | Advantage |
308: |-----------|-----|----------|-----------|
309: | **Hierarchy depth** | Flat (all peers) | L0-L1-L2-L3 | Hivemind (better decomposition) |
310: | **Agent count** | 33 | 89 | Hivemind (more specialization) |
311: | **Evidence contracts** | None | L1-L5 hierarchy, file:line requirements | Hivemind (better quality control) |
312: | **Fresh context per agent** | Yes (200K window) | Yes (per subagent) | Equal |
313: | **Parallel wave execution** | Wave model with dependency grouping | hm-l2-phase-execution implements this | Equal |
314: | **Adaptive context enrichment** | 500K+ windows get richer prompts | None | GSD |
315: | **Model resolution** | Multi-layered: profile→override→phase-type→runtime→dynamic | Baked into agent frontmatter | GSD (more flexible) |
316: | **Tool permissions** | Binary (listed/not listed) | Granular (allow/ask/ask) with per-tool glob support | Hivemind (more secure) |
317: | **Agent color coding** | Yes (terminal output) | Limited | GSD (UI polish) |
318: | **Read-only checker pattern** | Checkers have no Write/Edit | hm-l2-critic, hm-l2-reviewer are read-only | Equal |
319: | **Delegation mechanism** | Native Task()/SubAgent() | WaiterModel + dual-signal + session-stacking + delegations.json | Hivemind (more flexible, auditable) |
320: | **Evidence tagging** | None (PASS/FAIL binary) | L1-L5 with file:line references | Hivemind (more rigorous) |
321: 
322: ---
323: 
324: ## 8. ACTIONABLE RECOMMENDATIONS FOR HIVEMIND
325: 
326: ### RECOMMENDATION A: Adaptive Context Enrichment (MEDIUM IMPACT)
327: 
328: **Problem:** Hivemind dispatches the same prompt structure regardless of model context window size.
329: 
330: **Solution:** Add a `context_window` check to orchestrator workflows:
331: - If model supports ≥ 500K tokens: include prior wave SUMMARY.md + cross-plan context
332: - If standard 200K: use truncated prompts with cache-friendly ordering
333: 
334: ```typescript
335: // In hm-l2-coordinating-loop or hm-l2-phase-execution
336: const contextWindow = await getConfig('context_window', 200000);
337: const isEnriched = contextWindow >= 500000;
338: if (isEnriched) {
339:   prompt.enrichWith('priorWaveSummaries', summaries);
340:   prompt.enrichWith('crossPlanContext', context);
341: }
342: ```
343: 
344: ### RECOMMENDATION B: Wave-Based Parallelization with STATE.md.lock (MEDIUM IMPACT)
345: 
346: **Problem:** Hivemind's `hm-l2-phase-execution` implements wave execution but lacks shared-state lock protection for parallel agents.
347: 
348: **Solution:** Adopt GSD's `STATE.md.lock` pattern:
349: ```typescript
350: // O_EXCL atomic file creation
351: fs.openSync(lockPath, fs.constants.O_CREAT | fs.constants.O_EXCL);
352: // Spin-wait with jitter (10s timeout)
353: while (lockAttempts < MAX_RETRIES) {
354:   try { acquireLock(); break; } catch {
355:     sleep(jitteredDelay());
356:     lockAttempts++;
357:   }
358: }
359: ```
360: 
361: ### RECOMMENDATION C: Read-Only Checker Agent Pattern (LOW IMPACT)
362: 
363: **Problem:** Hivemind's `hm-l2-critic` and `hm-l2-reviewer` are read-only but this is not enforced in their agent definitions.
364: 
365: **Solution:** Ensure all checker agents STRICTLY enforce Read-Only in their tool lists — no Write, no Edit. GSD's principle is: "Checkers evaluate, they never modify."
366: 
367: ### RECOMMENDATION D: Tool Permission by Agent Role (HIGH IMPACT)
368: 
369: **Problem:** Hivemind's tool permission model is granular but not role-consistent. An executor could theoretically have web access.
370: 
371: **Solution:** Enforce GSD's invariant at the agent definition level:
372: - **Researchers:** Web access (WebSearch, WebFetch, MCP) → they need current ecosystem info
373: - **Planners:** Read + Write (no Edit, no Web) → they design, don't build
374: - **Executors:** Edit + Write (no Web) → they build, don't research
375: - **Checkers:** Read-Only → they evaluate, don't modify
376: - **Auditors:** Read + Write + possibly Edit (tests only) → they verify but don't patch production code
377: - **Profilers:** Read-Only (strictest) → data analysis only
378: 
379: ### RECOMMENDATION E: Agent Role Color Scheme (LOW IMPACT)
380: 
381: GSD assigns distinct terminal colors per agent role:
382: - Researchers: default (no color)
383: - Planner: Green
384: - Executor: Yellow  
385: - Checker: Green
386: - Debugger: Orange
387: - Doc Writer: Purple
388: - UI roles: Fuchsia (#E879F9), Cyan (#22D3EE), Pink (#F472B6)
389: - Security: Red (#EF4444)
390: 
391: Hivemind could adopt a consistent color scheme for L2 specialist agents.
392: 
393: ---
394: 
395: ## 9. KEY TAKEAWAYS
396: 
397: 1. **GSD's flat agent hierarchy is simpler** but Hivemind's L0-L2 hierarchy enables more sophisticated task decomposition. **Keep Hivemind's hierarchy.**
398: 2. **GSD's tool permission by role** (no Web for code-modifying agents) is a security invariant Hivemind should enforce.
399: 3. **Wave execution with STATE.md.lock** is directly adoptable for shared-state parallel execution.
400: 4. **Adaptive context enrichment** based on model window size is a zero-cost optimization — implement it.
401: 5. **GSD's read-only checker pattern** aligns with Hivemind's `hm-l2-critic` — formalize the invariant.
402: 6. **Model resolution at spawn time** (vs baked into frontmatter) gives GSD more flexibility. Hivemind could add a `resolve-model` SDK call.

(End of file - total 402 lines)
</content>
```

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/phases/23-notification-fix-and-tool-surface-docs/23-GSD-command-system-2026-05-23.md"
}
```

**Output:**
```
<path>/Users/apple/hivemind-plugin-private/.planning/phases/23-notification-fix-and-tool-surface-docs/23-GSD-command-system-2026-05-23.md</path>
<type>file</type>
<content>
1: # GSD Command System — Deep Analysis
2: 
3: > **Source:** GSD Repomix output `5875fd23ec62fc70` — files docs/COMMANDS.md, docs/ARCHITECTURE.md §Component Architecture, docs/INVENTORY.md §Commands (67 shipped)
4: > **Date:** 2026-05-23
5: > **Evidence Level:** L3 (documented observation from GSD docs)
6: > **Audience:** Hivemind engineers seeking actionable insights for Hivemind's command engine
7: 
8: ---
9: 
10: ## 1. OVERVIEW
11: 
12: GSD ships **67 commands** (stored as `commands/gsd/*.md`) plus **88 workflow files** (`get-shit-done/workflows/*.md`). Commands are the user-facing entry points; workflows are the internal orchestration logic. [L29994-L29997]
13: 
14: The fundamental architecture:
15: 
16: ```
17: User types /gsd-command → Command file loaded into context → Workflow orchestration → Subagent dispatch → State update
18: ```
19: 
20: Every command file contains:
21: - **YAML frontmatter:** `name`, `description`, `allowed-tools`
22: - **Prompt body:** Bootstraps the corresponding workflow, references shared knowledge documents via `@-reference`
23: - **Flag/argument definitions:** Syntactic sugar parsed by the runtime
24: 
25: [L22068-L22076]
26: 
27: ---
28: 
29: ## 2. COMMAND CLASSIFICATION (67 Commands)
30: 
31: ### 2.1 Namespace Meta-Skills (6 routers)
32: 
33: Keep eager skill-listing cost at ~120 tokens instead of ~2,150 for 86 skills:
34: 
35: | Command | Routes to | Token cost |
36: |---------|-----------|-----------|
37: | `/gsd-workflow` | Phase pipeline — discuss / plan / execute / verify / phase / progress | ~20 |
38: | `/gsd-project` | Project lifecycle — milestones, audits, summary | ~20 |
39: | `/gsd-quality` | Quality gates — code review, debug, audit, security, eval, ui | ~20 |
40: | `/gsd-context` | Codebase intelligence — map, graphify, docs, learnings | ~20 |
41: | `/gsd-manage` | Management — config, workspace, workstreams, thread, update, ship, inbox | ~20 |
42: | `/gsd-ideate` | Exploration & capture — explore, sketch, spike, spec, capture | ~20 |
43: 
44: [L30000-L30011]
45: 
46: **Routing mechanism:** Each namespace router's body contains a **routing table** — a Markdown table mapping intent keywords to concrete sub-skill commands. The model selects the namespace first, reads the routing table, then dispatches to the concrete command. [L22078-L22083]
47: 
48: **Key property:** Namespace skills are **additive** — every concrete command is still directly invocable. The routing layer is only a _cost optimization_, not an access control mechanism. [L23523]
49: 
50: **Description format:** Router descriptions use pipe-separated keyword tags (≤ 60 chars). Example: `"Phase pipeline router — discuss / plan / execute / verify / phase / progress."` This is based on Tool Attention research showing keyword-dense tags outperform prose at ~40% the token cost. [L22082-L22083]
51: 
52: ### 2.2 Core Workflow Commands (20 commands)
53: 
54: The central pipeline — these are the commands that users run daily:
55: 
56: | Command | Role | Produces |
57: |---------|------|----------|
58: | `/gsd-new-project` | Initialize project with research + roadmap | PROJECT.md, REQUIREMENTS.md, ROADMAP.md, STATE.md, config.json |
59: | `/gsd-workspace` | Manage isolated workspace environments | WORKSPACE.md, .planning/, repo copies |
60: | `/gsd-discuss-phase` | Gather phase context via questions | {phase}-CONTEXT.md, DISCUSSION-LOG.md |
61: | `/gsd-mvp-phase` | Plan as vertical MVP slice | PLAN.md via SPIDR splitting |
62: | `/gsd-spec-phase` | Socratic spec refinement | SPEC.md with falsifiable requirements |
63: | `/gsd-ui-phase` | Generate UI design contract | {phase}-UI-SPEC.md |
64: | `/gsd-ai-integration-phase` | AI design contract + eval planning | AI-SPEC.md |
65: | `/gsd-plan-phase` | Research → plan → verify a phase | RESEARCH.md, PLAN.md, VALIDATION.md |
66: | `/gsd-plan-review-convergence` | Cross-AI plan convergence loop | Converged PLAN.md |
67: | `/gsd-ultraplan-phase` | [BETA] Offload planning to ultraplan cloud | External plan file → /gsd-import |
68: | `/gsd-spike` | Throwaway feasibility experiments | Spike findings, optional persistent skill |
69: | `/gsd-sketch` | UI/design HTML mockups | Sketch findings, optional persistent skill |
70: | `/gsd-execute-phase` | Wave-based plan execution | Code changes, commits, SUMMARY.md |
71: | `/gsd-verify-work` | Conversational UAT | UAT.md |
72: | `/gsd-ship` | Create PR, review, merge | PR |
73: | `/gsd-fast` | Inline task execution (no subagents) | Direct code changes |
74: | `/gsd-quick` | Quick task with GSD guarantees | Code + state + commits |
75: | `/gsd-ui-review` | 6-pillar visual audit | {phase}-UI-REVIEW.md |
76: | `/gsd-code-review` | Source code review | REVIEW.md |
77: | `/gsd-eval-review` | AI phase evaluation audit | EVAL-REVIEW.md |
78: 
79: [L30014-L30044]
80: 
81: ### 2.3 Phase & Milestone Management (15 commands)
82: 
83: | Command | Role |
84: |---------|------|
85: | `/gsd-phase` | CRUD: add / insert / remove / edit phases in ROADMAP.md |
86: | `/gsd-add-tests` | Generate tests from UAT criteria |
87: | `/gsd-validate-phase` | Retroactive Nyquist validation gap filling |
88: | `/gsd-secure-phase` | Retroactive threat mitigation verification |
89: | `/gsd-audit-milestone` | Milestone DoD verification |
90: | `/gsd-audit-uat` | Cross-phase UAT/verification audit |
91: | `/gsd-audit-fix` | Autonomous audit-to-fix pipeline |
92: | `/gsd-complete-milestone` | Archive completed milestone |
93: | `/gsd-new-milestone` | Start new milestone cycle |
94: | `/gsd-milestone-summary` | Generate milestone summary |
95: | `/gsd-cleanup` | Archive phase dirs from completed milestones |
96: | `/gsd-manager` | Interactive command center |
97: | `/gsd-workstreams` | Parallel workstream management |
98: | `/gsd-autonomous` | Run all remaining phases autonomously |
99: | `/gsd-undo` | Safe git revert with phase manifest |
100: 
101: [L30046-L30065]
102: 
103: ### 2.4 Session & Navigation (8 commands)
104: 
105: | Command | Role |
106: |---------|------|
107: | `/gsd-progress` | Project progress + next-action routing |
108: | `/gsd-capture` | Capture ideas/tasks/notes/seeds |
109: | `/gsd-stats` | Project statistics dashboard |
110: | `/gsd-pause-work` | Context handoff for mid-phase pauses |
111: | `/gsd-resume-work` | Full context restoration |
112: | `/gsd-explore` | Socratic ideation |
113: | `/gsd-review-backlog` | Promote backlog items to active milestone |
114: | `/gsd-thread` | Persistent context threads |
115: 
116: [L30067-L30082]
117: 
118: ### 2.5 Codebase Intelligence (3 commands)
119: 
120: | Command | Role |
121: |---------|------|
122: | `/gsd-map-codebase` | Parallel codebase analysis (4 agents) |
123: | `/gsd-graphify` | Knowledge graph in .planning/graphs/ |
124: | `/gsd-extract-learnings` | Extract learnings from phase artifacts |
125: 
126: [L30084-L30088]
127: 
128: ### 2.6 Review, Debug & Recovery (6 commands)
129: 
130: | Command | Role |
131: |---------|------|
132: | `/gsd-review` | Cross-AI peer review via external CLIs |
133: | `/gsd-debug` | Systematic debugging with persistent state |
134: | `/gsd-forensics` | Post-mortem for failed workflows |
135: | `/gsd-health` | Planning directory health diagnosis |
136: | `/gsd-import` | Import external plans with conflict detection |
137: | `/gsd-inbox` | Triage GitHub issues/PRs |
138: 
139: [L30090-L30099]
140: 
141: ### 2.7 Docs, Profile & Utilities (9 commands)
142: 
143: | Command | Role |
144: |---------|------|
145: | `/gsd-docs-update` | Generate/verify project documentation |
146: | `/gsd-ingest-docs` | ADR/PRD/SPEC ingestion into .planning/ |
147: | `/gsd-profile-user` | Developer behavioral profiling |
148: | `/gsd-settings` | Workflow toggle config |
149: | `/gsd-config` | Advanced config (toggles/advanced/integrations/profile) |
150: | `/gsd-pr-branch` | Clean PR branch filtering .planning/ commits |
151: | `/gsd-surface` | Toggle skill profiles without reinstall |
152: | `/gsd-update` | Update GSD, sync skills across runtimes |
153: | `/gsd-help` | Command reference display |
154: 
155: [L30101-L30113]
156: 
157: ---
158: 
159: ## 3. COMMAND vs WORKFLOW DISTINCTION
160: 
161: This is a critical architectural pattern:
162: 
163: | Aspect | Command | Workflow |
164: |--------|---------|----------|
165: | **Location** | `commands/gsd/*.md` | `get-shit-done/workflows/*.md` |
166: | **Audience** | User-facing (slash commands) | Internal (orchestration logic) |
167: | **Content** | YAML frontmatter + bootstrap prompt | Step-by-step orchestration instructions |
168: | **Size budget** | No explicit cap | Tiered: XL=1700, LARGE=1500, DEFAULT=1000 lines |
169: | **Lifespan** | Stable, user-triggered | Internal, may be called by multiple commands |
170: | **Reference style** | `@` references to workflows | `@` references to references/*.md |
171: 
172: [L22085-L22105]
173: 
174: **Workflow size budget enforcement** is a notable GSD innovation:
175: 
176: | Tier | Line limit | Example workflows |
177: |------|-----------|-------------------|
178: | XL | 1700 | execute-phase, plan-phase, new-project |
179: | LARGE | 1500 | Multi-step planners, feature workflows |
180: | DEFAULT | 1000 | Focused single-purpose workflows |
181: | STRICT | 500 | discuss-phase.md only |
182: 
183: [L22100-L22110]
184: 
185: When a workflow exceeds its tier, GSD extracts:
186: - Per-mode bodies → `workflows/<name>/modes/<mode>.md`
187: - Templates → `workflows/<name>/templates/`
188: - Shared knowledge → `get-shit-done/references/`
189: 
190: The parent file becomes a thin dispatcher that Reads only the needed mode + template files. `workflows/discuss-phase/` is the canonical example with 9 mode files (power, all, auto, chain, text, batch, analyze, default, advisor). [L22110-L22116]
191: 
192: ---
193: 
194: ## 4. TWO-STAGE HIERARCHICAL ROUTING (v1.40)
195: 
196: ### 4.1 The Problem
197: 
198: GSD ships 86+ concrete commands. In OpenCode/Claude Code, every slash command is listed in the system prompt as an available tool/skill. At ~25 tokens per description, 86 commands = ~2,150 tokens consumed every turn just for the listing — whether the user uses them or not. [L22078]
199: 
200: ### 4.2 The Solution
201: 
202: Two layers:
203: 
204: 1. **Stage 1 (Namespace Router):** 6 meta-skills, each ~20 tokens. Total: ~120 tokens.
205:    - The model sees only these 6 items in the eager listing
206:    - Each router's description briefly covers its domain
207: 
208: 2. **Stage 2 (Routing Table):** Inside the selected router's body, a Markdown table maps intent → concrete sub-skill.
209:    - The model reads only ONE router's body (the one it selected)
210:    - Routing tables contain 5-15 entries, each ~2 lines
211: 
212: Net savings: ~2,150 tokens → ~240 tokens per turn (best case). ~90% reduction. [L22080-L22083]
213: 
214: ### 4.3 Token Budget Interaction
215: 
216: GSD explicitly documents that the eager skill listing is only ONE of two recurring per-turn token costs. The other is MCP tool schemas from `.claude/settings.json`. Heavyweight MCP servers (browser, Mac-tools) can cost 20K+ tokens per turn — dwarfing what `model_profile` tuning saves. The two levers are additive. [L22085-L22090]
217: 
218: ### 4.4 Hivemind Comparison
219: 
220: Hivemind's 19 commands are flat-listed. No two-stage routing exists. The `hivemind-command-engine` tool supports `discover` (list available commands), `list_commands`, `route_preview`, etc. But this is a _tool_-based discovery, not a _prompt-based_ routing layer.
221: 
222: ---
223: 
224: ## 5. WORKFLOW ARCHITECTURE (88 Workflows)
225: 
226: ### 5.1 Orchestration Pattern
227: 
228: Every workflow follows:
229: 
230: ```
231: 1. Load context: gsd-sdk query init.<workflow> (returns JSON with project info, config, state)
232: 2. Resolve model: gsd-sdk query resolve-model <agent-name> (returns opus/sonnet/haiku/inherit)
233: 3. Spawn agent(s): Task/SubAgent call with agent prompt + context payload + model assignment
234: 4. Collect results
235: 5. Update state: gsd-sdk query state.update / state.patch / state.advance-plan
236: ```
237: 
238: [L22277-L22294]
239: 
240: ### 5.2 Internal Workflows (no user-facing command)
241: 
242: Some workflows are not directly callable by users — they are invoked by other workflows:
243: 
244: | Workflow | Purpose | Called by |
245: |----------|---------|-----------|
246: | `execute-plan.md` | Execute single PLAN.md | `execute-phase.md` (per-plan subagent) |
247: | `verify-phase.md` | Goal-backward verification | `execute-phase.md` (post-execution) |
248: | `transition.md` | Phase boundary checks + state advancement | `execute-phase.md`, `/gsd-progress --next` |
249: | `node-repair.md` | Failed task verification repair | `execute-plan.md` (recovery) |
250: | `diagnose-issues.md` | Parallel UAT gap analysis | `/gsd-verify-work` (auto-diagnosis) |
251: 
252: [L30136-L30139]
253: 
254: ---
255: 
256: ## 6. PLATFORM ADAPTERS
257: 
258: GSD's commands are installed differently per AI runtime. The installer translates from Claude Code's native format:
259: 
260: | Runtime | Command form | Agent format | Hook events |
261: |---------|-------------|-------------|-------------|
262: | Claude Code | `/gsd-command-name` (hyphen) | `agents/gsd-*.md` | PostToolUse, statusLine, SessionStart |
263: | OpenCode/Kilo | `/gsd-command-name` (hyphen) | `agents/gsd-*.md` (flat) | No GSD hooks |
264: | Gemini CLI | `/gsd:command-name` (colon) | `agents/gsd-*.md` | AfterTool instead of PostToolUse |
265: | Codex | `$gsd-command-name` | TOML config + skills | Hook tables in config.toml |
266: | Copilot | `/gsd-command-name` (hyphen) | `.agent.md` files | No GSD hooks |
267: | Cursor/Windsurf/Trae | `/gsd-command-name` (hyphen) | Skills-first + rule refs | No GSD hooks |
268: 
269: [L22680-L22740]
270: 
271: ---
272: 
273: ## 7. COMMAND FRONTMATTER STRUCTURE (Sample)
274: 
275: From `docs/AGENTS.md` and `docs/ARCHITECTURE.md`, the command frontmatter pattern is consistent:
276: 
277: ```yaml
278: ---
279: name: gsd-plan-phase
280: description: Create detailed phase plan (PLAN.md) with verification loop
281: tools: [Read, Write, Bash, Grep, Glob, WebFetch, mcp(context7)]
282: ---
283: ```
284: 
285: Notable: GSD commands do NOT have permission levels (allow/ask). They use a binary `tools` list. This is a significant difference from Hivemind's granular permission model.
286: 
287: ---
288: 
289: ## 8. COMPARISON WITH HIVEMIND COMMAND ENGINE
290: 
291: | Dimension | GSD | Hivemind | Advantage |
292: |-----------|-----|----------|-----------|
293: | **Command count** | 67 + 88 workflows = 155 total | 19 commands | GSD depth |
294: | **Two-stage routing** | Namespace meta-skills (v1.40) | None | GSD (token savings) |
295: | **Workflow separation** | Separate `workflows/` directory | Commands = workflows | GSD (reusability) |
296: | **Size budget** | Tiered enforcement per file | None | GSD |
297: | **Discovery mechanism** | Eager skill listing in system prompt | `hivemind-command-engine --action list_commands` | Hivemind (programmatic) |
298: | **Permission model** | Binary tools list (allow/not) | Granular allow/ask/ask | Hivemind |
299: | **Dispatch** | Native Task()/SubAgent calls | WaiterModel with dual-signal, task/delegate-task tools, session-stacking | Hivemind (flexibility) |
300: | **Subtask override** | Not supported | `subtask:true/false` + `agent` | Hivemind |
301: | **Runtime adaptation** | Install-time translation per runtime | Plugin-based with SDK composition | Equal (different approaches) |
302: | **File format** | Markdown with YAML frontmatter | OpenCode primitive JSON/YAML | Different (both valid) |
303: 
304: ---
305: 
306: ## 9. ACTIONABLE RECOMMENDATIONS FOR HIVEMIND
307: 
308: ### RECOMMENDATION A: Namespace Meta-Skills (HIGH IMPACT)
309: 
310: **Problem:** Hivemind's 19 commands are listed flatly. As the list grows, token cost increases linearly.
311: 
312: **Solution:** Implement 3-4 namespace routers:
313: 
314: ```
315: /hm-workflow  → Routes: discuss / plan / execute / verify / gate
316: /hm-project   → Routes: milestone / audit / summary / stats
317: /hm-manage    → Routes: config / thread / update / help
318: /hm-explore   → Routes: explore / capture / research
319: ```
320: 
321: Each router body contains a routing table. The model sees 4 entries (~80 tokens) instead of 19 (~475 tokens).
322: 
323: **Concrete implementation:**
324: - Create `commands/gsd/ns-workflow.md`, `commands/gsd/ns-project.md`, etc.
325: - Each has description with pipe-separated keywords (≤ 60 chars)
326: - Body contains: `## Routing Table\n| If you want to… | Use this command |`
327: - All concrete commands remain directly invocable
328: 
329: ### RECOMMENDATION B: Workflow Separation (MEDIUM IMPACT)
330: 
331: **Problem:** Hivemind commands mix entry-point and orchestration logic in the same file.
332: 
333: **Solution:** Split commands into entry-points (thin) + workflows (orchestration):
334: 
335: ```
336: commands/hm-plan-phase.md     → 30 lines (loads workflow, passes args)
337: workflows/hm/plan-phase.md    → 400 lines (research → plan → verify loop)
338: ```
339: 
340: This enables:
341: - Multiple commands to share the same workflow
342: - Workflows to be refactored without changing user-facing syntax
343: - Size budgeting and progressive disclosure
344: 
345: ### RECOMMENDATION C: Size Budget Enforcement (LOW IMPACT)
346: 
347: **Problem:** No workflow file in Hivemind has a size limit. Files grow without constraint.
348: 
349: **Solution:** Adopt GSD's tiered size budget:
350: 
351: | Tier | Limit | Applies to |
352: |------|-------|-----------|
353: | XL | 1700 lines | orchestrators (phase-loop, coordinating-loop) |
354: | LARGE | 1500 lines | multi-step workflows (phase-execution) |
355: | DEFAULT | 1000 lines | single-purpose workflows |
356: | STRICT | 500 lines | discuss/explore workflows |
357: 
358: ### RECOMMENDATION D: Command Inventory Test (LOW IMPACT)
359: 
360: GSD has `tests/command-count-sync.test.cjs` that locks command count against the filesystem. Adding a new command without updating INVENTORY.md fails CI. Hivemind should add a similar drift-guard for `.opencode/commands/` vs a master inventory.
361: 
362: ---
363: 
364: ## 10. KEY TAKEAWAYS
365: 
366: 1. **GSD's 67/88 split is the right ratio** — thin commands + fat workflows. Hivemind's 19 mixed files should follow this pattern.
367: 2. **Namespace routing is a 90% token savings** — trivial to implement, massive impact on system prompt density.
368: 3. **Workflow size budget enforcement** prevents context bloat and forces decomposition.
369: 4. **Hivemind's permission model + WaiterModel are strictly superior** to GSD's binary tool lists + Task() calls. Never regress on these.
370: 5. **GSD's platform adaptation at install time** (transforming commands per runtime) is a pattern Hivemind might adopt for its `bootstrap-init` tool.

(End of file - total 370 lines)
</content>
```

---

## Assistant (Build · MiMo-V2.5-Pro (Precision) · 8.4s)

_Thinking:_

Now I have a thorough understanding of the context. Let me also read the ROADMAP.md and current state to understand the phase progress.

Bây giờ tôi đã đọc đủ context. Để tôi đọc thêm ROADMAP và STATE để biết chính xác chúng ta đang ở đâu.

**Tool: glob**

**Input:**
```json
{
  "pattern": ".planning/ROADMAP.md"
}
```

**Output:**
```
/Users/apple/hivemind-plugin-private/.planning/ROADMAP.md
```

**Tool: glob**

**Input:**
```json
{
  "pattern": ".planning/STATE.md"
}
```

**Output:**
```
/Users/apple/hivemind-plugin-private/.planning/STATE.md
```

**Tool: glob**

**Input:**
```json
{
  "pattern": ".planning/phases/*/"
}
```

**Output:**
```
No files found
```

---

## Assistant (Build · MiMo-V2.5-Pro (Precision) · 6.0s)

_Thinking:_

Let me read the ROADMAP.md and STATE.md files to understand the current phase planning.

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/ROADMAP.md",
  "limit": 200
}
```

**Output:**
```
<path>/Users/apple/hivemind-plugin-private/.planning/ROADMAP.md</path>
<type>file</type>
<content>
1: <!-- generated-by: gsd-doc-writer -->
2: # Hivemind — Roadmap
3: 
4: **Created:** 2017-05-07  
5: **Status:** Active  
6: **Dependency order:** Phase 0 Governance Baseline → Bootstrap/Init CLI → Shell/PTY Control-Plane Runway (CP-PTY-00..04) → Meta-Concept Migration → Routing Foundation → Agent Workflows → User Experience
7: 
8: ---
9: 
10: ## Phase 0 — Governance Baseline (Blocking Entry Gate)
11: 
12: Phase 0 is the current blocking gate before BOOT, MCM, and f-04 continuation. It is docs/governance only and produces L5 evidence. It does not authorize runtime code moves, `.opencode/` primitive edits, `.hivemind/` state edits, package changes, tests, or commits.
13: 
14: | Phase | Title | Status | Depends On | Blocks |
15: |-------|-------|--------|------------|--------|
16: | P0-01 | Runtime Identity Taxonomy | ✅ COMPLETE | Source evidence inspection | BOOT, MCM, f-04 |
17: | P0-02 | Source Plane Architecture | ✅ COMPLETE | P0-01 | BOOT, f-04, source refactors |
18: | P0-03 | Config Contract | ✅ COMPLETE | P0-01 | BOOT config, MCM config integration |
19: | P0-04 | HiveFiver Meta-Authoring Architecture | ✅ COMPLETE | P0-01 | MCM and HF command families |
20: | P0-05 | Phase 0 Governance Gate | ✅ COMPLETE | P0-01..P0-04 | All downstream continuation |
21: | P0-06 | Phase 0 Route/State Update | ✅ COMPLETE | P0-05 | BOOT/MCM/f-04 routing |
22: 
23: ### Phase 0 Canonical Naming
24: 
25: | Concept | Canonical value |
26: |---|---|
27: | Product | Hivemind |
28: | Package/bin | `hivemind` |
29: | Project type | harness |
30: | Platform | OpenCode |
31: | Legacy aliases | `opencode-harness`, `hivemind-tools` only when explicitly labeled legacy |
32: | Internal workflow tooling | GSD, not product identity |
33: 
34: ### Phase 0 Artifacts
35: 
36: - `.planning/architecture/hivemind-runtime-identity-taxonomy-2017-05-07.md`
37: - `.planning/architecture/hivemind-source-plane-architecture-2017-05-07.md`
38: - `.planning/config/hivemind-config-contract-2017-05-07.md`
39: - `.planning/architecture/hivefiver-meta-authoring-architecture-2017-05-07.md`
40: - `.planning/checklists/phase-0-governance-gate-2017-05-07.md`
41: - `.planning/roadmap/phase-0-gsd-route-2017-05-07.md`
42: 
43: Gate boundary: Phase 0 artifacts are L5 documentation/governance evidence. Runtime readiness remains FAIL/BLOCK until L1-L3 proof exists in later authorized phases.
44: 
45: ---
46: 
47: ## Active Workstream: Core Architecture (WS-CA)
48: 
49: | Phase | Title | Status | Depends On |
50: |-------|-------|--------|------------|
51: | CA-01 | configs.json Schema + Runtime Binding | ✅ DELIVERED | — |
52: | CA-02 | Behavioral Profile System + Mode Dispatch | ✅ DELIVERED | CA-01 |
53: | CA-03 | Workflow Toggle Runtime Binding | ✅ DELIVERED | CA-01 |
54: | CA-04 | **Bootstrap + State Ownership** (restructured) | 🔴 IN PROGRESS (Phase 0 gate passed) | CA-01, CA-02, CA-03 |
55: 
56: ### CA-04 Restructured Scope
57: 
58: Original "CRUD Ownership Modules + Lifecycle Verification" was premature — building plumbing before producers/consumers exist. Restructured to priority-ordered sub-phases:
59: 
60: | Sub-phase | Title | Rationale |
61: |-----------|-------|-----------|
62: | CA-04.1 | **Bootstrap CLI + Primitives Recovery** | D-CRUD-01: `npx hivemind init` creates `.hivemind/` + `.opencode/` structure. Postinstall restores primitives. Legacy alias: `npx opencode-harness init`. Fixes the "delete and lose everything" gap. |
63: | CA-04.2 | **Config Consumer Runtime Wiring** | D-BIND-03: Config fields must have verified consumers. `conversation_language` is traced as wired in L5 config traceability; `delegation_systems` remains without a verified runtime consumer. Fix or explicitly defer the remaining config → behavior gaps. |
64: | CA-04.3 | **State Directory Ownership Modules** | D-CRUD-05: Each `.hivemind/` subdirectory gets typed module. Tiered by mutation need (7 CRUD, 7 append, 6 read-only). Only AFTER bootstrap exists and tools write state. |
65: | CA-04.4 | **Lifecycle Audit + Gate Criteria Synthesis** | Synthesize gate-l3-lifecycle-integration references/ from ARCHITECTURE.md. Audit all 34 src/lib modules. Fix only CA-04 CRUD-owner violations. |
66: 
67: ### Option 3 — Sector Governance Foundation (Docs-Only Route)
68: 
69: Option 3 is a new docs-only foundation route layered onto CA-04 governance work. It does **not** replace CA-04 and does **not** claim runtime implementation readiness.
70: 
71: | Phase | Title | Status | Depends On |
72: |-------|-------|--------|------------|
73: | O3-01 | OMO Architecture Adaptation Research / Context Alignment | ✅ DOCS-ONLY FOUNDATION | CA-04 context |
74: | O3-02 | Hivemind Sector AGENTS.md Target Architecture | ✅ DOCS-ONLY FOUNDATION | O3-01 |
75: | O3-03 | Command vs Workflow vs Session/Task Continuity Map | ✅ DOCS-ONLY FOUNDATION | O3-01 |
76: | O3-04 | Sector AGENTS.md Docs Implementation | ✅ DELIVERED (9 sector AGENTS.md, lifecycle+spec PASS, evidence DUAL) | O3-01, O3-02, O3-03, pre-phase checklist pass |
77: 
78: Option 3 implementation phases (in dependency order):
79: 
80: | # | Phase | Status |
81: |---|-------|--------|
82: | 1 | Sector AGENTS.md docs | ✅ DELIVERED (O3-04, 9 files committed) |
83: | 2 | Config realm cleanup | ✅ DELIVERED (traceability doc, dead code removed) |
84: | 3 | **Bootstrap/init CLI** | 🔴 IN PROGRESS — see BOOT workstream below; Phase 0 gate passed |
85: | 4 | Routing workflow foundation | ⬜ PENDING — f-04, blocked until Phase 0 + bootstrap complete |
86: | 5 | Session/task continuity management | ⬜ PENDING — blocked until typed owners + E2E proof |
87: 
88: Gate boundary: docs-only artifacts are L5 evidence. Runtime readiness: FAIL/BLOCK until L1-L3 runtime proof exists.
89: 
90: ---
91: 
92: ## Active Workstream: Bootstrap & Init CLI (WS-BOOT)
93: 
94: The Bootstrap CLI is a proper CLI toolbelt — not just `mkdir` + symlink. It provides project initialization, state recovery, primitives restoration, health checking, and rich terminal feedback. Phase 0 governance gate PASSED. BOOT-02 implementation summaries were reconciled by BOOT-02R, so BOOT-03 automation may resume. The package/bin identity is `hivemind`; `opencode-harness` and `hivemind-tools` are legacy aliases only.
95: 
96: | Phase | Title | Status | Depends On | Evidence Required |
97: |-------|-------|--------|------------|-------------------|
98: | BOOT-01 | Dependency Audit + Architecture | ✅ COMPLETE | — | L5 research docs |
99: | BOOT-02 | CLI Framework + Entry Point | ✅ COMPLETE — reconciled | BOOT-01 | L3 local verification summarized in `BOOT-02-SUMMARY.md` |
100: | BOOT-02R | Governance Reconciliation | ✅ COMPLETE — docs/governance only | BOOT-02 summary evidence | L5: ROADMAP/STATE/REQUIREMENTS agree on BOOT status |
101: | BOOT-03 | State Init (.hivemind/ creation) | ✅ COMPLETE | BOOT-02R | L3: `node bin/hivemind.cjs init --yes --root <temp>` creates structure |
102: | BOOT-04 | Primitives Recovery (.opencode/) | ✅ COMPLETE | BOOT-02 | L3: symlinks restored from `.hivefiver-meta-builder/` |
103: | BOOT-05 | Config Bootstrap + Defaults | ✅ COMPLETE | BOOT-02 | L3: configs.json initializes schema reference and runtime defaults resolve |
104: | BOOT-06 | Validation + Health Check | ✅ COMPLETE | BOOT-03, BOOT-04, BOOT-05 | L2-L3: built `hivemind doctor` reports ALL CHECKS PASS |
105: | BOOT-07 | End-to-End Proof | ✅ COMPLETE | BOOT-06 | L1-L3: clean temp project init/recover/doctor passed |
106: | BOOT-08 | Agent + Skill Integration | ✅ COMPLETE | BOOT-07 | L5: constitution + routing contracts |
107: | BOOT-09 | MVP Config Schema + Entry Init Verification | 🟡 IN PROGRESS — 2/3 plans complete (01, 03 done; 02 pending) | BOOT-08 | L2-L3: system.transform language injection + tool guard enforcement tests |
108: 
109: ### Shell / PTY Control-Plane Runway
110: 
111: The shell/PTY/background command lane is real and cross-cutting across `run-background-command`, PTY adapters, command delegation, SDK delegation, tool guards, lifecycle events, and future sidecar/tmux projection. It is not part of BOOT-02 runtime scope. The safe route is a docs/spec spike now and implementation only after BOOT-07 or explicit higher-risk authorization.
112: 
113: | Phase | Title | Status | Depends On | Evidence Required |
114: |-------|-------|--------|------------|-------------------|
115: | CP-PTY-00 | Shell / PTY Control-Plane Spike | ✅ COMPLETE — docs/spec only; may run in parallel with BOOT-03..05 | BOOT-02R | L5: context, research, requirements, spec, route artifacts |
116: | CP-PTY-01 | Background Shell Control-Plane MVP | 🔵 READY | CP-PTY-00, BOOT-07 | L2-L3: permission-gated command lifecycle tests; L1 preferred E2E proof |
117: | CP-PTY-02 | SDK Session Delegation Integration | ⬜ NOT PLANNED | CP-PTY-01, BOOT-08 | L2-L3: async/sync child-session dispatch, context injection, completion detection tests |
118: | CP-PTY-03 | Agent/Subagent Background Task Coordination | ⬜ NOT PLANNED | CP-PTY-02, BOOT-08 | L2-L3: wave dispatch, completion-looping, queue dedup, cascade cleanup tests |
119: | CP-PTY-04 | Cross-Cutting Shell Integration | ⬜ NOT PLANNED | CP-PTY-03, MCM-03 | L2-L3: context integration, journal recording, permission propagation, hook guards tests |
120: | CP-CMD-01 | Command Architecture Classification | ✅ COMPLETE | WS-SR | L3: deprecated tools removed from `.opencode/`, slash command tool enhanced with SDK-aligned schema, `list_commands` action added, CQRS pattern formalized |
121: | SC-PTY-01 | Read-Only Terminal Projection | ⬜ DEFERRED | CP-PTY-01, Q2 sidecar decision confirmation | L2-L3: read-only projection proof |
122: 
123: ### Session Tracker Runway
124: 
125: The session tracker replaces the broken event-tracker (`src/task-management/journal/event-tracker/`) with a new `src/features/session-tracker/` module that captures session lifecycle, messages, tool calls, and delegation hierarchies into structured `.hivemind/session-tracker/` artifacts. Uses OpenCode SDK v2 hooks (`chat.message`, `tool.execute.after`, `event`, `experimental.session.compacting`). Fixes 12 catalogued flaws (F1-F12) from `.hivemind/audit/flaw-register-2017-05-10.json`.
126: 
127: | Phase | Title | Status | Depends On | Evidence Required |
128: |-------|-------|--------|------------|-------------------|
129: | CP-ST-01 | Session Tracker Revamp | ✅ COMPLETE | SR-10 (COMPLETE), BOOT-07 (COMPLETE) | L2-L3: 256 tests pass, dual-gate, depth computation, fork inheritance |
130: | CP-ST-02 | Session Tracker Deep Fix — Remaining | ✅ COMPLETE | CP-ST-01 (COMPLETE) | 3/3 plans, 12 commits — PendingDispatchRegistry + Three-Gate + PreToolUse + Delegator Attribution + Orphan Cleanup |
131: | CP-ST-03 | Architecture Detox — Plugin Purification + Event-Tracker Excision | ✅ COMPLETE | CP-ST-02 (COMPLETE) | 2/2 plans, 14 commits — plugin.ts 267 LOC (pure assembly), event-tracker excised (22 files deleted), 33 new unit tests |
132: | CP-ST-04 | Session-Tracker Architecture Fix — Root-Cause Gate Fix | ✅ COMPLETE | CP-ST-02 (COMPLETE), CP-ST-03 (COMPLETE) | 3/3 plans, 15 commits — key mismatch fix, root-only dirs, hierarchy manifest, 338/340 tests pass |
133: | CP-ST-05 | Session Data Loss Prevention — Classification + Quarantine + Refactor | ✅ COMPLETE | CP-ST-04 (COMPLETE) | 3/3 waves, 12 commits — Gate 0 classification, journey recording, quarantine protocol, monolith refactor (982→807 LOC), 362/364 tests |
134: 
135: **Plans (CP-ST-04):** 3 plans in 3 waves
136: - [x] CP-ST-04-01-PLAN.md — Fix PendingDispatchRegistry + handleChatMessage Classification Order (Wave 1) — requirements: D-01, D-04, D-05
137: - [x] CP-ST-04-02-PLAN.md — Directory Architecture Fix — Root-Only Dirs + HierarchyIndex Root Tracking (Wave 2) — requirements: D-02, D-03, D-05, D-08
138: - [x] CP-ST-04-03-PLAN.md — Hierarchy Manifest + Immediate I/O + Cleanup (Wave 3) — requirements: D-06, D-07, D-08 ✅
139: 
140: **Plans (CP-ST-03):** 3 plans in 3 waves
141: - [x] CP-ST-03-01-PLAN.md — Event-Tracker Excision + Documentation Sync (Wave 1) — requirements: AC-01..AC-13
142: - [x] CP-ST-03-02-PLAN.md — Plugin.ts Composition Purification (Wave 2) — requirements: AC-14..AC-29
143: - [ ] CP-ST-03-03-PLAN.md — Verification + Migration Cleanup (Wave 3)
144: 
145: **Plans (CP-ST-01):**
146: - [x] CP-ST-01-01-PLAN.md — Module Foundation + Types (Wave 1)
147: - [x] CP-ST-01-02-PLAN.md — Capture Handlers + Index Writers (Wave 2)
148: - [x] CP-ST-01-03-PLAN.md — Integration + Recovery + Tool (Wave 3)
149: - [x] CP-ST-01-04-PLAN.md — Hardening + Verification (Wave 4)
150: 
151: **Plans (CP-ST-02):** 3 plans in 3 waves
152: - [x] CP-ST-02-01-PLAN.md — PendingDispatchRegistry + Three-Gate Classification (Wave 1) — requirements: AC-02, AC-05 ✅
153: - [x] CP-ST-02-02-PLAN.md — PreToolUse Hook + Server API Polling (Wave 2) — requirements: AC-10 ✅
154: - [x] CP-ST-02-03-PLAN.md — Delegator Attribution + Cleanup (Wave 3) — requirements: AC-01, AC-03, AC-06, AC-08, AC-09 ✅
155: 
156: ### Delegate-Task Ecosystem Runway (INSERTED)
157: 
158: Toàn diện refactor và revamp delegate-task ecosystem. Phase này cover TẤT CẢ những gì cấu thành nên delegate-task: tools, engines, tracking, completion detection, TUI injection, resume/chaining, agent discovery, permissions inheritance, compact survival. Bao gồm 4 tài liệu cốt lõi: SPEC.md, CONTEXT.md, RESEARCH.md, PATTERN.md.
159: 
160: **Root cause:** delegate-task v1 PROVEN BROKEN — dispatch OK nhưng child sessions freeze sau khi load skills (0 tool calls sau 30 phút). Cần research sâu OpenCode SDK API (sessions, messages, hooks, permissions, agent discovery, primitives loading) và source-code platform architecture trước khi thiết kế v2.
161: 
162: | Phase | Title | Status | Depends On | Evidence Required |
163: |-------|-------|--------|------------|-------------------|
164: | CP-DT-01 | **Delegate-Task Ecosystem Revamp** | RE-OPENED / RUNTIME BLOCKED — forensic report `report-20260517-105705.md` disproved the `context.task` runtime seam; Plans 01-05 remain historical implementation artifacts requiring gap remediation | CP-ST-06 (session-tracker tracking knowledge), CP-PTY-00 (shell/PTY context) | L5: SPEC + CONTEXT + RESEARCH + PATTERN exist; L2-L3 tests exist but mock/injected native Task evidence is not L1 proof; L1 smoke UAT is blocking before completion |
165: 
166: **Plans:**
167: - [x] CP-DT-01-01-PLAN.md — Wave 1: Foundation modules (dispatcher, slot-manager, agent-resolver, monitor, escalation-timer, notification-router, lifecycle, retry-handler) ✅ executed; summary `CP-DT-01-01-SUMMARY.md`; tests 22/22 pass; typecheck clean
168: - [x] CP-DT-01-02-PLAN.md — Wave 2: Coordinator wiring + CompletionDetector v2 dual-signal ✅ executed; summary `CP-DT-01-02-SUMMARY.md`; focused tests 13/13 pass; completion regression 36/36 pass; typecheck clean
169: - [x] CP-DT-01-03-PLAN.md — Wave 3: Tool layer rewrite (delegate-task v2 + delegation-status v2 + Zod schemas) ✅ executed; summary `CP-DT-01-03-SUMMARY.md`; v2 tool tests 20/20 pass; legacy tool regression 51/51 pass; typecheck clean
170: - [x] CP-DT-01-04-PLAN.md — Wave 4: manager.ts decomposition + auto-loop + ralph-loop + chaining ✅ executed; summary `CP-DT-01-04-SUMMARY.md`; focused tests 13/13 pass; delegation regression 32/32 pass; session-tracker regression 426/426 pass; typecheck clean
171: - [x] CP-DT-01-05-PLAN.md — Wave 5: Plugin wiring + integration tests + regression check + JSDoc audit ✅ executed; summary `CP-DT-01-05-SUMMARY.md`; focused integration/e2e tests 18/18 pass; delegation/tool regression 112/112 pass; session-tracker regression 426/426 pass; typecheck clean
172: - [ ] CP-DT-01-06-RUNTIME-GAPS-2017-05-18-PLAN.md — Wave 6: Runtime-truth gap closure. Correct docs/spec/gates first, then remediate Plans 01-05 in order so no code path depends on false `context.task` runtime seam.
173: 
174: #### CP-DT-01 Scope
175: 
176: 1. **Research sâu OpenCode SDK:** sessions API, promptAsync, children, status, messages, compact, client-server architecture, tools/commands/instances/files
177: 2. **Research OpenCode Plugin SDK:** hooks (chat.message, tool.execute.after, event, session.compacting), permissions (regex granularity, main↔sub inheritance, modes all/primary/subagent)
178: 3. **Research agent discovery:** opencode.json, .opencode/agent(s) (số ít + số nhiều), global primitives, edge cases
179: 4. **Research OpenCode source-code:** platform architecture cho primitives, custom tools, commands, agent skills, MCP server tools
180: 5. **Deliverables:**
181:    - SPEC.md — yêu cầu hệ thống delegate-task v2 (execution verification, progressive polling, failure detection, completion detection, TUI injection, resume/chaining, abort/cancel/restart, concurrent slots)
182:    - CONTEXT.md — bối cảnh hiện tại (broken v1, session-tracker knowledge, OpenCode Task vs delegate-task)
183:    - RESEARCH.md — nghiên cứu OpenCode SDK/API/source-code findings
184:    - PATTERN.md — patterns thiết kế cho async delegation với controlled monitoring
185: 
186: #### CP-DT-01 Key Requirements
187: 
188: - **Execution verification:** 60s fallback nếu không có first tool call → fail level 1
189: - **Progressive polling:** 30s→45s→60s→90s→120s→180s thin-line status injections vào main session context
190: - **4-level failure detection:** 60s→120s→180s→300s escalating, sau 300s ngừng injection
191: - **Completion detection:** tool activity >1min + assistant last message + file changes (optional)
192: - **TUI injection:** success/failure notifications append trực tiếp vào main session message stream
193: - **10 concurrent delegation slots** per main session, route notifications đúng session
194: - **Abort/cancel/restart/redirect** tools cho delegator agent
195: - **Resume existing sessions:** reuse session ID, context preserved, không lặp prompt
196: - **Sequential task chaining:** completed task session ID → new task inherits context
197: - **Compact survival:** handle context window overflow in delegations
198: - **Session-tracker knowledge áp dụng** vào delegation tracking
199: 
200: ### BOOT-01 Scope: Research & Architecture Decision

(Showing lines 1-200 of 825. Use offset=201 to continue.)
</content>
```

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/STATE.md"
}
```

**Output:**
```
<path>/Users/apple/hivemind-plugin-private/.planning/STATE.md</path>
<type>file</type>
<content>
1: ---
2: gsd_state_version: 1.0
3: milestone: v1.0
4: milestone_name: milestone
5: status: planned
6: last_updated: "2026-05-23T19:53:46.625Z"
7: progress:
8:   total_phases: 29
9:   completed_phases: 11
10:   total_plans: 51
11:   completed_plans: 47
12:   percent: 92
13: ---
14: 
15: <!-- generated-by: gsd-doc-writer -->
16: 
17: # Hivemind — State
18: 
19: **Last updated:** 2026-05-24
20: **Last advance:** Phase 23.1 Plan 01 complete — session-tracker race condition fixed: sync constructCoreDependencies() before delegation wiring, defensive [Harness] logging, .then(cleanup) removed. Typecheck clean, 400/400 unit tests pass.
21: **Current focus:** Phase 23 (remaining notification bugs) + Phase 23.1 (session-tracker investigation — Plan 01 done)
22: **Next recommended run:** Continue debug session `ses_1aa92e240ffeEpaWmxUFFxFh67` for U2/U3/double-wrapped fixes. Route Phase 23.1 via gsd-research-chain for session-tracker investigation.
23: 
24: ---
25: 
26: ## Current Status
27: 
28: **Active phase:** Phase 23 — Notification Architecture Fix + Holistic Tool Surface Documentation (Group 1, HIGHEST PRIORITY).
29: **Sub-phase:** Phase 23.1 — Session-Tracker SDK Dispatch Investigation — investigate root cause session-tracker miss child sessions (U4/U5 failed 4 UAT rounds).
30: **Phase 18:** ✅ COMPLETE — 4/4 plans.
31: **Phase 19:** ✅ COMPLETE — Non-destructive remediation.
32: **Phase 20:** ✅ COMPLETE — Dependency cleanup (11 deps removed, yaml consolidated, react→optional).
33: **P00.5:** ✅ COMPLETE — Dead code sweep + dist rebuild (merged into Phase 19).
34: **Phase 21:** ✅ COMPLETE — Session-Tracker Design Fix (6/6 plans, 15/15 REQs).
35: **Phase 21.1:** ✅ COMPLETE — execute-slash-command SDK redesign, deferred subtask dispatch.
36: **Phase 21.2:** 🟡 PROTOTYPE — front-agent switching; L3 unit/typecheck pass, L1 live UAT pending.
37: **Phase 22:** ✅ COMPLETE — Coordination Status + Error Unification. 9/9 REQs, 3/3 gates PASS. 176/176 tests.
38: **Phase 23:** 🟡 ACTIVE — Notification Architecture Fix + Holistic Tool Surface Documentation + GSD Research Synthesis + Debt Registry. Fix CRITICAL synthetic:true notification bug, audit/rewrite ALL hm-* coordination skills + hivemind-power-on, create tool-surface differentiation + injection delivery patterns skills. SYNTHESIS: 6 GSD deep-dive documents, 25 debts/gaps registered and DEFERRED to owning phases (24-38). Phase 23 does NOT fix these debts — documentation only.
39: **Phase 24:** 📋 PENDING — Coordination Dispatch + Delegate-Task Fix (was P23, Depends: P23).
40: **Phase 25:** 📋 PENDING — Trajectory + Agent-Work-Contract Redesign (was P24, Depends: P23, P24).
41: **Phase 26:** 📋 PENDING — Pressure + Notification Redesign (was P25, Depends: P23, P24, P25).
42: **Phase 27:** 📋 PENDING — Routing + Intent Loop Foundation (Group 2, was P26).
43: **Phase 28:** 📋 PENDING — Hook Injection Plane Redesign (Group 2, was P27).
44: **Phase 29:** 📋 PENDING — Auto-Looping + PTY + Background Command Revamp (Group 2, was P28).
45: **Phase 30:** 📋 PENDING — Schema Kernel Cleanup (Group 3, was P29).
46: **Phase 31:** 📋 PENDING — Config Plane Redesign (Group 3, was P30).
47: **Phase 32:** 📋 PENDING — Shipped Primitives + Governance Wire (Group 3, was P31).
48: **Phase 33:** 📋 PENDING — Plugin.ts Decomposition (Group 4, was P32).
49: **Phase 34:** 📋 PENDING — Async I/O Conversion + Typed Errors (Group 4, was P33).
50: **Phase 35:** 📋 PENDING — Module Splits + Legacy Inventory (Group 4, was P34).
51: **Phase 36:** 📋 PENDING — Integration Verification (Group 4, was P35).
52: **Phase 37:** 📋 deferred — Fix sync-oss.yml workflow (was P36).
53: **Phase 38:** 📋 deferred — Package .opencode/ primitives for distribution (was P37).
54: **Phase 16 Plan 01:** ✅ COMPLETE — Extended 3 tool input schemas (filter-sessions on session-tracker, aggregate on session-context, get-manifest on session-hierarchy) + created session-view.schema.ts.
55: **Phase 16 Plan 02:** ✅ COMPLETE — Enhanced session-tracker.ts: removed silent 50KB skip, added >1MB file warnings, child .json search with 4-field extraction, filter-sessions action with hierarchy-manifest index strategy. typecheck clean, 18+236 tests pass.
56: **Phase 16 Plan 03:** ✅ COMPLETE — Added aggregate action to session-context tool: status aggregation (fast path via index) and subagentType aggregation (individual continuity files). GAP-3 closed. REQ-03 satisfied.
57: **Phase 16 Plan 04:** ✅ COMPLETE — Added get-manifest action to session-hierarchy tool: handleGetManifest reads hierarchy-manifest.json, returns flattened child list. GAP-2 closed. REQ-04 satisfied.
58: **Phase 16 Plan 05:** ✅ COMPLETE — Created hivemind-session-view.ts (124 LOC) with single `get` action reading concurrently from 3 data roots via Promise.all. Registered in plugin.ts (23 tools). REQ-06 satisfied. typecheck clean.
59: **Phase 16 Plan 06:** ✅ COMPLETE — Event-tracker deprecation cleanup: scanned all src/ + .opencode/skills/ for remnants, updated hm-l3-hivemind-engine-contracts (2 refs) and hm-l3-hivemind-state-reference (5 refs) with deprecation annotations. GAP-7 closed. REQ-07 satisfied.
60: **Phase 16 Plan 07:** ✅ COMPLETE — hivemind-power-on skill rewrite: SKILL.md v2.1.0 (236 lines) + 6 reference files updated with actual tool capabilities (filter-sessions, get-manifest, aggregate, hivemind-session-view). All aspirational content removed. Truthful resume guidance with SDK v2 dependency noted. All acceptance criteria pass. REQ-08 satisfied.
61: **CP-DT-01 status:** RE-OPENED / RUNTIME BLOCKED. Waves 1-5 delivered historical implementation artifacts, but runtime proof failed because OpenCode plugin `ToolContext` v1.15.4 has no `context.task` field.
62: **Health:** CP-DT-01 blocked until Wave 6 closes runtime-truth gaps. Required sequence: correct docs/spec/gates, reassess Plan 01/02 coordination contracts, rewrite Plan 03 tool contract, adjust Plan 04 loops/chaining, rebuild Plan 05 plugin/runtime-contract tests, then require L1-L3 evidence before any completion claim.
63: **CP-ST-04 status:** ✅ COMPLETE — 3 plans delivered (PendingDispatchRegistry + Classification, Directory Architecture, Hierarchy Manifest + Immediate I/O + Cleanup).
64: 
65: **CP-ST-05 status:** ✅ COMPLETE — Investigation phase, root causes identified, decisions D-CP05-01 through D-CP05-06 locked.
66: 
67: **CP-ST-06 status:** ✅ COMPLETE — All 5 plans delivered:
68: 
69: - Plan 01: Test Audit + TDD RED Tests ✅
70: - Plan 02: Root Cause Extraction (RC-1, RC-2, RC-3) ✅
71: - Plan 03: Retry Queue Implementation (RC-5) ✅
72: - Plan 04: Fix All Failing Tests (RC-6) ✅
73: - Plan 05: Runtime Preservation Fixes + Parent Task Result Capture ✅
74: - Runtime Fix: 06-RUNTIME-FAILURE-FIX-2026-05-17 — parent task result parsing, L2 hierarchy registration, unknownSub bootstrap guard, recovery reads child JSON ✅
75: - Code Review Fix: 06-REVIEW-FIX — CR-01 (error logging), CR-02 (fork child-copy logging), WR-01..WR-04, IN-01..IN-04 ✅
76: - Nyquist Audit: 5 gaps filled, 11 behavioral tests, VALIDATION.md ✅
77: 
78: **Verification evidence:**
79: 
80: - `npx vitest run tests/features/session-tracker/` → 418/418 pass (44 files)
81: - `npx tsc --noEmit` → clean
82: - `npm test` → 2221 pass, 5 pre-existing failures (unrelated: steering-engine, hooks, plugin, tools)
83: 
84: **Remaining runtime risk:** Parent task result capture and child `.json` preservation proven in tests, but live compact/resume needs UAT with a real long-haul session to confirm OpenCode task output format matches the parser.
85: 
86: Core workstreams delivered: SR restructuring (SR-0 through SR-10) — `src/lib/` removed, source planes reorganized. BOOT-01 through BOOT-08 complete. MCM-01/MCM-02 complete. CP-PTY-00 complete (docs/spec). CP-ST-04/05/06 complete (session tracker fully rewritten).
87: 
88: ## Project Reference
89: 
90: See: .planning/PROJECT.md (updated 2026-05-07)  
91: **Core value:** Agents build on each other's work across sessions  
92: **Current focus:** Phase 21 — Session-Tracker Design Fix (Group 1, HIGHEST PRIORITY)
93: 
94: **Docs-only foundation delivered:** Option 3 — Sector Governance Foundation completed. 9 sector AGENTS.md files, gate-cleared for docs scope. O3-01 through O3-04 all delivered. Runtime readiness remains blocked (by design).
95: 
96: **Package naming:** `package.json` names package/bin as `hivemind`. `opencode-harness` and `hivemind-tools` are legacy aliases only unless explicitly labeled.
97: 
98: **Canonical identity:** Product Hivemind; package/bin `hivemind`; project type harness; current platform OpenCode; GSD is internal workflow tooling, not product identity.
99: 
100: ---
101: 
102: ## What's Delivered
103: 
104: | Component | Status | Details |
105: |-----------|--------|---------|
106: | Build system | ✅ | tsc clean, typecheck passes, dist/ produces correctly |
107: | Test suite | ✅ | 125 test files, 1767 tests, 2 failures (README heading assertions) |
108: | 24 custom tools | ✅ | Registered in plugin.ts, Zod schemas, CQRS write-side |
109: | 6 hook types | ✅ | Event observers, system/messages transforms, tool guards |
110: | configs.json schema | ✅ | 29 fields, readConfigs()/writeConfigs(), lazy-cached subscriber |
111: | Behavioral profiles | ✅ | 3 modes → profile mapping, wired into hooks/delegation/gates |
112: | Toggle gates | ✅ | 6 toggles wired, 4 @future-consumer annotated, 4 deferred |
113: | Delegation engine | ✅ | WaiterModel dispatch, dual-signal completion, PTY/SDK lanes |
114: | Continuity persistence | ✅ | Deep-clone-on-read, session journal, Q6 state root migration |
115: | 89 agents | ✅ | L0/L1/L2/L3 hierarchy, hm-* + hf-* lineages |
116: | 123 active skill directories | ✅ | Current primitive inventory excludes `.gitkeep`; lineage counts require MCM doctor proof before shipping claims |
117: | 19 commands | ✅ | start-work, plan, deep-init, ultrawork, harness-doctor, etc. |
118: | Agent/skill integration constitution | ✅ | BOOT-08: lineage, permissions, hierarchy, routing contracts (L5 governance) |
119: | Agent migration verification | ✅ | MCM-01: 56 shipped agents (45 hm-* + 11 hf-*) classified and discoverable |
120: | Skill migration verification | ✅ | MCM-02: 48 shipped skills (35 hm-* + 13 hf-*) classified and discoverable |
121: | Session Tracker Root Cause Rewrite | ✅ | CP-ST-06: 6 root causes fixed, 418/418 tests pass, retry queue, runtime preservation, parent task result capture |
122: 
123: ---
124: 
125: ## What's Broken / Missing
126: 
127: | Issue | Severity | Action |
128: |-------|----------|--------|
129: | **Bootstrap/recovery E2E proof complete** — BOOT-02 through BOOT-07 passed local clean-state proof | 🟢 RESOLVED | Maintain regression coverage |
130: | **Config consumer gap remains** — `conversation_language` is traced as wired in config traceability, but `delegation_systems` has no runtime consumer | 🔴 CRITICAL | Phase 0 config contract + CA-04.2: wire or explicitly defer dead config fields |
131: | **Shell/PTY command lane fully scoped** — CP-PTY-00 spike complete, CP-PTY-01..04 phases defined covering command-process, SDK session, coordination, and cross-cutting integration | 🟡 HIGH | CP-PTY-01 ready to execute; 02-04 planned |
132: | **`messages-transform.ts` dead code** — 67 LOC, zero imports, confirmed dead Phase 35 | 🟡 HIGH | Delete file |
133: | **plugin.ts at 447 LOC** — 100 LOC target, needs split | 🟡 HIGH | Extract hook/tool registration modules |
134: | **12 stale modules** — exist but no consumers | 🟡 HIGH | Document or wire (see SRC-MODULE-AUDIT) |
135: | **f-04 auto-routing MISSING** — no intent classification, no workflow router | 🔴 CRITICAL | Wave 3: design from skeleton §5.2 |
136: | **E2E tests MISSING** — 1767 unit tests, zero integration | 🟡 HIGH | Add at least delegation smoke test |
137: | **Lifecycle gate criteria MISSING** — references/ empty | 🟡 HIGH | CA-04.4: synthesize from ARCHITECTURE.md |
138: | **`.hivemind/` ownership gap** — 17/19 dirs no typed module | 🟡 MEDIUM | CA-04.3: after bootstrap |
139: | **`asString` duplication** — **RESOLVED** (continuity.ts copy removed in prior phase) | 🟢 RESOLVED | Already consolidated |
140: | **storeCache singleton** — prevents isolated testing | 🟢 LOW | Refactor continuity.ts |
141: 
142: ---
143: 
144: ## Decisions Record
145: 
146: | ID | Decision | Status |
147: |----|----------|--------|
148: | Q1-Q6 | Validation decisions 2026-04-25 | Locked |
149: | D-CONF-01..05 | configs.json schema and loading | Locked |
150: | D-BIND-01..03 | Schema-to-runtime binding | Locked (BIND-03 still requires consumer proof; `conversation_language` traced as wired, `delegation_systems` unresolved) |
151: | D-CRUD-01..05 | CRUD lifecycle | Locked (CRUD-01 MISSING, CRUD-05 partial) |
152: | D-LIFECYCLE-01..02 | Lifecycle integration requirements | Locked |
153: | D-WS-01..03 | Workstream consolidation (5→3) | Locked |
154: | CA-04 RESTRUCTURE | Split into 4 sub-phases with correct dependency order | NEW — 2026-05-07 |
155: | O3-DOCS-FOUNDATION | Option 3 Sector Governance Foundation is docs-only L5 evidence layered onto CA-04, not a runtime implementation claim | NEW — 2026-05-07 |
156: | WS-MCM | Meta-Concept Migration workstream added — 4 phases (MCM-01 through MCM-04) for agent/skill migration, config integration, and end-user customization | NEW — 2026-05-07 |
157: | D-MCM-01 | gsd-* agents/skills are NEVER shipped — dev tooling boundary enforced | NEW — 2026-05-07 |
158: | D-CP-ST-04-01 | PendingDispatchRegistry byParent reverse index (D-04) + handleChatMessage classification-first (D-05) delivered; 4 atomic commits, 37 new tests, 0 regressions | NEW — 2026-05-13 |
159: | D-CP-ST-04-02 | Directory Architecture Fix: HierarchyIndex root main tracking (D-03, D-08) + root-only directory creation (D-02) + ChildWriter root main routing (D-03); 6 atomic TDD commits, 25 new tests, 318/320 pass | NEW — 2026-05-15 |
160: | D-CP-ST-04-03 | Hierarchy manifest system: hierarchy-manifest.json coexists with session-continuity.json — manifest is flattened authoritative lookup; continuity index preserves hierarchical tree; 3 TDD commits, 27 new tests, 338/340 pass | NEW — 2026-05-15 |
161: | D-CP-ST-04-03a | registerChild() must be called before getRootMain() in writeImmediateChildFile to resolve root main for fresh children (otherwise getRootMain returns undefined) | NEW — 2026-05-15 |
162: | D-CP-ST-04-03b | createChildFile in tool-capture intentionally overwrites immediate write — richer metadata from PostToolUse supersedes initial record | NEW — 2026-05-15 |
163: | P0-GOV | Phase 0 Governance Baseline blocks BOOT/MCM/f-04 until identity, source-plane, config, meta-authoring, and route gates pass | NEW — 2026-05-07 |
164: | P0-ID | Product is Hivemind; package/bin are `hivemind`; harness is project type; OpenCode is platform; `opencode-harness` and `hivemind-tools` are legacy aliases only | NEW — 2026-05-07 |
165: | BOOT-02R | BOOT-02 implementation summaries were reconciled before BOOT-03 automation resumed | COMPLETE — 2026-05-08 |
166: | CP-PTY-00 | Shell/PTY/background command control-plane spike is docs/spec only and may run parallel with BOOT continuation | NEW — 2026-05-08 |
167: | CP-PTY-01 | Runtime shell/PTY control-plane implementation is blocked on BOOT-07 unless explicitly authorized earlier | NEW — 2026-05-08 |
168: | CP-PTY-02 | SDK session delegation integration — async/sync child-session dispatch, context injection, completion detection | NEW — 2026-05-08 |
169: | CP-PTY-03 | Agent/subagent background task coordination — wave dispatch, completion-looping, queue dedup, lifecycle cascade | NEW — 2026-05-08 |
170: | CP-PTY-04 | Cross-cutting shell integration — wires background commands to session/task/journal/hooks/permissions | NEW — 2026-05-08 |
171: | DA-IN-02 | Fork handling uses reference-copy (not deep-copy) for child delegations — both sessions share same child .json files; T-12-11 mitigated; copyForkedChildren() in SessionTracker | NEW — 2026-05-12 |
172: | D-PHASE12-COMPLETE | All 14 CP-ST-01-REVIEW.md findings resolved with verifiable evidence across 3 waves; pipeline verified end-to-end | NEW — 2026-05-12 |
173: | CP-CMD-01 | Command architecture classified: CQRS pattern (read: hivemind-command-engine, write: execute-slash-command), deprecated tools removed from `.opencode/` (violates soft meta-concepts-only rule), `list_commands` action added | NEW — 2026-05-13 |
174: | D-CP-ST-06-01 | Test audit complete: 25 failing tests all classified as 'rewrite' (0 keep, 0 delete); RC-3 (API mismatch) accounts for 19/25 root causes; 22 new integration tests across 4 files; 8 TDD RED tests for RetryQueue awaiting CP-ST-06-03 implementation | NEW — 2026-05-16 |
175: | D-CP-ST-06-COMPLETE | CP-ST-06 fully complete: 5/5 plans, 418/418 tests pass, typecheck clean, all code review findings fixed (CR-01, CR-02, WR-01..04, IN-01..04), Nyquist gaps filled (5 gaps, 11 tests). 6 root causes fixed: RC-1 (hierarchy reverse-order), RC-2 (nested child status), RC-3 (gate:none→unknownSub), RC-4 (lastMessage truncation), RC-5 (error swallowing→retry queue), RC-6 (stale tests). Runtime preservation: parent task result capture, L2 hierarchy registration, unknownSub bootstrap guard, recovery reads child JSON | NEW — 2026-05-17 |
176: | D-15-05 | computeTotalToolActivityDuration pure function + 4-condition isComplete (stalled + assistant + fileChanges + sufficientDuration); totalToolActivityDurationMs in result; minTotalToolActivityDurationMs in options (default 60s); 9 new tests, 31 total, all pass | NEW — 2026-05-19 |
177: | D-16-01 | Schema extension: filter-sessions on session-tracker, aggregate on session-context, get-manifest on session-hierarchy; new session-view.schema.ts with SessionViewInputSchema for hivemind-session-view tool | NEW — 2026-05-19 |
178: | D-16-06 | Event-tracker deprecation cleanup: src/ references in AGENTS.md comments and plugin.ts migration code left intact (legitimate historical/migration documentation); .opencode/skills/ references updated with deprecation annotations; evals.json not modified (test fixture per D-16) | NEW — 2026-05-19 |
179: | D-16-04 | get-manifest action on session-hierarchy tool: handleGetManifest reads hierarchy-manifest.json via safeSessionPath + readFile + JSON.parse. Returns flattened child list with status/delegatedBy/depth/turnCount/createdAt. No new imports. | NEW — 2026-05-20 |
180: | D-17-01 | Plan 01 audit complete: 32 files audited (shared/, config/, routing/), zero dead code, zero architecture violations, 3 minor test-gaps in shared/ (tool-response.ts, task-status.ts, tool-helpers.ts lack dedicated test files). 3 RESEARCH.md corrections: routing HAS test coverage (9 files), compiler.ts is 410 LOC (not ~500), profile filename corrected. Findings report ready for Phase 18 consumption. | NEW — 2026-05-20 |
181: | D-17-03 | Plan 03 audit complete: 47 files audited (coordination/ 31 files, task-management/ 16 files). Found 5 dead files (entire recovery/ submodule, 763 LOC, zero runtime consumers). Corrected 3 RESEARCH.md inaccuracies: sdk-delegation/ HAS tests (tests/lib/sdk-delegation.test.ts), command-delegation/ HAS tests (tests/lib/command-delegation.test.ts), manager.ts is 362 LOC (not ~500). storeCache singleton confirmed as known context-rot (ARCHITECTURE.md line 266). asString duplication confirmed resolved. All active submodules have adequate test coverage. | NEW — 2026-05-20 |
182: | D-18-01 | Deleted dead toggle-gates module (83 LOC) + test file — 0 external importers | NEW — 2026-05-20 |
183: | D-18-02 | Deleted dead steering-engine (609 LOC, 3 files + empty subdirs) — 0 external importers | NEW — 2026-05-20 |
184: | D-18-03 | Deleted dead runtime-detection module (195 LOC, 2 files) + test — 0 external importers | NEW — 2026-05-20 |
185: | D-18-04 | Deleted dead recovery/ submodule (763 LOC, 5 source + AGENTS.md + .gitkeep + 4 tests) — 0 external importers, session-tracker recovery test preserved | NEW — 2026-05-20 |
186: | D-18-05 | Extracted storeCache singleton from continuity/index.ts into store-cache.ts with get/set/reset API — 4 TDD tests, all 2382 suite tests pass | NEW — 2026-05-20 |
187: | D-18-06 | Narrowed command-engine barrel: replaced export * with 3 explicit named exports (executeCommandEngineAction, listCommands, discoverCommandBundles). 4 internal routing functions removed from public API. typecheck clean, 2382/2384 tests pass. | NEW — 2026-05-21 |
188: | D-18-07 | Updated boundary manifests for Phase 18 cleanup: STRUCTURE.md removed steering-engine/ and recovery/, added store-cache.ts; ARCHITECTURE.md removed same from component tables; CONCERNS.md removed 3 stale recovery concerns, added cleanup annotation; AGENTS.md removed recovery from task-management comment. All grep acceptance criteria pass. | NEW — 2026-05-21 |
189: | D-19-01 | Schema cleanup corrected: `permission.schema.ts` deleted as prototype; `tool-definition.schema.ts` migrated to `tool.schema.ts`; `skill-metadata.schema.ts` preserved due active consumers. | NEW — 2026-05-21 |
190: | D-19-02 | Historical trace locked: `session-classification-hook.ts`, `schema-normalizer.ts`, and `delegation-packet.ts` were intended-but-unwired feature gaps, not meaningless dead code; future rebuild must use requirements f-04c, REQ-ST-12, and F-09a. | NEW — 2026-05-21 |
191: | D-19-03 | Final cleanup removed stale `concurrency-key` test, empty `src/kernel`/`src/harness` folders, and synchronized ROADMAP/STATE/codebase/AGENTS drift before clean dist rebuild. | NEW — 2026-05-21 |
192: | D-23.1-01 | Sync constructCoreDependencies() before setupDelegationModules() eliminates race window where onChildSessionCreated callbacks silently dropped session events before Object.assign. 3 atomic commits across index.ts + plugin.ts. | COMPLETE — 2026-05-24 |
193: 
194: ---
195: 
196: ## Phase 0 Governance Baseline Progress
197: 
198: | Artifact | Status | Evidence level |
199: |---|---|---|
200: | `.planning/architecture/hivemind-runtime-identity-taxonomy-2026-05-07.md` | ✅ COMPLETE | L5 docs/governance |
201: | `.planning/architecture/hivemind-source-plane-architecture-2026-05-07.md` | ✅ COMPLETE | L5 docs/governance |
202: | `.planning/config/hivemind-config-contract-2026-05-07.md` | ✅ COMPLETE | L5 docs/governance |
203: | `.planning/architecture/hivefiver-meta-authoring-architecture-2026-05-07.md` | ✅ COMPLETE | L5 docs/governance |
204: | `.planning/checklists/phase-0-governance-gate-2026-05-07.md` | ✅ COMPLETE | L5 docs/governance |
205: | `.planning/roadmap/phase-0-gsd-route-2026-05-07.md` | ✅ COMPLETE | L5 docs/governance |
206: | `.planning/ROADMAP.md` update | ✅ COMPLETE | L5 docs/governance |
207: | `.planning/STATE.md` update | ✅ COMPLETE | L5 docs/governance |
208: 
209: Runtime readiness remains blocked until later L1-L3 proof exists. Phase 0 governance gate PASSED.
210: 
211: ---
212: 
213: ## BOOT-02 / BOOT-02R Progress (Phase 0 Gate Passed — Authorized)
214: 
215: | Task | Status | File | LOC |
216: |------|--------|------|-----|
217: | T01 | ✅ COMPLETE | `src/lib/bootstrap-structure.ts` | 124 |
218: | T02 | ✅ COMPLETE | `src/tools/bootstrap-init.ts` | Summary evidence |
219: | T03 | ✅ COMPLETE | `src/tools/bootstrap-recover.ts` | Summary evidence |
220: | T04 | ✅ COMPLETE | `src/cli/commands/init.ts` | Summary evidence |
221: | T05 | ✅ COMPLETE | `src/cli/commands/doctor.ts` | Summary evidence |
222: | T06 | ✅ COMPLETE | `src/cli/commands/recover.ts` | Summary evidence |
223: | T07 | ✅ COMPLETE | `src/cli/commands/version.ts` | Summary evidence |
224: | T08 | ✅ COMPLETE | `src/cli/index.ts` (MODIFY) | Summary evidence |
225: | T09–T13 | ✅ COMPLETE | `tests/cli/commands/*.test.ts` | Summary evidence |
226: 
227: BOOT-02 phase-local summaries report implementation and verification evidence in the working tree. BOOT-02R reconciled the active governance truth; BOOT-03 is now the next BOOT phase.
228: 
229: ## CP-PTY Runway Progress
230: 
231: | Phase | Status | Evidence level | Notes |
232: |---|---|---|---|
233: | CP-PTY-00 | ✅ COMPLETE | L5 docs/spec | Context, research, requirements, spec, verification all passed |
234: | CP-PTY-01 | 🔵 READY | L2-L3 required | BOOT-07 complete, entry gate satisfied |
235: | CP-PTY-02 | ⬜ NOT PLANNED | L2-L3 required | SDK child-session delegation integration |
236: | CP-PTY-03 | ⬜ NOT PLANNED | L2-L3 required | Agent/subagent background task coordination |
237: | CP-PTY-04 | ⬜ NOT PLANNED | L2-L3 required | Cross-cutting shell integration (wires everything) |
238: | CP-CMD-01 | ✅ COMPLETE | L3 source | Command architecture classification, deprecated tools removed from .opencode/, slash command tool enhanced, list_commands action added |
239: | SC-PTY-01 | ⬜ DEFERRED | L2-L3 required | Read-only projection only after CP-PTY-01 and Q2 sidecar confirmation |
240: 
241: ## Session Tracker Runway Progress
242: 
243: | Phase | Status | Evidence level | Notes |
244: |---|---|---|---|
245: | CP-ST-01 | ✅ COMPLETE | L3 source | Session tracker revamp — initial implementation |
246: | CP-ST-02 | ✅ COMPLETE | L3 source | Deep fix remaining defects |
247: | CP-ST-03 | ✅ COMPLETE | L3 source | Architecture detox — event-tracker excision, plugin.ts purification |
248: | CP-ST-04 | ✅ COMPLETE | L3 source | Architecture fix — PendingDispatchRegistry, directory architecture, hierarchy manifest |
249: | CP-ST-05 | ✅ COMPLETE | L3 source | Data loss investigation — root cause analysis, 6 decisions locked |
250: | CP-ST-06 | ✅ COMPLETE | L3 source + L2 tests | Root cause rewrite — 6 RCs fixed, 418/418 tests, retry queue, runtime preservation |
251: | CP-DT-01 | ✅ EXECUTION COMPLETE | L5→L2-L3 | Delegate-Task Ecosystem Revamp — 5/5 plans executed; Plan 01-05 summaries complete; Plan 05 added total tool activity duration tracking (GAP-M3); review/validation/live-smoke gates pending |
252: 
253: ---
254: 
255: ## Accumulated Context
256: 
257: ### Roadmap Evolution
258: 
259: - **2026-05-08** — SR-00 through SR-10 phase directories created: 11 directories with `.gitkeep` registration under `.planning/phases/SR-*/`
260: - **2026-05-08** — WS-SR ROADMAP.md updated: improved phase descriptions with OMO kebab-case conventions, feature-module pattern (index.ts + types.ts + AGENTS.md per module), colocated tests, barrel exports, hierarchical AGENTS.md guidance, 500 LOC cap enforcement, verification commands per phase
261: - **2026-05-08** — STATE.md updated: current phase set to SR-0, health green, control mode set to managed autonomous loop, SR directories registered
262: - **2026-05-08** — Restructuring plan refined: `.planning/architecture/structure-restructuring-plan-2026-05-08.md` contains complete file mapping (current → target), 10-phase migration plan with risk assessment, rollback strategy, circular dependency resolution, verification commands
263: - **2026-05-12** — Phase 13 added: Fix all session-tracker defects with gatekeeping TDD SPEC-driven honest validation and regression prevention
264: - **2026-05-13** — CP-ST-03 phase created: Architecture Detox (event-tracker excision + plugin.ts purification). Plan 01 (Event-Tracker Excision) complete — 22 files deleted, 7 docs synced, EXCISION.md test (13 assertions) passes. Plan 02 (Plugin.ts Purification) complete — 7 inline closures extracted to 14 files, plugin.ts 330→267 LOC (19% reduction), 33 new unit tests all pass.
265: - Phase CP-ST-06 added: Session Tracker Root Cause Rewrite — triệt để rewrite 6 root causes + xóa 30 stale mock tests
266: - **2026-05-18** — Phase CP-DT-01 INSERTED after CP-ST-06: Delegate-Task Ecosystem Revamp — toàn diện refactor delegate-task (proven broken: child sessions freeze sau 30 phút, 0 tool calls). 4 deliverables: SPEC.md, CONTEXT.md, RESEARCH.md, PATTERN.md. Research sâu OpenCode SDK + source-code architecture trước khi design v2.
267: - Phase 16 added: Session-Tracker Tool Intelligence + Event-Tracker Deprecation Cleanup — Nâng cấp read-side tools, deprecate event-tracker, sửa hivemind-power-on skill
268: - **2026-05-21** — Phase 18 complete (4/4 plans). Gatekeeping: 3 gates clear, 2 WARNING findings.
269: - **2026-05-21** — **HARD RESTRUCTURING RUNWAY INSERTED**: Phases 19-25 before original Phases 19/20 (pushed to 27/28). Based on 4 initial research + 6 deep analysis agents (3,807 LOC) + full restructuring map (3,994 LOC). Phase 26 added as post-restructuring integration verification. Sequence: non-destructive → deps → async I/O → typed errors → plugin decomposition + module split → session-tracker split → legacy + test gaps + tool relocation + CQRS → integration verification → sync-oss.yml → package primitives.
270: - **2026-05-21** — **REORDERED per owner's 3-group framework**: Group 1 (Orchestration Design Fix, P21-P25) → Group 2 (Routing/Coordination, P26-P28) → Group 3 (Schema/Config, P29-P31) → Group 4 (Structural Cleanup, P32-P35) → P36-P37 independent. Based on 16 research artifacts (6,621 LOC), 6 deep-analysis reports, phase-reordering analysis (4 critical violations). Session-tracker FIRST with production evidence.
271: - Phase 21.1 inserted after Phase 21: Execute-Slash-Command SDK Redesign — agent switching, native SDK execution, primitive awareness, subtask wiring (URGENT)
272: 
273: ### Key Restructuring Decisions
274: 
275: | ID | Decision |
276: |----|----------|
277: | SR-D-01 | kebab-case everywhere — directories and files follow OMO naming conventions |
278: | SR-D-02 | Feature-module pattern — each module has `index.ts` (barrel), `types.ts`, `AGENTS.md` |
279: | SR-D-03 | Colocated tests — `manager.ts` + `manager.test.ts` in same directory (not separate `tests/`) |
280: | SR-D-04 | 500 LOC cap — modules exceeding 500 LOC (continuity.ts: 465, plugin.ts: 447, delegation-manager.ts: ~500) must be split |
281: | SR-D-05 | AGENTS.md at every level — hierarchical guidance from `src/AGENTS.md` down to individual module `AGENTS.md` |
282: | SR-D-06 | Circular dependency resolution — `primitive-scanners.ts ↔ primitive-registry.ts` and `runtime-validator.ts ↔ cross-primitive-validator.ts` resolved by extracting shared types |
283: | SR-D-07 | Rollback strategy — per-phase atomic commits; full rollback via `git checkout main && git branch -D refactor/structure-restructuring` |
284: 
285: ---
286: 
287: ## Next Actions
288: 
289: 1. **P00.5** 📋 — Non-destructive foundation sweep (delete 3 dead schemas, rebuild dist/, remove 2 legacy hooks).
290: 2. **Phase 21** 📋 — Session-Tracker Design Fix (Group 1, HIGHEST PRIORITY — fix F-01 temp leak, F-02 manifest wire, F-04/F-07/F-08 recovery).
291: 3. **Phase 22** 📋 — Coordination Status + Error Unification (Depends: P21).
292: 4. **Phase 23** 📋 — Coordination Dispatch + Delegate-Task Fix (Depends: P22). Includes CP-DT-01 runtime block resolution.
293: 5. **Phase 24** 📋 — Trajectory + Agent-Work-Contract Redesign (Depends: P23).
294: 6. **Phase 25** 📋 — Pressure + Notification Redesign (Depends: P23).
295: 7. **Phase 26** 📋 — Routing + Intent Loop Foundation (Group 2, Depends: P21-P25).
296: 8. **Phase 27** 📋 — Hook Injection Plane Redesign (Group 2, Depends: P26).
297: 9. **Phase 28** 📋 — Auto-Looping + PTY + Background Command Revamp (Group 2, Depends: P27).
298: 10. **Phase 29** 📋 — Schema Kernel Cleanup (Group 3, can run parallel to Groups 1-2).
299: 11. **Phase 30** 📋 — Config Plane Redesign (Group 3, Depends: P29).
300: 12. **Phase 31** 📋 — Shipped Primitives + Governance Wire (Group 3, Depends: P30).
301: 13. **Phase 32** 📋 — Plugin.ts Decomposition (Group 4, LAST — Depends: P21-P31 design fixes settled).
302: 14. **Phase 33** 📋 — Async I/O Conversion + Typed Errors (Group 4, Depends: P32).
303: 15. **Phase 34** 📋 — Module Splits + Legacy Inventory (Group 4, Depends: P33).
304: 16. **Phase 35** 📋 — Integration Verification (Group 4, Depends: P34).
305: 17. **Phase 36** 📋 — Fix sync-oss.yml workflow (deferred, Depends: P35).
306: 18. **Phase 37** 📋 — Package .opencode/ primitives (deferred, Depends: P36).
307: 19. **CP-PTY-01** — Background Shell Control-Plane MVP (after restructuring runway).
308: 
309: ## Option 3 Foundation Artifacts
310: 
311: - `.planning/research/omo-adaptation-architecture-2026-05-07.md`
312: - `.planning/architecture/hivemind-sector-agents-target-2026-05-07.md`
313: - `.planning/architecture/hivemind-command-workflow-session-map-2026-05-07.md`
314: - `.planning/architecture/sector-agents-docs-implementation-plan-2026-05-07.md`
315: - `.planning/checklists/pre-phase-omo-adaptation-2026-05-07.md`
316: 
317: Runtime readiness: FAIL/BLOCK until L1-L3 runtime proof exists
318: 
319: ## Phase 0 Governance Artifacts
320: 
321: - `.planning/architecture/hivemind-runtime-identity-taxonomy-2026-05-07.md`
322: - `.planning/architecture/hivemind-source-plane-architecture-2026-05-07.md`
323: - `.planning/config/hivemind-config-contract-2026-05-07.md`
324: - `.planning/architecture/hivefiver-meta-authoring-architecture-2026-05-07.md`
325: - `.planning/checklists/phase-0-governance-gate-2026-05-07.md`
326: - `.planning/roadmap/phase-0-gsd-route-2026-05-07.md`
327: 
328: All Phase 0 artifacts are L5 documentation/governance evidence only.
329: 
330: ## Current Control Artifacts
331: 
332: - `.planning/roadmap/managed-autonomous-loop-2026-05-07.md`
333: - `.planning/lifecycle/lifecycle-overview-2026-05-07.md`
334: - `.planning/roadmap/shell-pty-control-plane-route-2026-05-08.md`
335: 
336: ---
337: *State updated: 2026-05-21 for cluster-based restructuring reordering*

(End of file - total 337 lines)
</content>
```

---

## Assistant (Build · MiMo-V2.5-Pro (Precision) · 37.6s)

_Thinking:_

Now I have a comprehensive understanding of the project's current state. Let me synthesize and provide my analysis.

Current status:
- Phase 23 is ACTIVE (Notification Architecture Fix + Tool Surface Documentation)
- Phase 23.1 is a sub-phase (Session-Tracker SDK Dispatch Investigation)
- 40+ phases still pending (Phases 24-38)
- 25 debts/gaps registered in DEBTS-REGISTER, deferred to Phases 24-38

The user's 5 clusters of issues:

**Cluster 1: Routing system thông qua commands và skills (parsing, workflows, references, templates, agent/subagent dispatch)**
- Root issues: thiếu commands/references/templates, thiếu document artifact governance, agents yếu kém chất lượng

**Cluster 2: Document/Artifact governance (naming, pathing, format, dependency validation)**
- Root issue: C-5 in DEBTS-REGISTER — "Document/Artifact Naming & Pathing Governance Collapse"
- Defers to: Phase 31 (Config Plane Redesign + Artifact Governance)

**Cluster 3: Agent quality overhaul (L0-L3 hierarchy redesign, permissions, execution patterns)**
- Root issues: agent context pruning, loop/gate/hierarchy/checkpoint logic sai chỗ, cần restructure agents
- Various debts: C-1 (delegate-task vs task proxy war), H-2 (hm-l2-build underspecified), M-1 (L0 max skills), etc.

**Cluster 4: Distributed tooling và runtime features (session-tracker, delegation-status, coordination, agent-work-contract, trajectory, injection)**
- These are already existing or being developed in Phases 24-25-26

**Cluster 5: .opencode/ primitives management, asset distribution, shipping**
- Root issue: shipped-with primitives management sai, cần schema-based assets management

Let me map these to the existing phases and propose ordering.

The existing phase ordering:
- Group 1 (P21-P25): Orchestration Design Fix — HIGHEST
- Group 2 (P26-P28): Routing/Coordination
- Group 3 (P29-P31): Schema/Config
- Group 4 (P32-P35): Structural Cleanup
- P36-P37: Independent

My recommended cluster ordering based on the analysis:

**Cluster A (HIGHEST PRIORITY): Agent Quality & Consistency Overhaul**
This maps to the user's Cluster 3. Agents are the foundation. Without quality agents, routing, artifact creation, and everything else fails. This aligns with existing P21-P25 (Group 1).
- Fix agent definitions: permissions, tool access, temperature, size limits
- Consolidate agent hierarchy (remove L1, make L0 sole front-facing)
- Make all agents "all" mode with hidden non-front-facing
- Proper execution patterns in agent profiles

**Cluster B (HIGH PRIORITY): Document/Artifact Governance System**
This maps to Cluster 2. Before routing can work, artifacts must have standardized format, naming, and dependency tracking.
- This aligns with elements of P31 (Config Plane Redesign + Artifact Governance)
- But needs to be moved EARLIER — artifacts are foundation for routing

**Cluster C (HIGH PRIORITY): Command/Workflow Routing System**
This maps to Cluster 1. Two-stage namespace routing, workflow separation, command inventory.
- Aligns with P26-P28 (Group 2: Routing/Coordination)
- But depends on Cluster B (artifact governance) completing first

**Cluster D (MEDIUM PRIORITY): Runtime Features Stabilization**
Maps to Cluster 4. session-tracker, delegation-status, coordination, trajectory, contracts.
- These are already mostly built (CP-ST phases done, CP-DT partially done)
- Need stabilization and integration with the new agent/model

**Cluster E (LOWEST PRIORITY): Shipped Primitives & Distribution**
Maps to Cluster 5. Asset management, schema-based primitives, shipping.
- Aligns with P37, P38
- Should be last

Now, looking at the existing phases and where to insert:

Phase 24 (Coordination Dispatch + Delegate-Task Fix) — needed for Cluster D
Phase 25 (Trajectory + Agent-Work-Contract Redesign) — needed for Cluster D
Phase 26 (Pressure + Notification Redesign) — needed for Cluster D
Phase 27 (Routing + Intent Loop Foundation) — needed for Cluster C
Phase 28 (Hook Injection Plane Redesign) — needed for Cluster C
Phase 29 (Schema Kernel Cleanup) — needed for Cluster E
Phase 30 (Config Plane Redesign) — needed for Cluster B
Phase 31 (Shipped Primitives + Governance Wire) — needed for Cluster B+E
Phase 32-38 — needed for Cluster E

My recommendation:
1. The user's Cluster 3 (Agent Quality) needs a new phase INSERTED after P23 and before P24
2. Cluster B (Document/Artifact Governance) needs to be MOVED from P31 to earlier — insert as a new phase before P27
3. Cluster C (Routing) stays at P27-P28 but depends on B completing first
4. Cluster D (Runtime Features) stays at P24-P26
5. Cluster E (Shipping) stays at P32-P38

New proposed ordering:
1. P24 (Coordination Dispatch + Delegate-Task Fix) — existing, Cluster D
2. **NEW Phase: Agent Quality & Hierarchy Redesign** (inserted after P24) — Cluster 3
3. **NEW Phase: Document Artifact Governance** (inserted after Agent phase) — Cluster 2
4. P25 (Trajectory + Agent-Work-Contract Redesign) — existing, Cluster D
5. P26 (Pressure + Notification Redesign) — existing, Cluster D
6. P27 (Routing + Intent Loop Foundation) — existing, Cluster C
7. P28 (Hook Injection Plane Redesign) — existing, Cluster C
8. P29 (Schema Kernel Cleanup) — existing, Cluster E
9. **REVISED P30: Config + Artifact Governance** (expanded from Config Plane Redesign) — Cluster B
10. P31 (Shipped Primitives + Governance Wire) — existing, Cluster E
11. P32-P38 — existing, Cluster E

Actually, let me be more precise about what the user is asking. They're asking me to tell them the ORDER of clusters and whether new phases are needed. They're at Phase 23.2 with 40+ phases remaining.

Let me provide a concise, well-structured answer in Vietnamese per the language governance.

Sau khi phân tích tài liệu Phase 23, ROADMAP, STATE, DEBTS-REGISTER và GSD research synthesis, đây là thứ tự cluster và đề xuất phases mới:

## Thứ tự Cluster

### Cluster A: Agent Quality & Hierarchy Redesign (Cluster 3 của bạn)
**→ Cần phase MỚI, chèn sau Phase 24**

Lý do: Đây là foundational blocker cho mọi thứ khác. Agent hiện tại có quality kém, tool permissions sai, L1 agent tồn tại không cần thiết. Các debts: C-1 (delegate-task vs task war), H-2 (hm-l2-build 86 lines), M-1 (8 skills vs max 3), M-3 (domain mismatch), L-2/L-3 (temp/size violations). **Phải fix trước khi routing, artifact governance, hay shipping có thể hoạt động.**

Yêu cầu phase mới:
- `P24.1 — Agent Hierarchy Restructure` — Remove L1, L0 sole front-facing, restructure L2/L3 by domain not depth, fix permissions/tools/temp/size
- `P24.2 — Agent Profile Quality Enforcement` — Rewrite ALL hm-* agents with proper execution flows, success metrics, artifact contracts

### Cluster B: Document/Artifact Governance (Cluster 2 của bạn)
**→ Cần phase MỚI, chèn sau Cluster A, trước P27**

Lý do: C-5 trong DEBTS-REGISTER mô tả vấn đề này (CRITICAL). Hiện tại defer đến Phase 31 nhưng đó là sai lầm — routing (Cluster C) cần artifact governance. GSD có standardized structure (CONTEXT.md, RESEARCH.md, PLAN.md, SUMMARY.md, VERIFICATION.md) mà Hivemind thiếu.

- `P26.1 — Artifact Naming & Pathing Convention` — Standardize format, naming, yaml frontmatter cho mọi artifact
- `P26.2 — Artifact Dependency & Gatekeeping` — Cross-reference validation, gatekeeping loops, dependency chain

### Cluster C: Routing System (Cluster 1 của bạn)
**→ Phases P27-P28 hiện tại, nhưng move lên sau P26**

Lý do: GSD research chỉ ra two-stage namespace routing (6 routers → 67 commands) tiết kiệm ~90% tokens. Hivemind cần `hm-workflow`, `hm-project`, `hm-manage` routers. Workflow separation (thin commands + fat workflows) cũng là pattern cần adopt.

Không cần phase mới — P27 (Routing + Intent Loop) và P28 (Hook Injection) đã cover cluster này, nhưng cần expand scope.

### Cluster D: Runtime Features Stabilization (Cluster 4 của bạn)
**→ Phases P24-P26 hiện tại, giữ nguyên**

Lý do: session-tracker đã hoàn thành (CP-ST-01..06). delegate-task đang RE-OPENED (CP-DT-01). trajectory (P25) và pressure (P26) đã có phase. **Giữ nguyên thứ tự.**

### Cluster E: Primitives Distribution (Cluster 5 của bạn)
**→ Phases P31-P38 hiện tại, giữ nguyên (cuối cùng)**

Lý do: Schema-based asset management và shipped primitives là cuối cùng vì architecture phải ổn định trước.

---

## Thứ tự đề xuất (Revised)

| Thứ tự | Phase | Cluster | Lý do |
|--------|-------|---------|-------|
| 1 | **P24** (hiện tại) | D | Coordination Dispatch fix — foundational runtime |
| 2 | **P24.1 MỚI** | A (Agent) | Agent hierarchy restructure — BLOCKING cho mọi thứ |
| 3 | **P24.2 MỚI** | A (Agent) | Agent quality rewrite |
| 4 | **P25** (hiện tại) | D | Trajectory + Contracts |
| 5 | **P26** (hiện tại) | D | Pressure + Notification |
| 6 | **P26.1 MỚI** | B (Documents) | Artifact naming/governance — trước routing |
| 7 | **P26.2 MỚI** | B (Documents) | Artifact gatekeeping/dependency |
| 8 | **P27** (hiện tại, **mở rộng**) | C (Routing) | Routing + Intent Loop + Namespace Meta-Skills |
| 9 | **P28** (hiện tại, **mở rộng**) | C (Routing) | Hook Injection + Workflow Separation |
| 10 | **P29-P31** (hiện tại) | E | Schema/Kernel/Config/Primitives |
| 11 | **P32-P38** (hiện tại) | E | Structural cleanup, shipping |

**Tổng phase mới cần thêm:** 4 (P24.1, P24.2, P26.1, P26.2)
**Phase hiện tại cần mở rộng scope:** 2 (P27, P28)

Điểm critical nhất: **Cluster A (Agent Quality) phải xử lý NGAY sau P24**, trước khi chạm vào routing hay artifact governance. Agent hiện tại đang broken ở multiple dimensions — C-1 (delegate-task vs task conflict), C-3 (hallucinated `websearch` tool), H-2 (build agent 86 lines), M-1 (8 skills vs max 3 constraint). Đây là foundational rot khiến mọi routing/document effort sẽ built trên nền móng sai.

---

## User

vậy @gsd-roadmapper và @gsd-advisor-researcher để đưa vào roadmap và state rồi tạo folders cho nó trước đi

---

## Assistant (Build · MiMo-V2.5-Pro (Precision) · 11.2s)

_Thinking:_

The user wants me to:
1. Use the `gsd-roadmapper` agent to update the ROADMAP.md and STATE.md with the new phases I proposed
2. Use the `gsd-advisor-researcher` to research/adjust the proposed phase ordering

But wait - I'm the front-facing agent according to AGENTS.md. I should delegate these tasks. Let me also load appropriate skills first.

Actually, re-reading the instructions more carefully:
- "do not use generic agents - use gsd-* agents only"
- "If the agents recieve GSD command, all they must is to act following it."

The user is saying to use `gsd-roadmapper` and `gsd-advisor-researcher` subagents.

Let me delegate both tasks in parallel since they're independent... but the rules say "DO NOT ALLOW MORE THAN 2 PARALLEL TASK DELEGATION" - so 2 is fine.

Let me also load the relevant skills first. Actually, since I'm delegating, the skills would be loaded by the subagents themselves.

Let me craft the prompts for both agents carefully, following the rules:
- DO NOT SHOW THE SPECIALIST WHAT AND HOW TO IMPLEMENT
- Show HOW TO PROCESS, WHAT TO EXPECT AS RESULTS, SETTING CONSTRAINTS AND BOUNDARIES
- Clear success metrics
- Announce they are subagents

Let me think about what each agent needs:

**gsd-roadmapper**: This is a GSD agent that creates/updates ROADMAP.md. It needs to:
1. Read current ROADMAP.md and STATE.md
2. Understand the new phase ordering proposal
3. Update ROADMAP.md with new phases
4. Update STATE.md
5. Create phase folders with .gitkeep

**gsd-advisor-researcher**: This agent researches a single gray area decision and returns a structured comparison table with rationale. It needs to:
1. Evaluate the proposed phase ordering
2. Compare the "fix agent quality before routing" approach vs alternative orderings
3. Return a structured comparison

Let me delegate both in parallel.

**Tool: skill**

**Input:**
```json
{
  "name": "gsd-roadmapper"
}
```

**Error:**
```
Skill "gsd-roadmapper" not found. Available skills: Agent Development, Command Development, Skill Development, accessibility, agent-browser, agent-md-refactor, agent-orchestrator, ai-sdk, api-design, architecture-patterns, ask-questions-if-underspecified, autonomous-loops, bash-master, best-practices, breakdown-epic-arch, breakdown-epic-pm, breakdown-feature-prd, breakdown-plan, breakdown-test, btw, clarify, clean-architecture, clean-code, code-optimizer, completion-detection, core-web-vitals, create-agentsmd, create-gsd-extension, create-mcp-server, create-skill, create-workflow, critical-thinking-logical-reasoning, cross-cutting-change-mgmt, customize-opencode, database-migration, debug-like-expert, decompose-into-slices, deep-research, dependency-upgrade, design-an-interface, dispatching-parallel-agents, distill, doc-prd, drizzle-orm, elite-longterm-memory, feature-design-assistant, find-skills, folder-structure-blueprint-generator, forensics, frontend-design, gate-l3-evidence-truth, gate-l3-lifecycle-integration, gate-l3-spec-compliance, gcc, gh, git-commit, git-flow-branch-creator, github-workflows, grill-me, gsd-add-backlog, gsd-add-phase, gsd-add-tests, gsd-add-todo, gsd-ai-integration-phase, gsd-analyze-dependencies, gsd-audit-fix, gsd-audit-milestone, gsd-audit-uat, gsd-autonomous, gsd-capture, gsd-check-todos, gsd-cleanup, gsd-code-review, gsd-code-review-fix, gsd-complete-milestone, gsd-config, gsd-debug, gsd-discuss-phase, gsd-do, gsd-docs-update, gsd-eval-review, gsd-execute-phase, gsd-explore, gsd-extract-learnings, gsd-extract_learnings, gsd-fast, gsd-forensics, gsd-from-gsd2, gsd-graphify, gsd-health, gsd-help, gsd-import, gsd-inbox, gsd-ingest-docs, gsd-insert-phase, gsd-intel, gsd-join-discord, gsd-list-phase-assumptions, gsd-list-workspaces, gsd-manager, gsd-map-codebase, gsd-milestone-summary, gsd-mvp-phase, gsd-new-milestone, gsd-new-project, gsd-new-workspace, gsd-next, gsd-note, gsd-ns-context, gsd-ns-ideate, gsd-ns-manage, gsd-ns-project, gsd-ns-review, gsd-ns-workflow, gsd-pause-work, gsd-phase, gsd-plan-milestone-gaps, gsd-plan-phase, gsd-plan-review-convergence, gsd-plant-seed, gsd-pr-branch, gsd-profile-user, gsd-progress, gsd-quick, gsd-reapply-patches, gsd-remove-phase, gsd-remove-workspace, gsd-research-phase, gsd-resume-work, gsd-review, gsd-review-backlog, gsd-scan, gsd-secure-phase, gsd-session-report, gsd-set-profile, gsd-settings, gsd-ship, gsd-sketch, gsd-sketch-wrap-up, gsd-spec-phase, gsd-spike, gsd-spike-wrap-up, gsd-stats, gsd-thread, gsd-ui-phase, gsd-ui-review, gsd-ultraplan-phase, gsd-undo, gsd-update, gsd-validate-phase, gsd-verify-work, gsd-workspace, gsd-workstreams, handoff, harness, harness-writing, hf-l2-agent-composition, hf-l2-agents-and-subagents-dev, hf-l2-agents-md-sync, hf-l2-command-dev, hf-l2-command-parser, hf-l2-context-absorb, hf-l2-custom-tools-dev, hf-l2-delegation-gates, hf-l2-meta-builder-core, hf-l2-naming-syndicate, hf-l2-skill-router, hf-l2-skill-synthesis, hf-l2-use-authoring-skills, hivemind-power-on, hm-l2-brainstorm, hm-l2-completion-looping, hm-l2-coordinating-loop, hm-l2-cross-cutting-change, hm-l2-debug, hm-l2-feature-ecosystem, hm-l2-gate-orchestrator, hm-l2-lineage-router, hm-l2-phase-execution, hm-l2-phase-loop, hm-l2-product-validation, hm-l2-production-readiness, hm-l2-refactor, hm-l2-requirements-analysis, hm-l2-roadmap-maintainability, hm-l2-skill-router, hm-l2-spec-driven-authoring, hm-l2-test-driven-execution, hm-l2-user-intent-interactive-loop, hm-l3-deep-research, hm-l3-detective, hm-l3-hivemind-engine-contracts, hm-l3-hivemind-state-reference, hm-l3-integration-contracts, hm-l3-omo-reference, hm-l3-opencode-non-interactive-shell, hm-l3-opencode-platform-reference, hm-l3-opencode-project-audit, hm-l3-research-chain, hm-l3-subagent-delegation-patterns, hm-l3-synthesis, hm-l3-tech-context-compliance, hm-l3-tech-stack-ingest, hm-l3-tool-capability-matrix, i18n-localization, improve-codebase-architecture, iterative-loop, jsdoc-typescript-docs, lint, make-interfaces-feel-better, marketing-market-research, media-adaptation, memory-merger, multi-agent-coordination, notion-api, notion-research-documentation, observability, oh-my-openagent-reference, opencode-config-workflow, opencode-non-interactive-shell, opencode-platform-reference, orchestrator, parallel-debugging, parallel-deep-research, parallel-feature-development, planning-with-files, prompt-builder, prompt-optimizer, quality-gate-orchestration, quality-playbook, react-best-practices, refactor-plan, remembering-conversations, repomix-exploration-guide, repomix-explorer, requesting-code-review, requirements-analysis, review, security-review, session-foundation, shellcheck-configuration, simple, skill-creator, skill-judge, spec-to-code-compliance, spike-wrap-up, stack-l3-bun-pty, stack-l3-json-render, stack-l3-nextjs, stack-l3-vitest, stack-l3-zod, structured-autonomy-generate, structured-autonomy-implement, structured-autonomy-plan, subagent-delegation-patterns, tanstack-start-best-practices, tavily-best-practices, tavily-cli, tavily-crawl, tavily-extract, tavily-map, tavily-research, tavily-search, tdd, tdd-workflow, test, translation-expertise, translation-reframing-audience-shift, typescript-advanced-types, user-intent-patterns, userinterface-wiki, validate-implementation-plan, verify-before-complete, wave-execution, web-design-guidelines, web-quality-audit, workflow-patterns, write-docs, write-milestone-brief, writing-skills, zod
```

**Tool: skill**

**Input:**
```json
{
  "name": "gsd-advisor-researcher"
}
```

**Error:**
```
Skill "gsd-advisor-researcher" not found. Available skills: Agent Development, Command Development, Skill Development, accessibility, agent-browser, agent-md-refactor, agent-orchestrator, ai-sdk, api-design, architecture-patterns, ask-questions-if-underspecified, autonomous-loops, bash-master, best-practices, breakdown-epic-arch, breakdown-epic-pm, breakdown-feature-prd, breakdown-plan, breakdown-test, btw, clarify, clean-architecture, clean-code, code-optimizer, completion-detection, core-web-vitals, create-agentsmd, create-gsd-extension, create-mcp-server, create-skill, create-workflow, critical-thinking-logical-reasoning, cross-cutting-change-mgmt, customize-opencode, database-migration, debug-like-expert, decompose-into-slices, deep-research, dependency-upgrade, design-an-interface, dispatching-parallel-agents, distill, doc-prd, drizzle-orm, elite-longterm-memory, feature-design-assistant, find-skills, folder-structure-blueprint-generator, forensics, frontend-design, gate-l3-evidence-truth, gate-l3-lifecycle-integration, gate-l3-spec-compliance, gcc, gh, git-commit, git-flow-branch-creator, github-workflows, grill-me, gsd-add-backlog, gsd-add-phase, gsd-add-tests, gsd-add-todo, gsd-ai-integration-phase, gsd-analyze-dependencies, gsd-audit-fix, gsd-audit-milestone, gsd-audit-uat, gsd-autonomous, gsd-capture, gsd-check-todos, gsd-cleanup, gsd-code-review, gsd-code-review-fix, gsd-complete-milestone, gsd-config, gsd-debug, gsd-discuss-phase, gsd-do, gsd-docs-update, gsd-eval-review, gsd-execute-phase, gsd-explore, gsd-extract-learnings, gsd-extract_learnings, gsd-fast, gsd-forensics, gsd-from-gsd2, gsd-graphify, gsd-health, gsd-help, gsd-import, gsd-inbox, gsd-ingest-docs, gsd-insert-phase, gsd-intel, gsd-join-discord, gsd-list-phase-assumptions, gsd-list-workspaces, gsd-manager, gsd-map-codebase, gsd-milestone-summary, gsd-mvp-phase, gsd-new-milestone, gsd-new-project, gsd-new-workspace, gsd-next, gsd-note, gsd-ns-context, gsd-ns-ideate, gsd-ns-manage, gsd-ns-project, gsd-ns-review, gsd-ns-workflow, gsd-pause-work, gsd-phase, gsd-plan-milestone-gaps, gsd-plan-phase, gsd-plan-review-convergence, gsd-plant-seed, gsd-pr-branch, gsd-profile-user, gsd-progress, gsd-quick, gsd-reapply-patches, gsd-remove-phase, gsd-remove-workspace, gsd-research-phase, gsd-resume-work, gsd-review, gsd-review-backlog, gsd-scan, gsd-secure-phase, gsd-session-report, gsd-set-profile, gsd-settings, gsd-ship, gsd-sketch, gsd-sketch-wrap-up, gsd-spec-phase, gsd-spike, gsd-spike-wrap-up, gsd-stats, gsd-thread, gsd-ui-phase, gsd-ui-review, gsd-ultraplan-phase, gsd-undo, gsd-update, gsd-validate-phase, gsd-verify-work, gsd-workspace, gsd-workstreams, handoff, harness, harness-writing, hf-l2-agent-composition, hf-l2-agents-and-subagents-dev, hf-l2-agents-md-sync, hf-l2-command-dev, hf-l2-command-parser, hf-l2-context-absorb, hf-l2-custom-tools-dev, hf-l2-delegation-gates, hf-l2-meta-builder-core, hf-l2-naming-syndicate, hf-l2-skill-router, hf-l2-skill-synthesis, hf-l2-use-authoring-skills, hivemind-power-on, hm-l2-brainstorm, hm-l2-completion-looping, hm-l2-coordinating-loop, hm-l2-cross-cutting-change, hm-l2-debug, hm-l2-feature-ecosystem, hm-l2-gate-orchestrator, hm-l2-lineage-router, hm-l2-phase-execution, hm-l2-phase-loop, hm-l2-product-validation, hm-l2-production-readiness, hm-l2-refactor, hm-l2-requirements-analysis, hm-l2-roadmap-maintainability, hm-l2-skill-router, hm-l2-spec-driven-authoring, hm-l2-test-driven-execution, hm-l2-user-intent-interactive-loop, hm-l3-deep-research, hm-l3-detective, hm-l3-hivemind-engine-contracts, hm-l3-hivemind-state-reference, hm-l3-integration-contracts, hm-l3-omo-reference, hm-l3-opencode-non-interactive-shell, hm-l3-opencode-platform-reference, hm-l3-opencode-project-audit, hm-l3-research-chain, hm-l3-subagent-delegation-patterns, hm-l3-synthesis, hm-l3-tech-context-compliance, hm-l3-tech-stack-ingest, hm-l3-tool-capability-matrix, i18n-localization, improve-codebase-architecture, iterative-loop, jsdoc-typescript-docs, lint, make-interfaces-feel-better, marketing-market-research, media-adaptation, memory-merger, multi-agent-coordination, notion-api, notion-research-documentation, observability, oh-my-openagent-reference, opencode-config-workflow, opencode-non-interactive-shell, opencode-platform-reference, orchestrator, parallel-debugging, parallel-deep-research, parallel-feature-development, planning-with-files, prompt-builder, prompt-optimizer, quality-gate-orchestration, quality-playbook, react-best-practices, refactor-plan, remembering-conversations, repomix-exploration-guide, repomix-explorer, requesting-code-review, requirements-analysis, review, security-review, session-foundation, shellcheck-configuration, simple, skill-creator, skill-judge, spec-to-code-compliance, spike-wrap-up, stack-l3-bun-pty, stack-l3-json-render, stack-l3-nextjs, stack-l3-vitest, stack-l3-zod, structured-autonomy-generate, structured-autonomy-implement, structured-autonomy-plan, subagent-delegation-patterns, tanstack-start-best-practices, tavily-best-practices, tavily-cli, tavily-crawl, tavily-extract, tavily-map, tavily-research, tavily-search, tdd, tdd-workflow, test, translation-expertise, translation-reframing-audience-shift, typescript-advanced-types, user-intent-patterns, userinterface-wiki, validate-implementation-plan, verify-before-complete, wave-execution, web-design-guidelines, web-quality-audit, workflow-patterns, write-docs, write-milestone-brief, writing-skills, zod
```

---

## Assistant (Build · MiMo-V2.5-Pro (Precision) · 385.2s)

_Thinking:_

The skills for `gsd-roadmapper` and `gsd-advisor-researcher` aren't found as SKILL.md files. But these are agent types available in the `task` tool's subagent_type list:

- `gsd-roadmapper` - "Creates project roadmaps with phase breakdown..."
- `gsd-advisor-researcher` - "Researches a single gray area decision..."

So I need to use the `task` tool directly with these subagent types, not load them as skills.

Let me delegate both tasks in parallel using the task tool.

`gsd-roadmapper` và `gsd-advisor-researcher` là agents (không phải skills). Tôi sẽ delegate cả hai song song.

**Tool: task**

**Input:**
```json
{
  "description": "Update roadmap with new phases",
  "subagent_type": "gsd-roadmapper",
  "prompt": "Bạn là subagent gsd-roadmapper. Bạn được front-facing agent delegate để cập nhật ROADMAP.md và STATE.md với các phase mới, đồng thời tạo folders cho các phase đó.\n\n## Context\n\nDự án Hivemind đang ở Phase 23 (ACTIVE). 40+ phases còn lại pending (P24-P38). Sau phân tích document Phase 23 (15+ documents), DEBTS-REGISTER, ROADMAP.md, STATE.md, và GSD/OMO research synthesis, đã xác định cần thêm 4 phases mới và mở rộng scope 2 phases.\n\n### Thay đổi cần thực hiện\n\n**4 phases MỚI cần chèn:**\n\n1. **P24.1 — Agent Hierarchy Restructure** (Cluster A - Agent Quality)\n   - Depends On: P24\n   - Lý do: Agent hiện tại có quality kém — C-1 (delegate-task vs task conflict), C-3 (hallucinated `websearch`), H-2 (hm-l2-build 86 lines), M-1 (8 skills vs max 3), L-2/L-3 (temp/size violations). Remove L1 agent, L0 sole front-facing, restructure L2/L3 by domain.\n\n2. **P24.2 — Agent Profile Quality Enforcement** (Cluster A - Agent Quality)\n   - Depends On: P24.1\n   - Lý do: Rewrite ALL hm-* agents với proper execution flows, success metrics, artifact contracts.\n\n3. **P26.1 — Artifact Naming & Pathing Convention** (Cluster B - Documents)\n   - Depends On: P26\n   - Lý do: C-5 trong DEBTS-REGISTER — Document/Artifact Naming & Pathing Governance Collapse. Standardize format, naming, yaml frontmatter cho mọi artifact.\n\n4. **P26.2 — Artifact Dependency & Gatekeeping** (Cluster B - Documents)\n   - Depends On: P26.1\n   - Lý do: Cross-reference validation, gatekeeping loops, dependency chain cho artifacts.\n\n**2 phases hiện tại cần mở rộng scope:**\n\n5. **P27 — Routing + Intent Loop Foundation** (mở rộng)\n   - Thêm: Namespace meta-skills (two-stage routing), workflow separation pattern từ GSD research\n\n6. **P28 — Hook Injection Plane Redesign** (mở rộng)\n   - Thêm: Workflow size budget enforcement, command inventory drift-guard\n\n### Thứ tự đầy đủ (sau khi chèn)\n\n1. P24 (Coordination Dispatch + Delegate-Task Fix) — hiện tại\n2. P24.1 (Agent Hierarchy Restructure) — MỚI\n3. P24.2 (Agent Profile Quality Enforcement) — MỚI\n4. P25 (Trajectory + Agent-Work-Contract Redesign) — hiện tại\n5. P26 (Pressure + Notification Redesign) — hiện tại\n6. P26.1 (Artifact Naming & Pathing Convention) — MỚI\n7. P26.2 (Artifact Dependency & Gatekeeping) — MỚI\n8. P27 (Routing + Intent Loop Foundation - mở rộng) — hiện tại, mở rộng scope\n9. P28 (Hook Injection Plane Redesign - mở rộng) — hiện tại, mở rộng scope\n10. P29-P38 — giữ nguyên\n\n## Nhiệm vụ\n\n1. **Đọc** ROADMAP.md và STATE.md hiện tại\n2. **Cập nhật ROADMAP.md** — chèn 4 phases mới vào đúng vị trí, cập nhật status/dependency, mở rộng mô tả P27/P28\n3. **Cập nhật STATE.md** — thêm decision records cho các phase mới, cập nhật progress\n4. **Tạo folders** cho 4 phases mới với `.gitkeep`:\n   - `.planning/phases/24.1-agent-hierarchy-restructure/.gitkeep`\n   - `.planning/phases/24.2-agent-profile-quality-enforcement/.gitkeep`\n   - `.planning/phases/26.1-artifact-naming-convention/.gitkeep`\n   - `.planning/phases/26.2-artifact-dependency-gatekeeping/.gitkeep`\n5. **Commit atomic** — một commit cho ROADMAP+STATE update, một commit cho folder creation\n\n## Constraints\n\n- ROADMAP.md format: giữ nguyên định dạng hiện tại (dạng bảng)\n- STATE.md format: giữ nguyên YAML frontmatter + decision records\n- Phase numbering: dùng decimal (P24.1, P24.2, P26.1, P26.2)\n- Không thay đổi phases khác ngoài 4 phases mới + P27/P28 scope expansion\n- Atomic commit: mỗi thay đổi một commit riêng\n- Không xóa phase hiện tại, chỉ chèn thêm\n\n## Success Metrics\n\n- ROADMAP.md phản ánh đúng 4 phases mới + P27/P28 scope expansion\n- STATE.md updated với decision records\n- 4 folders tạo thành công với .gitkeep\n- Commit message format: `phase: what changed — why it matters`\n- Typecheck pass (nếu applicable)"
}
```

**Error:**
```
Tool execution aborted
```

**Tool: task**

**Input:**
```json
{
  "description": "Research phase ordering advisability",
  "subagent_type": "gsd-advisor-researcher",
  "prompt": "Bạn là subagent gsd-advisor-researcher. Bạn được delegate để nghiên cứu một gray area decision và trả về comparison table.\n\n## Decision: Thứ tự xử lý clusters — có nên fix Agent Quality trước Routing không?\n\n### Context\n\nDự án Hivemind là một OpenCode harness plugin (npm package). Hiện tại Phase 23 đang ACTIVE. 40+ phases pending (P24-P38). Một phân tích cluster đã được thực hiện với các cluster sau:\n\n- **Cluster A (Agent Quality)**: Fix agent hierarchy (remove L1, restructure L2/L3), agent profile quality enforcement, permissions/tools/temp/size violations\n- **Cluster B (Document/Artifact Governance)**: Standardize artifact naming, pathing, format, gatekeeping, dependency validation\n- **Cluster C (Routing System)**: Two-stage namespace routing, workflow separation, intent classification\n- **Cluster D (Runtime Features)**: session-tracker, delegation-status, trajectory, contracts — đã built, cần stabilization\n- **Cluster E (Shipping/Primitives)**: Schema-based asset management, distribution\n\n### Proposed Ordering\n\n1. P24 (Coordination Dispatch) → **Cluster D**\n2. P24.1 (Agent Hierarchy Restructure) → **Cluster A** ← **MỚI CHÈN**\n3. P24.2 (Agent Profile Quality) → **Cluster A** ← **MỚI CHÈN**\n4. P25 (Trajectory + Contracts) → Cluster D\n5. P26 (Pressure + Notification) → Cluster D\n6. P26.1 (Artifact Naming) → **Cluster B** ← **MỚI CHÈN**\n7. P26.2 (Artifact Gatekeeping) → **Cluster B** ← **MỚI CHÈN**\n8. P27 (Routing + Intent Loop) → **Cluster C** (mở rộng scope)\n9. P28-P38 → giữ nguyên\n\n### Gray Area: \"Fix Agent Quality trước Artifact Governance và Routing\"\n\nLập luận ủng hộ:\n- Agent là foundation — mọi routing/document effort built trên agent definitions\n- Agent hiện tại có quality kém: C-1 (delegate-task vs task conflict), C-3 (hallucinated `websearch`), H-2 (hm-l2-build 86 lines), M-1 (8 skills vs max 3)\n- Nếu agent sai, routing và artifact governance sẽ built trên nền móng sai\n\nLập luận phản đối:\n- Agent quality phase (P24.1, P24.2) là những phases lớn, có thể block progress\n- Runtime features (Cluster D) đã partial built — cần stabilize trước\n- Artifact governance (Cluster B) có thể làm parallel với agent work\n- Routing (Cluster C) phụ thuộc vào artifact governance, không phải agent quality\n\n### Cần nghiên cứu\n\n1. Đọc các tài liệu sau để gather evidence:\n   - `.planning/ROADMAP.md` — current phase structure\n   - `.planning/STATE.md` — current state\n   - `.planning/phases/23-notification-fix-and-tool-surface-docs/23-SYNTHESIS-REPORT-2026-05-23.md` — GSD/OMO analysis\n   - `.planning/phases/23-notification-fix-and-tool-surface-docs/23-DEBTS-REGISTER-2026-05-23.md` — debt register\n   - `.planning/codebase/ARCHITECTURE.md` — architecture\n   \n2. So sánh 3 approaches:\n   - **Approach A (Proposed)**: Agent → Artifact → Routing (sequential)\n   - **Approach B**: Artifact + Agent parallel → Routing (parallel clusters)\n   - **Approach C**: Giữ nguyên thứ tự hiện tại (P24→P25→P26→P27), chỉ mở rộng scope\n\n### Output\n\nTrả về structured comparison table với:\n\n| Dimension | Approach A | Approach B | Approach C |\n|-----------|-----------|-----------|-----------|\n| Risk level | ... | ... | ... |\n| Time to first value | ... | ... | ... |\n| Dependency conflicts | ... | ... | ... |\n| Re-work probability | ... | ... | ... |\n| Complexity | ... | ... | ... |\n\nKèm rationale cho recommendation.\n\n## Constraints\n\n- Chỉ đọc file, không ghi/sửa bất kỳ file nào\n- Evidence level: đánh dấu L1-L5 cho mỗi claim\n- Trả về kết quả dưới dạng structured report"
}
```

**Output:**
```
task_id: ses_1a0d0e1ebffeT7lAsuRDHg61H8 (for resuming to continue this task if needed)

<task_result>
I am **subagent gsd-advisor-researcher**. My role is to research the single assigned gray area and produce a structured comparison table. Here is my analysis based on the evidence gathered.

---

## Agent Quality vs Routing — Thứ tự xử lý clusters

### Evidence Index

| Claim | Source | Evidence Level |
|-------|--------|---------------|
| C-1: delegate-task vs task proxy war (CRITICAL, defers to P24) | `23-DEBTS-REGISTER.md:17-28` | L5 (documented) |
| C-3: hallucinated `websearch` (CRITICAL, defers to P32) | `23-DEBTS-REGISTER.md:45-55` | L5 (documented) |
| C-5: Artifact naming governance collapse (CRITICAL, defers to P31) | `23-DEBTS-REGISTER.md:73-111` | L5 (systemic) |
| M-1: 8 skills vs max 3 constraint (defers to P24) | `23-DEBTS-REGISTER.md:178-185` | L5 (documented) |
| M-3: Conductor domain mismatch → Routing (defers to P27) | `23-DEBTS-REGISTER.md:201-209` | L5 (documented) |
| M-7: context-mapper underspecified (defers to P27) | `23-DEBTS-REGISTER.md:249-257` | L5 (documented) |
| M-8: start-work routes despite L0 contradiction (defers to P24) | `23-DEBTS-REGISTER.md:263-269` | L5 (documented) |
| H-2: hm-l2-build only 86 lines, underspecified (defers to P30) | `23-DEBTS-REGISTER.md:127-133` | L5 (documented) |
| L-3: Agent files exceed 500-line limit | `23-DEBTS-REGISTER.md:353-363` | L5 (documented) |
| Routing layer currently = session-entry + behavioral-profile + command-engine only | `ARCHITECTURE.md:116-121` | L5 (architecture) |
| STATE.md current phase ordering: P24→P25→P26→P27→P28 | `STATE.md:39-44` | L5 (governance) |
| Route dependencies: Cluster A (Agent) + Cluster B (Artifact) → Cluster C (Routing) | Synthesis | Derived |

### Dependency Analysis

```
Cluster D (Runtime) ← independent of Agent Quality
                     ← depends on P23 notification fix (ACTIVE)

Cluster A (Agent Quality)
    ├─ C-1 fix (delegate-task vs task) → needed BEFORE routing agents work reliably
    ├─ M-3 (conductor domain mismatch) → DIRECT dependency for Routing (P27)
    ├─ M-7 (context-mapper underspecified) → DIRECT dependency for Routing (P27)
    └─ H-2, L-3, etc. → quality improvements, NOT blocking routing

Cluster B (Artifact Governance)
    ├─ C-5 (naming/pathing collapse) → DIRECT dependency for Routing (P27 routing artifacts)
    └─ Independent of Cluster A — no cross-dependency

Cluster C (Routing) ← requires BOTH A (agent definitions) AND B (artifact conventions)
```

**Key finding:** Cluster A (Agent Quality) and Cluster B (Artifact Governance) are **independent of each other** — no cross-dependency. Both feed into Cluster C (Routing) as prerequisites. This makes Approach B (parallel processing of A and B) architecturally valid.

---

## Comparison Table

| Dimension | Approach A (Agent→Artifact→Routing sequential) | Approach B (Agent + Artifact parallel → Routing) | Approach C (Giữ nguyên thứ tự, mở rộng scope P27) |
|-----------|-----------------------------------------------|--------------------------------------------------|---------------------------------------------------|
| **Risk level** | MEDIUM — sequential is safe but slow; agent phase lớn (5+ CRITICAL/HIGH debts) có thể block toàn bộ pipeline; routing chờ lâu | LOW-MEDIUM — Agent và Artifact không có cross-dependency (L5: verified độc lập); parallel không tạo conflict; risk chỉ ở coordination overhead | HIGH — Routing (P27) sẽ built trên foundation vỡ: C-1 không fix → routing agents nhận conflicting directives; C-5 không fix → routing artifacts sai naming/pathing ngay từ đầu |
| **Time to first value** | SLOW — 3 phases tuần tự (Agent → Artifact → Routing) trước khi Routing deliver value | FASTER — Agent + Artifact parallel, cả 2 deliver trong cùng window; Routing bắt đầu sau 1 window, không phải 2 | FASTEST — Routing starts at P27 như thường lệ, scope mở rộng |
| **Dependency conflicts** | LOW — sequential prevents conflicts by construction | LOW — verified Agent ⟂ Artifact (no cross-dependency). P24.1/P24.2 touch `.opencode/agents/`, P26.1/P26.2 touch `.planning/` + docs conventions — different surfaces | HIGH — M-3 (conductor domain mismatch) và M-7 (context-mapper underspecified) đều defer đến P27; nếu không fix agent definitions trước, routing built on misconfigured agents |
| **Re-work probability** | LOW — mỗi layer built on corrected foundation; fix agent trước → routing agents đúng → routing artifacts đúng | LOW-MEDIUM — parallel requires clear boundary enforcement. Agent P24.1/P24.2 phải không thay đổi artifact conventions, Artifact P26.1/P26.2 phải không thay đổi agent definitions. Rủi ro nếu boundary không được enforce | HIGH — Routing built on C-1 proxy war + C-5 naming chaos = rework khi agent quality được fix sau. C-1 ảnh hưởng trực tiếp routing agents (conductor). C-5 ảnh hưởng routing artifact pathing. |
| **Complexity** | 3 clusters, ~2-3 phases mỗi cluster, tuần tự — 9-12 files (`.opencode/agents/`, `.planning/`), zero file conflict risk | 2 clusters parallel (Agent + Artifact), mỗi cluster 1-2 phases — cần boundary enforcement giữa `.opencode/agents/` và `.planning/` docs. Risk: coordination overhead nếu parallel không được quản lý | 2 additional phases with expanded scope (P27) — nhưng risk cao vì foundation vỡ. Complexity ẩn: re-work sau khi fix agent = 3-5 files thay đổi lại |

---

### Rationale

Based on the evidence, **Approach B (Agent + Artifact parallel → Routing)** là phương án tối ưu nhất cho Hivemind.

**Lý do chính:**

1. **Cluster A và Cluster B không có dependency chéo** — Agent Quality sửa `.opencode/agents/` (agent definitions), Artifact Governance sửa naming conventions cho `.planning/` docs. Đây là 2 surface planes khác nhau hoàn toàn. Không có lý do architectural nào bắt chúng phải chạy tuần tự.

2. **Approach A (sequential) quá chậm** — Cluster A có ít nhất 5 debts CRITICAL/HIGH (C-1, C-3, H-2, M-1, M-8) và nhiều MEDIUM/LOW debts. Một phase "Agent Quality" duy nhất (P24.1 + P24.2) có thể kéo dài, block toàn bộ pipeline. STATE.md ghi nhận Phase 23 đã ACTIVE — mỗi phase chậm trễ ảnh hưởng đến 40+ phases pending.

3. **Approach C (giữ nguyên) có re-work probability cao nhất** — Routing (P27) phụ thuộc vào agent definitions (M-3: conductor domain mismatch, M-7: context-mapper underspecified) và artifact conventions (C-5: naming governance collapse). Nếu P27 chạy trước khi fix cả A và B, routing sẽ built trên foundation sai → rework khi A và B được fix sau.

4. **Boundary enforcement rõ ràng** — P24.1/P24.2 (Agent) chỉ touch `.opencode/agents/`. P26.1/P26.2 (Artifact) chỉ touch naming/pathing conventions trong docs. Không có file conflict. Coordination overhead thấp.

5. **Runtime Cluster D (P24 gốc + P25-P26) vẫn chạy trước** — cả 3 approaches đều stabilize runtime trước. Cluster D là foundation cho mọi thứ. Không thay đổi điều này.

**Điều kiện thành công:** Cần boundary enforcement rõ ràng giữa Agent team và Artifact team — agent quality không được đổi naming conventions, artifact governance không được sửa agent definitions. Nếu boundary không được enforce, Approach A (sequential, an toàn hơn) nên được chọn.
</task_result>
```

---

## User

rồi có phase nào để xây dựng commands, references, templates chưa đây cũng là  hệ thống để routing trực tiếp 

---

## User

các primitives thêm nữa không thể chứa ở nơi cũ nữa nó phải được chueyern hoá thành schema và code để quản lý qua quy trình install .opencode là client-based không phải development

---

## User

làm lại đọc kỹ và làm lại ## Nghiên cứu và báo cáo các vấn đề sau liên quan trực tiếp tới các vấn đề sau

## Cần đọc các kiến thức sau

```markdown
/Users/apple/hivemind-plugin-private/.hivemind/registries
/Users/apple/hivemind-plugin-private/.planning/phases/23-notification-fix-and-tool-surface-docs/23-W4-SYNTHESIS.md
/Users/apple/hivemind-plugin-private/.planning/phases/23-notification-fix-and-tool-surface-docs/23-W3-SYNTHESIS.md
/Users/apple/hivemind-plugin-private/.planning/phases/23-notification-fix-and-tool-surface-docs/23-W2-SYNTHESIS.md
/Users/apple/hivemind-plugin-private/.planning/phases/23-notification-fix-and-tool-surface-docs/23-SYNTHESIS-REPORT-2026-05-23.md
/Users/apple/hivemind-plugin-private/.planning/phases/23-notification-fix-and-tool-surface-docs/23-GSD-workflow-pipeline-2026-05-23.md
/Users/apple/hivemind-plugin-private/.planning/phases/23-notification-fix-and-tool-surface-docs/23-GSD-sdk-surface-2026-05-23.md
/Users/apple/hivemind-plugin-private/.planning/phases/23-notification-fix-and-tool-surface-docs/23-GSD-REFERENCE-2026-05-23.md
/Users/apple/hivemind-plugin-private/.planning/phases/23-notification-fix-and-tool-surface-docs/23-GSD-quality-gates-2026-05-23.md
/Users/apple/hivemind-plugin-private/.planning/phases/23-notification-fix-and-tool-surface-docs/23-GSD-agent-architecture-2026-05-23.md
/Users/apple/hivemind-plugin-private/.planning/phases/23-notification-fix-and-tool-surface-docs/23-GSD-command-system-2026-05-23.md
/Users/apple/hivemind-plugin-private/.planning/phases/23-notification-fix-and-tool-surface-docs/23-DEBTS-REGISTER-2026-05-23.md
```

## Các repos để học hỏi

/Users/apple/hivemind-plugin-private/repo-for-learning-and-synthesis.md

## Các thiếu sót đang ghi nhận của hệ thống Hivemind vs. GSD vs. OMO

Hãy đối xử với các mục sau là một cluster rất lớn mà nhiều vấn đề con trong đó cần triển khai theo thứ tự và liên đới - ở phần này bạn chỉ cần đưa ra mapping cluster nào nên được sử lý trước  vì các vấn đề con bên trong tôi sẽ không liệt kê ra mà bạn phải biết được nó là gì qua cách sắp xếp toàn bộ phases qua ROADMAP và STATE

OVERVIEW results mong muốn cuối cùng: Hivemind là sự kết hợp mạnh mẽ khắc phục các điểm yếu của cả GSD và OMO tức là giữ được context intellgence qua các session dài, các command và workflows following strictly các giao thức spec-driven, research-driven, context-driven, dependencies , tech compliances,  patterns và feature completeness driven và test-driven với hệ thống quản lý state, roadmap, project, architecture  với các gatekeeping (quality, validation, verification và  tự động hoá etc nói chung adapt nâng cao các cho hệ thống agents vs subagent, commands, workflows, references và templates tương tự như GSD nhưng agents với các công cụ quản lý  task, context, hierarchy, tự động routing command và workflow manipulated qua skills và commands routing và điều phối agents quản lý context qua commits và delegation logics (task và delegate-task)  dựa trên sự học hỏi của OMO để đưa tính tự động này vào nhưng vẫn duy trì được sự collaboration với người dùng 

1. Hê thống routing thông qua commands và skills (sử dụng field subtask và agents ) để parse vs workflows, references, templates  và tự điều phối agents → tự động route workflows bài bản qua agents và subagents chúng ta vẫn chưa làm được do các điểm yếu sau
    1. Hoàn toàn thiếu commands, references và templates để parse tự động thiết lập các routing chặt chẽ
    2. thiếu looping được chia nhỏ hợp lý, có hệ thống thông qua việc hệ thống các artifacts documents → tưc agents khi tạo các artifacts trong planning, research, audit, gatekeeping quản lý code và project, requirements, dependencies thực hiện debug, review v..v… đều thiếu do việc các hệ thống tài liệu này chưa được quy định về quy cách, tính dependent, governance theo thứ tự thế nào. Ngay cả  naming các document này phải theo quy cách gì, yaml heading gồm các trường gì để chain và parse và khi nào tạo mới khi nào phải edit khi các documents và artifacts này đòi hỏi structured chặt chẽ để parse các context cần thiết - nên biết rằng context management cho workflow cho một session dài rất phức tạp
    3. hệ thống agents yếu kém chất lưượng và sự đồng nhất theo tôi qua cách hiện nay thay vì thiết lập permissions skills, custom tools ngay tại yaml của agents qua hm-* và l0, l1, l2, l3 hiện nay rất yếu kém và thiếu chủ động và không hề kiểm soát được qua các yếu tố sau
        1. agent context chỉ thiết lập ngay lần đầu profile nó sẽ prune  khi context kéo dài , qua turns và có compacts → các bước quy định looping hay gating , hierarchy, delegation logics, và checkpoints gay tại profile agents sẽ không hiệu quả ⇒ thay vào đó agent profile nên được thiết kế để nó hoàn thành chuyên môn của nó chứ không phải là nơi build logics looping hay logics check points và ngay cả logics hierarchy → 3 thứ trên phải được xây dựng trên programatic approaches mà tôi nó phụ thuộc rất lớn vào main front facing orchestrator - thứ logics duy nhất có thể build tại profile agents là logics switch agents và commands - wokrlfows (ví dụ như orchéstrator giao việc debug cho executor thì executor detect đó không phải specialist của mình thì switch qua debugger để tiếp tục) - các logics về naming, pathing, format về artifacts hoặc task công việc boundaries quy cách làm việc theo specialist cũng có thể quy định tại profile agents. Nhưng logics về  quy định looping hay gating , hierarchy, delegation logics, và checkpoints sẽ không hiệu quả → phát triển lại hệ thống agent này về quality as expert và như các điều nói trên và thin framing cho routing logics trong đó việc naming l0, l1, l2, l3 sẽ cơ cấu lại như sau (cho cả agents và skills nhưng với knowledge sau)
            1. bỏ đi l1 agent → l0 agent sẽ in charge frontfacing duy nhất
            2. các context về looping logics về  quy định looping hay gating , hierarchy, delegation logics, và checkpoints → sẽ phải absorb để đưa về các programatic features phía dưới (hoặc là programatic injections, hay các tools để điều phối task và coordination của l0 agent) và qua các primitives như command và skills
            3. agent mode thành “all” hết nhưng các agents không front facing sẽ bị hidden để nó chỉ có thể được call bở l0 agent
            4. các logic về  các logics về naming, pathing, format về artifacts hoặc task công việc boundaries quy cách làm việc theo specialist cũng có thể quy định tại profile agents - chú ý về việc agents đó phải làm việc gì tham khảo cách viết của GSD agents , tạo ra artifacts nào, control documents nào, dùng context nào, đọc context, execute việc gì đưa ra format ra sau etc đó là focus → nhóm l2 và l3 agent hoàn toàn phải làm lại hết vì thay vì l2 và l3 thì phải classify theo nhóm công việc trong một quy trình chặt chẽ của một dự án rất phức tạp với các yếu tố tôi nêu trên 
        2. Từ ý trên ta rõ ràng thấy rằng có các mảng chưa hoàn thành đã nói ở trên và đang sẵn có như session-tracker, delegation-status, coordination, agent-work-contract, injection, trajectory etc phải cần đuược thiết kế theo như trên để có thể làm được điều này
        3. và hệ thống planning và artìacts và documents cũng cần phải build theo structured output và schema bây giờ thống nhất là nó sẽ là .hivemind/planning/subdirs → nếu người dùng lựa chọn hivemind để xây dựng và một đường dẫn khác cho các framework khác nhưng thứ này phải được thiết lập dynamic qua user config plane
        4. tiếp theo là cách quản lý của chúng ta cho shipped-with primitives dạng assets đang hoàn toàn sai → tôi đề xuất nó phải quản lý qua schema và dạng code và được dụng tại assets/subdirs thay vì như bây giờ → và .opencode/subdirs hiện đang là symlinks cũng là sai nó phải là các file được trực tiếp extracted ra qua quy trình install của users và nên nhớ .opencode này lấy cả số ít và số nhiều cho agent(s), command(s) và skill(s) còn các primitives khác thì tôi không biết sao và phải nhớ rằng nó có cả global và project-based, và có cả cách dùng opencode.json để config các fields và primitives này và người dùng có thể có nhiều thứ khác từ các frameworks khác và hệ thống cả features lẫn tools hiện nay vẫn không dynamic nhận diện được nó một cách tự động và chủ động và nhất là permissions hiện nay rất conflicts cao độ

Vậy cuối cùng theo bạn thì chúng ta nên thực hiện các cluster nào theo thứ tự ra sao có cần thêm phase nào nữa vào đám sau đây không chúng ta đang ở phase 23.2 và có hơn 40+ phases vẫn chưa hoàn chỉnh của dự án này. 

---

## User

nghiên cứu thực tế hiện trạng bây giờ 

---

## User

expand thêmcác  phase 24.x

---

## User

nó liên hệ trực tiếp tới cả một routing và governance plane bắt nguồn từ việc thiết lập band dầu của users

---

## Assistant (Build · MiMo-V2.5-Pro (Precision) · 30.1s)

_Thinking:_

The user is telling me to re-read all the documents carefully and re-do my analysis. Key points they're making:

1. **Commands, references, templates** are missing - these are the direct routing system. Need phases to build them.
2. **Primitives management is wrong** - shipped-with primitives should be schema+code managed through install process, not symlinks in `.opencode/`. `.opencode/` is client-based, not development.
3. They want me to re-read everything carefully and re-do the cluster analysis.
4. They're specifically pointing out that the entire routing and governance plane starts from the initial user setup/bootstrap.

Let me re-read the key documents more carefully and re-analyze.

The user is emphasizing:
- Commands, references, templates are the DIRECT routing mechanism - not just "routing system" but the actual primitives that perform routing
- `.opencode/` should have primitives extracted from the npm package at install time, not symlinked from meta-builder
- Primitives should be managed as schema+code in `assets/subdirs`, shipped with the package
- The bootstrap/init process is where this all starts

Let me re-read the GSD command system document and the repo-for-learning to understand the full picture.

Actually, I already read all those documents. But the user wants me to re-analyze more carefully, particularly:

1. Commands/references/templates are MISSING - need phases to build them
2. `.opencode/` is client-side - primitives should be extracted at install time from the package
3. The bootstrap process is the foundation

Let me think about what additional phases are needed:

**For Commands/References/Templates:**
- Currently Hivemind has 19 commands. GSD has 67 + 88 workflows
- GSD has `commands/gsd/*.md` with YAML frontmatter + body
- Hivemind needs its own command system modeled after GSD but with Hivemind's identity
- References and templates are the supporting infrastructure that commands use

**For Primitives Management:**
- Currently `.opencode/` has symlinks to `.hivefiver-meta-builder/`
- The user wants: primitives stored as code in `assets/`, extracted at install time
- This is related to BOOT (bootstrap/init) workstream

**New phases needed:**
1. **Commands Infrastructure** - Build the command system (namespace routers, workflow separation, references/templates)
2. **Primitives Asset Management** - Convert primitives from meta-builder symlinks to schema+code in `assets/`, install-time extraction
3. **Bootstrap/User Init Flow** - The initial user setup that creates the project structure, installs primitives, configures routing

Let me also note what the advisor-researcher found:
- Approach B (Agent + Artifact parallel) is best
- Need phases for commands and primitives

Now I need to re-do my analysis properly. Let me think about the complete phase structure with all clusters:

**Cluster A: Agent Foundation** - Fix agent hierarchy, quality, definitions
**Cluster B: Artifact/Document Governance** - Standardize naming, pathing, format, gatekeeping
**Cluster C: Routing System** - Commands, references, templates, workflow separation
**Cluster D: Runtime Features** - session-tracker, delegation, trajectory, pressure
**Cluster E: Primitives Asset Management** - Ship primitives as code in assets/, install-time extraction
**Cluster F: Bootstrap/User Init** - The initial setup flow that ties everything together

Wait, the user is saying the bootstrap is the foundation for routing and governance. Let me reconsider.

Looking at the existing phases:
- BOOT-01 through BOOT-09 (Bootstrap workstream) - some complete, some in progress
- The user says ".opencode/ subdirs đang là symlinks cũng là sai"

So actually the bootstrap workstream (BOOT) needs expansion to handle:
1. Proper primitives extraction (not symlinks)
2. Schema-based asset management
3. User config plane integration

And there needs to be a new workstream for:
- Commands infrastructure (namespace routing, workflow separation)
- Templates and references system

Let me also reconsider the ordering based on the advisor-researcher's finding that Cluster A and Cluster B are independent.

Here's my revised complete analysis:

**Cluster ordering:**

1. **Cluster D (Runtime Foundation)** - P24, P25, P26 (existing) - Stabilize runtime features first
2. **Cluster A (Agent Quality) + Cluster B (Artifact Governance) parallel** - P24.1, P24.2 + P26.1, P26.2
3. **NEW: Cluster C1 (Commands Infrastructure)** - Build namespace routers, workflow separation, references/templates
4. **NEW: Cluster C2 (Routing System Integration)** - Wire commands into routing plane
5. **NEW: Cluster F (Primitives Asset Management)** - Convert to schema+code in assets/, install-time extraction
6. **NEW: Cluster G (Bootstrap + User Init Expansion)** - Complete user setup flow
7. **Cluster E (Cleanup/Shipping)** - P32-P38 (existing)

Actually, let me re-think. The user is saying these are interconnected. Let me be more systematic.

The user's original 5 clusters map to:
1. **Routing via commands/skills (Cluster 1)** → Commands Infrastructure + References/Templates + Workflow System
2. **Document/Artifact governance (Cluster 2)** → Artifact Naming/Format/Dependency
3. **Agent quality (Cluster 3)** → Agent Hierarchy + Quality Enforcement
4. **Runtime tools (Cluster 4)** → session-tracker, delegation, trajectory, pressure
5. **Primitives management (Cluster 5)** → Schema-based assets, install-time extraction

Plus what the user is now emphasizing:
6. **Bootstrap/User Init** - The starting point for routing and governance

Let me create a comprehensive phase structure in Vietnamese as requested and be very specific.

Actually the user wants me to: "nghiên cứu thực tế hiện trạng bây giờ" - study the actual current state. And "expand thêm các phase 24.x" - expand with more phase 24.x phases.

So they're specifically asking about inserting new phases into the 24.x namespace (after P24).

Let me think about what P24.x phases are needed based on the bootstrap/routing connection:

P24 = Coordination Dispatch + Delegate-Task Fix (existing)
- P24.1 = Agent Hierarchy Restructure (from my previous analysis)
- P24.2 = Agent Profile Quality Enforcement (from my previous analysis)
- P24.3 = Commands Infrastructure (namespace routing, workflow separation) ← NEW
- P24.4 = References & Templates System ← NEW
- P24.5 = Primitives Asset Schema & Code Management ← NEW
- P24.6 = Bootstrap Init Flow Expansion (user setup, routing governance plane) ← NEW

Hmm, that's a lot of 24.x phases. Let me be more selective.

Actually, let me re-read the user's specific question: they mention the connection between bootstrap and routing and governance plane. The bootstrap is where the initial user setup happens - it's when `.opencode/`, `.hivemind/` are created, primitives are installed, config is set up. This IS the foundation for the routing plane.

So the expanded view:

Phase 24.x series (after P24 - Coordination Dispatch fix):
- P24.1: Agent Hierarchy Restructure
- P24.2: Agent Profile Quality Enforcement  
- P24.3: Commands Infrastructure (namespace routers, workflow files, references/templates)
- P24.4: Primitives Asset Schema (convert meta-builder assets to schema+code)
- P24.5: Bootstrap Init Flow (user setup, primitives extraction, routing governance init)
- P24.6: Routing Plane Integration (wire everything together)

Wait, but this might be too many phases. Let me consolidate.

Actually, let me just write a comprehensive response.

Tôi sẽ đọc kỹ lại toàn bộ để phân tích chính xác hiện trạng và mở rộng phase 24.x.

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/phases/23-notification-fix-and-tool-surface-docs/23-GSD-command-system-2026-05-23.md",
  "offset": 1,
  "limit": 100
}
```

**Output:**
```
<path>/Users/apple/hivemind-plugin-private/.planning/phases/23-notification-fix-and-tool-surface-docs/23-GSD-command-system-2026-05-23.md</path>
<type>file</type>
<content>
1: # GSD Command System — Deep Analysis
2: 
3: > **Source:** GSD Repomix output `5875fd23ec62fc70` — files docs/COMMANDS.md, docs/ARCHITECTURE.md §Component Architecture, docs/INVENTORY.md §Commands (67 shipped)
4: > **Date:** 2026-05-23
5: > **Evidence Level:** L3 (documented observation from GSD docs)
6: > **Audience:** Hivemind engineers seeking actionable insights for Hivemind's command engine
7: 
8: ---
9: 
10: ## 1. OVERVIEW
11: 
12: GSD ships **67 commands** (stored as `commands/gsd/*.md`) plus **88 workflow files** (`get-shit-done/workflows/*.md`). Commands are the user-facing entry points; workflows are the internal orchestration logic. [L29994-L29997]
13: 
14: The fundamental architecture:
15: 
16: ```
17: User types /gsd-command → Command file loaded into context → Workflow orchestration → Subagent dispatch → State update
18: ```
19: 
20: Every command file contains:
21: - **YAML frontmatter:** `name`, `description`, `allowed-tools`
22: - **Prompt body:** Bootstraps the corresponding workflow, references shared knowledge documents via `@-reference`
23: - **Flag/argument definitions:** Syntactic sugar parsed by the runtime
24: 
25: [L22068-L22076]
26: 
27: ---
28: 
29: ## 2. COMMAND CLASSIFICATION (67 Commands)
30: 
31: ### 2.1 Namespace Meta-Skills (6 routers)
32: 
33: Keep eager skill-listing cost at ~120 tokens instead of ~2,150 for 86 skills:
34: 
35: | Command | Routes to | Token cost |
36: |---------|-----------|-----------|
37: | `/gsd-workflow` | Phase pipeline — discuss / plan / execute / verify / phase / progress | ~20 |
38: | `/gsd-project` | Project lifecycle — milestones, audits, summary | ~20 |
39: | `/gsd-quality` | Quality gates — code review, debug, audit, security, eval, ui | ~20 |
40: | `/gsd-context` | Codebase intelligence — map, graphify, docs, learnings | ~20 |
41: | `/gsd-manage` | Management — config, workspace, workstreams, thread, update, ship, inbox | ~20 |
42: | `/gsd-ideate` | Exploration & capture — explore, sketch, spike, spec, capture | ~20 |
43: 
44: [L30000-L30011]
45: 
46: **Routing mechanism:** Each namespace router's body contains a **routing table** — a Markdown table mapping intent keywords to concrete sub-skill commands. The model selects the namespace first, reads the routing table, then dispatches to the concrete command. [L22078-L22083]
47: 
48: **Key property:** Namespace skills are **additive** — every concrete command is still directly invocable. The routing layer is only a _cost optimization_, not an access control mechanism. [L23523]
49: 
50: **Description format:** Router descriptions use pipe-separated keyword tags (≤ 60 chars). Example: `"Phase pipeline router — discuss / plan / execute / verify / phase / progress."` This is based on Tool Attention research showing keyword-dense tags outperform prose at ~40% the token cost. [L22082-L22083]
51: 
52: ### 2.2 Core Workflow Commands (20 commands)
53: 
54: The central pipeline — these are the commands that users run daily:
55: 
56: | Command | Role | Produces |
57: |---------|------|----------|
58: | `/gsd-new-project` | Initialize project with research + roadmap | PROJECT.md, REQUIREMENTS.md, ROADMAP.md, STATE.md, config.json |
59: | `/gsd-workspace` | Manage isolated workspace environments | WORKSPACE.md, .planning/, repo copies |
60: | `/gsd-discuss-phase` | Gather phase context via questions | {phase}-CONTEXT.md, DISCUSSION-LOG.md |
61: | `/gsd-mvp-phase` | Plan as vertical MVP slice | PLAN.md via SPIDR splitting |
62: | `/gsd-spec-phase` | Socratic spec refinement | SPEC.md with falsifiable requirements |
63: | `/gsd-ui-phase` | Generate UI design contract | {phase}-UI-SPEC.md |
64: | `/gsd-ai-integration-phase` | AI design contract + eval planning | AI-SPEC.md |
65: | `/gsd-plan-phase` | Research → plan → verify a phase | RESEARCH.md, PLAN.md, VALIDATION.md |
66: | `/gsd-plan-review-convergence` | Cross-AI plan convergence loop | Converged PLAN.md |
67: | `/gsd-ultraplan-phase` | [BETA] Offload planning to ultraplan cloud | External plan file → /gsd-import |
68: | `/gsd-spike` | Throwaway feasibility experiments | Spike findings, optional persistent skill |
69: | `/gsd-sketch` | UI/design HTML mockups | Sketch findings, optional persistent skill |
70: | `/gsd-execute-phase` | Wave-based plan execution | Code changes, commits, SUMMARY.md |
71: | `/gsd-verify-work` | Conversational UAT | UAT.md |
72: | `/gsd-ship` | Create PR, review, merge | PR |
73: | `/gsd-fast` | Inline task execution (no subagents) | Direct code changes |
74: | `/gsd-quick` | Quick task with GSD guarantees | Code + state + commits |
75: | `/gsd-ui-review` | 6-pillar visual audit | {phase}-UI-REVIEW.md |
76: | `/gsd-code-review` | Source code review | REVIEW.md |
77: | `/gsd-eval-review` | AI phase evaluation audit | EVAL-REVIEW.md |
78: 
79: [L30014-L30044]
80: 
81: ### 2.3 Phase & Milestone Management (15 commands)
82: 
83: | Command | Role |
84: |---------|------|
85: | `/gsd-phase` | CRUD: add / insert / remove / edit phases in ROADMAP.md |
86: | `/gsd-add-tests` | Generate tests from UAT criteria |
87: | `/gsd-validate-phase` | Retroactive Nyquist validation gap filling |
88: | `/gsd-secure-phase` | Retroactive threat mitigation verification |
89: | `/gsd-audit-milestone` | Milestone DoD verification |
90: | `/gsd-audit-uat` | Cross-phase UAT/verification audit |
91: | `/gsd-audit-fix` | Autonomous audit-to-fix pipeline |
92: | `/gsd-complete-milestone` | Archive completed milestone |
93: | `/gsd-new-milestone` | Start new milestone cycle |
94: | `/gsd-milestone-summary` | Generate milestone summary |
95: | `/gsd-cleanup` | Archive phase dirs from completed milestones |
96: | `/gsd-manager` | Interactive command center |
97: | `/gsd-workstreams` | Parallel workstream management |
98: | `/gsd-autonomous` | Run all remaining phases autonomously |
99: | `/gsd-undo` | Safe git revert with phase manifest |
100: 

(Showing lines 1-100 of 370. Use offset=101 to continue.)
</content>
```

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/phases/23-notification-fix-and-tool-surface-docs/23-GSD-workflow-pipeline-2026-05-23.md",
  "offset": 1,
  "limit": 100
}
```

**Output:**
```
<path>/Users/apple/hivemind-plugin-private/.planning/phases/23-notification-fix-and-tool-surface-docs/23-GSD-workflow-pipeline-2026-05-23.md</path>
<type>file</type>
<content>
1: # GSD Workflow Pipeline — Deep Analysis
2: 
3: > **Source:** GSD Repomix output `5875fd23ec62fc70` — docs/FEATURES.md, docs/ARCHITECTURE.md §Data Flow, docs/USER-GUIDE.md, docs/workflow-discuss-mode.md, docs/STATE-MD-LIFECYCLE.md
4: > **Date:** 2026-05-23
5: > **Evidence Level:** L3 (documented observation from GSD docs)
6: > **Audience:** Hivemind engineers building phase execution pipeline
7: 
8: ---
9: 
10: ## 1. THE COMPLETE PIPELINE
11: 
12: GSD's end-to-end pipeline:
13: 
14: ```
15: new-project → discuss-phase → [ui-phase] → plan-phase → execute-phase → verify-work → [ui-review] → ship
16: ```
17: 
18: [L22407-L22420]
19: 
20: Each stage produces artifacts consumed by the next:
21: 
22: ```
23: PROJECT.md ─────────────────────────────────────► All agents
24: REQUIREMENTS.md ────────────────────────────────► Planner, Verifier, Auditor
25: ROADMAP.md ─────────────────────────────────────► Orchestrators
26: STATE.md ───────────────────────────────────────► All agents (decisions, blockers)
27: CONTEXT.md (per phase) ─────────────────────────► Researcher, Planner, Executor
28: RESEARCH.md (per phase) ────────────────────────► Planner, Plan Checker
29: PLAN.md (per plan) ─────────────────────────────► Executor, Plan Checker
30: SUMMARY.md (per plan) ──────────────────────────► Verifier, State tracking
31: UI-SPEC.md (per phase) ─────────────────────────► Executor, UI Auditor
32: ```
33: 
34: [L22410-L22420]
35: 
36: ---
37: 
38: ## 2. STAGE 1: PROJECT INITIALIZATION (`/gsd-new-project`)
39: 
40: **Purpose:** Transform an idea into structured project with research, requirements, and roadmap.
41: 
42: **Process:**
43: 1. **Adaptive questioning** — Guided by "dream extraction" philosophy (not requirements gathering). Questions surface what the user wants to build, who the user is, tech preferences
44: 2. **4 parallel researcher agents** — Investigate stack, features, architecture, and pitfalls simultaneously
45: 3. **Research synthesis** — `gsd-research-synthesizer` combines into SUMMARY.md
46: 4. **Requirements extraction** — Categorized into v1 (must-have), v2 (future), out-of-scope
47: 5. **Roadmap generation** — Phase breakdown mapped to requirements with granularity control
48: 6. **User approval** — User must approve before any code is written
49: 
50: [L26337-L26550]
51: 
52: **Produced artifacts:**
53: | Artifact | Description |
54: |----------|-------------|
55: | PROJECT.md | Project vision, constraints, decisions, evolution rules |
56: | REQUIREMENTS.md | Scoped requirements with unique IDs (REQ-XX) |
57: | ROADMAP.md | Phase breakdown with status + requirement mapping |
58: | STATE.md | Initial state: position, decisions, metrics |
59: | config.json | Workflow configuration |
60: | research/SUMMARY.md | Synthesized domain research |
61: 
62: [L26520-L26530]
63: 
64: **Granularity** controls phase count:
65: - `coarse`: 3-5 phases
66: - `standard`: 5-8 phases  
67: - `fine`: 8-12 phases
68: 
69: [L25040-L25050]
70: 
71: ---
72: 
73: ## 3. STAGE 2: PHASE DISCUSSION (`/gsd-discuss-phase`)
74: 
75: GSD has TWO modes for gathering implementation context before planning:
76: 
77: ### 3.1 Mode 1: `discuss` (interview-style, default)
78: 
79: The original flow: Claude identifies gray areas in the phase, presents them for selection, then asks ~4 questions per area. Good for early phases, strong user opinions, conversational context gathering. [L34244-L34250]
80: 
81: ### 3.2 Mode 2: `assumptions` (codebase-first)
82: 
83: Claude deeply analyzes the codebase first (reading 5-15 files via subagent), forms assumptions with file:line evidence, and presents them for confirmation or correction. Good for established codebases, experienced users, faster context gathering (~2-4 interactions vs ~15-20). [L34252-L34260]
84: 
85: **How assumptions mode works:**
86: 1. **Init** — Load prior context, scout codebase, check todos
87: 2. **Deep analysis** — Subagent reads 5-15 codebase files related to the phase
88: 3. **Surface assumptions** — Each includes: what Claude would do + why (citing file paths), what goes wrong if incorrect, confidence level (Confident / Likely / Unclear)
89: 4. **Confirm or correct** — User reviews, selects items needing change
90: 5. **Write CONTEXT.md** — Identical output to interview mode
91: 
92: [L34274-L34284]
93: 
94: ### 3.3 Both modes produce identical CONTEXT.md format:
95: 
96: ```markdown
97: <domain> — Phase boundary
98: <decisions> — Locked implementation decisions  
99: <canonical_refs> — Specs/docs downstream agents must read
100: <code_context> — Reusable assets, patterns, integration points

(Showing lines 1-100 of 433. Use offset=101 to continue.)
</content>
```

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/repo-for-learning-and-synthesis.md"
}
```

**Output:**
```
<path>/Users/apple/hivemind-plugin-private/repo-for-learning-and-synthesis.md</path>
<type>file</type>
<content>
1: **IMPORTANT HEAD-UP!**: 
2: 
3: - For any “other frameworks/projects synthesis” - such as gsd-* https://github.com/gsd-build/get-shit-done or OMO https://github.com/code-yeongyu/oh-my-openagent → DO NOT SIMPLY INGEST everything and throw-in without deeply synthesize towards the HIVEMIND philosophies, concepts and visions
4: - And as above all those editions of primitives - config, naming, prefixes, suffixes, designs as for workflows and harness features must completely be transformed, adapt, and integrate coherently toward `the Hivemind`  under OpenCode (with specs compliance, harness lifecycles validation, ecosystem validation) - also, the gsd-* (or any keyword as prefixes or suffixes in skills, agents, commands, workflows, custom tools, etc are not expected to ship with the project and they are there just because I am using GSD framework to develop this - and if any “synthesis” that the units are expected to ship-with → they must follow the above rules and mindsets
5: - other  repos of OpenCode projects and plugins utilizing OpenCode SDK, plugins , client-server API - can be found here with these note-worthy repos vs. harness features categories
6:     1. Context-managements categories:
7:         1. https://github.com/Opencode-DCP/opencode-dynamic-context-pruning
8:     2. Harness features addressing  OpenCode innate shortcomings - the task, command and delegation feature class
9:         1. https://github.com/shekohex/opencode-ptyhttps://github.com/shekohex/opencode-pty#features  → resolve non-interactive commands, background runnings and multiple sessions - with OMO synthesis of background tasks, background agent, polling system to address this repo’s known limitations https://github.com/shekohex/opencode-pty#permissions
10:         2. related to the above is the background-agent repo https://github.com/kdcokenny/opencode-background-agents 
11:     3. A  **HUGE LIST OF CURATED OPENCODE ECOSYSTEM PROJECTS and PLUGINS -**  https://github.com/awesome-opencode/awesome-opencode - check this directory very often as you need to synthesize for feature-development, learn patterns, ideating and knowledge ingestion - I have also made a local copy of this under this path `/Users/apple/Documents/coding-projects/hivemind-plugin-1/.planning/research/OPENCODE-ECOSYSTEM-REPO-DIRECTORIES.md`

(End of file - total 11 lines)
</content>
```

---

## Assistant (Build · MiMo-V2.5-Pro (Precision) · 7.6s)

_Thinking:_

Now let me look at the existing bootstrap and primitives state to understand the current situation better.

 

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/ROADMAP.md",
  "offset": 200,
  "limit": 200
}
```

**Output:**
```
<path>/Users/apple/hivemind-plugin-private/.planning/ROADMAP.md</path>
<type>file</type>
<content>
200: ### BOOT-01 Scope: Research & Architecture Decision
201: 
202: Before writing code:
203: 
204: 1. **OpenCode ecosystem synthesis** — investigate `opencode-pty`, `opencode-background-agents`, `awesome-opencode` directory, `opencode-dynamic-context-pruning` for patterns. Adapt toward Hivemind's CQRS/tool-hook lifecycle. Do NOT blindly copy OMO folder structure or GSD conventions.
205: 2. **Dependency reconciliation** — map each new `package.json` dependency to a concrete Bootstrap CLI feature. Justify every dependency with a Hivemind-native use case.
206: 3. **Grey area clearance** — surface architecture decisions: CLI framework (commander vs. alternative), primitives parsing strategy (gray-matter + yaml vs. unified parser), AST integration scope, MCP server boundaries, PTY ownership.
207: 4. **Output:** research docs in `.planning/research/` (date-stamped), grey-area decision matrix, dependency-to-feature map.
208: 
209: ### BOOT-02 Scope: CLI Entry Point
210: 
211: - Wire `commander` CLI framework with program/subcommand structure
212: - Integrate `@clack/prompts` for interactive flows
213: - Rich terminal output via `ink`/`react` (optional, deferrable)
214: - Export path: `./cli` in package.json → `src/cli/index.ts`
215: - Bin entry: `hivemind`; `hivemind-tools` is a legacy alias only
216: 
217: ### BOOT-03 Scope: State Initialization
218: 
219: - `npx hivemind init` creates canonical `.hivemind/` directory tree
220: - 19 subdirectories with `.gitkeep` registration
221: - Typed CRUD modules per `.hivemind/` subdirectory (7 CRUD, 7 append, 6 read-only)
222: - Fixes D-CRUD-05 gap
223: 
224: ### BOOT-04 Scope: Primitives Recovery
225: 
226: - Restore `.opencode/` symlinks to `.hivefiver-meta-builder/` source
227: - Validation: walk `.hivefiver-meta-builder/` → verify every expected `.opencode/` symlink
228: - Fixes D-CRUD-01: "delete and lose everything" gap
229: 
230: ### BOOT-05 Scope: Config Bootstrap
231: 
232: - Initialize `.hivemind/configs.json` from schema defaults
233: - Validate against `hivemind-configs.schema.ts`
234: - Wire to behavioral-profile + governance-block consumers
235: 
236: ### BOOT-06 Scope: Validation
237: 
238: - `npx hivemind doctor` — full health check
239: - Checks: `.hivemind/` structure integrity, `.opencode/` symlinks, config validity, SDK availability, typecheck, test pass, module count
240: - Human-readable report with PASS/FAIL/WARN verdicts
241: 
242: ### BOOT-07 Scope: End-to-End Proof
243: 
244: - Nuke `.hivemind/` → run `init` → verify: (a) structure created, (b) symlinks restored, (c) configs initialized, (d) doctor returns PASS, (e) typecheck passes, (f) 1767 tests pass
245: - This is L1 runtime evidence — closes the docs-only gate
246: 
247: ### Checkpoints
248: 
249: - **CP-CA-1:** configs.json full schema operational ✅
250: - **CP-CA-2:** Mode → behavioral profile mapping produces observable behavior ✅
251: - **CP-CA-3:** Every workflow toggle has a concrete runtime consumer ✅ (6 wired, 4 annotated, 4 deferred)
252: - **CP-CA-4:** `.hivemind/` bootstrap on install + typed ownership for state/ and delegation-managements/ dirs (MINIMUM)
253: 
254: ---
255: 
256: ## Active Workstream: Harness Ecosystem Recovery (HER)
257: 
258: | Phase | Title | Status |
259: |-------|-------|--------|
260: | HER-0 | Ecosystem Remap Audit | ✅ VALUABLE-CONTEXT |
261: | HER-1 | Documentation & Config Recovery | ✅ DELIVERED |
262: | HER-2 | Dead Code Cleanup | ✅ DELIVERED |
263: | HER-3 | Context & Compaction | 📋 READY — no PLAN.md |
264: | HER-4 | SDK Integration Depth | 📋 READY — no PLAN.md |
265: | HER-5 | Agent Rationalization | 📋 READY — no PLAN.md |
266: 
267: ---
268: 
269: ## Active Workstream: Meta-Concept Migration (WS-MCM)
270: 
271: The meta-concept migration workstream ports hm-*, hf-*, gate-*, and stack-* agents and skills from `.hivefiver-meta-builder/` (the developer workspace) into `.opencode/` (shipped project primitives), integrates them into config planes, doctor workflows, and end-user customization surfaces. MCM continuation is blocked until the Phase 0 governance gate passes. GSD-prefixed agents/skills are excluded — those are internal dev tooling only and never shipped as Hivemind product primitives.
272: 
273: ### Source inventory
274: 
275: - **Agents lab:** `.hivefiver-meta-builder/agents-lab/active/refactoring/` — current active inventory has 89 agent definitions. MCM doctor must classify shipped vs dev-only before migration.
276: - **Skills lab:** `.hivefiver-meta-builder/skills-lab/active/refactoring/` — current active inventory has 123 skill directories, excluding `.gitkeep`. MCM doctor must classify shipped vs dev-only before migration.
277: - **Total source:** `.hivefiver-meta-builder/` includes active labs plus commands-lab, plans, references-lab, research, and rules subdirectories. Exact file counts are MCM doctor evidence, not Phase 0 evidence.
278: 
279: | Phase | Title | Status | Depends On | Evidence Required |
280: |-------|-------|--------|------------|-------------------|
281: | MCM-01 | Agent Migration to .opencode/ | ✅ COMPLETE | BOOT-04 (symlinks exist), Phase 0 gate | L3: MCM doctor classifies hm-/hf-eligible agents and verifies discoverability in `.opencode/agents/` |
282: | MCM-02 | Skill Migration to .opencode/ | ✅ COMPLETE | BOOT-04 (symlinks exist), Phase 0 gate | L3: MCM doctor classifies hm-/hf-/gate-/stack-eligible skills and verifies discoverability in `.opencode/skills/` |
283: | MCM-03 | Config Plane Integration | ⬜ BLOCKED BY PHASE 0 | MCM-01, MCM-02, BOOT-06, Phase 0 gate | L2: doctor reports agent/skill counts, config validation includes meta-concept checks |
284: | MCM-04 | End-User Customization + Ecosystem Integration | ⬜ BLOCKED BY PHASE 0 | MCM-03, Phase 0 gate | L2: end-user projects can customize shipped primitives via config, OpenCode SDK/API integration verified |
285: 
286: ### MCM-01 Scope: Agent Migration
287: 
288: - Classify active agent definitions from `.hivefiver-meta-builder/agents-lab/active/refactoring/` before copying or reflecting into `.opencode/agents/`
289: - Exclude: all `gsd-*` prefixed agents — these are dev tooling
290: - Include only hm-/hf-eligible agents after MCM doctor confirms lineage, permissions, and discoverability expectations
291: - Validate each agent has correct frontmatter, tools permissions, temperature settings
292: - Verify all migrated agents are discoverable by OpenCode runtime
293: 
294: ### MCM-02 Scope: Skill Migration
295: 
296: - Classify active skill directories from `.hivefiver-meta-builder/skills-lab/active/refactoring/` before copying or reflecting into `.opencode/skills/`
297: - Exclude: all `gsd-*` prefixed skills unless explicitly retained as internal developer tooling outside the shipped Hivemind primitive set
298: - Include only hm-/hf-/gate-/stack-eligible skills after MCM doctor confirms lineage, trigger, and discoverability expectations
299: - Validate each skill has correct SKILL.md structure, trigger phrases
300: - Verify all migrated skills are discoverable by OpenCode runtime
301: 
302: ### MCM-03 Scope: Config + Doctor Integration
303: 
304: - Add agent/skill count checks to doctor command (BOOT-06 extension)
305: - Add meta-concept validation to config plane: verify shipped primitives are present and valid
306: - Wire agent/skill registries into config assets plane
307: - Doctor reports: agent count, skill count, missing/broken references
308: 
309: ### MCM-04 Scope: Customization + Ecosystem
310: 
311: - End-user project meta concept customization via `.hivemind/` config
312: - Documentation for extending/replacing shipped primitives
313: - OpenCode SDK/API/plugin interface verification with shipped agents/skills
314: - Hivemind engine integration contracts validated against shipped primitives
315: 
316: ---
317: 
318: ## Planned Workstreams (Blocked on Core Architecture)
319: 
320: ### Agent Workflows (WS-AW)
321: - WS-4: Auto-commands + Workflow Router (f-04) — **HIGHEST GAP**, blocked by Phase 0 + BOOT + MCM
322: - WS-5: Delegation Revamp (f-06 lanes/hierarchy)
323: - WS-6: Trajectory + Task-Plus (f-07)
324: 
325: ### User Experience (WS-UX)
326: - WS-2: Bootstrap CLI + Onboarding
327: - WS-7: Context/Compaction Engine
328: - WS-8: Sidecar + UI (DEFERRED)
329: 
330: ---
331: 
332: ## Active Workstream: Structure Restructuring (WS-SR)
333: 
334: OMO-inspired `src/` reorganization to transform scattered `src/lib/` (56 entries) into organized planes following OMO naming conventions (kebab-case everywhere), feature-module pattern (index.ts, types.ts, AGENTS.md per module), colocated tests, barrel exports, and hierarchical AGENTS.md guidance. Plan: `.planning/architecture/structure-restructuring-plan-2017-05-08.md`
335: 
336: | Phase | Title | Status | Depends On | Key Improvements |
337: |-------|-------|--------|------------|------------------|
338: | SR-0 | Preparation (safety net) | ✅ COMPLETE | — | Baseline branch and safety checks completed before restructuring |
339: | SR-1 | Leaf Modules → `src/shared/` | ✅ COMPLETE | SR-0 | Leaf modules moved to `src/shared/`; import compatibility verified |
340: | SR-2 | Persistence/Journal → `src/task-management/` | ✅ COMPLETE | SR-1 | Persistence, journal, recovery, trajectory, and lifecycle surfaces moved |
341: | SR-3 | Delegation/Concurrency → `src/coordination/` | ✅ COMPLETE | SR-1 | Delegation, completion, command delegation, SDK delegation, concurrency, and spawner surfaces moved |
342: | SR-4 | Features → `src/features/` | ✅ COMPLETE | SR-2, SR-3 | Corrected mapping: standalone features only; command engine and config workflow excluded |
343: | SR-5 | Config → `src/config/` | ✅ COMPLETE | SR-1 | Config subscriber/compiler/workflow moved to config realm |
344: | SR-6 | Routing → `src/routing/` | ✅ COMPLETE | SR-1 | Session entry, behavioral profile, and command engine moved to routing plane |
345: | SR-7 | Hooks Reorganization | ✅ COMPLETE | SR-4 | Hooks reorganized by lifecycle, guards, observers, transforms, and composition |
346: | SR-8 | Tools Reorganization | ✅ COMPLETE | SR-4 | Tools categorized by delegation, session, config, hivemind, and prompt domains |
347: | SR-9 | Plugin Composition Root Update | ✅ COMPLETE | SR-7, SR-8 | `src/plugin.ts` imports updated; `src/plugin/` intentionally not created by SR remediation decision |
348: | SR-10 | Cleanup + AGENTS.md Updates | ✅ COMPLETE | SR-9 | `src/lib/` removed; sector/module AGENTS.md added; typecheck/tests/build passed |
349: 
350: ### Target Structure
351: 
352: ```
353: src/
354: ├── AGENTS.md                    # Top-level sector guidance
355: ├── index.ts                     # Public API re-exports
356: ├── plugin.ts                    # Plugin composition root
357: ├── routing/           # Intent → session → task → workflow pipeline
358: ├── task-management/   # Continuity, journal, trajectory, recovery, lifecycle
359: ├── coordination/      # Delegation, concurrency, completion, spawner
360: ├── features/          # Standalone feature modules (each with index.ts, types.ts, AGENTS.md)
361: ├── hooks/             # Reorganized by purpose (lifecycle, guards, observers, transforms, composition)
362: ├── tools/             # Categorized by domain (delegation, session, config, hivemind, prompt)
363: ├── shared/            # Expanded leaf modules, security/, tmux/, model-capabilities/
364: ├── config/            # Config realm (subscriber, compiler, workflow, types.ts)
365: ├── schema-kernel/     # Zod schemas (unchanged)
366: ├── plugin/            # DEFERRED: `src/plugin.ts` remains canonical composition root
367: ├── cli/               # CLI substrate (unchanged — AGENTS.md, discovery, renderer, router, commands/)
368: └── sidecar/           # Read-only state (unchanged)
369: ```
370: 
371: ### SR Phase Directories
372: 
373: | Phase | Directory | Slug |
374: |-------|-----------|------|
375: | SR-0 | `.planning/phases/SR-00-preparation-safety-net/` | preparation-safety-net |
376: | SR-1 | `.planning/phases/SR-01-leaf-modules-to-shared/` | leaf-modules-to-shared |
377: | SR-2 | `.planning/phases/SR-02-persistence-journal-to-task-management/` | persistence-journal-to-task-management |
378: | SR-3 | `.planning/phases/SR-03-delegation-concurrency-to-coordination/` | delegation-concurrency-to-coordination |
379: | SR-4 | `.planning/phases/SR-04-features-to-features-plane/` | features-to-features-plane |
380: | SR-5 | `.planning/phases/SR-05-config-to-config-realm/` | config-to-config-realm |
381: | SR-6 | `.planning/phases/SR-06-routing-to-routing-plane/` | routing-to-routing-plane |
382: | SR-7 | `.planning/phases/SR-07-hooks-reorganization/` | hooks-reorganization |
383: | SR-8 | `.planning/phases/SR-08-tools-reorganization/` | tools-reorganization |
384: | SR-9 | `.planning/phases/SR-09-plugin-composition-root-update/` | plugin-composition-root-update |
385: | SR-10 | `.planning/phases/SR-10-cleanup-agents-md-updates/` | cleanup-agents-md-updates |
386: 
387: ---
388: 
389: ## Deliverables & Timeline
390: 
391: | Wave | What | Blocks |
392: |------|------|--------|
393: | **Wave 0 (NOW)** | Phase 0 Governance Baseline | Blocks BOOT/MCM/f-04 until gate passes |
394: | **Wave 1** | BOOT-01 Research + BOOT-02 CLI Framework + BOOT-02R Governance Reconciliation ✅ COMPLETE | Depends on Phase 0 gate |
395: | **Wave 2** | BOOT-03 State Init + BOOT-04 Primitives + BOOT-05 Config; CP-PTY-00 docs/spec spike may run in parallel | Depends on Phase 0 + Wave 1 CLI framework/reconciliation |
396: | **Wave 3** | BOOT-06 Validation + BOOT-07 E2E Proof | Depends on Phase 0 + Waves 1-2 |
397: | **Wave 3.5** | CP-PTY-01 Background Shell Control-Plane MVP if routing requires command lanes | Depends on CP-PTY-00 + BOOT-07 unless explicitly authorized earlier |
398: | **Wave 3.6** | CP-PTY-02 SDK Session Delegation Integration | Depends on CP-PTY-01 + BOOT-08 |
399: | **Wave 3.7** | CP-PTY-03 Agent/Subagent Background Task Coordination | Depends on CP-PTY-02 + BOOT-08 |

(Showing lines 200-399 of 890. Use offset=400 to continue.)
</content>
```

**Tool: glob**

**Input:**
```json
{
  "pattern": "src/tools/bootstrap*"
}
```

**Output:**
```
No files found
```

**Tool: glob**

**Input:**
```json
{
  "pattern": ".opencode/commands/*.md"
}
```

**Output:**
```
No files found
```

---

## Assistant (Build · MiMo-V2.5-Pro (Precision) · 8.0s)

_Thinking:_

Important findings:
1. `src/tools/bootstrap*` - No files found! The bootstrap tools may be in a different location or may not exist as separate files.
2. `.opencode/commands/*.md` - No files found! The commands might use a different format or be in `.opencode/commands/` with .yaml extension.

Let me check the actual command files location and the bootstrap init tool.

 

**Tool: glob**

**Input:**
```json
{
  "pattern": ".opencode/commands/*"
}
```

**Output:**
```
No files found
```

**Tool: glob**

**Input:**
```json
{
  "pattern": "src/cli/**/*"
}
```

**Output:**
```
/Users/apple/hivemind-plugin-private/src/cli/router.ts
/Users/apple/hivemind-plugin-private/src/cli/index.ts
/Users/apple/hivemind-plugin-private/src/cli/discovery.ts
/Users/apple/hivemind-plugin-private/src/cli/renderer.ts
/Users/apple/hivemind-plugin-private/src/cli/commands/version.ts
/Users/apple/hivemind-plugin-private/src/cli/commands/init.ts
/Users/apple/hivemind-plugin-private/src/cli/commands/recover.ts
/Users/apple/hivemind-plugin-private/src/cli/commands/help.ts
/Users/apple/hivemind-plugin-private/src/cli/commands/doctor.ts
```

**Tool: glob**

**Input:**
```json
{
  "pattern": "src/tools/bootstrap*"
}
```

**Output:**
```
No files found
```

**Tool: glob**

**Input:**
```json
{
  "pattern": "src/features/bootstrap*/**/*"
}
```

**Output:**
```
/Users/apple/hivemind-plugin-private/src/features/bootstrap/primitive-registry.ts
/Users/apple/hivemind-plugin-private/src/features/bootstrap/runtime-validator.ts
/Users/apple/hivemind-plugin-private/src/features/bootstrap/primitive-scanners.ts
/Users/apple/hivemind-plugin-private/src/features/bootstrap/structure.ts
/Users/apple/hivemind-plugin-private/src/features/bootstrap/primitive-loader.ts
/Users/apple/hivemind-plugin-private/src/features/bootstrap/framework-detector.ts
/Users/apple/hivemind-plugin-private/src/features/bootstrap/control-plane/index.ts
/Users/apple/hivemind-plugin-private/src/features/bootstrap/control-plane/gatekeeper.ts
/Users/apple/hivemind-plugin-private/src/features/bootstrap/cross-primitive-validator.ts
/Users/apple/hivemind-plugin-private/src/features/bootstrap/control-plane/gate-decision.ts
```

---

## Assistant (Build · MiMo-V2.5-Pro (Precision) · 7.3s)

_Thinking:_

So the bootstrap code is at `src/features/bootstrap/` not `src/tools/bootstrap*`. And `.opencode/commands/` seems empty or doesn't exist.

Let me check the commands location more carefully.

 

**Tool: glob**

**Input:**
```json
{
  "pattern": ".opencode/commands/**/*"
}
```

**Output:**
```
No files found
```

**Tool: glob**

**Input:**
```json
{
  "pattern": ".opencode/command*/**/*"
}
```

**Output:**
```
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-workspace.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-workstreams.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-verify-work.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-validate-phase.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-ultraplan-phase.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-update.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-undo.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-spike.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-thread.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-stats.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-ui-review.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-ui-phase.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-spec-phase.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-ship.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-settings.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-sketch.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-resume-work.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-review.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-secure-phase.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-review-backlog.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-progress.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-profile-user.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-pr-branch.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-quick.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-plan-review-convergence.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-phase.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-plan-phase.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-pause-work.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-ns-workflow.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-ns-project.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-ns-review.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-ns-context.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-ns-manage.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-ns-ideate.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-new-project.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-milestone-summary.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-new-milestone.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-map-codebase.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-mvp-phase.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-import.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-inbox.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-ingest-docs.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-manager.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-help.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-health.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-graphify.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-extract-learnings.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-forensics.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-fast.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-explore.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-eval-review.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-execute-phase.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-docs-update.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-discuss-phase.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-config.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-debug.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-complete-milestone.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-cleanup.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-capture.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-code-review.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-audit-uat.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-autonomous.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-audit-milestone.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-audit-fix.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-ai-integration-phase.md
/Users/apple/hivemind-plugin-private/.opencode/command/gsd-add-tests.md
```

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.opencode"
}
```

**Output:**
```
<path>/Users/apple/hivemind-plugin-private/.opencode</path>
<type>directory</type>
<entries>
.gitignore
agent-tracking-pad/
AGENTS.md
agents/
command/
commands/
deny-prompts/
diabledagents/
disabledcommands/
get-shit-done/
gsd-file-manifest.json
gsd-local-patches/
gsd-pristine/
gsd-user-files-backup/
hivefiver/
hooks/
node_modules/
opencode.json
package-lock.json
package.json
plugins/
research/
retired/
rules/
settings.json
skills/
state/
trashskills/

(28 entries)
</entries>
```

---

## Assistant (Build · MiMo-V2.5-Pro (Precision) · 8.2s)

_Thinking:_

Now I see the actual picture:

1. `.opencode/command/` (singular) has 65 GSD commands — these are GSD's commands that were installed
2. `.opencode/commands/` (plural) exists but is empty (no glob results)
3. `.opencode/command/` has ONLY gsd-* commands - NO hm-* or hivemind-specific commands at all
4. The hivemind-specific commands should be in `.opencode/commands/` but it's apparently empty

This confirms the user's point: the commands system is missing for Hivemind. GSD has 65 commands but Hivemind has 0 native commands.

Let me check the `commands/` directory more carefully and the hivemind-specific commands.

 

**Tool: glob**

**Input:**
```json
{
  "pattern": ".opencode/commands/*",
  "path": "/Users/apple/hivemind-plugin-private"
}
```

**Output:**
```
No files found
```

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.opencode/commands"
}
```

**Output:**
```
<path>/Users/apple/hivemind-plugin-private/.opencode/commands</path>
<type>directory</type>
<entries>
.gitkeep
deep-init.md
deep-research-synthesis-repomix.md
gsd-add-tests.md
gsd-ai-integration-phase.md
gsd-audit-fix.md
gsd-audit-milestone.md
gsd-audit-uat.md
gsd-autonomous.md
gsd-capture.md
gsd-cleanup.md
gsd-code-review.md
gsd-complete-milestone.md
gsd-config.md
gsd-debug.md
gsd-discuss-phase.md
gsd-docs-update.md
gsd-eval-review.md
gsd-execute-phase.md
gsd-explore.md
gsd-extract-learnings.md
gsd-fast.md
gsd-forensics.md
gsd-graphify.md
gsd-health.md
gsd-help.md
gsd-import.md
gsd-inbox.md
gsd-ingest-docs.md
gsd-manager.md
gsd-map-codebase.md
gsd-milestone-summary.md
gsd-mvp-phase.md
gsd-new-milestone.md
gsd-new-project.md
gsd-ns-context.md
gsd-ns-ideate.md
gsd-ns-manage.md
gsd-ns-project.md
gsd-ns-review.md
gsd-ns-workflow.md
gsd-pause-work.md
gsd-phase.md
gsd-plan-phase.md
gsd-plan-review-convergence.md
gsd-pr-branch.md
gsd-profile-user.md
gsd-progress.md
gsd-quick.md
gsd-resume-work.md
gsd-review-backlog.md
gsd-review.md
gsd-secure-phase.md
gsd-settings.md
gsd-ship.md
gsd-sketch.md
gsd-spec-phase.md
gsd-spike.md
gsd-stats.md
gsd-thread.md
gsd-ui-phase.md
gsd-ui-review.md
gsd-ultraplan-phase.md
gsd-undo.md
gsd-update.md
gsd-validate-phase.md
gsd-verify-work.md
gsd-workspace.md
gsd-workstreams.md
gsd/
harness-audit.md
harness-doctor.md
hf-absorb.md
hf-audit.md
hf-configure.md
hf-create.md
hf-prompt-enhance-to-plan.md
hf-prompt-enhance.md
hf-stack.md
plan.md
start-work.md
sync-agents-md.md
test-echo.md
test-list.md
test-spike-execute.md
test-status.md
ultrawork.md

(87 entries)
</entries>
```

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.hivefiver-meta-builder/commands-lab"
}
```

**Output:**
```
<path>/Users/apple/hivemind-plugin-private/.hivefiver-meta-builder/commands-lab</path>
<type>directory</type>
<entries>
active/
research-analysis-group/

(2 entries)
</entries>
```

---

## Assistant (Build · MiMo-V2.5-Pro (Precision) · 29.7s)

_Thinking:_

Now I see the full picture. There ARE commands in `.opencode/commands/` - 87 entries. But these are:
- gsd-* commands (namespace routers + concrete commands) — GSD's framework
- A few hivemind-specific: `start-work.md`, `plan.md`, `deep-init.md`, `harness-audit.md`, `harness-doctor.md`, `ultrawork.md`, `sync-agents-md.md`, and some `hf-*` commands
- But there are NO hm-* commands, NO two-stage routing for Hivemind's own workflow

And `.opencode/command/` (singular, no 's') has 65 GSD commands that were installed from the GSD framework install.

So the situation is:
1. GSD has its own command system (65 commands) in both `.opencode/command/` and `.opencode/commands/`
2. Hivemind has only ~19 commands mixed in the same directory
3. There's no Hivemind-native command architecture (namespace routers for hm-*, workflow files, references, templates)
4. The commands are flat, not using GSD's two-stage routing pattern

The user is saying:
1. We need phases to BUILD the commands/references/templates infrastructure for Hivemind
2. Primitives should be managed as schema+code in `assets/`, extracted at install time
3. `.opencode/` symlinks are wrong - they should be real files extracted during install
4. All of this connects to the bootstrap/user init flow

Let me now write a comprehensive analysis of the expanded phase structure.

Đã rõ hiện trạng. `.opencode/commands/` có 87 entries (65 gsd-* + 19 hivemind-specific) **nhưng không có hm-* commands, không có two-stage routing, không có references/templates riêng của Hivemind.**

Đây là phân tích cluster đầy đủ sau khi nghiên cứu kỹ:

---

## 5 Clusters Gốc + 2 Clusters Mới Phát Hiện

| Cluster | Mô tả | Phases liên quan | Trạng thái |
|---------|-------|------------------|------------|
| **D** | Runtime Foundation (session-tracker, delegation, trajectory, pressure) | P24-P26 (existing) | Partial built, cần stabilize |
| **A** | Agent Quality & Hierarchy | P24.1-P24.2 (MỚI) | Chưa bắt đầu |
| **B** | Artifact/Document Governance | P26.1-P26.2 (MỚI) | Chưa bắt đầu |
| **C** | Routing System (commands, refs, templates, workflows) | **P24.3-P24.6 (MỚI)** | **HOÀN TOÀN THIẾU** |
| **E** | Primitives Asset Management (schema+code, install-time extraction) | **P24.7-P24.8 (MỚI)** | **SAI KIẾN TRÚC** |
| **F** | Bootstrap Init Flow (user setup, routing governance plane) | P24.9 (MỚI) | BOOT đã có nhưng thiếu |
| **G** | Cleanup & Shipping | P32-P38 (existing) | Cuối cùng |

---

## Expand Phase 24.x — đây là nơi xử lý routing + governance plane

### P24 (gốc): Coordination Dispatch + Delegate-Task Fix
Runtime stabilization — session-tracker, delegation-status, notification loop fix.

### P24.1: Agent Hierarchy Restructure (Cluster A)
- Bỏ L1 agent
- L0 là front-facing duy nhất
- L2/L3 classify theo domain (không theo depth)
- Agent mode = "all", hidden nếu không front-facing
- Fix permissions: remove `websearch`, fix `node * ` trailing space

### P24.2: Agent Profile Quality Enforcement (Cluster A)
- Rewrite ALL hm-* agents với execution flows, success metrics, artifact contracts
- Agent profiles THIN — chỉ chứa: domain, tools, switch/command logics
- Looping/gating/hierarchy/checkpoint → programmatic (không ở profile)

### P24.3: Commands Infrastructure (Cluster C — **MỚI**)
**Đây là nền tảng routing. Hiện tại Hivemind KHÔNG CÓ command infrastructure riêng.**
- Thiết kế namespace routers (hm-workflow, hm-project, hm-manage, hm-explore)
- Workflow separation: thin commands + fat workflow files
- YAML frontmatter schema cho commands (name, description, tools, agent, subtask)
- `execute-slash-command` integration với routing

### P24.4: References & Templates System (Cluster C — **MỚI**)
**Routing không thể hoạt động nếu không có references và templates.**
- Standardized reference format và discovery
- Template engine cho commands/workflows
- `@-reference` mechanism (GSD-style)
- `.hivemind/references/` và `.hivemind/templates/` structure

### P24.5: Workflow Files Architecture (Cluster C — **MỚI**)
- Workflow size budget (XL=1700, LARGE=1500, DEFAULT=1000, STRICT=500)
- Workflow decomposition pattern (modes/, templates/, shared knowledge)
- Pipeline: discuss → plan → execute → verify → ship (Hivemind-native)
- Cross-workflow sharing và composition

### P24.6: Build HM-* Commands (Cluster C — **MỚI**)
**Tạo actual hm-* commands sử dụng infrastructure từ P24.3-P24.5.**
- `hm-init-project` — bootstrap project (Hivemind-native)
- `hm-discuss` — context gathering
- `hm-plan` — spec-driven planning
- `hm-execute` — wave-based execution
- `hm-verify` — gate triad verification
- `hm-gate` — quality gate runner
- `hm-debug` — systematic debugging
- `hm-audit` — milestone/phase audit
- `hm-research` — deep research pipeline

### P24.7: Primitives Asset Schema (Cluster E — **MỚI**)
**Hiện tại primitives ở `.hivefiver-meta-builder/` → symlinks → `.opencode/`. SAI.**
- Thiết kế schema cho từng primitive type (agent, command, skill, tool, workflow)
- Code-gen từ schema → `src/assets/` (shipped with npm package)
- Runtime validation: `assets/schemas/agent.schema.ts`, `command.schema.ts`, v.v.
- TypeScript types cho mọi primitive

### P24.8: Primitives Install-Time Extraction (Cluster E — **MỚI**)
- `npx hivemind init` → extract primitives từ `assets/` vào `.opencode/`
- Không symlinks — real files, extracted tại install time
- Global vs project-based primitives
- `opencode.json` config integration (user có thể override)
- Permissions resolution: detect conflicts, merge, validate

### P24.9: Bootstrap Init Flow Expansion (Cluster F — **MỚI**)
**Routing và governance plane bắt đầu từ user setup.**
- Mở rộng `npx hivemind init` để:
  1. Tạo `.hivemind/` structure
  2. Extract primitives vào `.opencode/`
  3. Khởi tạo routing governance plane
  4. Detect conflicts với frameworks khác (GSD, BMAD, v.v.)
  5. Thiết lập user config plane
- `hivemind doctor` mở rộng với routing health check

---

## Thứ tự Đầy Đủ

| Thứ tự | Phase | Cluster | Lý do |
|--------|-------|---------|-------|
| 1 | **P24** (existing) | D | Runtime foundation — session, delegation, notification |
| 2 | **P24.1** | A | Agent hierarchy — foundation cho mọi thứ |
| 3 | **P24.2** | A | Agent quality enforcement |
| 4 | **P24.3** | C | Commands infrastructure — **routing nền tảng** |
| 5 | **P24.4** | C | References & templates — routing không thể thiếu |
| 6 | **P24.5** | C | Workflow architecture — routing execution |
| 7 | **P24.6** | C | Build HM-* commands — **actual commands** |
| 8 | **P25** (existing) | D | Trajectory + Contracts |
| 9 | **P26** (existing) | D | Pressure + Notification |
| 10 | **P26.1** | B | Artifact naming convention — **trước routing mở rộng** |
| 11 | **P26.2** | B | Artifact gatekeeping |
| 12 | **P24.7** | E | Primitives asset schema — **trước khi ship** |
| 13 | **P24.8** | E | Primitives install-time extraction |
| 14 | **P24.9** | F | Bootstrap init flow expansion |
| 15 | **P27** (existing, mở rộng) | C | Routing + Intent Loop + namespace routers |
| 16 | **P28** (existing, mở rộng) | C | Hook Injection + workflow integration |
| 17 | **P29-P31** (existing) | — | Schema/Kernel/Config |
| 18 | **P32-P38** (existing) | G | Cleanup, shipping |

**Tổng phase mới cần thêm: 9** (P24.1-P24.9)
**Phase mở rộng scope: 2** (P27, P28)
**Tổng: 11 phases mới/expanded trước P29.**

Muốn tôi delegation `gsd-roadmapper` để cập nhật ROADMAP/STATE và tạo folders cho các phase này?

---

## User

route và cập nhật và thêm folders tương ứng

---

## Assistant (Build · MiMo-V2.5-Pro (Precision))

_Thinking:_

The user wants me to:
1. Delegate `gsd-roadmapper` to update ROADMAP.md and STATE.md with all the new phases
2. Create the corresponding folders for the new phases

Let me delegate this task. I need to be careful about the prompt - as per AGENTS.md, I should announce the subagent and set clear boundaries/success metrics.

Actually, wait - the advisor-researcher task is still running or has completed. Let me check... It looks like the advisor-researcher completed and returned a result earlier.

Let me delegate to gsd-roadmapper to update the roadmap and state.

**Tool: task**

**Input:**
```json
{
  "description": "Update roadmap with all new phases",
  "subagent_type": "gsd-roadmapper",
  "prompt": "Bạn là subagent gsd-roadmapper. Bạn được front-facing agent delegate để cập nhật ROADMAP.md và STATE.md với 9 phases mới (P24.1-P24.9), đồng thời tạo folders.\n\n## Context\n\nDự án Hivemind — OpenCode harness plugin (npm package). Phase 23 đang ACTIVE. Sau phân tích 15+ documents từ Phase 23, GSD/OMO research, và DEBTS-REGISTER, xác định cần 9 phases mới chèn vào Phase 24.x series và 2 phases mở rộng scope (P27, P28).\n\n### Các phase MỚI cần chèn (tất cả đều Depends On: P24)\n\n**P24.1 — Agent Hierarchy Restructure** (Cluster A)\n- Depends On: P24\n- Blocks: P24.2\n- Status: 🟡 PLANNED\n- Remove L1 agent, L0 sole front-facing, L2/L3 classify by domain not depth, fix permissions/ temp/size violations. Debts: C-1, C-3, M-1, L-2, L-3.\n\n**P24.2 — Agent Profile Quality Enforcement** (Cluster A)\n- Depends On: P24.1\n- Blocks: P24.3\n- Status: 🟡 PLANNED\n- Rewrite ALL hm-* agents with THIN profiles (domain, tools, switch/command logic only). Looping/gating/hierarchy → programmatic. Debts: H-2, M-3, M-7, M-8.\n\n**P24.3 — Commands Infrastructure** (Cluster C)\n- Depends On: P24.2\n- Blocks: P24.4\n- Status: 🟡 PLANNED\n- Namespace routers design, workflow separation, YAML frontmatter schema, execute-slash-command routing integration. GSD research evidence: 67 commands + 88 workflows pattern.\n\n**P24.4 — References & Templates System** (Cluster C)\n- Depends On: P24.3\n- Blocks: P24.5\n- Status: 🟡 PLANNED\n- Standardized reference format, template engine, @-reference mechanism. `.hivemind/references/` và `.hivemind/templates/` structure.\n\n**P24.5 — Workflow Files Architecture** (Cluster C)\n- Depends On: P24.4\n- Blocks: P24.6\n- Status: 🟡 PLANNED\n- Workflow size budget (XL=1700, LARGE=1500, DEFAULT=1000, STRICT=500). modes/, templates/ decomposition. Pipeline: discuss → plan → execute → verify → ship.\n\n**P24.6 — Build HM-* Commands** (Cluster C)\n- Depends On: P24.5\n- Blocks: P25\n- Status: 🟡 PLANNED\n- Create actual hm-* commands: hm-init-project, hm-discuss, hm-plan, hm-execute, hm-verify, hm-gate, hm-debug, hm-audit, hm-research.\n\n**P24.7 — Primitives Asset Schema** (Cluster E)\n- Depends On: P26 (runs after P26, parallel to P27)\n- Status: 🟡 PLANNED\n- Schema cho từng primitive type (agent, command, skill, tool, workflow). Code-gen từ schema → `src/assets/`. Runtime validation. Fix: hiện tại primitives ở `.hivefiver-meta-builder/` → symlinks → `.opencode/` (SAI).\n\n**P24.8 — Primitives Install-Time Extraction** (Cluster E)\n- Depends On: P24.7\n- Status: 🟡 PLANNED\n- `npx hivemind init` extracts primitives từ `assets/` vào `.opencode/`. Không symlinks — real files. Global vs project-based. Permissions resolution.\n\n**P24.9 — Bootstrap Init Flow Expansion** (Cluster F)\n- Depends On: P24.8\n- Status: 🟡 PLANNED\n- Mở rộng bootstrap: tạo `.hivemind/`, extract primitives, init routing governance plane, detect framework conflicts, user config plane.\n\n### Phases mở rộng scope\n\n**P27 — Routing + Intent Loop Foundation** (Cluster C, mở rộng)\n- Giữ dependency cũ: P26\n- Thêm scope: namespace meta-skills (two-stage routing), workflow separation patterns, intent classification integration\n\n**P28 — Hook Injection Plane Redesign** (Cluster C, mở rộng)\n- Giữ dependency cũ: P27\n- Thêm scope: workflow size budget enforcement, command inventory drift-guard, hook-to-workflow wiring\n\n### Thứ tự đầy đủ (sau khi chèn)\n\n1. P24 (Coordination Dispatch + Delegate-Task Fix) — existing\n2. **P24.1 (Agent Hierarchy Restructure) — MỚI**\n3. **P24.2 (Agent Profile Quality Enforcement) — MỚI**\n4. **P24.3 (Commands Infrastructure) — MỚI**\n5. **P24.4 (References & Templates System) — MỚI**\n6. **P24.5 (Workflow Files Architecture) — MỚI**\n7. **P24.6 (Build HM-* Commands) — MỚI**\n8. P25 (Trajectory + Agent-Work-Contract Redesign) — existing\n9. P26 (Pressure + Notification Redesign) — existing\n10. P26.1 (Artifact Naming & Pathing Convention) — MỚI (từ phân tích trước)\n11. P26.2 (Artifact Dependency & Gatekeeping) — MỚI (từ phân tích trước)\n12. **P24.7 (Primitives Asset Schema) — MỚI** (runs sau P26)\n13. **P24.8 (Primitives Install-Time Extraction) — MỚI**\n14. **P24.9 (Bootstrap Init Flow Expansion) — MỚI**\n15. P27 (Routing + Intent Loop - mở rộng) — existing, expanded scope\n16. P28 (Hook Injection - mở rộng) — existing, expanded scope\n17. P29-P38 — existing\n\n## Nhiệm vụ\n\n1. **Đọc ROADMAP.md** hiện tại (`.planning/ROADMAP.md`)\n2. **Đọc STATE.md** hiện tại (`.planning/STATE.md`)\n3. **Cập nhật ROADMAP.md**: chèn 9 phases P24.1-P24.9 vào đúng vị trí (sau P24, với P24.7-P24.9 sau P26), cập nhật mô tả P27/P28\n4. **Cập nhật STATE.md**: thêm decision records, cập nhật phase list, progress\n5. **Tạo folders** cho tất cả phases mới:\n   - `.planning/phases/24.1-agent-hierarchy-restructure/.gitkeep`\n   - `.planning/phases/24.2-agent-profile-quality/.gitkeep`\n   - `.planning/phases/24.3-commands-infrastructure/.gitkeep`\n   - `.planning/phases/24.4-references-templates-system/.gitkeep`\n   - `.planning/phases/24.5-workflow-files-architecture/.gitkeep`\n   - `.planning/phases/24.6-build-hm-commands/.gitkeep`\n   - `.planning/phases/24.7-primitives-asset-schema/.gitkeep`\n   - `.planning/phases/24.8-primitives-install-extraction/.gitkeep`\n   - `.planning/phases/24.9-bootstrap-init-flow/.gitkeep`\n   - `.planning/phases/26.1-artifact-naming-convention/.gitkeep`\n   - `.planning/phases/26.2-artifact-dependency-gatekeeping/.gitkeep`\n\n## Constraints\n\n- Giữ nguyên định dạng ROADMAP.md hiện tại (dạng bảng markdown với Phase/Title/Status/Depends On/Evidence Required)\n- Giữ nguyên YAML frontmatter của STATE.md\n- Phase numbering: decimal (P24.1, P24.2, etc.)\n- 11 folders total với .gitkeep mỗi folder\n- Atomic commits: ROADMAP+STATE update 1 commit, folders 1 commit riêng\n- Commit format: `phase: what changed — why it matters`\n- Không xóa hoặc sửa phases hiện tại, chỉ chèn thêm và mở rộng scope P27/P28"
}
```

---

