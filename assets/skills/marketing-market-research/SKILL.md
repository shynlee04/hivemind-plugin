---
name: marketing-market-research
description: >-
  Thực hiện nghiên cứu thị trường toàn diện với các công cụ phân tích đối thủ cạnh tranh,
  nghiên cứu xu hướng thị trường, nghiên cứu từ khóa SEO, khảo sát và insight khách hàng,
  và tổng hợp báo cáo thị trường. Dành cho marketing manager cần dữ liệu để ra quyết định.
  Dùng khi bạn nói "phân tích đối thủ", "nghiên cứu thị trường", "research từ khóa",
  "xu hướng ngành", "insight khách hàng", "báo cáo thị trường", "competitor analysis",
  "market research", "SEO research", "customer insight", "phân tích ngành".
metadata:
  lineage: standalone
  author: hf-skill-builder
  created: 2026-05-12
  domain: marketing
  language: vi
allowed-tools:
  - tavily-search
  - tavily-research
  - tavily-extract
  - exa_web_search_exa
  - exa_web_fetch_exa
  - fetch_fetch
  - web-reader_webReader
  - context7_query-docs
  - deepwiki_ask_question
  - bash
  - read
  - write
  - glob
  - grep
  - todowrite
---

# Skill: Marketing Market Research

## Tổng Quan

Skill này cung cấp quy trình nghiên cứu thị trường có cấu trúc dành cho **marketing manager**. Thay vì research man rời rạc, skill này hướng dẫn bạn thực hiện nghiên cứu có hệ thống — từ đặt câu hỏi đúng → thu thập dữ liệu → phân tích → tổng hợp báo cáo — tất cả đều có template để dùng ngay.

**Skill này phù hợp cho:**
- Marketing manager cần data-driven decision
- Founder/CEO muốn hiểu thị trường trước khi ra sản phẩm
- Content marketer cần research từ khóa và content gap
- Product manager muốn phân tích đối thủ cạnh tranh
- Freelancer/agency làm báo cáo thị trường cho khách hàng

---

## 🔨 IRON LAW — Nguyên Tắc Nghiên Cứu Thị Trường

```
KHÔNG CÓ DỮ LIỆU THÌ KHÔNG CÓ QUYẾT ĐỊNH
Research không có evidence chỉ là phỏng đoán
```

### Ba nguyên tắc bất di bất dịch:

| # | Nguyên Tắc | Giải Thích |
|---|------------|------------|
| 1 | **Dữ liệu trước, kết luận sau** | Mọi nhận định thị trường phải có nguồn dẫn chứng. Không đưa ra kết luận khi chưa có dữ liệu kiểm chứng. |
| 2 | **Đa nguồn kiểm chứng** | Một thông tin từ một nguồn = chưa đáng tin. Luôn cross-check ít nhất 2 nguồn độc lập trước khi đưa vào báo cáo. |
| 3 | **Cập nhật hoặc chết** | Dữ liệu thị trường > 6 tháng = outdated. Luôn kiểm tra ngày xuất bản và mức độ freshness của thông tin. |

---

## Entry Gate

**Bắt đầu research khi** bạn có một trong các tình huống sau:
- Bạn nói "tôi cần phân tích đối thủ X" — dùng Competitor Analysis Workflow
- Bạn nói "ngành Y đang có xu hướng gì" — dùng Trend Research Workflow
- Bạn nói "tìm từ khóa cho chiến dịch Z" — dùng Keyword Research Workflow
- Bạn nói "khách hàng của tôi nghĩ gì về..." — dùng Customer Insight Workflow
- Bạn nói "làm báo cáo thị trường tổng quan" — dùng tổng hợp từ 4 workflow

**KHÔNG bắt đầu khi:**
- Chưa xác định rõ câu hỏi nghiên cứu — hãy dùng Phase 0 bên dưới để định hình
- Yêu cầu quá rộng ("research tất cả mọi thứ") — cần narrow scope trước
- Dữ liệu đã có sẵn trong báo cáo nội bộ — ưu tiên dữ liệu first-party trước

