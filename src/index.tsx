#!/usr/bin/env bun
/** @jsxImportSource @opentui/solid */
import { access, readFile } from "node:fs/promises"
import path from "node:path"
import { createCliRenderer, type CliRenderer, type ScrollBoxRenderable } from "@opentui/core"
import { render, useKeyboard, useTerminalDimensions } from "@opentui/solid"
import { colors, markdownSyntax } from "./themes.js"

type CliInput = {
  file: string
  content: string
}

function usage(): never {
  console.error("Usage: odin <file.md>")
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
  const arg = process.argv[2]
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
