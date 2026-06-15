# Three Skill Patterns: P1, P2, P3

## Pattern Overview

Every skill fits one of three architecture patterns. Choose by purpose, not by preference.

| Pattern | Purpose | Body Size | Reference Files | When to Use |
|---------|---------|-----------|-----------------|-------------|
| **P1 — Routing** | Thin entry, delegates to sub-skills | <200 lines | 0-2 | Meta skills, domain routers, entry points |
| **P2 — Domain** | Focused guidance for one domain | 200-400 lines | 3-8 | Step-by-step processes, how-to guides |
| **P3 — Expertise** | Deep reference-heavy content | 400+ lines | 8+ | Complex domains, recovery protocols, multi-scenario |

## Decision Tree

```
Is this skill primarily routing to other skills?
  YES → P1 (thin entry, <200 lines, decision tree only)
  NO → Is this a focused how-to or process skill?
    YES → P2 (balanced depth, 200-400 lines, with references)
    NO → Is the complexity genuinely beyond P2 scope?
      YES → P3 (expertise depth, 400+ lines, many references)
      NO → You're overthinking — use P2
```

## P1 — Routing Pattern

**Purpose:** Act as a thin entry point that routes to deeper skills.

**Structure:**
```
skill-name/
├── SKILL.md              # <200 lines: decision tree + routing table
└── references/           # 0-2 files max
    └── routing-map.md    # Optional: detailed routing logic
```

**SKILL.md body contains:**
- First action block (what to do immediately)
- Decision tree (when to load which reference)
- Routing table (maps user intent → reference file)
- No deep implementation guidance

**Example:** `meta-builder` — routes to domain skills based on user intent.

## P2 — Domain Pattern (Default)

**Purpose:** Provide focused, actionable guidance for a single domain.

**Structure:**
```
skill-name/
├── SKILL.md              # 200-400 lines: core workflow + decision tree
├── references/           # 3-8 files
│   ├── 01-topic-a.md
│   ├── 02-topic-b.md
│   └── ...
├── scripts/              # Optional: enforcement scripts
└── templates/            # Optional: scaffolds
```

**SKILL.md body contains:**
- First action block
- Decision tree
- Core workflow (the main process)
- Gate system (if applicable)
- Anti-patterns
- Links to reference files for depth

**Example:** `use-authoring-skills` — this skill is P2.

## P3 — Expertise Pattern

**Purpose:** Deep reference-heavy content for complex domains.

**Structure:**
```
skill-name/
├── SKILL.md              # 400+ lines: comprehensive guide
├── references/           # 8+ files
│   ├── 01-concept-a.md
│   ├── 02-concept-b.md
│   ├── ...
│   └── 12-advanced.md
├── scripts/
├── templates/
└── assets/
```

**SKILL.md body contains:**
- Everything from P2, plus:
- Multiple workflows for different scenarios
- Detailed edge case handling
- Recovery procedures
- Cross-references between many reference files

**Example:** `opencode-platform-reference` — covers 20+ topics across the platform.

## Pattern Selection for Template Conversion

When converting a document to a skill:

1. **Count the document's distinct topics** — each topic becomes a reference file
2. **Identify the primary workflow** — this goes in SKILL.md body
3. **Apply the decision tree:**
   - 1-2 topics, simple workflow → P1
   - 3-8 topics, clear workflow → P2 (most common)
   - 8+ topics, multiple workflows → P3

## Stacking Rules

When multiple skills apply to the same task:

1. **Load P1 first** — it routes to the right domain
2. **Load P2 second** — it provides the workflow
3. **Load P3 only if needed** — it provides depth

**Never load all skills at once.** Use progressive disclosure.

## Anti-Patterns

| Anti-Pattern | Symptom | Fix |
|-------------|---------|-----|
| P1 with P3 content | SKILL.md > 300 lines with deep reference material | Split: thin SKILL.md + reference files |
| P2 with no references | All content crammed into SKILL.md | Extract topics into references/ |
| P3 with no decision tree | Agent doesn't know which reference to load | Add decision tree to SKILL.md |
| Pattern mismatch | Skill claims P1 but has 12 reference files | Re-evaluate: this is P3 |
