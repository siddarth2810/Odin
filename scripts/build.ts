#!/usr/bin/env bun
import { chmod, rm, writeFile } from "node:fs/promises"
import solidPlugin from "@opentui/solid/bun-plugin"

await rm("dist", { recursive: true, force: true })

const result = await Bun.build({
  entrypoints: ["./src/main.tsx"],
  target: "bun",
  outdir: "./dist",
  plugins: [solidPlugin],
  external: ["@opentui/core", "@opentui/solid", "@opentui/solid/preload", "solid-js"],
})

for (const log of result.logs) {
  console.error(log)
}

if (!result.success) {
  process.exit(1)
}

await writeFile("dist/index.js", '#!/usr/bin/env bun\nawait import("@opentui/solid/preload")\nawait import("./main.js")\n')
await chmod("dist/index.js", 0o755)
