# SocialHub — Release Process (APK, AAB, Google Play)

This project is an Expo (React Native) app. It has no local Android SDK
on this machine, so the signed release builds run through **EAS Build**
(cloud) or a machine with the Android SDK installed. Everything below is
verified configuration-ready; the final builds must be executed by the
owner (steps are exact).

---

## 1. Pre-flight (done in this step)

- [x] Application ID: `com.socialhub.app` (Android + iOS) — final; do not change after publishing.
- [x] Version: `1.0.0` · versionCode `1` · buildNumber `1` (app.json; EAS autoIncrement for future builds).
- [x] App name / splash / icon / notification icon: SocialHub branding only.
- [x] `eas.json`: production = app-bundle (AAB), autoIncrement enabled; preview = APK.
- [x] Production backend: `EXPO_PUBLIC_SUPABASE_URL` + anon key in `.env` (gitignored); no service_role anywhere in the app.
- [x] TypeScript clean (`npx tsc --noEmit`) · production JS bundle builds (`npx expo export --platform android`).
- [x] Push: `expo-notifications` configured (channels, icon, default channel) + server-side Edge Function.
- [x] Deep links: `socialhub://` scheme, central router, cold-start pending destinations.
- [x] Account deletion: server-side Edge Function + Settings entry (Play requirement).
- [x] Error boundary + sanitized logging + offline banner + network context.

## 2. Backend deploy (Supabase SQL Editor + CLI)

1. Re-run `setup-all.sql` in the Supabase SQL Editor (adds `device_tokens`, `messages.reply_to`, query indexes — all idempotent).
2. Install the Supabase CLI and login: `npx supabase login`
3. Link and deploy Edge Functions:
   ```
   npx supabase link --project-ref <project-ref>
   npx supabase functions deploy notify --project-ref <project-ref>
   npx supabase functions deploy delete-account --project-ref <project-ref>
   ```
4. Set function secrets in the Supabase dashboard (Edge Functions → Secrets):
   - `SUPABASE_SERVICE_ROLE_KEY` (service role key — server only, never in the repo)
   - `EXPO_ACCESS_TOKEN` (optional, for higher Expo Push rate limits)
5. Upload push credentials for the build:
   - Android: upload the **FCM Service Account JSON / server key** in EAS credentials (or Expo → Credentials) so push works in the standalone build. Expo Go on Android does not support push since SDK 53 — a development/production build is required.

## 3. Signing key (production keystore)

Google Play uses **Play App Signing** (Google holds the upload key; you keep the upload keystore).

1. Create the upload keystore (JDK required — run on a machine with Java, or use `eas credentials` which creates and stores one for you):
   ```
   keytool -genkeypair -v -keystore socialhub-upload.keystore \
     -alias socialhub -keyalg RSA -keysize 2048 -validity 10000 \
     -dname "CN=SocialHub, O=SocialHub, C=US"
   ```
2. **Back it up securely** (password manager + encrypted backup). Never commit it, never upload it to GitHub, never send it in chat.
3. With EAS, the recommended flow is: `npx eas credentials` → Android → configure → **Manage your keystore** → EAS manages it and hands you the credentials to back up. EAS never stores it on GitHub.
4. For local builds, put the keystore OUTSIDE the repo and supply it to Gradle via `~/.gradle/gradle.properties` (`storeFile`, `storePassword`, `keyAlias`, `keyPassword`) or EAS secrets.

## 4. Build the signed AAB (Play distribution)

```powershell
npx.cmd eas build --platform android --profile production
```
Output: a signed `.aab` (upload key + Play App Signing). Grab the URL and download it.

## 5. Build the signed release APK (direct install / private testing)

```powershell
npx.cmd eas build --platform android --profile preview
```
Output: `SocialHub-release.apk` (signed with the same upload key). Install directly on phones for testing.

## 6. Local build alternative (machine with Android SDK + JDK)

```powershell
npx.cmd expo prebuild --platform android   # generates android/
# place keystore config in ~/.gradle/gradle.properties
cd android
.\gradlew.bat assembleRelease            # -> app/build/outputs/apk/release/app-release.apk
.\gradlew.bat bundleRelease              # -> app/build/outputs/bundle/release/app-release.aab
```

## 7. Google Play Console

1. Create/select the developer account and create the app: **SocialHub**, package `com.socialhub.app`.
2. **Internal testing first** — never go straight to production:
   - Upload the signed AAB → Internal testing track.
   - Add tester emails; testers install via the Play test link.
   - Test from the Play build: login, feed, profile, posts, stories, friends, search, notifications, messages, push, deep links, account deletion.
3. Complete store listing (see `STORE_LISTING.md`):
   - Name, short + full description, icon, feature graphic, screenshots, category, contact info, privacy policy URL (`https://friendbook-78z.pages.dev/privacy.html`).
4. Complete declarations: Data Safety (`STORE_LISTING.md`), content rating questionnaire (honestly), target audience, app access, ads (none), permissions.
5. Review the **Pre-launch report** for crashes/ANRs/security warnings and fix any critical items.
6. Promote: Internal → Closed/Open testing (if needed) → **Production**, after all checks pass.

## 8. Versioning for future releases

- Bug fix: 1.0.1 → versionCode 2. Feature: 1.1.0. Major: 2.0.0.
- EAS `autoIncrement` bumps versionCode automatically; verify in `eas build:list`.
- Rebuild + internal testing + release each time. Google Play handles user updates; never ship an in-app APK installer.

## 9. Rollback

Keep the previous AAB/version code. On a serious problem, publish a fixed build with a HIGHER version code. Do not attempt unsafe APK replacement.

## 10. After launch

Monitor: crashes/ANRs (Play Console), reviews, login/message/upload/notification failures, Supabase usage, database/storage growth. Back up the database and signing credentials before every major release.