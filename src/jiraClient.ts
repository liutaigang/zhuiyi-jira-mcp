import type { FetchIssueOptions, JiraApi, JiraConfig, ParsedJiraUrl } from "./types.js";

const BASE_FIELDS = [
  "summary",
  "description",
  "issuetype",
  "status",
  "priority",
  "assignee",
  "reporter",
  "labels",
  "components",
  "fixVersions",
  "updated",
  "created",
  "parent",
  "subtasks",
  "issuelinks"
];

function authHeader(config: JiraConfig): string {
  if (config.authType === "bearer") {
    return `Bearer ${config.apiToken}`;
  }

  const token = Buffer.from(`${config.email}:${config.apiToken}`).toString(
    "base64"
  );
  return `Basic ${token}`;
}

function authHeaders(config: JiraConfig): Record<string, string> {
  if (config.authType === "cookie") {
    return {
      Cookie: config.cookie
    };
  }

  return {
    Authorization: authHeader(config)
  };
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function issueFields(config: JiraConfig, options: FetchIssueOptions): string[] {
  return unique([
    ...BASE_FIELDS,
    ...(options.includeComments ? ["comment"] : []),
    ...(options.includeAttachments ? ["attachment"] : []),
    ...Object.values(config.requirementFields)
  ]);
}

export function createJiraIssueApiUrl(
  config: JiraConfig,
  parsed: ParsedJiraUrl,
  options: FetchIssueOptions
): URL {
  const apiUrl = new URL(
    `https://${parsed.site}/rest/api/${config.apiVersion}/issue/${parsed.issueKey}`
  );

  apiUrl.searchParams.set("fields", issueFields(config, options).join(","));
  apiUrl.searchParams.set("expand", "names,schema");

  return apiUrl;
}

export function createJiraApi(
  config: JiraConfig,
  fetchImpl: typeof fetch = fetch
): JiraApi {
  return {
    async fetchIssue(parsed: ParsedJiraUrl, options: FetchIssueOptions) {
      const apiUrl = createJiraIssueApiUrl(config, parsed, options);

      const response = await fetchImpl(apiUrl.toString(), {
        method: "GET",
        headers: {
          ...authHeaders(config),
          Accept: "application/json"
        }
      });

      if (!response.ok) {
        throw new Error(
          `Jira API error: ${response.status} ${await response.text()}`
        );
      }

      return response.json();
    }
  };
}
