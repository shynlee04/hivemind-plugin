# src/hooks/ — Runtime Entry and Transform Boundaries

## Responsibilities
- Own first-message routing, auto command routing, and prompt transform adapters.
- Keep hooks thin: resolve, route, and pass data onward.
- Do not hide tool or config loading logic here.

## Rules
- `start-work/` is the first authority after raw user input.
- `auto-slash-command/` only adapts routing decisions; it does not own command config.
- Prompt transformation hooks compile packets, not governance doctrine.
