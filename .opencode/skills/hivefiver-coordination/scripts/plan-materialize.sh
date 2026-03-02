#!/usr/bin/env bash
# plan-materialize.sh
# Deterministically materialize runtime planning artifacts into .hivemind/plans.

set -Eeuo pipefail

usage() {
  cat <<'USAGE'
Usage:
  plan-materialize.sh spawn <PLAN_ID> <scope> <title> [options]
  plan-materialize.sh quarantine-legacy [--workdir <path>]

Examples:
  plan-materialize.sh spawn META01 meta "Framework stabilization"
  plan-materialize.sh spawn META01-SUB01 meta "Parity isolation" --parent META01
  plan-materialize.sh spawn META01-SUB01-ATOMIC01 meta "Inventory diff" --priority critical

Options:
  --parent <PLAN_ID>      Explicit parent id (otherwise inferred)
  --priority <value>      critical|high|normal|low (default: normal)
  --status <value>        active|completed|pivoting|blocked (default: active)
  --tags <csv>            Comma-separated tags (default: planning,runtime-generated)
  --kind <root|sub|atomic>
  --workdir <path>        Project root override
  --force                 Overwrite existing plan node and manifest entry
  --no-register           Skip SOT registration via hivemind-tools.cjs
USAGE
}

quarantine_legacy() {
  local workdir="$(find_project_root)"

  while [[ $# -gt 0 ]]; do
    case "$1" in
      --workdir)
        workdir="${2:-}"
        shift 2
        ;;
      --help|-h)
        usage
        exit 0
        ;;
      *)
        printf 'Unknown option: %s\n' "$1" >&2
        usage
        exit 1
        ;;
    esac
  done

  local legacy_dir="$workdir/.hivemind/plan"
  local archive_root="$workdir/.hivemind/archive"

  if [[ ! -d "$legacy_dir" ]]; then
    printf '{"quarantined": false, "reason": "legacy path not present"}\n'
    return
  fi

  mkdir -p "$archive_root"
  local stamp
  stamp="$(date -u +"%Y%m%d-%H%M%S")"
  local target="$archive_root/plan-legacy-$stamp"

  mv "$legacy_dir" "$target"

  printf '{\n'
  printf '  "quarantined": true,\n'
  printf '  "source": ".hivemind/plan",\n'
  printf '  "target": ".hivemind/archive/%s"\n' "$(basename "$target")"
  printf '}\n'
}

escape_sed() {
  printf '%s' "$1" | sed -e 's/[\/&|]/\\&/g'
}

find_project_root() {
  local dir
  dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
  while [[ "$dir" != "/" ]]; do
    if [[ -f "$dir/opencode.json" ]] || [[ -d "$dir/.opencode" ]]; then
      printf '%s' "$dir"
      return
    fi
    dir="$(dirname "$dir")"
  done
  pwd -P
}

infer_kind() {
  local id="$1"
  if [[ "$id" =~ -ATOMIC[0-9]{2}$ ]]; then
    printf 'atomic'
    return
  fi
  if [[ "$id" =~ -SUB[0-9]{2}$ ]]; then
    printf 'sub'
    return
  fi
  if [[ "$id" =~ ^(META|PROJ)[0-9]{2}$ ]]; then
    printf 'root'
    return
  fi
  printf 'invalid'
}

infer_parent() {
  local id="$1"
  if [[ "$id" =~ ^(META|PROJ)[0-9]{2}$ ]]; then
    printf 'null'
    return
  fi
  if [[ "$id" =~ ^((META|PROJ)[0-9]{2})-SUB[0-9]{2}$ ]]; then
    printf '%s' "${BASH_REMATCH[1]}"
    return
  fi
  if [[ "$id" =~ ^((META|PROJ)[0-9]{2}-SUB[0-9]{2})-ATOMIC[0-9]{2}$ ]]; then
    printf '%s' "${BASH_REMATCH[1]}"
    return
  fi
  printf 'null'
}

normalize_tags_flow() {
  local csv="$1"
  local out="["
  local first=true
  IFS=',' read -r -a parts <<< "$csv"
  for raw in "${parts[@]}"; do
    local tag
    tag="$(printf '%s' "$raw" | sed 's/^ *//; s/ *$//')"
    if [[ -z "$tag" ]]; then
      continue
    fi
    if [[ "$first" == "true" ]]; then
      first=false
    else
      out+=" "
    fi
    out+="$tag,"
  done
  out="${out%,}"
  if [[ "$out" == "[" ]]; then
    out='[planning, runtime-generated]'
  else
    out+="]"
  fi
  printf '%s' "$out"
}

