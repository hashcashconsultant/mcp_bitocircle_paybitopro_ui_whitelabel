// Regenerates every app icon and the share image from the brand colors below.
// Run after changing the brand:  node scripts/brand-icons.mjs
// Keep the colors and the mark in step with src/config/whitelabel.ts and src/components/brand/BrandLogo.tsx.
import sharp from 'sharp'
import { writeFileSync } from 'node:fs'

const BRAND = 'circle'
const PRIMARY = '#0d9488'
const ACCENT = '#f97066'
const INK = '#0b1211'
const TEXT = '#f2f5f4'

const mark = (x, y, size) => `
  <g transform="translate(${x} ${y}) scale(${size / 48})">
    <path d="M38.6 14.1A18 18 0 1 0 42 24" stroke="${PRIMARY}" stroke-width="7" stroke-linecap="round" fill="none"/>
    <circle cx="39.5" cy="9.5" r="5.5" fill="${ACCENT}"/>
  </g>`

// Square icon: the mark on the dark brand background, with rounded corners.
const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="112" fill="${INK}"/>${mark(96, 96, 320)}
</svg>`

const shareSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="${INK}"/>
  <circle cx="1040" cy="-40" r="380" fill="${PRIMARY}" opacity="0.22"/>
  <circle cx="60" cy="700" r="300" fill="${ACCENT}" opacity="0.12"/>
  ${mark(100, 215, 200)}
  <text x="340" y="372" font-family="Segoe UI, Helvetica, Arial, sans-serif" font-weight="700" font-size="170"
        letter-spacing="-6" fill="${TEXT}">${BRAND}</text>
</svg>`

const png = (size) => sharp(Buffer.from(iconSvg)).resize(size, size).png().toBuffer()

// An .ico file that holds one PNG image.
const ico = (image, size) => {
  const header = Buffer.alloc(22)
  header.writeUInt16LE(0, 0)
  header.writeUInt16LE(1, 2)
  header.writeUInt16LE(1, 4)
  header.writeUInt8(size === 256 ? 0 : size, 6)
  header.writeUInt8(size === 256 ? 0 : size, 7)
  header.writeUInt16LE(1, 10)
  header.writeUInt16LE(32, 12)
  header.writeUInt32LE(image.length, 14)
  header.writeUInt32LE(22, 18)
  return Buffer.concat([header, image])
}

const sizes = {
  'android-icon-36x36.png': 36, 'android-icon-48x48.png': 48, 'android-icon-72x72.png': 72,
  'android-icon-96x96.png': 96, 'android-icon-144x144.png': 144, 'android-icon-192x192.png': 192,
  'apple-icon-57x57.png': 57, 'apple-icon-60x60.png': 60, 'apple-icon-72x72.png': 72,
  'apple-icon-76x76.png': 76, 'apple-icon-114x114.png': 114, 'apple-icon-120x120.png': 120,
  'apple-icon-144x144.png': 144, 'apple-icon-152x152.png': 152, 'apple-icon-180x180.png': 180,
  'apple-icon-precomposed.png': 192, 'favicon-16x16.png': 16, 'favicon-32x32.png': 32,
  'favicon-96x96.png': 96, 'ms-icon-70x70.png': 70, 'ms-icon-144x144.png': 144,
  'ms-icon-150x150.png': 150, 'ms-icon-310x310.png': 310,
}

for (const [name, size] of Object.entries(sizes)) {
  const image = await png(size)
  writeFileSync(`public/${name}`, image)
  writeFileSync(`src/app/${name}`, image)
}
writeFileSync('public/apple-icon.png', await png(192))
writeFileSync('public/logo.png', await png(512))
writeFileSync('src/app/favicon.ico', ico(await png(48), 48))
writeFileSync('public/og-image.png', await sharp(Buffer.from(shareSvg)).png().toBuffer())
writeFileSync('public/og-default.png', await sharp(Buffer.from(shareSvg)).png().toBuffer())
console.log('icons written')
