# SocialHub — Project Guide

Supabase-backed social media app. Vanilla HTML/CSS/JS (no framework, no build step). Runs by opening the HTML files; data lives in Supabase.

## How to work on this project

- Every JS file is self-contained: injects its own `<style>` block, guards with `if (!x) return;`, and wires everything inside a final `document.addEventListener("DOMContentLoaded", ...)`.
- Files follow the pattern: `var db = window.db || supabaseClient;` at the top. Never redefine `db` elsewhere.
- All shared functions use the `socialhub` prefix (e.g. `socialhubGetMe`, `socialhubEscape`). Reuse them instead of re-writing.
- `socialhubGetMe()` returns the Supabase auth user, NOT the profiles row. Fetch the profile row separately when needed.
- After editing any `.js` file, verify with: `node --check <file.js>` (run in R:\my-social-app). Never skip this.
- After editing HTML/CSS/JS, the user's browser may show stale files: bump the `?v=N` query version on the changed files in the HTML `<script>`/`<link>` tags (currently `?v=3`). This is critical — the user hits cache issues otherwise.
- User communicates in Bangla (romanized) — answer in Bangla when they do.
- Keep the user's own code style: indentation-heavy blocks, `const`/`let` (no `var` except the `db` alias), double quotes, template literals with wide spacing.

## File map

| File | Purpose |
| --- | --- |
| `index.html` | Home feed. Sidebar menu (Profile/Friends/Messages/Notifications/Settings) |
| `profile.html` | Own profile page (avatar + cover photo upload) |
| `user-profile.html` | Other users' profile (view only) |
| `messages.html` | Full messages page |
| `search.html` | User search page |
| `login.html` / `signup.html` | Auth pages |
| `supabase.js` | Creates `window.db` (Supabase client) |
| `script.js` | Core: auth, `showCurrentUserData()`, feed render, dark mode, edit profile |
| `premium-ui.js` | Toast alerts, emoji→Font Awesome icon swap, share buttons |
| `likes-comments.js` | Like + comment system |
| `image-upload.js` | Avatar upload (`setupProfilePhotoUpload`), post image upload, cover upload (`setupProfileCoverUpload`) |
| `post-manage.js` | Post edit/delete dropdown |
| `friends.js` | Friend requests, suggestions, friend counts |
| `user-search.js` | Search page |
| `notifications.js` | Notification panel, badge, live realtime (`socialhubSetupNotificationRealtime`) |
| `settings.js` | Settings modal with Account/Appearance/Notifications tabs |
| `messages.js` | Chat popup + full page, typing/online/read ticks/photo (`socialhubSetupTypingChannel`, `socialhubSetupPresence`, `socialhubSetupMessageRealtime`) |
| `stories.js` | Stories viewer (hold-pause, views, seen rings) |
| `realtime.js` | Feed post realtime |
| `setup-all.sql` | **Idempotent full Supabase schema** — must be run in the Supabase SQL Editor. Contains `story_views`, `profiles.cover_url`, `messages.media_url`, `chat-images` bucket, cron job for story cleanup. Use `$sql$` quoting, not `$$` (that syntax broke before). |
| `style.css`, `profile.css`, `auth.css`, `premium.css` | Styles |

## Key flows

- Avatar change: `image-upload.js` → `handleAvatarUpload` → uploads to `avatars` bucket → updates `profiles.avatar_url` → calls `showCurrentUserData()`. Sidebar avatars (`.sidebar-avatar`, `.side-avatar`) are updated inside `showCurrentUserData` too.
- Dark mode: `body.dark-mode` class + `localStorage.darkMode`.
- Notification mute: `localStorage.socialhubNotifMuted === "1"` (read by `notifications.js`).
- Settings modal tabs: `.socialhub-settings-pane[data-pane=...]` + `.socialhub-settings-tabs button[data-tab=...]`.

## Verification checklist

1. `node --check` on every edited JS file.
2. If HTML changed, confirm cache version bumped.
3. SQL changes only apply after the user runs `setup-all.sql` in the Supabase SQL Editor — tell them when a feature depends on it.
