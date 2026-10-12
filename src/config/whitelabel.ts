/**
 * WHITE-LABEL CONTROL PANEL — set your brand in ONE place.
 *
 * This is the single file most white-labelers edit for identity. It feeds the MUI theme
 * (src/lib/theme.ts), the site SEO/metadata (src/app/layout.tsx), the logo
 * (src/components/brand/BrandLogo.tsx) and the landing page. Fonts are picked in src/app/layout.tsx.
 * Icons live in public/ and src/app (regenerate them with `node scripts/brand-icons.mjs`).
 *
 * THE GOLDEN RULE: change the look, not the wiring. This file is pure brand data — it must never
 * import from the API/service layer, and nothing here changes what the app sends to or stores from
 * the BitoCircle (Bitohub / Monetize) services. (The app still talks to the real BitoCircle backend;
 * only the branding on top is yours.)
 *
 * NOTE: this snapshot ships with the sample brand "Circle" to demonstrate white-labeling. Replace
 * every value below with your own.
 */

export const WHITELABEL = {
  // --- Identity -------------------------------------------------------------
  brandName: 'Circle',
  brandAlias: 'circle', // short slug (handles / storage-key prefixes if you need one)
  tagline: 'Where crypto people gather',
  description:
    'Circle is a community for crypto builders, creators and investors. Share what you know, follow the people who move markets, and earn from your audience.',
  keywords: ['Circle', 'Crypto community', 'Social finance', 'Creators', 'Finance Hub'],

  // --- Your production domain (SEO metadataBase + canonical/OpenGraph URLs) --
  // Set this to the domain you deploy on.
  siteUrl: 'https://circle.paybito.com',

  // --- Sign-in (PayBito account) ---------------------------------------------
  // The app name shown on the PayBito sign-in page ("Sign in to continue to <name>").
  // On a domain outside paybito.com keep this as 'BitoCircle': for any other name the sign-in page sends an
  // already signed-in visitor back without the sign-in data, which only *.paybito.com hosts can pick up
  // from the shared cookies.
  ssoAppName: 'Circle',

  // --- Social / support -----------------------------------------------------
  twitterHandle: '',
  supportEmail: 'support@circle.example.com',
  ogImage: '/og-image.png',

  // --- Brand colors (MUI palette). Swap for your palette. -------------------
  colors: {
    primary: { main: '#0d9488', light: '#2dd4bf', dark: '#0f766e', contrastText: '#ffffff' },
    secondary: { main: '#f97066', light: '#fda29b', dark: '#e04f45', contrastText: '#ffffff' },
    status: { danger: '#e5484d' },
    // Page and card backgrounds per mode.
    surface: {
      light: { page: '#f5f3ee', card: '#ffffff', ink: '#16201f', muted: '#5f6b69' },
      dark: { page: '#0b1211', card: '#121b1a', ink: '#f2f5f4', muted: '#9aa8a5' },
    },
  },
} as const;

/** PayBito sign-in / sign-up links that return to this deployment. */
export const ssoUrl = (kind: 'signin' | 'signup', origin?: string): string => {
  const back = origin || (typeof window !== 'undefined' ? window.location.origin : WHITELABEL.siteUrl);
  return `https://myaccount.paybito.com/${kind}?continue=${back}&app=${encodeURIComponent(WHITELABEL.ssoAppName)}`;
};

export default WHITELABEL;
