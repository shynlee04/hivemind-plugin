# Findings & Decisions

## Requirements
- Command-line interface for managing tasks
- Add tasks with a description string
- List all tasks with their status (pending/complete)
- Mark tasks as complete by ID
- Delete tasks by ID
- Persist tasks between sessions using a JSON file
- Python 3.10+ implementation

## Research Findings
- Python's `argparse` module supports subcommands for clean CLI design (`python todo.py add "task"`)
- The `json` module handles file persistence with `json.load()` and `json.dump()`
- Standard CLI pattern: `python script.py <command> [args]`
- UUID4 provides collision-free task IDs without a database
- The project uses pytest for testing (found in `pyproject.toml`)

## Technical Decisions
| Decision | Rationale |
|----------|-----------|
| Use JSON for storage | Simple, human-readable, built-in Python support, no external dependencies |
| argparse with subcommands | Clean CLI interface, built-in help generation, standard Python pattern |
| UUID4 for task IDs | Avoids collision, no need for auto-increment or database sequences |
| Single file architecture (`src/main.py`) | Project is small enough; no need for module splitting yet |
| Store tasks in `~/.todo/tasks.json` | Standard location, doesn't clutter the project directory |

## Issues Encountered
| Issue | Resolution |
|-------|------------|
| Empty file causes `JSONDecodeError` | Added explicit empty file check before `json.load()` — if file is empty, return empty list |
| Task IDs not unique with time-based approach | Switched to `uuid4` for guaranteed uniqueness across sessions |
| `argparse` subcommand conflict with "done" keyword | Renamed command to "complete" to avoid potential keyword collision |

## Resources
- Python argparse docs: https://docs.python.org/3/library/argparse.html
- Python json docs: https://docs.python.org/3/library/json.html
- Project structure: `src/main.py`, `tests/test_todo.py`
- Test runner: `pytest` (configured in `pyproject.toml`)

## Visual/Browser Findings
- Screenshot of existing CLI shows the pattern: `app <command> [args]` with colored status indicators
- API documentation shows response format: `{"status": "ok", "data": [...]}` with pagination metadata

---

*Update this file after every 2 view/browser/search operations. Multimodal content must be captured as text immediately.*
