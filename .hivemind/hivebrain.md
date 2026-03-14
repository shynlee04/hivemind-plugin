---
version: 3.0.0
updated_at: 2026-03-14T07:10:23.065Z
current_lineage: hiveminder
active_session_id: SES-fcc2a0b4-b0d9-44cf-8f05-52b90fae1ed1
active_opencode_session_id: ses_3163b5674ffe35GRL986rxDuzp
integrity_grade: healthy
---

# HiveBrain

<overview>
boot_health: ready
story: OpenCode-native session kernel is active and projecting durable state into .hivemind.
</overview>

## Active Session
- Canonical session: SES-fcc2a0b4-b0d9-44cf-8f05-52b90fae1ed1
- Brain session: fcc2a0b4-b0d9-44cf-8f05-52b90fae1ed1
- OpenCode session: ses_3163b5674ffe35GRL986rxDuzp
- Lineage: hiveminder
- Status: bootstrap
- Intent: Existing runtime upgraded onto session kernel

<refs>
integrity: ./states/shared/integrity.json
session_map: ./states/shared/session-map.json
session: ./states/lineages/hiveminder/sessions/SES-fcc2a0b4-b0d9-44cf-8f05-52b90fae1ed1.json
profile: ./config/profile.json
governance: ./config/governance.json
guardrails: ./config/guardrails.json
</refs>

## Next Sectors
- hiveminder: own the active session trajectory and emit future workflow/task records under states/lineages/hiveminder/.
- shared: keep integrity, session-map, artifact-index, and verification-index concise and current.
- legacy: remain compatibility-only until doctor/import work archives or regenerates them.
