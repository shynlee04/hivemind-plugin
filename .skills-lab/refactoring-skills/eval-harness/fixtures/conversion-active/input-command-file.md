# DevOps CLI Helper Commands

## Deployment Commands
- `deploy --env production` — Deploy to production environment
- `deploy --env staging` — Deploy to staging environment
- `rollback --version <tag>` — Rollback to a specific version

## Monitoring Commands
- `health-check --service <name>` — Check service health status
- `logs --service <name> --tail 100` — View recent service logs
- `metrics --service <name> --period 1h` — View service metrics

## Infrastructure Commands
- `infra status` — Show infrastructure status
- `infra scale --service <name> --replicas <n>` — Scale a service
- `infra restart --service <name>` — Restart a service
