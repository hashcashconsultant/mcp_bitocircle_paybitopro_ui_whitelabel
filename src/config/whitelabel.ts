/**
 * WHITE-LABEL CONTROL PANEL — set your brand in ONE place.
 *
 * This is the single file most white-labelers edit for identity. It feeds the MUI theme
 * (src/lib/theme.ts) and the site SEO/metadata (src/app/layout.tsx). Logos are image files you
 * swap in src/app/Assets/img and public/ (see README → "What to customize").
 *
 * THE GOLDEN RULE: change the look, not the wiring. This file is pure brand data — it must never
 * import from the API/service layer, and nothing here changes what the app sends to or stores from
 * the BitoCircle (Bitohub / Monetize) services.
 */

export const WHITELABEL = {
  // --- Identity -------------------------------------------------------------
  brandName: 'BitoCircle',
  brandAlias: 'bitocircle', // short slug (handles / storage-key prefixes if you need one)
  tagline: 'Social Finance Platform',
  description:
    'Connect, trade, and grow with BitoCircle - A modern social finance platform',
  keywords: ['BitoCircle', 'Social Finance', 'Cryptocurrency', 'Trading', 'Finance Hub'],

  // --- Your production domain (SEO metadataBase + canonical/OpenGraph URLs) --
  siteUrl: 'https://www.bitocircle.com',

  // --- Social / support -----------------------------------------------------
  twitterHandle: '@bitohub',
  supportEmail: 'support@bitocircle.com',
  ogImage: '/og-image.jpg',

  // --- Brand colors (MUI palette). Swap for your palette. -------------------
  colors: {
    primary: { main: '#1e40af', light: '#42a5f5', dark: '#1e40af', contrastText: '#ffffff' },
    secondary: { main: '#dc004e', light: '#f5325b', dark: '#9a0036', contrastText: '#ffffff' },
    status: { danger: '#e53e3e' },
  },
} as const;

export default WHITELABEL;
