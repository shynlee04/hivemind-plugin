#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

status=0

hivefiver_file="agents/hivefiver.md"
hivemaker_file="agents/hivemaker.md"
hivehealer_file="agents/hivehealer.md"
require_pattern() {
  local file="$1"
  local pattern="$2"
  local message="$3"
  if ! rg -q "$pattern" "$file"; then
    echo "❌ $message"
    status=1
  fi
}

for required_file in "$hivefiver_file" "$hivemaker_file" "$hivehealer_file"; do
  if [[ ! -f "$required_file" ]]; then
    echo "❌ Missing required agent file: $required_file"
    status=1
  fi
done

require_pattern "$hivefiver_file" 'Meta-builder|framework doctor' "hivefiver must remain a framework/meta-builder surface."
require_pattern "$hivefiver_file" 'src/\*\*' "hivefiver must explicitly keep src/** out of scope."
require_pattern "$hivefiver_file" 'tests/\*\*' "hivefiver must explicitly keep tests/** out of scope."
require_pattern "$hivefiver_file" 'agents/\*\*|commands/\*\*|workflows/\*\*|skills/\*\*' "hivefiver must retain framework-asset scope language."

require_pattern "$hivemaker_file" 'src/\*\*|`src/`|src/' "hivemaker must explicitly own src work."
require_pattern "$hivemaker_file" 'tests/\*\*|`tests/`|tests/' "hivemaker must explicitly own tests work."
require_pattern "$hivemaker_file" 'docs/\*\*|docs/' "hivemaker must explicitly own docs work."
require_pattern "$hivemaker_file" 'agents|commands|workflows|skills' "hivemaker must still forbid framework assets."

require_pattern "$hivehealer_file" 'src/\*\*|`src/`|src/' "hivehealer must explicitly own src work."
require_pattern "$hivehealer_file" 'tests/\*\*|`tests/`|tests/' "hivehealer must explicitly own tests work."
require_pattern "$hivehealer_file" 'docs/\*\*|docs/' "hivehealer must explicitly own docs work."
require_pattern "$hivehealer_file" 'agents|commands|workflows|skills' "hivehealer must still forbid framework assets."

if [[ "$status" -ne 0 ]]; then
  exit 1
fi

echo "✅ Agent/docs ownership boundary clean (framework vs implementation split enforced)."
