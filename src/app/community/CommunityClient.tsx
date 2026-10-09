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
  { id: 'section1', title: 'Community Conduct' },
  { id: 'section2', title: 'Prohibited Activities' },
  { id: 'section3', title: 'Content Posting Rules' },
  { id: 'section4', title: 'Allowed Content Examples' },
  { id: 'section5', title: 'Restricted Content' },
  { id: 'section6', title: 'Marketplace & Advertising Standards' },
  { id: 'section7', title: 'Privacy & Security' },
  { id: 'section8', title: 'Enforcement' },
  { id: 'section9', title: 'Your Role in BitoCircle' },
];

const CommunityClient = () => {
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
                  Community & Content Policy
                </Typography>
                <Typography sx={{ fontSize: '16px', lineHeight: 1.7, mb: 1.5, color: 'text.secondary' }}>
                  BitoCircle is the global platform where <strong>crypto entrepreneurs connect, collaborate, and get discovered by
                  users worldwide.</strong>
                </Typography>
                <Typography sx={{ fontSize: '16px', lineHeight: 1.7, mb: 2.5, color: 'text.secondary' }}>
                  To ensure a <strong>safe, professional, and trustworthy environment</strong>, we have established this <strong>Community & Content Policy</strong>. These rules apply to <strong>all users, content, and activities</strong> on BitoCircle.
                </Typography>
              </Box>

              {/* Community Conduct */}
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
                  Community Conduct
                </Typography>
                <Box component="ul" sx={{ pl: 3, '& li': { mb: 1.5, color: 'text.secondary', fontSize: '16px', lineHeight: 1.7 } }}>
                  <li><strong>Be Authentic:</strong> Use your real identity, represent yourself and your projects truthfully. Fake profiles, impersonation, or misleading information are prohibited.</li>
                  <li><strong>Respect Others:</strong> Treat every member with professionalism and courtesy. Harassment, hate speech, discrimination, or abuse will not be tolerated.</li>
                  <li><strong>Collaborate, Don&apos;t Exploit:</strong> Share opportunities, not scams. Engage in honest networking and partnership building.</li>
                </Box>
              </Box>

              {/* Prohibited Activities */}
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
                  Prohibited Activities
                </Typography>
                <Box component="ul" sx={{ pl: 3, '& li': { mb: 1.5, color: 'text.secondary', fontSize: '16px', lineHeight: 1.7 } }}>
                  <li><strong>Scams & Fraud:</strong> No pump-and-dump schemes, rug pulls, fake ICOs, Ponzi schemes, or deceptive practices.</li>
                  <li><strong>Unregulated Investment Promotions:</strong> Do not market securities, tokens, or projects in violation of applicable laws.</li>
                  <li><strong>Market Manipulation:</strong> Sharing insider information, price manipulation, or coordinated trading schemes is forbidden.</li>
                  <li><strong>Spam:</strong> Avoid mass-messaging, repetitive posting, or irrelevant promotions.</li>
                </Box>
              </Box>

              {/* Content Posting Rules */}
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
                  Content Posting Rules
                </Typography>
                <Typography sx={{ fontSize: '16px', lineHeight: 1.7, mb: 2, color: 'text.secondary' }}>
                  Your posts, listings, and ads should:
                </Typography>
                <Box component="ul" sx={{ pl: 3, '& li': { mb: 1.5, color: 'text.secondary', fontSize: '16px', lineHeight: 1.7 } }}>
                  <li><strong>Add Value:</strong> Share knowledge, insights, updates, or opportunities that benefit the community.</li>
                  <li><strong>Be Transparent:</strong> Clearly disclose affiliations, risks, and disclaimers when promoting tokens, NFTs, DeFi projects, or investment opportunities.</li>
                  <li><strong>Respect IP Rights:</strong> Share only original or properly licensed content. Do not copy, plagiarize, or misuse logos/brands.</li>
                  <li><strong>Stay Relevant:</strong> Keep discussions focused on crypto, entrepreneurship, blockchain innovation, and Web3 adoption.</li>
                </Box>
              </Box>

              {/* Allowed Content Examples */}
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
                  Allowed Content Examples
                </Typography>
                <Box component="ul" sx={{ pl: 3, '& li': { mb: 1.5, color: 'text.secondary', fontSize: '16px', lineHeight: 1.7 } }}>
                  <li>Industry insights, articles, research reports</li>
                  <li>Startup introductions, pitch decks, and collaborations</li>
                  <li>Job postings and talent networking</li>
                  <li>NFT, DAO, or DeFi project updates (with clear disclaimers)</li>
                  <li>Event promotions (conferences, webinars, hackathons)</li>
                  <li>Knowledge sharing, tutorials, and community-building posts</li>
                </Box>
              </Box>

              {/* Restricted Content */}
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
                  Restricted Content
                </Typography>
                <Typography sx={{ fontSize: '16px', lineHeight: 1.7, mb: 1, color: 'text.secondary' }}>
                  🚫 Misleading profit claims (&quot;100x guaranteed returns&quot;)
                </Typography>
                <Typography sx={{ fontSize: '16px', lineHeight: 1.7, mb: 1, color: 'text.secondary' }}>
                  🚫 Unverified airdrops, bounty campaigns, or giveaways
                </Typography>
                <Typography sx={{ fontSize: '16px', lineHeight: 1.7, mb: 1, color: 'text.secondary' }}>
                  🚫 Political, religious, or unrelated promotional content
                </Typography>
                <Typography sx={{ fontSize: '16px', lineHeight: 1.7, mb: 1, color: 'text.secondary' }}>
                  🚫 Offensive, hateful, or harassing posts
                </Typography>
                <Typography sx={{ fontSize: '16px', lineHeight: 1.7, mb: 2.5, color: 'text.secondary' }}>
                  🚫 Links to phishing, malware, or unsafe websites
                </Typography>
              </Box>

              {/* Marketplace & Advertising Standards */}
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
                  Marketplace & Advertising Standards
                </Typography>
                <Box component="ul" sx={{ pl: 3, '& li': { mb: 1.5, color: 'text.secondary', fontSize: '16px', lineHeight: 1.7 } }}>
                  <li>All listings must be <strong>real, verifiable, and transparent</strong>.</li>
                  <li>Sponsored content and paid promotions must be <strong>clearly labelled</strong>.</li>
                  <li>Token sales, ICOs, or fundraising campaigns must <strong>comply with local laws</strong> and disclose risks.</li>
                  <li>Projects must provide accurate details (whitepapers, audits, team info) before promoting.</li>
                </Box>
              </Box>

              {/* Privacy & Security */}
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
                  Privacy & Security
                </Typography>
                <Box component="ul" sx={{ pl: 3, '& li': { mb: 1.5, color: 'text.secondary', fontSize: '16px', lineHeight: 1.7 } }}>
                  <li>Never share sensitive information such as wallet keys, seed phrases, or passwords.</li>
                  <li>Report suspicious activity, scams, or violations to BitoCircle moderators.</li>
                  <li>Be cautious when engaging in private deals or partnerships.</li>
                </Box>
              </Box>

              {/* Enforcement */}
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
                  Enforcement
                </Typography>
                <Typography sx={{ fontSize: '16px', lineHeight: 1.7, mb: 2, color: 'text.secondary' }}>
                  Violating this policy may result in:
                </Typography>
                <Box component="ul" sx={{ pl: 3, '& li': { mb: 1.5, color: 'text.secondary', fontSize: '16px', lineHeight: 1.7 } }}>
                  <li>Removal of content</li>
                  <li>Account warnings</li>
                  <li>Temporary suspension</li>
                  <li>Permanent ban</li>
                  <li>Reporting of unlawful activity to relevant authorities</li>
                </Box>
              </Box>

              {/* Your Role in BitoCircle */}
              <Box id="section9" component="section" sx={{ mb: 0 }}>
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
                  Your Role in BitoCircle
                </Typography>
                <Typography sx={{ fontSize: '16px', lineHeight: 1.7, mb: 2, color: 'text.secondary' }}>
                  BitoCircle thrives on <strong>trust and collaboration</strong>. Every member contributes to the quality of the community.
                </Typography>
                <Box component="ul" sx={{ pl: 3, mb: 3, '& li': { mb: 1.5, color: 'text.secondary', fontSize: '16px', lineHeight: 1.7 } }}>
                  <li>Share responsibly</li>
                  <li>Build credibility</li>
                  <li>Respect diversity of thought</li>
                  <li>Help others grow</li>
                </Box>

                <Typography sx={{ fontSize: '16px', lineHeight: 1.7, mb: 2, color: 'text.secondary', fontWeight: 600 }}>
                  Together, we are shaping the future of Web3 by creating a trusted, global space for crypto entrepreneurs and users.
                </Typography>
                <Typography sx={{ fontSize: '16px', lineHeight: 1.7, color: 'text.secondary' }}>
                  For concerns, violations, or questions, contact us:{' '}
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
              </Box>
            </Box>
          </Container>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default CommunityClient;