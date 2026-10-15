import { unified } from "unified"
import remarkParse from "remark-parse"
import remarkGfm from "remark-gfm"
import remarkRehype from "remark-rehype"
import rehypeSlug from "rehype-slug"
import rehypeAutolinkHeadings from "rehype-autolink-headings"
import rehypePrettyCode, { type Options as PrettyCodeOptions } from "rehype-pretty-code"
import rehypeStringify from "rehype-stringify"
import { visit } from "unist-util-visit"
import { toString } from "hast-util-to-string"
import type { Nodes } from "hast"

export interface Heading {
  id: string
  text: string
  depth: 2 | 3
}

const prettyCodeOptions: PrettyCodeOptions = {
  theme: {
    light: "github-light",
    dark: "github-dark",
  },
  keepBackground: false,
}

/** Collect h2/h3 headings (after rehype-slug assigns ids) for the TOC. */
function collectHeadings(headings: Heading[]) {
  return () => (tree: Nodes) => {
    visit(tree, "element", (node) => {
      if (node.tagName !== "h2" && node.tagName !== "h3") return
      const id = node.properties?.id
      if (typeof id !== "string") return
      headings.push({
        id,
        text: toString(node),
        depth: node.tagName === "h2" ? 2 : 3,
      })
    })
  }
}

/** Render markdown to HTML at build time. Returns HTML plus TOC headings. */
export async function renderMarkdown(source: string): Promise<{ html: string; headings: Heading[] }> {
  const headings: Heading[] = []
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeSlug)
    .use(collectHeadings(headings))
    .use(rehypeAutolinkHeadings, {
      behavior: "append",
      properties: {
        className: ["heading-anchor"],
        ariaHidden: "true",
        tabIndex: -1,
      },
      content: { type: "text", value: "#" },
    })
    .use(rehypePrettyCode, prettyCodeOptions)
    .use(rehypeStringify)
    .process(source)
  return { html: String(file), headings }
}
