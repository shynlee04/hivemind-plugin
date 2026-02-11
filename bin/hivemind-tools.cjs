#!/usr/bin/env node

/**
 * HiveMind Tools — Centralized CLI utility for ecosystem verification, path tracing,
 * state inspection, validation, and source auditing.
 *
 * Zero dependencies (pure Node.js). Designed for agent consumption (--json for structured output).
 *
 * Usage: node bin/hivemind-tools.js <command> [args] [--json]
 *
 * Path & Install:
 *   trace-paths [dir]               Show all HiveMind paths (hivemind, opencode config, plugin)
 *   verify-install [dir]            Check plugin registration + file integrity
 *   migrate-check [dir]             Detect old structures needing migration
 *
 * Inspection:
 *   inspect brain [dir]             Pretty-print brain state
 *   inspect tree [dir]              Pretty-print hierarchy tree
 *   inspect config [dir]            Pretty-print governance config
 *   inspect sessions [dir]          List sessions with status
 *   inspect detection [dir]         Show detection state (counters, flags)
 *
 * Validation:
 *   validate [dir]                  Schema check all JSON files
 *   ecosystem-check [dir]           Full chain verification (install → init → config → brain → hooks → tools)
 *
 * Source Audit:
 *   source-audit                    Audit src/ files for responsibilities + dead code
 *   filetree [dir]                  Show .hivemind/ tree with responsibilities
 *
 * Options:
 *   --json                          Output structured JSON instead of human-readable
 *   --raw                           Minimal output (values only)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ─── Helpers ──────────────────────────────────────────────────────────────────

function safeReadJSON(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    return null;
  }
}

function safeReadFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch {
    return null;
  }
}

function exists(p) {
  return fs.existsSync(p);
}

function resolveDir(args) {
  // Find first arg that's not a flag
  for (const arg of args) {
    if (!arg.startsWith('-')) return path.resolve(arg);
  }
  return process.cwd();
}

function hasFlag(args, flag) {
  return args.includes(flag);
}

function nowIso() {
  return new Date().toISOString();
}

function getGitHash(dir) {
  try {
    const out = execSync(`git -C "${dir}" rev-parse --short HEAD`, {
      stdio: ['ignore', 'pipe', 'ignore'],
    }).toString('utf-8').trim();
    return out || 'unknown';
  } catch {
    return 'unknown';
  }
}

function printResult(data, args) {
  if (hasFlag(args, '--json')) {
    console.log(JSON.stringify(data, null, 2));
  } else if (typeof data === 'string') {
    console.log(data);
  } else {
    console.log(JSON.stringify(data, null, 2));
  }
}

// ─── Dot-Notation & Validation Helpers ──────────────────────────────────────────

function getNestedValue(obj, dotPath) {
  return dotPath.split('.').reduce((o, key) => o && o[key] !== undefined ? o[key] : undefined, obj);
}

function isValidStamp(stamp) {
  if (typeof stamp !== 'string' || stamp.length !== 12) return false;
  return /^\d{12}$/.test(stamp);
}

function collectStamps(node) {
  const stamps = [];
  if (!node) return stamps;
  if (node.stamp) stamps.push({ id: node.id, stamp: node.stamp, level: node.level });
  for (const child of node.children || []) {
    stamps.push(...collectStamps(child));
  }
  return stamps;
}

const LEVEL_DEPTH = { trajectory: 1, tactic: 2, action: 3 };

function validateHierarchyChain(tree) {
  const issues = [];
  if (!tree || !tree.root) return issues;

  const ids = new Set();
  function walk(node, parentLevel) {
    // Check unique ID
    if (ids.has(node.id)) issues.push(`Duplicate ID: ${node.id}`);
    ids.add(node.id);

    // Check level depth
    const depth = LEVEL_DEPTH[node.level] || 0;
    const parentDepth = LEVEL_DEPTH[parentLevel] || 0;
    if (parentLevel && depth <= parentDepth) {
      issues.push(`Invalid level: ${node.level} under ${parentLevel} (${node.id})`);
    }

    for (const child of node.children || []) {
      walk(child, node.level);
    }
  }

  walk(tree.root, null);

  // Check cursor points to existing node
  if (tree.cursor) {
    if (!ids.has(tree.cursor)) {
      issues.push(`Cursor points to non-existent node: ${tree.cursor}`);
    }
  }

  return issues;
}

// ─── Path Resolution ──────────────────────────────────────────────────────────

function getHiveMindPaths(dir) {
  const hivemindDir = path.join(dir, '.hivemind');
  const sessionsDir = path.join(hivemindDir, 'sessions');
  const archiveDir = path.join(sessionsDir, 'archive');
  const templatesDir = path.join(hivemindDir, 'templates');

  // OpenCode config — check both .json and .jsonc
  let opencodeConfigPath = path.join(dir, 'opencode.json');
  let opencodeConfigType = 'json';
  if (!exists(opencodeConfigPath)) {
    const jsoncPath = path.join(dir, 'opencode.jsonc');
    if (exists(jsoncPath)) {
      opencodeConfigPath = jsoncPath;
      opencodeConfigType = 'jsonc';
    }
  }

  // Global opencode config
  const homeDir = require('os').homedir();
  let globalOpencodeConfig = path.join(homeDir, '.config', 'opencode', 'opencode.json');
  let globalConfigType = 'json';
  if (!exists(globalOpencodeConfig)) {
    const gJsonc = path.join(homeDir, '.config', 'opencode', 'opencode.jsonc');
    if (exists(gJsonc)) {
      globalOpencodeConfig = gJsonc;
      globalConfigType = 'jsonc';
    }
  }

  return {
    project: dir,
    hivemind: hivemindDir,
    brain: path.join(hivemindDir, 'brain.json'),
    config: path.join(hivemindDir, 'config.json'),
    hierarchy: path.join(hivemindDir, 'hierarchy.json'),
    manifest: path.join(sessionsDir, 'manifest.json'),
    indexMd: path.join(sessionsDir, 'index.md'),
    activeMd: path.join(sessionsDir, 'active.md'),
    archive: archiveDir,
    templates: templatesDir,
    sessionTemplate: path.join(templatesDir, 'session.md'),
    commandments: path.join(hivemindDir, '10-commandments.md'),
    anchors: path.join(hivemindDir, 'anchors.json'),
    mems: path.join(hivemindDir, 'mems.json'),
    sessions: sessionsDir,
    opencode: { path: opencodeConfigPath, type: opencodeConfigType },
    globalOpencode: { path: globalOpencodeConfig, type: globalConfigType },
  };
}

// ─── Commands ─────────────────────────────────────────────────────────────────

function cmdTracePaths(args) {
  const dir = resolveDir(args);
  const paths = getHiveMindPaths(dir);

  if (hasFlag(args, '--json')) {
    const result = {};
    for (const [key, val] of Object.entries(paths)) {
      if (typeof val === 'string') {
        result[key] = { path: val, exists: exists(val) };
      } else if (val && typeof val === 'object' && val.path) {
        result[key] = { path: val.path, type: val.type, exists: exists(val.path) };
      }
    }
    printResult(result, args);
    return;
  }

  console.log('HiveMind Path Trace');
  console.log('='.repeat(60));
  console.log(`Project: ${dir}`);
  console.log('');

  for (const [key, val] of Object.entries(paths)) {
    if (typeof val === 'string') {
      const status = exists(val) ? '  ✓' : '  ✗';
      const relative = path.relative(dir, val);
      console.log(`${status} ${key}: ${relative}`);
    } else if (val && typeof val === 'object' && val.path) {
      const status = exists(val.path) ? '  ✓' : '  ✗';
      const relative = path.relative(dir, val.path);
      console.log(`${status} ${key}: ${relative} (${val.type})`);
    }
  }
}

function cmdVerifyInstall(args) {
  const dir = resolveDir(args);
  const paths = getHiveMindPaths(dir);
  const issues = [];
  const checks = [];

  // 1. Check .hivemind directory
  if (exists(paths.hivemind)) {
    checks.push({ name: '.hivemind/', status: 'pass' });
  } else {
    issues.push('.hivemind/ directory missing — run `hivemind init`');
    checks.push({ name: '.hivemind/', status: 'fail', issue: 'Missing' });
  }

  // 2. Check core files
  const coreFiles = [
    ['brain.json', paths.brain],
    ['config.json', paths.config],
    ['index.md', paths.indexMd],
    ['active.md', paths.activeMd],
    ['10-commandments.md', paths.commandments],
  ];

  for (const [name, filePath] of coreFiles) {
    if (exists(filePath)) {
      checks.push({ name, status: 'pass' });
    } else {
      issues.push(`${name} missing`);
      checks.push({ name, status: 'fail', issue: 'Missing' });
    }
  }

  // 3. Check opencode.json plugin registration
  const opcConfig = safeReadJSON(paths.opencode.path);
  if (opcConfig) {
    const plugins = Array.isArray(opcConfig.plugin) ? opcConfig.plugin : [];
    const registered = plugins.some(p => p === 'hivemind-context-governance' || (typeof p === 'string' && p.startsWith('hivemind-context-governance')));
    if (registered) {
      checks.push({ name: 'plugin-registered', status: 'pass' });
    } else {
      issues.push('Plugin not registered in opencode config');
      checks.push({ name: 'plugin-registered', status: 'fail', issue: 'Not in plugin array' });
    }
  } else {
    issues.push('No opencode.json found');
    checks.push({ name: 'opencode-config', status: 'fail', issue: 'File missing' });
  }

  // 4. Check archive dir
  if (exists(paths.archive)) {
    checks.push({ name: 'archive/', status: 'pass' });
  } else {
    issues.push('archive/ directory missing');
    checks.push({ name: 'archive/', status: 'fail', issue: 'Missing' });
  }

  // 5. Validate brain.json schema
  const brain = safeReadJSON(paths.brain);
  if (brain) {
    const requiredKeys = ['session', 'hierarchy', 'metrics', 'version'];
    const missing = requiredKeys.filter(k => !(k in brain));
    if (missing.length === 0) {
      checks.push({ name: 'brain-schema', status: 'pass' });
    } else {
      issues.push(`brain.json missing keys: ${missing.join(', ')}`);
      checks.push({ name: 'brain-schema', status: 'fail', issue: `Missing: ${missing.join(', ')}` });
    }
  }

  // 6. Validate config.json schema
  const config = safeReadJSON(paths.config);
  if (config) {
    const requiredKeys = ['governance_mode', 'language', 'max_turns_before_warning'];
    const missing = requiredKeys.filter(k => !(k in config));
    if (missing.length === 0) {
      checks.push({ name: 'config-schema', status: 'pass' });
    } else {
      issues.push(`config.json missing keys: ${missing.join(', ')}`);
      checks.push({ name: 'config-schema', status: 'fail', issue: `Missing: ${missing.join(', ')}` });
    }
  }

  if (hasFlag(args, '--json')) {
    printResult({ checks, issues, healthy: issues.length === 0 }, args);
    return;
  }

  console.log('HiveMind Install Verification');
  console.log('='.repeat(60));
  for (const check of checks) {
    const icon = check.status === 'pass' ? '  ✓' : '  ✗';
    const detail = check.issue ? ` — ${check.issue}` : '';
    console.log(`${icon} ${check.name}${detail}`);
  }
  console.log('');
  if (issues.length === 0) {
    console.log('✅ All checks passed');
  } else {
    console.log(`❌ ${issues.length} issue(s) found`);
    issues.forEach(i => console.log(`  → ${i}`));
  }
}

function cmdMigrateCheck(args) {
  const dir = resolveDir(args);
  const paths = getHiveMindPaths(dir);
  const migrations = [];

  // 1. Old .opencode/planning/ structure
  const oldPlanningDir = path.join(dir, '.opencode', 'planning');
  if (exists(oldPlanningDir)) {
    migrations.push({
      type: 'legacy_planning_dir',
      location: oldPlanningDir,
      action: 'Migrate to .hivemind/ — run hivemind init',
    });
  }

  // 2. Flat hierarchy (no hierarchy.json)
  if (exists(paths.brain) && !exists(paths.hierarchy)) {
    const brain = safeReadJSON(paths.brain);
    if (brain && brain.hierarchy && (brain.hierarchy.trajectory || brain.hierarchy.tactic)) {
      migrations.push({
        type: 'flat_hierarchy',
        location: paths.brain,
        action: 'Run hierarchy_migrate to convert flat brain.hierarchy to tree',
      });
    }
  }

  // 3. No manifest.json (old singleton active.md)
  if (exists(paths.activeMd) && !exists(paths.manifest)) {
    migrations.push({
      type: 'no_manifest',
      location: paths.sessions,
      action: 'Sessions use singleton active.md — manifest.json not yet created',
    });
  }

  // 4. No templates/ dir
  if (exists(paths.hivemind) && !exists(paths.templates)) {
    migrations.push({
      type: 'no_templates',
      location: paths.hivemind,
      action: 'No templates/ directory — will be created on next init',
    });
  }

  // 5. Old opencode.jsonc needs handling
  if (paths.opencode.type === 'jsonc') {
    migrations.push({
      type: 'jsonc_config',
      location: paths.opencode.path,
      action: 'Using opencode.jsonc — ensure plugin registration handles comments',
    });
  }

  if (hasFlag(args, '--json')) {
    printResult({ migrations, count: migrations.length }, args);
    return;
  }

  console.log('Migration Check');
  console.log('='.repeat(60));
  if (migrations.length === 0) {
    console.log('✅ No migrations needed');
  } else {
    for (const m of migrations) {
      console.log(`⚠ ${m.type}`);
      console.log(`  Location: ${m.location}`);
      console.log(`  Action: ${m.action}`);
      console.log('');
    }
  }
}

function cmdInspect(args) {
  const subCmd = args[0];
  const restArgs = args.slice(1);
  const dir = resolveDir(restArgs);
  const paths = getHiveMindPaths(dir);

  switch (subCmd) {
    case 'brain': {
      const brain = safeReadJSON(paths.brain);
      if (!brain) { console.log('ERROR: brain.json not found'); return; }
      if (hasFlag(restArgs, '--json')) { printResult(brain, restArgs); return; }
      console.log('Brain State');
      console.log('='.repeat(60));
      console.log(`Session ID:  ${brain.session?.id ?? '(none)'}`);
      console.log(`Status:      ${brain.session?.governance_status ?? '?'}`);
      console.log(`Mode:        ${brain.session?.mode ?? '?'}`);
      console.log(`Gov. Mode:   ${brain.session?.governance_mode ?? '?'}`);
      console.log(`Start:       ${brain.session?.start_time ? new Date(brain.session.start_time).toISOString() : '?'}`);
      console.log(`Last Active: ${brain.session?.last_activity ? new Date(brain.session.last_activity).toISOString() : '?'}`);
      console.log('');
      console.log('Hierarchy:');
      console.log(`  Trajectory: ${brain.hierarchy?.trajectory || '(not set)'}`);
      console.log(`  Tactic:     ${brain.hierarchy?.tactic || '(not set)'}`);
      console.log(`  Action:     ${brain.hierarchy?.action || '(not set)'}`);
      console.log('');
      console.log('Metrics:');
      console.log(`  Turns:      ${brain.metrics?.turn_count ?? 0}`);
      console.log(`  Drift:      ${brain.metrics?.drift_score ?? 100}/100`);
      console.log(`  Files:      ${(brain.metrics?.files_touched ?? []).length}`);
      console.log(`  Updates:    ${brain.metrics?.context_updates ?? 0}`);
      console.log(`  Violations: ${brain.metrics?.violation_count ?? 0}`);
      console.log(`  Health:     ${brain.metrics?.auto_health_score ?? 100}%`);
      // Detection state (if present)
      if (brain.metrics?.tool_type_counts) {
        const ttc = brain.metrics.tool_type_counts;
        console.log('');
        console.log('Detection:');
        console.log(`  Tool types: R=${ttc.read ?? 0} W=${ttc.write ?? 0} Q=${ttc.query ?? 0} G=${ttc.governance ?? 0}`);
        console.log(`  Failures:   ${brain.metrics?.consecutive_failures ?? 0} consecutive`);
        console.log(`  Repetition: ${brain.metrics?.consecutive_same_section ?? 0} same-section`);
        console.log(`  Keywords:   ${(brain.metrics?.keyword_flags ?? []).join(', ') || '(none)'}`);
      }
      break;
    }

    case 'tree': {
      const tree = safeReadJSON(paths.hierarchy);
      if (!tree) { console.log('No hierarchy.json found (flat mode)'); return; }
      if (hasFlag(restArgs, '--json')) { printResult(tree, restArgs); return; }
      console.log('Hierarchy Tree');
      console.log('='.repeat(60));
      console.log(`Version: ${tree.version ?? '?'}`);
      console.log(`Cursor:  ${tree.cursor ?? '(none)'}`);
      console.log('');
      if (tree.root) {
        printTreeNode(tree.root, '', true, true, tree.cursor);
      } else {
        console.log('(empty tree)');
      }
      break;
    }

    case 'config': {
      const config = safeReadJSON(paths.config);
      if (!config) { console.log('ERROR: config.json not found'); return; }
      if (hasFlag(restArgs, '--json')) { printResult(config, restArgs); return; }
      console.log('HiveMind Config');
      console.log('='.repeat(60));
      console.log(`Governance:  ${config.governance_mode}`);
      console.log(`Language:    ${config.language}`);
      console.log(`Max Turns:   ${config.max_turns_before_warning}`);
      console.log(`Max Lines:   ${config.max_active_md_lines}`);
      console.log(`Auto-compact:${config.auto_compact_on_turns} turns`);
      console.log(`Stale days:  ${config.stale_session_days}`);
      console.log(`Commit threshold: ${config.commit_suggestion_threshold}`);
      if (config.agent_behavior) {
        const ab = config.agent_behavior;
        console.log('');
        console.log('Agent Behavior:');
        console.log(`  Expert:    ${ab.expert_level}`);
        console.log(`  Style:     ${ab.output_style}`);
        console.log(`  TDD:       ${ab.constraints?.enforce_tdd ? 'yes' : 'no'}`);
        console.log(`  Review:    ${ab.constraints?.require_code_review ? 'yes' : 'no'}`);
        console.log(`  Skeptical: ${ab.constraints?.be_skeptical ? 'yes' : 'no'}`);
      }
      break;
    }

    case 'sessions': {
      if (hasFlag(restArgs, '--json')) {
        const manifest = safeReadJSON(paths.manifest);
        const archives = exists(paths.archive) ? fs.readdirSync(paths.archive).filter(f => f.endsWith('.md')) : [];
        printResult({ manifest, archiveCount: archives.length, archives: archives.slice(0, 20) }, restArgs);
        return;
      }
      console.log('Sessions');
      console.log('='.repeat(60));
      // Manifest
      const manifest = safeReadJSON(paths.manifest);
      if (manifest) {
        console.log(`Active stamp: ${manifest.active_stamp || '(none)'}`);
        console.log(`Sessions: ${(manifest.sessions || []).length}`);
        for (const s of (manifest.sessions || [])) {
          console.log(`  ${s.stamp} → ${s.status} (${s.file})`);
        }
      } else {
        console.log('No manifest.json (using legacy singleton active.md)');
      }
      // Archives
      if (exists(paths.archive)) {
        const archives = fs.readdirSync(paths.archive).filter(f => f.endsWith('.md'));
        console.log(`\nArchives: ${archives.length}`);
        for (const a of archives.slice(0, 10)) {
          console.log(`  ${a}`);
        }
        if (archives.length > 10) console.log(`  ... and ${archives.length - 10} more`);
      }
      break;
    }

    case 'detection': {
      const brain = safeReadJSON(paths.brain);
      if (!brain) { console.log('ERROR: brain.json not found'); return; }
      const det = {
        consecutive_failures: brain.metrics?.consecutive_failures ?? 0,
        consecutive_same_section: brain.metrics?.consecutive_same_section ?? 0,
        last_section_content: brain.metrics?.last_section_content ?? '',
        tool_type_counts: brain.metrics?.tool_type_counts ?? { read: 0, write: 0, query: 0, governance: 0 },
        keyword_flags: brain.metrics?.keyword_flags ?? [],
      };
      if (hasFlag(restArgs, '--json')) { printResult(det, restArgs); return; }
      console.log('Detection State');
      console.log('='.repeat(60));
      console.log(`Failures:    ${det.consecutive_failures} consecutive`);
      console.log(`Repetition:  ${det.consecutive_same_section} same-section`);
      console.log(`Last content:${det.last_section_content ? ` "${det.last_section_content.slice(0, 60)}"` : ' (none)'}`);
      const ttc = det.tool_type_counts;
      console.log(`Tool types:  R=${ttc.read} W=${ttc.write} Q=${ttc.query} G=${ttc.governance}`);
      console.log(`Keywords:    ${det.keyword_flags.length > 0 ? det.keyword_flags.join(', ') : '(none)'}`);
      break;
    }

    default:
      console.log(`Unknown inspect command: ${subCmd}`);
      console.log('Valid: brain, tree, config, sessions, detection');
  }
}

function printTreeNode(node, prefix, isLast, isRoot, cursor) {
  const connector = isRoot ? '' : isLast ? '\\-- ' : '|-- ';
  const markers = { pending: '..', active: '>>', complete: 'OK', blocked: '!!' };
  const marker = markers[node.status] || '??';
  const cursorMark = cursor === node.id ? ' <-- cursor' : '';
  const level = (node.level || '').charAt(0).toUpperCase() + (node.level || '').slice(1);
  const content = (node.content || '').length > 55
    ? node.content.slice(0, 52) + '...'
    : node.content || '';
  console.log(`${prefix}${connector}[${marker}] ${level}: ${content} (${node.stamp || '?'})${cursorMark}`);

  const childPrefix = isRoot ? '' : prefix + (isLast ? '    ' : '|   ');
  const children = node.children || [];
  for (let i = 0; i < children.length; i++) {
    printTreeNode(children[i], childPrefix, i === children.length - 1, false, cursor);
  }
}

function cmdValidate(args) {
  const dir = resolveDir(args);
  const paths = getHiveMindPaths(dir);
  const results = [];

  // Validate each JSON file
  const jsonFiles = [
    ['brain.json', paths.brain, ['session', 'hierarchy', 'metrics', 'version']],
    ['config.json', paths.config, ['governance_mode', 'language']],
    ['hierarchy.json', paths.hierarchy, ['version', 'root', 'cursor']],
    ['manifest.json', paths.manifest, ['sessions']],
    ['anchors.json', paths.anchors, ['anchors']],
    ['mems.json', paths.mems, ['mems']],
  ];

  for (const [name, filePath, requiredKeys] of jsonFiles) {
    if (!exists(filePath)) {
      results.push({ file: name, status: 'missing', issues: [] });
      continue;
    }
    const data = safeReadJSON(filePath);
    if (!data) {
      results.push({ file: name, status: 'invalid_json', issues: ['Failed to parse'] });
      continue;
    }
    const missing = requiredKeys.filter(k => !(k in data));
    if (missing.length > 0) {
      results.push({ file: name, status: 'incomplete', issues: missing.map(k => `Missing key: ${k}`) });
    } else {
      results.push({ file: name, status: 'valid', issues: [] });
    }
  }

  if (hasFlag(args, '--json')) {
    printResult({ results, valid: results.every(r => r.status === 'valid' || r.status === 'missing') }, args);
    return;
  }

  console.log('JSON Validation');
  console.log('='.repeat(60));
  for (const r of results) {
    const icon = r.status === 'valid' ? '✓' : r.status === 'missing' ? '○' : '✗';
    console.log(`  ${icon} ${r.file}: ${r.status}`);
    r.issues.forEach(i => console.log(`    → ${i}`));
  }
}

function cmdEcosystemCheck(args) {
  const dir = resolveDir(args);
  const paths = getHiveMindPaths(dir);
  const chain = [];
  const trace = {
    time: nowIso(),
    git_hash: getGitHash(dir),
  };
  let healthy = true;

  // 1. INSTALL: Plugin file exists on disk
  const pkgJson = safeReadJSON(path.join(dir, 'node_modules', 'hivemind-context-governance', 'package.json'));
  if (pkgJson) {
    chain.push({ step: 'install', status: 'pass', detail: `v${pkgJson.version}` });
  } else {
    // Check if running from source (we're IN the plugin project)
    const localPkg = safeReadJSON(path.join(dir, 'package.json'));
    if (localPkg && localPkg.name === 'hivemind-context-governance') {
      chain.push({ step: 'install', status: 'pass', detail: `source (v${localPkg.version})` });
    } else {
      chain.push({ step: 'install', status: 'warn', detail: 'Not in node_modules (may be source project)' });
    }
  }

  // 2. INIT: .hivemind/ exists with core files
  const coreFiles = [paths.brain, paths.config, paths.indexMd, paths.activeMd, paths.commandments];
  const existingCore = coreFiles.filter(f => exists(f));
  if (existingCore.length === coreFiles.length) {
    chain.push({ step: 'init', status: 'pass', detail: `${existingCore.length}/${coreFiles.length} files` });
  } else {
    chain.push({ step: 'init', status: 'fail', detail: `${existingCore.length}/${coreFiles.length} files` });
    healthy = false;
  }

  // 3. CONFIG: Valid config.json
  const config = safeReadJSON(paths.config);
  if (config && config.governance_mode && config.language) {
    chain.push({ step: 'config', status: 'pass', detail: `${config.governance_mode}/${config.language}` });
  } else {
    chain.push({ step: 'config', status: 'fail', detail: 'Invalid or missing config' });
    healthy = false;
  }

  // 4. BRAIN: Valid brain.json with session
  const brain = safeReadJSON(paths.brain);
  if (brain && brain.session && brain.hierarchy && brain.metrics) {
    chain.push({ step: 'brain', status: 'pass', detail: `${brain.session.governance_status}/${brain.session.mode}` });
  } else {
    chain.push({ step: 'brain', status: 'fail', detail: 'Invalid or missing brain state' });
    healthy = false;
  }

  // 5. HIERARCHY: tree vs flat
  if (exists(paths.hierarchy)) {
    const tree = safeReadJSON(paths.hierarchy);
    if (tree && 'root' in tree) {
      chain.push({ step: 'hierarchy', status: 'pass', detail: `tree (root: ${tree.root ? 'set' : 'empty'})` });
    } else {
      chain.push({ step: 'hierarchy', status: 'warn', detail: 'Invalid hierarchy.json' });
    }
  } else if (brain && (brain.hierarchy.trajectory || brain.hierarchy.tactic)) {
    chain.push({ step: 'hierarchy', status: 'warn', detail: 'Flat mode (no hierarchy.json)' });
  } else {
    chain.push({ step: 'hierarchy', status: 'pass', detail: 'Empty (fresh session)' });
  }

  // 6. PLUGIN REGISTRATION
  const opc = safeReadJSON(paths.opencode.path);
  if (opc) {
    const plugins = Array.isArray(opc.plugin) ? opc.plugin : [];
    const registered = plugins.some(p => typeof p === 'string' && p.includes('hivemind'));
    chain.push({ step: 'plugin-reg', status: registered ? 'pass' : 'fail', detail: registered ? 'Registered' : 'Not in plugin array' });
    if (!registered) healthy = false;
  } else {
    chain.push({ step: 'plugin-reg', status: 'fail', detail: 'No opencode config found' });
    healthy = false;
  }

  // 7. HOOKS: Check src/hooks/ exist
  const hooksDir = path.join(dir, 'src', 'hooks');
  const hookFiles = ['tool-gate.ts', 'soft-governance.ts', 'session-lifecycle.ts', 'compaction.ts'];
  if (exists(hooksDir)) {
    const existing = hookFiles.filter(h => exists(path.join(hooksDir, h)));
    chain.push({ step: 'hooks', status: existing.length === hookFiles.length ? 'pass' : 'warn', detail: `${existing.length}/${hookFiles.length}` });
  } else {
    chain.push({ step: 'hooks', status: 'warn', detail: 'No src/hooks/ (may be installed package)' });
  }

  // 8. TOOLS: Count registered tools
  const indexTs = safeReadFile(path.join(dir, 'src', 'index.ts'));
  if (indexTs) {
    const toolEntries = indexTs.match(/\w+:\s*create\w+Tool/g);
    chain.push({ step: 'tools', status: 'pass', detail: `${toolEntries ? toolEntries.length : '?'} tools registered` });
  } else {
    chain.push({ step: 'tools', status: 'warn', detail: 'No src/index.ts (may be installed package)' });
  }

  // 9. SEMANTIC: Hierarchy relationship + stamp integrity
  if (exists(paths.hierarchy)) {
    const tree = safeReadJSON(paths.hierarchy);
    if (!tree || typeof tree !== 'object') {
      chain.push({ step: 'semantic', status: 'fail', detail: 'hierarchy.json is unreadable' });
      healthy = false;
    } else {
      const chainIssues = validateHierarchyChain(tree);
      const stampIssues = [];
      const stamps = collectStamps(tree.root);
      for (const entry of stamps) {
        if (!isValidStamp(entry.stamp)) {
          stampIssues.push(`Invalid stamp ${entry.stamp} on ${entry.id}`);
        }
      }
      const issues = [...chainIssues, ...stampIssues];
      if (issues.length === 0) {
        chain.push({
          step: 'semantic',
          status: 'pass',
          detail: `chain+stamps valid (${stamps.length} nodes)`,
        });
      } else {
        chain.push({
          step: 'semantic',
          status: 'fail',
          detail: `${issues.length} issue(s): ${issues.slice(0, 2).join('; ')}`,
          issues,
        });
        healthy = false;
      }
    }
  } else {
    chain.push({
      step: 'semantic',
      status: 'pass',
      detail: 'No hierarchy tree yet (fresh or flat session)',
    });
  }

  if (hasFlag(args, '--json')) {
    printResult({ chain, trace, healthy }, args);
    return;
  }

  console.log('Ecosystem Health Check');
  console.log('='.repeat(60));
  for (const step of chain) {
    const icon = step.status === 'pass' ? '✓' : step.status === 'warn' ? '⚠' : '✗';
    console.log(`  ${icon} ${step.step}: ${step.detail}`);
  }
  console.log('');
  console.log(`Trace time: ${trace.time}`);
  console.log(`Git hash:   ${trace.git_hash}`);
  console.log('');
  console.log(healthy ? '✅ Ecosystem healthy' : '❌ Issues found — see above');
}

function cmdSourceAudit(args) {
  const dir = resolveDir(args.length > 0 && !args[0].startsWith('-') ? args : []);
  const srcDir = path.join(dir, 'src');
  if (!exists(srcDir)) {
    console.log('ERROR: src/ not found');
    return;
  }

  // Map of every src file to its responsibility
  const responsibilities = {
    // Tools
    'tools/declare-intent.ts': { group: 'tool', role: 'Start session, create tree root, set trajectory' },
    'tools/map-context.ts': { group: 'tool', role: 'Update hierarchy level, append tree node, project to brain' },
    'tools/compact-session.ts': { group: 'tool', role: 'Archive session, reset tree, auto-export, auto-mem' },
    'tools/scan-hierarchy.ts': { group: 'tool', role: 'Quick snapshot: tree + metrics + anchors + mems' },
    'tools/think-back.ts': { group: 'tool', role: 'Deep refocus: tree + cursor path + gaps + anchors + plan' },
    'tools/check-drift.ts': { group: 'tool', role: 'Drift report: score + chain integrity' },
    'tools/self-rate.ts': { group: 'tool', role: 'Agent self-assessment (1-10 score)' },
    'tools/save-anchor.ts': { group: 'tool', role: 'Persist immutable key-value across sessions' },
    'tools/save-mem.ts': { group: 'tool', role: 'Save memory to shelf' },
    'tools/list-shelves.ts': { group: 'tool', role: 'Show mem shelf overview' },
    'tools/recall-mems.ts': { group: 'tool', role: 'Search memories by query + shelf' },
    'tools/hierarchy.ts': { group: 'tool', role: 'Prune completed branches + migrate flat→tree' },
    'tools/export-cycle.ts': { group: 'tool', role: 'Capture subagent results into hierarchy tree + mems brain' },
    'tools/index.ts': { group: 'barrel', role: 'Tool factory exports' },
    // Hooks
    'hooks/tool-gate.ts': { group: 'hook', role: 'tool.execute.before — governance enforcement (warn, not block)' },
    'hooks/soft-governance.ts': { group: 'hook', role: 'tool.execute.after — turn tracking, drift, violations, detection counters' },
    'hooks/session-lifecycle.ts': { group: 'hook', role: 'system.transform — <hivemind> prompt injection, stale archive' },
    'hooks/compaction.ts': { group: 'hook', role: 'session.compacting — hierarchy context preservation' },
    'hooks/index.ts': { group: 'barrel', role: 'Hook factory exports' },
    // Lib
    'lib/hierarchy-tree.ts': { group: 'engine', role: 'Tree CRUD, stamps, queries, staleness, rendering, janitor, I/O, migration' },
    'lib/detection.ts': { group: 'engine', role: 'Tool classification, counters, keyword scanning, signal compilation' },
    'lib/planning-fs.ts': { group: 'engine', role: 'Session files, template, manifest, archive, FileGuard' },
    'lib/persistence.ts': { group: 'engine', role: 'Brain state I/O, config I/O' },
    'lib/chain-analysis.ts': { group: 'engine', role: 'Hierarchy chain break detection (flat brain.json)' },
    'lib/anchors.ts': { group: 'engine', role: 'Anchor CRUD and prompt formatting' },
    'lib/mems.ts': { group: 'engine', role: 'Mems CRUD, search, shelf summary' },
    'lib/session-export.ts': { group: 'engine', role: 'JSON + markdown export on compaction' },
    'lib/staleness.ts': { group: 'engine', role: 'Session stale detection (days idle)' },
    'lib/long-session.ts': { group: 'engine', role: 'Turn threshold for compact suggestion' },
    'lib/commit-advisor.ts': { group: 'engine', role: 'Files touched → commit suggestion' },
    'lib/complexity.ts': { group: 'engine', role: 'Session complexity assessment' },
    'lib/tool-activation.ts': { group: 'engine', role: 'Suggest which tool to use based on state' },
    'lib/sentiment.ts': { group: 'engine', role: 'User sentiment regex for rage/frustration detection' },
    'lib/logging.ts': { group: 'engine', role: 'Logger interface' },
    'lib/index.ts': { group: 'barrel', role: 'Lib barrel exports' },
    // Schemas
    'schemas/brain-state.ts': { group: 'schema', role: 'BrainState, MetricsState, session ops, hierarchy ops' },
    'schemas/hierarchy.ts': { group: 'schema', role: 'HierarchyLevel, ContextStatus types' },
    'schemas/config.ts': { group: 'schema', role: 'HiveMindConfig, AgentBehavior, prompt generation' },
    'schemas/index.ts': { group: 'barrel', role: 'Schema barrel exports' },
    // CLI
    'cli/init.ts': { group: 'cli', role: 'hivemind init — create .hivemind/, register plugin' },
    'cli.ts': { group: 'cli', role: 'CLI entry point (init, status, help)' },
    // Entry
    'index.ts': { group: 'entry', role: 'Plugin entry — register all tools + hooks' },
    // Dashboard
    'dashboard/server.ts': { group: 'dashboard', role: 'Ink TUI dashboard — live governance panels, bilingual EN/VI, 2s polling' },
  };

  // Walk src/ and check against map
  const allFiles = walkSync(srcDir, f => f.endsWith('.ts'));
  const srcRelative = allFiles.map(f => path.relative(srcDir, f));
  const mapped = [];
  const unmapped = [];
  const missingOnDisk = [];

  for (const relPath of srcRelative) {
    const normalizedPath = relPath.replace(/\\/g, '/');
    if (responsibilities[normalizedPath]) {
      mapped.push({ file: normalizedPath, ...responsibilities[normalizedPath] });
    } else {
      unmapped.push(normalizedPath);
    }
  }

  // Check for entries in map that don't exist on disk
  for (const relPath of Object.keys(responsibilities)) {
    const normalizedPaths = srcRelative.map(p => p.replace(/\\/g, '/'));
    if (!normalizedPaths.includes(relPath)) {
      missingOnDisk.push({ file: relPath, ...responsibilities[relPath] });
    }
  }

  if (hasFlag(args, '--json')) {
    printResult({ mapped, unmapped, missingOnDisk }, args);
    return;
  }

  console.log('Source Audit');
  console.log('='.repeat(60));

  // Group by group
  const groups = {};
  for (const item of mapped) {
    if (!groups[item.group]) groups[item.group] = [];
    groups[item.group].push(item);
  }

  for (const [group, items] of Object.entries(groups)) {
    console.log(`\n[${group.toUpperCase()}]`);
    for (const item of items) {
      console.log(`  ✓ ${item.file}`);
      console.log(`    ${item.role}`);
    }
  }

  if (unmapped.length > 0) {
    console.log('\n[UNMAPPED — no responsibility assigned]');
    for (const f of unmapped) {
      console.log(`  ? ${f}`);
    }
  }

  if (missingOnDisk.length > 0) {
    console.log('\n[EXPECTED BUT MISSING on disk]');
    for (const item of missingOnDisk) {
      console.log(`  ✗ ${item.file} — ${item.role}`);
    }
  }

  console.log(`\n${mapped.length} mapped | ${unmapped.length} unmapped | ${missingOnDisk.length} missing`);
}

function cmdFiletree(args) {
  const dir = resolveDir(args);
  const paths = getHiveMindPaths(dir);

  if (!exists(paths.hivemind)) {
    console.log('ERROR: .hivemind/ not found');
    return;
  }

  const files = walkSync(paths.hivemind, () => true);
  const relative = files.map(f => path.relative(paths.hivemind, f));

  if (hasFlag(args, '--json')) {
    printResult({ root: paths.hivemind, files: relative }, args);
    return;
  }

  console.log(`.hivemind/ (${files.length} files)`);
  console.log('='.repeat(60));
  for (const f of relative.sort()) {
    console.log(`  ${f}`);
  }
}

function walkSync(dir, filter) {
  const results = [];
  try {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
      if (entry.isDirectory()) results.push(...walkSync(full, filter));
      else if (filter(full)) results.push(full);
    }
  } catch {
    // permission denied or other
  }
  return results;
}

// ─── State Commands ──────────────────────────────────────────────────────────

function cmdState(args) {
  const subCmd = args[0];
  const restArgs = args.slice(1);

  switch (subCmd) {
    case 'load':      cmdStateLoad(restArgs); break;
    case 'get':       cmdStateGet(restArgs); break;
    case 'hierarchy': cmdStateHierarchy(restArgs); break;
    default:
      console.log(`Unknown state command: ${subCmd || '(none)'}`);
      console.log('Valid: load, get, hierarchy');
  }
}

function cmdStateLoad(args) {
  const dir = resolveDir(args);
  const paths = getHiveMindPaths(dir);

  const brain = safeReadJSON(paths.brain);
  const config = safeReadJSON(paths.config);
  const tree = safeReadJSON(paths.hierarchy);

  const result = {
    brain: brain || null,
    config: config || null,
    hierarchy: tree || null,
  };

  // state commands always output JSON
  printResult(result, ['--json']);
}

function cmdStateGet(args) {
  const field = args[0];
  if (!field) {
    console.log('ERROR: Missing field argument');
    console.log('Usage: state get <field> [dir]');
    console.log('Example: state get metrics.turn_count');
    return;
  }

  const dir = resolveDir(args.slice(1));
  const paths = getHiveMindPaths(dir);
  const brain = safeReadJSON(paths.brain);

  if (!brain) {
    console.log('ERROR: brain.json not found');
    return;
  }

  const value = getNestedValue(brain, field);

  if (hasFlag(args, '--json')) {
    printResult({ field, value }, args);
  } else {
    if (value === undefined) {
      console.log('undefined');
    } else if (typeof value === 'object') {
      console.log(JSON.stringify(value, null, 2));
    } else {
      console.log(String(value));
    }
  }
}

function cmdStateHierarchy(args) {
  // Alias for inspect tree
  cmdInspect(['tree', ...args]);
}

// ─── Session Commands ────────────────────────────────────────────────────────

function cmdSession(args) {
  const subCmd = args[0];
  const restArgs = args.slice(1);

  switch (subCmd) {
    case 'active':  cmdSessionActive(restArgs); break;
    case 'history': cmdSessionHistory(restArgs); break;
    case 'trace':   cmdSessionTrace(restArgs); break;
    default:
      console.log(`Unknown session command: ${subCmd || '(none)'}`);
      console.log('Valid: active, history, trace');
  }
}

function cmdSessionActive(args) {
  const dir = resolveDir(args);
  const paths = getHiveMindPaths(dir);
  const manifest = safeReadJSON(paths.manifest);

  if (!manifest) {
    if (hasFlag(args, '--json')) {
      printResult({ error: 'No manifest.json found', active: null }, args);
    } else {
      console.log('No manifest.json found (using legacy singleton active.md)');
    }
    return;
  }

  const activeStamp = manifest.active_stamp;
  const activeSession = (manifest.sessions || []).find(s => s.stamp === activeStamp);

  const result = {
    active_stamp: activeStamp || null,
    session: activeSession || null,
  };

  if (hasFlag(args, '--json')) {
    printResult(result, args);
    return;
  }

  if (!activeStamp) {
    console.log('No active session');
    return;
  }

  console.log('Active Session');
  console.log('='.repeat(60));
  console.log(`Stamp:   ${activeStamp}`);
  if (activeSession) {
    console.log(`File:    ${activeSession.file || '(none)'}`);
    console.log(`Status:  ${activeSession.status || '?'}`);
    console.log(`Created: ${activeSession.created_at || '?'}`);
    if (activeSession.summary) console.log(`Summary: ${activeSession.summary}`);
  } else {
    console.log('(session entry not found in manifest)');
  }
}

function cmdSessionHistory(args) {
  const dir = resolveDir(args);
  const paths = getHiveMindPaths(dir);
  const manifest = safeReadJSON(paths.manifest);

  if (!manifest) {
    if (hasFlag(args, '--json')) {
      printResult({ error: 'No manifest.json found', sessions: [] }, args);
    } else {
      console.log('No manifest.json found');
    }
    return;
  }

  const sessions = manifest.sessions || [];

  if (hasFlag(args, '--json')) {
    printResult({ active_stamp: manifest.active_stamp, sessions }, args);
    return;
  }

  console.log('Session History');
  console.log('='.repeat(60));
  console.log(`Active stamp: ${manifest.active_stamp || '(none)'}`);
  console.log(`Total sessions: ${sessions.length}`);
  console.log('');

  for (const s of sessions) {
    const active = s.stamp === manifest.active_stamp ? ' ← active' : '';
    console.log(`  ${s.stamp} [${s.status || '?'}]${active}`);
    if (s.file) console.log(`    File:    ${s.file}`);
    if (s.created_at) console.log(`    Created: ${s.created_at}`);
    if (s.summary) console.log(`    Summary: ${s.summary}`);
  }
}

function cmdSessionTrace(args) {
  const stamp = args.find(a => !a.startsWith('-'));
  if (!stamp) {
    console.log('ERROR: Missing stamp argument');
    console.log('Usage: session trace <stamp> [dir]');
    return;
  }

  // Remove stamp from args to resolve dir from remaining
  const remainingArgs = args.filter(a => a !== stamp);
  const dir = resolveDir(remainingArgs.length > 0 ? remainingArgs : []);
  const paths = getHiveMindPaths(dir);
  const matches = [];

  // Search each JSON file
  const jsonFiles = [
    ['brain.json', paths.brain],
    ['hierarchy.json', paths.hierarchy],
    ['config.json', paths.config],
    ['manifest.json', paths.manifest],
    ['anchors.json', paths.anchors],
    ['mems.json', paths.mems],
  ];

  for (const [name, filePath] of jsonFiles) {
    const content = safeReadFile(filePath);
    if (content && content.includes(stamp)) {
      matches.push({ file: name, found: true });
    }
  }

  // Search archive files
  if (exists(paths.archive)) {
    try {
      for (const f of fs.readdirSync(paths.archive)) {
        const content = safeReadFile(path.join(paths.archive, f));
        if (content && content.includes(stamp)) {
          matches.push({ file: `archive/${f}`, found: true });
        }
      }
    } catch { /* ignore */ }
  }

  // Search session .md files (excluding index.md and active.md)
  if (exists(paths.sessions)) {
    try {
      for (const f of fs.readdirSync(paths.sessions)) {
        if (f.endsWith('.md') && f !== 'index.md' && f !== 'active.md') {
          const content = safeReadFile(path.join(paths.sessions, f));
          if (content && content.includes(stamp)) {
            matches.push({ file: `sessions/${f}`, found: true });
          }
        }
      }
    } catch { /* ignore */ }
  }

  if (hasFlag(args, '--json')) {
    printResult({ stamp, matches, total: matches.length }, args);
    return;
  }

  console.log(`Trace: ${stamp}`);
  console.log('='.repeat(60));
  if (matches.length === 0) {
    console.log('  No matches found');
  } else {
    for (const m of matches) {
      console.log(`  ✓ ${m.file}`);
    }
    console.log(`\n${matches.length} file(s) contain stamp ${stamp}`);
  }
}

