/**
 * HiveMind Init — One-command project initialization.
 *
 * Creates:
 *   - .hivemind/ directory structure
 *   - index.md with template
 *   - active.md with LOCKED status
 *   - brain.json with initial state
 *   - config.json with governance preferences
 *   - Auto-registers plugin in opencode.json
 */
import type { GovernanceMode, Language, ExpertLevel, OutputStyle, AutomationLevel, ProfilePresetKey } from "../schemas/config.js";
import type { AssetSyncTarget } from "./sync-assets.js";
/**
 * Inject HiveMind section into AGENTS.md and/or CLAUDE.md.
 * - Creates the file if it doesn't exist
 * - Appends section if not already present
 * - Updates section if already present (idempotent)
 */
export declare function injectAgentsDocs(directory: string, silent: boolean): void;
export interface InitOptions {
    language?: Language;
    governanceMode?: GovernanceMode;
    expertLevel?: ExpertLevel;
    outputStyle?: OutputStyle;
    automationLevel?: AutomationLevel | string;
    requireCodeReview?: boolean;
    enforceTdd?: boolean;
    syncTarget?: AssetSyncTarget;
    overwriteAssets?: boolean;
    silent?: boolean;
    force?: boolean;
    /** Profile preset to apply (beginner, intermediate, advanced, expert, coach) */
    profile?: ProfilePresetKey;
}
export declare function initProject(directory: string, options?: InitOptions): Promise<void>;
//# sourceMappingURL=init.d.ts.map