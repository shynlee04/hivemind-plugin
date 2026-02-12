/**
 * StateManager - Disk persistence for brain state
 */

import { readFile, writeFile, mkdir, copyFile } from "fs/promises";
import { existsSync } from "fs";
import { dirname, join } from "path";
import type { BrainState } from "../schemas/brain-state.js";
import type { HiveMindConfig } from "../schemas/config.js";
import { createBrainState } from "../schemas/brain-state.js";
import { createConfig } from "../schemas/config.js";

export interface StateManager {
  load(): Promise<BrainState | null>;
  save(state: BrainState): Promise<void>;
  initialize(sessionId: string, config: HiveMindConfig): Promise<BrainState>;
  exists(): boolean;
}

export function createStateManager(projectRoot: string): StateManager {
  const brainPath = join(projectRoot, ".hivemind", "brain.json");

  return {
    async load(): Promise<BrainState | null> {
      try {
        if (!existsSync(brainPath)) {
          return null;
        }
        const data = await readFile(brainPath, "utf-8");
        const parsed = JSON.parse(data) as BrainState;
        // Migration: ensure fields added in v1.5+ exist
        parsed.last_commit_suggestion_turn ??= 0;
        // Migration: ensure Round 2 session fields exist
        parsed.session.date ??= new Date(parsed.session.start_time).toISOString().split("T")[0];
        parsed.session.meta_key ??= "";
        parsed.session.role ??= "";
        parsed.session.by_ai ??= true;
        // Migration: ensure Iteration 1 fields exist (hierarchy-redesign)
        parsed.compaction_count ??= 0;
        parsed.last_compaction_time ??= 0;
        parsed.next_compaction_report ??= null;
        parsed.cycle_log ??= [];
        parsed.pending_failure_ack ??= false;
        // Migration: ensure detection counter fields exist
        parsed.metrics.consecutive_failures ??= 0;
        parsed.metrics.consecutive_same_section ??= 0;
        parsed.metrics.last_section_content ??= "";
        parsed.metrics.keyword_flags ??= [];
        parsed.metrics.write_without_read_count ??= 0;
        parsed.metrics.tool_type_counts ??= { read: 0, write: 0, query: 0, governance: 0 };
        parsed.metrics.governance_counters ??= {
          out_of_order: 0,
          drift: 0,
          compaction: 0,
          evidence_pressure: 0,
          ignored: 0,
          acknowledged: false,
          prerequisites_completed: false,
        };
        parsed.framework_selection ??= {
          choice: null,
          active_phase: "",
          active_spec_path: "",
          acceptance_note: "",
          updated_at: 0,
        };
        // Migration: remove deprecated sentiment_signals field
        delete (parsed as any).sentiment_signals;
        return parsed;
      } catch {
        return null;
      }
    },
    
    async save(state: BrainState): Promise<void> {
      try {
        await mkdir(dirname(brainPath), { recursive: true });
        // Backup before overwrite — prevents silent state loss from corruption
        if (existsSync(brainPath)) {
          const bakPath = brainPath + ".bak";
          try {
            await copyFile(brainPath, bakPath);
          } catch {
            // Non-fatal — proceed with save even if backup fails
          }
        }
        await writeFile(brainPath, JSON.stringify(state, null, 2));
      } catch (error) {
        throw new Error(`Failed to save brain state: ${error}`);
      }
    },
    
    async initialize(
      sessionId: string,
      config: HiveMindConfig
    ): Promise<BrainState> {
      const state = createBrainState(sessionId, config);
      await this.save(state);
      return state;
    },
    
    exists(): boolean {
      return existsSync(brainPath);
    },
  };
}

export async function loadConfig(projectRoot: string): Promise<HiveMindConfig> {
  const configPath = join(projectRoot, ".hivemind", "config.json");

  try {
    if (existsSync(configPath)) {
      const data = await readFile(configPath, "utf-8");
      const parsed = JSON.parse(data);
      return createConfig(parsed);
    }
  } catch {
    // Fall through to default
  }
  
  return createConfig();
}

export async function saveConfig(
  projectRoot: string,
  config: HiveMindConfig
): Promise<void> {
  const configPath = join(projectRoot, ".hivemind", "config.json");
  await mkdir(dirname(configPath), { recursive: true });
  await writeFile(configPath, JSON.stringify(config, null, 2));
}
