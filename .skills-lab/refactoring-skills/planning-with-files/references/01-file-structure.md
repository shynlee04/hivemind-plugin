# File Structure: Planning Files Schema

Detailed schema for each planning file. These files live in the **project root**, not the skill directory.

---

## task_plan.md — Phase Tracker

### Purpose
The goal-refresh mechanism. This file is the Agent's roadmap. Re-reading it pulls the original goal back into the attention window after context drift.

### Required Sections

```markdown
# Task Plan: [Brief Description]

## Goal
[One sentence describing the end state]

## Current Phase
Phase N

## Phases

### Phase 1: [Title]
- [ ] Specific action item 1
- [ ] Specific action item 2
- [ ] Specific action item 3
- **Status:** in_progress

### Phase 2: [Title]
- [ ] Specific action item 1
- [ ] Specific action item 2
- **Status:** pending

## Key Questions
1. [Question that needs answering]
2. [Question that needs answering]

## Decisions Made
| Decision | Rationale |
|----------|-----------|
| [What was chosen] | [Why it was chosen] |

## Errors Encountered
| Error | Attempt | Resolution |
|-------|---------|------------|
| [Error message or description] | [N] | [How it was resolved] |
```

### Field Specifications

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `# Task Plan:` | H1 title | Yes | Brief description, max 80 chars |
| `## Goal` | H2 + text | Yes | One sentence. The north star. |
| `## Current Phase` | H2 + text | Yes | Format: "Phase N" where N is integer |
| `### Phase N:` | H3 + checklist | Yes | 3-7 phases. Each has checkboxes. |
| `**Status:**` | Bold text | Yes | Values: `pending`, `in_progress`, `complete` |
| `## Key Questions` | H2 + numbered list | Recommended | Questions guiding research/decisions |
| `## Decisions Made` | H2 + table | Recommended | Table with Decision + Rationale columns |
| `## Errors Encountered` | H2 + table | Required | Table with Error + Attempt + Resolution |

### Status Lifecycle

```
pending → in_progress → complete
```

- **pending**: Phase not yet started. Default for all phases except Phase 1.
- **in_progress**: Currently working on this phase. Only ONE phase should be `in_progress` at a time.
- **complete**: Phase finished. All checkboxes checked.

### Phase Count Guidelines

| Task Complexity | Recommended Phases |
|----------------|-------------------|
| Simple (3-5 tool calls) | 3 phases |
| Medium (5-15 tool calls) | 4-5 phases |
| Complex (15-50 tool calls) | 5-7 phases |
| Very complex (50+ tool calls) | 7+ phases, consider sub-plans |

### Example (Populated)

```markdown
# Task Plan: Add Dark Mode Toggle

## Goal
Add a functional dark mode toggle to the settings page that persists user preference.

## Current Phase
Phase 3

## Phases

### Phase 1: Research Existing Theme System
- [x] Locate theme configuration files
- [x] Identify current color variables
- [x] Document existing theme architecture
- **Status:** complete

### Phase 2: Design Implementation Approach
- [x] Choose CSS custom properties approach
- [x] Define dark color palette
- [x] Plan component changes
- **Status:** complete

### Phase 3: Implement Toggle Component
- [x] Create ToggleSwitch component
- [ ] Add theme context provider
- [ ] Wire toggle to theme switching
- **Status:** in_progress

### Phase 4: Persist User Preference
- [ ] Add localStorage integration
- [ ] Handle first-visit default
- **Status:** pending

### Phase 5: Test and Polish
- [ ] Test toggle in all pages
- [ ] Verify persistence across sessions
- [ ] Check accessibility (aria labels)
- **Status:** pending

## Key Questions
1. Should theme preference sync across devices? (No — localStorage only for now)
2. What is the default theme for first-time visitors? (Light mode)

## Decisions Made
| Decision | Rationale |
|----------|-----------|
| CSS custom properties | Already used in project, easy to swap |
| localStorage for persistence | No backend needed, instant apply |
| Toggle in SettingsPage only | Matches existing UI patterns |

## Errors Encountered
| Error | Attempt | Resolution |
|-------|---------|------------|
| ThemeProvider not found in App.tsx | 1 | Located in Layout.tsx instead |
| CSS variable not applying to nav | 2 | Nav uses separate stylesheet, added import |
```

---

## findings.md — Knowledge Store

### Purpose
Stores discoveries, research results, and technical decisions. This is the Agent's external knowledge base — persistent and unlimited.

### Required Sections

```markdown
# Findings: [Task Name]

## Requirements
- [Requirement extracted from user request]
- [Constraint identified during discovery]

## Research Findings
- [Key discovery from web search or code exploration]
- [Technical fact discovered]

## Technical Decisions
| Decision | Rationale |
|----------|-----------|
| [What was chosen] | [Why it was chosen] |

## Issues Encountered
| Issue | Resolution |
|-------|------------|
| [Problem faced] | [How it was solved] |

## Resources
- [URL or file path with brief description]
- [API reference or documentation link]
```

### Field Specifications

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `# Findings:` | H1 title | Yes | Task name for context |
| `## Requirements` | H2 + bullets | Yes | Extracted from user request |
| `## Research Findings` | H2 + bullets | Yes | Key discoveries from exploration |
| `## Technical Decisions` | H2 + table | Recommended | Choices with rationale |
| `## Issues Encountered` | H2 + table | Recommended | Problems and resolutions |
| `## Resources` | H2 + bullets | Recommended | URLs, paths, references |

### The 2-Action Rule