// ─── Config Commands ─────────────────────────────────────────────────────────

function cmdConfig(args) {
  const subCmd = args[0];
  const restArgs = args.slice(1);

  switch (subCmd) {
    case 'get':         cmdConfigGet(restArgs); break;
    case 'trace-paths': cmdTracePaths(restArgs); break;
    default:
      console.log(`Unknown config command: ${subCmd || '(none)'}`);
      console.log('Valid: get, trace-paths');
  }
}

function cmdConfigGet(args) {
  const key = args[0];
  if (!key) {
    console.log('ERROR: Missing key argument');
    console.log('Usage: config get <key> [dir]');
    return;
  }

  const dir = resolveDir(args.slice(1));
  const paths = getHiveMindPaths(dir);
  const config = safeReadJSON(paths.config);

  if (!config) {
    console.log('ERROR: config.json not found');
    return;
  }

  const value = getNestedValue(config, key);

  if (hasFlag(args, '--json')) {
    printResult({ key, value }, args);
  } else {
    if (value === undefined) {
      console.log('undefined');
    } else if (typeof value === 'object') {
      console.log(JSON.stringify(value, null, 2));
    } else {
      console.log(String(value));
    }
  }
}

// ─── Validate Dispatch (compound) ───────────────────────────────────────────

function cmdValidateDispatch(args) {
  const subCmd = args[0];

  if (subCmd === 'schema') {
    cmdValidate(args.slice(1));
  } else if (subCmd === 'chain') {
    cmdValidateChainCmd(args.slice(1));
  } else if (subCmd === 'stamps') {
    cmdValidateStampsCmd(args.slice(1));
  } else {
    // Legacy: no subcommand or dir/flag — treat as schema validation
    cmdValidate(args);
  }
}

