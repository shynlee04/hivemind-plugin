---
name: hivefiver-discovery
description: "Guided requirement discovery with adaptive QA. Detects user language (EN/VI), maturity level, and input complexity. Integrates brainstorming + QA questioning to clarify pains, requirements, and acceptance evidence before intake."
agent: hivefiver
subtask: true
required_skills:
  - hivefiver-guided-discovery
---

<enforcement>
Gate check (auto-executed):
!`bash .opencode/skills/hivefiver-coordination/scripts/gate-check.sh discovery .`

Pipeline state (auto-executed):
!`bash .opencode/skills/hivefiver-coordination/scripts/state-update.sh read .`

Pipeline orchestrator (auto-executed — shows next stage after discovery):
!`bash .opencode/skills/hivefiver-coordination/scripts/pipeline-orchestrator.sh status .`

User profile (auto-executed — detects language, maturity, input complexity):
!`bash .opencode/skills/hivefiver-mode/scripts/guided-discovery.sh "$ARGUMENTS"`

Intent classification (auto-executed — determines question focus):
!`bash .opencode/skills/hivefiver-mode/scripts/classify-intent.sh "$ARGUMENTS"`

Runtime enforcement pre-turn (auto-executed — MANDATORY quality/state baseline):
!`bash .opencode/skills/hivefiver-coordination/scripts/runtime-gate.sh pre-turn .`

Unified MUST pack (auto-executed — intent/profile/journey obligations):
!`bash .opencode/skills/hivefiver-coordination/scripts/hivefiver-must-pack.sh discovery "$ARGUMENTS" .`

⛔ IF the gate check above shows "allowed": false — STOP. Report the reason to the user. DO NOT proceed.
</enforcement>

<objective>
Guide the user through requirement clarification with adaptive depth.
- Beginners get examples, explanations, and one-at-a-time questions
- Vietnamese speakers get bilingual delivery
- Experts get compact direct questions
- Wall-of-text gets summarized first, then targeted questions

The agent LEADS this process — the user follows guided prompts.
</objective>

<context>
User input: $ARGUMENTS

Current state:
@.hivemind/hive-modules/hivefiver-v2/STATE.md

Guided discovery skill:
@.opencode/skills/hivefiver-guided-discovery/SKILL.md

Vietnamese terminology:
@.opencode/skills/hivefiver-guided-discovery/references/vi-en-terminology.md

QA playbook:
@.opencode/skills/hivefiver-coordination/references/qa-discovery-playbook.md
</context>

<process>
## Step 1: Read User Profile

Read the user profile from the enforcement block. Extract:
- `language`: en | vi | bilingual
- `maturity`: L0 | L1 | L2 | L3
- `input_band`: short | medium | long | wall_of_text
- `guidance`: high | medium | low

Announce: "I've detected [language/maturity/band]. Here's how I'll guide you."

## Step 2: Generate Adaptive Question Pack

Based on the user profile, call journey-intake-qa.sh with detected parameters:

```bash
bash .opencode/skills/hivefiver-coordination/scripts/journey-intake-qa.sh [intent] [maturity] [input_band]
```

Read the output to get question groups and control limits.

## Step 3: Wall-of-Text Pre-Processing (if input_band = wall_of_text)

Before asking questions:
1. Summarize the user's input into 3 sections (problem, scope, goals)
2. Present the summary and ask: "Did I capture this correctly?"
3. Ask user to rank which section is highest priority
4. Focus questions on the highest-priority section first

## Step 4: Guided Question Delivery

Adapt delivery based on maturity level from the guided-discovery skill:

### L0 (Beginner) — One At a Time
For each question:
1. Explain WHAT the question is about (1 sentence)
2. Give 2 concrete examples of good answers
3. Ask the question
4. If answer is vague → rephrase with narrower scope
5. Use the AskUserQuestion tool with multiple-choice options where possible

### L1 (Intermediate) — Grouped With Examples
For each question group:
1. Give 1 example of what a good answer looks like
2. Ask all questions in the group
3. Validate answers for completeness

### L2 (Advanced) — All Groups Upfront
1. Present all question groups
2. Skip questions the input already answered
3. Ask only the gaps

### L3 (Expert) — Gaps Only
1. Extract answers from the input
2. Show what was extracted
3. Ask ONLY about missing gaps

