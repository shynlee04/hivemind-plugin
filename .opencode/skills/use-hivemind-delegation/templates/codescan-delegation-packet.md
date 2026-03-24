# Codescan Delegation Packet

<!-- _meta: { "created_at": "2026-03-24T00:00:00Z", "updated_at": "2026-03-24T00:00:00Z" } -->

```json
{
  "packet_id": "",
  "concern": "codescan",
  "objective": "",
  "mode": "research",
  "execution_mode": "sequential",
  "agent_type": "explore | general",
  "activity_type": "codescan",
  "phase_type": "high-level-map | pipeline-map | journey-map | low-level-proof | cross-pass-synthesis",
  "scan_level": "quick | deep | exhaustive",
  "pass_id": "",
  "batch_id": "",
  "branch": "",
  "worktree": "",
  "worktree_role": "",
  "authority_surfaces": [],
  "must_read_artifacts": [],
  "user_journeys": [],
  "edge_cases": [],
  "scope": [],
  "out_of_scope": ["node_modules/", "dist/", ".git/", "coverage/"],
  "constraints": [
    "Read-only — no file mutations",
    "Write batch output to {activity}/codescan/{pass_id}/{batch_id}.json"
  ],
  "success_metrics": [
    "All files in scope checked",
    "JSON output written to designated path"
  ],
  "required_evidence": [
    "files_checked count matches scope file count",
    "findings array populated"
  ],
  "required_accounting": [
    "coverage_gaps recorded",
    "blocked_routes recorded when proof is incomplete"
  ],
  "return_contract": {
    "status": "completed | partial | blocked",
    "evidence": { "confirmed": [], "inferred": [], "unverified": [] },
    "artifacts": [],
    "blocked_routes": [],
    "recommended_next_action": ""
  },
  "return_gate": "all files in scope checked OR blocked_files documented"
}
```
