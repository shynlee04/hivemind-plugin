# Framework: Nghiên Cứu Xu Hướng Thị Trường (Market Trend Research)

> Framework toàn diện để phân tích xu hướng thị trường — từ tổng quan vĩ mô đến tác động cụ thể lên chiến lược kinh doanh.

---

## 1. PESTLE Analysis — Phân Tích Môi Trường Vĩ Mô

Phân tích các yếu tố bên ngoài tác động đến thị trường.

### Political (Chính trị)

| Yếu tố | Tác động đến ngành | Mức độ | Xu hướng |
|--------|-------------------|--------|----------|
| Chính sách thuế/import-export | [...] | [Cao/TB/Thấp] | [Tăng/Giảm/Ổn định] |
| Quy định về data privacy | [...] | [Cao/TB/Thấp] | [Tăng/Giảm/Ổn định] |
| Ổn định chính trị | [...] | [Cao/TB/Thấp] | [Tăng/Giảm/Ổn định] |

### Economic (Kinh tế)

| Yếu tố | Tác động | Mức độ | Xu hướng |
|--------|----------|--------|----------|
| Tăng trưởng GDP | [...] | | |
| Lạm phát | [...] | | |
| Lãi suất | [...] | | |
| Tỷ giá | [...] | | |
| Chi tiêu tiêu dùng | [...] | | |

### Social (Xã hội)

| Yếu tố | Tác động | Mức độ | Xu hướng |
|--------|----------|--------|----------|
| Thay đổi nhân khẩu học | [...] | | |
| Hành vi tiêu dùng mới | [...] | | |
| Xu hướng văn hóa | [...] | | |
| Kỳ vọng của khách hàng | [...] | | |

### Technological (Công nghệ)

| Yếu tố | Tác động | Mức độ | Xu hướng |
|--------|----------|--------|----------|
| AI/ML trong ngành | [...] | | |
| Công nghệ mới nổi | [...] | | |
| Tự động hóa | [...] | | |
| Nền tảng số | [...] | | |

### Legal (Pháp lý)

| Yếu tố | Tác động | Mức độ | Xu hướng |
|--------|----------|--------|----------|
| Quy định ngành | [...] | | |
| Bản quyền/sở hữu trí tuệ | [...] | | |
| Luật quảng cáo | [...] | | |

### Environmental (Môi trường)

| Yếu tố | Tác động | Mức độ | Xu hướng |
|--------|----------|--------|----------|
| Biến đổi khí hậu | [...] | | |
| Net-zero / ESG | [...] | | |
| Bền vững | [...] | | |

---

## 2. Trend Impact Analysis

Đánh giá mức độ tác động của từng xu hướng lên doanh nghiệp.

| Xu hướng | Xác suất xảy ra | Tác động (1-5) | Thời gian | Cơ hội | Rủi ro |
|----------|----------------|----------------|-----------|--------|--------|
| [Trend 1] | [Cao/TB/Thấp] | [★] | [Ngắn/Trung/Dài hạn] | [...] | [...] |
| [Trend 2] | [Cao/TB/Thấp] | [★] | [Ngắn/Trung/Dài hạn] | [...] | [...] |
| [Trend 3] | [Cao/TB/Thấp] | [★] | [Ngắn/Trung/Dài hạn] | [...] | [...] |

**Ma trận ưu tiên xu hướng:**

```
Tác động cao
    │
    │  [Theo dõi sát]    [Ưu tiên hành động]
    │
    ├───────────────────────────
    │  [Bỏ qua]         [Chuẩn bị]
    │
    └─── Xác suất thấp ─────────── Xác suất cao
```

---

## 3. Gartner Hype Cycle — Xác Định Vị Trí Công Nghệ

Sử dụng để đánh giá công nghệ mới nổi trong ngành.

```
Kỳ vọng
  │
  │  ● Innovation Trigger
  │    \
  │     ● Peak of Inflated Expectations
  │       \
  │        ● Trough of Disillusionment
  │          \
  │           ● Slope of Enlightenment
  │            \
  │             ● Plateau of Productivity
  └─────────────────────────────── Thời gian
```

**Câu hỏi cho từng giai đoạn:**

| Giai đoạn | Câu hỏi chiến lược |
|-----------|-------------------|
| **Innovation Trigger** | Có nên thử nghiệm POC không? Chi phí thử nghiệm là bao nhiêu? |
| **Peak of Inflated Expectations** | Có đang bị FOMO không? Có use case thực tế chưa? |
| **Trough of Disillusionment** | Công nghệ có thực sự giải quyết vấn đề gì không? Ai đang thành công? |
| **Slope of Enlightenment** | Best practices đã xuất hiện chưa? Có nên đầu tư chính thức? |
| **Plateau of Productivity** | Làm sao để triển khai hiệu quả? ROI kỳ vọng? |

---

## 4. Trend Research Checklist

- [ ] **Xác định lĩnh vực và phạm vi địa lý**
  - Ngành: [...]
  - Địa lý: [...]
  - Thời gian: [...]

- [ ] **Tìm báo cáo ngành (industry reports)**
  - Dùng `tavily-research` với query: "báo cáo ngành [lĩnh vực] [năm]"
  - Dùng `tavily-search` với filter time_range="year"
  - Tìm kiếm: Gartner, Forrester, McKinsey, Statista, BMI Research

- [ ] **Phân tích đa chiều**
  - [ ] PESTLE — đủ 6 khía cạnh
  - [ ] Trend Impact — ít nhất 3 xu hướng chính
  - [ ] Đối thủ đang làm gì với các xu hướng này?

- [ ] **Tổng hợp chiến lược**
  - [ ] Cơ hội rõ ràng (ít nhất 2)
  - [ ] Rủi ro được xác định (ít nhất 2)
  - [ ] Action items khả thi
  - [ ] Timeline ưu tiên

---

## 5. Trend Report Template

```markdown
# Báo Cáo Xu Hướng: [Lĩnh vực]

## Executive Summary
[3-5 câu: bức tranh tổng thể thị trường]

## Key Trends
1. **[Tên xu hướng 1]**
   - Mô tả:
   - Bằng chứng:
   - Tác động đến ngành:
   - Khung thời gian:

2. **[Tên xu hướng 2]** [...]

## PESTLE Highlights
- Political: [...]
- Economic: [...]
- Social: [...]
- Technological: [...]
- Legal: [...]
- Environmental: [...]

## Cơ Hội & Rủi Ro
| Cơ hội | Mô tả | Chiến lược |
|--------|-------|------------|
| [...] | [...] | [...] |

| Rủi ro | Mô tả | Giảm thiểu |
|--------|-------|------------|
| [...] | [...] | [...] |

## Khuyến Nghị
1. [Action 1] — [Priority: Cao/TB/Thấp]
2. [Action 2] — [Priority: Cao/TB/Thấp]
3. [Action 3] — [Priority: Cao/TB/Thấp]

## Nguồn
- [url] — [date truy cập]
- [url] — [date truy cập]
```

---

## Nguồn Tham Khảo Cho Trend Research

| Nguồn | Loại | URL Pattern |
|-------|------|-------------|
| Google Trends | Dữ liệu | trends.google.com |
| Statista | Báo cáo | statista.com |
| Gartner | Báo cáo | gartner.com |
| McKinsey | Báo cáo | mckinsey.com |
| CB Insights | Venture | cbinsights.com |
| Crunchbase | Startup | crunchbase.com |
| Similarweb | Traffic | similarweb.com |
| Exploding Topics | Trend | explodingtopics.com |

---

*Market Trend Framework — Dùng kèm với skill marketing-market-research Phase 2*
