export type MarkdownSegment =
  | {
      // Normal Markdown text that OpenTUI should still parse and color.
      kind: "markdown"
      content: string
    }
  | {
      // Body from a fenced code block, rendered by MdrCodeBlock in App.tsx.
      kind: "code"
      language: string
      body: string
    }

export type MarkdownDisplayBlock =
  | {
      // Markdown that should keep the active syntax theme.
      kind: "markdown"
      content: string
    }
  | {
      // Already-rendered terminal text, such as Unicode tables.
      kind: "text"
      content: string
    }

export const CODE_LINE_PREFIX = ""
export const CODE_HEADER_PREFIX = ""
export const CODE_FOOTER = ""

type Align = "left" | "center" | "right"

type MarkdownRenderOptions = {
  width: number
}

const BACKSLASH = "\\".charCodeAt(0)
const BACKTICK = "`".charCodeAt(0)

function visitContentLines(content: string, visit: (line: string) => void): void {
  let lineStart = 0

  while (lineStart <= content.length) {
    const newlineIndex = content.indexOf("\n", lineStart)
    const lineEnd = newlineIndex === -1 ? content.length : newlineIndex
    const normalizedEnd = lineEnd > lineStart && content.charCodeAt(lineEnd - 1) === 13 ? lineEnd - 1 : lineEnd

    visit(content.slice(lineStart, normalizedEnd))

    if (newlineIndex === -1) return
    lineStart = newlineIndex + 1
  }
}

export function padInlineCodeSpans(content: string): string {
  let chunks: string[] | undefined
  let copyFrom = 0
  let i = 0

  while (i < content.length) {
    const char = content.charCodeAt(i)

    if (char === BACKSLASH && i + 1 < content.length) {
      i += 2
      continue
    }

    if (char !== BACKTICK) {
      i += 1
      continue
    }

    let codeEnd = i + 1
    while (codeEnd < content.length && content.charCodeAt(codeEnd) !== BACKTICK) {
      codeEnd += 1
    }

    if (codeEnd >= content.length) {
      i += 1
      continue
    }

    chunks ??= []
    chunks.push(content.slice(copyFrom, i + 1), " ", content.slice(i + 1, codeEnd), " ")
    copyFrom = codeEnd
    i = codeEnd + 1
  }

  if (!chunks) return content

  chunks.push(content.slice(copyFrom))
  return chunks.join("")
}

export function splitMarkdownSegments(content: string): MarkdownSegment[] {
  const segments: MarkdownSegment[] = []
  const markdownLines: string[] = []
  let codeBodyLines: string[] = []
  let language = ""
  let inCode = false

  const flushMarkdown = () => {
    if (markdownLines.length === 0) return
    // Inline code stays on the Markdown path, but the padded spaces make the
    // terminal background style visible inside single-backtick spans.
    const markdown = padInlineCodeSpans(markdownLines.join("\n"))
    markdownLines.length = 0
    if (markdown.length > 0) {
      segments.push({ kind: "markdown", content: markdown })
    }
  }

  const flushCode = () => {
    segments.push({ kind: "code", language, body: codeBodyLines.join("\n") })
    codeBodyLines = []
    language = ""
  }

  visitContentLines(content, (line) => {
    if (line.startsWith("```")) {
      if (inCode) {
        flushCode()
        inCode = false
      } else {
        // End the current Markdown chunk before starting a fenced code block.
        flushMarkdown()
        language = line.slice(3).trim()
        codeBodyLines = []
        inCode = true
      }
      return
    }

    if (inCode) {
      codeBodyLines.push(`${CODE_LINE_PREFIX}${line}`)
    } else {
      markdownLines.push(line)
    }
  })

  if (inCode) {
    flushCode()
  } else {
    flushMarkdown()
  }

  return segments
}

