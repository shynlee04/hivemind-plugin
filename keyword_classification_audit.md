# Keyword-Based Classification Audit

## Verdict: You are correct.

Hard-coded keyword arrays with regex/[includes()](file:///Users/apple/hivemind-plugin/src/shared/opencode-knowledge.ts#41-45) matching is a **brittle, non-optimal** approach for intent classification in an AI-orchestration plugin. It suffers from:

| Problem | Impact |
|---------|--------|
| **No semantic understanding** | "help me architect a fix for this bug" → matches both `quick-action` ("fix", "bug") AND `project-driven` ("architect") — wrong classification via hit-counting |
| **Inflexible vocabulary** | Users saying "set up", "spin up", "scaffold", "configure" won't match `project-driven` despite clear project intent |
| **Fragile priority resolution** | Tie-breaking via array order or count is arbitrary — "quickly build a feature" has 2 quick-action hits vs 2 project-driven hits |
| **Maintenance cost** | Every new synonym requires manual curation across multiple files |
| **No negation/context handling** | "don't fix this, just research it" still scores `quick-action` because "fix" matches |

---

## Audit Findings — 5 Files With This Anti-Pattern

### 1. 🔴 HIGH — [intent-classifier.ts](file:///Users/apple/hivemind-plugin/src/features/agent-work-contract/engine/intent-classifier.ts)

**What it does**: Classifies user intent into `quick-action` | `research-brainstorm` | `project-driven`.

**Pattern**: 3 static keyword arrays (40+ keywords), regex `\b` word-boundary matching, confidence = `matchCount / 3`.

**Why it's wrong**: This is the *primary intent router* for the agent-work-contract engine. Misclassification here cascades to `requiresPlan`, `requiresGovernance`, and the entire `suggestedResponseMode`. A single wrong classification gates or ungates an entire planning workflow.

---

### 2. 🔴 HIGH — [purpose-classifier.ts](file:///Users/apple/hivemind-plugin/src/features/session-entry/purpose-classifier.ts)

**What it does**: Classifies session purpose into 8 classes (`discovery`, `brainstorming`, `research`, `planning`, `implementation`, `gatekeeping`, `tdd`, `course-correction`).

**Pattern**: Near-identical to #1 — 8 keyword arrays, same [escapeKeyword](file:///Users/apple/hivemind-plugin/src/features/agent-work-contract/engine/intent-classifier.ts#73-80) + [matchesKeyword](file:///Users/apple/hivemind-plugin/src/features/session-entry/purpose-classifier.ts#38-42) helpers (duplicated code), confidence = `matchCount / 3`.

**Why it's wrong**: Same semantic blindness issues. Also has **code duplication** — [escapeKeyword()](file:///Users/apple/hivemind-plugin/src/features/agent-work-contract/engine/intent-classifier.ts#73-80) and [matchesKeyword()](file:///Users/apple/hivemind-plugin/src/features/session-entry/purpose-classifier.ts#38-42) are copy-pasted from [intent-classifier.ts](file:///Users/apple/hivemind-plugin/src/features/agent-work-contract/engine/intent-classifier.ts).

---

### 3. 🟡 MEDIUM — [lineage-router.ts](file:///Users/apple/hivemind-plugin/src/features/session-entry/lineage-router.ts)

**What it does**: Routes to `hivefiver` lineage if the message contains framework-related keywords.

**Pattern**: 10-keyword array with `.includes()` substring matching (even weaker than regex — no word boundaries).

**Why it's wrong**: `"refactor"` alone triggers `hivefiver` lineage even for product code refactoring. `"context"` matches any message about React context, or any sentence containing "in this context". Substring matching is the weakest form.

---

### 4. 🟡 MEDIUM — [control-plane-registry.ts](file:///Users/apple/hivemind-plugin/src/control-plane/control-plane-registry.ts#L18-L37)

**What it does**: Detects explicit user requests for control-plane commands (`hm-init`, `hm-doctor`, `hm-harness`, `hm-settings`).

**Pattern**: Keyword arrays per command with `.includes()` substring matching.

**Nuance**: This one is *partially justified* — matching literal slash commands like `/hm-init` is deterministic and correct. But the *natural language* keywords like `"update settings"`, `"automation level"`, `"expertise level"` are fuzzy intent signals disguised as exact matches.

---

### 5. 🟢 LOW — [opencode-knowledge.ts](file:///Users/apple/hivemind-plugin/src/shared/opencode-knowledge.ts#L24-L43)

**What it does**: Detects whether a message contains shell-related intent.

**Pattern**: 14-keyword array (`npm`, `bun`, `git`, `shell`, etc.) with `.includes()`.

**Nuance**: This is closer to *tool detection* than *intent classification*. The keywords are specific enough that false positives are rare. However, `"command"` and `"script"` are overly broad.

---

## Recommended Fix Direction

> [!IMPORTANT]
> This is NOT a "replace everything with an LLM call" recommendation. This project is a plugin that runs *inside* an AI coding agent — the LLM is already the consumer of these classifications. The fix should use **scoring heuristics that are smarter than keyword counting**, while remaining deterministic and testable.

### Tier 1: Immediate Fixes (No Architecture Change)

| Fix | Files | Effort |
|-----|-------|--------|
| **Extract shared matching utilities** | [intent-classifier.ts](file:///Users/apple/hivemind-plugin/src/features/agent-work-contract/engine/intent-classifier.ts), [purpose-classifier.ts](file:///Users/apple/hivemind-plugin/src/features/session-entry/purpose-classifier.ts) | Low — DRY the duplicated [escapeKeyword](file:///Users/apple/hivemind-plugin/src/features/agent-work-contract/engine/intent-classifier.ts#73-80)/[matchesKeyword](file:///Users/apple/hivemind-plugin/src/features/session-entry/purpose-classifier.ts#38-42) into `shared/` |
| **Add word boundaries to [lineage-router.ts](file:///Users/apple/hivemind-plugin/src/features/session-entry/lineage-router.ts)** | [lineage-router.ts](file:///Users/apple/hivemind-plugin/src/features/session-entry/lineage-router.ts) | Low — switch from `.includes()` to regex `\b` matching |
| **Remove overly broad keywords** | All 5 files | Low — remove `"command"`, `"script"`, `"refactor"` from `lineage-router`, `"context"` from lineage |

### Tier 2: Scoring Architecture Upgrade

Replace the count-based scoring with **weighted keyword scoring + structural heuristics**:

```typescript
interface KeywordRule {
  keyword: string
  weight: number           // 0.1 to 1.0 — how strongly this signals the class
  requiresContext?: string  // only match if this co-occurs
  excludesContext?: string  // don't match if this co-occurs
}
```

This allows:
- `"fix"` → weight 0.8 for `quick-action`, but weight 0.2 if `"architect"` co-occurs
- `"build"` → weight 0.9 for `project-driven`, but only if NOT preceded by `"just"`
- Negation handling: `"don't fix"` → exclude `quick-action` match

### Tier 3: Structural Signal Integration

Add non-keyword signals to the classifier:

| Signal | Purpose |
|--------|---------|
| **Message length** | Short messages (< 20 words) bias toward `quick-action` |
| **Question marks** | Bias toward `research-brainstorm` |
| **File references** | Bias toward `quick-action` (targeted edits) |
| **Attachment count** | Bias toward `research` |
| **Verb position** | Imperative verbs at start → execution intent |

### Tier 4: Prompt-Based Classification (Future)

If the plugin ever gets a lightweight LLM call path, the classifiers should be replaced with structured prompt + schema extraction. But this is a *future* consideration given the current SDK surface.

---

## Summary Table

| File | Severity | Pattern | Fix Direction |
|------|----------|---------|--------------|
| [intent-classifier.ts](file:///Users/apple/hivemind-plugin/src/features/agent-work-contract/engine/intent-classifier.ts) | 🔴 HIGH | Keyword count + regex | Tier 2: weighted scoring |
| [purpose-classifier.ts](file:///Users/apple/hivemind-plugin/src/features/session-entry/purpose-classifier.ts) | 🔴 HIGH | Keyword count + regex (duplicated) | Tier 1+2: DRY + weighted scoring |
| [lineage-router.ts](file:///Users/apple/hivemind-plugin/src/features/session-entry/lineage-router.ts) | 🟡 MED | `.includes()` substring | Tier 1: word boundaries + trim keywords |
| [control-plane-registry.ts](file:///Users/apple/hivemind-plugin/src/control-plane/control-plane-registry.ts) | 🟡 MED | `.includes()` substring | Tier 1: separate literal commands from NL signals |
| [opencode-knowledge.ts](file:///Users/apple/hivemind-plugin/src/shared/opencode-knowledge.ts) | 🟢 LOW | `.includes()` substring | Tier 1: trim overly broad keywords |
