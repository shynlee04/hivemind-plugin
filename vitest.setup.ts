import { mkdtempSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"

const stateDir = mkdtempSync(join(tmpdir(), "vitest-state-"))
process.env.OPENCODE_HARNESS_STATE_DIR = join(stateDir, "state")
