import React from 'react'
import { WHITELABEL } from '@/config/whitelabel'

interface BrandMarkProps {
  size?: number
}

/** The mark: an open ring with a member joining it. Colors come from the brand config. */
export const BrandMark: React.FC<BrandMarkProps> = ({ size = 32 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
    <path
      d="M38.6 14.1A18 18 0 1 0 42 24"
      stroke={WHITELABEL.colors.primary.main}
      strokeWidth="7"
      strokeLinecap="round"
    />
    <circle cx="39.5" cy="9.5" r="5.5" fill={WHITELABEL.colors.secondary.main} />
  </svg>
)

interface BrandLogoProps {
  /** Height of the mark in px; the wordmark scales with it. */
  size?: number
  /** Wordmark color. Defaults to the surrounding text color. */
  color?: string
  markOnly?: boolean
}

/** Mark + wordmark. Use this wherever the product logo appears. */
const BrandLogo: React.FC<BrandLogoProps> = ({ size = 32, color = 'currentColor', markOnly = false }) => (
  <span
    role="img"
    aria-label={`${WHITELABEL.brandName} logo`}
    style={{ display: 'inline-flex', alignItems: 'center', gap: size * 0.3, lineHeight: 1 }}
  >
    <BrandMark size={size} />
    {!markOnly && (
      <span
        style={{
          fontFamily: 'var(--font-display), system-ui, sans-serif',
          fontWeight: 700,
          fontSize: size * 0.82,
          letterSpacing: '-0.035em',
          color,
        }}
      >
        {WHITELABEL.brandName.toLowerCase()}
      </span>
    )}
  </span>
)

export default BrandLogo