## Step 5: Language-Adaptive Delivery

### If language = vi
Load Vietnamese translations from the skill's vi-en-terminology.md reference.
Deliver each question in Vietnamese with English technical terms preserved:
- "Agent này sẽ làm gì? (mô tả chức năng chính — 1-2 câu)"
- Technical terms like agent, skill, command, workflow stay in English

### If language = bilingual
Deliver each question in BOTH languages:
- EN: "What does this agent do?"
- VI: "Agent này sẽ làm gì?"

### If language = en
Standard English delivery.

## Step 6: Brainstorming Integration (for build_new / extend intents)

After the problem_pain group, weave in brainstorming:

1. "Given this problem, here are 3 different approaches:"
   - Present 3 divergent solution ideas
   - Ask user which resonates most (or if they have a different idea)

2. After scope_boundaries:
   - "Is there a simpler version that solves 80% of the problem?"
   - "What's the minimum viable asset set?"

3. After success_and_failures (Q.U.A.N.T. grounding):
   - Replace any vague criteria with measurable ones
   - Challenge weasel words: "fast" → "response under X ms"

## Step 7: Answer Validation

For each answer, classify confidence:
- **high**: concrete, testable, bounded
- **medium**: usable but missing detail → ask 1 follow-up
- **low**: vague or contradictory → ask up to N follow-ups (per maturity)

Catch anti-patterns:
- "make it better" → Ask: "Better than what? Measured how?"
- No anti-goals → Ask: "What should this NEVER do?"
- "it depends" → Ask: "On what specifically?"

## Step 8: Produce Structured Output

Compile all answers into the 8 required fields:
- problem_statement
- primary_user_pain
- in_scope
- out_of_scope
- non_negotiable_constraints
- acceptance_signals
- failure_modes
- verification_evidence

## Step 9: Promotion Gate

Check gate criteria:
- `unresolved_critical` must equal 0
- `unresolved_minor` must be <= 1
- All 8 required answers must be populated
- `verification_evidence` must be explicit

If gate PASSES → recommend `/hivefiver-intake`
If gate FAILS → stay in discovery, explain which gaps remain

## Step 10: State Update and Handoff

```bash
bash .opencode/skills/hivefiver-coordination/scripts/state-update.sh add-completed discovery .
bash .opencode/skills/hivefiver-coordination/scripts/state-update.sh set-stage intake .
bash .opencode/skills/hivefiver-coordination/scripts/state-update.sh write-handoff "Discovery completed with guided QA clarification." .
```

Step 11: Run runtime enforcement post-turn (MANDATORY):
```bash
bash .opencode/skills/hivefiver-coordination/scripts/runtime-gate.sh post-turn .
```
Include the output as evidence in your completion claim.
</process>

<guided_interaction>
At each step, announce:

1. **What I'm doing**: "I'm asking about [group] to understand [why]."
2. **Progress**: "We've completed [N/5] question groups. [M] questions remaining."
3. **What I need**: "Please answer [this specific question]."
4. **What comes next**: "After this, I'll ask about [next group], then we move to intake."

For Vietnamese users, add:
- "Bạn có thể trả lời bằng tiếng Việt hoặc tiếng Anh."
- ("You can answer in Vietnamese or English.")

For beginners, add after each answer:
- "That's a good answer. Here's what I understood: [paraphrase]. Is that right?"
</guided_interaction>

<error_routing>
| Error | Cause | Recovery |
|-------|-------|----------|
| User gives up | Too many questions | Summarize what you have, offer minimum-viable discovery |
| Contradictory answers | Scope conflict | Surface both, ask user to choose one |
| Language switch | User started in EN, switched to VI | Auto-detect and adapt mid-session |
| Follow-up limit hit | Still ambiguous after max follow-ups | Document as unresolved_minor, proceed |
</error_routing>

<output_contract>
Return:
- discovery_summary: structured object with all 8 required_answers
- user_profile: { language, maturity, input_band, guidance }
- unresolved_critical: integer (must be 0 to promote)
- unresolved_minor: integer (must be <= 1 to promote)
- brainstorm_output: selected approach (if build_new/extend intent)
- promotion_allowed: boolean
- next_command: /hivefiver-intake or /hivefiver-discovery --continue
</output_contract>
