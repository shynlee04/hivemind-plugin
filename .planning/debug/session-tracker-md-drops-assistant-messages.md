---
status: fixing
trigger: "Session-tracker .md output for MAIN session contains ZERO ## Assistant sections — only USER turns. Child session JSON DOES have assistant messages."
created: 2026-05-24T12:00:00Z
updated: 2026-05-24T23:59:00Z
---

## Current Focus

hypothesis: The payload schema desync causes MessageCapture to bail out, and concurrent writes lack serialization queues.
test: Apply the approved implementation_plan.md (file:///Users/apple/.gemini/antigravity-ide/brain/b1a92395-65c8-41a0-9eac-6cae6f673df6/implementation_plan.md)
expecting: All tests and live runs pass successfully.
next_action: Apply changes in implementation_plan.md to message-capture.ts, session-writer.ts, and hierarchy-manifest.ts.


## Symptoms

expected: Main session .md file should contain ## Assistant sections for assistant turns
actual: Main session .md file has 8 ## USER headers, ZERO ## Assistant headers
errors: No error messages — assistant messages silently dropped
reproduction: Run a session with assistant turns, check main .md file
started: Always been this way (first noticed in session ses_1a569dbecffe9OkLhGac1w7OF6)

## Eliminated

## Evidence

## Resolution

root_cause: 
fix: 
verification: 
files_changed: []
