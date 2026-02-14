/**
 * Session Lifecycle Hook — Prompt Compilation Engine.
 *
 * Fires EVERY turn (experimental.chat.system.transform):
 *   - Reads all detection counters from brain.json
 *   - Reads timestamp gaps from hierarchy.json
 *   - Compiles detected signals into <hivemind> prompt injection
 *   - Budget-capped (2500 chars, lowest priority dropped)
 *   - Handles stale session auto-archival
 *
 * This is the PROMPT engine. It reads detection state written by
 * soft-governance.ts (tool.execute.after) and compiles into warnings
 * that reshape the agent's next decision.
 *
 * P3: try/catch — never break session lifecycle
 * P5: Config re-read from disk each invocation (Rule 6)
 */

import { existsSync } from "node:fs"
import { readFile, readdir } from "node:fs/promises"
import { join } from "node:path"
import type { Logger } from "../lib/logging.js"
import type { HiveMindConfig } from "../schemas/config.js"
import { generateAgentBehaviorPrompt, isCoachAutomation } from "../schemas/config.js"
import { createStateManager, loadConfig } from "../lib/persistence.js"
import { getEffectivePaths, isLegacyStructure } from "../lib/paths.js"
import { migrateIfNeeded } from "../lib/migrate.js"
import {
  createBrainState,
  generateSessionId,
} from "../schemas/brain-state.js"
import {
  archiveSession,
  initializePlanningDirectory,
  readActiveMd,
  resetActiveMd,
  updateIndexMd,
  readManifest,
} from "../lib/planning-fs.js"
import { isSessionStale } from "../lib/staleness.js"
import { detectChainBreaks } from "../lib/chain-analysis.js"
import { loadAnchors } from "../lib/anchors.js"
import { loadMems } from "../lib/mems.js"
import { detectLongSession } from "../lib/long-session.js"
import { getToolActivation } from "../lib/tool-activation.js"
import {
  compileEscalatedSignals,
  compileIgnoredTier,
  formatSignals,
  formatIgnoredEvidence,
  createDetectionState,
  DEFAULT_THRESHOLDS,
  type DetectionState,
} from "../lib/detection.js"
import {
  createTree,
  loadTree,
  saveTree,
  toAsciiTree,
  detectGaps,
  getTreeStats,
  treeExists,
  countCompleted,
  getCursorNode,
  getAncestors,
} from "../lib/hierarchy-tree.js"
import {
  detectFrameworkContext,
  buildFrameworkSelectionMenu,
} from "../lib/framework-context.js"

interface ProjectSnapshot {
  projectName: string
  topLevelDirs: string[]
  artifactHints: string[]
  stackHints: string[]
}

async function collectProjectSnapshot(directory: string): Promise<ProjectSnapshot> {
  const snapshot: ProjectSnapshot = {
    projectName: "(unknown project)",
    topLevelDirs: [],
    artifactHints: [],
    stackHints: [],
  }

  try {
    const packagePath = join(directory, "package.json")
    if (existsSync(packagePath)) {
      const raw = await readFile(packagePath, "utf-8")
      const pkg = JSON.parse(raw) as {
        name?: string
        dependencies?: Record<string, string>
        devDependencies?: Record<string, string>
        peerDependencies?: Record<string, string>
      }
      if (pkg.name?.trim()) {
        snapshot.projectName = pkg.name.trim()
      }

      const deps = {
        ...(pkg.dependencies ?? {}),
        ...(pkg.devDependencies ?? {}),
        ...(pkg.peerDependencies ?? {}),
      }

      const stackSignals: Array<[string, string]> = [
        ["typescript", "TypeScript"],
        ["react", "React"],
        ["next", "Next.js"],
        ["vite", "Vite"],
        ["@opencode-ai/plugin", "OpenCode Plugin SDK"],
        ["ink", "Ink TUI"],
        ["express", "Express"],
        ["fastify", "Fastify"],
        ["@nestjs/core", "NestJS"],
        ["vue", "Vue"],
        ["angular", "Angular"],
        ["svelte", "Svelte"],
        ["tailwindcss", "Tailwind CSS"],
        ["prisma", "Prisma"],
        ["drizzle-orm", "Drizzle"],
        ["@trpc/server", "tRPC"],
        ["zod", "Zod"],
        ["vitest", "Vitest"],
        ["jest", "Jest"],
        ["playwright", "Playwright"],
      ]

      for (const [depName, label] of stackSignals) {
        if (depName in deps) {
          snapshot.stackHints.push(label)
        }
      }
    }
  } catch {
    // Best-effort scan only
  }

  // Detect non-JS ecosystems
  const ecosystemFiles: Array<[string, string]> = [
    ["pyproject.toml", "Python"],
    ["requirements.txt", "Python"],
    ["go.mod", "Go"],
    ["Cargo.toml", "Rust"],
    ["Gemfile", "Ruby"],
    ["composer.json", "PHP"],
    ["build.gradle", "Java/Kotlin"],
    ["pom.xml", "Java (Maven)"],
    ["Package.swift", "Swift"],
    ["pubspec.yaml", "Dart/Flutter"],
    ["mix.exs", "Elixir"],
  ]
  for (const [file, label] of ecosystemFiles) {
    if (existsSync(join(directory, file))) {
      snapshot.stackHints.push(label)
    }
  }

  try {
    const entries = await readdir(directory, { withFileTypes: true })
    snapshot.topLevelDirs = entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .filter((name) => name !== "node_modules" && name !== ".git")
      .slice(0, 8)
  } catch {
    // Best-effort scan only
  }

  const artifactCandidates = [
    "README.md",
    "AGENTS.md",
    "CLAUDE.md",
    ".planning/ROADMAP.md",
    ".planning/STATE.md",
    ".spec-kit",
    "docs",
    ".opencode",
    "CHANGELOG.md",
    ".env.example",
    "docker-compose.yml",
    "Dockerfile",
    ".github/workflows",
    "turbo.json",
    "nx.json",
    "lerna.json",
  ]
  snapshot.artifactHints = artifactCandidates.filter((path) => existsSync(join(directory, path)))

  return snapshot
}

