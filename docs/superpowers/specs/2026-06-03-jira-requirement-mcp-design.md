# Zhuiyi Jira MCP Server Design

## Scope

Build a greenfield TypeScript stdio MCP server that reads Jira Cloud issues from approved Jira hosts and returns AI-friendly structured requirement JSON.

The MVP is read-only. It does not update Jira, transition issues, add comments, create issues, download attachments, or perform requirement interpretation.

## Tools

### jira_get_requirement_by_url

Input:

- `url`: Jira issue URL.
- `includeComments`: boolean, defaults to `true`.
- `includeAttachments`: boolean, defaults to `false`.

Behavior:

1. Parse the Jira URL and extract hostname and issue key.
2. Reject hosts not listed in `JIRA_ALLOWED_HOSTS`.
3. Fetch the Jira issue through Jira Cloud REST API v3.
4. Convert Atlassian Document Format fields into readable text.
5. Return stable structured JSON with source, issue, requirement, comments, and attachment metadata.

### jira_get_issue_raw_by_url

Input:

- `url`: Jira issue URL.

Behavior:

1. Parse and validate the Jira URL.
2. Fetch the Jira issue through Jira Cloud REST API v3.
3. Return the raw Jira API response as formatted JSON.

This tool exists to inspect custom fields such as acceptance criteria, story points, PRD links, and design links.

## Configuration

Environment variables:

- `JIRA_EMAIL`: Jira Cloud account email.
- `JIRA_API_TOKEN`: Jira Cloud API token.
- `JIRA_ALLOWED_HOSTS`: comma-separated hostname allowlist.
- `JIRA_REQUIREMENT_FIELDS`: JSON object mapping logical requirement fields to Jira field ids.

Example:

```json
{
  "acceptanceCriteria": "customfield_10042",
  "storyPoints": "customfield_10016",
  "prdLink": "customfield_10101",
  "designLink": "customfield_10102"
}
```

## Architecture

- `src/index.ts`: stdio entrypoint.
- `src/server.ts`: MCP server creation and tool registration.
- `src/config.ts`: environment loading and validation.
- `src/jiraUrl.ts`: Jira URL parsing and host allowlist enforcement.
- `src/jiraClient.ts`: Jira REST API v3 read-only client.
- `src/adf.ts`: Atlassian Document Format to text conversion.
- `src/normalize.ts`: raw Jira issue to structured requirement JSON.
- `src/types.ts`: shared TypeScript types.

## Data Handling

Descriptions, comments, and configured custom fields may be ADF documents. The server converts them into readable Markdown-style plain text.

Attachments are not downloaded. The normalized output only includes metadata such as id, filename, MIME type, size, and creation timestamp.

Comments are included only when `includeComments` is true. Attachments are included only when `includeAttachments` is true.

## Error Handling

- Invalid URLs return a clear parse error.
- Disallowed hosts return a clear allowlist error.
- Missing required environment variables fail server startup.
- Invalid `JIRA_REQUIREMENT_FIELDS` JSON fails server startup.
- Jira API failures include HTTP status and response text.

## Testing

Tests cover:

- Jira URL parsing for `/browse/PROJ-123`.
- Jira URL parsing for `/jira/software/c/projects/PROJ/issues/PROJ-123`.
- Host allowlist rejection.
- ADF paragraph, heading, list, hard break, and code block conversion.
- Normalization of core issue fields.
- Custom field mapping for acceptance criteria and story points.
- Comment and attachment inclusion toggles.

## Non-Goals

- Requirement completeness checks.
- AI-generated user stories or acceptance criteria.
- OpenSpec generation.
- Jira write operations.
- Attachment downloading or parsing.
- Streamable HTTP transport.
