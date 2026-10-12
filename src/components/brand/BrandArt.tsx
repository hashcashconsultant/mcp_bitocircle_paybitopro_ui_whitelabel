import React from 'react'
import { WHITELABEL } from '@/config/whitelabel'

const { primary, secondary } = WHITELABEL.colors

const VARIANTS: Record<string, { from: string; to: string; rings: [number, number][] }> = {
  'who-we-are': { from: primary.dark, to: '#0b1211', rings: [[30, 46], [62, 58], [48, 30]] },
  'our-mission': { from: '#16201f', to: primary.main, rings: [[70, 40], [38, 62], [55, 52]] },
  'our-vission': { from: '#3d1f1c', to: primary.dark, rings: [[42, 42], [66, 60], [28, 68]] },
}

interface BrandArtProps {
  variant?: string
}

/**
 * Brand illustration drawn in code (overlapping circles), used where a photo would otherwise go.
 * Replace with your own imagery if you have it.
 */
const BrandArt: React.FC<BrandArtProps> = ({ variant = 'who-we-are' }) => {
  const v = VARIANTS[variant] || VARIANTS['who-we-are']
  return (
    <svg
      viewBox="0 0 100 75"
      preserveAspectRatio="xMidYMid slice"
      width="100%"
      height="100%"
      role="img"
      aria-label={`${WHITELABEL.brandName} illustration`}
      style={{ display: 'block' }}
    >
      <defs>
        <linearGradient id={`art-${variant}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={v.from} />
          <stop offset="1" stopColor={v.to} />
        </linearGradient>
      </defs>
      <rect width="100" height="75" fill={`url(#art-${variant})`} />
      {v.rings.map(([cx, cy], i) => (
        <g key={i}>
          <circle cx={cx} cy={cy} r={22 - i * 4} fill="none" stroke={primary.light} strokeOpacity={0.35} strokeWidth="0.6" />
          <circle cx={cx} cy={cy} r={12 - i * 2} fill="none" stroke="#ffffff" strokeOpacity={0.18} strokeWidth="0.6" />
          <circle cx={cx + 12 - i * 2} cy={cy} r={1.8} fill={i === 0 ? secondary.main : primary.light} />
        </g>
      ))}
    </svg>
  )
}

export default BrandArt
