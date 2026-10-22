/** Blog-only reader derivatives. The supplied report bundles stay unchanged. */
import { readFile, writeFile, readdir } from "node:fs/promises"
import { fileURLToPath } from "node:url"
import { join } from "node:path"

// Only the English edition ships on this site (Western audience).
const language = "en/"
const root = fileURLToPath(new URL("../public/interactive/ev-charging-europe/", import.meta.url))

// The blog owner explicitly requested removal of the imported authoring/AI UI
// (ask panels, publish/export controls, "get the app" prompts). Attribute-
// contains selectors cover every member of those component families, including
// elements React renders after load, without touching reading features.
const readerHead = `<meta name="robots" content="noindex,follow">
<style id="blog-reader-presentation">
[class*="dashboard-ask"],
[class*="dashboard-topbar"],
[class*="dashboard-publish"],
[class*="publish-review"],
[class*="data-app-handoff"],
[class*="chart-export"],
[class*="export-status"],
[class*="component-custom-actions"],
[class*="component-native-actions"],
[class*="report-narrative-actions"],
[class*="chart-pinned-actions"] { display: none !important; }
</style>`

// The owner also asked to drop the attribution to the non-open-source article
// that inspired the report's narrative (text paragraph + reference links).
const referenceParagraph = /\*\*Reference and independent calculations\.\*\*[\s\S]*?prevent direct comparison of totals\.\n\n/g
const referenceUrl = /https:\/\/mapular\.com\/blog\/ev-charging-deserts-europe/g

const directory = join(root, language, "analysis-report")
const original = await readFile(join(directory, "dist/index.html"), "utf8")
const cleaned = original
  .replace(referenceParagraph, "")
  .replace(/Mapular article/g, "article")
  .replace(referenceUrl, "")
  .replace(/Mapular/g, "")
await writeFile(join(directory, "dist/reader.html"), cleaned.replace(/<head([^>]*)>/i, `<head$1>${readerHead}`))

const wrapper = await readFile(join(directory, "index.html"), "utf8")
await writeFile(join(directory, "index.html"), wrapper
  .replace('src="dist/index.html"', 'src="dist/reader.html"')
  .replace(/<head>(?!<meta name="robots")/i, '<head><meta name="robots" content="noindex,follow">'))

// Blank the reference URL inside the data snapshot (idempotent).
for (const file of (await readdir(join(directory, "dist"))).filter(f => f.startsWith("snapshot.") && f.endsWith(".json"))) {
  const snapshotPath = join(directory, "dist", file)
  const snapshot = await readFile(snapshotPath, "utf8")
  const patched = snapshot.replace(referenceUrl, "")
  if (patched !== snapshot) await writeFile(snapshotPath, patched)
}

console.log("English reader prepared: authoring, ask, publish and handoff UI hidden; external reference removed.")
