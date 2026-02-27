#!/usr/bin/env bash
# validate-framework.sh — Sector-2 framework contract validator

PASS=0
FAIL=0
WARN=0

pass() { ((PASS++)) || true; }
fail() { ((FAIL++)) || true; echo "FAIL: $1"; }
warn() { ((WARN++)) || true; echo "WARN: $1"; }
ok() { pass; }

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

STRICT_PARITY="${VALIDATE_STRICT_PARITY:-0}"

echo "=== HiveMind Framework Validation ==="
echo ""

# R01: Agent definitions (minimal contract)
echo "-- R01: Agent Definitions --"
for f in agents/*.md; do
  [ -f "$f" ] || continue
  name=$(basename "$f" .md)

  if head -40 "$f" | rg -q "^name:"; then ok; else fail "R01 $name: missing name"; fi
  if head -60 "$f" | rg -q "^mode:"; then ok; else fail "R01 $name: missing mode"; fi
  if rg -q "^identity:" "$f"; then ok; else fail "R01 $name: missing identity contract"; fi
  if rg -q "^delegation_policy:" "$f"; then ok; else fail "R01 $name: missing delegation_policy"; fi

  # Diamond boundary hygiene: agents must avoid procedural tutorial payloads
  if rg -qi "^##[[:space:]]+(process|workflow|how to|implementation steps)" "$f"; then
    fail "R01 $name: agent contains procedural section (violates Agent=Who boundary)"
  else
    ok
  fi
done

# R01b: OpenCode permission schema + role boundary policy
echo "-- R01b: Agent Permission Schema --"
while IFS='|' read -r level message; do
  case "$level" in
    PASS) ok ;;
    WARN) warn "$message" ;;
    FAIL) fail "$message" ;;
  esac
done < <(node - <<'NODE'
const fs = require("node:fs");
const path = require("node:path");
const yaml = require("yaml");

const root = process.cwd();
const agentsDir = path.join(root, "agents");

const PERMISSION_MODES = new Set(["allow", "ask", "deny"]);
const ALLOWED_PERMISSION_KEYS = new Set([
  "read",
  "edit",
  "glob",
  "grep",
  "list",
  "bash",
  "task",
  "skill",
  "lsp",
  "todoread",
  "todowrite",
  "webfetch",
  "websearch",
  "codesearch",
  "external_directory",
  "doom_loop",
  "*",
]);
const FORBIDDEN_PERMISSION_KEYS = new Set(["command", "file", "write", "patch"]);

const emit = (level, message) => console.log(`${level}|${message}`);
const isRecord = (value) => typeof value === "object" && value !== null && !Array.isArray(value);
const isMode = (value) => typeof value === "string" && PERMISSION_MODES.has(value);

function extractFrontmatter(filePath) {
  const text = fs.readFileSync(filePath, "utf-8");
  const match = text.match(/^---\s*\n([\s\S]*?)\n---(?:\s*\n|$)/);
  if (!match) return { error: "missing frontmatter" };
  try {
    return { value: yaml.parse(match[1]) };
  } catch (error) {
    return { error: `frontmatter parse error (${error.message})` };
  }
}

function validatePermissionSchema(permission) {
  if (!isRecord(permission)) {
    return "permission must be an object";
  }

  for (const [key, value] of Object.entries(permission)) {
    if (FORBIDDEN_PERMISSION_KEYS.has(key)) {
      return `forbidden permission key '${key}'`;
    }
    if (!ALLOWED_PERMISSION_KEYS.has(key)) {
      return `unknown permission key '${key}'`;
    }
    if (isMode(value)) continue;
    if (!isRecord(value)) {
      return `permission '${key}' must be mode or pattern ruleset`;
    }
    for (const [pattern, mode] of Object.entries(value)) {
      if (!isMode(mode)) {
        return `permission '${key}' pattern '${pattern}' has invalid mode '${String(mode)}'`;
      }
    }
  }

  return null;
}

function getAllowedEditPatterns(permission) {
  const edit = permission?.edit;
  if (!edit) return [];
  if (typeof edit === "string") {
    return edit === "allow" ? ["*"] : [];
  }
  if (!isRecord(edit)) return [];
  return Object.entries(edit)
    .filter(([, mode]) => mode === "allow")
    .map(([pattern]) => pattern);
}

function includesPattern(patterns, expected) {
  return patterns.includes(expected) || patterns.includes("*");
}

function roleBoundaryAssessment(role, editAllows) {
  const violations = [];
  const warnings = [];
  const allows = (pattern) => includesPattern(editAllows, pattern);
  const hasGlobalEditAllow = editAllows.includes("*");

  if (role === "front_orchestrator") {
    if (!allows(".hivemind/**")) violations.push("front_orchestrator must allow edit on .hivemind/**");
    if (!allows("docs/**")) violations.push("front_orchestrator must allow edit on docs/**");
    if (hasGlobalEditAllow) {
      warnings.push("front_orchestrator uses edit '*' allow; src/tests deny boundary downgraded to WARN");
    } else if (allows("src/**") || allows("tests/**")) {
      violations.push("front_orchestrator must not allow edit on src/** or tests/**");
    }
  } else if (role === "meta_builder") {
    const frameworkSurface = ["agents/**", "commands/**", "workflows/**", "skills/**"];
    if (!frameworkSurface.some((pattern) => allows(pattern))) {
      violations.push("meta_builder must allow at least one framework surface (agents/commands/workflows/skills)");
    }
    if (hasGlobalEditAllow) {
      warnings.push("meta_builder uses edit '*' allow; src/tests deny boundary downgraded to WARN");
    } else if (allows("src/**") || allows("tests/**")) {
      violations.push("meta_builder must not allow edit on src/** or tests/**");
    }
  } else if (role === "executor" || role === "remediation_executor") {
    if (!allows("src/**")) violations.push(`${role} must allow edit on src/**`);
    if (!allows("tests/**")) violations.push(`${role} must allow edit on tests/**`);
    const forbidden = ["agents/**", "commands/**", "workflows/**", "skills/**"];
    if (hasGlobalEditAllow) {
      warnings.push(`${role} uses edit '*' allow; framework definition deny boundary downgraded to WARN`);
    } else if (forbidden.some((pattern) => allows(pattern))) {
      violations.push(`${role} must not allow edit on framework definition surfaces`);
    }
  } else if (role === "planner" || role === "verifier" || role === "research_executor") {
    if (hasGlobalEditAllow) {
      warnings.push(`${role} uses edit '*' allow; src/tests deny boundary downgraded to WARN`);
    } else if (allows("src/**") || allows("tests/**")) {
      violations.push(`${role} must not allow edit on src/** or tests/**`);
    }
  } else if (role === "investigator") {
    if (!allows(".hivemind/**")) violations.push("investigator must allow edit on .hivemind/**");
    if (hasGlobalEditAllow) {
      warnings.push("investigator uses edit '*' allow; src/tests deny boundary downgraded to WARN");
    } else if (allows("src/**") || allows("tests/**")) {
      violations.push("investigator must not allow edit on src/** or tests/**");
    }
  }

  return { violations, warnings };
}

for (const entry of fs.readdirSync(agentsDir).sort()) {
  if (!entry.endsWith(".md")) continue;
  const rel = `agents/${entry}`;
  const parsed = extractFrontmatter(path.join(agentsDir, entry));
  if (parsed.error) {
    emit("FAIL", `R01b ${rel}: ${parsed.error}`);
    continue;
  }

  const fm = parsed.value;
  const permissionError = validatePermissionSchema(fm.permission);
  if (permissionError) {
    emit("FAIL", `R01b ${rel}: ${permissionError}`);
    continue;
  }
  emit("PASS", `R01b ${rel}: permission schema valid`);

  const role = fm?.identity?.role;
  if (typeof role !== "string" || role.length === 0) {
    emit("FAIL", `R01b ${rel}: missing identity.role`);
    continue;
  }

  const editAllows = getAllowedEditPatterns(fm.permission);
  const boundaryAssessment = roleBoundaryAssessment(role, editAllows);
  for (const warning of boundaryAssessment.warnings) {
    emit("WARN", `R01b ${rel}: ${warning}`);
  }
  if (boundaryAssessment.violations.length === 0) {
    emit("PASS", `R01b ${rel}: role boundary policy valid`);
  } else {
    for (const violation of boundaryAssessment.violations) {
      emit("FAIL", `R01b ${rel}: ${violation}`);
    }
  }
}
NODE
)

# R02: Skill structure
echo "-- R02: Skill Structure --"
for d in skills/*/; do
  [ -d "$d" ] || continue
  skill=$(basename "$d")
  skillFile="${d}SKILL.md"
  if [ ! -f "$skillFile" ]; then
    fail "R02 $skill: missing SKILL.md"
    continue
  fi

  if head -30 "$skillFile" | rg -q "^name:" || rg -q "^# Skill:" "$skillFile"; then
    ok
  else
    fail "R02 $skill: SKILL.md missing name metadata"
  fi
