import type { PurposeClass } from '../features/session-entry/start-work-types.js'

export function resolveCategoryRoute(purposeClass: PurposeClass): string {
  const categories: Record<PurposeClass, string> = {
    discovery: 'discussion',
    brainstorming: 'analysis',
    research: 'research',
    planning: 'planning',
    implementation: 'execution',
    gatekeeping: 'verification',
    tdd: 'tdd',
    'course-correction': 'recovery',
  }

  return categories[purposeClass]
}
