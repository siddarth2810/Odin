import { describe, expect, test } from "bun:test"
import {
  padInlineCodeSpans,
  renderMarkdownBlocks,
  renderMarkdownDisplayBlocks,
  splitMarkdownSegments,
  visibleWidth,
} from "../src/markdown.ts"
import { darkColors, lightColors, markdownSyntaxStyles } from "../src/themes.ts"

function expectRenderedTableWidthsToMatch(rendered: string) {
  const tableBlocks: string[][] = []
  let currentBlock: string[] = []

  for (const line of rendered.split("\n")) {
    if (/^[┌├└│]/.test(line)) {
      currentBlock.push(line)
      continue
    }

    if (currentBlock.length > 0) {
      tableBlocks.push(currentBlock)
      currentBlock = []
    }
  }

  if (currentBlock.length > 0) tableBlocks.push(currentBlock)

  expect(tableBlocks.length).toBeGreaterThan(0)

  for (const lines of tableBlocks) {
    expect(lines.length).toBeGreaterThanOrEqual(4)

    const widths = lines.map(visibleWidth)
    const topWidth = widths[0]!
    const headerWidth = widths[1]!
    const dividerWidth = widths[2]!
    const bottomWidth = widths[widths.length - 1]!

    expect(topWidth).toBe(headerWidth)
    expect(headerWidth).toBe(dividerWidth)
    expect(dividerWidth).toBe(bottomWidth)

    for (const bodyWidth of widths.slice(3, -1)) {
      expect(bodyWidth).toBe(bottomWidth)
    }
  }
}

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
      { kind: "code", language: "ts", body: "const value = `raw`" },
      { kind: "markdown", content: "After ` done `" },
    ])
  })
})

describe("theme code colors", () => {
  test("uses hardcoded Rust-reference inline code colors", () => {
    expect(darkColors.markdownCode).toBe("#F3A8A8")
    expect(darkColors.markdownCodeBackground).toBe("#303030")
    expect(lightColors.markdownCode).toBe("#C9413A")
    expect(lightColors.markdownCodeBackground).toBe("#E8E8E6")
  })

  test("exports stable cached markdown syntax styles per theme", () => {
    expect(markdownSyntaxStyles.dark).toBe(markdownSyntaxStyles.dark)
    expect(markdownSyntaxStyles.light).toBe(markdownSyntaxStyles.light)
  })
})

