// Local development: import directly from compiled dist
// For npm publish, this would be: import plugin from 'hivemind-context-governance/plugin'
import pluginModule from '../../dist/plugin/opencode-plugin.js'

// Handle both ESM default export and direct module export
const plugin = (pluginModule as { default?: typeof pluginModule }).default || pluginModule

export default plugin