done

# R03: Contracts and registry (Node-powered YAML checks)
echo "-- R03: Contracts + Registry --"
while IFS='|' read -r level message; do
  case "$level" in
    PASS) ok ;;
    WARN) warn "$message" ;;
    FAIL) fail "$message" ;;
  esac
done < <(node - <<'NODE'
const fs = require("node:fs");
const path = require("node:path");
const yaml = require("yaml");

const root = process.cwd();
const strictParity = process.env.VALIDATE_STRICT_PARITY === "1";

const legacyCommandNames = new Set([
  "hivefiver-start",
  "hivefiver-intake",
  "hivefiver-specforge",
  "hivefiver-skillforge",
  "hivefiver-gsd-bridge",
  "hivefiver-ralph-bridge",
  "hivefiver-doctor",
]);

const validBundles = new Set([
  "governance-core",
  "routing-core",
  "planning-core",
  "research-core",
  "verification-core",
  "repair-core",
  "meta-core",
]);
const validDisclosure = new Set(["L0", "L1", "L2", "L3"]);
const validSkillStatus = new Set(["active", "experimental", "deprecated", "merge_candidate"]);
const validKinds = new Set(["router", "alias", "utility"]);

const emit = (level, message) => console.log(`${level}|${message}`);
const read = (p) => fs.readFileSync(p, "utf-8");
const exists = (p) => fs.existsSync(p);

const listFilesRecursive = (dir) => {
  if (!exists(dir)) return [];
  const out = [];
  const stack = [dir];
  while (stack.length > 0) {
    const cur = stack.pop();
    for (const entry of fs.readdirSync(cur, { withFileTypes: true })) {
      const full = path.join(cur, entry.name);
      if (entry.isDirectory()) {
        stack.push(full);
        continue;
      }

      if (entry.isFile()) {
        out.push(full);
        continue;
      }

      if (entry.isSymbolicLink()) {
        try {
          const target = fs.statSync(full);
          if (target.isDirectory()) stack.push(full);
          if (target.isFile()) out.push(full);
        } catch {
          // Ignore broken links in validator traversal.
        }
      }
    }
  }
  return out;
};

const parseFrontmatter = (content) => {
  const m = content.match(/^---\s*\n([\s\S]*?)\n---(?:\s*\n|$)/);
  if (!m) return null;
  try {
    return yaml.parse(m[1]);
  } catch {
    return null;
  }
};

// R03a: skill registry integrity
const registryPath = path.join(root, "skills", "registry.yaml");
if (!exists(registryPath)) {
  emit("FAIL", "R03: missing skills/registry.yaml");
  process.exit(0);
}

let registry;
try {
  registry = yaml.parse(read(registryPath));
} catch (error) {
  emit("FAIL", `R03: cannot parse skills/registry.yaml (${error.message})`);
  process.exit(0);
}

if (registry?.source_of_truth === true) emit("PASS", "R03: skill registry marks root as source_of_truth");
else emit("FAIL", "R03: skills/registry.yaml must set source_of_truth=true");

if (registry?.local_first_resolution === true) emit("PASS", "R03: skill registry enables local_first_resolution");
else emit("FAIL", "R03: skills/registry.yaml must set local_first_resolution=true");

if (Array.isArray(registry?.skills)) emit("PASS", "R03: registry has skills array");
else {
  emit("FAIL", "R03: registry.skills must be an array");
  process.exit(0);
}

const registrySkills = registry.skills;
const registryByName = new Map();
for (const skill of registrySkills) {
  if (!skill?.name || typeof skill.name !== "string") {
    emit("FAIL", "R03: skill entry missing name");
    continue;
  }
  if (registryByName.has(skill.name)) {
    emit("FAIL", `R03: duplicate skill registry entry '${skill.name}'`);
    continue;
  }
  registryByName.set(skill.name, skill);

  if (!validBundles.has(skill.bundle)) {
    emit("FAIL", `R03: skill '${skill.name}' has invalid bundle '${skill.bundle}'`);
  } else {
    emit("PASS", `R03: skill '${skill.name}' bundle valid`);
  }

  if (!validDisclosure.has(skill.disclosure_level)) {
    emit("FAIL", `R03: skill '${skill.name}' has invalid disclosure_level '${skill.disclosure_level}'`);
  } else {
    emit("PASS", `R03: skill '${skill.name}' disclosure level valid`);
  }

  if (!validSkillStatus.has(skill.status)) {
    emit("FAIL", `R03: skill '${skill.name}' has invalid status '${skill.status}'`);
  } else {
    emit("PASS", `R03: skill '${skill.name}' status valid`);
  }

  const delta = Number(skill.knowledge_delta_score);
  if (Number.isNaN(delta) || delta < 0 || delta > 1) {
    emit("FAIL", `R03: skill '${skill.name}' knowledge_delta_score must be 0..1`);
  } else {
    emit("PASS", `R03: skill '${skill.name}' knowledge_delta_score in range`);
    if (skill.status === "active" && delta < 0.4) {
      emit("FAIL", `R03: active skill '${skill.name}' has low knowledge_delta_score=${delta}`);
    }
  }
}

const skillDirs = fs
  .readdirSync(path.join(root, "skills"), { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .sort();

for (const name of skillDirs) {
  if (!registryByName.has(name)) {
    emit("FAIL", `R03: skill dir '${name}' missing from skills/registry.yaml`);
  } else {
    emit("PASS", `R03: skill dir '${name}' present in registry`);
  }
}

for (const [name, meta] of registryByName) {
  if (!skillDirs.includes(name) && meta.status === "active") {
    emit("FAIL", `R03: active skill '${name}' listed in registry but directory is missing`);
  }

  const deps = Array.isArray(meta.depends_on) ? meta.depends_on : [];
  for (const dep of deps) {
    if (!registryByName.has(dep)) {
      emit("FAIL", `R03: skill '${name}' depends_on unknown skill '${dep}'`);
    }
  }
}

// R03b: command contracts + command/skill/template linking
const commandFiles = listFilesRecursive(path.join(root, "commands")).filter((p) => p.endsWith(".md"));
for (const file of commandFiles) {
  const rel = path.relative(root, file).replaceAll("\\", "/");
  const text = read(file);
  const fm = parseFrontmatter(text);
  if (!fm || typeof fm !== "object") {
    emit("FAIL", `R03: ${rel} missing YAML frontmatter`);
    continue;
  }

  const kind = fm.kind;
  if (typeof kind === "string") {
    if (!validKinds.has(kind)) {
      emit("FAIL", `R03: ${rel} has invalid kind '${kind}'`);
    } else {
      emit("PASS", `R03: ${rel} kind valid`);
    }

    const requiredKeys = ["name", "description", "owner_agent", "entry_gate", "chain_group"];
    for (const key of requiredKeys) {
      if (!(key in fm)) emit("FAIL", `R03: ${rel} missing '${key}' in command v2 frontmatter`);
      else emit("PASS", `R03: ${rel} includes '${key}'`);
    }

    if (kind === "alias") {
      if (typeof fm.alias_resolved_to === "string" && fm.alias_resolved_to.length > 0) {
        emit("PASS", `R03: ${rel} alias_resolved_to set`);
      } else {
        emit("FAIL", `R03: ${rel} kind=alias requires alias_resolved_to`);
      }
    } else if (kind === "router") {
      if (typeof fm.execution_context === "string" && fm.execution_context.length > 0) {
        const target = path.join(root, fm.execution_context);
        if (exists(target)) emit("PASS", `R03: ${rel} execution_context exists`);
        else emit("FAIL", `R03: ${rel} execution_context '${fm.execution_context}' not found`);
      } else {
        emit("FAIL", `R03: ${rel} requires execution_context for kind='${kind}'`);
      }
    } else {
      // utility commands can be self-contained and do not require execution_context
      emit("PASS", `R03: ${rel} utility command contract accepted`);
    }
  } else {
    emit("WARN", `R03: ${rel} is legacy contract (no 'kind' field)`);
  }

  const requiredSkills = Array.isArray(fm.required_skills) ? fm.required_skills : [];
  for (const skill of requiredSkills) {
    if (!registryByName.has(skill)) {
      emit("FAIL", `R03: ${rel} required_skill '${skill}' missing from registry`);
    } else {
      emit("PASS", `R03: ${rel} required_skill '${skill}' exists in registry`);
    }
  }

  const requiredTemplates = Array.isArray(fm.required_templates) ? fm.required_templates : [];
  for (const templatePath of requiredTemplates) {
    const target = path.join(root, templatePath);
    if (exists(target)) emit("PASS", `R03: ${rel} required_template '${templatePath}' exists`);
    else emit("FAIL", `R03: ${rel} required_template '${templatePath}' not found`);
  }

  if ("required_references" in fm && !Array.isArray(fm.required_references)) {
    emit("FAIL", `R03: ${rel} required_references must be an array`);
  }

  const requiredReferences = Array.isArray(fm.required_references) ? fm.required_references : [];
  if (kind === "router") {
    for (const referencePath of requiredReferences) {
      if (!String(referencePath).startsWith("references/")) {
        emit("FAIL", `R03: ${rel} required_reference '${referencePath}' must be under references/`);
        continue;
      }
      const target = path.join(root, referencePath);
      if (exists(target)) emit("PASS", `R03: ${rel} required_reference '${referencePath}' exists`);
      else emit("FAIL", `R03: ${rel} required_reference '${referencePath}' not found`);
    }
  }

  if ("required_prompts" in fm && !Array.isArray(fm.required_prompts)) {
    emit("FAIL", `R03: ${rel} required_prompts must be an array`);
  }

  const requiredPrompts = Array.isArray(fm.required_prompts) ? fm.required_prompts : [];
  if (kind === "router") {
    for (const promptPath of requiredPrompts) {
      if (!String(promptPath).startsWith("prompts/")) {
        emit("FAIL", `R03: ${rel} required_prompt '${promptPath}' must be under prompts/`);
        continue;
      }
      const target = path.join(root, promptPath);
      if (exists(target)) emit("PASS", `R03: ${rel} required_prompt '${promptPath}' exists`);
      else emit("FAIL", `R03: ${rel} required_prompt '${promptPath}' not found`);
    }
  }

  const lines = text.split(/\r?\n/).length;
  if (lines > 260) {
    emit("FAIL", `R03: ${rel} exceeds command length budget (${lines} lines)`);
  } else {
    emit("PASS", `R03: ${rel} command length within limit`);
  }
}

// R03c: workflow contracts (enforce v2 on contract_version: 2 files)
const workflowFiles = listFilesRecursive(path.join(root, "workflows")).filter((p) => /\.(yaml|yml|json)$/i.test(p));
for (const file of workflowFiles) {
  const rel = path.relative(root, file).replaceAll("\\", "/");
  let wf;
  try {
    const raw = read(file);
    if (file.endsWith(".json")) wf = JSON.parse(raw);
    else wf = yaml.parse(raw);
  } catch (error) {
    emit("FAIL", `R03: ${rel} cannot be parsed (${error.message})`);
    continue;
  }

  if (wf?.contract_version === 2) {
    const requiredTopLevel = ["name", "target_agent", "steps", "guards"];
    for (const key of requiredTopLevel) {
      if (!(key in wf)) emit("FAIL", `R03: ${rel} missing '${key}' in workflow v2`);
      else emit("PASS", `R03: ${rel} includes '${key}'`);
    }

    if (Array.isArray(wf.steps) && wf.steps.length > 0) {
      emit("PASS", `R03: ${rel} has non-empty steps[]`);
      for (const [index, step] of wf.steps.entries()) {
        const requiredStepKeys = ["name", "tool", "wave", "entry_criteria", "exit_criteria"];
        for (const key of requiredStepKeys) {
          if (!(key in (step ?? {}))) emit("FAIL", `R03: ${rel} step[${index}] missing '${key}'`);
          else emit("PASS", `R03: ${rel} step[${index}] includes '${key}'`);
        }
      }
    } else {
      emit("FAIL", `R03: ${rel} requires non-empty steps[]`);
    }
  } else {
    emit("WARN", `R03: ${rel} is compatibility workflow (non-v2 contract)`);
  }
}

// R03d: profile manifests and legacy split
const profileDir = path.join(root, "modules", "profiles");
const requiredProfiles = ["core", "balanced", "full", "legacy-compat"];
const loadedProfiles = new Map();

for (const profileName of requiredProfiles) {
  const profilePath = path.join(profileDir, `${profileName}.yaml`);
  if (!exists(profilePath)) {
    emit("FAIL", `R03: missing modules/profiles/${profileName}.yaml`);
    continue;
  }

  let profile;
  try {
    profile = yaml.parse(read(profilePath));
  } catch (error) {
    emit("FAIL", `R03: cannot parse modules/profiles/${profileName}.yaml (${error.message})`);
    continue;
  }

  loadedProfiles.set(profileName, profile);
  if (Array.isArray(profile?.groups) && profile.groups.length > 0) emit("PASS", `R03: profile '${profileName}' has groups`);
  else emit("FAIL", `R03: profile '${profileName}' requires non-empty groups`);

  for (const group of profile.groups ?? []) {
    if (["commands", "skills", "agents", "workflows", "templates", "prompts", "references"].includes(group)) {
      emit("PASS", `R03: profile '${profileName}' group '${group}' valid`);
    } else {
      emit("FAIL", `R03: profile '${profileName}' has invalid group '${group}'`);
    }
  }
}

const core = loadedProfiles.get("core");
if (core) {
  if (core.include_legacy === false) emit("PASS", "R03: core profile excludes legacy aliases");
  else emit("FAIL", "R03: core profile must set include_legacy: false");

  if (Array.isArray(core.groups) && !core.groups.includes("prompts")) emit("PASS", "R03: core profile excludes prompts");
  else emit("FAIL", "R03: core profile must exclude prompts for canonical runtime");
}

const legacy = loadedProfiles.get("legacy-compat");
if (legacy) {
  if (legacy.include_legacy === true) emit("PASS", "R03: legacy-compat profile enables legacy aliases");
  else emit("FAIL", "R03: legacy-compat profile must set include_legacy: true");
}

for (const name of legacyCommandNames) {
  const cmdPath = path.join(root, "commands", `${name}.md`);
  if (exists(cmdPath)) emit("PASS", `R03: legacy alias '${name}' exists for compatibility window`);
  else emit("FAIL", `R03: legacy alias '${name}' missing in commands/`);
}

// R03e: module integrity (exclude modules/profiles)
const moduleRoot = path.join(root, "modules");
if (exists(moduleRoot)) {
  const dirs = fs.readdirSync(moduleRoot, { withFileTypes: true }).filter((d) => d.isDirectory() && d.name !== "profiles");
  for (const dir of dirs) {
    const modulePath = path.join(moduleRoot, dir.name, "module.yaml");
    if (exists(modulePath)) emit("PASS", `R03: module '${dir.name}' has module.yaml`);
    else emit("FAIL", `R03: module '${dir.name}' missing module.yaml`);
  }
}

// R03f: scoped parity check for core profile (warn by default, fail when strict)
if (core && exists(path.join(root, ".opencode"))) {
  const groups = Array.isArray(core.groups) ? core.groups : [];
  let mismatches = 0;

  const includeLegacy = core.include_legacy === true;
  for (const group of groups) {
    const srcDir = path.join(root, group);
    const dstDir = path.join(root, ".opencode", group);
    if (!exists(srcDir) || !exists(dstDir)) {
      mismatches++;
      continue;
    }

    const srcFiles = listFilesRecursive(srcDir)
      .map((p) => path.relative(srcDir, p).replaceAll("\\", "/"))
      .filter((rel) => {
        if (group !== "commands" || includeLegacy) return true;
        const base = path.basename(rel, path.extname(rel)).toLowerCase();
        return !legacyCommandNames.has(base);
      })
      .sort();

    const dstFiles = listFilesRecursive(dstDir)
      .map((p) => path.relative(dstDir, p).replaceAll("\\", "/"))
      .filter((rel) => {
        if (group !== "commands" || includeLegacy) return true;
        const base = path.basename(rel, path.extname(rel)).toLowerCase();
        return !legacyCommandNames.has(base);
      })
      .sort();

    const srcSet = new Set(srcFiles);
    const dstSet = new Set(dstFiles);

    for (const rel of srcFiles) {
      const srcPath = path.join(srcDir, rel);
      const dstPath = path.join(dstDir, rel);
      if (!dstSet.has(rel) || !exists(dstPath)) {
        mismatches++;
        continue;
      }
      const srcBuf = fs.readFileSync(srcPath);
      const dstBuf = fs.readFileSync(dstPath);
      if (!srcBuf.equals(dstBuf)) mismatches++;
    }

    for (const rel of dstFiles) {
      if (!srcSet.has(rel)) mismatches++;
    }
  }

  if (mismatches === 0) {
    emit("PASS", "R03: core profile parity clean between root and .opencode");
  } else if (strictParity) {
    emit("FAIL", `R03: strict core parity failed (${mismatches} mismatches)`);
  } else {
    emit("WARN", `R03: core parity drift detected (${mismatches} mismatches); run sync-assets --profile core --overwrite`);
  }
}
NODE
)

# R04: No date-stamped asset names
echo "-- R04: No Date-Stamps --"
found=0
for dir in agents commands workflows skills templates prompts scripts references bridges modules; do
  if [ -d "$dir" ]; then
    matches=$(find "$dir" -maxdepth 3 -name "*[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]*" 2>/dev/null | wc -l | tr -d ' ')
    if [ "$matches" -gt 0 ]; then
      fail "R04: $matches date-stamped files in $dir/"
      found=1
    fi
  fi
done
if [ "$found" -eq 0 ]; then ok; fi

# R05: Bridge pack integrity
echo "-- R05: Bridge Packs --"
if [ -d "bridges" ]; then
  for d in bridges/*/; do
    [ -d "$d" ] || continue
    pack=$(basename "$d")
    if [ -f "${d}pack.yaml" ]; then
      ok
    else
      fail "R05 $pack: missing pack.yaml"
    fi
  done
else
  warn "R05: bridges/ directory missing"
fi

# R06: LOC limits (exclude vendored/runtime trees)
echo "-- R06: Source LOC Limits --"
if [ -d "src" ]; then
  LOC_THRESHOLD=1200
  loc_output="$(find src -type f -name "*.ts" \
    -not -path "*/node_modules/*" \
    -not -path "src/dashboard-v2/*" \
    -not -path "*/dist/*" \
    -exec wc -l {} \; 2>/dev/null | awk -v max="$LOC_THRESHOLD" '$1 > max {print $2":"$1}')"

  if [ -n "$loc_output" ]; then
    while IFS= read -r v; do
      [ -n "$v" ] || continue
      fail "R06 $v LOC"
    done <<EOF
$loc_output
EOF
  else
    ok
  fi
fi

echo ""
echo "=== RESULTS ==="
echo "PASS: $PASS"
echo "FAIL: $FAIL"
echo "WARN: $WARN"

if [ "$FAIL" -eq 0 ]; then
  echo "Framework validation PASSED"
  exit 0
else
  echo "Framework validation FAILED ($FAIL failures)"
  exit 1
fi
