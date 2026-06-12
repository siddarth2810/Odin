/** @jsxImportSource @opentui/solid */
import path from "node:path"
import type { ScrollBoxRenderable } from "@opentui/core"
import { useKeyboard, useTerminalDimensions } from "@opentui/solid"
import { createMemo, createSignal } from "solid-js"
import { defaultThemeName, markdownSyntaxStyles, themes, type Colors, type ThemeName } from "./themes.js"

export type OdinInput = {
  file: string
  content: string
}

type AppProps = OdinInput & {
  onExit: () => void
}

type MarkdownSegment =
  | {
      kind: "markdown"
      content: string
    }
  | {
      kind: "code"
      language: string
      body: string
    }

const CODE_LINE_PREFIX = "  │ "
const CODE_HEADER_PREFIX = "  ╭──"
const CODE_FOOTER = "  ╰──"

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

function splitMarkdownSegments(content: string): MarkdownSegment[] {
  const segments: MarkdownSegment[] = []
  const markdownLines: string[] = []
  let codeBodyLines: string[] = []
  let language = ""
  let inCode = false

  const flushMarkdown = () => {
    if (markdownLines.length === 0) return
    const markdown = markdownLines.join("\n")
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

function MdrCodeBlock(props: { colors: Colors; language: string; body: string }) {
  const header = props.language.length > 0 ? `${CODE_HEADER_PREFIX} ${props.language} ` : CODE_HEADER_PREFIX

  return (
    <box
      width="100%"
      flexDirection="column"
      flexShrink={0}
      marginTop={1}
      marginBottom={1}
      backgroundColor={props.colors.markdownCodeBlockBackground}
    >
      <text width="100%" fg={props.colors.markdownCodeBorder} wrapMode="none" truncate={true}>
        {header}
      </text>
      {props.body.length > 0 ? (
        <text width="100%" fg={props.colors.markdownCodeBlock} wrapMode="none" truncate={true}>
          {props.body}
        </text>
      ) : null}
      <text width="100%" fg={props.colors.markdownCodeBorder} wrapMode="none" truncate={true}>
        {CODE_FOOTER}
      </text>
    </box>
  )
}

export function App(props: AppProps) {
  const dimensions = useTerminalDimensions()
  const [themeName, setThemeName] = createSignal<ThemeName>(defaultThemeName)
  const activeColors = createMemo(() => themes[themeName()])
  const syntaxStyle = createMemo(() => markdownSyntaxStyles[themeName()])
  const segments = splitMarkdownSegments(props.content)
  const fileName = path.basename(props.file)
  let scroller: ScrollBoxRenderable | undefined
  const toggleTheme = () => {
    setThemeName((current) => (current === "dark" ? "light" : "dark"))
  }

  useKeyboard((key) => {
    if (key.ctrl && key.name === "c") {
      key.preventDefault()
      props.onExit()
      return
    }

    if (key.name === "q" || key.name === "escape") {
      key.preventDefault()
      props.onExit()
      return
    }

    if (key.name === "t") {
      key.preventDefault()
      toggleTheme()
      return
    }

    if (!scroller) return

    if (key.name === "down" || key.name === "j") {
      key.preventDefault()
      scroller.scrollBy(1, "step")
    }

    if (key.name === "up" || key.name === "k") {
      key.preventDefault()
      scroller.scrollBy(-1, "step")
    }

    if (key.name === "pagedown" || (key.ctrl && key.name === "f")) {
      key.preventDefault()
      scroller.scrollBy(1, "viewport")
    }

    if (key.name === "pageup" || (key.ctrl && key.name === "b")) {
      key.preventDefault()
      scroller.scrollBy(-1, "viewport")
    }
  })

  return (
    <box width={dimensions().width} height={dimensions().height} flexDirection="column" backgroundColor={activeColors().background}>
      <scrollbox
        ref={(renderable) => {
          scroller = renderable
        }}
        focused={true}
        flexGrow={1}
        scrollY={true}
        scrollX={false}
        viewportOptions={{ paddingRight: 1 }}
        verticalScrollbarOptions={{ visible: true }}
      >
        <box
          width="100%"
          flexDirection="column"
          paddingTop={1}
          paddingLeft={2}
          paddingRight={2}
          backgroundColor={activeColors().backgroundElement}
        >
          {segments.map((segment) =>
            segment.kind === "markdown" ? (
              <code
                width="100%"
                flexShrink={0}
                filetype="markdown"
                drawUnstyledText={false}
                content={segment.content}
                syntaxStyle={syntaxStyle()}
                streaming={false}
                conceal={true}
                fg={activeColors().markdownText}
              />
            ) : (
              <MdrCodeBlock colors={activeColors()} language={segment.language} body={segment.body} />
            ),
          )}
        </box>
      </scrollbox>
      <box height={1} paddingLeft={1} paddingRight={1} backgroundColor={activeColors().backgroundPanel}>
        <text width="100%" fg={activeColors().textMuted} wrapMode="none" truncate={true}>
         {fileName} · q/esc · j/k ↑↓ · t
        </text>
      </box>
    </box>
  )
}
