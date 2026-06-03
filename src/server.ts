import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { createJiraApi } from "./jiraClient.js";
import { parseJiraUrl } from "./jiraUrl.js";
import { normalizeIssue } from "./normalize.js";
import type { JiraApi, JiraConfig } from "./types.js";

export const jiraIssueUrlInputSchema = z.string().min(1).describe("Jira issue URL");

export const requirementInputSchema = {
  url: jiraIssueUrlInputSchema,
  includeComments: z.boolean().default(true),
  includeAttachments: z.boolean().default(false)
};

export const rawInputSchema = {
  url: jiraIssueUrlInputSchema
};

type RequirementInput = {
  url: string;
  includeComments?: boolean;
  includeAttachments?: boolean;
};

type RawInput = {
  url: string;
};

function textJson(value: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(value, null, 2)
      }
    ]
  };
}

export function createToolHandlers(config: JiraConfig, jiraApi: JiraApi) {
  return {
    async getRequirementByUrl(input: RequirementInput) {
      const options = {
        includeComments: input.includeComments ?? true,
        includeAttachments: input.includeAttachments ?? false
      };
      const parsed = parseJiraUrl(input.url, config.allowedHosts);
      const raw = await jiraApi.fetchIssue(parsed, options);
      const normalized = normalizeIssue(parsed, raw, {
        ...options,
        requirementFields: config.requirementFields
      });

      return textJson(normalized);
    },

    async getRawIssueByUrl(input: RawInput) {
      const parsed = parseJiraUrl(input.url, config.allowedHosts);
      const raw = await jiraApi.fetchIssue(parsed, {
        includeComments: true,
        includeAttachments: true
      });

      return textJson(raw);
    }
  };
}

export function createServer(config: JiraConfig): McpServer {
  const server = new McpServer({
    name: "zhuiyi-jira-mcp",
    version: "0.1.0"
  });
  const handlers = createToolHandlers(config, createJiraApi(config));

  server.registerTool(
    "jira_get_requirement_by_url",
    {
      title: "Get Jira Requirement By URL",
      description: "Fetch a Jira issue by URL and return structured requirement JSON.",
      inputSchema: requirementInputSchema,
      annotations: {
        readOnlyHint: true
      }
    },
    handlers.getRequirementByUrl
  );

  server.registerTool(
    "jira_get_issue_raw_by_url",
    {
      title: "Get Raw Jira Issue By URL",
      description: "Fetch a Jira issue by URL and return the raw Jira API response.",
      inputSchema: rawInputSchema,
      annotations: {
        readOnlyHint: true
      }
    },
    handlers.getRawIssueByUrl
  );

  return server;
}
