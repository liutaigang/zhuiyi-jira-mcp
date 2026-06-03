import { describe, expect, it, vi } from "vitest";
import { createToolHandlers, requirementInputSchema } from "../src/server.js";
import type { JiraConfig } from "../src/types.js";

const config: JiraConfig = {
  email: "bot@example.com",
  apiToken: "token",
  cookie: "",
  authType: "basic",
  apiVersion: "3",
  allowedHosts: ["example.atlassian.net"],
  requirementFields: {
    acceptanceCriteria: "customfield_10042"
  }
};

const raw = {
  id: "10001",
  key: "PROJ-123",
  fields: {
    summary: "Improve login",
    description: {
      type: "doc",
      content: [{ type: "paragraph", content: [{ type: "text", text: "Body" }] }]
    },
    customfield_10042: {
      type: "doc",
      content: [{ type: "paragraph", content: [{ type: "text", text: "AC" }] }]
    }
  }
};

describe("createToolHandlers", () => {
  it("does not apply generic URL format validation before Jira parsing", () => {
    expect(requirementInputSchema.url._def.checks).not.toContainEqual(
      expect.objectContaining({ kind: "url" })
    );
  });

  it("returns normalized requirement JSON as text content", async () => {
    const fetchIssue = vi.fn(async () => raw);
    const handlers = createToolHandlers(config, { fetchIssue });

    const result = await handlers.getRequirementByUrl({
      url: "https://example.atlassian.net/browse/PROJ-123",
      includeComments: false,
      includeAttachments: false
    });

    const text = result.content[0]?.type === "text" ? result.content[0].text : "";
    expect(JSON.parse(text).requirement).toEqual({
      title: "Improve login",
      description: "Body",
      acceptanceCriteria: "AC",
      storyPoints: null,
      customFields: {
        acceptanceCriteria: raw.fields.customfield_10042
      }
    });
    expect(fetchIssue).toHaveBeenCalledWith(
      {
        site: "example.atlassian.net",
        issueKey: "PROJ-123",
        originalUrl: "https://example.atlassian.net/browse/PROJ-123"
      },
      {
        includeComments: false,
        includeAttachments: false
      }
    );
  });

  it("returns raw issue JSON as text content", async () => {
    const handlers = createToolHandlers(config, {
      fetchIssue: vi.fn(async () => raw)
    });

    const result = await handlers.getRawIssueByUrl({
      url: "https://example.atlassian.net/browse/PROJ-123"
    });

    const text = result.content[0]?.type === "text" ? result.content[0].text : "";
    expect(JSON.parse(text)).toEqual(raw);
  });

  it("passes Jira Server/Data Center issue URLs through the MCP handler", async () => {
    const fetchIssue = vi.fn(async () => raw);
    const handlers = createToolHandlers(
      {
        ...config,
        email: "",
        apiToken: "",
        cookie: "JSESSIONID=session; atlassian.xsrf.token=token",
        authType: "cookie",
        apiVersion: "latest",
        allowedHosts: ["jira.in.wezhuiyi.com"]
      },
      { fetchIssue }
    );

    await handlers.getRequirementByUrl({
      url: "https://jira.in.wezhuiyi.com/browse/SEE-642"
    });

    expect(fetchIssue).toHaveBeenCalledWith(
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
  });
});
