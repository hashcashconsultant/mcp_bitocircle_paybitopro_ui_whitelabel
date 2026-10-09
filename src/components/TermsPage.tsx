// pages/terms.tsx or app/terms/page.tsx

'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { fetchWithAuth } from '@/utils/fetchWithAuth'

import {
  Box,
  Container,
  AppBar,
  Toolbar,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
  IconButton,
  useMediaQuery,
  Link as MuiLink,
  ThemeProvider,
  createTheme,
  CssBaseline,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Close as CloseIcon,
  LightMode as LightModeIcon,
  DarkMode as DarkModeIcon,
} from '@mui/icons-material';
import Image from 'next/image';
import bitoHubTextLogo from '../app/Assets/img/bitoHubTextLogo.png';

const drawerWidth = 280;

interface Section {
  id: string;
  title: string;
}

const sections: Section[] = [
  { id: 'section1', title: 'Eligibility' },
  { id: 'section2', title: 'Account Registration & Security' },
  { id: 'section3', title: 'Acceptable Use & Zero Tolerance Policy' },
  { id: 'section4', title: 'Content Ownership & License' },
  { id: 'section5', title: 'Community Reporting, Blocking & Moderation' },
  { id: 'section6', title: 'Enforcement Actions' },
  { id: 'section7', title: 'User Responsibilities' },
  { id: 'section8', title: 'Networking & Marketplace Features' },
  { id: 'section9', title: 'Third-Party Links & Integrations' },
  { id: 'section10', title: 'Privacy' },
  { id: 'section11', title: 'Termination' },
  { id: 'section12', title: 'Disclaimers' },
  { id: 'section13', title: 'Limitation of Liability' },
  { id: 'section14', title: 'Governing Law & Arbitration' },
  { id: 'section15', title: 'Changes to These Terms' },
  { id: 'section16', title: 'Contact Information' },
];

