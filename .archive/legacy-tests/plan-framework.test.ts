/**
 * Plan Framework Integration Tests
 *
 * Tests plan CRUD, template seeding, validation artifacts,
 * tree listing, and manifest sync operations.
 */

import { describe, it, before, after } from "node:test"
import assert from "node:assert/strict"
import { mkdtemp, rm, readFile, readdir } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { existsSync } from "node:fs"

import {
    createPlanDirectory,
    listPlanTree,
    readPlanFrontmatter,
    updatePlanStatus,
    resolvePlanByPrefix,
    resolvePlanDirPath,
    seedPlanTemplates,
} from "../src/lib/plan-fs.js"
import {
    createValidationArtifact,
    checkPlanCompletionCriteria,
    syncPlanValidationState,
} from "../src/lib/plan-validation.js"
import { initializePlanningDirectory } from "../src/lib/planning-fs.js"
import { readManifest } from "../src/lib/manifest.js"
import type { PlanManifest } from "../src/lib/manifest.js"
import { getEffectivePaths } from "../src/lib/paths.js"

// ─── Setup ───────────────────────────────────────────────────────────────────

let tmpDir: string

before(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), "plan-framework-test-"))
    await initializePlanningDirectory(tmpDir)
})

after(async () => {
    await rm(tmpDir, { recursive: true, force: true })
})

// ─── Path Resolution ─────────────────────────────────────────────────────────

describe("resolvePlanDirPath", () => {
    it("resolves root plan prefix to single directory", () => {
        const result = resolvePlanDirPath("/plans", "META01")
        assert.equal(result, join("/plans", "META01"))
    })

    it("resolves sub-plan prefix to nested directory", () => {
        const result = resolvePlanDirPath("/plans", "META01-SUB01")
        assert.equal(result, join("/plans", "META01", "SUB01"))
    })

    it("resolves atomic plan prefix to ATOMIC directory", () => {
        const result = resolvePlanDirPath("/plans", "META01-SUB01-ATOMIC01")
        assert.equal(result, join("/plans", "META01", "SUB01", "ATOMIC"))
    })
})

// ─── Plan CRUD ───────────────────────────────────────────────────────────────

describe("createPlanDirectory", () => {
    it("creates a root plan with frontmatter and template body", async () => {
        const result = await createPlanDirectory(tmpDir, {
            prefix: "TEST01",
            title: "Test Root Plan",
            type: "root",
            domain: "meta",
            purpose: "planning",
        })

        assert.ok(result.planPath, "planPath should be defined")
        assert.ok(result.manifestEntry.id, "manifest entry should have an id")
        assert.equal(result.manifestEntry.prefix, "TEST01")
        assert.equal(result.manifestEntry.type, "root")
        assert.equal(result.manifestEntry.status, "pending")
        assert.equal(result.manifestEntry.domain, "meta")

        // Verify file exists on disk
        assert.ok(existsSync(result.planPath), "plan file should exist on disk")

        // Verify frontmatter
        const fm = await readPlanFrontmatter(result.planPath)
        assert.equal(fm.prefix, "TEST01")
        assert.equal(fm.title, "Test Root Plan")
        assert.equal(fm.status, "pending")
        assert.equal(fm.type, "plan")
    })

    it("creates a sub-plan linked to parent", async () => {
        const paths = getEffectivePaths(tmpDir)
        const manifest = await readManifest<PlanManifest>(paths.plansManifest, { plans: [] })
        const parent = manifest.plans.find(p => p.prefix === "TEST01")
        assert.ok(parent, "parent plan should exist in manifest")

        const result = await createPlanDirectory(tmpDir, {
            prefix: "TEST01-SUB01",
            title: "Test Sub Plan",
            type: "sub",
            domain: "backend",
            purpose: "implementation",
            parentId: parent.id,
            rootId: parent.id,
        })

        assert.equal(result.manifestEntry.type, "sub")
        assert.equal(result.manifestEntry.parent_id, parent.id)
        assert.equal(result.manifestEntry.root_id, parent.id)
        assert.ok(existsSync(result.planPath))
    })

    it("registers plan in manifest", async () => {
        const paths = getEffectivePaths(tmpDir)
        const manifest = await readManifest<PlanManifest>(paths.plansManifest, { plans: [] })
        const entries = manifest.plans.filter(p => p.prefix.startsWith("TEST01"))
        assert.ok(entries.length >= 2, "should have at least 2 TEST01* plans in manifest")
    })
})

// ─── Plan Status Update ──────────────────────────────────────────────────────

describe("updatePlanStatus", () => {
    it("updates plan frontmatter status", async () => {
        const entry = await resolvePlanByPrefix(tmpDir, "TEST01")
        assert.ok(entry, "TEST01 should exist")

        const paths = getEffectivePaths(tmpDir)
        const planPath = join(paths.plansDir, entry.path)

        await updatePlanStatus(planPath, "active")

        const fm = await readPlanFrontmatter(planPath)
        assert.equal(fm.status, "active")
    })
})