function cmdValidateChainCmd(args) {
  const dir = resolveDir(args);
  const paths = getHiveMindPaths(dir);
  const tree = safeReadJSON(paths.hierarchy);

  if (!tree) {
    if (hasFlag(args, '--json')) {
      printResult({ valid: false, issues: ['hierarchy.json not found'] }, args);
    } else {
      console.log('ERROR: hierarchy.json not found');
    }
    return;
  }

  const issues = validateHierarchyChain(tree);
  const valid = issues.length === 0;

  if (hasFlag(args, '--json')) {
    printResult({ valid, issues }, args);
    return;
  }

  console.log('Chain Validation');
  console.log('='.repeat(60));
  if (valid) {
    console.log('✅ Hierarchy chain is valid');
  } else {
    console.log(`❌ ${issues.length} issue(s) found:`);
    for (const issue of issues) {
      console.log(`  → ${issue}`);
    }
  }
}

function cmdValidateStampsCmd(args) {
  const dir = resolveDir(args);
  const paths = getHiveMindPaths(dir);
  const tree = safeReadJSON(paths.hierarchy);

  if (!tree) {
    if (hasFlag(args, '--json')) {
      printResult({ valid: false, issues: ['hierarchy.json not found'], stamps: [] }, args);
    } else {
      console.log('ERROR: hierarchy.json not found');
    }
    return;
  }

  const stamps = collectStamps(tree.root);
  const issues = [];

  for (const entry of stamps) {
    if (!isValidStamp(entry.stamp)) {
      issues.push(`Invalid stamp "${entry.stamp}" on node ${entry.id} (${entry.level})`);
    }
  }

  const valid = issues.length === 0;

  if (hasFlag(args, '--json')) {
    printResult({ valid, stamps, issues }, args);
    return;
  }

  console.log('Stamp Validation');
  console.log('='.repeat(60));
  console.log(`Total stamps: ${stamps.length}`);
  if (valid) {
    console.log('✅ All stamps valid');
    for (const entry of stamps) {
      console.log(`  ✓ ${entry.stamp} → ${entry.id} (${entry.level})`);
    }
  } else {
    console.log(`❌ ${issues.length} issue(s) found:`);
    for (const issue of issues) {
      console.log(`  → ${issue}`);
    }
  }
}

