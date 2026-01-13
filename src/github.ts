import { execFileSync } from "node:child_process";
import type { SecretSyncResult } from "./types.js";

/**
 * Execute gh CLI command safely using execFileSync
 */
function gh(args: string[], opts?: { silent?: boolean }): string {
  try {
    const output = execFileSync("gh", args, {
      encoding: "utf-8",
      stdio: opts?.silent ? "pipe" : "inherit",
    });
    return output.trim();
  } catch (error) {
    if (error instanceof Error && "stdout" in error) {
      const err = error as unknown as { stdout: string; stderr: string };
      throw new Error(err.stderr || err.stdout || error.message);
    }
    throw error;
  }
}

/**
 * Get secret value from environment variables
 * Note: GitHub API does not allow reading secret values (security feature)
 * Secrets must be available as environment variables
 */
export function getSecretValue(secretName: string): string {
  const envValue = process.env[secretName];
  if (envValue) {
    return envValue;
  }

  throw new Error(
    `Secret value not found for ${secretName}. ` +
      "Secrets must be available as environment variables. " +
      "In GitHub Actions, ensure secrets are passed as inputs or environment variables."
  );
}

/**
 * Get var value from environment variables
 * Vars are non-sensitive and can be plain text
 */
export function getVarValue(varName: string): string {
  const envValue = process.env[varName];
  if (envValue) {
    return envValue;
  }

  throw new Error(
    `Var value not found for ${varName}. ` +
      "Vars must be available as environment variables."
  );
}

/**
 * List secrets in a repository
 */
export function listSecrets(repo: string): string[] {
  const output = gh(["secret", "list", "-R", repo, "--json", "name"], {
    silent: true,
  });
  const secrets = JSON.parse(output) as Array<{ name: string }>;
  return secrets.map((s) => s.name);
}

/**
 * Set secret in target repository
 */
export function setSecret(
  repo: string,
  secretName: string,
  secretValue: string
): void {
  gh(["secret", "set", secretName, "-R", repo, "--body", secretValue], {
    silent: true,
  });
}

/**
 * Check if secret exists in repository
 */
export function secretExists(repo: string, secretName: string): boolean {
  try {
    const secrets = listSecrets(repo);
    return secrets.includes(secretName);
  } catch {
    return false;
  }
}

/**
 * Sync a single secret to a target repository
 */
export function syncSecret(
  secretName: string,
  targetRepo: string,
  secretValue: string,
  dryRun: boolean
): SecretSyncResult {
  const result: SecretSyncResult = {
    secret: secretName,
    target: targetRepo,
    success: false,
    type: "secret",
  };

  try {
    if (dryRun) {
      result.success = true;
      return result;
    }

    setSecret(targetRepo, secretName, secretValue);
    result.success = true;
  } catch (error) {
    result.error = error instanceof Error ? error.message : String(error);
    result.success = false;
  }

  return result;
}

/**
 * List variables in a repository
 */
export function listVars(repo: string): string[] {
  const output = gh(["variable", "list", "-R", repo, "--json", "name"], {
    silent: true,
  });
  const vars = JSON.parse(output) as Array<{ name: string }>;
  return vars.map((v) => v.name);
}

/**
 * Set variable in target repository
 */
export function setVariable(
  repo: string,
  varName: string,
  varValue: string
): void {
  gh(["variable", "set", varName, "-R", repo, "--body", varValue], {
    silent: true,
  });
}

/**
 * Check if variable exists in repository
 */
export function variableExists(repo: string, varName: string): boolean {
  try {
    const vars = listVars(repo);
    return vars.includes(varName);
  } catch {
    return false;
  }
}

/**
 * Sync a single variable to a target repository
 */
export function syncVariable(
  varName: string,
  targetRepo: string,
  varValue: string,
  dryRun: boolean
): SecretSyncResult {
  const result: SecretSyncResult = {
    secret: varName,
    target: targetRepo,
    success: false,
    type: "var",
  };

  try {
    if (dryRun) {
      result.success = true;
      return result;
    }

    setVariable(targetRepo, varName, varValue);
    result.success = true;
  } catch (error) {
    result.error = error instanceof Error ? error.message : String(error);
    result.success = false;
  }

  return result;
}

/**
 * Get authenticated user
 */
export function getAuthUser(): string {
  return gh(["api", "user", "--jq", ".login"], { silent: true });
}

/**
 * Configure gh CLI with token
 */
export function configureAuth(token: string): void {
  process.env.GH_TOKEN = token;
}
