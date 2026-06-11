import { createCliRenderer } from "@opentui/core"
import { createComponent, render } from "@opentui/solid"
import { App, type OdinInput } from "./App.js"
import { colors } from "./themes.js"

export async function runOdinApp(input: OdinInput): Promise<void> {
  const renderer = await createCliRenderer({
    stdin: process.stdin,
    stdout: process.stdout,
    targetFps: 30,
    maxFps: 60,
    useMouse: true,
    autoFocus: true,
    screenMode: "alternate-screen",
    consoleMode: "disabled",
    clearOnShutdown: true,
    exitOnCtrlC: false,
    openConsoleOnError: false,
    backgroundColor: colors.background,
  })

  let shuttingDown = false
  let shutdown!: () => void
  const exited = new Promise<void>((resolve) => {
    shutdown = () => {
      if (shuttingDown) return
      shuttingDown = true
      process.off("SIGINT", shutdown)
      process.off("SIGTERM", shutdown)
      resolve()
    }
  })

  process.once("SIGINT", shutdown)
  process.once("SIGTERM", shutdown)

  try {
    await render(() => createComponent(App, { ...input, onExit: shutdown }), renderer)
    await exited
  } finally {
    process.off("SIGINT", shutdown)
    process.off("SIGTERM", shutdown)
    if (!renderer.isDestroyed) {
      renderer.destroy()
    }
  }
}
