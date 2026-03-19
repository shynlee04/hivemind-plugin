export interface RouteHintInput {
  routeCommand?: string
  risk: string
}

/**
 * Render a minimal route reminder without reviving legacy bridge rules.
 *
 * @param input Route command and risk classification.
 * @returns Route reminder block when a routed command exists.
 */
export function renderRouteHint(input: RouteHintInput): string | undefined {
  if (!input.routeCommand) {
    return undefined
  }

  return [
    '<hivemind-route-hint>',
    `route_command=${input.routeCommand}`,
    `risk=${input.risk}`,
    '</hivemind-route-hint>',
  ].join('\n')
}
