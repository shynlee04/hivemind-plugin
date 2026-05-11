---
sessionID: ses_1e68af2fcffeSdlsgnVaIP2Wd3
created: 2026-05-11T23:52:42.047Z
updated: 2026-05-11T23:52:42.047Z
parentSessionID: null
delegationDepth: 0
children: []
continuityIndex: session-continuity.json
status: active
---

## USER (turn 1)

Bạn là subagent **hf-l2-skill-builder**, L2 specialist tạo skill. Bạn KHÔNG ĐƯỢC delegate thêm — tự thực thi task này.

## NHIỆM VỤ: Tạo SKILL Market Research cho Marketing Manager

### THÔNG TIN SKILL

**Tên skill:** (bạn tự đặt, theo pattern phù hợp, gợi ý: `marketing-market-research`)
**Ngôn ngữ:** Tiếng Việt (trigger phrases và nội dung)
**Mục đích:** Skill đa năng giúp marketing manager thực hiện nghiên cứu thị trường
**Phạm vi bao gồm:**
- Phân tích đối thủ cạnh tranh (competitor analysis)
- Nghiên cứu xu hướng thị trường (trend research)
- Nghiên cứu từ khóa SEO (keyword & SEO research)
- Khảo sát và insight khách hàng (customer insight)
- Tổng hợp báo cáo thị trường

**Dự án đích:** Dự án hiện tại (hivemind-plugin-private), lưu tại `.opencode/skills/<tên-skill>/`

### PATTERN THAM KHẢO

Skill này là standalone (không thuộc Hivemind), nhưng hãy tham khảo cấu trúc từ các skill hiện có trong dự án:

1. **hm-l2-brainstorm** — cấu trúc entry gate, hard gate, phase workflow
2. **hm-l2-product-validation** — pattern product-lens, RICE scoring framework
3. **hm-l3-deep-research** — research methodology, citation tracking
4. **hm-l3-research-chain** — pipeline orchestration, iron law

### CẤU TRÚC SKILL YÊU CẦU

Tạo package skill đầy đủ tại `.opencode/skills/<tên-skill>/`:

1. **SKILL.md** — file chính với:
   - YAML frontmatter: name, description (tiếng Việt, có trigger phrases), metadata, allowed-tools
   - Overview: skill này làm gì, cho ai
   - Iron Law: nguyên tắc nghiên cứu thị trường
   - Workflow: các bước thực hiện research
   - Template cho từng loại research (competitor, trend, keyword, customer)
   - Trigger phrases tiếng Việt trong description

2. **references/** — thư mục tham khảo:
   - `competitor-analysis-template.md` — template phân tích đối thủ
   - `market-trend-framework.md` — framework nghiên cứu xu hướng
   - `customer-insight-guide.md` — hướng dẫn khảo sát khách hàng

### YÊU CẦU CHẤT LƯỢNG

- Description có ít nhất 7 trigger phrases (tiếng Việt)
- Progressive disclosure: mô tả ngắn → trigger → body chi tiết → references
- Nội dung actionable, có workflow cụ thể
- Template có sẵn để marketing manager copy-paste dùng ngay
- Iron Law: "Không có dữ liệu thì không có quyết định — research không có evidence là phỏng đoán"

### ĐẦU RA

Sau khi hoàn thành, return:
1. Danh sách file đã tạo
2. Chất lượng skill (trigger count, structure validation)
3. Cross-lineage access log (nếu có dùng hm-* skills để tham khảo pattern)
4. Quality gate verdicts:

### Tool: skill

**Input:**
```json
{
  "name": "hf-l2-use-authoring-skills"
}
```

**Output:** (pruned)
```
# Skill: hf-l2-use-authoring-skills
```


### Tool: skill

**Input:**
```json
{
  "name": "hm-l3-deep-research"
}
```

**Output:** (pruned)
```
# Skill: hm-l3-deep-research
```


### Tool: skill

**Input:**
```json
{
  "name": "hm-l3-research-chain"
}
```

**Output:** (pruned)
```
# Skill: hm-l3-research-chain
```


### Tool: skill

**Input:**
```json
{
  "name": "hm-l2-brainstorm"
}
```

**Output:** (pruned)
```
# Skill: hm-l2-brainstorm
```


### Tool: skill

**Input:**
```json
{
  "name": "hm-l2-product-validation"
}
```

**Output:** (pruned)
```
# Skill: hm-l2-product-validation
```


### Tool: glob

**Input:**
```json
{
  "callID": "call_00_Ddo9uwk5kF41MCZLAq2m2223"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.opencode/skills"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_7Fid0t7lh8Zn4OGG7WDn9275"
}
```


### Tool: write

**Input:**
```json
{
  "callID": "call_00_Hzolao6pwDoOvGDKZn7m8783"
}
```


### Tool: write

**Input:**
```json
{
  "callID": "call_00_lljxJXto0ildzWgB0PRC2932"
}
```


### Tool: write

**Input:**
```json
{
  "callID": "call_00_7uyUy1XSSqqaX9jL7qso7672"
}
```


### Tool: write

**Input:**
```json
{
  "callID": "call_00_qJGRQGdyU8U9tv34vER39307"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_mM8y12LurulmhRvBYKBG6422"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_J24l08WcthIoHiQklN7Y5733"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.opencode/skills/marketing-market-research/SKILL.md"
}
```

