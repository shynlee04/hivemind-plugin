import { resolveDocKnowledgeSurfaces } from '../intelligence/doc/index.js'
import type { StartWorkDecision } from '../hooks/start-work/index.js'
import type { PluginContext } from './handler-types.js'
import { resolveCategoryRoute } from './category-routing.js'
import { resolveCommandBinding } from './command-resolution.js'
import { resolveSessionInheritance } from './session-inheritance.js'
import { resolveToolGrants } from './tool-resolution.js'

export function buildPluginContext(startWork: StartWorkDecision): PluginContext {
  const commandBinding = resolveCommandBinding(startWork)

  return {
    lineage: startWork.lineage,
    category: resolveCategoryRoute(startWork.purposeClass),
    commandBinding,
    toolGrants: resolveToolGrants(startWork, commandBinding.bundle, commandBinding),
    sessionInheritance: resolveSessionInheritance(startWork),
    docSurfaces: resolveDocKnowledgeSurfaces(startWork.purposeClass),
    opencodeKnowledge: startWork.opencodeKnowledge,
    startWork,
  }
}