After every 2 view/browser/search operations, IMMEDIATELY update `findings.md`. This prevents visual/multimodal information from being lost when context resets.

### Security Rule

Web/search/browser results go in `findings.md` ONLY. Never write external content to `task_plan.md`. The `task_plan.md` file is auto-read by hooks — untrusted content there amplifies on every tool call.

### Example (Populated)

```markdown
# Findings: Dark Mode Implementation

## Requirements
- Toggle switch on settings page
- Persist user preference between sessions
- Support light and dark themes
- No flash on page load
- Accessible (keyboard navigable, screen reader friendly)

## Research Findings
- Project uses CSS custom properties in src/styles/variables.css
- Theme is currently hardcoded to light values only
- React Context already exists for user preferences (src/context/UserPrefs.tsx)
- localStorage key convention is `appname_<key>` → `hivemind_theme`
- prefers-color-scheme media query can detect OS-level preference
- Flash on load happens when JS runs after CSS — need inline script in <head>

## Technical Decisions
| Decision | Rationale |
|----------|-----------|
| Extend existing UserPrefs context | Avoids creating new context, reuses pattern |
| Inline theme script in index.html | Prevents flash of wrong theme on load |
| CSS custom properties for all colors | Single source of truth, easy to swap |
| Default to light mode | Matches current behavior, least surprise |

## Issues Encountered
| Issue | Resolution |
|-------|------------|
| Dark colors looked washed out on existing components | Increased contrast ratios, tested with WCAG checker |
| Toggle not keyboard accessible | Added tabIndex, onKeyDown handler, aria-role |

## Resources
- CSS custom properties guide: https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties
- prefers-color-scheme: https://web.dev/prefers-color-scheme/
- WCAG contrast checker: https://webaim.org/resources/contrastchecker/
- Project theme file: src/styles/variables.css
- User preferences context: src/context/UserPrefs.tsx
```

---

## progress.md — Session Log

### Purpose
Chronological record of what the Agent did, when, and what happened. Answers "What have I done?" in the 5-Question Reboot Test.

### Required Sections

```markdown
# Progress Log

## Session: YYYY-MM-DD

### Phase N: [Title]
- **Status:** in_progress
- **Started:** HH:MM
- Actions taken:
  - [Specific action performed]
  - [Specific action performed]
- Files created/modified:
  - [path/to/file] (created)
  - [path/to/file] (modified)

## Test Results
| Test | Input | Expected | Actual | Status |
|------|-------|----------|--------|--------|
| [Test name] | [What was run] | [Expected outcome] | [Actual outcome] | [✓/✗] |

## Error Log
| Timestamp | Error | Attempt | Resolution |
|-----------|-------|---------|------------|
| HH:MM | [Error description] | [N] | [How resolved] |
```

### Field Specifications

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `## Session:` | H2 + date | Yes | Format: YYYY-MM-DD |
| `### Phase N:` | H3 + details | Yes | One entry per phase worked on |
| `**Status:**` | Bold text | Yes | Matches task_plan.md status |
| `**Started:**` | Bold text | Recommended | Timestamp when phase started |
| Actions taken | Bulleted list | Yes | Specific actions, not vague summaries |
| Files created/modified | Bulleted list | Yes | Path + (created) or (modified) |
| `## Test Results` | H2 + table | Recommended | All tests run during session |
| `## Error Log` | H2 + table | Required | Every error, timestamped |

### Example (Populated)

```markdown
# Progress Log

## Session: 2026-04-03

### Phase 1: Research Existing Theme System
- **Status:** complete
- **Started:** 09:00
- Actions taken:
  - Searched codebase for theme-related files using grep
  - Read src/styles/variables.css — found 47 CSS custom properties
  - Read src/context/UserPrefs.tsx — existing context handles language, not theme
  - Checked index.html — no inline theme script present
- Files created/modified:
  - findings.md (created)
  - task_plan.md (created)

### Phase 2: Design Implementation Approach
- **Status:** complete
- **Started:** 09:30
- Actions taken:
  - Defined dark color palette based on existing light colors
  - Designed toggle component API: <ThemeToggle onChange={(theme) => ...} />
  - Planned inline script for index.html to prevent flash
- Files created/modified:
  - findings.md (updated with technical decisions)
  - task_plan.md (updated — marked Phase 2 complete)

### Phase 3: Implement Toggle Component
- **Status:** in_progress
- **Started:** 10:00
- Actions taken:
  - Created src/components/ToggleSwitch.tsx with basic toggle UI
  - Added dark theme CSS variables to variables.css
  - Located ThemeProvider in Layout.tsx (not App.tsx as initially assumed)
- Files created/modified:
  - src/components/ToggleSwitch.tsx (created)
  - src/styles/variables.css (modified — added dark theme variables)
  - task_plan.md (updated — Phase 3 in_progress)

## Test Results
| Test | Input | Expected | Actual | Status |
|------|-------|----------|--------|--------|
| Toggle renders | Mount ToggleSwitch | Switch element visible | Switch renders correctly | ✓ |
| Dark variables apply | Inspect computed styles | Background is dark | Background #1a1a2e applied | ✓ |
| ThemeProvider location | Search for provider | Found in Layout.tsx | Confirmed in Layout.tsx | ✓ |

## Error Log
| Timestamp | Error | Attempt | Resolution |
|-----------|-------|---------|------------|
| 09:15 | ThemeProvider not found in App.tsx | 1 | Searched entire src/ — found in Layout.tsx |
| 10:20 | CSS variable not applying to navbar | 2 | Navbar uses separate stylesheet, added @import |
```