const TermsPage = () => {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const [mode, setMode] = useState<'light' | 'dark'>('light');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('section1');

  // Load theme preference from localStorage on mount
  useEffect(() => {
    const savedMode = localStorage.getItem('themeMode') as 'light' | 'dark' | null;
    if (savedMode) {
      setMode(savedMode);
    } else {
      setMode(prefersDarkMode ? 'dark' : 'light');
    }
  }, [prefersDarkMode]);

  // Create theme based on mode
  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: {
            main: '#1e40af',
          },
          secondary: {
            main: '#dc2626',
          },
          background: {
            default: mode === 'light' ? '#f8f9fa' : '#0a0a0a',
            paper: mode === 'light' ? '#ffffff' : '#1a1a1a',
          },
          text: {
            primary: mode === 'light' ? '#2c3e50' : '#e5e5e5',
            secondary: mode === 'light' ? '#555555' : '#b0b0b0',
          },
        },
      }),
    [mode]
  );

  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));

  const toggleTheme = () => {
    const newMode = mode === 'light' ? 'dark' : 'light';
    setMode(newMode);
    localStorage.setItem('themeMode', newMode);
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleSectionClick = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (isMobile) {
        setMobileOpen(false);
      }
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      const sectionElements = sections.map(section => ({
        id: section.id,
        element: document.getElementById(section.id),
      }));

      let current = sections[0].id;

      for (const { id, element } of sectionElements) {
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top <= 150) {
            current = id;
          }
        }
      }

      setActiveSection(current);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const drawer = (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.paper',
      }}
    >
      <Box
        sx={{
          p: 2.5,
          borderBottom: '2px solid',
          borderColor: 'primary.main',
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            color: 'secondary.main',
            fontSize: '1.1rem',
          }}
        >
          Table of Contents
        </Typography>
      </Box>
      <List sx={{ flex: 1, overflow: 'auto', py: 0 }}>
        {sections.map((section) => (
          <ListItem
            key={section.id}
            disablePadding
            sx={{
              borderLeft: '3px solid',
              borderLeftColor: activeSection === section.id ? 'primary.main' : 'transparent',
              background: activeSection === section.id
                ? 'linear-gradient(135deg, #dc2626 0%, #1e40af 100%)'
                : 'transparent',
              transition: 'all 0.3s ease',
              mb: 0.5,
            }}
          >
            <ListItemButton
              onClick={() => handleSectionClick(section.id)}
              sx={{
                py: 1.5,
                px: 2.5,
                borderRadius: '0 25px 25px 0',
                mr: 1.25,
                color: activeSection === section.id ? 'white' : 'text.primary',
                '&:hover': {
                  bgcolor: activeSection === section.id
                    ? 'rgba(255, 255, 255, 0.1)'
                    : mode === 'light' ? '#f8f9fa' : 'rgba(255, 255, 255, 0.05)',
                  color: activeSection === section.id ? 'white' : 'primary.main',
                  transform: 'translateX(5px)',
                },
                transition: 'all 0.3s ease',
              }}
            >
              <ListItemText
                primary={section.title}
                primaryTypographyProps={{
                  fontSize: '14px',
                  lineHeight: 1.4,
                  fontWeight: activeSection === section.id ? 500 : 400,
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {/* Header */}
        <AppBar
          position="fixed"
          sx={{
            bgcolor: 'background.paper',
            boxShadow: mode === 'light'
              ? '0 4px 20px rgba(0, 0, 0, 0.1)'
              : '0 4px 20px rgba(0, 0, 0, 0.5)',
            zIndex: theme.zIndex.drawer + 1,
          }}
        >
          <Toolbar>
            <MuiLink href="/" sx={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
              <Box
                component="img"
                src={bitoHubTextLogo.src}
                alt="BitoCircle Logo"
                sx={{
                  width: { xs: '150px', md: '200px' },
                  height: 'auto',
                  filter: mode === 'dark' ? 'brightness(0) invert(1)' : 'none',
                }}
              />
            </MuiLink>

            {/* Theme Toggle Button */}
            <IconButton
              onClick={toggleTheme}
              sx={{
                ml: 'auto',
                mr: isMobile ? 1 : 0,
                color: 'primary.main',
                bgcolor: mode === 'light' ? 'rgba(30, 64, 175, 0.1)' : 'rgba(220, 38, 38, 0.1)',
                '&:hover': {
                  bgcolor: mode === 'light' ? 'rgba(30, 64, 175, 0.2)' : 'rgba(220, 38, 38, 0.2)',
                },
              }}
            >
              {mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
            </IconButton>

            {isMobile && (
              <IconButton
                color="inherit"
                edge="end"
                onClick={handleDrawerToggle}
                sx={{ color: 'primary.main' }}
              >
                {mobileOpen ? <CloseIcon /> : <MenuIcon />}
              </IconButton>
            )}
          </Toolbar>
        </AppBar>

        {/* Sidebar */}
        <Drawer
          variant={isMobile ? 'temporary' : 'permanent'}
          open={isMobile ? mobileOpen : true}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box',
              top: { xs: 70, lg: 80 },
              height: { xs: 'calc(100vh - 70px)', lg: 'calc(100vh - 80px)' },
              borderRight: '1px solid',
              borderColor: mode === 'light' ? '#dee2e6' : 'rgba(255, 255, 255, 0.12)',
              boxShadow: mode === 'light'
                ? '4px 0 15px rgba(0, 0, 0, 0.08)'
                : '4px 0 15px rgba(0, 0, 0, 0.3)',
              bgcolor: 'background.paper',
            },
          }}
        >
          {drawer}
        </Drawer>

        {/* Main Content */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: { xs: 2, md: 4 },
            ml: { lg: `${drawerWidth}px` },
            mt: { xs: '70px', lg: '80px' },
            bgcolor: 'background.default',
            minHeight: 'calc(100vh - 80px)',
          }}
        >
          <Container maxWidth="lg">
            <Box
              sx={{
                bgcolor: 'background.paper',
                borderRadius: 2,
                boxShadow: mode === 'light'
                  ? '0 10px 30px rgba(0, 0, 0, 0.08)'
                  : '0 10px 30px rgba(0, 0, 0, 0.5)',
                p: { xs: 3, md: 5 },
                mb: 4,
              }}
            >
              {/* Introduction Section */}
              <Box id="section1" component="section" sx={{ mb: 6 }}>
                <Typography
                  variant="h1"
                  sx={{
                    fontWeight: 700,
                    fontSize: { xs: '1.8rem', md: '2.5rem' },
                    textAlign: 'center',
                    color: 'primary.main',
                    mb: 4,
                    position: 'relative',
                    pb: 2,
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      bottom: 0,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: '80px',
                      height: '3px',
                      background: 'linear-gradient(90deg, #1e40af, #e74c3c)',
                      borderRadius: '2px',
                    },
                  }}
                >
                  Terms of Service & Community Guidelines
                </Typography>
                <Typography sx={{ fontSize: '16px', lineHeight: 1.7, mb: 2, color: 'text.secondary', fontStyle: 'italic' }}>
                  Last updated on: December 5, 2025
                </Typography>
                <Typography sx={{ fontSize: '16px', lineHeight: 1.7, mb: 2.5, color: 'text.secondary' }}>
                  Welcome to <strong>BitoCircle</strong>. These Terms of Service and Community Guidelines (&ldquo;Terms&rdquo;) govern your access to and use of the BitoCircle platform, including our website, mobile application, and related services (collectively, the &ldquo;Services&rdquo;). By creating an account, accessing, or using BitoCircle, you agree to be bound by these Terms. If you do not agree, you must discontinue use of the Services.
                </Typography>
              </Box>

              {/* Eligibility */}
              <Box id="section2" component="section" sx={{ mb: 6 }}>
                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: 600,
                    fontSize: '1.4rem',
                    color: 'text.primary',
                    mb: 2.5,
                    pl: 2,
                    borderLeft: '4px solid',
                    borderColor: 'primary.main',
                  }}
                >
                  1. Eligibility
                </Typography>
                <Box component="ul" sx={{ pl: 3, '& li': { mb: 1.5, color: 'text.secondary', fontSize: '16px', lineHeight: 1.7 } }}>
                  <li>You must be at least <strong>18 years old</strong> to use BitoCircle.</li>
                  <li>By registering, you confirm that you have the <strong>legal capacity</strong> to enter into these Terms.</li>
                  <li>Use of BitoCircle is <strong>prohibited</strong> in jurisdictions where such platforms are restricted or illegal.</li>
                </Box>
              </Box>

              {/* Account Registration & Security */}
              <Box id="section3" component="section" sx={{ mb: 6 }}>
                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: 600,
                    fontSize: '1.4rem',
                    color: 'text.primary',
                    mb: 2.5,
                    pl: 2,
                    borderLeft: '4px solid',
                    borderColor: 'primary.main',
                  }}
                >
                  2. Account Registration & Security
                </Typography>
                <Box component="ul" sx={{ pl: 3, '& li': { mb: 1.5, color: 'text.secondary', fontSize: '16px', lineHeight: 1.7 } }}>
                  <li>You must provide <strong>accurate, current, and complete information</strong> when creating an account.</li>
                  <li>You are responsible for <strong>maintaining the confidentiality</strong> of your login credentials and for all activities that occur under your account.</li>
                  <li>You may not <strong>impersonate others</strong>, misrepresent your identity, or create multiple or fraudulent accounts.</li>
                </Box>
              </Box>

              {/* Acceptable Use & Zero Tolerance Policy */}
              <Box id="section4" component="section" sx={{ mb: 6 }}>
                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: 600,
                    fontSize: '1.4rem',
                    color: 'text.primary',
                    mb: 2.5,
                    pl: 2,
                    borderLeft: '4px solid',
                    borderColor: 'primary.main',
                  }}
                >
                  3. Acceptable Use & Zero Tolerance Policy
                </Typography>
                <Typography sx={{ fontSize: '16px', lineHeight: 1.7, mb: 2, color: 'text.secondary' }}>
                  BitoCircle maintains a <strong>ZERO TOLERANCE POLICY</strong> for objectionable content and abusive behavior.
                </Typography>
                <Typography sx={{ fontSize: '16px', lineHeight: 1.7, mb: 2, color: 'text.secondary' }}>
                  You agree <strong>not to post, share, or engage in</strong> any content or activity that includes or promotes:
                </Typography>
                <Box component="ul" sx={{ pl: 3, '& li': { mb: 1.5, color: 'text.secondary', fontSize: '16px', lineHeight: 1.7 } }}>
                  <li><strong>Hate speech</strong>, harassment, bullying, or threats</li>
                  <li><strong>Sexual, exploitative, or violent</strong> content</li>
                  <li><strong>Spam, scams</strong>, misleading information, or malicious links</li>
                  <li>Content that promotes or facilitates <strong>illegal activities</strong></li>
                  <li><strong>Fraudulent, deceptive, or unauthorized financial activities</strong>, including unlicensed fundraising, securities offerings, or money laundering</li>
                  <li>Content that infringes <strong>intellectual property</strong> or other legal rights</li>
                </Box>
                <Typography sx={{ fontSize: '16px', lineHeight: 1.7, mt: 2, color: 'text.secondary' }}>
                  Violations of this policy may result in <strong>immediate content removal</strong> and enforcement actions, including account suspension or termination.
                </Typography>
              </Box>

              {/* Content Ownership & License */}
              <Box id="section5" component="section" sx={{ mb: 6 }}>
                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: 600,
                    fontSize: '1.4rem',
                    color: 'text.primary',
                    mb: 2.5,
                    pl: 2,
                    borderLeft: '4px solid',
                    borderColor: 'primary.main',
                  }}
                >
                  4. Content Ownership & License
                </Typography>
                <Box component="ul" sx={{ pl: 3, '& li': { mb: 1.5, color: 'text.secondary', fontSize: '16px', lineHeight: 1.7 } }}>
                  <li>You <strong>retain ownership</strong> of the content you post on BitoCircle.</li>
                  <li>By posting content, you grant BitoCircle a <strong>non-exclusive, worldwide, royalty-free license</strong> to host, store, display, and distribute your content within the platform for the purpose of operating and promoting the Services.</li>
                  <li>We reserve the right to <strong>remove, restrict, or disable access</strong> to any content that violates these Terms, our policies, or applicable laws.</li>
                </Box>
              </Box>

              {/* Community Reporting, Blocking & Moderation */}
              <Box id="section6" component="section" sx={{ mb: 6 }}>
                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: 600,
                    fontSize: '1.4rem',
                    color: 'text.primary',
                    mb: 2.5,
                    pl: 2,
                    borderLeft: '4px solid',
                    borderColor: 'primary.main',
                  }}
                >
                  5. Community Reporting, Blocking & Moderation
                </Typography>
                <Box component="ul" sx={{ pl: 3, '& li': { mb: 1.5, color: 'text.secondary', fontSize: '16px', lineHeight: 1.7 } }}>
                  <li>Users may <strong>report objectionable content</strong> at any time using in-app reporting tools.</li>
                  <li>You may <strong>block other users</strong> to prevent interaction.</li>
                  <li>Reported content is reviewed by our <strong>moderation team</strong>, typically within 24 hours.</li>
                  <li>Reports are investigated seriously and <strong>enforcement actions</strong> are applied where appropriate.</li>
                </Box>
              </Box>

              {/* Enforcement Actions */}
              <Box id="section7" component="section" sx={{ mb: 6 }}>
                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: 600,
                    fontSize: '1.4rem',
                    color: 'text.primary',
                    mb: 2.5,
                    pl: 2,
                    borderLeft: '4px solid',
                    borderColor: 'primary.main',
                  }}
                >
                  6. Enforcement Actions
                </Typography>
                <Typography sx={{ fontSize: '16px', lineHeight: 1.7, mb: 2, color: 'text.secondary' }}>
                  If you violate these Terms, BitoCircle may take one or more of the following actions:
                </Typography>
                <Box component="ul" sx={{ pl: 3, '& li': { mb: 1.5, color: 'text.secondary', fontSize: '16px', lineHeight: 1.7 } }}>
                  <li><strong>Removal</strong> of violating content</li>
                  <li><strong>Temporary or permanent</strong> account suspension</li>
                  <li><strong>Restriction</strong> of platform features</li>
                  <li><strong>Termination</strong> of account access</li>
                </Box>
                <Typography sx={{ fontSize: '16px', lineHeight: 1.7, mt: 2, color: 'text.secondary' }}>
                  We reserve the right to take enforcement action at our <strong>sole discretion</strong> to protect the community and the integrity of the platform.
                </Typography>
              </Box>

              {/* User Responsibilities */}
              <Box id="section8" component="section" sx={{ mb: 6 }}>
                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: 600,
                    fontSize: '1.4rem',
                    color: 'text.primary',
                    mb: 2.5,
                    pl: 2,
                    borderLeft: '4px solid',
                    borderColor: 'primary.main',
                  }}
                >
                  7. User Responsibilities
                </Typography>
                <Typography sx={{ fontSize: '16px', lineHeight: 1.7, mb: 2, color: 'text.secondary' }}>
                  By using BitoCircle, you agree to:
                </Typography>
                <Box component="ul" sx={{ pl: 3, '& li': { mb: 1.5, color: 'text.secondary', fontSize: '16px', lineHeight: 1.7 } }}>
                  <li><strong>Follow these Terms</strong> and all applicable laws</li>
                  <li><strong>Respect other users</strong> and the community</li>
                  <li><strong>Report violations</strong> when encountered</li>
                  <li><strong>Accept the consequences</strong> of policy violations</li>
                </Box>
              </Box>

              {/* Networking & Marketplace Features */}
              <Box id="section9" component="section" sx={{ mb: 6 }}>
                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: 600,
                    fontSize: '1.4rem',
                    color: 'text.primary',
                    mb: 2.5,
                    pl: 2,
                    borderLeft: '4px solid',
                    borderColor: 'primary.main',
                  }}
                >
                  8. Networking & Marketplace Features
                </Typography>
                <Box component="ul" sx={{ pl: 3, '& li': { mb: 1.5, color: 'text.secondary', fontSize: '16px', lineHeight: 1.7 } }}>
                  <li>BitoCircle enables <strong>networking and discovery</strong> among crypto entrepreneurs and related communities.</li>
                  <li>We <strong>do not guarantee or endorse</strong> the accuracy, legitimacy, or success of any user, project, or opportunity.</li>
                  <li>You are <strong>solely responsible</strong> for conducting due diligence before entering into collaborations, transactions, or business relationships.</li>
                </Box>
              </Box>

              {/* Third-Party Links & Integrations */}
              <Box id="section10" component="section" sx={{ mb: 6 }}>
                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: 600,
                    fontSize: '1.4rem',
                    color: 'text.primary',
                    mb: 2.5,
                    pl: 2,
                    borderLeft: '4px solid',
                    borderColor: 'primary.main',
                  }}
                >
                  9. Third-Party Links & Integrations
                </Typography>
                <Box component="ul" sx={{ pl: 3, '& li': { mb: 1.5, color: 'text.secondary', fontSize: '16px', lineHeight: 1.7 } }}>
                  <li>The Services may include <strong>links or integrations</strong> to third-party platforms.</li>
                  <li>BitoCircle is <strong>not responsible</strong> for third-party content, services, policies, or practices.</li>
                  <li>Your use of third-party services is <strong>at your own risk</strong> and subject to their terms.</li>
                </Box>
              </Box>

              {/* Privacy */}
              <Box id="section11" component="section" sx={{ mb: 6 }}>
                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: 600,
                    fontSize: '1.4rem',
                    color: 'text.primary',
                    mb: 2.5,
                    pl: 2,
                    borderLeft: '4px solid',
                    borderColor: 'primary.main',
                  }}
                >
                  10. Privacy
                </Typography>
                <Typography sx={{ fontSize: '16px', lineHeight: 1.7, color: 'text.secondary' }}>
                  Your use of BitoCircle is subject to our <strong>Privacy Policy</strong>, which explains how we collect, use, and protect your information. By using the Services, you consent to our data practices.
                </Typography>
              </Box>

              {/* Termination */}
              <Box id="section12" component="section" sx={{ mb: 6 }}>
                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: 600,
                    fontSize: '1.4rem',
                    color: 'text.primary',
                    mb: 2.5,
                    pl: 2,
                    borderLeft: '4px solid',
                    borderColor: 'primary.main',
                  }}
                >
                  11. Termination
                </Typography>
                <Box component="ul" sx={{ pl: 3, '& li': { mb: 1.5, color: 'text.secondary', fontSize: '16px', lineHeight: 1.7 } }}>
                  <li>We may <strong>suspend or terminate</strong> your account if you violate these Terms or disrupt the community.</li>
                  <li>You may <strong>deactivate your account</strong> at any time through your account settings.</li>
                </Box>
              </Box>

              {/* Disclaimers */}
              <Box id="section13" component="section" sx={{ mb: 6 }}>
                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: 600,
                    fontSize: '1.4rem',
                    color: 'text.primary',
                    mb: 2.5,
                    pl: 2,
                    borderLeft: '4px solid',
                    borderColor: 'primary.main',
                  }}
                >
                  12. Disclaimers
                </Typography>
                <Box component="ul" sx={{ pl: 3, '& li': { mb: 1.5, color: 'text.secondary', fontSize: '16px', lineHeight: 1.7 } }}>
                  <li>BitoCircle is provided on an &ldquo;<strong>as is</strong>&rdquo; and &ldquo;<strong>as available</strong>&rdquo; basis.</li>
                  <li>We make <strong>no warranties</strong> regarding uninterrupted, secure, or error-free operation.</li>
                  <li>BitoCircle is a <strong>social and networking platform</strong> and is not a financial exchange, broker, or investment advisor.</li>
                </Box>
              </Box>

              {/* Limitation of Liability */}
              <Box id="section14" component="section" sx={{ mb: 6 }}>
                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: 600,
                    fontSize: '1.4rem',
                    color: 'text.primary',
                    mb: 2.5,
                    pl: 2,
                    borderLeft: '4px solid',
                    borderColor: 'primary.main',
                  }}
                >
                  13. Limitation of Liability
                </Typography>
                <Typography sx={{ fontSize: '16px', lineHeight: 1.7, color: 'text.secondary' }}>
                  To the maximum extent permitted by law, BitoCircle shall <strong>not be liable</strong> for any indirect, incidental, consequential, or special damages arising from your use of the Services, including disputes, losses, or damages related to business dealings, investments, or third-party interactions.
                </Typography>
              </Box>

              {/* Governing Law & Jurisdiction */}

              <Box id="section15" component="section" sx={{ mb: 6 }}>
                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: 600,
                    fontSize: '1.4rem',
                    color: 'text.primary',
                    mb: 2.5,
                    pl: 2,
                    borderLeft: '4px solid',
                    borderColor: 'primary.main',
                  }}
                >
                  14. GOVERNING LAW AND ARBITRATION

                </Typography>
                <Typography sx={{ fontSize: '16px', lineHeight: 1.7, color: 'text.secondary' }}>
                  Licensee and us agree to arbitrate any dispute arising from these Terms or your use of the Services, except for disputes in which either party seeks equitable and other relief for the alleged unlawful use of copyrights, trademarks, trade names, logos, trade secrets or patents. ARBITRATION PREVENTS YOU FROM SUING IN COURT OR FROM HAVING A JURY TRIAL.
                </Typography>

              </Box>

              {/* Changes to These Terms */}
              <Box id="section16" component="section" sx={{ mb: 6 }}>
                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: 600,
                    fontSize: '1.4rem',
                    color: 'text.primary',
                    mb: 2.5,
                    pl: 2,
                    borderLeft: '4px solid',
                    borderColor: 'primary.main',
                  }}
                >
                  15. Changes to These Terms
                </Typography>
                <Box component="ul" sx={{ pl: 3, '& li': { mb: 1.5, color: 'text.secondary', fontSize: '16px', lineHeight: 1.7 } }}>
                  <li>We may <strong>update these Terms</strong> from time to time.</li>
                  <li>Continued use of BitoCircle after updated Terms are published constitutes <strong>acceptance of the revised Terms</strong>.</li>
                </Box>
              </Box>

              {/* Contact Information */}
              <Box id="section17" component="section" sx={{ mb: 0 }}>
                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: 600,
                    fontSize: '1.4rem',
                    color: 'text.primary',
                    mb: 2.5,
                    pl: 2,
                    borderLeft: '4px solid',
                    borderColor: 'primary.main',
                  }}
                >
                  16. Contact Information
                </Typography>
                <Typography sx={{ fontSize: '16px', lineHeight: 1.7, mb: 2, color: 'text.secondary' }}>
                  For questions or concerns regarding these Terms, please contact:
                </Typography>
                <Typography sx={{ fontSize: '16px', lineHeight: 1.7, mb: 2.5, color: 'text.secondary' }}>
                  <strong>Email:</strong>{' '}
                  <MuiLink
                    href="mailto:contact@bitocircle.com"
                    sx={{
                      color: 'primary.main',
                      fontWeight: 600,
                      textDecoration: 'none',
                      '&:hover': { textDecoration: 'underline' },
                    }}
                  >
                    contact@bitocircle.com
                  </MuiLink>
                </Typography>
                <Typography sx={{ fontSize: '16px', lineHeight: 1.7, color: 'text.secondary', fontStyle: 'italic' }}>
                  By using BitoCircle, you acknowledge that you have read, understood, and agreed to these Unified Terms of Service & Community Guidelines.
                </Typography>
                <Box sx={{ mb: 25 }}>

                </Box>
              </Box>
            </Box>
          </Container>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default TermsPage;