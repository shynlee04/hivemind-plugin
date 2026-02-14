import {
  estimateContextPercent,
  shouldCreateNewSession,
} from "../src/lib/session-boundary.js"

let passed = 0
let failed_ = 0

function assert(cond: boolean, name: string) {
  if (cond) {
    passed++
    process.stderr.write(`  PASS: ${name}\n`)
  } else {
    failed_++
    process.stderr.write(`  FAIL: ${name}\n`)
  }
}

function testEstimateContextPercent() {
  process.stderr.write("\n--- session-boundary: estimateContextPercent ---\n")

  assert(estimateContextPercent(0, 20) === 0, "0 turns on threshold 20 => 0%")
  assert(estimateContextPercent(10, 20) === 50, "10 turns on threshold 20 => 50%")
  assert(estimateContextPercent(25, 20) === 100, "percent is capped at 100")
  assert(estimateContextPercent(5, 0) === 100, "zero threshold is clamped safely")
}

function testShouldCreateNewSessionRules() {
  process.stderr.write("\n--- session-boundary: shouldCreateNewSession ---\n")

  const base = {
    turnCount: 35,
    contextPercent: 60,
    hierarchyComplete: true,
    isMainSession: true,
    hasDelegations: false,
  }

  const nonMain = shouldCreateNewSession({ ...base, isMainSession: false })
  assert(nonMain.recommended === false, "non-main session is excluded")

  const withDelegations = shouldCreateNewSession({ ...base, hasDelegations: true })
  assert(withDelegations.recommended === false, "delegation-active session is excluded")

  const highContext = shouldCreateNewSession({ ...base, contextPercent: 80 })
  assert(highContext.recommended === false, "context must be below 80%")

  const lowTurns = shouldCreateNewSession({ ...base, turnCount: 29 })
  assert(lowTurns.recommended === false, "turn threshold requires 30+")

  const noBoundary = shouldCreateNewSession({ ...base, hierarchyComplete: false })
  assert(noBoundary.recommended === false, "requires completed phase/epic boundary")

  const recommended = shouldCreateNewSession(base)
  assert(recommended.recommended === true, "recommends new session when all rules match")
  assert(recommended.reason.includes("Natural boundary reached"), "recommendation reason is explicit")
}

function main() {
  process.stderr.write("=== Session Boundary Tests ===\n")

  testEstimateContextPercent()
  testShouldCreateNewSessionRules()

  process.stderr.write(`\n=== Session Boundary: ${passed} passed, ${failed_} failed ===\n`)
  if (failed_ > 0) process.exit(1)
}

main()
