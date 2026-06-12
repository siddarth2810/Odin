#!/usr/bin/env bun
// OpenTUI's preload swaps Solid away from its server runtime; without it,
// onMount is a noop and npm-installed app-level key handlers never register.
const solidPreload = "@opentui/solid/" + "preload"
await import(solidPreload)
await import("./main.js")
