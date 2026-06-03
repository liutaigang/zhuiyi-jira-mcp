import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { JiraApi, JiraConfig } from "./types.js";
export declare const jiraIssueUrlInputSchema: z.ZodString;
export declare const requirementInputSchema: {
    url: z.ZodString;
    includeComments: z.ZodDefault<z.ZodBoolean>;
    includeAttachments: z.ZodDefault<z.ZodBoolean>;
};
export declare const rawInputSchema: {
    url: z.ZodString;
};
type RequirementInput = {
    url: string;
    includeComments?: boolean;
    includeAttachments?: boolean;
};
type RawInput = {
    url: string;
};
export declare function createToolHandlers(config: JiraConfig, jiraApi: JiraApi): {
    getRequirementByUrl(input: RequirementInput): Promise<{
        content: {
            type: "text";
            text: string;
        }[];
    }>;
    getRawIssueByUrl(input: RawInput): Promise<{
        content: {
            type: "text";
            text: string;
        }[];
    }>;
};
export declare function createServer(config: JiraConfig): McpServer;
export {};
