export type RequirementFieldMap = Record<string, string>;
export type JiraConfig = {
    email: string;
    apiToken: string;
    cookie: string;
    authType: "basic" | "bearer" | "cookie";
    apiVersion: string;
    allowedHosts: string[];
    requirementFields: RequirementFieldMap;
};
export type ParsedJiraUrl = {
    site: string;
    issueKey: string;
    originalUrl: string;
};
export type NormalizeOptions = {
    includeComments: boolean;
    includeAttachments: boolean;
    requirementFields: RequirementFieldMap;
};
export type NormalizedRequirement = {
    source: {
        type: "jira";
        url: string;
        site: string;
        issueKey: string;
    };
    issue: {
        id: string | null;
        key: string;
        self: string | null;
        type: string | null;
        status: string | null;
        priority: string | null;
        summary: string;
        description: string;
        assignee: string | null;
        reporter: string | null;
        labels: string[];
        components: string[];
        fixVersions: string[];
        created: string | null;
        updated: string | null;
    };
    requirement: {
        title: string;
        description: string;
        acceptanceCriteria: string;
        storyPoints: unknown;
        customFields: Record<string, unknown>;
    };
    comments: Array<{
        author: string | null;
        body: string;
        created: string | null;
        updated: string | null;
    }>;
    attachments: Array<{
        id: string | null;
        filename: string | null;
        mimeType: string | null;
        size: number | null;
        created: string | null;
    }>;
};
export type FetchIssueOptions = {
    includeComments: boolean;
    includeAttachments: boolean;
};
export type JiraApi = {
    fetchIssue(parsed: ParsedJiraUrl, options: FetchIssueOptions): Promise<unknown>;
};
