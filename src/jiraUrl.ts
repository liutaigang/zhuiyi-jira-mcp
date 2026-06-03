import type { ParsedJiraUrl } from "./types.js";

const ISSUE_KEY_PATTERN = "([A-Z][A-Z0-9]+-\\d+)";
const BROWSE_RE = new RegExp(`/browse/${ISSUE_KEY_PATTERN}`, "i");
const ISSUE_RE = new RegExp(`/issues/${ISSUE_KEY_PATTERN}`, "i");

function normalizeUrlInput(url: string): string {
  const trimmed = url.trim();
  const angleBracketMatch = trimmed.match(/^<(.+)>$/);

  return angleBracketMatch?.[1]?.trim() ?? trimmed;
}

export function parseJiraUrl(
  url: string,
  allowedHosts: string[],
): ParsedJiraUrl {
  const normalizedUrl = normalizeUrlInput(url);
  let parsed: URL;

  try {
    parsed = new URL(normalizedUrl);
  } catch {
    throw new Error(`Invalid Jira issue URL: ${JSON.stringify(url)}`);
  }

  const hostname = parsed.hostname.toLowerCase();

  if (!allowedHosts.map((host) => host.toLowerCase()).includes(hostname)) {
    throw new Error(`Jira host not allowed: ${hostname}`);
  }

  const match =
    parsed.pathname.match(BROWSE_RE) ?? parsed.pathname.match(ISSUE_RE);
  if (!match?.[1]) {
    throw new Error("Cannot parse Jira issue key from URL");
  }

  return {
    site: hostname,
    issueKey: match[1].toUpperCase(),
    originalUrl: normalizedUrl,
  };
}