update_manifest() {
  local manifest_path="$1"
  local plan_id="$2"
  local plan_rel="$3"
  local validation_rel="$4"
  local parent="$5"
  local status="$6"
  local scope="$7"
  local kind="$8"
  local created="$9"
  local title="${10}"
  local force="${11}"

  node - "$manifest_path" "$plan_id" "$plan_rel" "$validation_rel" "$parent" "$status" "$scope" "$kind" "$created" "$title" "$force" <<'NODE'
const fs = require("fs")

const [
  manifestPath,
  planId,
  planRel,
  validationRel,
  parentRaw,
  status,
  scope,
  kind,
  created,
  title,
  force,
] = process.argv.slice(2)

let data = { plans: [] }
if (fs.existsSync(manifestPath)) {
  try {
    data = JSON.parse(fs.readFileSync(manifestPath, "utf8"))
  } catch {
    data = { plans: [] }
  }
}
if (!Array.isArray(data.plans)) data.plans = []

const parent = parentRaw === "null" ? null : parentRaw
const entry = {
  id: planId,
  title,
  type: kind,
  scope,
  parent,
  status,
  file: planRel,
  validation: validationRel,
  generated_by: "plan-materialize.sh",
  created,
  last_sync: created,
}

const index = data.plans.findIndex((p) => p.id === planId)
if (index >= 0 && force !== "true") {
  process.stderr.write(`Plan already exists in manifest: ${planId}\n`)
  process.exit(17)
}
if (index >= 0) {
  data.plans[index] = entry
} else {
  data.plans.push(entry)
}
data.last_updated = created
fs.writeFileSync(manifestPath, JSON.stringify(data, null, 2) + "\n")
NODE
}

