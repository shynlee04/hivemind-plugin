import { describe, it } from "node:test"
import assert from "node:assert/strict"

const secretDetectorModuleHref = new URL("../../src/lib/code-intel/secret-detector.ts", import.meta.url).href

type SecretFinding = {
  kind: string
  line: number
  match: string
}

describe("Wave 4 Slice 2 RED - secret detector primitive", () => {
  it("exports detectSecrets", async () => {
    const module = await import(secretDetectorModuleHref)
    assert.equal(typeof module.detectSecrets, "function")
  })

  it("detects obvious credentials and returns empty results for clean input", async () => {
    const module = await import(secretDetectorModuleHref)
    const detectSecrets = module.detectSecrets as
      | ((input: string, filePath?: string) => SecretFinding[])
      | undefined

    assert.equal(typeof detectSecrets, "function")
    if (!detectSecrets) {
      throw new Error("Expected detectSecrets export")
    }

    const leaked = [
      "const aws = 'AKIAIOSFODNN7EXAMPLE'",
      "const gh = 'ghp_1234567890abcdefghij1234567890abcd'",
    ].join("\n")

    const findings = detectSecrets(leaked, "src/config.ts")
    assert.ok(findings.length > 0)
    assert.ok(findings.some((row) => row.line >= 1))

    const clean = "export const name = 'hivemind'\n"
    assert.deepEqual(detectSecrets(clean, "src/index.ts"), [])
  })
})
