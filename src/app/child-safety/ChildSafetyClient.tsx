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
  { id: 'section1', title: 'Zero-Tolerance Policy' },
  { id: 'section2', title: 'Prohibited Content and Activities' },
  { id: 'section3', title: 'Enforcement Actions' },
  { id: 'section4', title: 'Detection and Reporting' },
  { id: 'section5', title: 'Legal Compliance' },
  { id: 'section6', title: 'Age Restriction' },
  { id: 'section7', title: 'Contact' },
];

const ChildSafetyClient = () => {
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
      const headerOffset = 100; // Account for fixed header
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
      
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
      
      // Check if we're at the very top of the page
      if (window.scrollY < 200) {
        current = sections[0].id;
      } else {
        for (const { id, element } of sectionElements) {
          if (element) {
            const rect = element.getBoundingClientRect();
            // Element is considered active if it's within the top 200px of viewport
            if (rect.top <= 200 && rect.bottom > 200) {
              current = id;
            }
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
      <List sx={{ flex: 1, overflow: 'auto', py: 1, pb: 3 }}>
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
                  Child Safety Standards & CSAE Policy
                </Typography>
                <Typography sx={{ fontSize: '16px', lineHeight: 1.7, mb: 2.5, color: 'text.secondary', textAlign: 'center' }}>
                  BitoCircle - Hashcash Consultants
                </Typography>
              </Box>

              {/* Zero-Tolerance Policy */}
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
                  1. Zero-Tolerance Policy
                </Typography>
                <Typography sx={{ fontSize: '16px', lineHeight: 1.7, mb: 2, color: 'text.secondary' }}>
                  Hashcash Consultants enforces a <strong>zero-tolerance policy</strong> toward child sexual abuse and exploitation (CSAE) on BitoCircle. Any form of CSAE is strictly prohibited.
                </Typography>
              </Box>

              {/* Prohibited Content and Activities */}
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
                  2. Prohibited Content and Activities
                </Typography>
                <Typography sx={{ fontSize: '16px', lineHeight: 1.7, mb: 2, color: 'text.secondary' }}>
                  The following activities and content are expressly prohibited on BitoCircle:
                </Typography>
                <Box component="ul" sx={{ pl: 3, '& li': { mb: 1.5, color: 'text.secondary', fontSize: '16px', lineHeight: 1.7 } }}>
                  <li>Child sexual abuse material (CSAM)</li>
                  <li>Any sexualized content involving minors</li>
                  <li>Grooming, solicitation, or exploitation of minors</li>
                  <li>Sexual communication or requests involving minors</li>
                  <li>Distribution, possession, or solicitation of CSAE-related content</li>
                  <li>Any conduct that violates applicable child protection laws</li>
                </Box>
              </Box>

              {/* Enforcement Actions */}
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
                  3. Enforcement Actions
                </Typography>
                <Typography sx={{ fontSize: '16px', lineHeight: 1.7, mb: 2, color: 'text.secondary' }}>
                  Violations of these standards result in immediate enforcement action, which may include:
                </Typography>
                <Box component="ul" sx={{ pl: 3, '& li': { mb: 1.5, color: 'text.secondary', fontSize: '16px', lineHeight: 1.7 } }}>
                  <li>Removal of content</li>
                  <li>Account suspension or permanent termination</li>
                  <li>Reporting to law enforcement and relevant authorities, as required by law</li>
                </Box>
              </Box>

              {/* Detection and Reporting */}
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
                  4. Detection and Reporting
                </Typography>
                <Typography sx={{ fontSize: '16px', lineHeight: 1.7, mb: 2, color: 'text.secondary' }}>
                  BitoCircle maintains moderation measures, including a dedicated in-app reporting mechanism, user reports, and review processes to identify policy violations.
                </Typography>
                <Typography sx={{ fontSize: '16px', lineHeight: 1.7, mb: 2, color: 'text.secondary' }}>
                  Users must report any suspected CSAE-related content or behavior immediately using:
                </Typography>
                <Box component="ul" sx={{ pl: 3, mb: 3, '& li': { mb: 1.5, color: 'text.secondary', fontSize: '16px', lineHeight: 1.7 } }}>
                  <li>The in-app reporting feature, or</li>
                  <li>
                    Email:{' '}
                    <MuiLink
                      href="mailto:support@bitocircle.com"
                      sx={{
                        color: 'primary.main',
                        fontWeight: 600,
                        textDecoration: 'none',
                        '&:hover': { textDecoration: 'underline' },
                      }}
                    >
                      support@bitocircle.com
                    </MuiLink>
                  </li>
                </Box>
                <Typography sx={{ fontSize: '16px', lineHeight: 1.7, color: 'text.secondary' }}>
                  All reports are reviewed promptly and handled with priority.
                </Typography>
              </Box>

              {/* Legal Compliance */}
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
                  5. Legal Compliance
                </Typography>
                <Typography sx={{ fontSize: '16px', lineHeight: 1.7, mb: 2, color: 'text.secondary' }}>
                  Hashcash Consultants complies with all applicable child safety and online protection laws.
                </Typography>
                <Typography sx={{ fontSize: '16px', lineHeight: 1.7, color: 'text.secondary' }}>
                  Where legally required, confirmed child sexual abuse material is reported to the <strong>National Center for Missing & Exploited Children (NCMEC)</strong> or the appropriate regional authority, and we cooperate fully with law enforcement agencies.
                </Typography>
              </Box>

              {/* Age Restriction */}
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
                  6. Age Restriction
                </Typography>
                <Typography sx={{ fontSize: '16px', lineHeight: 1.7, mb: 2, color: 'text.secondary' }}>
                  BitoCircle is <strong>not intended for individuals under 18 years of age</strong>.
                </Typography>
                <Typography sx={{ fontSize: '16px', lineHeight: 1.7, color: 'text.secondary' }}>
                  Accounts identified as belonging to minors will be terminated.
                </Typography>
              </Box>

              {/* Contact */}
              <Box id="section7" component="section" sx={{ mb: 0, pb: 10 }}>
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
                  7. Contact
                </Typography>
                <Typography sx={{ fontSize: '16px', lineHeight: 1.7, mb: 2, color: 'text.secondary' }}>
                  For child safety concerns or questions regarding this policy:
                </Typography>
                <Box component="ul" sx={{ pl: 3, '& li': { mb: 1.5, color: 'text.secondary', fontSize: '16px', lineHeight: 1.7 } }}>
                  <li><strong>Developer:</strong> Hashcash Consultants</li>
                  <li><strong>App:</strong> BitoCircle</li>
                  <li>
                    <strong>Email:</strong>{' '}
                    <MuiLink
                      href="mailto:support@bitocircle.com"
                      sx={{
                        color: 'primary.main',
                        fontWeight: 600,
                        textDecoration: 'none',
                        '&:hover': { textDecoration: 'underline' },
                      }}
                    >
                      support@bitocircle.com
                    </MuiLink>
                  </li>
                </Box>
              </Box>
            </Box>
          </Container>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default ChildSafetyClient;