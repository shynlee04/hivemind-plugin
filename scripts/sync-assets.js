import { existsSync, mkdirSync, readdirSync, rmSync, cpSync, readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";

// ── Mode detection ──────────────────────────────────────────────────────────
const installMode = process.argv.slice(2).includes("--mode=install");
const logPrefix = installMode ? "[postinstall]" : "[Harness Build]";

// ── Dual-root resolution ──────────────────────────────────────────────────
const stage = {
  sourceRoot: process.cwd(),
  consumerRoot: installMode
    ? (process.env.INIT_CWD ?? process.cwd())
    : process.cwd(),
};

// ── Version drift hot path (install mode only) ──────────────────────────
if (installMode) {
  try {
    const pkgVersion = JSON.parse(
      readFileSync(join(stage.sourceRoot, "package.json"), "utf-8"),
    ).version;
    const versionJsonPath = join(
      stage.consumerRoot,
      ".hivemind",
      "state",
      "version.json",
    );
    if (existsSync(versionJsonPath)) {
      const installedVersion = JSON.parse(
        readFileSync(versionJsonPath, "utf-8"),
      ).version;
      if (installedVersion === pkgVersion) {
        console.log(
          `[postinstall] Version ${pkgVersion} unchanged — skipping sync`,
        );
        process.exit(0);
      }
    }
  } catch {
    // On any error in version check, fall through to normal sync
  }
}

const projectRoot = stage.sourceRoot;
const assetsRoot = join(projectRoot, "assets");

const PRIMITIVE_MAP = {
  agents: join(stage.consumerRoot, ".opencode", "agents"),
  skills: join(stage.consumerRoot, ".opencode", "skills"),
  commands: join(stage.consumerRoot, ".opencode", "commands"),
  workflows: join(stage.consumerRoot, ".opencode", "workflows"),
  references: join(stage.consumerRoot, ".opencode", "references"),
  templates: join(stage.consumerRoot, ".opencode", "templates"),
};



// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Backup a file to a `.backup/` folder next to it.
 *   .opencode/commands/file.md → .opencode/commands/.backup/file.md
 */
function backupFile(filePath) {
  const dir = dirname(filePath);
  const entry = filePath.split("/").pop();
  const backupDir = join(dir, ".backup");
  mkdirSync(backupDir, { recursive: true });
  const backupPath = join(backupDir, entry);
  if (!existsSync(backupPath)) {
    cpSync(filePath, backupPath, { recursive: true });
  }
  return backupPath;
}

function shouldSkipGsd(entry) {
  return entry.startsWith("gsd-") || entry === "gsd";
}

function isMetaEntry(entry) {
  return entry === ".gitkeep" || entry === ".backup";
}

console.log(
  `${logPrefix} Reflecting primitives from assets/ to runtime locations...`,
);

try {
  for (const [kind, targetDir] of Object.entries(PRIMITIVE_MAP)) {
    const sourceDir = join(assetsRoot, kind);

    if (!existsSync(sourceDir)) {
      console.log(
        `${logPrefix} Skipping ${kind}: no assets/${kind} directory`,
      );
      continue;
    }

    if (installMode) {
      // ── INSTALL MODE: Non-destructive per-file merge ──────────────────
      mkdirSync(targetDir, { recursive: true });
      for (const entry of readdirSync(sourceDir)) {
        if (entry === ".gitkeep" || shouldSkipGsd(entry)) continue;
        const srcPath = join(sourceDir, entry);
        const destPath = join(targetDir, entry);
        if (existsSync(destPath)) {
          try {
            const existingContent = readFileSync(destPath, "utf-8");
            const sourceContent = readFileSync(srcPath, "utf-8");
            if (existingContent === sourceContent) {
              continue; // Identical — skip (no-op)
            }
            // Content differs — user has modified this file
            backupFile(destPath);
            console.log(
              `${logPrefix} ⚠ Preserved user-modified ${entry} → .backup/${entry}`,
            );
            console.log(
              `${logPrefix} ⚠ Skipping ${kind}/${entry} — user-modified. Backup: .backup/${entry}`,
            );
            continue;
          } catch {
            // Binary or unreadable — skip diff check
            continue;
          }
        }
        // Target doesn't exist — fresh copy
        cpSync(srcPath, destPath, { recursive: true });
      }
      console.log(
        `${logPrefix} Reflected ${kind} (install-mode, non-destructive)`,
      );
      continue; // Skip the build-mode cleanup below
    }

    // ── BUILD MODE: Destructive cleanup + re-copy ───────────────────────
    if (existsSync(targetDir)) {
      for (const entry of readdirSync(targetDir)) {
        if (isMetaEntry(entry)) continue;

        const targetPath = join(targetDir, entry);
        backupFile(targetPath);
        console.log(
          `${logPrefix} Backed up ${targetPath} → .backup/${entry}`,
        );

        // Conflict detection: warn if source exists and content differs
        const sourcePath = join(assetsRoot, kind, entry);
        if (existsSync(sourcePath)) {
          try {
            const existingContent = readFileSync(targetPath, "utf-8");
            const sourceContent = readFileSync(sourcePath, "utf-8");
            if (existingContent !== sourceContent) {
              console.log(
                `${logPrefix} ⚠ Conflict detected: ${kind}/${entry} differs from assets/ version. Backup saved to .backup/${entry}`,
              );
            }
          } catch {
            // Binary or unreadable files: skip diff check silently
          }
        }
      }
      rmSync(targetDir, { recursive: true, force: true });
    }
    mkdirSync(targetDir, { recursive: true });

    for (const entry of readdirSync(sourceDir)) {
      if (entry === ".gitkeep") continue;
      if (shouldSkipGsd(entry)) continue;

      const srcPath = join(sourceDir, entry);
      const destPath = join(targetDir, entry);

      cpSync(srcPath, destPath, { recursive: true });
    }
    console.log(
      `${logPrefix} Reflected ${kind} from assets/${kind} to ${targetDir}`,
    );
  }



  // Write version stamp after successful install-mode sync
  if (installMode) {
    try {
      const pkgVersion = JSON.parse(
        readFileSync(join(stage.sourceRoot, "package.json"), "utf-8"),
      ).version;
      const versionDir = join(stage.consumerRoot, ".hivemind", "state");
      mkdirSync(versionDir, { recursive: true });
      writeFileSync(
        join(versionDir, "version.json"),
        JSON.stringify({ version: pkgVersion }, null, 2),
      );
    } catch {
      // Non-critical: skip version stamp write on error
    }
  }

  console.log(
    `${logPrefix} Assets reflection completed.`,
  );
} catch (err) {
  console.error(
    "[postinstall] Error during primitive extraction:",
    err.message,
  );
  process.exit(1);
}
