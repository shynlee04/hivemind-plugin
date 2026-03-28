import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

export interface HierarchyNode {
  sessionId: string
  parentSessionId: string | null
  childSessionIds: string[]
}

interface HierarchyDocument {
  nodes: HierarchyNode[]
  updatedAt: string
}

function getHierarchyPath(sessionsDir: string): string {
  return join(sessionsDir, 'journey-events', 'hierarchy.json')
}

function createNode(sessionId: string, parentSessionId: string | null = null): HierarchyNode {
  return {
    sessionId,
    parentSessionId,
    childSessionIds: [],
  }
}

async function loadHierarchyJson(sessionsDir: string): Promise<HierarchyDocument> {
  const hierarchyPath = getHierarchyPath(sessionsDir)

  try {
    const content = await readFile(hierarchyPath, 'utf8')
    const parsed = JSON.parse(content) as Partial<HierarchyDocument>

    return {
      nodes: Array.isArray(parsed.nodes) ? parsed.nodes : [],
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : new Date().toISOString(),
    }
  } catch {
    return {
      nodes: [],
      updatedAt: new Date().toISOString(),
    }
  }
}

export async function writeHierarchyJson(sessionsDir: string, nodes: HierarchyNode[]): Promise<void> {
  const hierarchyPath = getHierarchyPath(sessionsDir)
  await mkdir(join(sessionsDir, 'journey-events'), { recursive: true })
  await writeFile(
    hierarchyPath,
    JSON.stringify({ nodes, updatedAt: new Date().toISOString() }, null, 2),
    'utf8'
  )
}

export async function appendHierarchyLink(
  sessionsDir: string,
  parentId: string,
  childId: string
): Promise<void> {
  const hierarchy = await loadHierarchyJson(sessionsDir)

  let parentNode = hierarchy.nodes.find((node) => node.sessionId === parentId)
  if (!parentNode) {
    parentNode = createNode(parentId)
    hierarchy.nodes.push(parentNode)
  }

  if (!parentNode.childSessionIds.includes(childId)) {
    parentNode.childSessionIds.push(childId)
  }

  let childNode = hierarchy.nodes.find((node) => node.sessionId === childId)
  if (!childNode) {
    childNode = createNode(childId, parentId)
    hierarchy.nodes.push(childNode)
  } else {
    childNode.parentSessionId = parentId
  }

  await writeHierarchyJson(sessionsDir, hierarchy.nodes)
}
