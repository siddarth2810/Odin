#!/usr/bin/env bun
/** @jsxImportSource @opentui/solid */
import { access, readFile } from "node:fs/promises"
import path from "node:path"
import { createCliRenderer, SyntaxStyle, type CliRenderer, type ScrollBoxRenderable } from "@opentui/core"
import { render, useKeyboard, useTerminalDimensions } from "@opentui/solid"

type CliInput = {
  file: string
  content: string
}

const colors = {
  background: "#0a0a0a",
  backgroundPanel: "#141414",
  backgroundElement: "#1e1e1e",
  borderSubtle: "#3c3c3c",
  border: "#484848",
  borderActive: "#606060",
  primary: "#fab283",
  secondary: "#5c9cf5",
  accent: "#9d7cd8",
  error: "#e06c75",
  warning: "#f5a742",
  success: "#7fd88f",
  info: "#56b6c2",
  text: "#eeeeee",
  textMuted: "#808080",
  markdownText: "#eeeeee",
  markdownHeading: "#eeeeee",
  markdownLink: "#fab283",
  markdownLinkText: "#56b6c2",
  markdownCode: "#7fd88f",
  markdownBlockQuote: "#e5c07b",
  markdownEmph: "#e5c07b",
  markdownStrong: "#f5a742",
  markdownHorizontalRule: "#808080",
  markdownListItem: "#fab283",
  markdownListEnumeration: "#56b6c2",
  markdownImage: "#fab283",
  markdownImageText: "#56b6c2",
  markdownCodeBlock: "#eeeeee",
  syntaxComment: "#808080",
  syntaxKeyword: "#9d7cd8",
  syntaxFunction: "#fab283",
  syntaxVariable: "#eeeeee",
  syntaxString: "#7fd88f",
  syntaxNumber: "#e5c07b",
  syntaxType: "#56b6c2",
  syntaxOperator: "#56b6c2",
  syntaxPunctuation: "#eeeeee",
}

function usage(): never {
  console.error("Usage: bun run src/index.tsx <file.md>")
  process.exit(1)
}

async function readMarkdownFile(rawFile: string): Promise<CliInput> {
  const file = path.resolve(rawFile)
  await access(file)
  return {
    file,
    content: await readFile(file, "utf8"),
  }
}

function markdownSyntax() {
  return SyntaxStyle.fromTheme([
    { scope: ["default"], style: { foreground: colors.markdownText } },
    { scope: ["markup.heading"], style: { foreground: colors.markdownHeading, bold: true } },
    { scope: ["markup.heading.1"], style: { foreground: colors.markdownHeading, bold: true, underline: true } },
    { scope: ["markup.heading.2"], style: { foreground: colors.markdownHeading, bold: true } },
    { scope: ["markup.heading.3"], style: { foreground: colors.markdownHeading, bold: true } },
    { scope: ["markup.heading.4"], style: { foreground: colors.markdownHeading, bold: true } },
    { scope: ["markup.heading.5"], style: { foreground: colors.markdownHeading, bold: true } },
    { scope: ["markup.heading.6"], style: { foreground: colors.markdownHeading, bold: true } },
    { scope: ["markup.bold", "markup.strong"], style: { foreground: colors.markdownStrong, bold: true } },
    { scope: ["markup.italic"], style: { foreground: colors.markdownEmph, italic: true } },
    { scope: ["markup.list"], style: { foreground: colors.markdownListItem } },
    { scope: ["markup.list.enumerator"], style: { foreground: colors.markdownListEnumeration } },
    { scope: ["markup.quote"], style: { foreground: colors.markdownBlockQuote, italic: true } },
    { scope: ["markup.raw", "markup.raw.block"], style: { foreground: colors.markdownCode } },
    { scope: ["markup.raw.inline"], style: { foreground: colors.markdownCode, background: colors.background } },
    { scope: ["markup.link"], style: { foreground: colors.markdownLink, underline: true } },
    { scope: ["markup.link.label"], style: { foreground: colors.markdownLinkText, underline: true } },
    { scope: ["markup.link.url"], style: { foreground: colors.markdownLink, underline: true } },
    { scope: ["label"], style: { foreground: colors.markdownLinkText } },
    { scope: ["string.special", "string.special.url"], style: { foreground: colors.markdownLink, underline: true } },
    { scope: ["markup.strikethrough"], style: { foreground: colors.textMuted } },
    { scope: ["markup.underline"], style: { foreground: colors.text, underline: true } },
    { scope: ["markup.list.checked"], style: { foreground: colors.success } },
    { scope: ["markup.list.unchecked"], style: { foreground: colors.textMuted } },
    { scope: ["markup.rule"], style: { foreground: colors.markdownHorizontalRule } },
    { scope: ["conceal"], style: { foreground: colors.textMuted } },
    { scope: ["comment"], style: { foreground: colors.syntaxComment, italic: true } },
    { scope: ["keyword"], style: { foreground: colors.syntaxKeyword } },
    { scope: ["function"], style: { foreground: colors.syntaxFunction } },
    { scope: ["string"], style: { foreground: colors.syntaxString } },
    { scope: ["number"], style: { foreground: colors.syntaxNumber } },
    { scope: ["type"], style: { foreground: colors.syntaxType } },
    { scope: ["operator"], style: { foreground: colors.syntaxOperator } },
    { scope: ["punctuation"], style: { foreground: colors.syntaxPunctuation } },
  ])
}

function shutdown(renderer: CliRenderer): void {
  if (!renderer.isDestroyed) {
    renderer.destroy()
  }
}

function App(props: CliInput & { onExit: () => void }) {
  const dimensions = useTerminalDimensions()
  let scroller: ScrollBoxRenderable | undefined

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
    <box width={dimensions().width} height={dimensions().height} flexDirection="column" backgroundColor={colors.background}>
      <box height={1} paddingLeft={1} paddingRight={1} backgroundColor={colors.backgroundPanel}>
        <text fg={colors.text} wrapMode="none">
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
        <box paddingTop={1} paddingLeft={2} paddingRight={2} backgroundColor={colors.backgroundElement}>
          <code
            filetype="markdown"
            drawUnstyledText={false}
            content={props.content}
            syntaxStyle={markdownSyntax()}
            streaming={false}
            conceal={true}
            fg={colors.markdownText}
          />
        </box>
      </scrollbox>
      <box height={1} paddingLeft={1} paddingRight={1} backgroundColor={colors.backgroundPanel}>
        <text fg={colors.textMuted} wrapMode="none">
          q/esc exit  j/k scroll  pageup/pagedown jump
        </text>
      </box>
    </box>
  )
}

async function runApp(input: CliInput, renderer: CliRenderer): Promise<void> {
  let onExit!: () => void
  const exited = new Promise<void>((resolve) => {
    let done = false
    onExit = () => {
      if (done) return
      done = true
      resolve()
    }
  })

  await render(() => <App {...input} onExit={onExit} />, renderer)
  await exited
}

async function main() {
  const arg = Bun.argv[2]
  if (!arg) usage()

  const input = await readMarkdownFile(arg)
  const renderer = await createCliRenderer({
    targetFps: 30,
    maxFps: 60,
    useMouse: true,
    autoFocus: true,
    exitOnCtrlC: false,
    screenMode: "alternate-screen",
    consoleMode: "disabled",
    clearOnShutdown: true,
    openConsoleOnError: false,
    backgroundColor: colors.background,
  })

  try {
    await runApp(input, renderer)
  } finally {
    shutdown(renderer)
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
})
