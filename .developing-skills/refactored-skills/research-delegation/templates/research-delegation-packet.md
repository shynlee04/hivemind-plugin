# Research Delegation Packet

```json
{
  "_meta": {
    "created_at": "",
    "updated_at": ""
  },
  "packet_id": "",
  "concern": "",
  "activity_type": "delegation",
  "phase_type": "",
  "mode": "research",
  "execution_mode": "sequential",
  "research_type": "evidence-collection | source-validation | synthesis",
  "sub_question": "",
  "source_strategy": "code-first | docs-first | web-first",
  "required_sources": [],
  "scope": "",
  "out_of_scope": "",
  "authority_surfaces": [],
  "constraints": [],
  "return_contract": {
    "status": "complete | partial | blocked",
    "evidence_count": 0,
    "sources_checked": [],
    "coverage": "partial | complete"
  },
  "dispatched_at": "",
  "timeout_minutes": 30
}
```

## Field Descriptions

| Field | Description |
|-------|------------|
| `research_type` | Type of research work |
| `sub_question` | The specific question this packet addresses |
| `source_strategy` | Where to look first |
| `required_sources` | Specific sources that must be checked |
| `return_contract.evidence_count` | Number of evidence items collected |
| `return_contract.sources_checked` | Sources actually consulted |
| `return_contract.coverage` | Whether the sub-question is fully answered |
