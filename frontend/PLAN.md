# ZeptoURL — Frontend Plan

> **Status:** implementation in progress (plan approved 2026-11-03). Track progress in the [§8 checklist](#8-build-checklist).
> **Last updated:** 2026-11-03
> **Scope rule:** This work covers only `frontend/`. Nothing in `../infra` or `../backend` gets changed as part of it. Infra changes the frontend needs are listed in [§9](#9-infra-prerequisites-owner--outside-this-work) for the owner to do.

---

## 1. Decisions

| Area | Decision | Why |
|---|---|---|
| Framework | **Vite + React + TypeScript** | Hosting is S3 + CloudFront, which can only serve static files. Vite builds to a plain `dist/` folder. Next.js would need `output: 'export'`, which turns off server rendering, middleware and API routes, plus a CloudFront Function to rewrite paths. That's more work for nothing. |
| Hosting | **S3 (private) + CloudFront (OAC)** | Static single-page app (SPA). Fits the Terraform you already have. |
| Auth UI | **`<Authenticator>` from `@aws-amplify/ui-react`** | Ready-made sign up / confirm / sign in / reset screens. Talks to Cognito directly over SRP, so it needs no Hosted UI, no Cognito domain and no callback URLs. |
| Routing | **React Router** | Four pages, plus a guard for protected pages. |
| Server state | **TanStack Query** | Caching, updating the list instantly on create/delete, retries. |
| Styling | **Tailwind CSS + shadcn/ui** | shadcn components are copied into the repo and themed through CSS variables, so the brand lives in one place. Both installed skills support it (`shadcn`, and ui-ux-pro-max `--stack shadcn`). |
| Domains | **The app and short links stay on separate domains** | The backend redirect is `GET /{code}` at the API root. On a shared domain it would collide with app paths like `/dashboard`. |
| Link creation | **Signed-in users only** | `POST /links` requires a JWT. The landing page has no shorten form. |
| Visual direction | **A. Claim ticket, set in Instrument Sans** ([§6](#6-design)) | The ticket idea carries through every screen. Instrument Sans keeps it modern instead of retro. |
| Architecture | **All logic in `src/services/`**, separate from the UI ([§4](#4-app-structure)) | Services are plain TypeScript and testable without React. Hooks are the only bridge to the UI. |
| Color modes | **Light + dark, following the OS** (no toggle) | Tickets and the login card stay yellow "paper" in both modes. Only the page around them darkens. |
| Tests | **Vitest for the services** | Covers URL rules, the HTTP client, the links service and the clipboard. No component tests. |
| After shortening | **Show the new ticket and focus its Copy button** | Nothing is copied to the clipboard without a click. |
| shadcn setup | **`nova` preset with Base UI** (`--base base --preset nova`), controls raised to 40px | Nova's 6–8px radius and hairlines fit the ticket look. Base UI is the shadcn skill's default. |
| Custom domain | **Deferred** | Short links use the API Gateway domain for now. |

---

## 2. Backend contract (taken from `../backend/lambdas`)

Base URL is the HTTP API endpoint (`api_endpoint` Terraform output).

| Call | Auth | Request | Response |
|---|---|---|---|
| `POST /links` | JWT | `{ "url": string }` | `201 { code, url }`, or `400 { message }`, or `500 { message }` |
| `GET /links` | JWT | — | `200 { items: [{ code, url, ownerId, createdAt }] }`, newest first |
| `DELETE /links/{code}` | JWT | — | `204` (empty body), or `404 { message }` (not found **or** not yours) |
| `GET /{code}` | public | — | `302` with `Location` = original URL, or `404` (plain text) |
| Any JWT route | — | missing or expired token | `401` from API Gateway |

**`400` messages from `create`:** `"Invalid JSON"`, `"Invalid URL"`, `"Only http and https URLs are allowed"`.

**URL rules from the backend** (copy these into the browser-side check): must be a string, non-empty, at most 2048 characters, parseable by `new URL()`, with protocol `http:` or `https:`. The backend stores `new URL(url).href`, the normalized form.

**Short link shown to users:** `${VITE_API_URL}/${code}`. The same API serves `/links` and the public redirect `GET /{code}`. Codes are 7 characters from `[0-9A-Za-z]`.

---

## 3. Authentication

### Cognito → Amplify config mapping
Values come from `../infra/modules/auth/main.tf` (read only).

| Cognito setting | Amplify `Auth.Cognito` config |
|---|---|
| `username_attributes = ["email"]` | `loginWith: { email: true }` |
| `auto_verified_attributes = ["email"]` | `signUpVerificationMethod: "code"`. The Authenticator shows the confirm-code screen after sign-up. |
| Password: min 10, upper, lower, number, no symbols | `passwordFormat: { minLength: 10, requireLowercase: true, requireUppercase: true, requireNumbers: true, requireSpecialCharacters: false }` |
| `generate_secret = false` | Required for a browser app. Already set correctly. |
| `ALLOW_USER_SRP_AUTH` + `ALLOW_REFRESH_TOKEN_AUTH` | The Amplify v6 default flow (SRP) plus automatic token refresh. |
| No identity pool | Not needed. We only use user pool tokens. |

### Flow
- `Amplify.configure(...)` runs once, through `configureAuth()` in `services/auth`, called from `main.tsx` before the first render.
- `<Authenticator.Provider>` wraps the whole app, so any component can read `authStatus` and `user` through `useAuthenticator`.
- **`/login`** renders `<Authenticator>`. When `authStatus === "authenticated"`, it goes to the page the user originally asked for, or to `/dashboard`.
- **`ProtectedRoute`** reads `authStatus`:
  - `configuring`: full-page spinner
  - `unauthenticated`: `<Navigate to="/login" state={{ from }} />`
  - `authenticated`: `<Outlet />`
- **Landing page links:** "Get started" opens `/login` on the sign-up screen (`initialState="signUp"`). "Log in" opens it on the sign-in screen.
- **Sign out:** a button in the dashboard header calls `authService.signOut()`. Show the user's email from `user.signInDetails?.loginId`.

### Customizing the Authenticator
- `formFields`: labels, placeholders, field order.
- `components.Header`: logo / brand.
- Optional `hideSignUp` / `variation`, if needed.
- **Styling caveat:** it ships its own CSS (`@aws-amplify/ui-react/styles.css`), and Tailwind classes can't style its insides. Set colors, fonts and corner radius through Amplify's **`ThemeProvider` tokens** or the `--amplify-*` CSS variables, in `src/theme/amplify-theme.ts`.

### Tokens for API calls
- `fetchAuthSession()` → `tokens.accessToken.toString()`. Amplify refreshes expired tokens automatically.
- Send it as `Authorization: Bearer <accessToken>`.
- The API's JWT check accepts the access token because its `client_id` claim matches the app client. The Lambdas read the user ID from `sub`.
- If there's no token, or the API returns `401`, call `signOut()`. `authStatus` then becomes `unauthenticated`, and the route guard sends the user to `/login`.

---

## 4. App structure

### Pages
| Path | Access | Contents |
|---|---|---|
| `/` | Public | Landing: hero, value proposition, "Get started" (sign up), "Log in". No shorten form: creating links requires an account. |
| `/login` | Public | `<Authenticator>`, then redirect after login |
| `/dashboard` | Protected | Header (email, sign out), create form, link list |
| `*` | Public | 404 page |

### Folder layout: services layer
All logic lives in `src/services/`, as plain TypeScript with **no React imports**, one folder per concern. React code reaches anything with side effects only through hooks.

```
src/
├─ services/                         all logic, plain TypeScript, no React
│  ├─ config/   config.service.ts    reads + validates the VITE_* env vars → typed `config`; throws ConfigError
│  ├─ auth/     auth.service.ts      configureAuth(), getAccessToken(), signOut(), onSignedOut(listener)
│  ├─ http/     http.service.ts      request<T>(): base URL, Bearer token, JSON, 204, 401 → signOut, network errors
│  │            api-error.ts         ApiError
│  ├─ links/    links.service.ts     listLinks(), createLink(url), deleteLink(code)
│  │            links.types.ts       Link, ListLinksResponse, CreateLinkResponse
│  │            link-url.ts          normalizeInput, validateUrl, shortLink, displayUrl (pure)
│  └─ clipboard/clipboard.service.ts copyText(text)
│     (each folder has an index.ts: its public API, plus *.test.ts beside the code)
├─ hooks/                            React glue over services: useLinks, useCreateLink, useDeleteLink, useCopyToClipboard
├─ components/                       UI only (+ components/ui/* generated by shadcn)
├─ pages/                            Landing, Login, Dashboard, NotFound
├─ app/                              providers.tsx, routes.tsx, query-client.ts
├─ theme/amplify-theme.ts            Authenticator theme tokens (match the Tailwind theme)
└─ main.tsx
```

**Rules**
1. **Dependencies point one way:** pages → components → hooks → services → (`fetch`, Amplify, clipboard, `import.meta.env`). Inside services, the chain is config ← auth ← http ← links; `clipboard` stands alone.
2. **Only `services/` touches `fetch`, `aws-amplify` / `aws-amplify/*`, `navigator.clipboard` and `import.meta.env`.** `@aws-amplify/ui-react` (`<Authenticator>`, `useAuthenticator`) is UI, so it stays in pages and components.
3. **Import a service through its folder** (`@/services/links`), never through deep paths.
4. **UI may import types and pure helpers directly** (`validateUrl`, `shortLink`, `Link`). Anything with side effects goes through a hook.
5. File names: components in PascalCase, everything else kebab-case.

### Behavior
- **Create form**
  - Check the URL in the browser first and show errors inline.
  - Disable the submit button while the request is in flight.
  - On success, put the new link at the top of the list, highlight it, and show "Copy" right away.
  - Show the backend's `message` text if the request fails.
- **Link list**
  - Skeleton rows while loading.
  - A message when there are no links yet.
  - Each row shows: short link (click to copy), original URL (truncated, full text on hover), relative date ("2h ago").
- **Copy:** `navigator.clipboard.writeText`, with a "Copied" confirmation for about 2 seconds.
- **Delete:**
  - Ask for confirmation first.
  - Remove the row immediately, and put it back if the request fails.
  - Every failure, including `404`, shows the API's message in a toast and puts the row back. Nothing is silently treated as success.
- **Errors:** network or 500 errors show as a pop-up notification (toast). Query retries are on for reads and off for create/delete.

---

## 5. Configuration

Environment variables (Vite reads only names starting with `VITE_`):

| Variable | Source | Notes |
|---|---|---|
| `VITE_API_URL` | Terraform output `api_endpoint` | Base URL for `/links` calls. |
| `VITE_USER_POOL_ID` | User pool ID | Until infra outputs it, take it from the last part of `issuer_url` or from the Cognito console. |
| `VITE_USER_POOL_CLIENT_ID` | Terraform output `client_id` | |

- Commit a `.env.example` with empty values. The real env files are git-ignored.

### Builds per environment
| Command | Mode | Env file read | Output | Use |
|---|---|---|---|---|
| `npm run dev` | `development` | dev values | (dev server) | Local dev server |
| `npm run build:dev` | `development` | dev values | `dist/development/` | Optimized bundle pointing at the **dev** API and user pool |
| `npm run build` | `production` | `.env.production` | `dist/production/` | Optimized bundle pointing at **prod** |
| `npm run preview:dev` / `npm run preview` | same as above | — | serves the matching folder | Check a build locally |

Both builds are fully optimized (identical size; checked). The mode only decides which env file is read, and `build.outDir: dist/${mode}` in `vite.config.ts` keeps each build in its own folder.

**Vite loads `.env.local` in every mode, builds included,** below the mode's own file. So with dev values in `.env.local`, any key that `.env.production` lacks (or the whole file, if it's missing) silently comes from dev, and a "prod" build points at dev. The recommended name for dev values is **`.env.development.local`**: Vite reads it only in `development` mode (`dev` and `build:dev`), so a missing prod value fails visibly with the "isn't configured" screen instead.
- **These values end up in the public JavaScript bundle. That's fine: none of them are secrets.**

### CORS (configured in infra, no dev proxy)
The browser calls API Gateway directly in every environment, so the API's CORS configuration must allow:
- `http://localhost:5173` for the dev server. The port is fixed with `strictPort` in `vite.config.ts`, so the origin never drifts to 5174.
- The CloudFront URL once deployed.

An earlier dev proxy (`DEV_API_PROXY_TARGET`) was removed on 2026-11-04: CORS is handled in infra instead.

This only works in dev. **Production still needs CORS on the API** (see §9).

---

## 6. Design

**Status:** **chosen: Candidate A (Claim ticket), with Instrument Sans instead of Libre Franklin.** B and C stay below for reference.

**Type for the chosen direction:**
- **Instrument Sans** for the UI and headings. Headlines get their impact from size plus the condensed width (`wdth` 75–85), not weight, since the family tops out at 700.
- **Atkinson Hyperlegible Mono** for codes.

**Brief (to confirm):**
- **Subject:** ZeptoURL, a personal URL shortener on AWS. "Zepto" is the SI prefix for 10⁻²¹.
- **Audience:** signed-in people who share links, plus anyone reviewing the project.
- **Primary job:** paste a long link, get a short one, copy it. Later, find or delete it.

### Fixed in every direction
- **Codes use Atkinson Hyperlegible Mono.** Codes are 7 characters from `[0-9A-Za-z]`, and people read and type them, so `0`/`O` and `1`/`l`/`I` must look different. The Braille Institute designed Atkinson Hyperlegible for exactly that. Mono is used only for codes, not for other small labels.
- **Theme:** light and dark, following the OS setting (no toggle). The dark palette is derived from the brand ink (`#1A1A2E` page, `#26263F` cards, `#ECEDF3` text). Tickets and the login card stay yellow paper with ink content in both modes.
- **Avoid these generic tells:**
  - all-caps eyebrow labels
  - `A · B · C` meta strings
  - `→` on buttons
  - grids of identical cards with soft grey shadows
  - gradient washes
  - entrance animations on every section
- **Copy:**
  - sentence case and plain verbs
  - an action keeps its name through the flow ("Create link" → toast "Link created")
  - errors say what happened and how to fix it

### Candidate A: Claim ticket
A short link works like a coat-check ticket: hand over something long, keep a small stub.
| Token | Hex | Use |
|---|---|---|
| Ticket yellow | `#FFCB3D` | Ticket surfaces (link rows, login card) |
| Press ink | `#22223B` | Text, outlines, primary buttons (10.2:1 on yellow, 15.4:1 white-on-ink) |
| Counter grey | `#F3F4F7` | Page background |
| Carbon | `#4A4D5E` | Secondary text (5.5:1 on yellow, 7.6:1 on grey) |
| Stamp red | `#D62839` | Delete (white text 5.0:1) |
- **Type:** Libre Franklin (a Franklin Gothic revival, the sturdy gothic of printed signage) for the UI and headings, in heavy weights for headlines. Codes are set in Atkinson Hyperlegible Mono.
- **Signature:**
  - **Each link is a ticket stub:** one perforated edge, the code printed large, and an ink outline. Yellow against grey is only 1.4:1, so the outline does the separating.
  - **Creating a link "prints" a ticket.** It's the only animation, and the user's action triggers it.
- **Layout:** centered single column (~640px). Create form at the top, tickets below.
- **Risk:** can tip into kitsch. Keep it to one perforation edge, with no fake paper textures and no extra stamps.

### Candidate B: Measured
Zepto is a unit of measure, so the interface measures: links show their length.
| Token | Hex | Use |
|---|---|---|
| Drafting paper | `#FAFBFC` | Background |
| Drafting ink | `#0E1F3B` | Text, primary buttons (15.9:1) |
| Callout magenta | `#C2185B` | Dimension lines, links, focus ring (5.7:1; white on it 5.9:1) |
| Graphite | `#5A6B82` | Secondary text, input outlines (5.3:1) |
| Grid | `#D5DDE8` | Dividers only (too faint for input outlines) |
| Delete red | `#B42318` | Only inside the delete confirmation (white on it 6.6:1) |
- **Type:** Instrument Sans for the UI and headings, with its condensed width for the big headline. Codes and character counts are set in Atkinson Hyperlegible Mono.
- **Signature:** technical-drawing dimension lines. The hero shows a real long URL with a "96 characters" dimension next to the 7-character code. Each dashboard row shows the original URL's length.
- **Layout:** left-aligned single column with generous margins. Annotations sit above the lines they measure.
- **Caveat:** on the `execute-api` domain the full short link is ~60 characters, so "7" only describes the code. This direction gets stronger with a short custom domain.

### Candidate C: Hyperlink
Built from the web's oldest convention: links are blue and underlined, and visited links turn purple.
| Token | Hex | Use |
|---|---|---|
| Link blue | `#0000EE` | Short links, primary actions (9.4:1) |
| Visited purple | `#551A8B` | Short links you've already copied (11.0:1) |
| White | `#FFFFFF` | Background |
| Black | `#000000` | Text (21:1) |
| Grey | `#666666` | Secondary text (5.7:1) |
| Error red | `#C00000` | Delete (6.5:1) |
- **Type:** Source Serif 4 for headings (early browsers defaulted to a serif, Times) and Source Sans 3 for the UI. Codes are set in Atkinson Hyperlegible Mono.
- **Signature:** the underline. Short links are big, underlined and blue. Copying one turns it purple, so you can see which links you've already copied (stored per browser in `localStorage`).
- **Layout:** plain document flow, left-aligned, ~65-character line length. Almost no boxes: the list is spacing, not cards.
- **Risk:** can look unstyled if done timidly. Scale and spacing must be very deliberate. It's the most accessible of the three and the quickest to build.

### Rejected
- **ui-ux-pro-max's generated system:** dark slate + green `#22C55E` + JetBrains Mono / IBM Plex Sans. That's the near-black + acid-green default that fits any developer tool, and nothing in it is specific to ZeptoURL.
- **A Swiss-grid direction:** hairline rules and zero radius. That's the broadsheet default. Its precision survives in B, tied to an actual measurement instead.

### Process
1. **frontend-design** skill: visual direction (in progress, see above).
2. **ui-ux-pro-max** skill: run with `--stack react` and `--stack shadcn` for component, accessibility and UX guidance.
3. Put the chosen colors and fonts in **both** the Tailwind theme **and** `amplify-theme.ts`, so the login screen matches the dashboard.
4. Basics to cover:
   - visible focus outlines
   - enough color contrast
   - keyboard access for copy and delete
   - respect for reduced-motion settings
   - layout that works on phones

---

## 7. Deployment (frontend side)

Needs the hosting infra from §9 to exist first.

1. Fill `.env.production` from the Terraform outputs.
2. `npm run build` → `dist/production/` (or `npm run build:dev` → `dist/development/` for the dev stack)
3. Upload the hashed asset files, cached for a year:
   `aws s3 sync dist/production/ s3://<bucket> --delete --exclude index.html --cache-control "public,max-age=31536000,immutable"`
4. Upload `index.html` with no caching:
   `aws s3 cp dist/production/index.html s3://<bucket>/index.html --cache-control "no-cache"`
5. Clear CloudFront's cached copy:
   `aws cloudfront create-invalidation --distribution-id <id> --paths "/index.html"`

Later, this can become a `deploy` npm script, then a GitHub Actions workflow that signs in to AWS through OIDC (no stored AWS keys).

---

## 8. Build checklist

### Phase 0: Setup and tooling
- [x] `frontend-design` skill: the top-level `frontend-design/` folder was its only real copy. It got deleted, then was reinstalled into `.agents/skills/frontend-design`.
- [x] Scaffolded: Vite 8, React 19, TypeScript, oxlint.
- [x] `git init`, `npm install`
- [x] Remove the Vite demo (`App.tsx`, `App.css`, `src/assets/*`, `public/icons.svg`); set the `index.html` title, description and `theme-color` metas
- [x] Tailwind v4 + the `@/*` alias (`paths` only, since TypeScript 7 has no `baseUrl`)
- [x] `.env.production` and the locally installed skills (`.agents/`, `.claude/skills/`) in `.gitignore`. (A dev proxy was added here, then removed: CORS is configured in infra.)
- [x] `shadcn init --base base --preset nova` + 14 components (button, input, input-group, field, label, alert, alert-dialog, skeleton, spinner, empty, toast, tooltip, separator, plus textarea as a dependency of input-group). Notes:
  - this shadcn version (4.23) generates `lib/utils.ts` as `export { cn } from "cn"`, using the small `cn` package instead of clsx + tailwind-merge. That's intentional.
  - the preset installed **Geist** (`@fontsource-variable/geist`) and neutral grey tokens. **Phase 1 replaces both** (Instrument Sans + the Claim ticket palette) and uninstalls Geist.
  - `.oxlintrc.json` turns off `only-export-components` for `src/components/ui/**`.
- [x] Installed: `react-router` 8.5.1 (pinned explicitly, because a plain `npm i` resolved 7.18.5), `aws-amplify`, `@aws-amplify/ui-react`, `@tanstack/react-query`, the two Fontsource fonts, `vitest`. Scripts: `npm test` (`vitest run --passWithNoTests`, drop the flag in Phase 5) and `npm run test:watch`.
- [x] `.env.example` (all keys, empty) and `src/env.d.ts` (typed, every key optional so a missing one becomes a `ConfigError` instead of a crash)
- [x] Lint rule: `no-restricted-imports` blocks `aws-amplify` and `aws-amplify/*` in `src/components`, `src/pages`, `src/hooks` and `src/app`. Checked with a probe file: it errors on `aws-amplify/auth` and allows `@aws-amplify/ui-react`. The other Architecture rule 2 items (`fetch`, `navigator.clipboard`, `import.meta.env`) stay review-only.
- [x] `npm audit` reports 6 low/moderate findings, all inside shadcn's own CLI dependencies (deepmerge, ts-morph, minimatch). Nothing there ships in the app bundle. `npm audit fix --force` would downgrade shadcn to 1.0.0, so it's skipped.

### Phase 1: Theme (Claim ticket)
- [x] Light + dark tokens (dark follows the OS via `@custom-variant dark (@media …)`), ticket tokens, fonts (Geist removed and uninstalled), radius, type utilities (`type-display`, `type-title`, `type-lede`, `type-code-lg`, `type-code`), focus outline, 40px controls (button, input, input-group), full-strength field rings
- [x] Ticket motif CSS (`.ticket` / `.ticket-stub` / `.ticket-body`, stub 10.5rem, notches via mask + ink arcs, `overflow: clip`) + print animation (`[data-printing]`, off under reduced motion). Tickets and the Amplify card re-declare the light ink tokens, so they read the same in dark mode.
- [x] `src/theme/amplify-theme.ts` (the login card is a ticket)
- [x] Checked with a temporary showcase, deleted afterwards. Screenshots: light, dark, a real 390px viewport (via iframe), the login card in dark mode, the delete dialog, and a 3× zoom of a ticket.

### Phase 2: Config and auth services, app shell, login
- [x] `services/config` (`getConfig()`, `readConfig(env)`, `ConfigError`), `services/auth` (`configureAuth`, `getAccessToken`, `signOut`, `onSignedOut`, plus sentence-case Authenticator copy via `I18n`)
- [x] `app/query-client.ts`, `app/providers.tsx`, `app/routes.tsx`, **`app/auth-layout.tsx`**, `main.tsx` + `ConfigErrorScreen`
- [x] `ProtectedRoute`, `/login` with `<Authenticator>` (Amplify `ThemeProvider` only here), `AppHeader` + `useSignOut`, `SkipLink`, `Wordmark`, `FullPageSpinner`; placeholder Landing / Dashboard / NotFound (built out in Phases 3–4)
- [x] **Bug fixed (2026-11-06): after a fresh login, the list stayed on skeletons and the header had no email until a refresh.** `/login` navigated on `authStatus`, which flips on Cognito's `signedIn` event before the Authenticator has loaded `user`. Leaving then unmounted it mid-flow and left `user` empty, and `useLinks` waited on `user.userId`. Now `/login` navigates on `route === 'authenticated'` (the Authenticator has finished), and `useLinks` depends only on `authStatus` (key `['links']`; the cache is cleared on sign-out).
- [x] **Deviation, for bundle size:** Amplify is configured in a lazy `auth-layout` route that wraps `/login` and `/dashboard`, not in `main.tsx`. The landing page's first load went from 203 KB to 93 KB gzipped. The trade-off: the landing page can't show "Go to your links" to signed-in users, but `/login` sends them straight on to `/dashboard`.
- [x] Checked in the browser with placeholder env values: config-error screen, landing (dark), sign-up (light), `/dashboard` → `/login` redirect (dark), 404.
- [ ] **You:** test with real values in `.env.local`: sign up → email code → confirm → log in → refresh page (session kept) → sign out → forgot password

### Phase 3: Links, HTTP and clipboard services, then the dashboard
- [x] `services/http` (`request()` on plain `fetch`, `ApiError`, `MESSAGES`: 4xx shows the backend's message, 5xx a generic one, 401 signs out, network failure a friendly message, aborts pass through), `services/links` (`listLinks`, `createLink`, `deleteLink`, plus `normalizeInput` / `validateUrl` / `shortLink` / `displayUrl`), `services/clipboard` (`copyText`), `services/format` (relative and full dates)
- [x] Hooks: `useLinks`, `useCreateLink`, `useDeleteLink`, `useCopyToClipboard`. **No immediate refetch after a create or delete:** `GET /links` reads an eventually consistent DynamoDB index, so the hooks update the cache directly and the next natural refetch reconciles.
- [x] `CreateLinkForm` (browser-side check, backend 400 shown inline, toast, the new ticket prints and takes focus on Copy). This works today: `POST /links` is deployed.
- [x] `Ticket` (Copy / Open / Delete), `LinkList` (skeleton, error with "Try again", empty, list). **Blocked by infra: the `list` route is disabled**, so the list shows its error state until it's enabled.
- [x] `DeleteLinkDialog` (focus goes to the heading after a delete, back to the Delete button after Cancel). **Blocked by infra: the `delete` route is disabled.** Until it's enabled, deleting shows API Gateway's "Not Found" in a toast and the row comes back.
- [x] **Fix found during the check:** Amplify's `styles.css` has unscoped, unlayered resets (`button { font: inherit }`, an `html` font-family) that beat Tailwind classes. Switched to `styles.layer.css`, imported in `index.css` with an explicit `@layer theme, base, amplify, components, utilities` order, and pointed Amplify's font variables at Instrument Sans.
- [ ] **You:** with real `.env.local` values, create a link, then Copy and Open it (302 to the original URL)

### Phase 4: Landing, 404 and polish
- [x] Landing page: hero with the real transformation (a 136-character sample URL → specimen ticket + caption), a 3-step "How it works" (a real sequence, so numbered), footer, skip link. NotFound (Phase 2). Favicon: an ink-outlined yellow ticket with notches and perforation.
- [x] The landing page's first load is still free of Amplify, auth and http (checked the built chunk's static imports): 92.7 KB gzipped.
- [x] frontend-design critique: hid the meaningless "just now" on specimen tickets; rounded the Amplify login card to match the tickets.
- [x] ui-ux-pro-max checklist: restored `cursor: pointer` on buttons (Tailwind v4's preflight drops it); no emoji icons; 150ms transitions; light and dark contrast (checked in Phase 1); 390px layout; visible focus outline; reduced motion turns off the print animation.
- [ ] **You:** a keyboard-only pass in a real browser (Tab through landing → login → dashboard, open and cancel the delete dialog).

### Phase 5: Service tests
- [x] 6 files, 56 tests (`npm test`, about 1s, Node environment, no React): `link-url` (backend parity, including the 2,048 limit after percent-encoding), `http.service` (Bearer header, 204, 4xx message, 5xx hidden, 401 / missing token → sign-out, network → friendly message, aborts pass through), `links.service` (paths, encoding, `ownerId` dropped, every delete failure including 404 reaches the caller), `clipboard.service`, plus `config.service` and `relative-time`
- [x] Mutation check: letting `ftp:` through and breaking delete's 404 handling each failed exactly the matching test; both restored. (Delete's 404 special case was later removed entirely, 2026-11-04: no workarounds.)
- [x] `npm test` no longer uses `--passWithNoTests`

### Phase 6: Deploy
- [ ] `scripts/deploy.mjs` + `npm run deploy`
- [ ] **Blocked by infra:** hosting module + CORS for the CloudFront domain
- [ ] `.env.production`, build, sync, invalidate (§7)
- [ ] Smoke test on the CloudFront URL, including a refresh on `/dashboard` (tests the fallback to `index.html`)

---

## 9. Infra prerequisites (owner, outside this work)

> These are **not** done as part of the frontend work. They're listed here because the frontend depends on them.

| # | Change | Where | Blocks |
|---|---|---|---|
| 1 | Enable the `list` and `delete` routes (uncomment) | `infra/modules/api/locals.tf` lines 15–16 | Dashboard list + delete |
| 2 | `cors_configuration` on the HTTP API: `allow_origins = var.allowed_origins` (`http://localhost:5173` + CloudFront URL), `allow_methods = GET, POST, DELETE`, `allow_headers = authorization, content-type`, `max_age = 3600` | `aws_apigatewayv2_api` in `infra/modules/api/main.tf` | **Every browser call**, in dev (`http://localhost:5173`) and in production |
| 3 | Output `user_pool_id` | `infra/modules/auth/outputs.tf` | Nothing hard (workaround in §5); convenience |
| 4 | `account_recovery_setting` with `verified_email` | `aws_cognito_user_pool` in `infra/modules/auth/main.tf` | Reliable "Forgot password" in the Authenticator |
| 5 | Root `outputs.tf`: `api_endpoint`, `user_pool_id`, `user_pool_client_id`, `frontend_bucket`, `cloudfront_distribution_id`, `cloudfront_url` | `infra/envs/dev/outputs.tf` (new) | Filling `.env*` and the deploy commands |
| 6 | Frontend hosting module (spec below) wired into `envs/dev/main.tf`, with `module.frontend.cloudfront_url` passed into the API's `allowed_origins` | `infra/modules/frontend/` (new) | Deploy |
| 7 | *(optional)* Drop `ALLOW_ADMIN_USER_PASSWORD_AUTH` unless it's used for Postman or CLI testing | `infra/modules/auth/main.tf` | Nothing |

### Hosting module spec (`modules/frontend`)
| Resource | Settings |
|---|---|
| `aws_s3_bucket` | Private. Name must be **lowercase and globally unique**, e.g. `zeptourl-frontend-${env}-<account_id>` (`ZeptoURL-…` is not a valid bucket name) |
| `aws_s3_bucket_public_access_block` | All four set to `true` |
| `aws_cloudfront_origin_access_control` | Type `s3`, signing `sigv4`, behavior `always` |
| `aws_cloudfront_distribution` | S3 origin through OAC · `default_root_object = "index.html"` · `viewer_protocol_policy = "redirect-to-https"` · managed `CachingOptimized` cache policy · `PriceClass_100` · `cloudfront_default_certificate = true` (for now) |
| ↳ `custom_error_response` | `403 → /index.html (200)` and `404 → /index.html (200)`. This is the SPA fallback that lets deep links and refreshes work. Through OAC, S3 returns 403, not 404, for missing files. |
| `aws_s3_bucket_policy` | Allow principal `cloudfront.amazonaws.com` to `s3:GetObject` on `bucket/*`, with the condition `AWS:SourceArn` = distribution ARN |
| Outputs | `bucket_name`, `distribution_id`, `cloudfront_url` (`https://<domain_name>`) |

**Upload the site with the AWS CLI (§7), not Terraform's `aws_s3_object`**, so infra changes and app releases stay separate.

---

### Backend gaps (owner, outside this work)

> Problems in `../backend` the frontend runs into. They're named here instead of being worked around in the UI.

| # | Gap | Where | Effect on the frontend |
|---|---|---|---|
| B1 | `POST /links` stores `createdAt` but returns only `{ code, url }` | `backend/lambdas/create/index.mjs`: `return json(201, { code, url })` | A just-created ticket shows **no time** until the list next loads from the server. The UI doesn't invent one (`Link.createdAt` is optional). Once the response includes `createdAt`, it shows up immediately with no frontend change. |

---

## 10. Known backend quirks (affect the UI, not fixed here)
- **Deleted links can keep working briefly.** The redirect response tells browsers to cache it for 60 seconds, so a browser that just used a link may keep redirecting for up to a minute after deletion. Consider a one-line note in the delete dialog.
- **No pagination.** `GET /links` returns at most 1 MB of results per call. Fine for now. Pagination would need a backend change.
- **`404` on delete covers two cases:** the link doesn't exist, or it isn't yours. The UI reports it like any other failure, with the API's message.
- **Signup email limit.** Cognito's built-in email sender allows about 50 emails a day. Fine for dev; production should use SES (infra).

---

## 11. Open decisions
- [x] **shadcn/ui or plain Tailwind?** shadcn/ui.
- [x] **Routing:** React Router.
- [x] **Shortening without logging in?** No. Signed-in users only.
- [x] **Brand / visual direction:** A (Claim ticket) + Instrument Sans (§6).
- [x] **Custom domain?** Deferred. Short links use the API Gateway domain (`VITE_API_URL`). If a separate short domain is added later, the app needs one new setting for it.
- [x] **Dark mode?** Light + dark, following the OS.
- [x] **Tests?** Vitest for the services.
- [x] **After shortening?** Focus the new ticket's Copy button; no auto-copy.
