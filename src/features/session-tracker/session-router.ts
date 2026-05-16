/**
 * Session router — classify-before-I/O routing extracted from index.ts.
 *
 * Owns the single responsibility of classifying a session and returning
 * a routing decision that consumers use to skip or proceed with I/O.
 * Classification happens BEFORE any filesystem writes (D-05, CLASSIFY-BEFORE-IO).
 *
 * @module session-tracker/session-router
 */

import { SessionClassifier, type ClassificationResult } from "./classification.js"

/**
 * Routing decision returned after classification.
 *
 * `route: "child"` — skip ensureSessionReady, route to childWriter.
 * `route: "main"` — proceed with ensureSessionReady and main capture.
 * `route: "unknownSub"` — default-sub treatment (RC-3: never creates root dir).
 */
export type RoutingDecision =
  | { route: "child"; parentID: string; classification: ClassificationResult }
  | { route: "main"; classification: ClassificationResult }
  | { route: "unknownSub"; classification: ClassificationResult }

/**
 * Dependencies injected into the session router.
 */
export interface SessionRouterDeps {
  /** Session classifier for three-gate fallback. */
  classifier: SessionClassifier
  /** Safe session fetcher (wraps SDK call with error handling). */
  getSessionSafely: (id: string) => Promise<unknown>
}

/**
 * Session router that classifies sessions and returns routing decisions.
 *
 * Extracted from index.ts to enforce the classify-before-I/O contract
 * and reduce index.ts LOC. The router does NOT perform I/O — it only
 * returns a decision that the caller uses to route.
 *
 * Usage:
 * ```typescript
 * const router = new SessionRouter({ classifier, getSessionSafely })
 * const decision = await router.route(sessionID)
 * if (decision.route === "child") {
 *   // skip ensureSessionReady, write to child .json
 * } else if (decision.route === "main") {
 *   // proceed with ensureSessionReady + main .md capture
 * } else {
 *   // unknownSub: treat as child/default-sub (RC-3)
 * }
 * ```
 */
export class SessionRouter {
  private readonly classifier: SessionClassifier
  private readonly getSessionSafely: (id: string) => Promise<unknown>

  /**
   * @param deps - Injected dependencies.
   */
  constructor(deps: SessionRouterDeps) {
    this.classifier = deps.classifier
    this.getSessionSafely = deps.getSessionSafely
  }

  /**
   * Classifies a session and returns a routing decision.
   *
   * Classification happens FIRST (D-05) before any I/O.
   * Three-gate fallback: SDK parentID → hierarchy index → pending registry.
   *
   * RC-3: When all gates fail (`kind: "unknownSub"`), the route is
   * `"unknownSub"`, never `"main"`. Only explicit root sessions get `"main"`.
   *
   * @param sessionID - The session to classify and route.
   * @returns Routing decision with classification result attached.
   */
  async route(sessionID: string): Promise<RoutingDecision> {
    const classification = await this.classifier.classify(
      sessionID,
      this.getSessionSafely,
    )

    switch (classification.kind) {
      case "child":
        return { route: "child", parentID: classification.parentID, classification }
      case "root":
        return { route: "main", classification }
      case "unknownSub":
        return { route: "unknownSub", classification }
    }
  }

  /**
   * Exposes the underlying classifier for registry operations.
   *
   * @returns The session classifier instance.
   */
  getClassifier(): SessionClassifier {
    return this.classifier
  }
}
