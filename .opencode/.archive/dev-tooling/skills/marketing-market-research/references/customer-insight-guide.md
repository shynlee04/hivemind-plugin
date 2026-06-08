# Hướng Dẫn: Khảo Sát & Insight Khách Hàng (Customer Insight)

> Framework toàn diện để thu thập, phân tích và áp dụng insight khách hàng vào chiến lược marketing.

---

## 1. Jobs-to-be-Done (JTBD) Framework

Thay vì hỏi "khách hàng là ai", hãy hỏi "khách hàng thuê sản phẩm làm việc gì".

### Cấu trúc JTBD:

```
Khi [tình huống], tôi muốn [động lực] để [kết quả mong muốn],
nhưng gặp [rào cản] nên tôi phải [giải pháp hiện tại].
```

**Ví dụ:**
> "Khi tôi cần tìm nhà hàng cho bữa tối cuối tuần, tôi muốn đặt bàn nhanh chóng mà không cần gọi điện, nhưng tôi không biết nhà hàng nào còn bàn trống nên tôi phải gọi từng nơi để hỏi."

### 4 câu hỏi JTBD cốt lõi:

| # | Câu hỏi | Mục đích |
|---|---------|----------|
| 1 | Tình huống nào khiến khách hàng tìm đến sản phẩm? | Xác định trigger |
| 2 | Họ muốn đạt được điều gì? | Xác định functional job |
| 3 | Họ gặp khó khăn gì trên đường đi? | Xác định pain points |
| 4 | Tại sao họ từ bỏ giải pháp trước đó? | Xác định switching trigger |

---

## 2. Empathy Map — Thấu Cảm Khách Hàng

### Canvas:

```
┌─────────────────────────────────────────────────┐
│                   NÓI GÌ?                       │
│  (What do they SAY publicly?)                   │
│  • [...]                                        │
│  • [...]                                        │
├──────────────────────┬──────────────────────────┤
│       NGHĨ GÌ?       │       LÀM GÌ?           │
│  (What do they THINK │  (What do they DO?)      │
│   privately?)        │  • [...]                │
│  • [...]             │  • [...]                │
│  • [...]             │                          │
├──────────────────────┴──────────────────────────┤
│                  CẢM THẤY GÌ?                   │
│  (What do they FEEL?)                           │
│  • Fears: [...]                                 │
│  • Frustrations: [...]                          │
│  • Aspirations: [...]                           │
├─────────────────────────────────────────────────┤
│                  ĐAU ĐỚN GÌ?                    │
│  (Pains — rào cản, khó khăn)                    │
│  • [...]                                        │
├─────────────────────────────────────────────────┤
│                MONG MUỐN GÌ?                    │
│  (Gains — kết quả lý tưởng)                     │
│  • [...]                                        │
└─────────────────────────────────────────────────┘
```

---

## 3. Customer Journey Map — Hành Trình Khách Hàng

| Giai đoạn | Nhận biết | Cân nhắc | Quyết định | Mua hàng | Hậu mãi |
|-----------|-----------|----------|------------|----------|---------|
| **Mục tiêu** | Biết đến thương hiệu | So sánh lựa chọn | Chọn mua | Hoàn tất giao dịch | Sử dụng & trung thành |
| **Hành động** | [...] | [...] | [...] | [...] | [...] |
| **Điểm chạm** | Google, Facebook, TikTok | Website, review | Pricing page, CS | Checkout, payment | CSKH, email |
| **Cảm xúc** | 🤔 Tò mò | 🤔 Phân vân | 😊 Tự tin HAY 😠 Bối rối | 😊 Hài lòng HAY 😤 Bực mình | 😍 Yêu thích HAY 😞 Thất vọng |
| **Pain points** | [...] | [...] | [...] | [...] | [...] |
| **Cơ hội** | [...] | [...] | [...] | [...] | [...] |

### Phân tích từng touchpoint:

| Touchpoint | Kênh | Kỳ vọng | Thực tế | Gap | Cải thiện |
|-----------|------|---------|---------|-----|-----------|
| [...] | [...] | [...] | [...] | [...] | [...] |

---

## 4. Social Listening — Lắng Nghe Mạng Xã Hội

### Nơi thu thập dữ liệu:

| Nguồn | Loại insight | Công cụ research |
|-------|-------------|-----------------|
| **Reddit** (r/[ngành]) | Pain points, câu hỏi thật | `tavily-search` include_domains: reddit.com |
| **Trustpilot / G2 / Capterra** | Review sản phẩm | `tavily-extract` trên review pages |
| **Facebook Groups** | Thảo luận cộng đồng | `exa_web_search_exa` |
| **Google Reviews** | Phản hồi khách hàng thật | `tavily-extract` |
| **Quora** | Câu hỏi khách hàng | `tavily-search` include_domains: quora.com |
| **LinkedIn** | B2B insight, decision maker | `exa_web_search_exa` |

