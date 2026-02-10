[PRD]

# PRD: HiveMind Context Governance - Production Ready Release

## Overview
Prepare the HiveMind Context Governance plugin for public npm publication and real-world use. Address critical gaps in publishing configuration, add missing self-monitoring tools (self-rating, sentiment detection, complexity nudges), and set up CI/CD for automated testing.

## Goals
- Make package publishable to npm with proper metadata
- Add self-rating tool for agent accountability (auto + manual modes)
- Add sentiment detection that triggers context refresh workflow
- Add complexity threshold warnings (files + turns)
- Set up GitHub Actions CI for automated testing
- Ensure all quality gates pass

## Quality Gates

These commands must pass for every user story:
- `npm run typecheck` - TypeScript type checking
- `npm test` - Test suite execution
- `npm run build` - Build verification (produces dist/)

## User Stories

### US-001: Add NPM Publishing Configuration
**Description:** As a developer, I want the package.json configured correctly so I can publish to npm.

**Acceptance Criteria:**
- [ ] Add `files` array to package.json (include: dist/, README.md, LICENSE)
- [ ] Add `repository` field with GitHub URL
- [ ] Add `publishConfig.access: "public"`
- [ ] Add `engines` field (node >= 18)
- [ ] Add `.npmignore` file
- [ ] Verify `npm pack --dry-run` shows correct files

### US-002: Add LICENSE File
**Description:** As a user, I want a proper LICENSE file so I know the terms of use.

**Acceptance Criteria:**
- [ ] Create LICENSE file with MIT license
- [ ] Include copyright year and author
- [ ] Match license mentioned in package.json

### US-003: Add CHANGELOG.md
**Description:** As a user, I want a changelog so I can track version changes.

**Acceptance Criteria:**
- [ ] Create CHANGELOG.md following Keep a Changelog format
- [ ] Include 1.0.0 release notes
- [ ] Document breaking changes, features, fixes sections

### US-004: Create self_rate Tool
**Description:** As an AI agent, I want to rate my performance so drift can be detected.

**Acceptance Criteria:**
- [ ] Create `src/tools/self-rate.ts` tool file
- [ ] Accept parameters: score (1-10), reason (optional), turn_context (optional)
- [ ] Store ratings in brain.state.ratings array
- [ ] Log rating to TUI: `[SelfRate] Turn {N}: {score}/10`
- [ ] Export from `src/tools/index.ts`
- [ ] Add test file `tests/self-rate.test.ts` with minimum 10 assertions

### US-005: Create Auto-Rating on Tool Completion
**Description:** As a system, I want to auto-track metrics so agents have context for self-assessment.

**Acceptance Criteria:**
- [ ] Track success/failure of each tool call in brain.state
- [ ] Calculate simple health score (success rate * 10)
- [ ] Store in brain.state.metrics.auto_health_score
- [ ] Display in TUI status line
- [ ] Update test coverage

### US-006: Create Sentiment Detection Module
**Description:** As a system, I want to detect negative signals so context refresh can be triggered.

**Acceptance Criteria:**
- [ ] Create `src/lib/sentiment.ts` module
- [ ] Detect negative keywords: "stop", "wrong", "no", "bad", "incorrect", "confused"
- [ ] Detect agent failure phrases: "I apologize", "you are right", "I was wrong"
- [ ] Detect cancellation patterns: "cancel", "abort", "start over"
- [ ] Store signals in brain.state.sentiment_signals array
- [ ] Export detection function for use in hooks

### US-007: Create Context Refresh Trigger
**Description:** As a system, I want to trigger context refresh when sentiment is negative.

**Acceptance Criteria:**
- [ ] Create `src/lib/context-refresh.ts` module
- [ ] Define threshold: 2 negative signals within 5 turns triggers refresh
- [ ] Log to TUI: `[ContextRefresh] Drift detected. Consider compact_session.`
- [ ] Update active.md with drift warning flag
- [ ] Export trigger function

### US-008: Integrate Sentiment Detection into Hooks
**Description:** As a system, I want sentiment detection running on every interaction.

