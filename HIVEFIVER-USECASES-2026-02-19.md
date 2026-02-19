# 🚀 HiveFiver v2: Các Trường Hợp Sử Dụng Đột Phá Cho Mọi Ngành Nghề

> **Tài liệu truyền cảm hứng** - Phiên bản: 2026-02-19  
> **Khám phá sức mạnh của meta-builder orchestrator với 3 persona lanes, MCP stack bất khả xâm phạm, và quy trình guarantee 6 cổng kiểm soát**

---

## 📖 Mục Lục

1. [Giới Thiệu HiveFiver v2](#giới-thiệu-hivefiver-v2)
2. [Kiến Trúc Hệ Thống](#kiến-trúc-hệ-thống)
3. [Trường Hợp Sử Dụng Theo Ngành Nghề](#trường-hợp-sử-dụng-theo-ngành-nghề)
4. [Hướng Dẫn Demo](#hướng-dẫn-demo)
5. [Thư Viện & Skills Đặc Biệt](#thư-viện--skills-đặc-biệt)

---

## 🎯 Giới Thiệu HiveFiver v2

**HiveFiver v2** không chỉ là một agent - đây là **meta-builder và instructor** định nghĩa lại cách con người tương tác với AI trong công việc hàng ngày.

### 🔥 Điểm Khác Biệt Độc Đáo

| Tính Năng | Mô Tả | Lợi Ích |
|-----------|-------|---------|
| **Tri-Persona Routing** | 3 lanes: `vibecoder`, `floppy_engineer`, `enterprise_architect` | Tự động điều chỉnh theo trình độ và nhu cầu |
| **MCP Non-Negotiable Stack** | Context7 + DeepWiki + Repomix + Tavily + Exa | Nghiên cứu đa nguồn với bằng chứng xác thực |
| **6 Governance Gates** | Context, Evidence, MCP Readiness, Lineage, Output Schema, Domain-Pack Coverage | Không bao giờ bỏ qua kiểm soát chất lượng |
| **Bilingual Tutor Mode** | Anh/Việt song ngữ với MCQ tương tác | Học tập click-by-click cho người mới |
| **Retry Loop Intelligence** | 10 vòng lặp với progressive hints | Không bỏ cuộc, luôn dẫn dắt đến kết quả |
| **Domain Pack Router** | dev, marketing, finance, office-ops, hybrid | Mở ra ngoài lập trình - mọi nghiệp vụ văn phòng |

---

## 🏗️ Kiến Trúc Hệ Thống

### **Sơ Đồ Luồng Điều Hướng**

```
┌─────────────────────────────────────────────────────────────┐
│                    USER INTENT INPUT                        │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  /hivefiver <action>  → 10 Actions Available:               │
│  init | spec | architect | workflow | build | validate |    │
│  deploy | research | audit | tutor                          │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│         HIVEFIVER-PERSONA-ROUTING SKILL                     │
│  MCQ Intake → Score Signals → Lane Assignment               │
└─────────────────────┬───────────────────────────────────────┘
                      │
        ┌─────────────┼─────────────┐
        │             │             │
        ▼             ▼             ▼
  ┌──────────┐  ┌──────────┐  ┌──────────────┐
  │VIBECODER │  │ FLOPPY   │  │ ENTERPRISE   │
  │          │  │ ENGINEER │  │ ARCHITECT    │
  │ - Examples│  │ - Chunk  │  │ - Compliance │
  │ - Hidden  │  │   Clean  │  │ - Evidence   │
  │   TDD     │  │ - Strict │  │ - Risk       │
  │ - Click   │  │   Gates  │  │   Blockades  │
  └────┬─────┘  └────┬─────┘  └──────┬───────┘
       │             │                │
       └─────────────┴────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│          MCP RESEARCH LOOP (5 Providers)                    │
│  DeepWiki/Repomix → Context7 → Tavily → Exa                 │
│  Contradiction Register → Confidence Scoring                │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│         DOMAIN PACK ROUTER                                  │
│  dev | marketing | finance | office-ops | hybrid            │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│         WORKFLOW EXECUTION (5 YAML Files)                   │
│  vibecoder | floppy-engineer | enterprise-architect |       │
│  enterprise | mcp-fallback                                  │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│         6 GOVERNANCE GATES (ALL MUST PASS)                  │
│  ✓ Context Gate        ✓ Lineage/Traceability Gate          │
│  ✓ Evidence Gate       ✓ Output Schema Gate (Ralph)         │
│  ✓ MCP Readiness Gate  ✓ Domain-Pack Coverage Gate          │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│         EXPORT & DEPLOY                                     │
│  GSD Bridge → Ralph Bridge → PRD.json → Task Graph          │
└─────────────────────────────────────────────────────────────┘
```

---

## 💼 Trường Hợp Sử Dụng Theo Ngành Nghề

### **1. 🎨 Creative Director / Marketing Manager**

#### **Kịch Bản: Xây Dựng Chiến Dịch Multi-Channel Q2 2026**

**Người dùng:** *"Tôi cần lên kế hoạch chiến dịch marketing cho sản phẩm mới, bao gồm social media, content calendar, và ngân sách ads"*

---

#### **Luồng HiveFiver Execution:**

**Bước 1: `/hivefiver init`** → Persona Detection
```
[📋 Spec] Progress: [███░░░░░░] 30%
Gate Status: Context Gate ✅ | Evidence Gate ⏳

Phân tích tín hiệu:
- Keywords: "marketing", "campaign", "social media", "ads"
- Domain Lane: MARKETING (không phải dev!)
- Persona Lane: FLOPPY_ENGINEER (ý tưởng rời rạc, cần tổ chức)
- Workflow: hivefiver-floppy-engineer.yaml
- Governance Mode: Assisted (không quá nghiêm ngặt)

Next Action Options:
1. [Spec] Build specification - Distill requirements
2. [Research] Run MCP research - Competitor analysis
3. [Tutor] Learn marketing frameworks - Bilingual guide
```

**Bước 2: `/hivefiver spec`** → Spec Distillation với MCQ
```
[📋 Spec] Progress: [█████░░░░░] 50%

Câu hỏi làm rõ (MCQ - Multiple Choice):

Q1: Ngân sách chiến dịch?
   A) < $10K (bootstrap)
   B) $10K - $50K (SMB)
   C) $50K - $200K (enterprise)
   D) > $200K (national scale)

Q2: Kênh ưu tiên?
   A) Social-first (TikTok, Instagram, Facebook)
   B) Content-first (Blog, SEO, Email)
   C) Paid-first (Google Ads, Display, Programmatic)
   D) Hybrid (balanced mix)

Q3: Mục tiêu chính?
   A) Brand awareness (reach, impressions)
   B) Lead generation (signups, demos)
   C) Direct sales (conversion, ROAS)
   D) Customer retention (LTV, repeat purchase)
```

**Bước 3: `/hivefiver research`** → MCP Research Loop
```
[🔧 Build] Progress: [███████░░░] 70%

MCP Provider Status:
✓ Context7: Available (marketing frameworks)
✓ DeepWiki: Available (case studies)
✓ Repomix: Available (competitor codebases)
✓ Tavily: Available (market trends 2026)
✓ Exa: Available (academic papers)

Evidence Matrix:
┌─────────────────────┬──────────────┬─────────────┐
│ Source              │ Findings     │ Confidence  │
├─────────────────────┼──────────────┼─────────────┤
│ Context7            │ 12 frameworks│ Full        │
│ DeepWiki            │ 8 case studies│ Partial    │
│ Tavily (2026 trends)│ 15 articles  │ Full        │
│ Exa (academic)      │ 3 papers     │ Partial     │
└─────────────────────┴──────────────┴─────────────┘

Contradiction Register:
⚠️ Trend A vs Trend B conflict detected
→ Running validation loop 3/10...
```

**Bước 4: `/hivefiver workflow`** → Domain Pack Router
```
[🚀 Deploy] Progress: [█████████░] 90%

Domain Pack: MARKETING
Capability Map:
- Campaign planning ✅
- Content calendar generation ✅
- Budget allocation model ✅
- Channel performance tracking ✅
- ROAS projection ✅

Required Skills Activated:
- hivefiver-domain-pack-router
- hivefiver-mcp-research-loop
- hivefiver-bilingual-tutor

Workflow: hivefiver-enterprise.yaml
Export Cycle: Ralph Bridge → tasks/prd.json
```

**Kết Quả:**
- 📄 **PRD.json** với 45 user stories cho chiến dịch
- 📊 **Budget Allocation Model** (Google Sheets compatible)
- 📅 **Content Calendar** (3 tháng, 60+ content pieces)
- 📈 **ROAS Projection Dashboard** (3 scenarios)
- 🎯 **Competitor Analysis Report** (5 competitors, 12 metrics)

---

### **2. 💰 CFO / Finance Manager**

#### **Kịch Bản: Forecasting & Budget Planning FY2027**

**Người dùng:** *"Cần xây dựng financial forecast cho năm tài chính mới, bao gồm P&L, cashflow, capex plan, và scenario analysis"*

---

#### **Luồng HiveFiver Execution:**

**Bước 1: `/hivefiver init`**
```
[📋 Spec] Progress: [███░░░░░░] 30%

Phân tích tín hiệu:
- Keywords: "forecast", "P&L", "cashflow", "budget", "finance"
- Domain Lane: FINANCE
- Persona Lane: ENTERPRISE_ARCHITECT (compliance-first, risk-aware)
- Workflow: hivefiver-enterprise-architect.yaml
- Governance Mode: STRICT (compliance gates activated)
```

**Bước 2: `/hivefiver architect`** → Design Agent Topology
```
[🔧 Build] Progress: [█████░░░░░] 50%

Agent System Design:
┌─────────────────────────────────────────────────────────┐
│  FINANCE_ORCHESTRATOR (Master Agent)                    │
│  - Coordinates 4 subagents                              │
│  - Enforces compliance gates                            │
└──────────────────┬──────────────────────────────────────┘
                   │
    ┌──────────────┼──────────────┬──────────────┐
    │              │              │              │
    ▼              ▼              ▼              ▼
┌─────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│ P&L     │  │ CASHFLOW │  │ CAPEX    │  │ SCENARIO │
│ BUILDER │  │ MODELER  │  │ PLANNER  │  │ ANALYZER │
│         │  │          │  │          │  │          │
│ -Revenue│  │ -Working │  │ -IT      │  │ -Base    │
│ -COGS   │  │  capital │  │ -Equip   │  │ -Optimistic│
│ -OpEx   │  │ -CapEx   │  │ -Facility│  │ -Pessimistic│
│ -EBITDA │  │ -Financing│ │ -R&D     │  │ -Sensitivity│
└─────────┘  └──────────┘  └──────────┘  └──────────┘

Compliance Requirements:
✓ SOC2 Type II controls mapping
✓ IFRS/GAAP alignment checks
✓ Audit trail preservation
✓ Version control for all assumptions
```

**Bước 3: `/hivefiver research`** → Evidence Gathering
```
[🧪 Validate] Progress: [███████░░░] 70%

MCP Research Results:
- Context7: 8 financial modeling frameworks
- DeepWiki: 12 public company 10-K filings (benchmark)
- Tavily: 2026 industry reports (15 sources)
- Exa: 5 academic papers on forecasting accuracy

Confidence Score: PARTIAL → FULL (after contradiction resolution)

Key Findings:
1. Industry median EBITDA margin: 18-22%
2. Typical OpEx ratio: 35-40% of revenue
3. CapEx intensity: 8-12% for tech-enabled businesses
```

**Bước 4: `/hivefiver validate`** → Quality Gates
```
[🧪 Validate] Progress: [█████████░] 90%

Governance Gate Results:
┌─────────────────────────────┬────────┬──────────────┐
│ Gate                        │ Status │ Evidence     │
├─────────────────────────────┼────────┼──────────────┤
│ Context Gate                │ ✅ PASS│ Chain complete│
│ Evidence Gate               │ ✅ PASS│ Full corroboration│
│ MCP Readiness Gate          │ ✅ PASS│ 5/5 providers│
│ Lineage/Traceability Gate   │ ✅ PASS│ All assumptions logged│
│ Output Schema Gate          │ ✅ PASS│ PRD.json validated│
│ Domain-Pack Coverage Gate   │ ✅ PASS│ Finance pack 100%│
└─────────────────────────────┴────────┴──────────────┘

Export Ready: YES
→ GSD Bridge: Converting to task graph
→ Ralph Bridge: Generating prd.json
```

**Kết Quả:**
- 📊 **5-Year Financial Model** (Excel-compatible JSON)
- 📈 **3 Scenario Analysis** (Base/Optimistic/Pessimistic)
- 💵 **Cash Flow Forecast** (monthly, 24 months)
- 🏦 **CapEx Plan** (IT, Equipment, R&D breakdown)
- 📋 **Compliance Matrix** (SOC2, IFRS mapping)
- 🎯 **Sensitivity Analysis** (12 variables tested)

---

### **3. 👨‍💼 Operations Manager / Office Administrator**

#### **Kịch Bản: Tối Ưu Hóa Quy Trình Văn Phòng & Báo Cáo**

**Người dùng:** *"Tôi muốn hệ thống hóa quy trình văn phòng: document management, meeting workflows, reporting automation, và employee onboarding"*

---

#### **Luồng HiveFiver Execution:**

**Bước 1: `/hivefiver init`**
```
[📋 Spec] Progress: [███░░░░░░] 30%

Phân tích tín hiệu:
- Keywords: "office", "operations", "workflow", "reporting", "onboarding"
- Domain Lane: OFFICE-OPS
- Persona Lane: FLOPPY_ENGINEER (mixed requirements)
- Workflow: hivefiver-floppy-engineer.yaml
- Governance Mode: Assisted
```

**Bước 2: `/hivefiver tutor`** → Bilingual Interactive Guide
```
[📚 Tutor] Progress: [████░░░░░░] 40%

Chào mừng đến với Office Ops Optimization Guide! 🎓

Bài 1: Document Management System
──────────────────────────────────

Câu hỏi: Hiện tại bạn lưu trữ tài liệu như thế nào?
A) Email attachments (rất rời rạc)
B) Google Drive/OneDrive folders (tạm ổn)
C) SharePoint/Notion database (tốt)
D) Có hệ thống DMS chuyên dụng (xuất sắc)

[Giải thích từng lựa chọn với ví dụ cụ thể]

👉 Gợi ý: Với quy mô 50-200 nhân sự, Option C thường tối ưu nhất.
   Xem case study: Công ty X giảm 60% thời gian tìm kiếm tài liệu
   sau khi migrate sang Notion + automation.

Next: [A] [B] [C] [D] hoặc "Giải thích thêm"
```

**Bước 3: `/hivefiver workflow`** → Operational Blueprint
```
[🔧 Build] Progress: [███████░░░] 70%

Domain Pack: OFFICE-OPS
Operational Blueprints Generated:

1. DOCUMENT MANAGEMENT
   - Taxonomy design (5-level hierarchy)
   - Naming conventions (ISO-compliant)
   - Access control matrix (RBAC)
   - Retention policies (auto-archive rules)

2. MEETING WORKFLOWS
   - Pre-meeting checklist (auto-reminders)
   - Agenda templates (by meeting type)
   - Note-taking system (AI-assisted)
   - Action item tracking (integration with task mgmt)

3. REPORTING AUTOMATION
   - Data sources mapping (Google Sheets, CRM, ERP)
   - Schedule orchestration (daily/weekly/monthly)
   - Distribution lists (role-based)
   - Visualization standards (dashboard templates)

4. EMPLOYEE ONBOARDING
   - Day 1-30-60-90 roadmap
   - Checklist per department
   - Buddy system assignment
   - Progress tracking dashboard
```

**Kết Quả:**
- 📁 **Document Management System Design** (taxonomy + templates)
- 📅 **Meeting Workflow Playbook** (6 meeting types, 18 templates)
- 📊 **Reporting Automation Blueprint** (12 reports, automated)
- 👤 **Onboarding Program** (4 departments, 90-day tracks)
- 🔗 **Integration Map** (tools + APIs + automation triggers)

---

### **4. 👨‍💻 Software Developer / Tech Lead**

#### **Kịch Bản: Xây Dựng SaaS Platform Với Microservices Architecture**

**Người dùng:** *"Tôi muốn build một SaaS platform cho project management, với microservices, real-time collaboration, và AI-powered features"*

---

#### **Luồng HiveFiver Execution:**

**Bước 1: `/hivefiver init`**
```
[📋 Spec] Progress: [███░░░░░░] 30%

Phân tích tín hiệu:
- Keywords: "SaaS", "microservices", "real-time", "AI", "TypeScript"
- Domain Lane: DEV
- Persona Lane: FLOPPY_ENGINEER → ENTERPRISE_ARCHITECT (complexity detected)
- Workflow: hivefiver-enterprise-architect.yaml
- Governance Mode: STRICT (architecture decisions require evidence)
```

**Bước 2: `/hivefiver architect`** → Subagent System Design
```
[🔧 Build] Progress: [█████░░░░░] 50%

Agent Topology for SaaS Platform:
┌─────────────────────────────────────────────────────────┐
│  SAAS_ORCHESTRATOR (Master Agent)                       │
│  - Routes requests to domain subagents                  │
│  - Enforces API contracts & SLAs                        │
└──────────────────┬──────────────────────────────────────┘
                   │
    ┌──────────────┼──────────────┬──────────────┬──────────────┐
    │              │              │              │              │
    ▼              ▼              ▼              ▼              ▼
┌─────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│ AUTH    │  │ PROJECT  │  │ TASK     │  │ REALTIME │  │ AI       │
│ SERVICE │  │ SERVICE  │  │ SERVICE  │  │ SYNC     │  │ FEATURES │
│         │  │          │  │          │  │          │  │          │
│ -JWT    │  │ -CRUD    │  │ -Board   │  │ -WS      │  │ -NLP     │
│ -OAuth2 │  │ -Members │  │ -Sprint  │  │ -OT      │  │ -ML      │
│ -RBAC   │  │ -Docs    │  │ -Timeline│  │ -Presence│  │ -Rec     │
│ -MFA    │  │ -Reports │  │ -Subtasks│  │ -Notifications│-Summaries│
└─────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘

Tech Stack Recommendations (Evidence-Backed):
- Runtime: Node.js 22 LTS (Context7: latest LTS support)
- Framework: Fastify v5 (DeepWiki: 3x faster than Express)
- Database: PostgreSQL 16 + Drizzle ORM (type-safe)
- Real-time: WebSocket + Operational Transformation
- AI: Vercel AI SDK (streaming + tool calling)
- Deployment: Kubernetes (enterprise scale) or Vercel (MVP)
```

**Bước 3: `/hivefiver research`** → MCP Evidence Gathering
```
[🧪 Validate] Progress: [███████░░░] 70%

MCP Research Results:
┌──────────────┬──────────────────────────────────────────┐
│ Provider     │ Findings                                 │
├──────────────┼──────────────────────────────────────────┤
│ Context7     │ Fastify v5 docs, Drizzle ORM patterns    │
│ DeepWiki     │ 8 open-source PM tools (architecture)    │
│ Repomix      │ Packed 3 competitor repos for analysis   │
│ Tavily       │ 2026 SaaS trends, pricing benchmarks     │
│ Exa          │ 5 papers on real-time collaboration algos│
└──────────────┴──────────────────────────────────────────┘

Contradiction Resolution:
⚠️ WebSocket vs Server-Sent Events debate
→ Loop 1-5: Gathered 12 sources
→ Loop 6-8: Tested performance benchmarks
→ Decision: WebSocket for bidirectional, SSE for notifications
→ Confidence: FULL (corroborated by 8+ sources)
```

**Bước 4: `/hivefiver build`** → TDD Implementation Handoff
```
[🔧 Build] Progress: [████████░░] 80%

TDD Task Graph Generated:
┌─────────────────────────────────────────────────────────┐
│ Phase 1: Foundation (Week 1-2)                          │
├─────────────────────────────────────────────────────────┤
│ ✓ Auth Service (JWT + OAuth2)                          │
│   - Tests: 24 unit, 8 integration, 4 E2E               │
│   - Coverage target: 90%+                              │
│ ✓ Project Service (CRUD + Members)                     │
│   - Tests: 32 unit, 12 integration, 6 E2E              │
│   - Coverage target: 90%+                              │
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│ Phase 2: Core Features (Week 3-4)                       │
├─────────────────────────────────────────────────────────┤
│ □ Task Service (Board + Sprint + Timeline)             │
│ □ Real-time Sync (WebSocket + OT)                      │
│ □ AI Features (NLP + Recommendations)                  │
└─────────────────────────────────────────────────────────┘

Export to GSD: ✅ Ready
Export to Ralph: ✅ prd.json generated
```

**Kết Quả:**
- 🏗️ **Microservices Architecture** (6 services, API contracts)
- 📐 **Tech Stack Decision Matrix** (evidence-backed)
- 🧪 **TDD Test Plan** (200+ tests across 4 phases)
- 📊 **Competitor Analysis** (8 tools, 24 features compared)
- 🚀 **Deployment Strategy** (K8s + CI/CD pipelines)
- 📚 **API Documentation** (OpenAPI 3.1 spec)

---

### **5. 🎓 Educator / Corporate Trainer**

#### **Kịch Bản: Thiết Kế Chương Trình Đào Tạo AI & Automation**

**Người dùng:** *"Tôi cần xây dựng curriculum đào tạo nhân viên về AI tools, automation workflows, và prompt engineering"*

---

#### **Luồng HiveFiver Execution:**

**Bước 1: `/hivefiver init`**
```
[📋 Spec] Progress: [███░░░░░░] 30%

Phân tích tín hiệu:
- Keywords: "training", "curriculum", "education", "AI", "automation"
- Domain Lane: HYBRID (education + technology)
- Persona Lane: VIBECODER (pedagogy-first, examples-driven)
- Workflow: hivefiver-vibecoder.yaml
- Governance Mode: Assisted (tutorial-heavy)
```

**Bước 2: `/hivefiver tutor`** → Bilingual Curriculum Co-Creation
```
[📚 Tutor] Progress: [████░░░░░░] 40%

Chào mừng đến với Curriculum Design Studio! 🎓

Bước 1: Xác định đối tượng học viên

Câu hỏi: Nhân viên của bạn thuộc nhóm nào?
A) Non-technical (marketing, sales, ops)
   → Focus: No-code AI tools, prompt templates
B) Semi-technical (analysts, PMs)
   → Focus: Workflow automation, basic scripting
C) Technical (developers, data engineers)
   → Focus: API integration, custom agents

[Click để xem sample curriculum cho từng nhóm]

👉 Recommendation:混合 audience? Tạo 3 tracks song song!
```

**Bước 3: `/hivefiver spec`** → Curriculum Framework
```
[📋 Spec] Progress: [███████░░░] 70%

Curriculum Architecture:
┌─────────────────────────────────────────────────────────┐
│  AI & AUTOMATION ACADEEMY (12-Week Program)             │
└──────────────────┬──────────────────────────────────────┘
                   │
    ┌──────────────┼──────────────┬──────────────┐
    │              │              │              │
    ▼              ▼              ▼              ▼
┌─────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│ TRACK A │  │ TRACK B  │  │ TRACK C  │  │ CAPSTONE │
│ Citizen │  │ Power    │  │ Builder  │  │ PROJECT  │
│ Developer│ │ User     │  │ Track    │  │          │
│         │  │          │  │          │  │          │
│ Week 1-4│  │ Week 1-6 │  │ Week 1-8 │  │ Week 9-12│
│ -Prompt │  │ -Zapier  │  │ -Python  │  │ -Real    │
│  Eng    │  │ -Make    │  │ -APIs    │  │  usecase │
│ -ChatGPT│  │ -n8n     │  │ -Agents  │  │ -Deploy  │
│ -Notion │  │ -Airtable│  │ -LLM SDK │  │ -Present │
│  AI     │  │ -Slack   │  │ -RAG     │  │          │
└─────────┘  └──────────┘  └──────────┘  └──────────┘

Assessment Framework:
- Weekly quizzes (auto-graded)
- Hands-on labs (rubric-based)
- Peer reviews (calibrated)
- Final project (industry jury)
```

**Kết Quả:**
- 📚 **12-Week Curriculum** (3 tracks, 48 modules)
- 🎯 **Learning Objectives** (Bloom's taxonomy aligned)
- 📝 **Assessment Rubrics** (6 criteria, 4 levels)
- 🧪 **Lab Exercises** (24 hands-on projects)
- 📊 **Progress Tracking Dashboard** (per-learner analytics)
- 🎓 **Certification Criteria** (pass/fail thresholds)

---

## 🎬 Hướng Dẫn Demo

### **Demo Flow 1: Rapid Fire (5 phút)**

**Mục tiêu:** Show persona routing + MCQ intake

```bash
# Step 1: Trigger persona detection
/hivefiver init

# Step 2: Show MCQ intake in action
# (Answer 3-4 questions, watch lane assignment)

# Step 3: Display workflow selection
# (Show vibecoder vs enterprise_architect difference)

# Step 4: Quick spec generation
/hivefiver spec

# Output: Show spec candidates + ambiguity map
```

### **Demo Flow 2: Full Journey (15 phút)**

**Mục tiêu:** End-to-end từ idea đến prd.json

```bash
# Phase 1: Discovery (3 min)
/hivefiver init
/hivefiver research

# Phase 2: Specification (4 min)
/hivefiver spec
/hivefiver architect

# Phase 3: Workflow Design (3 min)
/hivefiver workflow

# Phase 4: Validation & Export (5 min)
/hivefiver validate
/hivefiver deploy

# Final: Show prd.json + task graph visualization
```

### **Demo Flow 3: Domain Pack Showcase (10 phút)**

**Mục tiêu:** Chứng minh multi-domain capability

```bash
# Scenario 1: Marketing (3 min)
/hivefiver init "marketing campaign for product launch"
→ Show marketing domain pack capabilities

# Scenario 2: Finance (3 min)
/hivefiver init "financial forecast for FY2027"
→ Show finance domain pack capabilities

# Scenario 3: Office Ops (4 min)
/hivefiver init "office workflow automation"
→ Show office-ops domain pack capabilities

# Comparison: Show how same flow adapts to different domains
```

---

## 📦 Thư Viện & Skills Đặc Biệt

### **Core Skills (8 skills bắt buộc)**

| Skill | Mục Đích | Kích Hoạt Khi |
|-------|----------|---------------|
| `hivefiver-persona-routing` | Phân loại user vào 3 lanes | Mọi session khởi đầu |
| `hivefiver-spec-distillation` | Chắt lọc yêu cầu từ input rời rạc | Input messy, contradictory |
| `hivefiver-mcp-research-loop` | Nghiên cứu đa nguồn với 5 providers | Cần evidence cho decisions |
| `hivefiver-gsd-compat` | Compatibility wrapper cho GSD framework | Export tasks cần legacy support |
| `hivefiver-ralph-tasking` | Task orchestration + Ralph export | Cần prd.json hoặc task graph |
| `hivefiver-bilingual-tutor` | Anh/Việt song ngữ với MCQ | Vibecoder lane hoặc learning mode |
| `hivefiver-skill-auditor` | Audit skill coverage + gaps | Audit hoặc research phases |
| `hivefiver-domain-pack-router` | Route qua 5 domain packs | Non-dev requirements |

### **Workflow Files (5 YAML configurations)**

| Workflow | Đối Tượng | Đặc Điểm |
|----------|-----------|----------|
| `hivefiver-vibecoder.yaml` | Người mới, non-technical | Examples-first, hidden TDD |
| `hivefiver-floppy-engineer.yaml` | Intermediate, messy inputs | Chunk cleanup, coherence scoring |
| `hivefiver-enterprise-architect.yaml` | Enterprise, compliance-heavy | Compliance-first, evidence gates |
| `hivefiver-enterprise.yaml` | Corporate scale | Balanced rigor + speed |
| `hivefiver-mcp-fallback.yaml` | Provider unavailable scenarios | Graceful degradation |

### **Commands (10 actions + legacy)**

| Action | Legacy Command | Mục Đích |
|--------|---------------|----------|
| `init` | `hivefiver-start` + `hivefiver-intake` | Khởi động + persona detection |
| `spec` | `hivefiver-specforge` | Build specification |
| `architect` | `hivefiver-skillforge` | Design agent topology |
| `workflow` | `hivefiver-workflow` | Configure orchestration |
| `build` | `hivefiver-gsd-bridge` | TDD implementation |
| `validate` | `hivefiver-ralph-bridge` | Quality gates + export |
| `deploy` | `hivefiver-doctor` | Environment readiness |
| `research` | `hivefiver-research` | MCP evidence gathering |
| `audit` | `hivefiver-doctor` | Alignment + health check |
| `tutor` | `hivefiver-tutor` | Interactive coaching |

---

## 🌟 Tại Sao HiveFiver v2 Là Đột Phá?

### **1. Không Chỉ Là "AI Assistant" - Là Meta-Orchestrator**

HiveFiver không trả lời câu hỏi xong rồi thôi. Nó:
- **Route** bạn vào đúng lane (persona + domain)
- **Research** với 5 providers để có evidence
- **Distill** yêu cầu từ messy input
- **Architect** hệ thống agents/subagents
- **Orchestrate** workflow với YAML configs
- **Validate** qua 6 governance gates
- **Export** sang prd.json + task graph
- **Tutor** bạn trong suốt quá trình (song ngữ)

### **2. Evidence Confidence - Không Fake Certainty**

```typescript
Confidence Scoring:
- "full": Corroborated by 3+ sources, no contradictions
- "partial": Usable but with noted gaps
- "low": Critical gaps or unresolved contradictions

→ Không bao giờ claim "full" khi thiếu evidence!
```

### **3. Retry Loop Intelligence - Không Bỏ Cuộc**

```
Attempt 1-2: Concise correction
Attempt 3-5: Example hints added
Attempt 6-9: Guided walkthrough
Attempt 10: Escalation with lane reset recommendation

→ 10 vòng lặp, mỗi vòng progressive hơn!
```

### **4. Domain Pack Router - Ngoài Lập Trình**

Không chỉ dev! HiveFiver xử lý:
- **Marketing**: Campaign planning, content calendars, ROAS models
- **Finance**: P&L forecasting, cashflow, scenario analysis
- **Office-Ops**: Document management, workflows, reporting automation
- **Hybrid**: Mixed-domain solutions

### **5. Bilingual Tutor Mode - Click-By-Click Guidance**

```
[📚 Tutor] Tab Structure:
- Progress meter: [████░░░░░░] 40%
- Current gate: MCQ Intake Gate ⏳
- Next options: 3 bounded choices (A/B/C)
- Explanation: Examples + case studies
- Language: Toggle EN/VI anytime
```

---

## 🎯 Kết Luận

**HiveFiver v2** là cầu nối giữa:
- **Ý tưởng rời rạc** → **Specification executable**
- **Người dùng mọi trình độ** → **Professional outcomes**
- **AI hallucination** → **Evidence-backed decisions**
- **Single-domain tools** → **Multi-domain orchestration**
- **Chat-and-forget** → **Process-guaranteed delivery**

### **Process Guarantee (Không Phải Outcome Guarantee)**

> "Chúng tôi không guarantee kết quả cuối cùng (vì phụ thuộc vào execution).  
> Chúng tôi guarantee **quy trình** sẽ luôn:
> 1. ✅ Context gate passed
> 2. ✅ Evidence gate passed
> 3. ✅ MCP readiness reported
> 4. ✅ Lineage preserved
> 5. ✅ Output schema validated
> 6. ✅ Domain-pack coverage confirmed
>
> Nếu 6 gates pass → Process guarantee honored."

---

## 📞 Liên Hệ & Demo

Để trải nghiệm HiveFiver v2 trong thực tế:

```bash
# Quick start
/hivefiver init

# Full demo
/hivefiver tutor "Show me around"

# Audit current setup
/hivefiver audit
```

---

**Tài liệu này được tạo bởi HiveFiver v2**  
*Meta-Builder + Instructor với tri-persona routing, MCP stack, và 6 governance gates*

📅 **Ngày tạo:** 2026-02-19  
🔖 **Version:** 2.0  
🌐 **Language:** Vietnamese (with English technical terms)
