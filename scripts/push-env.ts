#!/usr/bin/env bun
/**
 * Push .env.local values to github-secrets-sync repository
 *
 * Usage:
 *   bun run scripts/push-env.ts
 *
 * This script:
 * 1. Loads values from .env.local
 * 2. Classifies them as secrets (sensitive) or vars (non-sensitive)
 * 3. Pushes them to the github-secrets-sync repository using gh CLI
 *
 * Classification rules:
 * - Vars: Names containing PUBLIC_, NEXT_PUBLIC_, or non-sensitive patterns
 * - Secrets: Everything else (API keys, tokens, passwords, etc.)
 */

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Execute gh CLI command safely
 */
function gh(args: string[]): string {
  try {
    const output = execFileSync("gh", args, {
      encoding: "utf-8",
      stdio: "pipe",
    });
    return output.trim();
  } catch (error) {
    if (error instanceof Error && "stderr" in error) {
      const err = error as unknown as { stderr: string; stdout: string };
      throw new Error(err.stderr || err.stdout || error.message);
    }
    throw error;
  }
}

/**
 * Parse .env.local file
 */
function parseEnvFile(content: string): Map<string, string> {
  const env = new Map<string, string>();
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
        env.set(key, value);
      }
    }
  }

  return env;
}

/**
 * Classify env var as secret or var
 *
 * Vars (non-sensitive):
 * - Public variables (NEXT_PUBLIC_*, PUBLIC_*)
 * - URLs and configuration (non-sensitive)
 * - Feature flags, config values
 *
 * Secrets (sensitive):
 * - API keys, tokens
 * - Passwords
 * - Private keys
 * - Database URLs (may contain credentials)
 */
function classifyAsVar(name: string): boolean {
  const varPatterns = [
    /^NEXT_PUBLIC_/,
    /^PUBLIC_/,
    /^NODE_ENV$/,
    /^ENVIRONMENT$/,
    /^REGION$/,
    /^VERCEL_/,
    /^CF_ACCOUNT_ID$/,
    /^CLOUDFLARE_ACCOUNT_ID$/,
  ];

  return varPatterns.some((pattern) => pattern.test(name));
}

/**
 * Push env var to GitHub
 */
function pushEnvVar(
  name: string,
  value: string,
  isVar: boolean
): { success: boolean; error?: string } {
  try {
    if (isVar) {
      // Set as variable (non-sensitive, visible in UI)
      gh(["variable", "set", name, "--body", value]);
      console.log(`  ✅ Set var: ${name}`);
    } else {
      // Set as secret (encrypted, hidden)
      gh(["secret", "set", name, "--body", value]);
      console.log(`  🔒 Set secret: ${name}`);
    }
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Main function
 */
async function main() {
  console.log("📤 Pushing .env.local to github-secrets-sync repository\n");

  // Load .env.local
  const envPath = resolve(".env.local");
  let envContent: string;

  try {
    envContent = readFileSync(envPath, "utf-8");
  } catch {
    console.error("❌ Error: .env.local file not found");
    console.error("   Create .env.local with your secrets/vars first");
    process.exit(1);
  }

  const envVars = parseEnvFile(envContent);

  if (envVars.size === 0) {
    console.error("❌ Error: No variables found in .env.local");
    process.exit(1);
  }

  console.log(`Found ${envVars.size} variables in .env.local\n`);

  // Classify and push
  let secretsCount = 0;
  let varsCount = 0;
  let errors = 0;

  for (const [name, value] of envVars.entries()) {
    const isVar = classifyAsVar(name);

    if (isVar) {
      varsCount++;
    } else {
      secretsCount++;
    }

    const result = pushEnvVar(name, value, isVar);

    if (!result.success) {
      console.error(`  ❌ Failed to set ${name}: ${result.error}`);
      errors++;
    }
  }

  console.log(`\n✅ Done!`);
  console.log(`   Secrets: ${secretsCount}`);
  console.log(`   Vars: ${varsCount}`);
  console.log(`   Errors: ${errors}`);
  console.log(`\n💡 View secrets: gh secret list`);
  console.log(`💡 View vars: gh variable list`);

  if (errors > 0) {
    process.exit(1);
  }
}

main();
