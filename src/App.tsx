/** @jsxImportSource @opentui/solid */
import path from "node:path"
import type { ScrollBoxRenderable } from "@opentui/core"
import { useKeyboard, useTerminalDimensions } from "@opentui/solid"
import { colors, markdownSyntax } from "./themes.js"

export type OdinInput = {
  file: string
  content: string
}

type AppProps = OdinInput & {
  onExit: () => void
}

export function App(props: AppProps) {
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
           q/esc exit · j/k ↑↓ scroll · pageup/pagedown jump
        </text>
      </box>
    </box>
  )
}