export function renderMarkdownBlocks(content: string, options: MarkdownRenderOptions): string {
  // Pure text renderer used by tests and by table helpers. App.tsx does not send
  // this whole output back through Markdown because that would re-conceal text.
  const width = Math.max(20, Math.floor(options.width))
  const lines = splitContentLines(content)
  const out: string[] = []
  let previousBlock: "blank" | "paragraph" | "heading" | "list" | "rule" | "table" = "blank"
  let i = 0

  const separate = (blankLines = 1) => {
    if (blankLines === 0 || out.length === 0) return

    let trailingBlanks = 0
    for (let n = out.length - 1; n >= 0 && out[n] === ""; n -= 1) trailingBlanks += 1

    while (trailingBlanks > blankLines) {
      out.pop()
      trailingBlanks -= 1
    }

    while (trailingBlanks < blankLines) {
      out.push("")
      trailingBlanks += 1
    }
  }

  while (i < lines.length) {
    const line = lines[i] ?? ""

    if (line.trim().length === 0) {
      if (out.length > 0 && out[out.length - 1] !== "") out.push("")
      previousBlock = "blank"
      i += 1
      continue
    }

    if (isTableStart(lines, i)) {
      separate(previousBlock === "blank" ? 0 : 1)
      const parsed = parseMarkdownTable(lines, i)
      out.push(...renderTable(parsed.table))
      out.push("")
      previousBlock = "table"
      i = parsed.nextIndex
      continue
    }

    const heading = parseHeading(line)
    if (heading) {
      const rendered = renderHeading(heading.level, heading.text, width)
      separate(out.length === 0 ? 0 : 1)
      out.push(...rendered, "")
      previousBlock = "heading"
      i += 1
      continue
    }

    if (isHorizontalRule(line)) {
      separate(previousBlock === "blank" ? 0 : 1)
      out.push(renderHorizontalRule(width), "")
      previousBlock = "rule"
      i += 1
      continue
    }

    const listItem = parseUnorderedListItem(line)
    if (listItem) {
      if (previousBlock !== "list") separate(previousBlock === "blank" ? 0 : 1)
      out.push(...renderListItem(listItem, width))
      previousBlock = "list"
      i += 1
      continue
    }

    const paragraphLines = [line.trim()]
    i += 1
    while (i < lines.length && (lines[i] ?? "").trim().length > 0 && !startsBlock(lines, i)) {
      paragraphLines.push((lines[i] ?? "").trim())
      i += 1
    }
    if (previousBlock !== "blank") separate(1)
    out.push(paragraphLines.join(" "))
    previousBlock = "paragraph"
  }

  while (out.length > 0 && out[out.length - 1] === "") out.pop()
  return out.join("\n")
}

export function renderMarkdownDisplayBlocks(content: string): MarkdownDisplayBlock[] {
  // This is the UI-facing split. It preserves normal Markdown for colors, but
  // replaces each table source block with a pre-rendered plain-text table.
  const lines = splitContentLines(content)
  const blocks: MarkdownDisplayBlock[] = []
  const markdownLines: string[] = []
  let i = 0

  const flushMarkdown = () => {
    if (markdownLines.length === 0) return

    const markdown = markdownLines.join("\n")
    markdownLines.length = 0

    if (markdown.length > 0) {
      blocks.push({ kind: "markdown", content: markdown })
    }
  }

  while (i < lines.length) {
    if (isTableStart(lines, i)) {
      flushMarkdown()
      const parsed = parseMarkdownTable(lines, i)
      const table = renderTable(parsed.table).join("\n")
      if (table.length > 0) {
        blocks.push({ kind: "text", content: table })
      }
      i = parsed.nextIndex
      continue
    }

    markdownLines.push(lines[i] ?? "")
    i += 1
  }

  flushMarkdown()
  return blocks
}

function splitContentLines(content: string): string[] {
  const lines: string[] = []
  visitContentLines(content, (line) => lines.push(line))
  return lines
}

function startsBlock(lines: string[], index: number): boolean {
  const line = lines[index] ?? ""
  return Boolean(parseHeading(line) || isHorizontalRule(line) || parseUnorderedListItem(line) || isTableStart(lines, index))
}

