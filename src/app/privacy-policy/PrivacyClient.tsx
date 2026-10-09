'use client';
import React, { useState, useEffect, useMemo } from 'react';
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
import bitoHubTextLogo from '../Assets/img/bitoHubTextLogo.png';

const drawerWidth = 280;

interface Section {
  id: string;
  title: string;
}

const sections: Section[] = [
  { id: 'section1', title: 'Information We Collect' },
  { id: 'section2', title: 'How We Use Your Information' },
  { id: 'section3', title: 'How We Share Your Information' },
  { id: 'section4', title: 'Your Privacy Controls' },
  { id: 'section5', title: 'Cookies & Tracking Technologies' },
  { id: 'section6', title: 'Data Retention' },
  { id: 'section7', title: 'Security' },
  { id: 'section8', title: 'Children\'s Privacy' },
  { id: 'section9', title: 'Cross-Border Data Transfers' },
  { id: 'section10', title: 'Your Rights' },
  { id: 'section11', title: 'Third-Party Links' },
  { id: 'section12', title: 'Changes to Privacy Policy' },
  { id: 'section13', title: 'DATA DELETION PROCEDURE' },
  { id: 'section14', title: 'Child Safety and CSAE Policy' },
  { id: 'section15', title: 'Governing Law and Arbitration' },
  { id: 'section16', title: 'Contact Us' },
];

