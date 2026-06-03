#!/usr/bin/env bash
set -euo pipefail

load_dotenv() {
  local path="${1:-.env}"
  [[ -f "$path" ]] || return 0

  local line key value
  while IFS= read -r line || [[ -n "$line" ]]; do
    line="${line%$'\r'}"
    [[ -n "$line" ]] || continue
    [[ "$line" =~ ^[[:space:]]*# ]] && continue
    [[ "$line" == *=* ]] || continue

    key="${line%%=*}"
    value="${line#*=}"
    key="$(printf '%s' "$key" | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//')"
    [[ "$key" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]] || continue
    [[ -z "${!key:-}" ]] || continue

    if [[ "$value" == \"*\" && "$value" == *\" ]]; then
      value="${value#\"}"
      value="${value%\"}"
    elif [[ "$value" == \'*\' && "$value" == *\' ]]; then
      value="${value#\'}"
      value="${value%\'}"
    fi

    export "$key=$value"
  done < "$path"
}

load_dotenv ".env"

fail() {
  printf 'ERROR: %s\n' "$*" >&2
  exit 1
}

fail_if_placeholder() {
  local name="$1"
  local value="$2"

  case "$value" in
    your-email@example.com|your-api-token|your-personal-access-token|your-company.atlassian.net|jira.example.com)
      fail "$name still has a placeholder value; update .env or export a real value"
      ;;
  esac
}

lower() {
  printf '%s' "$1" | tr '[:upper:]' '[:lower:]'
}

upper() {
  printf '%s' "$1" | tr '[:lower:]' '[:upper:]'
}

trim() {
  printf '%s' "$1" | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//'
}

trim_host() {
  local value="${1:-}"
  value="$(trim "$value")"
  value="${value#<}"
  value="${value%>}"
  value="${value%%,*}"
  value="${value#http://}"
  value="${value#https://}"
  value="${value%%/*}"
  lower "$(trim "$value")"
}

parse_issue_key() {
  local url="${1:-}"
  url="$(trim "$url")"
  url="${url#<}"
  url="${url%>}"

  if [[ "$url" =~ /[Bb][Rr][Oo][Ww][Ss][Ee]/([A-Za-z][A-Za-z0-9]*-[0-9]+) ]]; then
    upper "${BASH_REMATCH[1]}"
    return 0
  fi

  if [[ "$url" =~ /[Ii][Ss][Ss][Uu][Ee][Ss]/([A-Za-z][A-Za-z0-9]*-[0-9]+) ]]; then
    upper "${BASH_REMATCH[1]}"
  fi
}

requirement_field_ids() {
  [[ -n "${JIRA_REQUIREMENT_FIELDS:-}" ]] || return 0

  node -e '
const raw = process.env.JIRA_REQUIREMENT_FIELDS;
try {
  const parsed = JSON.parse(raw);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    process.exit(2);
  }
  process.stdout.write(
    Object.values(parsed)
      .filter((value) => typeof value === "string" && value.trim())
      .join(",")
  );
} catch {
  process.exit(2);
}
'
}

request_json() {
  local label="$1"
  local url="$2"
  shift 2

  local body_file
  body_file="$(mktemp)"

  local status
  status="$(
    curl -sS -L \
      -o "$body_file" \
      -w '%{http_code}' \
      "${auth_args[@]}" \
      -H 'Accept: application/json' \
      "$@" \
      "$url"
  )"

  printf '\n[%s] HTTP %s %s\n' "$label" "$status" "$url"
  head -c 1200 "$body_file"
  printf '\n'
  rm -f "$body_file"

  [[ "$status" =~ ^2 ]] || fail "$label failed with HTTP $status"
}

issue_url="${1:-${JIRA_TEST_URL:-}}"
auth_type="$(lower "${JIRA_AUTH_TYPE:-basic}")"
api_version="${JIRA_API_VERSION:-3}"
host="$(trim_host "${issue_url:-${JIRA_ALLOWED_HOSTS:-}}")"

[[ -n "$host" ]] || fail "Set JIRA_ALLOWED_HOSTS or pass a Jira issue URL"
fail_if_placeholder "JIRA_ALLOWED_HOSTS" "$host"

auth_args=()
case "$auth_type" in
  basic)
    [[ -n "${JIRA_EMAIL:-}" ]] || fail "JIRA_EMAIL is required for basic auth"
    [[ -n "${JIRA_API_TOKEN:-}" ]] || fail "JIRA_API_TOKEN is required for basic auth"
    fail_if_placeholder "JIRA_EMAIL" "$JIRA_EMAIL"
    fail_if_placeholder "JIRA_API_TOKEN" "$JIRA_API_TOKEN"
    auth_args=(-u "${JIRA_EMAIL}:${JIRA_API_TOKEN}")
    ;;
  bearer)
    [[ -n "${JIRA_API_TOKEN:-}" ]] || fail "JIRA_API_TOKEN is required for bearer auth"
    fail_if_placeholder "JIRA_API_TOKEN" "$JIRA_API_TOKEN"
    auth_args=(-H "Authorization: Bearer ${JIRA_API_TOKEN}")
    ;;
  cookie)
    [[ -n "${JIRA_COOKIE:-}" ]] || fail "JIRA_COOKIE is required for cookie auth"
    auth_args=(-H "Cookie: ${JIRA_COOKIE}")
    ;;
  *)
    fail "JIRA_AUTH_TYPE must be basic, bearer, or cookie"
    ;;
esac

printf 'Jira curl check\n'
printf '  host: %s\n' "$host"
printf '  auth: %s\n' "$auth_type"
printf '  api:  /rest/api/%s\n' "$api_version"

request_json "serverInfo" "https://${host}/rest/api/${api_version}/serverInfo"
request_json "myself" "https://${host}/rest/api/${api_version}/myself"

if [[ -n "$issue_url" ]]; then
  issue_key="$(parse_issue_key "$issue_url")"
  [[ -n "$issue_key" ]] || fail "Cannot parse issue key from URL: $issue_url"

  fields="summary,status,issuetype,priority,assignee,reporter,labels,components,fixVersions,updated,created,parent,subtasks,issuelinks"
  custom_fields="$(requirement_field_ids)" || fail "JIRA_REQUIREMENT_FIELDS must be valid JSON object with string field IDs"
  [[ -n "$custom_fields" ]] && fields="${fields},${custom_fields}"

  request_json \
    "issue ${issue_key}" \
    "https://${host}/rest/api/${api_version}/issue/${issue_key}" \
    --get \
    --data-urlencode "fields=${fields}" \
    --data-urlencode "expand=names,schema"
else
  printf '\nNo issue URL provided. Pass one as argv[1] or set JIRA_TEST_URL to test issue read permission.\n'
fi
