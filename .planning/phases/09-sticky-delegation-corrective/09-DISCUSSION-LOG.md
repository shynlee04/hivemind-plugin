# Phase 09: Sticky Delegation Corrective - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions captured in CONTEXT.md — this log preserves the analysis.

**Date:** 2026-04-10
**Phase:** 09-Sticky Delegation Corrective
**Mode:** discuss
**Areas discussed:** Message-count stability gate, Poll interval reduction, Parent notification replay on resume, Sync mode output handling, Parameter rename, User dispatch mode config, Tmux full integration

---

## Areas Presented

### Message-count stability gate
| Assumption | Confidence | Evidence |
|------------|-----------|----------|
| Integrate CompletionDetector into observeBackgroundCompletion() | Confident | completion-detector.ts has feedMessageCount() + stability timer; observeBackgroundCompletion has no message-count awareness | 
| Track both messages AND tool calls as stability signal | Confident | Tool calls are separate from messages in session API; both needed as evidence of actual work |

### Poll interval reduction
| Assumption | Confidence | Evidence |
|------------|-----------|----------|
| Reduce from 15s to 3s | Confident | lifecycle-background-observer.ts:31 DEFAULT_POLL_INTERVAL_MS = 15000; oh-my-openagent uses ~3000ms |

### Parent notification replay on resume
| Assumption | Confidence | Evidence |
|------------|-----------|----------|
| Wire formatPendingNotificationsForSession into handleEvent | Confident | create-core-hooks.ts has handleEvent; pending-notifications.ts:67 formatPendingNotificationsForSession exists but never called on resume |

### Sync mode output handling
| Assumption | Confidence | Evidence |
|------------|-----------|----------|
| Keep sync mode for dependent tasks | Confident | User clarification: foreground is for dependent tasks needing control; background is for independent tasks |
| Fix with structured JSON envelope (base64) | Confident | Root cause: large text response crashes JSON parser; envelope guarantees valid JSON |

### Parameter rename
| Assumption | Confidence | Evidence |
|------------|-----------|----------|
| Rename run_in_background → async_dispatch | Confident | delegate-task.ts:231 run_in_background parameter; collision with background tool (OS processes) |

### User dispatch mode config
| Assumption | Confidence | Evidence |
|------------|-----------|----------|
| Add runtime config fields to delegate-task schema | Confident | User request for configurable dispatch mode |

### Tmux full integration
| Assumption | Confidence | Evidence |
|------------|-----------|----------|
| Full TmuxSessionManager integration | Confident | oh-my-openagent has pane = completion signal; detectTmuxAvailability() exists in codebase |

---

## Corrections Made

No corrections — all assumptions confirmed by user.

---

## External Research

None — all decisions grounded in existing codebase analysis.

