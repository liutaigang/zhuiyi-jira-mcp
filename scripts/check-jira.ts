import { loadConfig } from "../src/config.js";
import { loadDotEnv } from "../src/env.js";
import { parseJiraUrl } from "../src/jiraUrl.js";
import type { JiraConfig } from "../src/types.js";

type JsonRecord = Record<string, unknown>;

function authHeaders(config: JiraConfig): Record<string, string> {
  if (config.authType === "cookie") {
    return {
      Cookie: config.cookie,
    };
  }

  if (config.authType === "bearer") {
    return {
      Authorization: `Bearer ${config.apiToken}`,
    };
  }

  return {
    Authorization: `Basic ${Buffer.from(
      `${config.email}:${config.apiToken}`,
    ).toString("base64")}`,
  };
}

async function requestJson(url: URL, config: JiraConfig): Promise<unknown> {
  const response = await fetch(url, {
    method: "GET",
    headers: {
      ...authHeaders(config),
      Accept: "application/json",
    },
  });
  const text = await response.text();

  console.log(`${response.status} ${response.statusText} ${url.pathname}`);

  if (!response.ok) {
    console.log(text.slice(0, 1000));
    throw new Error(`Request failed: ${response.status} ${response.statusText}`);
  }

  return text ? JSON.parse(text) : null;
}

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonRecord)
    : {};
}

function printServerInfo(value: unknown): void {
  const data = asRecord(value);
  console.log("serverInfo:", {
    baseUrl: data.baseUrl,
    version: data.version,
    deploymentType: data.deploymentType,
    serverTitle: data.serverTitle,
  });
}

function printIssue(value: unknown): void {
  const data = asRecord(value);
  const fields = asRecord(data.fields);
  const status = asRecord(fields.status);
  const issueType = asRecord(fields.issuetype);

  console.log("issue:", {
    key: data.key,
    summary: fields.summary,
    status: status.name,
    issueType: issueType.name,
  });
}

loadDotEnv();

const config = loadConfig();
const issueUrl = process.argv[2] ?? process.env.JIRA_TEST_URL;
const host = issueUrl
  ? parseJiraUrl(issueUrl, config.allowedHosts).site
  : config.allowedHosts[0];

if (!host) {
  throw new Error("No Jira host configured");
}

console.log("config:", {
  authType: config.authType,
  apiVersion: config.apiVersion,
  host,
  hasEmail: Boolean(config.email),
  hasApiToken: Boolean(config.apiToken),
  hasCookie: Boolean(config.cookie),
});

const serverInfoUrl = new URL(
  `https://${host}/rest/api/${config.apiVersion}/serverInfo`,
);
printServerInfo(await requestJson(serverInfoUrl, config));

if (issueUrl) {
  const parsed = parseJiraUrl(issueUrl, config.allowedHosts);
  const issueApiUrl = new URL(
    `https://${parsed.site}/rest/api/${config.apiVersion}/issue/${parsed.issueKey}`,
  );
  issueApiUrl.searchParams.set("fields", "summary,status,issuetype");

  printIssue(await requestJson(issueApiUrl, config));
}