### Quy trình Social Listening:

```
Step 1: Xác định keywords chính (sản phẩm, vấn đề, ngành)
Step 2: Search trên từng nguồn
Step 3: Thu thập quotes khách hàng (giữ nguyên văn)
Step 4: Phân loại themes (common patterns)
Step 5: Định lượng (xuất hiện bao nhiêu lần?)
Step 6: Tổng hợp insight
```

### Output template:

```markdown
## Social Listening Report

### Theme 1: [Ví dụ: "Giá cao là rào cản lớn nhất"]
- **Số lần xuất hiện:** 15/50 reviews
- **Quote đại diện:** "Sản phẩm tốt nhưng giá cao quá..."
- **Nguồn:** Trustpilot reviews, Reddit
- **Insight:** Khách hàng sẵn sàng mua nếu có option trả góp
- **Hành động:** Thêm payment installment option

### Theme 2: [...]
```

---

## 5. Khảo Sát Khách Hàng — Survey Framework

### Mẫu câu hỏi theo từng mục đích:

| Mục đích | Câu hỏi mẫu | Loại câu hỏi |
|----------|------------|-------------|
| **Demographic** | "Bạn bao nhiêu tuổi?" | Multiple choice |
| **Behavior** | "Bạn thường mua sắm online mấy lần/tháng?" | Scale |
| **Pain point** | "Khó khăn lớn nhất khi [hành động] là gì?" | Open-ended |
| **Satisfaction** | "Bạn hài lòng với [sản phẩm] thế nào?" | NPS scale (0-10) |
| **Priority** | "Tính năng nào quan trọng nhất với bạn?" | Ranking |
| **Motivation** | "Lý do chính bạn chọn [sản phẩm]?" | Multiple choice + Other |

### Nguyên tắc khảo sát:
1. **Tối đa 7 câu hỏi** — tỷ lệ hoàn thành giảm 10% mỗi câu thêm
2. **Luôn có 1 câu open-ended** — insight không lường trước được
3. **Không dùng từ dẫn dắt** — "Bạn có thấy tính năng X tuyệt vời không?" → "Bạn nghĩ gì về tính năng X?"
4. **Test trước** — gửi cho 3 người trước khi gửi hàng loạt

---

## 6. Insight Synthesis — Tổng Hợp Insight

### Raw Data → Insights Framework:

```
Raw Data (quotes, số liệu)
    ↓
Themes (nhóm chủ đề lặp lại)
    ↓
Insights (hiểu biết sâu sắc, often counter-intuitive)
    ↓
Opportunities (cơ hội hành động)
    ↓
Recommendations (hành động cụ thể)
```

### Template tổng hợp:

```markdown
## Customer Insight Report

### Insight 1: [Tên insight]
**Nguồn dữ liệu:** [Social listening / Survey / Review / Phỏng vấn]
**Bằng chứng:** [Quote / Số liệu]
**Phân tích:** [Tại sao insight này quan trọng?]
**Mức độ tin cậy:** [Cao/TB/Thấp]
**Hành động đề xuất:** [Cụ thể, đo lường được]

### Insight 2: [...]
```

### Mức độ ưu tiên insight:

| Tiêu chí | Trọng số | Insight A | Insight B |
|----------|----------|-----------|-----------|
| Impact (tác động đến business) | 3x | /10 | /10 |
| Urgency (cấp bách) | 2x | /10 | /10 |
| Confidence (độ tin cậy) | 2x | /10 | /10 |
| Effort (dễ triển khai) | 1x | /10 | /10 |
| **Tổng điểm** | | | |

---

## 7. Customer Insight Checklist

- [ ] **Đã xác định target segment cụ thể** — Không phải "tất cả mọi người"
- [ ] **Thu thập từ ít nhất 3 nguồn** — Social listening, review, survey (nếu có)
- [ ] **Có ít nhất 5 quotes khách hàng thật** — Giữ nguyên văn
- [ ] **Đã phân nhóm themes** — Không phải list quotes rời rạc
- [ ] **Insight có bằng chứng** — Mỗi insight đều có dữ liệu đằng sau
- [ ] **Có hành động cụ thể** — Insight mà không có action là decoration
- [ ] **Đã ưu tiên insight** — Cái nào quan trọng nhất làm trước

---

## Nguồn Tham Khảo

| Phương pháp | Mô tả | Đọc thêm |
|------------|-------|----------|
| Jobs-to-be-Done | Clayton Christensen | JTBD framework |
| Empathy Map | Dave Gray | Xplane |
| Customer Journey | Nielson Norman Group | NNGroup |
| NPS | Bain & Company | netpromoter.com |
| VOC (Voice of Customer) | Qualtrics / Medallia | VoC programs |

---

*Customer Insight Guide — Dùng kèm với skill marketing-market-research Phase 4*