const PrivacyClient = () => {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const [mode, setMode] = useState<'light' | 'dark'>('light');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('section1');

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
    window.dispatchEvent(new CustomEvent('themeChange', { detail: newMode }));
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
              <Box component="section" sx={{ mb: 6 }}>
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
                  Privacy Policy
                </Typography>
                <Typography sx={{ fontSize: '16px', lineHeight: 1.7, mb: 2, color: 'text.secondary', fontStyle: 'italic' }}>
                  Last updated on: December 5, 2025
                </Typography>

                <Typography sx={{ fontSize: '16px', lineHeight: 1.7, mb: 2.5, color: 'text.secondary' }}>
                  At <strong>BitoCircle</strong>, your privacy is our priority. This Privacy Policy explains how we collect, use,
                  share, and protect your personal information when you access our website, mobile application, and related
                  services (&ldquo;Services&rdquo;). By using BitoCircle, you agree to the terms outlined in this Privacy Policy.
                </Typography>

                
              </Box>

              {/* Information We Collect */}
              <Box id="section1" component="section" sx={{ mb: 6 }}>
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
                  Information We Collect
                </Typography>
                <Typography sx={{ fontSize: '16px', lineHeight: 1.7, mb: 2, color: 'text.secondary' }}>
                  We collect the following types of information when you use BitoCircle:
                </Typography>

                <Typography sx={{ fontSize: '16px', lineHeight: 1.7, mb: 1.5, color: 'text.secondary', fontWeight: 600 }}>
                  1. Information You Provide Directly
                </Typography>
                <Box component="ul" sx={{ pl: 3, mb: 3, '& li': { mb: 1.5, color: 'text.secondary', fontSize: '16px', lineHeight: 1.7 } }}>
                  <li><strong>Account Information:</strong> Name, username, email address, password, profile photo, and bio.</li>
                  <li><strong>Professional Details:</strong> Company name, role, expertise, project details, and links to external sites.</li>
                  <li><strong>Content & Communications:</strong> Posts, comments, messages, uploads, and community participation.</li>
                  <li><strong>Transaction Information:</strong> If you use BitoCircle marketplace features (e.g., paid services, promotions), we may collect billing details and payment confirmations (processed through third-party providers).</li>
                </Box>

                <Typography sx={{ fontSize: '16px', lineHeight: 1.7, mb: 1.5, color: 'text.secondary', fontWeight: 600 }}>
                  2. Information We Collect Automatically
                </Typography>
                <Box component="ul" sx={{ pl: 3, mb: 3, '& li': { mb: 1.5, color: 'text.secondary', fontSize: '16px', lineHeight: 1.7 } }}>
                  <li><strong>Device & Log Data:</strong> IP address, browser type, device identifiers, operating system, and access times.</li>
                  <li><strong>Usage Data:</strong> Pages viewed, features used, interactions with other users, and clickstream data.</li>
                  <li><strong>Cookies & Tracking Technologies:</strong> Session cookies, analytics tools, and similar technologies to improve functionality.</li>
                </Box>

                <Typography sx={{ fontSize: '16px', lineHeight: 1.7, mb: 1.5, color: 'text.secondary', fontWeight: 600 }}>
                  3. Information from Third Parties
                </Typography>
                <Box component="ul" sx={{ pl: 3, '& li': { mb: 1.5, color: 'text.secondary', fontSize: '16px', lineHeight: 1.7 } }}>
                  <li><strong>Social Logins & Integrations:</strong> If you sign up using LinkedIn, Google, or other platforms, we may receive profile information.</li>
                  <li><strong>Partners & Affiliates:</strong> We may receive data from trusted third-party services that integrate with BitoCircle.</li>
                </Box>
              </Box>

              {/* How We Use Your Information */}
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
                  How We Use Your Information
                </Typography>
                <Typography sx={{ fontSize: '16px', lineHeight: 1.7, mb: 2, color: 'text.secondary' }}>
                  We use your information to:
                </Typography>
                <Box component="ul" sx={{ pl: 3, '& li': { mb: 1.5, color: 'text.secondary', fontSize: '16px', lineHeight: 1.7 } }}>
                  <li>Provide, personalize, and improve BitoCircle Services.</li>
                  <li>Enable networking between entrepreneurs, businesses, and crypto users.</li>
                  <li>Suggest connections, communities, and opportunities relevant to your profile.</li>
                  <li>Communicate with you about updates, security alerts, events, and promotions.</li>
                  <li>Ensure platform safety, security, and compliance with applicable laws.</li>
                  <li>Conduct analytics and research to enhance our features and offerings.</li>
                </Box>
              </Box>

              {/* How We Share Your Information */}
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
                  How We Share Your Information
                </Typography>
                <Typography sx={{ fontSize: '16px', lineHeight: 1.7, mb: 2, color: 'text.secondary' }}>
                  BitoCircle <strong>does not sell your personal data</strong>. However, we may share your information in the following ways:
                </Typography>
                <Box component="ul" sx={{ pl: 3, '& li': { mb: 1.5, color: 'text.secondary', fontSize: '16px', lineHeight: 1.7 } }}>
                  <li><strong>With Other Users:</strong> Your profile, posts, and activity are visible to other BitoCircle members, subject to your privacy settings.</li>
                  <li><strong>With Service Providers:</strong> Trusted third-party vendors who support operations (e.g., cloud hosting, analytics, payment processing).</li>
                  <li><strong>For Legal Compliance:</strong> To comply with legal obligations, enforce Terms of Service, or protect rights, property, and safety.</li>
                  <li><strong>During Business Transfers:</strong> If BitoCircle undergoes a merger, acquisition, or sale of assets, your information may be transferred.</li>
                </Box>
              </Box>

              {/* Your Privacy Controls */}
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
                  Your Privacy Controls
                </Typography>
                <Typography sx={{ fontSize: '16px', lineHeight: 1.7, mb: 2, color: 'text.secondary' }}>
                  You have choices about how your data is used:
                </Typography>
                <Box component="ul" sx={{ pl: 3, '& li': { mb: 1.5, color: 'text.secondary', fontSize: '16px', lineHeight: 1.7 } }}>
                  <li><strong>Profile Settings:</strong> Manage visibility of your profile, posts, and activity.</li>
                  <li><strong>Communication Preferences:</strong> Control email, notifications, and marketing updates.</li>
                  <li><strong>Account Deletion:</strong> You can request permanent deletion of your account and data at any time.</li>
                </Box>
              </Box>

              {/* Cookies & Tracking Technologies */}
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
                  Cookies & Tracking Technologies
                </Typography>
                <Box component="ul" sx={{ pl: 3, '& li': { mb: 1.5, color: 'text.secondary', fontSize: '16px', lineHeight: 1.7 } }}>
                  <li>We use cookies to keep you logged in, remember preferences, and analyze platform usage.</li>
                  <li>Third-party services (e.g., analytics providers) may also use cookies for insights.</li>
                  <li>You can manage or disable cookies through your browser settings, though this may affect functionality.</li>
                </Box>
              </Box>

              {/* Data Retention */}
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
                  Data Retention
                </Typography>
                <Box component="ul" sx={{ pl: 3, '& li': { mb: 1.5, color: 'text.secondary', fontSize: '16px', lineHeight: 1.7 } }}>
                  <li>We retain your information as long as your account is active or as needed to provide services.</li>
                  <li>Content you post may remain accessible to others even after account deletion (e.g., shared discussions).</li>
                  <li>Financial and legal records may be retained to meet compliance requirements.</li>
                </Box>
              </Box>

              {/* Security */}
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
                  Security
                </Typography>
                <Box component="ul" sx={{ pl: 3, '& li': { mb: 1.5, color: 'text.secondary', fontSize: '16px', lineHeight: 1.7 } }}>
                  <li>We use industry-standard encryption, firewalls, and secure servers to protect your data.</li>
                  <li>Despite best efforts, no platform is completely secure. Users should exercise caution when sharing sensitive information.</li>
                  <li>No abusive, hateful, sexual, illegal content.</li>
                  <li>No harassment.</li>
                </Box>
              </Box>

              {/* Children's Privacy */}
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
                  Children&apos;s Privacy
                </Typography>
                <Box component="ul" sx={{ pl: 3, '& li': { mb: 1.5, color: 'text.secondary', fontSize: '16px', lineHeight: 1.7 } }}>
                  <li>BitoCircle is <strong>not intended for individuals under 18 years of age</strong>.</li>
                  <li>We do not knowingly collect data from minors. If we discover such data, it will be deleted immediately.</li>


                </Box>
              </Box>

              {/* Cross-Border Data Transfers */}
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
                  Cross-Border Data Transfers
                </Typography>
                <Box component="ul" sx={{ pl: 3, '& li': { mb: 1.5, color: 'text.secondary', fontSize: '16px', lineHeight: 1.7 } }}>
                  <li>As a global platform, your information may be stored and processed in countries outside your own.</li>
                  <li>By using BitoCircle, you consent to such transfers, subject to applicable laws.</li>
                </Box>
              </Box>

              {/* Your Rights */}
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
                  Your Rights
                </Typography>
                <Typography sx={{ fontSize: '16px', lineHeight: 1.7, mb: 2, color: 'text.secondary' }}>
                  Depending on your jurisdiction, you may have rights including:
                </Typography>
                <Box component="ul" sx={{ pl: 3, '& li': { mb: 1.5, color: 'text.secondary', fontSize: '16px', lineHeight: 1.7 } }}>
                  <li>Access to the personal data we hold about you.</li>
                  <li>Correction or deletion of your data.</li>
                  <li>Restriction of processing or objection to certain uses.</li>
                  <li>Data portability requests.</li>
                  <li>
                    To exercise these rights, contact us at{' '}
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
                    .
                  </li>
                </Box>
              </Box>

              {/* Third-Party Links */}
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
                  Third-Party Links
                </Typography>
                <Box component="ul" sx={{ pl: 3, '& li': { mb: 1.5, color: 'text.secondary', fontSize: '16px', lineHeight: 1.7 } }}>
                  <li>BitoCircle may contain links to external websites or services.</li>
                  <li>We are not responsible for their privacy practices or content.</li>
                </Box>
              </Box>

              {/* Changes to Privacy Policy */}
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
                  Changes to Privacy Policy
                </Typography>
                <Box component="ul" sx={{ pl: 3, '& li': { mb: 1.5, color: 'text.secondary', fontSize: '16px', lineHeight: 1.7 } }}>
                  <li>We may update this Privacy Policy periodically.</li>
                  <li>Any changes will be notified via the platform or email.</li>
                  <li>Continued use of BitoCircle after updates indicates acceptance.</li>
                </Box>
              </Box>



              {/* Contact Us */}
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
                  DATA DELETION PROCEDURE
                </Typography>
                <Typography sx={{ fontSize: '16px', lineHeight: 1.7, color: 'text.secondary' }}>
                  (A) PERSONAL DATA: Retained only as long as necessary to fulfill the purposes for which it was collected or as required by law. Once the retention period ends, personal data is securely deleted.
                </Typography>
                <Typography sx={{ fontSize: '16px', lineHeight: 1.7, color: 'text.secondary' }}>
                  (B) FINANCIAL DATA: Retained as required by applicable financial and tax regulations. Once the retention period ends, financial data is securely deleted.
                </Typography>
                <Typography sx={{ fontSize: '16px', lineHeight: 1.7, color: 'text.secondary' }}>
                  (C) OPERATIONAL DATA: Retained for a reasonable period to support business operations. Once it is no longer needed, operational data is securely deleted.
                </Typography>
                <Typography sx={{ fontSize: '16px', lineHeight: 1.7, color: 'text.secondary' }}>
                  (E) Data deletion involves the secure and irreversible removal of data from all relevant storage locations. The procedures for data deletion include:
                </Typography>
                <Typography sx={{ fontSize: '16px', lineHeight: 1.7, color: 'text.secondary' }}>
                  (a) Identifying data to be deleted based on the data retention periods.
                </Typography>
                <Typography sx={{ fontSize: '16px', lineHeight: 1.7, color: 'text.secondary' }}>
                  (b) Verifying the deletion request and obtaining necessary approvals.
                </Typography>
                <Typography sx={{ fontSize: '16px', lineHeight: 1.7, color: 'text.secondary' }}>
                  (c) Using appropriate methods and tools to securely delete data.
                </Typography>
                <Typography sx={{ fontSize: '16px', lineHeight: 1.7, color: 'text.secondary' }}>
                  (d)  Documenting the deletion process for audit and compliance purposes.
                </Typography>
              </Box>


              {/* Contact Us */}
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
                  Child Safety and CSAE Policy

                </Typography>
                <Typography sx={{ fontSize: '16px', lineHeight: 1.7, color: 'text.secondary' }}>
                  We have zero tolerance for child sexual abuse and exploitation (CSAE). Our app strictly prohibits any content, behavior, or activity involving sexual exploitation or abuse of minors, including child sexual abuse material (CSAM), grooming, or sexual communication involving minors.
                </Typography>
                <Typography sx={{ fontSize: '16px', lineHeight: 1.7, color: 'text.secondary' }}>
                  We actively monitor and moderate content using automated tools and manual review. Users can report any suspected CSAE content directly within the app or by contacting us at support@bitocircle.com.
                </Typography>
                <Typography sx={{ fontSize: '16px', lineHeight: 1.7, color: 'text.secondary' }}>
                  We cooperate with law enforcement and relevant authorities when CSAE violations are identified and take immediate action, including content removal and account termination.
                </Typography>
              </Box>

              {/* Contact Us */}
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
                  GOVERNING LAW AND ARBITRATION

                </Typography>
                <Typography sx={{ fontSize: '16px', lineHeight: 1.7, color: 'text.secondary' }}>
                  Licensee and us agree to arbitrate any dispute arising from these Terms or your use of the Services, except for disputes in which either party seeks equitable and other relief for the alleged unlawful use of copyrights, trademarks, trade names, logos, trade secrets or patents. ARBITRATION PREVENTS YOU FROM SUING IN COURT OR FROM HAVING A JURY TRIAL.
                </Typography>

              </Box>

              {/* Contact Us */}
              <Box id="section16" component="section" sx={{ mb: 0 }}>
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
                  Contact Us
                </Typography>
                <Typography sx={{ fontSize: '16px', lineHeight: 1.7, color: 'text.secondary' }}>
                  If you have questions or concerns about this Privacy Policy, contact us at:{' '}
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
                <Box sx={{ mb: 45 }}>

                </Box>
              </Box>


            </Box>
          </Container>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default PrivacyClient;