/**
 * TDD tests for src/features/intent-lock/tool-resolver.ts
 *
 * Evidence: small unit tests (no real FS or git needed; pure logic).
 *
 * Acceptance criteria covered:
 * - AC-18: UNLOCKED blocks write, allows read/glob/grep
 * - AC-19: UNLOCKED blocks bash with `>` (and 5 other moderate patterns)
 * - AC-20: LOCKED_NON_CODE allows hivemind-doc:write to .planning/**
 * - AC-21: child session always allowed
 * - AC-28: bash blocklist only root, not child
 * - Plus: EXECUTING allows write+edit+bash; gate disabled (no state) allows all.
 */

import { describe, expect, it } from "vitest"

import {
  IntentState,
  type IntentLockState,
  type SessionContext,
} from "../../../src/features/intent-lock/types.js"
import {
  MODERATE_BASH_PATTERNS,
  PERMISSION_MATRIX,
  READ_ONLY_TOOLS,
  resolveToolPermission,
} from "../../../src/features/intent-lock/tool-resolver.js"

function makeSessionContext(
  classificationKind: "root" | "child" | "unknownSub" = "root",
  state?: IntentLockState,
): SessionContext {
  return {
    sessionId: "ses_test",
    projectRoot: "/tmp",
    classificationKind,
    intentLockState: state,
  }
}

function makeState(s: IntentState): IntentLockState {
  return {
    sessionId: "ses_test",
    state: s,
    lastTransitionAt: Date.now(),
    history: [],
  }
}

