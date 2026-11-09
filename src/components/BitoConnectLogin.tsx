'use client';
import React, { useState, useEffect } from 'react';
import { Box, Container, Typography, Button, Link, Menu, MenuItem, CircularProgress } from '@mui/material';
import {
  ArrowForward,
  KeyboardArrowDown,
  FavoriteBorder,
  ChatBubbleOutline,
  DynamicFeedOutlined,
  AccountBalanceWalletOutlined,
  PaidOutlined,
  ForumOutlined,
} from '@mui/icons-material';
import { WHITELABEL, ssoUrl } from '@/config/whitelabel';
import BrandLogo from '@/components/brand/BrandLogo';
import { tokenCookie, restoreSessionFromCookies } from '../hooks/useAuthRedirect';

const { primary, secondary, surface } = WHITELABEL.colors;
const INK = surface.dark.page;
const CARD = surface.dark.card;
const TEXT = surface.dark.ink;
const MUTED = surface.dark.muted;
const LINE = 'rgba(242, 245, 244, 0.1)';
const DISPLAY = 'var(--font-display), var(--font-body), system-ui, sans-serif';

const FEATURES = [
  {
    icon: <DynamicFeedOutlined />,
    title: 'Feed, reels and live',
    text: 'Post analysis, short videos and polls, or go live when the market moves.',
  },
  {
    icon: <AccountBalanceWalletOutlined />,
    title: 'Finance Hub',
    text: 'Buy and swap crypto, pay and get paid, and create tokens and NFTs.',
  },
  {
    icon: <PaidOutlined />,
    title: 'Earn from your audience',
    text: 'Subscriptions, tips, paid collaborations and your own storefront.',
  },
  {
    icon: <ForumOutlined />,
    title: 'Messages and groups',
    text: 'Private chats and group rooms with the people you follow.',
  },
];

const FOOTER_LINKS = [
  { label: 'About', href: '/about' },
  { label: 'Terms', href: '/terms' },
  { label: 'Privacy', href: '/privacy-policy' },
  { label: 'EULA', href: '/eula' },
  { label: 'Community policy', href: '/community' },
];

const MARKETPLACES = [
  { label: 'App Store', url: 'https://apps.paybito.com/' },
  { label: 'Token Marketplace', url: 'https://www.bitocircle.com/token-marketplace/' },
  { label: 'Crypto Commerce', url: 'https://www.bitocircle.com/crypto-commerce/' },
  { label: 'TeamUps', url: 'https://teamups.paybito.com/' },
];

const Avatar = ({ initials, color }: { initials: string; color: string }) => (
  <Box
    sx={{
      width: 40,
      height: 40,
      borderRadius: '50%',
      bgcolor: color,
      color: INK,
      display: 'grid',
      placeItems: 'center',
      fontWeight: 700,
      fontSize: '0.85rem',
      flexShrink: 0,
    }}
  >
    {initials}
  </Box>
);

