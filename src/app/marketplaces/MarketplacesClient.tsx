'use client';
import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Container,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Button,
  Card,
  CardContent,
  CardActions,
  useMediaQuery,
  Link as MuiLink,
  ThemeProvider,
  createTheme,
  CssBaseline,
} from '@mui/material';
import {
  LightMode as LightModeIcon,
  DarkMode as DarkModeIcon,
  OpenInNew as OpenInNewIcon,
} from '@mui/icons-material';
import bitoHubTextLogo from '../Assets/img/bitoHubTextLogo.png';

interface Marketplace {
  id: string;
  title: string;
  description: string;
  logo: string;
  url: string;
}

const marketplaces: Marketplace[] = [
  {
    id: 'token-marketplace',
    title: 'Token Marketplace',
    description: 'Discover, list, and trade innovative tokens with secure, transparent blockchain integration and strong community support.',
    logo: '/img/token-marketplace.png',
    url: 'https://www.bitocircle.com/token-marketplace/',
  },
  {
    id: 'crypto-commerce',
    title: 'Crypto Commerce',
    description: 'Empowering merchants to accept crypto payments globally — simple integration, secure processing, and merchant-first tools.',
    logo: '/img/crypto-commerce-logo.png',
    url: 'https://www.bitocircle.com/crypto-commerce/',
  },
];