// ─── Resolve By Prefix ───────────────────────────────────────────────────────

describe("resolvePlanByPrefix", () => {
    it("resolves existing plan", async () => {
        const entry = await resolvePlanByPrefix(tmpDir, "TEST01")
        assert.ok(entry, "should find TEST01")
        assert.equal(entry.prefix, "TEST01")
        assert.equal(entry.type, "root")
    })

    it("returns null for non-existent plan", async () => {
        const entry = await resolvePlanByPrefix(tmpDir, "NOPE99")
        assert.equal(entry, null)
    })
})

// ─── Plan Tree ───────────────────────────────────────────────────────────────

describe("listPlanTree", () => {
    it("builds a tree with root and children", async () => {
        const tree = await listPlanTree(tmpDir)
        assert.ok(tree.length > 0, "tree should have entries")

        const root = tree.find(t => t.prefix === "TEST01")
        assert.ok(root, "TEST01 root should be in tree")
        assert.ok(root.children.length > 0, "TEST01 should have children")

        const sub = root.children.find(c => c.prefix === "TEST01-SUB01")
        assert.ok(sub, "TEST01-SUB01 should be a child of TEST01")
    })
})

// ─── Template Seeding ────────────────────────────────────────────────────────

describe("seedPlanTemplates", () => {
    it("creates template files in planTemplatesDir", async () => {
        await seedPlanTemplates(tmpDir)

        const paths = getEffectivePaths(tmpDir)
        const files = await readdir(paths.planTemplatesDir)

        assert.ok(files.includes("root-plan.md"), "should have root-plan.md template")
        assert.ok(files.includes("sub-plan.md"), "should have sub-plan.md template")
        assert.ok(files.includes("atomic-plan.md"), "should have atomic-plan.md template")
        assert.ok(files.includes("validation.md"), "should have validation.md template")
    })

    it("is idempotent — does not overwrite existing templates", async () => {
        const paths = getEffectivePaths(tmpDir)
        const rootTemplatePath = join(paths.planTemplatesDir, "root-plan.md")
        const contentBefore = await readFile(rootTemplatePath, "utf-8")

        await seedPlanTemplates(tmpDir)

        const contentAfter = await readFile(rootTemplatePath, "utf-8")
        assert.equal(contentBefore, contentAfter, "template should not be overwritten")
    })
})

// ─── Validation ──────────────────────────────────────────────────────────────

describe("createValidationArtifact", () => {
    it("creates a validation file for a plan with criteria", async () => {
        const entry = await resolvePlanByPrefix(tmpDir, "TEST01")
        assert.ok(entry, "TEST01 should exist")

        const valPath = await createValidationArtifact(tmpDir, entry.prefix, entry.id, [
            "All sub-plans complete",
            "Graph nodes synced",
        ])

        assert.ok(existsSync(valPath), "validation artifact should exist on disk")

        const content = await readFile(valPath, "utf-8")
        assert.ok(content.includes("All sub-plans complete"), "should contain criterion text in body")
        assert.ok(content.includes("Graph nodes synced"), "should contain second criterion in body")
        assert.ok(content.includes("VALIDATION: TEST01"), "should contain validation header")
        assert.ok(content.includes("criteria:"), "should store criteria in frontmatter")
    })

    it("creates a validation file without criteria (placeholder mode)", async () => {
        const entry = await resolvePlanByPrefix(tmpDir, "TEST01-SUB01")
        assert.ok(entry, "TEST01-SUB01 should exist")

        const valPath = await createValidationArtifact(tmpDir, entry.prefix, entry.id)

        assert.ok(existsSync(valPath), "validation artifact should exist on disk")

        const content = await readFile(valPath, "utf-8")
        assert.ok(content.includes("VALIDATION: TEST01-SUB01"), "should contain validation header")
        assert.ok(content.includes("Criteria Checklist"), "should contain criteria section")
    })
})

describe("checkPlanCompletionCriteria", () => {
    it("returns criteria object with boolean fields", async () => {
        const entry = await resolvePlanByPrefix(tmpDir, "TEST01")
        assert.ok(entry)

        const criteria = await checkPlanCompletionCriteria(tmpDir, entry.id)
        assert.ok(typeof criteria.all_nodes_complete === "boolean")
        assert.ok(typeof criteria.all_links_resolve === "boolean")
        assert.ok(typeof criteria.yaml_headers_valid === "boolean")
        assert.ok(typeof criteria.navigation_intact === "boolean")
        assert.ok(typeof criteria.graph_sync === "boolean")
    })
})

describe("syncPlanValidationState", () => {
    it("updates manifest validation_state for a plan", async () => {
        const entry = await resolvePlanByPrefix(tmpDir, "TEST01")
        assert.ok(entry)

        await syncPlanValidationState(tmpDir, entry.id, "validated")

        const updated = await resolvePlanByPrefix(tmpDir, "TEST01")
        assert.ok(updated)
        assert.equal(updated.validation_state, "validated")
    })
})
