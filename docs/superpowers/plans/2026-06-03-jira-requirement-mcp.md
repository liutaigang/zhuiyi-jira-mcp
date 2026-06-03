# Zhuiyi Jira MCP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a greenfield TypeScript stdio MCP server that reads Jira Cloud issues by URL and returns structured requirement JSON.

**Architecture:** The server is split into focused modules for configuration, URL parsing, Jira API access, ADF conversion, normalization, and MCP tool registration. The implementation is read-only and validates Jira hosts before any network request.

**Tech Stack:** Node.js, TypeScript, `@modelcontextprotocol/sdk`, `zod`, `tsx`, `vitest`.

---

## File Structure

- `package.json`: npm scripts and dependencies.
- `tsconfig.json`: strict TypeScript configuration for Node ESM.
- `vitest.config.ts`: test configuration.
- `.gitignore`: ignore dependencies, build output, and env files.
- `.env.example`: documented Jira environment variables.
- `README.md`: install, run, and MCP client configuration notes.
- `src/types.ts`: shared types for config, parsed URLs, Jira raw data, and normalized output.
- `src/config.ts`: load and validate environment configuration.
- `src/jiraUrl.ts`: parse supported Jira issue URLs and enforce host allowlist.
- `src/adf.ts`: convert ADF nodes to Markdown-style text.
- `src/jiraClient.ts`: fetch Jira issues through REST API v3.
- `src/normalize.ts`: convert raw Jira issues into stable requirement JSON.
- `src/server.ts`: register MCP tools.
- `src/index.ts`: stdio entrypoint.
- `test/*.test.ts`: focused unit tests.

## Tasks

### Task 1: Project Scaffold

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vitest.config.ts`
- Create: `.gitignore`
- Create: `.env.example`
- Create: `README.md`

- [ ] Create npm package metadata with ESM, `dev`, `build`, `typecheck`, and `test` scripts.
- [ ] Add dependencies: `@modelcontextprotocol/sdk`, `zod`.
- [ ] Add dev dependencies: `typescript`, `tsx`, `vitest`, `@types/node`.
- [ ] Add strict TypeScript config for NodeNext module resolution.
- [ ] Add `.env.example` with Jira env vars.
- [ ] Add README with setup and stdio MCP configuration.

### Task 2: Core Types And Config

**Files:**
- Create: `src/types.ts`
- Create: `src/config.ts`
- Test: `test/config.test.ts`

- [ ] Write failing tests for valid env loading, missing required vars, invalid field JSON, and host splitting.
- [ ] Implement `loadConfig(env?: NodeJS.ProcessEnv): JiraConfig`.
- [ ] Verify tests pass.

### Task 3: Jira URL Parsing

**Files:**
- Create: `src/jiraUrl.ts`
- Test: `test/jiraUrl.test.ts`

- [ ] Write failing tests for `/browse/PROJ-123`, `/jira/software/c/projects/PROJ/issues/PROJ-123`, disallowed hosts, and unparseable URLs.
- [ ] Implement `parseJiraUrl(url, allowedHosts)`.
- [ ] Verify tests pass.

### Task 4: ADF Conversion

**Files:**
- Create: `src/adf.ts`
- Test: `test/adf.test.ts`

- [ ] Write failing tests for text, hard breaks, paragraphs, headings, bullet lists, ordered lists, and code blocks.
- [ ] Implement `adfToText(node: unknown): string`.
- [ ] Verify tests pass.

### Task 5: Normalization

**Files:**
- Create: `src/normalize.ts`
- Test: `test/normalize.test.ts`

- [ ] Write failing tests for core issue fields, acceptance criteria custom field, story points custom field, comment toggling, and attachment toggling.
- [ ] Implement `normalizeIssue(parsed, raw, options)`.
- [ ] Verify tests pass.

### Task 6: Jira Client

**Files:**
- Create: `src/jiraClient.ts`
- Test: `test/jiraClient.test.ts`

- [ ] Write failing tests using a mocked `fetch` for REST URL, fields query, `expand=names,schema`, Basic Auth, and API error handling.
- [ ] Implement `createJiraApi(config, fetchImpl?)`.
- [ ] Verify tests pass.

### Task 7: MCP Server And Entrypoint

**Files:**
- Create: `src/server.ts`
- Create: `src/index.ts`

- [ ] Implement `createServer(config)` with `jira_get_requirement_by_url` and `jira_get_issue_raw_by_url`.
- [ ] Wire `src/index.ts` to load config, create server, and connect `StdioServerTransport`.
- [ ] Run typecheck and full test suite.

### Task 8: Final Verification

**Files:**
- Modify as needed based on verification failures.

- [ ] Run `npm install`.
- [ ] Run `npm test`.
- [ ] Run `npm run typecheck`.
- [ ] Run `npm run build`.
- [ ] Report any commands that could not run because of sandbox or network restrictions.

## Self-Review

- Spec coverage: all MVP tools, configuration, URL parsing, Jira API fetching, ADF conversion, normalization, attachment metadata handling, read-only scope, and tests are covered.
- Placeholder scan: no `TBD`, `TODO`, or undefined future work remains.
- Type consistency: planned function names and file names are consistent across tasks.
