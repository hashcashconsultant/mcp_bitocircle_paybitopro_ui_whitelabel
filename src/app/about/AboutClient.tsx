'use client';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { WHITELABEL, ssoUrl } from '@/config/whitelabel';
import {
  Box,
  Container,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  useMediaQuery,
  Link as MuiLink,
  ThemeProvider,
  CssBaseline,
  Button,
} from '@mui/material';
import {
  LightMode as LightModeIcon,
  DarkMode as DarkModeIcon,
} from '@mui/icons-material';
import BrandLogo from '@/components/brand/BrandLogo';
import BrandArt from '@/components/brand/BrandArt';
import { createBrandTheme } from '@/lib/theme';

const AboutClient = () => {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const [mode, setMode] = useState<'light' | 'dark'>('light');
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set());
  const observerRef = useRef<IntersectionObserver | null>(null);

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
      createBrandTheme({
        palette: {
          mode,
          primary: {
            main: '#0f766e',
          },
          secondary: {
            main: '#dc2626',
          },
          background: {
            default: mode === 'light' ? '#f9fafb' : '#080d0c',
            paper: mode === 'light' ? '#ffffff' : '#121b1a',
          },
          text: {
            primary: mode === 'light' ? '#2c3e50' : '#e5e5e5',
            secondary: mode === 'light' ? '#555555' : '#b0b0b0',
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

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleSections((prev) => new Set(prev).add(entry.target.id));
          }
        });
      },
      { threshold: 0.2 }
    );

    const sections = document.querySelectorAll('.fade-section');
    sections.forEach((section) => {
      if (observerRef.current) {
        observerRef.current.observe(section);
      }
    });

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', overflow: 'hidden' }}>
        {/* Header */}
        <AppBar
          position="fixed"
          sx={{
            bgcolor: 'background.paper',
            boxShadow: mode === 'light' 
              ? '0 4px 20px rgba(0, 0, 0, 0.1)' 
              : '0 4px 20px rgba(0, 0, 0, 0.5)',
          }}
        >
          <Toolbar>
            <MuiLink href="/" sx={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
              <Box sx={{ color: 'text.primary', display: 'flex' }}><BrandLogo size={34} /></Box>
            </MuiLink>
            
            <IconButton
              onClick={toggleTheme}
              sx={{
                ml: 'auto',
                color: 'primary.main',
                bgcolor: mode === 'light' ? 'rgba(15, 118, 110, 0.1)' : 'rgba(220, 38, 38, 0.1)',
                '&:hover': {
                  bgcolor: mode === 'light' ? 'rgba(15, 118, 110, 0.2)' : 'rgba(220, 38, 38, 0.2)',
                },
              }}
            >
              {mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
            </IconButton>
          </Toolbar>
        </AppBar>

        {/* Hero Section with Video Background */}
        <Box
          sx={{
            position: 'relative',
            height: { xs: 'calc(100vh - 56px)', sm: 'calc(100vh - 64px)' },
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          {/* Video Background */}
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              background: 'radial-gradient(1200px 600px at 15% 10%, #0f766e 0%, transparent 60%), radial-gradient(900px 500px at 90% 90%, #7a2e28 0%, transparent 55%), #0b1211',
              zIndex: 0,
            }}
          />

          {/* Video Overlay */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              bgcolor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 1,
            }}
          />

          {/* Decorative Circles */}
          <Box
            sx={{
              position: 'absolute',
              width: '200px',
              height: '200px',
              borderRadius: '50%',
              bgcolor: 'rgba(220, 38, 38, 0.2)',
              top: '-50px',
              right: '-100px',
              zIndex: 2,
              animation: 'float 6s ease-in-out infinite',
              '@keyframes float': {
                '0%': { transform: 'translateY(0px)' },
                '50%': { transform: 'translateY(20px)' },
                '100%': { transform: 'translateY(0px)' },
              },
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              width: '150px',
              height: '150px',
              borderRadius: '50%',
              bgcolor: 'rgba(13, 148, 136, 0.2)',
              bottom: '-60px',
              left: '-80px',
              zIndex: 2,
              animation: 'float 6s ease-in-out infinite',
              animationDelay: '2s',
            }}
          />

          {/* Hero Content */}
          <Container sx={{ position: 'relative', zIndex: 3, textAlign: 'center' }}>
            <Typography
              variant="h1"
              sx={{
                fontSize: { xs: '2.5rem', md: '3rem' },
                fontWeight: 700,
                color: '#fff',
                mb: 3,
                opacity: 0,
                animation: 'fadeInUp 1s ease-out forwards',
                '@keyframes fadeInUp': {
                  from: {
                    opacity: 0,
                    transform: 'translateY(20px)',
                  },
                  to: {
                    opacity: 1,
                    transform: 'translateY(0)',
                  },
                },
              }}
            >
              About Circle
            </Typography>
          </Container>
        </Box>

        {/* Who We Are Section */}
        <Box
          id="who-we-are"
          className="fade-section"
          sx={{
            py: 10,
            opacity: visibleSections.has('who-we-are') ? 1 : 0,
            transform: visibleSections.has('who-we-are') ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 0.8s ease-out, transform 0.8s ease-out',
          }}
        >
          <Container>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: 'center', gap: 6 }}>
              <Box sx={{ flex: 1 }}>
                <Typography
                  variant="h2"
                  sx={{
                    fontSize: { xs: '2rem', md: '2.5rem' },
                    fontWeight: 700,
                    mb: 3,
                    color: 'text.primary',
                    position: 'relative',
                    paddingBottom: '10px',
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      left: 0,
                      bottom: 0,
                      width: '60px',
                      height: '4px',
                      background: 'linear-gradient(90deg, #dc2626, #0f766e)',
                      borderRadius: '2px',
                    },
                  }}
                >
                  Who We Are
                </Typography>
                <Typography sx={{ fontSize: '1rem', lineHeight: 1.7, mb: 2, color: 'text.secondary' }}>
                  Circle is the world&apos;s first social platform built exclusively for the crypto community. We bring together founders, innovators, investors, and users on one global stage — making it easier than ever for entrepreneurs to connect, collaborate, and get discovered.
                </Typography>
                <Typography sx={{ fontSize: '1rem', lineHeight: 1.7, color: 'text.secondary' }}>
                  Unlike traditional social platforms, Circle is designed to fuel the growth of the Web3 ecosystem by giving entrepreneurs the visibility, tools, and community they need to succeed.
                </Typography>
              </Box>
              <Box
                sx={{
                  flex: 1,
                  bgcolor: mode === 'light' ? '#e5e7eb' : '#374151',
                  height: '300px',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <BrandArt variant="who-we-are" />
              </Box>
            </Box>
          </Container>
        </Box>

        {/* Our Mission Section */}
        <Box
          id="our-mission"
          className="fade-section"
          sx={{
            py: 10,
            bgcolor: mode === 'light' ? '#efece5' : '#111827',
            opacity: visibleSections.has('our-mission') ? 1 : 0,
            transform: visibleSections.has('our-mission') ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 0.8s ease-out, transform 0.8s ease-out',
          }}
        >
          <Container>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row-reverse' }, alignItems: 'center', gap: 6 }}>
              <Box sx={{ flex: 1 }}>
                <Typography
                  variant="h2"
                  sx={{
                    fontSize: { xs: '2rem', md: '2.5rem' },
                    fontWeight: 700,
                    mb: 3,
                    color: 'text.primary',
                    position: 'relative',
                    paddingBottom: '10px',
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      left: 0,
                      bottom: 0,
                      width: '60px',
                      height: '4px',
                      background: 'linear-gradient(90deg, #dc2626, #0f766e)',
                      borderRadius: '2px',
                    },
                  }}
                >
                  Our Mission
                </Typography>
                <Typography sx={{ fontSize: '1rem', lineHeight: 1.7, color: 'text.secondary' }}>
                  To create a platform where crypto users can explore, learn, and engage with tokens and projects — while empowering crypto entrepreneurs to promote their brands, showcase innovations, and connect with a global ecosystem of crypto users.
                </Typography>
              </Box>
              <Box
                sx={{
                  flex: 1,
                  bgcolor: mode === 'light' ? '#e5e7eb' : '#374151',
                  height: '300px',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <BrandArt variant="our-mission" />
              </Box>
            </Box>
          </Container>
        </Box>

        {/* Our Vision Section */}
        <Box
          id="our-vision"
          className="fade-section"
          sx={{
            py: 10,
            opacity: visibleSections.has('our-vision') ? 1 : 0,
            transform: visibleSections.has('our-vision') ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 0.8s ease-out, transform 0.8s ease-out',
          }}
        >
          <Container>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: 'center', gap: 6 }}>
              <Box sx={{ flex: 1 }}>
                <Typography
                  variant="h2"
                  sx={{
                    fontSize: { xs: '2rem', md: '2.5rem' },
                    fontWeight: 700,
                    mb: 3,
                    color: 'text.primary',
                    position: 'relative',
                    paddingBottom: '10px',
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      left: 0,
                      bottom: 0,
                      width: '60px',
                      height: '4px',
                      background: 'linear-gradient(90deg, #dc2626, #0f766e)',
                      borderRadius: '2px',
                    },
                  }}
                >
                  Our Vision
                </Typography>
                <Typography sx={{ fontSize: '1rem', lineHeight: 1.7, color: 'text.secondary' }}>
                  To become the world&apos;s go-to hub for crypto discovery and entrepreneurship — a place where users find the next big project, and entrepreneurs gain global visibility, build trust, and grow within the Web3 ecosystem.
                </Typography>
              </Box>
              <Box
                sx={{
                  flex: 1,
                  bgcolor: mode === 'light' ? '#e5e7eb' : '#374151',
                  height: '300px',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <BrandArt variant="our-vission" />
              </Box>
            </Box>
          </Container>
        </Box>

        {/* Join the Movement - CTA Section */}
        <Box
          id="join-movement"
          className="fade-section"
          sx={{
            py: 12,
            background: 'linear-gradient(120deg, #dc2626, #0f766e)',
            textAlign: 'center',
            opacity: visibleSections.has('join-movement') ? 1 : 0,
            transform: visibleSections.has('join-movement') ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 0.8s ease-out, transform 0.8s ease-out',
          }}
        >
          <Container>
            <Box sx={{ maxWidth: '800px', mx: 'auto' }}>
              <Typography
                variant="h2"
                sx={{
                  fontSize: { xs: '2rem', md: '2.5rem' },
                  fontWeight: 700,
                  mb: 3,
                  color: '#fff',
                  position: 'relative',
                  paddingBottom: '10px',
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    bottom: 0,
                    width: '60px',
                    height: '4px',
                    background: 'rgba(255, 255, 255, 0.5)',
                    borderRadius: '2px',
                  },
                }}
              >
                Join the Movement
              </Typography>
              <Typography sx={{ fontSize: '1.2rem', lineHeight: 1.7, mb: 2, color: 'rgba(255, 255, 255, 0.95)' }}>
                Circle isn&apos;t just a platform — it&apos;s a global community of builders and believers. Whether you&apos;re launching your first token, building a blockchain startup, or just exploring Web3, this is where your journey gets discovered.
              </Typography>
              <Typography variant="h5" sx={{ mt: 4, mb: 4, color: '#fff', fontWeight: 600 }}>
                Circle — Where crypto entrepreneurs meet the world.
              </Typography>
              <Button
                component="a"
                href={ssoUrl('signin')}
                sx={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(10px)',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  color: '#fff',
                  fontWeight: 600,
                  px: 4,
                  py: 1.5,
                  borderRadius: '50px',
                  fontSize: '1rem',
                  textTransform: 'none',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    background: 'rgba(255, 255, 255, 0.3)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 20px rgba(0, 0, 0, 0.3)',
                  },
                }}
              >
                Get Started
              </Button>
            </Box>
          </Container>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default AboutClient;