# Plan Record Template

Copy this JSON structure for new plan records.

```json
{
  "_meta": {
    "created_at": "",
    "updated_at": "",
    "plan_id": "plan-{timestamp}-{concern}",
    "source_spec": ""
  },
  "status": "validated",
  "validation": {
    "completeness": { "functional": false, "non_functional": false, "integration": false, "risk": false, "operations": false },
    "feasibility": { "target_exists": false, "evidence": "" },
    "constraints": { "resource_limits": "", "timeline": "", "dependencies": "" },
    "ambiguity_residual": []
  },
  "phases": [],
  "dependency_graph": { "critical_path": [], "parallel_waves": [], "edges": [] },
  "carry_forward": [],
  "retraceability": { "decisions": [], "commit_chain": [], "audit_trail": [] }
}
```
