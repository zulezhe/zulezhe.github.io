---
title: "Snippet Vault"
tagline: "A fast, offline-first snippet manager for developers — search thousands of code snippets instantly, sync via plain git."
description: "An offline-first developer snippet manager with instant fuzzy search and git-based sync."
date: "2026-06-20"
tech: ["React", "TypeScript", "IndexedDB", "Vite", "PWA"]
links:
  repo: "https://github.com/oliver/snippet-vault"
  demo: "https://snippet-vault.example.com"
featured: true
order: 2
---

## The problem

Every developer keeps snippets somewhere — a notes app, a private gist graveyard, a file called `tmp2.txt`. All of them are slow to search and terrible offline. I wanted something that felt like a local tool but lived in the browser.

## What it does

- **Instant fuzzy search** across thousands of snippets, sub-50ms even on a five-year-old laptop
- **Offline-first**: everything is stored locally in IndexedDB; the network is optional
- **Git-backed sync**: snippets are plain Markdown files in a repo you own, so there's no account and no lock-in
- **Syntax highlighting** for 40+ languages, shareable snippet permalinks

## How it's built

A Vite + React SPA that installs as a PWA. The interesting part is the search: snippets are indexed into a compact prefix map at load, and the fuzzy matcher runs entirely on the main thread with aggressive memoization — no worker round-trip needed at this scale.

## Status

In daily use by its author (the only metric that matters). Installable from the demo link; PRs welcome.
