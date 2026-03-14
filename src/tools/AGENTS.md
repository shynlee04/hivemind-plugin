# src/tools/ — Runtime and Command Surfaces

## Responsibilities
- Host executable runtime tools and composite slash-command bundles.
- Ensure each runtime tool has a same-name `.txt` instruction file and each slash command has a same-name markdown command asset under `/commands`.

## Rules
- `runtime/` is provisional execution plumbing.
- `slash-command/` is the orchestration-facing command stack.
- `/commands/*.md` is the command-contract surface for slash-command bundles.
- Do not ship generic catch-all tools as the long-term public architecture.
