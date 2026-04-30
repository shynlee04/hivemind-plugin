import { randomUUID } from "node:crypto"
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs"
import { dirname, resolve } from "node:path"

import { AgentWorkContractStoreSchema, type AgentWorkContract, type AgentWorkContractStore } from "../../schema-kernel/agent-work-contract.schema.js"
import { assertPathWithinRoot } from "../security/path-scope.js"

const STORE_VERSION = 1 as const

/**
 * Get the dedicated agent work contracts store path for a project root.
 *
 * @param projectRoot - Trusted project root.
 * @returns Absolute path to `.hivemind/state/agent-work-contracts.json`.
 */
export function getAgentWorkContractsFilePath(projectRoot: string): string {
  const stateDir = resolve(projectRoot, ".hivemind", "state")
  return assertPathWithinRoot(stateDir, "agent-work-contracts.json", "agent work contracts")
}

/**
 * Read the durable agent work contract store from disk.
 *
 * @param projectRoot - Trusted project root.
 * @returns Deep-cloned store state.
 */
export function readAgentWorkContracts(projectRoot: string): AgentWorkContractStore {
  const filePath = getAgentWorkContractsFilePath(projectRoot)
  if (!existsSync(filePath)) return createEmptyStore()

  const parsed = AgentWorkContractStoreSchema.safeParse(JSON.parse(readFileSync(filePath, "utf-8")))
  if (!parsed.success) {
    quarantineCorruptStore(filePath)
    return createEmptyStore()
  }

  return cloneStore(parsed.data)
}

/**
 * Persist a complete agent work contract store atomically.
 *
 * @param projectRoot - Trusted project root.
 * @param store - Store payload to persist.
 */
export function persistAgentWorkContracts(projectRoot: string, store: AgentWorkContractStore): void {
  const filePath = getAgentWorkContractsFilePath(projectRoot)
  mkdirSync(dirname(filePath), { recursive: true })
  const tmpFile = `${filePath}.${process.pid}.${randomUUID()}.tmp`
  writeFileSync(tmpFile, `${JSON.stringify({ ...store, updatedAt: Date.now() }, null, 2)}\n`, "utf-8")
  renameSync(tmpFile, filePath)
}

/**
 * Upsert a single contract into the dedicated contract store.
 *
 * @param projectRoot - Trusted project root.
 * @param contract - Contract to persist.
 * @returns Deep-cloned persisted contract.
 */
export function upsertAgentWorkContract(projectRoot: string, contract: AgentWorkContract): AgentWorkContract {
  const store = readAgentWorkContracts(projectRoot)
  const nextContract = cloneContract({ ...contract, updatedAt: Date.now() })
  persistAgentWorkContracts(projectRoot, {
    version: STORE_VERSION,
    updatedAt: Date.now(),
    contracts: { ...store.contracts, [nextContract.id]: nextContract },
  })
  return cloneContract(nextContract)
}

/**
 * Fetch one contract by ID.
 *
 * @param projectRoot - Trusted project root.
 * @param contractId - Contract ID to read.
 * @returns Deep-cloned contract when present.
 */
export function getAgentWorkContract(projectRoot: string, contractId: string): AgentWorkContract | undefined {
  const contract = readAgentWorkContracts(projectRoot).contracts[contractId]
  return contract ? cloneContract(contract) : undefined
}

/**
 * Create an empty store payload.
 *
 * @returns Empty store with current timestamp.
 */
function createEmptyStore(): AgentWorkContractStore {
  return { version: STORE_VERSION, updatedAt: Date.now(), contracts: {} }
}

/**
 * Move corrupt store data aside for audit inspection.
 *
 * @param filePath - Corrupt store file path.
 */
function quarantineCorruptStore(filePath: string): void {
  renameSync(filePath, `${filePath}.corrupt-${Date.now()}-${process.pid}-${randomUUID()}`)
}

/**
 * Deep-clone a store through the schema-safe JSON boundary.
 *
 * @param store - Store to clone.
 * @returns Deep-cloned store.
 */
function cloneStore(store: AgentWorkContractStore): AgentWorkContractStore {
  return {
    version: STORE_VERSION,
    updatedAt: store.updatedAt,
    contracts: Object.fromEntries(Object.entries(store.contracts).map(([id, contract]) => [id, cloneContract(contract)])),
  }
}

/**
 * Deep-clone one contract.
 *
 * @param contract - Contract to clone.
 * @returns Deep-cloned contract.
 */
function cloneContract(contract: AgentWorkContract): AgentWorkContract {
  return {
    ...contract,
    owner: { ...contract.owner },
    scope: {
      taskBoundary: contract.scope.taskBoundary,
      allowedSurfaces: [...contract.scope.allowedSurfaces],
      dependencies: [...contract.scope.dependencies],
      nonGoals: [...contract.scope.nonGoals],
    },
    evidence: {
      requiredProof: [...contract.evidence.requiredProof],
      minimumEvidenceLevel: contract.evidence.minimumEvidenceLevel,
      verificationCommands: [...contract.evidence.verificationCommands],
      blockedStateRules: [...contract.evidence.blockedStateRules],
    },
    compaction: {
      briefing: contract.compaction.briefing,
      summary: contract.compaction.summary,
      anchors: [...contract.compaction.anchors],
      reinjectionPayload: contract.compaction.reinjectionPayload,
      sourceRefs: [...contract.compaction.sourceRefs],
    },
  }
}
