---
slug: specs-requirements-fail-debug
status: investigating
trigger: |
  không một requirements trong specs đạt được fail toàn tập phân tích kết quả thực đi để biết mình tệ hại thế nào
  
  Test failures:
  1. writes child .json immediately when SDK reports parentID (D-06) - mockCreateChildFile không được gọi
  2. updates hierarchy-manifest.json when child .json is written (D-07) - expect(mockCreateChildFile).toHaveBeenCalled() fail
  3. should include pre-compaction state reference - expected '## COMPACTED' to contain 'Pre-compaction state preserved'
  4. preserves full session.compacted payload in main session markdown - expected to contain 'manual-test'

  Specs requirements:
  - REQ-23.2-01: extractTextContent() handles all OpenCode part types
  - REQ-23.2-02: Compaction writes human-readable summary, not raw event JSON
  - REQ-23.2-03: Tool attribution preserved across race condition for delegate-task
  - REQ-23.2-04: Hierarchy manifest populated for all delegation paths
  - REQ-23.2-05: Dual-key subagentType extraction

  Files modified:
  - src/features/session-tracker/persistence/pending-dispatch-registry.ts
  - src/features/session-tracker/capture/event-capture.ts
  - src/features/session-tracker/capture/message-capture.ts
---

# Debug Session: Specs Requirements Fail

## Current Focus

### hypothesis
Không rõ tại sao test failures vẫn xảy ra sau khi apply fixes

### next_action
Phân tích test failures thực tế để biết chính xác code đang fail ở đâu

### evidence
- 4 test failures in session-tracker
- Clean build (typecheck passed)
- 450/454 tests pass

### reasoning_checkpoint
Cần xem test setup và code implementation để tìm mismatch
