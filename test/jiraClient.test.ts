import { describe, expect, it, vi } from "vitest";
import { createJiraApi, createJiraIssueApiUrl } from "../src/jiraClient.js";
import type { JiraConfig, ParsedJiraUrl } from "../src/types.js";

const config: JiraConfig = {
  email: "bot@example.com",
  apiToken: "token",
  cookie: "",
  authType: "basic",
  apiVersion: "3",
  allowedHosts: ["example.atlassian.net"],
  requirementFields: {
    acceptanceCriteria: "customfield_10042",
    storyPoints: "customfield_10016"
  }
};

const parsed: ParsedJiraUrl = {
  site: "example.atlassian.net",
  issueKey: "PROJ-123",
  originalUrl: "https://example.atlassian.net/browse/PROJ-123"
};

describe("createJiraApi", () => {
  it("fetches Jira issue details with fields, expand, and basic auth", async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      json: async () => ({ key: "PROJ-123" })
    })) as unknown as typeof fetch;
    const jiraApi = createJiraApi(config, fetchImpl);

    const result = await jiraApi.fetchIssue(parsed, {
      includeComments: true,
      includeAttachments: false
    });

    expect(result).toEqual({ key: "PROJ-123" });
    const [url, init] = vi.mocked(fetchImpl).mock.calls[0];
    const apiUrl = new URL(String(url));
    expect(apiUrl.origin).toBe("https://example.atlassian.net");
    expect(apiUrl.pathname).toBe("/rest/api/3/issue/PROJ-123");
    expect(apiUrl.searchParams.get("expand")).toBe("names,schema");
    expect(apiUrl.searchParams.get("fields")).toContain("summary");
    expect(apiUrl.searchParams.get("fields")).toContain("comment");
    expect(apiUrl.searchParams.get("fields")).not.toContain("attachment");
    expect(apiUrl.searchParams.get("fields")).toContain("customfield_10042");
    expect((init as RequestInit).headers).toEqual({
      Authorization: `Basic ${Buffer.from("bot@example.com:token").toString("base64")}`,
      Accept: "application/json"
    });
  });

  it("fetches Jira Data Center issue details with bearer auth and latest API", async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      json: async () => ({ key: "SEE-642" })
    })) as unknown as typeof fetch;
    const jiraApi = createJiraApi(
      {
        ...config,
        email: "",
        apiToken: "pat-token",
        authType: "bearer",
        apiVersion: "latest"
      },
      fetchImpl
    );

    await jiraApi.fetchIssue(
      {
        site: "jira.in.wezhuiyi.com",
        issueKey: "SEE-642",
        originalUrl: "https://jira.in.wezhuiyi.com/browse/SEE-642"
      },
      {
        includeComments: false,
        includeAttachments: false
      }
    );

    const [url, init] = vi.mocked(fetchImpl).mock.calls[0];
    const apiUrl = new URL(String(url));
    expect(apiUrl.pathname).toBe("/rest/api/latest/issue/SEE-642");
    expect((init as RequestInit).headers).toEqual({
      Authorization: "Bearer pat-token",
      Accept: "application/json"
    });
  });

  it("fetches Jira issue details with cookie auth", async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      json: async () => ({ key: "SEE-642" })
    })) as unknown as typeof fetch;
    const cookie = "JSESSIONID=session; atlassian.xsrf.token=token";
    const jiraApi = createJiraApi(
      {
        ...config,
        email: "",
        apiToken: "",
        cookie,
        authType: "cookie",
        apiVersion: "latest"
      },
      fetchImpl
    );

    await jiraApi.fetchIssue(
      {
        site: "jira.in.wezhuiyi.com",
        issueKey: "SEE-642",
        originalUrl: "https://jira.in.wezhuiyi.com/browse/SEE-642"
      },
      {
        includeComments: false,
        includeAttachments: false
      }
    );

    const [, init] = vi.mocked(fetchImpl).mock.calls[0];
    expect((init as RequestInit).headers).toEqual({
      Cookie: cookie,
      Accept: "application/json"
    });
  });

  it("builds the Jira Server/Data Center issue URL used by MCP tools", () => {
    const apiUrl = createJiraIssueApiUrl(
      {
        ...config,
        email: "",
        apiToken: "",
        cookie: "JSESSIONID=session; atlassian.xsrf.token=token",
        authType: "cookie",
        apiVersion: "latest",
        allowedHosts: ["jira.in.wezhuiyi.com"]
      },
      {
        site: "jira.in.wezhuiyi.com",
        issueKey: "SEE-642",
        originalUrl: "https://jira.in.wezhuiyi.com/browse/SEE-642"
      },
      {
        includeComments: true,
        includeAttachments: false
      }
    );

    expect(apiUrl.origin).toBe("https://jira.in.wezhuiyi.com");
    expect(apiUrl.pathname).toBe("/rest/api/latest/issue/SEE-642");
    expect(apiUrl.searchParams.get("expand")).toBe("names,schema");
    expect(apiUrl.searchParams.get("fields")).toContain("summary");
    expect(apiUrl.searchParams.get("fields")).toContain("description");
    expect(apiUrl.searchParams.get("fields")).toContain("comment");
    expect(apiUrl.searchParams.get("fields")).not.toContain("attachment");
  });

  it("includes attachment field only when requested", async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      json: async () => ({})
    })) as unknown as typeof fetch;
    const jiraApi = createJiraApi(config, fetchImpl);

    await jiraApi.fetchIssue(parsed, {
      includeComments: false,
      includeAttachments: true
    });

    const apiUrl = new URL(String(vi.mocked(fetchImpl).mock.calls[0][0]));
    expect(apiUrl.searchParams.get("fields")).not.toContain("comment");
    expect(apiUrl.searchParams.get("fields")).toContain("attachment");
  });

  it("throws Jira API response status and body for failed requests", async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: false,
      status: 404,
      text: async () => "Issue does not exist"
    })) as unknown as typeof fetch;
    const jiraApi = createJiraApi(config, fetchImpl);

    await expect(
      jiraApi.fetchIssue(parsed, {
        includeComments: true,
        includeAttachments: false
      })
    ).rejects.toThrow("Jira API error: 404 Issue does not exist");
  });
});
