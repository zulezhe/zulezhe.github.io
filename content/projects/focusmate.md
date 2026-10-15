---
title: "FocusMate"
tagline: "A minimal pomodoro timer with ambient soundscapes and a local stats dashboard — no account, no ads."
description: "A minimal pomodoro + ambient sound web app with local statistics, built as an installable PWA."
date: "2026-03-02"
tech: ["SvelteKit", "Web Audio API", "PWA", "SQLite (WASM)"]
links:
  repo: "https://github.com/oliver/focusmate"
featured: false
order: 3
---

## The idea

Focus timers are a solved problem — so why does every free one nag you to create an account and watch an ad? FocusMate is the version I wanted: open the tab, press start, close the tab, come back tomorrow and your streak is still there.

## Features

- Pomodoro / short-break / long-break cycles with keyboard shortcuts
- Mixable ambient soundscapes (rain, café, brown noise) synthesized with the Web Audio API — no audio files to download
- Local-only stats dashboard: streaks, focus hours per week, best time of day
- Installs as a PWA and works fully offline

## Under the hood

Built with SvelteKit in SPA mode. Stats live in SQLite compiled to WASM, persisted to OPFS — which sounds over-engineered for a timer, and is, but the aggregate queries for the dashboard are lovely to write in SQL.

## Try it

The repo README has the local dev setup. A hosted demo is on the roadmap once I find a free tier that doesn't mind audio autoplay.
