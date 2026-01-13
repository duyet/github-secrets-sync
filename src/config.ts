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
 */
function parseYaml(content: string): SyncConfig {
  const lines = content.split("\n");
  const config: Record<string, unknown> = {};

  type StackItem = { obj: Record<string, unknown> | unknown[]; key: string; indent: number; isArray: boolean };
  const stack: StackItem[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const indent = line.search(/\S/);
    const isListItem = trimmed.startsWith("-");

    // Pop stack to correct level
    // Pop when moving UP or staying at same level (unless we're a nested object property)
    while (stack.length > 0 && stack[stack.length - 1].indent >= indent) {
      // Special case: if we're a list item at the same indent as a previous list item, pop it
      // This handles multiple list items at the same level
      if (stack[stack.length - 1].indent === indent && isListItem) {
        stack.pop();
        break;
      }
      // Special case: if we're at same indent and current context is an object,
      // we might be adding a property to it, so don't pop
      if (stack[stack.length - 1].indent === indent && !stack[stack.length - 1].isArray) {
        break;
      }
      stack.pop();
    }

    const currentContext = stack.length > 0 ? stack[stack.length - 1] : { obj: config, indent: -1, isArray: false };

    if (isListItem) {
      const itemContent = trimmed.substring(1).trim();

      if (!itemContent.includes(":")) {
        // Simple array value: "- item"
        if (Array.isArray(currentContext.obj)) {
          (currentContext.obj as string[]).push(itemContent);
        }
      } else {
        // Object in array: "- key: value"
        const [key, ...valueParts] = itemContent.split(":");
        const value = valueParts.join(":").trim();
        const newObj: Record<string, unknown> = {};
        if (key) {
          newObj[key.trim()] = value;
        }

        if (Array.isArray(currentContext.obj)) {
          (currentContext.obj as unknown[]).push(newObj);
          // Push to stack so next lines can add to this object
          stack.push({ obj: newObj, key: key?.trim() || "", indent, isArray: false });
        }
      }
    } else {
      // Key-value pair
      const colonIndex = trimmed.indexOf(":");
      if (colonIndex > 0) {
        const key = trimmed.substring(0, colonIndex).trim();
        const value = trimmed.substring(colonIndex + 1).trim();

        // Look ahead to see if next line is array start or indented content
        // Skip comments and empty lines
        let nextNonEmptyLine = "";
        for (let j = i + 1; j < lines.length; j++) {
          const lookAhead = lines[j];
          if (lookAhead.trim() && !lookAhead.trim().startsWith("#")) {
            nextNonEmptyLine = lookAhead;
            break;
          }
        }
        const isParentOfArray = nextNonEmptyLine.trim().startsWith("-");
        // Check if next non-empty line has greater indent than current line
        let hasIndentedContent = false;
        if (nextNonEmptyLine) {
          hasIndentedContent = nextNonEmptyLine.search(/\S/) > indent;
        }

        if (value === "" || isParentOfArray || hasIndentedContent) {
          // Object or array follows - create container
          if (isParentOfArray) {
            const newArray: unknown[] = [];
            (currentContext.obj as Record<string, unknown>)[key] = newArray;
            stack.push({ obj: newArray, key, indent, isArray: true });
          } else {
            const newObj: Record<string, unknown> = {};
            (currentContext.obj as Record<string, unknown>)[key] = newObj;
            stack.push({ obj: newObj, key, indent, isArray: false });
          }
        } else {
          // Simple value
          (currentContext.obj as Record<string, unknown>)[key] = value;
        }
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
