function required(env, name) {
    const value = env[name]?.trim();
    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
}
function parseRequirementFields(value) {
    if (!value?.trim()) {
        return {};
    }
    try {
        const parsed = JSON.parse(value);
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
            throw new Error("not an object");
        }
        return Object.fromEntries(Object.entries(parsed).filter((entry) => typeof entry[1] === "string"));
    }
    catch {
        throw new Error("JIRA_REQUIREMENT_FIELDS must be valid JSON");
    }
}
function normalizeAllowedHost(value) {
    const trimmed = value.trim().toLowerCase();
    if (!trimmed) {
        return "";
    }
    try {
        return new URL(trimmed).hostname;
    }
    catch {
        return trimmed;
    }
}
function parseAuthType(env) {
    const authType = env.JIRA_AUTH_TYPE?.trim().toLowerCase() ||
        (env.JIRA_COOKIE?.trim() ? "cookie" : "basic");
    if (authType !== "basic" && authType !== "bearer" && authType !== "cookie") {
        throw new Error("JIRA_AUTH_TYPE must be basic, bearer, or cookie");
    }
    return authType;
}
export function loadConfig(env = process.env) {
    const authType = parseAuthType(env);
    const apiToken = authType === "cookie" ? env.JIRA_API_TOKEN?.trim() ?? "" : required(env, "JIRA_API_TOKEN");
    const cookie = authType === "cookie" ? required(env, "JIRA_COOKIE") : env.JIRA_COOKIE?.trim() ?? "";
    const email = authType === "basic" ? required(env, "JIRA_EMAIL") : env.JIRA_EMAIL?.trim() ?? "";
    const apiVersion = env.JIRA_API_VERSION?.trim() || (authType === "basic" ? "3" : "latest");
    const allowedHosts = required(env, "JIRA_ALLOWED_HOSTS")
        .split(",")
        .map(normalizeAllowedHost)
        .filter(Boolean);
    if (allowedHosts.length === 0) {
        throw new Error("JIRA_ALLOWED_HOSTS must include at least one host");
    }
    return {
        email,
        apiToken,
        cookie,
        authType,
        apiVersion,
        allowedHosts,
        requirementFields: parseRequirementFields(env.JIRA_REQUIREMENT_FIELDS)
    };
}
