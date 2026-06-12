import { beforeAll, describe, expect, test } from "bun:test"
import { stat, readFile } from "node:fs/promises"
import path from "node:path"
import { spawnSync } from "node:child_process"

const repoRoot = path.resolve(import.meta.dir, "..")
const distIndex = path.join(repoRoot, "dist/index.js")
const readme = path.join(repoRoot, "README.md")

function run(command: string, args: string[], cwd = repoRoot) {
  return spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    maxBuffer: 1024 * 1024,
  })
}

beforeAll(() => {
  const result = run("bun", ["run", "build"])
  if (result.status !== 0) {
    throw new Error(`build failed\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`)
  }
})

describe("packaged entrypoint", () => {
  test("preloads OpenTUI Solid before mounting the app", async () => {
    const wrapper = await readFile(distIndex, "utf8")
    const mode = (await stat(distIndex)).mode
    const preloadIndex = wrapper.indexOf('import("@opentui/solid/preload")')
    const appIndex = wrapper.indexOf('import("./main.js")')

    expect(wrapper.startsWith("#!/usr/bin/env bun\n")).toBe(true)
    expect(preloadIndex).toBeGreaterThanOrEqual(0)
    expect(appIndex).toBeGreaterThan(preloadIndex)
    expect(mode & 0o111).not.toBe(0)
  })

  for (const { name, sequence } of [
    { name: "q", sequence: "q" },
    { name: "Escape", sequence: "\\033" },
    { name: "Ctrl-C", sequence: "\\003" },
  ]) {
    test(`exits on ${name} without relying on the repo bunfig`, () => {
      const expectVersion = run("expect", ["-v"])
      if (expectVersion.status !== 0) {
        throw new Error("expect is required for the packaged TUI quit regression test")
      }

      const script = `
set timeout 8
spawn -noecho bun ${distIndex} ${readme}
after 1500
send "${sequence}"
expect {
  eof {}
  timeout {
    puts "odin did not exit after ${name}; packaged runs must preload @opentui/solid/preload before app mount"
    close
    wait
    exit 124
  }
}
set status [wait]
exit [lindex $status 3]
`

      const result = run("expect", ["-c", script], "/tmp")

      if (result.status !== 0) {
        throw new Error(`packaged ${name} quit smoke failed\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`)
      }

      expect(result.status).toBe(0)
    })
  }
})