function formatHintList(items: string[]): string {
  if (items.length === 0) return "none detected"
  return items.join(", ")
}

function localized(language: "en" | "vi", en: string, vi: string): string {
  return language === "vi" ? vi : en
}

function getNextStepHint(
  language: "en" | "vi",
  state: { trajectory: string; tactic: string; action: string }
): string {
  if (!state.trajectory) {
    return localized(
      language,
      "Next: call `declare_intent` to set trajectory.",
      "Buoc tiep theo: goi `declare_intent` de dat trajectory."
    )
  }

  if (!state.tactic) {
    return localized(
      language,
      "Next: call `map_context` with level `tactic`.",
      "Buoc tiep theo: goi `map_context` voi level `tactic`."
    )
  }

  if (!state.action) {
    return localized(
      language,
      "Next: call `map_context` with level `action`.",
      "Buoc tiep theo: goi `map_context` voi level `action`."
    )
  }

  return localized(
    language,
    "Next: continue execution and checkpoint with `map_context` when focus changes.",
    "Buoc tiep theo: tiep tuc xu ly va checkpoint bang `map_context` khi doi focus."
  )
}

/**
 * Generates the behavioral bootstrap block injected when session is LOCKED.
 * This is the ZERO-cooperation activation path — teaches the agent what
 * HiveMind is and how to use it without requiring AGENTS.md reading,
 * skill loading, or any protocol. Pure prompt injection.
 *
 * Only shown when: governance_status === "LOCKED" AND turn_count <= 2
 * Budget: ~1100 chars (fits within expanded 4000-char budget)
 */
function generateBootstrapBlock(_governanceMode: string, language: "en" | "vi"): string {
  const lines: string[] = []
  lines.push("<hivemind-bootstrap>")
  lines.push(localized(language, "## HiveMind Context Governance", "## HiveMind Context Governance"))
  lines.push("")
  lines.push(localized(language, "### REQUIRED WORKFLOW", "### QUY TRINH BAT BUOC"))
  lines.push('1. **START**: `declare_intent({ mode, focus })`')
  lines.push('2. **DURING**: `map_context({ level, content })` when switching focus')
  lines.push('   - Reset drift, keep context active.')
  lines.push('3. **END**: `compact_session({ summary })`')
  lines.push('   - Archive and save memory.')
  lines.push("")
  lines.push(localized(language, "### CRITICAL TOOLS", "### CONG CU QUAN TRONG"))
  lines.push("- `scan_hierarchy`: Check decision tree & drift.")
  lines.push("- `think_back`: Refresh context.")
  lines.push("- `save_mem` / `recall_mems`: Long-term memory.")
  lines.push("- `todowrite` / `todoread`: Task tracking.")
  lines.push("</hivemind-bootstrap>")
  return lines.join("\n")
}
/**
 * Generates the setup guidance block when HiveMind is NOT initialized.
 * This fires when the plugin is loaded but `hivemind init` was never run
 * (no config.json exists). Guides the user to configure HiveMind.
 *
 * Highest priority — shown before any other governance content.
 */
