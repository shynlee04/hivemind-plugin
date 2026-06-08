import { existsSync, mkdirSync, readdirSync, rmSync, cpSync, readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

// ── Mode detection ──────────────────────────────────────────────────────────
const installMode = process.argv.slice(2).includes("--mode=install");
const logPrefix = installMode ? "[postinstall]" : "[Harness Build]";

// ── Dual-root resolution ──────────────────────────────────────────────────
const stage = {
  sourceRoot: dirname(dirname(fileURLToPath(import.meta.url))),
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

// ── GSD Manifest Protection ─────────────────────────────────────────────────
// Load the gsd-file-manifest.json to explicitly protect user-installed
// third-party primitives in .opencode/ from being overwritten or deleted.
const gsdManifestPath = join(stage.consumerRoot, ".opencode", "gsd-file-manifest.json");
let protectedGsdFiles = new Set();
if (existsSync(gsdManifestPath)) {
  try {
    const manifest = JSON.parse(readFileSync(gsdManifestPath, "utf-8"));
    if (manifest.files) {
      for (const relativePath of Object.keys(manifest.files)) {
        protectedGsdFiles.add(relativePath);
      }
    }
    console.log(`${logPrefix} Loaded ${protectedGsdFiles.size} protected paths from gsd-file-manifest.json`);
  } catch (err) {
    console.warn(`${logPrefix} Warning: Could not parse gsd-file-manifest.json, proceeding without manifest protection.`, err.message);
  }
}

function isGsdProtected(relativePath) {
  return protectedGsdFiles.has(relativePath);
}

const PRIMITIVE_MAP = {
  agents: join(stage.consumerRoot, ".opencode", "agents"),
  skills: join(stage.consumerRoot, ".opencode", "skills"),
  commands: join(stage.consumerRoot, ".opencode", "commands"),
  workflows: join(stage.consumerRoot, ".opencode", "workflows"),
  references: join(stage.consumerRoot, ".opencode", "references"),
  templates: join(stage.consumerRoot, ".opencode", "templates"),
  tools: join(stage.consumerRoot, ".opencode", "tools"),
  rules: join(stage.consumerRoot, ".opencode", "rules"),
};

// ── Excluded assets/ subdirectories (defensive documentation) ──────────────
// These subdirectories are intentionally NOT deployed to .opencode/.
// PRIMITIVE_MAP above iterates only the 7 primitive kinds, so by construction
// these are skipped. We list them here for self-documentation so future
// maintainers understand the boundary without re-deriving it from PRIMITIVE_MAP.
//
// Per AUDIT-04 (F-C) and master plan §13 Q4:
//   - assets/.archive/        : archive for superseded / dev-tooling-only assets
//   - assets/.hivemind-config/: internal Hivemind config root (naming rules, validators)
//   - assets/.hivemind/       : runtime state (consumed by Hivemind engine, not OpenCode)
//   - assets/.opencode/       : auxiliary opencode.json source (synced explicitly below)
const EXCLUDED_ASSETS_SUBDIRS = new Set([
  ".archive",
  ".hivemind-config",
  ".hivemind",
  ".opencode",
]);



// ── Root-level files (outside .opencode/) ──────────────────────────────────────

/**
 * Sync a root-level file from assets/ to project root.
 * Backs up existing file before overwriting.
 */
function syncRootFile(sourcePath, destPath) {
  if (!existsSync(sourcePath)) {
    console.log(`${logPrefix} Skipping root file sync: source ${sourcePath} does not exist`);
    return;
  }
  if (existsSync(destPath)) {
    const srcContent = readFileSync(sourcePath, "utf-8");
    const dstContent = readFileSync(destPath, "utf-8");
    if (srcContent === dstContent) {
      console.log(`${logPrefix} Root file ${destPath} is up-to-date`);
      return;
    }
    backupFile(destPath);
    console.log(`${logPrefix} Root file ${destPath} backed up and overwritten`);
  }
  cpSync(sourcePath, destPath, { recursive: true });
  console.log(`${logPrefix} Root file ${destPath} synced`);
}

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
        
        const relativePath = join(kind, entry);
        if (isGsdProtected(relativePath)) {
          console.log(`${logPrefix} 🔒 Skipping ${relativePath} — protected by gsd-file-manifest.json (user-installed)`);
          continue;
        }

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

    // ── BUILD MODE: Non-destructive source-only sync ─────────────────────
    // Only touches files that have a corresponding source in assets/.
    // User-created primitives (files NOT in assets/) are left completely alone.
    mkdirSync(targetDir, { recursive: true });

    for (const entry of readdirSync(sourceDir)) {
      if (entry === ".gitkeep") continue;
      if (shouldSkipGsd(entry)) continue;

      const relativePath = join(kind, entry);
      if (isGsdProtected(relativePath)) {
        console.log(`${logPrefix} 🔒 Skipping ${relativePath} — protected by gsd-file-manifest.json (user-installed)`);
        continue;
      }

      const srcPath = join(sourceDir, entry);
      const destPath = join(targetDir, entry);

      if (existsSync(destPath)) {
        try {
          const existingContent = readFileSync(destPath, "utf-8");
          const sourceContent = readFileSync(srcPath, "utf-8");
          if (existingContent === sourceContent) {
            continue; // Identical — skip (no-op)
          }
          // Content differs — backup user/modified version, then overwrite
          backupFile(destPath);
          console.log(
            `${logPrefix} ⚠ ${kind}/${entry} differs from assets/ — backed up to .backup/${entry}, overwriting with assets/ version`,
          );
        } catch {
          // Binary or unreadable — skip diff check
          continue;
        }
      }

      cpSync(srcPath, destPath, { recursive: true });
    }
    console.log(
      `${logPrefix} Reflected ${kind} from assets/${kind} to ${targetDir} (non-destructive)`,
    );
  }



  // ── Root-level opencode.json.example sync ─────────────────────────────
  // The shipped artifact is opencode.json.example (not opencode.json) so the
  // user's local dev opencode.json is never overwritten by the build/install
  // pipeline. Users copy opencode.json.example → opencode.json to bootstrap.
  const shippedSource = join(assetsRoot, ".opencode", "opencode.json.example");
  const destConfig = join(stage.consumerRoot, "opencode.json.example");
  syncRootFile(shippedSource, destConfig);

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
