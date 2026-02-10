/**
 * StateManager - Disk persistence for brain state
 */

import { readFile, writeFile, mkdir } from "fs/promises";
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
  const brainPath = join(projectRoot, ".opencode", "planning", "brain.json");
  
  return {
    async load(): Promise<BrainState | null> {
      try {
        if (!existsSync(brainPath)) {
          return null;
        }
        const data = await readFile(brainPath, "utf-8");
        return JSON.parse(data) as BrainState;
      } catch {
        return null;
      }
    },
    
    async save(state: BrainState): Promise<void> {
      try {
        await mkdir(dirname(brainPath), { recursive: true });
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
  const configPath = join(projectRoot, ".opencode", "planning", "config.json");
  
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
  const configPath = join(projectRoot, ".opencode", "planning", "config.json");
  await mkdir(dirname(configPath), { recursive: true });
  await writeFile(configPath, JSON.stringify(config, null, 2));
}
