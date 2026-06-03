import { adfToText } from "./adf.js";
function record(value) {
    return value && typeof value === "object" && !Array.isArray(value)
        ? value
        : {};
}
function stringField(value) {
    return typeof value === "string" ? value : null;
}
function numberField(value) {
    return typeof value === "number" ? value : null;
}
function displayName(value) {
    return stringField(record(value).displayName);
}
function namedItems(value) {
    return Array.isArray(value)
        ? value
            .map((item) => stringField(record(item).name))
            .filter((name) => Boolean(name))
        : [];
}
function stringArray(value) {
    return Array.isArray(value)
        ? value.filter((item) => typeof item === "string")
        : [];
}
function fieldText(fields, fieldId) {
    return fieldId ? adfToText(fields[fieldId]).trim() : "";
}
export function normalizeIssue(parsed, raw, options) {
    const rawRecord = record(raw);
    const fields = record(rawRecord.fields);
    const summary = stringField(fields.summary) ?? "";
    const description = adfToText(fields.description).trim();
    const acceptanceCriteria = fieldText(fields, options.requirementFields.acceptanceCriteria);
    const customFields = Object.fromEntries(Object.entries(options.requirementFields).map(([name, fieldId]) => [
        name,
        fields[fieldId]
    ]));
    const comments = options.includeComments
        ? record(fields.comment).comments?.map((comment) => {
            const c = record(comment);
            return {
                author: displayName(c.author),
                body: adfToText(c.body).trim(),
                created: stringField(c.created),
                updated: stringField(c.updated)
            };
        }) ?? []
        : [];
    const attachments = options.includeAttachments
        ? (Array.isArray(fields.attachment) ? fields.attachment : []).map((attachment) => {
            const a = record(attachment);
            return {
                id: stringField(a.id),
                filename: stringField(a.filename),
                mimeType: stringField(a.mimeType),
                size: numberField(a.size),
                created: stringField(a.created)
            };
        })
        : [];
    return {
        source: {
            type: "jira",
            url: parsed.originalUrl,
            site: parsed.site,
            issueKey: parsed.issueKey
        },
        issue: {
            id: stringField(rawRecord.id),
            key: stringField(rawRecord.key) ?? parsed.issueKey,
            self: stringField(rawRecord.self),
            type: stringField(record(fields.issuetype).name),
            status: stringField(record(fields.status).name),
            priority: stringField(record(fields.priority).name),
            summary,
            description,
            assignee: displayName(fields.assignee),
            reporter: displayName(fields.reporter),
            labels: stringArray(fields.labels),
            components: namedItems(fields.components),
            fixVersions: namedItems(fields.fixVersions),
            created: stringField(fields.created),
            updated: stringField(fields.updated)
        },
        requirement: {
            title: summary,
            description,
            acceptanceCriteria,
            storyPoints: options.requirementFields.storyPoints
                ? fields[options.requirementFields.storyPoints]
                : null,
            customFields
        },
        comments,
        attachments
    };
}
