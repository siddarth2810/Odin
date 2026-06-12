/** @jsxImportSource @opentui/solid */
import path from "node:path"
import type { ScrollBoxRenderable } from "@opentui/core"
import { useKeyboard, useTerminalDimensions } from "@opentui/solid"
import { createMemo, createSignal } from "solid-js"
import { defaultThemeName, markdownSyntax, themes, type Colors, type ThemeName } from "./themes.js"

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
      lines: string[]
    }

function splitMarkdownSegments(content: string): MarkdownSegment[] {
  const segments: MarkdownSegment[] = []
  const markdownLines: string[] = []
  let codeLines: string[] = []
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

  for (const rawLine of content.split("\n")) {
    const line = rawLine.endsWith("\r") ? rawLine.slice(0, -1) : rawLine
    const trimmedEnd = line.trimEnd()

    if (trimmedEnd.startsWith("```")) {
      if (inCode) {
        segments.push({ kind: "code", language, lines: codeLines })
        codeLines = []
        language = ""
        inCode = false
      } else {
        flushMarkdown()
        language = trimmedEnd.slice(3).trim()
        codeLines = []
        inCode = true
      }
      continue
    }

    if (inCode) {
      codeLines.push(line)
    } else {
      markdownLines.push(line)
    }
  }

  if (inCode) {
    segments.push({ kind: "code", language, lines: codeLines })
  } else {
    flushMarkdown()
  }

  return segments
}

function MdrCodeBlock(props: { colors: Colors; language: string; lines: string[] }) {
  const header = props.language.length > 0 ? `  ╭── ${props.language} ` : "  ╭──"

  return (
    <box width="100%" flexDirection="column" flexShrink={0} marginTop={1} marginBottom={1}>
      <text width="100%" fg={props.colors.markdownCodeBorder} wrapMode="none" truncate={true}>
        {header}
      </text>
      {props.lines.map((line) => (
        <text width="100%" fg={props.colors.markdownCodeBlock} wrapMode="none" truncate={true}>
          {"  │ "}
          {line}
        </text>
      ))}
      <text width="100%" fg={props.colors.markdownCodeBorder} wrapMode="none" truncate={true}>
        {"  ╰──"}
      </text>
    </box>
  )
}

export function App(props: AppProps) {
  const dimensions = useTerminalDimensions()
  const [themeName, setThemeName] = createSignal<ThemeName>(defaultThemeName)
  const activeColors = createMemo(() => themes[themeName()])
  const syntaxStyle = createMemo(() => markdownSyntax(activeColors()))
  const segments = splitMarkdownSegments(props.content)
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
      <box height={1} paddingLeft={1} paddingRight={1} backgroundColor={activeColors().backgroundPanel}>
        <text width="100%" fg={activeColors().text} wrapMode="none" truncate={true} onMouseUp={() => toggleTheme()}>
          odin  {path.basename(props.file)}
        </text>
      </box>
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
              <MdrCodeBlock colors={activeColors()} language={segment.language} lines={segment.lines} />
            ),
          )}
        </box>
      </scrollbox>
      <box height={1} paddingLeft={1} paddingRight={1} backgroundColor={activeColors().backgroundPanel}>
        <text width="100%" fg={activeColors().textMuted} wrapMode="none" truncate={true}>
           q/esc exit · t theme · j/k ↑↓ scroll · pageup/pagedown jump
        </text>
      </box>
    </box>
  )
}
