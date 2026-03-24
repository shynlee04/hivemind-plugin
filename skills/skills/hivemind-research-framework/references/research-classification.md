# Research Classification — Decision Trees & Signal Words

## Classification Decision Tree

```
START: User presents a research request
│
├─ Does it contain comparison language?
│  (versus, compare, alternative, better, trade-off, which one)
│  ├─ YES → Type: Comparison
│  └─ NO ↓
│
├─ Does it ask "how does X work/behaves"?
│  (how does, behavior, semantics, contract, API, implementation)
│  ├─ YES → Type: Tech/API
│  └─ NO ↓
│
├─ Does it ask about patterns/approaches?
│  (pattern, architecture, design, approach, structure, organize)
│  ├─ YES → Type: Pattern
│  └─ NO ↓
│
├─ Does it ask about scope/requirements?
│  (need, must have, scope, requirements, what does it take, prerequisites)
│  ├─ YES → Type: Requirements
│  └─ NO ↓
│
├─ Does it ask about ecosystem/landscape?
│  (ecosystem, who does, options, list, what exists, alternatives, market)
│  ├─ YES → Type: Landscape
│  └─ NO ↓
│
├─ Does it ask about dependencies/impact?
│  (depends on, breaks, couples, impacts, affects, causes, ripple)
│  ├─ YES → Type: Cross-Dependency
│  └─ NO ↓
│
└─ REFINE: The question is too vague. Apply question framing protocol.
```

## Signal Word Tables (Expanded)

### Tech/API Signals
| Strong Signal | Weak Signal | Context Modifier |
|---|---|---|
| how does * work | explain | under load |
| behavior of | describe | in production |
| API contract | tell me about | at scale |
| implementation detail | what is | with TypeScript |
| semantically | functionally | across versions |

### Comparison Signals
| Strong Signal | Weak Signal | Context Modifier |
|---|---|---|
| versus / vs | compare | for small teams |
| alternative to | options | at scale |
| which is better | choice between | for beginners |
| trade-off | pros and cons | in production |
| migrate from X to Y | replace | cost-wise |

### Pattern Signals
| Strong Signal | Weak Signal | Context Modifier |
|---|---|---|
| design pattern | approach | for microservices |
| architecture | structure | with TypeScript |
| best practice | organize | for scalability |
| convention | standard way | in React |
| idiomatic | recommended | for testing |

### Requirements Signals
| Strong Signal | Weak Signal | Context Modifier |
|---|---|---|
| what do I need | requirements | to deploy |
| prerequisites | must have | for production |
| scope of | what does it take | minimum viable |
| dependencies needed | setup | for CI/CD |

### Landscape Signals
| Strong Signal | Weak Signal | Context Modifier |
|---|---|---|
| who does what | options | in 2026 |
| what exists | list | for React |
| ecosystem of | alternatives | open source |
| market | tools available | free |

### Cross-Dependency Signals
| Strong Signal | Weak Signal | Context Modifier |
|---|---|---|
| depends on | related to | in monorepo |
| breaks if | impacts | after upgrade |
| couples with | causes | in production |
| ripple effect | cascades | across services |
| affects | changes when | on deploy |

## Multi-Type Classification

Some requests span multiple types. Use this priority:

1. If comparison language present → Comparison (primary) + sub-questions may be Tech/API
2. If dependency language present → Cross-Dependency (primary) + sub-questions may be Pattern
3. If landscape + comparison → split into Landscape (discovery) + Comparison (evaluation)

### Example Multi-Type

**Request**: "How does Next.js App Router compare to Remix for a large e-commerce site?"

- Primary: **Comparison** (signal: "compare to")
- Secondary: **Tech/API** (sub-Q: "How does App Router handle nested layouts?")
- Secondary: **Requirements** (sub-Q: "What does a large e-commerce site need?")
- Delegation: Split into 3 sub-agents, one per secondary type, then synthesize
