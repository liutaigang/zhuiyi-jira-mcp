import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { createJiraApi } from "./jiraClient.js";
import { parseJiraUrl } from "./jiraUrl.js";
import { normalizeIssue } from "./normalize.js";
export const jiraIssueUrlInputSchema = z.string().min(1).describe("Jira issue URL");
export const requirementInputSchema = {
    url: jiraIssueUrlInputSchema,
    includeComments: z.boolean().default(true),
    includeAttachments: z.boolean().default(false)
};
export const rawInputSchema = {
    url: jiraIssueUrlInputSchema
};
function textJson(value) {
    return {
        content: [
            {
                type: "text",
                text: JSON.stringify(value, null, 2)
            }
        ]
    };
}
export function createToolHandlers(config, jiraApi) {
    return {
        async getRequirementByUrl(input) {
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
        async getRawIssueByUrl(input) {
            const parsed = parseJiraUrl(input.url, config.allowedHosts);
            const raw = await jiraApi.fetchIssue(parsed, {
                includeComments: true,
                includeAttachments: true
            });
            return textJson(raw);
        }
    };
}
export function createServer(config) {
    const server = new McpServer({
        name: "zhuiyi-jira-mcp",
        version: "0.1.0"
    });
    const handlers = createToolHandlers(config, createJiraApi(config));
    server.registerTool("jira_get_requirement_by_url", {
        title: "Get Jira Requirement By URL",
        description: "Fetch a Jira issue by URL and return structured requirement JSON.",
        inputSchema: requirementInputSchema,
        annotations: {
            readOnlyHint: true
        }
    }, handlers.getRequirementByUrl);
    server.registerTool("jira_get_issue_raw_by_url", {
        title: "Get Raw Jira Issue By URL",
        description: "Fetch a Jira issue by URL and return the raw Jira API response.",
        inputSchema: rawInputSchema,
        annotations: {
            readOnlyHint: true
        }
    }, handlers.getRawIssueByUrl);
    return server;
}
