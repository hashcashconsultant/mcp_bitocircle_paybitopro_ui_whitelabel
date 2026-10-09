/**
 * WHITE-LABEL CONTROL PANEL — set your brand in ONE place.
 *
 * This is the single file most white-labelers edit for identity. It feeds the MUI theme
 * (src/lib/theme.ts), the site SEO/metadata (src/app/layout.tsx), and the on-screen wordmark in the
 * top navigation + login screen. Logos are image files you swap in src/app/Assets/img and public/
 * (see README → "What to customize").
 *
 * THE GOLDEN RULE: change the look, not the wiring. This file is pure brand data — it must never
 * import from the API/service layer, and nothing here changes what the app sends to or stores from
 * the BitoCircle (Bitohub / Monetize) services. (The app still talks to the real BitoCircle backend;
 * only the branding on top is yours.)
 *
 * NOTE: this snapshot ships with the sample brand "Circlo" to demonstrate white-labeling. Replace
 * every value below with your own.
 */

export const WHITELABEL = {
  // --- Identity -------------------------------------------------------------
  brandName: 'Circlo',
  brandAlias: 'circlo', // short slug (handles / storage-key prefixes if you need one)
  tagline: 'Social Finance Community',
  description:
    'Connect, create, and earn with Circlo — a modern social finance community platform',
  keywords: ['Circlo', 'Social Finance', 'Creator', 'Community', 'Finance Hub'],

  // --- Your production domain (SEO metadataBase + canonical/OpenGraph URLs) --
  // Set this to the domain you deploy on.
  siteUrl: 'https://circlo.example.com',

  // --- Social / support -----------------------------------------------------
  twitterHandle: '@circlo',
  supportEmail: 'support@circlo.example.com',
  ogImage: '/og-image.jpg',

  // --- Brand colors (MUI palette). Swap for your palette. -------------------
  colors: {
    primary: { main: '#7c3aed', light: '#a78bfa', dark: '#5b21b6', contrastText: '#ffffff' },
    secondary: { main: '#dc004e', light: '#f5325b', dark: '#9a0036', contrastText: '#ffffff' },
    status: { danger: '#e53e3e' },
  },
} as const;

export default WHITELABEL;