function parseHeading(line: string): { level: number; text: string } | undefined {
  const match = /^(#{1,6})[ \t]+(.+?)[ \t#]*$/.exec(line)
  if (!match) return undefined
  return { level: match[1]!.length, text: match[2]!.trim() }
}

function renderHeading(level: number, text: string, width: number): string[] {
  if (level === 2) {
    const headingWidth = visibleWidth(stripMarkdownInline(text))
    const underlineWidth = Math.max(headingWidth, Math.min(width, Math.max(headingWidth, 18)))
    return [text, "━".repeat(underlineWidth)]
  }

  if (level === 3) {
    return [`▸ ${text}`]
  }

  return [text]
}

function isHorizontalRule(line: string): boolean {
  return /^[ \t]{0,3}([-*_])(?:[ \t]*\1){2,}[ \t]*$/.test(line)
}

function renderHorizontalRule(width: number): string {
  return "━".repeat(Math.max(12, width))
}

function parseUnorderedListItem(line: string): { indent: number; text: string } | undefined {
  const match = /^([ \t]*)([-*+])[ \t]+(.+)$/.exec(line)
  if (!match) return undefined
  return { indent: indentationLevel(match[1]!), text: match[3]!.trim() }
}

function indentationLevel(indent: string): number {
  let columns = 0
  for (const char of indent) columns += char === "\t" ? 4 : 1
  return Math.floor(columns / 2)
}

function renderListItem(item: { indent: number; text: string }, width: number): string[] {
  const base = "  ".repeat(item.indent)
  const firstPrefix = `${base}• `
  const continuationPrefix = " ".repeat(visibleWidth(firstPrefix))
  return wrapText(item.text, Math.max(8, width - visibleWidth(firstPrefix)), firstPrefix, continuationPrefix)
}

type MarkdownTable = {
  // Raw cell text from the Markdown source.
  header: string[]
  // Alignment parsed from the separator row: --- / ---: / :---:.
  aligns: Align[]
  rows: string[][]
}

type RenderedTable = {
  // Cell text after inline Markdown has been simplified for display.
  header: string[]
  aligns: Align[]
  rows: string[][]
}

function isTableStart(lines: string[], index: number): boolean {
  // GFM tables need a header row followed immediately by a separator row.
  return index + 1 < lines.length && isTableRow(lines[index] ?? "") && isTableSeparator(lines[index + 1] ?? "")
}

function parseMarkdownTable(lines: string[], startIndex: number): { table: MarkdownTable; nextIndex: number } {
  const header = splitTableRow(lines[startIndex] ?? "")
  const aligns = parseTableAlignments(lines[startIndex + 1] ?? "", header.length)
  const rows: string[][] = []
  let nextIndex = startIndex + 2

  while (nextIndex < lines.length && isTableRow(lines[nextIndex] ?? "")) {
    rows.push(normalizeTableRow(splitTableRow(lines[nextIndex] ?? ""), header.length))
    nextIndex += 1
  }

  return { table: { header, aligns, rows }, nextIndex }
}

function isTableRow(line: string): boolean {
  const trimmed = line.trim()
  return trimmed.startsWith("|") && trimmed.slice(1).includes("|")
}

function isTableSeparator(line: string): boolean {
  const trimmed = line.trim()
  if (!trimmed.startsWith("|")) return false
  const cells = splitTableRow(trimmed)
  return cells.length > 0 && cells.every((cell) => /^:?-{3,}:?$/.test(cell.trim()))
}

function splitTableRow(line: string): string[] {
  // Split on table pipes, but keep escaped pipes and pipes inside inline code
  // inside the current cell.
  const trimmed = line.trim()
  const cells: string[] = []
  let start = trimmed.startsWith("|") ? 1 : 0
  let inBackticks = false
  let i = start

  while (i < trimmed.length) {
    const char = trimmed[i]
    if (char === "`") {
      inBackticks = !inBackticks
    } else if (char === "\\" && i + 1 < trimmed.length) {
      i += 1
    } else if (char === "|" && !inBackticks) {
      cells.push(trimmed.slice(start, i).trim())
      start = i + 1
    }
    i += 1
  }

  if (start < trimmed.length) {
    cells.push(trimmed.slice(start).trim())
  }

  if (cells.length > 0 && cells[cells.length - 1] === "") cells.pop()
  return cells
}

function parseTableAlignments(line: string, count: number): Align[] {
  const aligns = splitTableRow(line).map((cell): Align => {
    const trimmed = cell.trim()
    const left = trimmed.startsWith(":")
    const right = trimmed.endsWith(":")
    if (left && right) return "center"
    if (right) return "right"
    return "left"
  })

  while (aligns.length < count) aligns.push("left")
  return aligns.slice(0, count)
}

function normalizeTableRow(row: string[], count: number): string[] {
  const normalized = row.slice(0, count)
  while (normalized.length < count) normalized.push("")
  return normalized
}

function renderTable(table: MarkdownTable): string[] {
  const renderedTable = renderTableInlineContent(table)
  const columnCount = renderedTable.header.length
  if (columnCount === 0) return []

  const widths = renderedTable.header.map((cell, column) => {
    // Borders align only when each column is sized by terminal-visible width,
    // not by source length or Markdown syntax length.
    let widest = visibleWidth(cell)
    for (const row of renderedTable.rows) {
      widest = Math.max(widest, visibleWidth(row[column] ?? ""))
    }
    return Math.max(1, widest)
  })

  const top = renderTableBorder("┌", "┬", "┐", widths)
  const divider = renderTableBorder("├", "┼", "┤", widths)
  const bottom = renderTableBorder("└", "┴", "┘", widths)
  const rows = [top, renderTableRow(renderedTable.header, widths, renderedTable.aligns), divider]

  for (const row of renderedTable.rows) {
    rows.push(renderTableRow(normalizeTableRow(row, columnCount), widths, renderedTable.aligns))
  }

  rows.push(bottom)
  return rows
}

function renderTableInlineContent(table: MarkdownTable): RenderedTable {
  // Tables are plain terminal text, so table cells need their inline Markdown
  // reduced before widths are measured.
  return {
    header: table.header.map(renderTableCellInline),
    aligns: table.aligns,
    rows: table.rows.map((row) => row.map(renderTableCellInline)),
  }
}

function renderTableBorder(left: string, middle: string, right: string, widths: number[]): string {
  return `${left}${widths.map((width) => "─".repeat(width + 2)).join(middle)}${right}`
}

function renderTableRow(cells: string[], widths: number[], aligns: Align[]): string {
  return `│${cells
    .map((cell, columnIndex) => {
      const width = widths[columnIndex] ?? 1
      return ` ${alignCell(cell, width, aligns[columnIndex] ?? "left")} `
    })
    .join("│")}│`
}

function alignCell(text: string, width: number, align: Align): string {
  // Alignment works by putting the missing spaces on the correct side of the
  // already-rendered cell text.
  const padding = Math.max(0, width - visibleWidth(text))
  if (align === "right") return `${" ".repeat(padding)}${text}`
  if (align === "center") {
    const left = Math.floor(padding / 2)
    return `${" ".repeat(left)}${text}${" ".repeat(padding - left)}`
  }
  return `${text}${" ".repeat(padding)}`
}

function wrapText(text: string, width: number, firstPrefix: string, continuationPrefix: string): string[] {
  const words = text.split(/(\s+)/).filter((word) => word.length > 0)
  const lines: string[] = []
  let current = firstPrefix
  let currentWidth = 0

  for (const word of words) {
    const isSpace = /^\s+$/.test(word)
    const normalized = isSpace ? " " : word
    const wordWidth = visibleWidth(normalized)
    if (isSpace && currentWidth === 0) continue

    if (currentWidth + wordWidth > width && currentWidth > 0) {
      lines.push(current.trimEnd())
      current = continuationPrefix
      currentWidth = 0
      if (isSpace) continue
    }

    if (!isSpace && wordWidth > width && currentWidth === 0) {
      const chunks = breakLongWord(normalized, width)
      for (const chunk of chunks.slice(0, -1)) {
        lines.push(`${current}${chunk}`.trimEnd())
        current = continuationPrefix
      }
      const lastChunk = chunks[chunks.length - 1] ?? ""
      current += lastChunk
      currentWidth = visibleWidth(lastChunk)
      continue
    }

    current += normalized
    currentWidth += wordWidth
  }

  lines.push(current.trimEnd())
  return lines
}

function breakLongWord(word: string, width: number): string[] {
  const chunks: string[] = []
  let chunk = ""
  let chunkWidth = 0

  for (const char of word) {
    const charWidth = visibleWidth(char)
    if (chunkWidth > 0 && chunkWidth + charWidth > width) {
      chunks.push(chunk)
      chunk = ""
      chunkWidth = 0
    }
    chunk += char
    chunkWidth += charWidth
  }

  if (chunk.length > 0) chunks.push(chunk)
  return chunks
}

function stripMarkdownInline(text: string): string {
  return text
    .replace(/`([^`]*)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[*_~]/g, "")
}

