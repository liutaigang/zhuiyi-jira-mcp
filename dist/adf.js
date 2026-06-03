function isNode(value) {
    return Boolean(value) && typeof value === "object";
}
function childrenToText(node) {
    return Array.isArray(node.content) ? node.content.map(adfToText).join("") : "";
}
function listToText(node, ordered) {
    if (!Array.isArray(node.content)) {
        return "";
    }
    return node.content
        .map((child, index) => {
        const body = childrenToText(child).trim();
        const marker = ordered ? `${index + 1}.` : "-";
        return body ? `${marker} ${body}\n` : "";
    })
        .join("");
}
export function adfToText(value) {
    if (!value) {
        return "";
    }
    if (typeof value === "string") {
        return value;
    }
    if (!isNode(value)) {
        return "";
    }
    switch (value.type) {
        case "text":
            return value.text ?? "";
        case "hardBreak":
            return "\n";
        case "paragraph": {
            const text = childrenToText(value).trimEnd();
            return text ? `${text}\n\n` : "";
        }
        case "heading": {
            const level = Math.min(Math.max(value.attrs?.level ?? 1, 1), 6);
            const text = childrenToText(value).trim();
            return text ? `${"#".repeat(level)} ${text}\n\n` : "";
        }
        case "bulletList":
            return listToText(value, false);
        case "orderedList":
            return listToText(value, true);
        case "codeBlock": {
            const text = childrenToText(value).trimEnd();
            return `\`\`\`\n${text}\n\`\`\`\n\n`;
        }
        default:
            return childrenToText(value);
    }
}
