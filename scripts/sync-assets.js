import { existsSync, mkdirSync, readdirSync, rmSync, cpSync, readFileSync } from "node:fs";
import { join } from "node:path";

const projectRoot = process.cwd();
const assetsRoot = join(projectRoot, "assets");

const PRIMITIVE_MAP = {
  agents: join(projectRoot, ".opencode", "agents"),
  skills: join(projectRoot, ".opencode", "skills"),
  commands: join(projectRoot, ".opencode", "commands"),
  workflows: join(projectRoot, ".opencode", "workflows"),
  references: join(projectRoot, ".opencode", "references"),
  templates: join(projectRoot, ".opencode", "templates"),
};

console.log("[Harness Build] Reflecting primitives from assets/ to runtime locations...");

let mirrorCount = 0;

for (const [kind, targetDir] of Object.entries(PRIMITIVE_MAP)) {
  const sourceDir = join(assetsRoot, kind);

  if (!existsSync(sourceDir)) {
    console.log(`[Harness Build] Skipping ${kind}: no assets/${kind} directory`);
    continue;
  }

  // Clean target then recreate (with backup before destructive overwrite)
  if (existsSync(targetDir)) {
    for (const entry of readdirSync(targetDir)) {
      if (entry === ".gitkeep" || entry.endsWith(".backup")) continue;
      const targetPath = join(targetDir, entry);
      const backupPath = targetPath + ".backup";
      if (!existsSync(backupPath)) {
        cpSync(targetPath, backupPath, { recursive: true });
        console.log(`[Harness Build] Backed up ${targetPath} → ${backupPath}`);
      }
      // Conflict detection: warn if source exists and content differs
      const sourcePath = join(assetsRoot, kind, entry);
      if (existsSync(sourcePath)) {
        try {
          const existingContent = readFileSync(targetPath, "utf-8");
          const sourceContent = readFileSync(sourcePath, "utf-8");
          if (existingContent !== sourceContent) {
            console.log(`[Harness Build] ⚠ Conflict detected: ${kind}/${entry} differs from assets/ version. Backup saved to ${backupPath}`);
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
  console.log(`[Harness Build] Reflected ${kind} from assets/${kind} to ${targetDir}`);
}

// Mirror commands/ → command/ for dual-directory compatibility per AGENTS.md §4
if (mirrorCount > 0) {
  const commandsDir = PRIMITIVE_MAP.commands;
  const commandMirrorDir = join(projectRoot, ".opencode", "command");
  if (!existsSync(commandMirrorDir)) {
    mkdirSync(commandMirrorDir, { recursive: true });
  }
  let mirrored = 0;
  for (const entry of readdirSync(commandsDir)) {
    if (entry === ".gitkeep" || entry.endsWith(".backup")) continue;
    if (entry.startsWith("gsd-") || entry === "gsd") continue;
    const srcPath = join(commandsDir, entry);
    const destPath = join(commandMirrorDir, entry);
    // Backup existing file before overwrite
    if (existsSync(destPath)) {
      const backupPath = destPath + ".backup";
      if (!existsSync(backupPath)) {
        cpSync(destPath, backupPath, { recursive: true });
        console.log(`[Harness Build] Backed up ${destPath} → ${backupPath}`);
      }
      // Conflict detection
      try {
        const existingContent = readFileSync(destPath, "utf-8");
        const sourceContent = readFileSync(srcPath, "utf-8");
        if (existingContent !== sourceContent) {
          console.log(`[Harness Build] ⚠ Conflict detected: command/${entry} differs from commands/ version. Backup saved to ${backupPath}`);
        }
      } catch {
        // Binary or unreadable: skip diff
      }
    }
    cpSync(srcPath, destPath, { recursive: true });
    mirrored++;
  }
  console.log(`[Harness Build] Mirrored ${mirrored} commands to ${commandMirrorDir}`);
}

console.log(`[Harness Build] Assets reflection completed. Synced ${mirrorCount} commands, mirrored to command/ directory.`);
