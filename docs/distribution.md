# Team Distribution

This project can be shared as one MCP server with separate distribution entry
points for Codex and Claude Code.

## Build

Build before publishing or linking the MCP server:

```bash
cd /Users/liutaigang/workspace/ai_coding_governance/zhuiyi-jira-mcp
npm install
npm run build
```

Do not publish `.env` or real Jira cookies.

## Codex: Team Marketplace

Codex discovery uses a plugin plus a marketplace entry.

The plugin metadata lives in:

```text
.codex-plugin/plugin.json
.mcp.json
```

The team marketplace template lives in:

```text
distribution/codex/team-marketplace/.agents/plugins/marketplace.json
```

Recommended team layout:

```text
team-marketplace/
├── .agents/
│   └── plugins/
│       └── marketplace.json
└── plugins/
    └── zhuiyi-jira-mcp/
        ├── .codex-plugin/
        ├── .mcp.json
        ├── dist/
        ├── package.json
        └── README.md
```

Install the marketplace in Codex:

```bash
codex plugin marketplace add /absolute/path/to/team-marketplace
codex plugin add zhuiyi-jira-mcp@zhuiyi-team
```

Each user still needs to provide their own Jira credential. For local/project
use, add the credential to a project-level `.codex/config.toml`:

```toml
[mcp_servers.zhuiyi-jira.env]
JIRA_AUTH_TYPE = "cookie"
JIRA_COOKIE = "JSESSIONID=...; atlassian.xsrf.token=..."
JIRA_API_VERSION = "latest"
JIRA_ALLOWED_HOSTS = "jira.in.wezhuiyi.com"
JIRA_REQUIREMENT_FIELDS = "{\"acceptanceCriteria\":\"customfield_10042\",\"storyPoints\":\"customfield_10016\"}"
```

Restart Codex after changing plugin or MCP configuration.

## Claude Code: Project MCP Config

Claude Code can use the standard project-level `.mcp.json`.

Copy this template into a Claude Code project:

```text
distribution/claude-code/.mcp.json
```

Then edit:

- `args[0]` to the absolute `dist/index.js` path.
- `JIRA_COOKIE` to the user's current browser Jira cookie.

Equivalent CLI form:

```bash
claude mcp add zhuiyi-jira \
  --env JIRA_AUTH_TYPE=cookie \
  --env 'JIRA_COOKIE=JSESSIONID=...; atlassian.xsrf.token=...' \
  --env JIRA_API_VERSION=latest \
  --env JIRA_ALLOWED_HOSTS=jira.in.wezhuiyi.com \
  -- node /absolute/path/to/zhuiyi-jira-mcp/dist/index.js
```

Restart Claude Code after changing `.mcp.json`.

## 401 Checklist

If Jira returns HTTP 401:

1. Verify the same cookie with curl:

```bash
JIRA_AUTH_TYPE=cookie \
JIRA_COOKIE='JSESSIONID=...; atlassian.xsrf.token=...' \
JIRA_API_VERSION=latest \
JIRA_ALLOWED_HOSTS=jira.in.wezhuiyi.com \
npm run check:jira:curl -- "https://jira.in.wezhuiyi.com/browse/SEE-642"
```

2. If curl returns 401, the cookie is missing, malformed, expired, or not tied
   to a logged-in Jira session.
3. If curl returns 200 but Codex or Claude Code returns 401, the client config
   did not inject the expected environment variables or the client needs a
   restart.
