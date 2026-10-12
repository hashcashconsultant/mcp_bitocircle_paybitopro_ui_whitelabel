# BitoCircle White-Label Community App

A complete, already-wired **BitoCircle** community app you **clone, re-skin, and deploy on your own
domain**. It's the full end-user experience — social feed, posts, reels, stories, messaging, channels,
livestreams, profiles, a finance hub, and a creator storefront — talking to the live BitoCircle
(**Bitohub** + **Monetize**) APIs in the background. Make it yours by changing branding and
presentation only; the integration is done.

> ### The golden rule: change the look, not the wiring.
> Auth, the service layer, and the data flows are already correct. You customize **branding and
> presentation**. Editing the wiring is how white-label builds break.

**Stack:** Next.js 15 (App Router) · React 19 · TypeScript · MUI 7 · default port **3043**.

This snapshot ships pre-branded as a sample community, **"Circle"** (teal and coral on dark ink, its own logo, fonts and landing page), purely to
demonstrate white-labeling — replace it with your own brand (see [Customize](#customize-the-look)).

---

## Contents
- [Prerequisites](#prerequisites)
- [Quick start](#quick-start)
- [Customize the look](#customize-the-look)
- [What not to touch](#what-not-to-touch-the-wiring)
- [How it talks to BitoCircle](#how-it-talks-to-bitocircle)
- [Deploy to production](#deploy-to-production)
- [Serving on your own domain](#serving-on-your-own-domain)
- [Project structure](#project-structure)
- [Staying up to date](#staying-up-to-date)

---

## Prerequisites

- **Node.js 18+** (20 LTS recommended) and npm
- A BitoCircle account / community to sign in against (the app calls the live BitoCircle APIs)

## Quick start

```bash
git clone https://github.com/hashcashconsultant/mcp_bitocircle_paybitopro_ui_whitelabel.git
cd mcp_bitocircle_paybitopro_ui_whitelabel

cp .env.example .env.local     # set your own PayPal client id (optional for local dev)
npm install
npm run dev                    # http://localhost:3043  — run it UNMODIFIED first
```

Confirm it runs and signs in against the live APIs **before** you change anything, then re-skin.

---

## Customize the look

**Start here → [`src/config/whitelabel.ts`](src/config/whitelabel.ts)** — the single brand-control
file. Set your name, tagline, description, keywords, production domain, social handle, support email,
and primary/secondary colors in ONE place. The theme (`src/lib/theme.ts`), the site metadata
(`src/app/layout.tsx`), and the **on-screen wordmark** (top navigation + login) all read from it, so
most re-branding is this one file plus swapping the logo images.

| You want to change | Edit | Notes |
|---|---|---|
| **Brand name, tagline, colors, domain, SEO** | **`src/config/whitelabel.ts`** | the one-stop control; feeds theme + metadata + wordmark |
| Deeper theme (typography, radius, components) | `src/lib/theme.ts` (`createAppTheme`) | colors already come from `whitelabel.ts`; tweak the rest here |
| Logo (mark + wordmark) | `src/components/brand/BrandLogo.tsx` | drawn in code from the brand name and colors; replace the SVG mark with yours |
| Fonts | `src/app/layout.tsx` | two `next/font` fonts (body and headings) exposed as `--font-body` and `--font-display` |
| Landing / sign-in page | `src/components/BitoConnectLogin.tsx` | headline, feature list and the product preview |
| Name on the PayBito sign-in page | `src/config/whitelabel.ts → ssoAppName` | read the note there before changing it on a domain outside paybito.com |
| App icons / favicons / PWA | `node scripts/brand-icons.mjs` | regenerates every icon and the share image from the mark and colors in that script |
| Open Graph preview image | `public/og-image.png` | referenced by `whitelabel.ts → ogImage` |
| Per-community branding at runtime | `src/contexts/BrokerContext.tsx` | company name / referral / logo resolved per community |
| PayPal checkout | `.env.local → NEXT_PUBLIC_PAYPAL_CLIENT_ID` | your own PayPal app's public client id |

> Every logo in the app is the `BrandLogo` component and every illustration is drawn in code
> (`src/components/brand/`), so no BitoCircle artwork ships with the template. On-screen wording uses
> the sample name "Circle"; search the `src` folder for it when you rename.

## What not to touch (the wiring)

`src/services/CoreDataService.js` · `src/utils/apiHosts.ts` · `src/utils/apiAuth.ts` ·
`src/utils/fetchWithAuth.ts` · `src/contexts/AuthContext.tsx` · the sign-in / OTP / authorize flow
(`src/app/login`, `src/app/authorize`) · the feature page handlers and their API call order.

> Ask yourself: *"does this change what the app sends to, or stores from, the API?"* If yes, it's
> wiring — leave it. If it's only pixels, copy, or which screens show — it's yours.

---

## How it talks to BitoCircle

The app calls two live services (configured in `src/utils/apiHosts.ts`):

| Service | Base URL | What |
|---|---|---|
| **Bitohub** | `https://institutional-bo.paybito.com:8443/BitohubService` | social: feeds, posts, reels, stories, messaging, channels, livestreams, profiles, notifications, API keys, OAuth, community domains |
| **Monetize** | `https://institutional-bo.paybito.com:8443/MonetizeService` | creator commerce: shops, products, orders, payouts, shipping, tax, fan subscriptions, gifts & badges, ad revenue, brand collabs |

**Auth — three ways, all already wired.** This app uses the first; the other two are what BitoCircle's
API-key and developer-portal docs describe:

1. **White-label / app user token** *(what this app sends)* — `Authorization: Bearer <JWT>` **plus** a
   `uuid` header, on every call to the two services.
2. **API key + secret** — `X-MBX-APIKEY: base64(apiKey:secret)` (keys minted in Settings → API Keys).
3. **Developer-portal OAuth** — `Bearer <access_token>` + `X-CLIENT-ID` + a per-endpoint
   `bitocircle.*` scope.

**Local backend testing:** set `NEXT_PUBLIC_BITOHUB_API_URL` / `NEXT_PUBLIC_MONETIZE_API_URL` in
`.env.local` to point the two services at a local server. Leave them unset in production.

---

## Deploy to production

This is a **server-rendered Next.js app** (it has SSR, API routes under `src/app/api/*`, and
`middleware.ts`) — **not** a static site. It runs as a Node process; you cannot serve it as static
files.

```bash
npm ci
npm run build      # outputs to .next/   (there is no dist/ — do not look for one)
npm start          # runs `next start -p 3043`
```

- There is **no `server.js` / `index.js`** — `npm start` *is* the server. Keep it alive with **pm2**
  or **systemd** (point it at `npm start`, or `npx next start -p <port>` for a different port).
- Put a reverse proxy (nginx / Caddy) in front: `your-domain` → `http://localhost:3043`.
- No database and no server-side secrets are required to run; the API hosts are built in.

## Serving on your own domain

Once it's live on your domain, register that domain in **Settings → Community Domains** (which calls
the Bitohub `/domains` add + verify endpoints) so the API accepts your Origin.

> `src/middleware.ts` carries a `bitocircle.com → www.bitocircle.com` redirect used by the mothership
> only; it's inert on any other host, so it won't affect your domain. Remove it if you prefer.

---

## Project structure

```
src/
  app/          Next.js App Router — pages, layouts, and the /api route handlers
  components/   UI components (feed, reels, messaging, finance hub, settings, …)
  config/       whitelabel.ts  ← your brand control panel
  contexts/     React contexts (Auth, Broker branding, Theme, Messaging, …)
  services/     CoreDataService.js + feature services (the API layer — wiring)
  utils/        apiHosts / apiAuth / fetchWithAuth (auth + host rules — wiring)
  lib/          theme.ts (MUI theme), seo.ts
  middleware.ts
public/         icons, favicons, manifest, og-image
```

## Staying up to date

This is a fresh snapshot. To pull later upstream fixes:

```bash
git remote add upstream https://github.com/hashcashconsultant/mcp_bitocircle_paybitopro_ui_whitelabel.git
git fetch upstream && git merge upstream/main
```

---

*Part of the PayBito / BitoCircle developer ecosystem. The BitoCircle APIs are documented by the
[`paybito-mcp`](https://pypi.org/project/paybito-mcp/) knowledge server (PyPI / npm), which also
points developers to this white-label template.*
