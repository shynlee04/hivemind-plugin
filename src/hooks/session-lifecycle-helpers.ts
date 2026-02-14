import { existsSync } from "node:fs";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { loadAnchors } from "../lib/anchors.js";
import { loadMems } from "../lib/mems.js";
import { readManifest } from "../lib/planning-fs.js";
import { detectFrameworkContext } from "../lib/framework-context.js";
import type { BrainState } from "../schemas/brain-state.js";

export interface ProjectSnapshot {
  projectName: string;
  topLevelDirs: string[];
  artifactHints: string[];
  stackHints: string[];
}

export async function collectProjectSnapshot(directory: string): Promise<ProjectSnapshot> {
  const snapshot: ProjectSnapshot = {
    projectName: "(unknown project)",
    topLevelDirs: [],
    artifactHints: [],
    stackHints: [],
  };

  try {
    const packagePath = join(directory, "package.json");
    if (existsSync(packagePath)) {
      const raw = await readFile(packagePath, "utf-8");
      const pkg = JSON.parse(raw) as {
        name?: string;
        dependencies?: Record<string, string>;
        devDependencies?: Record<string, string>;
        peerDependencies?: Record<string, string>;
      };
      if (pkg.name?.trim()) {
        snapshot.projectName = pkg.name.trim();
      }

      const deps = {
        ...(pkg.dependencies ?? {}),
        ...(pkg.devDependencies ?? {}),
        ...(pkg.peerDependencies ?? {}),
      };

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
      ];

      for (const [depName, label] of stackSignals) {
        if (depName in deps) {
          snapshot.stackHints.push(label);
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
  ];
  for (const [file, label] of ecosystemFiles) {
    if (existsSync(join(directory, file))) {
      snapshot.stackHints.push(label);
    }
  }

  try {
    const entries = await readdir(directory, { withFileTypes: true });
    snapshot.topLevelDirs = entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .filter((name) => name !== "node_modules" && name !== ".git")
      .slice(0, 8);
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
  ];
  snapshot.artifactHints = artifactCandidates.filter((path) => existsSync(join(directory, path)));

  return snapshot;
}

export function formatHintList(items: string[]): string {
  if (items.length === 0) return "none detected";
  return items.join(", ");
}

export function localized(language: "en" | "vi", en: string, vi: string): string {
  return language === "vi" ? vi : en;
}

export function getNextStepHint(
  language: "en" | "vi",
  state: { trajectory: string; tactic: string; action: string }
): string {
  if (!state.trajectory) {
    return localized(
      language,
      "Next: call `declare_intent` to set trajectory.",
      "Buoc tiep theo: goi `declare_intent` de dat trajectory."
    );
  }

  if (!state.tactic) {
    return localized(
      language,
      "Next: call `map_context` with level `tactic`.",
      "Buoc tiep theo: goi `map_context` voi level `tactic`."
    );
  }

  if (!state.action) {
    return localized(
      language,
      "Next: call `map_context` with level `action`.",
      "Buoc tiep theo: goi `map_context` voi level `action`."
    );
  }

  return localized(
    language,
    "Next: continue execution and checkpoint with `map_context` when focus changes.",
    "Buoc tiep theo: tiep tuc xu ly va checkpoint bang `map_context` khi doi focus."
  );
}

export function generateBootstrapBlock(_governanceMode: string, language: "en" | "vi"): string {
  const lines: string[] = [];
  lines.push("<hivemind-bootstrap>");
  lines.push(localized(language, "## HiveMind Context Governance", "## HiveMind Context Governance"));
  lines.push("");
  lines.push(localized(language, "### REQUIRED WORKFLOW", "### QUY TRINH BAT BUOC"));
  lines.push('1. **START**: `declare_intent({ mode, focus })`');
  lines.push('2. **DURING**: `map_context({ level, content })` when switching focus');
  lines.push('   - Reset drift, keep context active.');
  lines.push('3. **END**: `compact_session({ summary })`');
  lines.push('   - Archive and save memory.');
  lines.push("");
  lines.push(localized(language, "### CRITICAL TOOLS", "### CONG CU QUAN TRONG"));
  lines.push("- `scan_hierarchy`: Check decision tree & drift.");
  lines.push("- `think_back`: Refresh context.");
  lines.push("- `save_mem` / `recall_mems`: Long-term memory.");
  lines.push("- `todowrite` / `todoread`: Task tracking.");
  lines.push("</hivemind-bootstrap>");
  return lines.join("\n");
}

export async function generateSetupGuidanceBlock(directory: string): Promise<string> {
  const frameworkContext = await detectFrameworkContext(directory);
  const snapshot = await collectProjectSnapshot(directory);
  const frameworkLine =
    frameworkContext.mode === "both"
      ? "both .planning and .spec-kit detected (resolve conflict before implementation)"
      : frameworkContext.mode;

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
    "- **Automation level** (manual → guided → assisted → full → retard)",
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
    "npx hivemind-context-governance --quick",
    "```",
    "</hivemind-setup>",
  ].join("\n");
}

export function generateEvidenceDisciplineBlock(language: "en" | "vi"): string {
  return [
    "<hivemind-evidence>",
    localized(language, "Evidence discipline: prove claims with command output before concluding.", "Ky luat chung cu: xac nhan ket qua bang output lenh truoc khi ket luan."),
    localized(language, "If verification fails, report mismatch and next corrective step.", "Neu xac minh that bai, bao cao sai lech va buoc sua tiep theo."),
    "</hivemind-evidence>",
  ].join("\n");
}

export function generateTeamBehaviorBlock(language: "en" | "vi"): string {
  return [
    "<hivemind-team>",
    localized(language, "Team behavior: keep trajectory/tactic/action synchronized with work.", "Hanh vi nhom: dong bo trajectory/tactic/action voi cong viec dang lam."),
    localized(language, "After each meaningful shift, update with `map_context` before continuing.", "Sau moi thay doi quan trong, cap nhat bang `map_context` truoc khi tiep tuc."),
    "</hivemind-team>",
  ].join("\n");
}

export async function compileFirstTurnContext(
  directory: string,
  state: BrainState
): Promise<string> {
  const lines: string[] = ["<hivemind-context>"];

  // Skip if post-compaction — compaction hook handles context injection
  if ((state.last_compaction_time ?? 0) > 0 && state.metrics.turn_count <= 1) {
    lines.push("Post-compaction session — context injected by compaction hook.");
    lines.push("</hivemind-context>");
    return lines.join("\n");
  }

  // 1. Anchors summary (budget: 300 chars)
  try {
    const anchorsState = await loadAnchors(directory);
    if (anchorsState.anchors.length > 0) {
      const anchorSummary = anchorsState.anchors
        .slice(0, 5)
        .map((a) => `[${a.key}] ${a.value}`)
        .join("; ");
      lines.push(`Anchors (${anchorsState.anchors.length}): ${anchorSummary.slice(0, 280)}`);
    }
  } catch {
    // Non-fatal
  }

  // 2. Mems count + last 2 summaries (budget: 200 chars)
  try {
    const memsState = await loadMems(directory);
    if (memsState.mems.length > 0) {
      const recent = memsState.mems.slice(-2).map((m) => m.content.slice(0, 60)).join("; ");
      lines.push(`Mems (${memsState.mems.length}): ${recent.slice(0, 180)}`);
    }
  } catch {
    // Non-fatal
  }

  // 3. Prior session trajectory from manifest (budget: 200 chars)
  try {
    const manifest = await readManifest(directory);
    const priorSession = [...manifest.sessions]
      .reverse()
      .find((s) => s.status === "archived" || s.status === "compacted");
    if (priorSession) {
      const summary = priorSession.summary
        ? `: ${priorSession.summary.slice(0, 120)}`
        : "";
      const trajectory = priorSession.trajectory
        ? ` | Trajectory: ${priorSession.trajectory.slice(0, 80)}`
        : "";
      lines.push(`Prior session (${priorSession.stamp})${trajectory}${summary}`);
    }
  } catch {
    // Non-fatal
  }

  if (lines.length === 1) {
    // Only the opening tag — no context to show
    return "";
  }

  lines.push("</hivemind-context>");
  return lines.join("\n");
}

export function generateProjectBackboneBlock(
  language: "en" | "vi",
  snapshot: ProjectSnapshot,
  frameworkMode: string
): string {
  const title = localized(
    language,
    "First-run backbone: map project before coding.",
    "Backbone khoi dau: map du an truoc khi code."
  );
  const steps = localized(
    language,
    "Run quick scan -> read core docs -> isolate stale/conflicting artifacts -> declare intent.",
    "Quet nhanh -> doc tai lieu cot loi -> tach bo stale/xung dot -> khai bao intent."
  );

  return [
    "<hivemind-backbone>",
    title,
    `Project: ${snapshot.projectName} | Framework: ${frameworkMode}`,
    `Stack: ${formatHintList(snapshot.stackHints)}`,
    `Artifacts: ${formatHintList(snapshot.artifactHints)}`,
    steps,
    "</hivemind-backbone>",
  ].join("\n");
}