describe("markdown block rendering", () => {
  test("keeps non-table markdown on the markdown rendering path", () => {
    const blocks = renderMarkdownDisplayBlocks(
      ["Current ` SequenceArray ` has one ptype.", "", "| Problem |", "| ------- |", "| [LRU Cache](https://leetcode.com/problems/lru-cache/) |"].join(
        "\n",
      ),
    )

    expect(blocks).toEqual([
      { kind: "markdown", content: "Current ` SequenceArray ` has one ptype.\n" },
      { kind: "text", content: ["┌───────────┐", "│ Problem   │", "├───────────┤", "│ LRU Cache │", "└───────────┘"].join("\n") },
    ])
  })

  test("renders H2 headings with an underline and spacing", () => {
    expect(renderMarkdownBlocks("## Weekly checkpoints\n\nNext", { width: 40 })).toBe(
      ["Weekly checkpoints", "━━━━━━━━━━━━━━━━━━", "", "Next"].join("\n"),
    )
  })

  test("renders H3 headings with a lighter prefix", () => {
    expect(renderMarkdownBlocks("### After Day 7\n\nDone", { width: 40 })).toBe(["▸ After Day 7", "", "Done"].join("\n"))
  })

  test("converts unordered bullets and aligns wrapped lines under the text", () => {
    expect(renderMarkdownBlocks("* First line wraps here and continues aligned", { width: 30 })).toBe(
      ["• First line wraps here and", "  continues aligned"].join("\n"),
    )
  })

  test("renders horizontal rules as unicode lines with spacing", () => {
    expect(renderMarkdownBlocks("Before\n\n---\n\nAfter", { width: 24 })).toBe(
      ["Before", "", "━━━━━━━━━━━━━━━━━━━━━━━━", "", "After"].join("\n"),
    )
  })

  test("renders GFM tables with box borders and right alignment", () => {
    const input = [
      "| Metric        | Target |",
      "| ------------- | -----: |",
      "| Core problems |     90 |",
      "| Mock days     |      4 |",
    ].join("\n")

    const rendered = renderMarkdownBlocks(input, { width: 50 })

    expect(rendered).toBe(
      [
        "┌───────────────┬────────┐",
        "│ Metric        │ Target │",
        "├───────────────┼────────┤",
        "│ Core problems │     90 │",
        "│ Mock days     │      4 │",
        "└───────────────┴────────┘",
      ].join("\n"),
    )

    expectRenderedTableWidthsToMatch(rendered)
  })

  test("renders Markdown links inside table cells as labels only", () => {
    const input = [
      "| Problem                                                       |",
      "| ------------------------------------------------------------- |",
      "| [Binary Search](https://leetcode.com/problems/binary-search/) |",
    ].join("\n")

    const rendered = renderMarkdownBlocks(input, { width: 64 })

    expect(rendered).toBe(
      [
        "┌───────────────┐",
        "│ Problem       │",
        "├───────────────┤",
        "│ Binary Search │",
        "└───────────────┘",
      ].join("\n"),
    )

    expectRenderedTableWidthsToMatch(rendered)
  })

  test("renders compact LeetCode tables without expanding link URLs", () => {
    const input = [
      "| Done | Problem                                                                     | Difficulty | Go focus                 |",
      "| ---- | --------------------------------------------------------------------------- | ---------- | ------------------------ |",
      "| [ ]  | [Linked List Cycle II](https://leetcode.com/problems/linked-list-cycle-ii/) | Medium     | Floyd cycle entry        |",
      "| [ ]  | [LRU Cache](https://leetcode.com/problems/lru-cache/)                       | Medium     | map + doubly linked list |",
    ].join("\n")

    const rendered = renderMarkdownBlocks(input, { width: 80 })

    expect(rendered).toBe(
      [
        "┌──────┬──────────────────────┬────────────┬──────────────────────────┐",
        "│ Done │ Problem              │ Difficulty │ Go focus                 │",
        "├──────┼──────────────────────┼────────────┼──────────────────────────┤",
        "│ [ ]  │ Linked List Cycle II │ Medium     │ Floyd cycle entry        │",
        "│ [ ]  │ LRU Cache            │ Medium     │ map + doubly linked list │",
        "└──────┴──────────────────────┴────────────┴──────────────────────────┘",
      ].join("\n"),
    )

    expectRenderedTableWidthsToMatch(rendered)
  })

  test("keeps every rendered table line at the same visible width", () => {
    const input = [
      "| Left | Center | Right |",
      "| ---- | :----: | ----: |",
      "| α    | mid    |    10 |",
      "| wide | text   |     2 |",
    ].join("\n")

    expectRenderedTableWidthsToMatch(renderMarkdownBlocks(input, { width: 40 }))
  })

  test("renders the combined weekly checkpoint sample", () => {
    const input = [
      "## Weekly checkpoints",
      "",
      "### After Day 7",
      "",
      "* You should be fluent in Go basics for maps, slices, recursion, stacks, and queues.",
      "* Redo any array/window/stack/tree problem that took more than 35 minutes.",
    ].join("\n")

    expect(renderMarkdownBlocks(input, { width: 100 })).toBe(
      [
        "Weekly checkpoints",
        "━━━━━━━━━━━━━━━━━━",
        "",
        "▸ After Day 7",
        "",
        "• You should be fluent in Go basics for maps, slices, recursion, stacks, and queues.",
        "• Redo any array/window/stack/tree problem that took more than 35 minutes.",
      ].join("\n"),
    )
  })
})
