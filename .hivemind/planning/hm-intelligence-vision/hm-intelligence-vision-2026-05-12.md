[LANGUAGE: Write this file in vi per Language Governance.]
# Hivemind Intelligence Layer — Tầm Nhìn Chiến Lược

**Mã:** HM-INTEL-VISION-01  
**Tác giả:** hm-l0-orchestrator  
**Ngày:** 2026-05-12  
**Trạng thái:** SYNTHESIS  
**Dựa trên research:** `.hivemind/research/opencode-context-architecture-2026-05-11/`  
**Mức độ tin cậy:** CAO (dual-source verified, 96+ cited sources)

---

## Mục Lục

1. [Tuyên Ngôn: Intelligence Layer, Không Phải Memory Layer](#1-tuyên-ngôn)
2. [7 Game-Changing Features](#2-game-changing-features)
3. [So Sánh Ecosystem](#3-so-sánh-ecosystem)
4. [Kiến Trúc Đề Xuất](#4-kiến-trúc)
5. [Roadmap Implementation](#5-roadmap)
6. [Rủi Ro và Giảm Thiểu](#6-rủi-ro)
7. [Kết Luận](#7-kết-luận)

---

## 1. Tuyên Ngôn: Intelligence Layer, Không Phải Memory Layer

### 1.1 Vấn Đề Của Ecosystem Hiện Tại

Toàn bộ ecosystem OpenCode context management đang mắc một sai lầm cơ bản: **họ xây memory systems, không phải intelligence layers.**

| Plugin | Cách Tiếp Cận | Giới Hạn Chết Người |
|--------|--------------|---------------------|
| Magic Context | SQLite memories + background historian | Không có quality gates, không thể verify memories có đúng không |
| ACM | Sliding window + priority levels | Chỉ quản lý context, không học từ failures |
| LCM | FTS5 search + lineage tracking | Chỉ search được, không enforce được decisions |
| context-mem | 14 summarizers + 4-tier compression | Compression tới 99.1% nhưng mất context quan trọng |
| railroad-memory | Hierarchical tiers | Import decay — quên dần những gì quan trọng |
| DCP | Model-triggered compression | Hoàn toàn phụ thuộc vào model tự quyết định |

**Vấn đề chung:** Tất cả đều xử lý context như một **vấn đề lưu trữ**, không phải **vấn đề bằng chứng và quyết định**.

### 1.2 Luận Điểm Cốt Lõi

> **Hivemind không cần thêm một "memory system" nữa.**
> Hivemind đã có: **delegation graph + quality gates + artifact chain + work contracts + session lineage.**
> 
> **Những gì cần là kết nối chúng lại thành một Intelligence Layer — nơi mọi quyết định đều có bằng chứng, mọi pattern đều được học, và mọi rủi ro đều được phát hiện trước khi xảy ra.**

### 1.3 Ba Trụ Cột Của Intelligence Layer

```
┌─────────────────────────────────────────────────────────────┐
│                 HIVEMIND INTELLIGENCE LAYER                  │
├─────────────────┬─────────────────┬─────────────────────────┤
│  DETERMINISTIC  │   SELF-LEARN    │     GOVERNANCE          │
│    MEMORY       │   PATTERNS      │     ENFORCEMENT         │
├─────────────────┼─────────────────┼─────────────────────────┤
│ • Artifact      │ • Pitfall DB    │ • Gate triad            │
│   persistence   │ • Failure       │ • Work contracts        │
│ • Evidence      │   patterns      │ • Plugin hooks          │
│   chain         │ • Git history   │ • Cross-branch          │
│ • Session       │ • Cross-branch  │   governance            │
│   lineage       │   learning      │ • Regression prevention │
└─────────────────┴─────────────────┴─────────────────────────┘
```

---

## 2. 7 Game-Changing Features

### 2.1 Deterministic Artifact Memory (Thay vì "Fuzzy Vector Memory")

**Vấn đề ecosystem:**
- Vector memory (context-mem, railroad-memory): tìm "có vẻ liên quan" nhưng không bao giờ chắc chắn
- Summarization memory (Magic Context): mất detail, không trace được gốc

**Giải pháp Hivemind:**
Mọi delegation trong Hivemind đều tạo artifact có:
- **Classification**: domain, type, evidence level (L1-L5)
- **Evidence chain**: artifact này được tạo bởi agent nào, từ session nào, dựa trên quyết định gì
- **Deterministic path**: đường dẫn file chính xác, không cần search mơ hồ

```typescript
// Ecosystem approach: "tìm memory giống với query này"
const memories = await vectorStore.similaritySearch("fix bug trong delegation")

// Hivemind approach: "truy xuất artifact từ session cụ thể"
const artifacts = await hivemind.getArtifacts({
  sessionId: "hm-2026-05-11-abcd",
  domain: "Debug",
  minEvidenceLevel: "L3" // chỉ lấy những cái đã được verify
})
```

**Tác động:** Agent không bao giờ phải "đoán" memory — có thể truy xuất artifact một cách deterministic, biết chính xác mức độ tin cậy của từng piece of information.

**Cơ chế cụ thể:**
```
Mỗi artifact được tạo → ghi vào artifact inventory:
  .hivemind/state/artifact-inventory.json
  {
    artifactPath: ".hivemind/planning/session-x/findings.md",
    producingAgent: "hm-l2-researcher",
    sessionId: "session-x",
    domain: "Research",
    type: "findings",
    evidenceLevel: "L3",
    gateVerdict: "PASS",
    producedAt: "2026-05-12T10:00:00Z",
    tags: ["debug", "delegation", "root-cause"]
  }
```

### 2.2 Self-Learning Pitfall Database

**Vấn đề ecosystem:**
Không có hệ thống nào học từ failures. Mỗi lần agent mắc lỗi, lần sau lại mắc y hệt.

**Giải pháp Hivemind:**
Sử dụng quality gate triad (lifecycle → spec → evidence) làm cơ chế phát hiện failure, và tự động trích xuất pattern:

```
Gate FAIL → Extract pattern → Lưu vào pitfall DB → Check trên task mới
```

**Pitfall database structure:**
```json
{
  "patterns": [
    {
      "id": "pitfall-001",
      "domain": "Implementation",
      "pattern": "Thay đổi interface mà không update consumer",
      "trigger": {
        "taskType": "cross-cutting-change",
        "filesTouched": ["src/shared/types.ts"],
        "missingAction": "update consumers"
      },
      "severity": "HIGH",
      "gateFailed": "spec-compliance",
      "evidencePath": ".hivemind/planning/session-x/gate-report.md",
      "timesEncountered": 3,
      "lastEncountered": "2026-05-10"
    }
  ]
}
```

**Cách hoạt động:**
1. Mỗi lần task được dispatch, kiểm tra task pattern với pitfall DB
2. Nếu match → inject cảnh báo vào task prompt: "CẢNH BÁO: Pattern này đã fail 3 lần trước. Hãy kiểm tra X, Y, Z"
3. Nếu vẫn fail → increment counter và enrich pattern với thông tin mới
4. Sau N lần (configurable) → tự động block task và yêu cầu human review

**Không giống như checkpoint** — đây là *tập tính học được từ lịch sử*, áp dụng chủ động trước khi lỗi xảy ra.

### 2.3 Cross-Branch Git Intelligence

**Vấn đề ecosystem:**
Không có hệ thống nào biết chuyện gì đã xảy ra ở branch khác. Developer switch branch, agent mất context hoàn toàn.

**Giải pháp Hivemind:**
Kết hợp git commit graph + delegation records thành knowledge graph về intent.

```
Git history + Hivemind delegation metadata = Cross-branch intelligence

Branch A: commit "fix: delegation timeout handling"
  → Delegation record: hm-l2-debugger investigated root cause
  → Artifact: .hivemind/planning/session-y/ROOT-CAUSE.md
  → Kết luận: "Timeout do queue-key validation thiếu"

Branch B (mới): developer gặp lại timeout issue
  → Hivemind: "Branch A đã xử lý vấn đề này. Root cause tại queue-key validation.
     Artifact: .hivemind/planning/session-y/ROOT-CAUSE.md (evidence: L3)"
```

**Deterministic mechanism:**
```bash
# Khi dispatch task, Hivemind tự động:
git log --all --grep="<task-keywords>" --format="%H %s"
# Match commit messages với delegation records
# Trả về cross-branch context
```

**Key innovation:** Hivemind không cần parse code — chỉ cần git log + delegation metadata. Đây là lý do nó **nhẹ và deterministic**.

### 2.4 Evidence-Backed Governance (Rules Không Phải Docs)

**Vấn đề ecosystem:**
- AGENTS.md, CLAUDE.md bị compaction "quên" sau 1-2 lần compact
- Rules chỉ là text, không có enforcement
- Developer viết rules nhưng agent không bao giờ nhớ

**Giải pháp Hivemind:**
1. **Plugin hook injection**: `experimental.session.compacting` injects active governance rules vào compaction summary — rules **sống sót qua compaction**
2. **Evidence-backed**: Mỗi rule được kèm evidence path — agent có thể tra cứu lý do tại sao rule tồn tại
3. **Enforcement qua gate triad**: Nếu rule yêu cầu X, gate sẽ kiểm tra X

**Cơ chế inject:**
```typescript
// Plugin: experimental.session.compacting hook
async function injectGovernance(input, output) {
  output.context.push(`
## Active Governance Rules
1. "Không git push thẳng vào main" — reason: đã gây ra 3 incidents (xem .hivemind/state/incidents.md)
2. "Mọi thay đổi src/shared/ phải qua gate" — evidence: spec-compliance required
3. "Cross-branch changes cần architecture review" — triggered by: pitfall-001

## Active Work Contracts
- Contract-abc: Delegation depth limit = 3
- Contract-xyz: Minimum evidence level = L3
  `);
}
```

**Tác động:** Developer viết rule một lần, agent nhớ mãi mãi, và có bằng chứng tại sao rule tồn tại.

### 2.5 Session Lineage Backbone

**Vấn đề ecosystem:**
Subagents stateless, không kế thừa context. Cross-session context hoàn toàn không tồn tại.

**Giải pháp Hivemind:**
Session tree trở thành backbone cho mọi context inheritance:

```
Session A (root: planning feature X)
├── Session A1 (subagent: research tech stack)
│   ├── Session A1a (subagent: research database options)
│   └── Session A1b (subagent: research API patterns)
├── Session A2 (subagent: implement database layer)
│   └── Gate: lifecycle → spec → evidence (PASS)
└── Session A3 (subagent: implement API layer)
    └── Gate: lifecycle → spec → evidence (FAIL → remediate)
    
Session B (new session, same project)
  → Kế thừa: decisions từ A, gate results từ A2/A3, artifact paths
  → Không cần re-read: đã biết A3 fail vì spec-compliance
```

**Cơ chế:**
```json
{
  "sessionId": "B",
  "inheritedFrom": ["A", "A1", "A2", "A3"],
  "inheritedArtifacts": [
    ".hivemind/planning/session-a/landscape.md",
    ".hivemind/planning/session-a2/IMPLEMENTATION.md",
    ".hivemind/planning/session-a3/GATE-REPORT.md"
  ],
  "activeDecisions": [
    {"decision": "Use PostgreSQL", "evidence": ".hivemind/planning/session-a1a/RESEARCH.md"},
    {"decision": "Drizzle ORM for type safety", "evidence": ".hivemind/planning/session-a1b/RESEARCH.md"}
  ],
  "openGates": [
    {"domain": "Integration", "status": "PENDING", "blockedBy": null}
  ]
}
```

### 2.6 Local-First Multi-Modal Store

**Vấn đề ecosystem:**
- Magic Context: SQLite + JSON
- LCM: SQLite FTS5
- context-mem: Local JSON
- Không có chuẩn chung, không tận dụng được data từ nhau

**Giải pháp Hivemind:**
Bốn tầng lưu trữ, mỗi tầng phục vụ một mục đích khác nhau, **tất cả đều local, không cần Docker, không cần cloud**:

| Tầng | Công Nghệ | Mục Đích | Deterministic? |
|------|-----------|----------|---------------|
| **Cấu trúc** | SQLite (OpenCode sẵn có) | Session, delegation, gate records | ✅ Hoàn toàn |
| **Toàn văn** | FTS5 trong SQLite | Search artifacts, decisions, findings | ✅ Hoàn toàn |
| **File** | Filesystem (`.hivemind/`) | Artifacts, reports, documentation | ✅ Hoàn toàn |
| **Đồ thị** | Git (commit graph) | Cross-branch intelligence, intent graph | ✅ Hoàn toàn |

**Optional (khi cần similarity):**
| **Ngữ nghĩa** | Vector (SQLite + extension / local model) | Fuzzy recall, "có vẻ liên quan" | ❌ Probabilistic |

**Triết lý:** 4 tầng deterministic là bắt buộc. Tầng vector là optional và chỉ dùng khi thực sự cần similarity search. **Không bao giờ dùng vector cho governance hoặc decisions.**

### 2.7 Plugin Hook Ecosystem cho Context Survival

**Vấn đề ecosystem:**
- OpenCode compaction là lossy — mất context quan trọng
- Subagents stateless — mất context khi dispatch
- Session resume không fire hooks — mất context khi restart

**Giải pháp Hivemind:**
Ba plugin hooks được implement để đảm bảo context **sống sót qua mọi biến cố**:

```
┌────────────────────────────────────────────────────────────┐
│                   HIVEMIND PLUGIN HOOKS                     │
├────────────────────┬───────────────────┬───────────────────┤
│ experimental.      │ experimental.     │ experimental.     │
│ session.compacting │ chat.system.      │ chat.messages.    │
│                    │ transform         │ transform         │
├────────────────────┼───────────────────┼───────────────────┤
│ Inject:            │ Inject:           │ Filter:           │
│ • Trajectory       │ • Active rules    │ • Remove stale    │
│ • Work contracts   │ • Artifact        │ • Mark protected  │
│ • Gate results     │   inventory       │ • Reorder by      │
│ • Active decisions │ • Session lineage │   priority        │
│ • Open tasks       │ • Pitfall alerts  │ • Inject context  │
│                    │ • Governance      │   reminders       │
└────────────────────┴───────────────────┴───────────────────┘
```

**Tác động tổng hợp:**
- Compaction không còn là "mất trí nhớ" — context quan trọng luôn được inject
- Rules không bao giờ bị quên — injected ở mọi session start và mọi compaction
- Agents tự biết context budget — system prompt reminder mỗi turn

---

## 3. So Sánh Ecosystem

### 3.1 Ma Trận Tính Năng

| Tính Năng | Magic Context | ACM | LCM | context-mem | **Hivemind (proposed)** |
|-----------|:---:|:---:|:---:|:---:|:---:|
| Cross-session memory | ✅ | ❌ | ✅ | ✅ | ✅ |
| Sliding window | ❌ | ✅ | ❌ | ❌ | ✅ |
| Priority-based pruning | ❌ | ✅ | ❌ | ✅ | ✅ |
| FTS5 search | ❌ | ❌ | ✅ | ❌ | ✅ |
| Vector search | ✅ | ❌ | ❌ | ✅ | Optional |
| **Deterministic artifact chain** | ❌ | ❌ | ❌ | ❌ | **✅** |
| **Quality gate triad** | ❌ | ❌ | ❌ | ❌ | **✅** |
| **Self-learning pitfalls** | ❌ | ❌ | ❌ | ❌ | **✅** |
| **Cross-branch git intelligence** | ❌ | ❌ | ❌ | ❌ | **✅** |
| **Evidence-backed governance** | ❌ | ❌ | ❌ | ❌ | **✅** |
| **Work contract enforcement** | ❌ | ❌ | ❌ | ❌ | **✅** |
| Plugin-based | ✅ | ✅ | ✅ | ❌ | ✅ |
| Local-first | ✅ | ✅ | ✅ | ✅ | ✅ |

### 3.2 Lợi Thế Cạnh Tranh Duy Nhất

**Không có hệ thống nào trong ecosystem có:**

1. **Delegation graph** + **Quality gates** + **Artifact chain** cùng lúc
2. Cơ chế deterministic để verify memory có đúng không (gate triad)
3. Khả năng học từ failures và tự động áp dụng (pitfall DB)
4. Governance được enforce ở runtime, không chỉ là text
5. Cross-branch intelligence không cần parse code

### 3.3 Điểm Yếu Của Các Hệ Thống Khác

| Hệ Thống | Điểm Yếu Chết Người |
|-----------|---------------------|
| Magic Context | Conflict detection chỉ ở startup level. Không thể verify memories. Phải disable built-in compaction → mất provider compatibility |
| ACM | Phụ thuộc vào user tự mark priority. Không có auto-learning. Fork-based → không dùng được stock OpenCode không fork |
| LCM | Sớm, chưa mature. Chỉ search được, không enforce được. 16 tools → quá nhiều cho agent context |
| context-mem | Compression hy sinh accuracy. 99.1% savings nhưng mất traceability. Không có session awareness |
| DCP | Model tự quyết định → không deterministic. Không có cross-session |

---

## 4. Kiến Trúc Đề Xuất

### 4.1 Tổng Quan

```
┌─────────────────────────────────────────────────────────────┐
│                    USER / DEVELOPER                          │
├─────────────────────────────────────────────────────────────┤
│                  HIVEMID INTELLIGENCE LAYER                  │
├────────────────┬────────────────┬───────────────────────────┤
│  PLUGIN HOOKS  │  CORE ENGINE   │      STORE                │
│  (inject)      │  (process)     │      (persist)            │
├────────────────┼────────────────┼───────────────────────────┤
│ session.       │ Pattern        │ SQLite:                   │
│ compacting     │ Detector       │ • sessions                │
│                │                │ • delegations             │
│ chat.system.   │ Pitfall        │ • gate records            │
│ transform      │ Matcher        │ • artifact inventory      │
│                │                │                           │
│ chat.messages. │ Context        │ Filesystem (.hivemind/):  │
│ transform      │ Assembler      │ • artifacts               │
│                │                │ • reports                 │
│ Custom Tools   │ Git History    │ • planning                │
│ (query)        │ Analyzer       │ • learned patterns        │
│                │                │                           │
│ events         │ Gate           │ Git:                      │
│ (monitor)      │ Orchestrator   │ • commit graph            │
│                │                │ • cross-branch            │
│                │                │ • intent                  │
└────────────────┴────────────────┴───────────────────────────┘
```

### 4.2 Data Flow

```
User prompt
    │
    ▼
┌─────────────────────┐
│ Plugin: system.     │ ← Inject governance, rules, pitfall alerts
│ transform           │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│ Plugin: messages.   │ ← Filter, prioritize, inject context
│ transform           │
└─────────┬───────────┘
          │
          ▼
    [Agent works]
          │
          ▼
┌─────────────────────┐
│ Gate Triad          │ ← lifecycle → spec → evidence
│ (nếu task kết thúc) │
└─────────┬───────────┘
          │
    ┌─────┴─────┐
    │           │
  PASS        FAIL
    │           │
    │           ▼
    │    ┌─────────────────┐
    │    │ Pitfall          │
    │    │ Extractor        │ ← Extract pattern → lưu vào DB
    │    └─────────────────┘
    │           │
    │           ▼
    │    ┌─────────────────┐
    │    │ Remediation      │ ← Dispatch lại với context đã biết
    │    └─────────────────┘
    │
    ▼
┌─────────────────────┐
│ Plugin: session.    │ ← Inject kết quả vào compaction summary
│ compacting          │
└─────────────────────┘
```

### 4.3 Deterministic Query API

```typescript
// === INTELLIGENCE LAYER API ===

// 1. Tra cứu artifact deterministic
hivemind.getArtifact({
  sessionId: "abc",
  domain: "Debug",
  type: "root-cause"
}) // → path xác định, evidence level biết trước

// 2. Kiểm tra pitfall trước khi dispatch
hivemind.checkPitfalls({
  taskType: "cross-cutting-change",
  filesTouched: ["src/shared/types.ts"]
}) // → [{pattern, severity, timesFailed}]

// 3. Cross-branch context
hivemind.getCrossBranchContext({
  keywords: ["delegation", "timeout"],
  branches: ["feature/new-queue"]
}) // → {commit, sessionId, artifactPath, conclusion}

// 4. Active governance
hivemind.getActiveGovernance() // → [{rule, evidence, reason}]

// 5. Gate status check
hivemind.getGateStatus({
  domain: "Implementation"
}) // → {openGates, lastVerdict, pendingDecisions}
```

---

## 5. Roadmap Implementation

### Phase 1: Plugin Hook Foundation (2-3 tuần)

**Mục tiêu:** Context sống sót qua compaction và session boundaries.

**Deliverables:**
- [ ] Implement `experimental.session.compacting` hook — inject trajectory, work contracts, active decisions
- [ ] Implement `experimental.chat.system.transform` hook — inject governance rules, artifact inventory
- [ ] Implement `experimental.chat.messages.transform` hook — dynamic message filtering
- [ ] Custom tool: `hivemind_query_state()` — agent tra cứu trạng thái session
- [ ] Custom tool: `hivemind_check_context()` — context budget breakdown

**Gate:** lifecycle → spec → evidence (PASS)

### Phase 2: Pitfall Database (2 tuần)

**Mục tiêu:** Học từ gate failures và tự động cảnh báo.

**Deliverables:**
- [ ] `.hivemind/state/learned-patterns/` directory structure
- [ ] Pitfall extractor — parse gate failure → structured pattern
- [ ] Pitfall matcher — match task pattern với known pitfalls
- [ ] Injection mechanism — inject warnings vào task prompt khi match
- [ ] Circuit breaker — block task sau N failures

**Gate:** spec → evidence (evidence: pitfall-* được phát hiện và ngăn chặn ít nhất 1 lần)

### Phase 3: Cross-Branch Git Intelligence (2 tuần)

**Mục tiêu:** Agents biết chuyện gì đã xảy ra ở branch khác.

**Deliverables:**
- [ ] Git commit ↔ delegation record matching
- [ ] Cross-branch context retriever — `git log --all --grep`
- [ ] Intent extraction từ commit messages + delegation metadata
- [ ] Knowledge graph: commit → session → artifact → decision
- [ ] Injection mechanism — inject cross-branch context khi dispatch task

**Gate:** lifecycle → spec → evidence (evidence: cross-branch context đã được sử dụng để ngăn chặn regression)

### Phase 4: Self-Improving Loop (1-2 tuần)

**Mục tiêu:** Intelligence layer tự động cải thiện theo thời gian.

**Deliverables:**
- [ ] Auto-pattern extraction (không cần manual)
- [ ] Pattern confidence scoring (dựa trên số lần match + verify)
- [ ] Automatic governance rule generation từ learned patterns
- [ ] Feedback loop: agent xác nhận pattern match → update confidence
- [ ] Analytics dashboard (read-only, dựa trên `.hivemind/` state)

**Gate:** evidence (L4: production usage với 10+ pattern matches verified)

---

## 6. Rủi Ro và Giảm Thiểu

### 6.1 Rủi Ro Kỹ Thuật

| Rủi Ro | Mức Độ | Giảm Thiểu |
|--------|--------|------------|
| Plugin hooks bị thay đổi ở OpenCode version mới | CAO | Abstraction layer: không phụ thuộc trực tiếp vào hook signatures. Có fallback mechanism |
| SQLite performance với artifact inventory lớn | THẤP | Indexing + pagination. < 10K artifacts là reasonable cho hầu hết projects |
| Git log performance với monorepo | TRUNG BÌNH | Giới hạn scope: chỉ search branch gần đây, cache kết quả |
| False positives từ pitfall matching | TRUNG BÌNH | Confidence scoring + human verification loop. Không auto-block ở phase đầu |

### 6.2 Rủi Ro Thiết Kế

| Rủi Ro | Giảm Thiểu |
|--------|------------|
| Overengineering — "thêm quá nhiều thứ" | Tuân thủ triết lý: chỉ thêm deterministic, local-first features. Không vector, không RAG, không external services |
| Developer resistance — "quá nhiều governance" | Governance chỉ inject khi có pitfall match. Developer không thấy governance nếu không có nguy cơ |
| Context overhead — plugin hooks thêm quá nhiều context | Token budget awareness: inject content dựa trên remaining budget. Ưu tiên critical context |
| Git dependency — không phải project nào cũng dùng git | Graceful degradation: không có git = skip cross-branch intelligence, vẫn chạy được các tính năng khác |

### 6.3 Nguyên Tắc Không Thương Lượng

1. **KHÔNG phân tích code** — chỉ dùng metadata (git log, commit messages, file paths)
2. **KHÔNG cần cloud services** — tất cả local
3. **KHÔNG cần Docker** — zero infrastructure
4. **KHÔNG vector search cho decisions** — decisions phải deterministic
5. **KHÔNG làm chậm developer workflow** — tất cả async, non-blocking
6. **KHÔNG thay thế OpenCode compaction** — augment, không replace

---

## 7. Kết Luận

### 7.1 Tóm Tắt

Hivemind có cơ hội duy nhất để trở thành **Intelligence Layer đầu tiên cho OpenCode ecosystem** — không chỉ là một "memory system" nữa, mà là một lớp nhận thức có:

- **Trí nhớ deterministic** (artifacts, evidence chain, session lineage)
- **Khả năng tự học** (pitfall database, pattern extraction, cross-branch learning)
- **Khả năng enforce** (plugin hooks, quality gates, work contracts)
- **Bền vững** (local-first, không cloud, không Docker, không infrastructure)

### 7.2 Điểm Khác Biệt

```
Ecosystem: Thêm memory system để nhớ nhiều hơn
Hivemind:  Kết nối những gì đã có (delegation + gate + artifact) 
           thành intelligence layer biết suy luận
           
Ecosystem: Vector similarity search (có thể đúng, có thể sai)
Hivemind:  Deterministic evidence chain (luôn đúng, có kiểm tra)

Ecosystem: Governance là docs (dễ quên sau compaction)
Hivemind:  Governance là code (injected, enforced, verified)

Ecosystem: Học từ failures là manual (dev tự nhớ)
Hivemind:  Học từ failures là automatic (gate → pattern → DB → alert)
```

### 7.3 Next Steps

1. **Phase 1** là ưu tiên cao nhất — plugin hooks cho context survival
2. **Phase 2** là điểm khác biệt lớn nhất so với ecosystem — pitfall learning
3. **Phase 3** mở rộng intelligence ra cross-branch — không ai làm
4. **Phase 4** tự động hóa toàn bộ — self-improving system

---

*Document synthesized by hm-l0-orchestrator. Based on research from hm-l2-researcher (2 parallel waves, 96+ sources).*
*Date: 2026-05-12*
