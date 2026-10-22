/** Blog-only reader derivatives. The supplied report bundles stay unchanged. */
import { readFile, writeFile } from "node:fs/promises"
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

const directory = join(root, language, "analysis-report")
const original = await readFile(join(directory, "dist/index.html"), "utf8")
await writeFile(join(directory, "dist/reader.html"), original.replace(/<head([^>]*)>/i, `<head$1>${readerHead}`))

const wrapper = await readFile(join(directory, "index.html"), "utf8")
await writeFile(join(directory, "index.html"), wrapper
  .replace('src="dist/index.html"', 'src="dist/reader.html"')
  .replace(/<head>(?!<meta name="robots")/i, '<head><meta name="robots" content="noindex,follow">'))

console.log("English reader prepared: authoring, ask, publish and handoff UI hidden.")