main() {
  local action="${1:-}"
  shift || true

  if [[ "$action" == "quarantine-legacy" ]]; then
    quarantine_legacy "$@"
    return
  fi

  if [[ "$action" != "spawn" ]]; then
    usage
    exit 1
  fi

  local plan_id="${1:-}"
  local scope="${2:-}"
  local title="${3:-}"
  shift 3 || true

  if [[ -z "$plan_id" || -z "$scope" || -z "$title" ]]; then
    usage
    exit 1
  fi

  local parent=""
  local priority="normal"
  local status="active"
  local tags_csv="planning,runtime-generated"
  local kind=""
  local force="false"
  local register_sot="true"
  local workdir="$(find_project_root)"

  while [[ $# -gt 0 ]]; do
    case "$1" in
      --parent)
        parent="${2:-}"
        shift 2
        ;;
      --priority)
        priority="${2:-}"
        shift 2
        ;;
      --status)
        status="${2:-}"
        shift 2
        ;;
      --tags)
        tags_csv="${2:-}"
        shift 2
        ;;
      --kind)
        kind="${2:-}"
        shift 2
        ;;
      --workdir)
        workdir="${2:-}"
        shift 2
        ;;
      --force)
        force="true"
        shift
        ;;
      --no-register)
        register_sot="false"
        shift
        ;;
      --help|-h)
        usage
        exit 0
        ;;
      *)
        printf 'Unknown option: %s\n' "$1" >&2
        usage
        exit 1
        ;;
    esac
  done

  case "$priority" in
    critical|high|normal|low) ;;
    *) printf 'Invalid priority: %s\n' "$priority" >&2; exit 1 ;;
  esac

  case "$status" in
    active|completed|pivoting|blocked) ;;
    *) printf 'Invalid status: %s\n' "$status" >&2; exit 1 ;;
  esac

  if [[ -z "$kind" ]]; then
    kind="$(infer_kind "$plan_id")"
  fi

  if [[ "$kind" == "invalid" ]]; then
    printf 'Invalid PLAN_ID format: %s\n' "$plan_id" >&2
    printf 'Expected: META01 | META01-SUB01 | META01-SUB01-ATOMIC01\n' >&2
    exit 1
  fi

  if [[ -z "$parent" ]]; then
    parent="$(infer_parent "$plan_id")"
  fi

  local plans_dir="$workdir/.hivemind/plans"
  local templates_dir="$workdir/.opencode/templates/planning"
  local manifest_path="$plans_dir/manifest.json"
  local created
  created="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"

  local plan_file
  case "$kind" in
    atomic) plan_file="$plan_id.md" ;;
    root|sub) plan_file="$plan_id-PLAN.md" ;;
    *) printf 'Unsupported kind: %s\n' "$kind" >&2; exit 1 ;;
  esac

  local template_file
  case "$kind" in
    root) template_file="$templates_dir/root-plan.template.md" ;;
    sub) template_file="$templates_dir/sub-plan.template.md" ;;
    atomic) template_file="$templates_dir/atomic-plan.template.md" ;;
  esac

  local validation_template="$templates_dir/validation-plan.template.md"
  [[ -f "$template_file" ]] || { printf 'Missing template: %s\n' "$template_file" >&2; exit 1; }
  [[ -f "$validation_template" ]] || { printf 'Missing template: %s\n' "$validation_template" >&2; exit 1; }

  mkdir -p "$plans_dir" "$plans_dir/archive"
  if [[ ! -f "$manifest_path" ]]; then
    printf '{"plans": []}\n' > "$manifest_path"
  fi

  local plan_path="$plans_dir/$plan_file"
  local validation_file="VALIDATION-$plan_id.md"
  local validation_path="$plans_dir/$validation_file"

  if [[ "$force" != "true" ]]; then
    [[ ! -f "$plan_path" ]] || { printf 'Plan file exists (use --force): %s\n' "$plan_path" >&2; exit 1; }
    [[ ! -f "$validation_path" ]] || { printf 'Validation file exists (use --force): %s\n' "$validation_path" >&2; exit 1; }
  fi

  local tags_flow
  tags_flow="$(normalize_tags_flow "$tags_csv")"

  local PLAN_ID_ESC TITLE_ESC SCOPE_ESC STATUS_ESC PRIORITY_ESC CREATED_ESC TAGS_ESC PARENT_ESC
  PLAN_ID_ESC="$(escape_sed "$plan_id")"
  TITLE_ESC="$(escape_sed "$title")"
  SCOPE_ESC="$(escape_sed "$scope")"
  STATUS_ESC="$(escape_sed "$status")"
  PRIORITY_ESC="$(escape_sed "$priority")"
  CREATED_ESC="$(escape_sed "$created")"
  TAGS_ESC="$(escape_sed "$tags_flow")"
  PARENT_ESC="$(escape_sed "$parent")"

  sed \
    -e "s|__PLAN_ID__|$PLAN_ID_ESC|g" \
    -e "s|__TITLE__|$TITLE_ESC|g" \
    -e "s|__SCOPE__|$SCOPE_ESC|g" \
    -e "s|__STATUS__|$STATUS_ESC|g" \
    -e "s|__PRIORITY__|$PRIORITY_ESC|g" \
    -e "s|__CREATED__|$CREATED_ESC|g" \
    -e "s|__TAGS__|$TAGS_ESC|g" \
    -e "s|__PARENT__|$PARENT_ESC|g" \
    "$template_file" > "$plan_path"

  sed \
    -e "s|__PLAN_ID__|$PLAN_ID_ESC|g" \
    -e "s|__CREATED__|$CREATED_ESC|g" \
    "$validation_template" > "$validation_path"

  local plan_rel=".hivemind/plans/$plan_file"
  local validation_rel=".hivemind/plans/$validation_file"
  update_manifest "$manifest_path" "$plan_id" "$plan_rel" "$validation_rel" "$parent" "$status" "$scope" "$kind" "$created" "$title" "$force"

  if [[ "$register_sot" == "true" && -f "$workdir/.opencode/bin/hivemind-tools.cjs" ]]; then
    node "$workdir/.opencode/bin/hivemind-tools.cjs" sot register "$plan_path" --raw >/dev/null 2>&1 || true
    node "$workdir/.opencode/bin/hivemind-tools.cjs" sot register "$validation_path" --raw >/dev/null 2>&1 || true
    node "$workdir/.opencode/bin/hivemind-tools.cjs" sot chain "$plan_path" "$validation_path" --raw >/dev/null 2>&1 || true
  fi

  printf '{\n'
  printf '  "generated": true,\n'
  printf '  "plan_id": "%s",\n' "$plan_id"
  printf '  "kind": "%s",\n' "$kind"
  printf '  "scope": "%s",\n' "$scope"
  printf '  "parent": %s,\n' "$( [[ "$parent" == "null" ]] && printf 'null' || printf '"%s"' "$parent" )"
  printf '  "plan_file": "%s",\n' "$plan_rel"
  printf '  "validation_file": "%s",\n' "$validation_rel"
  printf '  "manifest": ".hivemind/plans/manifest.json",\n'
  printf '  "sot_registration": %s\n' "$register_sot"
  printf '}\n'
}

main "$@"
