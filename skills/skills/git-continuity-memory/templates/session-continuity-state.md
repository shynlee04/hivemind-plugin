# Session Continuity State

```json
{
  "_meta": {
    "created_at": "",
    "updated_at": ""
  },
  "current_session": {
    "sessionID": null,
    "ses_id": null,
    "task_id": null,
    "agent": null,
    "branch": null,
    "worktree": null,
    "worktree_role": null,
    "activity_type": null,
    "phase_type": null,
    "started_at": null,
    "last_turn_at": null,
    "turn_count": 0,
    "open_loop_ids": [],
    "open_packet_ids": [],
    "commit_anchor": null
  },
  "activity_log": [],
  "subsessions": [],
  "resume_history": []
}
```

## Subsession Entry

```json
{
  "task_id": "",
  "agent": "",
  "activity_type": "",
  "phase_type": "",
  "purpose": "",
  "status": "running | complete | blocked",
  "output_path": ""
}
```

## Activity Log Entry

```json
{
  "at": "",
  "activity_type": "",
  "phase_type": "",
  "summary": ""
}
```

## Resume History Entry

```json
{
  "ses_id": "",
  "resumed_at": "",
  "reason": ""
}
```
