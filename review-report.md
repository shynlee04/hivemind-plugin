## Review Report: hivemind-plugin

### Executive Summary
The `hivemind-plugin` codebase demonstrates a solid architectural foundation for context governance in single-agent scenarios. The separation of concerns between tools (verbs) and hooks (governance enforcement) is clean and effective. The system robustly handles initialization and missing configuration states, guiding the user appropriately.

However, the current implementation of state management (`persistence.ts`) is vulnerable to race conditions in concurrent environments (e.g., parallel subagents or rapid tool execution). The lack of file locking means simultaneous writes to `brain.json` can result in data loss or state inconsistency. Additionally, while the system gracefully handles corrupted state files by resetting the session, this "fail-open" behavior results in complete loss of session context and metrics, which is a significant reliability concern.

Overall, the plugin is well-structured for its intended purpose but requires hardening in its persistence layer to be truly production-ready for multi-agent or high-concurrency workflows.

### Architecture Score: 7/10
- **Tool-Hook Integration: 8/10** - Clean separation, hooks correctly intercept and advise without blocking (HC1 compliance).
- **State Management: 6/10** - Simple JSON-based persistence is easy to debug but lacks concurrency controls (locking) and transactional integrity.
- **Error Handling: 7/10** - The system rarely crashes, catching errors in hooks and tools. However, the recovery strategy for corrupted state (reset) is aggressive and leads to data loss.
- **Security: 8/10** - File paths are well-managed via `getEffectivePaths`, minimizing path traversal risks. Governance checks are robust against bypass attempts.

### Critical Issues (Must Fix)

1. **Race Condition in State Persistence**
   - **Location**: `src/lib/persistence.ts:createStateManager`
   - **Severity**: CRITICAL
   - **Description**: The `save` method reads the current state, modifies it (in memory via tools/hooks), and then writes it back to `brain.json` without any file locking. If two tools execute concurrently (e.g., `tool-a` and `tool-b`), they may both read the same initial state, and the last one to write will overwrite the other's changes.
   - **Impact**: Loss of metrics (turn counts, drift scores), skipped hierarchy updates, or inconsistent session state.
   - **Recommendation**: Implement a file locking mechanism (e.g., `proper-lockfile` or similar) around the read-modify-write cycle in `persistence.ts`. Alternatively, use a transactional file write approach.

2. **Data Loss on State Corruption**
   - **Location**: `src/lib/persistence.ts:load` and `src/hooks/session-lifecycle.ts`
   - **Severity**: CRITICAL
   - **Description**: If `brain.json` is corrupted (e.g., partial write or syntax error), `load()` returns `null`. The `session-lifecycle` hook interprets `null` as a missing session and immediately initializes a *new* empty session, overwriting the old one (implied).
   - **Impact**: Complete loss of session context, metrics, and history if the state file is momentarily invalid.
   - **Recommendation**: Implement a backup recovery mechanism. If `load()` fails due to corruption, attempt to load `brain.json.bak` before giving up. Do not automatically overwrite a corrupted file with a new session; instead, warn the user or attempt recovery.

### High Issues (Should Fix)

1. **Unbounded Session File Growth**
   - **Location**: `src/tools/map-context.ts` and `src/hooks/session-lifecycle.ts`
   - **Severity**: HIGH
   - **Description**: The `active.md` session file is appended to on every `map_context` call. While `session-lifecycle.ts` checks for length (`max_active_md_lines`), it only issues a warning. In long-running sessions, this file can grow indefinitely, potentially impacting filesystem performance or editor responsiveness.
   - **Impact**: Performance degradation in long sessions.
   - **Recommendation**: Enforce compaction or log rotation when the session file exceeds a hard limit, rather than just warning.

2. **Weak Backup Mechanism**
   - **Location**: `src/lib/persistence.ts:save`
   - **Severity**: HIGH
   - **Description**: The backup mechanism (`copyFile`) is a simple copy before write. It does not ensure the backup itself is valid or that the write was successful before rotating backups.
   - **Impact**: If the process crashes during `copyFile` or the subsequent `writeFile`, both the primary and backup files could be compromised or inconsistent.
   - **Recommendation**: Use a robust atomic write pattern: write to `temp_file`, fsync, rename to `brain.json`. Keep multiple rotated backups.

