#!/usr/bin/env node
/**
 * Validate every translated post of every locale against its English
 * original. CI gate for the preview workflow: exit 1 if any file fails.
 *
 * Usage: node scripts/validate-all-translations.mjs
 */
import { readdirSync, existsSync } from "node:fs"
import { join } from "node:path"
import { fileURLToPath } from "node:url"
import { execFileSync } from "node:child_process"

const POSTS_DIR = join(fileURLToPath(new URL("..", import.meta.url)), "content", "blog")
const VALIDATOR = join(fileURLToPath(new URL("..", import.meta.url)), "scripts", "validate-translation.mjs")

const english = readdirSync(POSTS_DIR).filter((f) => f.endsWith(".md") && !f.startsWith("_"))
const localeDirs = readdirSync(POSTS_DIR, { withFileTypes: true })
  .filter((d) => d.isDirectory() && !d.name.startsWith("_") && d.name !== "en")

if (localeDirs.length === 0) {
  console.log("No locale directories found — nothing to validate.")
  process.exit(0)
}

let pass = 0, fail = 0
for (const dir of localeDirs) {
  console.log(`\n[${dir.name}]`)
  for (const file of english) {
    const translated = join(POSTS_DIR, dir.name, file)
    if (!existsSync(translated)) {
      console.log(`  - ${file}: (not translated yet, skipped)`)
      continue
    }
    try {
      execFileSync("node", [VALIDATOR, join(POSTS_DIR, file), translated], { stdio: "pipe" })
      console.log(`  ✓ ${file}`)
      pass++
    } catch (e) {
      console.log(String(e.stdout ?? "") + String(e.stderr ?? ""))
      fail++
    }
  }
}

console.log(`\nTotal: ${pass} passed, ${fail} failed`)
process.exit(fail ? 1 : 0)
