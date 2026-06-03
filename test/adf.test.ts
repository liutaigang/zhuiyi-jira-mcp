import { describe, expect, it } from "vitest";
import { adfToText } from "../src/adf.js";

describe("adfToText", () => {
  it("returns an empty string for empty values", () => {
    expect(adfToText(null)).toBe("");
    expect(adfToText(undefined)).toBe("");
  });

  it("converts paragraphs and hard breaks", () => {
    const doc = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            { type: "text", text: "Line one" },
            { type: "hardBreak" },
            { type: "text", text: "Line two" }
          ]
        }
      ]
    };

    expect(adfToText(doc)).toBe("Line one\nLine two\n\n");
  });

  it("converts headings", () => {
    expect(
      adfToText({
        type: "heading",
        attrs: { level: 2 },
        content: [{ type: "text", text: "Acceptance Criteria" }]
      })
    ).toBe("## Acceptance Criteria\n\n");
  });

  it("converts bullet lists", () => {
    const list = {
      type: "bulletList",
      content: [
        { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "A" }] }] },
        { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "B" }] }] }
      ]
    };

    expect(adfToText(list)).toBe("- A\n- B\n");
  });

  it("converts ordered lists", () => {
    const list = {
      type: "orderedList",
      content: [
        { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "A" }] }] },
        { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "B" }] }] }
      ]
    };

    expect(adfToText(list)).toBe("1. A\n2. B\n");
  });

  it("converts code blocks", () => {
    expect(
      adfToText({
        type: "codeBlock",
        content: [{ type: "text", text: "const x = 1;" }]
      })
    ).toBe("```\nconst x = 1;\n```\n\n");
  });
});
