# TRIYA — Facebook-Style Roadmap

বড় প্রজেক্ট — Phase ধরে ধরে বানানো হবে। ✅ = done

## ✅ Already done
- Login / Signup (email)
- Profile: bio, avatar (crop modal), work, education, website, birthday, location
- Posts: text / photo / video / background colors
- Post audience: Public / Friends / Friends of Friends / Only Me
- Reactions: 👍 ❤️ 🥰 😂 😮 😢 😡 (hover picker) + double-tap like
- Comments (add, load with feed)
- Edit / delete own posts
- Save posts (bookmark)
- Stories: Instagram-style (photo/video/text, draw, stickers, captions, reactions, seen rings, 24h expiry)
- Reels (short video feed)
- Friends: request / accept / decline / unfriend / suggestions
- Messages: chat popup, threads
- Notifications + badge + realtime
- Settings modal (dark mode, edit profile)
- User search
- Realtime new posts
- Highlights
- Dark mode / glass theme

## 🔲 Phase 1 — Posts & Comments Power
- [x] Share post (share to timeline + copy link, shared card in feed, share count)
- [x] Comment replies (threaded) + delete own comment
- [x] Cover photo upload + cover on profiles (already existed)
- [x] Profile stats: friend count, mutual friends, posts count
- [ ] Edit / delete comment (own) — done (delete done; edit later)

## 🔲 Phase 2 — Privacy & Account
- [x] Privacy settings tab: default post audience (persists) + blocked users list
- [x] Block / unblock users (user-profile button + settings list, friendship auto-removed, feed hides their posts)
- [x] Change password (auth.updateUser)
- [x] Change email (auth.updateUser)
- [x] Deactivate account (soft delete, reactivate on login; hidden from feed + search)
- [ ] Activity log (who saw your post, etc.) — later

## 🔲 Phase 3 — Video
- [x] Watch page (watch.html — video grid, load more)
- [x] Video player page/modal (auto-play, fullscreen, next video, deep link ?video=ID)
- [x] Video tab on profile (profile.html Videos tab + user-profile All Posts/Videos switch)
- [x] Video like/comment/share/reaction (player reuses feed interaction system)
- [ ] Live video (experimental) — Phase 5 backlog

## ✅ Phase 4 — Communities
- [x] Groups: create / join / leave / group feed / members / delete (groups.html + group.html)
- [x] Events: create / RSVP (going-maybe-declined) / event page / attendees / delete (events.html + event.html)
- [x] Pages: create / follow / unfollow / post as page / delete (pages.html + page.html)
- [x] Main feed excludes group & page posts (posts.group_id / posts.page_id columns)

## 🔲 Phase 5 — Extra Facebook Features
- [x] Marketplace (buy/sell listing, category filter, search, sold/delete, message seller)
- [x] Memories ("On this day" widget on feed — own + friends' posts, dismissible)
- [x] Post search + filters (search tabs: All / People / Posts, highlighted matches, live dropdown)
- [x] Profile tabs (Posts / Photos / Videos / About — existing, Albums links added)
- [x] Photo albums (create album, upload photos, lightbox, delete photo/album, owner+friends view)
- [x] Message: online status, typing..., seen receipts (read ticks, presence dots, last_seen heartbeat)
- [x] Birthdays calendar (birthdays today + this month, wish button opens chat)
- [x] Report + moderation (report menu on every post, reason modal, reports table)
- [x] Saved posts list page (saved.html — bookmark manager with remove)
- [x] Friend suggestions widget on feed (right sidebar "People You May Know" — already live)
- [x] Live video (experimental — live directory, Go Live camera preview, viewer counts, end stream)

> Note: Phase 5 SQL (marketplace_items, albums, album_photos, reports, messages.read_at, profiles.last_seen, live_sessions) must be run in the Supabase SQL editor before the new features work.

## 🔲 Phase 6 — More Facebook Features (backlog)
- [ ] Activity log (who saw your post, etc.)
- [ ] Edit / delete comment (edit part)
- [ ] Video calls (WebRTC)
- [ ] Groups: invite members, group roles, cover image
- [ ] Events: cover image, event invites, reminders
- [ ] Marketplace: categories sidebar, my listings page, price filter
- [ ] Memories: share memory as post
- [ ] Notifications: friend request list page
- [ ] Admin/moderation dashboard (view reports)

> Note: Phase 6 SQL (post_views, profiles.is_admin, comments edit policy, groups cover_url + owner/role policies, events cover_url + invite policy, reports admin select policy) must be run in the Supabase SQL editor (section 6.x of setup-all.sql) before the new features work.
> Hosting moved to GitHub Pages: https://mdtamimeasrak-afk.github.io/triya-social/ (Netlify blocked — credits exhausted). Deploy = push to main; run `node bump-versions.js` before each release.

## ✅ Phase 7 — Facebook-Style Feed (DONE — deployed 14 Aug 2026, token 1786707791027)
- [x] Reaction bar (hover the Like button → 👍 ❤️ 🥰 😂 😮 😢 😡 picker, 52px emojis, pop animation, tooltips) — styled via premium.css
- [x] FB-style action bar: Like / Comment / Share icon+label buttons, segmented row, gray hover, colored when liked
- [x] FB-style stats row: reaction badge (colored circle + emoji + count) left, comment count right
- [x] Comments: FB bubbles (rounded, gray), "View all N comments" collapse (first 2 shown), "View more replies" toggle, inline reply pill, Reply/Edit/Delete row
- [x] Feed layout polish: 8px card radius, FB action divider, pill comment input on gray
- [x] Comment input + Send pill styling
- [x] Stories bar on feed (already existed — kept)
- [ ] Comment reactions (like a comment) — needs likes.comment_id column (schema change, Phase 7b)
- [ ] Share count in FB stats row (needs share count fetch on decorate)

