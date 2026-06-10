#!/usr/bin/env bun
import { chmod, rm } from "node:fs/promises"
import solidPlugin from "@opentui/solid/bun-plugin"

await rm("dist", { recursive: true, force: true })

const result = await Bun.build({
  entrypoints: ["./src/index.tsx"],
  target: "bun",
  outdir: "./dist",
  plugins: [solidPlugin],
  external: ["@opentui/core", "@opentui/solid", "solid-js"],
})

for (const log of result.logs) {
  console.error(log)
}

if (!result.success) {
  process.exit(1)
}

await chmod("dist/index.js", 0o755)
