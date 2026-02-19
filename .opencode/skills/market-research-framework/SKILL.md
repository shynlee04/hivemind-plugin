---
name: market-research-framework
description: Use when conducting market research, consumer analysis, market sizing, or trend analysis without clear data collection methodology. Triggers when agents skip validation, use unreliable sources, or lack structured research approach.
---

# Market Research Framework / Khung Nghiên Cứu Thị Trường

## Overview / Tổng Quan

**Kỹ thuật chuẩn hóa cho mọi dự án nghiên cứu thị trường.** Đảm bảo data thu thập đúng cách, nguồn đáng tin cậy, và kết luận có evidence-backed.

**Standardized technique for all market research projects.** Ensures proper data collection, reliable sources, and evidence-backed conclusions.

---

## When to Use / Khi Nào Dùng

**Use when:**
- Starting any market research project
- Agents skip data validation steps
- Unreliable sources being cited
- Need TAM/SAM/SOM calculations
- Consumer behavior analysis needed
- Trend forecasting required

**Không dùng khi:**
- Simple lookup queries (1-2 sources sufficient)
- Already have validated data
- Project has its own research methodology

---

## Core Framework / Khung Chính

### Phase 1: Define & Scope / Định Nghĩa & Phạm Vi

```
┌─────────────────────────────────────────────┐
│  Research Question → Objectives → Scope     │
│  ↓                                           │
│  Primary vs Secondary Research Decision     │
└─────────────────────────────────────────────┘
```

**Checklist:**
- [ ] Define research question clearly
- [ ] Set measurable objectives
- [ ] Define scope (geographic, demographic, temporal)
- [ ] Decide: Primary research needed? Or secondary only?

### Phase 2: Data Collection / Thu Thập Dữ Liệu

| Type | Sources | Validation |
|------|---------|------------|
| **Secondary** | Reports (Nielsen, Euromonitor), Government data, Industry publications | Cross-reference 2+ sources |
| **Primary** | Surveys, Interviews, Focus groups, Observation | Sample size ≥30 for stat validity |

**Data Source Quality Matrix:**

| Tier | Sources | Confidence |
|------|---------|------------|
| **Tier 1** | Government stats, Industry leaders (Nielsen, Gartner) | High |
| **Tier 2** | Industry reports, Academic papers | Medium-High |
| **Tier 3** | News articles, Blog posts, Company blogs | Medium |
| **Tier 4** | Social media, Forums, Anecdotal | Low |

### Phase 3: Analysis Frameworks / Khung Phân Tích

#### Consumer Research / Nghiên Cứu Người Tiêu Dùng

```
┌─────────────────────────────────────────────────────┐
│  DEMOGRAPHIC → PSYCHOGRAPHIC → BEHAVIORAL          │
│  (Who)          (Why)           (How)               │
│  ↓               ↓               ↓                  │
│  Age, Income    Values,        Purchase patterns   │
│  Location       Lifestyle      Brand loyalty       │
│  Education      Interests      Usage frequency     │
└─────────────────────────────────────────────────────┘
```

**Persona Template:**
- Name & Photo placeholder
- Demographics (Age, Income, Location)
- Psychographics (Values, Lifestyle)
- Pain Points
- Media Habits
- Quote (representative)

#### Market Sizing / Đo Lường Thị Trường

```
TAM (Total Addressable Market)
├── SAM (Serviceable Addressable Market)
│   └── SOM (Serviceable Obtainable Market)
```

**Calculation Methods:**
1. **Top-down:** Industry report → Segment % → Your market
2. **Bottom-up:** Customer count × Average revenue
3. **Value theory:** Price point × Customer willingness

**Formula:**
```
SOM = TAM × Geographic Coverage × Segment Share × Competitive Factor
```

#### Trend Analysis / Phân Tích Xu Hướng

| Method | Description | Use Case |
|--------|-------------|----------|
| **PESTEL** | Political, Economic, Social, Technological, Environmental, Legal | Macro trends |
| **Historical Analysis** | 3-5 year data → Growth rate → Projection | Quantitative trends |
| **Signal Detection** | Early indicators → Mainstream potential | Emerging trends |

