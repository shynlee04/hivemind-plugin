/**
 * hm-entry-gate.cjs — Universal project validity gate.
 * Runs at start of every agent session in ANY project.
 * CLI: node hm-entry-gate.cjs [--cwd <path>] [--raw|--json]
 * Exit: 0 = all hard gates pass, 1 = any hard gate fails.
 * Zero npm deps. Pure CJS.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const TIMEOUT = 30_000;
const DAY_MS = 86_400_000;
const STALE_DAYS = 90;

// ── CLI ──────────────────────────────────────────────────────────────
function parseArgs() {
  const a = process.argv.slice(2);
  let cwd = process.cwd(), raw = false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] === '--cwd' && a[i + 1]) cwd = a[++i];
    if (a[i] === '--raw' || a[i] === '--json') raw = true;
  }
  return { cwd: path.resolve(cwd), raw };
}

// ── Shell ────────────────────────────────────────────────────────────
function run(cmd, cwd) {
  try {
    const r = cp.spawnSync('sh', ['-c', cmd], {
      cwd, timeout: TIMEOUT, encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, FORCE_COLOR: '0', NO_COLOR: '1' },
    });
    if (r.error) {
      return { out: '', err: '', code: null, error: r.error.code === 'ENOENT' ? 'command not found' : (r.error.signal === 'SIGTERM' ? 'timeout' : r.error.message) };
    }
    return { out: (r.stdout || '').trim(), err: (r.stderr || '').trim(), code: r.status, error: null };
  } catch (e) { return { out: '', err: '', code: null, error: e.message }; }
}

// ── Manifest ─────────────────────────────────────────────────────────
function detectManifest(cwd) {
  const pj = path.join(cwd, 'package.json');
  if (fs.existsSync(pj)) {
    try {
      const p = JSON.parse(fs.readFileSync(pj, 'utf-8'));
      return { type: 'package.json', name: p.name, version: p.version };
    } catch { return null; }
  }
  for (const f of ['pyproject.toml', 'go.mod', 'Cargo.toml', 'pom.xml']) {
    if (fs.existsSync(path.join(cwd, f))) return { type: f };
  }
  return null;
}

function gate(cwd, id, label, severity, data, passed) {
  return { id, label, severity, data, passed: !!passed };
}

// ── Gate 1: Manifest ────────────────────────────────────────────────
function gManifest(cwd) {
  const m = detectManifest(cwd);
  return gate(cwd, 'manifest', 'Project manifest exists and parseable', 'hard',
    m || { error: 'no manifest found' }, !!m);
}

// ── Gate 2: Build ───────────────────────────────────────────────────
function gBuild(cwd) {
  const m = detectManifest(cwd);
  let cmd = null, mgr = 'unknown';
  if (m?.type === 'package.json') {
    try {
      const s = JSON.parse(fs.readFileSync(path.join(cwd, 'package.json'), 'utf-8')).scripts || {};
      cmd = s.typecheck ? 'npm run typecheck' : s.build ? 'npm run build' : null;
    } catch { /* skip */ }
    mgr = 'npm';
  } else if (m?.type === 'go.mod') { cmd = 'go build ./...'; mgr = 'go'; }
  else if (m?.type === 'Cargo.toml') { cmd = 'cargo check'; mgr = 'cargo'; }
  else if (m?.type === 'pyproject.toml') { cmd = 'python -m py_compile'; mgr = 'python'; }

  if (!cmd) return gate(cwd, 'build', 'Build/typecheck passes', 'soft',
    { note: 'no build command detected', manager: mgr }, true);

  const r = run(cmd, cwd);
  if (r.error) return gate(cwd, 'build', 'Build/typecheck passes', 'soft',
    { command: cmd, error: r.error }, true);
  if (r.code !== 0) return gate(cwd, 'build', 'Build/typecheck passes', 'hard',
    { command: cmd, exitCode: r.code, stderr: r.err.slice(0, 500) }, false);
  return gate(cwd, 'build', 'Build/typecheck passes', 'hard',
    { command: cmd, exitCode: 0 }, true);
}

// ── Gate 3: Git state ───────────────────────────────────────────────
function gGit(cwd) {
  const r = run('git rev-parse --git-dir', cwd);
  if (r.code !== 0 || r.error)
    return gate(cwd, 'git-state', 'Git state is known', 'hard', { error: 'not a git repository' }, false);
  const s = run('git status --porcelain', cwd);
  if (s.error) return gate(cwd, 'git-state', 'Git state is known', 'hard', { error: s.error }, false);
  const lines = s.out ? s.out.split('\n').filter(Boolean) : [];
  return gate(cwd, 'git-state', 'Git state is known', 'hard',
    { clean: lines.length === 0, dirtyCount: lines.length }, true);
}

