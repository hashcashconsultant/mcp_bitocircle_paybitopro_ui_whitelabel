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
import bitoHubTextLogo from '../Assets/img/bitoHubTextLogo.png';

const drawerWidth = 280;

interface Section {
  id: string;
  title: string;
}

const sections: Section[] = [
  { id: 'section1', title: 'Grant of License' },
  { id: 'section2', title: 'Reservation of Rights and Ownership' },
  { id: 'section3', title: 'Limitation on End User Rights' },
  { id: 'section4', title: 'Software Updates' },
  { id: 'section5', title: 'No Software Transfer' },
  { id: 'section6', title: 'Term' },
  { id: 'section7', title: 'Disclaimer of Warranty' },
  { id: 'section8', title: 'Limitation of Liability' },
  { id: 'section9', title: 'Applicable Law; Arbitration' },
  { id: 'section10', title: 'Entire Agreement; Severability' },
  { id: 'section11', title: 'Injunctive Relief' },
];

const EULAClient = () => {
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
                  End-User License Agreement
                </Typography>
                <Typography sx={{ fontSize: '16px', lineHeight: 1.7, mb: 2, color: 'text.secondary', fontStyle: 'italic' }}>
                  Last updated on: December 5, 2025
                </Typography>
                <Typography sx={{ fontSize: '16px', lineHeight: 1.7, mb: 2.5, color: 'text.secondary' }}>
                  This End-User License Agreement (&ldquo;EULA&rdquo;) is a legal agreement between You (&ldquo;Licensee&rdquo;, &ldquo;You&rdquo;) as our user (either an individual or an entity) and its related mobile and other applications and who operates our website and its related mobile and other applications (&ldquo;Technology Platform&rdquo;), including:
                </Typography>
                <Box component="ol" sx={{ pl: 3, '& li': { mb: 1.5, color: 'text.secondary', fontSize: '16px', lineHeight: 1.7 } }}>
                  <li>all HTML files, XML files, Java files, graphics files, animation files, video files, data files, technology, development tools, scripts and programs, both in object code and source code etc. (the &ldquo;Software&rdquo;). The Software is owned by Licensor and/or its affiliated companies and is incorporated into the Technology Platform in order to ensure functionality of the Technology Platform;</li>
                  <li>any other intellectual property items of Licensor and/or its affiliated companies incorporated into or associated with the Technology Platform such as patents, designs know-how, associated media, online or electronic documentation (hereinafter, the &ldquo;IP&rdquo;)</li>
                </Box>
                <Typography sx={{ fontSize: '16px', lineHeight: 1.7, mb: 2, color: 'text.secondary', fontWeight: 600, mt: 3 }}>
                  BY INSTALLING, COPYING AND OTHERWISE USING THE SOFTWARE AND THE IP YOU ACCEPT THE TERMS OF THIS EULA REGARDING THE SOFTWARE AND THE IP. IF YOU DO NOT ACCEPT THESE TERMS, YOU ARE NOT PERMITTED TO USE THE SOFTWARE AND THE IP.
                </Typography>
                <Typography sx={{ fontSize: '16px', lineHeight: 1.7, mb: 2.5, color: 'text.secondary', fontStyle: 'italic' }}>
                  This EULA is not applicable to the Application Programming Interfaces (API). The use of API is governed under the separate API License Agreement.
                </Typography>
              </Box>

              {/* Grant of License */}
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
                  1. GRANT OF LICENSE
                </Typography>
                <Typography sx={{ fontSize: '16px', lineHeight: 1.7, mb: 2, color: 'text.secondary' }}>
                  <strong>1.1.</strong> By installing, downloading and otherwise using the Software and the IP You agree to become the Licensee and be granted limited, non-exclusive, non-sublicensable, worldwide, non-assignable, non-exclusive and royalty-free license to use the Software and the IP. Licensor grants You the following rights provided that You comply with all terms and conditions of this EULA:
                </Typography>
                <Typography sx={{ fontSize: '16px', lineHeight: 1.7, mb: 2.5, color: 'text.secondary', pl: 3 }}>
                  <strong>1.1 (a)</strong> You may download, install, use, access, display and run one copy of the Software only as an end user of the Technology Platform. The Software shall remain and be used within the Technology Platform as its functional part; You shall use the IP only as an end user of the Technology Platform and only for the purposes of exploiting the Technology Platform and its functions.
                </Typography>
              </Box>

              {/* Reservation of Rights and Ownership */}
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
                  2. RESERVATION OF RIGHTS AND OWNERSHIP
                </Typography>
                <Typography sx={{ fontSize: '16px', lineHeight: 1.7, mb: 2, color: 'text.secondary' }}>
                  <strong>2.1.</strong> The Software and the IP are protected by copyright, patent, registration and other intellectual property regulations. Licensor or its suppliers own the title, copyright and other intellectual property rights in the Software and the IP. The Software and the IP are licensed, not sold.
                </Typography>
                <Typography sx={{ fontSize: '16px', lineHeight: 1.7, mb: 2.5, color: 'text.secondary' }}>
                  <strong>2.2.</strong> You agree that Licensor and its affiliates may collect and use (including through any applications) technical information for the purpose of the Technology Platform support services related to the Software and the IP.
                </Typography>
              </Box>

              {/* Limitation on End User Rights */}
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
                  3. LIMITATION ON END USER RIGHTS
                </Typography>
                <Typography sx={{ fontSize: '16px', lineHeight: 1.7, mb: 2, color: 'text.secondary' }}>
                  <strong>3.1.</strong> You may not reverse engineer, decompile, disassemble, otherwise attempt to discover the source code or algorithms of the Software, adapt, modify or alter otherwise the IP or the Software and any part thereof, disable any features of the Software, create derivative works based on the Software or the IP, make back-up copies, register the Software, the IP or any part thereof or use the Software, the IP or any part thereof for commercial purposes, including without limitation deriving profit.
                </Typography>
                <Typography sx={{ fontSize: '16px', lineHeight: 1.7, mb: 2, color: 'text.secondary' }}>
                  <strong>3.2.</strong> You may not sell or provide licenses to or disseminate the Software or its parts in any other ways to any third person.
                </Typography>
                <Typography sx={{ fontSize: '16px', lineHeight: 1.7, mb: 2, color: 'text.secondary' }}>
                  <strong>3.3.</strong> You are not allowed to decompile, disassemble, or modify the IP or use any parts of it for copying, getting commercial gain or for incorporation into any other platforms but the Technology Platform.
                </Typography>
                <Typography sx={{ fontSize: '16px', lineHeight: 1.7, mb: 2.5, color: 'text.secondary', fontStyle: 'italic' }}>
                  Failure to comply with restrictions specified in this EULA may lead to civil, administrative or criminal liability under applicable law.
                </Typography>
              </Box>

              {/* Software Updates */}
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
                  4. SOFTWARE UPDATES
                </Typography>
                <Typography sx={{ fontSize: '16px', lineHeight: 1.7, mb: 2, color: 'text.secondary' }}>
                  <strong>4.1.</strong> Licensor may provide to You or make available to You updates, upgrades, supplements and add-on components (if any) of the Software, including bug fixes, service upgrades (partly or entire), products or devices, and updates, and enhancements to any Software previously installed (including entirely new versions), (collectively &ldquo;Update&rdquo;) after the date You obtain Your initial copy of the Software in order to improve such Software or ultimately enhance Your user experience with the Technology Platform. This EULA applies to all and any component of the Update that Licensor may provide to You or make available to You after You obtain Your initial copy of the Software, unless we provide other terms along with such Update.
                </Typography>
                <Typography sx={{ fontSize: '16px', lineHeight: 1.7, mb: 2.5, color: 'text.secondary' }}>
                  <strong>4.2.</strong> To use the Software provided through Update, You must first be licensed for the Software identified by Licensor as eligible for the Update. The updated Software version may add new functions and, in some limited cases, may delete existing functions.
                </Typography>
              </Box>

              {/* No Software Transfer */}
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
                  5. NO SOFTWARE TRANSFER
                </Typography>
                <Typography sx={{ fontSize: '16px', lineHeight: 1.7, mb: 2.5, color: 'text.secondary' }}>
                  <strong>5.1.</strong> You may not transfer or assign this EULA or the rights to the Software and the IP granted herein to any third party.
                </Typography>
              </Box>

              {/* Term */}
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
                  6. TERM
                </Typography>
                <Typography sx={{ fontSize: '16px', lineHeight: 1.7, mb: 2, color: 'text.secondary' }}>
                  <strong>6.1.</strong> This EULA is effective for the period the Technology Platform, the IP and the Software are being used by You.
                </Typography>
                <Typography sx={{ fontSize: '16px', lineHeight: 1.7, mb: 2, color: 'text.secondary' }}>
                  <strong>6.2.</strong> This EULA terminates in case:
                </Typography>
                <Box component="ul" sx={{ pl: 5, '& li': { mb: 1.5, color: 'text.secondary', fontSize: '16px', lineHeight: 1.7 } }}>
                  <li><strong>6.2 (a)</strong> You breach the EULA; or</li>
                  <li><strong>6.2 (b)</strong> You decide to terminate Your use of the Technology Platform, or</li>
                  <li><strong>6.2 (c)</strong> the Technology Platform ceases to exist.</li>
                </Box>
              </Box>

              {/* Disclaimer of Warranty */}
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
                  7. DISCLAIMER OF WARRANTY
                </Typography>
                <Typography sx={{ fontSize: '16px', lineHeight: 1.7, mb: 2, color: 'text.secondary' }}>
                  <strong>7.1.</strong> UNLESS SEPARATELY STATED ALL SOFTWARE AND/OR IP PROVIDED BY LICENSOR WITH THE TECHNOLOGY PLATFORM (WHETHER INCLUDED WITH THE TECHNOLOGY PLATFORM, DOWNLOADED, OR OTHERWISE OBTAINED) IS PROVIDED &ldquo;AS IS&rdquo; AND ON AN &ldquo;AS AVAILABLE&rdquo; BASIS, WITHOUT WARRANTIES OF ANY KIND FROM LICENSOR, EITHER EXPRESS OR IMPLIED. TO THE FULLEST POSSIBLE EXTENT PURSUANT TO APPLICABLE LAW, LICENSOR DISCLAIMS ALL WARRANTIES EXPRESS, IMPLIED, OR STATUTORY, INCLUDING, BUT NOT LIMITED TO, IMPLIED WARRANTIES OF MERCHANTABILITY, SATISFACTORY QUALITY OR WORKMANSHIP LIKE EFFORT, FITNESS FOR A PARTICULAR PURPOSE, RELIABILITY OR AVAILABILITY, ACCURACY, LACK OF VIRUSES, QUIET ENJOYMENT, NON INFRINGEMENT OF THIRD PARTY RIGHTS OR OTHER VIOLATIONS OF RIGHTS. SOME JURISDICTIONS DO NOT ALLOW EXCLUSIONS OR LIMITATIONS OF IMPLIED WARRANTIES, SO SOME OF THE ABOVE EXCLUSIONS OR LIMITATIONS MAY NOT APPLY TO YOU. NO ADVICE OR INFORMATION, WHETHER ORAL OR WRITTEN, OBTAINED BY YOU FROM LICENSOR OR ITS AFFILIATES SHALL BE DEEMED TO ALTER THIS DISCLAIMER BY LICENSOR OF WARRANTY REGARDING THE SOFTWARE AND/OR IP OR EULA, OR TO CREATE ANY WARRANTY OF ANY SORT FROM LICENSOR.
                </Typography>
                <Typography sx={{ fontSize: '16px', lineHeight: 1.7, mb: 2.5, color: 'text.secondary' }}>
                  <strong>7.2.</strong> LICENSOR DISCLAIMS ANY RESPONSIBILITY FOR ANY DISCLOSURE OF INFORMATION OR ANY OTHER PRACTICES OF ANY THIRD-PARTY APPLICATION PROVIDER. LICENSOR EXPRESSLY DISCLAIMS ANY WARRANTY REGARDING WHETHER YOUR PERSONAL INFORMATION IS CAPTURED BY ANY THIRD-PARTY APPLICATION PROVIDER OR THE USE TO WHICH SUCH PERSONAL INFORMATION MAY BE PUT BY SUCH THIRD-PARTY APPLICATION PROVIDER.
                </Typography>
              </Box>

              {/* Limitation of Liability */}
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
                  8. LIMITATION OF LIABILITY
                </Typography>
                <Typography sx={{ fontSize: '16px', lineHeight: 1.7, mb: 2.5, color: 'text.secondary' }}>
                  <strong>8.1.</strong> LICENSOR WILL NOT BE LIABLE FOR ANY DAMAGES OF ANY KIND ARISING OUT OF OR RELATING TO THE USE OR THE INABILITY TO USE THE SOFTWARE AND/OR IP OR COMBINE THE SOFTWARE WITH ANY THIRD PARTY APPLICATION, ITS CONTENT OR FUNCTIONALITY, INCLUDING BUT NOT LIMITED TO DAMAGES CAUSED BY OR RELATED TO ERRORS, OMISSIONS, INTERRUPTIONS, DEFECTS, DELAY IN OPERATION OR TRANSMISSION, COMPUTER VIRUS, FAILURE TO CONNECT, NETWORK CHARGES, IN-APP PURCHASES, AND ALL OTHER DIRECT, INDIRECT, SPECIAL, INCIDENTAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES EVEN IF LICENSOR HAS BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES. SOME JURISDICTIONS DO NOT ALLOW THE EXCLUSION OR LIMITATION OF INCIDENTAL OR CONSEQUENTIAL DAMAGES, SO SOME OF THE ABOVE EXCLUSIONS OR LIMITATIONS MAY NOT APPLY TO YOU. NOTWITHSTANDING THE FOREGOING, LICENSOR TOTAL LIABILITY TO YOU FOR ALL LOSSES, DAMAGES, CAUSES OF ACTION, INCLUDING BUT NOT LIMITED TO THOSE BASED ON CONTRACT, TORT, OR OTHERWISE, ARISING OUT OF YOUR USE OF THE SOFTWARE AND/OR IP ON THIS TECHNOLOGY PLATFORM, OR ANY OTHER PROVISION OF THIS EULA, SHALL NOT EXCEED THE AMOUNT OF 100 USD. THE FOREGOING LIMITATIONS, EXCLUSIONS, AND DISCLAIMERS SHALL APPLY TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, EVEN IF ANY REMEDY FAILS ITS ESSENTIAL PURPOSE.
                </Typography>
              </Box>

              {/* Applicable Law; Arbitration */}
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
                  9. APPLICABLE LAW; ARBITRATION
                </Typography>
                <Typography sx={{ fontSize: '16px', lineHeight: 1.7, mb: 2, color: 'text.secondary' }}>
                  <strong>9.1.</strong> Licensee and us agree to arbitrate any dispute arising from these Terms or your use of the Services, except for disputes in which either party seeks equitable and other relief for the alleged unlawful use of copyrights, trademarks, trade names, logos, trade secrets or patents. ARBITRATION PREVENTS YOU FROM SUING IN COURT OR FROM HAVING A JURY TRIAL.
                </Typography>
                <Typography sx={{ fontSize: '16px', lineHeight: 1.7, mb: 2, color: 'text.secondary' }}>
                  <strong>9.2.</strong> Licensee and us agree to notify each other in writing of any dispute within thirty (30) days of when it arises.
                </Typography>
                <Typography sx={{ fontSize: '16px', lineHeight: 1.7, mb: 2, color: 'text.secondary' }}>
                  <strong>9.3.</strong> Other than class procedures and remedies discussed below, the arbitrator has the authority to grant any remedy that would otherwise be available in court. Any dispute between the parties will be governed by these Terms, without giving effect to any conflict of laws principles that may provide for the application of the law of another jurisdiction.
                </Typography>
                <Typography sx={{ fontSize: '16px', lineHeight: 1.7, mb: 2.5, color: 'text.secondary' }}>
                  <strong>9.4.</strong> Whether the dispute is heard in arbitration or in court, you will not commence against us a class action, class arbitration or representative action or proceeding.
                </Typography>
              </Box>

              {/* Entire Agreement; Severability */}
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
                  10. ENTIRE AGREEMENT; SEVERABILITY
                </Typography>
                <Typography sx={{ fontSize: '16px', lineHeight: 1.7, mb: 2.5, color: 'text.secondary' }}>
                  <strong>10.1.</strong> This EULA is the entire agreement between You and Licensor relating to the Software and the IP and supersedes all prior or contemporaneous oral or written communications, proposals and representations with respect to the Software and the IP or any other subject matter covered by this EULA. If any provision of this EULA is held to be void, invalid, unenforceable or illegal, the other provisions shall continue in full force and effect.
                </Typography>
              </Box>

              {/* Injunctive Relief */}
              <Box id="section11" component="section" sx={{ mb: 0 }}>
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
                  11. INJUNCTIVE RELIEF
                </Typography>
                <Typography sx={{ fontSize: '16px', lineHeight: 1.7, mb: 0, color: 'text.secondary' }}>
                  <strong>11.1.</strong> The Licensee acknowledges and agrees that the breach by it of any obligations hereunder may cause serious and irreparable harm to Licensor, which probably could not adequately be compensated for in damages. Licensee therefore consents to an order of specific performance or an order of injunctive relief being issued against Licensee restraining it from any further breach of such provisions and agrees that Licensor may issue such injunction against it without the necessity of an undertaking as to damages. The provisions of this section shall not derogate from any other remedy, which Licensor may have in the event of such a breach.
                </Typography>
                <Box sx={{mb:35}}>

                </Box>
              </Box>
            </Box>
          </Container>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default EULAClient;