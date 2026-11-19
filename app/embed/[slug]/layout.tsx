import type { Metadata, Viewport } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import "../../globals.css"

// Standalone embed shell for interactive post components (used inside
// Blogger iframes). Unlike the locale route groups it ships no header,
// footer, JSON-LD or analytics — just fonts, Tailwind and the component.
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" })
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains", display: "swap" })

export const metadata: Metadata = {
  title: "Interactive embed",
  robots: { index: false, follow: true },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
}

const themeInitScript = `(function(){try{var t=localStorage.getItem("theme");var d=t?t==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches;if(d)document.documentElement.classList.add("dark")}catch(e){}})()`

export default function EmbedLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${jetbrains.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="bg-white font-sans text-zinc-800 antialiased dark:bg-zinc-950 dark:text-zinc-200">
        {children}
      </body>
    </html>
  )
}