async function generateSetupGuidanceBlock(directory: string): Promise<string> {
  const frameworkContext = await detectFrameworkContext(directory)
  const snapshot = await collectProjectSnapshot(directory)
  const frameworkLine =
    frameworkContext.mode === "both"
      ? "both .planning and .spec-kit detected (resolve conflict before implementation)"
      : frameworkContext.mode

  return [
    "<hivemind-setup>",
    "## HiveMind Context Governance — Setup Required",
    "",
    "HiveMind plugin is loaded but **not yet configured** for this project.",
    "",
    `Detected project: ${snapshot.projectName}`,
    `Framework context: ${frameworkLine}`,
    `Stack hints: ${formatHintList(snapshot.stackHints)}`,
    `Top-level dirs: ${formatHintList(snapshot.topLevelDirs)}`,
    `Artifacts: ${formatHintList(snapshot.artifactHints)}`,
    "",
    "Tell the user to run the setup wizard in their terminal:",
    "",
    "```",
    "npx hivemind-context-governance",
    "```",
    "",
    "This launches an interactive wizard to configure:",
    "- **Governance mode** (strict / assisted / permissive)",
    "- **Language** (English / Tiếng Việt)",
    "- **Automation level** (manual → guided → assisted → full → coach)",
    "- **Expert level** and **output style**",
    "- **Constraints** (code review, TDD)",
    "",
    "### First-Run Recon Protocol (required before coding)",
    "1. Scan repo structure and artifacts (glob + grep) to map code, plans, and docs.",
    "2. Read core files: package.json, README, AGENTS/CLAUDE, framework state docs.",
    "3. Isolate poisoning context: stale plans, duplicate artifacts, framework conflicts, old branch copies.",
    "4. Build a project backbone summary (architecture, workflow, constraints, active phase/spec).",
    "5. Only then call declare_intent/map_context and start implementation.",
    "",
    "Until configured, HiveMind remains in setup mode and should focus on project reconnaissance + cleanup guidance.",
    "",
    "**Quick alternative** (non-interactive):",
    "```",
    "npx hivemind-context-governance --mode assisted",
    "```",
    "</hivemind-setup>",
  ].join("\n")
}

function generateProjectBackboneBlock(
  language: "en" | "vi",
  snapshot: ProjectSnapshot,
  frameworkMode: string
): string {
  const title = localized(
    language,
    "First-run backbone: map project before coding.",
    "Backbone khoi dau: map du an truoc khi code."
  )
  const steps = localized(
    language,
    "Run quick scan -> read core docs -> isolate stale/conflicting artifacts -> declare intent.",
    "Quet nhanh -> doc tai lieu cot loi -> tach bo stale/xung dot -> khai bao intent."
  )

  return [
    "<hivemind-backbone>",
    title,
    `Project: ${snapshot.projectName} | Framework: ${frameworkMode}`,
    `Stack: ${formatHintList(snapshot.stackHints)}`,
    `Artifacts: ${formatHintList(snapshot.artifactHints)}`,
    steps,
    "</hivemind-backbone>",
  ].join("\n")
}

function generateEvidenceDisciplineBlock(language: "en" | "vi"): string {
  return [
    "<hivemind-evidence>",
    localized(language, "Evidence discipline: prove claims with command output before concluding.", "Ky luat chung cu: xac nhan ket qua bang output lenh truoc khi ket luan."),
    localized(language, "If verification fails, report mismatch and next corrective step.", "Neu xac minh that bai, bao cao sai lech va buoc sua tiep theo."),
    "</hivemind-evidence>",
  ].join("\n")
}

function generateTeamBehaviorBlock(language: "en" | "vi"): string {
  return [
    "<hivemind-team>",
    localized(language, "Team behavior: keep trajectory/tactic/action synchronized with work.", "Hanh vi nhom: dong bo trajectory/tactic/action voi cong viec dang lam."),
    localized(language, "After each meaningful shift, update with `map_context` before continuing.", "Sau moi thay doi quan trong, cap nhat bang `map_context` truoc khi tiep tuc."),
    "</hivemind-team>",
  ].join("\n")
}

/**
 * Compiles first-turn context from persistent state.
 * Fires on turns 0-1 to ensure the agent never starts blind.
 *
 * Pulls: anchors summary, mems count, prior session trajectory,
 * and resume instructions from last compaction report.
 *
 * Defers to compaction hook if this is a post-compaction session
 * (compaction_count > 0 && turn_count <= 1) to avoid duplicate injection.
 */
