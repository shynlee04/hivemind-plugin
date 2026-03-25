# Phase TDD Strategy

| Phase Type | Test Level | Focus |
|-----------|-----------|-------|
| Foundation | Unit | Types, interfaces, config |
| Core Logic | Unit | Business rules, algorithms |
| API | Unit + Integration | Endpoints, request/response |
| Data | Unit + Integration | Storage, retrieval, queries |
| Integration | Integration | Cross-module wiring |
| UI | Unit + E2E | Components, user flows |
| Infrastructure | Integration | Config, deployment, env |
| E2E | E2E | Full user journeys |

## Test Writing Order
Unit first → Integration after → E2E last. Never skip levels.
