import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { SyncConfig } from "./types.js";

/**
 * Load and parse sync-config.yaml
 */
export function loadConfig(configPath: string = "sync-config.yaml"): SyncConfig {
  const resolvedPath = resolve(configPath);
  const content = readFileSync(resolvedPath, "utf-8");

  return parseYaml(content);
}

/**
 * Simple YAML parser for our config format
 * Handles:
 * - key: value
 * - key:
 *     - item1
 *     - item2
 *     - key: value  (object in array)
 */
function parseYaml(content: string): SyncConfig {
  const lines = content.split("\n");
  const config: Record<string, unknown> = {};

  let currentArray: unknown[] | null = null;
  let currentKey = "";
  let currentObj: Record<string, unknown> | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const indent = line.search(/\S|$/);

    // Check for array item
    if (trimmed.startsWith("-")) {
      const itemContent = trimmed.substring(1).trim();

      if (!itemContent.includes(":")) {
        // Simple array value
        if (currentArray) {
          currentArray.push(itemContent);
        }
      } else {
        // Object in array (e.g., "- repository: owner/repo")
        const [key, ...valueParts] = itemContent.split(":");
        const value = valueParts.join(":").trim();

        if (!currentObj) {
          currentObj = {};
          if (currentArray) {
            currentArray.push(currentObj);
          }
        }

        currentObj[key.trim()] = value;
      }
      continue;
    }

    // Check for key-value pair
    const colonIndex = trimmed.indexOf(":");
    if (colonIndex > 0) {
      const key = trimmed.substring(0, colonIndex).trim();
      const value = trimmed.substring(colonIndex + 1).trim();

      // Look ahead to see if next line is array start
      const nextLine = i + 1 < lines.length ? lines[i + 1].trim() : "";
      const isParentOfArray = nextLine.startsWith("-");

      if (value === "" || isParentOfArray) {
        // Empty value means object or array follows
        if (isParentOfArray) {
          currentArray = [];
          currentObj = null;
          config[key] = currentArray;
        } else {
          currentObj = {};
          config[key] = currentObj;
        }
        currentKey = key;
      } else {
        // Simple value
        config[key] = value;
        currentArray = null;
        currentObj = null;
      }
    }
  }

  return validateConfig(config as unknown as SyncConfig);
}

/**
 * Validate the configuration
 */
function validateConfig(config: SyncConfig): SyncConfig {
  if (!config.source_repository) {
    throw new Error("Missing required field: source_repository");
  }

  if (!config.secrets || config.secrets.length === 0) {
    throw new Error("Missing required field: secrets (must have at least one)");
  }

  if (!config.targets || config.targets.length === 0) {
    throw new Error("Missing required field: targets (must have at least one)");
  }

  for (const target of config.targets) {
    if (!target.repository) {
      throw new Error("Each target must have a 'repository' field");
    }
  }

  return config;
}

/**
 * Format repository name for display
 */
export function formatRepo(repo: string): string {
  return repo.replace(/^refs\/heads\//, "");
}