async function compileFirstTurnContext(
  directory: string,
  state: import("../schemas/brain-state.js").BrainState
): Promise<string> {
  const lines: string[] = ["<hivemind-context>"]

  // Skip if post-compaction — compaction hook handles context injection
  if ((state.last_compaction_time ?? 0) > 0 && state.metrics.turn_count <= 1) {
    lines.push("Post-compaction session — context injected by compaction hook.")
    lines.push("</hivemind-context>")
    return lines.join("\n")
  }

  // 1. Anchors summary (budget: 300 chars)
  try {
    const anchorsState = await loadAnchors(directory)
    if (anchorsState.anchors.length > 0) {
      const anchorSummary = anchorsState.anchors
        .slice(0, 5)
        .map((a) => `[${a.key}] ${a.value}`)
        .join("; ")
      lines.push(`Anchors (${anchorsState.anchors.length}): ${anchorSummary.slice(0, 280)}`)
    }
  } catch {
    // Non-fatal
  }

  // 2. Mems count + last 2 summaries (budget: 200 chars)
  try {
    const memsState = await loadMems(directory)
    if (memsState.mems.length > 0) {
      const recent = memsState.mems.slice(-2).map((m) => m.content.slice(0, 60)).join("; ")
      lines.push(`Mems (${memsState.mems.length}): ${recent.slice(0, 180)}`)
    }
  } catch {
    // Non-fatal
  }

  // 3. Prior session trajectory from manifest (budget: 200 chars)
  try {
    const manifest = await readManifest(directory)
    const priorSession = [...manifest.sessions]
      .reverse()
      .find((s) => s.status === "archived" || s.status === "compacted")
    if (priorSession) {
      const summary = priorSession.summary
        ? `: ${priorSession.summary.slice(0, 120)}`
        : ""
      const trajectory = priorSession.trajectory
        ? ` | Trajectory: ${priorSession.trajectory.slice(0, 80)}`
        : ""
      lines.push(`Prior session (${priorSession.stamp})${trajectory}${summary}`)
    }
  } catch {
    // Non-fatal
  }

  if (lines.length === 1) {
    // Only the opening tag — no context to show
    return ""
  }

  lines.push("</hivemind-context>")
  return lines.join("\n")
}

/**
 * Creates the session lifecycle hook (system prompt transform).
 *
 * Injects current session context into the system prompt:
 *   - Hierarchy state (trajectory/tactic/action)
 *   - Governance status (LOCKED/OPEN)
 *   - Session metrics (drift score, turn count)
 *   - Behavioral bootstrap (when LOCKED, first 2 turns)
 *   - First-turn context (anchors, mems, prior session — turns 0-1)
 *
 * Budget: ≤2500 chars normally, ≤4500 chars when bootstrap active.
 * Sections assembled by priority, lowest dropped if over budget. ADD, not REPLACE.
 */