---

## Phase 0: Định Hình Câu Hỏi Nghiên Cứu (Bắt Buộc)

Trước khi research bất cứ thứ gì, hãy viết ra **câu hỏi nghiên cứu** trong một câu. Nếu không viết được, câu hỏi quá rộng.

```
Template:
[Loại research] — [Chủ thể] — [Mục tiêu] — [Phạm vi]

Ví dụ:
"Competitor Analysis — Đối thủ ABC — Hiểu chiến lược content và SEO — Thị trường Việt Nam"
"Trend Research — Ngành EdTech — Xu hướng công nghệ 2026 — Global"
"Keyword Research — Chiến dịch launch sản phẩm X — Top 20 từ khóa — Google Việt Nam"
```

**Checklist Phase 0:**
- [ ] Câu hỏi nghiên cứu viết xong trong 1 câu
- [ ] Phạm vi địa lý xác định (Việt Nam / Global / Khu vực)
- [ ] Mục tiêu research rõ ràng (explore / compare / quantify)
- [ ] Deadline research biết trước (giới hạn thời gian)

---

## Phase 1: Competitor Analysis — Phân Tích Đối Thủ Cạnh Tranh

Phù hợp khi: cần hiểu đối thủ đang làm gì, chiến lược của họ, điểm mạnh/yếu.

### Workflow:

```
Step 1: Liệt kê đối thủ (3-5 đối thủ chính + 2-3 đối thủ gián tiếp)
Step 2: Thu thập dữ liệu từng đối thủ (website, social, review, content)
Step 3: Phân tích theo khung Competitor Matrix
Step 4: Tổng hợp SWOT cho từng đối thủ
Step 5: Xác định competitive advantage / gap
```

### Công cụ research cho từng bước:

| Step | Công cụ | Mô tả |
|------|---------|-------|
| 1 | `tavily-search` / `exa_web_search_exa` | Tìm kiếm đối thủ trong ngành |
| 2 | `tavily-extract` / `web-reader_webReader` | Đọc website đối thủ, blog, pricing page |
| 2 | `tavily-crawl` | Crawl toàn bộ site nếu cần nghiên cứu sâu |
| 3 | Sử dụng **Competitor Matrix Template** bên dưới | Điền thông tin từng đối thủ |
| 4 | Sử dụng **SWOT Template** | Tổng hợp điểm mạnh/yếu/cơ hội/nguy cơ |

### Output: Bảng Competitor Analysis (dùng template ở references/)

---

## Phase 2: Trend Research — Nghiên Cứu Xu Hướng Thị Trường

Phù hợp khi: cần hiểu bức tranh toàn cảnh thị trường, xu hướng mới nổi.

### Workflow:

```
Step 1: Xác định lĩnh vực và phạm vi địa lý
Step 2: Research xu hướng tổng quan (báo cáo ngành, tin tức)
Step 3: Phân tích theo Trend Framework (Gartner Hype Cycle / PESTLE)
Step 4: Xác định cơ hội và rủi ro từ xu hướng
Step 5: Đề xuất chiến lược dựa trên trend
```

### Công cụ:

| Step | Công cụ | Mô tả |
|------|---------|-------|
| 2 | `tavily-research` | Research chuyên sâu với multi-source synthesis |
| 2 | `tavily-search` (time_range: month/year) | Tin tức và báo cáo mới nhất |
| 2 | `exa_web_search_exa` | Tìm kiếm báo cáo ngành, whitepaper |
| 3 | Sử dụng **Trend Framework** ở references/ | Phân tích có cấu trúc |

### Output: Báo cáo xu hướng theo Trend Framework

---

## Phase 3: Keyword & SEO Research — Nghiên Cứu Từ Khóa

Phù hợp khi: cần xây dựng chiến lược content SEO, tìm cơ hội từ khóa.

### Workflow:

