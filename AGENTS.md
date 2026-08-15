# SocialHub — Project Guide

Supabase-backed social media app. Vanilla HTML/CSS/JS (no framework, no build step). Runs by opening the HTML files; data lives in Supabase.

## How to work on this project

- Every JS file is self-contained: injects its own `<style>` block, guards with `if (!x) return;`, and wires everything inside a final `document.addEventListener("DOMContentLoaded", ...)`.
- **NEW FILES go in their feature folder — NEVER at the repo root.** A new file belongs to the group it serves: shared/system → `core/`, profile stuff → `profile/`, messages → `messages/`, a brand-new feature → create its own folder (with its own `index.html`). Only `index.html` (root redirect), `bump-versions.js`, `setup-all.sql`, and docs live at root.
- Files follow the pattern: `var db = window.db || supabaseClient;` at the top. Never redefine `db` elsewhere.
- All shared functions use the `socialhub` prefix (e.g. `socialhubGetMe`, `socialhubEscape`). Reuse them instead of re-writing.
- `socialhubGetMe()` returns the Supabase auth user, NOT the profiles row. Fetch the profile row separately when needed.
- After editing any `.js` file, verify with: `node --check <subfolder>/<file.js>` (run in R:\my-social-app). Never skip this.
- After editing HTML/CSS/JS, the user's browser may show stale files: bump the `?v=N` query version on the changed files in the HTML `<script>`/`<link>` tags (currently `?v=3`). This is critical — the user hits cache issues otherwise.
- User communicates in Bangla (romanized) — answer in Bangla when they do.
- Keep the user's own code style: indentation-heavy blocks, `const`/`let` (no `var` except the `db` alias), double quotes, template literals with wide spacing.

## File map (feature folders)

| Folder | Purpose |
| --- | --- |
| `index.html` | Root redirect → `home/` (GitHub Pages needs it at root) |
| `home/` | Home feed (`index.html`), `home-theme.css`, `home-theme.js` |
| `core/` | Shared system: `supabase.js`, `script.js` (auth/dark mode), `premium-ui.js`, `style.css`, `premium.css`, `glass-theme.css`, `dashboard.css`, `likes-comments.js`, `shares.js`, `post-manage.js`, `realtime.js`, `notifications.js`, `settings.js`, `friends.js`, `image-upload.js`, `messages.js`, `stories.js`, `user-search.js`, `memories.js`, `activity.js` |
| `profile/` | Own profile (`index.html`), `user-profile.html`, `profile.css`, `fb-profile.css`, `highlights.css`, `profile-page.js`, `profile-icons.js`, `profile-more.js`, `profile-edit.js`, `highlights.js` |
| `auth/` | `index.html` (login), `signup.html`, `auth.css` |
| `messages/`, `search/`, `settings/`, `friends/`, `live/`, `watch/`, `reels/`, `story-archive/`, `saved/`, `groups/`, `events/`, `marketplace/`, `pages/`, `campus/`, `admin/`, `albums/`, `birthdays/`, `archive/` | One folder per feature (each with its own `index.html`) |
| `bump-versions.js` | Version bumper — RECURSES subfolders now |
| `setup-all.sql` | **Idempotent full Supabase schema** — must be run in the Supabase SQL Editor. Contains `story_views`, `profiles.cover_url`, `messages.media_url`, `chat-images` bucket, cron job for story cleanup. Use `$sql$` quoting, not `$$` (that syntax broke before). |

## URL layout (GitHub Pages)

- `/Friendbook/` → redirect → `/Friendbook/home/` (home feed)
- Every feature is a folder: `/Friendbook/profile/`, `/Friendbook/messages/`, `/Friendbook/auth/` …
- Sub-pages keep their names: `/Friendbook/profile/user-profile.html`, `/Friendbook/live/live-room.html`
- ALL pages are at depth 1, so JS navigation strings use uniform `"../<folder>/…"` paths. Never hardcode `location.origin + "/…"` paths (breaks the repo sub-path).
- Page detection in JS: use `socialhubPageId()` (defined in core/script.js AND duplicated at the top of page-feature JS files; returns e.g. `"profile/index.html"`, `"profile/user-profile.html"`). NEVER `window.location.pathname.split("/").pop()` comparisons — they break with folders.

## Key flows

- Avatar change: `image-upload.js` → `handleAvatarUpload` → uploads to `avatars` bucket → updates `profiles.avatar_url` → calls `showCurrentUserData()`. Sidebar avatars (`.sidebar-avatar`, `.side-avatar`) are updated inside `showCurrentUserData` too.
- Dark mode: `body.dark-mode` class + `localStorage.darkMode`.
- Notification mute: `localStorage.socialhubNotifMuted === "1"` (read by `notifications.js`).
- Settings modal tabs: `.socialhub-settings-pane[data-pane=...]` + `.socialhub-settings-tabs button[data-tab=...]`.

## Verification checklist

1. `node --check` on every edited JS file.
2. If HTML changed, confirm cache version bumped.
3. SQL changes only apply after the user runs `setup-all.sql` in the Supabase SQL Editor — tell them when a feature depends on it.
