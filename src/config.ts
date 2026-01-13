import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { SyncConfig } from "./types.js";

/**
 * Detect current repository from git or GitHub Actions environment
 */
export function detectRepository(): string {
  // In GitHub Actions, use GITHUB_REPOSITORY
  if (process.env.GITHUB_REPOSITORY) {
    return process.env.GITHUB_REPOSITORY;
  }

  // Fallback: detect from git remote
  try {
    const remoteUrl = execFileSync("git", ["remote", "get-url", "origin"], {
      encoding: "utf-8",
      stdio: "pipe",
    }).trim();

    // Parse various git URL formats:
    // https://github.com/owner/repo.git
    // git@github.com:owner/repo.git
    // git://github.com/owner/repo.git
    const match = remoteUrl.match(/(?:\/|:)([\w-]+\/[\w-]+)(?:\.git)?$/);
    if (match) {
      return match[1];
    }
  } catch {
    // git command failed, continue to error
  }

  throw new Error(
    "Could not detect repository. Set source_repository in sync-config.yaml or run in GitHub Actions."
  );
}

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
 *     - key: value  (object in array with nested fields)
 */
function parseYaml(content: string): SyncConfig {
  const lines = content.split("\n");
  const config: Record<string, unknown> = {};

  type StackItem = { obj: Record<string, unknown>; key: string; indent: number; isArray: boolean };
  const stack: StackItem[] = [];
  let root: Record<string, unknown> = config;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const indent = line.search(/\S|$/);
    const isListItem = trimmed.startsWith("-");

    // Pop stack to correct level
    while (stack.length > 0 && stack[stack.length - 1].indent >= indent) {
      stack.pop();
    }

    const currentContext = stack.length > 0 ? stack[stack.length - 1] : { obj: config, indent: -1, isArray: false };

    if (isListItem) {
      const itemContent = trimmed.substring(1).trim();

      if (!itemContent.includes(":")) {
        // Simple array value: "- item"
        if (Array.isArray(currentContext.obj)) {
          currentContext.obj.push(itemContent);
        }
      } else {
        // Object in array: "- key: value"
        const [key, ...valueParts] = itemContent.split(":");
        const value = valueParts.join(":").trim();
        const newObj = key ? { [key.trim()]: value } : {};

        if (Array.isArray(currentContext.obj)) {
          currentContext.obj.push(newObj);
          // Push to stack so next lines can add to this object
          stack.push({ obj: newObj, key: key?.trim() || "", indent, isArray: false });
        }
      }
      continue;
    }

    // Key-value pair
    const colonIndex = trimmed.indexOf(":");
    if (colonIndex > 0) {
      const key = trimmed.substring(0, colonIndex).trim();
      const value = trimmed.substring(colonIndex + 1).trim();

      // Look ahead to see if next line is array start or indented content
      const nextLine = i + 1 < lines.length ? lines[i + 1].trim() : "";
      const isParentOfArray = nextLine.startsWith("-");
      const hasIndentedContent = i + 1 < lines.length && lines[i + 1].search(/\S|$/) > indent;

      if (value === "" || isParentOfArray || hasIndentedContent) {
        // Object or array follows
        if (isParentOfArray) {
          const newArray: unknown[] = [];
          currentContext.obj[key] = newArray;
          stack.push({ obj: newArray as unknown as Record<string, unknown>, key, indent, isArray: true });
        } else {
          const newObj: Record<string, unknown> = {};
          currentContext.obj[key] = newObj;
          stack.push({ obj: newObj, key, indent, isArray: false });
        }
      } else {
        // Simple value
        currentContext.obj[key] = value;
      }
    }
  }

  return validateConfig(config as unknown as SyncConfig);
}

/**
 * Validate the configuration
 */
function validateConfig(config: SyncConfig): SyncConfig {
  // Auto-detect source_repository if not specified
  if (!config.source_repository) {
    config.source_repository = detectRepository();
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
