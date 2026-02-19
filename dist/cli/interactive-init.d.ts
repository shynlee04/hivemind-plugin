/**
 * HiveMind Interactive Init — Guided setup wizard using @clack/prompts.
 *
 * When `npx hivemind init` is run without flags, this wizard guides users
 * through governance mode, language, automation level, expert level, and
 * output style — making the configuration discoverable and coherent.
 */
import type { InitOptions } from "./init.js";
import type { AssetSyncTarget } from "./sync-assets.js";
export declare const ASSET_TARGET_LABELS: Record<AssetSyncTarget, string>;
/**
 * Run the interactive init wizard.
 * Returns InitOptions populated from user choices.
 * Returns null if user cancels.
 */
export declare function runInteractiveInit(): Promise<InitOptions | null>;
//# sourceMappingURL=interactive-init.d.ts.map