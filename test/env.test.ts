import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { loadDotEnv } from "../src/env.js";

const trackedKeys = [
  "JIRA_EMAIL",
  "JIRA_API_TOKEN",
  "JIRA_ALLOWED_HOSTS",
  "JIRA_REQUIREMENT_FIELDS"
];

const originalValues = new Map<string, string | undefined>();
for (const key of trackedKeys) {
  originalValues.set(key, process.env[key]);
}

afterEach(() => {
  for (const key of trackedKeys) {
    const value = originalValues.get(key);
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
});

describe("loadDotEnv", () => {
  it("loads missing Jira environment variables from a .env file", () => {
    const dir = mkdtempSync(join(tmpdir(), "jira-env-"));
    const envPath = join(dir, ".env");
    writeFileSync(
      envPath,
      [
        "JIRA_EMAIL=bot@example.com",
        "JIRA_API_TOKEN=token-from-env-file",
        "JIRA_ALLOWED_HOSTS=example.atlassian.net"
      ].join("\n")
    );

    try {
      for (const key of trackedKeys) {
        delete process.env[key];
      }

      loadDotEnv(envPath);

      expect(process.env.JIRA_EMAIL).toBe("bot@example.com");
      expect(process.env.JIRA_API_TOKEN).toBe("token-from-env-file");
      expect(process.env.JIRA_ALLOWED_HOSTS).toBe("example.atlassian.net");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("does not overwrite variables already set by the parent process", () => {
    const dir = mkdtempSync(join(tmpdir(), "jira-env-"));
    const envPath = join(dir, ".env");
    writeFileSync(envPath, "JIRA_EMAIL=from-file@example.com");

    try {
      process.env.JIRA_EMAIL = "from-parent@example.com";

      loadDotEnv(envPath);

      expect(process.env.JIRA_EMAIL).toBe("from-parent@example.com");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("ignores a missing .env file", () => {
    expect(() => loadDotEnv(join(tmpdir(), "missing-jira-env"))).not.toThrow();
  });
});
