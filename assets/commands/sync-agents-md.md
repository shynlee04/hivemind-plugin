---
description: "Sync AGENTS.md files with current codebase state. Detects drift between documentation and actual source code, produces a report, and applies fixes."
agent: hm-l2-conductor
subtask: false
---

Sync AGENTS.md files to match the current codebase:

1. Load the `hf-agents-md-sync` skill
2. Follow its scan → diff → apply workflow exactly:
   - **Phase 1 (Scan):** Gather ground truth from source files and .opencode/ directories
   - **Phase 2 (Diff):** Compare claims against reality, produce a structured drift report
   - **Phase 3 (Apply):** Apply targeted edits using the Edit tool for each drift item
3. Report all drift items found and all fixes applied
4. Note any items requiring manual intervention (text not found, missing sections)
5. Summarize: total items, auto-fixed, manual-needed