export function createSessionLifecycleHook(
  log: Logger,
  directory: string,
  _initConfig: HiveMindConfig
) {
  const stateManager = createStateManager(directory, log)

  return async (
    input: { sessionID?: string; model?: any },
    output: { system: string[] }
  ): Promise<void> => {
    try {
      if (!input.sessionID) return

      if (isLegacyStructure(directory)) {
        await migrateIfNeeded(directory, log)
      }

      // Rule 6: Re-read config from disk each invocation
      const config = await loadConfig(directory)

      // FIRST-RUN DETECTION: If config.json doesn't exist, the user
      // never ran `hivemind init`. Inject setup guidance instead of
      // full governance — teach them how to configure.
      const configPath = getEffectivePaths(directory).config
      if (!existsSync(configPath)) {
        const setupBlock = await generateSetupGuidanceBlock(directory)
        output.system.push(setupBlock)
        await log.info("HiveMind not configured — injected setup guidance")
        return
      }

      // Load or create brain state
      let state = await stateManager.load()
      if (!state) {
        // First session — initialize
        await initializePlanningDirectory(directory)
        const sessionId = generateSessionId()
        state = createBrainState(sessionId, config)
        await stateManager.save(state)
      }

      // Time-to-Stale: auto-archive if session idle > configured days
      if (state && isSessionStale(state, config.stale_session_days)) {
        try {
          const activeMd = await readActiveMd(directory);
          const archiveContent = [
            `# Auto-Archived (Stale): ${state.session.id}`,
            "",
            `**Reason**: Session idle > ${config.stale_session_days} days`,
            `**Mode**: ${state.session.mode}`,
            `**Last Activity**: ${new Date(state.session.last_activity).toISOString()}`,
            `**Archived**: ${new Date().toISOString()}`,
            `**Turns**: ${state.metrics.turn_count}`,
            "",
            "## Session Content",
            activeMd.body,
          ].filter(Boolean).join("\n");

          const staleSessionId = state.session.id;
          await archiveSession(directory, staleSessionId, archiveContent);
          await updateIndexMd(directory, `[auto-archived: stale] ${staleSessionId}`);
          await resetActiveMd(directory);

          // Create fresh session
          const newId = generateSessionId();
          state = createBrainState(newId, config);
          await stateManager.save(state);
          await saveTree(directory, createTree())

          await log.info(`Auto-archived stale session ${staleSessionId}`);
        } catch (archiveError) {
          await log.error(`Failed to auto-archive stale session: ${archiveError}`);
          output.system.push(
            `[HIVEMIND][AUTO-ARCHIVE FAILED] Stale session archival failed; session remains active. Reason: ${archiveError}`
          )
        }
      }

      // Build sections in priority order
      const statusLines: string[] = []
      const hierarchyLines: string[] = []
      const ignoredLines: string[] = []
      const warningLines: string[] = []
      const frameworkLines: string[] = []
      const onboardingLines: string[] = []
      const anchorLines: string[] = []
      const metricsLines: string[] = []
      const configLines: string[] = []

      const frameworkContext = await detectFrameworkContext(directory)
      const projectSnapshot = await collectProjectSnapshot(directory)

      if (!state.hierarchy.trajectory && state.metrics.turn_count <= 1) {
        onboardingLines.push(
          generateProjectBackboneBlock(config.language, projectSnapshot, frameworkContext.mode)
        )
      }

      if (frameworkContext.mode === "gsd" && frameworkContext.gsdPhaseGoal) {
        frameworkLines.push(`GSD Phase Goal: ${frameworkContext.gsdPhaseGoal}`)
      }

      if (frameworkContext.mode === "both") {
        const menu = buildFrameworkSelectionMenu(frameworkContext)
        const selection = state.framework_selection
        const hasFrameworkChoice = selection.choice === "gsd" || selection.choice === "spec-kit"
        const hasGsdMetadata = selection.choice === "gsd" && selection.active_phase.trim().length > 0
        const hasSpecMetadata = selection.choice === "spec-kit" && selection.active_spec_path.trim().length > 0
        const hasValidSelection = hasFrameworkChoice && (hasGsdMetadata || hasSpecMetadata)

        frameworkLines.push("[FRAMEWORK CONFLICT] Both .planning and .spec-kit detected.")
        frameworkLines.push("Request consolidation first, then choose one framework before implementation.")

        if (selection.acceptance_note.trim().length > 0 && !hasValidSelection) {
          frameworkLines.push(
            "Override note captured, but framework selection is still required before implementation."
          )
        }

        if (frameworkContext.gsdPhaseGoal) {
          frameworkLines.push(`Pinned GSD goal: ${frameworkContext.gsdPhaseGoal}`)
        }

        frameworkLines.push("Locked menu:")
        for (const option of menu.options) {
          const required = option.requiredMetadata.length > 0
            ? ` (metadata: ${option.requiredMetadata.join(", ")})`
            : ""
          frameworkLines.push(`- ${option.label}${required}`)
        }
      }

      // STATUS (always shown)
      statusLines.push(`Session: ${state.session.governance_status} | Mode: ${state.session.mode} | Governance: ${state.session.governance_mode}`)
      statusLines.push(getNextStepHint(config.language, state.hierarchy))

      // HIERARCHY: prefer tree if available, fall back to flat
      if (treeExists(directory)) {
        try {
          const tree = await loadTree(directory);
          const stats = getTreeStats(tree);
          if (tree.root) {
            const treeView = toAsciiTree(tree);
            const treeLines = treeView.split('\n');
            
            // Smart hierarchy summarization for large trees
            if (treeLines.length > 8) {
              const cursorNode = getCursorNode(tree);
              let summaryLines: string[] = [];
              
              if (cursorNode) {
                // Show the path from root to cursor (current focus)
                const ancestors = getAncestors(tree.root, cursorNode.id);
                summaryLines.push("Current focus path:");
                ancestors.forEach((node, index) => {
                  const indent = "  ".repeat(index);
                  summaryLines.push(`${indent}${node.content}`);
                  
                  // Show immediate children of current node if it has any
                  if (node.id === cursorNode.id && node.children.length > 0) {
                    node.children.forEach(child => {
                      summaryLines.push(`${indent}  └─ ${child.content}`);
                    });
                  }
                });
              } else {
                // No cursor - show root and top-level structure
                summaryLines.push(treeLines[0]); // Root node
                if (tree.root.children.length > 0) {
                  summaryLines.push("  └─ " + tree.root.children.slice(0, 3).map(child => child.content).join(", "));
                  if (tree.root.children.length > 3) {
                    summaryLines.push(`  └─ ... and ${tree.root.children.length - 3} more tactics`);
                  }
                }
              }
              
              // Add statistics
              summaryLines.push(`\nTree statistics: ${stats.totalNodes} nodes (${stats.activeNodes} active, ${stats.completedNodes} completed, ${stats.blockedNodes} blocked)`);
              
              hierarchyLines.push(...summaryLines);
            } else {
              // Small tree - show full view
              hierarchyLines.push(treeView);
            }
          }
        } catch {
          // Fall back to flat if tree read fails
          if (state.hierarchy.trajectory) hierarchyLines.push(`Trajectory: ${state.hierarchy.trajectory}`)
          if (state.hierarchy.tactic) hierarchyLines.push(`Tactic: ${state.hierarchy.tactic}`)
          if (state.hierarchy.action) hierarchyLines.push(`Action: ${state.hierarchy.action}`)
        }
      } else {
        if (state.hierarchy.trajectory) hierarchyLines.push(`Trajectory: ${state.hierarchy.trajectory}`)
        if (state.hierarchy.tactic) hierarchyLines.push(`Tactic: ${state.hierarchy.tactic}`)
        if (state.hierarchy.action) hierarchyLines.push(`Action: ${state.hierarchy.action}`)
      }

      // No hierarchy = prompt to declare intent
      if (!state.hierarchy.trajectory && !state.hierarchy.tactic && !state.hierarchy.action) {
        if (config.governance_mode === "strict") {
          warningLines.push(localized(config.language, "No intent declared. Use declare_intent to unlock the session before writing.", "Chua khai bao intent. Dung declare_intent de mo khoa session truoc khi ghi file."))
        } else {
          warningLines.push(localized(config.language, "Tip: Use declare_intent to set your work focus for better tracking.", "Meo: dung declare_intent de dat focus cong viec va theo doi tot hon."))
        }
      }

      // WARNINGS (shown if present) — detection signal compilation
      // Read detection state from brain.json.metrics (written by soft-governance.ts)
      const detection: DetectionState = {
        consecutive_failures: state.metrics.consecutive_failures ?? 0,
        consecutive_same_section: state.metrics.consecutive_same_section ?? 0,
        last_section_content: state.metrics.last_section_content ?? "",
        tool_type_counts: state.metrics.tool_type_counts ?? createDetectionState().tool_type_counts,
        keyword_flags: state.metrics.keyword_flags ?? [],
      }

      // Compute timestamp gap from hierarchy tree
      let maxGapMs: number | undefined;
      let sessionFileLines: number | undefined;
      let completedBranchCount: number | undefined;
      if (treeExists(directory)) {
        try {
          const tree = await loadTree(directory);
          const gaps = detectGaps(tree);
          const staleGaps = gaps.filter(g => g.severity === "stale");
          if (staleGaps.length > 0) {
            maxGapMs = Math.max(...staleGaps.map(g => g.gapMs));
          }
          // Reuse loaded tree for completed branch count
          completedBranchCount = countCompleted(tree);
        } catch {
          // Tree read failure is non-fatal for detection
        }
      }

      // Compute session file line count (for max_active_md_lines threshold)
      try {
        const activeMd = await readActiveMd(directory);
        if (activeMd.body) {
          sessionFileLines = activeMd.body.split('\n').length;
        }
      } catch {
        // Non-fatal — line count is best-effort
      }

      // Compile detection signals with merged thresholds
      const mergedThresholds = { ...DEFAULT_THRESHOLDS, ...config.detection_thresholds }
      // Wire max_active_md_lines into detection thresholds (config → threshold bridge)
      if (!config.detection_thresholds?.session_file_lines) {
        mergedThresholds.session_file_lines = config.max_active_md_lines;
      }
      const signals = compileEscalatedSignals({
        turnCount: state.metrics.turn_count,
        detection,
        completedBranches: completedBranchCount,
        hierarchyActionEmpty: state.hierarchy.action === '',
        timestampGapMs: maxGapMs,
        sessionFileLines,
        missingTree: !treeExists(directory),
        writeWithoutReadCount: state.metrics.write_without_read_count ?? 0,
        thresholds: mergedThresholds,
        maxSignals: 3,
      })
      const signalBlock = formatSignals(signals)
      if (signalBlock && config.governance_mode !== "permissive") {
        warningLines.push(signalBlock)
      }

      const ignoredTier = compileIgnoredTier({
        counters: state.metrics.governance_counters,
        governanceMode: config.governance_mode,
        expertLevel: config.agent_behavior.expert_level,
        evidence: {
          declaredOrder: "declare_intent -> map_context(tactic) -> map_context(action) -> execution",
          actualOrder: `turn ${state.metrics.turn_count}: reads=${detection.tool_type_counts.read}, writes=${detection.tool_type_counts.write}, governance=${detection.tool_type_counts.governance}`,
          missingPrerequisites: [
            ...(state.hierarchy.trajectory ? [] : ["trajectory"]),
            ...(state.hierarchy.tactic ? [] : ["tactic"]),
            ...(state.hierarchy.action ? [] : ["action"]),
          ],
          expectedHierarchy: "trajectory -> tactic -> action",
          actualHierarchy: `trajectory=${state.hierarchy.trajectory || "(empty)"}, tactic=${state.hierarchy.tactic || "(empty)"}, action=${state.hierarchy.action || "(empty)"}`,
        },
      })
      if (ignoredTier) {
        ignoredLines.push(
          `[IGNORED] ${ignoredTier.unacknowledgedCycles} unacknowledged governance cycles. Tone: ${ignoredTier.tone}.`
        )
        ignoredLines.push(`  ${formatIgnoredEvidence(ignoredTier.evidence)}`)
      }

      if (frameworkContext.mode === "gsd" && frameworkContext.gsdPhaseGoal && config.governance_mode !== "permissive") {
        warningLines.push("Drift target: align hierarchy and current action with pinned GSD phase goal.")
      }

      // Legacy drift warning (kept for backward compat with tests)
      if (config.governance_mode !== "permissive" && state.metrics.drift_score < 50 && !signals.some(s => s.type === "turn_count")) {
        warningLines.push("⚠ High drift detected. Use map_context to re-focus.")
      }

      // PENDING FAILURE ACK — subagent reported failure, agent hasn't acknowledged
      if (config.governance_mode !== "permissive" && state.pending_failure_ack) {
        warningLines.push("⚠ SUBAGENT REPORTED FAILURE. Call export_cycle or map_context with status \"blocked\" before proceeding.")
      }

      // AUTOMATION LEVEL — coach mode = maximum pushback
      if (config.governance_mode !== "permissive" && (isCoachAutomation(config.automation_level) || config.automation_level === "full")) {
        warningLines.push("[ARGUE-BACK MODE] System WILL challenge claims without evidence. Do not proceed without validation.")
        if (state.metrics.turn_count > 0 && state.metrics.context_updates === 0) {
          warningLines.push(`⛔ ${state.metrics.turn_count} turns and 0 context updates. You MUST call map_context before continuing.`)
        }
      }

      // Chain breaks
      const chainBreaks = detectChainBreaks(state)
      if (config.governance_mode !== "permissive" && chainBreaks.length > 0) {
        warningLines.push("⚠ Chain breaks: " + chainBreaks.map(b => b.message).join("; "))
      }

      // Long session detection
      const longSession = detectLongSession(state, config.auto_compact_on_turns)
      if (longSession.isLong) {
        if (config.governance_mode === "permissive") {
          warningLines.push(`Info: ${longSession.suggestion}`)
        } else {
          warningLines.push(`⏰ ${longSession.suggestion}`)
        }
      }

      // TOOL ACTIVATION SUGGESTION
      const toolHint = getToolActivation(state, {
        completedBranches: completedBranchCount,
        hasMissingTree: !treeExists(directory),
        postCompaction: (state.last_compaction_time ?? 0) > 0 && state.metrics.turn_count <= 1,
      })
      if (toolHint) {
        warningLines.push(`💡 Suggested: ${toolHint.tool} — ${toolHint.reason}`)
      }

      // ANCHORS with age (shown if present)
      const anchorsState = await loadAnchors(directory)
      if (anchorsState.anchors.length > 0) {
        anchorLines.push("<immutable-anchors>")
        for (const anchor of anchorsState.anchors) {
          const age = Date.now() - anchor.created_at
          const ageStr = age < 3600000 ? `${Math.floor(age / 60000)}m ago` :
                         age < 86400000 ? `${Math.floor(age / 3600000)}h ago` :
                         `${Math.floor(age / 86400000)}d ago`
          anchorLines.push(`  [${anchor.key}] (${ageStr}): ${anchor.value}`)
        }
        anchorLines.push("</immutable-anchors>")
      }

      // TASKS
      const taskLines: string[] = []
      taskLines.push("[TASKS]")
      taskLines.push("- Remember to track your work. Use `todoread` to check pending tasks and `todowrite` to update status.")

      // METRICS (shown if space)
      metricsLines.push(`Turns: ${state.metrics.turn_count} | Drift: ${state.metrics.drift_score}/100 | Files: ${state.metrics.files_touched.length}`)

      // AGENT CONFIG (shown if space)
      const agentConfigPrompt = generateAgentBehaviorPrompt(config.agent_behavior)
      configLines.push(agentConfigPrompt)

      // BEHAVIORAL BOOTSTRAP — inject teaching block when session is LOCKED
      // This is the ZERO-cooperation activation path (L7 fix)
      const bootstrapLines: string[] = []
      const firstTurnContextLines: string[] = []
      const evidenceLines: string[] = []
      const teamLines: string[] = []
      const readFirstLines: string[] = []
      const isBootstrapActive = state.metrics.turn_count <= 2

      // NEW: Detect clean state (new project, no prior work)
      const isCleanState = state.metrics.turn_count === 0 &&
        (!state.hierarchy.trajectory && !state.hierarchy.tactic && !state.hierarchy.action)

      if (isCleanState) {
        // Inject "READ FIRST" guidance for new/clean state
        readFirstLines.push("<read-first>")
        readFirstLines.push("## STATE: NEW PROJECT / CLEAN STATE")
        readFirstLines.push("")
        readFirstLines.push("This is a NEW project or clean state. Before ANY work:")
        readFirstLines.push("1. **SCAN first**: Use `scan_hierarchy({ action: \"analyze\" })` to understand project")
        readFirstLines.push("2. **READ master plan**: Check `docs/plans/` for existing plans")
        readFirstLines.push("3. **DECIDE focus**: Then call `declare_intent({ mode, focus })`")
        readFirstLines.push("")
        readFirstLines.push("Do NOT start writing code until you understand the project structure.")
        readFirstLines.push("</read-first>")
      }

      if (isBootstrapActive) {
        bootstrapLines.push(generateBootstrapBlock(config.governance_mode, config.language))
        evidenceLines.push(generateEvidenceDisciplineBlock(config.language))
        teamLines.push(generateTeamBehaviorBlock(config.language))

        // First-turn context: anchors, mems, prior session (agent never starts blind)
        const ftContext = await compileFirstTurnContext(directory, state)
        if (ftContext) {
          firstTurnContextLines.push(ftContext)
        }
      }

      // Assemble by priority — drop lowest priority sections if over budget
      // Budget expands to 4500 when bootstrap is active (first turns need teaching + context)
      const BUDGET_CHARS = isBootstrapActive ? 4500 : 2500
      const sections = [
        readFirstLines,    // P-1: ALWAYS first for clean state - READ BEFORE WORK
        bootstrapLines, // P0: behavioral bootstrap (only when LOCKED, first 2 turns)
        firstTurnContextLines, // P0.3: first-turn context (anchors, mems, prior session)
        evidenceLines,  // P0.5: evidence discipline from turn 0
        teamLines,      // P0.6: team behavior from turn 0
        onboardingLines, // P0.7: first-run project backbone guidance
        frameworkLines, // P0.8: framework context and conflict routing
        statusLines,    // P1: always
        hierarchyLines, // P2: always
        taskLines,      // P2.2: Task reminders
        ignoredLines,   // P2.5: IGNORED tri-evidence is non-negotiable
        warningLines,   // P3: if present
        anchorLines,    // P4: if present
        metricsLines,   // P5: if space
        configLines,    // P6: if space (agent config is lowest priority per-turn)
      ]

      const finalLines: string[] = ['<hivemind>']
      for (const section of sections) {
        if (section.length === 0) continue
        const candidate = [...finalLines, ...section, '</hivemind>'].join('\n')
        if (candidate.length <= BUDGET_CHARS) {
          finalLines.push(...section)
        } else {
          await log.debug(`Section dropped due to budget: ${section[0]?.slice(0, 40)}...`)
        }
      }
      finalLines.push('</hivemind>')

      const injection = finalLines.join('\n')

      output.system.push(injection)

      await log.debug(
        `Session lifecycle: injected ${injection.length} chars`
      )
    } catch (error) {
      // P3: Never break session lifecycle
      await log.error(`Session lifecycle hook error: ${error}`)
    }
  }
}
