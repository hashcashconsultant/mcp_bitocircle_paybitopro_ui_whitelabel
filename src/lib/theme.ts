// theme/theme.ts
'use client'
import { createTheme, ThemeOptions, PaletteMode } from '@mui/material/styles'
import { deepmerge } from '@mui/utils'
// White-label brand colors — edit src/config/whitelabel.ts, not this file.
import { WHITELABEL } from '@/config/whitelabel'

// Define custom theme interface
declare module '@mui/material/styles' {
  interface Theme {
    status: {
      danger: string
    }
  }

  interface ThemeOptions {
    status?: {
      danger?: string
    }
  }
}

const BODY_FONT = 'var(--font-body), -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
const DISPLAY_FONT = 'var(--font-display), var(--font-body), -apple-system, "Segoe UI", sans-serif'

/**
 * For pages that build their own MUI theme (legal pages, Finance Hub, KYC): the same options, with the brand
 * fonts and accent color applied on top so they match the rest of the app.
 */
export const createBrandTheme = (options: ThemeOptions) =>
  createTheme(
    deepmerge(options, {
      palette: { secondary: { ...WHITELABEL.colors.secondary } },
      typography: {
        fontFamily: BODY_FONT,
        h1: { fontFamily: DISPLAY_FONT },
        h2: { fontFamily: DISPLAY_FONT },
        h3: { fontFamily: DISPLAY_FONT },
        h4: { fontFamily: DISPLAY_FONT },
        h5: { fontFamily: DISPLAY_FONT },
        h6: { fontFamily: DISPLAY_FONT },
      },
    } as ThemeOptions)
  )

// Create theme based on mode (light or dark)
export const createAppTheme = (mode: PaletteMode) => {
  const themeOptions: ThemeOptions = {
    palette: {
      mode,
      primary: { ...WHITELABEL.colors.primary },
      secondary: { ...WHITELABEL.colors.secondary },
      background: {
        default: WHITELABEL.colors.surface[mode].page,
        paper: WHITELABEL.colors.surface[mode].card,
      },
      text: {
        primary: WHITELABEL.colors.surface[mode].ink,
        secondary: WHITELABEL.colors.surface[mode].muted,
      },
      divider: mode === 'light' ? 'rgba(22, 32, 31, 0.1)' : 'rgba(242, 245, 244, 0.1)',
    },
    typography: {
      // The two font variables are set in src/app/layout.tsx (body text and headings).
      fontFamily: BODY_FONT,
      h1: {
        fontFamily: DISPLAY_FONT,
        fontSize: '2.5rem',
        fontWeight: 700,
        lineHeight: 1.15,
        letterSpacing: '-0.03em',
      },
      h2: {
        fontFamily: DISPLAY_FONT,
        fontSize: '2rem',
        fontWeight: 700,
        lineHeight: 1.2,
        letterSpacing: '-0.025em',
      },
      h3: {
        fontFamily: DISPLAY_FONT,
        fontSize: '1.75rem',
        fontWeight: 700,
        lineHeight: 1.25,
        letterSpacing: '-0.02em',
      },
      h4: {
        fontFamily: DISPLAY_FONT,
        fontSize: '1.5rem',
        fontWeight: 600,
        lineHeight: 1.3,
        letterSpacing: '-0.02em',
      },
      h5: {
        fontFamily: DISPLAY_FONT,
        fontSize: '1.25rem',
        fontWeight: 600,
        lineHeight: 1.4,
        letterSpacing: '-0.015em',
      },
      h6: {
        fontFamily: DISPLAY_FONT,
        fontSize: '1rem',
        fontWeight: 600,
        lineHeight: 1.5,
        letterSpacing: '-0.01em',
      },
      body1: {
        fontSize: '1rem',
        lineHeight: 1.6,
      },
      body2: {
        fontSize: '0.875rem',
        lineHeight: 1.6,
      },
    },
    shape: {
      borderRadius: 12,
    },
    spacing: 8,
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            borderRadius: 999,
            fontWeight: 600,
            fontSize: '0.875rem',
            padding: '8px 16px',
          },
          contained: {
            boxShadow: 'none',
            '&:hover': {
              boxShadow: 'none',
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            boxShadow: 'none',
            border: `1px solid ${mode === 'light' ? 'rgba(22, 32, 31, 0.08)' : 'rgba(242, 245, 244, 0.08)'}`,
            borderRadius: 18,
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            boxShadow: 'none',
            borderBottom: `1px solid ${mode === 'light' ? 'rgba(22, 32, 31, 0.08)' : 'rgba(242, 245, 244, 0.08)'}`,
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 12,
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
        },
      },
    },
    status: {
      danger: WHITELABEL.colors.status.danger,
    },
  }

  return createTheme(themeOptions)
}

// Export default light theme for backwards compatibility
const theme = createAppTheme('light')
export default theme