/** @jsxImportSource @opentui/solid */
import path from "node:path"
import { SyntaxStyle, type ScrollBoxRenderable } from "@opentui/core"
import { useKeyboard, useTerminalDimensions } from "@opentui/solid"
import { createMemo, createSignal } from "solid-js"
import { CODE_FOOTER, CODE_HEADER_PREFIX, renderMarkdownDisplayBlocks, splitMarkdownSegments } from "./markdown.js"
import { defaultThemeName, markdownSyntaxStyles, themes, type Colors, type ThemeName } from "./themes.js"

export type OdinInput = {
  file: string
  content: string
}

type AppProps = OdinInput & {
  onExit: () => void
}

// Pretty tables are already terminal text, so they use an empty syntax style.
// Normal Markdown still uses markdownSyntaxStyles below, which keeps inline code,
// links, headings, and theme colors working.
const plainTextSyntaxStyle = SyntaxStyle.create()

// Fenced code blocks are rendered outside the Markdown renderer so their body
// can keep code-block colors without being mixed into surrounding prose.
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
  // First split the file into Markdown chunks and fenced-code chunks. Tables
  // inside Markdown chunks are split later, because only tables need plain text.
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

    if (key.name === "g") {
      key.preventDefault()
      if (key.shift) {
        scroller.scrollTo(scroller.scrollHeight)
      } else {
        scroller.scrollTo(0)
      }
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
              // Second split: normal Markdown keeps syntax highlighting and
              // conceal, while rendered Unicode tables bypass Markdown parsing.
              renderMarkdownDisplayBlocks(segment.content).map((block) =>
                block.kind === "markdown" ? (
                  <code
                    width="100%"
                    flexShrink={0}
                    filetype="markdown"
                    drawUnstyledText={false}
                    content={block.content}
                    syntaxStyle={syntaxStyle()}
                    streaming={false}
                    conceal={true}
                    fg={activeColors().markdownText}
                  />
                ) : (
                  <code
                    width="100%"
                    flexShrink={0}
                    filetype="text"
                    drawUnstyledText={true}
                    content={block.content}
                    syntaxStyle={plainTextSyntaxStyle}
                    wrapMode="none"
                    streaming={false}
                    conceal={false}
                    fg={activeColors().markdownText}
                  />
                ),
              )
            ) : (
              <MdrCodeBlock colors={activeColors()} language={segment.language} body={segment.body} />
            ),
          )}
        </box>
      </scrollbox>
      <box height={1} paddingLeft={1} paddingRight={1} backgroundColor={activeColors().backgroundPanel}>
        <text width="100%" fg={activeColors().textMuted} wrapMode="none" truncate={true}>
         {fileName} · q/esc · j/k ↑↓ · g/G · t
        </text>
      </box>
    </box>
  )
}
