import type { PurposeClass } from '../../features/session-entry/start-work-types.js'

export interface DocKnowledgeSurface {
  surfaceId: 'planning' | 'handoff' | 'verification' | 'research' | 'artifacts'
  required: boolean
}

export function resolveDocKnowledgeSurfaces(purposeClass: PurposeClass): DocKnowledgeSurface[] {
  const defaults: Record<PurposeClass, DocKnowledgeSurface[]> = {
    discovery: [],
    brainstorming: [{ surfaceId: 'artifacts', required: false }],
    research: [
      { surfaceId: 'research', required: true },
      { surfaceId: 'artifacts', required: true },
    ],
    planning: [
      { surfaceId: 'planning', required: true },
      { surfaceId: 'handoff', required: false },
    ],
    implementation: [
      { surfaceId: 'planning', required: true },
      { surfaceId: 'handoff', required: true },
    ],
    gatekeeping: [
      { surfaceId: 'verification', required: true },
      { surfaceId: 'artifacts', required: true },
    ],
    tdd: [
      { surfaceId: 'planning', required: true },
      { surfaceId: 'verification', required: true },
    ],
    'course-correction': [
      { surfaceId: 'handoff', required: true },
      { surfaceId: 'artifacts', required: true },
    ],
  }

  return defaults[purposeClass]
}