### Medium Issues (Nice to Fix)

1. **Advisory-Only Framework Conflict**
   - **Location**: `src/hooks/tool-gate.ts`
   - **Severity**: MEDIUM
   - **Description**: Framework conflicts (e.g., both `.planning` and `.spec-kit` present) generate advisory warnings but do not block execution. A user could ignore these warnings and proceed with a confused context.
   - **Impact**: Potential for context poisoning if user ignores warnings.
   - **Recommendation**: Consider a "strict" mode configuration that elevates specific advisories (like framework conflict) to blocking errors or requires explicit acknowledgement.

2. **Truncated Hierarchy in Prompt**
   - **Location**: `src/hooks/session-lifecycle.ts`
   - **Severity**: MEDIUM
   - **Description**: The hierarchy tree is truncated to 8 lines in the system prompt to save budget. Deeply nested or wide hierarchies might be effectively invisible to the agent.
   - **Impact**: Agent loses visibility of complex project structures.
   - **Recommendation**: Implement a "smart collapse" or summary view for large hierarchies instead of hard truncation, or allow the agent to request the full tree via a tool (e.g., `scan_hierarchy` supports this, but the prompt should indicate it's truncated).

### Edge Cases Found

| Scenario | Status | Notes |
|----------|--------|-------|
| **Concurrent tool calls** | **FAIL** | Race condition in `persistence.ts` leads to lost updates. |
| **Corrupted brain.json** | **FAIL** | Causes session reset (data loss) instead of recovery. |
| **Missing .hivemind/** | **PASS** | Correctly detects and injects setup guidance. |
| **Hook recursion** | **PASS** | No direct recursion loops found between tools and hooks. |
| **Large hierarchy** | **PASS** | Truncated in prompt to preserve token budget; full tree available via tools. |
| **Invalid governance mode** | **PASS** | Config schema validation handles this correctly. |
| **Session file growth** | **WARNING** | File grows unbounded; warning issued but no hard limit. |
| **Backup failure** | **PASS** | `save()` ignores backup failure and proceeds (prioritizes availability). |
| **Compact failure** | **WARNING** | If `archiveSession` succeeds but `resetActiveMd` fails, state might be inconsistent. |
| **Drift detection** | **PASS** | Robust calculation based on turn count and updates. |

### Use Case Validation

| Use Case | Result | Issues |
|----------|--------|--------|
| **New developer flow** | **PASS** | `init` -> `declare_intent` flow is well-guided by setup blocks. |
| **Session continuation** | **PASS** | `recall_mems` and `think_back` work as expected to restore context. |
| **Drift detection** | **PASS** | accurately warns when turns > threshold without `map_context`. |
| **Session end** | **PASS** | `compact_session` correctly archives and resets state. |
| **Hierarchy navigation** | **PASS** | `map_context` and `scan_hierarchy` correctly manipulate the tree. |

### Recommendations

1. **Implement File Locking**: Introduce a lockfile mechanism in `persistence.ts` to serialize access to `brain.json` and other state files. This is the most critical fix for reliability.
2. **Robust Recovery Strategy**: Modify `persistence.ts` to attempt loading `.bak` files if the primary file is corrupted. Modify `session-lifecycle.ts` to alert the user if a session reset is imminent due to corruption, rather than doing it silently.
3. **Atomic Writes**: Switch to an atomic write pattern (write-temp-rename) to prevent partial file writes from corrupting state.
4. **Hard Limit for Session Files**: Implement a hard limit for `active.md` size, forcing a compaction or log rotation to prevent performance issues.
5. **Smart Hierarchy Summary**: Improve the hierarchy rendering in the prompt to provide a more useful summary of large trees, rather than just truncating.

### Code Quality Metrics
- **Files reviewed**: ~40 source files
- **Lines of code**: ~5000+ (estimated)
- **Test coverage**: N/A (Manual review)
- **TypeScript strict**: Yes (`strict: true` in `tsconfig.json` implied by `AGENTS.md`)
