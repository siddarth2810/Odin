import { describe, expect, test } from "bun:test"
import { padInlineCodeSpans, splitMarkdownSegments } from "../src/markdown.ts"
import { darkColors, lightColors, markdownSyntaxStyles } from "../src/themes.ts"

describe("markdown inline code", () => {
  test("pads single-backtick code spans for terminal background styling", () => {
    expect(padInlineCodeSpans("Run `odin` now")).toBe("Run ` odin ` now")
  })

  test("keeps escaped and unmatched backticks unchanged", () => {
    expect(padInlineCodeSpans("Literal \\`tick\\`")).toBe("Literal \\`tick\\`")
    expect(padInlineCodeSpans("Open `span")).toBe("Open `span")
  })

  test("pads inline code only in markdown segments", () => {
    const segments = splitMarkdownSegments(["Before `inline`", "```ts", "const value = `raw`", "```", "After `done`"].join("\n"))

    expect(segments).toEqual([
      { kind: "markdown", content: "Before ` inline `" },
      { kind: "code", language: "ts", body: "  │ const value = `raw`" },
      { kind: "markdown", content: "After ` done `" },
    ])
  })
})

describe("theme code colors", () => {
  test("uses hardcoded Rust-reference inline code colors", () => {
    expect(darkColors.markdownCode).toBe("#ffaf5f")
    expect(darkColors.markdownCodeBackground).toBe("#303030")
    expect(lightColors.markdownCode).toBe("#af0000")
    expect(lightColors.markdownCodeBackground).toBe("#e4e4e4")
  })

  test("exports stable cached markdown syntax styles per theme", () => {
    expect(markdownSyntaxStyles.dark).toBe(markdownSyntaxStyles.dark)
    expect(markdownSyntaxStyles.light).toBe(markdownSyntaxStyles.light)
  })
})
