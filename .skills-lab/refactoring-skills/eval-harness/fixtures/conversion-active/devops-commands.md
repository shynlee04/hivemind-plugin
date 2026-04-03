# DevOps CLI Commands Reference

## deploy-staging
```bash
#!/usr/bin/env bash
# Deploy current branch to staging environment
# Usage: ./deploy-staging.sh [--force] [--rollback]
set -euo pipefail
ENV="${1:-staging}"
echo "Deploying to $ENV..."
```

## rollback
```bash
#!/usr/bin/env bash
# Rollback to previous deployment
# Usage: ./rollback.sh [version]
set -euo pipefail
VERSION="${1:-latest}"
echo "Rolling back to $VERSION..."
```

## health-check
```bash
#!/usr/bin/env bash
# Check health of all services
# Usage: ./health-check.sh [--verbose]
set -euo pipefail
echo "Running health checks..."
```

## log-tail
```bash
#!/usr/bin/env bash
# Tail logs from production
# Usage: ./log-tail.sh [service-name]
set -euo pipefail
SERVICE="${1:-all}"
echo "Tailing logs for $SERVICE..."
```