// ─── Main Dispatch ────────────────────────────────────────────────────────────

const HELP = `
HiveMind Tools — Ecosystem verification & inspection CLI

Usage: node bin/hivemind-tools.cjs <command> [args] [--json]

Path & Install:
  trace-paths [dir]              Show all HiveMind paths
  verify-install [dir]           Check plugin registration + integrity
  migrate-check [dir]            Detect old structures needing migration

Inspection:
  inspect <sub> [dir]            Inspect state (brain|tree|config|sessions|detection)

State (always JSON):
  state load [dir]               Combined brain + config + hierarchy JSON
  state get <field> [dir]        Get brain field (dot notation, e.g. metrics.turn_count)
  state hierarchy [dir]          Render ASCII hierarchy tree (alias for inspect tree)

Session:
  session active [dir]           Show active session stamp + manifest entry
  session history [dir]          List all sessions with stamps and status
  session trace <stamp> [dir]    Grep stamp across ALL .hivemind artifacts

Config:
  config get <key> [dir]         Get config value (dot notation)
  config trace-paths [dir]       Alias for trace-paths

Validation:
  validate [dir]                 Schema check all JSON files
  validate schema [dir]          Same as validate (explicit)
  validate chain [dir]           Check hierarchy parent-child integrity
  validate stamps [dir]          Check all timestamps parse correctly

Ecosystem:
  ecosystem-check [dir]          Full chain + semantic validation + trace metadata
  source-audit [dir]             Audit src/ for responsibilities
  filetree [dir]                 Show .hivemind/ file tree
  help                           This message

Options:
  --json                         Structured JSON output
  --raw                          Minimal output
`;

const [cmd, ...args] = process.argv.slice(2);

switch (cmd) {
  case 'trace-paths':      cmdTracePaths(args); break;
  case 'verify-install':   cmdVerifyInstall(args); break;
  case 'migrate-check':    cmdMigrateCheck(args); break;
  case 'inspect':          cmdInspect(args); break;
  case 'state':            cmdState(args); break;
  case 'session':          cmdSession(args); break;
  case 'config':           cmdConfig(args); break;
  case 'validate':         cmdValidateDispatch(args); break;
  case 'ecosystem-check':  cmdEcosystemCheck(args); break;
  case 'source-audit':     cmdSourceAudit(args); break;
  case 'filetree':         cmdFiletree(args); break;
  case 'help': default:    console.log(HELP); break;
}
