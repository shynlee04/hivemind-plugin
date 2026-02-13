import {
  shouldEmitToast,
  recordToastEmit,
  resetAllThrottles,
  resetThrottle,
  checkAndRecordToast,
  getThrottleStats,
} from "../src/lib/toast-throttle.js"

let passed = 0
let failed = 0

function check(cond: boolean, name: string) {
  if (cond) {
    passed++
    process.stderr.write(`  PASS: ${name}\n`)
  } else {
    failed++
    process.stderr.write(`  FAIL: ${name}\n`)
  }
}

// Mock time setup
let mockTime = 1000
const originalNow = Date.now

function setup() {
  resetAllThrottles()
  mockTime = 1000
  Date.now = () => mockTime
}

function teardown() {
  Date.now = originalNow
}

function testToastThrottle() {
  process.stderr.write("=== Toast Throttle Tests ===\n")

  try {
    setup()

    // 1. Basic Emission & Cooldown
    // First call should succeed (no record)
    check(
      shouldEmitToast("test", "key1"),
      "First call to shouldEmitToast returns true"
    )

    // Record the emission
    recordToastEmit("test", "key1")

    // Advance time slightly (within default cooldown of 60s)
    mockTime += 1000 // +1s
    check(
      !shouldEmitToast("test", "key1"),
      "Second call within cooldown returns false"
    )

    // Advance beyond cooldown
    mockTime += 60_000 // +60s
    check(
      shouldEmitToast("test", "key1") === true,
      "Call after cooldown returns true"
    )

    // 2. Distinct Keys & Event Types
    resetAllThrottles()
    mockTime = 1000
    recordToastEmit("typeA", "key1")

    check(
      shouldEmitToast("typeA", "key2") === true,
      "Different key in same event type is not throttled"
    )

    check(
      shouldEmitToast("typeB", "key1") === true,
      "Same key in different event type is not throttled"
    )

    // 3. Session Quota
    resetAllThrottles()
    mockTime = 1000
    // Default max per session is 5
    // Emit 5 times, advancing time by cooldown each time to avoid cooldown throttling
    for (let i = 0; i < 5; i++) {
      check(
        shouldEmitToast("quota", "key1") === true,
        `Quota check iteration ${i + 1} returns true`
      )
      recordToastEmit("quota", "key1")
      mockTime += 60_001 // Advance past cooldown
    }

    // 6th time should fail due to quota
    check(
      shouldEmitToast("quota", "key1") === false,
      "6th call exceeds default session quota (5)"
    )

    // 4. Config Override
    resetAllThrottles()
    mockTime = 1000

    // Custom cooldown (small)
    recordToastEmit("custom", "short")
    mockTime += 100 // +100ms

    // Default cooldown is 60s, so it would fail usually.
    // Override with 50ms cooldown.
    check(
      shouldEmitToast("custom", "short", { cooldownMs: 50 }) === true,
      "Custom cooldown override allows emission earlier"
    )

    // Custom quota
    resetAllThrottles()
    mockTime = 1000
    recordToastEmit("custom", "lowQuota")
    mockTime += 60_001
    recordToastEmit("custom", "lowQuota")

    // Now emitCount is 2.
    // If we set maxPerSession to 2, next check should fail.
    check(
      shouldEmitToast("custom", "lowQuota", { maxPerSession: 2 }) === false,
      "Custom maxPerSession override blocks emission"
    )

    // 5. checkAndRecordToast Helper
    resetAllThrottles()
    mockTime = 1000

    check(
      checkAndRecordToast("helper", "key1") === true,
      "checkAndRecordToast returns true for first call"
    )

    // Should have recorded it, so next immediate call fails
    check(
      shouldEmitToast("helper", "key1") === false,
      "checkAndRecordToast successfully recorded the emission"
    )

    // 6. Manual Reset
    resetAllThrottles()
    mockTime = 1000
    recordToastEmit("reset", "key1")

    resetThrottle("reset") // Reset specific type
    check(
      shouldEmitToast("reset", "key1") === true,
      "resetThrottle clears history for event type"
    )

    recordToastEmit("reset", "key1")
    resetAllThrottles() // Reset all
    check(
      shouldEmitToast("reset", "key1") === true,
      "resetAllThrottles clears all history"
    )

    // 7. Auto Session Reset (> 24h)
    resetAllThrottles()
    mockTime = 1000
    // Fill quota
    for(let i=0; i<5; i++) {
      recordToastEmit("auto", "reset")
      mockTime += 60_001
    }

    check(
      shouldEmitToast("auto", "reset") === false,
      "Quota reached"
    )

    // Advance time > 24 hours
    mockTime += 25 * 60 * 60 * 1000

    // shouldEmitToast triggers internal check for session reset
    check(
      shouldEmitToast("auto", "reset") === true,
      "Auto-reset after 24h clears quota"
    )

    // Verify session start time updated
    const stats = getThrottleStats()
    check(
        stats.sessionStartTime === mockTime,
        "Session start time updated after auto-reset"
    )


  } catch (err) {
    process.stderr.write(`ERROR: ${err}\n`)
    failed++
  } finally {
    teardown()
  }

  process.stderr.write(`\n=== Toast Throttle: ${passed} passed, ${failed} failed ===\n`)
  if (failed > 0) {
    process.exit(1)
  }
}

testToastThrottle()
