# SocialHub Android App

Native-style Android frontend for **SocialHub**, built with React Native + Expo + TypeScript + Expo Router.

This is a **completely separate mobile frontend** that uses the existing SocialHub Supabase backend (same project, same auth, same database, same storage). The existing website is untouched and keeps working.

```
SocialHub Website  ─┐
                    ├─►  Supabase (same project)  ◄──  SocialHub Android App
```

## Stack

- React Native (Expo SDK 57) + Expo Router (file-based routing)
- TypeScript (strict)
- Supabase JS client v2 (public/publishable key only — never a service role key)
- Session persistence via `@react-native-async-storage/async-storage` (pkce flow)
- `@expo/vector-icons` (Ionicons) for a consistent icon set
- Custom design system: colors, typography, spacing, radius — see `src/constants/`

## Project layout

```
src/
├── app/                 # Expo Router routes
│   ├── _layout.tsx      # Root: session restore + auth-guarded navigation
│   ├── (auth)/          # login, signup
│   ├── (tabs)/          # Home, Friends, Create, Notifications, Profile
│   ├── messages/        # conversation list + [id]
│   ├── story/[id]       # full-screen story viewer (placeholder)
│   ├── post/[id]        # post detail (placeholder)
│   ├── profile/[id]     # any user's profile
│   ├── settings/        # appearance / theme / logout
│   └── search/          # search (placeholder)
├── components/
│   ├── ui/              # Screen, Card, Button, Input, Text, Avatar, Badge, Loading/Error/Empty views
│   ├── navigation/      # premium bottom tab bar, home header, themed stack headers
│   ├── feed/            # feed card placeholders
│   ├── stories/         # story ring placeholders
│   ├── profile/         # profile header
│   ├── messages/        # conversation row
│   └── common/          # logo, coming-soon card, tab title
├── constants/           # theme colors, typography, spacing, radius
├── context/             # session (auth + profile + unread badges) and theme
├── hooks/
├── lib/                 # supabase client, storage helpers, constants
├── services/            # auth, profile, post, friend, story, message, notification
├── types/               # database types mirroring the real Supabase schema
└── utils/               # time + validation helpers
```

## Getting started

1. Install dependencies:

   ```sh
   npm install
   ```

2. Create `.env` from the template (never commit real keys):

   ```
   EXPO_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=<public/publishable key>
   ```

   The values must match the existing SocialHub Supabase project (see `core/supabase.js` in the website repo).

3. Run:

   ```sh
   npm start          # Expo dev server (scan QR with Expo Go / press a for Android emulator)
   npm run android    # Android emulator
   ```

4. Type-check:

   ```sh
   npm run typecheck
   ```

## App identity

- Name: **SocialHub**
- Android application ID: `com.socialhub.app` (do not change after release)
- Adaptive Android icons are pre-configured in `app.json` (replace the placeholder images under `assets/images/` before release).
- EAS build profiles are in `eas.json` (development / preview / production).

## Status (Step 1)

Foundation only:

- ✅ Auth flow: login, signup, logout, session restore + refresh, email-confirmation handling
- ✅ Auth-aware routing (login → main app, main app → login on logout)
- ✅ Premium bottom navigation with badges and a distinct Create button
- ✅ Design system (light/dark/system themes, typography, spacing, radius, icons)
- ✅ Service layer with typed queries matching the production schema
- ✅ Route architecture for messages, stories, posts, profiles, settings, search

Not yet implemented (later steps): feed, post creation, stories, chat, notifications UI,
friend requests, profile editing, video processing, push notifications.