import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import type { CliOptions, SyncResult, SecretSyncResult } from "./types.js";
import { loadConfig } from "./config.js";
import { configureAuth, syncSecret, getSecretValue, syncVariable, getVarValue } from "./github.js";

/**
 * Parse CLI arguments
 */
function parseArgs(): CliOptions {
  const args = process.argv.slice(2);
  const options: CliOptions = {
    dryRun: false,
    verbose: false,
  };

  for (const arg of args) {
    switch (arg) {
      case "--dry-run":
      case "-n":
        options.dryRun = true;
        break;
      case "--verbose":
      case "-v":
        options.verbose = true;
        break;
      case "--help":
      case "-h":
        printHelp();
        process.exit(0);
      default:
        if (arg.startsWith("--config=")) {
          options.config = arg.split("=")[1];
        }
    }
  }

  return options;
}

/**
 * Print help message
 */
function printHelp(): void {
  console.log(`
GitHub Secrets Sync

Usage:
  bun run src/index.ts [options]

Options:
  --dry-run, -n     Run without making changes
  --verbose, -v     Enable verbose output
  --config=<path>   Use custom config file
  --help, -h        Show this help message

Environment Variables:
  GH_SYNC_PAT       GitHub Personal Access Token (required)
  <SECRET_NAME>     Secret values as environment variables
`);
}

/**
 * Log message if verbose
 */
function log(message: string, verbose: boolean): void {
  if (verbose) {
    console.error(`[DEBUG] ${message}`);
  }
}

/**
 * Execute sync operation
 */
async function runSync(options: CliOptions): Promise<SyncResult> {
  // Configure gh CLI with token
  const token = process.env.GH_SYNC_PAT;
  if (!token) {
    throw new Error("GH_SYNC_PAT environment variable is required");
  }
  configureAuth(token);

  // Load configuration
  const configPath = options.config || "sync-config.yaml";
  log(`Loading config from: ${configPath}`, options.verbose);
  const config = loadConfig(configPath);

  log(`Source repository: ${config.source_repository}`, options.verbose);
  log(`Secrets to sync: ${config.secrets.join(", ")}`, options.verbose);
  log(`Vars to sync: ${config.vars?.join(", ") || "none"}`, options.verbose);
  log(`Targets: ${config.targets.map((t) => t.repository).join(", ")}`, options.verbose);

  const results: SecretSyncResult[] = [];
  const timestamp = new Date().toISOString();

  // Sync each secret to each target
  // For each target, use its own secrets list if specified, otherwise use global list
  for (const target of config.targets) {
    const secretsForTarget = target.secrets || config.secrets;
    const varsForTarget = target.vars || config.vars || [];

    log(`Target: ${target.repository}`, options.verbose);
    log(`  Secrets: ${secretsForTarget.join(", ")}`, options.verbose);
    log(`  Vars: ${varsForTarget.length > 0 ? varsForTarget.join(", ") : "none"}`, options.verbose);

    // Sync secrets
    for (const secretName of secretsForTarget) {
      log(`  Processing secret: ${secretName}`, options.verbose);

      // Get secret value from environment variable
      const secretValue = getSecretValue(secretName);
      log(`    Retrieved secret value`, options.verbose);

      const result = syncSecret(secretName, target.repository, secretValue, options.dryRun);
      results.push(result);

      if (result.success) {
        log(`    ✅ Success`, options.verbose);
      } else {
        log(`    ❌ Failed: ${result.error}`, options.verbose);
      }
    }

    // Sync vars
    for (const varName of varsForTarget) {
      log(`  Processing var: ${varName}`, options.verbose);

      // Get var value from environment variable
      const varValue = getVarValue(varName);
      log(`    Retrieved var value`, options.verbose);

      const result = syncVariable(varName, target.repository, varValue, options.dryRun);
      results.push(result);

      if (result.success) {
        log(`    ✅ Success`, options.verbose);
      } else {
        log(`    ❌ Failed: ${result.error}`, options.verbose);
      }
    }
  }

  // Calculate summary
  const successful = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  return {
    timestamp,
    total: results.length,
    successful,
    failed,
    details: results,
  };
}

/**
 * Generate sync status table for README
 */
function generateSyncStatusTable(result: SyncResult): string {
  const rows: string[] = [];
  const now = new Date().toISOString().replace("T", " ").substring(0, 19) + " UTC";

  // Group by secret
  const secretTargets = new Map<string, string[]>();
  for (const detail of result.details) {
    if (!secretTargets.has(detail.secret)) {
      secretTargets.set(detail.secret, []);
    }
    secretTargets.get(detail.secret)!.push(detail.target);
  }

  // Generate table rows
  for (const [secret, targets] of secretTargets) {
    for (const target of targets) {
      const detail = result.details.find(
        (d) => d.secret === secret && d.target === target
      );
      const type = detail?.type || "secret";
      const typeIcon = type === "secret" ? "🔒" : "📝";
      const status = detail?.success ? "✅ Synced" : `❌ ${detail?.error || "Failed"}`;
      rows.push(`| ${secret} | ${target} | ${typeIcon} ${type} | ${now} | ${status} |`);
    }
  }

  return `<!-- SYNC_STATUS_START -->
| Secret | Target Repo | Type | Last Sync | Status |
|--------|-------------|------|-----------|--------|
${rows.join("\n")}
<!-- SYNC_STATUS_END -->

_Last updated: ${now} via workflow_`;
}

/**
 * Update README with sync status
 */
function updateReadme(result: SyncResult): void {
  const readmePath = resolve("README.md");
  let readmeContent = "";

  try {
    readmeContent = readFileSync(readmePath, "utf-8");
  } catch {
    // README doesn't exist yet, create basic structure
    readmeContent = `# GitHub Secrets Sync

Automated GitHub secret synchronization tool.

## Sync Status

`;
  }

  const newStatusTable = generateSyncStatusTable(result);

  // Check if status section exists
  const startMarker = "<!-- SYNC_STATUS_START -->";
  const endMarker = "<!-- SYNC_STATUS_END -->";

  const startIndex = readmeContent.indexOf(startMarker);
  const endIndex = readmeContent.indexOf(endMarker);

  if (startIndex >= 0 && endIndex >= 0) {
    // Replace existing status
    const before = readmeContent.substring(0, startIndex);
    const after = readmeContent.substring(endIndex + endMarker.length);
    readmeContent = before + newStatusTable + after;
  } else {
    // Append new status section
    readmeContent = readmeContent.trimEnd() + "\n\n## Sync Status\n\n" + newStatusTable + "\n";
  }

  writeFileSync(readmePath, readmeContent, "utf-8");
  console.error(`Updated README.md with sync status`);
}

/**
 * Format and print result
 */
function printResult(result: SyncResult, dryRun: boolean): void {
  console.log(JSON.stringify(result, null, 2));

  if (dryRun) {
    console.error("\n⚠️ DRY RUN MODE - No changes were made");
  }
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
  try {
    const options = parseArgs();

    const result = await runSync(options);
    printResult(result, options.dryRun);

    // Update README unless dry run
    if (!options.dryRun && result.failed === 0) {
      updateReadme(result);
    }

    // Exit with error code if any syncs failed
    process.exit(result.failed > 0 ? 1 : 0);
  } catch (error) {
    console.error(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }));
    process.exit(1);
  }
}

main();