```
Step 1: Xác định chủ đề / seed keywords
Step 2: Research từ khóa (search volume, difficulty, intent)
Step 3: Phân tích SERP (kết quả tìm kiếm thực tế)
Step 4: Phân tích content gap (nội dung đối thủ có, bạn chưa có)
Step 5: Lập kế hoạch từ khóa theo nhóm và ưu tiên
```

### Công cụ:

| Step | Công cụ | Mô tả |
|------|---------|-------|
| 1 | — | Brainstorm seed keywords từ sản phẩm/dịch vụ |
| 2 | `tavily-search` | Xem search results để hiểu search intent |
| 2 | `exa_web_search_exa` | Phân tích top-ranking content |
| 3 | `web-reader_webReader` / `tavily-extract` | Đọc chi tiết top SERP pages |
| 3 | `context7_query-docs` | Tham khảo SEO best practices |
| 4 | `tavily-extract` (nhiều URLs) | So sánh nội dung đối thủ |

### Output: Keyword Map với priority clusters

---

## Phase 4: Customer Insight & Khảo Sát

Phù hợp khi: cần hiểu khách hàng mục tiêu, hành vi, pain points.

### Workflow:

```
Step 1: Xác định đối tượng khảo sát (target segment)
Step 2: Research social listening (diễn đàn, review, social media)
Step 3: Phân tích review và phản hồi khách hàng
Step 4: Tổng hợp insight theo Customer Insight Framework
Step 5: Đề xuất cải thiện dựa trên insight
```

### Công cụ:

| Step | Công cụ | Mô tả |
|------|---------|-------|
| 2 | `tavily-search` (include_domains: reddit.com, trustpilot.com,...) | Social listening |
| 2 | `exa_web_search_exa` | Tìm kiếm review, diễn đàn |
| 3 | `tavily-extract` | Đọc review pages |
| 3 | `tavily-crawl` | Crawl review sites |
| 4 | Sử dụng **Customer Insight Guide** ở references/ | Framework phân tích |

### Output: Báo cáo customer insight với hành động đề xuất

---

## Phase 5: Tổng Hợp Báo Cáo Thị Trường

Khi đã có dữ liệu từ các phase trên, tổng hợp thành báo cáo hoàn chỉnh.

### Cấu trúc báo cáo:

```markdown
# Báo Cáo Thị Trường: [Chủ đề]

## 1. Tóm Tắt Điều Hành (Executive Summary)
*3-5 câu, người đọc biết ngay bức tranh tổng thể*

## 2. Tổng Quan Thị Trường
- Quy mô thị trường
- Tốc độ tăng trưởng
- Xu hướng chính
- Các players chính

## 3. Phân Tích Đối Thủ Cạnh Tranh
- Competitor matrix
- SWOT analysis
- Competitive gap

## 4. Cơ Hội Thị Trường
- Khoảng trống thị trường
- Xu hướng mới nổi
- Đề xuất chiến lược

## 5. Khuyến Nghị Hành Động
- Action items (có ưu tiên)
- Timeline đề xuất
- KPI đo lường

## 6. Nguồn Tham Khảo
- Mọi dữ liệu trong báo cáo đều có nguồn
```

---

## Routing Table

| Nếu bạn muốn | Dùng Phase |
|-------------|------------|
| "Phân tích đối thủ X đang làm gì" | Phase 1 — Competitor Analysis |
| "Xu hướng ngành Y thế nào" | Phase 2 — Trend Research |
| "Tìm từ khóa cho chiến dịch Z" | Phase 3 — Keyword Research |
| "Khách hàng nghĩ gì về sản phẩm A" | Phase 4 — Customer Insight |
| "Tổng hợp báo cáo thị trường" | Phase 5 — Báo Cáo Tổng Hợp |

---

## Quality Gate — Trước Kết Thúc Research

Trước khi kết luận research, kiểm tra:

- [ ] **Mọi dữ liệu đều có source** — Không claim nào thiếu nguồn dẫn
- [ ] **Đa nguồn kiểm chứng** — Mỗi dữ liệu quan trọng có ≥ 2 nguồn
- [ ] **Freshness OK** — Dữ liệu < 6 tháng tuổi (hoặc ghi chú nếu cũ hơn)
- [ ] **Phạm vi rõ ràng** — Đã ghi rõ phạm vi địa lý và thời gian
- [ ] **Báo cáo có action items** — Research mà không có hành động là lãng phí

