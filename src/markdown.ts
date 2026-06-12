export type MarkdownSegment =
  | {
      kind: "markdown"
      content: string
    }
  | {
      kind: "code"
      language: string
      body: string
    }

export const CODE_LINE_PREFIX = ""
export const CODE_HEADER_PREFIX = ""
export const CODE_FOOTER = ""

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
