import type { Metadata } from "next"
import { getAllPosts, getAllTags } from "@/lib/posts"
import PostCard from "@/components/PostCard"
import TagList from "@/components/TagList"

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Guides, notes and lessons on web development, Next.js, SEO, developer tooling and shipping side projects.",
  alternates: { canonical: "/blog/" },
}

export default function BlogIndexPage() {
  const posts = getAllPosts()
  const tags = getAllTags()

  return (
    <div className="mx-auto max-w-3xl px-6 py-16 sm:py-20">
      <header className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-50">Blog</h1>
        <p className="mt-3 max-w-xl text-zinc-600 dark:text-zinc-400">
          {posts.length} {posts.length === 1 ? "article" : "articles"} about building for the web —
          engineering notes, practical guides, and the occasional opinion.
        </p>
        {tags.length > 0 ? (
          <div className="mt-6">
            <TagList tags={tags} />
          </div>
        ) : null}
      </header>

      <div>
        {posts.map((post) => (
          <PostCard key={post.slug} post={post} />
        ))}
      </div>
    </div>
  )
}
