---
description: "config workspace | workstreams thread update ship inbox"
argument-hint: ""
requires: [config, workspace, workstreams, thread, pause-work, resume-work, update, ship, inbox, pr-branch, undo]
tools:
  read: true
  skill: true
---

Route to the appropriate management skill based on the user's intent.
`hm-config` (settings + advanced + integrations + profile) and `hm-workspace`
(new + list + remove) are post-#2790 consolidated entries.

| User wants | Invoke |
|---|---|
| Configure Hivemind settings (basic / advanced / integrations / profile) | hm-config |
| Manage workspaces (create / list / remove) | hm-workspace |
| Manage parallel workstreams | hm-workstreams |
| Continue work in a fresh context thread | hm-thread |
| Pause current work | hm-pause-work |
| Resume paused work | hm-resume-work |
| Update the Hivemind installation | hm-update |
| Ship completed work | hm-ship |
| Process inbox items | hm-inbox |
| Create a clean PR branch | hm-pr-branch |
| Undo the last Hivemind action | hm-undo |

Invoke the matched skill directly using the Skill tool.
