import type { FetchIssueOptions, JiraApi, JiraConfig, ParsedJiraUrl } from "./types.js";
export declare function createJiraIssueApiUrl(config: JiraConfig, parsed: ParsedJiraUrl, options: FetchIssueOptions): URL;
export declare function createJiraApi(config: JiraConfig, fetchImpl?: typeof fetch): JiraApi;
