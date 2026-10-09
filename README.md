# BitoCircle White-Label Community App

A complete, already-wired **BitoCircle** community app you **clone, re-skin, and deploy on your own
domain**. It is the end-user social + creator-commerce experience — feeds, posts, reels, stories,
messaging, channels, livestreams, profiles, a finance hub, and a creator storefront — talking to the
live BitoCircle (Bitohub + Monetize) APIs in the background.

> **The golden rule: change the look, not the wiring.** Everything that talks to the API — auth,
> the service layer, the data flows — is already correct. You customize **branding and presentation**
> only. Editing the wiring is how white-label builds break.

**Stack:** Next.js 15 (App Router) · React 19 · TypeScript · MUI 7. Dev/prod port **3043**.

---

## Quick start

```bash
# 1. clone this repo, then:
cp .env.example .env.local        # fill in your own PayPal client id (optional for local)
npm install
npm run dev                       # http://localhost:3043  — run it UNMODIFIED first
```

Confirm it runs and signs in against the live APIs **before** you change anything. Then re-skin.

```bash
npm run build && npm start        # production build, also on port 3043
```

---

## How it talks to BitoCircle (do not change)

The app calls two live services (see `src/utils/apiHosts.ts`):

| Service | Base URL | What |
|---|---|---|
| **Bitohub** | `https://institutional-bo.paybito.com:8443/BitohubService` | social: feeds, posts, reels, stories, messaging, channels, livestreams, profiles, notifications, API keys, OAuth, community domains |
| **Monetize** | `https://institutional-bo.paybito.com:8443/MonetizeService` | creator commerce: shops, products, orders, payouts, shipping, tax, fan subscriptions, gifts & badges, ad revenue, brand collabs |

**Auth — three ways, all already wired** (the app uses the first; the other two are what the
`/api/api-key` and `/api/developer-portal` docs describe):

1. **White-label / app user token** *(what this app sends)* — `Authorization: Bearer <JWT>` **plus** a
   `uuid` header, for any URL under the two services above. See `src/utils/apiHosts.ts`
   (`isOwnApi`), `src/utils/apiAuth.ts`, `src/utils/fetchWithAuth.ts`, `src/contexts/AuthContext.tsx`.
2. **API key + secret** — `X-MBX-APIKEY: base64(apiKey:secret)` (keys minted in Settings → API Keys).
3. **Developer-portal OAuth** — `Bearer <access_token>` + `X-CLIENT-ID` + a per-endpoint
   `bitocircle.*` scope (apps like BitoCircle-Insights).

**Local backend testing:** set `NEXT_PUBLIC_BITOHUB_API_URL` / `NEXT_PUBLIC_MONETIZE_API_URL` in
`.env.local` to redirect the two services to a local server. Leave unset in production.

---

## What to customize (the look)

**Start here:** **`src/config/whitelabel.ts`** is the single brand-control file — set your name,
tagline, description, keywords, production domain, social handle, support email, and primary/secondary
colors in ONE place. The theme (`src/lib/theme.ts`), the site metadata (`src/app/layout.tsx`), and the
**on-screen wordmark** in the top navigation + login screen all read from it, so most re-branding is
this one file + swapping the logo images.

> This snapshot ships with the sample brand **"Circlo"** (violet theme) to demonstrate white-labeling
> — change it in `whitelabel.ts`. The header and login wordmarks render as **text** from the config,
> so they rebrand automatically. A few inner surfaces still use **logo PNGs** (the login feature
> illustration and the Finance Hub / Terms headers, from `src/app/Assets/img/`) — swap those image
> files to finish the rebrand.

| You want to change | Edit | Notes |
|---|---|---|
| **Brand name, tagline, colors, domain, SEO** | **`src/config/whitelabel.ts`** | the one-stop control; feeds theme + metadata |
| Deeper theme (typography, radius, component styles) | `src/lib/theme.ts` (`createAppTheme`) | colors already come from `whitelabel.ts`; tweak the rest here |
| Logos & wordmark | `src/app/Assets/img/` (e.g. `bitoHubLogo.png`, `bitoHubTextLogo.png`) | swap the files, keep the names, or update the imports |
| App icons / favicons / PWA | `public/` | replace the icon set + `manifest.json` |
| Open Graph preview image | `public/og-image.jpg` | referenced by `whitelabel.ts` → `ogImage` |
| Per-community branding at runtime | `src/contexts/BrokerContext.tsx` | company name / referral / logo resolved per community |
| PayPal checkout | `.env.local` → `NEXT_PUBLIC_PAYPAL_CLIENT_ID` | your own PayPal app's public client id |

## What NOT to touch (the wiring)

`src/services/CoreDataService.js` · `src/utils/apiHosts.ts` · `src/utils/apiAuth.ts` ·
`src/utils/fetchWithAuth.ts` · `src/contexts/AuthContext.tsx` · the sign-in / OTP / authorize flow
(`src/app/login`, `src/app/authorize`) · the feature page handlers and their API call order. Changing
these changes what the app sends to or stores from the API — that is how a white-label build breaks.

> Ask yourself: *"does this change what the app sends to, or stores from, the API?"* If yes, it is
> wiring — leave it. If it is only pixels, copy, or which screens show — it is yours.

---

## Serving on your own domain

Deploy the production build (`npm run build && npm start`, or any Next.js host) on your community's
own domain, then register that domain in the app's **Settings → Community Domains** (which calls the
Bitohub `/domains` add + verify endpoints) so the API accepts your Origin.

> `src/middleware.ts` carries a `bitocircle.com → www.bitocircle.com` redirect used by the mothership
> only; it is inert on any other host, so it does not affect your domain. Remove it if you prefer.

---

## Keeping up with upstream

This is a fresh snapshot. To pull later fixes, add the upstream remote and merge:

```bash
git remote add upstream <this repo's URL>
git fetch upstream && git merge upstream/main
```
