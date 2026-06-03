# Zhuiyi Jira MCP

Read-only TypeScript stdio MCP server for fetching structured requirement context from Jira issue URLs.

## Setup

```bash
npm install
npm run build
```

## Local Jira Configuration

For Zhuiyi Jira Server/Data Center, use cookie auth and REST API `latest`.
These values can be exported in a shell or placed in a local `.env` file for
development scripts:

```bash
export JIRA_AUTH_TYPE="cookie"
export JIRA_COOKIE="JSESSIONID=...; atlassian.xsrf.token=..."
export JIRA_API_VERSION="latest"
export JIRA_ALLOWED_HOSTS="jira.in.wezhuiyi.com"
export JIRA_REQUIREMENT_FIELDS='{"acceptanceCriteria":"customfield_10042","storyPoints":"customfield_10016"}'
```

For Jira Server/Data Center with a personal access token, use bearer auth and the
Data Center REST API version:

```bash
export JIRA_API_TOKEN="your-personal-access-token"
export JIRA_AUTH_TYPE="bearer"
export JIRA_API_VERSION="latest"
export JIRA_ALLOWED_HOSTS="jira.example.com"
```

For Jira Cloud, use basic auth:

```bash
export JIRA_EMAIL="your-email@example.com"
export JIRA_API_TOKEN="your-api-token"
export JIRA_AUTH_TYPE="basic"
export JIRA_API_VERSION="3"
export JIRA_ALLOWED_HOSTS="your-company.atlassian.net"
```

When `JIRA_AUTH_TYPE` is omitted and `JIRA_COOKIE` is set, the server infers
cookie auth and defaults `JIRA_API_VERSION` to `latest`. Bearer auth also
defaults to `latest`; basic auth defaults to Jira Cloud REST API `3`.

## Run

```bash
npm run dev
```

Use `npm run dev` only from a terminal for local development. Do not use
`npm run dev` or any `npm run ...` command as an MCP stdio server command,
because npm prints script banners to stdout and corrupts the MCP JSON stream.

## Tools

- `jira_get_requirement_by_url`: fetches a Jira issue by URL and returns structured requirement JSON.
- `jira_get_issue_raw_by_url`: fetches a Jira issue by URL and returns the raw Jira API response.

## Example MCP Client Configuration

In actual MCP usage, put the Jira configuration in `.mcp.json` under `env`.
Do not rely on `.env`, because the MCP client may start the server from a
different working directory.

```json
{
  "mcpServers": {
    "zhuiyi-jira": {
      "command": "node",
      "args": [
        "/Users/liutaigang/workspace/ai_coding_governance/zhuiyi-jira-mcp/dist/index.js"
      ],
      "env": {
        "JIRA_AUTH_TYPE": "cookie",
        "JIRA_COOKIE": "JSESSIONID=...; atlassian.xsrf.token=...",
        "JIRA_API_VERSION": "latest",
        "JIRA_ALLOWED_HOSTS": "jira.in.wezhuiyi.com",
        "JIRA_REQUIREMENT_FIELDS": "{\"acceptanceCriteria\":\"customfield_10042\",\"storyPoints\":\"customfield_10016\"}"
      }
    }
  }
}
```

Important cookie notes:

- Do not wrap the cookie value in extra shell quotes inside JSON.
- Restart the MCP client after changing `.mcp.json`.
- If Jira returns HTTP 401, copy a fresh cookie from an active browser session.

## Verification

```bash
npm run check:jira:curl -- "https://jira.in.wezhuiyi.com/browse/SEE-642"
npm run check:jira -- "https://jira.in.wezhuiyi.com/browse/SEE-642"
npm test
npm run typecheck
npm run build
```

`check:jira:curl` loads `.env` when present and uses the same Jira environment
variables as the MCP server. It verifies `serverInfo`, authenticated `myself`,
and, when an issue URL is supplied, issue read permission.

To verify the exact cookie value from `.mcp.json`, run:

```bash
JIRA_AUTH_TYPE=cookie \
JIRA_COOKIE='JSESSIONID=...; atlassian.xsrf.token=...' \
JIRA_API_VERSION=latest \
JIRA_ALLOWED_HOSTS=jira.in.wezhuiyi.com \
npm run check:jira:curl -- "https://jira.in.wezhuiyi.com/browse/SEE-642"
```

If this command returns HTTP 401, the cookie is missing, malformed, expired, or
does not belong to a logged-in Jira session. If this command returns HTTP 200
but the MCP server returns HTTP 401, the `.mcp.json` `env` did not take effect
or the MCP client needs to be restarted.

## Team Distribution

For team discovery and installation:

- Codex: use `.codex-plugin/plugin.json` plus the team marketplace template in `distribution/codex/team-marketplace/`.
- Claude Code: use the project `.mcp.json` template in `distribution/claude-code/` or the documented `claude mcp add` command.

See [docs/distribution.md](docs/distribution.md) for the full workflow.
