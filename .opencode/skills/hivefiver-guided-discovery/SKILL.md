---
name: hivefiver-guided-discovery
description: "Use when a user needs guided requirement clarification before building framework assets. Adapts to language (EN/VI), maturity level (beginner→expert), and input complexity. Integrates brainstorming, QA-driven questions, and bilingual delivery into a holistic discovery journey."
---

# HiveFiver Guided Discovery

## When to Use

- User's intent is classified but requirements are vague
- `guided-discovery.sh` returns `needs_discovery: true`
- User is a beginner (`maturity: L0` or `L1`)
- User speaks Vietnamese or sends mixed EN/VI input
- User sends a wall-of-text that needs decomposition
- Router routes to `/hivefiver-discovery` stage

## Core Pattern

```
classify-intent → profile-user → adapt-questions → guided-QA → structured-output → intake-promotion
```

## Adaptive Question Delivery

### By Maturity Level

**L0 (Beginner) — Full Guidance Mode:**
- Explain WHAT each question means before asking
- Provide 2 concrete examples for each question
- Use simple language (avoid jargon)
- Ask ONE question at a time (never batch)
- Offer multiple-choice where possible (using the question tool)
- If user's answer is vague → rephrase question with narrower scope
- Max 8 questions total, 1 follow-up per ambiguity

**L1 (Intermediate) — Structured Mode:**
- Group questions in themed batches (problem, scope, success)
- Provide 1 example per group
- Allow batch answers
- Max 10 questions total, 2 follow-ups per ambiguity

**L2 (Advanced) — Semi-Direct Mode:**
- Present all question groups upfront
- Expect structured answers
- Skip obvious questions if input already covers them
- Max 12 questions total, 3 follow-ups per ambiguity

**L3 (Expert) — Compact Mode:**
- Ask only gaps — skip anything the input already answers
- Use framework vocabulary directly
- Max 9 questions, 2 follow-ups per ambiguity

### By Language

**English (en):**
- All questions in English
- Examples drawn from common software patterns

**Vietnamese (vi):**
- Questions delivered in Vietnamese with technical terms preserved in English
- Format: Vietnamese question (technical_term in English)
- Example: "Agent này sẽ LÀM GÌ? (mô tả chức năng chính — 1-2 câu)"

**Bilingual (bilingual):**
- Each question in BOTH languages
- Format: English question → Vietnamese equivalent
- User can answer in either language

## Vietnamese Question Translations

### problem_pain group
| EN | VI |
|----|-----|
| What painful problem are we solving right now? | Vấn đề đau nhất chúng ta đang giải quyết là gì? |
| Who experiences this pain first, and how often? | Ai gặp vấn đề này đầu tiên, và bao lâu một lần? |
| What happens if we do nothing for two sprints? | Nếu không làm gì trong 2 sprint thì chuyện gì xảy ra? |

### scope_boundaries group
| EN | VI |
|----|-----|
| What is strictly in scope for this iteration? | Phạm vi chính xác cho lần này là gì? |
| What is explicitly out of scope (anti-goals)? | Những gì KHÔNG nằm trong phạm vi (anti-goals)? |
| Which constraints are non-negotiable? | Ràng buộc nào là bắt buộc, không thể thay đổi? |

### success_and_failures group
| EN | VI |
|----|-----|
| What are the top 3 acceptance signals for success? | 3 tín hiệu chấp nhận thành công hàng đầu là gì? |
| What are the top 3 failure modes we must prevent? | 3 tình huống thất bại phải ngăn chặn là gì? |
| What minimum verification evidence is required? | Bằng chứng xác minh tối thiểu cần có là gì? |

### discovery_unknowns group
| EN | VI |
|----|-----|
| Which assumptions are currently unverified? | Giả định nào hiện chưa được xác minh? |
| Which unknowns can block implementation? | Điều gì chưa biết có thể chặn việc triển khai? |
| What decision must be made first? | Quyết định nào phải được đưa ra trước tiên? |

### qa_verification group
| EN | VI |
|----|-----|
| Which scenario is highest risk? | Tình huống nào có rủi ro cao nhất? |
| What regression areas are impacted? | Những khu vực regression nào bị ảnh hưởng? |
| What proof format will we accept? | Định dạng bằng chứng nào chúng ta chấp nhận? |

## Brainstorming Integration

For `build_new` and `extend` intents, weave brainstorming into discovery:

1. **After problem_pain** → Run quick divergent ideation:
   - "Given this problem, what are 3 different ways we could solve it?"
   - Present as options for user to evaluate (builds ownership)

2. **After scope_boundaries** → Challenge scope:
   - "Is there a simpler version that solves 80% of the problem?"
   - "What's the minimum viable asset set?" (1 agent? 1 command? both?)

3. **After success_and_failures** → Spec grounding (from Q.U.A.N.T.):
   - Replace vague criteria with measurable ones
   - "You said 'it should work well' — what does 'well' mean in numbers?"

## Wall-of-Text Handling

When `input_band: wall_of_text`:

1. **Summarize first** — Break input into 3 sections maximum
2. **Rank** — Ask user which section is highest priority
3. **Focus** — Run question groups only on top-priority section first
4. **Expand** — Ask if remaining sections should be separate pipelines

## Promotion Gate

Discovery output promotes to intake ONLY when:
- `unresolved_critical == 0`
- `unresolved_minor <= 1`
- All 8 `required_answers` fields are populated
- `verification_evidence` is explicit (not "we'll figure it out")

If gate fails → stay in discovery, ask targeted follow-ups.

## Anti-Patterns to Catch

| Signal | What's Wrong | Action |
|--------|-------------|--------|
| "make it better" | Vague success criteria | Ask: "Better than what? Measured how?" |
| No anti-goals | Missing scope boundaries | Ask: "What should this asset NEVER do?" |
| "it depends" | Unresolved constraint | Ask: "On what specifically? List the conditions." |
| Contradictory answers | Scope conflict | Surface both answers, ask user to choose |
| Technical jargon from L0 user | Copied from docs, may not understand | Ask: "Can you explain [term] in your own words?" |

## Scripts

- `guided-discovery.sh` — User profiler (language, maturity, input band)
- `journey-intake-qa.sh` — Question pack generator (already exists)
- `classify-intent.sh` — Intent classifier (already exists)

## References

- `references/vi-en-terminology.md` — Vietnamese framework terminology
- `qa-discovery-playbook.md` — QA process reference (in hivefiver-coordination)
- `brainstorm-framing.md` — Brainstorm session structure (in prompts/)
