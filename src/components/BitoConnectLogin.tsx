// pages/login.tsx or app/login/page.tsx

'use client';
import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  Typography,
  Button,
  Link,
  Menu,
  MenuItem,
  CircularProgress,
} from '@mui/material';
import {
  ArrowForward,
  Info,
  Description,
  Security,
  Group,
  GridView,
  KeyboardArrowDown,
} from '@mui/icons-material';
import Image from 'next/image';
import BitoConnect from '../app/Assets/img/BitoConnect.png';
import { WHITELABEL } from '@/config/whitelabel';
import { tokenCookie } from '../hooks/useAuthRedirect';

// Safe localStorage helper
const safeLocalStorage = {
  getItem: (key: string): string | null => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(key);
    }
    return null;
  },
};

const BitoConnectLogin = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Check for existing valid session on mount
  useEffect(() => {
    const checkAuthentication = async () => {
      const storedAccessToken = tokenCookie.get();

      if (!storedAccessToken) {
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

        if (response.ok) {
          // Token is valid, redirect to bitoconnect.com
          window.location.href = 'https://www.bitocircle.com';
          return;
        }

        // If 401 or any other error, stay on login page
        setIsCheckingAuth(false);
      } catch (error) {
        console.error('Authentication check failed:', error);
        setIsCheckingAuth(false);
      }
    };

    checkAuthentication();
  }, []);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const marketplaceItems = [
    { label: 'App Store', url: 'https://apps.paybito.com/', icon: '📱' },
    { label: 'Token Marketplace', url: 'https://www.bitocircle.com/token-marketplace/', icon: '🏪' },
    { label: 'Crypto Commerce', url: 'https://www.bitocircle.com/crypto-commerce/', icon: '🛒' },
    { label: 'TeamUps', url: 'https://teamups.paybito.com/', icon: '👥' },
    { label: 'Ad Centre', url: 'https://ad-center.bitocircle.com/', icon: '📢' },
  ];

  // Show loading spinner while checking authentication
  if (isCheckingAuth) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: '#f8fafc',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        <CircularProgress
          size={48}
          sx={{
            color: '#dc2626',
          }}
        />
        <Typography
          sx={{
            color: '#6b7280',
            fontSize: '0.95rem',
          }}
        >
          Checking authentication...
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        bgcolor: '#f8fafc',
        py: { xs: 1, md: 4 },
      }}
    >
      <Container maxWidth="xl">
        <Box
          sx={{
            bgcolor: 'white',
            borderRadius: { xs: 3, md: 4 },
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          }}
        >
          <Grid 
            container 
            sx={{ 
              minHeight: { lg: '600px' },
              width: '100%',
            }}
          >
            {/* Hero Section - Left Side */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
                minHeight: { lg: '600px' },
                width: '100%',
              }}
            >
              {/* Hero Section - Left Side */}
              <Box>
                <Box
                  sx={{
                    background: 'linear-gradient(135deg, #dc2626 0%, #1e40af 100%)',
                    color: 'white',
                    p: { xs: '2rem 2rem 0', md: '2rem 2rem 0' },
                    minHeight: { xs: 'auto', lg: '600px' },
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {/* Hero Content */}
                  <Box sx={{ position: 'relative', zIndex: 10, mb: 4 }}>
                    <Typography
                      component="h1"
                      sx={{
                        fontSize: { xs: '1.75rem', md: '2rem', lg: '34px' },
                        fontWeight: 700,
                        lineHeight: 1.1,
                        mb: 1.5,
                        background: 'linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                      }}
                    >
                      Be First. Be In.
                      <br />
                      Discover What&apos;s Next
                      <br />
                      in Crypto.
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: { xs: '0.95rem', md: '16px' },
                        lineHeight: 1.6,
                        opacity: 0.95,
                        maxWidth: '500px',
                      }}
                    >
                      Meet people who speak crypto. Talk freely. Discover what&apos;s next together.
                    </Typography>
                  </Box>

                  {/* Feature Image */}
                  <Box
                    sx={{
                      textAlign: 'center',
                      mt: { xs: '-10px', md: '-50px' },
                      mb: { xs: 0, md: '-29px' },
                    }}
                  >
                    <Box
                      component="img"
                      src={BitoConnect.src}
                      alt="Circlo Platform Features"
                      sx={{
                        width: '100%',
                        maxWidth: '450px',
                        height: 'auto',
                        borderRadius: 1.5,
                        display: 'inline-block',
                      }}
                    />
                  </Box>
                </Box>
              </Box>

              {/* Authentication Section - Right Side */}
              <Box>
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: { xs: 'auto', lg: '600px' },
                    height: '100%',
                    bgcolor: 'white',
                  }}
                >
                  {/* Header with Logo - Sticky */}
                  <Box
                    sx={{
                      position: { lg: 'sticky' },
                      top: 0,
                      bgcolor: 'white',
                      borderBottom: '1px solid #e5e7eb',
                      py: 1.5,
                      px: 2,
                      zIndex: 100,
                      backdropFilter: 'blur(10px)',
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      <Box
                        component="span"
                        sx={{
                          fontWeight: 800,
                          fontSize: { xs: '2rem', md: '2.6rem' },
                          letterSpacing: '-0.02em',
                          color: WHITELABEL.colors.primary.main,
                          transition: 'transform 0.3s ease',
                          '&:hover': {
                            transform: 'scale(1.05)',
                          },
                        }}
                      >
                        {WHITELABEL.brandName}
                      </Box>
                    </Box>
                  </Box>

                  {/* Main Auth Content - Centered */}
                  <Box
                    sx={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center',
                      p: { xs: '2rem 1.5rem', md: '3rem 2rem' },
                    }}
                  >
                    <Box
                      sx={{
                        bgcolor: 'white',
                        borderRadius: '20px',
                        p: { xs: '1.5rem 1rem', md: '2.5rem' },
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                        border: '1px solid #e5e7eb',
                        maxWidth: '420px',
                        width: '100%',
                        position: 'relative',
                        overflow: 'hidden',
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          height: '4px',
                          background: 'linear-gradient(135deg, #dc2626 0%, #1e40af 100%)',
                        },
                      }}
                    >
                      {/* Login Button */}
                      <Button
                        variant="contained"
                        fullWidth
                        component="a"
                        href="https://myaccount.paybito.com/signin?continue=https://www.bitocircle.com&app=BitoCircle"
                        endIcon={<ArrowForward />}
                        sx={{
                          py: 1,
                          px: 1.5,
                          fontSize: '1.1rem',
                          fontWeight: 600,
                          background: 'linear-gradient(135deg, #dc2626 0%, #1e40af 100%)',
                          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                          textTransform: 'none',
                          borderRadius: '12px',
                          position: 'relative',
                          overflow: 'hidden',
                          '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: '-100%',
                            width: '100%',
                            height: '100%',
                            background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)',
                            transition: 'left 0.5s',
                          },
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                            '&::before': {
                              left: '100%',
                            },
                          },
                        }}
                      >
                        Log In
                      </Button>

                      {/* Divider */}
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          my: 2,
                          color: '#9ca3af',
                          fontSize: '0.875rem',
                          '&::before, &::after': {
                            content: '""',
                            flex: 1,
                            height: '1px',
                            bgcolor: '#e5e7eb',
                          },
                        }}
                      >
                        <Typography
                          component="span"
                          sx={{
                            px: 1,
                            bgcolor: 'white',
                            fontWeight: 500,
                            fontSize: '0.875rem',
                            color: '#9ca3af',
                          }}
                        >
                          OR
                        </Typography>
                      </Box>

                      {/* Sign Up Link */}
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography sx={{ color: '#6b7280', fontSize: '0.875rem' }}>
                          Don&apos;t have an account?{' '}
                          <Link
                            href="https://myaccount.paybito.com/signup?continue=https://www.bitocircle.com&app=BitoCircle"
                            target="_blank"
                            sx={{
                              color: '#dc2626',
                              fontWeight: 600,
                              textDecoration: 'none',
                              '&:hover': {
                                color: '#1e40af',
                                textDecoration: 'underline',
                              },
                            }}
                          >
                            Create Account
                          </Link>
                        </Typography>
                      </Box>
                    </Box>
                  </Box>

                  {/* Footer - Sticky */}
                  <Box
                    component="nav"
                    sx={{
                      position: { lg: 'sticky' },
                      bottom: 0,
                      bgcolor: 'white',
                      borderTop: '1px solid #e5e7eb',
                      py: 1.5,
                      px: 2,
                      backdropFilter: 'blur(10px)',
                      marginBottom: '70px',
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-around',
                        alignItems: 'center',
                        gap: { xs: 0.5, md: 1 },
                        flexWrap: 'wrap',
                      }}
                    >
                      <Link
                        href="/about"
                        sx={{
                          color: '#9ca3af',
                          textDecoration: 'none',
                          fontSize: '0.875rem',
                          fontWeight: 500,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5,
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            color: '#dc2626',
                          },
                        }}
                      >
                        <Info sx={{ fontSize: '1rem' }} />
                        About
                      </Link>

                      <Box>
                        <Link
                          onClick={handleMenuOpen}
                          sx={{
                            color: '#9ca3af',
                            textDecoration: 'none',
                            fontSize: '0.875rem',
                            fontWeight: 500,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              color: '#dc2626',
                            },
                          }}
                        >
                          <GridView sx={{ fontSize: '1rem' }} />
                          Marketplaces
                          <KeyboardArrowDown sx={{ fontSize: '1rem' }} />
                        </Link>
                        <Menu
                          anchorEl={anchorEl}
                          open={Boolean(anchorEl)}
                          onClose={handleMenuClose}
                          disableScrollLock={true}
                          sx={{
                            '& .MuiPaper-root': {
                              bgcolor: 'white',
                              borderRadius: 1.5,
                              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                              mt: 1,
                            },
                          }}
                        >
                          {marketplaceItems.map((item) => (
                            <MenuItem
                              key={item.label}
                              component="a"
                              href={item.url}
                              target="_blank"
                              onClick={handleMenuClose}
                              sx={{
                                borderRadius: 1,
                                mx: 0.5,
                                my: 0.25,
                                bgcolor: 'white',
                                color: 'black',
                                '&:hover': {
                                  bgcolor: '#f8fafc',
                                  color: '#dc2626',
                                },
                              }}
                            >
                              <Typography sx={{ mr: 1 }}>{item.icon}</Typography>
                              {item.label}
                            </MenuItem>
                          ))}
                        </Menu>
                      </Box>

                      <Link
                        href="/terms"
                        sx={{
                          color: '#9ca3af',
                          textDecoration: 'none',
                          fontSize: '0.875rem',
                          fontWeight: 500,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5,
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            color: '#dc2626',
                          },
                        }}
                      >
                        <Description sx={{ fontSize: '1rem' }} />
                        Terms
                      </Link>

                      <Link
                        href="/privacy-policy"
                        sx={{
                          color: '#9ca3af',
                          textDecoration: 'none',
                          fontSize: '0.875rem',
                          fontWeight: 500,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5,
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            color: '#dc2626',
                          },
                        }}
                      >
                        <Security sx={{ fontSize: '1rem' }} />
                        Privacy
                      </Link>

                      <Link
                        href="/eula"
                        sx={{
                          color: '#9ca3af',
                          textDecoration: 'none',
                          fontSize: '0.875rem',
                          fontWeight: 500,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5,
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            color: '#dc2626',
                          },
                        }}
                      >
                        <Description sx={{ fontSize: '1rem' }} />
                        EULA
                      </Link>

                      <Link
                        href="/community"
                        sx={{
                          color: '#9ca3af',
                          textDecoration: 'none',
                          fontSize: '0.875rem',
                          fontWeight: 500,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5,
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            color: '#dc2626',
                          },
                        }}
                      >
                        <Group sx={{ fontSize: '1rem' }} />
                        Community
                      </Link>
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Grid>
        </Box>
      </Container>
    </Box>
  );
};

export default BitoConnectLogin;