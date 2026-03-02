# Skill: hitea-chaos-engineering

# Chaos Engineering: Testing System Resilience

Use when testing system resilience through controlled failure injection. Triggers on: 'chaos engineering', 'resilience testing', 'fault injection', 'chaos monkey', 'reliability'.

## Philosophy: Failure is Inevitable

Chaos engineering embraces the reality that systems will fail. Instead of hoping for perfect uptime, we **intentionally break systems** to verify they can handle failures gracefully.

> "Chaos engineering is the discipline of experimenting on a system in order to build confidence in the system's capability to withstand turbulent conditions in production." — Principles of Chaos Engineering

## Core Principles

1. **Build a Hypothesis**: Define what "steady state" looks like
2. **Vary Real-World Events**: Simulate server crashes, network latency, dependency failures
3. **Run Experiments in Production**: Production reveals what staging cannot
4. **Automate Experiments to Run Continuously**: Not just one-time tests
5. **Minimize Blast Radius**: Start small, expand carefully

## Chaos Experiments

### L1: Infrastructure Chaos
```yaml
experiment: pod-kill
description: Kill random pods to test auto-recovery
target:
  namespace: production
  label_selector: app=payment-service
action:
  type: pod-kill
  count: 1
  interval: 5m
verification:
  - service_responds_within: 30s
  - no_error_rate_spike: "> 1%"
  - auto_recovery: true
```

### L2: Network Chaos
```yaml
experiment: network-latency
description: Inject latency to test timeout handling
target:
  service: payment-service
action:
  type: network-latency
  latency: 500ms
  jitter: 100ms
  duration: 5m
verification:
  - circuit_breaker_opens: true
  - fallback_active: true
  - no_cascading_failures: true
```

### L3: Dependency Chaos
```yaml
experiment: dependency-failure
description: Simulate database outage
target:
  dependency: postgres-primary
action:
  type: service-unavailable
  duration: 2m
verification:
  - cache_fallback_active: true
  - graceful_degradation: true
  - error_page_shown: true
```

### L4: Resource Chaos
```yaml
experiment: cpu-pressure
description: Stress CPU to test scaling behavior
target:
  nodes: ["node-1", "node-2"]
action:
  type: cpu-stress
  load: 80%
  duration: 10m
verification:
  - hpa_scales_up: true
  - latency_increase: "< 50%"
  - no_service_degradation: "> 90% success rate"
```

## Tools

### Chaos Mesh (Kubernetes)
```yaml
apiVersion: chaos-mesh.org/v1alpha1
kind: PodChaos
metadata:
  name: payment-pod-kill
spec:
  action: pod-kill
  mode: one
  selector:
    namespaces:
      - production
    labelSelectors:
      app: payment-service
  scheduler:
    cron: "*/30 * * * *"  # Every 30 minutes
```

### Gremlin
```bash
# Install Gremlin client
helm install gremlin gremlin/gremlin

# Run CPU attack
gremlin attack cpu --length 300 --core 4 --percent 80

# Run network latency
gremlin attack latency --length 300 --ms 500
```

## Game Days

A **Game Day** is a planned exercise where teams practice responding to chaos:

### Pre-Game
1. Define experiment scope and blast radius
2. Identify rollback procedures
3. Alert on-call teams
4. Set up monitoring dashboards

### During Game
1. Start with minimal blast radius
2. Gradually increase scope
3. Monitor system behavior
4. Document findings

### Post-Game
1. Analyze results
2. Create action items for weaknesses found
3. Update runbooks
4. Share learnings

## Scripts

### Run Chaos Experiment
```bash
# Run chaos experiment
./scripts/run-chaos.sh --experiment pod-kill --target payment-service

# Run full game day
./scripts/game-day.sh --config game-days/payment-resilience.yaml
```

## Templates

### Chaos Experiment Template
```yaml
name: [experiment-name]
description: [what we're testing]
hypothesis: [what we expect to happen]

target:
  service: [service-name]
  namespace: [namespace]
  labels: {}

action:
  type: [pod-kill|network-latency|cpu-stress|dependency-failure]
  parameters: {}

duration: 5m
interval: 1h

verification:
  - metric: [metric name]
    condition: [expected condition]
  
  - metric: [another metric]
    condition: [expected condition]

rollback:
  automated: true
  trigger: [condition that triggers rollback]

alerts:
  - channel: slack
    room: "#chaos-alerts"
```

## References

- `references/chaos-mesh-api.md` — Chaos Mesh API reference
- `references/game-day-playbook.md` — Game day planning guide
- `references/resilience-patterns.md` — Common resilience patterns
