import { describe, expect, it } from "vitest";
import { normalizeIssue } from "../src/normalize.js";
import type { ParsedJiraUrl } from "../src/types.js";

const parsed: ParsedJiraUrl = {
  site: "example.atlassian.net",
  issueKey: "PROJ-123",
  originalUrl: "https://example.atlassian.net/browse/PROJ-123"
};

const rawIssue = {
  id: "10001",
  key: "PROJ-123",
  self: "https://example.atlassian.net/rest/api/3/issue/10001",
  fields: {
    summary: "Improve login",
    description: {
      type: "doc",
      content: [{ type: "paragraph", content: [{ type: "text", text: "Login body" }] }]
    },
    issuetype: { name: "Story" },
    status: { name: "In Progress" },
    priority: { name: "High" },
    assignee: { displayName: "Zhang San" },
    reporter: { displayName: "Li Si" },
    labels: ["frontend"],
    components: [{ name: "web" }],
    fixVersions: [{ name: "1.0" }],
    created: "2026-06-01T10:00:00.000+0800",
    updated: "2026-06-03T10:00:00.000+0800",
    customfield_10042: {
      type: "doc",
      content: [{ type: "paragraph", content: [{ type: "text", text: "Can login" }] }]
    },
    customfield_10016: 5,
    comment: {
      comments: [
        {
          author: { displayName: "Reviewer" },
          body: {
            type: "doc",
            content: [{ type: "paragraph", content: [{ type: "text", text: "Looks good" }] }]
          },
          created: "2026-06-02T10:00:00.000+0800",
          updated: "2026-06-02T11:00:00.000+0800"
        }
      ]
    },
    attachment: [
      {
        id: "att-1",
        filename: "prd.pdf",
        mimeType: "application/pdf",
        size: 123,
        created: "2026-06-01T11:00:00.000+0800"
      }
    ]
  }
};

describe("normalizeIssue", () => {
  it("normalizes core issue and requirement fields", () => {
    const normalized = normalizeIssue(parsed, rawIssue, {
      includeComments: true,
      includeAttachments: true,
      requirementFields: {
        acceptanceCriteria: "customfield_10042",
        storyPoints: "customfield_10016"
      }
    });

    expect(normalized.issue.summary).toBe("Improve login");
    expect(normalized.issue.description).toBe("Login body");
    expect(normalized.issue.assignee).toBe("Zhang San");
    expect(normalized.issue.components).toEqual(["web"]);
    expect(normalized.requirement.acceptanceCriteria).toBe("Can login");
    expect(normalized.requirement.storyPoints).toBe(5);
    expect(normalized.comments).toHaveLength(1);
    expect(normalized.attachments).toHaveLength(1);
  });

  it("omits comments and attachments when disabled", () => {
    const normalized = normalizeIssue(parsed, rawIssue, {
      includeComments: false,
      includeAttachments: false,
      requirementFields: {}
    });

    expect(normalized.comments).toEqual([]);
    expect(normalized.attachments).toEqual([]);
  });
});
