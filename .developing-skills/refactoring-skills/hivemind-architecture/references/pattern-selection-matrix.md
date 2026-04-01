# Pattern Selection Matrix

Decision framework for choosing between structural architecture patterns.

## Pattern Comparison

| Criterion | Monolith | Modular Monolith | Microservices | Serverless |
|-----------|----------|-----------------|---------------|------------|
| **Team Size** | 1–4 | 4–12 | 8+ per service | 1–8 |
| **Domain Complexity** | Low | Medium–High | High | Low–Medium |
| **Deployment Frequency** | Weekly | Daily | Multiple/day | Continuous |
| **Data Consistency** | Strong | Strong | Eventual per boundary | Eventual |
| **Operational Complexity** | Low | Low–Medium | High | Medium |
| **Scalability** | Vertical | Vertical + partial horizontal | Horizontal per service | Automatic |
| **Team Autonomy** | Low | Medium | High | High |
| **Initial Cost** | Low | Low–Medium | High | Low |
| **Long-term Cost** | Medium | Medium | High | Variable |

## Selection Decision Tree

```
1. Is the domain well-bounded with clear subdomains?
   ├─ NO  → Monolith (establish domain understanding first)
   └─ YES → Continue to step 2

2. Is the team larger than 8 developers?
   ├─ NO  → Continue to step 3
   └─ YES → Continue to step 4

3. Do you need independent deployment of modules?
   ├─ NO  → Monolith (simplest option)
   └─ YES → Modular Monolith (strict module boundaries)

4. Can subdomains be independently deployed and managed?
   ├─ NO  → Modular Monolith (with extraction plan)
   └─ YES → Continue to step 5

5. Is operational infrastructure mature (CI/CD, monitoring, service mesh)?
   ├─ NO  → Modular Monolith (build infra first)
   └─ YES → Microservices (one per bounded context)

6. Are workloads event-driven with unpredictable scale?
   ├─ NO  → Continue with chosen pattern
   └─ YES → Consider Serverless for specific workloads
```

## Pattern Details

### Monolith

**Best for:** Small teams, early-stage products, well-understood domains.

**Strengths:**
- Simple deployment (one artifact)
- Strong consistency (one database)
- Easy debugging (one process)
- Low operational overhead

**Weaknesses:**
- Scaling requires scaling everything
- Team coordination needed for all changes
- Large codebase becomes hard to navigate
- Technology choices are all-or-nothing

**HiveMind applicability:** The OpenCode plugin itself is effectively a monolith — a single-process plugin with internal module boundaries.

### Modular Monolith

**Best for:** Medium teams, growing domains, preparing for future decomposition.

**Strengths:**
- Clear module boundaries enforced in code
- Each module has its own domain model
- Future extraction to microservices is straightforward
- Simple deployment (still one artifact)

**Weaknesses:**
- Discipline required to maintain boundaries
- Temptation to bypass module interfaces
- Shared database can create coupling
- Module boundary enforcement needs fitness functions

**HiveMind applicability:** The `src/` directory structure mirrors a modular monolith — tools, hooks, plugin, core, shared as logical modules with enforced boundaries.

### Microservices

**Best for:** Large teams, complex domains, independent deployment needs.

**Strengths:**
- Independent deployment and scaling
- Technology diversity per service
- Team autonomy with clear ownership
- Fault isolation per service

**Weaknesses:**
- Distributed system complexity
- Network calls instead of in-process calls
- Data consistency challenges (eventual consistency)
- Operational overhead (monitoring, tracing, service mesh)

**HiveMind applicability:** Not applicable to the OpenCode plugin itself, but relevant when HiveMind governs multi-service ecosystems.

### Serverless

**Best for:** Event-driven workloads, unpredictable scale, small teams with DevOps constraints.

**Strengths:**
- Automatic scaling
- Pay-per-use cost model
- No server management
- Fast deployment of small functions

**Weaknesses:**
- Cold start latency
- Vendor lock-in
- Limited local state
- Debugging and tracing complexity

**HiveMind applicability:** Not directly applicable to OpenCode plugins, but relevant for HiveMind-managed cloud workflows.

## Migration Paths

```
Monolith → Modular Monolith
  Step 1: Introduce module boundaries in code
  Step 2: Enforce with fitness functions
  Step 3: Separate module databases (logical separation)
  Step 4: Define inter-module interfaces

Modular Monolith → Microservices
  Step 1: Identify bounded contexts with clear boundaries
  Step 2: Extract one module as a service (pilot)
  Step 3: Establish inter-service communication (events, not sync calls)
  Step 4: Migrate module data to service-owned databases
  Step 5: Repeat for each bounded context
  Step 6: Verify independent deployment capability

Monolith → Microservices (direct)
  ⚠️ NOT RECOMMENDED — go through Modular Monolith first
  Risk: Extracting from tangled monolith creates distributed monolith
```

## Anti-Pattern: Distributed Monolith

**Detection checklist:**
- [ ] Services share a database
- [ ] Deploying one service requires deploying others
- [ ] Services make synchronous calls in chains
- [ ] A failure in one service cascades to others
- [ ] Team communication overhead matches monolith level

If 3 or more checks pass, the system is a distributed monolith. Consider consolidating into a modular monolith or fixing service boundaries.

---

*This matrix is referenced by the SKILL.md Pattern Selection Decision Tree section. Load this file when choosing or evaluating a structural pattern.*
