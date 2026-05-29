import { existsSync, mkdirSync, readdirSync, rmSync, cpSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

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

console.log(
  `${logPrefix} Reflecting primitives from assets/ to runtime locations...`,
);

let mirrorCount = 0;

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
        if (entry === ".gitkeep" || entry.startsWith("gsd-") || entry === "gsd")
          continue;
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
            const backupPath = destPath + ".backup";
            if (!existsSync(backupPath)) {
              cpSync(destPath, backupPath, { recursive: true });
              console.log(
                `${logPrefix} ⚠ Preserved user-modified ${entry} → ${entry}.backup`,
              );
            }
            console.log(
              `${logPrefix} ⚠ Skipping ${kind}/${entry} — user-modified. Backup: ${entry}.backup`,
            );
            continue;
          } catch {
            // Binary or unreadable — skip diff check
            continue;
          }
        }
        // Target doesn't exist — fresh copy
        cpSync(srcPath, destPath, { recursive: true });
        if (kind === "commands") mirrorCount++;
      }
      console.log(
        `${logPrefix} Reflected ${kind} (install-mode, non-destructive)`,
      );
      continue; // Skip the build-mode cleanup below
    }

    // ── BUILD MODE: Destructive cleanup + re-copy (unchanged) ──────────
    if (existsSync(targetDir)) {
      for (const entry of readdirSync(targetDir)) {
        if (entry === ".gitkeep" || entry.endsWith(".backup")) continue;
        const targetPath = join(targetDir, entry);
        const backupPath = targetPath + ".backup";
        if (!existsSync(backupPath)) {
          cpSync(targetPath, backupPath, { recursive: true });
          console.log(
            `${logPrefix} Backed up ${targetPath} → ${backupPath}`,
          );
        }
        // Conflict detection: warn if source exists and content differs
        const sourcePath = join(assetsRoot, kind, entry);
        if (existsSync(sourcePath)) {
          try {
            const existingContent = readFileSync(targetPath, "utf-8");
            const sourceContent = readFileSync(sourcePath, "utf-8");
            if (existingContent !== sourceContent) {
              console.log(
                `${logPrefix} ⚠ Conflict detected: ${kind}/${entry} differs from assets/ version. Backup saved to ${backupPath}`,
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
      if (entry.startsWith("gsd-") || entry === "gsd") continue;

      const srcPath = join(sourceDir, entry);
      const destPath = join(targetDir, entry);

      cpSync(srcPath, destPath, { recursive: true });
      if (kind === "commands") mirrorCount++;
    }
    console.log(
      `${logPrefix} Reflected ${kind} from assets/${kind} to ${targetDir}`,
    );
  }

  // Mirror commands/ → command/ for dual-directory compatibility per AGENTS.md §4
  if (mirrorCount > 0) {
    const commandsDir = PRIMITIVE_MAP.commands;
    const commandMirrorDir = join(
      stage.consumerRoot,
      ".opencode",
      "command",
    );
    if (!existsSync(commandMirrorDir)) {
      mkdirSync(commandMirrorDir, { recursive: true });
    }
    let mirrored = 0;
    for (const entry of readdirSync(commandsDir)) {
      if (entry === ".gitkeep" || entry.endsWith(".backup")) continue;
      if (entry.startsWith("gsd-") || entry === "gsd") continue;
      const srcPath = join(commandsDir, entry);
      const destPath = join(commandMirrorDir, entry);
      if (existsSync(destPath)) {
        if (installMode) {
          // Non-destructive: compare content
          try {
            const existingContent = readFileSync(destPath, "utf-8");
            const sourceContent = readFileSync(srcPath, "utf-8");
            if (existingContent === sourceContent) continue; // identical
            // Differs — backup + skip
            const backupPath = destPath + ".backup";
            if (!existsSync(backupPath)) {
              cpSync(destPath, backupPath, { recursive: true });
            }
            continue;
          } catch {
            /* skip */
          }
        } else {
          // Build mode: existing backup + overwrite logic
          const backupPath = destPath + ".backup";
          if (!existsSync(backupPath)) {
            cpSync(destPath, backupPath, { recursive: true });
            console.log(
              `${logPrefix} Backed up ${destPath} → ${backupPath}`,
            );
          }
          // Conflict detection
          try {
            const existingContent = readFileSync(destPath, "utf-8");
            const sourceContent = readFileSync(srcPath, "utf-8");
            if (existingContent !== sourceContent) {
              console.log(
                `${logPrefix} ⚠ Conflict detected: command/${entry} differs from commands/ version. Backup saved to ${backupPath}`,
              );
            }
          } catch {
            // Binary or unreadable: skip diff
          }
        }
      }
      if (!installMode || !existsSync(destPath)) {
        cpSync(srcPath, destPath, { recursive: true });
        mirrored++;
      }
    }
    console.log(
      `${logPrefix} Mirrored ${mirrored} commands to ${commandMirrorDir}`,
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
    `${logPrefix} Assets reflection completed. Synced ${mirrorCount} commands, mirrored to command/ directory.`,
  );
} catch (err) {
  console.error(
    "[postinstall] Error during primitive extraction:",
    err.message,
  );
  process.exit(1);
}
