'use client'
import React from 'react'
import { Box, Typography, Button } from '@mui/material'
import { OpenInNew as ExternalLinkIcon } from '@mui/icons-material'

interface SponsoredSectionProps {
  adHeadline?: string
  callToActionUrl?: string
  cta?: string
}

const SponsoredSection: React.FC<SponsoredSectionProps> = ({
  adHeadline,
  callToActionUrl,
  cta
}) => {
  if (!adHeadline && !callToActionUrl && !cta) {
    return null
  }

  const handleCtaClick = () => {
    // if (callToActionUrl) {
    //   window.open(callToActionUrl, '_blank', 'noopener,noreferrer')
    // }
    if (!callToActionUrl) return

  let url = callToActionUrl.trim()

  // If protocol is missing, add https://
  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`
  }

  window.open(url, '_blank', 'noopener,noreferrer')
  }

  const handleUrlClick = () => {
  if (!callToActionUrl) return

  let url = callToActionUrl.trim()

  // If protocol is missing, add https://
  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`
  }

  window.open(url, '_blank', 'noopener,noreferrer')
}


  return (
    <Box
      sx={{
        mt: 2,
        p: 2,
        borderRadius: 2,
        bgcolor: (theme) => 
          theme.palette.mode === 'light' 
            ? 'rgba(99, 102, 241, 0.04)' 
            : 'rgba(99, 102, 241, 0.08)',
        border: (theme) => 
          `1px solid ${theme.palette.mode === 'light' 
            ? 'rgba(99, 102, 241, 0.15)' 
            : 'rgba(99, 102, 241, 0.2)'}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 2,
        flexWrap: { xs: 'wrap', sm: 'nowrap' }
      }}
    >
      {/* Left side - Headline and URL */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        {adHeadline && (
          <Typography
            variant="body2"
            fontWeight={600}
            sx={{
              mb: 0.5,
              fontSize: { xs: '0.85rem', sm: '0.9rem' },
              color: 'text.primary'
            }}
          >
            {adHeadline}
          </Typography>
        )}
        {callToActionUrl && (
          <Typography
            variant="caption"
            onClick={handleUrlClick}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              color: 'primary.main',
              cursor: 'pointer',
              fontSize: { xs: '0.7rem', sm: '0.75rem' },
              '&:hover': {
                textDecoration: 'underline'
              },
              wordBreak: 'break-all'
            }}
          >
            {callToActionUrl}
            <ExternalLinkIcon sx={{ fontSize: 12 }} />
          </Typography>
        )}
      </Box>

      {/* Right side - CTA Button */}
      {cta && (
        <Button
          variant="contained"
          size="small"
          onClick={handleCtaClick}
          sx={{
            textTransform: 'none',
            fontWeight: 600,
            fontSize: { xs: '0.8rem', sm: '0.875rem' },
            px: { xs: 2, sm: 3 },
            py: { xs: 0.75, sm: 1 },
            borderRadius: 1.5,
            whiteSpace: 'nowrap',
            bgcolor: 'primary.main',
            '&:hover': {
              bgcolor: 'primary.dark'
            },
            boxShadow: '0 2px 8px rgba(99, 102, 241, 0.25)'
          }}
        >
          {cta}
        </Button>
      )}
    </Box>
  )
}

export default SponsoredSection