function renderTableCellInline(text: string): string {
  // Links become labels only so URLs do not make table columns huge. Checkbox
  // text is intentionally left as raw "[ ]" / "[x]" content.
  return stripMarkdownInline(text).replace(/\\([\\|`*_{}\[\]()#+\-.!])/g, "$1")
}

export function visibleWidth(text: string): number {
  // Terminal layout cares about display cells. Most characters are width 1, but
  // many CJK/full-width code points occupy two columns.
  let width = 0
  for (const char of text) {
    const codePoint = char.codePointAt(0) ?? 0
    width += isWideCodePoint(codePoint) ? 2 : 1
  }
  return width
}

function isWideCodePoint(codePoint: number): boolean {
  return (
    (codePoint >= 0x1100 && codePoint <= 0x115f) ||
    codePoint === 0x2329 ||
    codePoint === 0x232a ||
    (codePoint >= 0x2e80 && codePoint <= 0xa4cf) ||
    (codePoint >= 0xac00 && codePoint <= 0xd7a3) ||
    (codePoint >= 0xf900 && codePoint <= 0xfaff) ||
    (codePoint >= 0xfe10 && codePoint <= 0xfe19) ||
    (codePoint >= 0xfe30 && codePoint <= 0xfe6f) ||
    (codePoint >= 0xff00 && codePoint <= 0xff60) ||
    (codePoint >= 0xffe0 && codePoint <= 0xffe6)
  )
}
