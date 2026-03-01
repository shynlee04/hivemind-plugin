#!/usr/bin/env node
/**
 * HiveMind Tools — CLI utility for HiveMind framework operations
 *
 * Centralizes: state management, agent operations, SOT management,
 * frontmatter CRUD, validation, and delegation verification.
 *
 * Usage: node hivemind-tools.cjs <command> [args] [--raw]
 *
 * Atomic Commands:
 *   state load                         Load project state from .hivemind/
 *   state json                         Output brain.json as formatted JSON
 *   state get [section]                Get STATE.md content or section
 *   state update <field> <value>       Update a STATE.md field
 *   state patch --field val ...        Batch update STATE.md fields
 *
 *   agent list                         List all agent profiles with health
 *   agent validate <name>              Validate agent profile against schema
 *   agent scaffold <name> [opts]       Generate agent profile from template
 *   agent diff                         Compare .opencode/agents/ vs agents/
 *   agent sync                         Sync .opencode/agents/ → agents/
 *
 *   hierarchy read                     Read hierarchy.json as tree
 *   hierarchy navigate <path>          Navigate to specific node
 *   hierarchy stats                    Show hierarchy statistics
 *
 *   session info                       Current session info from brain.json
 *   session list                       List all sessions
 *   session export <id> [format]       Export session content
 *
 *   artifact register <path>           Register SOT artifact
 *   artifact validate <path>           Validate artifact structure
 *   artifact chain <from> <to>         Create dependency chain
 *
 *   commit <message> [--scope <agent>] Commit with agent-scoped prefix
 *
 * Compound Commands:
 *   init planning <trajectory>         Context for planning workflow
 *   init execution <tactic>            Context for execution workflow
 *   init investigation <query>         Context for investigation workflow
 *   init audit <scope>                 Context for audit workflow
 *   init delegation <target> <packet>  Context for delegation workflow
 *
 * Validation Suite:
 *   verify agent-contracts             Check all agent profiles
 *   verify delegation-chains           Trace delegation paths
 *   verify parity                      Compare .opencode/ vs root
 *   verify sot-integrity               Check SOT document chains
 *   verify todo-sync                   Check TODO vs hierarchy sync
 *   verify quality [stage]             Run quality checks for stage
 *
 * Frontmatter CRUD:
 *   frontmatter get <file> [--field k] Extract frontmatter as JSON
 *   frontmatter set <file> --field k   Update single frontmatter field
 *     --value jsonVal
 *   frontmatter validate <file>        Validate required fields
 *     --schema agent|command|workflow
 *
 * SOT Operations:
 *   sot register <path>                Register artifact in SOT
 *   sot chain <from> <to>              Create dependency link
 *   sot trigger <event>                Trigger artifact update chain
 *   sot index [--rebuild]              Build/rebuild search index
 *   sot search <query>                 Search across all SOT docs
 *   sot hierarchy <path>               Show document hierarchy
 *
 * Pipeline:
 *   pipeline status                    Show pipeline state
 *   pipeline advance                   Advance to next stage
 *   pipeline sequence <intent>         Get stage sequence for intent
 *
 * Progress:
 *   progress [json|table|bar]          Render progress
 */

"use strict";

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// ─── Configuration ───────────────────────────────────────────────────
const CWD = process.cwd();
const HIVEMIND_DIR = path.join(CWD, ".hivemind");
const OPENCODE_DIR = path.join(CWD, ".opencode");
const AGENTS_OC = path.join(OPENCODE_DIR, "agents");
const AGENTS_ROOT = path.join(CWD, "agents");
const STATE_DIR = path.join(HIVEMIND_DIR, "state");
const BRAIN_PATH = path.join(STATE_DIR, "brain.json");
const HIERARCHY_PATH = path.join(STATE_DIR, "hierarchy.json");
const SOT_DIR = path.join(HIVEMIND_DIR, "sot");

const args = process.argv.slice(2);
const raw = args.includes("--raw");
const cleanArgs = args.filter((a) => a !== "--raw");

// ─── Helpers ─────────────────────────────────────────────────────────

function out(data) {
  if (typeof data === "string") {
    process.stdout.write(data + "\n");
  } else {
    process.stdout.write(JSON.stringify(data, null, raw ? 0 : 2) + "\n");
  }
}

function err(msg) {
  process.stderr.write(`ERROR: ${msg}\n`);
  process.exit(1);
}

