# InboxOS

> An AI command center for people running multiple Gmail inboxes — not another inbox.

Built with Next.js 15 (App Router) + TypeScript + Tailwind + Firebase Auth + Firestore + the Gmail API + Gemini.

This README is the difference between "code that looks right" and an app that actually runs. Follow it in order — most failures in a project like this come from a skipped setup step (API not enabled, wrong redirect URI, missing env var), not from the code itself.

---

## 0. What you're getting, honestly

This codebase was written by hand in a sandboxed environment with no network access, so **it has not been run through `npm install` or `next build`**. The code is complete and consistent (types, imports, and Firestore queries were all cross-checked against each other), but treat your first local `npm install && npm run dev` as the real first compile — read the terminal output and fix forward if a package version has shifted since this was written.

## 1. Architecture in one paragraph

The browser only ever does one privileged thing: a Firebase Auth Google sign-in popup, just to identify *you* as an InboxOS user. That ID token gets exchanged for an httpOnly session cookie. From then on, **the client never talks to Firestore or Google directly** — every dashboard page is a React Server Component that calls `firebase-admin` straight from the server, and every action (connect an inbox, sync, classify, ask a question) is a Next.js Route Handler. Each Gmail inbox you connect is a *separate* OAuth grant (its own refresh token, encrypted at rest) from the Firebase Auth login — that's how one InboxOS account can monitor Gmail accounts that aren't even the one you signed in with.

```
Browser ──(Google popup)──> Firebase Auth ──(ID token)──> /api/auth/session ──> httpOnly cookie
Browser ──(click "Add Gmail account")──> /api/gmail/connect ──> Google consent ──> /api/gmail/callback ──> Firestore
Server  ──(Admin SDK)──> Firestore  +  Gmail API (per connected inbox)  +  Gemini API
```

## 2. Prerequisites

- Node.js 20+
- A Google account you control, for creating the Firebase + Google Cloud projects
- A few minutes — there are three separate Google consoles to touch: Firebase, Google Cloud (OAuth + Gmail API), and Google AI Studio (Gemini key)

## 3. Set up Firebase (Auth + Firestore)