/** The product preview on the right of the hero, drawn in code so it carries this brand only. */
const Preview = () => (
  <Box sx={{ position: 'relative', width: '100%', maxWidth: 460, mx: 'auto', py: { xs: 2, md: 4 } }}>
    {/* rings behind the cards */}
    <Box
      aria-hidden
      sx={{
        position: 'absolute',
        inset: { xs: '-6% -10%', md: '-10% -18%' },
        borderRadius: '50%',
        border: `1px solid ${LINE}`,
        '&::after': {
          content: '""',
          position: 'absolute',
          inset: '14%',
          borderRadius: '50%',
          border: `1px dashed rgba(45, 212, 191, 0.25)`,
        },
      }}
    />

    {/* post */}
    <Box
      sx={{
        position: 'relative',
        bgcolor: CARD,
        border: `1px solid ${LINE}`,
        borderRadius: '22px',
        p: 2.5,
        transform: { md: 'rotate(-2deg)' },
      }}
    >
      <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', mb: 1.5 }}>
        <Avatar initials="MK" color={primary.light} />
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ color: TEXT, fontWeight: 600, fontSize: '0.95rem', lineHeight: 1.2 }}>Maya Koh</Typography>
          <Typography sx={{ color: MUTED, fontSize: '0.78rem' }}>@mayatrades · 12 min</Typography>
        </Box>
        <Box
          sx={{
            ml: 'auto',
            px: 1.25,
            py: 0.4,
            borderRadius: 999,
            border: `1px solid ${primary.light}`,
            color: primary.light,
            fontSize: '0.75rem',
            fontWeight: 600,
          }}
        >
          Follow
        </Box>
      </Box>
      <Typography sx={{ color: TEXT, fontSize: '0.95rem', lineHeight: 1.55, mb: 2 }}>
        ETH held the range for the third week. Here is the level I am watching before I add.
      </Typography>
      <Box sx={{ borderRadius: '14px', bgcolor: 'rgba(45, 212, 191, 0.06)', border: `1px solid ${LINE}`, p: 1.5 }}>
        <svg viewBox="0 0 320 90" width="100%" height="90" aria-hidden="true">
          <path
            d="M0 70 L30 62 L60 66 L90 48 L120 54 L150 36 L180 42 L210 26 L240 32 L270 16 L320 10"
            fill="none"
            stroke={primary.light}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M0 58 H320" stroke={secondary.main} strokeWidth="1" strokeDasharray="4 6" opacity="0.7" />
          <circle cx="320" cy="10" r="4" fill={primary.light} />
        </svg>
      </Box>
      <Box sx={{ display: 'flex', gap: 2.5, mt: 1.75, color: MUTED, fontSize: '0.8rem', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', gap: 0.6, alignItems: 'center' }}>
          <FavoriteBorder sx={{ fontSize: 18 }} /> 1.2k
        </Box>
        <Box sx={{ display: 'flex', gap: 0.6, alignItems: 'center' }}>
          <ChatBubbleOutline sx={{ fontSize: 17 }} /> 184
        </Box>
      </Box>
    </Box>

    {/* earnings */}
    <Box
      sx={{
        position: 'relative',
        ml: 'auto',
        mt: -3,
        mr: { xs: 0, md: -3 },
        width: 230,
        bgcolor: primary.dark,
        borderRadius: '20px',
        p: 2,
        transform: { md: 'rotate(3deg)' },
        boxShadow: '0 24px 60px rgba(0, 0, 0, 0.45)',
      }}
    >
      <Typography sx={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.75rem', fontWeight: 500 }}>
        Earned this week
      </Typography>
      <Typography sx={{ color: '#fff', fontFamily: DISPLAY, fontWeight: 700, fontSize: '1.7rem', lineHeight: 1.2 }}>
        $1,284.50
      </Typography>
      <Typography sx={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.75rem' }}>
        Subscriptions, tips and 2 brand deals
      </Typography>
    </Box>

    {/* live chip */}
    <Box
      sx={{
        position: 'absolute',
        top: { xs: 0, md: 8 },
        right: { xs: 8, md: -8 },
        display: 'flex',
        alignItems: 'center',
        gap: 0.75,
        bgcolor: secondary.main,
        color: '#fff',
        px: 1.5,
        py: 0.6,
        borderRadius: 999,
        fontSize: '0.78rem',
        fontWeight: 700,
      }}
    >
      <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: '#fff' }} /> Live · 320 watching
    </Box>
  </Box>
);

const BitoConnectLogin = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [links, setLinks] = useState({ signin: ssoUrl('signin', WHITELABEL.siteUrl), signup: ssoUrl('signup', WHITELABEL.siteUrl) });

  // After sign-in on the PayBito account site, come back to THIS deployment's own origin.
  useEffect(() => {
    setLinks({ signin: ssoUrl('signin'), signup: ssoUrl('signup') });
  }, []);

  // Check for an existing valid session on mount
  useEffect(() => {
    const checkAuthentication = async () => {
      const storedAccessToken = tokenCookie.get();

      // A token alone is not a session here: the app also needs the broker id, user id and uuid. Without them
      // the feed sends the visitor straight back to this page, so stay here and let them sign in.
      if (!storedAccessToken || !restoreSessionFromCookies()) {
        setIsCheckingAuth(false);
        return;
      }

      try {
        const response = await fetch(
          `https://institutional-bo.paybito.com:8443/BrokerAdminApi/admin/getBrokerDetails?brokerId=${localStorage.getItem('brokerId')}`,
          {
            method: 'GET',
            headers: {
              authorization: `bearer ${storedAccessToken}`,
            },
          }
        );

        // This API answers 200 even when it fails, with the failure in the body.
        const body = response.ok ? await response.json().catch(() => null) : null;
        if (body && (!body.error || body.error.error_data === 0)) {
          // Token is valid — go to the feed on THIS (white-label) domain.
          window.location.href = '/feeds';
          return;
        }

        setIsCheckingAuth(false);
      } catch (error) {
        console.error('Authentication check failed:', error);
        setIsCheckingAuth(false);
      }
    };

    checkAuthentication();
  }, []);

  if (isCheckingAuth) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: INK,
          flexDirection: 'column',
          gap: 2,
        }}
      >
        <CircularProgress size={40} sx={{ color: primary.light }} />
        <Typography sx={{ color: MUTED, fontSize: '0.95rem' }}>Checking your sign-in...</Typography>
      </Box>
    );
  }

  const pill = {
    borderRadius: 999,
    textTransform: 'none' as const,
    fontWeight: 600,
    fontSize: '0.95rem',
    px: 3,
    py: 1.2,
    boxShadow: 'none',
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: INK,
        color: TEXT,
        display: 'flex',
        flexDirection: 'column',
        backgroundImage: `radial-gradient(900px 480px at 85% -10%, rgba(13, 148, 136, 0.28), transparent 60%), radial-gradient(700px 420px at -10% 110%, rgba(249, 112, 102, 0.14), transparent 60%)`,
      }}
    >
      {/* Top bar */}
      <Container maxWidth="lg" sx={{ py: 2.5, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Link href="/" underline="none" sx={{ color: TEXT, display: 'flex' }}>
          <BrandLogo size={34} />
        </Link>
        <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1.5 } }}>
          <Button href="/about" sx={{ ...pill, px: 1.5, color: MUTED, display: { xs: 'none', sm: 'inline-flex' }, '&:hover': { color: TEXT, bgcolor: 'transparent' } }}>
            About
          </Button>
          <Button href={links.signin} sx={{ ...pill, px: 2, color: TEXT, '&:hover': { bgcolor: 'rgba(242,245,244,0.06)' } }}>
            Sign in
          </Button>
          <Button
            href={links.signup}
            sx={{ ...pill, py: 0.9, bgcolor: TEXT, color: INK, display: { xs: 'none', sm: 'inline-flex' }, '&:hover': { bgcolor: '#ffffff' } }}
          >
            Create account
          </Button>
        </Box>
      </Container>

      {/* Hero */}
      <Container maxWidth="lg" sx={{ flex: 1, display: 'flex', alignItems: 'center', py: { xs: 4, md: 6 } }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1.1fr 0.9fr' },
            gap: { xs: 6, md: 8 },
            alignItems: 'center',
            width: '100%',
          }}
        >
          <Box>
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 1,
                px: 1.5,
                py: 0.6,
                mb: 3,
                borderRadius: 999,
                border: `1px solid ${LINE}`,
                color: primary.light,
                fontSize: '0.8rem',
                fontWeight: 600,
                letterSpacing: '0.02em',
              }}
            >
              <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: secondary.main }} />
              {WHITELABEL.tagline}
            </Box>
            <Typography
              component="h1"
              sx={{
                fontFamily: DISPLAY,
                fontWeight: 700,
                fontSize: { xs: '2.6rem', sm: '3.4rem', md: '4.1rem' },
                lineHeight: 1.02,
                letterSpacing: '-0.04em',
                color: TEXT,
                mb: 3,
              }}
            >
              Your people.
              <br />
              Your market.
              <br />
              <Box component="span" sx={{ color: primary.light }}>
                One circle.
              </Box>
            </Typography>
            <Typography sx={{ color: MUTED, fontSize: { xs: '1.02rem', md: '1.15rem' }, lineHeight: 1.6, maxWidth: 520, mb: 4 }}>
              {WHITELABEL.description}
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: 2.5 }}>
              <Button
                href={links.signup}
                endIcon={<ArrowForward />}
                sx={{ ...pill, bgcolor: primary.light, color: INK, '&:hover': { bgcolor: '#5eead4' } }}
              >
                Create your account
              </Button>
              <Button
                href={links.signin}
                sx={{ ...pill, color: TEXT, border: `1px solid ${LINE}`, '&:hover': { bgcolor: 'rgba(242,245,244,0.06)' } }}
              >
                Sign in
              </Button>
            </Box>
            <Typography sx={{ color: MUTED, fontSize: '0.85rem' }}>
              One account for everything. Sign in with your PayBito account.
            </Typography>
          </Box>

          <Preview />
        </Box>
      </Container>

      {/* Features */}
      <Container maxWidth="lg" sx={{ pb: { xs: 5, md: 7 } }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' },
            border: `1px solid ${LINE}`,
            borderRadius: '22px',
            overflow: 'hidden',
            bgcolor: 'rgba(18, 27, 26, 0.6)',
          }}
        >
          {FEATURES.map((feature, index) => (
            <Box
              key={feature.title}
              sx={{
                p: 3,
                borderLeft: { md: index === 0 ? 'none' : `1px solid ${LINE}` },
                borderTop: { xs: index === 0 ? 'none' : `1px solid ${LINE}`, sm: index < 2 ? 'none' : `1px solid ${LINE}`, md: 'none' },
              }}
            >
              <Box sx={{ color: primary.light, mb: 1.5, display: 'flex' }}>{feature.icon}</Box>
              <Typography sx={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: '1.05rem', color: TEXT, mb: 0.75 }}>
                {feature.title}
              </Typography>
              <Typography sx={{ color: MUTED, fontSize: '0.9rem', lineHeight: 1.55 }}>{feature.text}</Typography>
            </Box>
          ))}
        </Box>
      </Container>

      {/* Footer */}
      <Box sx={{ borderTop: `1px solid ${LINE}` }}>
        <Container
          maxWidth="lg"
          sx={{ py: 2.5, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: { xs: 1.5, sm: 3 }, fontSize: '0.85rem' }}
        >
          <Typography sx={{ color: MUTED, fontSize: 'inherit', mr: 'auto' }}>
            © {new Date().getFullYear()} {WHITELABEL.brandName}
          </Typography>
          {FOOTER_LINKS.map((item) => (
            <Link key={item.href} href={item.href} underline="none" sx={{ color: MUTED, '&:hover': { color: TEXT } }}>
              {item.label}
            </Link>
          ))}
          <Box
            component="button"
            onClick={(event: React.MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget)}
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              background: 'none',
              border: 0,
              p: 0,
              font: 'inherit',
              color: MUTED,
              cursor: 'pointer',
              '&:hover': { color: TEXT },
            }}
          >
            Marketplaces <KeyboardArrowDown sx={{ fontSize: 18 }} />
          </Box>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={() => setAnchorEl(null)}
            slotProps={{ paper: { sx: { bgcolor: CARD, color: TEXT, border: `1px solid ${LINE}`, borderRadius: '14px' } } }}
          >
            {MARKETPLACES.map((item) => (
              <MenuItem
                key={item.label}
                component="a"
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setAnchorEl(null)}
                sx={{ fontSize: '0.9rem' }}
              >
                {item.label}
              </MenuItem>
            ))}
          </Menu>
        </Container>
      </Box>
    </Box>
  );
};

export default BitoConnectLogin;