**Acceptance Criteria:**
- [ ] Import sentiment detection in `src/hooks/tool-gate.ts`
- [ ] Run detection on tool.execute.before hook
- [ ] Run detection on chat.system.transform hook (user message content)
- [ ] Store detected signals in brain state
- [ ] Trigger context refresh when threshold reached
- [ ] Update tests

### US-009: Create Complexity Detection Module
**Description:** As a system, I want to detect when sessions get complex.

**Acceptance Criteria:**
- [ ] Create `src/lib/complexity.ts` module
- [ ] Track files touched count (unique file paths from write_file/edit_file)
- [ ] Track turn count (total tool calls since last declare_intent)
- [ ] Configurable thresholds (default: 3 files OR 5 turns)
- [ ] Export complexity check function

### US-010: Add Complexity Nudges
**Description:** As an AI agent, I want gentle nudges when complexity grows.

**Acceptance Criteria:**
- [ ] Check complexity after each tool execution
- [ ] Log to TUI once per session: `[Nudge] Complexity rising ({files} files, {turns} turns). Consider declare_intent.`
- [ ] Only show nudge once (deduplicate)
- [ ] Reset nudge flag on declare_intent
- [ ] Update tests

### US-011: Set Up GitHub Actions CI
**Description:** As a maintainer, I want automated testing on GitHub.

**Acceptance Criteria:**
- [ ] Create `.github/workflows/ci.yml`
- [ ] Run on push to main and PRs
- [ ] Test on Node 18, 20
- [ ] Steps: checkout, setup-node, install, typecheck, test, build
- [ ] Verify workflow passes

### US-012: Update README with New Features
**Description:** As a user, I want documentation for the new tools.

**Acceptance Criteria:**
- [ ] Add self_rate tool documentation
- [ ] Add complexity nudges explanation
- [ ] Add sentiment detection section
- [ ] Update test coverage numbers
- [ ] Add "What's New" section for v1.1.0

## Functional Requirements

- FR-1: Package must be publishable to npm with `npm publish`
- FR-2: self_rate tool must store ratings with timestamp and turn number
- FR-3: Auto-rating must calculate health score from tool success rates
- FR-4: Sentiment detection must monitor both user messages and tool outputs
- FR-5: Context refresh must trigger after 2 negative signals within 5 turns
- FR-6: Complexity nudges must appear once per session when thresholds exceeded
- FR-7: All new code must follow existing patterns (TUI-safe logging, no console.log)
- FR-8: All new code must have accompanying tests

## Non-Goals

- NO automatic compaction (agent must still call compact_session)
- NO external API calls for sentiment analysis (local keyword detection only)
- NO breaking changes to existing tools
- NO changes to existing hook signatures
- NO browser-based dashboard (TUI only)

## Technical Considerations

### File Structure
```
src/
├── tools/
│   ├── self-rate.ts          # NEW
│   └── index.ts              # UPDATE (export self-rate)
├── lib/
│   ├── sentiment.ts          # NEW
│   ├── context-refresh.ts    # NEW
│   └── complexity.ts         # NEW
├── hooks/
│   └── tool-gate.ts          # UPDATE (integrate sentiment)
```

### State Schema Updates
```typescript
interface BrainState {
  // ... existing fields
  ratings: {
    score: number;
    turn: number;
    timestamp: number;
    reason?: string;
    auto: boolean;  // true if auto-generated
  }[];
  sentiment_signals: {
    type: "negative" | "cancel" | "confusion";
    snippet: string;
    turn: number;
    timestamp: number;
  }[];
  metrics: {
    // ... existing fields
    auto_health_score: number;
    files_touched: string[];
    turns_since_intent: number;
  };
}
```

## Success Metrics

- `npm publish --dry-run` succeeds without warnings
- All 76 existing tests pass
- New tests: 40+ assertions for new features
- TypeScript compiles with zero errors
- GitHub Actions CI passes
- Package installs correctly via `npm install`

## Open Questions

- Should context refresh spawn an actual sub-agent or just log suggestions?
- Should complexity thresholds be configurable per governance mode?
- Should we add a `refresh_context` tool for manual triggering?

[/PRD]