1. Go to the [Firebase Console](https://console.firebase.google.com) → **Add project**. Note the **Project ID**.
2. **Build → Authentication → Get started → Sign-in method → Google → Enable.**
3. **Build → Firestore Database → Create database** (production mode is fine — we deploy our own locked-down rules below).
4. **Project settings (gear icon) → General → Your apps → Web app (`</>`)**. Register an app (no Firebase Hosting needed). Copy the config values into `.env.local`:
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`
5. **Project settings → Service accounts → Generate new private key.** This downloads a JSON file. From it, copy into `.env.local`:
   - `FIREBASE_PROJECT_ID` (same project id)
   - `FIREBASE_CLIENT_EMAIL`
   - `FIREBASE_PRIVATE_KEY` — paste the whole `"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"` string, including the `\n` escapes, inside quotes.

   **Never commit this JSON file or its contents.**

6. Deploy the included security rules and indexes (requires the [Firebase CLI](https://firebase.google.com/docs/cli)):
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase use --add        # pick your project, give it an alias like "default"
   firebase deploy --only firestore:rules,firestore:indexes
   ```
   If a query in this app ever needs an index `firestore.indexes.json` doesn't already define, Firestore's error message includes a direct console link to create it — click it, it's faster than debugging the JSON by hand.

## 4. Set up Google Cloud (Gmail API + OAuth client)

This is a *separate* credential from Firebase Auth — it's what lets InboxOS actually read Gmail messages for each connected inbox.

1. Go to the [Google Cloud Console](https://console.cloud.google.com). You can use the **same project** Firebase created for you (it shows up automatically) or a separate one.
2. **APIs & Services → Library** → search **Gmail API** → **Enable**.
3. **APIs & Services → OAuth consent screen**:
   - User type: **External** (unless every connected inbox will be inside one Google Workspace org, then **Internal**).
   - Add the scopes: `gmail.readonly`, `gmail.metadata`, `userinfo.profile`, `userinfo.email`.
   - While the app is unverified, add every Gmail address you intend to connect (yours, your startup's, etc.) under **Test users** — otherwise Google will block the consent screen for them.
4. **APIs & Services → Credentials → Create credentials → OAuth client ID → Web application.**
   - **Authorized redirect URIs**, add both:
     - `http://localhost:3000/api/gmail/callback`
     - `https://YOUR-PROD-DOMAIN/api/gmail/callback`
   - Copy the **Client ID** and **Client secret** into `.env.local`:
     - `GOOGLE_OAUTH_CLIENT_ID`
     - `GOOGLE_OAUTH_CLIENT_SECRET`
     - `GOOGLE_OAUTH_REDIRECT_URI=http://localhost:3000/api/gmail/callback` (for local dev)

   > **Note:** going through Google's verification process to remove the "unverified app" warning / 100-test-user cap is a separate process (privacy policy, scope justification, possibly a security assessment for restricted scopes) — out of scope for this README, but search "Google OAuth verification" when you're ready to take this past testing.

## 5. Set up Gemini

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey) → **Create API key**.
2. Put it in `.env.local` as `GEMINI_API_KEY`.
3. `GEMINI_MODEL=gemini-3.5-flash` is set as the default — change it if you want a different Gemini model.

## 6. Generate app secrets

```bash
openssl rand -hex 32   # use the output for TOKEN_ENCRYPTION_KEY
openssl rand -hex 32   # use a different output for CRON_SECRET
```

## 7. Run it locally

```bash
cp .env.example .env.local   # then fill in every value from steps 3-6
npm install
npm run dev
```

Open `http://localhost:3000`, click **Connect Gmail**, sign in with Google (this is the InboxOS *login*), then go to **Inboxes** and click **Add Gmail account** (this is the Gmail *grant* — it can be the same Google account or a different one).

## 8. Deploy

This is built for [Vercel](https://vercel.com):

1. Push this repo to GitHub, import it into Vercel.
2. Add every variable from `.env.example` in **Project Settings → Environment Variables** (use your production values — a new `GOOGLE_OAUTH_REDIRECT_URI` pointing at your prod domain, `NEXT_PUBLIC_APP_URL` set to your prod URL, etc.).
3. Add the production redirect URI to the Google OAuth client (step 4 above) if you haven't already.
4. The included `vercel.json` registers a daily cron (`/api/cron/daily-briefs`) — Vercel sends an `Authorization: Bearer <CRON_SECRET>`-style header automatically for cron invocations on Pro+ plans; this route checks that header against your `CRON_SECRET` env var. On the **Hobby** plan, cron functions are capped at 60s and limited to once/day, which is exactly what's configured — if you have many users, see "Scaling the cron" below.

## 9. Design notes

The visual direction is built around the product's own metaphor — the **Opportunity Radar** — rather than a generic dark-mode template: a deep indigo "mission control" background (not pure black), with amber as the signal/opportunity accent, cyan for scan/data actions, and coral reserved only for urgency. Headlines use Space Grotesk, body text Inter, and every score/date/email-count is rendered in IBM Plex Mono — like a control-room readout. The same `RadarScope` SVG component powers both the marketing hero (decorative) and the real dashboard widget (data-driven, blips positioned by each opportunity's actual score).

## 10. Deliberate deviations from the original spec

- **`uid` denormalized onto `emails` and `analysis` docs** (the spec's schema only had `accountId`). Needed for simple, secure Firestore security rules and for the per-user queries this app runs constantly.
- **Firestore is server-only.** No client Firestore listeners — the Firestore client SDK isn't even installed. Simpler threat model, fewer moving parts, at the cost of needing a page refresh (or `router.refresh()`, which every mutating action already calls) instead of live `onSnapshot` updates. If you want real-time updates later, swap in client listeners and loosen `firestore.rules` for the relevant collections.
- **OAuth tokens are encrypted at rest** (AES-256-GCM) before being written to Firestore, keyed by `TOKEN_ENCRYPTION_KEY`.
- **Gemini is called via the raw REST API**, not an SDK — avoids dependency-version drift and uses Gemini's structured-output (`responseSchema`) mode so every AI call returns exactly the JSON shape the app expects.

## 11. Known limitations / where to go next

- **Serverless time limits.** A full 200-email sync + classification pass can be slow on the first connect. `/api/sync` and the OAuth callback are set to `maxDuration = 60`; on Vercel Hobby that's the hard ceiling. For large mailboxes, move sync + classification into a background queue (e.g. [Inngest](https://www.inngest.com), [QStash](https://upstash.com/qstash), or a Cloud Tasks queue) instead of doing it inline in the request — the functions in `lib/google/gmail.ts` and `lib/ai/classify.ts` are already split out so this is a refactor of *callers*, not the core logic.
- **Scaling the cron.** `/api/cron/daily-briefs` loops over every user serially in one function invocation. Fine for dozens of users; for hundreds+, fan this out — e.g. have the cron route enqueue one job per user instead of processing them all itself.
- **No billing/plan enforcement.** `InboxUser.plan` exists (`free` | `premium`) and "Ask Inbox" is labeled Premium in the UI, but nothing currently gates it — wire up Stripe (or similar) and check `user.plan` inside `/api/ask` if you want to actually enforce it.
- **No automated tests.** Given the scope, none were included — `lib/ai/classify.ts`, `lib/google/gmail.ts`'s MIME parsing, and `lib/contacts/intelligence.ts`'s scoring are the highest-value places to start.
- **Gmail label scope.** Sync currently pulls `in:inbox -in:chats` — adjust the query in `syncAccountEmails` (`lib/google/gmail.ts`) if you want Sent, Archive, or specific labels included too.

## 12. Project structure

```
src/
  app/
    page.tsx                  Landing page
    dashboard/                 All authenticated pages (layout.tsx guards auth)
    api/                       Route handlers — auth, gmail oauth, sync, analyze,
                                daily-brief, ask, contacts/refresh, cron
  components/
    landing/                   Marketing page sections
    dashboard/                 App widgets (RadarScope, OpportunityRadarWidget, …)
    ui/                        Hand-written shadcn-style primitives
    providers/AuthProvider.tsx Client-side Firebase Auth + session cookie exchange
  lib/
    firebase/                  client.ts (Auth only) / admin.ts (Firestore + Auth verify)
    google/                    oauth.ts (Gmail OAuth) / gmail.ts (fetch + parse + sync)
    ai/                        gemini.ts (REST wrapper) / prompts.ts / classify.ts /
                                dailyBrief.ts / askInbox.ts
    contacts/intelligence.ts   Relationship scoring + Gemini notes
    dashboard.ts               Server-side data aggregation for dashboard pages
    session.ts, crypto.ts, types.ts, constants.ts, utils.ts
  middleware.ts                 Edge-level auth gate for /dashboard/*
firestore.rules / firestore.indexes.json / vercel.json
```
