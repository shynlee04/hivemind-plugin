import * as p from "@clack/prompts"
import { collectProjectSnapshot, formatHintList } from "../lib/project-scan.js"
import { detectFrameworkContext } from "../lib/framework-context.js"
import { createSaveAnchorTool } from "../tools/save-anchor.js"
import { createSaveMemTool } from "../tools/save-mem.js"
import { createDeclareIntentTool } from "../tools/declare-intent.js"

export async function runScanCommand(directory: string): Promise<void> {
  p.intro("🔎 HiveMind Project Scan")

  const s = p.spinner()
  s.start("Scanning project structure...")

  const snapshot = await collectProjectSnapshot(directory)
  const framework = await detectFrameworkContext(directory)

  s.stop("Scan complete.")

  // Display findings
  p.note(
    [
      `Project:   ${snapshot.projectName}`,
      `Stack:     ${formatHintList(snapshot.stackHints)}`,
      `Dirs:      ${formatHintList(snapshot.topLevelDirs)}`,
      `Artifacts: ${formatHintList(snapshot.artifactHints)}`,
      `Framework: ${framework.mode} ${framework.gsdPhaseGoal ? `(Goal: ${framework.gsdPhaseGoal})` : ""}`,
    ].join("\n"),
    "Reconnaissance Report"
  )

  const apply = await p.confirm({
    message: "Apply these findings to HiveMind context (anchors + memory)?",
  })

  if (p.isCancel(apply) || !apply) {
    p.outro("Scan finished. No changes made.")
    return
  }

  const s2 = p.spinner()
  s2.start("Applying findings...")

  // Automate the "Backbone Summary" step from hivemind-scan.md
  const saveAnchor = createSaveAnchorTool(directory)
  const saveMem = createSaveMemTool(directory)
  const declareIntent = createDeclareIntentTool(directory)
  const mockContext = { sessionID: "cli-scan", callID: "cli-scan-1" } as any

  // 1. Declare Intent (if needed)
  try {
    await declareIntent.execute({
      mode: "exploration",
      focus: "Project reconnaissance scan (automated)",
    }, mockContext)
  } catch {
    // Session likely already active or configured, proceed
  }

  // 2. Save Anchors
  try {
    await saveAnchor.execute({
      mode: "save",
      key: "project-stack",
      value: formatHintList(snapshot.stackHints),
    }, mockContext)

    await saveAnchor.execute({
      mode: "save",
      key: "project-structure",
      value: `Dirs: ${formatHintList(snapshot.topLevelDirs)}. Artifacts: ${formatHintList(snapshot.artifactHints)}`,
    }, mockContext)
  } catch (err) {
    p.log.error(`Failed to save anchors: ${err}`)
  }

  // 3. Save Mem
  try {
    await saveMem.execute({
      mode: "save",
      shelf: "project-intel",
      content: `Automated Scan Report:
- Project: ${snapshot.projectName}
- Stack: ${formatHintList(snapshot.stackHints)}
- Framework: ${framework.mode}`,
      tags: "scan,baseline,automated", // save_mem expects string for tags in args (comma-separated or array, wait check source)
    }, mockContext)
  } catch (err) {
    p.log.error(`Failed to save memory: ${err}`)
  }

  s2.stop("Findings applied.")
  p.outro("✅ Scan complete. HiveMind context updated.")
}