// ── Gate 4: Deps ────────────────────────────────────────────────────
function gDeps(cwd) {
  const m = detectManifest(cwd);
  if (!m) return gate(cwd, 'deps-critical', 'No broken critical dependencies', 'soft',
    { error: 'no manifest found' }, true);

  let cmd = null, mgr = null;
  if (m.type === 'package.json') { cmd = 'npm ls --depth=0 2>&1'; mgr = 'npm'; }
  else if (m.type === 'go.mod') { cmd = 'go mod verify 2>&1'; mgr = 'go'; }
  else if (m.type === 'Cargo.toml') { cmd = 'cargo check 2>&1'; mgr = 'cargo'; }
  else return gate(cwd, 'deps-critical', 'No broken critical dependencies', 'soft',
    { note: 'no dependency manager supported', type: m.type }, true);

  const r = run(cmd, cwd);
  if (r.error) return gate(cwd, 'deps-critical', 'No broken critical dependencies', 'soft',
    { manager: mgr, error: r.error }, true);

  if (mgr === 'npm') {
    const out = r.out + '\n' + r.err;
    const missing = (out.match(/missing:/g) || []).length;
    const invalid = (out.match(/invalid:/g) || []).length;
    return gate(cwd, 'deps-critical', 'No broken critical dependencies',
      (missing || invalid) ? 'hard' : 'hard',
      { manager: mgr, missing, invalid }, missing === 0 && invalid === 0);
  }
  return gate(cwd, 'deps-critical', 'No broken critical dependencies', 'hard',
    r.code !== 0 ? { manager: mgr, exitCode: r.code, stderr: (r.err || '').slice(0, 300) } : { manager: mgr, exitCode: 0 },
    r.code === 0);
}

// ── Gate 5 (soft): Doc freshness ────────────────────────────────────
function gDocs(cwd) {
  const now = Date.now(), d = {};
  for (const [key, file] of [['readmeAge', 'README.md'], ['changelogAge', 'CHANGELOG.md']]) {
    const p = path.join(cwd, file);
    if (fs.existsSync(p)) d[key] = Math.floor((now - fs.statSync(p).mtimeMs) / DAY_MS);
  }
  if (!d.readmeAge && !d.changelogAge)
    return gate(cwd, 'doc-freshness', 'Documentation not obviously stale', 'soft', { note: 'no docs found' }, true);
  const stale = (d.readmeAge > STALE_DAYS) || (d.changelogAge > STALE_DAYS);
  return gate(cwd, 'doc-freshness', 'Documentation not obviously stale', 'soft',
    stale ? { ...d, warning: 'docs may be stale (>90 days)' } : d, !stale);
}

// ── Gate 6 (soft): Structure ────────────────────────────────────────
function gStruct(cwd) {
  const d = {}, w = [];
  try {
    const mds = fs.readdirSync(cwd).filter((e) => e.endsWith('.md'));
    d.rootMdCount = mds.length;
    if (mds.length > 10) w.push('root has many .md files, may need cleanup');
  } catch { d.rootMdCount = -1; }
  d.hasGitignore = fs.existsSync(path.join(cwd, '.gitignore'));
  if (!d.hasGitignore) w.push('no .gitignore found');
  return gate(cwd, 'structure-health', 'No obvious structural issues', 'soft',
    w.length ? { ...d, warning: w.join('; ') } : d, w.length === 0);
}

// ── Runner ───────────────────────────────────────────────────────────
function runAll(cwd) {
  const gates = [gManifest(cwd), gBuild(cwd), gGit(cwd), gDeps(cwd), gDocs(cwd), gStruct(cwd)];
  const hardFail = gates.some((g) => g.severity === 'hard' && !g.passed);
  const softWarn = gates.some((g) => g.severity === 'soft' && !g.passed);
  return {
    passed: !hardFail,
    verdict: hardFail ? 'FAIL' : softWarn ? 'DEGRADED' : 'PASS',
    gates,
  };
}

// ── Main ─────────────────────────────────────────────────────────────
function main() {
  const { cwd, raw } = parseArgs();
  if (!fs.existsSync(cwd)) {
    const out = { passed: false, verdict: 'FAIL', gates: [
      { id: 'cwd', label: 'Working directory exists', passed: false, severity: 'hard', data: { error: `directory not found: ${cwd}` } }
    ]};
    process.stdout.write((raw ? JSON.stringify(out) : JSON.stringify(out, null, 2)) + '\n');
    process.exit(1);
  }
  const result = runAll(cwd);
  process.stdout.write((raw ? JSON.stringify(result) : JSON.stringify(result, null, 2)) + '\n');
  process.exit(result.passed ? 0 : 1);
}

main();
