// Barrel re-export — splits monolithic defaults.ts into domain-specific files.
// Consumers import from "defaults.js" and get all exports without path changes.
export * from "./governance-defaults.js"
export * from "./agent-defaults.js"
export * from "./tool-defaults.js"
export { COMMAND_AGENT_MAPPINGS } from "./command-mappings.js"