describe("src/features/intent-lock/tool-resolver", () => {
  describe("constants", () => {
    it("PERMISSION_MATRIX has exactly 7 entries (one per IntentState)", () => {
      expect(Object.keys(PERMISSION_MATRIX).sort()).toEqual(
        [
          "COMPLETED",
          "EXECUTING",
          "LOCKED_CODE_CHANGE",
          "LOCKED_NON_CODE",
          "PHASE_AUTHORIZED",
          "PHASE_READY",
          "UNLOCKED",
        ].sort(),
      )
    })
    it("MODERATE_BASH_PATTERNS is exactly 6 regexes", () => {
      expect(MODERATE_BASH_PATTERNS).toHaveLength(6)
      for (const p of MODERATE_BASH_PATTERNS) {
        expect(p).toBeInstanceOf(RegExp)
      }
    })
    it("READ_ONLY_TOOLS is exactly [read, glob, grep]", () => {
      expect([...READ_ONLY_TOOLS].sort()).toEqual(["glob", "grep", "read"])
    })
  })

  describe("AC-18: UNLOCKED blocks write, allows read/glob/grep", () => {
    it("blocks write", async () => {
      const ctx = makeSessionContext("root", makeState(IntentState.UNLOCKED))
      const d = await resolveToolPermission("write", { filePath: "x" }, ctx)
      expect(d.allowed).toBe(false)
    })
    it("allows read", async () => {
      const ctx = makeSessionContext("root", makeState(IntentState.UNLOCKED))
      const d = await resolveToolPermission("read", { filePath: "x" }, ctx)
      expect(d.allowed).toBe(true)
    })
    it("allows glob", async () => {
      const ctx = makeSessionContext("root", makeState(IntentState.UNLOCKED))
      const d = await resolveToolPermission("glob", { pattern: "*" }, ctx)
      expect(d.allowed).toBe(true)
    })
    it("allows grep", async () => {
      const ctx = makeSessionContext("root", makeState(IntentState.UNLOCKED))
      const d = await resolveToolPermission("grep", { pattern: "x" }, ctx)
      expect(d.allowed).toBe(true)
    })
  })

  describe("AC-19: UNLOCKED blocks bash with 6 moderate patterns", () => {
    const dangerous: string[] = [
      "cat README.md > /tmp/output",
      "sed -i 's/a/b/' file",
      "tee /etc/file",
      "rm -rf /tmp/foo",
      "mv src dest",
      "chmod +x script.sh",
    ]
    for (const cmd of dangerous) {
      it(`blocks bash: ${cmd}`, async () => {
        const ctx = makeSessionContext("root", makeState(IntentState.UNLOCKED))
        const d = await resolveToolPermission("bash", { command: cmd }, ctx)
        expect(d.allowed).toBe(false)
        expect(d.reason).toMatch(/moderate|blocklist/i)
        expect(d.nextCommand).toMatch(/write|edit/i)
      })
    }
  })

  describe("AC-20: LOCKED_NON_CODE allows hivemind-doc:write to .planning/**", () => {
    it("allows hivemind-doc:write to .planning/**", async () => {
      const ctx = makeSessionContext("root", makeState(IntentState.LOCKED_NON_CODE))
      const d = await resolveToolPermission(
        "hivemind-doc:write",
        { target: ".planning/notes/x.md" },
        ctx,
      )
      expect(d.allowed).toBe(true)
    })
    it("blocks hivemind-doc:write to non-planning path", async () => {
      const ctx = makeSessionContext("root", makeState(IntentState.LOCKED_NON_CODE))
      const d = await resolveToolPermission(
        "hivemind-doc:write",
        { target: "src/foo.ts" },
        ctx,
      )
      expect(d.allowed).toBe(false)
    })
  })

  describe("AC-21: child session always allowed", () => {
    it("allows write in any state when classificationKind=child", async () => {
      for (const s of Object.values(IntentState)) {
        const ctx = makeSessionContext("child", makeState(s))
        const d = await resolveToolPermission("write", { filePath: "x" }, ctx)
        expect(d.allowed).toBe(true)
      }
    })
    it("allows write when classificationKind=unknownSub", async () => {
      const ctx = makeSessionContext("unknownSub", makeState(IntentState.UNLOCKED))
      const d = await resolveToolPermission("write", { filePath: "x" }, ctx)
      expect(d.allowed).toBe(true)
    })
  })

  describe("AC-28: bash blocklist only root, not child", () => {
    it("blocks moderate bash for root in non-EXECUTING", async () => {
      const ctx = makeSessionContext("root", makeState(IntentState.LOCKED_CODE_CHANGE))
      const d = await resolveToolPermission(
        "bash",
        { command: "cat x > /tmp/y" },
        ctx,
      )
      expect(d.allowed).toBe(false)
    })
    it("allows bash for child even with dangerous command", async () => {
      const ctx = makeSessionContext("child", makeState(IntentState.LOCKED_CODE_CHANGE))
      const d = await resolveToolPermission(
        "bash",
        { command: "cat x > /tmp/y" },
        ctx,
      )
      expect(d.allowed).toBe(true)
    })
  })

  describe("EXECUTING allows full toolkit", () => {
    it("allows write", async () => {
      const ctx = makeSessionContext("root", makeState(IntentState.EXECUTING))
      const d = await resolveToolPermission("write", { filePath: "x" }, ctx)
      expect(d.allowed).toBe(true)
    })
    it("allows edit", async () => {
      const ctx = makeSessionContext("root", makeState(IntentState.EXECUTING))
      const d = await resolveToolPermission("edit", { filePath: "x" }, ctx)
      expect(d.allowed).toBe(true)
    })
    it("allows safe bash (no blocklist match)", async () => {
      const ctx = makeSessionContext("root", makeState(IntentState.EXECUTING))
      const d = await resolveToolPermission("bash", { command: "ls -la" }, ctx)
      expect(d.allowed).toBe(true)
    })
  })

  describe("gate disabled (no intentLockState) allows all", () => {
    it("allows write when intentLockState is undefined", async () => {
      const ctx = makeSessionContext("root", undefined)
      const d = await resolveToolPermission("write", { filePath: "x" }, ctx)
      expect(d.allowed).toBe(true)
      expect(d.reason).toMatch(/gate disabled/i)
    })
  })

  // ---------------------------------------------------------------------------
  // P27.1 T1: AC-31, AC-32, AC-33 — Bash blocklist regex fix (F-1)
  // Evidence: runtime-truthful small unit tests covering 24 commands from
  // 27.1-FIX-RESEARCH-2026-06-10.md §F-1.
  // ---------------------------------------------------------------------------

  describe("AC-31: fd-redirects (2>&1, >&2) must be ALLOWED", () => {
    const fdRedirects: string[] = [
      "npm run build 2>&1 | tail -5",
      ">/dev/null 2>&1",
      "echo hi 2>&1",
      "npm test 2>&1 | tail -20",
      "npm run test:coverage 2>&1 | tail -30",
      "pip install foo 2>&1",
      "node -e \"console.log(1)\" 2>&1",
    ]
    for (const cmd of fdRedirects) {
      it(`allows bash with fd-redirect: ${cmd}`, async () => {
        const ctx = makeSessionContext("root", makeState(IntentState.UNLOCKED))
        const d = await resolveToolPermission("bash", { command: cmd }, ctx)
        expect(d.allowed).toBe(true)
      })
    }
  })

  describe("AC-32: /dev/null redirects must be ALLOWED", () => {
    const devNullVariants: string[] = [
      ">/dev/null",
      "> /dev/null",
      "2>/dev/null",
      "2> /dev/null",
      "some-command 2>/dev/null",
    ]
    for (const cmd of devNullVariants) {
      it(`allows bash with /dev/null redirect: ${cmd}`, async () => {
        const ctx = makeSessionContext("root", makeState(IntentState.UNLOCKED))
        const d = await resolveToolPermission("bash", { command: cmd }, ctx)
        expect(d.allowed).toBe(true)
      })
    }
  })

  describe("AC-33: real file-write redirects must be BLOCKED", () => {
    const fileWrites: string[] = [
      "git diff > /tmp/diff",
      "echo \"hi\" > file.txt",
      "npm run build >> output.log",
      "curl https://api > /tmp/x",
      "cat foo.txt > backup.txt",
    ]
    for (const cmd of fileWrites) {
      it(`blocks bash with file redirect: ${cmd}`, async () => {
        const ctx = makeSessionContext("root", makeState(IntentState.UNLOCKED))
        const d = await resolveToolPermission("bash", { command: cmd }, ctx)
        expect(d.allowed).toBe(false)
        expect(d.reason).toMatch(/moderate|blocklist/i)
      })
    }
  })

  describe("AC-31 baseline: safe commands without redirect patterns", () => {
    const safeCommands: string[] = [
      "git status",
      "ls -la",
      "cat foo.txt",
      "npm test",
      "git log --oneline",
      "npm run typecheck",
      "git diff HEAD~1",
    ]
    for (const cmd of safeCommands) {
      it(`allows safe bash: ${cmd}`, async () => {
        const ctx = makeSessionContext("root", makeState(IntentState.UNLOCKED))
        const d = await resolveToolPermission("bash", { command: cmd }, ctx)
        expect(d.allowed).toBe(true)
      })
    }
  })

  // ---------------------------------------------------------------------------
  // P27.1 T2: AC-36, AC-36a — Read-only bash whitelist (F-4)
  // Tests use COMPLETED state (no bash entries in matrix) so the whitelist
  // is the ONLY path to allow bash commands. This ensures proper RED → GREEN.
  // ---------------------------------------------------------------------------

  describe("AC-36: read-only bash prefixes bypass blocklist", () => {
    const readOnlyCommands: string[] = [
      "cat foo.txt",
      "ls -la",
      "head -5 file",
      "tail -20 file",
      "find . -name \"*.ts\"",
      "grep -r \"pattern\" src/",
      "git log --oneline",
      "git status",
      "git diff HEAD~1",
      "git show HEAD:file.ts",
      "git rev-parse HEAD",
      "npm test",
      "npm run lint",
      "npm run typecheck",
      "npm run test",
      "npm run build",
      "echo \"hello world\"",
      "node -e \"console.log(1)\"",
      "npx vitest run",
    ]
    for (const cmd of readOnlyCommands) {
      it(`whitelist allows: ${cmd}`, async () => {
        // COMPLETED state has NO bash entries in matrix — whitelist is the
        // only way this command passes. Without the whitelist → BLOCKED.
        const ctx = makeSessionContext("root", makeState(IntentState.COMPLETED))
        const d = await resolveToolPermission("bash", { command: cmd }, ctx)
        expect(d.allowed).toBe(true)
      })
    }
  })

  describe("AC-36a: metacharacters disable read-only whitelist", () => {
    const metacharCommands: string[] = [
      "cat foo.txt; rm -rf /",
      "ls && echo \"pwned\"",
      "git status || echo fail",
      "echo hello | tee /tmp/x",
      "cat < /etc/passwd",
      "echo $(rm -rf /)",
    ]
    for (const cmd of metacharCommands) {
      it(`whitelist bypassed by metacharacter in: ${cmd}`, async () => {
        // COMPLETED state: no bash entries in matrix. The whitelist is the
        // only way bash is allowed. With metacharacters, whitelist must NOT
        // apply, so these fall through to default deny → BLOCKED.
        const ctx = makeSessionContext("root", makeState(IntentState.COMPLETED))
        const d = await resolveToolPermission("bash", { command: cmd }, ctx)
        expect(d.allowed).toBe(false)
      })
    }
  })
})

  // ---------------------------------------------------------------------------
  // P27.2 T1: AC-XX — Surface allowlist (question, hivemind-doc, task agent, delegate-task)
  // Evidence: runtime-truthful small unit tests covering 5 new tool permission patterns.
  // ---------------------------------------------------------------------------

  describe("P27.2: surface allowlist", () => {
    describe("question tool always allowed", () => {
      it("allows question in UNLOCKED state", async () => {
        const ctx = makeSessionContext("root", makeState(IntentState.UNLOCKED))
        const d = await resolveToolPermission("question", { text: "confirm?" }, ctx)
        expect(d.allowed).toBe(true)
      })

      it("allows question in LOCKED_CODE_CHANGE state", async () => {
        const ctx = makeSessionContext("root", makeState(IntentState.LOCKED_CODE_CHANGE))
        const d = await resolveToolPermission("question", { text: "proceed?" }, ctx)
        expect(d.allowed).toBe(true)
      })
    })

    describe("hivemind-doc tool always allowed", () => {
      it("allows hivemind-doc:read in UNLOCKED state", async () => {
        const ctx = makeSessionContext("root", makeState(IntentState.UNLOCKED))
        const d = await resolveToolPermission("hivemind-doc:read", { target: "x.md" }, ctx)
        expect(d.allowed).toBe(true)
      })

      it("allows hivemind-doc:create in UNLOCKED state", async () => {
        const ctx = makeSessionContext("root", makeState(IntentState.UNLOCKED))
        const d = await resolveToolPermission("hivemind-doc:create", { target: "notes.md" }, ctx)
        expect(d.allowed).toBe(true)
      })

      it("allows hivemind-doc:write in UNLOCKED state", async () => {
        const ctx = makeSessionContext("root", makeState(IntentState.UNLOCKED))
        const d = await resolveToolPermission("hivemind-doc:write", { target: "notes.md" }, ctx)
        expect(d.allowed).toBe(true)
      })
    })

    describe("task tool with allowed read-only hm-* agents", () => {
      const ALLOWED_AGENTS = [
        "hm-intent-loop",
        "hm-codebase-mapper",
        "hm-pattern-mapper",
        "hm-phase-researcher",
        "hm-project-researcher",
        "hm-platform-references",
        "hm-ecologist",
      ]
      for (const agent of ALLOWED_AGENTS) {
        it(`allows task with allowed agent ${agent}`, async () => {
          const ctx = makeSessionContext("root", makeState(IntentState.UNLOCKED))
          const d = await resolveToolPermission("task", { subagent_type: agent }, ctx)
          expect(d.allowed).toBe(true)
        })
      }
    })

    describe("task tool with disallowed hm-* agents is blocked", () => {
      const DISALLOWED_AGENTS = [
        "hm-executor",
        "hm-planner",
        "hm-specifier",
        "hm-code-fixer",
        "hm-doc-writer",
        "hm-shipper",
        "hm-ui-researcher",
        "hm-ui-auditor",
        "hm-security-auditor",
        "hm-nyquist-auditor",
        "hm-integration-checker",
      ]
      for (const agent of DISALLOWED_AGENTS) {
        it(`blocks task with disallowed agent ${agent}`, async () => {
          const ctx = makeSessionContext("root", makeState(IntentState.UNLOCKED))
          const d = await resolveToolPermission("task", { subagent_type: agent }, ctx)
          expect(d.allowed).toBe(false)
          expect(d.reason).toContain(agent)
          expect(d.reason).toMatch(/read-only hm-\* agents|not in this list/i)
        })
      }
    })

    describe("task tool with no subagent_type falls through to default deny", () => {
      it("blocks task with no subagent_type in UNLOCKED", async () => {
        const ctx = makeSessionContext("root", makeState(IntentState.UNLOCKED))
        const d = await resolveToolPermission("task", {}, ctx)
        expect(d.allowed).toBe(false)
      })
    })

    describe("delegate-task is blocked with hint", () => {
      it("blocks delegate-task with hint to use native task tool", async () => {
        const ctx = makeSessionContext("root", makeState(IntentState.UNLOCKED))
        const d = await resolveToolPermission("delegate-task", { agent: "hm-executor" }, ctx)
        expect(d.allowed).toBe(false)
        expect(d.reason).toMatch(/task/i)
        expect(d.reason).toMatch(/instead/i)
      })
    })
  })