**Trend Validation:**
- [ ] Multiple sources confirm
- [ ] Data from 2+ time periods
- [ ] Expert opinion corroborates
- [ ] Logical causation identified

---

## Quick Reference / Tham Khảo Nhanh

### Research Type Decision

| Need | Method | Time | Cost |
|------|--------|------|------|
| Market size | Secondary research | 1-3 days | Low |
| Consumer insights | Primary research | 2-4 weeks | Medium-High |
| Competitor analysis | Mixed methods | 1-2 weeks | Medium |
| Trend forecasting | Secondary + Expert interviews | 2-3 weeks | Medium |

### Sample Size Guidelines

| Population | Minimum Sample | Recommended |
|------------|----------------|-------------|
| < 100 | All (census) | All |
| 100-1,000 | 50% | 80-100 |
| 1,000-10,000 | 10% | 200-400 |
| > 10,000 | 1-3% | 400-1000 |

---

## Common Mistakes / Lỗi Thường Gặp

| Mistake | Impact | Fix |
|---------|--------|-----|
| **Using single source** | Biased conclusions | Always cross-reference 2+ sources |
| **Skipping validation** | Unreliable data | Apply tier validation matrix |
| **Mixing data types** | Incomparable metrics | Standardize before analysis |
| **Small sample size** | Non-significant results | Minimum 30 for statistical validity |
| **Outdated data** | Wrong conclusions | Data must be <2 years old for fast-moving markets |

---

## Red Flags - STOP & Validate / Cảnh Báo

**STOP research when:**
- ❌ Only 1 source found for key metric
- ❌ Data > 2 years old without justification
- ❌ Sources contradict each other significantly
- ❌ Sample size < 30 for quantitative claims
- ❌ Source is Tier 4 for financial/business decisions

**Action:** Find additional sources or explicitly state confidence level as "low"

---

## Output Template / Mẫu Kết Quả

```markdown
## Market Research Report / Báo Cáo Nghiên Cứu

### 1. Research Question / Câu Hỏi Nghiên Cứu
[Clear statement of what we're investigating]

### 2. Methodology / Phương Pháp
- Research type: [Primary/Secondary/Mixed]
- Sources: [List with tier ratings]
- Data collection period: [Dates]
- Sample size (if primary): [N]

### 3. Key Findings / Kết Quả Chính
| Finding | Evidence | Confidence |
|---------|----------|------------|
| [Insight 1] | [Source + data] | [High/Medium/Low] |
| [Insight 2] | [Source + data] | [High/Medium/Low] |

### 4. Market Size (if applicable)
- TAM: [Value + source]
- SAM: [Value + calculation]
- SOM: [Value + calculation]

### 5. Trends Identified
| Trend | Direction | Evidence | Confidence |
|-------|-----------|----------|------------|
| [Trend 1] | [↑/↓/→] | [Source] | [H/M/L] |

### 6. Limitations / Hạn Chế
[What we couldn't find, data gaps, assumptions made]

### 7. Recommendations / Khuyến Nghị
[Actionable insights based on findings]
```

---

## Real-World Example / Ví Dụ Thực Tế

**Task:** Research Vietnamese coffee market size

```
Phase 1: Define
- Question: What is the market size for coffee in Vietnam?
- Scope: Vietnam, 2023, Ready-to-drink and instant coffee
- Method: Secondary research (government + industry reports)

Phase 2: Collect
- Vietnam Customs: Export/import data
- Euromonitor: Industry report (Tier 1)
- Vinacafe annual report: Production data (Tier 2)
- News articles: Market trends (Tier 3 - corroboration only)

Phase 3: Calculate
TAM: $5.2B (Euromonitor 2023)
SAM: $3.1B (RTD + Instant segment = 60%)
SOM: $310M (10% market share target)

Validation: Cross-referenced with production data
Confidence: HIGH (3 Tier 1-2 sources agree within 10%)
```

---

## Evidence Discipline / Kỷ Luật Bằng Chứng

**Every claim must have:**
1. **Source citation** - Where did this come from?
2. **Tier rating** - How reliable is the source?
3. **Confidence level** - How certain are we?

**No exceptions:** Even "obvious" facts need validation.

---

*Skill created by HiveFiver | Ngày tạo: 2026-02-19*
