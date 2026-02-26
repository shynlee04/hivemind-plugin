# Dashboard-v2 Phase 8 W0.2 Execution Packet

> **Wave**: W0 (Component Restructuring)
> **Lane**: W0.2 (Panel Extraction)
> **Date**: 2026-02-26
> **Dependencies**: W0.1 ✅ (state.ts created)
> **Mode**: Sequential

---

## 1) Task Definition

**Objective**: Extract 7 panel render functions from `index.tsx` to dedicated `panels/*.tsx` files.

**Current State** (after W0.1):
- `index.tsx` at 862 LOC
- Contains 7 inline panel render functions (~315 LOC total)

**Target State**:
- 7 new panel files in `panels/` directory
- Each panel < 150 LOC
- `index.tsx` imports and uses panel components
- No functional changes

---

## 2) Scope

### Files to CREATE

| File | Source Function | LOC Target |
|------|-----------------|------------|
| `panels/OverviewPanel.tsx` | renderOverviewPanel | ~100 |
| `panels/PipelinePanel.tsx` | renderPipelinePanel | ~80 |
| `panels/HierarchyPanel.tsx` | renderHierarchyPanel | ~60 |
| `panels/IncidentsPanel.tsx` | renderIncidentsPanel | ~50 |
| `panels/CodeIntelPanel.tsx` | renderCodeIntelPanel | ~70 |
| `panels/GovernancePanel.tsx` | renderGovernancePanel | ~80 |
| `panels/SettingsPanel.tsx` | renderSettingsPanel | ~60 |

### Files to MODIFY

| File | Changes | LOC Target |
|------|---------|------------|
| `src/dashboard-v2/src/index.tsx` | Remove panel functions, add imports | 862 → ~550 |

---

## 3) Panel Extraction Pattern

Each panel file follows this structure:

```typescript
// panels/[Name]Panel.tsx
/** @jsxImportSource @opentui/react */
import React from "react";
import { COLORS } from "../constants.js"; // Will need to extract COLORS too
import { t } from "../i18n.js";
import type { DashboardLanguage } from "../i18n.js";

interface [Name]PanelProps {
  // Panel-specific props
}

export function [Name]Panel(props: [Name]PanelProps): JSX.Element {
  // Panel rendering logic
}
```

**Note**: COLORS constant will need to be extracted to `constants.ts` as a prerequisite.

---

## 4) Extraction Order (Dependency-Safe)

1. **Extract COLORS** to `constants.ts` (shared by all panels)
2. **Extract panels** (any order, all independent):
   - OverviewPanel
   - PipelinePanel
   - HierarchyPanel
   - IncidentsPanel
   - CodeIntelPanel
   - GovernancePanel
   - SettingsPanel
3. **Update index.tsx** to import and use panels

---

## 5) COLORS Extraction

**Create `src/dashboard-v2/src/constants.ts`**:
```typescript
// Color scheme - Cyberpunk/Terminal aesthetic
export const COLORS = {
  bg: "#0d0d0d",
  panelBg: "#111111",
  border: "#333333",
  neonGreen: "#00ff41",
  neonAmber: "#ffb000",
  neonBlue: "#00f0ff",
  dimText: "#666666",
  text: "#cccccc",
  error: "#ff4444",
};
```

---

## 6) Panel Specifications

### OverviewPanel.tsx

**Props**:
```typescript
interface OverviewPanelProps {
  snapshot: any;
  serverData: any;
  lastAction: string | null;
  lang: DashboardLanguage;
}
```

**Source** (lines ~144-232 in current index.tsx):
- Session info section
- Server status section
- Last action section
- Stats grid

### PipelinePanel.tsx

**Props**:
```typescript
interface PipelinePanelProps {
  snapshot: any;
  lang: DashboardLanguage;
}
```

**Source** (lines ~234-286):
- Task distribution bar
- Delegation lanes
- Active tasks list

### HierarchyPanel.tsx

**Props**:
```typescript
interface HierarchyPanelProps {
  snapshot: any;
  lang: DashboardLanguage;
}
```

**Source** (lines ~288-318):
- Tree stats
- Tree render

### IncidentsPanel.tsx

**Props**:
```typescript
interface IncidentsPanelProps {
  snapshot: any;
  lang: DashboardLanguage;
}
```

**Source** (lines ~320-347):
- Incident level
- Signals list

### CodeIntelPanel.tsx

**Props**:
```typescript
interface CodeIntelPanelProps {
  snapshot: any;
  lang: DashboardLanguage;
}
```

**Source** (lines ~349-390):
- Source info
- Entity/file/token counts
- Modules list

### GovernancePanel.tsx

**Props**:
```typescript
interface GovernancePanelProps {
  snapshot: any;
  lang: DashboardLanguage;
}
```

**Source** (lines ~392-442):
- Health checks
- Anchors
- Memory shelves

### SettingsPanel.tsx

**Props**:
```typescript
interface SettingsPanelProps {
  snapshot: any;
  lang: DashboardLanguage;
}
```

**Source** (lines ~444-478):
- Sidecar boundaries
- Keyboard controls

---

## 7) Acceptance Criteria

| ID | Criterion | Verification |
|----|-----------|--------------|
| AC1 | `constants.ts` created with COLORS | File exists |
| AC2 | All 7 panel files created | 7 files in panels/ |
| AC3 | Each panel < 150 LOC | `wc -l` per file |
| AC4 | index.tsx imports all panels | Import statements present |
| AC5 | index.tsx uses panel components | JSX uses <OverviewPanel /> etc. |
| AC6 | TypeScript compiles | `bunx tsc --noEmit` = 0 errors |
| AC7 | Tests pass | `npm test` = 0 failures |
| AC8 | No functional regression | Manual: all 7 tabs render |

---

## 8) Validation Gates

```bash
# Gate 1: dashboard-v2 TypeScript
cd /Users/apple/hivemind-plugin/src/dashboard-v2 && bunx tsc --noEmit

# Gate 2: root TypeScript
cd /Users/apple/hivemind-plugin && npx tsc --noEmit

# Gate 3: all tests
cd /Users/apple/hivemind-plugin && npm test

# Gate 4: LOC verification
wc -l /Users/apple/hivemind-plugin/src/dashboard-v2/src/index.tsx
# Target: < 600 LOC

wc -l /Users/apple/hivemind-plugin/src/dashboard-v2/src/panels/*.tsx
# Target: each < 150 LOC

# Gate 5: File count
ls /Users/apple/hivemind-plugin/src/dashboard-v2/src/panels/*.tsx | wc -l
# Target: 7 files
```

---

## 9) Return Format

```json
{
  "outcome": "success" | "partial" | "failure",
  "files_created": ["list"],
  "files_modified": ["list"],
  "loc_counts": {
    "index.tsx": <number>,
    "constants.ts": <number>,
    "panels/OverviewPanel.tsx": <number>,
    "...": "..."
  },
  "command_evidence": "output from validation commands",
  "residual_risks": "any issues"
}
```

---

## 10) Constraints

- **ABSOLUTE BAN:** Do NOT delegate to any subagent. Return results directly to main orchestrator session.
- No functional changes — only code extraction
- Use `.js` extension for ESM imports
- Each panel must be self-contained

---

*Packet prepared for level-2 builder delegation*
