import { mkdtempSync, rmSync } from "fs"
import { tmpdir } from "os"
import { join } from "path"
import { createHivemindSessionTool } from "./src/tools/hivemind-session.js"
import { initProject } from "./src/cli/init.js"

async function main() {
  const tmpDir = mkdtempSync(join(tmpdir(), "hm-debug-"))
  try {
    await initProject(tmpDir, { governanceMode: "assisted", language: "en", silent: true })
    const sessionTool = createHivemindSessionTool(tmpDir)
    const startResult = await sessionTool.execute({ action: "start", mode: "plan_driven", focus: "Test" }, {} as any)
    console.log("START RESULT:", startResult)
    console.log("TYPE:", typeof startResult)
    const parsed = JSON.parse(startResult as string)
    console.log("PARSED:", JSON.stringify(parsed, null, 2))
    console.log("STATUS:", parsed.status)
  } finally {
    rmSync(tmpDir, { recursive: true })
  }
}
main()
