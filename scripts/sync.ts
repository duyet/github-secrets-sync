#!/usr/bin/env bun
/**
 * Sync secrets and vars from local environment to target repositories
 *
 * Usage:
 *   # Load .env.local and sync to all targets
 *   bun run scripts/sync.ts
 *
 *   # Dry run (preview changes)
 *   bun run scripts/sync.ts --dry-run
 *
 *   # Verbose output
 *   bun run scripts/sync.ts --verbose
 *
 * This script:
 * 1. Loads values from .env.local into environment
 * 2. Runs the sync process to push secrets/vars to target repos
 * 3. Uses sync-config.yaml for configuration
 */

import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Parse .env.local file and return as object
 */
function parseEnvFile(content: string): Record<string, string> {
  const env: Record<string, string> = {};
  const lines = content.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();
    // Skip comments and empty lines
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const eqIndex = trimmed.indexOf("=");
    if (eqIndex > 0) {
      const key = trimmed.substring(0, eqIndex).trim();
      const value = trimmed.substring(eqIndex + 1).trim();
      // Skip empty values
      if (value) {
        env[key] = value;
      }
    }
  }

  return env;
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);

  console.log("🔄 Syncing secrets/vars to target repositories\n");

  // Load .env.local
  const envPath = resolve(".env.local");
  let envContent: string;

  try {
    envContent = readFileSync(envPath, "utf-8");
  } catch {
    console.error("❌ Error: .env.local file not found");
    console.error("   Run 'bun run scripts/push-env.ts' first to create it");
    process.exit(1);
  }

  const envVars = parseEnvFile(envContent);

  if (Object.keys(envVars).length === 0) {
    console.error("❌ Error: No variables found in .env.local");
    process.exit(1);
  }

  console.log(`Loaded ${Object.keys(envVars).length} variables from .env.local\n`);

  // Set environment variables and run sync
  // We use execSync to spawn a new process with the env vars set
  const syncArgs = ["run", "src/index.ts", ...args];

  try {
    execSync(`bun ${syncArgs.join(" ")}`, {
      stdio: "inherit",
      env: {
        ...process.env,
        ...envVars,
        // Ensure GH_SYNC_PAT is set from .env.local
        GH_SYNC_PAT: envVars.GH_SYNC_PAT || process.env.GH_SYNC_PAT,
      },
    });
  } catch (error) {
    console.error("\n❌ Sync failed");
    process.exit(1);
  }
}

main();
