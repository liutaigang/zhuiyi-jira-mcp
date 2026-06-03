import { describe, expect, it } from "vitest";
import { parseJiraUrl } from "../src/jiraUrl.js";

const allowedHosts = ["example.atlassian.net"];

describe("parseJiraUrl", () => {
  it("parses browse issue URLs", () => {
    expect(
      parseJiraUrl("https://example.atlassian.net/browse/proj-123", allowedHosts)
    ).toEqual({
      site: "example.atlassian.net",
      issueKey: "PROJ-123",
      originalUrl: "https://example.atlassian.net/browse/proj-123"
    });
  });

  it("parses URLs surrounded by whitespace and angle brackets", () => {
    expect(
      parseJiraUrl(" <https://example.atlassian.net/browse/PROJ-123> ", allowedHosts)
    ).toEqual({
      site: "example.atlassian.net",
      issueKey: "PROJ-123",
      originalUrl: "https://example.atlassian.net/browse/PROJ-123"
    });
  });

  it("reports invalid Jira URL inputs with context", () => {
    expect(() => parseJiraUrl("SEE-123", allowedHosts)).toThrow(
      'Invalid Jira issue URL: "SEE-123"'
    );
  });

  it("parses Jira software issue URLs", () => {
    expect(
      parseJiraUrl(
        "https://example.atlassian.net/jira/software/c/projects/PROJ/issues/PROJ-456",
        allowedHosts
      ).issueKey
    ).toBe("PROJ-456");
  });

  it("rejects hosts that are not allowlisted", () => {
    expect(() =>
      parseJiraUrl("https://evil.example/browse/PROJ-123", allowedHosts)
    ).toThrow("Jira host not allowed: evil.example");
  });

  it("rejects URLs without an issue key", () => {
    expect(() =>
      parseJiraUrl("https://example.atlassian.net/projects/PROJ", allowedHosts)
    ).toThrow("Cannot parse Jira issue key from URL");
  });
});
