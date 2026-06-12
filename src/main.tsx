import { access, readFile } from "node:fs/promises"
import path from "node:path"
import type { OdinInput } from "./App.js"
import { runOdinApp } from "./runOdinApp.js"

function usage(): never {
  console.error("Usage: odin <file.md>")
  process.exit(1)
}

async function readMarkdownFile(rawFile: string): Promise<OdinInput> {
  const file = path.resolve(rawFile)
  await access(file)
  return {
    file,
    content: await readFile(file, "utf8"),
  }
}

async function main() {
  const arg = process.argv[2]
  if (!arg) usage()

  const input = await readMarkdownFile(arg)
  await runOdinApp(input)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
})
