# System Blueprint: {system-name}

**Version:** {1.0}
**Date:** {YYYY-MM-DD}
**Author:** {agent or role}
**Status:** {Draft|Approved|Implemented}

## 1. System Overview

{One paragraph describing what this system does, its purpose, and its boundaries.}

## 2. Layer Diagram

```
┌─────────────────────────────────────────────┐
│                  Frameworks                  │
│  (OpenCode Plugin, CLI, External APIs)      │
├─────────────────────────────────────────────┤
│                  Adapters                    │
│  (Tool adapters, Hook adapters, MCP)        │
├─────────────────────────────────────────────┤
│                 Use Cases                    │
│  (Command orchestration, Workflow control)  │
├─────────────────────────────────────────────┤
│                 Entities                     │
│  (Domain models, Business rules)           │
└─────────────────────────────────────────────┘

Dependency direction: ↓ (outer depends on inner, never reverse)
```

## 3. Data Flow

```
User Input → Framework Layer → Adapter Layer → Use Case Layer → Entity Layer
                                                      ↓
                                              Persistence / External
```

{Describe the primary data flows. How does information enter, transform, and exit the system?}

### 3.1 Command Flow

{Step-by-step description of how commands are processed}

### 3.2 Query Flow

{Step-by-step description of how queries are resolved}

### 3.3 Event Flow

{Step-by-step description of how events propagate}

## 4. Interface Boundaries

| Boundary | Direction | Protocol | Owner |
|----------|-----------|----------|-------|
| {name} | {inbound/outbound} | {REST/gRPC/Event/Internal} | {module} |
| {name} | {inbound/outbound} | {REST/gRPC/Event/Internal} | {module} |

### 4.1 External Interfaces

{APIs exposed to consumers or external systems}

### 4.2 Internal Interfaces

{Contracts between internal modules, following interface decomposition (max 10 fields)}

## 5. Technology Choices

| Concern | Technology | Justification | ADR |
|---------|-----------|---------------|-----|
| {concern} | {choice} | {why} | {ADR-NNN} |
| {concern} | {choice} | {why} | {ADR-NNN} |

### 5.1 SDK Dependencies

| SDK Surface | Usage | Authority |
|-------------|-------|-----------|
| {tool.schema} | {purpose} | {owner} |
| {client.*} | {purpose} | {owner} |
| {permission.ask} | {purpose} | {owner} |

## 6. Scaling Strategy

### 6.1 Horizontal Scaling

{How the system scales out. What is stateless? What requires coordination?}

### 6.2 Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| {metric} | {target} | {how measured} |

### 6.3 Resource Limits

| Resource | Limit | Rationale |
|----------|-------|-----------|
| {resource} | {limit} | {why} |

## 7. Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| {risk} | {H/M/L} | {H/M/L} | {action} |

## 8. Migration Notes

{If this blueprint replaces an existing system, describe the migration path.}

---

*Create an ADR using `templates/architecture-decision.md` for each significant technology choice above.*