---

## Anti-Patterns

| Anti-Pattern | Dấu Hiệu | Cách Sửa |
|-------------|----------|----------|
| **Single-source bias** | Chỉ dùng 1 nguồn cho 1 claim | Tìm ít nhất 1 nguồn thứ 2 |
| **Recency blindness** | Dùng báo cáo > 1 năm cho thị trường thay đổi nhanh | Tìm báo cáo mới hơn hoặc ghi chú độ tin cậy |
| **Confirmation bias** | Chỉ tìm dữ liệu ủng hộ giả thuyết ban đầu | Chủ động tìm dữ liệu trái chiều |
| **Vague scope** | "Research thị trường" — quá rộng | Hẹp scope bằng Phase 0 template |
| **No action output** | Báo cáo dài nhưng không có hành động | Luôn kết thúc với Action Items |
| **Data = decision** | Có dữ liệu nhưng không phân tích | Luôn có phần "Ý nghĩa chiến lược" |
| **Bỏ qua đối thủ gián tiếp** | Chỉ phân tích đối thủ trực tiếp | Thêm 2-3 đối thủ gián tiếp/thay thế |

---

## Self-Correction

### Khi research bị lạc hướng (scope creep)
**Dấu hiệu:** Câu hỏi research liên tục mở rộng, không có điểm dừng.
**Cách xử lý:** Dừng lại. Đọc lại Phase 0. Viết lại câu hỏi gốc. Nếu phát hiện chủ đề mới quan trọng, ghi vào "Further Research" và quay lại câu hỏi chính.

### Khi không tìm thấy dữ liệu
**Dấu hiệu:** 3+ lần search không ra kết quả mới.
**Cách xử lý:** Đổi công cụ (tavily → exa → web fetch → Google). Đổi từ khóa. Nếu vẫn không có, ghi nhận là "No data found" — đây cũng là một phát hiện (thị trường ngách / ít thông tin).

### Khi nguồn dữ liệu mâu thuẫn
**Dấu hiệu:** 2 nguồn uy tín cho thông tin trái ngược.
**Cách xử lý:** Kiểm tra ngày xuất bản — nguồn mới hơn thường đúng hơn. Kiểm tra phương pháp nghiên cứu. Nếu không phân giải được, ghi nhận cả 2 và đánh dấu "Unresolved — cần kiểm chứng thêm".

---

## Reference Files

| File | Mô tả |
|------|-------|
| `references/competitor-analysis-template.md` | Template phân tích đối thủ chi tiết với các khung SWOT, Competitive Matrix, Perceptual Map |
| `references/market-trend-framework.md` | Framework nghiên cứu xu hướng thị trường với PESTLE, Gartner Hype Cycle, và Trend Impact Analysis |
| `references/customer-insight-guide.md` | Hướng dẫn khảo sát và phân tích insight khách hàng với Jobs-to-be-Done, Empathy Map, Customer Journey |

---

*Skill được tạo bởi hf-skill-builder — Cross-lineage: đã tham khảo hm-l2-brainstorm (entry gate, phase workflow), hm-l2-product-validation (RICE pattern), hm-l3-deep-research (IRON CLAW, citation tracking), hm-l3-research-chain (pipeline orchestration)*

## Hivemind Tooling Alignment

This skill aligns with Hivemind's custom toolings. The loading agent should declare:

```yaml
tools:
  - hivemind-doc
  - delegate-task
  - configure-primitive
```

### Cross-References

- Routing: `hm-coord-router` (intent classification)
- Coordination: `hm-coord-loop` (multi-agent dispatch)
- Governance: `hivemind-power-on` (load first)
- Quality gates: `hm-gate-triad` (3-gate sequence)

When this skill is loaded, the agent should also load these as needed.
