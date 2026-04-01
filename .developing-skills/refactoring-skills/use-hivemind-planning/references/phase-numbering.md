# Phase Numbering Scheme

## Format
`{2-digit-phase}.{sub-phase}`

## Ranges
| Range | Meaning | Example |
|-------|---------|---------|
| 01-09 | Standard project phases | 01 = Foundation |
| 10-19 | Extended (large projects) | 10 = Advanced Features |
| 20-29 | Emergency, debt, hotfix | 20 = Hotfix |
| 30-39 | Meta/framework phases | 30 = Skill Refactor |
| .1, .2 | Sub-phases | 03.1 = API layer, 03.2 = DB layer |

## Handoff Flow Example
```
Epic: "Add authentication"
  ├── Phase 01: Foundation (types, config)
  ├── Phase 02: Core auth logic
  ├── Phase 03: API endpoints
  └── Phase 04: Integration tests
```