function readJSON(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

function writeJSON(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n");
}

function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch {
    return null;
  }
}

function fileExists(filePath) {
  return fs.existsSync(filePath);
}

// ─── Frontmatter Parser ─────────────────────────────────────────────

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return { frontmatter: {}, body: content };

  const fmLines = match[1].split("\n");
  const fm = {};
  let currentKey = null;
  let currentIndent = 0;

  for (const line of fmLines) {
    const simpleMatch = line.match(/^(\w[\w_-]*)\s*:\s*(.+)$/);
    if (simpleMatch) {
      const [, key, val] = simpleMatch;
      // Handle inline arrays
      if (val.startsWith("[")) {
        try {
          fm[key] = JSON.parse(val.replace(/'/g, '"'));
        } catch {
          fm[key] = val;
        }
      } else if (val === "true") {
        fm[key] = true;
      } else if (val === "false") {
        fm[key] = false;
      } else if (/^\d+$/.test(val)) {
        fm[key] = parseInt(val);
      } else {
        fm[key] = val.replace(/^["']|["']$/g, "");
      }
      currentKey = key;
    } else if (line.match(/^(\w[\w_-]*)\s*:$/)) {
      const [, key] = line.match(/^(\w[\w_-]*)\s*:$/);
      fm[key] = {};
      currentKey = key;
    } else if (line.match(/^\s+-\s+(.+)$/)) {
      const [, val] = line.match(/^\s+-\s+(.+)$/);
      if (currentKey && !Array.isArray(fm[currentKey])) {
        fm[currentKey] = [];
      }
      if (currentKey) {
        fm[currentKey].push(val);
      }
    }
  }

  const body = content.slice(match[0].length).trim();
  return { frontmatter: fm, body };
}

function serializeFrontmatter(fm) {
  let result = "---\n";
  for (const [key, val] of Object.entries(fm)) {
    if (Array.isArray(val)) {
      result += `${key}:\n`;
      for (const item of val) {
        result += `  - ${item}\n`;
      }
    } else if (typeof val === "object" && val !== null) {
      result += `${key}:\n`;
      for (const [k, v] of Object.entries(val)) {
        result += `  ${k}: ${v}\n`;
      }
    } else {
      result += `${key}: ${val}\n`;
    }
  }
  result += "---";
  return result;
}

// ─── Agent Operations ────────────────────────────────────────────────

const agentOps = {
  list() {
    const agents = [];
    if (!fileExists(AGENTS_OC)) err("No .opencode/agents/ directory found");

    for (const file of fs.readdirSync(AGENTS_OC).filter((f) => f.endsWith(".md"))) {
      const content = readFile(path.join(AGENTS_OC, file));
      const { frontmatter: fm } = parseFrontmatter(content);
      const name = fm.name || file.replace(".md", "");
      const canDelegate = fm.delegation_policy?.can_delegate || false;
      const targets = fm.delegation_policy?.delegate_targets || [];
      const mode = fm.mode || "unknown";
      const role = fm.identity?.role || "unknown";

      // Check root parity
      const rootFile = path.join(AGENTS_ROOT, file);
      const inSync = fileExists(rootFile);

      agents.push({
        name,
        mode,
        role,
        can_delegate: canDelegate,
        delegate_targets: targets,
        parity: inSync ? "synced" : "MISSING",
        file,
      });
    }

    out({ agents, total: agents.length, timestamp: new Date().toISOString() });
  },

  validate(agentName) {
    if (!agentName) err("Usage: agent validate <name>");
    const filePath = path.join(AGENTS_OC, `${agentName}.md`);
    if (!fileExists(filePath)) err(`Agent not found: ${agentName}`);

    const content = readFile(filePath);
    const { frontmatter: fm } = parseFrontmatter(content);
    const issues = [];

    // Required fields
    const required = ["name", "description", "mode"];
    for (const field of required) {
      if (!fm[field]) issues.push({ severity: "critical", field, message: `Missing required field: ${field}` });
    }

    // Delegation policy
    if (!fm.delegation_policy) {
      issues.push({ severity: "high", field: "delegation_policy", message: "Missing delegation_policy" });
    } else {
      if (fm.delegation_policy.can_delegate && (!fm.delegation_policy.delegate_targets || fm.delegation_policy.delegate_targets.length === 0)) {
        issues.push({ severity: "high", field: "delegation_policy.delegate_targets", message: "can_delegate=true but no targets defined" });
      }
      // Validate targets exist
      if (fm.delegation_policy.delegate_targets) {
        for (const target of fm.delegation_policy.delegate_targets) {
          if (!fileExists(path.join(AGENTS_OC, `${target}.md`))) {
            issues.push({ severity: "critical", field: "delegate_targets", message: `Target agent not found: ${target}` });
          }
        }
      }
    }

    // Scope paths
    if (!fm.scope_paths) {
      issues.push({ severity: "medium", field: "scope_paths", message: "Missing scope_paths" });
    }

    // Identity
    if (!fm.identity?.role) {
      issues.push({ severity: "medium", field: "identity.role", message: "Missing identity.role" });
    }

    out({
      agent: agentName,
      valid: issues.filter((i) => i.severity === "critical").length === 0,
      issues,
      total_issues: issues.length,
    });
  },

  scaffold(name, opts) {
    if (!name) err("Usage: agent scaffold <name> [--mode subagent] [--role executor] [--delegates-to x,y]");

    const mode = getFlag(opts, "--mode") || "subagent";
    const role = getFlag(opts, "--role") || "executor";
    const delegatesTo = getFlag(opts, "--delegates-to");
    const delegatedBy = getFlag(opts, "--delegated-by");
    const scopeIn = getFlag(opts, "--scope-in") || "src/**,tests/**";
    const scopeOut = getFlag(opts, "--scope-out") || "agents/**,commands/**";

    const targets = delegatesTo ? delegatesTo.split(",").map((s) => s.trim()) : [];
    const canDelegate = targets.length > 0;

    const profile = `---
name: ${name}
description: "[TODO: Add description for ${name}]"
tasks:${targets.length > 0 ? "\n" + targets.map((t) => `  ${t}: allow`).join("\n") : " {}"}
workflows: []
prompts:
  - compliance-rules
mode: ${mode}
tools:
  read: true
  glob: true
  grep: true
  bash: true
  skill: true
  write: true
  edit: true
  todoread: true
  todowrite: true
  scan_hierarchy: true
  think_back: true
  save_mem: true
  recall_mems: true
  hivemind_cycle: true
  hivemind_inspect: true
  hivemind_session: true
permission:
  read: allow
  bash: allow
  skill: allow
  todoread: allow
  todowrite: allow
  edit:
    "*": allow
${scopeIn.split(",").map((p) => `    ${p.trim()}: allow`).join("\n")}
identity:
  role: ${role}
allowed_tools:
  - read
  - glob
  - grep
  - bash
  - skill
  - write
  - edit
  - hivemind_cycle
scope_paths:
  allow:
${scopeIn.split(",").map((p) => `    - ${p.trim()}`).join("\n")}
  forbidden:
${scopeOut.split(",").map((p) => `    - ${p.trim()}`).join("\n")}
delegation_policy:
  can_delegate: ${canDelegate}
  delegate_targets:${targets.length > 0 ? "\n" + targets.map((t) => `    - ${t}`).join("\n") : " []"}
  max_delegation_depth: ${canDelegate ? 1 : 0}
  recursive_delegation: false
verification_obligations:
  - Run required checks before completion claim.
  - Return changed files and verification evidence.
  - Use export_cycle for cycle intelligence.
---

# ${name.charAt(0).toUpperCase() + name.slice(1)} \u2014 ${role.charAt(0).toUpperCase() + role.slice(1)} Agent

> **Domain**: [TODO]
> **Function**: [TODO]
> **Scope**: ${scopeIn}

## Purpose

[TODO: Describe agent purpose]

---

## Core Responsibilities

| Responsibility | Description | Output |
|----------------|-------------|--------|
| **[TODO]** | [TODO] | [TODO] |

---

## Delegation Policy

${canDelegate ? `**Level 3 delegation enabled.** ${name} can dispatch subtasks to: ${targets.join(", ")}.

### Can Delegate To:

| Target Agent | Purpose | Packet Must Include |
|-------------|---------|---------------------|
${targets.map((t) => `| **${t}** | [TODO] | [TODO] |`).join("\n")}

### Delegation Constraints:
- **Max depth**: 1 level only
- **No recursive delegation**: Subagents cannot re-delegate
- **Return required**: Every delegation must have return_schema defined`
: `**Terminal agent** \u2014 cannot delegate to other agents.`}

### Is Delegated By:
${delegatedBy ? delegatedBy.split(",").map((a) => `- **${a.trim()}**`).join("\n") : "- **hiveminder** \u2014 Primary delegator"}

---

## Verification Obligations

1. Run required checks before completion claim
2. Return changed files and verification evidence
3. Use export_cycle for cycle intelligence

---
`;

    const outPath = path.join(AGENTS_OC, `${name}.md`);
    if (fileExists(outPath)) err(`Agent already exists: ${name}. Use 'agent validate' to check.`);

    fs.writeFileSync(outPath, profile);
    // Also sync to root
    fs.writeFileSync(path.join(AGENTS_ROOT, `${name}.md`), profile);

    out({ created: true, agent: name, path: outPath, parity: "synced" });
  },

  diff() {
    const ocFiles = new Set(fs.readdirSync(AGENTS_OC).filter((f) => f.endsWith(".md")));
    const rootFiles = new Set(fileExists(AGENTS_ROOT) ? fs.readdirSync(AGENTS_ROOT).filter((f) => f.endsWith(".md")) : []);

    const results = { in_sync: [], diverged: [], missing_root: [], missing_opencode: [] };

    for (const file of ocFiles) {
      if (!rootFiles.has(file)) {
        results.missing_root.push(file);
      } else {
        const oc = readFile(path.join(AGENTS_OC, file));
        const root = readFile(path.join(AGENTS_ROOT, file));
        if (oc === root) {
          results.in_sync.push(file);
        } else {
          results.diverged.push(file);
        }
      }
    }
    for (const file of rootFiles) {
      if (!ocFiles.has(file)) results.missing_opencode.push(file);
    }

    out(results);
  },

  sync() {
    const files = fs.readdirSync(AGENTS_OC).filter((f) => f.endsWith(".md"));
    fs.mkdirSync(AGENTS_ROOT, { recursive: true });
    let synced = 0;
    for (const file of files) {
      const src = path.join(AGENTS_OC, file);
      const dst = path.join(AGENTS_ROOT, file);
      fs.copyFileSync(src, dst);
      synced++;
    }
    out({ synced, files: files.length, timestamp: new Date().toISOString() });
  },
};

// ─── State Operations ────────────────────────────────────────────────

const stateOps = {
  load() {
    const brain = readJSON(BRAIN_PATH);
    const hierarchy = readJSON(HIERARCHY_PATH);
    if (!brain && !hierarchy) err("No .hivemind/state/ found. Initialize with declare_intent first.");
    out({ brain, hierarchy_root: hierarchy?.root?.content || "none", timestamp: new Date().toISOString() });
  },

  json() {
    const brain = readJSON(BRAIN_PATH);
    if (!brain) err("No brain.json found");
    out(brain);
  },

  get(section) {
    // Look for STATE.md in hivefiver module
    const statePaths = [
      path.join(HIVEMIND_DIR, "hive-modules", "hivefiver-v2", "STATE.md"),
      path.join(HIVEMIND_DIR, "state", "STATE.md"),
      path.join(CWD, ".planning", "STATE.md"),
    ];

    let stateContent = null;
    for (const p of statePaths) {
      stateContent = readFile(p);
      if (stateContent) break;
    }
    if (!stateContent) err("No STATE.md found");

    if (section) {
      // Extract section by heading
      const regex = new RegExp(`## ${section}[\\s\\S]*?(?=\\n## |$)`, "i");
      const match = stateContent.match(regex);
      if (match) out(match[0]);
      else err(`Section not found: ${section}`);
    } else {
      out(stateContent);
    }
  },

  update(field, value) {
    if (!field || !value) err("Usage: state update <field> <value>");

    const statePath = path.join(HIVEMIND_DIR, "hive-modules", "hivefiver-v2", "STATE.md");
    let content = readFile(statePath);
    if (!content) err("STATE.md not found");

    // Update machine-parseable table
    const regex = new RegExp(`(\\| ${field} \\| ).*?( \\|)`, "g");
    if (regex.test(content)) {
      content = content.replace(regex, `$1${value}$2`);
      fs.writeFileSync(statePath, content);
      out({ updated: true, field, value });
    } else {
      err(`Field not found in Pipeline State table: ${field}`);
    }
  },
};

// ─── Verify Operations ──────────────────────────────────────────────

const verifyOps = {
  "agent-contracts"() {
    const results = { passed: [], failed: [], total: 0 };
    const agents = fs.readdirSync(AGENTS_OC).filter((f) => f.endsWith(".md"));

    for (const file of agents) {
      const content = readFile(path.join(AGENTS_OC, file));
      const { frontmatter: fm } = parseFrontmatter(content);
      const issues = [];

      if (!fm.name) issues.push("missing name");
      if (!fm.description) issues.push("missing description");
      if (!fm.mode) issues.push("missing mode");
      if (!fm.delegation_policy) issues.push("missing delegation_policy");

      // Check delegation consistency
      if (fm.delegation_policy?.can_delegate && fm.tasks && Object.keys(fm.tasks).length === 0) {
        issues.push("can_delegate=true but tasks is empty");
      }
      if (!fm.delegation_policy?.can_delegate && fm.tasks && Object.keys(fm.tasks).length > 0) {
        issues.push("can_delegate=false but tasks has entries");
      }

      // Check for wildcard anti-patterns
      if (fm.tasks && fm.tasks["*"] === "allow") {
        issues.push("G-01: wildcard task delegation");
      }
      if (fm.permission?.bash === "allow" && !fm.permission?.bash?.["*"]) {
        // Fine — bash: allow is acceptable
      }

      results.total++;
      if (issues.length > 0) {
        results.failed.push({ agent: file, issues });
      } else {
        results.passed.push(file);
      }
    }

    out(results);
  },

  "delegation-chains"() {
    const agents = {};
    const files = fs.readdirSync(AGENTS_OC).filter((f) => f.endsWith(".md"));

    for (const file of files) {
      const content = readFile(path.join(AGENTS_OC, file));
      const { frontmatter: fm } = parseFrontmatter(content);
      const name = fm.name || file.replace(".md", "");
      agents[name] = {
        can_delegate: fm.delegation_policy?.can_delegate || false,
        targets: fm.delegation_policy?.delegate_targets || [],
        mode: fm.mode,
      };
    }

    // Trace all paths
    const chains = [];
    const level1 = Object.entries(agents).filter(([, a]) => a.mode === "primary" && a.can_delegate);

    for (const [l1Name, l1Agent] of level1) {
      for (const l2Target of l1Agent.targets) {
        const l2Agent = agents[l2Target];
        if (!l2Agent) {
          chains.push({ path: `user → ${l1Name} → ${l2Target}`, depth: 2, status: "BROKEN", reason: "target not found" });
          continue;
        }

        chains.push({ path: `user → ${l1Name} → ${l2Target}`, depth: 2, status: "OK" });

        if (l2Agent.can_delegate) {
          for (const l3Target of l2Agent.targets) {
            const l3Agent = agents[l3Target];
            if (!l3Agent) {
              chains.push({ path: `user → ${l1Name} → ${l2Target} → ${l3Target}`, depth: 3, status: "BROKEN", reason: "target not found" });
            } else {
              chains.push({ path: `user → ${l1Name} → ${l2Target} → ${l3Target}`, depth: 3, status: "OK" });
            }
          }
        }
      }
    }

    out({
      chains,
      max_depth: Math.max(...chains.map((c) => c.depth)),
      broken: chains.filter((c) => c.status === "BROKEN").length,
      total: chains.length,
    });
  },

  parity() {
    const ocFiles = fs.readdirSync(AGENTS_OC).filter((f) => f.endsWith(".md"));
    const results = { synced: [], diverged: [], missing: [] };

    for (const file of ocFiles) {
      const rootPath = path.join(AGENTS_ROOT, file);
      if (!fileExists(rootPath)) {
        results.missing.push(file);
      } else {
        const oc = readFile(path.join(AGENTS_OC, file));
        const root = readFile(rootPath);
        if (oc === root) results.synced.push(file);
        else results.diverged.push(file);
      }
    }

    out(results);
  },

  quality(stage) {
    // Run the existing quality-check.sh if available
    const qcScript = path.join(OPENCODE_DIR, "skills", "hivefiver-coordination", "scripts", "quality-check.sh");
    if (fileExists(qcScript)) {
      try {
        const result = execSync(`bash "${qcScript}" ${stage || "start"} "${CWD}"`, { encoding: "utf8", timeout: 30000 });
        out(result);
      } catch (e) {
        out({ error: e.message, stdout: e.stdout, stderr: e.stderr });
      }
    } else {
      err("quality-check.sh not found at " + qcScript);
    }
  },
};

// ─── SOT Operations ─────────────────────────────────────────────────

const sotOps = {
  register(artifactPath) {
    if (!artifactPath) err("Usage: sot register <path>");
    if (!fileExists(artifactPath)) err(`File not found: ${artifactPath}`);

    const registryPath = path.join(SOT_DIR, "registry.json");
    fs.mkdirSync(SOT_DIR, { recursive: true });
    const registry = readJSON(registryPath) || { artifacts: [], chains: [], triggers: [] };

    // Check for duplicates
    const absPath = path.resolve(artifactPath);
    const relPath = path.relative(CWD, absPath);
    if (registry.artifacts.find((a) => a.path === relPath)) {
      out({ registered: false, reason: "already registered", path: relPath });
      return;
    }

    // Read frontmatter for metadata
    const content = readFile(absPath);
    const { frontmatter: fm } = parseFrontmatter(content || "");
    const lines = (content || "").split("\n").length;

    // Extract headings for hierarchy
    const headings = (content || "").match(/^#{1,3}\s+.+$/gm) || [];

    registry.artifacts.push({
      path: relPath,
      title: fm.title || headings[0]?.replace(/^#+\s+/, "") || path.basename(relPath),
      type: fm.type || "document",
      lines,
      headings: headings.length,
      registered_at: new Date().toISOString(),
      last_verified: new Date().toISOString(),
      stale: false,
    });

    writeJSON(registryPath, registry);
    out({ registered: true, path: relPath, headings: headings.length, lines });
  },

  chain(from, to) {
    if (!from || !to) err("Usage: sot chain <from-path> <to-path>");
    const registryPath = path.join(SOT_DIR, "registry.json");
    const registry = readJSON(registryPath) || { artifacts: [], chains: [], triggers: [] };

    registry.chains.push({
      from: path.relative(CWD, path.resolve(from)),
      to: path.relative(CWD, path.resolve(to)),
      type: "depends_on",
      created_at: new Date().toISOString(),
    });

    writeJSON(registryPath, registry);
    out({ chained: true, from, to });
  },

  trigger(event) {
    if (!event) err("Usage: sot trigger <event>");
    const registryPath = path.join(SOT_DIR, "registry.json");
    const registry = readJSON(registryPath);
    if (!registry) err("No SOT registry found. Run 'sot register' first.");

    // Find chains affected by this event/path
    const affected = registry.chains
      .filter((c) => c.from === event || c.from.includes(event))
      .map((c) => c.to);

    // Mark downstream as stale
    let staled = 0;
    for (const artifactPath of affected) {
      const artifact = registry.artifacts.find((a) => a.path === artifactPath);
      if (artifact) {
        artifact.stale = true;
        artifact.stale_since = new Date().toISOString();
        artifact.stale_reason = `Upstream changed: ${event}`;
        staled++;
      }
    }

    writeJSON(registryPath, registry);
    out({ triggered: true, event, affected: affected.length, staled });
  },

  index(rebuild) {
    const registryPath = path.join(SOT_DIR, "registry.json");
    const registry = readJSON(registryPath) || { artifacts: [] };
    const indexDir = path.join(SOT_DIR, "index");
    fs.mkdirSync(indexDir, { recursive: true });

    // Build domain index
    const byDomain = {};
    const byAgent = {};
    const byFreshness = [];

    for (const artifact of registry.artifacts) {
      // Determine domain from path
      const domain = artifact.path.split("/")[0] || "root";
      if (!byDomain[domain]) byDomain[domain] = [];
      byDomain[domain].push(artifact.path);

      // Determine agent from frontmatter
      const agent = artifact.owner_agent || "unassigned";
      if (!byAgent[agent]) byAgent[agent] = [];
      byAgent[agent].push(artifact.path);

      byFreshness.push({ path: artifact.path, stale: artifact.stale || false, last_verified: artifact.last_verified });
    }

    byFreshness.sort((a, b) => (a.last_verified > b.last_verified ? -1 : 1));

    writeJSON(path.join(indexDir, "by-domain.json"), byDomain);
    writeJSON(path.join(indexDir, "by-agent.json"), byAgent);
    writeJSON(path.join(indexDir, "by-freshness.json"), byFreshness);

    out({ indexed: true, artifacts: registry.artifacts.length, domains: Object.keys(byDomain).length });
  },

  search(query) {
    if (!query) err("Usage: sot search <query>");
    const registryPath = path.join(SOT_DIR, "registry.json");
    const registry = readJSON(registryPath);
    if (!registry) err("No SOT registry. Run 'sot register' first.");

    const queryLower = query.toLowerCase();
    const results = [];

    for (const artifact of registry.artifacts) {
      const content = readFile(path.join(CWD, artifact.path));
      if (!content) continue;

      const lines = content.split("\n");
      const matches = [];
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].toLowerCase().includes(queryLower)) {
          matches.push({ line: i + 1, text: lines[i].trim().substring(0, 120) });
        }
      }

      if (matches.length > 0) {
        results.push({
          path: artifact.path,
          title: artifact.title,
          matches: matches.length,
          stale: artifact.stale || false,
          top_matches: matches.slice(0, 5),
        });
      }
    }

    results.sort((a, b) => b.matches - a.matches);
    out({ query, results, total: results.length });
  },

  hierarchy(docPath) {
    if (!docPath) err("Usage: sot hierarchy <path>");
    const content = readFile(docPath);
    if (!content) err(`File not found: ${docPath}`);

    const headings = [];
    const lines = content.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const match = lines[i].match(/^(#{1,6})\s+(.+)$/);
      if (match) {
        headings.push({
          level: match[1].length,
          text: match[2],
          line: i + 1,
        });
      }
    }

    out({ path: docPath, headings, total: headings.length });
  },
};

// ─── Pipeline Operations ─────────────────────────────────────────────

const pipelineOps = {
  status() {
    try {
      const result = execSync(`bash "${path.join(OPENCODE_DIR, "skills", "hivefiver-coordination", "scripts", "state-update.sh")}" read "${CWD}"`, {
        encoding: "utf8",
        timeout: 10000,
      });
      out(JSON.parse(result));
    } catch {
      out({ pipeline_active: false, error: "Could not read pipeline state" });
    }
  },

  advance() {
    try {
      const result = execSync(
        `bash "${path.join(OPENCODE_DIR, "skills", "hivefiver-coordination", "scripts", "pipeline-orchestrator.sh")}" advance "${CWD}"`,
        { encoding: "utf8", timeout: 10000 }
      );
      out(result);
    } catch (e) {
      out({ error: e.message });
    }
  },

  sequence(intent) {
    if (!intent) err("Usage: pipeline sequence <intent>");
    const sequences = {
      build_new: ["start", "intake", "spec", "architect", "build"],
      fix_broken: ["doctor"],
      audit_health: ["audit"],
      extend: ["spec", "architect", "build"],
      improve: ["audit", "build"],
      learn: ["start"],
    };

    const seq = sequences[intent];
    if (!seq) err(`Unknown intent: ${intent}. Options: ${Object.keys(sequences).join(", ")}`);
    out({ intent, sequence: seq, stages: seq.length });
  },
};

// ─── Frontmatter CRUD ────────────────────────────────────────────────

const frontmatterOps = {
  get(file, field) {
    if (!file) err("Usage: frontmatter get <file> [--field key]");
    const content = readFile(file);
    if (!content) err(`File not found: ${file}`);

    const { frontmatter: fm } = parseFrontmatter(content);
    if (field) {
      out(fm[field] !== undefined ? fm[field] : null);
    } else {
      out(fm);
    }
  },

  set(file, field, value) {
    if (!file || !field || value === undefined) err("Usage: frontmatter set <file> --field key --value val");
    const content = readFile(file);
    if (!content) err(`File not found: ${file}`);

    const { frontmatter: fm, body } = parseFrontmatter(content);
    try {
      fm[field] = JSON.parse(value);
    } catch {
      fm[field] = value;
    }

    fs.writeFileSync(file, serializeFrontmatter(fm) + "\n\n" + body);
    out({ updated: true, field, value: fm[field] });
  },

  validate(file, schema) {
    if (!file) err("Usage: frontmatter validate <file> --schema <type>");
    const content = readFile(file);
    if (!content) err(`File not found: ${file}`);

    const { frontmatter: fm } = parseFrontmatter(content);
    const schemas = {
      agent: ["name", "description", "mode", "delegation_policy"],
      command: ["name", "description"],
      workflow: ["name", "description"],
    };

    const required = schemas[schema || "agent"] || schemas.agent;
    const missing = required.filter((f) => !fm[f]);

    out({
      file,
      schema: schema || "agent",
      valid: missing.length === 0,
      missing,
      fields_found: Object.keys(fm),
    });
  },
};

// ─── Flag Parser ─────────────────────────────────────────────────────

function getFlag(args, flag) {
  const idx = args.indexOf(flag);
  if (idx === -1) return null;
  return args[idx + 1] || null;
}

// ─── Router ──────────────────────────────────────────────────────────

const command = cleanArgs[0];
const subcommand = cleanArgs[1];
const restArgs = cleanArgs.slice(2);

switch (command) {
  // State operations
  case "state":
    switch (subcommand) {
      case "load":
        stateOps.load();
        break;
      case "json":
        stateOps.json();
        break;
      case "get":
        stateOps.get(restArgs[0]);
        break;
      case "update":
        stateOps.update(restArgs[0], restArgs[1]);
        break;
      default:
        err(`Unknown state command: ${subcommand}. Options: load, json, get, update`);
    }
    break;

  // Agent operations
  case "agent":
    switch (subcommand) {
      case "list":
        agentOps.list();
        break;
      case "validate":
        agentOps.validate(restArgs[0]);
        break;
      case "scaffold":
        agentOps.scaffold(restArgs[0], restArgs.slice(1));
        break;
      case "diff":
        agentOps.diff();
        break;
      case "sync":
        agentOps.sync();
        break;
      default:
        err(`Unknown agent command: ${subcommand}. Options: list, validate, scaffold, diff, sync`);
    }
    break;

  // Verify operations
  case "verify":
    switch (subcommand) {
      case "agent-contracts":
        verifyOps["agent-contracts"]();
        break;
      case "delegation-chains":
        verifyOps["delegation-chains"]();
        break;
      case "parity":
        verifyOps.parity();
        break;
      case "quality":
        verifyOps.quality(restArgs[0]);
        break;
      default:
        err(`Unknown verify command: ${subcommand}. Options: agent-contracts, delegation-chains, parity, quality`);
    }
    break;

  // SOT operations
  case "sot":
    switch (subcommand) {
      case "register":
        sotOps.register(restArgs[0]);
        break;
      case "chain":
        sotOps.chain(restArgs[0], restArgs[1]);
        break;
      case "trigger":
        sotOps.trigger(restArgs[0]);
        break;
      case "index":
        sotOps.index(restArgs.includes("--rebuild"));
        break;
      case "search":
        sotOps.search(restArgs.join(" "));
        break;
      case "hierarchy":
        sotOps.hierarchy(restArgs[0]);
        break;
      default:
        err(`Unknown sot command: ${subcommand}. Options: register, chain, trigger, index, search, hierarchy`);
    }
    break;

  // Pipeline operations
  case "pipeline":
    switch (subcommand) {
      case "status":
        pipelineOps.status();
        break;
      case "advance":
        pipelineOps.advance();
        break;
      case "sequence":
        pipelineOps.sequence(restArgs[0]);
        break;
      default:
        err(`Unknown pipeline command: ${subcommand}. Options: status, advance, sequence`);
    }
    break;

  // Frontmatter CRUD
  case "frontmatter":
    switch (subcommand) {
      case "get":
        frontmatterOps.get(restArgs[0], getFlag(restArgs, "--field"));
        break;
      case "set":
        frontmatterOps.set(restArgs[0], getFlag(restArgs, "--field"), getFlag(restArgs, "--value"));
        break;
      case "validate":
        frontmatterOps.validate(restArgs[0], getFlag(restArgs, "--schema"));
        break;
      default:
        err(`Unknown frontmatter command: ${subcommand}. Options: get, set, validate`);
    }
    break;

  // Help
  case "help":
  case undefined:
    out(`HiveMind Tools — CLI utility for HiveMind framework operations

Commands:
  state load|json|get|update          State management
  agent list|validate|scaffold|diff|sync  Agent operations
  verify agent-contracts|delegation-chains|parity|quality  Validation
  sot register|chain|trigger|index|search|hierarchy  SOT management
  pipeline status|advance|sequence    Pipeline operations
  frontmatter get|set|validate        Frontmatter CRUD
  help                                Show this help

Use --raw for compact JSON output.`);
    break;

  default:
    err(`Unknown command: ${command}. Run 'help' for usage.`);
}
