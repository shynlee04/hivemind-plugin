**Session Journaling Structure**

Create a main folder named `sessions`. Each session is identified by a unique id `ses_xxxx` (4–5 digits).  
In the sub‑folder `journey-events` store a single Markdown file `ses_xxxx-DATE-CREATED-ISO.md`.  
The file must contain:

- A concise, hierarchical TOC.  
- Metadata: actors (agents, sub‑agents, main), tools used, evidences, context, and grep‑able links to artifacts, documents, handoffs, verifications, and summaries.  
- Every update is appended with a timestamp.  
- For each agentic flow, record a batch of tools used and the CRUD operations on files.  
- Record the user’s new prompt.  
- Record each assistant turn as the output of the last executed tool.  
- For sub‑agents, export only the assistant’s summary. The summary must include structured sections for artifacts, evidences, and be appended inline with actor, workflow, planning alignment, and the session id.  
- Store a JSON representation of the hierarchy next to the Markdown for easy tracking.

Create a parallel sub‑folder `error-logs` containing a `.log` file for any error events.

**Event Subscription Schema**

```markdown
# Command Events
command.executed -> brief actor + result

# File Events
file.edited
file.watcher.updated
  → include a one‑liner path to the artifact or document.

# LSP Events
lsp.client.diagnostics
lsp.updated
  → use for testing and execution interfaces.

# Message Events
message.part.removed
message.part.updated
message.removed
message.updated
  → capture in XML output for richer context.

# Session Events
session.created -> create new entry
session.compacted -> append output and inject purified context; run sub‑commands to parse long‑haul sessions incrementally.
session.deleted -> delete session journal
session.diff -> revert and undo parts
session.error -> log to error log with the same session id
session.idle -> mark passive; resume activates
session.status, session.updated -> research further

# Todo Events
todo.updated -> parse into orchestration JSON to improve continuity and task management.

# Shell Events
shell.env -> research further

# Tool Events
tool.execute.before
tool.execute.after
  → trigger skills before execution; extract readable insights after execution.

# TUI Events
tui.prompt.append
tui.command.execute
tui.toast.show
  → research further
```

**Refactor Practices for Clean Code**

Organize the codebase into logical SDK modules: `features`, `tools`, `hooks`, `runtime-entry`, `runtime-observability`, `session-entry`, `trajectory`, and `workflow`.  
Each module should expose clear interfaces, use type‑safe contracts, and keep responsibilities focused.  
Implement a consistent naming convention, modular test suites, and documentation in `AGENTS.md` files.  
Ensure the `plugin` directory contains adapters for external integrations and the `internal` directory holds session writers.  
Maintain a `schema-kernel` for record definitions and a `shared` directory for common utilities.  
Use versioned JSON schemas for session hierarchy and evidence records.  
All changes should be traceable via the `session-events` logs and reflected in the `journey-events` Markdown.

**Project Tree Snapshot**

```text
src/
├─ archive/
│  └─ schema-kernel/
├─ cli/
├─ commands/
├─ context/
├─ control-plane/
├─ core/
├─ delegation/
├─ features/
├─ governance/
├─ hooks/
├─ intelligence/
├─ internal/
├─ plugin/
├─ recovery/
├─ schema-kernel/
├─ sdk-supervisor/
├─ shared/
└─ tools/