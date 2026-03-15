# 🧠 HiveMind v3.0 — The Relational Cognitive Engine
**HiveMind v3.0 — Động Cơ Nhận Thức Quan Hệ**

> **A Complete Architectural Overhaul. Coming Soon.**
> **Sự Thay Đổi Kiến Trúc Toàn Diện. Sắp Ra Mắt.**

<div align="center">
  
  [![Stars](https://img.shields.io/github/stars/shynlee04/hivemind-plugin?style=social)](https://github.com/shynlee04/hivemind-plugin/stargazers)
  [![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
  
  *From Flat-File Fallacy to Tier-1 Enterprise Agentic Framework*
  *Từ Ảo Tưởng File Phẳng đến Framework Agentic Doanh Nghiệp Hạng Nhất*

</div>

---

## 🎊 Lời Cảm Ơn / A Message from the Heart

**Chào bạn! Xin chào! Hello friend!**

Nhân dịp Tết Nguyên Đán sắp đến gần tại Việt Nam 🧧, tôi muốn gửi lời cảm ơn chân thành đến cộng đồng tuyệt vời này.

As Lunar New Year (Tết Nguyên Đán) approaches here in Vietnam 🧧, I find myself reflecting on this incredible journey. What started as a simple script to help me manage AI context has grown into something far more ambitious—and I couldn't have done it without this amazing community.

**Cảm ơn bạn rất nhiều! / Thank you!**

Những ngôi sao, phản hồi, và sự kiên nhẫn của bạn đã tiếp sức cho dự án này. Tôi đã dành nhiều tháng để kiến trúc lại thứ gì đó mà tôi tin rằng sẽ thay đổi cách chúng ta nghĩ về việc quản lý ngữ cảnh AI.

Your stars, your feedback, your patience with the bugs—it all fuels this passion project. I've been heads-down for months architecting something that I truly believe will change how we think about AI session governance.

**Điều này xứng đáng để chờ đợi. / This is worth the wait.**

---

## 🔥 Điều Gì Làm v3.0 Cách Mạng? / What Makes v3.0 Revolutionary?

Giải pháp "bộ nhớ" AI hiện tại? Họ đang đổ văn bản vào file markdown và hy vọng LLM tự tìm thấy những gì cần thiết. Đó không phải là bộ nhớ—đó là **nghĩa địa**.

The current landscape of AI "memory" solutions? They're dumping text into markdown files and hoping the LLM magically finds what it needs. That's not memory—that's a **graveyard**.

**HiveMind v3.0** giới thiệu **Động Cơ Nhận Thức Quan Hệ** / introduces the **Relational Cognitive Engine**:

### 🌳 Kiến Trúc `.hivemind` Mới / The New `.hivemind` Architecture

```
.hivemind/
├── ⚙️ system/                    # CORE GOVERNANCE & REGISTRY
│   ├── config.json               # TTS thresholds, 80% split limits
│   └── manifest.json             # Master Index (UUID mappings)
│
├── 🧠 graph/                     # RELATIONAL GRAPH DATABASE
│   ├── trajectory.json           # Dynamic "Read-Head" for intent shifts
│   ├── plans.json                # Epics & Phases
│   ├── tasks.json                # Execution Graph (Task → Sub-Task)
│   └── mems.json                 # Multi-shelf semantic knowledgebase
│
├── ⏱️ sessions/                  # NON-DISRUPTIVE SDK CONTAINERS
│   ├── active/session_main.json  # Token pressure tracking
│   └── swarms/                   # Headless Actor Model sessions
│
└── 📜 artifacts/                 # HUMAN-READABLE OUTPUTS
    ├── dashboards/               # Interactive 3D Brain-Map
    └── synthesis/                # Auto-generated reports
```

Chúng tôi chuyển từ file markdown phẳng sang **Cơ Sở Dữ Liệu Đồ Thị Quan Hệ** với UUID và Khóa Ngoại. Không còn dữ liệu mồ côi. Không còn lãng phí token.

We are moving from flat markdown files to a **Relational Graph Database** with UUIDs and Foreign Keys. No more orphaned data. No more token waste.

### ⚡ "Repomix-for-State" — Trình Biên Dịch Ngữ Cảnh / Context Compiler

Thay vì hy vọng LLM đọc file, chúng tôi **biên dịch ngữ cảnh một cách lập trình**:

Instead of hoping the LLM reads files, we **programmatically compile context**:

1. **Write-Through (Công cụ = Chi Thức)**: LLM sử dụng công cụ để thay đổi trạng thái
   **Write-Through (Tools = Conscious Limbs)**: LLM uses tools to mutate state
   
2. **Read-Auto (Hooks = Hệ Thần Kinh)**: Ngữ cảnh tự động inject qua OpenCode SDK
   **Read-Auto (Hooks = Subconscious Nervous System)**: Context injects automatically via OpenCode SDK

**Kết quả**: Không lãng phí token cho tool calls đọc dữ liệu. Ngữ cảnh quan hệ tinh khiết, tất định.
**Result**: Zero token waste on tool calls for reading. Pure, deterministic, relational context.

### 🎯 Các Mô Hình Tiêu Chuẩn Ngành / Industry-Standard Paradigms

- **CQRS**: Tách biệt Ghi và Đọc / Command Query Responsibility Segregation
- **Graph-RAG**: Duy trì quan hệ phân cấp (không phải cosine similarity trên file chết)
  Hierarchical relationships preserved (not cosine similarity on dead files)
- **Actor Model**: Session swarms cho nghiên cứu nền / Session swarms for headless background research
- **Time-to-Stale (TTS)**: Tự động dọn dẹp ngữ cảnh chết / Automatic pruning of dead context

---

## 👀 Sneak Peek: The Screens

<div align="center">

### Screen 1: The Cognitive Graph Architecture
*How we finally escaped the Flat-File Fallacy / Cách chúng tôi thoát khỏi Ảo Tưởng File Phẳng*

[View Screen 1 →](./docs/stitch-screens/screen-01.html)

---

### Screen 2: Relational Directory Tree
*Every entity has a UUID and Foreign Keys. No more orphans. / Mỗi thực thể có UUID và Khóa Ngoại. Không còn mồ côi.*

[View Screen 2 →](./docs/stitch-screens/screen-02.html)

---

### Screen 3: Schematic Entity Relationships
*The mathematical topology that makes programmatic traversal possible*

[View Screen 3 →](./docs/stitch-screens/screen-03.html)

---

### Screen 4: The Repomix I/O Flow
*Write-Through Tools + Read-Auto Hooks = The 2026 Standard*

[View Screen 4 →](./docs/stitch-screens/screen-04.html)

---

### Screen 5: Context Compiler Deep Dive
*How `cognitive-packer.ts` purifies and compresses state into XML*

[View Screen 5 →](./docs/stitch-screens/screen-05.html)

---

### Screen 6: SDK Hook Injection
*The invisible nervous system: `experimental.chat.messages.transform`*

[View Screen 6 →](./docs/stitch-screens/screen-06.html)

---

### Screen 7: Session Swarm Architecture
*Actor Model for headless background agents*

[View Screen 7 →](./docs/stitch-screens/screen-07.html)

---

### Screen 8: The 80% Rule & Non-Disruptive Splits
*Graceful session splitting without losing context*

[View Screen 8 →](./docs/stitch-screens/screen-08.html)

---

### Screen 9: Tool Consolidation Strategy
*From 14 unwired tools to 7 wired super-tools*

[View Screen 9 →](./docs/stitch-screens/screen-09.html)

---

### Screen 10: Testing & Verification Matrix
*84+ assertions, zero regressions, complete confidence*

[View Screen 10 →](./docs/stitch-screens/screen-10.html)

---

### Screen 11: Migration Roadmap
*6-phase overhaul from v2.6.0 to v3.0.0*

[View Screen 11 →](./docs/stitch-screens/screen-11.html)

</div>

---

## 🎯 The God Prompts (Câu Lệnh "Thần") / How We Build This

We're not asking AI to "refactor storage." We give them **systematic boundaries**:

### Prompt 1: Graph Database Schemas
```markdown
Define strict TypeScript Zod Schemas for cognitive entities:
- PlanNode: { id, SOT_symlink, title, status }
- PhaseNode: { id, parent_plan_id, title, status }
- TaskNode: { id, parent_phase_id, type, status }
- MemNode: { id, origin_task_id, shelf, staleness_stamp }
- TrajectoryNode: { active_plan_id, active_phase_id, active_task_ids[] }
```

### Prompt 2: The Cognitive Packer
```markdown
Create cognitive-packer.ts (the "Repomix-for-State"):
1. Read trajectory.json for the "Read-Head"
2. Traverse plans.json, tasks.json, mems.json
3. Apply TTS filtering (72h staleness)
4. Compress to <hivemind_state> XML
```

### Prompt 3: SDK Hook Injection
```markdown
Implement experimental.chat.messages.transform:
1. Call packCognitiveState(sessionID)
2. Inject XML as synthetic message part
3. Append Pre-Stop Gate Checklist
```

---

## 📊 By The Numbers / Con Số Nói Lên Tất Cả

| Metric | v2.6.0 | v3.0.0 (Target) |
|--------|--------|-----------------|
| **Test Assertions** | 986 | 1200+ |
| **Dead Code Lines** | 2,169 | 0 |
| **Graph Nodes** | 0 (flat files) | ∞ (relational) |
| **Context Precision** | ~60% | ~95% |
| **Token Waste** | High | Near Zero |

---

## 🚀 What's Next? / Tiếp Theo Là Gì?

**Coming in Q1 2026:**

- ✅ Phase 1: Graph Schemas & Dumb Tool Diet
- ✅ Phase 2: Cognitive Packer  
- 🔄 Phase 3: SDK Hook Injection (In Progress / Đang Thực Hiện)
- ⏳ Phase 4: .hivemind Graph Migration
- ⏳ Phase 5: Tool Consolidation
- ⏳ Phase 6: Testing & Verification

---

## 💝 A Personal Note / Lời Tâm Sự

*Tết is coming. The streets of Vietnam are filling with apricot blossoms and the smell of bánh chưng being prepared. It's a time of renewal, of leaving behind what no longer serves us, and stepping into the new year with clarity and purpose.*

*Tết đang đến gần. Đường phố Việt Nam đang tràn ngập sắc hoa mai và mùi thơm của bánh chưng. Đây là thời điểm đổi mới, để lại những gì không còn phục vụ chúng ta, và bước vào năm mới với sự rõ ràng và mục đích.*

**That's exactly what v3.0 represents.**
**Đó chính xác là những gì v3.0 đại diện.**

We're leaving behind the chaos of flat files. We're embracing relational structure, deterministic context, and enterprise-grade architecture. 

Chúng tôi đang từ bỏ sự hỗn loạn của file phẳng. Chúng tôi đang đón nhận cấu trúc quan hệ, ngữ cảnh tất định, và kiến trúc hạng doanh nghiệp.

**This isn't just an update. It's a transformation.**
**Đây không chỉ là cập nhật. Đây là sự biến đổi.**

---

<div align="center">

### ⭐ Star this repo to stay updated! / Hãy star repo này để nhận cập nhật!

**HiveMind v3.0 — Making AI Memory Actually Work**
**HiveMind v3.0 — Làm cho Bộ Nhớ AI Thực Sự Hoạt Động**

*Built with ❤️ in Vietnam 🇻🇳*
*Được xây dựng với ❤️ tại Việt Nam 🇻🇳*

</div>