const MarketplacesClient = () => {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const [mode, setMode] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const savedMode = localStorage.getItem('themeMode') as 'light' | 'dark' | null;
    if (savedMode) {
      setMode(savedMode);
    } else {
      setMode(prefersDarkMode ? 'dark' : 'light');
    }
  }, [prefersDarkMode]);

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: {
            main: mode === 'light' ? '#005eff' : '#ff002e',
          },
          secondary: {
            main: mode === 'light' ? '#ff002e' : '#005eff',
          },
          background: {
            default: mode === 'light' 
              ? 'linear-gradient(135deg, #ff002e 0%, #005eff 100%)' 
              : 'linear-gradient(135deg, #1a0a0f 0%, #0a0f1a 100%)',
            paper: mode === 'light' ? '#ffffff' : '#1a1a1a',
          },
          text: {
            primary: mode === 'light' ? '#2c3e50' : '#ffffff',
            secondary: mode === 'light' ? '#555555' : 'rgba(255, 255, 255, 0.85)',
          },
        },
      }),
    [mode]
  );

  const toggleTheme = () => {
    const newMode = mode === 'light' ? 'dark' : 'light';
    setMode(newMode);
    localStorage.setItem('themeMode', newMode);
    window.dispatchEvent(new CustomEvent('themeChange', { detail: newMode }));
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: '100vh',
          background: mode === 'light'
            ? 'linear-gradient(135deg, #ff002e 0%, #005eff 100%)'
            : 'linear-gradient(135deg, #1a0a0f 0%, #0a0f1a 100%)',
          position: 'relative',
        }}
      >
        {/* Header */}
        <AppBar
          position="sticky"
          sx={{
            bgcolor: 'rgba(255, 255, 255, 0.04)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.15)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            background: mode === 'light'
            ? 'linear-gradient(135deg, #fff 0%, #fff 100%)'
            : 'linear-gradient(135deg, #1a0a0f 0%, #0a0f1a 100%)',
          }}
        >
          <Toolbar 
            sx={{ 
              py: { xs: 1.5, sm: 1 },
              px: { xs: 2, sm: 3 },
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: { xs: 'flex-start', sm: 'center' },
              gap: { xs: 1, sm: 0 },
            }}
          >
            {/* Logo */}
            <MuiLink
              href="/"
              sx={{
                display: 'flex',
                alignItems: 'center',
                textDecoration: 'none',
              }}
            >
              <Box
                component="img"
                src={bitoHubTextLogo.src}
                alt="BitoCircle Logo"
                sx={{
                  height: { xs: '32px', sm: '36px', md: '44px' },
                  width: 'auto',
                }}
              />
            </MuiLink>

            {/* Title - Responsive Layout */}
            <Box 
              sx={{ 
                display: 'flex',
                alignItems: 'center',
                width: { xs: '100%', sm: 'auto' },
                justifyContent: { xs: 'flex-start', sm: 'center' },
                flex: { xs: 0, sm: 1 },
                ml: { xs: 0, sm: 0 },
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  fontSize: { xs: '0.9rem', sm: '1.1rem', md: '1.4rem' },
                  letterSpacing: '0.5px',
                  textShadow: '0 1px 4px rgba(0, 0, 0, 0.2)',
                  color: mode === 'light' ? '#1437ac' : '#fff',
                  whiteSpace: { xs: 'normal', sm: 'nowrap' },
                  lineHeight: { xs: 1.2, sm: 1.5 },
                }}
              >
                BitoCircle Marketplaces
              </Typography>
            </Box>

            {/* Spacer for desktop - hidden on mobile */}
            <Box sx={{ display: { xs: 'none', sm: 'block' }, width: { sm: '40px', md: '44px' } }} />
          </Toolbar>
        </AppBar>

        {/* Main Content */}
        <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
          {/* Page Title */}
          <Typography
            variant="h1"
            sx={{
              textAlign: 'center',
              color: '#fff',
              fontWeight: 800,
              fontSize: { xs: '1.6rem', sm: '1.8rem', md: '2rem' },
              mb: { xs: 4, md: 6 },
              letterSpacing: '0.2px',
              textShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
            }}
          >
            Explore BitoCircle Marketplaces
          </Typography>

          {/* Marketplace Cards */}
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              alignItems: 'stretch',
              gap: 4,
              pb: { xs: 4, md: 8 },
            }}
          >
            {marketplaces.map((marketplace) => (
              <Card
                key={marketplace.id}
                sx={{
                  flex: { xs: '1 1 100%', sm: '1 1 420px' },
                  maxWidth: '520px',
                  minHeight: { xs: '300px', sm: '320px', md: '360px' },
                  bgcolor: 'rgba(255, 255, 255, 0.08)',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255, 255, 255, 0.14)',
                  borderRadius: 3,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  transition: 'transform 0.28s cubic-bezier(0.2, 0.9, 0.3, 1), box-shadow 0.28s',
                  '&:hover': {
                    transform: 'translateY(-10px)',
                    boxShadow: '0 18px 40px rgba(0, 0, 0, 0.35)',
                  },
                }}
              >
                <CardContent
                  sx={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    pt: { xs: 4, md: 5 },
                    px: { xs: 2.5, md: 3.5 },
                    pb: 2,
                  }}
                >
                  <Box
                    component="img"
                    src={marketplace.logo}
                    alt={`${marketplace.title} logo`}
                    sx={{
                      maxWidth: '260px',
                      height: 'auto',
                      mb: 3,
                    }}
                  />
                  <Typography
                    variant="h2"
                    sx={{
                      fontSize: { xs: '1.6rem', md: '1.9rem' },
                      fontWeight: 800,
                      color: '#fff',
                      mb: 1.5,
                    }}
                  >
                    {marketplace.title}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: '1rem',
                      color: 'rgba(255, 255, 255, 0.9)',
                      lineHeight: 1.6,
                    }}
                  >
                    {marketplace.description}
                  </Typography>
                </CardContent>

                <CardActions sx={{ pb: { xs: 3, md: 4 }, px: 3 }}>
                  <Button
                    variant="contained"
                    href={marketplace.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    endIcon={<OpenInNewIcon />}
                    sx={{
                      bgcolor: '#ffffff',
                      color: '#000000',
                      fontWeight: 700,
                      py: 1.5,
                      px: 3.5,
                      borderRadius: 30,
                      textTransform: 'none',
                      fontSize: '1rem',
                      boxShadow: '0 6px 18px rgba(0, 0, 0, 0.18)',
                      transition: 'all 0.18s',
                      '&:hover': {
                        bgcolor: 'rgba(0, 0, 0, 0.95)',
                        color: '#fff',
                        transform: 'translateY(-3px)',
                        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
                      },
                    }}
                  >
                    Explore
                  </Button>
                </CardActions>
              </Card>
            ))}
          </Box>
        </Container>
      </Box>
    </ThemeProvider>
  );
};

export default MarketplacesClient;